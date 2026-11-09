"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type MouseEvent } from "react";
import type { Loop } from "@/data/projects";
import type { RoomHandle, RoomKey, TimeName } from "@/lib/room/runner";
import { savesData, webglSupport } from "@/lib/room/support";
import { isMotionPaused, subscribeMotion } from "@/lib/motion";
import { VideoLoop } from "@/components/story/VideoLoop";
import { MotionToggle } from "@/components/home/MotionToggle";

// The home page: the Yonmoku room fills the screen, and a column carries
// everything a reader needs. Every item is a row in the column and an object
// in the room; a product's row or object opens a panel with its recording,
// and a work sample's row goes straight to the document. The column is
// server-rendered and complete without JavaScript (every row is a real
// link); the room loads after the page is idle, from its own chunk, and
// until its first frame the room is a picture of itself. Where the room would
// strain the device (WebGL drawn by the CPU) or was asked not to load
// (Save-Data), it stays that picture.

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

type State = "poster" | "live" | "picture";
const TIME_NAMES: Record<TimeName, string> = { day: "Daylight", dusk: "Dusk", night: "Night" };
const pad2 = (n: number) => String(n).padStart(2, "0");

const plainClick = (e: MouseEvent) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

export function StudyHome({ name, role, intro, items, productsHeading, contactEmail, linkedin, github, year }: Props) {
  const [state, setState] = useState<State>("poster");
  const [time, setTime] = useState<TimeName | null>(null);
  const [hovered, setHovered] = useState<RoomKey | null>(null);
  const [openKey, setOpenKey] = useState<RoomKey | null>(null);
  const [debug, setDebug] = useState(false);
  const [enhanced, setEnhanced] = useState(false);
  const paused = useSyncExternalStore(subscribeMotion, isMotionPaused, () => false);

  const hostRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const colRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const meterRef = useRef<HTMLOutputElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const spotRefs = useRef(new Map<RoomKey, HTMLElement>());
  const rowRefs = useRef(new Map<RoomKey, HTMLElement>());
  const handleRef = useRef<RoomHandle | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const pickTimer = useRef(0);

  const active = openKey ?? hovered;
  const activeRef = useRef(active);
  activeRef.current = active;
  const openRef = useRef(openKey);
  openRef.current = openKey;

  // Start the room once the page is idle, so the column is interactive
  // first. Under Save-Data, without WebGL 2, with WebGL drawn by the CPU, or
  // if anything fails, the room stays a picture and the page loses nothing
  // else. A forced tier (?q=low|high, for testing) runs it on any WebGL 2.
  useEffect(() => {
    setEnhanced(true);
    const params = new URLSearchParams(location.search);
    const isDebug = params.get("debug") === "1";
    const forced = params.get("q") === "low" || params.get("q") === "high";
    setDebug(isDebug);
    const gl = webglSupport();
    if (savesData() || gl === "none" || (gl === "software" && !forced)) {
      setState("picture");
      return;
    }
    const ac = new AbortController();
    let handle: RoomHandle | null = null;
    const begin = () => {
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
            still: isMotionPaused(),
            signal: ac.signal,
            onFirstFrame: () => setState("live"),
            onTime: setTime,
            onLost: () => setState("picture"),
          });
        })
        .then((h) => {
          if (!h) return;
          if (ac.signal.aborted) return h.dispose();
          handle = h;
          handleRef.current = h;
          h.setActive(activeRef.current);
          h.setPanel(openRef.current !== null);
        })
        .catch((err: unknown) => {
          if (ac.signal.aborted) return;
          console.warn("The room could not start; showing its picture instead.", err);
          setState("picture");
        });
    };
    const idle = window.requestIdleCallback ? window.requestIdleCallback(begin, { timeout: 1500 }) : window.setTimeout(begin, 200);
    return () => {
      ac.abort();
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      window.clearTimeout(pickTimer.current);
      handle?.dispose();
      handleRef.current = null;
    };
  }, []);

  useEffect(() => {
    handleRef.current?.setActive(active);
  }, [active]);

  useEffect(() => {
    handleRef.current?.setStill(paused);
  }, [paused]);

  useEffect(() => {
    handleRef.current?.setPanel(openKey !== null);
  }, [openKey]);

  const open = useCallback((key: RoomKey, from: HTMLElement | null) => {
    openerRef.current = from;
    setOpenKey(key);
  }, []);

  const close = useCallback(() => {
    setOpenKey(null);
    // The opener is the row, also when the object was clicked: the room's
    // hotspots are pointer shortcuts, hidden from assistive technology.
    openerRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!openKey) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openKey, close]);

  const pick = (key: RoomKey) => {
    const delay = handleRef.current?.pick(key) ?? 0;
    window.clearTimeout(pickTimer.current);
    pickTimer.current = window.setTimeout(() => open(key, rowRefs.current.get(key) ?? null), delay);
  };

  const samples = items.filter((i) => i.group === "samples");
  const products = items.filter((i) => i.group === "products");
  const openItem = items.find((i) => i.key === openKey) ?? null;
  // While a panel is open it names the item; the label would only sit under it.
  const pinItem = openKey ? null : (items.find((i) => i.key === active) ?? null);

  const rowProps = (it: RoomItem) => ({
    className: `room-item${active === it.key ? " is-active" : ""}`,
    "data-key": it.key,
    ref: (el: HTMLAnchorElement | null) => {
      if (el) rowRefs.current.set(it.key, el);
      else rowRefs.current.delete(it.key);
    },
    onPointerEnter: () => setHovered(it.key),
    onPointerLeave: () => setHovered((k) => (k === it.key ? null : k)),
    onFocus: () => setHovered(it.key),
    onBlur: () => setHovered((k) => (k === it.key ? null : k)),
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
    <div className="room" data-state={state} data-debug={debug ? "" : undefined}>
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
            className={`room-spot${active === it.key ? " is-active" : ""}`}
            data-key={it.key}
            tabIndex={-1}
            aria-hidden="true"
            ref={(el) => {
              if (el) spotRefs.current.set(it.key, el);
              else spotRefs.current.delete(it.key);
            }}
            onPointerEnter={() => setHovered(it.key)}
            onPointerLeave={() => setHovered((k) => (k === it.key ? null : k))}
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
                      open(it.key, e.currentTarget);
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
            {state === "live" && <MotionToggle className="room-toggle" />}
          </div>
          {state === "live" && time && (
            <p className="room-caption mono">
              Yonmoku&rsquo;s room · {TIME_NAMES[time]} at your local time · Drag to look around
            </p>
          )}
          <output className="room-meter" ref={meterRef} hidden={!debug} />
        </footer>
      </div>

      {/* On phones the panel is a sheet; the page behind it dims, and a tap there closes it. */}
      {openItem && <div className="room-scrim" aria-hidden="true" onClick={close} />}
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
