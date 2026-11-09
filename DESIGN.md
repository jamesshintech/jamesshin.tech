---
name: jamesshin.tech
description: The Yonmoku room behind a column of work. The room fills the screen; a column carries the name, one line, two work samples and four products, and each item is also an object in the room. Charcoal ground, cream type, amber only on what says "here", one grotesk and one mono.
colors:
  primary: "#F2EFE6"
  on-primary: "#1C1C1A"
  surface: "#27271F"
  text: "#F2EFE6"
  text-muted: "rgba(242, 239, 230, 0.70)"
  accent: "#F2B134"
  on-accent: "#1C1C1A"
  ground: "#1C1C1A"
  rule: "rgba(242, 239, 230, 0.25)"
  rule-strong: "rgba(242, 239, 230, 0.70)"
typography:
  display:
    fontFamily: Space Grotesk
    fontWeight: 700
    fontSize: clamp(52px, 6.5vw, 96px)
    lineHeight: 1
    letterSpacing: -0.03em
  heading:
    fontFamily: Space Grotesk
    fontWeight: 700
    fontSize: clamp(28px, 3.4vw, 48px)
    lineHeight: 1.1
    letterSpacing: -0.02em
  body:
    fontFamily: Space Grotesk
    fontWeight: 400
    fontSize: 17px
    lineHeight: 1.5
  label:
    fontFamily: JetBrains Mono
    fontWeight: 400
    fontSize: 13px
    letterSpacing: 0.04em
    textTransform: uppercase
  mono:
    fontFamily: JetBrains Mono
    fontWeight: 400
    fontSize: 13px
    lineHeight: 1.4
    fontFeature: tnum
rounded:
  sm: 2px
  md: 4px
  lg: 6px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 96px
components:
  button:
    backgroundColor: transparent
    textColor: "{colors.text}"
    borderColor: "{colors.rule-strong}"
    rounded: "{rounded.sm}"
  button-hover:
    borderColor: "{colors.text}"
  frame:
    backgroundColor: "{colors.ground}"
    borderColor: "{colors.rule}"
    rounded: "{rounded.lg}"
  card:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.rule-strong}"
    rounded: "{rounded.md}"
  nav-link:
    textColor: "{colors.text}"
  nav-link-current:
    textColor: "{colors.accent}"
---

# jamesshin.tech

## Overview

**Creative North Star:** A quiet room you can sit in. The home page is the room from Yonmoku, the owner's 3D board game, rebuilt in three.js at the visitor's own time of day: a low table with the board, shoji open onto a stone bath, steam, bamboo moving behind a cedar fence. A column on the left (on phones, over the lower half) carries everything a reader needs: the name, the role, one line, two work samples and four products. Every item is a row in the column and an object in the room; a product's row or object opens a panel with its recording.
**Product context:** A real-name work sample for employers, aimed at billing and finance-systems product roles. Readers are hiring managers and engineers who will inspect the page as closely as the work. The four products are a 3D board game, an estimation duel, a life-in-weeks app and a school-rankings site; the two work samples are an essay on billing controls and a finance-platform proposal.
**Mode per surface:** Home: Experience (the room carries it; the column is the content). Essays: Read. No Operate surface.
**Reference sites, and what was taken:** MengTo/threeui (the bar for the room: device tiers, pixel-ratio caps, pausing off screen and in hidden tabs, still frames under reduced motion, the frame meter's thresholds), Yonmoku's own GAME_PLAN 4.1 and 4.9 (the room's proportions, palette and the one exception to "no particles": slow steam), linear.app (the charcoal "software" ground). Deliberately avoided: the pale warm-neutral ground, serif body and hairline-only recipe of anthropic.com, which an earlier version of this site had drifted into.
**Key characteristics:**
- The room fills the page and is calm: slow steam, water, bamboo and its shadows on the paper, nothing that flashes, bounces or asks for attention
- Charcoal ground, cream type, one amber for "here": the row whose object is lit, its hotspot, its label, the "Work samples" heading and focus rings
- One grotesk for everything that is prose or a heading, one mono for anything that is a fact; no serif anywhere
- The only images are real: the room is rendered live (a still of the same render stands in while it loads), and products are recordings from the shipped builds, shown only when asked for
- Text is never animated. The column is complete without JavaScript, without WebGL and under reduced motion
- 1px rules at 25% cream do all the separating in the column; no shadows, no fills at rest

## Colors

**Strategy:** Restrained. One accent, amber `#F2B134`, and it only ever says "here" or "this way": the current page in the nav, the active row on the home page with its hotspot and label in the room, the "Work samples" heading, and focus rings. It is never a fill at rest and never decoration on content. Everything else is cream on charcoal at three opacities: 100% for what is read, 70% for what is supporting, 55% for underlines.
**Light or dark:** Dark, decided by the recordings: hinoki wood, a pink bridge, a mint grid and a navy ranking page each read as the brightest object on screen against charcoal, and the thin cream frames make them read as objects rather than screenshots. Light mode is not offered.
Cream `#F2EFE6` on charcoal `#1C1C1A` is 15:1; cream at 70% opacity is 9.9:1; amber `#F2B134` on charcoal is 9.4:1 and only ever carries small caps or a 1px underline. Status is text, never colour: "Live", "In review". No semantic colours.

## Typography

Space Grotesk (Google Fonts, SIL OFL 1.1; 400, 500, 700) is every heading, every line of prose and every link. JetBrains Mono (Google Fonts, SIL OFL 1.1; 400, 500) sets the index numbers, status lines, dates, column headings and the "Work sample" labels, in caps with 0.04em tracking and tabular numerals. Both are self-hosted from the pinned `@fontsource` packages through `next/font/local`, with size-adjusted fallbacks; nothing is fetched from Google at build time. Scale: 13 / 15 / 17 / 20 / 28 / h1 (52px in the home column; 44px to 52px on phones). The name is the only display-size text on the site.

## Layout

Reading pages: max width 1280px, 24px gutters (20px on phones), nothing centered (see Reading pages below).

Home, desktop (900px and wider): the room's canvas is fixed and fills the window. The column is fixed on the left, 420px wide, on charcoal at 92%, with a 1px rule on its right; it scrolls on its own. In order: a nav row (Writing, LinkedIn, Contact), the name, the role, the line, "Work samples" (two rows), "Products, all live" (four numbered rows), and a footer (Contact me, LinkedIn, GitHub, RSS; the copyright and the pause switch; a mono caption naming the room and the light). The camera's view is offset (`setViewOffset`) so the room's subject sits in the middle of the space right of the column, while the room still runs under it. The panel opens on the right, 400px wide.

Home, below 900px: the room fills the screen; the column starts 46% of the way down and the page scrolls it up over the room. The camera frames the strip above the column with a 66° view of its own. Every drag on the room turns the view, in any direction; the page scrolls from the column. A chosen item opens full screen: Close at the top, the recording large, its name, line and link at the foot.

Nothing may scroll sideways at any width from 320px; the e2e suite checks 320, 390, 768, 1024 and 1440px.

## Elevation & Depth

The room is the depth: real 3D, lit by the time of day, with Yonmoku's 0.18 vignette over it. The interface on top has none by shadow: the column, the panel and the label are flat charcoal with 1px cream rules; a recording sits in a 1px cream frame with 8px of padding. No glow, no blur, no glass.

## Shapes

Rectangles. 2px radius on buttons and on the recording itself, 6px on the frame around it (nested radius = outer radius minus the 8px gap, rounded to 2px), 4px on essay boxes.

## Components

- **Nav (reading pages):** sticky, 65px, 1px rule below; the name in grotesk 700 top-left, four links at 15px/500 underlined in cream at 55%; the current page in amber with an amber underline. Below 480px the LinkedIn link lives only in the footer so the name never wraps.
- **Column (home):** `components/home/StudyHome.tsx`. Server-rendered and complete without JavaScript. Its nav row is three underlined links (Writing, LinkedIn, Contact), 44px tall. The h1 is the name (52px, 44px on small phones); under it the role in mono and the line at 70%.
- **Row:** one per item, a link with a 1px 25% border and 2px radius, at least 56px tall. A mono kind line ("Essay · 6 min", "PDF · 12 pages · 4.1 MB", "Live · Oct 2026 · iOS"), the title at 500, and one line at 70%: the essay's summary, the PDF's provenance, the product's own description. Products carry a mono index (01 to 04). Hover brightens the border to 70%; the active row (its object lit in the room) has an amber border. A work sample's row goes straight to the document. A product's row opens its panel; a modified click (new tab) still goes to the store or site.
- **Room:** `lib/room/` (scene, stage, runner). A seat at the low table; drag to look around (yaw ±1.5, pitch −0.75 to 0.25). Choosing a row turns the view to its object over about a second and a half and lights it with a soft fresnel rim. The light follows the visitor's clock: day until 16:30, dusk by 18:30, night by 20:30, dawn from 05:00 to 07:00, blended continuously; `?time=day|dusk|night` pins it.
- **Picture:** `public/room/poster-<day|dusk|night>-<wide|tall>.webp`, a still of the same render, chosen before first paint by time of day; the room fades in over it on its first frame (no fade under reduced motion). It stays when the room cannot run: no WebGL 2, Save-Data on, a lost context, or an error. Regenerate with `node scripts/room-posters.mjs` after changing the scene.
- **Hotspot:** a 48px target on each object in view with a 12px cream dot ringed in charcoal; amber when its row is active or under the pointer. Hovering one lights its object without turning the view, so the dot stays under the cursor. Pointer and touch only (`aria-hidden`, not in the tab order): the rows are the keyboard and screen-reader path to the same panels.
- **Label:** one, for the active item, beside its object: a mono kind in amber ("Work sample", "iOS", "Web") over the short name, on charcoal with a 1px amber border. It flips to the left near the right edge.
- **Panel:** a non-modal dialog, focus moved to Close when it opens; Escape or Close returns focus to the row (also when it was opened from the object). The kind and Close on one line, the title (24px), for a product its recording in the frame, the line, and one button (App Store, Visit the site, Read the essay, Open the PDF). On phones it fills the screen, the recording the large part and the name, line and button at the foot. A board pick waits 650 ms for its bead to land; any other choice, or Escape, cancels it.
- **State:** every state machine on the home page is one value with named states in `lib/room/state.ts` (the room's lifecycle: waiting, loading, live, picture with its reason; what the reader is looking at: hover, focus and a closed, pending or open panel) or written out at the top of its module (the frame loop's life and holds, resolution, pointer gestures, the falling bead), each unit-tested.
- **Pause switch:** `components/home/MotionToggle.tsx` and `lib/motion.ts` (WCAG 2.2.2). A mono toggle button (`aria-pressed`) with a drawn glyph in the column's footer that stops everything that moves on its own: the room and the recordings. Paused, the room draws a still frame only when the visitor drags or chooses something. Remembered in localStorage, restored before first paint on whichever page a visit starts (the gate script in `app/layout.tsx`), and kept in step across tabs. Always offered, since the recordings move even when the room cannot; hidden under reduced motion (followed live), where nothing moves on its own; there, and wherever the browser refuses autoplay, each recording offers Play, which becomes Pause and keeps focus.
- **Footer:** 1px rule above spanning the content column (not the gutters), copyright at 70%, the four links underlined (Contact me, LinkedIn, GitHub, RSS); 44px tap targets. On the home page it is the foot of the column and also holds the pause switch and the room's caption.
- **Skip link:** the first Tab stop on every page, "Skip to content", visible only when focused, to the page's one `main#main`.
- **404:** the nav, "404", "Nothing here.", links home and to the essays, the footer.
- **Reading pages:** one 720px column shared by the header, the essay list and the essay body, so they keep one left edge. The same tokens on the essay body. Headings in grotesk 700; the byline, column headings and figcaptions in mono caps; the `.bluf` bottom-line box on surface `#27271F` with a 1px 70% border; tables ruled at 25%; footnotes at 70%.
- **Essay figure:** a diagram built from HTML, never an image or SVG text. `<figure class="fig">` holding an `<ol class="fig-flow">` of `.fig-node` steps (mono caps title, then `<br>`-separated lines). Arrows are CSS shafts and heads in the gaps. Flows stack vertically by default; `fig-flow--row` runs left to right from 480px, `fig-flow--wide-row` from 800px. Node weights carry meaning: `--plain` (ground, 25% outline), default (surface, 70% outline), `--ink` (cream fill, charcoal text) for the step that matters most. `.fig-lanes` holds alternatives with no arrows; `.fig-blocked` and `.fig-fail` are dashed. Cream on charcoal only, no accent. A mono figcaption starting "Figure N." or "Diagram N." says what to take away. Without CSS every figure reads as a titled ordered list. No word may break or overflow at 320px (e2e enforces it); use `<wbr>` to break long identifiers; no blank lines inside the figure's HTML.

## Do's and Don'ts

- Do: give every number a printed source and, for ratings, the count.
- Do: show only real material: the room rendered live, recordings from the shipped builds. No static product images, no AI imagery, no stock.
- Do: label unapproved builds "In review"; change the label when Apple does.
- Do: label a work sample for what it is. A take-home says it was a take-home and where its facts came from.
- Do: keep every page complete with JavaScript off, without WebGL and under reduced motion: nothing is hidden waiting for a script, and no text is animated.
- Do: keep the room inside its budgets (about 100 draw calls, 40k triangles, 40 shader programs; e2e enforces them), out of the first load, paused off screen and in hidden tabs, and released when the visitor leaves the page.
- Do: name the source of any technique taken from elsewhere in the code comment (threeui's tiers and meter; Evan Wallace's WebGL Water for the ripples).
- Don't: add a cursor effect, a magnet, a spotlight or anything else that follows the pointer (the bath's ripples, where the mouse crosses the water, are the one exception, and only inside the room); or ambient decoration outside the room (lit grids, a light running round a frame, a scroll-progress bar, text that rises or lights up word by word). The site tried all of them and cut them: two independent reviews read the set as a stock portfolio kit.
- Don't: let the room stand between a reader and the work: every item is in the column, readable and linked, before the room has loaded or if it never does. No puzzles, gates or drag-to-reveal, and nothing aimed at Fellowship, Expression or Fantasy (comments, share widgets, customisation, personas). See the fun target in the decisions log.
- Don't: use white, gradients or patterns on the interface, glass, glow, shadows, pills or emoji.
- Don't: use a serif, or the pale warm-neutral ground this site used to have.
- Don't: add a timeline, an About, a Skills list, a testimonial row, a resume link, a colophon about how the site is built (the FPS meter shows only with `?debug=1`), or a block at the end that repeats links already on the page.
- Don't: use the accent for anything but "here" and "this way" (see Colors).
- Don't: ship a tile whose visual is a screenshot. Capture a loop or ship no visual.

## Motion

- **Approach:** reduced motion first; everything below is additive and has a still state. Native scrolling: nothing intercepts the wheel, keys or touch scrolling.
- **Load:** the column is drawn at rest. The room's picture is there from first paint; the room itself loads after the page is idle and fades in over its picture (500ms, none under reduced motion).
- **The room on its own:** steam rising over about thirteen seconds, the water's drifting normals and ripples from the spout, bamboo swaying a few centimetres, the bamboo's shadows on the shoji, the andon's light breathing by 2.5%. Nothing else moves unless the visitor moves it.
- **The room when asked:** drag turns the view; choosing a row eases the view to its object (rate 2.5/s) and lights it (rim eases in at 8/s); the board's hotspot drops a bead onto a free peg, which falls and bounces twice as in the game, before its panel opens (650ms).
- **Hover:** row borders brighten to 70% in 160ms; links underline; hotspot dots turn amber. Nothing in the interface moves.
- **Recordings:** play when their panel opens and stop when it closes; under reduced motion the poster frame shows with a Play control that becomes Pause.
- **Paused or reduced:** the frame loop stops; the room draws one still frame when the visitor drags or chooses something; camera turns and the bead land at once.
- **Runtime (so it never strains a laptop or phone):** 30 frames a second at rest on every tier; the high tier's 60 only for 2.5 s after the visitor drags, chooses an item or drops a bead. The loop stops while the part of the page the room shows through is scrolled away (phones, once the column covers it), while a phone's panel sheet covers it, and in a hidden tab. The shadow map is drawn only when the light changes or a bead falls. The pixel ratio is capped at 1.8 (1.4 on the low tier) and steps down to 1.4, 1.15 and 1.0 when frames run more than a third over budget for about a second and a half. A browser that draws WebGL on the CPU (it reports a major performance caveat, or its renderer is SwiftShader, llvmpipe or a basic render driver) gets the picture, never the room. The build hands the main thread back between stages, and shaders compile in parallel where the browser can.

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-10-23 | Initial design system created | /design-consultation: research of rauno.me, levels.io, raycast.com, linear.app, bruno-simon.com; independent Claude proposal ("Players: 1") adopted over the author's "bench" draft; Codex voice unavailable (not installed); fonts verified against Google Fonts and Fontshare; contrast checked |
| 2026-10-23 | No static product images, ever | Owner's rule: every visual is a recording of the real app or the live model, or there is no visual |
| 2026-10-23 | Light ground, not near-black | Use scene: warm physical product footage viewed at a desk in daylight; dark grounds exist to flatter UI screenshots, which this site does not show. Reversed 2026-11-01, below |
| 2026-10-23 | Home page cut to four rows (recording, the product's own one-liner, link) then the essays | Owner: the box-back copy read as cheesy; the spec strips, receipts, notes and banner duplicated the products. The visual system stands; the content does not argue |
| 2026-10-23 | Removed the 3D board viewer; Yonmoku shows its gameplay recording like every other row, with no captions | Owner: the loaded model replaced the recording with a still board, so the beads never fell; the frame's captions stated the obvious |
| 2026-10-23 | Products as an auto-fitting grid of phone tiles; HighSchoolTrends re-recorded on a phone viewport so every tile shares one shape; Squeeze round in a dialog | Owner: the one-product-per-row list wasted the horizontal space |
| 2026-10-23 | Essay rewritten in Smart Brevity, ~650 words, carried by 12 verbatim quotes checked against their sources | Owner request; the check also removed a misattributed Alden quote, a paraphrase that inverted Thompson's April post, a dead link, and unverified macro figures |
| 2026-10-23 | Second essay, "Billing Controls: From Checklists to Harnesses", ported from the owner's claude.ai artifact with its two diagrams, three tables, bottom-line box and footnotes | Owner request. Dated the day it was written. One quote corrected to the source's exact wording; the footnote on credit-balance incidents cites the two status-page incidents |
| 2026-10-23 | Essay figures are HTML diagrams, not images or SVG | Owner asked for infographics. HTML text reflows on phones, uses the site fonts, is read by screen readers and survives RSS readers that drop CSS |
| 2026-10-31 | Yonmoku shown live and linked to its App Store listing; LinkedIn in the footer and Person JSON-LD, and in the nav from 480px up; the footer's mailto link reads "Contact me"; the playable Squeeze round removed | Owner request. Apple released Yonmoku on 2026-10-31. Below 480px the name and four nav links do not fit on one row |
| 2026-11-01 | Intro above the products: the role, one line of background, a link to the billing essay as the work sample | Two independent reviewer passes found a recruiter could not tell who this was or what role the owner wanted |
| 2026-11-01 | Intro heading, GitHub bio, meta description and OG headline became one general line, "I build things and ship them." | The owner rejected a job-title heading and three narrower taglines. Superseded the same day, below |
| 2026-11-01 | Redesign: charcoal, cream and amber; Space Grotesk and JetBrains Mono; the hero is the name beside the Yonmoku recording with a beam on its frame, a 6/3/3 strip below; threads and a grid behind the hero; a one-time rise on load. The moss, Archivo, Sentient, Martian Mono and the accent-for-state rule are gone | The owner judged the previous page an Anthropic look-alike (pale warm neutral, serif body under a grotesk, hairlines). /design-shotgun built three real-HTML directions with the real recordings (Box back, Hero, Ledger), then motion versions of each; the owner chose Hero, then asked for less gimmick. A pointer-following cursor, nav magnet, tile spotlight and scroll-progress bar were built, seen and cut. First-load JS for the home page rose from 106 kB to 108 kB |
| 2026-11-01 | The h1 is the name, not a tagline; the line under it ends "On the side, I build games and small apps." | The owner: a maker slogan over a 3D board game read as a developer slogan over a toy. The name needs no defending; the line says what the products are without claiming they are the career |
| 2026-11-01 | A second work sample: the Finance Data Studio proposal as a 12-page PDF, labelled as an interview take-home built from public information | It is the most relevant document the owner has for finance-systems roles. The label says what it is so the company named on its cover does not imply client work; the owner confirmed nothing in it came from interview conversations and no one asked for it to stay private |
| 2026-11-01 | Home as a scroll story: chapter 0 (name, line, two work samples, Contents, Yonmoku pinned), one pinned chapter per product with sides alternating, the essays chapter, a right-edge rail; a native-scroll engine of one listener and one rAF; no pins on phones, without JavaScript or under reduced motion. Supersedes the Hero layout above (palette, type and work samples kept) | The owner asked for the space to be used much better and for the page to be fun by the eight kinds of fun (Hunicke, LeBlanc and Zubek, MDA, 2004). Round 3 built four real-HTML directions with a measured target of 60% first-screen coverage on desktop and 65% on phones (the Hero build measured about 45%): a denser Hero, Play to reveal, Scroll story and The desk. The owner chose Scroll story: 71% at 1440x900 and 67% at 390x844, recordings at their largest, its fun (Narrative, Sensation, Submission) never between a reader and the products. First-load JS for the home page is 110 kB |
| 2026-11-01 | Fun target: Narrative and Discovery primary, Sensation kept, Submission as a byproduct; Challenge, Fantasy, Fellowship and Expression deliberately not pursued. Shipped against it: chapter titles rise before their taglines (a reader who stops mid-slide always sees the name), a closing that returns to the two work samples and contact, "00 Intro" and chapter names in the rail, a footer colophon of checkable facts; and the audit's defects: a pause switch (WCAG 2.2.2), Play/Pause that keeps focus, a gameplay poster for Squeeze, typographer's quotes in essays, a skip link and one main landmark per page, a real 404, the PDF's size on its label, nothing marked current when nothing is pinned | An independent audit scored the live page against the eight kinds of fun from the primary sources (MDA paper; 8kindsoffun.com): Sensation 3, Narrative 2, Submission 2, Fantasy 1, Challenge 1, Discovery 1, Fellowship 0, Expression 0. MDA's own examples never target all eight and warn against feature-driven design; this site's players are a hiring manager with one to three minutes (Narrative) and an engineer inspecting the work (Discovery). The owner chose that target over "all eight", with the condition that nothing reads as lame and it still shows well to employers. The Vitality Weeks recording shows the phone's clock over the app header; the owner will re-record it |
| 2026-11-01 | Quiet pass. Cut: the threads canvas, the grid with lit squares, the light round the frame, the progress line, the rising name and title, the word-by-word tagline lighting, the load entrance and scroll reveals, the closing recap, the footer colophon, the essays chapter. Changed: the PDF label to "Interview take-home, September 2026, built from public information."; both card labels to "kind · detail"; the essay card carries its summary; Contents and rail number only the four products; on phones the Contents (with the pause switch) sits before the first recording; reading pages share one 720px column; the footer rule spans the content column. Essays: "The Distribution Moat in the AI Era" taken off the site (its address redirects to /writing, 307), and the billing essay loses its "From 13 years" kicker and the footnote citing a prospective employer's status-page incidents (revised 2026-11-01). The HighSchoolTrends recording loses the third of a second where the rank counts up as "1th, 2th, 3th" (a 5-frame crossfade over the cut) | The owner's bar: nothing cheesy, still professional for employers. Two independent reviews of the live page (a hiring manager for a billing PM role; a staff design engineer) agreed: the copy and the recordings read as considered work; the effects stack read as a stock 2025 portfolio kit ("the chrome as a template"); the word lighting left half-grey taglines in any still; the end repeated the billing essay and the contact links; the colophon read as a flex; a label naming the company told one employer about another's interview. The owner chose Quiet over Plain (which would also drop pinning and the rail) and over keeping the effects. With one essay left, an essays chapter would only repeat the first work sample, so the story ends on the last product. The "3th" is a bug in the live HighSchoolTrends site, out of scope here (product repos are read-only for brand work); the fix is recorded for the owner, and the loop is to be re-recorded once it ships |
| 2026-11-02 | Recruiter audit fixes: the proposal PDF re-exported from a copy of its Keynote file with the company and role removed (cover line, slide 4 title, a diagram label, slide 11, the file's title metadata); the billing essay's three corrected claims; the site preview image on /writing and the essay; the JS mark (life-in-weeks grid, this week in amber) as the Person image, not drawn on the page; security headers; a soft edge on tables that scroll; the footer at the bottom of short pages; "RSS" underlined; Contents and the pause switch on one baseline | Three unanchored reviews of the live site (a recruiter, a billing hiring manager, a design engineer) from screenshots only. Both hiring-side reviewers flagged the named take-home as a judgement slip; the owner chose to redact it, not remove it. The hiring manager caught the essay claims. Not taken: dropping the pinned stack (the owner kept it in the quiet pass), a title line (pending the owner's words), a resume link, rewriting the essay URL |
| 2026-11-02 | Fonts self-hosted from the pinned `@fontsource` packages through `next/font/local`; no build-time request to Google | Google Fonts began answering Vercel's builders with CSS that `next/font/google` could not parse (a font URL without a file extension), so every deploy failed while local and CI builds passed. Same OFL files, latin subset as before; screenshots of every page before and after differ only in anti-aliasing (SSIM ≥ 0.999). No font binary is committed |
| 2026-11-02 | Vitality Weeks recording re-shot for 1.6: the walker strolls beneath the decade grid, waves when tapped, hops toward the Run a 10K flag, and one tap closes the week; 15 s, one screen, no scrolling, a 9:41 status bar, a 0.4 s dissolve at the loop seam | Filmed from the real app (DEBUG build of release/1.6.0, the App Store screenshots' marketing seed) with `simctl io recordVideo` while a scratch UI test made the taps; nothing was added to the product repo. Scrolling was dropped because it slides the app title under the status bar, the clash this replaces. Shipped before 1.6.0 reaches the App Store (owner's call, 2026-11-02): for a few days the store link shows 1.5 without the walker |
| 2026-11-02 | A role line under the name: "Business and finance systems leader", in mono like other facts; the same words are the Person jobTitle and the preview image's header (was "Finance systems"). The preview image's footer says "Writing", not "Essays" | A recruiter could not tell the owner's level. The owner asked for a generic line over their exact title, so the site still names no employer; LinkedIn, one click away, has the title. The home page stays under its word budget (194 of 220) |
| 2026-11-09 | Home becomes the Yonmoku room (direction B, "Study"): the room from Yonmoku rebuilt in three.js fills the page, a column on the left (over the lower half on phones) carries the name, role, line, both work samples and the four products with their one-liners; each item is also an object in the room, and a product's recording shows only in its panel. Replaces the scroll story, its rail, Contents and chapters. The fence behind the bath is silvered cedar (`#8E867B` boards on `#5F5951`), not charred | The owner asked for a room that fills the page, readable and calm, "tighter, less lame" than the first studies but safe on an average browser, with MengTo/threeui as the bar, and chose B of three directions (artifact `CSHkPx2sBtSNoL5ASJVn26`), then asked for bigger targets (48px hotspots, 56px rows) and research-grade techniques: kage-e bamboo shadows in the shoji shader, a GPU wave-equation ripple field on the bath (Evan Wallace's WebGL Water), a sky PMREM reflected in the water, fresnel rims, adaptive resolution and parallel shader compile. The charred fence read as a black hole in every light; four colours were rendered at day, dusk and night and silvered cedar fit the palette. This reverses the 2026-11-01 quiet pass's "no background canvas" on the owner's instruction; the rest of it stands (no animated text, no pointer effects outside the room, no colophon; the FPS meter is `?debug=1` only). Measured: home first-load JS 109 kB (was 110 kB); three.js and the room load after idle in one 134 kB gzipped chunk plus 228 kB of textures; 92 draw calls, 32.5k triangles, 30 programs; update and render take 0.6 ms at p50 and 0.8 ms at p95 on an M4 Pro at pixel ratio 1.8 (timed to `gl.finish` over 300 frames; the low tier at 1.4: 0.5 and 1.3 ms). Without WebGL 2, with Save-Data on, or if the room fails, a still of the same render stays and the page loses nothing. Two unanchored reviews of screenshots (a recruiter, a staff design engineer) found, and this change fixed: the room showing through the column (now opaque) and hotspot dots through text; bright seams between the mats (the sky dome under the floor; now a dark subfloor); the essay's label over the board (now left of the paper) and its dot off the paper; no dimming behind the phone sheet (now a scrim that closes it); an empty recording frame (now hugs the recording); a dashed-looking water stream; props that floated (contact shadows under the box, tray, paper and phone, merged into one draw call); the paper cut off by the default view; daylight shoji clipping to white. Not taken, for the owner: a resume link and career figures on the first screen, the "Products, all live" heading beside "Live" on every row, a visible hint for the hotspots, borders on every row |
| 2026-11-09 | Performance pass before launch: 30 fps at rest (60 only just after an interaction, high tier), the loop stopped when the room is scrolled under the column or covered by a phone's panel, the shadow map drawn on demand, no room where WebGL is software, the build split by yields, a 128² water normal map, style writes only on change | The owner asked that the site never crash or strain a regular laptop or phone. Measured on the production build in Chrome on an M4 Pro, phones emulated at 4x slower CPU: at rest on desktop the main thread went from 5.7% to 3.3% and frames from 60 to 30 a second; on a phone with the room scrolled under the column, or a panel open, from 7.3% and 9.3% with 30 frames a second to 0%; main-thread blocking while the room starts from 119 ms to 0 on desktop and from 350 ms to about 170 ms on the slow phone (largest task 291 ms to about 130 ms). The shadow pass, which draws every caster a second time, now runs only on a change of light. The "92 draw calls" counts the main pass only (three resets its counter after the shadow pass). The software-WebGL case is the one that can pin a processor (a blocklisted GPU, a VM, Linux without drivers); those visitors get the still. `?q=low|high` forces the room for testing. Each new guard was broken on purpose and seen to fail; the rest rate is checked as a unit (`frameBudget`), since in CI WebGL is software and caps the rate by itself |
| 2026-11-09 | State machines made explicit, phone fixes, a real kyusu: the room's lifecycle and the reader's selection are reducers in `lib/room/state.ts`; the frame loop is a life plus a set of holds; pointer gestures, resolution and the falling bead are written out. Phones: every drag on the room turns the view; up to 2x resolution with antialiasing (was 1.4x with none) and pictures at 3x; a chosen item opens full screen. The teapot is a yokode kyusu in Tokoname red clay (body, lid with knob, spout, side handle), the tray an oiled cherry obon | The owner reported the mobile site could not hold and drag, loaded pixelated and opened an oversized card, and that the teapot was not a teapot; and asked for every implicit state machine to be found and fixed. An independent audit found seven and thirteen bugs, each verified in the code: a late board pick opening over a later choice; hover taking the highlight from keyboard focus; a hotspot sliding out from under the cursor as the view turned to it; a second finger or a right-drag hijacking the view; reduced motion read once at load; a saved pause and the picture's light lost when a visit reached the home page by a link; no pause switch while the room was a picture; blocked autoplay leaving a still poster with no control; a paused bead with no shadow; a ripple released later from a paused tap; a compile that could hang and leak the room after a lost context; the sky reflection built twice. The owner chose full-screen recording over a compact sheet or a peek card, and "the room always turns" over hold-to-turn. The tray's lacquer, even worn soft, read as a metal plate in daylight, so it is wood. Each fix has a test, and each test was seen to fail with its bug put back. Home first-load JS 111 kB (was 109 kB): the state module. Phone pictures 71 to 89 kB (were 40 to 48 kB) at 3x, cropped to the half that shows |
