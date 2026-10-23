import { test, expect } from "@playwright/test";

// Strings that must never appear on a public surface again. Keep in sync
// with the PII guard; this is the deployed-surface check, not the diff check.
const BANNED = [/JJ Fisher/i, /jjfisher\.dev/i, /single-family/i, /holding company/i];

test.describe("home", () => {
  test("four product rows, each a recording with a one-line description and a link, then the essays", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/James Shin/);

    const rows = page.locator("ol.rows > li.row");
    await expect(rows).toHaveCount(4);
    const expected: [string, string, RegExp][] = [
      ["yonmoku", "Yonmoku: 3D Four in a Row", /jjfisherdev\.github\.io/],
      ["squeeze", "Squeeze: The Estimation Duel", /apps\.apple\.com/],
      ["vitality-weeks", "Vitality Weeks", /apps\.apple\.com/],
      ["highschooltrends", "HighSchoolTrends.org", /highschooltrends\.org/],
    ];
    for (const [slug, name, host] of expected) {
      const row = page.locator(`li#${slug}`);
      await expect(row.getByRole("heading", { level: 2 })).toContainText(name);
      await expect(row.getByRole("heading", { level: 2 }).getByRole("link")).toHaveAttribute("href", host);
      await expect(row.locator("p.line")).not.toBeEmpty();
      // Every visual is a recording of the real app.
      const video = row.locator("video");
      await expect(video).toHaveCount(1);
      await expect(video.locator("source[type='video/webm']")).toHaveAttribute("src", /\/video\/.+\.webm$/);
      await expect(video).toHaveAttribute("poster", /\/video\/.+\.webp$/);
    }
    await expect(page.locator("li#yonmoku p.meta")).toContainText(/review/i);
    await expect(page.locator("li#yonmoku p.meta")).not.toContainText(/\bLive\b/);

    // Concise: no static images, and the whole main column under 160 words.
    expect(await page.locator("img").count()).toBe(0);
    const words = await page.locator("main").evaluate((m) => {
      const clone = m.cloneNode(true) as HTMLElement;
      clone.querySelectorAll("details").forEach((d) => d.remove());
      return clone.innerText.trim().split(/\s+/).filter(Boolean).length;
    });
    expect(words).toBeLessThan(160);

    // The essays follow the products.
    await expect(page.locator("section#essays ul.archive li")).toHaveCount(1);

    const html = await page.content();
    for (const re of BANNED) expect(html, `banned string ${re}`).not.toMatch(re);
    expect(html).not.toContain("/_vercel/insights");
  });

  test("the Squeeze round is there but folded away", async ({ page }) => {
    await page.goto("/");
    const fold = page.locator("li#squeeze details");
    await expect(fold).toHaveCount(1);
    await expect(fold.getByRole("button", { name: /lock it in/i })).toBeHidden();
    await fold.locator("summary").click();
    await expect(fold.getByRole("button", { name: /lock it in/i })).toBeVisible();
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
  test("only the distribution moat essay is published", async ({ page }) => {
    await page.goto("/writing");
    const links = page.locator("ul.archive a");
    await expect(links).toHaveCount(1);
    await expect(links.first()).toContainText("The Distribution Moat in the AI Era");
  });

  test("the essay renders and carries no old-brand footer", async ({ page }) => {
    await page.goto("/writing/2026-w17-the-distribution-moat-in-the-ai-era");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Distribution Moat");
    const html = await page.content();
    for (const re of BANNED) expect(html, `banned string ${re}`).not.toMatch(re);
    expect(html).not.toContain("github.com/jjfisherdev/personalwebsite");
  });

  test("rss and sitemap use the new domain only", async ({ request }) => {
    const rss = await request.get("/writing/rss.xml");
    expect(rss.ok()).toBeTruthy();
    const rssText = await rss.text();
    expect(rssText).toContain("https://jamesshin.tech/writing/");
    expect(rssText).not.toContain("jjfisher");

    const sm = await request.get("/sitemap.xml");
    expect(sm.ok()).toBeTruthy();
    const smText = await sm.text();
    expect(smText).not.toContain("/real-estate");
    expect(smText).not.toContain("/desktop");
    expect(smText).not.toContain("jjfisher");
  });
});

test.describe("retired routes", () => {
  for (const path of ["/desktop", "/real-estate", "/api/analytics/website", "/api/newsletter/subscribe"]) {
    test(`${path} is gone`, async ({ request }) => {
      const res = await request.get(path);
      expect(res.status()).toBe(404);
    });
  }
});
