---
# gstack: design-md-format=spec
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
  stamp:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
---

# jamesshin.tech

## Overview

**Creative North Star:** The back of a game box for a one-person studio. A box back is the best one-page persuasion format ever printed for a 30-second decision: key art, hard spec lines, a rating with its sample size, fine print. The owner's one sentence, "one person shipped all of this, end to end", becomes the spec line **PLAYERS: 1**.
**Product context:** A real-name work sample for employers. Four shipped products (a school-rankings web app, three iOS games/apps, two of them Unity), each with verifiable receipts; a shipping log; one essay. Readers are product and engineering hiring managers who live in Linear, GitHub and the App Store.
**Mode per surface:** First viewport: Persuade. Chapters, receipts, log, essay: Read. The playable Squeeze round and the 3D board: Experience. No Operate surface.
**Reference sites:** rauno.me (light ground, cropped type, craft as content), levels.io (receipts in public), raycast.com and linear.app (the near-black "professional software" default this system deliberately avoids), bruno-simon.com (a WebGL-only page shows nothing without a GPU: every 3D moment here has a real fallback), scrolltide.co templates (pinned, scroll-posed objects).
**Key characteristics:**
- Pale moss ground, no white anywhere, hard 2px ink rules instead of whitespace or shadows
- One wide black grotesk voice for headlines and labels, a textured serif for reading, mono for anything that is a fact
- The only images are moving and real: gameplay recorded from the shipped builds, and the real board model
- Every claim is a spec line with a printed source and, for ratings, the sample size
- Dense like a box back, never cluttered: rules do the separating

## Colors

**Strategy:** Restrained. One accent, used in exactly three places (the PLAYERS 1 stamp, button hover, the newest patch-note date); everything else is the ink and moss pair.
**Light or dark:** Light, decided by the use scene: a reader at a desk in daytime looking at warm product footage (hinoki wood, tatami, a bridge at dusk). On near-black those read as ads; on moss they read as objects. Dark mode is not offered.
Ink `#14170F` on ground `#D9DCCB` is 13:1; muted `#4D5244` passes 4.5:1 on both ground and surface `#C7CBB6`. The accent `#E0497E` only ever carries ink text (4.7:1); white on it fails. Status is text, never color: "Live", "In review". Semantic colors appear only in the playable round's result line.

## Typography

Archivo (Google Fonts, SIL OFL 1.1, variable weight and width) is the box-back voice: width 125 / weight 900 for headlines, width 80 / weight 700 caps for labels, so one family does two jobs and the page never looks like a font pile. Sentient (Fontshare, ITF Free Font License, variable 200–700 with italics, self-hosted woff2 under `public/fonts/`) reads like an indie manual, not a bank. Martian Mono (Google Fonts, SIL OFL 1.1) sets receipts, sources, spec strips and patch notes; its wide letterforms rhyme with Archivo expanded. Scale: 13 / 14 / 18 / 28 / 44 / 96. Display stays at or under 6rem; it is a poster only in the first viewport. Fonts load through `next/font` with metric fallbacks (Arial Black for Archivo, Georgia for Sentient, Menlo for Martian Mono).

## Layout

12-column grid, max width 1376px, 32px gutters (16px on phones), nothing centered. First viewport: headline in columns 1–6 cropped off the left edge, key art (the real board) in columns 7–12 inside a hard rectangle, full-bleed spec strip along the bottom. Chapters alternate 7/5: a phone-shaped video panel on one side, headline, one line, spec strip and mono fine print on the other, 96px between chapters (56 on phones). Sections are divided by full-bleed 2px rules. At phone width the grid collapses to one column, the crop is released (the headline fits the width), spec strips wrap, and video panels sit above their text.

## Elevation & Depth

None by shadow. Depth is a 2px ink keyline, the surface tone against the ground, and the one inverted band (ink with moss text) allowed per page. No glow, no blur, no gradients.

## Shapes

Rectangles. 2px radius on buttons and stamps, 4px on panels, 6px only on the playable round's sliders. Nested radius = outer radius − gap, which here means inner elements are square.

## Components

- **Button, primary:** ink fill, moss text, Archivo condensed caps 13px, 44px min height; hover raspberry fill with ink text; focus-visible 2px ink outline offset 3px; active no transform; disabled 50% opacity, no hover.
- **Button, secondary:** 2px ink border, ink text; hover ink fill with moss text.
- **Spec strip:** mono 12–13px caps, bold key then value, 2px rules above and below, wraps at phone width.
- **Fine print (receipts):** mono 13px, muted, values in ink bold, source sentence last; one block per product, never a bullet list of stats.
- **Stamp (PLAYERS: 1):** raspberry fill, ink condensed caps; plays a 120ms scale 1.08→1 once on first intersect.
- **Video panel:** 2px ink keyline, phone aspect; `<video muted loop playsinline preload="none">` with WebM + MP4 sources and a poster frame from the same recording; plays on intersect, pauses off-screen; under reduced motion the poster frame shows and a Play control appears; a mono provenance line under it (build, date, length).
- **Key art / board viewer:** the real GLB behind a click or idle load; the Yonmoku loop plays in the frame until then; no-WebGL fallback is the loop itself plus one mono line.
- **Nav:** sticky, 52px, ink rule below, condensed caps; current page in accent.
- **Patch notes rows:** mono date, mono product, serif title; newest date in accent.

## Do's and Don'ts

- Do: give every number a printed source and, for ratings, the count.
- Do: show only moving, real material: recorded gameplay from the shipped build, the live model. No static product images, no AI imagery, no stock.
- Do: label unapproved builds "In review"; change the label when Apple does.
- Do: keep the first viewport readable with JavaScript off and without a GPU.
- Do: separate with rules; nest nothing.
- Don't: use white, gradients, glow, drop shadows, pills, icon tiles, kickers above headings or centered blocks.
- Don't: reuse HighSchoolTrends' lapis/parchment/gold or Bodoni; this site is not HST.
- Don't: add a timeline, an About, a Skills list or a testimonial row.
- Don't: let the accent appear anywhere beyond the three agreed places.
- Don't: ship a chapter whose visual is a screenshot. Capture a loop or ship no visual.

## Motion

- **Approach:** intentional, reduced-motion first; everything below is additive.
- **Easing:** enter(ease-out) exit(ease-in) move(ease-in-out)
- **Duration:** micro(50-100ms) short(150-250ms) medium(250-400ms) long(400-700ms)
- **The one authored moment:** the pinned hero. Scroll orbits the real board and drops its beads in sequence while the headline and the spec strip pass; then it docks into its chapter. Beyond it: the 120ms stamp, a 160ms printed underline on hover, videos playing on intersect. No fades, no staggers, no parallax, no scroll-jacking.

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-10-23 | Initial design system created | /design-consultation: research of rauno.me, levels.io, raycast.com, linear.app, bruno-simon.com; independent Claude proposal ("Players: 1") adopted over the author's "bench" draft; Codex voice unavailable (not installed); fonts verified against Google Fonts and Fontshare; contrast checked |
| 2026-10-23 | No static product images, ever | Owner's rule: every visual is a recording of the real app or the live model, or there is no visual |
| 2026-10-23 | Light ground, not near-black | Use scene: warm physical product footage viewed at a desk in daylight; dark grounds exist to flatter UI screenshots, which this site does not show |
| 2026-10-23 | Home page cut to four rows (recording, the product's own one-liner, link) then the essays | Owner: the box-back copy read as cheesy; the spec strips, receipts, notes and banner duplicated the products. The visual system stands; the content does not argue |
