"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "@/components/story/VideoLoop";

// React Bits "AnimatedContent" (Animations/AnimatedContent.tsx) after the E3
// mockup, without GSAP: one gentle rise per block, y 40 -> 0, opacity 0 -> 1,
// 0.8s power3.out, no stagger. The block starts hidden only once JavaScript
// is running (a `data-reveal` attribute set before first paint), so without
// JS the content is simply visible. It shows when it intersects the viewport
// (threshold 0.1), or after a 2.4s guard, whichever comes first, so nothing
// below the fold is ever left hidden. Under reduced motion it shows at once.
//
// The transition lives in CSS. The caller must add, in globals.css:
//
//   [data-reveal="pending"] { opacity: 0; transform: translateY(40px); }
//   [data-reveal] {
//     transition: opacity .8s cubic-bezier(.215,.61,.355,1),
//                 transform .8s cubic-bezier(.215,.61,.355,1);
//   }
//   @media (prefers-reduced-motion: reduce) {
//     [data-reveal] { opacity: 1 !important; transform: none !important; transition: none; }
//   }

const GUARD_MS = 2400;
const THRESHOLD = 0.1;

// Layout effect on the client (the attribute lands before the hydrated tree
// paints, so the block never flashes visible and then fades out); a plain
// effect on the server, where layout effects would only warn.
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

type RevealTag = "div" | "section" | "article" | "aside" | "footer" | "header" | "ol" | "ul" | "li" | "p";
type RevealState = "pending" | "shown";

// `delay` is in seconds, as in the mockup's `data-ac-delay`; it holds the
// rise after the block intersects. The guard ignores it.
export function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className,
}: {
  children: ReactNode;
  delay?: number;
  as?: RevealTag;
  className?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  // A callback ref: the element is stored for the effect, and the ref object
  // itself is never read during render.
  const setRef = useCallback((el: HTMLElement | null) => {
    ref.current = el;
  }, []);
  const reduced = useReducedMotion();
  const [state, setState] = useState<RevealState | undefined>(undefined);

  useIsomorphicLayoutEffect(() => {
    if (reduced) {
      setState("shown");
      return;
    }
    setState((s) => s ?? "pending");
  }, [reduced]);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || state !== "pending") return;
    let timer = 0;
    const show = () => setState("shown");
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        window.clearTimeout(timer);
        timer = window.setTimeout(show, Math.max(delay, 0) * 1000);
      },
      { threshold: THRESHOLD }
    );
    io.observe(el);
    timer = window.setTimeout(() => {
      io.disconnect();
      show();
    }, GUARD_MS);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
    };
  }, [reduced, state, delay]);

  return (
    <Tag ref={setRef} className={className} data-reveal={state}>
      {children}
    </Tag>
  );
}
