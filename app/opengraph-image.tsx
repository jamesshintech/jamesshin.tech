import { ImageResponse } from "next/og";
import { siteConfig } from "@/data/config";

// Rendered once at build time, in the site's own palette: moss ground, ink
// type, hard 2px rules. No accent: DESIGN.md keeps it for interactive state.
export const alt = `${siteConfig.name} — ${siteConfig.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const MOSS = "#D9DCCB";
const INK = "#14170F";
const MUTED = "#4D5244";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: MOSS,
          color: INK,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, letterSpacing: 4, paddingBottom: 20, borderBottom: `2px solid ${INK}` }}>
          <span>{siteConfig.name.toUpperCase()}</span>
          <span>{siteConfig.role.toUpperCase()}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 84, fontWeight: 700, lineHeight: 1.02, letterSpacing: -2 }}>
          <span>I find a real need and</span>
          <span>ship the whole thing, alone.</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: MUTED, paddingTop: 20, borderTop: `2px solid ${INK}` }}>
          <span>30,000+ US high schools ranked · three iOS apps</span>
          <span style={{ color: INK }}>{siteConfig.domain}</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
