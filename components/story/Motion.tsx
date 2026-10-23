"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

// Everything renders complete on the server. These helpers only add the
// one-shot reveal once the browser has JS; with no JS, for crawlers, and
// under prefers-reduced-motion the page is static and fully readable.

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function reducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Adds `armed` before first paint when the section is below the fold, then
 * swaps it for `lit` when ~20% of it scrolls into view.
 */
export function Lit({
  as: Tag = "section",
  className = "",
  children,
  ...rest
}: {
  as?: "section" | "div" | "header";
  className?: string;
  children: ReactNode;
  id?: string;
  "aria-labelledby"?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion() || !("IntersectionObserver" in window)) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.8) {
      el.classList.add("lit");
      return;
    }
    el.classList.add("armed");
    const light = () => {
      el.classList.remove("armed");
      el.classList.add("lit");
      io.disconnect();
      clearTimeout(failSafe);
    };
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) light();
      },
      { rootMargin: "0px 0px -20% 0px" }
    );
    io.observe(el);
    // If the observer never fires (print, full-page capture, an odd
    // scroll container) nothing may stay hidden: reveal after 2.5s anyway.
    const failSafe = window.setTimeout(light, 2500);
    return () => {
      io.disconnect();
      clearTimeout(failSafe);
    };
  }, []);

  // The ref type is widened because Tag is a union of intrinsic elements.
  return (
    <Tag ref={ref as React.RefObject<HTMLDivElement>} className={className} {...rest}>
      {children}
    </Tag>
  );
}

/** Counts from 0 to the number inside `text` over 1.1s when it scrolls into view. */
export function CountUp({ text }: { text: string }) {
  const [shown, setShown] = useState(text);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion() || !("IntersectionObserver" in window)) return;
    const m = text.match(/[\d,]+(\.\d+)?/);
    if (!m) return;
    const target = parseFloat(m[0].replace(/,/g, ""));
    const decimals = (m[1] ?? "").length ? m[1]!.length - 1 : 0;
    const fmt = (v: number) =>
      v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / 1100);
        const eased = 1 - Math.pow(1 - p, 3);
        setShown(text.replace(m[0], fmt(target * eased)));
        if (p < 1) requestAnimationFrame(tick);
        else setShown(text);
      };
      requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [text]);

  return <span ref={ref}>{shown}</span>;
}

/** A 3px gold line across the top that grows with scroll. */
export function ProgressBar() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion()) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      el.style.transform = `scaleX(${p})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return <div ref={ref} className="progress" aria-hidden="true" />;
}
