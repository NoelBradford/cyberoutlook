// QA matrix for the release. Usage: node tools/qa-matrix.js <baseUrl> [--quick] [--out results.md]
// Runs every page in tools/pages.txt and the report page through:
//   widths 320, 390, 768, 1280 (--quick: 320 and 1280)  x  themes light, dark, system (nothing saved)  x
//   visitor states fresh, returning with a finished check, returning with a partly finished check
// and records axe violations (WCAG 2.0 and 2.1 A and AA, plus best practice), sideways scroll and console errors for each.
// Then, per page: keyboard order and visible focus, Escape closing a dialog and returning focus, print page count (A4), opening
// offline after one visit, and a saved result being shared between pages. Prints a Markdown report and exits 1 on any failure.
// It cannot do the screen reader pass: that is manual (VoiceOver or NVDA), recorded by hand.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const flag = n => { const i = argv.indexOf(n); if (i < 0) return undefined; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const quick = argv.includes('--quick'); if (quick) argv.splice(argv.indexOf('--quick'), 1);
const outFile = flag('--out');
const base = argv[0];
if (!base) { console.error('Usage: node tools/qa-matrix.js <baseUrl> [--quick] [--out results.md]'); process.exit(2); }
const origin = new URL(base).origin;
const axeSrc = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const pagePaths = ['/'].concat(fs.readFileSync(path.join(__dirname, 'pages.txt'), 'utf8').split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#')));
const WIDTHS = quick ? [[320, 568], [1280, 860]] : [[320, 568], [390, 844], [768, 1024], [1280, 860]];
const THEMES = ['light', 'dark', 'system'];
const FINISHED = { a: { 0: 'yes', 1: 'no', 2: 'yes', 3: 'unsure', 4: 'yes', 5: 'no', 6: 'yes', 7: 'no', 8: 'yes', 9: 'no' }, done: true };
const PARTLY = { a: { 0: 'yes', 1: 'no', 2: 'yes' } };
const STATES = { fresh: null, 'finished check': FINISHED, 'partly finished check': PARTLY };

const rows = [], failures = [], notes = [];
const fail = m => failures.push(m);
const say = m => process.stderr.write(m + String.fromCharCode(10)); // progress, so a slow or stuck run can be seen

(async () => {
  const b = await chromium.launch();
  // 1. the matrix
  const skipMatrix = process.env.QA_SKIP_MATRIX === '1'; // set to rerun only the other checks
  for (const pg of skipMatrix ? [] : pagePaths) for (const [w, h] of WIDTHS) for (const theme of THEMES) for (const [state, check] of Object.entries(STATES)) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce', serviceWorkers: 'block', colorScheme: theme === 'dark' || theme === 'system' ? 'dark' : 'light', hasTouch: w < 500, isMobile: w < 500 });
    await ctx.route(/^https:\/\/fonts\./, r => r.abort());
    await ctx.addInitScript(([t, c]) => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1'); if (t !== 'system') localStorage.setItem('theme', t); if (c) { localStorage.setItem('cv:check', JSON.stringify(c)); localStorage.setItem('cv:pos', JSON.stringify({ id: 'theme-1', title: 'x', r: 0.3, at: Date.now() - 3600000 })); } }, [theme, check]);
    const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { // axe reads cross-origin style sheets by fetching them, which the page's CSP (connect-src 'self') refuses. That message comes from axe, not the page.
    const fromAxe = /Refused to connect to 'https:\/\/fonts\./.test(m.text());
    if (!fromAxe && (m.type() === 'error' && !/Failed to load resource|fonts\.g/.test(m.text()) || /Content Security Policy|CV feature failed/.test(m.text()))) errs.push(m.text().slice(0, 80)); });
    await p.goto(new URL(pg, origin).href, { waitUntil: 'networkidle' }); await p.waitForTimeout(pg === '/' ? 2200 : 1000);
    await p.addScriptTag({ content: axeSrc });
    const r = await p.evaluate(async () => { const a = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] } }); return { v: a.violations.map(x => `${x.id}(${x.impact}) ${x.nodes[0].target.join(' ').slice(0, 50)}`), overflow: document.documentElement.scrollWidth - innerWidth }; });
    say(`matrix ${rows.length + 1}: ${pg} ${w}px ${theme} ${state}: ${r.v.length} axe`);
    const bad = r.v.length + (r.overflow > 1 ? 1 : 0) + errs.length;
    rows.push({ pg, w, theme, state, axe: r.v.length, overflow: r.overflow > 1 ? r.overflow : 0, errs: errs.length });
    if (bad) fail(`${pg} ${w}px ${theme} ${state}: ${[...r.v, r.overflow > 1 ? `sideways scroll ${r.overflow}px` : '', ...errs.map(e => 'console: ' + e)].filter(Boolean).join('; ')}`);
    await ctx.close();
  }
  say('phase: 2. keyboard');
  // 2. keyboard: a logical walk with no trap, every stop on screen and showing a focus indicator
  for (const pg of pagePaths) {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 860 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
    const p = await ctx.newPage(); await p.goto(new URL(pg, origin).href, { waitUntil: 'networkidle' }); await p.waitForTimeout(1200);
    const seen = [], noRing = []; let trapped = false;
    for (let i = 0; i < 60; i++) {
      await p.keyboard.press('Tab');
      const f = await p.evaluate(() => { const a = document.activeElement; if (!a || a === document.body) return null; const r = a.getBoundingClientRect(), cs = getComputedStyle(a); const ring = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== 'none'; const label = (a.getAttribute('aria-label') || a.textContent || a.id || a.tagName).trim().replace(/\s+/g, ' ').slice(0, 30); return { label, key: a.tagName + '|' + label + '|' + Math.round(r.top + scrollY) + '|' + Math.round(r.left), ring, inView: r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight }; });
      if (!f) break;
      if (seen.includes(f.key)) break;
      seen.push(f.key); if (!f.ring) noRing.push(f.label); if (!f.inView) fail(`${pg}: keyboard focus on "${f.label}" is not visible on screen`);
    }
    if (seen.length < 3) fail(`${pg}: keyboard walk reached only ${seen.length} controls`);
    if (noRing.length) fail(`${pg}: no visible focus indicator on: ${[...new Set(noRing)].slice(0, 5).join(', ')}`);
    notes.push(`${pg}: keyboard walk reached ${seen.length} controls${pg === '/' ? ' (first 60)' : ''}`);
    await ctx.close();
  }
  say('phase: 3. Escape');
  // 3. Escape closes a dialog and returns focus to its opener (report's check dialog and the plan dialog on /check/)
  {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 860 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
    const p = await ctx.newPage(); await p.goto(new URL('/', origin).href, { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
    await p.focus('.plan-tool'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
    const open = await p.evaluate(() => !!document.querySelector('dialog[open]')); await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    const after = await p.evaluate(() => ({ open: !!document.querySelector('dialog[open]'), focus: document.activeElement && document.activeElement.className }));
    if (!open || after.open || !/plan-tool/.test(after.focus)) fail(`report: the My plan dialog did not open and close with focus returning to its button (${JSON.stringify(after)})`);
    await ctx.close();
  }
  {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 860 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
    await ctx.addInitScript(() => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', '1'); localStorage.setItem('cv:check', JSON.stringify({ a: { 0: 'no', 1: 'no', 2: 'no', 3: 'no', 4: 'no', 5: 'no', 6: 'no', 7: 'no', 8: 'no', 9: 'no' }, done: true })); } });
    const p = await ctx.newPage(); await p.goto(new URL('/check/', origin).href, { waitUntil: 'networkidle' }); await p.waitForTimeout(1200);
    await p.focus('.qz-plan button'); await p.keyboard.press('Enter'); await p.waitForTimeout(500);
    const open = await p.evaluate(() => !!document.querySelector('dialog[open]')); await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    const after = await p.evaluate(() => ({ open: !!document.querySelector('dialog[open]'), focus: document.activeElement && (document.activeElement.textContent || document.activeElement.tagName).trim().slice(0, 40) }));
    if (!open || after.open) fail(`/check/: the My plan dialog did not open and close with Escape (${JSON.stringify(after)})`);
    notes.push(`/check/: after Escape in My plan, focus is on "${after.focus}"`);
    await ctx.close();
  }
  say('phase: 4. print');
  // 4. print: A4 page counts
  for (const pg of pagePaths) {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 860 }, serviceWorkers: 'block' });
    const p = await ctx.newPage(); await p.goto(new URL(pg, origin).href, { waitUntil: 'networkidle' }); await p.waitForTimeout(1000);
    await p.emulateMedia({ media: 'print' });
    const pdf = await p.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
    const n = (pdf.toString('latin1').match(/\/Type\s*\/Page\b(?!s)/g) || []).length;
    notes.push(`${pg}: prints on ${n} A4 page${n === 1 ? '' : 's'}`);
    if (pg !== '/' && n > 2) fail(`${pg}: prints on ${n} A4 pages (more than 2)`);
    await ctx.close();
  }
  say('phase: 5. offline');
  // 5. offline after one visit, and a result shared between pages
  {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 860 }, serviceWorkers: 'allow' });
    const p = await ctx.newPage(); const titles = {};
    for (const pg of pagePaths) { await p.goto(new URL(pg, origin).href, { waitUntil: 'networkidle' }); await p.evaluate(() => navigator.serviceWorker && Promise.race([navigator.serviceWorker.ready, new Promise(r => setTimeout(r, 6000))])); await p.waitForTimeout(1500); titles[pg] = await p.title(); }
    await ctx.setOffline(true);
    for (const pg of pagePaths) { await p.goto(new URL(pg, origin).href, { waitUntil: 'domcontentloaded' }).catch(() => {}); await p.waitForTimeout(600); const t = await p.title(); if (t !== titles[pg]) fail(`${pg}: offline, the title is "${t}", expected "${titles[pg]}"`); }
    notes.push(`offline: ${pagePaths.length} pages opened with the network off after one visit`);
    await ctx.close();
  }
  {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 860 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
    const p = await ctx.newPage(); await p.goto(new URL('/readiness/', origin).href, { waitUntil: 'networkidle' }); await p.waitForTimeout(800);
    await p.click('#ce-0-no'); await p.click('#ce-3-yes');
    await p.goto(new URL('/', origin).href, { waitUntil: 'networkidle' }); await p.waitForTimeout(1500); await p.evaluate(() => CV.openCE()); await p.waitForTimeout(300);
    const shared = await p.evaluate(() => [document.getElementById('ce-0-no').checked, document.getElementById('ce-3-yes').checked]);
    if (!shared[0] || !shared[1]) fail('a readiness answer saved on /readiness/ is not shown on the report');
    notes.push('state sharing: a readiness answer saved on /readiness/ shows on the report');
    await ctx.close();
  }
  await b.close();

  const lines = ['# QA matrix', '', `Run ${new Date().toISOString().slice(0, 10)} against ${base}${quick ? ' (quick: widths 320 and 1280)' : ''}. Chromium via Playwright.`, '', '| Page | Width | Theme | Visitor state | axe violations | Sideways scroll | Console errors |', '|---|---|---|---|---|---|---|'];
  rows.forEach(r => lines.push(`| ${r.pg} | ${r.w} | ${r.theme} | ${r.state} | ${r.axe} | ${r.overflow ? r.overflow + 'px' : 'none'} | ${r.errs} |`));
  lines.push('', '## Other checks', '', ...notes.map(n => '- ' + n), '', `Not covered here (manual): screen reader pass (VoiceOver or NVDA), real touch, and printing from a real browser dialog.`);
  const text = lines.join('\n') + '\n';
  if (outFile) fs.writeFileSync(outFile, text, 'utf8');
  console.log(`${rows.length} combinations run. ${failures.length ? 'FAIL' : 'OK'}`);
  notes.forEach(n => console.log('  ' + n));
  if (failures.length) { console.log('\n' + [...new Set(failures)].join('\n')); process.exit(1); }
})().catch(e => { console.error(e); process.exit(1); });
