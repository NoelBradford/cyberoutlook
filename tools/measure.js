// Page weight and clutter metrics. Usage: node tools/measure.js <url> [--out file.json] [--label text]
// Prints JSON. Fresh visitor (new browser context, empty storage), service workers blocked,
// Google Fonts blocked so the numbers do not depend on the network. Desktop 1366x900 and phone 390x844.
//
// Definitions, so later runs measure the same thing:
//   documentHeightPx       document.documentElement.scrollHeight after load and a short settle, before any scrolling.
//   firstViewportControls  visible links, buttons, form fields, summaries and elements with role=button or a
//                          non-negative tabindex whose box (non-zero size, display and visibility on, opacity above 0)
//                          overlaps the first viewport, plus the skip links (off-screen until focused, reported
//                          separately as skipLinks).
//   buttonsInMain          button, [role=button] and input[type=button|submit] elements inside <main>.
//   fixedMidReport         elements with computed position:fixed that are visible and overlap the viewport after
//                          scrolling to the middle of the document. coveredPx is the height of the union of their
//                          vertical extents, clipped to the viewport (overlaps counted once).
//   transfer               same-origin document, scripts and stylesheets: raw bytes and gzip (zlib level 6) bytes of
//                          the decoded response body.
const { chromium } = require('playwright');
const zlib = require('zlib');
const fs = require('fs');

const args = process.argv.slice(2);
const flag = n => { const i = args.indexOf(n); if (i < 0) return undefined; const v = args[i + 1]; args.splice(i, 2); return v; };
const outFile = flag('--out');
const label = flag('--label');
const url = args[0];
if (!url || !/^https?:\/\//.test(url)) { console.error('Usage: node tools/measure.js <url> [--out file.json] [--label text]'); process.exit(2); }

const VIEWPORTS = [
  { name: 'desktop', width: 1366, height: 900, mobile: false },
  { name: 'phone', width: 390, height: 844, mobile: true },
];

// Runs in the page.
function inPage() {
  const vw = window.innerWidth, vh = window.innerHeight;
  const shown = el => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return null;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return null;
    return r;
  };
  const inView = r => r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw;
  const CONTROLS = 'a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [tabindex]:not([tabindex^="-"])';
  // Skip links sit off-screen until focused, so they never overlap the viewport. The original review counted them
  // as controls, so they are added back here and also reported on their own.
  const skipLinks = [...document.querySelectorAll('a[href^="#"]')].filter(a => /^skip\b/i.test(a.textContent.trim())).length;
  const onScreen = [...document.querySelectorAll(CONTROLS)].filter(e => { const r = shown(e); return r && inView(r); }).length;
  return {
    documentHeightPx: document.documentElement.scrollHeight,
    firstViewportControls: onScreen + skipLinks,
    skipLinks,
    buttonsInMain: document.querySelectorAll('main button, main [role=button], main input[type=button], main input[type=submit]').length,
  };
}

function fixedInPage() {
  const vh = window.innerHeight, vw = window.innerWidth;
  const found = [];
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (cs.position !== 'fixed' || cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1 || r.bottom <= 0 || r.top >= vh || r.right <= 0 || r.left >= vw) continue;
    const name = el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.classList.length ? '.' + [...el.classList].slice(0, 2).join('.') : '');
    found.push({ element: name, top: Math.round(r.top), bottom: Math.round(r.bottom), heightPx: Math.round(r.height), widthPx: Math.round(r.width) });
  }
  const spans = found.map(f => [Math.max(0, f.top), Math.min(vh, f.bottom)]).sort((a, b) => a[0] - b[0]);
  let covered = 0, curS = null, curE = null;
  for (const [s, e] of spans) {
    if (curS === null) { curS = s; curE = e; } else if (s <= curE) curE = Math.max(curE, e); else { covered += curE - curS; curS = s; curE = e; }
  }
  if (curS !== null) covered += curE - curS;
  return { count: found.length, coveredPx: Math.round(covered), viewportHeightPx: vh, elements: found };
}

(async () => {
  const browser = await chromium.launch();
  const origin = new URL(url).origin;
  const result = { tool: 'tools/measure.js', url, label: label || null, measuredAt: new Date().toISOString(), playwright: require('playwright/package.json').version, viewports: {} };
  for (const v of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: v.width, height: v.height }, serviceWorkers: 'block', reducedMotion: 'reduce', hasTouch: v.mobile, isMobile: v.mobile });
    await ctx.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, r => r.abort());
    const page = await ctx.newPage();
    const transfer = [];
    const pending = [];
    page.on('response', r => {
      if (!r.url().startsWith(origin)) return;
      const type = r.request().resourceType();
      if (!['document', 'script', 'stylesheet'].includes(type)) return;
      pending.push(r.body().then(b => transfer.push({ path: new URL(r.url()).pathname, type, status: r.status(), bytes: b.length, gzipBytes: zlib.gzipSync(b).length })).catch(() => {}));
    });
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await Promise.all(pending);
    const m = await page.evaluate(inPage);
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    await page.evaluate(h => window.scrollTo(0, Math.max(0, Math.round(h / 2 - window.innerHeight / 2))), total);
    await page.waitForTimeout(400);
    const fixed = await page.evaluate(fixedInPage);
    const seen = new Set();
    m.transfer = transfer.filter(t => !seen.has(t.path) && seen.add(t.path)).sort((a, b) => a.path.localeCompare(b.path));
    m.fixedMidReport = fixed;
    result.viewports[v.name] = Object.assign({ width: v.width, height: v.height }, m);
    await ctx.close();
  }
  await browser.close();
  const text = JSON.stringify(result, null, 2) + '\n';
  if (outFile) fs.writeFileSync(outFile, text, 'utf8');
  process.stdout.write(text);
})().catch(e => { console.error(e); process.exit(1); });
