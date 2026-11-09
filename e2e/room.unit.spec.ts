// Unit tests for the room's state machines and runtime rules: everything a
// browser test cannot pin down on every machine (in CI WebGL is drawn by the
// CPU, which caps the frame rate by itself) or would only reach by chance.
import { test, expect } from "@playwright/test";
import { frameBudget, isSlowFrame, qualitySteps } from "../lib/room/stage";
import { BEAD_SETTLES, beadLift, blendTime } from "../lib/room/scene";
import { NO_SELECTION, activeOf, chosenPhase, phaseAt, roomStatus, selection, timeNameOf, type RoomStatus, type RoomEvent } from "../lib/room/state";

test.describe("frameBudget", () => {
  test("at rest the room draws 30 frames a second on every tier", () => {
    expect(frameBudget(10_000, 0, 60)).toBeCloseTo(1000 / 30);
    expect(frameBudget(10_000, 9_999, 60)).toBeCloseTo(1000 / 30);
    expect(frameBudget(10_000, 0, 30)).toBeCloseTo(1000 / 30);
  });

  test("just after the visitor does something it runs at the tier's full rate", () => {
    expect(frameBudget(10_000, 12_500, 60)).toBeCloseTo(1000 / 60);
    // The low tier never goes above 30.
    expect(frameBudget(10_000, 12_500, 30)).toBeCloseTo(1000 / 30);
  });

  test("the debug meter calls a frame slow against the rate it is aiming for, not always 60", () => {
    expect(isSlowFrame(34, 1000 / 30)).toBe(false); // a normal frame at rest
    expect(isSlowFrame(60, 1000 / 30)).toBe(true);
    expect(isSlowFrame(30, 1000 / 60)).toBe(true);
  });

  test("resolution steps down from the tier's cap and never above it", () => {
    expect(qualitySteps(2)).toEqual([2, 1.6, 1.4, 1.15, 1]);
    expect(qualitySteps(1.8)).toEqual([1.8, 1.6, 1.4, 1.15, 1]);
    expect(qualitySteps(1.4)).toEqual([1.4, 1.15, 1]);
    expect(qualitySteps(1)).toEqual([1]);
  });
});

test.describe("the light", () => {
  test("follows the clock: day, dusk and night, with the picture's hand-offs at 17:30 and 19:30", () => {
    const at = (h: number, m = 0) => timeNameOf(phaseAt(new Date(2026, 0, 1, h, m)));
    // app/layout.tsx picks the room's picture by the same rule before first paint.
    expect([at(12), at(17, 29), at(17, 31), at(19, 29), at(19, 31), at(3), at(5, 59), at(6, 1)]).toEqual([
      "day", "day", "dusk", "dusk", "night", "night", "night", "day",
    ]);
  });

  test("the page's name for the light is the room's own", () => {
    for (let p = 0; p < 3; p += 0.05) expect(timeNameOf(p), `phase ${p.toFixed(2)}`).toBe(blendTime(p).name);
  });

  test("?time= and ?hour= pin it; anything else follows the clock", () => {
    const noon = new Date(2026, 0, 1, 12, 0);
    expect(chosenPhase("?time=night", noon)).toBe(2);
    expect(chosenPhase("?time=dusk&debug=1", noon)).toBe(1);
    expect(timeNameOf(chosenPhase("?hour=18.5", noon))).toBe("dusk");
    expect(chosenPhase("?hour=", noon)).toBe(0);
    expect(chosenPhase("?hour=99", noon)).toBe(0);
    expect(chosenPhase("", noon)).toBe(0);
  });
});

test.describe("the room's lifecycle", () => {
  const events: RoomEvent[] = [
    { type: "start" },
    { type: "unavailable", why: "software-webgl" },
    { type: "first-frame" },
    { type: "failed" },
    { type: "lost" },
  ];
  const run = (...es: RoomEvent[]) => es.reduce<RoomStatus>(roomStatus, { kind: "waiting" });

  test("waiting, loading, live; a picture when it cannot run, fails or loses its GPU", () => {
    expect(run({ type: "start" }, { type: "first-frame" })).toEqual({ kind: "live" });
    expect(run({ type: "unavailable", why: "save-data" })).toEqual({ kind: "picture", why: "save-data" });
    expect(run({ type: "start" }, { type: "failed" })).toEqual({ kind: "picture", why: "error" });
    expect(run({ type: "start" }, { type: "lost" })).toEqual({ kind: "picture", why: "context-lost" });
    expect(run({ type: "start" }, { type: "first-frame" }, { type: "lost" })).toEqual({ kind: "picture", why: "context-lost" });
  });

  test("the picture is final, and no event skips a state", () => {
    for (const e of events) expect(roomStatus({ kind: "picture", why: "error" }, e)).toEqual({ kind: "picture", why: "error" });
    // A first frame before loading, or loading again once live, changes nothing.
    expect(run({ type: "first-frame" })).toEqual({ kind: "waiting" });
    expect(run({ type: "start" }, { type: "first-frame" }, { type: "start" }, { type: "failed" })).toEqual({ kind: "live" });
  });
});

test.describe("what the reader is looking at", () => {
  test("a pending pick is cancelled by any later choice or by closing", () => {
    let s = selection(NO_SELECTION, { type: "pick", key: "board", token: 1 });
    expect(s.panel).toEqual({ kind: "pending", key: "board", token: 1 });
    // A row chosen while the bead falls wins; the old pick's timer can no longer open the board.
    s = selection(s, { type: "open", key: "phone" });
    s = selection(s, { type: "settle", token: 1 });
    expect(s.panel).toEqual({ kind: "open", key: "phone" });
    // Escape while pending: nothing opens later.
    let t = selection(NO_SELECTION, { type: "pick", key: "board", token: 2 });
    t = selection(t, { type: "close" });
    t = selection(t, { type: "settle", token: 2 });
    expect(t.panel).toEqual({ kind: "closed" });
    // The pick that is still pending opens.
    const u = selection(selection(NO_SELECTION, { type: "pick", key: "board", token: 3 }), { type: "settle", token: 3 });
    expect(u.panel).toEqual({ kind: "open", key: "board" });
  });

  test("keyboard focus and pointer hover are separate; focus outranks hover, a panel outranks both", () => {
    let s = selection(NO_SELECTION, { type: "focus", key: "essay" });
    s = selection(s, { type: "hover", key: "map", from: "row" });
    expect(activeOf(s)).toEqual({ key: "essay", turn: true });
    s = selection(s, { type: "unhover", key: "map" });
    expect(activeOf(s)).toEqual({ key: "essay", turn: true });
    s = selection(s, { type: "open", key: "phone" });
    expect(activeOf(s)).toEqual({ key: "phone", turn: true });
    // Leaving a different key does not clear the hover.
    const h = selection(selection(NO_SELECTION, { type: "hover", key: "weeks", from: "row" }), { type: "unhover", key: "map" });
    expect(activeOf(h)?.key).toBe("weeks");
  });

  test("a hotspot under the pointer lights its object without turning the view; a row turns it", () => {
    expect(activeOf(selection(NO_SELECTION, { type: "hover", key: "phone", from: "spot" }))).toEqual({ key: "phone", turn: false });
    expect(activeOf(selection(NO_SELECTION, { type: "hover", key: "phone", from: "row" }))).toEqual({ key: "phone", turn: true });
    expect(activeOf(NO_SELECTION)).toBeNull();
  });
});

test.describe("the falling bead", () => {
  test("falls, bounces twice lower each time, then rests for good", () => {
    expect(beadLift(0).lift).toBeGreaterThan(0.2);
    expect(beadLift(0).settled).toBe(false);
    const samples = Array.from({ length: 200 }, (_, i) => beadLift((i / 200) * BEAD_SETTLES).lift);
    expect(Math.min(...samples)).toBeGreaterThanOrEqual(0);
    // Two bounces: the height comes down to the peg and rises again twice
    // (two valleys at the peg before it settles), each rise lower.
    const valleys: number[] = [];
    for (let i = 1; i < samples.length - 1; i++) if (samples[i] <= samples[i - 1] && samples[i] < samples[i + 1] && samples[i] < 0.003) valleys.push(i);
    expect(valleys).toHaveLength(2);
    const peak = (a: number, b: number) => Math.max(...samples.slice(a, b));
    expect(peak(valleys[0], valleys[1])).toBeGreaterThan(peak(valleys[1], samples.length));
    expect(beadLift(BEAD_SETTLES)).toEqual({ lift: 0, settled: true });
    expect(beadLift(10)).toEqual({ lift: 0, settled: true });
  });
});
