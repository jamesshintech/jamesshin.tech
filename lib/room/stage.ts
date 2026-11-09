// The room's runtime: one renderer sized to its canvas, a device tier, and a
// frame loop whose state is written down rather than spread across flags.
//
//   life:  active ──(context lost)──▶ lost        (final)
//            └────────(dispose)────▶ disposed     (final; from any state)
//   holds: while active, the loop runs only when nothing holds it:
//          not-started  the room is still being built
//          tab-hidden   the tab is in the background
//          off-screen   the part of the page the room shows through is scrolled away
//          covered      something opaque is over it (a phone's full-screen panel)
//          still        reduced motion, or the visitor paused motion
//   While held, input still draws single frames on request.
//
// At rest it draws 30 frames a second; the tier's full rate only just after
// the visitor does something. Resolution is its own small machine (see
// `quality`). Device tiers, pixel-ratio caps and the meter's thresholds
// follow MengTo/threeui (PreviewFpsMeter: 55 good, 45 watch).
import * as THREE from "three";

export type Tier = {
  low: boolean;
  dprCap: number;
  frameCap: number;
};

type NavigatorExtras = Navigator & { deviceMemory?: number };

/**
 * Phones (touch-first): the low tier's 30 frames a second and lighter scene,
 * but up to 2x resolution with antialiasing: a 3x screen shown a 1.4x image
 * with no antialiasing looked pixelated. Other devices with four cores or
 * fewer, or 4 GB or less: low tier at 1.4x. Everything else: 60 frames a
 * second at up to 1.8x. Adaptive resolution steps any of these down when
 * frames run slow. `?q=low|high` and `?dpr=` override, for testing.
 */
export function deviceTier(params: URLSearchParams): Tier {
  const nav = navigator as NavigatorExtras;
  const phone = matchMedia("(hover: none) and (pointer: coarse)").matches;
  const cores = nav.hardwareConcurrency || 8;
  const memory = nav.deviceMemory || 8;
  const forced = params.get("q");
  const low = forced === "low" || (forced !== "high" && (phone || cores <= 4 || memory <= 4));
  const dpr = Number(params.get("dpr"));
  const cap = phone && forced !== "low" ? 2 : low ? 1.4 : 1.8;
  return {
    low,
    dprCap: dpr > 0 && dpr <= 3 ? dpr : cap,
    frameCap: low ? 30 : 60,
  };
}

/** The resting frame rate: steam, water and bamboo are slow, and half the frames is half the heat. */
const REST_FPS = 30;

/** Milliseconds a frame may take: the tier's full rate just after the visitor did something, 30 a second otherwise. */
export function frameBudget(now: number, activeUntil: number, frameCap: number): number {
  return 1000 / (now < activeUntil ? frameCap : Math.min(REST_FPS, frameCap));
}

/** A frame is slow when it took half as long again as its budget. */
export function isSlowFrame(gap: number, budget: number): boolean {
  return gap > budget * 1.5;
}

/**
 * Resolution steps: the tier's cap, then 1.6, 1.4, 1.15 and 1 below it.
 * warming: just started or resized; frames are not judged (shader warm-up,
 *          texture upload and a resize all make the first frames slow).
 * watching: frames are judged; when the average frame runs more than a third
 *          over its budget for about two seconds, step down and warm again.
 * It never steps back up: with the rate capped, a frame gap cannot show
 * spare capacity, only a shortfall, so going up would be a guess.
 */
export function qualitySteps(cap: number): number[] {
  return [cap, ...[1.6, 1.4, 1.15, 1].filter((d) => d < cap - 0.01)];
}

export type Hold = "not-started" | "tab-hidden" | "off-screen" | "covered" | "still";
export type Life = "active" | "lost" | "disposed";
export type StageState = { life: Life; holds: Hold[]; running: boolean; dpr: number; quality: "warming" | "watching" };

export type Stage = {
  renderer: THREE.WebGLRenderer;
  /** Called every frame while running, and once per request while held. `dt` is 0 for a single frame. */
  onFrame: ((t: number, dt: number) => void) | null;
  onResize: ((w: number, h: number) => void) | null;
  meter: Meter | null;
  readonly state: StageState;
  readonly running: boolean;
  /** Frames the loop has drawn (not requested single frames). */
  readonly frames: number;
  /** Draw one frame soon, if the loop is not running. */
  request(): void;
  renderOnce(): void;
  setStill(still: boolean): void;
  setCovered(covered: boolean): void;
  /** Run at the tier's full frame rate for a while: the visitor is doing something. */
  boost(ms: number): void;
  start(): void;
  resize(): void;
  dispose(): void;
};

export function createStage(
  canvas: HTMLCanvasElement,
  tier: Tier,
  {
    signal,
    still,
    onContextLost,
    watch = canvas,
  }: {
    signal: AbortSignal;
    still: boolean;
    onContextLost: () => void;
    /** The part of the page through which the room is seen; the loop stops when it scrolls away. */
    watch?: Element;
  },
): Stage {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "default" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, tier.dprCap));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  let life: Life = "active";
  const holds = new Set<Hold>(["not-started"]);
  if (still) holds.add("still");
  if (document.hidden) holds.add("tab-hidden");
  let running = false;
  let raf = 0;
  let pending = 0;
  let lastFrame = 0;
  let activeUntil = 0;
  let frames = 0;

  // Resolution.
  const steps = qualitySteps(tier.dprCap);
  let level = 0;
  let over = 1; // moving average of frame gap / budget
  let warmUntil = 0;
  let judged = 0;
  const warm = (now = performance.now()) => {
    warmUntil = now + 2000;
    over = 1;
    judged = 0;
  };

  const stage: Stage = {
    renderer,
    onFrame: null,
    onResize: null,
    meter: null,
    get state() {
      const quality: StageState["quality"] = performance.now() < warmUntil ? "warming" : "watching";
      return { life, holds: [...holds], running, dpr: renderer.getPixelRatio(), quality };
    },
    get running() {
      return running;
    },
    get frames() {
      return frames;
    },
    request,
    renderOnce,
    setStill: (on) => hold("still", on),
    setCovered: (on) => hold("covered", on),
    boost(ms) {
      activeUntil = Math.max(activeUntil, performance.now() + ms);
    },
    start: () => hold("not-started", false),
    resize,
    dispose,
  };

  function renderOnce() {
    if (life !== "active") return;
    stage.onFrame?.(performance.now() / 1000, 0);
  }
  function request() {
    if (running || pending || life !== "active") return;
    pending = requestAnimationFrame(() => {
      pending = 0;
      renderOnce();
    });
  }

  function hold(reason: Hold, on: boolean) {
    if (on === holds.has(reason)) return;
    if (on) holds.add(reason);
    else holds.delete(reason);
    sync();
    // Released but still held for another reason: show the current state once.
    if (!on && !running) request();
  }

  function sync() {
    const want = life === "active" && holds.size === 0;
    if (want && !running) {
      running = true;
      lastFrame = 0;
      warm();
      stage.meter?.reset();
      raf = requestAnimationFrame(tick);
    } else if (!want && running) {
      running = false;
      cancelAnimationFrame(raf);
      stage.meter?.idle([...holds]);
    }
  }

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h || life !== "active") return;
    renderer.setSize(w, h, false);
    stage.onResize?.(w, h);
    warm();
    if (!running) renderOnce();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  function tick(now: number) {
    raf = requestAnimationFrame(tick);
    const budget = frameBudget(now, activeUntil, tier.frameCap);
    if (now - lastFrame < budget - 2) return;
    const gap = lastFrame ? now - lastFrame : budget;
    // Real elapsed time (up to a quarter second), so eases such as the
    // camera's turn take the same wall time on a slow device as a fast one;
    // the ripples keep their own fixed 60 Hz step.
    const dt = Math.min(0.25, gap / 1000);
    lastFrame = now;
    frames++;
    stage.onFrame?.(now / 1000, dt);
    stage.meter?.sample(now, budget);
    if (now < warmUntil) return;
    over = over * 0.95 + Math.min(4, gap / budget) * 0.05;
    if (++judged > 60 && over > 1.35 && level < steps.length - 1) {
      level++;
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, steps[level]));
      resize();
    }
  }

  // The canvas is fixed and always "on screen"; what matters is whether the
  // part of the page the room shows through is. Under a tenth of it: held.
  const io = new IntersectionObserver(([entry]) => hold("off-screen", (entry?.intersectionRatio ?? 1) < 0.1), { threshold: [0, 0.1, 0.25] });
  io.observe(watch);
  document.addEventListener("visibilitychange", () => hold("tab-hidden", document.hidden), { signal });

  canvas.addEventListener(
    "webglcontextlost",
    (e) => {
      e.preventDefault();
      if (life !== "active") return;
      life = "lost";
      sync();
      onContextLost();
    },
    { signal },
  );

  function dispose() {
    if (life === "disposed") return;
    life = "disposed";
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
  sample(now: number, budget: number): void;
  idle(holds: Hold[]): void;
};

// Frame rate against the rate it is aiming for, frames over budget, draw
// calls, triangles, tier and resolution, shown only with ?debug=1; when the
// loop is held, why.
export function createMeter(el: HTMLElement, renderer: THREE.WebGLRenderer, tier: Tier): Meter {
  let start = 0;
  let prev = 0;
  let frames = 0;
  let slow = 0;
  let aim = REST_FPS;
  const write = (head: string, rating: string) => {
    const info = renderer.info.render;
    el.dataset.rating = rating;
    el.textContent = `${head} · ${info.calls} draws · ${(info.triangles / 1000).toFixed(1)}k tris · ${tier.low ? "low" : "high"} tier · dpr ${renderer.getPixelRatio().toFixed(2)}`;
  };
  const meter: Meter = {
    reset() {
      start = prev = frames = slow = 0;
    },
    sample(now, budget) {
      aim = Math.round(1000 / budget);
      if (!start) {
        start = prev = now;
        return;
      }
      if (isSlowFrame(now - prev, budget)) slow++;
      prev = now;
      frames++;
      if (now - start >= 1000) {
        const fps = Math.round((frames * 1000) / (now - start));
        write(`${fps}/${aim} fps, ${slow} slow`, fps >= aim - 5 ? "good" : fps >= aim - 15 ? "watch" : "slow");
        meter.reset();
      }
    },
    idle(holds) {
      write(`held: ${holds.join(", ") || "none"}`, "idle");
    },
  };
  meter.idle(["not-started"]);
  return meter;
}
