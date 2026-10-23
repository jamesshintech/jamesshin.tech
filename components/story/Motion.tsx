"use client";

import { useEffect, useRef, type ReactNode } from "react";

// The only reveal on the page: a section gains `lit` once it has been seen,
// which lets the PLAYERS: 1 stamp play its 120ms hit. Everything renders
// complete on the server; nothing is hidden before `lit`.

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

  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.classList.add("lit");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -15% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag ref={ref as React.RefObject<HTMLDivElement>} className={className} {...rest}>
      {children}
    </Tag>
  );
}
