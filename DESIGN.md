---
name: jamesshin.tech
description: The back of a game box for a one-person studio. Pale moss, hard ink rules, wide grotesk headlines, mono fine print, and only real objects on the page.
colors:
  primary: "#14170F"
  on-primary: "#D9DCCB"
  surface: "#C7CBB6"
  text: "#14170F"
  text-muted: "#4D5244"
  accent: "#E0497E"
  on-accent: "#14170F"
  ground: "#D9DCCB"
  success: "#2E6B3F"
  warning: "#8A6A12"
  error: "#A8243A"
typography:
  display:
    fontFamily: Archivo
    fontWeight: 900
    fontStretch: 125%
    fontSize: clamp(44px, 7vw, 96px)
    lineHeight: 0.9
    letterSpacing: -0.03em
  heading:
    fontFamily: Archivo
    fontWeight: 900
    fontStretch: 125%
    fontSize: clamp(28px, 3.4vw, 48px)
    lineHeight: 0.92
    letterSpacing: -0.03em
  body:
    fontFamily: Sentient
    fontWeight: 400
    fontSize: 1.125rem
    lineHeight: 1.55
  label:
    fontFamily: Archivo
    fontWeight: 700
    fontStretch: 80%
    fontSize: 0.8125rem
    letterSpacing: 0.06em
    textTransform: uppercase
  mono:
    fontFamily: Martian Mono
    fontWeight: 400
    fontSize: 0.8125rem
    lineHeight: 1.6
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
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.sm}"
  button-primary-hover:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
  button-secondary:
    borderColor: "{colors.primary}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
  input:
    borderColor: "{colors.primary}"
    rounded: "{rounded.sm}"
  card:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.primary}"
    rounded: "{rounded.md}"
  nav-link:
    textColor: "{colors.text}"
---

# jamesshin.tech

## Overview

**Creative North Star:** The back of a game box for a one-person studio. A box back is a one-page format built for a 30-second decision: the real thing in motion, a line saying what it is, fine print. Here that is four recordings of shipped products, each with its own one-line description, then the essays. No pitch around them.
**Product context:** A real-name work sample for employers. Four shipped products (a school-rankings web app, three iOS games/apps, two of them Unity), each a gameplay recording with its own one-liner and link; then the essays. Readers are product and engineering hiring managers who live in Linear, GitHub and the App Store.
**Mode per surface:** Product grid: Experience (the recordings carry it). Essays: Read. No Operate surface.
**Reference sites:** rauno.me (light ground, cropped type, craft as content), levels.io (receipts in public), raycast.com and linear.app (the near-black "professional software" default this system deliberately avoids), bruno-simon.com (a WebGL-only page shows nothing without a GPU), scrolltide.co templates (pinned, scroll-posed objects).
**Key characteristics:**
- Pale moss ground, no white anywhere, hard 2px ink rules instead of whitespace or shadows
- One wide black grotesk voice for headlines and labels, a textured serif for reading, mono for anything that is a fact
- The only images are moving and real: gameplay recorded from the shipped builds
- Every factual claim links to a source a reader can open
- Dense like a box back, never cluttered: rules do the separating

## Colors

**Strategy:** Restrained. One accent, and it only ever marks state: the current page in the nav and the hover on links and buttons. It is never a fill at rest, never decoration; everything else is the ink and moss pair.
**Light or dark:** Light, decided by the use scene: a reader at a desk in daytime looking at warm product footage (hinoki wood, tatami, a bridge at dusk). On near-black those read as ads; on moss they read as objects. Dark mode is not offered.
Ink `#14170F` on ground `#D9DCCB` is 13:1; muted `#4D5244` passes 4.5:1 on both ground and surface `#C7CBB6`. The accent `#E0497E` only ever carries ink text (4.7:1); white on it fails. Status is text, never color: "Live", "In review". No semantic colors.

## Typography

Archivo (Google Fonts, SIL OFL 1.1, variable weight and width) is the box-back voice: width 125 / weight 900 for headlines, width 80 / weight 700 caps for labels, so one family does two jobs and the page never looks like a font pile. Sentient (Fontshare, ITF Free Font License) reads like an indie manual, not a bank; the license allows self-hosting but not redistribution, so `scripts/fetch-fonts.mjs` downloads the 400, 400 italic and 500 woff2 files into `assets/fonts/` at build and pins their hashes. Martian Mono (Google Fonts, SIL OFL 1.1) sets status lines, dates, captions and sources; its wide letterforms rhyme with Archivo expanded. Scale: 13 / 14 / 18 / 28 / 44 / 96. Display stays at or under 6rem. Fonts load through `next/font` with size-adjusted fallbacks: Next picks them for Archivo and Martian Mono, and Sentient falls back to Times New Roman.

## Layout

Max width 1376px, 32px gutters (16px on phones), nothing centered. Home is a grid of phone-shaped product tiles: 4 across on laptops, auto-fitting columns on tablets (more as products are added), 2 across on phones. Each tile is the recording, the product name, its one-line description and a mono status line. The essay list follows. Essays are a single reading column. Sections are divided by full-bleed 2px rules. Nothing may scroll sideways at any width from 320px; the e2e suite checks 320, 390 and 1440px.

## Elevation & Depth

None by shadow. Depth is a 2px ink keyline, and the surface tone against the ground. No glow, no blur, no gradients.

## Shapes

Rectangles. 2px radius on buttons, 4px on panels. Nested radius = outer radius − gap, which here means inner elements are square.

## Components

- **Button, primary:** ink fill, moss text, Archivo condensed caps 13px, 44px min height; hover raspberry fill with ink text; focus-visible 2px ink outline offset 3px; active no transform; disabled 50% opacity, no hover.
- **Button, secondary:** 2px ink border, ink text; hover ink fill with moss text.
- **Product tile:** the video panel, then the product name (Archivo, links to the product), its one-line description (Sentient) and a mono caps status line, "Live · Mon YYYY" or "In review · Mon YYYY".
- **Video panel:** 2px ink keyline, phone aspect; `<video muted loop playsinline preload="none">` with WebM + MP4 sources and a poster frame from the same recording; plays on intersect, pauses off-screen; under reduced motion the poster frame shows and a Play control appears.
- **Nav:** sticky, 52px, ink rule below, condensed caps; current page in accent.
- **Essay furniture:** a `.byline` in mono caps; a `.bluf` bottom-line box (surface fill, 2px ink keyline, 4px radius); GFM tables, which `lib/writing.ts` wraps in a focusable `.table-scroll` region so a 3- or 4-column table scrolls inside the column on a phone (min-width 480px or 620px) instead of widening the page; GFM footnotes as the source list (muted, 15px, ink rule above, back-arrow kept as text with U+FE0E).
- **Essay figure:** a diagram built from HTML, never an image or SVG text. `<figure class="fig">` holding an `<ol class="fig-flow">` of `.fig-node` steps (Archivo condensed caps title, then `<br>`-separated lines in Sentient). Arrows are CSS shafts and heads in the gaps. Flows stack vertically by default; `fig-flow--row` runs left to right from 480px (three one-word steps), `fig-flow--wide-row` from 800px (long flows). Nodes come in three weights, which carry meaning the way status text does: `--plain` (ground, outline), default (surface), `--ink` (ink fill, moss text) for the step that matters most. `.fig-lanes` holds alternatives with no arrows between them; `.fig-blocked` and `.fig-fail` are dashed, meaning "does not exist" or "fails back". Ink on moss only, no accent and no status colours. A mono figcaption starting "Figure N." or "Diagram N." says what to take away. Without CSS (feed readers) every figure reads as a titled ordered list. Rules: a figure restates only what the essay or its quotes already say; no word may break or overflow at 320px (e2e enforces it with `overflow-wrap: normal`); use `<wbr>` to break long identifiers; no blank lines inside the figure's HTML, or Markdown ends the block.

## Do's and Don'ts

- Do: give every number a printed source and, for ratings, the count.
- Do: show only moving, real material: recorded gameplay from the shipped build. No static product images, no AI imagery, no stock.
- Do: label unapproved builds "In review"; change the label when Apple does.
- Do: keep the first viewport readable with JavaScript off and without a GPU.
- Do: separate with rules; nest nothing.
- Don't: use white, gradients, glow, drop shadows, pills, icon tiles, kickers above headings or centered blocks.
- Don't: reuse HighSchoolTrends' lapis/parchment/gold or Bodoni; this site is not HST.
- Don't: add a timeline, an About, a Skills list or a testimonial row.
- Don't: use the accent for anything but state (current page, hover).
- Don't: ship a tile whose visual is a screenshot. Capture a loop or ship no visual.

## Motion

- **Approach:** intentional, reduced-motion first; everything below is additive.
- **Easing:** enter(ease-out) exit(ease-in) move(ease-in-out)
- **Duration:** micro(50-100ms) short(150-250ms) medium(250-400ms) long(400-700ms)
- **The motion is the recordings.** Videos play when they scroll into view and pause when they leave; links get a 160ms printed underline on hover. No authored scroll moments, no fades, no staggers, no parallax, no scroll-jacking.

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-10-23 | Initial design system created | /design-consultation: research of rauno.me, levels.io, raycast.com, linear.app, bruno-simon.com; independent Claude proposal ("Players: 1") adopted over the author's "bench" draft; Codex voice unavailable (not installed); fonts verified against Google Fonts and Fontshare; contrast checked |
| 2026-10-23 | No static product images, ever | Owner's rule: every visual is a recording of the real app or the live model, or there is no visual |
| 2026-10-23 | Light ground, not near-black | Use scene: warm physical product footage viewed at a desk in daylight; dark grounds exist to flatter UI screenshots, which this site does not show |
| 2026-10-23 | Home page cut to four rows (recording, the product's own one-liner, link) then the essays | Owner: the box-back copy read as cheesy; the spec strips, receipts, notes and banner duplicated the products. The visual system stands; the content does not argue |
| 2026-10-23 | Removed the 3D board viewer; Yonmoku shows its gameplay recording like every other row, with no captions | Owner: the loaded model replaced the recording with a still board, so the beads never fell; the frame's captions stated the obvious |
| 2026-10-23 | Products as an auto-fitting grid of phone tiles (4 across on laptop and tablet, 2 on phones, more columns as products are added); HighSchoolTrends re-recorded on a phone viewport so every tile shares one shape; Squeeze round in a dialog | Owner: the one-product-per-row list wasted the horizontal space |
| 2026-10-23 | Essay rewritten in Smart Brevity (TL;DR, Why it matters, Big picture, Between the lines, Yes but, Bottom line), ~650 words, carried by 12 verbatim quotes checked against their sources | Owner request; the check also removed a misattributed Alden quote, a paraphrase that inverted Thompson's April post, a dead link, and unverified macro figures |
| 2026-10-23 | Second essay, "Billing Controls: From Checklists to Harnesses", ported from the owner's claude.ai artifact with its two diagrams, three tables, bottom-line box and footnotes | Owner request. Dated the day it was written. One quote corrected to the source's exact wording; the footnote on credit-balance incidents cites the two status-page incidents |
| 2026-10-23 | Essay figures are HTML diagrams in ink and moss, not images or SVG | Owner asked for infographics. HTML text reflows on phones, uses the site fonts, is read by screen readers and survives RSS readers that drop CSS (inline SVG styled by classes renders as black shapes there). Three on the distribution essay, one per argument step |
| 2026-10-31 | Yonmoku shown live and linked to its App Store listing; LinkedIn in the footer and Person JSON-LD, and in the nav from 480px up; the footer's mailto link reads "Contact me" instead of printing the address; the playable Squeeze round removed | Owner request. Apple released Yonmoku on 2026-10-31. Below 480px the name and four nav links do not fit on one row, so LinkedIn stays in the footer there. The address stays in the mailto link and the Person JSON-LD, which are in the page source |
