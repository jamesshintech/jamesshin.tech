// Unit tests for the essay pipeline. They need no browser or server; the
// Playwright runner is used so the repo has one test tool.
import { test, expect } from "@playwright/test";
import { jsonLd } from "../lib/json-ld";
import { parsePost, renderPostHtml, wordCount } from "../lib/writing";

const essay = (frontmatter: string, body = "Body text.") => `---\n${frontmatter}\n---\n\n${body}\n`;
const valid = 'slug: s\ntitle: "T"\ndate: 2026-10-23\ntype: essay\nsummary: "S"\ndraft: false';

test.describe("wordCount", () => {
  test("counts prose and leaves figures, code and footnote markers out", () => {
    const prose = "One two three four.";
    expect(wordCount(prose)).toBe(4);
    expect(wordCount(`${prose}\n\n<figure class="fig"><ol><li>Label words here</li></ol></figure>`)).toBe(4);
    expect(wordCount(`${prose} \`some code\``)).toBe(4);
    expect(wordCount(`${prose}[^1]`)).toBe(4);
    expect(wordCount("```\nconst a = 1;\n```\nOne two")).toBe(2);
  });

  test("counts a link's text, not its URL", () => {
    expect(wordCount("Read [the source](https://example.com/a/very/long/path) now")).toBe(4);
  });
});

test.describe("parsePost", () => {
  test("derives word count and a reading time of at least one minute", () => {
    const post = parsePost("a.md", essay(valid, "One two three four five six seven eight nine ten eleven."));
    expect(post.wordCount).toBe(11);
    expect(post.readingMinutes).toBe(1);
    expect(post.draft).toBe(false);
    expect(post.revised).toBeUndefined();
  });

  test("reads an optional revised date", () => {
    expect(parsePost("a.md", essay(`${valid}\nrevised: 2026-10-30`)).revised).toBe("2026-10-30");
  });

  test("names the file and the field when frontmatter is incomplete", () => {
    expect(() => parsePost("broken.md", essay(valid.replace('title: "T"\n', "")))).toThrow(/"title".*broken\.md/);
  });

  test("rejects any type but essay", () => {
    expect(() => parsePost("d.md", essay(valid.replace("type: essay", "type: dispatch")))).toThrow(/Invalid "type" in d\.md/);
  });
});

test.describe("renderPostHtml", () => {
  test("wraps every table in a focusable region that scrolls sideways", async () => {
    const post = parsePost("t.md", essay(valid, "| a | b |\n|---|---|\n| 1 | 2 |"));
    const { html } = await renderPostHtml(post);
    expect(html).toMatch(/<div class="table-scroll" role="region" aria-label="[^"]+" tabindex="0">\s*<table>[\s\S]*<\/table>\s*<\/div>/);
  });

  test("keeps the footnote back-arrow as text, not an emoji", async () => {
    const post = parsePost("f.md", essay(valid, "Claim.[^1]\n\n[^1]: Source."));
    const { html } = await renderPostHtml(post);
    expect(html).toContain('class="data-footnote-backref">↩︎');
  });
});

test.describe("jsonLd", () => {
  test("cannot close its script tag early, and still parses back", () => {
    const out = jsonLd({ name: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("<");
    expect(JSON.parse(out).name).toBe("</script><script>alert(1)</script>");
  });
});
