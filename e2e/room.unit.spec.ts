// Unit tests for the room's runtime rules that a browser test cannot pin down
// on every machine: in CI WebGL is drawn by the CPU, which caps the frame rate
// on its own, so the rate rule is checked here directly.
import { test, expect } from "@playwright/test";
import { frameBudget } from "../lib/room/stage";
import { blendTime, phaseAt } from "../lib/room/scene";

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
});

test.describe("the light", () => {
  test("follows the clock: day, dusk and night, with the picture's hand-offs at 17:30 and 19:30", () => {
    const at = (h: number, m = 0) => blendTime(phaseAt(new Date(2026, 0, 1, h, m))).name;
    // app/page.tsx picks the room's picture by the same rule before first paint.
    expect([at(12), at(17, 29), at(17, 31), at(19, 29), at(19, 31), at(3), at(5, 59), at(6, 1)]).toEqual([
      "day", "day", "dusk", "dusk", "night", "night", "night", "day",
    ]);
  });
});
