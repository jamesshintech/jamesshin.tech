"use client";

import { useCallback, useMemo, useState } from "react";
import facts from "@/data/squeeze-facts.json";
import styles from "./SqueezeRound.module.css";
import {
  LINE_MAX,
  formatNumber,
  rivalForces,
  round2sf,
  scoreRound,
  toPos,
  windowFromCenter,
  type RoundResult,
  type Window,
} from "./squeezeLogic";

// One round of Squeeze in the browser: claim a window, squeeze it or lock
// it in, then see where the answer landed. The rival is simple: it forces
// whenever the window is still wide, so a bold claim is the only way to
// keep the move. Renders a fixed first question on the server; the
// shuffle starts on the first "Next question".

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
const RATIO_MIN = 1.1; // the tightest window: ±5%
const RATIO_MAX = 1000; // the widest: three orders of magnitude
const START_RATIO = 100;

type Phase = "claim" | "revealed";

export interface SqueezeRoundProps {
  /** Index of the first question, so the server and client agree. */
  initialIndex?: number;
}

export function SqueezeRound({ initialIndex = 0 }: SqueezeRoundProps) {
  const [index, setIndex] = useState(initialIndex % FACTS.length);
  const fact = FACTS[index];
  // The player positions the window's centre and its width (a log ratio).
  const [centerPos, setCenterPos] = useState(0.5);
  const [ratio, setRatio] = useState(START_RATIO);
  const [phase, setPhase] = useState<Phase>("claim");
  const [result, setResult] = useState<RoundResult | null>(null);
  const [forced, setForced] = useState(false);
  const [score, setScore] = useState({ you: 0, rival: 0 });

  const window = useMemo<Window>(() => {
    const center = Math.pow(10, centerPos * Math.log10(LINE_MAX));
    const [lo, hi] = windowFromCenter(center, ratio);
    return [round2sf(lo), round2sf(hi)];
  }, [centerPos, ratio]);

  const lock = useCallback(() => {
    const r = scoreRound(window, fact.answer);
    setResult(r);
    setPhase("revealed");
    setScore((s) => (r.inside ? { ...s, you: s.you + 1 } : { ...s, rival: s.rival + 1 }));
  }, [window, fact.answer]);

  const squeeze = useCallback(() => {
    // Squeezing halves the log-width. If it is still wide, the rival
    // forces: the window is placed as it stands.
    const next = Math.max(RATIO_MIN, Math.sqrt(ratio));
    setRatio(next);
    if (rivalForces(next)) {
      setForced(true);
    }
  }, [ratio]);

  const nextQuestion = useCallback(() => {
    setIndex((i) => (i + 1) % FACTS.length);
    setCenterPos(0.5);
    setRatio(START_RATIO);
    setPhase("claim");
    setResult(null);
    setForced(false);
  }, []);

  const left = toPos(window[0]) * 100;
  const width = (toPos(window[1]) - toPos(window[0])) * 100;
  const answerPos = toPos(fact.answer) * 100;

  return (
    <div className={styles.round}>
      <p className={styles.eyebrow}>
        <span>Round · {fact.category}</span>
        <span>
          You {score.you} · Rival {score.rival}
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
        <span className={styles.window} style={{ left: `${left}%`, width: `${Math.max(0.6, width)}%` }}>
          <span className={styles.windowLabel}>
            {formatNumber(window[0])} – {formatNumber(window[1])}
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
            <label htmlFor={`sq-center-${initialIndex}`}>
              <span>Where it lands</span>
              <span>{formatNumber(Math.pow(10, centerPos * Math.log10(LINE_MAX)))}</span>
            </label>
            <input
              id={`sq-center-${initialIndex}`}
              type="range"
              min={0}
              max={1000}
              step={1}
              value={Math.round(centerPos * 1000)}
              onChange={(e) => setCenterPos(Number(e.target.value) / 1000)}
              aria-valuetext={`about ${formatNumber(Math.pow(10, centerPos * Math.log10(LINE_MAX)))}`}
            />
          </div>
          <div className={styles.slider}>
            <label htmlFor={`sq-width-${initialIndex}`}>
              <span>How wide</span>
              <span>×{formatNumber(ratio)} · smaller is bolder</span>
            </label>
            <input
              id={`sq-width-${initialIndex}`}
              type="range"
              min={0}
              max={1000}
              step={1}
              value={Math.round((Math.log10(ratio) - Math.log10(RATIO_MIN)) / (Math.log10(RATIO_MAX) - Math.log10(RATIO_MIN)) * 1000)}
              onChange={(e) => {
                const p = Number(e.target.value) / 1000;
                setRatio(Math.pow(10, Math.log10(RATIO_MIN) + p * (Math.log10(RATIO_MAX) - Math.log10(RATIO_MIN))));
                setForced(false);
              }}
              aria-valuetext={`window ${formatNumber(ratio)} times wide`}
            />
          </div>
          <p className={styles.rival} aria-live="polite">
            {forced ? "Rival: “Too wide. Place it.” Lock it in where it stands." : rivalForces(ratio) ? "Rival is waiting for a bolder claim." : "Rival concedes the move."}
          </p>
          <div className={styles.buttons}>
            <button type="button" className={styles.btn} onClick={squeeze} disabled={forced || ratio <= RATIO_MIN * 1.01}>
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
            <span className={`${styles.storyHead} ${result?.inside ? styles.win : styles.loss}`}>
              {result?.story}
              {fact.unit ? ` ${fact.unit}` : ""}.{result?.inside ? " You take the round." : " Rival takes it."}
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
        A web sketch of the shipped iOS game. 60 of its 7,900+ facts.{" "}
        <a href="https://apps.apple.com/us/app/squeeze-the-estimation-duel/id6803632348" target="_blank" rel="noopener noreferrer">
          The real thing is on the App Store ↗
        </a>
      </p>
    </div>
  );
}
