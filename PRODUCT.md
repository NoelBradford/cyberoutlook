# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two co-primary audiences, confirmed with the owner:

- **Owners and managers of UK small firms (5 to 50 staff)** with no security specialist: builders, brokers, garages, salons, bookkeepers, heating engineers. They read the outlook and decide what to do. The report tailors itself to four roles: owner, office manager, IT, finance.
- **IT providers and MSPs** who support those firms and use the tools, the four questions and the call-back poster to talk to clients.

## Product Purpose

CyberOutlook is the web edition of the *UK Small Business Cyber Outlook 2027* by Noel Bradford (The Small Business Cyber Security Guy; publisher SBCSG Enterprises Ltd). It is a forecast written for small firms rather than boards, plus interactive tools around it: a two-minute exposure check, a plan builder, an incident card, and printable or shareable outputs.

Success is action first, enquiry later: a reader finishes the check, builds a plan and does something about it. The email capture (built, switched off) and the author's profile are the route to a conversation afterwards.

## Positioning

A forecast for the firms big-vendor reports ignore, written in the author's own voice (first person, conversational, from his show), with UK benchmarks from the government survey and the same wording as the PDF.

## Operating Context

Readers arrive from LinkedIn posts, shared tool links, QR codes in the printed PDF, and search. They may be on a phone, mid-incident, or printing a plan for a team. Tools live on their own shareable pages (`/check/`, `/readiness/`, `/it-provider-email/`, `/call-back-poster/`, hub `/tools/`).

## Capabilities and Constraints

- Static site, no frameworks. `index.html` is the report; `src/` holds the interactive layer; `tools/build.py` generates bundles and tool pages (do not hand-edit generated files). Published via GitHub Pages from the `release` branch, which only moves when the owner says so.
- Current state (from the repo, not a new commitment): no accounts, cookies or analytics; everything a reader types stays in their browser; the optional email capture and PDF gate is switched off and the deployed site leaves the gated PDFs out while the capture is on.
- **Binding:** WCAG 2.2 AA, clean printing (A4 PDF, QR codes) and offline reading through the service worker.
- Not stated as binding: the report's wording and figures (unchanged from v1.1 so far) and the no-tracking posture. Ask before changing either.

## Brand Commitments

Author name and role as above. Copy follows the network's Writing Style Guide v2 (`Podcast-Wiki/raw/network/writing-style-guide-v2.md`): UK spelling, no em dashes, short sentences, contractions by default, acronyms expanded on first use, and nothing from `banned-words-replacements.csv`. Never mention a cast member's real-world employer. The report's own wording is unchanged from v1.1, so this governs new or edited UI copy. Voice is first person and plain-spoken. The SBCSG operator-UI house style (`QuickPodBuilder`/`AutoPodMix` glass, orange and violet tokens; `sbcsg-ui`, Cadence design language) is for operator and admin tools only. The wiki records that public brands stay separate from it, so CyberOutlook keeps its own public identity. Dark mode, simple mode and reading settings already exist and should be preserved.

## Evidence on Hand

Full report PDF (`assets/UK-Small-Business-Cyber-Outlook-2027.pdf`), ten-slide LinkedIn carousel (`linkedin/`), per-page social images, UX baseline metrics (`docs/ux-baseline.json`), QA matrix (`docs/qa-matrix.md`), draft privacy notice (`docs/privacy-notice-draft.md`). No testimonials or customer logos are on file; do not invent any.

## Product Principles

1. Plain words for non-specialists; every score and gap links to a concrete action.
2. The reader owns their data and their pace; nothing is collected without a clear reason and consent.
3. Every tool is useful on its own page, shareable, printable and usable offline.
4. Evidence first: figures come from the survey and the report, never decoration.

## Accessibility & Inclusion

WCAG 2.2 AA is the required standard. Existing provisions to keep: simple mode, reading settings, listen aloud, keyboard operation, high-contrast-safe dark and light themes, print layouts.
