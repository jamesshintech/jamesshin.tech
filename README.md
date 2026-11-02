# jamesshin.tech

[![CI](https://github.com/jamesshintech/jamesshin.tech/actions/workflows/ci.yml/badge.svg)](https://github.com/jamesshintech/jamesshin.tech/actions/workflows/ci.yml)

The source of [jamesshin.tech](https://jamesshin.tech): my name, one line of background, two work samples (a billing-controls essay and a finance-platform proposal), and four products I built and shipped, each shown by a recording of the real app. Essays are under `/writing`.

Every route, including the OG image, is prerendered at build time. There are no cookies, analytics or client-side tracking, and first-load JavaScript stays close to Next.js's own baseline (102 kB shared; 108 kB for the home page, whose extra is the chapter scroll engine and the recording player). No text is animated and the chapters only pin once JavaScript runs, so the page is complete with JavaScript off.

## How it works

- **Next.js 15 App Router, fully static.** `/`, `/writing`, each essay, the RSS feed, the sitemap and the OG image are all built ahead of time.
- **Essays are Markdown in [`content/essays/`](content/essays).** [`lib/writing.ts`](lib/writing.ts) parses frontmatter with gray-matter and renders with remark and remark-gfm. Two small remark plugins: one wraps every table in a keyboard-focusable region that scrolls sideways, so a wide table never scrolls the page; one sets typographer's quotes in prose while leaving code, raw HTML and link targets untouched.
- **Diagrams are HTML, not images.** Each figure is an ordered list styled by the design system. It reflows at 320px, screen readers read it as a list, and RSS readers that drop CSS still get the content. Figures are left out of the reading-time word count.
- **Products are shown by recordings, never static screenshots.** [`VideoLoop`](components/story/VideoLoop.tsx) plays a WebM/MP4 loop when it scrolls into view, with a poster frame taken from the same recording. Under reduced motion it holds the poster and offers a Play button, which sits outside the recording's link so it is reachable by keyboard and screen reader.
- **The home page is a scroll story.** Each product gets a chapter that pins with `position: sticky` while the next slides over it. [`components/home/ScrollStory.tsx`](components/home/ScrollStory.tsx) drives what rides on that scroll (the covered chapter's scale and dim, the first chapter's intro giving way to its caption, the rail) with one passive listener and one `requestAnimationFrame`: offsets are measured on resize only, a frame reads `scrollY` and nothing else, and it writes only values that changed. Covered chapters become `inert` and pause their recording. Nothing intercepts the wheel; without JavaScript, under `prefers-reduced-motion` or on a phone the chapters are plain stacked sections.
- **Motion can be paused.** One switch ([`lib/motion.ts`](lib/motion.ts), [`MotionToggle`](components/home/MotionToggle.tsx)) stops the recordings, the only things that move on their own, as WCAG 2.2.2 asks; the choice is remembered and restored before first paint.
- **No decoration that moves.** No background canvas, no animated text, no scroll-progress bar, nothing that follows the pointer: the recordings carry the page. The pinned chapters' slot geometry follows React Bits' ScrollStack, named in a comment.
- **One design system, written down.** [`DESIGN.md`](DESIGN.md) defines the colors, type, spacing, every component and the decisions that led here, including what was tried and cut.

## What the tests guard

Playwright tests, run with no retries so a flaky test fails instead of passing on its second try. Those in [`e2e/site.spec.ts`](e2e/site.spec.ts) drive a browser; in CI they run against the production build (`next start`). Those in [`e2e/writing.unit.spec.ts`](e2e/writing.unit.spec.ts) test the essay pipeline directly. They cover:

- **Layout at real widths.** On desktop each recording sits beside its own copy with the sides alternating; on phones it sits above it, and the two work samples, then the Contents with the pause switch, come before the first recording. Reading pages keep one left edge, and a short one keeps its footer at the bottom of the window; the last chapter meets the footer with no empty screen. The Contents label and the pause switch share a baseline. No sideways scroll at 320, 390, 768, 1024 or 1440px. The nav stays on one row and the name never wraps, from 320 to 1440px.
- **Essay rendering.** Figures and tables fit at 320, 390, 520, 820 and 1440px. That check forbids mid-word breaks, so a word that does not fit shows up as overflow instead of being silently split.
- **Content contracts.** The billing essay keeps its publication date and revision date, bottom line, both diagrams, three tables and four footnotes, and the Stripe quote matches its source character for character. Claims a billing or audit reader would check stay corrected (SOX prescribes no control types; self-release under the limit is called a compensating control). The essay taken off the site redirects to `/writing`; the RSS feed and sitemap no longer list it.
- **Behaviour, not just content.** No animation is running when the page loads, and no canvas, progress line or reveal is on the page. Recordings play when scrolled into view and hold still under reduced motion until asked. The proposal PDF is served as a real PDF, its label carries its real size, its provenance note names neither company nor role, and neither does the file's own title. Reading pages share with the site's preview image. Every response carries `nosniff`, a referrer policy and no-framing headers. The word count leaves figures, code and footnote markers out. Missing frontmatter fails loudly, naming the file. Tables get their scroll region and show a soft edge where there is more. JSON-LD cannot close its script tag early.
- **Accessibility.** A pause switch stops everything that moves on its own and is remembered; the reduced-motion Play control becomes Pause and keeps focus; every page starts with a skip link to its one `main`; a reader who stops mid-slide sees the incoming chapter's title and tagline whole; the rail never covers or blocks a chapter.
- **Privacy.** Published pages must not contain personal contact details or leftovers from the site's previous version. The personal patterns live in a CI secret rather than the repo, and a failure reports which pattern matched by number, not by text. Retired routes return 404, and the RSS feed and sitemap use only the current domain.

Checks that guard against a past bug were run against that bug first and seen to fail; the reduced-motion test found one on its first run (the Play button sat inside a link hidden from assistive tech).

## Build

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build && pnpm start
pnpm lint && pnpm typecheck
pnpm test:e2e
```

Node 22 (CI and Vercel use the same major). Fonts come from `next/font/google` at build time; nothing is fetched by hand.

## Notes

- **History starts at the relaunch.** The site was rebuilt as jamesshin.tech on 2026-10-23. Earlier versions lived in a private repo and are not included.
- **My iOS apps are published through my company, JJ Fisher LLC,** which is also the name the site used before the relaunch.
- **Built with Claude Code.** Every change goes through the checks above, and each commit message explains the reasoning.
- **One version skew is deliberate.** `eslint-config-next` is on 16.x for its flat-config exports while `next` is on 15.5. The App Router renders with the React build that ships inside Next, which is why `@types/react` is on 19. Moving everything to Next 16 is a separate change.

## License

- **Code:** [MIT](LICENSE).
- **Essays** (`content/essays/`): © James Shin, licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Quoted material belongs to its authors.
- **App recordings and app names** (`public/video/`): © James Shin, all rights reserved.
- **Fonts:** Space Grotesk and JetBrains Mono are under the SIL Open Font License, served through `next/font/google`.
- **Ported geometry:** the pinned chapters' slot geometry is derived from React Bits ScrollStack (MIT, with the Commons Clause, which permits use in a site like this), rewritten by hand; the source is named in the code.
- **The proposal** (`public/work/finance-data-studio.pdf`): © James Shin, all rights reserved. Written for an interview from public information; the product names in it belong to their owners.
