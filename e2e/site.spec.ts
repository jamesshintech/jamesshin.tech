import { test, expect } from "@playwright/test";

// Strings that must never appear on a public surface again. Keep in sync
// with the PII guard; this is the deployed-surface check, not the diff check.
const BANNED = [/JJ Fisher/i, /jjfisher\.dev/i, /single-family/i, /holding company/i];

const BILLING = "/writing/2026-w43-billing-controls-from-checklists-to-harnesses";
const MOAT = "/writing/2026-w17-the-distribution-moat-in-the-ai-era";

test.describe("home", () => {
  test("a grid of four product tiles, each a recording with a one-liner and a link, then the essays", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/James Shin/);

    const tiles = page.locator("ol.tiles > li.tile");
    await expect(tiles).toHaveCount(4);
    const expected: [string, string, RegExp][] = [
      ["yonmoku", "Yonmoku: 3D Four in a Row", /jjfisherdev\.github\.io/],
      ["squeeze", "Squeeze: The Estimation Duel", /apps\.apple\.com/],
      ["vitality-weeks", "Vitality Weeks", /apps\.apple\.com/],
      ["highschooltrends", "HighSchoolTrends.org", /highschooltrends\.org/],
    ];
    for (const [slug, name, host] of expected) {
      const tile = page.locator(`li#${slug}`);
      await expect(tile.getByRole("heading", { level: 2 })).toHaveText(name);
      await expect(tile.getByRole("heading", { level: 2 }).getByRole("link")).toHaveAttribute("href", host);
      await expect(tile.locator("p.tile-line")).not.toBeEmpty();
      // Every visual is a recording of the real app.
      const video = tile.locator("video");
      await expect(video).toHaveCount(1);
      await expect(video.locator("source[type='video/webm']")).toHaveAttribute("src", /\/video\/.+\.webm$/);
      await expect(video).toHaveAttribute("poster", /\/video\/.+\.webp$/);
    }
    await expect(page.locator("li#yonmoku p.tile-meta")).toContainText(/review/i);
    await expect(page.locator("li#yonmoku p.tile-meta")).not.toContainText(/\bLive\b/);

    // Concise: no static images, and the whole main column under 120 words.
    expect(await page.locator("img").count()).toBe(0);
    const words = await page.locator("main").evaluate((m) => {
      const clone = m.cloneNode(true) as HTMLElement;
      clone.querySelectorAll("dialog").forEach((d) => d.remove());
      return clone.innerText.trim().split(/\s+/).filter(Boolean).length;
    });
    expect(words).toBeLessThan(120);

    await expect(page.locator("section#essays ul.archive li")).toHaveCount(2);

    const html = await page.content();
    for (const re of BANNED) expect(html, `banned string ${re}`).not.toMatch(re);
    expect(html).not.toContain("/_vercel/insights");
  });

  test("the grid uses the width: 4 across on desktop, 2 on phones, no sideways scroll", async ({ browser }) => {
    for (const [w, cols] of [[1440, 4], [390, 2], [320, 2]] as const) {
      const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
      const p = await ctx.newPage();
      await p.goto("/");
      const tops = await p.locator("ol.tiles > li.tile").evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
      expect(tops.filter((t) => t === tops[0]).length, `tiles in the first row at ${w}px`).toBe(cols);
      expect(await p.evaluate(() => document.documentElement.scrollWidth), `scroll width at ${w}px`).toBe(w);
      await ctx.close();
    }
  });

  test("Play a round opens the Squeeze sketch in a dialog and Close dismisses it", async ({ page }) => {
    await page.goto("/");
    const dialog = page.getByRole("dialog", { name: /play a round of squeeze/i });
    await expect(dialog).toBeHidden();
    await page.locator("li#squeeze").getByRole("button", { name: /play a round/i }).click();
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: /lock it in/i })).toBeVisible();
    await dialog.getByRole("button", { name: /close/i }).click();
    await expect(dialog).toBeHidden();
  });

  test("contact is jjhlee92@gmail.com and there is no Log section", async ({ page, request }) => {
    await page.goto("/");
    await expect(page.locator("nav a[href^='mailto:']")).toHaveAttribute("href", "mailto:jjhlee92@gmail.com");
    await expect(page.locator("footer a[href^='mailto:']")).toHaveText("jjhlee92@gmail.com");
    await expect(page.locator("nav").getByRole("link", { name: /^log$/i })).toHaveCount(0);
    expect((await request.get("/log")).status()).toBe(404);
    expect(await (await request.get("/sitemap.xml")).text()).not.toContain("/log");
  });

  test("the essay quotes without narrating who it quotes", async ({ request }) => {
    const html = await (await request.get(MOAT)).text();
    expect(html).not.toMatch(/in the words of/i);
    expect(html).toContain("TL;DR");
    // Every quotation carries its source as a link.
    expect((html.match(/— <a href="https:\/\//g) ?? []).length).toBeGreaterThanOrEqual(10);
  });

  test("Person JSON-LD is present and names the owner", async ({ page }) => {
    await page.goto("/");
    const ld = await page.locator('script[type="application/ld+json"]').first().textContent();
    const json = JSON.parse(ld ?? "{}");
    expect(json["@type"]).toBe("Person");
    expect(json.name).toBe("James Shin");
    expect(json.url).toBe("https://jamesshin.tech/");
  });
});

test.describe("writing", () => {
  test("two essays are published, newest first", async ({ page }) => {
    await page.goto("/writing");
    const links = page.locator("ul.archive a");
    await expect(links).toHaveCount(2);
    await expect(links.nth(0)).toContainText("Billing Controls: From Checklists to Harnesses");
    await expect(links.nth(1)).toContainText("The Distribution Moat in the AI Era");
  });

  for (const [path, h1] of [[MOAT, "Distribution Moat"], [BILLING, "Billing Controls"]] as const) {
    test(`${h1} renders and carries no old-brand or employer strings`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(h1);
      const html = await page.content();
      for (const re of BANNED) expect(html, `banned string ${re}`).not.toMatch(re);
      expect(html).not.toContain("github.com/jjfisherdev/personalwebsite");
    });
  }

  test("the billing essay keeps its honest date, bottom line, diagrams, tables and sourced footnotes", async ({ page }) => {
    await page.goto(BILLING);
    // Dated the day it was written; never backdated.
    await expect(page.locator(".reader header .meta")).toContainText("October 23, 2026");
    const lds = (await page.locator('script[type="application/ld+json"]').allTextContents()).map((t) => JSON.parse(t));
    expect(lds.find((ld) => ld["@type"] === "Article")?.datePublished).toBe("2026-10-23");

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
    await expect(notes).toHaveCount(5);
    await expect(notes.nth(4).locator("a[href^='https://status.claude.com/incidents/']")).toHaveCount(2);
    const backref = await page.locator("a.data-footnote-backref").first().textContent();
    expect(backref).toBe("↩︎");
  });

  test("the distribution essay has one diagram per argument step, and the word count ignores them", async ({ page }) => {
    await page.goto(MOAT);
    const figs = page.locator(".prose figure.fig");
    await expect(figs).toHaveCount(3);
    for (let i = 0; i < 3; i++) await expect(figs.nth(i).locator("figcaption")).toHaveText(new RegExp(`^Figure ${i + 1}\\.`));
    // Diagram labels are not prose: the count stays what the text alone measures.
    await expect(page.locator(".reader header .meta")).toContainText("610 words");
  });

  test("essay figures and tables fit at phone and desktop widths, with no word squeezed out of its box", async ({ browser }) => {
    for (const w of [320, 390, 520, 820, 1440]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
      const p = await ctx.newPage();
      for (const path of [BILLING, MOAT]) {
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
    expect((rssText.match(/<item>/g) ?? []).length).toBe(2);
    // Figures travel in the feed as plain lists, so feed readers without CSS still get the content.
    expect(rssText).toContain('<figure class="fig');

    const sm = await request.get("/sitemap.xml");
    expect(sm.ok()).toBeTruthy();
    const smText = await sm.text();
    expect(smText).not.toContain("/real-estate");
    expect(smText).not.toContain("/desktop");
    expect(smText).not.toContain("jjfisher");
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
