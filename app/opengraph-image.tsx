import { ImageResponse } from "next/og";
import { siteConfig } from "@/data/config";

// Rendered once at build time, in the site's own palette: charcoal ground,
// cream type, amber for the one word that is a label.
export const alt = `${siteConfig.name} — ${siteConfig.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#1C1C1A";
const CREAM = "#F2EFE6";
const CREAM_70 = "rgba(242, 239, 230, 0.7)";
const RULE = "rgba(242, 239, 230, 0.25)";
const AMBER = "#F2B134";

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
          background: INK,
          color: CREAM,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, letterSpacing: 3, paddingBottom: 20, borderBottom: `1px solid ${RULE}`, color: CREAM_70 }}>
          <span>{siteConfig.domain.toUpperCase()}</span>
          <span style={{ color: AMBER }}>{siteConfig.role.toUpperCase()}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <span style={{ fontSize: 120, fontWeight: 700, lineHeight: 1, letterSpacing: -4 }}>{siteConfig.name}</span>
          <span style={{ fontSize: 30, lineHeight: 1.35, color: CREAM_70, maxWidth: 920 }}>{siteConfig.intro}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: CREAM_70, paddingTop: 20, borderTop: `1px solid ${RULE}` }}>
          <span>Four products, all live · Writing</span>
          <span style={{ color: CREAM }}>{siteConfig.domain}</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
