import { describe, expect, test } from "bun:test";
import { formatNumber, fromPos, rivalForces, round2sf, scoreRound, toPos, windowFromCenter } from "./squeezeLogic";

describe("scoreRound", () => {
  test("answer inside the window wins with the margin to the nearest edge", () => {
    const r = scoreRound([1800, 2600], 2190);
    expect(r.inside).toBe(true);
    expect(r.margin).toBe(390);
    expect(r.story).toBe("Inside by 390");
  });

  test("answer below the window misses by the distance to the low edge", () => {
    const r = scoreRound([1800, 2600], 1000);
    expect(r.inside).toBe(false);
    expect(r.margin).toBe(800);
    expect(r.story).toBe("Missed by 800");
  });

  test("answer above the window misses by the distance to the high edge", () => {
    const r = scoreRound([1000, 2000], 4_100_000);
    expect(r.inside).toBe(false);
    expect(r.margin).toBe(4_098_000);
    expect(r.story).toBe("Missed by 4.1 million");
  });

  test("the edges are inside", () => {
    expect(scoreRound([10, 20], 10).inside).toBe(true);
    expect(scoreRound([10, 20], 20).inside).toBe(true);
    expect(scoreRound([10, 20], 10).margin).toBe(0);
  });

  test("a reversed window is normalised", () => {
    expect(scoreRound([20, 10], 15).inside).toBe(true);
  });

  test("a zero-width window only traps an exact answer", () => {
    expect(scoreRound([42, 42], 42).inside).toBe(true);
    expect(scoreRound([42, 42], 43).inside).toBe(false);
  });
});

describe("formatNumber", () => {
  test("compacts large numbers", () => {
    expect(formatNumber(2_100_000)).toBe("2.1 million");
    expect(formatNumber(7_500_000_000)).toBe("7.5 billion");
    expect(formatNumber(29_032)).toBe("29,032");
    expect(formatNumber(1_000_000)).toBe("1 million");
  });
  test("keeps small numbers readable", () => {
    expect(formatNumber(390)).toBe("390");
    expect(formatNumber(14.5)).toBe("14.5");
    expect(formatNumber(3.14159)).toBe("3.14");
  });
});

describe("number line", () => {
  test("toPos and fromPos invert each other on the log scale", () => {
    for (const v of [1, 10, 2190, 1e6, 1e10]) {
      expect(fromPos(toPos(v))).toBeCloseTo(v, 6);
    }
  });
  test("positions are clamped to the line", () => {
    expect(toPos(0.001)).toBe(0);
    expect(toPos(1e12)).toBe(1);
    expect(fromPos(-1)).toBe(1);
  });
  test("windowFromCenter is symmetric in log space", () => {
    const [lo, hi] = windowFromCenter(1000, 100);
    expect(lo).toBeCloseTo(100, 6);
    expect(hi).toBeCloseTo(10_000, 6);
  });
  test("the rival forces only wide windows", () => {
    expect(rivalForces(100)).toBe(true);
    expect(rivalForces(5)).toBe(false);
  });
  test("round2sf keeps two significant figures", () => {
    expect(round2sf(2190)).toBe(2200);
    expect(round2sf(0.0456)).toBe(0.046);
    expect(round2sf(7_482_000)).toBe(7_500_000);
  });
});
