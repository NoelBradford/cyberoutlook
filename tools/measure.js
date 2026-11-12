// UX measurements. Usage:
//   node tools/measure.js <baseUrl> [--path /check/] [--out file.json]
// Loads one page as a fresh visitor at a desktop and a phone width and prints JSON:
//   - document height
//   - visible controls in the first viewport (links, buttons, inputs, summaries)
//   - buttons inside <main>
//   - same-origin transfer by type, raw and gzipped (a plain local server does not compress,
//     so gzip is computed here at level 9 to approximate what a real host sends)
//   - fixed or sticky chrome that covers the viewport while reading mid-page
// Fresh visitor means: empty storage, service workers blocked, Google Fonts blocked, so the numbers
// do not depend on the network or on what the reader has saved. Same method every time, so runs compare.
const { chromium } = require('playwright');
const zlib = require('zlib');
const fs = require('fs');

const VIEWPORTS = [
  { name: 'desktop', width: 1366, height: 900, mobile: false },
  { name: 'phone', width: 390, height: 844, mobile: true },
];

function parseArgs(argv) {
  const out = { base: null, path: '/', outFile: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--path') out.path = argv[++i];
    else if (a === '--out') out.outFile = argv[++i];
    else if (!out.base) out.base = a;
  }
  return out;
}

// Runs in the page. Returns plain numbers and short labels only.
function inPage() {
  const vw = window.innerWidth, vh = window.innerHeight;
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) !== 0
      && r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw;
  };
  const label = (el) => (el.innerText || el.getAttribute('aria-label') || el.getAttribute('title') || el.getAttribute('placeholder') || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 40);
  const controls = [...document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [tabindex="0"]')].filter(visible);
  // Fixed or sticky elements that are on screen, wide enough to be chrome rather than a small badge.
  const chrome = [...document.querySelectorAll('body *')].filter((el) => {
    const pos = getComputedStyle(el).position;
    if (pos !== 'fixed' && pos !== 'sticky') return false;
    if (!visible(el)) return false;
    const r = el.getBoundingClientRect();
    return r.width >= vw * 0.5 && r.height >= 8;
  });
  // Union of the vertical bands those elements cover, clipped to the viewport.
  const bands = chrome.map((el) => { const r = el.getBoundingClientRect(); return [Math.max(0, r.top), Math.min(vh, r.bottom)]; })
    .filter((b) => b[1] > b[0]).sort((a, b) => a[0] - b[0]);
  let covered = 0, end = -1;
  for (const [s, e] of bands) { if (s > end) { covered += e - s; end = e; } else if (e > end) { covered += e - end; end = e; } }
  return {
    docHeight: Math.round(document.documentElement.scrollHeight),
    controlsInFirstViewport: controls.length,
    controlLabels: controls.map(label),
    buttonsInMain: document.querySelectorAll('main button').length,
    chrome: {
      elements: chrome.map((el) => ({ el: (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '') || el.tagName.toLowerCase(), top: Math.round(el.getBoundingClientRect().top), height: Math.round(el.getBoundingClientRect().height) })),
      coveredPx: Math.round(covered),
      viewportHeight: vh,
      coveredPercent: Math.round((covered / vh) * 1000) / 10,
    },
  };
}

async function measureViewport(browser, base, pagePath, vp) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1, isMobile: vp.mobile, hasTouch: vp.mobile, serviceWorkers: 'block',
  });
  const page = await ctx.newPage();
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  const origin = new URL(base).origin;
  const pending = [];
  page.on('response', (res) => {
    if (!res.url().startsWith(origin)) return;
    pending.push(res.body().then((body) => ({ url: res.url(), type: res.request().resourceType(), status: res.status(), raw: body.length, gz: zlib.gzipSync(body, { level: 9 }).length })).catch(() => null));
  });
  await page.goto(new URL(pagePath, base).href, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500); // features start in slices when the browser is idle
  const first = await page.evaluate(inPage);

  // Mid-report: scroll to the middle of the document and measure fixed chrome there.
  await page.evaluate(() => window.scrollTo(0, Math.round(document.documentElement.scrollHeight * 0.4)));
  await page.waitForTimeout(900);
  const mid = await page.evaluate(inPage);

  const resources = (await Promise.all(pending)).filter(Boolean);
  const sum = (type) => resources.filter((r) => (type === 'other' ? !['document', 'script', 'stylesheet'].includes(r.type) : r.type === type))
    .reduce((a, r) => ({ raw: a.raw + r.raw, gz: a.gz + r.gz, files: a.files + 1 }), { raw: 0, gz: 0, files: 0 });
  const html = sum('document'), js = sum('script'), css = sum('stylesheet'), other = sum('other');
  await ctx.close();
  return {
    viewport: `${vp.width}x${vp.height}`,
    docHeightPx: first.docHeight,
    controlsInFirstViewport: first.controlsInFirstViewport,
    controlLabelsInFirstViewport: first.controlLabels,
    buttonsInMain: first.buttonsInMain,
    fixedChromeAtTop: first.chrome,
    fixedChromeMidReading: mid.chrome,
    transfer: {
      html, js, css, other,
      totalRaw: html.raw + js.raw + css.raw + other.raw,
      totalGzip: html.gz + js.gz + css.gz + other.gz,
    },
  };
}

(async () => {
  const { base, path, outFile } = parseArgs(process.argv.slice(2));
  if (!base) { console.error('Usage: node tools/measure.js <baseUrl> [--path /check/] [--out file.json]'); process.exit(2); }
  const browser = await chromium.launch();
  const result = { url: new URL(path, base).href, method: 'fresh visitor, service workers blocked, Google Fonts blocked, gzip computed at level 9, mid-reading = scrolled to 40% of the page', viewports: {} };
  for (const vp of VIEWPORTS) result.viewports[vp.name] = await measureViewport(browser, base, path, vp);
  await browser.close();
  const json = JSON.stringify(result, null, 2);
  if (outFile) fs.writeFileSync(outFile, json + '\n');
  console.log(json);
})().catch((e) => { console.error(e); process.exit(1); });
