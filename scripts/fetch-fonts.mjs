// Fetches the Sentient webfont from Fontshare before dev and build.
//
// Sentient is licensed under the ITF Free Font License, which allows a site
// to self-host the font but not to redistribute the files, so they are not
// committed. Each build downloads the official files from Fontshare's CSS
// API into public/fonts/ (git-ignored), where next/font/local picks them up.
// The SHA-256 of every file is pinned: if Fontshare ever ships different
// bytes, the build stops instead of silently changing how the site looks.

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "fonts");
const CSS = "https://api.fontshare.com/v2/css?f[]=sentient@400,401,500&display=swap";

const FILES = [
  { file: "sentient-400.woff2", weight: "400", style: "normal", sha256: "f08e7da6181ee421ea564df6c727bc84bfe6fe656b9e613efbd8a2161fd26b14" },
  { file: "sentient-400-italic.woff2", weight: "400", style: "italic", sha256: "a377e89eef03b0f83490b71ea95cb0c9c7b918ae2c3b58485821d4f9c0ef5ca7" },
  { file: "sentient-500.woff2", weight: "500", style: "normal", sha256: "5b5be289c90cf98f0d924ec0c7a0bc6ebf417f134152eb5d8b9b589248feeaf6" },
];

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

async function get(url) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (err) {
      if (attempt === 3) throw new Error(`fetching ${url} failed after 3 attempts: ${err.message}`);
      await new Promise((r) => setTimeout(r, attempt * 1000));
    }
  }
}

// Map each @font-face block in Fontshare's CSS to its woff2 URL.
function parseFaces(css) {
  const faces = new Map();
  for (const block of css.split("@font-face").slice(1)) {
    const url = block.match(/url\('(\/\/[^']+\.woff2)'\)/)?.[1];
    const weight = block.match(/font-weight:\s*(\d+)/)?.[1];
    const style = block.match(/font-style:\s*(\w+)/)?.[1];
    if (url && weight && style) faces.set(`${weight}/${style}`, `https:${url}`);
  }
  return faces;
}

const missing = FILES.filter(({ file, sha256: want }) => {
  const path = join(OUT, file);
  return !existsSync(path) || sha256(readFileSync(path)) !== want;
});

if (missing.length === 0) {
  console.log("fonts: Sentient already present and verified");
} else {
  mkdirSync(OUT, { recursive: true });
  const faces = parseFaces((await get(CSS)).toString("utf8"));
  for (const { file, weight, style, sha256: want } of missing) {
    const url = faces.get(`${weight}/${style}`);
    if (!url) throw new Error(`fonts: Fontshare CSS has no Sentient ${weight} ${style} face`);
    const buf = await get(url);
    const got = sha256(buf);
    if (got !== want) {
      throw new Error(
        `fonts: ${file} from Fontshare has SHA-256 ${got}, expected ${want}. ` +
          "Fontshare changed the file. Check the new version renders as intended, then update the pin in scripts/fetch-fonts.mjs.",
      );
    }
    writeFileSync(join(OUT, file), buf);
    console.log(`fonts: fetched ${file} (${buf.length} bytes, verified)`);
  }
}
