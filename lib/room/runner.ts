// The home page's room: a seat at the low table, the view turned by drag and
// eased toward whichever item the reader chose, framed so the room's subject
// sits in the space the column leaves uncovered. Loaded with a dynamic
// import after the page is interactive, so none of three.js is in the page's
// first load. Everything it adds to the page (a canvas, listeners, observers,
// a timer, GPU memory) is removed by dispose().
//
//   building ─▶ compiling ─▶ live ─▶ disposed
//   Any failure, an abort from the page, or a lost GPU context goes straight
//   to disposed, releasing everything; there is one way out.
import * as THREE from "three";
import { buildRoom, type Room } from "./scene";
import { createMeter, createStage, deviceTier, type Stage, type StageState, type Tier } from "./stage";
import { WIDE_QUERY, chosenPhase, type RoomKey, type TimeName } from "./state";

export type { RoomKey, TimeName };

const PHONE_HFOV = 66;
const LABEL_LEFT = new Set<RoomKey>(["essay"]);
/** Movement, in CSS pixels, before a press becomes a drag; less is a tap. */
const DRAG_SLOP = 4;

export type RoomOptions = {
  host: HTMLElement;
  /** Measured: the view is offset so the room's subject sits beside it (desktop) or above it (phones). */
  column: HTMLElement;
  /** The part of the page the room shows through; off screen, the room stops drawing. */
  strip: HTMLElement;
  spots: Map<RoomKey, HTMLElement>;
  pin: HTMLElement;
  /** Only with ?debug=1. */
  meter: HTMLElement | null;
  /** Reduced motion, or motion paused by the visitor. The page owns this. */
  still: boolean;
  signal: AbortSignal;
  onFirstFrame(): void;
  onLost(): void;
};

export type Active = { key: RoomKey; turn: boolean } | null;

export type RoomHandle = {
  /** The item lit in the room; `turn` eases the view to it (a row was chosen), otherwise it is already in view. */
  setActive(active: Active): void;
  setStill(still: boolean): void;
  /** A panel is open. On phones it covers the room, which then stops. */
  setPanel(open: boolean): void;
  /** A hotspot was chosen. The board drops a bead; returns how long to wait before opening the panel, so the bead lands first. */
  pick(key: RoomKey): number;
  dispose(): void;
};

type Phase = "building" | "compiling" | "live" | "disposed";
type Debug = { renderer: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.PerspectiveCamera; tier: Tier; stage: Stage; room: Room; phase: () => Phase; state: () => StageState };
declare global {
  interface Window {
    __room?: Debug;
    __roomDisposals?: number;
  }
}

class Gone extends Error {}

export async function startRoom(o: RoomOptions): Promise<RoomHandle | null> {
  const params = new URLSearchParams(location.search);
  const debug = params.get("debug") === "1";
  const tier = deviceTier(params);
  // Every listener hangs off this signal, and teardown aborts it. The page's
  // signal, a failure or a lost context all end here.
  const local = new AbortController();
  const { signal } = local;
  const onPageAbort = () => teardown();
  o.signal.addEventListener("abort", onPageAbort, { once: true });
  let phase: Phase = "building";
  let still = o.still;

  // A fresh canvas per mount: a canvas whose context was released hands back
  // the same dead context forever, so it is never reused.
  const canvas = document.createElement("canvas");
  canvas.className = "room-canvas";
  canvas.setAttribute("aria-hidden", "true");
  o.host.append(canvas);

  let stage: Stage | null = null;
  let room: Room | null = null;
  let timer = 0;
  function teardown() {
    if (phase === "disposed") return;
    phase = "disposed";
    local.abort();
    o.signal.removeEventListener("abort", onPageAbort);
    clearInterval(timer);
    room?.dispose();
    stage?.dispose();
    canvas.remove();
    room = null;
    stage = null;
    if (debug) {
      delete window.__room;
      window.__roomDisposals = (window.__roomDisposals ?? 0) + 1;
    }
  }
  // Resolves when the room is torn down, so no await can outlive it (a lost
  // context makes three's parallel compile poll forever).
  const gone = new Promise<never>((_, reject) => signal.addEventListener("abort", () => reject(new Gone()), { once: true }));
  gone.catch(() => {});
  const step = <T,>(p: Promise<T>) => Promise.race([p, gone]);

  try {
    const s = (stage = createStage(canvas, tier, {
      signal,
      still,
      watch: o.strip,
      onContextLost: () => {
        // Leave the event first; then release everything and tell the page.
        queueMicrotask(() => {
          teardown();
          o.onLost();
        });
      },
    }));
    if (debug && o.meter) s.meter = createMeter(o.meter, s.renderer, tier);
    performance.mark("room:build:start");
    const building = buildRoom(s.renderer, { phase: chosenPhase(location.search), low: tier.low, texBase: "/room/tex/" });
    // Torn down mid-build: the build still finishes, so release what it made.
    building.then(
      (built) => phase === "disposed" && built.dispose(),
      () => {},
    );
    const r = (room = await step(building));
    performance.measure("room:build", "room:build:start");

    // The light moves with the clock; the page shows its name from the same rule.
    timer = window.setInterval(() => {
      r.setPhase(chosenPhase(location.search));
      s.request();
    }, 60_000);

    // B, the study: a seat at the table; drag to look around. Choosing an
    // item turns the view to its object, slowly.
    const camera = new THREE.PerspectiveCamera(56, 1, 0.05, 80);
    const seat = new THREE.Vector3(0, 1.02, 1.28);
    camera.position.copy(seat);
    const view = { yaw: 0, pitch: -0.24 };
    const want = { ...view };
    const clampYaw = (y: number) => Math.max(-1.5, Math.min(1.5, y));
    const clampPitch = (p: number) => Math.max(-0.75, Math.min(0.25, p));
    const dir = new THREE.Vector3();
    const look = new THREE.Vector3();
    const turnTo = (key: RoomKey) => {
      const d = r.anchors[key].clone().sub(seat);
      want.yaw = clampYaw(Math.atan2(-d.x, -d.z));
      want.pitch = clampPitch(Math.atan2(d.y, Math.hypot(d.x, d.z)) * 0.9);
      s.boost(2500);
    };

    // The column covers the left of the screen on desktop and the bottom on
    // phones (measured, not assumed); the view is offset so the subject sits
    // in what stays uncovered, while the room itself still fills the page.
    const wide = matchMedia(WIDE_QUERY);
    let w = 1;
    let h = 1;
    let side = 0;
    let below = 0;
    const frame = () => {
      const col = o.column.getBoundingClientRect();
      side = wide.matches ? Math.round(col.right) : 0;
      below = wide.matches ? 0 : Math.round(Math.min(h * 0.8, Math.max(0, h - (col.top + scrollY))));
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
        // The label sits on the side away from its neighbours (the essay's
        // is left of the paper, clear of the board), and flips near either edge.
        const left = LABEL_LEFT.has(active!) ? p.x - 240 > side : p.x > w - 240;
        if (left) o.pin.dataset.flip = "";
        else delete o.pin.dataset.flip;
      }
    };

    // Pointer gestures, one pointer at a time (a second finger is ignored):
    //   idle ─(primary press)─▶ pressed ─(moves 4 px)─▶ dragging
    //   pressed ─(release)─▶ idle, as a tap (a ripple where it lands on water)
    //   dragging ─(release, cancel, capture lost)─▶ idle
    // A row chosen mid-drag turns the view when the drag ends.
    type Gesture = { kind: "idle" } | { kind: "pressed" | "dragging"; id: number; x: number; y: number; yaw: number; pitch: number };
    let gesture: Gesture = { kind: "idle" };
    let turnAfterDrag: RoomKey | null = null;
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const hitWater = (e: PointerEvent) => {
      ndc.set((e.clientX / w) * 2 - 1, -(e.clientY / h) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      return ray.intersectObject(r.water, false)[0];
    };
    const endGesture = (e: PointerEvent, tap: boolean) => {
      if (gesture.kind === "idle" || e.pointerId !== gesture.id) return;
      // Still: nothing moves on its own, so a tap makes no ripple.
      if (tap && gesture.kind === "pressed" && !still) {
        const hit = hitWater(e);
        if (hit?.uv) {
          r.rippleAt(hit.uv, 0.06);
          s.boost(1500);
        }
      }
      gesture = { kind: "idle" };
      if (turnAfterDrag && turnAfterDrag === active) turnTo(turnAfterDrag);
      turnAfterDrag = null;
      s.request();
    };
    let lastRipple = 0;
    canvas.addEventListener(
      "pointerdown",
      (e) => {
        if (gesture.kind !== "idle" || !e.isPrimary || (e.pointerType === "mouse" && e.button !== 0)) return;
        gesture = { kind: "pressed", id: e.pointerId, x: e.clientX, y: e.clientY, yaw: want.yaw, pitch: want.pitch };
        canvas.setPointerCapture(e.pointerId);
        s.boost(2500);
      },
      { signal },
    );
    canvas.addEventListener(
      "pointermove",
      (e) => {
        if (gesture.kind !== "idle") {
          if (e.pointerId !== gesture.id) return;
          if (gesture.kind === "pressed" && Math.hypot(e.clientX - gesture.x, e.clientY - gesture.y) >= DRAG_SLOP) gesture = { ...gesture, kind: "dragging" };
          if (gesture.kind === "dragging") {
            const k = 2.2 / Math.max(innerWidth, 600);
            want.yaw = clampYaw(gesture.yaw + (e.clientX - gesture.x) * k);
            want.pitch = clampPitch(gesture.pitch + (e.clientY - gesture.y) * k);
            s.boost(2500);
            s.request();
          }
          return;
        }
        // A mouse crossing the bath stirs it.
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
    canvas.addEventListener("pointerup", (e) => endGesture(e, true), { signal });
    canvas.addEventListener("pointercancel", (e) => endGesture(e, false), { signal });
    canvas.addEventListener("lostpointercapture", (e) => endGesture(e, false), { signal });
    // A long press must not open a menu or a callout over the room.
    canvas.addEventListener("contextmenu", (e) => e.preventDefault(), { signal });

    // Compile every shader before the first frame (in parallel where the
    // browser can), and draw nothing until then: an early frame would compile
    // them all at once on the main thread.
    s.onResize(canvas.clientWidth || innerWidth, canvas.clientHeight || innerHeight);
    phase = "compiling";
    performance.mark("room:compile:start");
    if (s.renderer.extensions.has("KHR_parallel_shader_compile")) await step(s.renderer.compileAsync(r.scene, camera));
    else s.renderer.compile(r.scene, camera);
    performance.measure("room:compile", "room:compile:start");
    await step(new Promise((done) => setTimeout(done, 0)));

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
    performance.mark("room:frame:start");
    s.resize();
    performance.measure("room:first-frame", "room:frame:start");
    phase = "live";
    s.start();

    if (debug) window.__room = { renderer: s.renderer, scene: r.scene, camera, tier, stage: s, room: r, phase: () => phase, state: () => s.state };

    return {
      setActive(a) {
        active = a?.key ?? null;
        r.highlight(active);
        if (a?.turn) {
          if (gesture.kind === "dragging") turnAfterDrag = a.key;
          else turnTo(a.key);
        }
        place();
        s.request();
      },
      setStill(next) {
        still = next;
        s.setStill(still);
      },
      setPanel(open) {
        panelOpen = open;
        cover();
      },
      pick(key) {
        if (key !== "board") return 0;
        const now = performance.now() / 1000;
        // Still: the bead is drawn where it lands, at once.
        r.dropBead(still ? now - 10 : now);
        s.boost(2500);
        s.request();
        return still ? 0 : 650;
      },
      dispose: teardown,
    };
  } catch (err) {
    teardown();
    if (err instanceof Gone || o.signal.aborted) return null;
    throw err;
  }
}
