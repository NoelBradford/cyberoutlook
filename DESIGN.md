---
name: CyberOutlook
description: A printed briefing for people who run small firms, not boards: ruled sections, condensed headlines, a serif voice and one amber alert colour.
colors:
  teal-ink: "#0d5b60"
  signal-amber: "#c68a0c"
  signal-amber-text: "#8a5f00"
  paper: "#f3f6f5"
  harbour-ink: "#15222b"
  muted-slate: "#56656d"
  hairline: "#c7d1d0"
  band-ink: "#f3f6f5"
  band-muted: "#c4cfd1"
  role-violet: "#5b4a9e"
  role-rust: "#a3451f"
typography:
  display:
    fontFamily: "Barlow Condensed, Barlow Fallback, sans-serif"
    fontSize: "6.4rem"
    fontWeight: 700
    lineHeight: 0.92
    letterSpacing: "-0.005em"
  headline:
    fontFamily: "Barlow Condensed, Barlow Fallback, sans-serif"
    fontSize: "3.2rem"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "0.005em"
  title:
    fontFamily: "Barlow Condensed, Barlow Fallback, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.08
  lead:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "1.42rem"
    fontWeight: 400
    lineHeight: 1.42
  body:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.62
  label:
    fontFamily: "IBM Plex Sans, Plex Fallback, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.1em"
rounded:
  sm: "2px"
  md: "3px"
spacing:
  xs: "0.45rem"
  sm: "0.8rem"
  md: "1.25rem"
  lg: "2rem"
  xl: "3.5rem"
components:
  tool-button:
    backgroundColor: "transparent"
    textColor: "{colors.harbour-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0.45rem 0.8rem"
  tool-button-primary:
    backgroundColor: "{colors.signal-amber}"
    textColor: "{colors.harbour-ink}"
    rounded: "{rounded.sm}"
    padding: "0.45rem 0.8rem"
  field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.harbour-ink}"
    rounded: "{rounded.sm}"
    padding: "0.55rem 0.65rem"
    height: "44px"
  call:
    textColor: "{colors.harbour-ink}"
    padding: "1.15rem 1.25rem 1.2rem"
  box:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.harbour-ink}"
    padding: "1.2rem 1.25rem"
  example:
    textColor: "{colors.harbour-ink}"
    rounded: "{rounded.sm}"
    padding: "1.3rem 1.3rem 1.1rem"
---

# Design System: CyberOutlook

## Overview

**Creative North Star: "The Field Briefing"**

CyberOutlook looks like a printed briefing handed to someone who runs a shop, a garage or a salon, not a board pack. Sections are separated by ruled lines, headlines are condensed and uppercase where they need to shout, the body is a serif that reads like a report, and a single amber colour is kept for the thing the reader must not miss. Everything sits flat on a cool off-white page; depth comes from rules, tints and weight, not from shadow.

The mood is calm, plain-spoken and serious. It is authoritative without raising its voice: nothing glows, nothing is dressed as a threat. The author talks to the reader directly, and the design stays out of the way of that voice. It never leans on fear imagery (red skulls, hooded figures, neon on black) or enterprise-dashboard gloss, which this audience has learned to ignore.

Components are tactile and confident: thick rules, 2px corners, clear borders and solid fills. They look like printed forms and stamped boxes that also work on a phone, in dark mode, on paper and offline.

**Key Characteristics:**
- Ruled structure: a 3px ink rule closes the cover, a 2px rule opens every section, hairlines divide the rest.
- Condensed sans headlines over a serif body, with a small sans for labels and controls.
- One accent (teal), one signal (amber), neutrals tinted toward the teal-slate hue; no gradients.
- Flat at rest; shadow is reserved for modal dialogs.
- Built to print, to read offline, and to pass WCAG 2.2 AA in light and dark.

## Colors

A cool paper-and-ink base with a deep teal accent and an amber signal. Dark mode keeps the same roles with lifted values.

### Primary
- **Teal Ink** (`#0d5b60`): the accent. Links, section numbers, key figures (`.stat .n`), selected states and tinted example panels. Dark mode uses Lifted Teal (`#62b8b5`).

### Secondary
- **Signal Amber** (`#c68a0c`): attention only. Focus rings, primary tool buttons, the callout (`.call`) edge and tint, struck-through "headline" statistics. Dark mode uses Warm Signal (`#e6b043`). Text set in amber uses **Signal Amber Text** (`#8a5f00`) to stay readable on paper.

### Tertiary
- **Role Violet** (`#5b4a9e`) and **Role Rust** (`#a3451f`): the second and third tints of the three-way role colouring used where content is split by reader role. They never appear outside that pairing with Teal Ink. Dark values: `#a99bf0`, `#f08a5d`.

### Neutral
- **Paper** (`#f3f6f5`): page background and field background. Dark mode: Night Paper (`#0e161b`).
- **Harbour Ink** (`#15222b`): text, heavy rules, the cover band. Dark mode: Pale Ink (`#e2e9e9`).
- **Muted Slate** (`#56656d`): secondary text, labels. Dark mode: `#9aa9ae`.
- **Hairline** (`#c7d1d0`): borders and dividers. Dark mode: `#2b3a42`.
- **Band Ink / Band Muted** (`#f3f6f5` / `#c4cfd1`): text on the dark ink band.

### Named Rules
**The One Alarm Rule.** Amber marks the one thing on a screen that needs action or attention. If two things are amber, neither is.

**The Tinted-Neutral Rule.** No pure black or white. Every neutral carries the teal-slate hue, and tinted surfaces are built by mixing the accent or signal into Paper (`color-mix`, 6-11%).

## Typography

**Display Font:** Barlow Condensed (with a size-adjusted Arial-family fallback)
**Body Font:** Source Serif 4 (with Georgia, serif)
**Label/UI Font:** IBM Plex Sans (with a size-adjusted Arial-family fallback)

**Character:** Condensed grotesque headlines carry the printed-bulletin attitude; the serif body keeps long reading comfortable; the Plex sans handles every control, label and table so the interface reads as a different voice from the report.

### Hierarchy
- **Display** (700, `clamp(2.7rem, 9vw, 6.4rem)`, 0.92): the cover title only, uppercase, with the year in teal.
- **Headline** (700, `clamp(2.05rem, 5vw, 3.2rem)`, 1.08): section titles, capped at 20ch, balanced wrapping.
- **Title** (700, 1.5rem, 1.08): callout and box titles.
- **Lead** (400 serif, `clamp(1.2rem, 2.4vw, 1.42rem)`, 1.42): the opening paragraph of a section.
- **Body** (400 serif, 1.0625rem, 1.62): all report text, held to 65ch (`.prose`).
- **Label** (600 Plex, 0.72rem, 0.1em tracking, uppercase): kickers, table headers, toolbar controls.

### Named Rules
**The Two Voices Rule.** Serif is the author; Plex is the interface. Controls, tables and labels never use the serif, and report paragraphs never use Plex.

**The Sixty-Five Rule.** Reading text stops at 65ch whatever the viewport. *Pending: draft PR #33 removes this cap so text, titles and forecasts run the full width of the column (about 100 characters on wide screens). Until the owner merges it, 65ch is the shipped measure. Update this rule and the Layout section once #33's outcome is decided.*

## Layout

A single-column document with a 1240px outer container (cover) and a 65ch reading measure for prose. The cover is a two-column grid on wide screens (title and meta); tool pages and dialogs reuse the same measure. Horizontal gutters are `max(16px, 4vw)`.

Rhythm is generous between sections (3.5rem padding under a 2px rule, 3rem margin above) and tight inside components (0.45-1.25rem). Float is used sparingly (the author portrait floats right at 168px and drops to 140px, unfloated, on phones). Breakpoints in use: 520px, 640px, 760px, 900px, 1100px, 1440px.

Spacing scale in practice: 0.45rem, 0.8rem, 1.25rem, 2rem, 3.5rem.

## Elevation & Depth

Flat by default. Hierarchy comes from rules (2px and 3px ink lines), tinted fills and weight. The only true shadow is the modal dialog (`0 24px 60px rgba(0,0,0,0.35)`), where depth signals a layer above the page.

### Shadow Vocabulary
- **Dialog lift** (`box-shadow: 0 24px 60px rgba(0,0,0,0.35)`): modal dialogs (`.cv-dialog`) only.

### Named Rules
**The Flat-At-Rest Rule.** Surfaces carry no shadow. Hover and focus change border colour or outline, never add glow.

## Shapes

Square and printed. Corners are 2px on controls, fields and panels, and 3px on dialogs. Borders are 1px hairlines by default, heavier (2-4px) where a rule has to organise the page. Rules usually sit on the top edge of a block; the amber callout is the one block with a heavy left edge (6px).

## Components

### Buttons (tool buttons)
- **Shape:** 2px corners, 1px Hairline border, uppercase Plex 0.78rem at 500, 0.06em tracking, padding `0.45rem 0.8rem`, 44px minimum touch target on interactive fields.
- **Default:** transparent fill, Harbour Ink text.
- **Hover:** border darkens to Harbour Ink.
- **Primary:** Signal Amber fill, Harbour Ink text, border matches fill. Hover mixes the fill 15% toward Paper.
- **Focus:** 3px Signal Amber outline, 2px offset, on every focusable element.

### Cards / Containers
- **Callout (`.call`):** amber tint (11% Signal mixed into Paper), 6px Signal Amber left edge, label row in Plex caps, title in Barlow 1.5rem. For "what to do" moments.
- **Box (`.box`):** 1px Hairline border with a 4px ink top rule, no fill. Case studies swap the rule to teal.
- **Example (`.example`):** Teal 7% tint, 2px corners, no border. For worked examples.
- **Stat (`.stat`):** hairline-divided cells, big Barlow figure in teal; a struck-through figure with a 4px amber line marks a number we deliberately do not quote.

### Inputs / Fields
- **Style:** Paper fill, 1px Hairline border, 2px corners, Plex 1rem, 44px minimum height.
- **Focus:** the shared 3px amber outline.

### Navigation
- **Contents list:** numbered rows in a two-column grid (section number in Muted Slate, tabular figures, label in Harbour Ink), hairline divider underneath, no underlines. Cover toolbar uses the same tool buttons.

### Dialogs
- 2px Harbour Ink border, 3px corners, Paper fill, 640px max width, the only shadowed surface.

## Do's and Don'ts

### Do:
- **Do** keep amber for one point of attention per screen and always pair it with an action or a label.
- **Do** build tints by mixing Teal Ink or Signal Amber into Paper rather than inventing new colours.
- **Do** set controls, tables and labels in IBM Plex Sans and report prose in Source Serif 4.
- **Do** keep the 65ch measure, 44px touch targets and the 3px amber focus ring.
- **Do** check every change in light, dark, print and at 390px wide; the system must stay legible in all four.
- **Do** keep numerals tabular in tables and statistics.

### Don't:
- **Don't** use fear imagery or dark neon; this system rejects fear-led security marketing.
- **Don't** add gradients, glass, soft shadows or glows to surfaces at rest.
- **Don't** introduce a new accent hue; the role violet and rust exist only as the role-colour pair with teal.
- **Don't** use pure black or white; tint every neutral toward the teal-slate hue.
- **Don't** let body text run wider than 65ch or set it in the interface sans.
