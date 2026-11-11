# Release note: tool pages and a calmer report (11 November 2026)

This note is for the owner. Nothing here has been published. `release` and `main` are untouched, no pull request is open, and every change sits on a stack of feature branches in `NoelBradford/cyberoutlook`. The plan and the issues are in `NoelBradford/outlook-2027` (epic #1).

## What changed

**Four tools now have a page of their own**, plus a hub:

| Page | What it is | Replaces |
|---|---|---|
| `/check/` | The two-minute exposure check, rendered on the page | `/#check` |
| `/readiness/` | Cyber Essentials readiness check | `/#readiness` |
| `/it-provider-email/` | The four questions as an email you can copy or open in your mail app | `/#itmail` |
| `/call-back-poster/` | Printable A4 call-back poster with a code word | `/#poster` |
| `/tools/` | A plain list of links to all of the above and to the in-report tools that have no page yet | the "All tools" dialog entry |

Each page has its own title, description, canonical address and social image, is listed in `sitemap.xml`, works offline after one visit, and shares saved answers with the report (same `cv:` keys). Old `/#check`, `/#readiness`, `/#itmail` and `/#poster` links go to the new pages in one hop before the report loads. Other tool links such as `/#plan` now keep their hash in the address bar, so they can be shared.

**The report page is calmer** (UX-10 and UX-11):

- The cover button and the Start here check card link to `/check/`.
- Start here has three cards instead of four. The "five things" card is gone, because the short version card already covers them.
- The role chips sit behind one "Tailor this to my role" control.
- The three key figures on the cover are no longer three links. The source line under them is the one link.
- Search moved into the Tools menu (the bar has it once you scroll).
- On phones the fixed bottom chrome is one strip, not two. The section chip became the label of the Contents button. The repeated "Contents" button after each section is hidden. The cover toolbar fits one row.
- Returning visitors see at most one message at a time, in the flow of Start here, never fixed over the page, and a dismissal is remembered.
- A link such as `/#act-t3-1` now lands on that action in the report. Row ids were added after the browser looked for the target, so the calendar links My plan produces never worked.

## Measured against `docs/ux-baseline.json`

Same machine and method (`tools/measure.js`, fresh visitor, Chromium on Windows, web fonts blocked).

| Measure | Before | After |
|---|---|---|
| First-screen controls, desktop (including 2 skip links) | 12 | 9 |
| First-screen controls, phone (including 2 skip links) | 11 | 9 |
| Fixed chrome covering a 390x844 phone mid-report | 94px (11.1%) | 59px (7.0%) |
| Cover toolbar rows at 390px and 360px | 2 | 1 |
| Report transfer, gzipped (HTML, JS, CSS) | 207,652 bytes | 210,727 bytes (3.1KB more) |
| Document height, desktop | 46,523px | 46,456px |
| Document height, phone | 67,137px | 66,212px |
| Buttons inside `main` | 185 | 185 |

Tool pages, gzipped transfer including HTML, JS and CSS (fonts excluded): `/check/` 21,054 bytes, `/readiness/` 13,444, `/it-provider-email/` 13,532, `/call-back-poster/` 14,301, `/tools/` 12,305. The target for `/check/` was under 60KB.

The page heights in the baseline file do not match the earlier review's figures (48,589px and 64,489px) by about 4%. The cause is unexplained. The baseline depends on fallback fonts, so compare later runs on the same machine.

## Checks that ran

- CI is green on every pushed branch up to `ux/phone` (the build is byte-identical on Windows and Linux, the report smoke test passes, and the tool profile passes on every page in `tools/pages.txt`).
- `tools/qa-matrix.js` (see `docs/qa-matrix.md` for the table): 108 combinations (every page, widths 320 and 1280, light, dark and system themes, fresh, finished-check and partly finished-check visitors) with zero axe violations (WCAG 2.0 and 2.1 A and AA plus best practice) and no sideways scroll. The full run also covers 390 and 768px (`npm run qa`).
- Keyboard: every page can be walked with Tab, every stop is on screen and shows a focus indicator. Escape closes the My plan dialog and focus returns to the button that opened it.
- Print: `/check/` prints on one A4 page, the other tool pages on two. The call-back poster, printed with its Print button, is one A4 page whose text is only the poster (checked with a PDF).
- Offline: all six pages open with the network off after one visit.
- Old links, section anchors and tool keys: `tools/links-check.js`, run in CI.
- The report's check dialog was compared before and after every change with a scripted run (ten taps, ten key presses, the plan box, Start again). It is identical.

## Findings and fixes along the way

- The report's start band had unreadable text in dark mode for the new "Tailor this to my role" control. Fixed.
- The poster's gold "Call back." on white is just under 3:1. On the tool page, and in a poster printed from it, it uses a darker gold. The report's own poster is unchanged.
- Already there, not caused by this work: links such as `/#mvc` and `/#rules` do not always end at the top of the section, because content above them shifts after load. The `forecasts` route in `171-tool-links.js` points at a function that does not exist.
- `tools/build.py` produced different output on Windows (backslash paths and CRLF line endings). Fixed, and checked on LF and CRLF checkouts.

## Decisions

Made:
- Move the site to Cloudflare (option C in UX-12). A preview Worker serves the work at https://cyberoutlook-preview.github-28a.workers.dev (set to `noindex`). Nothing has changed on the live domain. `sbcsg.uk` is already a Cloudflare zone on the Free plan in the logged-in account. The remaining steps are in `outlook-2027` issue #17: compare the preview with the live site, add the custom domain to the Worker, then remove the GitHub Pages record.
- The exposure check is the first lead magnet. Results are free.

Still needed from you:
1. **UX-12 (email capture)** and **UX-13 (measurement)**. No code was written. They need your decisions (see the issues). Nothing in this work sends data anywhere, and the privacy promise is unchanged.
2. **UX-10 is a proposal.** Confirm the three-card Start here, the role chips behind one control, the stat figures no longer being links, Search moving into the Tools menu, and the welcome-back and what's-new messages moving into the page flow.
3. Extra standalone pages for other tools (My plan, five-and-five map, AI tool register, restore-test log, MFA tracker and others): the hub links to them in the report for now. Say which you want.
4. The version label and date for the version history line (`index.html` has a "next" entry for you to complete).
5. Whether to update the last LinkedIn carousel slide to point at `/check/` (not done, PDF not regenerated).

## QR codes and PDFs

The three QR codes in `index.html` decode to `https://cyberoutlook.sbcsg.uk/?utm_source=print&utm_medium=qr&utm_campaign=cover`, `https://cyberoutlook.sbcsg.uk/#mvc` and `...&utm_campaign=back`. None of them points at a URL this work changed, so the PDFs do not need regenerating.

## Not covered

- A screen reader pass (VoiceOver or NVDA). This needs a person.
- Real touch on a phone, and printing from a real browser dialog.
- After release: link previews for each page (the social images are in place), and a visit to the live site in a browser that already has the old service worker.
- The 390 and 768px widths in the matrix on CI (the quick run covers 320 and 1280px).

## Branch stack and release checklist

The branches are stacked in this order, each on top of the previous one: `ux/baseline`, `ux/pages`, `ux/check`, `ux/readiness`, `ux/itmail`, `ux/poster`, `ux/hub`, `ux/urls`, `ux/social`, `ux/start`, `ux/phone`, `ux/qa`. `release` only moves when you say so. To release without the UX-10 proposal, the branches after `ux/social` need rebasing, because UX-11 builds on UX-10.

- [ ] Epic issues closed or explicitly deferred.
- [ ] CI green on the top branch.
- [ ] You approve (or change) the UX-10 proposal.
- [ ] You fast-forward `release` to the top branch (nothing goes into `main`).
- [ ] GitHub's "pages build and deployment" run succeeds.
- [ ] Smoke test the live URLs: `/`, `/check/`, `/readiness/`, `/it-provider-email/`, `/call-back-poster/`, `/tools/`, and the old `/#check`.
- [ ] Check link previews for each page.
- [ ] Open the live site once in a browser that already visited it, to confirm the service worker picks up the new version.
