# Email Worker (not deployed)

The core of the owner's own list and email system, written ahead of the open decisions. It is **not deployed and sends nothing**, and the page side that would call it is built but switched off (see below). The design, the findings behind it and the open points are in [`docs/email-platform-design.md`](../docs/email-platform-design.md) and issue #18 in `NoelBradford/outlook-2027`.

## What is here

| File | What it does |
|---|---|
| `schema.sql` | D1 tables: `subscribers`, `consents` (who agreed to what, the wording id, the page, when asked, confirmed, withdrawn), `tokens` (single-use, hashed), `suppressions` (a hash of the address, so it can outlive the address) and `counts` (signup numbers by day, topic and page, with no address in them, kept after the purge). |
| `stats.sql` | Signup numbers from `counts` only. Visits and request numbers come from Cloudflare's own dashboard. |
| `src/core.js` | The logic, with no Cloudflare imports: `subscribe`, `confirm`, `download`, `unsubscribe`, `purge`. |
| `src/index.js` | The HTTP routes under `/api/` (subscribe, confirm, download, unsubscribe, preferences, erase) and the daily purge, using the core. |
| `src/mailer.js` | One interface, `send({ to, subject, text, headers })`. A memory mailer for tests and a Cloudflare Email Sending stand-in. The provider is not chosen. |
| `test/core.test.js`, `test/d1-shim.js` | 14 tests on SQLite (the engine D1 uses). Run: `node --test worker/test/*.test.js` (Node 22.5 or newer). They run in CI. `tools/capture-check.js` also runs this Worker end to end behind the real pages. |
| `wrangler.toml` | How it would be set up. All ids are placeholders. |

## What it enforces

- Four topics: `result` and `download` are transactional (the address is kept 30 days); `newsletter` and `report-updates` are marketing and need the page to send the id of the exact wording shown beside an unticked box. A marketing topic is never added because a transactional one was asked for.
- Every request is **double opt-in**: nothing but the confirmation is sent until the link in it is opened (links work once and expire after 48 hours). The answer to a form never says whether an address was already known, and one address gets at most three confirmations an hour.
- A confirmed marketing topic records consent with the wording id and source page, and its emails carry `List-Unsubscribe` and one-click `List-Unsubscribe-Post`. Unsubscribing is one step, needs no account, suppresses at once, and records the withdrawal. A fresh confirmed opt-in lifts an earlier unsubscribe from that topic only.
- A gated file is fetched from a private R2 bucket only with a single-use link made when the address was confirmed, valid for 15 minutes and for that file only.
- Every marketing email carries a link to a preferences page (what you are on, unsubscribe, and "delete my data"), reached only by a signed link, with no account. Deleting removes the address, its consents and links, and keeps only no-contact hashes and counts.
- A daily purge deletes expired links, unconfirmed requests and addresses with no live marketing consent once their 30 days are up. Suppression hashes stay.
- The result email contains the score, the band and the numbers of the questions with a gap. It does not copy the report's wording.

## What it does not do yet

- No broadcast or campaign sending, no admin screen, no segments, no templates, no reporting, no bounce or complaint handling. Those are phases 2 and 3 of the design.
- No sending provider is chosen. `cloudflareMailer` follows Cloudflare's beta documentation as read on 11 November 2026 and has not been run.
- Turnstile is optional here and has not been tried.
- The pages can call it, but the switch is off. `src/features/219-email-capture.js` (the result form on `/check/`) and `220-report-gate.js` (the PDF gate) do nothing until `src/pages/config.json` has an endpoint, a privacy notice address and both wordings (see `src/README.md`). They are tested against a mock endpoint (`tools/capture-check.js`), never against this Worker.
- The privacy notice (`/privacy/`) is not built: a draft for the adviser is in `docs/privacy-notice-draft.md`. The preferences page is served by this Worker (`/api/preferences`), not by a static page.
- The PDFs are still public static files in the repo. The gate is not real until they move to R2 and out of the repo (and its history).
