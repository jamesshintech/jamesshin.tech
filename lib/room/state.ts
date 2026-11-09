// The home page's state machines, written down: each is one value with named
// states and a transition function, so every combination the page can be in
// is listed here and nowhere else, and each can be tested without a browser.
// No three.js here: this module is in the page's first load.

export type RoomKey = "essay" | "proposal" | "board" | "phone" | "weeks" | "map";
export type TimeName = "day" | "dusk" | "night";

// ─── The room's lifecycle ───────────────────────────────────────────────
// waiting: the picture shows; the room has not been asked for yet.
// loading: three.js, the textures and the shaders are on their way.
// live:    the room has drawn its first frame and answers input.
// picture: the room will not run in this visit; the picture stays. Final.
export type PictureReason = "save-data" | "no-webgl" | "software-webgl" | "error" | "context-lost";
export type RoomStatus =
  | { kind: "waiting" }
  | { kind: "loading" }
  | { kind: "live" }
  | { kind: "picture"; why: PictureReason };

export type RoomEvent =
  | { type: "start" }
  | { type: "unavailable"; why: "save-data" | "no-webgl" | "software-webgl" }
  | { type: "first-frame" }
  | { type: "failed" }
  | { type: "lost" };

export function roomStatus(s: RoomStatus, e: RoomEvent): RoomStatus {
  switch (s.kind) {
    case "waiting":
      if (e.type === "start") return { kind: "loading" };
      if (e.type === "unavailable") return { kind: "picture", why: e.why };
      return s;
    case "loading":
      if (e.type === "first-frame") return { kind: "live" };
      if (e.type === "failed") return { kind: "picture", why: "error" };
      if (e.type === "lost") return { kind: "picture", why: "context-lost" };
      return s;
    case "live":
      if (e.type === "lost") return { kind: "picture", why: "context-lost" };
      return s;
    case "picture":
      return s;
  }
}

// ─── What the reader is looking at ──────────────────────────────────────
// Pointer hover and keyboard focus are kept apart (a mouse passing over one
// row must not take the highlight from the row that has focus). A panel is
// closed, pending (the board's bead is falling; the panel opens when it
// lands) or open. Choosing anything else, or closing, cancels a pending one.
export type Source = "row" | "spot";
export type Panel = { kind: "closed" } | { kind: "pending"; key: RoomKey; token: number } | { kind: "open"; key: RoomKey };
export type Selection = {
  hover: { key: RoomKey; from: Source } | null;
  focus: RoomKey | null;
  panel: Panel;
};
export const NO_SELECTION: Selection = { hover: null, focus: null, panel: { kind: "closed" } };

export type SelectionEvent =
  | { type: "hover"; key: RoomKey; from: Source }
  | { type: "unhover"; key: RoomKey }
  | { type: "focus"; key: RoomKey }
  | { type: "blur"; key: RoomKey }
  | { type: "pick"; key: RoomKey; token: number }
  | { type: "settle"; token: number }
  | { type: "open"; key: RoomKey }
  | { type: "close" };

export function selection(s: Selection, e: SelectionEvent): Selection {
  switch (e.type) {
    case "hover":
      return { ...s, hover: { key: e.key, from: e.from } };
    case "unhover":
      return s.hover?.key === e.key ? { ...s, hover: null } : s;
    case "focus":
      return { ...s, focus: e.key };
    case "blur":
      return s.focus === e.key ? { ...s, focus: null } : s;
    case "pick":
      return { ...s, panel: { kind: "pending", key: e.key, token: e.token } };
    case "settle":
      // Only the pick that is still pending may open; a later choice or a
      // close has already replaced it.
      return s.panel.kind === "pending" && s.panel.token === e.token ? { ...s, panel: { kind: "open", key: s.panel.key } } : s;
    case "open":
      return { ...s, panel: { kind: "open", key: e.key } };
    case "close":
      return s.panel.kind === "closed" ? s : { ...s, panel: { kind: "closed" } };
  }
}

/** The item lit in the room, and whether the view should turn to it. An open or pending panel wins, then keyboard focus, then the pointer. A hotspot under the pointer is already in view, so it does not turn the view (which would slide the dot out from under the cursor). */
export function activeOf(s: Selection): { key: RoomKey; turn: boolean } | null {
  if (s.panel.kind !== "closed") return { key: s.panel.key, turn: true };
  if (s.focus) return { key: s.focus, turn: true };
  if (s.hover) return { key: s.hover.key, turn: s.hover.from === "row" };
  return null;
}

// ─── The light ───────────────────────────────────────────────────────────
// Local clock to phase: day until 16:30, dusk by 18:30, night by 20:30,
// dawn from 05:00 to 07:00. Phase 0 is day, 1 dusk, 2 night, 3 day again.
export function phaseAt(date: Date = new Date()): number {
  const h = date.getHours() + date.getMinutes() / 60;
  if (h >= 7 && h < 16.5) return 0;
  if (h >= 16.5 && h < 18.5) return (h - 16.5) / 2;
  if (h >= 18.5 && h < 20.5) return 1 + (h - 18.5) / 2;
  if (h >= 20.5 || h < 5) return 2;
  return 2 + (h - 5) / 2;
}

/** The nearest of the three lights to a phase. */
export function timeNameOf(phase: number): TimeName {
  const seq: TimeName[] = ["day", "dusk", "night", "day"];
  const p = ((phase % 3) + 3) % 3;
  const i = Math.min(2, Math.floor(p));
  return p - i < 0.5 ? seq[i] : seq[i + 1];
}

/** The phase the page should show: `?time=day|dusk|night` or `?hour=18.5` pin it (for testing and pictures); otherwise the visitor's clock. The inline script in app/layout.tsx applies the same rule to `?time=` and the clock before first paint. */
export function chosenPhase(search: string, now: Date = new Date()): number {
  const q = new URLSearchParams(search);
  const named = ({ day: 0, dusk: 1, night: 2 } as Record<string, number>)[q.get("time") ?? ""];
  if (named !== undefined) return named;
  const hour = Number(q.get("hour"));
  if (q.has("hour") && q.get("hour") !== "" && hour >= 0 && hour < 24) {
    return phaseAt(new Date(2026, 0, 1, Math.floor(hour), Math.round((hour % 1) * 60)));
  }
  return phaseAt(now);
}

// ─── Layout ──────────────────────────────────────────────────────────────
/** Desktop layout: the column beside the room. globals.css writes the phone layout as `(width < 900px)`, which compiles to `not all and (min-width: 900px)`: the exact complement, so no width (zoom gives fractional ones) is both or neither. Plain `min-width` here, because older Safari has no range syntax in matchMedia. */
export const WIDE_QUERY = "(min-width: 900px)";
