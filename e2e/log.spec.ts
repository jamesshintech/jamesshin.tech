import { test, expect } from "@playwright/test";

// Keep in sync with e2e/site.spec.ts.
const BANNED = [/JJ Fisher/i, /jjfisher\.dev/i, /single-family/i, /holding company/i];
const ALLOWED_HOSTS = ["apps.apple.com", "highschooltrends.org", "jamesshin.tech"];

test.describe("shipping log", () => {
  test("/log lists dated entries with sources and no banned strings", async ({ page }) => {
    const res = await page.goto("/log");
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("What shipped");

    const entries = page.locator("ol.patch > li");
    expect(await entries.count()).toBeGreaterThanOrEqual(5);
    // Every entry carries its source line.
    expect(await page.locator("ol.patch > li p.mono").count()).toBe(await entries.count());

    const html = await page.content();
    for (const re of BANNED) expect(html, `banned string ${re}`).not.toMatch(re);
    expect(html).not.toMatch(/ca-app-pub-/);
    // The only email on the page is the footer's contact address.
    expect(html.replace(/contact@jamesshin\.tech/g, "")).not.toMatch(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
  });

  test("every outbound link on /log is on an allowed host", async ({ page }) => {
    await page.goto("/log");
    const hrefs = await page.locator("main a[href^='http']").evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href));
    expect(hrefs.length).toBeGreaterThan(0);
    for (const h of hrefs) {
      const host = new URL(h).hostname;
      expect(ALLOWED_HOSTS, `host ${host} from ${h}`).toContain(host);
    }
  });
});
