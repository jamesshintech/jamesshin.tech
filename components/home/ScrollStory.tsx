"use client";

import { useEffect } from "react";
import { isMotionPaused } from "@/lib/motion";

// The scroll engine for the home page's chapters. It renders nothing and
// attaches to the server-rendered story ([data-story]).
//
// Pinning itself is CSS: every chapter is `position: sticky`, holds for its
// bottom margin, then the next one slides over it (the slot geometry of React
// Bits ScrollStack, Components/ScrollStack). This component only scrubs what
// rides on that scroll, and only in pinned mode (desktop, tall enough, motion
// wanted); otherwise it clears every inline style and the CSS shows plain
// stacked sections. Without JavaScript the page never pins at all.
//
// One passive scroll listener and one rAF. Offsets are measured on resize
// only; a frame reads scrollY and nothing else, and writes only values that
// changed. Per frame it drives:
//   - the covered chapter: scale 1 - cover * 0.05 from its top edge (ScrollStack
//     itemScale), its copy dimmed by 1 - 0.5^cover, `inert` and its recording
//     paused once fully covered;
//   - chapter 0: the intro (name, line, work samples) gives way to Yonmoku's
//     caption beside the pinned recording;
//   - the rail and the Contents.
// Text is never animated: every title and tagline is drawn solid, so a reader
// who stops mid-slide always sees whole words.

const MOTION = "(prefers-reduced-motion: no-preference)";
// Must match the pinned media query in app/globals.css.
const PINNED = "(min-width: 901px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)";
const ROOT_CLASS = "js-story";
const ITEM_SCALE = 0.05;
const DIM = 0.5;
// Rail index for the intro (name, line, work samples) before Yonmoku's caption.
const INTRO = -1;
// No chapter marked: the stacked layout, where nothing is pinned or current.
const NONE = -2;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeOut = (v: number) => 1 - Math.pow(1 - v, 3);
const all = <T extends Element>(root: ParentNode, sel: string) => Array.from(root.querySelectorAll<T>(sel));

interface Chapter {
  el: HTMLElement;
  inner: HTMLElement;
  grid: HTMLElement;
  videos: HTMLVideoElement[];
}

export function ScrollStory() {
  useEffect(() => {
    const story = document.querySelector<HTMLElement>("[data-story]");
    const nav = document.querySelector<HTMLElement>(".nav");
    const intro = story?.querySelector<HTMLElement>(".c0-a");
    const caption = story?.querySelector<HTMLElement>(".c0-b");
    if (!story || !nav || !intro || !caption) return;

    const root = document.documentElement;
    const motion = window.matchMedia(MOTION);
    const pinnedMQ = window.matchMedia(PINNED);
    const chapters: Chapter[] = all<HTMLElement>(story, "[data-chapter]").map((el) => ({
      el,
      inner: el.querySelector<HTMLElement>(".chapter-inner") ?? el,
      grid: el.querySelector<HTMLElement>(".chapter-grid") ?? el,
      videos: all<HTMLVideoElement>(el, "video"),
    }));
    const railItems = all<HTMLElement>(document, "[data-rail]");
    const geo = { navH: 65, pinH: 800, tops: [] as number[], holds: [] as number[] };
    const cache = new Map<string, string>();
    const write = (key: string, value: string, apply: (v: string) => void) => {
      if (cache.get(key) === value) return;
      cache.set(key, value);
      apply(value);
    };
    let frame = 0;
    let pinned = false;
    let current = -1;

    // `cur` is a rail index: INTRO, 0 to 3 for the products, or NONE. The intro belongs to chapter 0, so chapter 0 stays current
    // while the rail marks the intro.
    const markCurrent = (cur: number, aria: boolean) => {
      current = cur;
      const chapter = cur === INTRO ? 0 : cur;
      chapters.forEach((c, i) => c.el.classList.toggle("is-current", i === chapter));
      for (const li of railItems) {
        const on = Number(li.dataset.rail) === cur;
        li.classList.toggle("is-current", on);
        if (on && aria) li.querySelector("a")?.setAttribute("aria-current", "location");
        else li.querySelector("a")?.removeAttribute("aria-current");
      }
    };

    const setCovered = (c: Chapter, covered: boolean) => {
      c.el.inert = covered;
      for (const v of c.videos) {
        if (covered) v.pause();
        // Only a VideoLoop that has already started, and never against the visitor's pause.
        else if (v.preload !== "none" && !isMotionPaused()) v.play().catch(() => {});
      }
    };

    const update = () => {
      frame = 0;
      if (!pinned) return;
      const y = window.scrollY;
      let cur = INTRO;
      chapters.forEach((c, i) => {
        const start = geo.tops[i] - geo.navH;
        const hold = geo.holds[i];
        // Only a chapter with a successor is ever covered; the last one scrolls away.
        const cover = i < chapters.length - 1 ? clamp01((y - (start + hold)) / geo.pinH) : 0;
        const dim = 1 - Math.pow(1 - DIM, cover);
        write(`s${i}`, cover.toFixed(4), () => {
          c.inner.style.transform = cover < 0.0005 ? "" : `scale(${(1 - cover * ITEM_SCALE).toFixed(4)})`;
        });
        write(`d${i}`, dim.toFixed(3), (v) => c.grid.style.setProperty("--stack-dim", v));
        write(`i${i}`, String(cover >= 0.999), (v) => setCovered(c, v === "true"));
        if (i === 0) {
          const p = clamp01((y - start) / hold);
          const out = clamp01(p / 0.4);
          const q = clamp01((p - 0.3) / 0.5);
          const shown = clamp01(q * 2) * (1 - dim);
          write("a", out.toFixed(3), () => {
            intro.style.opacity = out <= 0 ? "" : (1 - out).toFixed(3);
            intro.style.transform = out <= 0 ? "" : `translateY(${(-40 * easeOut(out)).toFixed(1)}px)`;
            intro.style.pointerEvents = out >= 1 ? "none" : "";
          });
          write("b", `${q.toFixed(3)}:${shown.toFixed(3)}`, () => {
            caption.style.opacity = q <= 0 ? "" : shown.toFixed(3);
            caption.style.transform = q >= 1 ? "" : `translateY(${((1 - easeOut(q)) * 40).toFixed(1)}px)`;
            caption.style.pointerEvents = q >= 0.5 ? "auto" : "";
          });
          if (p >= 0.35) cur = 0;
        } else if (y >= start - 0.5 * geo.pinH) {
          cur = i;
        }
      });
      if (cur !== current) markCurrent(cur, true);
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    // Layout reads happen here, on resize and font load only.
    const measure = () => {
      geo.navH = nav.offsetHeight;
      geo.pinH = chapters[0].el.offsetHeight;
      geo.holds = chapters.map((c) => parseFloat(getComputedStyle(c.el).marginBottom) || 0);
      let acc = story.getBoundingClientRect().top + window.scrollY;
      geo.tops = chapters.map((_, i) => {
        const top = acc;
        acc += geo.pinH + geo.holds[i];
        return top;
      });
    };
    const remeasure = () => {
      if (!pinned) return;
      measure();
      schedule();
    };

    const reset = () => {
      cache.clear();
      const styled = [intro, caption, ...chapters.flatMap((c) => [c.inner, c.grid])];
      for (const el of styled) el.removeAttribute("style");
      for (const c of chapters) c.el.inert = false;
      markCurrent(NONE, false);
    };

    const evaluate = () => {
      root.classList.toggle(ROOT_CLASS, motion.matches);
      const on = pinnedMQ.matches;
      if (on === pinned) return remeasure();
      pinned = on;
      if (on) remeasure();
      else reset();
    };

    // Where a chapter settles: pinned under the nav, the one before fully
    // covered; for chapter 0, once its caption has swapped in.
    const settledY = (id: string): number | null => {
      if (id === "intro") return geo.tops[0] - geo.navH;
      const i = chapters.findIndex((c) => c.el.id === id);
      return i < 0 ? null : geo.tops[i] - geo.navH + (i === 0 ? geo.holds[0] * 0.85 : 0);
    };

    // Rail, Contents and Next links land on the settled state, not the first
    // frame of the slide. A keyboard press also moves focus into the chapter.
    const onClick = (e: MouseEvent) => {
      if (!pinned || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = e.target instanceof Element ? e.target.closest<HTMLAnchorElement>('a[href^="#"]') : null;
      const id = link?.getAttribute("href")?.slice(1) ?? "";
      const y = settledY(id);
      if (y === null) return;
      e.preventDefault();
      history.replaceState(null, "", `#${id}`);
      const focus = () => document.getElementById(id)?.focus({ preventScroll: true });
      if (Math.abs(window.scrollY - y) < 2) return void (e.detail === 0 && focus());
      if (e.detail === 0) {
        if ("onscrollend" in window) window.addEventListener("scrollend", focus, { once: true });
        else setTimeout(focus, 700);
      }
      window.scrollTo({ top: y, behavior: "smooth" });
    };

    // Tabbing into a chapter's copy shows it: never a focused link that is
    // faded out, mid-slide or still to come.
    const onFocusIn = (e: FocusEvent) => {
      const t = e.target;
      if (!pinned || !(t instanceof HTMLElement) || !t.matches(":focus-visible") || t.closest(".contents")) return;
      const chapter = chapters.find((c) => c.el.contains(t));
      const y = intro.contains(t) ? geo.tops[0] - geo.navH : chapter ? settledY(chapter.el.id) : null;
      if (y !== null && Math.abs(window.scrollY - y) > 4) window.scrollTo({ top: y, behavior: "instant" });
    };

    const ro = new ResizeObserver(remeasure);
    ro.observe(story);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", remeasure);
    pinnedMQ.addEventListener("change", evaluate);
    motion.addEventListener("change", evaluate);
    document.addEventListener("click", onClick);
    story.addEventListener("focusin", onFocusIn);
    document.fonts.ready.then(remeasure).catch(() => {});
    story.dataset.ready = "1";
    evaluate();

    return () => {
      if (frame) cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", remeasure);
      pinnedMQ.removeEventListener("change", evaluate);
      motion.removeEventListener("change", evaluate);
      document.removeEventListener("click", onClick);
      story.removeEventListener("focusin", onFocusIn);
      pinned = false;
      reset();
      root.classList.remove(ROOT_CLASS);
    };
  }, []);

  return null;
}
