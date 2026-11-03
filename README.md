# CyberOutlook

**UK Small Business Cyber Outlook 2027**, by Noel Bradford (The Small Business Cyber Security Guy).

- **Read online:** https://cyberoutlook.sbcsg.uk
- **Ten-slide summary:** [`linkedin/CyberOutlook2027_LinkedIn_Carousel.pdf`](linkedin/CyberOutlook2027_LinkedIn_Carousel.pdf)

## What's in the repo

| Path | What it is |
|---|---|
| `index.html` | The whole report: one self-contained page (styles, script and images inline). |
| `assets/` | Social preview image and icons. |
| `404.html` | "Page not found" page. |
| `CNAME` | Custom domain for GitHub Pages. Don't delete. |
| `robots.txt`, `sitemap.xml`, `site.webmanifest`, `humans.txt` | Search engine and browser metadata. |
| `linkedin/` | LinkedIn carousel PDF and its source (`carousel.html`). |

## Features of the web edition

- Light and dark mode (remembered per browser), print or save as PDF with page numbers and footers.
- Contents that highlights where you are, ticks off finished sections, and folds away on phones.
- Heading links that copy a link to a section, next-section links, back to top, reading progress.
- Every citation shows its source on hover and every source links back to where it's cited.
- The one-page plan: type contacts into the "Who to call" table (kept in your browser only), then
  print just that page.
- Link previews on LinkedIn and elsewhere, structured data for search engines, and a Content Security Policy.

## Updating the report

1. Edit `index.html`. Add a line to the version history comment at the top.
2. Open it in a browser to check, including the print preview.
3. Commit to `main`. GitHub Pages publishes within a minute or two.

If you change the title or description, also update the matching `og:` and `twitter:` meta tags and
the structured data block in the page head.
