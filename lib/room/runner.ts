// The home page's room: a seat at the low table, the view turned by drag and
// eased toward whichever item the reader is looking at, framed so the room's
// subject sits in the space the column leaves uncovered. Loaded with a
// dynamic import after the page is interactive, so none of three.js is in
// the page's first load. Everything it adds to the page (a canvas, listeners,
// observers, a timer, GPU memory) is removed by dispose().
import * as THREE from "three";
import { buildRoom, phaseAt, type Room, type RoomKey, type TimeName } from "./scene";
import { createMeter, createStage, deviceTier, type Stage, type Tier } from "./stage";

export type { RoomKey, TimeName };

/** Below the desktop breakpoint the column starts this far down the screen; keep in step with .room-col in app/globals.css. */
const PHONE_COLUMN_TOP = 0.46;
const WIDE = "(min-width: 900px)";
const PHONE_HFOV = 66;
const LABEL_LEFT = new Set<RoomKey>(["essay"]);

export type RoomOptions = {
  host: HTMLElement;
  /** Measured on desktop: the view is offset so the room's subject sits beside it. */
  column: HTMLElement;
  /** The part of the page the room shows through (on phones, the strip above the column); off screen, the room stops. */
  strip: HTMLElement;
  spots: Map<RoomKey, HTMLElement>;
  pin: HTMLElement;
  /** Only with ?debug=1. */
  meter: HTMLElement | null;
  still: boolean;
  signal: AbortSignal;
  onFirstFrame(): void;
  onTime(name: TimeName): void;
  onLost(): void;
};

export type RoomHandle = {
  setActive(key: RoomKey | null): void;
  setStill(still: boolean): void;
  /** A panel is open. On phones it is a sheet over the room, which then stops. */
  setPanel(open: boolean): void;
  /** A hotspot was chosen. The board drops a bead; returns how long to wait before opening the panel, so the bead lands first. */
  pick(key: RoomKey): number;
  dispose(): void;
};

type Debug = { renderer: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.PerspectiveCamera; tier: Tier; stage: Stage; room: Room };
declare global {
  interface Window {
    __room?: Debug;
    __roomDisposals?: number;
  }
}

// ?time=day|dusk|night or ?hour=18.5 pin the light; otherwise it follows the
// visitor's clock.
function chosenPhase(params: URLSearchParams): () => number {
  const named = ({ day: 0, dusk: 1, night: 2 } as Record<string, number>)[params.get("time") ?? ""];
  if (named !== undefined) return () => named;
  const hour = Number(params.get("hour"));
  if (params.has("hour") && hour >= 0 && hour < 24) {
    const at = new Date(2026, 0, 1, Math.floor(hour), Math.round((hour % 1) * 60));
    return () => phaseAt(at);
  }
  return () => phaseAt(new Date());
}

export async function startRoom(o: RoomOptions): Promise<RoomHandle | null> {
  const params = new URLSearchParams(location.search);
  const debug = params.get("debug") === "1";
  const tier = deviceTier(params);
  // Every listener hangs off this signal; teardown aborts it. The caller's
  // signal cancels a start that is still loading.
  const local = new AbortController();
  o.signal.addEventListener("abort", () => local.abort(), { once: true });
  const { signal } = local;
  let still = tier.reduced || o.still;

  // A fresh canvas per mount: a canvas whose context was released hands back
  // the same dead context forever, so it is never reused.
  const canvas = document.createElement("canvas");
  canvas.className = "room-canvas";
  canvas.setAttribute("aria-hidden", "true");
  o.host.append(canvas);

  let stage: Stage | null = null;
  let room: Room | null = null;
  let timer = 0;
  const teardown = () => {
    local.abort();
    clearInterval(timer);
    room?.dispose();
    stage?.dispose();
    canvas.remove();
    room = null;
    stage = null;
  };

  try {
    stage = createStage(canvas, tier, { signal, onContextLost: o.onLost, watch: o.strip });
    stage.setStill(still);
    if (debug && o.meter) stage.meter = createMeter(o.meter, stage.renderer, tier);
    const phaseNow = chosenPhase(params);
    performance.mark("room:build:start");
    room = await buildRoom(stage.renderer, { phase: phaseNow(), low: tier.low, texBase: "/room/tex/" });
    performance.measure("room:build", "room:build:start");
    if (o.signal.aborted) {
      teardown();
      return null;
    }
  } catch (err) {
    teardown();
    throw err;
  }
  const s = stage;
  const r = room;
  const phaseNow = chosenPhase(params);
  r.setPhase(phaseNow());
  o.onTime(r.timeName);
  timer = window.setInterval(() => {
    r.setPhase(phaseNow());
    o.onTime(r.timeName);
    s.request();
  }, 60_000);

  // B, the study: a seat at the table; drag to look around. Choosing an item
  // turns the view to its object, slowly.
  const camera = new THREE.PerspectiveCamera(56, 1, 0.05, 80);
  const seat = new THREE.Vector3(0, 1.02, 1.28);
  camera.position.copy(seat);
  const view = { yaw: 0, pitch: -0.24 };
  const want = { ...view };
  const clampYaw = (y: number) => Math.max(-1.5, Math.min(1.5, y));
  const clampPitch = (p: number) => Math.max(-0.75, Math.min(0.25, p));
  const dir = new THREE.Vector3();
  const look = new THREE.Vector3();
  let drag: { x: number; y: number; yaw: number; pitch: number } | null = null;

  // The column covers the left of the screen on desktop and the bottom on
  // phones; the view is offset so the subject sits in what stays uncovered,
  // while the room itself still fills the page.
  const wide = matchMedia(WIDE);
  let w = 1;
  let h = 1;
  let side = 0;
  let below = 0;
  const frame = () => {
    side = wide.matches ? Math.round(o.column.getBoundingClientRect().right) : 0;
    below = wide.matches ? 0 : Math.round(h * (1 - PHONE_COLUMN_TOP));
    // Desktop: 56 degrees tall. Phones: the strip above the column gets a
    // 66-degree-wide view of its own. That strip is the middle of a frame
    // taller than the screen, so the frame's field of view is set from it.
    camera.fov = wide.matches ? 56 : 2 * THREE.MathUtils.radToDeg(Math.atan((Math.tan(THREE.MathUtils.degToRad(PHONE_HFOV / 2)) * (h + below)) / w));
    camera.aspect = (w + side) / (h + below);
    camera.setViewOffset(w + side, h + below, 0, below, w, h);
    camera.updateProjectionMatrix();
  };
  s.onResize = (W, H) => {
    w = W;
    h = H;
    frame();
  };
  let panelOpen = false;
  const cover = () => s.setCovered(panelOpen && !wide.matches);
  wide.addEventListener(
    "change",
    () => {
      cover();
      s.resize();
    },
    { signal },
  );

  const v = new THREE.Vector3();
  const project = (p: THREE.Vector3) => {
    v.copy(p).project(camera);
    const x = ((v.x + 1) / 2) * w;
    const y = ((1 - v.y) / 2) * h;
    return { x, y, on: v.z < 1 && x > side + 8 && x < w - 8 && y > 8 && y < h - below - 8 };
  };

  // Hotspots and the label follow their objects every frame; a style is
  // written only when it changes, so a still view costs no style work.
  const last = new Map<HTMLElement, string>();
  const put = (el: HTMLElement, p: { x: number; y: number; on: boolean }) => {
    const key = p.on ? `${p.x.toFixed(1)},${p.y.toFixed(1)}` : "off";
    if (last.get(el) === key) return false;
    last.set(el, key);
    if (p.on) {
      el.dataset.on = "";
      el.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px)`;
    } else delete el.dataset.on;
    return true;
  };
  let active: RoomKey | null = null;
  const place = () => {
    for (const [key, el] of o.spots) put(el, project(r.anchors[key]));
    const p = active ? project(r.anchors[active]) : { x: 0, y: 0, on: false };
    if (put(o.pin, p) && p.on) {
      // The label sits on the side away from its neighbours (the essay's is
      // left of the paper, clear of the board), and flips near either edge.
      const left = LABEL_LEFT.has(active!) ? p.x - 240 > side : p.x > w - 240;
      if (left) o.pin.dataset.flip = "";
      else delete o.pin.dataset.flip;
    }
  };

  // The bath answers the pointer: the wave equation takes a drop wherever a
  // mouse crosses the water, and a bigger one where you tap it.
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const hitWater = (e: PointerEvent) => {
    ndc.set((e.clientX / w) * 2 - 1, -(e.clientY / h) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    return ray.intersectObject(r.water, false)[0];
  };
  let lastRipple = 0;
  let down: { x: number; y: number } | null = null;
  canvas.addEventListener(
    "pointerdown",
    (e) => {
      down = { x: e.clientX, y: e.clientY };
      drag = { x: e.clientX, y: e.clientY, yaw: want.yaw, pitch: want.pitch };
      s.boost(2500);
      canvas.setPointerCapture(e.pointerId);
    },
    { signal },
  );
  canvas.addEventListener(
    "pointermove",
    (e) => {
      if (drag) {
        const k = 2.2 / Math.max(innerWidth, 600);
        want.yaw = clampYaw(drag.yaw + (e.clientX - drag.x) * k);
        want.pitch = clampPitch(drag.pitch + (e.clientY - drag.y) * k);
        s.boost(2500);
        s.request();
        return;
      }
      if (still || e.pointerType !== "mouse") return;
      const now = performance.now();
      if (now - lastRipple < 60) return;
      const hit = hitWater(e);
      if (hit?.uv) {
        r.rippleAt(hit.uv, 0.012);
        lastRipple = now;
        s.boost(1500);
      }
    },
    { signal },
  );
  const release = (e: PointerEvent) => {
    if (e.type === "pointerup" && down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 8) {
      const hit = hitWater(e);
      if (hit?.uv) r.rippleAt(hit.uv, 0.06);
      s.request();
    }
    down = null;
    drag = null;
  };
  canvas.addEventListener("pointerup", release, { signal });
  // A touch that becomes a page scroll is cancelled; drop the drag with it.
  canvas.addEventListener("pointercancel", release, { signal });

  let first = true;
  s.onFrame = (t, dt) => {
    const k = still || !dt ? 1 : 1 - Math.exp(-dt * 2.5);
    view.yaw += (want.yaw - view.yaw) * k;
    view.pitch += (want.pitch - view.pitch) * k;
    dir.set(-Math.sin(view.yaw) * Math.cos(view.pitch), Math.sin(view.pitch), -Math.cos(view.yaw) * Math.cos(view.pitch));
    camera.lookAt(look.copy(seat).add(dir));
    r.update(t, camera, dt);
    s.renderer.render(r.scene, camera);
    place();
    if (first) {
      first = false;
      o.onFirstFrame();
    }
  };

  // Size the view, then compile every shader off the main thread where the
  // browser can (KHR_parallel_shader_compile), so the first frame never
  // stalls the page.
  s.onResize(canvas.clientWidth || innerWidth, canvas.clientHeight || innerHeight);
  performance.mark("room:compile:start");
  if (s.renderer.extensions.has("KHR_parallel_shader_compile")) await s.renderer.compileAsync(r.scene, camera);
  else s.renderer.compile(r.scene, camera);
  performance.measure("room:compile", "room:compile:start");
  // Let the page breathe between compiling and the first frame.
  await new Promise((done) => setTimeout(done, 0));
  if (o.signal.aborted) {
    teardown();
    return null;
  }
  performance.mark("room:frame:start");
  s.resize();
  performance.measure("room:first-frame", "room:frame:start");
  s.start();

  if (debug) window.__room = { renderer: s.renderer, scene: r.scene, camera, tier, stage: s, room: r };

  let disposed = false;
  return {
    setActive(key) {
      active = key;
      r.highlight(key);
      if (key && !drag) {
        const d = r.anchors[key].clone().sub(seat);
        want.yaw = clampYaw(Math.atan2(-d.x, -d.z));
        want.pitch = clampPitch(Math.atan2(d.y, Math.hypot(d.x, d.z)) * 0.9);
      }
      place();
      // The view eases toward a chosen object; clearing the choice moves nothing.
      if (key) s.boost(2500);
      s.request();
    },
    setStill(next) {
      still = tier.reduced || next;
      s.setStill(still);
    },
    setPanel(open) {
      panelOpen = open;
      cover();
    },
    pick(key) {
      if (key !== "board") return 0;
      const now = performance.now() / 1000;
      // Still: the bead is drawn where it lands.
      r.dropBead(still ? now - 10 : now);
      s.boost(2500);
      s.request();
      return still ? 0 : 650;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      teardown();
      if (debug) {
        delete window.__room;
        window.__roomDisposals = (window.__roomDisposals ?? 0) + 1;
      }
    },
  };
}
