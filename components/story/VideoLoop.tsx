"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Loop } from "@/data/projects";
import { isMotionPaused, subscribeMotion } from "@/lib/motion";

// A recording of the real app. Nothing loads until the panel nears the
// viewport; it plays while on screen and pauses off it, and stays paused
// while the visitor has paused motion. Under reduced motion the poster frame
// shows with a Play control instead, which then becomes a Pause control (the
// same button, so keyboard focus stays on it).

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(cb: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false
  );
}

// Two modes. auto: it plays while in view, unless the visitor paused motion.
// asked: it plays only after the visitor presses Play; that is the mode under
// reduced motion, and also when the browser refuses autoplay (iOS Low Power
// Mode does), which otherwise left a still poster with no way to start it.
// A Play press belongs to the mode it was made in.
//
// `href` links the recording itself (hidden from assistive tech, which gets the
// product name link instead). The Play control is a sibling of that link,
// never inside it, so it stays reachable and never navigates.
export function VideoLoop({ loop, className = "phone", href }: { loop: Loop; className?: string; href?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduced = useReducedMotion();
  const [blocked, setBlocked] = useState(false);
  const [wants, setWants] = useState<{ on: boolean; reduced: boolean }>({ on: false, reduced: false });
  const paused = useSyncExternalStore(subscribeMotion, isMotionPaused, () => false);
  const asked = reduced || blocked;
  const wantsPlay = wants.on && wants.reduced === reduced;

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    // In asked mode only the visitor's Play runs the loop, and it outranks
    // the page-wide pause.
    const allowed = asked ? wantsPlay : !paused;
    if (!allowed) {
      v.pause();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            if (v.preload === "none") v.preload = "auto";
            v.play().catch((err: unknown) => {
              // Refused without a gesture: offer Play. (An AbortError only
              // means a pause interrupted it.)
              if (err instanceof DOMException && err.name === "NotAllowedError") setBlocked(true);
            });
          } else {
            v.pause();
          }
        }
      },
      { rootMargin: "200px 0px" }
    );
    io.observe(v);
    return () => io.disconnect();
  }, [asked, wantsPlay, paused]);

  const video = (
    <video
      ref={ref}
      muted
      loop
      playsInline
      preload="none"
      poster={loop.poster}
      width={loop.width}
      height={loop.height}
      aria-label={loop.alt}
    >
      <source src={loop.webm} type="video/webm" />
      <source src={loop.mp4} type="video/mp4" />
    </video>
  );

  return (
    <div className={`loop ${className}`}>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="loop-link" tabIndex={-1} aria-hidden="true">
          {video}
        </a>
      ) : (
        video
      )}
      {asked && (
        <button type="button" className="btn play" aria-pressed={wantsPlay} onClick={() => setWants({ on: !wantsPlay, reduced })}>
          {wantsPlay ? "Pause loop" : `Play ${loop.seconds}s loop`}
        </button>
      )}
    </div>
  );
}
