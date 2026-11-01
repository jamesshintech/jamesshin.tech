# jamesshin.tech

[![CI](https://github.com/jamesshintech/jamesshin.tech/actions/workflows/ci.yml/badge.svg)](https://github.com/jamesshintech/jamesshin.tech/actions/workflows/ci.yml)

The source of [jamesshin.tech](https://jamesshin.tech): my name, one line of background, two work samples (a billing-controls essay and a finance-platform proposal), four products I built and shipped (each shown by a recording of the real app), and my essays.

Every route, including the OG image, is prerendered at build time. There are no cookies, analytics or client-side tracking, and first-load JavaScript stays close to Next.js's own baseline (102 kB shared; 110 kB for the home page, whose extra is the chapter scroll engine, the drifting-threads canvas and the reveals). The entrance animation is CSS and the chapters only pin once JavaScript runs, so the page is complete with JavaScript off.

## How it works

- **Next.js 15 App Router, fully static.** `/`, `/writing`, each essay, the RSS feed, the sitemap and the OG image are all built ahead of time.
- **Essays are Markdown in [`content/essays/`](content/essays).** [`lib/writing.ts`](lib/writing.ts) parses frontmatter with gray-matter and renders with remark and remark-gfm. A small remark plugin wraps every table in a keyboard-focusable region that scrolls sideways, so a wide table never scrolls the page.
- **Diagrams are HTML, not images.** Each figure is an ordered list styled by the design system. It reflows at 320px, screen readers read it as a list, and RSS readers that drop CSS still get the content. Figures are left out of the reading-time word count.
- **Products are shown by recordings, never static screenshots.** [`VideoLoop`](components/story/VideoLoop.tsx) plays a WebM/MP4 loop when it scrolls into view, with a poster frame taken from the same recording. Under reduced motion it holds the poster and offers a Play button, which sits outside the recording's link so it is reachable by keyboard and screen reader.
- **The home page is a scroll story.** Each product gets a chapter that pins with `position: sticky` while the next slides over it. [`components/home/ScrollStory.tsx`](components/home/ScrollStory.tsx) scrubs what rides on that scroll with one passive listener and one `requestAnimationFrame`: offsets are measured on resize only, a frame reads `scrollY` and nothing else, and it writes only values that changed. Covered chapters become `inert` and pause their recording. Nothing intercepts the wheel; without JavaScript, under `prefers-reduced-motion` or on a phone the chapters are plain stacked sections.
- **Motion is ported by hand.** The chapter geometry follows React Bits' ScrollStack, the title rise its ScrollReveal, the tagline Magic UI's text-reveal; the threads behind the first chapter are a Canvas 2D port of React Bits' Threads ([`components/home/Threads.tsx`](components/home/Threads.tsx)); the light circling the current frame is Magic UI's border-beam in CSS. Each names its source in a comment, and nothing follows the pointer.
- **One design system, written down.** [`DESIGN.md`](DESIGN.md) defines the colors, type, spacing, every component and the decisions that led here, including what was tried and cut.

## What the tests guard

31 Playwright tests, run with no retries so a flaky test fails instead of passing on its second try. The 22 in [`e2e/site.spec.ts`](e2e/site.spec.ts) drive a browser; in CI they run against the production build (`next start`). The 9 in [`e2e/writing.unit.spec.ts`](e2e/writing.unit.spec.ts) test the essay pipeline directly. They cover:

- **Layout at real widths.** On desktop each recording sits beside its own copy with the sides alternating; on phones it sits above it, and the two work samples come before the first recording. No sideways scroll at 320, 390, 768, 1024 or 1440px. The nav stays on one row and the name never wraps, from 320 to 1440px.
- **Essay rendering.** Figures and tables fit at 320, 390, 520, 820 and 1440px. That check forbids mid-word breaks, so a word that does not fit shows up as overflow instead of being silently split.
- **Content contracts.** The billing essay keeps its publication date, bottom line, both diagrams, three tables and five footnotes. The incident footnote links both status-page incidents, and the Stripe quote matches its source character for character.
- **Behaviour, not just content.** The entrance settles within two seconds, and under reduced motion nothing is hidden or animated. Recordings play when scrolled into view and hold still under reduced motion until asked. The proposal PDF is served as a real PDF and its provenance note is printed beside the link. The word count leaves figures, code and footnote markers out. Missing frontmatter fails loudly, naming the file. Tables get their scroll region. JSON-LD cannot close its script tag early.
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
- **Ported effects:** the chapter geometry, title rise and threads canvas are derived from React Bits (MIT, with the Commons Clause, which permits use in a site like this), and the tagline reveal, progress line and border beam from Magic UI (MIT). All are rewritten by hand; the source files are named in the code.
- **The proposal** (`public/work/finance-data-studio.pdf`): © James Shin, all rights reserved. Written for an interview from public information; the product names in it belong to their owners.
