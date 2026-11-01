# jamesshin.tech

A one-page work sample: the name, one line of background, two labelled work
samples, four shipped products (each a recording of the real app, its own
one-line description and a link), then essays. Next.js 15 App Router,
Tailwind v4, TypeScript, pnpm, deployed on Vercel.

## Commands
- `pnpm dev`: starts the dev server on :3000
- `pnpm build && pnpm start`: production build and server
- `pnpm lint`, `pnpm typecheck`, `pnpm test:e2e`

## Design
DESIGN.md is the source of truth: charcoal `#1C1C1A` ground, cream `#F2EFE6`
type, amber `#F2B134` only on the current nav item and the work-sample labels;
Space Grotesk and JetBrains Mono from `next/font/google`. Tokens live in
`app/globals.css`. The home page is a scroll story: chapter 0 (name, line, work
samples, Contents, the first product), then one pinned chapter per product,
then the essays; `components/home/ScrollStory.tsx` drives it with native
scrolling and nothing follows the pointer. The decisions log in DESIGN.md
records what was tried and cut. Ask before departing from it.

## Work samples
`siteConfig.workSamples` in `data/config.ts` lists them in order: an essay by
slug, or a PDF under `public/work/` with its page count and a provenance note
that says what the document is and where its facts came from. Never present a
take-home or a proposal as client work; the note is printed under the link.

## Adding a project
Edit `data/projects.ts`. The visual is a recording of the real app under
`public/video/` (`<slug>-loop.webm`, `.mp4`, and a `.webp` poster from the
same recording, phone-shaped), never a static screenshot. Use the product's
own one-line description. Status is `live` or `in-review`; never mark an
unapproved app live. Bump `numbersAsOf` in `data/config.ts`.

## Adding an essay
Add `content/essays/YYYY-Www-<slug>.md` with frontmatter `slug, title, date,
type: essay, summary, draft`. The date is the day it was written; never
backdate. If an essay is substantially rewritten later, add `revised:
YYYY-MM-DD`; the page and the Article JSON-LD (`dateModified`) show it. Every factual claim links to a source a reader can open, and quotes
match the source exactly. Diagrams use the HTML figure component in DESIGN.md
("Essay figure"), not images or SVG. The e2e suite pins the essay count.

## Constraints
- No UI or animation libraries, no WebGL or 3D viewers, no AI-generated imagery
- No static images: products are recordings, essay diagrams are HTML figures
- No cookies, analytics or tracking
- First-load JS within a few kB of Next's baseline (102 kB shared, 108 kB home); Lighthouse 95+
- No animation libraries: effects are ported by hand into CSS or a small
  client component, name their source in a comment, and have a static state
  under `prefers-reduced-motion`.
- The banned-strings check reads private patterns from `BANNED_PATTERNS`
  (CI secret or `.env.local`). Never write those patterns into the repo.
