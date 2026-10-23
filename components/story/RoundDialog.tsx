"use client";

import { useRef } from "react";
import { SqueezeRound } from "./SqueezeRound";

// "Play a round" opens the Squeeze sketch in a native <dialog>, so the
// product grid keeps its shape. Esc and the Close button both dismiss it.

export function RoundDialog() {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" className="tile-action" onClick={() => ref.current?.showModal()}>
        Play a round
      </button>
      <dialog
        ref={ref}
        className="round-dialog"
        aria-label="Play a round of Squeeze"
        onClick={(e) => {
          if (e.target === ref.current) ref.current?.close();
        }}
      >
        <div className="round-dialog-inner">
          <SqueezeRound />
          <form method="dialog">
            <button type="submit" className="btn ghost">
              Close
            </button>
          </form>
        </div>
      </dialog>
    </>
  );
}
