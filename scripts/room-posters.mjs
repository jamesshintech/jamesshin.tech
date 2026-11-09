// Renders the room's six pictures (public/room/poster-<time>-<wide|tall>.webp):
// what the home page shows until the room's first frame, and in place of the
// room where it cannot run. Run against a local server after changing the
// scene, so the picture and the room it fades into stay the same image:
//
//   pnpm build && pnpm start &   # or pnpm dev
//   node scripts/room-posters.mjs [http://localhost:3000]
//
// Desktop pictures use the high tier at 1600x1000; phone pictures the low
// tier phones get, at 390x844 and twice the pixels. The column, hotspots and
// vignette are hidden for the capture; the framing keeps the column's offset.
import { writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const base = process.argv[2] ?? "http://localhost:3000";
const shapes = [
  { name: "wide", width: 1600, height: 1000, scale: 1, tier: "high", quality: 0.72 },
  { name: "tall", width: 390, height: 844, scale: 2, tier: "low", quality: 0.66 },
];
const browser = await chromium.launch({ args: ["--enable-unsafe-swiftshader"] });
for (const shape of shapes) {
  for (const time of ["day", "dusk", "night"]) {
    const ctx = await browser.newContext({ viewport: { width: shape.width, height: shape.height }, deviceScaleFactor: shape.scale });
    const page = await ctx.newPage();
    await page.goto(`${base}/?time=${time}&q=${shape.tier}&motion=off`);
    await page.waitForSelector(".room[data-state='live']", { state: "attached", timeout: 180_000 });
    await page.addStyleTag({ content: ".room-col,.room-spots,.room-pin,.room-vignette,nextjs-portal{display:none!important}" });
    await page.waitForTimeout(500);
    const png = (await page.screenshot()).toString("base64");
    // The browser encodes the WebP, so the script needs nothing but Playwright.
    const webp = await page.evaluate(
      async ({ png, quality }) => {
        const img = new Image();
        img.src = `data:image/png;base64,${png}`;
        await img.decode();
        const c = document.createElement("canvas");
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        c.getContext("2d").drawImage(img, 0, 0);
        return c.toDataURL("image/webp", quality).split(",")[1];
      },
      { png, quality: shape.quality },
    );
    const out = `public/room/poster-${time}-${shape.name}.webp`;
    writeFileSync(out, Buffer.from(webp, "base64"));
    console.log(out, Math.round(Buffer.from(webp, "base64").length / 1024), "kB");
    await ctx.close();
  }
}
await browser.close();
