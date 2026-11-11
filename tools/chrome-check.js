// Checks the report's own chrome (the fixed bars, the cover toolbar and the returning-visitor messages) on phones.
// Usage: node tools/chrome-check.js <baseUrl>
//   - the bottom bar has exactly these items, and the Tools menu has exactly these, so nothing that was moved is lost;
//   - at 390px wide the fixed chrome mid-report covers at most 8% of the screen (the baseline was 94px of 844px);
//   - the cover toolbar is one row at 390px and 360px;
//   - at 320px and in landscape there is no sideways scroll and no two fixed elements overlap;
//   - only one returning-visitor message shows at a time, and a dismissed one stays dismissed after a reload.
const { chromium } = require('playwright');

const BAR = ['Contents', 'Check', 'My plan', 'Search', 'Share'];
const MENU = ['It’s happening now', 'Search', 'All tools', 'Your data', 'Reading settings', 'Glossary', 'Listen from here', 'Simple mode (just the report)', 'Download the full PDF'];
const TOOLBAR = ['My plan', 'Share', 'Tools', 'Dark mode'];

(async () => {
  const base = process.argv[2];
  if (!base) { console.error('Usage: node tools/chrome-check.js <baseUrl>'); process.exit(2); }
  const b = await chromium.launch();
  const problems = [];
  const phone = (w, h) => b.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block', reducedMotion: 'reduce', hasTouch: true, isMobile: true });
  const settle = async p => { await p.goto(base, { waitUntil: 'networkidle' }); await p.waitForTimeout(1200); };
  const same = (a, e) => a.length === e.length && a.every((x, i) => x === e[i]);

  { // items, height, toolbar rows
    const ctx = await phone(390, 844); const p = await ctx.newPage(); await settle(p);
    const toolbar = await p.evaluate(() => [...document.querySelectorAll('.cover .tools > *')].filter(e => getComputedStyle(e).display !== 'none' && !e.classList.contains('tm')).map(e => e.textContent.trim().replace(/\s*\d+$/, '').replace(/^☾\s*/, '').replace(/\s*▾$/, '')));
    if (!same(toolbar, TOOLBAR)) problems.push(`cover toolbar is ${JSON.stringify(toolbar)}, expected ${JSON.stringify(TOOLBAR)}`);
    await p.click('.tm-btn');
    const menu = await p.evaluate(() => [...document.querySelectorAll('.tm [role^="menuitem"]')].map(e => e.textContent.trim()));
    if (!same(menu, MENU)) problems.push(`Tools menu is ${JSON.stringify(menu)}, expected ${JSON.stringify(MENU)}`);
    await p.evaluate(() => scrollTo(0, Math.round(document.documentElement.scrollHeight / 2))); await p.waitForTimeout(700);
    const bar = await p.evaluate(() => [...document.querySelectorAll('.ab .ab-tools > *')].map(e => (e.getAttribute('aria-label') || e.textContent).trim()));
    const barNames = bar.map((x, i) => i === 0 ? x.split('.')[0] : x.replace(/,.*$/, '').replace(/^Your result$/, 'Check'));
    if (!same(barNames, BAR)) problems.push(`bottom bar is ${JSON.stringify(bar)}, expected ${JSON.stringify(BAR)}`);
    const fixed = await p.evaluate(() => { const o = []; document.querySelectorAll('body *').forEach(e => { const cs = getComputedStyle(e); if (cs.position !== 'fixed' || cs.display === 'none') return; const r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1 || r.bottom <= 0 || r.top >= innerHeight || e.classList.contains('toast')) return; o.push([r.top, r.bottom]); }); o.sort((a, b) => a[0] - b[0]); let c = 0, s = null, en = null; for (const [t, bt] of o) { if (s === null) { s = t; en = bt; } else if (t <= en) en = Math.max(en, bt); else { c += en - s; s = t; en = bt; } } if (s !== null) c += en - s; return c; });
    if (fixed > 0.08 * 844) problems.push(`fixed chrome covers ${Math.round(fixed)}px of 844px (more than 8%)`);
    await ctx.close();
  }
  for (const [w, h] of [[390, 844], [360, 740]]) { // toolbar rows
    const ctx = await phone(w, h); const p = await ctx.newPage(); await settle(p);
    const rows = await p.evaluate(() => new Set([...document.querySelectorAll('.cover .tools > *')].filter(e => getComputedStyle(e).display !== 'none').map(e => Math.round(e.getBoundingClientRect().top))).size);
    if (rows !== 1) problems.push(`${w}px: cover toolbar is ${rows} rows`);
    await ctx.close();
  }
  for (const [w, h] of [[320, 568], [844, 390]]) { // no overflow, no overlap
    const ctx = await phone(w, h); const p = await ctx.newPage(); await settle(p);
    await p.evaluate(() => scrollTo(0, Math.round(document.documentElement.scrollHeight / 2))); await p.waitForTimeout(700);
    const r = await p.evaluate(() => { const els = []; document.querySelectorAll('body *').forEach(e => { const cs = getComputedStyle(e); if (cs.position !== 'fixed' || cs.display === 'none') return; const b = e.getBoundingClientRect(); if (b.width < 1 || b.height < 1 || b.bottom <= 0 || b.top >= innerHeight || e.classList.contains('toast')) return; els.push({ n: e.className, t: b.top, b: b.bottom, l: b.left, r: b.right }); }); let overlap = null; for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) { const a = els[i], c = els[j]; if (a.t < c.b - 1 && c.t < a.b - 1 && a.l < c.r - 1 && c.l < a.r - 1 && !(a.n.includes('ab') && c.n.includes('ab'))) overlap = a.n + ' / ' + c.n; } return { overflow: document.documentElement.scrollWidth - innerWidth, overlap }; });
    if (r.overflow > 1) problems.push(`${w}x${h}: sideways scroll of ${r.overflow}px`);
    if (r.overlap) problems.push(`${w}x${h}: fixed elements overlap (${r.overlap})`);
    await ctx.close();
  }
  { // one message at a time, and dismissal is remembered
    const seed = () => {
      if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
      localStorage.setItem('theme', 'light'); // reads as someone who visited before the web edition
      localStorage.setItem('cv:pos', JSON.stringify({ id: 'theme-1', title: 'Other people’s problems become yours', r: 0.4, at: Date.now() - 3600000 }));
      localStorage.setItem('cv:snap', JSON.stringify({ at: Date.now() - 86400000 * 3, five: 0, planDone: 0, weeks: 0, contacts: 0 }));
      localStorage.setItem('cv-five-things', JSON.stringify({ 0: true }));
    };
    const ctx = await phone(390, 844); await ctx.addInitScript(seed);
    const p = await ctx.newPage(); await p.goto(base + '?utm_source=linkedin', { waitUntil: 'networkidle' }); await p.waitForTimeout(1800);
    const shown = () => p.evaluate(() => ['.wb', '.aw', '.slv', '.nudge'].filter(s => document.querySelector(s)).length);
    const n = await shown(); if (n > 1) problems.push(`${n} returning-visitor messages are shown at once`);
    if (n === 0) problems.push('no returning-visitor message showed for a returning visitor with a saved position');
    const cls = await p.evaluate(() => ['wb', 'aw', 'slv', 'nudge'].find(c => document.querySelector('.' + c)));
    const btn = await p.$(`.${cls} .wb-x, .${cls} button:has-text("No thanks")`);
    if (btn) { const ok = await btn.click({ timeout: 5000 }).then(() => true, () => false); if (!ok) problems.push(`the .${cls} message cannot be dismissed (its dismiss button cannot be clicked)`); await p.waitForTimeout(200); await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(1800); const again = await p.evaluate(c => !!document.querySelector('.' + c), cls); if (again) problems.push(`the dismissed message (.${cls}) came back after a reload`); }
    else problems.push(`the .${cls} message has no dismiss button`);
    await ctx.close();
  }
  await b.close();
  if (problems.length) { console.log('FAIL\n' + problems.join('\n')); process.exit(1); }
  console.log('OK');
})();
