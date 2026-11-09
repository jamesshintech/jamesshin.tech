// The visitor's "pause motion" choice (WCAG 2.2.2, Pause, Stop, Hide): one
// switch that stops everything on the home page that moves on its own: the
// room (steam, water, bamboo, the paper's shadows) and the product
// recordings. The room then draws a still frame only when the visitor drags
// or chooses something.
//
// The choice lives on <html data-motion="paused">, so CSS can act on it before
// any React code runs, and in localStorage, so it survives a reload. The home
// page's inline script restores it before first paint.

export const MOTION_KEY = "motion-paused";
const ATTR = "data-motion";

const listeners = new Set<() => void>();

export function isMotionPaused(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.getAttribute(ATTR) === "paused";
}

export function setMotionPaused(paused: boolean): void {
  const root = document.documentElement;
  if (paused) root.setAttribute(ATTR, "paused");
  else root.removeAttribute(ATTR);
  try {
    if (paused) localStorage.setItem(MOTION_KEY, "1");
    else localStorage.removeItem(MOTION_KEY);
  } catch {
    // Private mode or blocked storage: the choice holds for this page only.
  }
  for (const cb of listeners) cb();
}

export function subscribeMotion(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
