// Social preview images, one per page in src/pages/pages.json: assets/og-<slug>.png, 1200 by 630.
// Usage: node tools/og.js [slug ...]   (no slugs: every page)
// Needs Playwright and an internet connection for the site's web fonts (Barlow Condensed, IBM Plex Sans). The look follows
// assets/og-image.png: dark ground, the SBCSG logo on the left, the title in condensed capitals. Commit the PNGs it writes.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const pages = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'pages', 'pages.json'), 'utf8'));
const only = process.argv.slice(2);
const logo = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(ROOT, 'linkedin', 'logo.jpg')).toString('base64');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function html(p) {
  const sub = (p.card && p.card.promise) || p.description;
  return `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700&family=IBM+Plex+Sans:wght@400;600&display=swap">
<style>
  * { box-sizing: border-box; margin: 0; }
  body { width: 1200px; height: 630px; background: #0e161b; color: #e2e9e9; font-family: "IBM Plex Sans", Arial, sans-serif; position: relative; overflow: hidden; }
  .logo { position: absolute; left: 80px; top: 150px; width: 330px; height: 330px; border-radius: 14px; }
  .txt { position: absolute; left: 468px; top: 124px; width: 660px; }
  .kick { font: 600 22px "IBM Plex Sans", Arial, sans-serif; letter-spacing: 0.12em; text-transform: uppercase; color: #e6b043; margin-bottom: 18px; }
  h1 { font: 700 ${p.title.length > 28 ? 84 : 98}px/0.98 "Barlow Condensed", Arial, sans-serif; text-transform: uppercase; color: #e2e9e9; }
  .sub { margin-top: 28px; font-size: 30px; line-height: 1.4; color: #9aa9ae; }
  .url { position: absolute; left: 80px; bottom: 44px; font: 600 24px "IBM Plex Sans", Arial, sans-serif; letter-spacing: 0.08em; text-transform: uppercase; color: #62b8b5; }
</style></head><body>
<img class="logo" src="${logo}" alt="">
<div class="txt"><p class="kick">UK Small Business Cyber Outlook 2027</p><h1>${esc(p.title)}</h1><p class="sub">${esc(sub)}</p></div>
<p class="url">cyberoutlook.sbcsg.uk/${esc(p.slug)}/</p>
</body></html>`;
}

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  for (const p of pages) {
    if (only.length && !only.includes(p.slug)) continue;
    const page = await ctx.newPage();
    await page.setContent(html(p), { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const out = path.join(ROOT, 'assets', `og-${p.slug}.png`);
    await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1200, height: 630 } });
    console.log('wrote', path.relative(ROOT, out));
    await page.close();
  }
  await b.close();
})();
