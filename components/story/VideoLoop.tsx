"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Loop } from "@/data/projects";

// A recording of the real app. Nothing loads until the panel nears the
// viewport; it plays while on screen and pauses off it. Under reduced
// motion the poster frame shows with a Play control instead.

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

export function VideoLoop({ loop, className = "phone", priority = false }: { loop: Loop; className?: string; priority?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduced = useReducedMotion();
  const [wantsPlay, setWantsPlay] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v || (reduced && !wantsPlay)) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            if (v.preload === "none") v.preload = "auto";
            v.play().catch(() => {});
          } else {
            v.pause();
          }
        }
      },
      { rootMargin: "200px 0px" }
    );
    io.observe(v);
    return () => io.disconnect();
  }, [reduced, wantsPlay]);

  return (
    <div className={`loop ${className}`}>
      <video
        ref={ref}
        muted
        loop
        playsInline
        preload={priority ? "auto" : "none"}
        poster={loop.poster}
        width={loop.width}
        height={loop.height}
        aria-label={loop.alt}
        autoPlay={!reduced && priority}
      >
        <source src={loop.webm} type="video/webm" />
        <source src={loop.mp4} type="video/mp4" />
      </video>
      {reduced && !wantsPlay && (
        <button type="button" className="btn play" onClick={() => setWantsPlay(true)}>
          Play {loop.seconds}s loop
        </button>
      )}
    </div>
  );
}
