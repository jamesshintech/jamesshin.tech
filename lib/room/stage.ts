// The room's runtime: one renderer sized to its canvas, a device tier, a
// frame loop that runs only while the canvas is on screen, the tab is visible
// and motion is wanted, still frames on request otherwise, adaptive
// resolution, and context-loss handling. Device tiers, the pixel-ratio caps
// and the frame meter's thresholds follow MengTo/threeui (PreviewFpsMeter:
// 55 good, 45 watch, frames over 25 ms counted as slow).
import * as THREE from "three";

export type Tier = {
  low: boolean;
  dprCap: number;
  frameCap: number;
  reduced: boolean;
};

type NavigatorExtras = Navigator & { deviceMemory?: number };

/** Low tier: a touch-first device, four cores or fewer, or 4 GB or less. `?q=low|high` and `?dpr=` override, for testing. */
export function deviceTier(params: URLSearchParams): Tier {
  const nav = navigator as NavigatorExtras;
  const coarse = matchMedia("(hover: none)").matches;
  const cores = nav.hardwareConcurrency || 8;
  const memory = nav.deviceMemory || 8;
  const forced = params.get("q");
  const low = forced === "low" || (forced !== "high" && (coarse || cores <= 4 || memory <= 4));
  const dpr = Number(params.get("dpr"));
  return {
    low,
    dprCap: dpr > 0 && dpr <= 3 ? dpr : low ? 1.4 : 1.8,
    frameCap: low ? 30 : 60,
    reduced: matchMedia("(prefers-reduced-motion: reduce)").matches || params.get("motion") === "off",
  };
}

export type Stage = {
  renderer: THREE.WebGLRenderer;
  /** Called every frame while running, and once per request while still. `dt` is 0 for a still frame. */
  onFrame: ((t: number, dt: number) => void) | null;
  onResize: ((w: number, h: number) => void) | null;
  meter: Meter | null;
  readonly running: boolean;
  /** Draw one frame soon, if the loop is not running. */
  request(): void;
  renderOnce(): void;
  /** Still: the loop stops and only requested frames are drawn (reduced motion, or the visitor paused motion). */
  setStill(still: boolean): void;
  start(): void;
  resize(): void;
  dispose(): void;
};

export function createStage(
  canvas: HTMLCanvasElement,
  tier: Tier,
  { signal, onContextLost }: { signal: AbortSignal; onContextLost: () => void },
): Stage {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !tier.low || devicePixelRatio < 2, powerPreference: "default" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, tier.dprCap));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  let started = false;
  let running = false;
  let still = tier.reduced;
  let visible = true;
  let lost = false;
  let disposed = false;
  let raf = 0;
  let pending = 0;
  let lastFrame = 0;

  const stage: Stage = {
    renderer,
    onFrame: null,
    onResize: null,
    meter: null,
    get running() {
      return running;
    },
    request,
    renderOnce,
    setStill(next) {
      still = next;
      sync();
      if (!running) request();
    },
    // Nothing runs until the room exists: frames spent waiting on textures
    // would read as a slow GPU and step the resolution down for nothing.
    start() {
      started = true;
      sync();
    },
    resize,
    dispose,
  };

  function renderOnce() {
    if (lost || disposed) return;
    stage.onFrame?.(performance.now() / 1000, 0);
  }
  // Input while the loop is stopped draws one frame.
  function request() {
    if (running || pending || disposed) return;
    pending = requestAnimationFrame(() => {
      pending = 0;
      renderOnce();
    });
  }

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h || disposed) return;
    renderer.setSize(w, h, false);
    stage.onResize?.(w, h);
    if (!running) renderOnce();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  // Adaptive resolution: when frames run more than a third over budget for
  // about a second and a half, step the pixel ratio down, so a slow GPU gets
  // a softer image, never a hot laptop.
  const budget = 1000 / tier.frameCap;
  const minDelta = budget - 2;
  const steps = [tier.dprCap, 1.4, 1.15, 1].filter((d, i, a) => i === 0 || d < a[0]);
  let level = 0;
  let ema = budget;
  let settled = 0;
  const tick = (now: number) => {
    raf = requestAnimationFrame(tick);
    if (now - lastFrame < minDelta) return;
    const gap = lastFrame ? now - lastFrame : budget;
    const dt = Math.min(0.05, gap / 1000);
    lastFrame = now;
    stage.onFrame?.(now / 1000, dt);
    stage.meter?.sample(now);
    ema = ema * 0.95 + gap * 0.05;
    if (++settled > 90 && ema > budget * 1.35 && level < steps.length - 1) {
      level++;
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, steps[level]));
      resize();
      settled = 0;
      ema = budget;
    }
  };

  function sync() {
    const want = started && visible && !document.hidden && !still && !lost && !disposed;
    if (want && !running) {
      running = true;
      lastFrame = 0;
      settled = 0;
      stage.meter?.reset();
      raf = requestAnimationFrame(tick);
    } else if (!want && running) {
      running = false;
      cancelAnimationFrame(raf);
      stage.meter?.idle(document.hidden ? "tab hidden" : !visible ? "off screen" : "still");
    }
  }
  const io = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? true;
    sync();
  });
  io.observe(canvas);
  document.addEventListener("visibilitychange", sync, { signal });

  canvas.addEventListener(
    "webglcontextlost",
    (e) => {
      e.preventDefault();
      lost = true;
      sync();
      onContextLost();
    },
    { signal },
  );

  function dispose() {
    if (disposed) return;
    disposed = true;
    running = false;
    cancelAnimationFrame(raf);
    cancelAnimationFrame(pending);
    ro.disconnect();
    io.disconnect();
    stage.onFrame = null;
    stage.onResize = null;
    renderer.dispose();
    // Hand the context back now rather than at garbage collection; browsers
    // cap live WebGL contexts at about sixteen.
    renderer.forceContextLoss();
  }

  return stage;
}

export type Meter = {
  reset(): void;
  sample(now: number): void;
  idle(reason: string): void;
};

// Frame rate, frames over budget, draw calls, triangles and the tier, shown
// only with ?debug=1, so "it does not strain the browser" can be read.
export function createMeter(el: HTMLElement, renderer: THREE.WebGLRenderer, tier: Tier): Meter {
  let start = 0;
  let prev = 0;
  let frames = 0;
  let slow = 0;
  const write = (fps: string, rating: string) => {
    const info = renderer.info.render;
    el.dataset.rating = rating;
    el.textContent = `${fps} · ${info.calls} draws · ${(info.triangles / 1000).toFixed(1)}k tris · ${tier.low ? "low" : "high"} tier · dpr ${renderer.getPixelRatio().toFixed(2)}`;
  };
  const meter: Meter = {
    reset() {
      start = prev = frames = slow = 0;
    },
    sample(now) {
      if (!start) {
        start = prev = now;
        return;
      }
      const d = now - prev;
      prev = now;
      frames++;
      if (d > (tier.frameCap === 60 ? 25 : 45)) slow++;
      if (now - start >= 1000) {
        const fps = Math.round((frames * 1000) / (now - start));
        const target = tier.frameCap;
        write(`${fps} fps, ${slow} slow`, fps >= target - 5 ? "good" : fps >= target - 15 ? "watch" : "slow");
        meter.reset();
      }
    },
    idle(reason) {
      write(`paused (${reason})`, "idle");
    },
  };
  meter.idle(tier.reduced ? "reduced motion" : "loading");
  return meter;
}
