// The visitor's "pause motion" choice (WCAG 2.2.2, Pause, Stop, Hide): one
// switch that stops everything on the home page that moves on its own: the
// room (steam, water, bamboo, the paper's shadows) and the product
// recordings. The room then draws a still frame only when the visitor drags
// or chooses something.
//
// Two states, paused or not, kept in one place: <html data-motion="paused">,
// so CSS can act on it before any React code runs. localStorage keeps it
// across visits; the inline script in app/layout.tsx restores it before first
// paint on whichever page the visit starts, so a later client-side visit to
// the home page sees it too. A change in another tab is applied here.

export const MOTION_KEY = "motion-paused";
const ATTR = "data-motion";

const listeners = new Set<() => void>();

function apply(paused: boolean) {
  const root = document.documentElement;
  if (paused) root.setAttribute(ATTR, "paused");
  else root.removeAttribute(ATTR);
  for (const cb of listeners) cb();
}

export function isMotionPaused(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.getAttribute(ATTR) === "paused";
}

export function setMotionPaused(paused: boolean): void {
  try {
    if (paused) localStorage.setItem(MOTION_KEY, "1");
    else localStorage.removeItem(MOTION_KEY);
  } catch {
    // Private mode or blocked storage: the choice holds for this page only.
  }
  apply(paused);
}

function onStorage(e: StorageEvent) {
  if (e.key === MOTION_KEY || e.key === null) apply(e.newValue === "1");
}

export function subscribeMotion(cb: () => void): () => void {
  if (listeners.size === 0 && typeof window !== "undefined") window.addEventListener("storage", onStorage);
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0 && typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
}
