---
name: jamesshin.tech
description: A story in chapters. The name, one line and two work samples, then one product per screen, each a recording beside its own words. Charcoal ground, cream type, amber only on what marks where you are, one grotesk and one mono, native scrolling.
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

**Creative North Star:** A story you scroll at your own pace. The first screen is the name, one line of background, two labelled work samples and a contents list, beside a product that is playing. Then each product gets a screen of its own: its recording at full height beside its name, its one-liner and its status, the next one sliding over it as you scroll. The footer follows the last product; the essays live under Writing.
**Product context:** A real-name work sample for employers, aimed at billing and finance-systems product roles. Readers are hiring managers and engineers who will inspect the page as closely as the work. The four products are a 3D board game, an estimation duel, a life-in-weeks app and a school-rankings site; the two work samples are an essay on billing controls and a finance-platform proposal.
**Mode per surface:** Home: Experience (the recordings carry it). Essays: Read. No Operate surface.
**Reference sites, and what was taken:** React Bits ScrollStack (the slot geometry of the pinned chapters, ported by hand), rauno.me (craft as content), linear.app (the charcoal "software" ground, used here because the recordings are the only colour on the page and read as objects against it). Deliberately avoided: the pale warm-neutral ground, serif body and hairline-only recipe of anthropic.com, which the previous version of this site had drifted into.
**Key characteristics:**
- Charcoal ground, cream type, one amber for the current page and the labels on the two work samples; nothing else is coloured
- One grotesk for everything that is prose or a heading, one mono for anything that is a fact; no serif anywhere
- The only images are moving and real: recordings from the shipped builds, each inside a thin cream frame
- Text is never animated. The recordings are the only things that move on their own; the reader's scroll pins chapters and slides the next one over. Nothing follows the pointer and nothing intercepts the wheel
- 1px rules at 25% cream do all the separating; no shadows, no fills at rest

## Colors

**Strategy:** Restrained. One accent, amber `#F2B134`, and it only ever says "here" or "this way": the current page in the nav, the current chapter in the rail and Contents, the "Work sample" and "Next" labels, and focus rings. It is never a fill at rest and never decoration on content. Everything else is cream on charcoal at three opacities: 100% for what is read, 70% for what is supporting, 55% for underlines.
**Light or dark:** Dark, decided by the recordings: hinoki wood, a pink bridge, a mint grid and a navy ranking page each read as the brightest object on screen against charcoal, and the thin cream frames make them read as objects rather than screenshots. Light mode is not offered.
Cream `#F2EFE6` on charcoal `#1C1C1A` is 15:1; cream at 70% opacity is 9.9:1; amber `#F2B134` on charcoal is 9.4:1 and only ever carries small caps or a 1px underline. Status is text, never colour: "Live", "In review". No semantic colours.

## Typography

Space Grotesk (Google Fonts, SIL OFL 1.1; 400, 500, 700) is every heading, every line of prose and every link. JetBrains Mono (Google Fonts, SIL OFL 1.1; 400, 500) sets the index numbers, status lines, dates, column headings and the "Work sample" labels, in caps with 0.04em tracking and tabular numerals. Both load through `next/font/google` with size-adjusted fallbacks; nothing is self-hosted and there is no font fetch at build time. Scale: 13 / 15 / 17 / 20 / 28 / h1 (clamp 52px to 96px; 48px to 64px on phones). The name is the only display-size text on the site.

## Layout

Max width 1280px, 24px gutters (20px on phones), nothing centered. The home page is four chapters inside `main`, each a full-height section (`[data-chapter]`) under the 65px nav:

- **Chapter 0:** a two-column grid. Left: the name, the line, the two work samples side by side, then the Contents list (four rows, one per product, current one in amber) taking the rest of the column. Right: the Yonmoku recording at full chapter height. On the first scroll the intro gives way to Yonmoku's own caption (mark, name, tagline, status) while the recording stays put.
- **Chapters 1 to 3:** one product each, the recording at about 80% of the viewport height on one side and its copy on the other, sides alternating (right, left, right, left across the four products). Each chapter carries its mark ("02 of 04") at the top and a "Next" link and status line at the foot.
- **End:** the last product chapter has no Next link and nothing slides over it; the footer follows it directly.
- **Rail:** fixed on the right edge: 00 (the intro and its work samples), 01 to 04, and the pause switch; the current one amber; it jumps to a chapter's settled state.

Pinning is `position: sticky` on each chapter plus a bottom margin that holds it, so the next chapter slides over (React Bits ScrollStack's slot geometry). It runs only with JavaScript, motion allowed, and a viewport at least 901px wide and 700px tall (`.js-story`, set before first paint and removed if the engine never starts). Otherwise, and on every phone, the chapters are plain stacked sections with everything visible. On phones each chapter is the recording (60svh) with its mark and status beside it, then the name, tagline and Next link; in chapter 0 the name, line and both work samples come first so they show without scrolling, then the Contents with the pause switch, before the first recording (DOM order matches). Nothing may scroll sideways at any width from 320px; the e2e suite checks 320, 390, 768, 1024 and 1440px.

## Elevation & Depth

None by shadow. Depth is the 1px cream frame around a recording, 8px of charcoal padding inside it, and the 1px rules. No glow, no blur, no gradients or patterns on the ground.

## Shapes

Rectangles. 2px radius on buttons and on the recording itself, 6px on the frame around it (nested radius = outer radius minus the 8px gap, rounded to 2px), 4px on essay boxes.

## Components

- **Nav:** sticky, 65px, 1px rule below; the name in grotesk 700 top-left, four links at 15px/500 underlined in cream at 55%; the current page in amber with an amber underline. Below 480px the LinkedIn link lives only in the footer so the name never wraps.
- **Intro:** the h1 is the name; under it one line of background (`siteConfig.intro`, 20px, cream 70%); under that the work samples.
- **Work sample card:** border only, 1px cream at 70%, 2px radius. A top row of two mono labels, "Work sample" in amber and the kind on the right, always "kind · detail" ("Essay · 6 min", "PDF · 12 pages · 4.1 MB"); then the document's title with a chevron on its last word; then one line underneath at 70%: the essay's summary, or the PDF's provenance ("Interview take-home, September 2026, built from public information."). Side by side on desktop, stacked on phones.
- **Contents:** a mono "Contents" label with the pause switch beside it (in the stacked layout; pinned, the switch lives in the rail), then one ruled row per chapter: a mono index and the name. The current row is amber only while chapters are pinned; stacked, nothing is current. It is a `nav` landmark inside chapter 0.
- **Chapter:** mark ("01 of 04") with a rule running out from it; the product name at chapter-title size linking to the product, a chevron on its last word; the tagline; the mono status line "Live · Mon YYYY · iOS|Web"; a "Next" link to the following chapter (none on the last). All drawn solid at every scroll position. A covered chapter scales to 95% from its top edge, its copy dims, it becomes `inert` and its recording pauses.
- **Frame:** the recording in a 1px cream frame with 8px padding, always `VideoLoop` (loads near the viewport, plays in view, pauses out of it, poster and Play control under reduced motion). A long single-word name ("HighSchoolTrends.org") may break before a dot, never mid-word.
- **Rail:** mono numbers with a dot each (each number on its own small ground so a sliding chapter's rule never strikes through it), fixed to the right edge on pinned desktops, current one amber with `aria-current="location"`; it comes right after the nav in tab order. Chapter names and the pause label show only on hover or keyboard focus, so the rail stays a slim column that never covers a recording or a title; they are always in the accessible name. The rail itself is transparent.
- **Pause switch:** `components/home/MotionToggle.tsx` and `lib/motion.ts` (WCAG 2.2.2). A mono toggle button (`aria-pressed`) with a drawn glyph that stops everything that moves on its own, which is only the recordings. Remembered in localStorage and restored before first paint. Hidden under reduced motion, where nothing moves on its own; there each recording's Play control becomes its Pause control and keeps focus.
- **Footer:** 1px rule above spanning the content column (not the gutters), copyright at 70%, the four links underlined (Contact me, LinkedIn, GitHub, RSS); 44px tap targets. Nothing else.
- **Skip link:** the first Tab stop on every page, "Skip to content", visible only when focused, to the page's one `main#main`.
- **404:** the nav, "404", "Nothing here.", links home and to the essays, the footer.
- **Reading pages:** one 720px column shared by the header, the essay list and the essay body, so they keep one left edge. The same tokens on the essay body. Headings in grotesk 700; the byline, column headings and figcaptions in mono caps; the `.bluf` bottom-line box on surface `#27271F` with a 1px 70% border; tables ruled at 25%; footnotes at 70%.
- **Essay figure:** a diagram built from HTML, never an image or SVG text. `<figure class="fig">` holding an `<ol class="fig-flow">` of `.fig-node` steps (mono caps title, then `<br>`-separated lines). Arrows are CSS shafts and heads in the gaps. Flows stack vertically by default; `fig-flow--row` runs left to right from 480px, `fig-flow--wide-row` from 800px. Node weights carry meaning: `--plain` (ground, 25% outline), default (surface, 70% outline), `--ink` (cream fill, charcoal text) for the step that matters most. `.fig-lanes` holds alternatives with no arrows; `.fig-blocked` and `.fig-fail` are dashed. Cream on charcoal only, no accent. A mono figcaption starting "Figure N." or "Diagram N." says what to take away. Without CSS every figure reads as a titled ordered list. No word may break or overflow at 320px (e2e enforces it); use `<wbr>` to break long identifiers; no blank lines inside the figure's HTML.

## Do's and Don'ts

- Do: give every number a printed source and, for ratings, the count.
- Do: show only moving, real material: recordings from the shipped builds. No static product images, no AI imagery, no stock.
- Do: label unapproved builds "In review"; change the label when Apple does.
- Do: label a work sample for what it is. A take-home says it was a take-home and where its facts came from.
- Do: keep every page complete with JavaScript off and under reduced motion: nothing is hidden waiting for a script, and no text is animated.
- Do: name the source of any ported geometry in the code comment (the pinned chapters follow React Bits ScrollStack).
- Don't: add a cursor effect, a magnet, a spotlight, particles or anything that follows the pointer; or ambient decoration (background canvases, patterned or lit grids, a light running round a frame, a scroll-progress bar, text that rises or lights up word by word). The site tried all of them and cut them: two independent reviews read the set as a stock portfolio kit.
- Don't: add play that stands between a reader and the products or the work samples (puzzles, gates, drag-to-reveal), or features aimed at Fellowship, Expression or Fantasy (comments, share widgets, customisation, personas). See the fun target in the decisions log.
- Don't: use white, gradients or patterns on the ground, glass, glow, shadows, pills or emoji.
- Don't: use a serif, or the pale warm-neutral ground this site used to have.
- Don't: add a timeline, an About, a Skills list, a testimonial row, a resume link, a colophon about how the site is built, or a block at the end that repeats links already on the page.
- Don't: use the accent for anything but "here" and "this way" (see Colors).
- Don't: ship a tile whose visual is a screenshot. Capture a loop or ship no visual.

## Motion

- **Approach:** the reader's scroll drives it. Reduced motion first; everything below is additive and has a static state. Native scrolling only: nothing intercepts the wheel, keys or touch.
- **Easing:** cubic ease-out for the chapter 0 swap.
- **Load:** nothing animates; the page is drawn at rest.
- **Scroll (pinned desktops):** one passive listener and one rAF in `components/home/ScrollStory.tsx`, offsets measured on resize only, writes only when a value changes. It drives the chapter 0 intro-to-caption swap, the covered chapter's scale and dim, the rail and Contents marks, and `inert` on covered chapters. Rail, Contents and Next links land on a chapter's settled state; tabbing into a chapter scrolls it to that state.
- **Hover:** frame border brightens to 70% in 160ms; links underline. Nothing moves.
- **Recordings:** play when they scroll into view and pause when they leave, are covered, or the visitor pauses motion; under reduced motion the poster frame (a gameplay frame from the same recording) shows with a Play control that becomes Pause.
- **Off:** without JavaScript, under reduced motion, below 901px wide or 700px tall: no pins, chapters stacked.

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
| 2026-11-01 | A second work sample: the Finance Data Studio proposal as a 12-page PDF, labelled "Written for an enterprise-architect interview at Reddit, September 2026, from public information." | It is the most relevant document the owner has for finance-systems roles. The label says what it is so the Reddit name on its cover does not imply client work; the owner confirmed nothing in it came from interview conversations and no one asked for it to stay private |
| 2026-11-01 | Home as a scroll story: chapter 0 (name, line, two work samples, Contents, Yonmoku pinned), one pinned chapter per product with sides alternating, the essays chapter, a right-edge rail; a native-scroll engine of one listener and one rAF; no pins on phones, without JavaScript or under reduced motion. Supersedes the Hero layout above (palette, type and work samples kept) | The owner asked for the space to be used much better and for the page to be fun by the eight kinds of fun (Hunicke, LeBlanc and Zubek, MDA, 2004). Round 3 built four real-HTML directions with a measured target of 60% first-screen coverage on desktop and 65% on phones (the Hero build measured about 45%): a denser Hero, Play to reveal, Scroll story and The desk. The owner chose Scroll story: 71% at 1440x900 and 67% at 390x844, recordings at their largest, its fun (Narrative, Sensation, Submission) never between a reader and the products. First-load JS for the home page is 110 kB |
| 2026-11-01 | Fun target: Narrative and Discovery primary, Sensation kept, Submission as a byproduct; Challenge, Fantasy, Fellowship and Expression deliberately not pursued. Shipped against it: chapter titles rise before their taglines (a reader who stops mid-slide always sees the name), a closing that returns to the two work samples and contact, "00 Intro" and chapter names in the rail, a footer colophon of checkable facts; and the audit's defects: a pause switch (WCAG 2.2.2), Play/Pause that keeps focus, a gameplay poster for Squeeze, typographer's quotes in essays, a skip link and one main landmark per page, a real 404, the PDF's size on its label, nothing marked current when nothing is pinned | An independent audit scored the live page against the eight kinds of fun from the primary sources (MDA paper; 8kindsoffun.com): Sensation 3, Narrative 2, Submission 2, Fantasy 1, Challenge 1, Discovery 1, Fellowship 0, Expression 0. MDA's own examples never target all eight and warn against feature-driven design; this site's players are a hiring manager with one to three minutes (Narrative) and an engineer inspecting the work (Discovery). The owner chose that target over "all eight", with the condition that nothing reads as lame and it still shows well to employers. The Vitality Weeks recording shows the phone's clock over the app header; the owner will re-record it |
| 2026-11-01 | Quiet pass. Cut: the threads canvas, the grid with lit squares, the light round the frame, the progress line, the rising name and title, the word-by-word tagline lighting, the load entrance and scroll reveals, the closing recap, the footer colophon, the essays chapter. Changed: the PDF label to "Interview take-home, September 2026, built from public information."; both card labels to "kind · detail"; the essay card carries its summary; Contents and rail number only the four products; on phones the Contents (with the pause switch) sits before the first recording; reading pages share one 720px column; the footer rule spans the content column. Essays: "The Distribution Moat in the AI Era" taken off the site (its address redirects to /writing, 307), and the billing essay loses its "From 13 years" kicker and the footnote citing a prospective employer's status-page incidents (revised 2026-11-01). The HighSchoolTrends recording loses the third of a second where the rank counts up as "1th, 2th, 3th" (a 5-frame crossfade over the cut) | The owner's bar: nothing cheesy, still professional for employers. Two independent reviews of the live page (a hiring manager for a billing PM role; a staff design engineer) agreed: the copy and the recordings read as considered work; the effects stack read as a stock 2025 portfolio kit ("the chrome as a template"); the word lighting left half-grey taglines in any still; the end repeated the billing essay and the contact links; the colophon read as a flex; the Reddit label told one employer about another's interview. The owner chose Quiet over Plain (which would also drop pinning and the rail) and over keeping the effects. With one essay left, an essays chapter would only repeat the first work sample, so the story ends on the last product. The "3th" is a bug in the live HighSchoolTrends site, out of scope here (product repos are read-only for brand work); the fix is recorded for the owner, and the loop is to be re-recorded once it ships |
