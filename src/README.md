# The interactive layer

The report itself is `index.html`. Everything interactive (the exposure check, My plan, the tools, the app bar and so on) lives here in `src/` and is bundled into `assets/app.js` and `assets/app.css`.

## How it fits together

- `src/core.js` and `src/core.css`: the shared `CV` helper (saved state, dialogs, downloads, calendar files, the toolbar) and base styles.
- `src/features/NNN-name.js` and `.css`: one file pair per feature, numbered by the iteration that added it. They load in number order.
- `tools/build.py`: joins everything into `assets/app.js` and `assets/app.css`, stamps `index.html` with a version so browsers fetch the new files, and builds the tool pages (see below).
- `src/pages/`: the standalone tool pages (see below). Nothing here goes into `assets/app.js` or `assets/app.css`.
- `tools/check.js`: the smoke test GitHub runs on every push (see `.github/workflows/check.yml`).

Features start in small slices when the browser is idle (`CV.ready`), so the page stays responsive while they load.

## Standalone tool pages

A tool can have its own page at `/<slug>/` as well as (or instead of) opening as a dialog over the report. The pages are:
`/check/`, `/readiness/`, `/it-provider-email/`, `/call-back-poster/` and the hub `/tools/`.

### The manifest

`src/pages/pages.json` is a list, one entry per page. Fields:

| Field | Meaning |
|---|---|
| `slug` | Lower case letters, digits and single hyphens. `assets`, `src`, `docs`, `linkedin` and `index` are reserved. `tools` is allowed (the hub). |
| `title`, `description` | Page title and heading, meta description and social preview text. Unique across pages and the report (the build fails on a repeat). |
| `intro` | Optional sentence under the `h1`. |
| `features` | Three-digit ids of the `src/features` files the page needs, for example `["108", "109"]`. The build fails if an id matches no file. |
| `open` | Optional dotted function called once the interactive layer is ready, for example `CV.openCheck`. |
| `reportParts` | Optional list of parts of the report the tool reads from the page, lifted from `index.html` at build time into a hidden block: `actions` (the three action tables, read by `CV.actions()`) and `it-questions` (the four IT provider questions). The build fails if the report no longer has them. |
| `card` | `promise` and `time` for the page's card on the hub. |
| `hub` | Only on the hub entry: `order` (slugs, in order) and `reportTools` (tools that have no page yet: `key`, `name`, `promise`; `key` must be a route in `171-tool-links.js`). The list is plain HTML links. |
| `hashKey` | The old `/#key` link this page replaces. `/#key` redirects to the page. It must be a route in `171-tool-links.js`. |
| `ogImage` | A path inside the repo, a 1200 by 630 PNG. Render them with `node tools/og.js`. |
| `lastmod` | Date for `sitemap.xml`, kept by hand so a build is the same every day. Update it when the page changes. |

`src/pages/sitemap.json` holds the entries that are not pages (the report and the two PDFs).

### What the build does

`python3 tools/build.py` writes, for each entry, `<slug>/index.html`, `assets/tool-<slug>.js` and `assets/tool-<slug>.css`, prints their sizes, and regenerates `sitemap.xml` and `tools/pages.txt` (the list CI runs the tool profile on). It also writes the redirect for old hash links into the `<head>` of `index.html` and `CV.pageRoutes` into the report bundle, both from `hashKey`.

- A tool bundle is `src/pages/shell.css`, `src/core.*`, `src/pages/standalone.js` and only the listed features, in number order.
- `src/pages/shell.html` is the shared template. `src/pages/shell.css` holds the design tokens and page chrome, copied from the inline style in `index.html`: if the report's tokens change, change them there too.
- The Content-Security-Policy is read from `index.html` at build time, so a tool page can never carry a different policy. The service worker's cache name is read from `sw.js`.
- Pages use `../`-relative URLs, because the policy sets `base-uri 'none'`.
- Each page stores itself and its bundles in the service worker's cache after the first visit, so it opens offline.
- The build removes generated files for pages no longer in the manifest. It never removes a folder.

### Adding a page

1. If the tool is a feature that opens a dialog on the report, make it render inline when `CV.standalone` is set (see below) and keep its report behaviour.
2. Add an entry to `src/pages/pages.json` (and a `card`, and its slug to the hub's `order`, if it belongs on `/tools/`). Set `ogImage` to `assets/og-<slug>.png` and run `node tools/og.js <slug>`.
3. Run `python3 tools/build.py`, then `node tools/check.js http://127.0.0.1:8080/ --profile tool --path /<slug>/` against `python3 -m http.server 8080`.
4. Commit the source and everything the build changed or added.

### `CV.standalone`

On a tool page the build sets `CV.standalone = true` straight after `src/core.js` (core assigns `window.CV` as a whole, so it cannot be set earlier). On the report it is undefined. `CV.inlineHost({ id, label, note })` (in `src/pages/standalone.js`, tool pages only) returns a host with the same shape as `CV.dialog`, rendered in the page's `<main>`; use `CV.standalone ? CV.inlineHost(...) : CV.dialog(...)`. The report is not there on a tool page, so a feature that needs report anchors (a heading such as `#rules`, the cover toolbar, the Start Here card) must skip quietly instead of failing:

```js
CV.ready(function () {
  var rules = CV.$('#rules');
  if (!rules) return; // no report behind this page (CV.standalone), nothing to attach to
  // ... attach to the report here
});
```

Check for the anchor you need rather than for `CV.standalone`; use the flag only where behaviour should differ on a tool page, such as rendering inline instead of in a dialog. A feature failing inside `CV.ready` shows up as a `CV feature failed` warning, which the tool profile of `tools/check.js` treats as a failure.

### Returning-visitor messages

Only one message shows at a time: a message asks `CV.notice.claim(key)` before it shows itself (first to ask wins), and a dismissal is stored with `CV.notice.dismiss(key, token)` (saved as `cv:dismissed`). Messages sit in the flow of Start here, never fixed over the page.

### Privacy

The promise is unchanged: nothing a reader enters leaves their browser, with no accounts, cookies or analytics. The tool profile of `tools/check.js` fails on any request to another site (web fonts excepted). Email capture and measurement (UX-12 and UX-13) have not been decided, so nothing here sends data anywhere.

## Making a change

1. Edit a file in `src/`. Don't edit `assets/app.js` or `assets/app.css` directly.
2. Run `python3 tools/build.py` (on Windows without a `python3` command, `python tools/build.py` gives the same output).
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
- `cv:dismissed`
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
- `cv:seen-new`
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
