import fs from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";

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

test.describe("home", () => {
  test("four products, each a recording with a one-liner and a link, one chapter each", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/James Shin/);

    // One chapter per product; the first also carries the name and the work samples.
    await expect(page.locator("main section[data-chapter]")).toHaveCount(4);
    await expect(page.locator("main video")).toHaveCount(4);
    const expected: [string, string, RegExp][] = [
      ["yonmoku", "Yonmoku: 3D Four in a Row", /apps\.apple\.com\/us\/app\/yonmoku-3d-four-in-a-row\/id6821935069/],
      ["squeeze", "Squeeze: The Estimation Duel", /apps\.apple\.com/],
      ["vitality-weeks", "Vitality Weeks", /apps\.apple\.com/],
      ["highschooltrends", "HighSchoolTrends.org", /highschooltrends\.org/],
    ];
    for (const [slug, name, host] of expected) {
      const tile = page.locator(`#${slug}`);
      await expect(tile.getByRole("heading", { level: 2 })).toHaveText(name);
      await expect(tile.getByRole("heading", { level: 2 }).getByRole("link")).toHaveAttribute("href", host);
      await expect(tile.locator("p.tile-line")).not.toBeEmpty();
      // Every visual is a recording of the real app.
      const video = tile.locator("video");
      await expect(video).toHaveCount(1);
      await expect(video.locator("source[type='video/webm']")).toHaveAttribute("src", /\/video\/.+\.webm$/);
      await expect(video).toHaveAttribute("poster", /\/video\/.+\.webp$/);
    }
    // Every product is approved and on sale; none is labelled live before its store says so.
    for (const meta of await page.locator("p.tile-meta").allTextContents()) expect(meta).toMatch(/^Live · /);
    await expect(page.locator("#yonmoku p.tile-meta")).toHaveText("Live · Oct 2026 · iOS");

    // Concise: no static images, and the main column's own copy (name, one
    // line, two labelled work samples with a one-line note each, four
    // products) under 220 words. The budget keeps pitch copy
    // off the page. A list that only repeats links to what is already on the
    // page (the Contents) is marked data-wordcount="skip" and left out; it
    // cannot carry pitch copy because it holds only links.
    expect(await page.locator("img").count()).toBe(0);
    const words = await page.locator("main").evaluate((m) => {
      const copy = m.cloneNode(true) as HTMLElement;
      copy.querySelectorAll("[data-wordcount='skip']").forEach((e) => e.remove());
      document.body.appendChild(copy);
      const n = copy.innerText.trim().split(/\s+/).filter(Boolean).length;
      copy.remove();
      return n;
    });
    expect(words).toBeLessThan(220);
    // What is skipped really is only links and their labels.
    const skipped = await page.locator("main [data-wordcount='skip']").evaluateAll((els) =>
      els.every((e) => Array.from(e.querySelectorAll("p, li")).every((n) => n.querySelector("a, button") || n.classList.contains("contents-h") || n.closest(".contents-head"))),
    );
    expect(skipped, "skipped blocks hold only links").toBe(true);

    // The one essay is the first work sample; the home page lists it once
    // and leaves the index to Writing.
    await expect(page.locator("#essays, .essays")).toHaveCount(0);
    await expect(page.locator(`main a[href='${BILLING}']`)).toHaveCount(1);
    // The hero is the only place the work samples are listed: nothing at the
    // end repeats them.
    await expect(page.locator("main a[href$='.pdf']"), "the PDF is linked once").toHaveCount(1);
    expect(await page.locator(".closing").count(), "no recap block repeating the hero").toBe(0);

    const html = await page.content();
    expectClean(html, "home");
    expect(html).not.toContain("/_vercel/insights");
  });

  test("the layout uses the width: each recording sits beside its copy on desktop, sides alternating, and above it on phones; never a sideways scroll", async ({ browser }) => {
    for (const w of [1440, 1024, 768, 390, 320]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
      const p = await ctx.newPage();
      await p.goto("/");
      const sides: string[] = [];
      for (const slug of ["yonmoku", "squeeze", "vitality-weeks", "highschooltrends"]) {
        // Document order: the frame, then the product's name.
        const [frame, name] = await p.locator(`#${slug} .frame, #${slug} h2`).evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON() as DOMRect));
        if (w >= 901) {
          expect(frame.left >= name.right || frame.right <= name.left, `${slug} frame beside its copy at ${w}px`).toBe(true);
          sides.push(frame.left > name.left ? "right" : "left");
        } else {
          expect(frame.bottom, `${slug} frame above its name at ${w}px`).toBeLessThanOrEqual(name.top);
        }
      }
      if (w >= 901) expect(sides, `recording sides at ${w}px`).toEqual(["right", "left", "right", "left"]);
      expect(await p.evaluate(() => document.documentElement.scrollWidth), `scroll width at ${w}px`).toBe(w);
      await ctx.close();
    }
  });

  test("the tiles are recordings and links only: no playable round", async ({ page }) => {
    await page.goto("/");
    // The one button in main is the pause-motion switch (WCAG 2.2.2).
    await expect(page.locator("main dialog")).toHaveCount(0);
    await expect(page.locator("main button:not(.motion-toggle)")).toHaveCount(0);
    await expect(page.getByText(/play a round/i)).toHaveCount(0);
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

  test("the hero is the name, one line of background, and two labelled work samples", async ({ page, request }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("James Shin");
    await expect(page.locator(".intro-line")).toContainText("13 years in finance systems");
    await expect(page.locator(".intro-line")).toContainText("On the side, I build games and small apps.");
    const samples = page.locator(".samples a.btn");
    await expect(samples).toHaveCount(2);
    await expect(samples.nth(0)).toHaveAttribute("href", BILLING);
    await expect(samples.nth(0)).toContainText("Billing Controls: From Checklists to Harnesses");
    // The proposal is a real file, labelled for what it is: a take-home for an
    // interview, built from public information. Never presented as client work.
    await expect(samples.nth(1)).toHaveAttribute("href", "/work/finance-data-studio.pdf");
    await expect(samples.nth(1)).toContainText("Finance Data Studio");
    // The label carries the file's real size, read at build time, in the same
    // "kind · detail" form as the essay's.
    const mb = (fs.statSync(path.join(process.cwd(), "public/work/finance-data-studio.pdf")).size / 1e6).toFixed(1);
    await expect(samples.nth(1)).toContainText(`PDF · 12 pages · ${mb} MB`);
    await expect(samples.nth(0)).toContainText(/Essay · \d+ min/);
    // Each card carries one line under its title: the essay's summary, and
    // the proposal's provenance, which names neither the company nor the role.
    const notes = page.locator(".sample-note");
    await expect(notes).toHaveCount(2);
    await expect(notes.nth(0)).toHaveText(/^Agents are starting to touch money\./);
    await expect(notes.nth(1)).toHaveText("Interview take-home, September 2026, built from public information.");
    const pdf = await request.get("/work/finance-data-studio.pdf");
    expect(pdf.status()).toBe(200);
    expect(pdf.headers()["content-type"]).toContain("application/pdf");
    expect((await pdf.body()).subarray(0, 5).toString()).toBe("%PDF-");
    // On a phone both samples sit above the first recording, so a recruiter
    // reaches them without scrolling past a full-height video.
    const phone = await page.context().browser()!.newContext({ viewport: { width: 390, height: 844 } });
    const pp = await phone.newPage();
    await pp.goto("/");
    const [lastSample, contents, firstFrame] = await pp.locator(".samples li:last-child, .contents, #yonmoku .frame").evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON() as DOMRect));
    expect(lastSample.bottom, "samples above the first recording on a phone").toBeLessThanOrEqual(firstFrame.top);
    // The Contents, with the pause switch, sits between them: an index before
    // the products, and the switch before anything that moves.
    expect(contents.top, "Contents after the samples").toBeGreaterThanOrEqual(lastSample.bottom);
    expect(contents.bottom, "Contents before the first recording").toBeLessThanOrEqual(firstFrame.top);
    await phone.close();
    // No resume on the site, by choice; never a dead link.
    await expect(page.getByRole("link", { name: /resume/i })).toHaveCount(0);
  });

  test("text is drawn solid: no entrance, no reveal, and nothing moves but the recordings", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage();
    await p.goto("/");
    // Straight after load, before any animation could finish, everything is
    // already at rest.
    const busy = await p.evaluate(() =>
      document.getAnimations().map((a) => (a as CSSAnimation).animationName ?? (a as CSSTransition).transitionProperty ?? "?"),
    );
    expect(busy, "running animations on load").toEqual([]);
    await expect(p.locator("canvas")).toHaveCount(0);
    await expect(p.locator(".progress, .beam, .grid-bg, [data-reveal]")).toHaveCount(0);
    await expect(p.getByRole("heading", { level: 1 })).toHaveCSS("opacity", "1");
    await ctx.close();
  });

  test("a reader who stops mid-slide sees the incoming chapter's title and tagline whole", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage();
    await p.goto("/");
    await p.evaluate(() => document.fonts.ready);
    for (const slug of ["squeeze", "vitality-weeks", "highschooltrends"]) {
      // Stop with the chapter's top 30% down the viewport: most of it is on
      // screen, still sliding over the one before.
      const top = await p.locator(`#${slug}`).evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
      await p.evaluate((y) => window.scrollTo(0, y), Math.round(top - 0.3 * 900));
      await p.waitForTimeout(400);
      // Effective opacity of the title, the tagline and every element inside
      // them (a word span included): the product of its own and every ancestor's.
      const seen = await p.locator(`#${slug} h2, #${slug} h2 *, #${slug} .ch-tag, #${slug} .ch-tag *`).evaluateAll((els) =>
        els.map((e) => {
          let o = 1;
          for (let n: Element | null = e; n; n = n.parentElement) o *= Number(getComputedStyle(n).opacity);
          return o;
        }),
      );
      expect(Math.min(...seen), `${slug} title and tagline opacity mid-slide`).toBeGreaterThan(0.95);
    }
    await ctx.close();
  });

  test("a pause switch stops everything that moves on its own, keeps focus, and is remembered", async ({ browser }) => {
    for (const [w, h, where] of [[1440, 900, ".rail .motion-toggle"], [390, 844, ".contents .motion-toggle"]] as const) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h } });
      const p = await ctx.newPage();
      await p.goto("/");
      const toggle = p.locator(where);
      await expect(toggle, `switch visible at ${w}px`).toBeVisible();
      await expect(p.locator(".motion-toggle:visible"), `one switch at ${w}px`).toHaveCount(1);
      const video = p.locator("#yonmoku video");
      // Recordings play only near the viewport, so every check below brings
      // the recording into view first: paused must mean paused by the switch.
      const inView = () => video.evaluate((v) => v.scrollIntoView({ block: "center", behavior: "instant" }));
      await inView();
      await expect.poll(() => video.evaluate((v: HTMLVideoElement) => !v.paused), { message: "plays before pausing" }).toBe(true);

      await toggle.focus();
      await p.keyboard.press("Enter");
      await expect(toggle).toHaveAttribute("aria-pressed", "true");
      await expect(toggle).toHaveText(/play motion/i);
      await expect(toggle).toBeFocused();
      await expect(p.locator("html")).toHaveAttribute("data-motion", "paused");
      await inView();
      await p.waitForTimeout(800);
      expect(await video.evaluate((v: HTMLVideoElement) => v.paused), "recording paused while in view").toBe(true);

      // Remembered across a reload, before anything starts moving.
      await p.reload();
      await expect(p.locator("html")).toHaveAttribute("data-motion", "paused");
      await inView();
      await p.waitForTimeout(800);
      expect(await video.evaluate((v: HTMLVideoElement) => v.paused), "still paused after reload, in view").toBe(true);

      await p.locator(where).click();
      await expect(p.locator("html")).not.toHaveAttribute("data-motion", "paused");
      await inView();
      await expect.poll(() => video.evaluate((v: HTMLVideoElement) => !v.paused), { message: "plays again" }).toBe(true);
      await ctx.close();
    }
  });

  test("the rail leads back to the intro, names its chapters, and Contents marks nothing when nothing is pinned", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage();
    await p.goto("/");
    const rail = p.locator("nav.rail a");
    await expect(rail.first()).toHaveAccessibleName("00 Intro");
    await expect(rail.nth(2)).toHaveAccessibleName("02 Squeeze");
    await p.locator("nav.rail a[href='#squeeze']").click();
    await expect.poll(() => p.evaluate(() => window.scrollY)).toBeGreaterThan(900);
    await rail.first().click();
    await expect.poll(() => p.evaluate(() => window.scrollY), { message: "back at the intro" }).toBeLessThan(5);
    await p.waitForTimeout(300);
    expect(await p.locator(".samples").evaluate((e) => Number(getComputedStyle(e.closest(".c0-a")!).opacity)), "work samples visible again").toBe(1);
    await expect(p.locator("nav.rail li.is-current a")).toHaveAccessibleName("00 Intro");

    // The rail never paints over a chapter, even while a hover label widens it.
    const top = await p.locator("#squeeze").evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
    await p.evaluate((y) => window.scrollTo(0, y), Math.round(top - 0.3 * 900));
    await p.waitForTimeout(400);
    await p.locator("nav.rail a[href='#vitality-weeks']").hover();
    // Probe the right edge of every line box of the title.
    const covered = await p.locator("#squeeze h2 a").evaluate((a) => {
      const r = document.createRange();
      r.selectNodeContents(a);
      return Array.from(r.getClientRects()).filter((box) => {
        const hit = document.elementFromPoint(box.right - 4, box.top + box.height / 2);
        return !hit || !a.contains(hit);
      }).length;
    });
    expect(covered, "title line ends hidden under the rail").toBe(0);
    await ctx.close();

    const phone = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const q = await phone.newPage();
    await q.goto("/");
    await expect(q.locator(".contents li.is-current")).toHaveCount(0);
    await phone.close();
  });

  test("the page ends on the last product, then a footer of plain links", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#highschooltrends .ch-next")).toHaveCount(0);
    await expect(page.locator(".closing, footer .colophon")).toHaveCount(0);
    const footer = page.locator("footer");
    await expect(footer.getByRole("link")).toHaveText(["Contact me", "LinkedIn", "GitHub", "RSS"]);
  });

  test("at the bottom of the page the last chapter meets the footer, with no empty screen between", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage();
    await p.goto("/");
    await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await p.waitForTimeout(300);
    const [last, footer] = await p.locator("#highschooltrends, footer").evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON() as DOMRect));
    expect(footer.top - last.bottom, "gap between the last chapter and the footer").toBeLessThan(80);
    expect(last.bottom, "the last chapter is on screen above the footer").toBeGreaterThan(300);
    // Nothing slides over the last chapter, so it is never dimmed or shrunk.
    expect(await p.locator("#highschooltrends .chapter-inner").evaluate((e) => getComputedStyle(e).transform)).toBe("none");
    await ctx.close();
  });

  test("Contents, the rail and the chapter marks number the same four products", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".contents li .mono")).toHaveText(["01", "02", "03", "04"]);
    await expect(page.locator("nav.rail .rail-num")).toHaveText(["00", "01", "02", "03", "04"]);
    await expect(page.locator(".ch-mark")).toHaveText(["01 of 04", "02 of 04", "03 of 04", "04 of 04"]);
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
      const p = await ctx.newPage();
      await p.goto("/");
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
      await ctx.close();
    }
  });

  test("Person JSON-LD is present, names the owner and links the profiles", async ({ page }) => {
    await page.goto("/");
    const ld = await page.locator('script[type="application/ld+json"]').first().textContent();
    const json = JSON.parse(ld ?? "{}");
    expect(json["@type"]).toBe("Person");
    expect(json.name).toBe("James Shin");
    expect(json.url).toBe("https://jamesshin.tech/");
    expect(json.sameAs).toEqual(["https://github.com/jamesshintech", "https://www.linkedin.com/in/jamesshin2"]);
    // The footer links the same profiles a visitor can check.
    await expect(page.locator("footer").getByRole("link", { name: "GitHub" })).toHaveAttribute("href", "https://github.com/jamesshintech");
  });
});

test.describe("recordings", () => {
  test("play when scrolled into view; under reduced motion hold the poster until Play is pressed", async ({ browser }) => {
    for (const reducedMotion of ["no-preference", "reduce"] as const) {
      const ctx = await browser.newContext({ reducedMotion });
      const p = await ctx.newPage();
      await p.goto("/");
      const tile = p.locator("#squeeze");
      await tile.scrollIntoViewIfNeeded();
      const video = tile.locator("video");
      const playing = () => video.evaluate((v: HTMLVideoElement) => !v.paused);
      if (reducedMotion === "no-preference") {
        await expect.poll(playing, { message: "plays in view" }).toBe(true);
        await expect(tile.getByRole("button", { name: /play/i })).toHaveCount(0);
      } else {
        const play = tile.getByRole("button", { name: /^play \d+s loop$/i });
        await expect(play).toBeVisible();
        await p.waitForTimeout(800);
        expect(await playing(), "holds the poster under reduced motion").toBe(false);
        await play.focus();
        await p.keyboard.press("Enter");
        await expect.poll(playing, { message: "plays once asked" }).toBe(true);
        // The same button becomes Pause, and focus stays on it.
        const control = tile.locator(".loop .play");
        await expect(control).toHaveText("Pause loop");
        await expect(control).toBeFocused();
        await p.keyboard.press("Enter");
        await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.paused), { message: "pauses when asked" }).toBe(true);
        await expect(control).toHaveText(/^Play \d+s loop$/);
        // The button sits outside the recording's link: pressing it must not open the store.
        expect(ctx.pages(), "Play opened another page").toHaveLength(1);
      }
      await ctx.close();
    }
  });
});

test.describe("writing", () => {
  test("one essay is published, and the list says only what it holds", async ({ page }) => {
    await page.goto("/writing");
    const links = page.locator("ul.archive a");
    await expect(links).toHaveCount(1);
    await expect(links.nth(0)).toContainText("Billing Controls: From Checklists to Harnesses");
    await expect(page.locator(".reader header .line")).toHaveText("1 essay · RSS");
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
    // Dated the day it was written, never backdated; the 2026-11-01 edit
    // shows as a revision on the page and in the JSON-LD.
    await expect(page.locator(".reader header .meta")).toContainText("October 23, 2026");
    await expect(page.locator(".reader header .meta")).toContainText("revised November 1, 2026");
    const lds = (await page.locator('script[type="application/ld+json"]').allTextContents()).map((t) => JSON.parse(t));
    const article = lds.find((ld) => ld["@type"] === "Article");
    expect(article?.datePublished).toBe("2026-10-23");
    expect(article?.dateModified).toBe("2026-11-01");
    // No kicker restating the hero's years.
    await expect(page.locator(".prose .byline")).toHaveCount(0);

    await expect(page.locator(".prose .bluf")).toContainText("Bottom line.");
    const figs = page.locator(".prose figure.fig");
    await expect(figs).toHaveCount(2);
    await expect(figs.nth(0).locator("figcaption")).toHaveText(/^Diagram 1\./);
    await expect(figs.nth(1).locator("figcaption")).toHaveText(/^Diagram 2\./);
    await expect(figs.nth(0).locator(".fig-lanes > li")).toHaveCount(3);
    await expect(figs.nth(1).locator(".fig-flow > li")).toHaveCount(6);

    // Every table scrolls inside a keyboard-focusable region, never the page.
    await expect(page.locator(".prose table")).toHaveCount(3);
    await expect(page.locator(".prose .table-scroll[tabindex='0'] > table")).toHaveCount(3);

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

test.describe("retired routes", () => {
  for (const path of ["/desktop", "/real-estate", "/log", "/api/analytics/website", "/api/newsletter/subscribe"]) {
    test(`${path} is gone`, async ({ request }) => {
      const res = await request.get(path);
      expect(res.status()).toBe(404);
    });
  }
});
