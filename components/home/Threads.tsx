"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { useReducedMotion } from "@/components/story/VideoLoop";
import { isMotionPaused, subscribeMotion } from "@/lib/motion";

// React Bits "Threads" (Backgrounds/Threads/Threads.tsx), hand-ported to
// Canvas 2D after the E3 mockup. The source's vertex maths is kept line for
// line: its hash Perlin2D, split/fray, amplitude envelope, time/10 drift, the
// per-line width/softness band, the taper alpha and the 25deg turn. Calmer
// than the source defaults: 24 lines, speed 0.3, opacity 0.3, no mouse
// follow. One stroke per line replaces the shader's smoothstep coverage: a
// wide pass at the band width and a core pass at half, so edges stay soft.
//
// The canvas fills its parent (the caller positions it; `absolute inset-0`)
// and takes its pixel size from the parent through a ResizeObserver, so the
// animation loop never reads layout. DPR is capped at 1.5. The loop runs only
// while the canvas is on screen and the tab is visible; under reduced motion
// it draws one still frame and never animates. With `pauseWhenCovered`, it
// also stops while its chapter ([data-chapter]) is `inert`, which the home
// page's scroll engine sets once a later chapter has slid fully over it.
// It also holds its current frame while the visitor has paused motion.

const S = {
  color: "242, 239, 230",
  amplitude: 1.7,
  distance: 0.4,
  lineCount: 24,
  thickness: 0.6,
  softness: 1.3,
  speed: 0.3,
  waves: 1.05,
  split: 0.04,
  fray: 0.5,
  angle: 25,
  seed: 3 * 13.37,
  taper: 0.85,
  opacity: 0.3,
} as const;

const MAX_DPR = 1.5;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const fract = (v: number) => v - Math.floor(v);
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

// Source Perlin2D, same hash constants.
function perlin2D(px: number, py: number): number {
  const ix = Math.floor(px);
  const iy = Math.floor(py);
  const fx = px - ix;
  const fy = py - iy;
  const fx1 = fx - 1;
  const fy1 = fy - 1;
  let x0 = ix - Math.floor(ix / 71) * 71 + 26;
  let y0 = iy - Math.floor(iy / 71) * 71 + 161;
  let x1 = ix + 1 - Math.floor((ix + 1) / 71) * 71 + 26;
  let y1 = iy + 1 - Math.floor((iy + 1) / 71) * 71 + 161;
  x0 *= x0;
  y0 *= y0;
  x1 *= x1;
  y1 *= y1;
  const p = [x0 * y0, x1 * y0, x0 * y1, x1 * y1];
  const dx = [fx, fx1, fx, fx1];
  const dy = [fy, fy, fy1, fy1];
  const g = [0, 0, 0, 0];
  for (let i = 0; i < 4; i++) {
    const hx = fract(p[i] / 951.135664) - 0.49999;
    const hy = fract(p[i] / 642.949883) - 0.49999;
    g[i] = ((hx * dx[i] + hy * dy[i]) / Math.sqrt(hx * hx + hy * hy)) * 1.4142135623730951;
  }
  const bx = fx * fx * fx * (fx * (fx * 6 - 15) + 10);
  const by = fy * fy * fy * (fy * (fy * 6 - 15) + 10);
  return g[0] * (1 - bx) * (1 - by) + g[1] * bx * (1 - by) + g[2] * (1 - bx) * by + g[3] * bx * by;
}

type State = { time: number; width: number; height: number; segments: number; dpr: number };

function render(ctx: CanvasRenderingContext2D, st: State) {
  const w = st.width;
  const h = st.height;
  const rad = (S.angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const frameX = Math.abs(w * cos) + Math.abs(h * sin);
  const frameY = Math.abs(w * sin) + Math.abs(h * cos);
  const pixel = 1 / Math.max(w, h);
  const cx = w / 2;
  const cy = h / 2;
  const timeScaled = st.time / 10;
  ctx.setTransform(st.dpr, 0, 0, st.dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (let i = 0; i < S.lineCount; i++) {
    const perc = i / S.lineCount;
    const splitPoint = S.split + perc * S.fray;
    const width = 7 * S.thickness * pixel * (1 - perc);
    // Blur equals perc once past the split.
    const band = (width / 2 + 10 * S.softness * pixel * perc) * frameY;
    const alpha = (1 - smooth(0, 1, Math.pow(perc, 0.3)) * S.taper) * S.opacity;
    const path = new Path2D();
    for (let s = 0; s <= st.segments; s++) {
      const x = s / st.segments;
      const finalAmplitude = smooth(splitPoint, Math.max(0.7, splitPoint + 0.2), x) * 0.5 * S.amplitude;
      const n1 = perlin2D(timeScaled * 2.5 + S.seed, (x * S.waves + perc) * 2.5);
      const n2 = perlin2D(timeScaled * 3.5 + S.seed, (x * S.waves + timeScaled) * 3.5) / 1.5;
      const xnoise = n1 + (n2 - n1) * (x * 0.3);
      const y = 0.5 + (perc - 0.5) * S.distance + (xnoise / 2) * finalAmplitude;
      const lx = (x - 0.5) * frameX;
      const ly = (y - 0.5) * frameY;
      const tx = lx * cos - ly * sin;
      const ty = lx * sin + ly * cos;
      if (s === 0) path.moveTo(cx + tx, cy - ty);
      else path.lineTo(cx + tx, cy - ty);
    }
    ctx.strokeStyle = `rgba(${S.color}, ${(alpha * 0.28).toFixed(3)})`;
    ctx.lineWidth = Math.max(2 * band, 1);
    ctx.stroke(path);
    ctx.strokeStyle = `rgba(${S.color}, ${(alpha * 0.5).toFixed(3)})`;
    ctx.lineWidth = Math.max(band, 1);
    ctx.stroke(path);
  }
}

export function Threads({ className, pauseWhenCovered = false }: { className?: string; pauseWhenCovered?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  const paused = useSyncExternalStore(subscribeMotion, isMotionPaused, () => false);
  const still = reduced || paused;

  useEffect(() => {
    const canvas = ref.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const st: State = { time: 0, width: 1, height: 1, segments: 0, dpr: 1 };
    let raf = 0;
    let last = 0;
    let onScreen = true;
    const gate = pauseWhenCovered ? canvas.closest<HTMLElement>("[data-chapter]") : null;
    let covered = gate?.inert ?? false;

    const resize = (width: number, height: number) => {
      st.dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      st.width = Math.max(1, width);
      st.height = Math.max(1, height);
      canvas.width = Math.max(1, Math.round(st.width * st.dpr));
      canvas.height = Math.max(1, Math.round(st.height * st.dpr));
      st.segments = clamp(Math.round(st.width / 6), 64, 320);
      render(ctx, st);
    };

    const frame = (now: number) => {
      raf = 0;
      if (!onScreen || covered || document.hidden || still) return;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      st.time += dt * S.speed;
      render(ctx, st);
      raf = requestAnimationFrame(frame);
    };

    const wake = () => {
      if (!raf && onScreen && !covered && !document.hidden && !still) {
        last = 0;
        raf = requestAnimationFrame(frame);
      }
    };

    // The parent's size is read here, never in the frame loop.
    const ro = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect;
      if (box) resize(box.width, box.height);
    });
    ro.observe(host);
    const io = new IntersectionObserver((entries) => {
      onScreen = entries.some((e) => e.isIntersecting);
      if (onScreen) wake();
    });
    io.observe(canvas);
    document.addEventListener("visibilitychange", wake);
    const mo = new MutationObserver(() => {
      covered = gate?.inert ?? false;
      wake();
    });
    if (gate) mo.observe(gate, { attributes: true, attributeFilter: ["inert"] });

    resize(host.clientWidth, host.clientHeight);
    wake();

    return () => {
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      document.removeEventListener("visibilitychange", wake);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [still, pauseWhenCovered]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
