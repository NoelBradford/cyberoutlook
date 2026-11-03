// Page smoke test. Usage: node tools/check.js <baseUrl> [shotDir] [label] [selector]
// Loads the page at desktop and phone widths and fails on script errors, CSP violations,
// sideways scrolling, broken in-page links, duplicate ids or a broken theme toggle.
const { chromium } = require('playwright');
(async () => {
  const [base, shotDir, label, sel] = process.argv.slice(2);
  const b = await chromium.launch();
  const problems = [];
  for (const [w, h] of [[1280, 860], [390, 844]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce', hasTouch: w < 500, isMobile: w < 500 });
    const p = await ctx.newPage();
    p.on('pageerror', e => problems.push(`${w}: pageerror ${e.message}`));
    p.on('console', m => { if ((m.type() === 'error' || (m.type() === 'warning' && /CV feature failed|Content Security Policy|Refused/.test(m.text())))) problems.push(`${w}: console ${m.type()} ${m.text().slice(0, 220)}`); });
    p.on('response', r => { if (r.status() >= 400 && r.url().startsWith(base)) problems.push(`${w}: HTTP ${r.status()} ${r.url()}`); });
    await p.goto(base, { waitUntil: 'networkidle' });
    await p.waitForTimeout(400);
    await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 1400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 10)); } window.scrollTo(0, 0); });
    await p.waitForTimeout(200);
    const r = await p.evaluate(() => {
      const ids = new Set([...document.querySelectorAll('[id]')].map(e => e.id));
      const dup = {}; document.querySelectorAll('[id]').forEach(e => dup[e.id] = (dup[e.id] || 0) + 1);
      return {
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        sections: document.querySelectorAll('main section.section').length,
        cv: !!window.CV,
        broken: [...document.querySelectorAll('a[href^="#"]')].map(a => a.getAttribute('href').slice(1)).filter(id => id && !id.includes('=') && !ids.has(id)),
        dupIds: Object.keys(dup).filter(k => dup[k] > 1),
      };
    });
    if (r.overflow > 1) problems.push(`${w}: horizontal overflow ${r.overflow}px`);
    if (r.sections < 14) problems.push(`${w}: sections=${r.sections}`);
    if (!r.cv) problems.push(`${w}: CV core missing`);
    if (r.broken.length) problems.push(`${w}: broken anchors ${[...new Set(r.broken)].join(',')}`);
    if (r.dupIds.length) problems.push(`${w}: duplicate ids ${r.dupIds.join(',')}`);
    const t = await p.evaluate(() => { const b = document.getElementById('themeToggle'); const a = getComputedStyle(document.body).backgroundColor; b.click(); const c = getComputedStyle(document.body).backgroundColor; b.click(); return a !== c; });
    if (!t) problems.push(`${w}: theme toggle broken`);
    if (shotDir) {
      if (sel) { const ok = await p.evaluate(s => { const e = document.querySelector(s); if (!e) return false; e.scrollIntoView({ block: 'start' }); window.scrollBy(0, -12); return true; }, sel); if (!ok) problems.push(`${w}: selector ${sel} not found`); await p.waitForTimeout(250); }
      await p.screenshot({ path: `${shotDir}/${label}-${w}.jpg`, type: 'jpeg', quality: 60 });
    }
    await ctx.close();
  }
  await b.close();
  if (problems.length) { console.log('FAIL\n' + [...new Set(problems)].join('\n')); process.exit(1); }
  console.log('OK');
})();
