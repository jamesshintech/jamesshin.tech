// Pure rules for one round of Squeeze 2.0, kept free of React so they can
// be unit-tested. Mirrors the shipped game: you bet how close you can get
// ("±300"), your window is your guess ± your claim, and a forcer who calls
// the bluff bets the answer lands outside it, above or below.

export type Window = [number, number];
export type Side = "above" | "below";
export type Winner = "you" | "rival" | "none";

export interface RoundResult {
  inside: boolean;
  /** Distance from the answer to the nearest edge of the window. */
  margin: number;
  /** "Inside by 40" / "Missed by 2.1 million", without the unit. */
  story: string;
  winner: Winner;
}

/** Compact number: 1,234 → "1,234"; 2,100,000 → "2.1 million". */
export function formatNumber(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e9) return trim(n / 1e9) + " billion";
  if (abs >= 1e6) return trim(n / 1e6) + " million";
  if (abs >= 1e4) return Math.round(n).toLocaleString("en-US");
  if (abs >= 100) return Math.round(n).toLocaleString("en-US");
  if (abs >= 10) return trim(n, 1);
  return trim(n, 2);
}

function trim(n: number, decimals = 1): string {
  const s = n.toFixed(decimals);
  return s.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
}

/** The window a claim makes: guess ± claim, never below zero. */
export function windowFromClaim(guess: number, claim: number): Window {
  const c = Math.abs(claim);
  return [Math.max(0, guess - c), guess + c];
}

/**
 * Score a round. Unforced (the rival conceded): inside wins, outside loses.
 * Forced: the forcer also called a side; outside on that side is the
 * forcer's, outside on the other side scores nobody.
 */
export function scoreRound(window: Window, answer: number, called: Side | null = null): RoundResult {
  const lo = Math.min(window[0], window[1]);
  const hi = Math.max(window[0], window[1]);
  if (answer >= lo && answer <= hi) {
    const margin = Math.min(answer - lo, hi - answer);
    return { inside: true, margin, story: `Inside by ${formatNumber(margin)}`, winner: "you" };
  }
  const below = answer < lo;
  const margin = below ? lo - answer : answer - hi;
  const story = `Missed by ${formatNumber(margin)}`;
  if (called === null) return { inside: false, margin, story, winner: "rival" };
  const landedOnCalledSide = (called === "below" && below) || (called === "above" && !below);
  return { inside: false, margin, story, winner: landedOnCalledSide ? "rival" : "none" };
}

/** Log-scale helpers for the number line (0 is drawn at the left edge). */
export const LINE_MIN = 1;
export const LINE_MAX = 1e10;

export function toPos(value: number): number {
  if (value < LINE_MIN) return 0;
  const v = Math.min(LINE_MAX, value);
  return Math.log10(v) / Math.log10(LINE_MAX);
}

export function fromPos(p: number): number {
  const c = Math.min(1, Math.max(0, p));
  return Math.pow(10, c * Math.log10(LINE_MAX));
}

/**
 * The claim as a share of the guess. The game lets you type any number;
 * the sketch offers a slider from ±2% to ±200% of the guess.
 */
export const CLAIM_PCT_MIN = 2;
export const CLAIM_PCT_MAX = 200;
export const CLAIM_PCT_START = 60;

export function claimFromPercent(guess: number, pct: number): number {
  return round2sf((guess * pct) / 100);
}

/** The rival calls the bluff when the claim is still wide: more than ±50% of the guess. */
export const RIVAL_FORCE_PCT = 50;

export function rivalForces(pct: number): boolean {
  return pct > RIVAL_FORCE_PCT;
}

/** Which side the rival calls when forcing. Deterministic per question so server and client agree. */
export function rivalSide(questionIndex: number): Side {
  return questionIndex % 2 === 0 ? "above" : "below";
}

/** Round a number to two significant figures for display on the line. */
export function round2sf(n: number): number {
  if (n === 0) return 0;
  return Number(n.toPrecision(2));
}
