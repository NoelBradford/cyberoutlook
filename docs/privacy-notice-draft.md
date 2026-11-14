# Privacy notice: DRAFT for the owner's adviser

**Status: draft. Not checked by an adviser, not published, and not built into any page.** It states what the code in this repository does (so the notice cannot promise more or less than the system does). Everything in [square brackets] is a decision or a fact that only the owner or the adviser can supply. This is not legal advice.

When approved, it becomes the page at `/privacy/` (the address `src/pages/config.json` points `privacyUrl` at). Change the notice's version and date whenever the system changes.

---

## Privacy notice: UK Small Business Cyber Outlook 2027

Version [1], [date]. Who we are: **[SBCSG Enterprises Ltd, registered name, company number and registered address to be confirmed]**, trading as The Small Business Cyber Security Guy ("we"). We are the data controller for what is described here. Contact: [email address for privacy requests].

### What stays in your browser

The report and its tools save your answers, your plan and your settings in your own browser (local storage on your device). That information is not sent to us. We do not use accounts, advertising or tracking cookies, and the pages do not run analytics. You can see and delete what is saved from **Tools, Your data**.

Our host, Cloudflare, serves the pages and, like any host, records technical details of each request (such as the address of the page and your IP address) in its own logs. [Adviser: describe Cloudflare's role as processor/independent controller and what its free analytics record, once the site is hosted there.]

### If you choose to give us your email address

Nothing here is needed to read the report or use the tools. We only ask for your email address in these three places, and only when you press the button:

| You ask for | What we use your email address for | What we receive | How long we keep the address |
|---|---|---|---|
| **Your check result by email** (on `/check/`) | To send you one email with your score, your band and the numbers of the questions with a gap. We do not receive your answers. | Your address, the page, your score, band and the question numbers. | **30 days** after you confirm, then it is deleted. |
| **A link to the full report or the slide deck** | To send you a link to download the file you asked for. The link works once and for a few minutes. | Your address, the page and which file. | **30 days** after you confirm, then it is deleted. |
| **The newsletter** (a separate, unticked box) | To send you our newsletter. | Your address and the exact wording you agreed to. | **Until you unsubscribe**, then the address is deleted. [Adviser: confirm.] |
| **An email when the report is updated** (a separate, unticked box) | To tell you when the report changes. | The same. | **Until you unsubscribe**, then the address is deleted. [Adviser: confirm.] |

Joining the newsletter or the update list is never a condition of getting the result or a download.

**Confirming your address.** After you submit the form we send one email with a link. Nothing else is sent until you open it, and the link expires after 48 hours. If it was not you, ignore it.

### Our lawful basis

- Newsletter and update emails: **your consent** (UK GDPR Article 6(1)(a)) and the consent rule for electronic marketing in PECR. We keep a record of what you agreed to (the wording, the page and the time). You can withdraw consent at any time.
- The result email and the download link: **[Adviser to decide: legitimate interests, or another basis]**, because you asked us to send you something. These emails are not marketing.

### Who receives your information

- Cloudflare, which hosts the site and runs the system that stores your address and sends the link ([Workers, D1 and R2 as built]).
- **[Sending provider, to be chosen]**, which delivers our emails.
- **[Newsletter service, if separate]**.
Each acts on our instructions. We do not sell your information. **[Adviser: transfers outside the UK, and the safeguards for each provider.]**

### Your choices and rights

Every marketing email has a one-click unsubscribe link and a link to a page where you can see what you are on, stop any of it, or **delete everything we hold about your address**. You can also write to [privacy contact]. You have the right to ask for a copy of your information, to have it corrected or deleted, to object to or restrict how we use it, and to withdraw consent. If you unsubscribe or ask us to delete your data, we keep only a one-way fingerprint (a hash) of your address on a "do not contact" list, so we do not email you again, and a count of sign-ups that cannot identify anyone. If you are unhappy with how we have handled your information you can complain to the Information Commissioner's Office (ico.org.uk, 0303 123 1113).

### Changes

We will change the version and date above when this changes, and say what changed.

---

## Notes for the adviser (not part of the notice)

- The retention periods, topics and counts are implemented in `worker/` (see `worker/README.md`). The 30 days and "until unsubscribe" come from the owner's decisions of 11 November 2026.
- Consent wording for the two boxes lives in `src/pages/config.json` and is stored with each consent by id. Please supply the exact text and its id. The build refuses to switch the capture on without it.
- Soft opt-in does not apply to a free download (the ICO's conditions need a sale or negotiation). The design relies on consent for marketing.
- Open and click tracking is off. If the owner wants it, it needs its own wording and consent.
- Not yet decided: sending provider and newsletter service (and where they process data), the lawful basis for the transactional emails, the contact address, and the registered details.
