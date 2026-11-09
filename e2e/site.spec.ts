import fs from "node:fs";
import path from "node:path";
import { test, expect, type Page } from "@playwright/test";

// Privacy and leftovers check. Until the 2026-10-23 relaunch this site was
// published under my company's name, JJ Fisher, with different content; the
// public list catches any leftover of that. Personal details that must never
// appear (contact details, old handles) come from BANNED_PATTERNS, one regex
// per line, in a CI secret or .env.local, so the test never has to publish
// the very strings it protects. REQUIRE_BANNED_PATTERNS=1 fails a run that
// is missing them.
// Lines are separated by newlines (CI secret) or a literal "\n" (the one-line
// .env.local form), so a pattern cannot itself contain the two characters \n.
const privatePatterns = (process.env.BANNED_PATTERNS ?? "")
  .split(/\r?\n|\\n/)
  .map((s) => s.trim())
  .filter(Boolean)
  .map((s, i) => {
    try {
      return new RegExp(s, "i");
    } catch {
      // Never echo the pattern: the error message would print it into CI logs.
      throw new Error(`BANNED_PATTERNS line ${i + 1} is not a valid regular expression`);
    }
  });
if (process.env.REQUIRE_BANNED_PATTERNS === "1" && privatePatterns.length === 0) {
  throw new Error("BANNED_PATTERNS is empty but REQUIRE_BANNED_PATTERNS=1");
}
const PUBLIC_BANNED = [/JJ Fisher/i, /jjfisher\.dev/i, /single-family/i, /holding company/i];

// Public patterns may be named in a failure message. Private ones are reported
// by index only, so a failing run never prints them into logs or reports.
function expectClean(html: string, where: string) {
  for (const re of PUBLIC_BANNED) expect(html, `${where}: banned string ${re}`).not.toMatch(re);
  const hits = privatePatterns.flatMap((re, i) => (re.test(html) ? [i] : []));
  expect(hits, `${where}: private banned patterns matched (by index)`).toEqual([]);
}

const BILLING = "/writing/2026-w43-billing-controls-from-checklists-to-harnesses";
const MOAT = "/writing/2026-w17-the-distribution-moat-in-the-ai-era";

const ROWS = ["essay", "proposal", "board", "phone", "weeks", "map"] as const;
const PRODUCTS: [string, string, RegExp, string][] = [
  ["board", "Yonmoku: 3D Four in a Row", /^https:\/\/apps\.apple\.com\/us\/app\/yonmoku-3d-four-in-a-row\/id6821935069$/, "Four in a row, in three dimensions. Two people, one phone."],
  ["phone", "Squeeze: The Estimation Duel", /^https:\/\/apps\.apple\.com\//, "A head-to-head estimation duel for two players on one iPhone or iPad."],
  ["weeks", "Vitality Weeks", /^https:\/\/apps\.apple\.com\//, "Your life in weeks. See every week at a glance."],
  ["map", "HighSchoolTrends.org", /^https:\/\/highschooltrends\.org\/?$/, "Free multi-year trend data for 30,000+ US high schools."],
];
const row = (page: Page, key: string) => page.locator(`.room-item[data-key='${key}']`);

/** The room has drawn its first frame. SwiftShader compiles the room's shaders on the CPU, so this can take a while. */
async function live(page: Page) {
  await page.waitForSelector(".room[data-state='live']", { state: "attached", timeout: 90_000 });
}

/** Save-Data on: a real visitor path where the room stays its picture. The
    column's tests use it so they never pay for the room, which on a CI runner
    renders on the CPU (SwiftShader) and can starve the page. */
const SAVE_DATA = () => {
  Object.defineProperty(navigator, "connection", { value: { saveData: true }, configurable: true });
};

/** Console errors and uncaught exceptions from the moment the page opens. */
function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  return errors;
}

test.describe("home", () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(SAVE_DATA);
  });

  test("the column is the page: the name, the role, one line, two labelled work samples and four products, each a real link", async ({ page, request }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/James Shin/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("James Shin");
    // The role sits between the name and the line: generic, never an employer.
    await expect(page.locator(".room-role")).toHaveText("Business and finance systems leader");
    const [h1Box, roleBox, lineBox] = await page.locator(".room-intro h1, .room-role, .room-line").evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON() as DOMRect));
    expect(roleBox.top, "role under the name").toBeGreaterThanOrEqual(h1Box.bottom);
    expect(lineBox.top, "line under the role").toBeGreaterThanOrEqual(roleBox.bottom);
    await expect(page.locator(".room-line")).toContainText("13 years in finance systems");
    await expect(page.locator(".room-line")).toContainText("On the side, I build games and small apps.");

    // Six rows, in this order: two work samples, then four products.
    await expect(page.locator("main .room-item")).toHaveCount(6);
    expect(await page.locator("main .room-item").evaluateAll((els) => els.map((e) => e.getAttribute("data-key")))).toEqual([...ROWS]);
    for (const el of await page.locator("main .room-item").all()) expect(await el.evaluate((e) => e.tagName)).toBe("A");

    // The essay and the proposal, each labelled "kind · detail" with one line under the title.
    await expect(page.locator("#room-samples-h")).toHaveText("Work samples");
    await expect(row(page, "essay")).toHaveAttribute("href", BILLING);
    await expect(row(page, "essay").locator(".room-item-title")).toHaveText("Billing Controls: From Checklists to Harnesses");
    await expect(row(page, "essay").locator(".room-item-kind")).toHaveText(/^Essay · \d+ min$/);
    await expect(row(page, "essay").locator(".room-item-line")).toHaveText(/^Agents are starting to touch money\./);
    // The proposal is a real file, labelled for what it is: a take-home for an
    // interview, built from public information. Never presented as client work.
    await expect(row(page, "proposal")).toHaveAttribute("href", "/work/finance-data-studio.pdf");
    await expect(row(page, "proposal").locator(".room-item-title")).toContainText("Finance Data Studio");
    const mb = (fs.statSync(path.join(process.cwd(), "public/work/finance-data-studio.pdf")).size / 1e6).toFixed(1);
    await expect(row(page, "proposal").locator(".room-item-kind")).toHaveText(`PDF · 12 pages · ${mb} MB`);
    await expect(row(page, "proposal").locator(".room-item-line")).toHaveText("Interview take-home, September 2026, built from public information.");
    const pdf = await request.get("/work/finance-data-studio.pdf");
    expect(pdf.status()).toBe(200);
    expect(pdf.headers()["content-type"]).toContain("application/pdf");
    const bytes = await pdf.body();
    expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");
    // Its own title says what it is, not whose interview it was for. Its
    // uncompressed bytes pass the same scan as every page.
    expect(bytes.toString("latin1")).toMatch(/\/Title\s*\(Finance Data Studio\)/);
    expectClean(bytes.toString("latin1"), "the proposal PDF");

    // Four products, each the product's own one-liner and a link to its store or site.
    await expect(page.locator("#room-products-h")).toHaveText("Products, all live");
    for (const [key, name, href, tagline] of PRODUCTS) {
      await expect(row(page, key).locator(".room-item-title")).toHaveText(name);
      await expect(row(page, key)).toHaveAttribute("href", href);
      await expect(row(page, key)).toHaveAttribute("target", "_blank");
      await expect(row(page, key).locator(".room-item-line")).toHaveText(tagline);
      // Every product is approved and on sale; none is labelled live before its store says so.
      await expect(row(page, key).locator(".room-item-kind")).toHaveText(/^Live · [A-Z][a-z]{2} \d{4} · (iOS|Web)$/);
    }
    await expect(row(page, "board").locator(".room-item-kind")).toHaveText("Live · Oct 2026 · iOS");
    await expect(page.locator(".room-products .room-item-n")).toHaveText(["01", "02", "03", "04"]);

    // Concise: the main column's own copy under 220 words. The budget keeps
    // pitch copy off the page.
    const words = await page.locator("main").evaluate((m) => (m as HTMLElement).innerText.trim().split(/\s+/).filter(Boolean).length);
    expect(words).toBeLessThan(220);
    // No static images: the room's picture is a CSS background under it, and
    // the recordings load only when a product is opened.
    expect(await page.locator("img").count()).toBe(0);
    expect(await page.locator("video").count()).toBe(0);
    // Each sample is linked once, and nothing at the end repeats them.
    await expect(page.locator(`main a[href='${BILLING}']`)).toHaveCount(1);
    await expect(page.locator("main a[href$='.pdf']")).toHaveCount(1);
    // No resume on the site, by choice; never a dead link.
    await expect(page.getByRole("link", { name: /resume/i })).toHaveCount(0);

    const html = await page.content();
    expectClean(html, "home");
    expect(html).not.toContain("/_vercel/insights");
  });

  test("without JavaScript every row is a link, nothing waits for a script, and the room is its picture", async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage();
    await p.goto("/");
    await expect(p.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(p.locator("main a.room-item")).toHaveCount(6);
    await expect(row(p, "phone")).toHaveAttribute("href", /apps\.apple\.com/);
    await expect(p.locator("canvas")).toHaveCount(0);
    // The gate script never ran, so the default picture (dusk) shows.
    expect(await p.locator(".room-stage").evaluate((e) => getComputedStyle(e).backgroundImage)).toContain("/room/poster-dusk-wide.webp");
    await ctx.close();
  });

  test("text is drawn solid: no entrance, no reveal", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.addInitScript(SAVE_DATA);
    const p = await ctx.newPage();
    await p.goto("/");
    // Straight after load, before any animation could finish, everything is already at rest.
    const busy = await p.evaluate(() =>
      document.getAnimations().map((a) => (a as CSSAnimation).animationName ?? (a as CSSTransition).transitionProperty ?? "?"),
    );
    expect(busy, "running animations on load").toEqual([]);
    await expect(p.locator(".progress, .beam, .grid-bg, [data-reveal]")).toHaveCount(0);
    await expect(p.getByRole("heading", { level: 1 })).toHaveCSS("opacity", "1");
    await ctx.close();
  });

  test("contact links to jjhlee92@gmail.com without printing the address, and there is no Log section", async ({ page, request }) => {
    for (const path of ["/", "/writing", BILLING]) {
      await page.goto(path);
      await expect(page.locator("nav a[href^='mailto:']")).toHaveText("Contact");
      await expect(page.locator("footer a[href^='mailto:']")).toHaveText("Contact me");
      for (const a of await page.locator("a[href^='mailto:']").all()) await expect(a).toHaveAttribute("href", "mailto:jjhlee92@gmail.com");
      // The address is in the link target only, never in visible text.
      expect(await page.locator("body").innerText(), `${path} visible text`).not.toMatch(/jjhlee92|[\w.+-]+@[\w-]+\.[a-z]{2,}/i);
    }
    await expect(page.locator("nav").getByRole("link", { name: /^log$/i })).toHaveCount(0);
    expect((await request.get("/log")).status()).toBe(404);
    expect(await (await request.get("/sitemap.xml")).text()).not.toContain("/log");
  });

  test("every page starts with a skip link to its one main landmark, and the 404 page leads home", async ({ page, request }) => {
    for (const p of ["/", "/writing", BILLING]) {
      await page.goto(p);
      await page.keyboard.press("Tab");
      const skip = page.locator(":focus");
      await expect(skip, `${p} first Tab stop`).toHaveText("Skip to content");
      await expect(skip).toHaveAttribute("href", "#main");
      await expect(page.locator("main"), `${p} has one main`).toHaveCount(1);
      await expect(page.locator("main#main")).toHaveCount(1);
    }
    expect((await request.get("/no-such-page")).status()).toBe(404);
    await page.goto("/no-such-page");
    await expect(page.locator("main#main h1")).toHaveText("Nothing here.");
    await expect(page.locator("main").getByRole("link", { name: "Go to the home page" })).toHaveAttribute("href", "/");
    await expect(page.locator(".nav .brand")).toBeVisible();
  });

  test("essay prose uses typographer's quotes, never straight ones", async ({ page }) => {
    for (const p of [BILLING]) {
      await page.goto(p);
      const straight = await page.locator(".prose p, .prose li, .prose td, .prose blockquote").evaluateAll((els) =>
        els.flatMap((e) => {
          const copy = e.cloneNode(true) as HTMLElement;
          copy.querySelectorAll("code, figure, pre").forEach((c) => c.remove());
          const t = copy.textContent ?? "";
          return /["']/.test(t) ? [t.slice(0, 80)] : [];
        }),
      );
      expect(straight, `${p} straight quotes in prose`).toEqual([]);
    }
  });

  test("LinkedIn is in the footer at every width and in the nav once it fits; the nav stays one row", async ({ browser }) => {
    for (const w of [320, 390, 430, 480, 820, 1440]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
      await ctx.addInitScript(SAVE_DATA);
      const p = await ctx.newPage();
      // Reading pages: the site nav.
      await p.goto("/writing");
      await p.evaluate(() => document.fonts.ready);
      for (const where of ["footer", ...(w >= 480 ? ["nav"] : [])]) {
        const link = p.locator(where).getByRole("link", { name: "LinkedIn" });
        await expect(link, `${where} at ${w}px`).toBeVisible();
        await expect(link).toHaveAttribute("href", "https://www.linkedin.com/in/jamesshin2");
        await expect(link).toHaveAttribute("target", "_blank");
        await expect(link).toHaveAttribute("rel", /noopener/);
      }
      if (w < 480) await expect(p.locator("nav").getByRole("link", { name: "LinkedIn" })).toBeHidden();
      // One text line per element: the name and every link sit on a single line.
      const lines = await p.locator(".nav .brand, .nav ul a").evaluateAll((els) =>
        els.filter((e) => getComputedStyle(e.closest("li") ?? e).display !== "none").map((e) => {
          const r = document.createRange();
          r.selectNodeContents(e);
          return r.getClientRects().length;
        }),
      );
      expect(lines.every((n) => n === 1), `nav lines at ${w}px: ${lines}`).toBe(true);
      expect(await p.evaluate(() => document.documentElement.scrollWidth), `scroll width at ${w}px`).toBe(w);
      // Home: the column's own nav and footer carry it at every width, on one row.
      await p.goto("/");
      for (const where of [".room-nav", ".room-foot"]) {
        const link = p.locator(where).getByRole("link", { name: "LinkedIn" });
        await expect(link, `home ${where} at ${w}px`).toBeVisible();
        await expect(link).toHaveAttribute("href", "https://www.linkedin.com/in/jamesshin2");
        await expect(link).toHaveAttribute("rel", /noopener/);
      }
      const tops = await p.locator(".room-nav a").evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
      expect(new Set(tops).size, `home nav on one row at ${w}px`).toBe(1);
      await ctx.close();
    }
  });

  test("Person JSON-LD is present, names the owner, links the profiles and carries the mark", async ({ page, request }) => {
    await page.goto("/");
    const ld = await page.locator('script[type="application/ld+json"]').first().textContent();
    const json = JSON.parse(ld ?? "{}");
    expect(json["@type"]).toBe("Person");
    expect(json.name).toBe("James Shin");
    expect(json.jobTitle).toBe("Business and finance systems leader");
    expect(json.url).toBe("https://jamesshin.tech/");
    expect(json.sameAs).toEqual(["https://github.com/jamesshintech", "https://www.linkedin.com/in/jamesshin2"]);
    // The JS mark (also the X profile picture) is the Person image, a real square PNG.
    expect(json.image).toBe("https://jamesshin.tech/jamesshin-mark.png");
    const mark = await request.get("/jamesshin-mark.png");
    expect(mark.status()).toBe(200);
    expect(mark.headers()["content-type"]).toBe("image/png");
    const png = await mark.body();
    expect([png.readUInt32BE(16), png.readUInt32BE(20)], "mark is 800x800").toEqual([800, 800]);
    // The footer links the same profiles a visitor can check.
    await expect(page.locator("footer").getByRole("link", { name: "GitHub" })).toHaveAttribute("href", "https://github.com/jamesshintech");
  });

  test("the layout holds from 320px to 1440px: the column beside the room or over its lower half, targets at least 44px, never a sideways scroll", async ({ browser }) => {
    for (const [w, h] of [[1440, 900], [1024, 768], [768, 1024], [390, 844], [320, 640]]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h } });
      await ctx.addInitScript(SAVE_DATA);
      const p = await ctx.newPage();
      await p.goto("/");
      await p.evaluate(() => document.fonts.ready);
      expect(await p.evaluate(() => document.documentElement.scrollWidth), `scroll width at ${w}px`).toBe(w);
      const col = await p.locator(".room-col").evaluate((e) => e.getBoundingClientRect().toJSON() as DOMRect);
      if (w >= 900) {
        // Desktop: a fixed column on the left; the room has the rest.
        expect(col.left).toBe(0);
        expect(col.width).toBeLessThan(w * 0.5);
        expect(col.height).toBe(h);
      } else {
        // Phones: the room fills the top, the column starts 46% down (lib/room/runner.ts PHONE_COLUMN_TOP).
        expect(Math.abs(col.top - h * 0.46), `column top at ${w}px`).toBeLessThanOrEqual(1);
        expect(col.width).toBe(w);
      }
      const short = await p.locator(".room-item, .room-nav a, .room-foot a").evaluateAll((els) =>
        els.filter((e) => e.getBoundingClientRect().height < 44).map((e) => e.textContent?.trim().slice(0, 30)),
      );
      expect(short, `targets under 44px at ${w}px`).toEqual([]);
      const spot = await p.locator(".room-spot").first().evaluate((e) => [e.getBoundingClientRect().width, e.getBoundingClientRect().height]);
      expect(spot, "hotspot target").toEqual([48, 48]);
      await ctx.close();
    }
  });
});

test.describe("room", () => {
  test.describe.configure({ timeout: 180_000 });

  test("three.js stays out of the first load; the room loads after, without errors, inside its budgets", async ({ page, request }) => {
    // The first load: every script the HTML names. None of them is the room.
    const html = await (await request.get("/")).text();
    const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]);
    expect(scripts.length).toBeGreaterThan(0);
    for (const src of scripts) expect(await (await request.get(src)).text(), src).not.toContain("WebGLRenderer");

    const errors = watchErrors(page);
    await page.goto("/?debug=1&time=dusk");
    await live(page);
    await expect(page.locator("canvas")).toHaveCount(1);
    const stats = await page.evaluate(() => {
      const r = window.__room!;
      return { calls: r.renderer.info.render.calls, triangles: r.renderer.info.render.triangles, programs: r.renderer.info.programs?.length ?? 0, time: r.room.timeName };
    });
    // Budgets (MengTo/threeui): about a hundred draw calls, 40k triangles.
    expect(stats.calls, "draw calls").toBeLessThanOrEqual(110);
    expect(stats.triangles, "triangles").toBeLessThanOrEqual(40_000);
    expect(stats.programs, "shader programs").toBeLessThanOrEqual(40);
    expect(stats.time).toBe("dusk");
    // The debug meter shows only with ?debug=1.
    await expect(page.locator(".room-meter")).toBeVisible();
    expect(errors, "console errors").toEqual([]);
  });

  test("the light follows the visitor's clock, and the picture shown while it loads is the same light", async ({ browser }) => {
    // Either side of the two hand-offs: day to dusk at 17:30, dusk to night at 19:30.
    for (const [hour, name] of [[17.4, "day"], [17.6, "dusk"], [19.6, "night"]] as const) {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const p = await ctx.newPage();
      await p.clock.setFixedTime(new Date(2026, 0, 1, Math.floor(hour), Math.round((hour % 1) * 60)));
      await p.goto("/?debug=1&q=low");
      await expect(p.locator("html")).toHaveAttribute("data-room-time", name);
      expect(await p.locator(".room-stage").evaluate((e) => getComputedStyle(e).backgroundImage)).toContain(`/room/poster-${name}-wide.webp`);
      await live(p);
      expect(await p.evaluate(() => window.__room!.room.timeName), `the room at ${hour}h`).toBe(name);
      await expect(p.locator(".room-caption")).toContainText(name === "day" ? "Daylight at your local time" : `${name[0].toUpperCase()}${name.slice(1)} at your local time`);
      await ctx.close();
    }
  });

  test("a row lights its object and pins its label; a product row opens a panel with its recording; Escape and Close return focus", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage();
    const errors = watchErrors(p);
    await p.goto("/?time=day&q=low");
    await live(p);
    await row(p, "essay").focus();
    await expect(row(p, "essay")).toHaveClass(/is-active/);
    await expect(p.locator(".room-spot[data-key='essay']")).toHaveClass(/is-active/);
    // The view turns to the paper on the table, then the label is pinned beside it.
    const label = p.locator(".room-pin[data-on] .room-pin-text");
    await expect(label).toBeVisible();
    await expect(label).toContainText("Billing Controls");
    await expect(label).toContainText("Work sample");
    // Beside its object, inside the room, never under the column.
    const [labelBox, colBox] = [await label.boundingBox(), await p.locator(".room-col").boundingBox()];
    expect(labelBox!.x).toBeGreaterThan(colBox!.x + colBox!.width);
    expect(labelBox!.x + labelBox!.width).toBeLessThanOrEqual(1440);

    const squeeze = row(p, "phone");
    await squeeze.click();
    const dialog = p.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { level: 2 })).toHaveText("Squeeze: The Estimation Duel");
    await expect(dialog).toContainText("A head-to-head estimation duel for two players on one iPhone or iPad.");
    await expect(dialog.getByRole("link", { name: "App Store" })).toHaveAttribute("href", /apps\.apple\.com/);
    const video = dialog.locator("video");
    await expect(video.locator("source[type='video/webm']")).toHaveAttribute("src", /\/video\/squeeze-loop\.webm$/);
    await expect(video).toHaveAttribute("poster", /\/video\/squeeze-loop\.webp$/);
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => !v.paused), { message: "the recording plays", timeout: 15_000 }).toBe(true);
    await expect(dialog.getByRole("button", { name: "Close" })).toBeFocused();
    expect(ctx.pages(), "the row opened the panel, not the store").toHaveLength(1);
    await expect(squeeze).toHaveClass(/is-active/);
    // The panel names the item, so no label sits under it.
    await expect(p.locator(".room-pin-text")).toHaveCount(0);
    await p.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(squeeze).toBeFocused();

    await row(p, "map").click();
    await expect(p.getByRole("dialog").getByRole("heading", { level: 2 })).toHaveText("HighSchoolTrends.org");
    await expect(p.getByRole("dialog").getByRole("link", { name: "Visit the site" })).toHaveAttribute("href", /highschooltrends\.org/);
    await p.getByRole("dialog").getByRole("button", { name: "Close" }).click();
    await expect(p.getByRole("dialog")).toHaveCount(0);
    await expect(row(p, "map")).toBeFocused();
    expect(errors, "console errors").toEqual([]);
    await ctx.close();
  });

  test("an object opens the same panel; the board drops a bead first", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage();
    await p.goto("/?debug=1&time=dusk&q=low");
    await live(p);
    const meshes = () => p.evaluate(() => {
      let n = 0;
      window.__room!.scene.traverse(() => n++);
      return n;
    });
    const before = await meshes();
    await p.locator(".room-spot[data-key='board']").click();
    await expect.poll(meshes, { message: "a bead was added" }).toBe(before + 1);
    const dialog = p.getByRole("dialog");
    await expect(dialog.getByRole("heading", { level: 2 })).toHaveText("Yonmoku: 3D Four in a Row");
    await expect(dialog.locator("video source[type='video/webm']")).toHaveAttribute("src", /yonmoku-loop\.webm$/);
    await expect(dialog.getByRole("button", { name: "Close" })).toBeFocused();
    // Hotspots are pointer shortcuts hidden from assistive technology; focus returns to the row.
    await p.keyboard.press("Escape");
    await expect(row(p, "board")).toBeFocused();
    // A work sample's object opens a panel that links the document.
    await p.locator(".room-spot[data-key='essay']").click();
    await expect(p.getByRole("dialog").getByRole("link", { name: "Read the essay" })).toHaveAttribute("href", BILLING);
    await expect(p.getByRole("dialog").locator("video")).toHaveCount(0);
    await ctx.close();
  });

  test("under reduced motion the room is still and a recording waits for Play, which keeps focus", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage();
    await p.goto("/?debug=1&q=low");
    await live(p);
    expect(await p.evaluate(() => window.__room!.stage.running), "no frame loop").toBe(false);
    // Nothing moves on its own, so there is no pause switch.
    await expect(p.locator(".motion-toggle")).toBeHidden();
    await row(p, "phone").click();
    const dialog = p.getByRole("dialog");
    const video = dialog.locator("video");
    const play = dialog.getByRole("button", { name: /^play \d+s loop$/i });
    await expect(play).toBeVisible();
    await p.waitForTimeout(800);
    expect(await video.evaluate((v: HTMLVideoElement) => v.paused), "holds the poster").toBe(true);
    await play.focus();
    await p.keyboard.press("Enter");
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => !v.paused), { message: "plays once asked", timeout: 15_000 }).toBe(true);
    // The same button becomes Pause, and focus stays on it.
    const control = dialog.locator(".loop .play");
    await expect(control).toHaveText("Pause loop");
    await expect(control).toBeFocused();
    await p.keyboard.press("Enter");
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.paused), { message: "pauses when asked" }).toBe(true);
    // The button sits outside the recording's link: pressing it must not open the store.
    expect(ctx.pages(), "Play opened another page").toHaveLength(1);
    await ctx.close();
  });

  test("a pause switch stops the room, keeps focus, and is remembered", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage();
    await p.goto("/?debug=1&q=low");
    await live(p);
    expect(await p.evaluate(() => window.__room!.stage.running), "the room moves").toBe(true);
    const toggle = p.locator(".motion-toggle");
    await expect(toggle).toHaveText("Pause motion");
    await toggle.focus();
    await p.keyboard.press("Enter");
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect(toggle).toHaveText("Play motion");
    await expect(toggle).toBeFocused();
    expect(await p.evaluate(() => window.__room!.stage.running), "paused").toBe(false);
    // Remembered, and restored before the room starts.
    await p.reload();
    await expect(p.locator("html")).toHaveAttribute("data-motion", "paused");
    await live(p);
    expect(await p.evaluate(() => window.__room!.stage.running), "still paused after a reload").toBe(false);
    await p.locator(".motion-toggle").click();
    await expect.poll(() => p.evaluate(() => window.__room!.stage.running)).toBe(true);
    await ctx.close();
  });

  test("without WebGL 2, or with Save-Data on, the room is its picture and the page loses nothing", async ({ browser }) => {
    const blockers = {
      "no WebGL 2": () => {
        const get = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, kind: string, ...rest: unknown[]) {
          return kind === "webgl2" ? null : (get as (...a: unknown[]) => unknown).call(this, kind, ...rest);
        } as typeof get;
      },
      "Save-Data": SAVE_DATA,
    };
    for (const [why, block] of Object.entries(blockers)) {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const p = await ctx.newPage();
      const errors = watchErrors(p);
      await p.addInitScript(block);
      await p.goto("/?time=night&q=low");
      await p.waitForSelector(".room[data-state='picture']", { state: "attached" });
      await expect(p.locator("canvas"), why).toHaveCount(0);
      expect(await p.locator(".room-stage").evaluate((e) => getComputedStyle(e).backgroundImage)).toContain("/room/poster-night-wide.webp");
      // The panels still work: they never needed the room.
      await row(p, "weeks").click();
      await expect(p.getByRole("dialog").getByRole("heading", { level: 2 })).toHaveText("Vitality Weeks");
      expect(errors, `${why}: console errors`).toEqual([]);
      await ctx.close();
    }
  });

  test("on a phone the panel is a sheet from the bottom, and hotspots sit in the room above the column", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.goto("/?time=day&q=low");
    await live(p);
    for (const spot of await p.locator(".room-spot[data-on]").all()) {
      const box = (await spot.boundingBox())!;
      expect(box.y + box.height / 2, "hotspot above the column").toBeLessThan(844 * 0.46);
    }
    expect(await p.locator(".room-spot[data-on]").count(), "some objects are in view").toBeGreaterThan(0);
    await row(p, "board").tap();
    const box = (await p.getByRole("dialog").boundingBox())!;
    expect(Math.round(box.x)).toBe(0);
    expect(Math.round(box.width)).toBe(390);
    expect(Math.round(box.y + box.height)).toBe(844);
    expect(await p.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    // The page behind the sheet dims, and a tap there closes it.
    await p.locator(".room-scrim").tap({ position: { x: 195, y: 40 } });
    await expect(p.getByRole("dialog")).toHaveCount(0);
    await expect(row(p, "board")).toBeFocused();
    await ctx.close();
  });

  test("leaving the page releases the room, and coming back builds it again", async ({ page }) => {
    await page.goto("/?debug=1&q=low");
    await live(page);
    await page.locator(".room-nav").getByRole("link", { name: "Writing" }).click();
    await page.waitForURL("**/writing");
    await expect.poll(() => page.evaluate(() => window.__roomDisposals ?? 0), { message: "disposed once" }).toBe(1);
    expect(await page.evaluate(() => window.__room === undefined)).toBe(true);
    await expect(page.locator("canvas")).toHaveCount(0);
    await page.goBack();
    await live(page);
    await expect(page.locator("canvas")).toHaveCount(1);
    expect(await page.evaluate(() => window.__room !== undefined)).toBe(true);
  });
});

test.describe("writing", () => {
  test("one essay is published, and the list says only what it holds", async ({ page }) => {
    await page.goto("/writing");
    const links = page.locator("ul.archive a");
    await expect(links).toHaveCount(1);
    await expect(links.nth(0)).toContainText("Billing Controls: From Checklists to Harnesses");
    await expect(page.locator(".reader header .line")).toHaveText("1 essay · RSS");
    // RSS is a link like every other: underlined.
    const deco = await page.locator(".reader header .line a").evaluate((a) => getComputedStyle(a).textDecorationLine);
    expect(deco).toContain("underline");
  });

  test("a link to a reading page shares with the site's preview image", async ({ page }) => {
    for (const path of ["/writing", BILLING]) {
      await page.goto(path);
      const og = await page.locator('meta[property="og:image"]').getAttribute("content");
      expect(og, `${path} og:image`).toMatch(/^https:\/\/jamesshin\.tech\/opengraph-image/);
      await expect(page.locator('meta[name="twitter:image"]'), `${path} twitter:image`).toHaveAttribute("content", og!);
      await expect(page.locator('meta[name="twitter:title"]'), `${path} twitter:title`).toHaveCount(1);
    }
  });

  test("a short page keeps its footer at the bottom of the window", async ({ browser }) => {
    for (const [w, h] of [[1440, 900], [390, 844]]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h } });
      const p = await ctx.newPage();
      for (const path of ["/writing", "/no-such-page"]) {
        await p.goto(path);
        const bottom = await p.locator("footer").evaluate((f) => f.getBoundingClientRect().bottom + window.scrollY);
        expect(Math.round(bottom), `${path} at ${w}x${h}`).toBeGreaterThanOrEqual(h);
      }
      await ctx.close();
    }
  });

  test("reading pages keep one left edge: header, list and essay body", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/writing");
    const [h1, list] = await page.locator(".reader header h1, ul.archive").evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().left)));
    expect(list, "list under the header").toBe(h1);
    await page.goto(BILLING);
    const [title, prose] = await page.locator(".reader header h1, .prose").evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().left)));
    expect(prose, "essay body under its title").toBe(title);
  });

  test("the essay taken off the site sends its old address to the essay list", async ({ request }) => {
    const res = await request.get(MOAT, { maxRedirects: 0 });
    expect(res.status()).toBe(307);
    expect(res.headers()["location"]).toMatch(/\/writing$/);
  });

  for (const [path, h1] of [[BILLING, "Billing Controls"]] as const) {
    test(`${h1} renders and carries no leftover or private strings`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(h1);
      const html = await page.content();
      expectClean(html, path);
    });
  }

  test("the billing essay keeps its honest date, bottom line, diagrams, tables and sourced footnotes", async ({ page }) => {
    await page.goto(BILLING);
    // Dated the day it was written, never backdated; the 2026-11-02 edit
    // shows as a revision on the page and in the JSON-LD.
    await expect(page.locator(".reader header .meta")).toContainText("October 23, 2026");
    await expect(page.locator(".reader header .meta")).toContainText("revised November 2, 2026");
    const lds = (await page.locator('script[type="application/ld+json"]').allTextContents()).map((t) => JSON.parse(t));
    const article = lds.find((ld) => ld["@type"] === "Article");
    expect(article?.datePublished).toBe("2026-10-23");
    expect(article?.dateModified).toBe("2026-11-02");
    // No kicker restating the hero's years.
    await expect(page.locator(".prose .byline")).toHaveCount(0);

    await expect(page.locator(".prose .bluf")).toContainText("Bottom line.");
    // Claims a billing or audit reader would check: SOX does not prescribe
    // control types; the cited Stripe post was not its first agent product;
    // self-release under the limit is named as the exception it is.
    await expect(page.locator(".prose")).not.toContainText("SOX already requires");
    await expect(page.locator(".prose")).not.toContainText("first answer");
    await expect(page.locator(".prose")).toContainText("compensating control");
    // The service principal stays on one line in Diagram 1.
    expect(await page.locator(".prose .fig .nb", { hasText: "svc-billing" }).evaluate((e) => e.getClientRects().length)).toBe(1);
    const figs = page.locator(".prose figure.fig");
    await expect(figs).toHaveCount(2);
    await expect(figs.nth(0).locator("figcaption")).toHaveText(/^Diagram 1\./);
    await expect(figs.nth(1).locator("figcaption")).toHaveText(/^Diagram 2\./);
    await expect(figs.nth(0).locator(".fig-lanes > li")).toHaveCount(3);
    await expect(figs.nth(1).locator(".fig-flow > li")).toHaveCount(6);

    // Every table scrolls inside a keyboard-focusable region, never the page.
    await expect(page.locator(".prose table")).toHaveCount(3);
    await expect(page.locator(".prose .table-scroll[tabindex='0'] > table")).toHaveCount(3);
    // A table wider than the column shows it: a soft edge on the side with more.
    const bg = await page.locator(".prose .table-scroll").first().evaluate((e) => getComputedStyle(e).backgroundImage);
    expect(bg.match(/gradient/g)?.length, "scroll-edge gradients").toBe(4);

    // Quotes exactly as the sources print them; every footnote but the sample note links out.
    await expect(page.locator(".prose")).toContainText("trust can’t be inferred—it has to be explicitly granted, scoped, and enforced in code.");
    const notes = page.locator("section.footnotes li");
    await expect(notes).toHaveCount(4);
    // The essay cites no prospective employer's own incidents.
    await expect(page.locator(".prose a[href*='status.claude.com'], .prose a[href*='status.openai.com']")).toHaveCount(0);
    const backref = await page.locator("a.data-footnote-backref").first().textContent();
    expect(backref).toBe("↩︎");
  });

  test("essay figures and tables fit at phone and desktop widths, with no word squeezed out of its box", async ({ browser }) => {
    for (const w of [320, 390, 520, 820, 1440]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
      const p = await ctx.newPage();
      for (const path of [BILLING]) {
        await p.goto(path);
        await p.evaluate(() => document.fonts.ready);
        // Forbid mid-word breaks so a word that does not fit shows up as overflow.
        await p.addStyleTag({ content: ".fig, .fig * { overflow-wrap: normal !important; word-break: normal !important; }" });
        const overflowing = await p.evaluate(() =>
          [...document.querySelectorAll(".fig .fig-node, .fig .fig-blocked")]
            .filter((n) => n.scrollWidth > n.clientWidth + 1)
            .map((n) => n.textContent?.trim().slice(0, 40)),
        );
        expect(overflowing, `${path} at ${w}px`).toEqual([]);
        expect(await p.evaluate(() => document.documentElement.scrollWidth), `${path} scroll width at ${w}px`).toBe(w);
      }
      await ctx.close();
    }
  });

  test("rss and sitemap use the new domain only", async ({ request }) => {
    const rss = await request.get("/writing/rss.xml");
    expect(rss.ok()).toBeTruthy();
    const rssText = await rss.text();
    expect(rssText).toContain("https://jamesshin.tech/writing/");
    expect(rssText).not.toContain("jjfisher");
    expect((rssText.match(/<item>/g) ?? []).length).toBe(1);
    expect(rssText).not.toContain("distribution-moat");
    // Figures travel in the feed as plain lists, so feed readers without CSS still get the content.
    expect(rssText).toContain('<figure class="fig');

    const sm = await request.get("/sitemap.xml");
    expect(sm.ok()).toBeTruthy();
    const smText = await sm.text();
    expect(smText).not.toContain("/real-estate");
    expect(smText).not.toContain("/desktop");
    expect(smText).not.toContain("jjfisher");
    expect(smText).not.toContain("distribution-moat");
  });
});

test.describe("headers", () => {
  test("every response says how it may be framed, sniffed and referred", async ({ request }) => {
    for (const path of ["/", "/writing", "/work/finance-data-studio.pdf", "/video/squeeze-loop.mp4"]) {
      const h = (await request.get(path)).headers();
      expect(h["x-content-type-options"], path).toBe("nosniff");
      expect(h["referrer-policy"], path).toBe("strict-origin-when-cross-origin");
      expect(h["x-frame-options"], path).toBe("DENY");
      expect(h["content-security-policy"], path).toBe("frame-ancestors 'none'");
      expect(h["permissions-policy"], path).toBe("camera=(), microphone=(), geolocation=()");
    }
  });
});

test.describe("retired routes", () => {
  for (const path of ["/desktop", "/real-estate", "/log", "/api/analytics/website", "/api/newsletter/subscribe"]) {
    test(`${path} is gone`, async ({ request }) => {
      const res = await request.get(path);
      expect(res.status()).toBe(404);
    });
  }
});
