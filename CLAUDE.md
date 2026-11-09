# jamesshin.tech

A one-page work sample: the name, one line of background, two labelled work
samples, four shipped products (each a recording of the real app, its own
one-line description and a link), set in the Yonmoku room; essays under /writing. Next.js 15 App Router,
Tailwind v4, TypeScript, pnpm, deployed on Vercel.

## Commands
- `pnpm dev`: starts the dev server on :3000
- `pnpm build && pnpm start`: production build and server
- `pnpm lint`, `pnpm typecheck`, `pnpm test:e2e`

## Design
DESIGN.md is the source of truth: charcoal `#1C1C1A` ground, cream `#F2EFE6`
type, amber `#F2B134` only for "here" (the current nav item, the active row
and its object, the work-samples heading); Space Grotesk and JetBrains Mono
from the pinned `@fontsource` packages via `next/font/local` (never
`next/font/google`: its build-time fetch broke on Vercel). Tokens live in
`app/globals.css`. The home page is the Yonmoku room (`lib/room/`, three.js,
loaded after idle from its own chunk) behind a column that carries every word
and link (`components/home/StudyHome.tsx`); each item is a row and an object,
and a product's recording shows only in its panel. Text is never animated; no
pointer effects outside the room, no colophon, no end-of-page recap (see the
decisions log). Ask before departing from it.

## The room
- Budgets, enforced by e2e: about 100 draw calls, 40k triangles, 40 shader
  programs; three.js never in the first load; everything released on unmount.
- Never strain the device: 30 fps at rest (`frameBudget`), full rate only
  after an interaction (`stage.boost`); stop when the strip the room shows
  through scrolls away or a panel covers it; shadow map on demand
  (`reshadow()` when a caster moves); software WebGL gets the picture.
  `?q=low|high` forces the room on any WebGL 2 (tests rely on it).
- After changing the scene, regenerate the pictures shown while it loads:
  `node scripts/room-posters.mjs` against `pnpm build && pnpm start`.
- GLSL: never write a reversed `smoothstep` (edge0 >= edge1); it is undefined
  and returns 0 on Apple's Metal path. Write `1.0 - smoothstep(lo, hi, x)`.
- `?debug=1` shows the frame meter and exposes `window.__room`; `?time=`,
  `?q=low|high`, `?dpr=` and `?motion=off` pin the light, tier, pixel ratio
  and motion.

## Work samples
`siteConfig.workSamples` in `data/config.ts` lists them in order: an essay by
slug, or a PDF under `public/work/` with its page count and a provenance note
that says what the document is and where its facts came from. Never present a
take-home or a proposal as client work; the note is printed under the link.
Each card carries one line: the essay's summary, or the PDF's provenance.

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
- No UI or animation libraries and no AI-generated imagery; three.js
  (pinned) only for the home page's room
- No static images on the interface: products are recordings, essay diagrams
  are HTML figures, the room's still is a render of the room
- No cookies, analytics or tracking
- First-load JS within a few kB of Next's baseline (102 kB shared, 109 kB home); Lighthouse 95+
- Techniques taken from elsewhere name their source in a comment
- The banned-strings check reads private patterns from `BANNED_PATTERNS`
  (CI secret or `.env.local`). Never write those patterns into the repo.
