# The interactive layer

The report itself is `index.html`. Everything interactive (the exposure check, My plan, the tools, the app bar and so on) lives here in `src/` and is bundled into `assets/app.js` and `assets/app.css`.

## How it fits together

- `src/core.js` and `src/core.css`: the shared `CV` helper (saved state, dialogs, downloads, calendar files, the toolbar) and base styles.
- `src/features/NNN-name.js` and `.css`: one file pair per feature, numbered by the iteration that added it. They load in number order.
- `tools/build.py`: joins everything into `assets/app.js` and `assets/app.css` and stamps `index.html` with a version so browsers fetch the new files.
- `tools/check.js`: the smoke test GitHub runs on every push (see `.github/workflows/check.yml`).

Features start in small slices when the browser is idle (`CV.ready`), so the page stays responsive while they load.

## Making a change

1. Edit a file in `src/`. Don't edit `assets/app.js` or `assets/app.css` directly.
2. Run `python3 tools/build.py`.
3. Check it: `python3 -m http.server 8080` in the repo root, open http://localhost:8080, then run `npm install` once and `npm run check`.
4. Commit `src/`, `assets/app.*` and `index.html` together. GitHub fails the check if the bundle wasn’t rebuilt.

To remove a feature, delete its file pair from `src/features/` and rebuild. Features that depend on another one check for it first, so the rest keep working.

## Rules every feature follows

- Report wording and figures are never changed. Tools only quote figures the report already cites, with their source.
- Nothing the reader enters leaves their browser. There are no accounts, cookies or analytics; the only outside request is for the web fonts (Google Fonts). Saved data stays in `localStorage` and can be exported or deleted from Tools, Your data.
- Works with the keyboard, has visible focus, respects reduced motion, and prints sensibly (or hides itself in print).

## Data saved in the browser

Keys are stored as `cv:<key>` (plus a few older `cv-` keys from before the interactive layer):

- `cv:a4`
- `cv:aitools`
- `cv:arrival`
- `cv:ce`
- `cv:cert`
- `cv:check`
- `cv:fivefive`
- `cv:hires`
- `cv:inclog`
- `cv:itmail`
- `cv:marks`
- `cv:meeting`
- `cv:mfa`
- `cv:ninety`
- `cv:nudged`
- `cv:plan`
- `cv:pos`
- `cv:poster`
- `cv:rate`
- `cv:read`
- `cv:read-`
- `cv:readpct`
- `cv:restores`
- `cv:role`
- `cv:short`
- `cv:simple`
- `cv:snap`
- `cv:spend`
- `cv:sq`
- `cv:supmail-who`
- `cv:toured`
- `cv:votes`
- `cv:welcomed-`

Older keys: `cv-five-things` (five-things ticks), `cv-plan-contacts` (one-page plan contacts), `theme` (light or dark).

## Features

| File | What it does |
|---|---|
| `107-start-here` | Countdown to 1 January 2027, tied to the five-things checklist. |
| `108-exposure-check` | Two-minute exposure check |
| `109-my-plan` | My plan |
| `110-plan-owners-dates` | My plan |
| `111-check-to-plan` | Exposure check -> plan |
| `112-plan-export` | My plan |
| `113-plan-share-link` | My plan |
| `114-ninety-day-tracker` | 90-day plan |
| `115-it-provider-email` | IT provider email builder |
| `116-callback-poster` | Call-back rule poster |
| `117-five-and-five` | Five-and-five map |
| `118-ai-tool-register` | AI tool register |
| `119-wallet-card` | Wallet card |
| `120-waffle-43` | The 43% problem, drawn |
| `121-episode-guide` | Podcast episode guide |
| `122-listen-cards` | Listen cards |
| `123-citation-cards` | Citation cards |
| `124-share-quote` | Share a quote |
| `125-what-next` | What next |
| `126-stat-cards` | Shareable stat cards |
| `127-share-hub` | Share hub |
| `128-send-to-colleague` | Send to the right person |
| `129-welcome-back` | Welcome back |
| `130-search` | Search the report |
| `131-app-bar` | App bar |
| `132-short-version` | Short-version mode |
| `133-listen-aloud` | Listen to any section |
| `134-glossary` | Plain-English glossary |
| `135-reading-settings` | Reading settings |
| `136-highlights` | Highlights and notes |
| `137-focus-mode` | Focus mode |
| `139-bill-timeline` | Bill tracker |
| `140-forecasts` | Forecast scorecard |
| `141-count-up` | The year in numbers comes alive |
| `142-present` | Present mode |
| `143-meeting-pack` | Team meeting pack |
| `144-progress-hub` | My progress |
| `145-certificate` | Five-things badge |
| `146-spend-builder` | Spend planner |
| `147-role-picker` | "I'm the…" picker |
| `148-like-yours` | Businesses like yours |
| `149-offline` | Offline reading |
| `150-live-charts` | Living charts |
| `151-pressure-map` | Living cover |
| `152-theme-openers` | Theme openers |
| `153-sources-explorer` | Sources explorer |
| `154-facts-lens` | Facts and forecasts lens |
| `155-shortcuts` | Keyboard shortcuts |
| `156-tools-menu` | Cleaner cover |
| `157-your-data` | Your data, your control |
| `158-tour` | First-visit tour |
| `159-full-pdf` | Full-report PDF |
| `161-toc-progress` | Contents with a sense of distance |
| `162-five-tracker` | The five things follow you |
| `163-plan-nudge` | Halfway nudge |
| `164-ce-readiness` | Cyber Essentials readiness check |
| `165-questionnaire` | Supplier questionnaire answers |
| `166-incident-mode` | "It's happening now" mode |
| `167-restore-log` | Restore-test log |
| `168-mfa-tracker` | MFA rollout tracker |
| `169-code-word` | Payment code-word generator |
| `170-team-pack` | Team pack |
| `171-tool-links` | Every tool has its own link |
| `172-arrival-welcome` | Arrival-aware welcome |
| `173-listen-next` | Listen next |
| `174-plan-answers` | The one-page plan comes alive |
| `175-supplier-email` | Ask your suppliers |
| `176-briefing` | Five-minute team briefing |
| `177-reminders-hub` | Reminders hub |
| `178-phone-section-chip` | Phones always know where they are |
| `179-cover-strip` | Cover numbers strip |
| `180-pull-quote` | The line people remember |
| `183-slim-start` | Returning readers skip the intro |
| `184-author-card` | Meet the author |
| `185-episode-chip` | Next episode, always visible |
| `186-paragraph-links` | Link to any paragraph |
| `187-sidenotes` | Sidenotes on big screens |
| `188-forecast-cards` | Share a forecast |
| `189-hire-check` | Remote hire check |
| `190-renewal-pack` | Renewal evidence pack |
| `191-toolkit-print` | Print my toolkit |
| `192-since-last-visit` | Since your last visit |
| `193-section-share` | Share or copy a whole section |
| `194-simple-mode` | Simple mode |
| `195-a11y-audit` | Accessibility audit (axe-core) and fixes |
| `197-no-shift` | Mark the page ready once every feature has started, so the toolbar can drop its reserved height. |
