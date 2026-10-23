// Pure rules for one round of Squeeze, kept free of React so they can be
// unit-tested. Mirrors the shipped game: a window either traps the answer
// (the placer wins) or misses it (the forcer wins).

export type Window = [number, number];

export interface RoundResult {
  inside: boolean;
  /** Distance from the answer to the nearest edge of the window. */
  margin: number;
  /** "Inside by 40" / "Missed by 2.1 million", without the unit. */
  story: string;
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

export function scoreRound(window: Window, answer: number): RoundResult {
  const lo = Math.min(window[0], window[1]);
  const hi = Math.max(window[0], window[1]);
  if (answer >= lo && answer <= hi) {
    const margin = Math.min(answer - lo, hi - answer);
    return { inside: true, margin, story: `Inside by ${formatNumber(margin)}` };
  }
  const margin = answer < lo ? lo - answer : answer - hi;
  return { inside: false, margin, story: `Missed by ${formatNumber(margin)}` };
}

/** Log-scale helpers for the number line. */
export const LINE_MIN = 1;
export const LINE_MAX = 1e10;

export function toPos(value: number): number {
  const v = Math.min(LINE_MAX, Math.max(LINE_MIN, value));
  return Math.log10(v) / Math.log10(LINE_MAX);
}

export function fromPos(p: number): number {
  const c = Math.min(1, Math.max(0, p));
  return Math.pow(10, c * Math.log10(LINE_MAX));
}

/**
 * The width of a window as a ratio hi/lo (log-scale width). The shipped
 * game speaks in absolute widths; on a log line a ratio is the honest
 * equivalent across answers from 10 to 10 billion.
 */
export function windowFromCenter(center: number, ratio: number): Window {
  const half = Math.sqrt(ratio);
  return [Math.max(LINE_MIN, center / half), Math.min(LINE_MAX, center * half)];
}

/** The rival forces when the window is still wide. Ratio 20 = "2 orders of magnitude, nearly". */
export const RIVAL_FORCE_RATIO = 20;

export function rivalForces(ratio: number): boolean {
  return ratio > RIVAL_FORCE_RATIO;
}

/** Round a number to two significant figures for display on the line. */
export function round2sf(n: number): number {
  if (n === 0) return 0;
  return Number(n.toPrecision(2));
}
