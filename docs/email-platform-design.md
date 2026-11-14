# Our own email platform on Cloudflare: investigation and design

Written 11 November 2026. This is a design and a set of findings, not built. Nothing here sends email or stores an address. Where I could not verify something it says so.

## What the owner asked for

1. Build our own list and email system with the upsides of Mailchimp and good email clients, fully UK compliant, without the downsides.
2. Check whether something open source already runs natively on a Cloudflare Worker, and if so make it our own.
3. The report is a living document, so readers need an option to be told when it is updated.
4. Email-gate the full report and the slide deck on the front page.
5. Earlier decisions: "email me my result" on `/check/`; a separate, unticked newsletter box; SBCSG Enterprises Ltd as controller; result-email addresses kept 30 days; newsletter sign-ups until they unsubscribe; Cloudflare's own metrics plus the signup count; release after the email step and extra pages are built.

## What exists already (checked 11 November 2026)

| Option | What it is | Fit |
|---|---|---|
| [djpardis/newsletter](https://github.com/djpardis/newsletter) | A small HTTP API on Cloudflare Workers with D1 and Queues. Double opt-in, one-click unsubscribe, campaigns queued for delivery, operator approval before a send, bounce and complaint handling. Sends through Resend. MIT licence (the page shows the badge, not the licence text). | The closest match and a good base or reference. Gaps: no web UI, no open or click tracking, depends on Resend, 1 star and no forks, so little outside use. Last commit date and code quality **not checked**. |
| [AutoMail](https://awesome.ecosyste.ms/projects/github.com%2Fverygoodplugins%2Fautomail) | Email waitlist on Workers and D1 with Turnstile, an admin dashboard with export, and broadcasts. | Closer to a waitlist than a newsletter tool. Licence and activity **not checked**. |
| 0list, kill-the-news, Waiting Lists | Waitlist tool, newsletter-to-RSS converter, paid waitlist product. | Not what we need. |
| listmonk, Keila, Mailtrain, Plunk, useSend, Billion Mail, Mautic | Established self-hosted platforms ([list](https://openalternative.co/alternatives/listmonk)). | Powerful, but a search found nothing saying any of them runs on Workers. They need a server and a database of their own. Whether any has a Workers-compatible core is **not verified**. |
| [Cloudflare Email Service](https://developers.cloudflare.com/email-service/) | Outbound sending from a Worker binding, REST or SMTP. | See below. |

### Cloudflare Email Sending (from the [overview](https://developers.cloudflare.com/email-service/), [pricing](https://developers.cloudflare.com/email-service/platform/pricing/) and [limits](https://developers.cloudflare.com/email-service/platform/limits/) pages)

- In **beta**. Requires **Workers Paid** (a minimum of $5 a month per account), so the "cost neutral" assumption for the whole migration no longer holds if we send from Cloudflare.
- Included: 3,000 emails a month, then $0.35 per 1,000. Sends to verified destination addresses are free.
- At most 50 recipients per message, 25 MiB per message, no fixed daily limit (new accounts start with "a conservative daily quota" that grows with sending behaviour).
- The overview describes **transactional** use only. The limits page sets no restriction on marketing or bulk mail but requires unsubscribe mechanisms and prompt opt-outs.
- Not stated: whether DKIM and SPF are set up automatically, a UK or EU region, bounce and complaint webhooks.

Conclusion on sending: Cloudflare is fine for one-off transactional mail (result emails, download links) once its beta limits are checked. For broadcasts, a dedicated sending service with bounce and complaint webhooks (Resend as in djpardis/newsletter, or Amazon SES, Postmark or Brevo) is the safer choice until Cloudflare's service is out of beta. Which one, and where it processes data, is a decision for the owner and the privacy notice.

## UK rules the system has to enforce

From the [ICO guidance on electronic mail marketing](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-direct-marketing-using-electronic-mail/how-do-we-comply-with-the-pecr-electronic-mail-marketing-rules/). This is not legal advice. Have a qualified adviser check the wording and the process.

- Consent is freely given, specific, informed and unambiguous, through a clear affirmative action. It names the organisation and the type of marketing, and is kept separate from terms and conditions.
- No pre-ticked boxes. Consent is unlikely to be valid if marketing is a necessary condition of getting something. So the report download or the result email cannot be made conditional on joining the newsletter.
- Keep a record of who consented, when and how. The ICO recommends double opt-in as best practice.
- Opt-out must be simple and free, in every message, with no account needed. Keep a suppression list and check it before every send.
- Do not hide the sender's identity and give a valid contact address.
- Soft opt-in needs all five conditions (details collected directly while selling, similar products only, opt-out offered at collection and in every message). A free report download is not a sale, so plan on **consent**, not soft opt-in.
- Bought-in lists are out.

## Gating the full report and the slide deck

What the gate has to do: a reader gives an email address, receives the file, and is offered (never forced) the newsletter and the report-update notices.

Things that decide whether the gate is real:

1. **The files are public today.** The report PDF (1.4 MB) and the ten-slide deck (0.3 MB) are static files at `/assets/UK-Small-Business-Cyber-Outlook-2027.pdf` and `/linkedin/CyberOutlook2027_LinkedIn_Carousel.pdf`. They are also in the **public** GitHub repo, and the report PDF has 5 commits of history. Anyone who knows the address, or reads the repo, gets them. A form in front of a public file is only a polite gate.
2. A real gate means the files live somewhere private (an R2 bucket) and a Worker serves them only against a short-lived signed link sent to the address the reader gave. It also means removing them from the repo and from the sitemap, and dealing with the history (rewrite it or accept that the old copies remain reachable).
3. **What is gated?** I have assumed the two PDFs. The web report itself, the front page, stays free to read. If you meant the web report too, say so, because that changes the design a great deal.
4. Existing links to the PDFs (the README, `sitemap.xml`, the Share hub, the Tools menu, "Download the full PDF" on the cover, and anything already posted on LinkedIn) will stop working or need to point at the gate.
5. The gate sends one email with the link. That email is a service message and carries no marketing. The newsletter and the update notices are separate, unticked boxes next to the form, each with its own consent record.

## Proposed design

All on Cloudflare, one Worker with these parts (Hono for routing is my suggestion, not a requirement):

| Part | What it does |
|---|---|
| D1 | `subscribers` (address, status), `consents` (topic, wording version, time, source page; no more than needed), `suppressions`, `tokens` (confirmation and download links, single use, expiring), `campaigns`, `sends`. |
| Topics | `result` (the check result email, deleted after 30 days), `download` (the signed link, address kept 30 days), `newsletter`, `report-updates` (told when the living report changes). A person can hold any mix. |
| Turnstile | Bot protection on every form (not yet verified for our plan and limits). |
| Double opt-in | Every topic confirms by clicking a link before anything else is sent. This also proves the address belongs to them, which stops typos and abuse. |
| R2 | Private storage for the gated PDFs. A Worker route checks a signed, expiring token and streams the file. |
| Queues and Cron Triggers | Queued sending with retries. A daily job purges expired addresses, tokens and results (the 30 days) and logs what it deleted. |
| Sending | Transactional mail through Cloudflare Email Sending or the chosen provider. Broadcasts through the chosen provider, with bounce and complaint webhooks feeding the suppression list. |
| Headers | Every marketing message carries `List-Unsubscribe` and `List-Unsubscribe-Post` (one-click) and a visible link to a preference page. |
| Admin | A small interface behind Cloudflare Access to write a campaign, preview it, send a test, approve and send, view subscribers and consent records, export, and process erasure requests. djpardis/newsletter has no UI, so this is new work. |
| Privacy notice and preference page | `/privacy/` and `/preferences/`, built from the page shell. |

Living-document updates: when the report changes, an admin action "Publish an update" records a changelog entry (what changed, why, the date), updates a public `/updates/` page and a feed, bumps the version shown in the report, and offers to email the `report-updates` topic. Readers who gave their address for the download can be offered the update notice on the confirmation page and in the download email, as an unticked box.

Mailchimp upsides we can match, in order of value:

1. Forms, double opt-in, a preference centre, export and import (phase 1).
2. Campaigns with templates, scheduling, test sends and approval (phase 2).
3. Segments and tags (for example "finished the check", "read the report") (phase 2).
4. A welcome message and a short follow-up sequence after the check (phase 3).
5. Reporting: delivery, bounces, unsubscribes and complaints from the provider's webhooks. Open and click tracking off by default, because it needs its own consent and is unreliable (phase 3, owner's call).

Downsides we avoid: per-contact pricing, tracking pixels and profiling by default, US-only processing by default, and lock-in (the data is a D1 export away).

## Build or adopt

Recommendation: **build our own on Workers and treat djpardis/newsletter as a reference or a starting fork** (MIT, so a fork is allowed with its notice kept). Reasons: nothing found is a complete, UK-shaped, Workers-native platform; the parts we must get right (consent records, topics, the 30-day purge, the signed download links, the update notices) are specific to us; and the base is small enough to read in a day. Before forking, read its code, tests, activity and licence file.

## Phases

0. Decide the open points below, and have the notice and consent wording checked.
1. **Core and the gate.** Topics, double opt-in, suppression, purge, `/privacy/`, `/preferences/`, the `/check/` result email, and the gated downloads (R2 and signed links), with the PDFs removed from public hosting.
2. **Broadcast and admin.** Campaign editor, approval, sending through the provider, update notices and `/updates/`.
3. **Automations and reporting.**

## Open points for the owner

- Confirm the gate covers the two PDFs only, and decide how to handle the public repo copies and history.
- Name the sending provider (Resend, Amazon SES, Postmark, Brevo, or Cloudflare Email Sending once it is out of beta) and accept where it processes data. Name the newsletter service if it will be separate from our own.
- Workers Paid at a minimum of $5 a month is needed for Cloudflare Email Sending, and probably for the queue and cron work. Is that acceptable?
- Wording for the result email, the download email, the newsletter box, the update-notice box and the privacy notice, checked by an adviser. SBCSG Enterprises Ltd's registered name and address for the notice.
- Whether open and click tracking is wanted at all.

## Not verified

Cloudflare Email Sending: automatic DKIM and SPF, region, webhooks, and behaviour at newsletter volumes. Turnstile limits. AutoMail's licence and activity. djpardis/newsletter's code quality and last commit. Whether any of the established open-source platforms has a Workers-compatible core. The exact PECR and UK GDPR wording for a free download plus optional updates (an adviser should confirm).
