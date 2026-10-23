"use client";

import { useCallback, useMemo, useState } from "react";
import facts from "@/data/squeeze-facts.json";
import styles from "./SqueezeRound.module.css";
import {
  CLAIM_PCT_MAX,
  CLAIM_PCT_MIN,
  CLAIM_PCT_START,
  LINE_MAX,
  claimFromPercent,
  formatNumber,
  rivalForces,
  rivalSide,
  round2sf,
  scoreRound,
  toPos,
  windowFromClaim,
  type RoundResult,
  type Side,
  type Window,
} from "./squeezeLogic";

// One round of Squeeze 2.0 in the browser. You are the fox; the dog is your
// rival. Bet how close you can get (a ±claim around your guess), squeeze it
// tighter, or lock it in. The dog calls the bluff on wide claims and bets
// the answer lands outside, above or below. Renders a fixed first question
// on the server; the shuffle starts on the first "Next question".

interface Fact {
  prompt: string;
  answer: number;
  unit: string;
  display: string;
  category: string;
}

const FACTS = facts as Fact[];
const TICKS = [1, 10, 100, 1_000, 10_000, 100_000, 1_000_000, 10_000_000, 100_000_000, 1_000_000_000, LINE_MAX];
const TICK_LABELS = ["1", "10", "100", "1k", "10k", "100k", "1M", "10M", "100M", "1B", "10B"];

type Phase = "claim" | "revealed";

export interface SqueezeRoundProps {
  /** Index of the first question, so the server and client agree. */
  initialIndex?: number;
}

function pctToSlider(pct: number): number {
  return Math.round(((Math.log10(pct) - Math.log10(CLAIM_PCT_MIN)) / (Math.log10(CLAIM_PCT_MAX) - Math.log10(CLAIM_PCT_MIN))) * 1000);
}

function sliderToPct(v: number): number {
  const p = v / 1000;
  return Math.pow(10, Math.log10(CLAIM_PCT_MIN) + p * (Math.log10(CLAIM_PCT_MAX) - Math.log10(CLAIM_PCT_MIN)));
}

export function SqueezeRound({ initialIndex = 0 }: SqueezeRoundProps) {
  const [index, setIndex] = useState(initialIndex % FACTS.length);
  const fact = FACTS[index];
  const [guessPos, setGuessPos] = useState(0.5);
  const [pct, setPct] = useState(CLAIM_PCT_START);
  const [phase, setPhase] = useState<Phase>("claim");
  const [result, setResult] = useState<RoundResult | null>(null);
  const [called, setCalled] = useState<Side | null>(null);
  const [score, setScore] = useState({ you: 0, rival: 0 });

  const guess = useMemo(() => round2sf(Math.pow(10, guessPos * Math.log10(LINE_MAX))), [guessPos]);
  const claim = useMemo(() => claimFromPercent(guess, pct), [guess, pct]);
  const window = useMemo<Window>(() => windowFromClaim(guess, claim), [guess, claim]);

  const lock = useCallback(() => {
    const r = scoreRound(window, fact.answer, called);
    setResult(r);
    setPhase("revealed");
    setScore((s) => (r.winner === "you" ? { ...s, you: s.you + 1 } : r.winner === "rival" ? { ...s, rival: s.rival + 1 } : s));
  }, [window, fact.answer, called]);

  const squeeze = useCallback(() => {
    // Squeezing halves the claim. If it is still wide, the dog calls the
    // bluff and names a side; the window is then placed as it stands.
    const next = Math.max(CLAIM_PCT_MIN, pct / 2);
    setPct(next);
    if (rivalForces(next)) setCalled(rivalSide(index));
  }, [pct, index]);

  const nextQuestion = useCallback(() => {
    setIndex((i) => (i + 1) % FACTS.length);
    setGuessPos(0.5);
    setPct(CLAIM_PCT_START);
    setPhase("claim");
    setResult(null);
    setCalled(null);
  }, []);

  const left = toPos(window[0]) * 100;
  const width = Math.max(0.6, (toPos(window[1]) - toPos(window[0])) * 100);
  const answerPos = toPos(fact.answer) * 100;
  const unit = fact.unit ? ` ${fact.unit}` : "";

  return (
    <div className={styles.round}>
      <p className={styles.eyebrow}>
        <span>Round · {fact.category}</span>
        <span>
          Fox {score.you} · Dog {score.rival}
        </span>
      </p>
      <h3 className={styles.question}>
        {fact.prompt}
        {fact.unit ? <span className={styles.unit}> ({fact.unit})</span> : null}
      </h3>

      <div className={styles.line} aria-hidden="true">
        {TICKS.map((t, i) => (
          <span key={t}>
            <span className={styles.tick} style={{ left: `${toPos(t) * 100}%` }} />
            <span className={styles.tickLabel} style={{ left: `${toPos(t) * 100}%` }}>
              {TICK_LABELS[i]}
            </span>
          </span>
        ))}
        <span className={styles.axis} />
        <span className={styles.window} style={{ left: `${left}%`, width: `${width}%` }}>
          <span className={styles.windowLabel}>
            {formatNumber(guess)} ±{formatNumber(claim)}
          </span>
        </span>
        {phase === "revealed" && (
          <>
            <span className={styles.answer} style={{ left: `${answerPos}%` }} />
            <span className={styles.answerLabel} style={{ left: `${answerPos}%` }}>
              {fact.display}
            </span>
          </>
        )}
      </div>

      {phase === "claim" ? (
        <div className={styles.controls}>
          <div className={styles.slider}>
            <label htmlFor={`sq-guess-${initialIndex}`}>
              <span>Your guess</span>
              <span>
                {formatNumber(guess)}
                {unit}
              </span>
            </label>
            <input
              id={`sq-guess-${initialIndex}`}
              type="range"
              min={0}
              max={1000}
              step={1}
              value={Math.round(guessPos * 1000)}
              onChange={(e) => setGuessPos(Number(e.target.value) / 1000)}
              aria-valuetext={`about ${formatNumber(guess)}${unit}`}
            />
          </div>
          <div className={styles.slider}>
            <label htmlFor={`sq-claim-${initialIndex}`}>
              <span>How close you&apos;ll get</span>
              <span>
                ±{formatNumber(claim)}
                {unit} · smaller is bolder
              </span>
            </label>
            <input
              id={`sq-claim-${initialIndex}`}
              type="range"
              min={0}
              max={1000}
              step={1}
              value={pctToSlider(pct)}
              disabled={called !== null}
              onChange={(e) => setPct(sliderToPct(Number(e.target.value)))}
              aria-valuetext={`within ${formatNumber(claim)}${unit}`}
            />
          </div>
          <p className={styles.rival} aria-live="polite">
            {called
              ? `Dog: “Prove it. I say the answer is ${called} your window.” Lock it in where it stands.`
              : rivalForces(pct)
                ? "Dog is waiting for a bolder claim, or will call your bluff."
                : "Dog concedes the move. Lock it in or squeeze tighter."}
          </p>
          <div className={styles.buttons}>
            <button type="button" className={styles.btn} onClick={squeeze} disabled={called !== null || pct <= CLAIM_PCT_MIN * 1.01}>
              Squeeze tighter
            </button>
            <button type="button" className={styles.btnPrimary} onClick={lock}>
              Lock it in
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.controls}>
          <p className={styles.story} aria-live="polite">
            <span className={`${styles.storyHead} ${result?.winner === "you" ? styles.win : styles.loss}`}>
              {result?.story}
              {unit}.{" "}
              {result?.winner === "you" ? "Fox takes the round." : result?.winner === "rival" ? "Dog called it. Dog takes the round." : "Dog called the wrong side. Nobody scores."}
            </span>
            <span className={styles.storyBody}>
              Answer: {fact.display}. Your window: {formatNumber(window[0])} – {formatNumber(window[1])}.
            </span>
          </p>
          <div className={styles.buttons}>
            <button type="button" className={styles.btnPrimary} onClick={nextQuestion}>
              Next question
            </button>
          </div>
        </div>
      )}

      <p className={styles.note}>
        A web sketch of Squeeze 2.0. 60 of its thousands of facts.{" "}
        <a href="https://apps.apple.com/us/app/squeeze-the-estimation-duel/id6803632348" target="_blank" rel="noopener noreferrer">
          The real thing is on the App Store ↗
        </a>
      </p>
    </div>
  );
}
