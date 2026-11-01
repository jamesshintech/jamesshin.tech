# jamesshin.tech

A one-page work sample: four shipped products (each a recording of the real
app, its own one-line description and a link), then essays. Next.js 15 App
Router, Tailwind v4, TypeScript, pnpm, deployed on Vercel.

## Commands
- `pnpm dev`: fetches the fonts, then starts the dev server on :3000
- `pnpm build && pnpm start`: production build and server
- `pnpm lint`, `pnpm typecheck`, `pnpm test:e2e`

## Design
DESIGN.md is the source of truth: moss `#D9DCCB` ground, ink `#14170F`, one
raspberry accent `#E0497E` used in three places only; Archivo, Sentient and
Martian Mono. Tokens live in `app/globals.css`. Ask before departing from it.

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
- First-load JS at Next's baseline (about 102 kB shared); Lighthouse 95+
- Sentient may be self-hosted but not redistributed: it is fetched at build
  time by `scripts/fetch-fonts.mjs` and git-ignored. Never commit font files.
- The banned-strings check reads private patterns from `BANNED_PATTERNS`
  (CI secret or `.env.local`). Never write those patterns into the repo.
