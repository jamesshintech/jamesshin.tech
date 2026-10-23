import Image from "next/image";
import type { Frame as FrameData } from "@/data/projects";

// Every visual on the home page is a real frame of the product: an App
// Store listing image or a capture of the live site. The one exception is
// the Yonmoku board, which is drawn with CSS 3D transforms from the game's
// real geometry (a 4×4 grid of pegs, four beads high) so the chapter has
// something that moves. No image library, no WebGL, no generated imagery.

export function Frame({ frame, phone = true }: { frame: FrameData; phone?: boolean }) {
  return (
    <Image
      src={frame.src}
      width={frame.width}
      height={frame.height}
      alt={frame.alt}
      unoptimized
      className={phone ? "frame phone" : "frame"}
      sizes={phone ? "280px" : "(max-width: 860px) 100vw, 620px"}
    />
  );
}

/* ─── Yonmoku: a 4×4×4 peg board in CSS 3D ─── */

// Beads on each peg from the bottom up: d = dark, l = light. Taken from
// the mid-game frame beside it.
const STACKS: Record<string, string> = {
  "0,0": "l",
  "1,0": "dl",
  "2,0": "d",
  "3,0": "ld",
  "0,1": "d",
  "1,1": "ldl",
  "3,1": "dd",
  "0,2": "l",
  "2,2": "dl",
  "3,2": "dddl",
  "1,3": "d",
  "2,3": "l",
  "3,3": "ld",
};

const STEP = 46; // px between pegs
const BEAD = 18; // bead height
const PEG_H = 4 * BEAD + 10;

export function Yonmoku3D() {
  const pegs: { c: number; r: number }[] = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) pegs.push({ c, r });
  const off = (i: number) => (i - 1.5) * STEP;
  return (
    <div className="scene" aria-hidden="true">
      <div className="board3d">
        <div className="base" />
        {pegs.map(({ c, r }) => {
          const beads = STACKS[`${c},${r}`] ?? "";
          return (
            <div key={`${c}-${r}`} className="peg" style={{ transform: `translate3d(${off(c)}px, 0, ${off(r)}px)` }}>
              <i className="rod a" />
              <i className="rod b" />
              {beads.split("").map((b, k) => (
                <span key={k} className={`bead ${b === "d" ? "dark" : "light"}`} style={{ bottom: `${k * BEAD}px` }}>
                  <i className="a" />
                  <i className="b" />
                </span>
              ))}
            </div>
          );
        })}
      </div>
      {/* Geometry that depends on the constants above; the look and the
          motion live in globals.css under "Yonmoku board". */}
      <style>{`
        .scene { height: ${PEG_H + 190}px; }
        .board3d .base { left: ${-2.3 * STEP}px; top: ${-2.3 * STEP}px; width: ${4.6 * STEP}px; height: ${4.6 * STEP}px; }
        .board3d .peg { top: ${-PEG_H}px; height: ${PEG_H}px; }
        .board3d .bead { left: ${-BEAD / 2}px; width: ${BEAD}px; height: ${BEAD}px; }
      `}</style>
    </div>
  );
}
