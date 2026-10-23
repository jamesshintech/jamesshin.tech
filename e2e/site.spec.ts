import { test, expect } from "@playwright/test";

// Strings that must never appear on a public surface again. Keep in sync
// with the PII guard; this is the deployed-surface check, not the diff check.
const BANNED = [/JJ Fisher/i, /jjfisher\.dev/i, /FirstHand/i, /single-family/i, /holding company/i];

test.describe("home", () => {
  test("renders the builder page with every project and its receipts", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/James Shin/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("I ship the");

    // The ledger names every project and links to its chapter; each chapter
    // leads with a takeaway headline, three receipts and a real frame.
    const ledger = page.getByRole("list", { name: "Projects on this page" });
    const chapters: [string, string, RegExp][] = [
      ["highschooltrends", "HighSchoolTrends.org", /30,000\+/],
      ["vitality-weeks", "Vitality Weeks", /4,680/],
      ["squeeze", "Squeeze: The Estimation Duel", /7,900\+/],
      ["yonmoku", "Yonmoku: 3D Four in a Row", /three/],
    ];
    for (const [slug, name, headline] of chapters) {
      await expect(ledger.getByRole("link", { name })).toHaveAttribute("href", `#${slug}`);
      const section = page.locator(`section#${slug}`);
      await expect(section.getByRole("heading", { level: 2 })).toContainText(headline);
      await expect(section.locator("ul.receipts li")).toHaveCount(3);
      if (slug === "squeeze") {
        // The Squeeze chapter is a playable round, not a frame.
        await expect(section.getByRole("button", { name: /lock it in/i })).toBeVisible();
      } else {
        await expect(section.locator("img.frame")).toHaveAttribute("src", /\/frames\/.+\.webp$/);
      }
    }
    // The 3D viewer must not load three.js or the model until asked.
    const scripts = await page.locator("script[src]").evaluateAll((els) => els.map((e) => (e as HTMLScriptElement).src));
    expect(scripts.some((s) => /three/i.test(s))).toBe(false);
    // Yonmoku is in review, so it must not be labelled live.
    await expect(ledger).toContainText("In review");
    await expect(ledger.getByText("Live")).toHaveCount(3);

    const html = await page.content();
    for (const re of BANNED) expect(html, `banned string ${re}`).not.toMatch(re);
    expect(html).not.toContain("/_vercel/insights");
  });

  test("outbound project links point at the real listings", async ({ page }) => {
    await page.goto("/");
    const hrefs = await page.locator("a.btn").evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href));
    expect(hrefs).toContain("https://apps.apple.com/us/app/squeeze-the-estimation-duel/id6803632348");
    expect(hrefs).toContain("https://apps.apple.com/us/app/vitality-weeks/id6759621537");
    expect(hrefs).toContain("https://highschooltrends.org/");
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
