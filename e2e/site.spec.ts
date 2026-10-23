import { test, expect } from "@playwright/test";

// Strings that must never appear on a public surface again. Keep in sync
// with the PII guard; this is the deployed-surface check, not the diff check.
const BANNED = [/JJ Fisher/i, /jjfisher\.dev/i, /single-family/i, /holding company/i];

test.describe("home", () => {
  test("renders the box back: hero, spec strip, four titles with loops and receipts", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/James Shin/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("I ship the whole thing");
    await expect(page.getByText("Players: 1")).toBeVisible();

    const chapters: [string, string][] = [
      ["yonmoku", "Yonmoku: 3D Four in a Row"],
      ["squeeze", "Squeeze: The Estimation Duel"],
      ["vitality-weeks", "Vitality Weeks"],
      ["highschooltrends", "HighSchoolTrends.org"],
    ];
    for (const [slug, name] of chapters) {
      const section = page.locator(`section#${slug}`);
      await expect(section.getByRole("heading", { level: 2 })).toContainText(name);
      await expect(section.locator("p.fine")).toContainText("Sources:");
      if (slug === "squeeze") {
        await expect(section.getByRole("button", { name: /lock it in/i })).toBeVisible();
      } else {
        // Every visual is a recording of the real app.
        const video = section.locator("video");
        await expect(video).toHaveCount(1);
        await expect(video.locator("source[type='video/webm']")).toHaveAttribute("src", /\/video\/.+\.webm$/);
        await expect(video).toHaveAttribute("poster", /\/video\/.+\.webp$/);
      }
    }
    // Yonmoku is in review, so it must not be labelled live.
    await expect(page.locator("section#yonmoku")).toContainText(/In (App Store )?review/);
    await expect(page.locator("section#yonmoku p.spec")).not.toContainText(/\bLive\b/);

    // No static product images anywhere.
    expect(await page.locator("img").count()).toBe(0);

    const html = await page.content();
    for (const re of BANNED) expect(html, `banned string ${re}`).not.toMatch(re);
    expect(html).not.toContain("/_vercel/insights");
  });

  test("three.js is not in the server-rendered page; it arrives only after idle or a click", async ({ request }) => {
    const html = await (await request.get("/")).text();
    const srcs = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]);
    expect(srcs.length).toBeGreaterThan(0);
    expect(srcs.some((s) => /three/i.test(s))).toBe(false);
    // The three.js bundle is a separate chunk, so it cannot be inlined in the HTML either.
    expect(html).not.toMatch(/WebGLRenderer/);
  });

  test("the hero carries the real board's loop and a spin control", async ({ page }) => {
    await page.goto("/");
    const key = page.locator("header.hero .viewer");
    await expect(key.locator("video")).toHaveCount(1);
    await expect(key.getByRole("button", { name: /spin it/i })).toBeVisible();
  });

  test("outbound project links point at the real listings", async ({ page }) => {
    await page.goto("/");
    const hrefs = await page.locator("a.btn").evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href));
    expect(hrefs).toContain("https://apps.apple.com/us/app/squeeze-the-estimation-duel/id6803632348");
    expect(hrefs).toContain("https://apps.apple.com/us/app/vitality-weeks/id6759621537");
    expect(hrefs).toContain("https://highschooltrends.org/");
  });

  test("manufacturer's notes and patch notes are present", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("ol.notes li")).toHaveCount(6);
    await expect(page.locator("section#patch ol.patch li")).toHaveCount(5);
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
