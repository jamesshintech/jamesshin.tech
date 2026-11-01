"use client";

import { useSyncExternalStore } from "react";
import { isMotionPaused, setMotionPaused, subscribeMotion } from "@/lib/motion";

// The pause switch for everything that moves on its own. It is a real
// toggle button (aria-pressed), keeps focus when pressed, and is hidden under
// prefers-reduced-motion, where nothing moves on its own in the first place.
export function MotionToggle({ className = "" }: { className?: string }) {
  const paused = useSyncExternalStore(subscribeMotion, isMotionPaused, () => false);
  return (
    <button
      type="button"
      className={`motion-toggle mono ${className}`.trim()}
      aria-pressed={paused}
      onClick={() => setMotionPaused(!paused)}
    >
      <span className="motion-glyph" aria-hidden="true" data-state={paused ? "paused" : "playing"} />
      <span className="toggle-label">{paused ? "Play motion" : "Pause motion"}</span>
    </button>
  );
}
