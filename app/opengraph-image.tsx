import { ImageResponse } from "next/og";
import { siteConfig } from "@/data/config";

export const runtime = "edge";
export const alt = `${siteConfig.name} — ${siteConfig.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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
          background: "linear-gradient(180deg, #1a3a5c, #0f1f33 75%)",
          color: "#f6efe0",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 22, letterSpacing: 6, color: "#d9a441", fontFamily: "monospace" }}>
          {siteConfig.name.toUpperCase()} · {siteConfig.role.toUpperCase()}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 104, lineHeight: 1, letterSpacing: -2 }}>
            I ship the <span style={{ color: "#d9a441", fontStyle: "italic", marginLeft: 24 }}>whole</span>
            <span style={{ marginLeft: 24 }}>thing.</span>
          </div>
          <div style={{ display: "flex", fontSize: 44, fontStyle: "italic", color: "#d9a441", marginTop: 12 }}>
            Idea to App Store, alone.
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, color: "#c3cfdc", fontFamily: "monospace" }}>
          <span>30,000+ schools ranked · 3 iOS apps</span>
          <span>{siteConfig.domain}</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
