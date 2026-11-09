"use client";

import Link from "next/link";
import { useEffect, useReducer, useRef, useState, useSyncExternalStore, type MouseEvent } from "react";
import type { Loop } from "@/data/projects";
import type { RoomHandle } from "@/lib/room/runner";
import { savesData, webglSupport } from "@/lib/room/support";
import { NO_SELECTION, activeOf, chosenPhase, roomStatus, selection, timeNameOf, type RoomKey, type RoomStatus, type TimeName } from "@/lib/room/state";
import { isMotionPaused, subscribeMotion } from "@/lib/motion";
import { VideoLoop, useReducedMotion } from "@/components/story/VideoLoop";
import { MotionToggle } from "@/components/home/MotionToggle";

// The home page: the Yonmoku room fills the screen, and a column carries
// everything a reader needs. Every item is a row in the column and an object
// in the room; a product's row or object opens a panel with its recording,
// and a work sample's row goes straight to the document. The column is
// server-rendered and complete without JavaScript (every row is a real
// link); the room loads after the page is idle, from its own chunk, and
// until its first frame the room is a picture of itself. Where the room would
// strain the device (WebGL drawn by the CPU) or was asked not to load
// (Save-Data), it stays that picture. Its state machines (the room's
// lifecycle, what the reader is looking at) are in lib/room/state.ts.

export type RoomItem = {
  key: RoomKey;
  group: "samples" | "products";
  /** Mono label: "Essay · 6 min", "Live · Oct 2026 · iOS". */
  kind: string;
  title: string;
  /** Short name for the label pinned to the object. */
  label: string;
  /** One line: the essay's summary, the PDF's provenance, the product's own description. */
  line: string;
  href: string;
  linkType: "internal" | "pdf" | "external";
  cta: string;
  loop?: Loop;
};

type Props = {
  name: string;
  role: string;
  intro: string;
  items: RoomItem[];
  productsHeading: string;
  contactEmail: string;
  linkedin: string;
  github: string | null;
  year: number;
};

const TIME_NAMES: Record<TimeName, string> = { day: "Daylight", dusk: "Dusk", night: "Night" };
const pad2 = (n: number) => String(n).padStart(2, "0");
const plainClick = (e: MouseEvent) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
/** CSS sees three looks: the picture (waiting or loading), live, or the picture for good. */
const look = (s: RoomStatus) => (s.kind === "live" ? "live" : s.kind === "picture" ? "picture" : "poster");

export function StudyHome({ name, role, intro, items, productsHeading, contactEmail, linkedin, github, year }: Props) {
  const [status, dispatchStatus] = useReducer(roomStatus, { kind: "waiting" });
  const [sel, dispatchSel] = useReducer(selection, NO_SELECTION);
  const [time, setTime] = useState<TimeName | null>(null);
  const [debug, setDebug] = useState(false);
  const [enhanced, setEnhanced] = useState(false);
  const [forcedStill, setForcedStill] = useState(false);
  const paused = useSyncExternalStore(subscribeMotion, isMotionPaused, () => false);
  const reduced = useReducedMotion();
  // One answer to "should the room move on its own?", followed live.
  const still = reduced || paused || forcedStill;

  const hostRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const colRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const meterRef = useRef<HTMLOutputElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const spotRefs = useRef(new Map<RoomKey, HTMLElement>());
  const rowRefs = useRef(new Map<RoomKey, HTMLElement>());
  const handleRef = useRef<RoomHandle | null>(null);
  const pickDelay = useRef(0);
  const pickToken = useRef(0);

  const active = activeOf(sel);
  const activeKey = active?.key ?? null;
  const panelKey = sel.panel.kind === "closed" ? null : sel.panel.key;
  const openKey = sel.panel.kind === "open" ? sel.panel.key : null;
  // What the room must know when it arrives, kept current for that moment.
  const latest = useRef({ active, panel: panelKey !== null, still });
  latest.current = { active, panel: panelKey !== null, still };

  // The light's name, from the same rule as the room and the inline script,
  // kept on <html> (the picture is chosen by it) and in the caption.
  useEffect(() => {
    const tick = () => {
      const name = timeNameOf(chosenPhase(location.search));
      document.documentElement.setAttribute("data-room-time", name);
      setTime(name);
    };
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  // Start the room once the page is idle, so the column is interactive
  // first. Under Save-Data, without WebGL 2, with WebGL drawn by the CPU, or
  // if anything fails, the room stays a picture and the page loses nothing
  // else. A forced tier (?q=low|high, for testing) runs it on any WebGL 2.
  useEffect(() => {
    setEnhanced(true);
    const params = new URLSearchParams(location.search);
    const isDebug = params.get("debug") === "1";
    const forced = params.get("q") === "low" || params.get("q") === "high";
    const forceStill = params.get("motion") === "off";
    setDebug(isDebug);
    setForcedStill(forceStill);
    const gl = webglSupport();
    const why = savesData() ? "save-data" : gl === "none" ? "no-webgl" : gl === "software" && !forced ? "software-webgl" : null;
    if (why) {
      dispatchStatus({ type: "unavailable", why });
      return;
    }
    const ac = new AbortController();
    let handle: RoomHandle | null = null;
    const begin = () => {
      dispatchStatus({ type: "start" });
      import("@/lib/room/runner")
        .then(({ startRoom }) => {
          if (ac.signal.aborted || !hostRef.current || !colRef.current || !pinRef.current || !stripRef.current) return null;
          return startRoom({
            host: hostRef.current,
            column: colRef.current,
            strip: stripRef.current,
            spots: spotRefs.current,
            pin: pinRef.current,
            meter: isDebug ? meterRef.current : null,
            still: latest.current.still || forceStill,
            signal: ac.signal,
            onFirstFrame: () => dispatchStatus({ type: "first-frame" }),
            onLost: () => dispatchStatus({ type: "lost" }),
          });
        })
        .then((h) => {
          if (!h) return;
          if (ac.signal.aborted) return h.dispose();
          handle = h;
          handleRef.current = h;
          h.setActive(latest.current.active);
          h.setPanel(latest.current.panel);
        })
        .catch((err: unknown) => {
          if (ac.signal.aborted) return;
          console.warn("The room could not start; showing its picture instead.", err);
          dispatchStatus({ type: "failed" });
        });
    };
    const idle = window.requestIdleCallback ? window.requestIdleCallback(begin, { timeout: 1500 }) : window.setTimeout(begin, 200);
    return () => {
      ac.abort();
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      handle?.dispose();
      handleRef.current = null;
    };
  }, []);

  // The room follows the page's state; it never keeps its own copy.
  useEffect(() => {
    handleRef.current?.setActive(active);
    // `active` is rebuilt every render; its key and turn are what matter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey, active?.turn]);
  useEffect(() => {
    handleRef.current?.setStill(still);
  }, [still]);
  useEffect(() => {
    handleRef.current?.setPanel(panelKey !== null);
  }, [panelKey]);

  // A pending pick opens when the bead has landed, unless something else was
  // chosen or the panel closed first (the reducer ignores a stale token).
  useEffect(() => {
    if (sel.panel.kind !== "pending") return;
    const token = sel.panel.token;
    const id = window.setTimeout(() => dispatchSel({ type: "settle", token }), pickDelay.current);
    return () => window.clearTimeout(id);
  }, [sel.panel]);

  // Focus follows the panel: into it when it opens, back to the item's row
  // when it closes (also when the object was clicked: the hotspots are
  // pointer shortcuts, hidden from assistive technology).
  const wasOpen = useRef<RoomKey | null>(null);
  useEffect(() => {
    if (openKey) closeRef.current?.focus();
    else if (wasOpen.current) rowRefs.current.get(wasOpen.current)?.focus({ preventScroll: true });
    wasOpen.current = openKey;
  }, [openKey]);

  useEffect(() => {
    if (sel.panel.kind === "closed") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dispatchSel({ type: "close" });
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sel.panel.kind]);

  const close = () => dispatchSel({ type: "close" });
  const pick = (key: RoomKey) => {
    const delay = handleRef.current?.pick(key) ?? 0;
    if (delay <= 0) return dispatchSel({ type: "open", key });
    pickDelay.current = delay;
    dispatchSel({ type: "pick", key, token: ++pickToken.current });
  };

  const samples = items.filter((i) => i.group === "samples");
  const products = items.filter((i) => i.group === "products");
  const openItem = items.find((i) => i.key === openKey) ?? null;
  // While a panel is open or opening it names the item; the label would only sit under it.
  const pinItem = panelKey ? null : (items.find((i) => i.key === activeKey) ?? null);

  const rowProps = (it: RoomItem) => ({
    className: `room-item${activeKey === it.key ? " is-active" : ""}`,
    "data-key": it.key,
    ref: (el: HTMLAnchorElement | null) => {
      if (el) rowRefs.current.set(it.key, el);
      else rowRefs.current.delete(it.key);
    },
    onPointerEnter: () => dispatchSel({ type: "hover", key: it.key, from: "row" }),
    onPointerLeave: () => dispatchSel({ type: "unhover", key: it.key }),
    onFocus: () => dispatchSel({ type: "focus", key: it.key }),
    onBlur: () => dispatchSel({ type: "blur", key: it.key }),
  });

  const rowBody = (it: RoomItem, n?: number) => (
    <>
      {n !== undefined && <span className="room-item-n mono">{pad2(n)}</span>}
      <span className="room-item-body">
        <span className="room-item-kind mono">{it.kind}</span>
        <span className="room-item-title">{it.title}</span>
        <span className="room-item-line">{it.line}</span>
      </span>
    </>
  );

  return (
    <div className="room" data-state={look(status)} data-why={status.kind === "picture" ? status.why : undefined} data-debug={debug ? "" : undefined}>
      <div
        className="room-stage"
        ref={hostRef}
        role="img"
        aria-label="Yonmoku's room: a quiet Japanese room with a low table and the game's board, shoji open onto a garden with a stone bath. Each item in the list is an object in the room."
      />
      {/* The part of the page the room shows through: the whole window on
          desktop, the strip above the column on phones. Scrolled away, the
          room stops drawing. */}
      <div className="room-strip" ref={stripRef} aria-hidden="true" />
      <div className="room-vignette" aria-hidden="true" />
      <div className="room-spots">
        {items.map((it) => (
          <button
            key={it.key}
            type="button"
            className={`room-spot${activeKey === it.key ? " is-active" : ""}`}
            data-key={it.key}
            tabIndex={-1}
            aria-hidden="true"
            ref={(el) => {
              if (el) spotRefs.current.set(it.key, el);
              else spotRefs.current.delete(it.key);
            }}
            onPointerEnter={() => dispatchSel({ type: "hover", key: it.key, from: "spot" })}
            onPointerLeave={() => dispatchSel({ type: "unhover", key: it.key })}
            onClick={() => pick(it.key)}
          >
            <span className="room-spot-dot" />
          </button>
        ))}
      </div>
      <div className="room-pin" ref={pinRef} aria-hidden="true">
        {pinItem && (
          <span className="room-pin-text">
            <span className="room-pin-kind mono">{pinItem.group === "samples" ? "Work sample" : pinItem.kind.split(" · ").pop()}</span>
            <span>{pinItem.label}</span>
          </span>
        )}
      </div>

      <div className="room-col" ref={colRef}>
        <nav className="room-nav" aria-label="Site">
          <ul>
            <li>
              <Link href="/writing">Writing</Link>
            </li>
            <li>
              <a href={linkedin} target="_blank" rel="noopener noreferrer">
                LinkedIn
              </a>
            </li>
            <li>
              <a href={`mailto:${contactEmail}`}>Contact</a>
            </li>
          </ul>
        </nav>

        <main id="main" className="room-main">
          <header className="room-intro">
            <h1>{name}</h1>
            <p className="room-role mono">{role}</p>
            <p className="room-line">{intro}</p>
          </header>

          <section aria-labelledby="room-samples-h">
            <h2 className="room-h mono" id="room-samples-h">
              Work samples
            </h2>
            <ul className="room-items">
              {samples.map((it) => (
                <li key={it.key}>
                  {it.linkType === "internal" ? (
                    <Link href={it.href} {...rowProps(it)}>
                      {rowBody(it)}
                    </Link>
                  ) : (
                    <a href={it.href} type={it.linkType === "pdf" ? "application/pdf" : undefined} {...rowProps(it)}>
                      {rowBody(it)}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="room-products-h">
            <h2 className="room-h mono" id="room-products-h">
              {productsHeading}
            </h2>
            <ul className="room-items room-products">
              {products.map((it, i) => (
                <li key={it.key}>
                  <a
                    href={it.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-haspopup={enhanced ? "dialog" : undefined}
                    onClick={(e) => {
                      if (!plainClick(e)) return;
                      e.preventDefault();
                      dispatchSel({ type: "open", key: it.key });
                    }}
                    {...rowProps(it)}
                  >
                    {rowBody(it, i + 1)}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </main>

        <footer className="room-foot">
          <ul>
            <li>
              <a href={`mailto:${contactEmail}`}>Contact me</a>
            </li>
            <li>
              <a href={linkedin} target="_blank" rel="noopener noreferrer">
                LinkedIn
              </a>
            </li>
            {github && (
              <li>
                <a href={github} target="_blank" rel="noopener noreferrer">
                  GitHub
                </a>
              </li>
            )}
            <li>
              <Link href="/writing/rss.xml">RSS</Link>
            </li>
          </ul>
          <div className="room-foot-row">
            <span>
              © {year} {name}
            </span>
            {/* Always offered: the recordings move on their own even when the
                room cannot (picture mode). Hidden under reduced motion by CSS. */}
            <MotionToggle className="room-toggle" />
          </div>
          {status.kind === "live" && time && (
            <p className="room-caption mono">
              Yonmoku&rsquo;s room · {TIME_NAMES[time]} at your local time · Drag to look around
            </p>
          )}
          <output className="room-meter" ref={meterRef} hidden={!debug} />
        </footer>
      </div>

      {openItem && (
        <aside className="room-panel" role="dialog" aria-modal="false" aria-labelledby="room-panel-h">
          <div className="room-panel-head">
            <p className="mono">{openItem.kind}</p>
            <button type="button" className="room-close" ref={closeRef} onClick={close}>
              Close
            </button>
          </div>
          <h2 id="room-panel-h">{openItem.title}</h2>
          {openItem.loop && (
            <div className="room-panel-media">
              <VideoLoop key={openItem.key} loop={openItem.loop} className="room-loop" href={openItem.href} />
            </div>
          )}
          <p className="room-panel-line">{openItem.line}</p>
          <p className="room-panel-actions">
            {openItem.linkType === "internal" ? (
              <Link href={openItem.href} className="btn">
                {openItem.cta}
              </Link>
            ) : (
              <a
                href={openItem.href}
                className="btn"
                {...(openItem.linkType === "external" ? { target: "_blank", rel: "noopener noreferrer" } : { type: "application/pdf" })}
              >
                {openItem.cta}
              </a>
            )}
          </p>
        </aside>
      )}
    </div>
  );
}
