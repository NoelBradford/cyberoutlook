// Old hash links and section anchors. Usage: node tools/links-check.js <baseUrl>
//   - every key that has a page (the "hashKey" of an entry in src/pages/pages.json) lands on that page in one hop, with the tool on screen
//     and without the report being loaded first;
//   - every other tool key keeps its hash in the address bar and opens its tool (so the link stays shareable);
//   - section anchors such as /#mvc and /#rules and the plan share link (/#plan=...) are not treated as tool keys.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const pages = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'pages', 'pages.json'), 'utf8'));
const WITH_PAGE = pages.filter(p => p.hashKey).map(p => [p.hashKey, p.slug]);
// Tool keys with no page. Each opens a dialog (the incident card is a full-screen overlay instead).
const HAS_PAGE = new Set(WITH_PAGE.map(x => x[0]));
const NO_PAGE = ['plan', 'fivefive', 'aitools', 'mfa', 'restore', 'toolkit', 'share', 'glossary', 'notes', 'search', 'mydata', 'progress'].filter(k => !HAS_PAGE.has(k));
const SECTIONS = ['mvc', 'rules', 'summary', 'theme-1', 'theme-3'];

(async () => {
  const base = process.argv[2];
  if (!base) { console.error('Usage: node tools/links-check.js <baseUrl>'); process.exit(2); }
  const origin = new URL(base).origin;
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
  const problems = [];
  async function visit(hash, wait) {
    const p = await ctx.newPage(); const reqs = []; let navs = 0;
    p.on('pageerror', e => problems.push(`${hash}: ${e.message}`));
    p.on('request', r => reqs.push(new URL(r.url()).pathname)); p.on('framenavigated', f => { if (f === p.mainFrame()) navs++; });
    await p.goto(new URL('/' + hash, origin).href, { waitUntil: 'load' }); await p.waitForTimeout(wait);
    return { p, reqs, navs };
  }
  for (const [key, slug] of WITH_PAGE) {
    const { p, reqs, navs } = await visit('#' + key, 1500);
    const url = new URL(p.url());
    if (url.pathname !== `/${slug}/`) problems.push(`/#${key} landed on ${url.pathname + url.hash}, expected /${slug}/`);
    if (navs > 2) problems.push(`/#${key} took ${navs} navigations (a redirect loop, or more than one hop)`);
    if (reqs.includes('/assets/app.js')) problems.push(`/#${key}: the report bundle was requested before the redirect`);
    const visible = await p.evaluate(() => [...document.querySelectorAll('main button, main input, main a[href]')].some(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; }));
    if (!visible) problems.push(`/#${key}: the tool is not on screen at /${slug}/`);
    await p.close();
  }
  for (const key of NO_PAGE) {
    const { p } = await visit('#' + key, 2200);
    const url = new URL(p.url());
    if (url.pathname !== '/' || url.hash !== '#' + key) problems.push(`/#${key} did not keep its hash (now ${url.pathname + url.hash})`);
    const open = await p.evaluate(() => !!document.querySelector('dialog[open]'));
    if (!open) problems.push(`/#${key} did not open its tool`);
    await p.close();
  }
  { const { p } = await visit('#incident', 2200); const ok = await p.evaluate(() => !!document.querySelector('.inc')); if (!ok || new URL(p.url()).hash !== '#incident') problems.push('/#incident did not keep its hash or open the incident card'); await p.close(); }
  for (const a of SECTIONS) {
    const { p } = await visit('#' + a, 1200);
    const url = new URL(p.url());
    if (url.pathname !== '/' || url.hash !== '#' + a) problems.push(`/#${a} no longer stays on the report`);
    if (!(await p.evaluate(id => !!document.getElementById(id), a))) problems.push(`/#${a} has no target on the report`);
    await p.close();
  }
  { const { p } = await visit('#plan=abc', 1200); if (new URL(p.url()).pathname !== '/') problems.push('/#plan=<data> was treated as a tool key'); await p.close(); }
  await b.close();
  if (problems.length) { console.log('FAIL\n' + [...new Set(problems)].join('\n')); process.exit(1); }
  console.log('OK');
})();
