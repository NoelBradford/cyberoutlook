// Page smoke test.
// Usage: node tools/check.js <baseUrl> [shotDir] [label] [selector] [--profile report|tool] [--path /check/]
//
// Loads the page at desktop and phone widths. Two profiles:
//   report (default)  the full report page: script errors, CSP violations, sideways scrolling, fewer than 14
//                     sections, missing window.CV, broken in-page links, duplicate ids, a broken theme toggle.
//   tool              a standalone tool page: no script error, no CSP violation or "CV feature failed" warning,
//                     no sideways scrolling, window.CV present, exactly one h1, a non-empty title, a <main>
//                     landmark, the tool's content visible without any click, and no 4xx or 5xx from same-origin
//                     requests.
// --path is resolved against baseUrl, so `check.js http://127.0.0.1:8080/ --profile tool --path /check/` tests /check/.
const { chromium } = require('playwright');
(async () => {
  const argv = process.argv.slice(2);
  const flag = n => { const i = argv.indexOf(n); if (i < 0) return undefined; const v = argv[i + 1]; argv.splice(i, 2); return v; };
  const profile = flag('--profile') || 'report';
  const path = flag('--path');
  if (!['report', 'tool'].includes(profile)) { console.error(`Unknown profile "${profile}". Use report or tool.`); process.exit(2); }
  const [base, shotDir, label, sel] = argv;
  if (!base) { console.error('Usage: node tools/check.js <baseUrl> [shotDir] [label] [selector] [--profile report|tool] [--path /check/]'); process.exit(2); }
  const target = path ? new URL(path, base).href : base;
  const origin = new URL(base).origin;
  const b = await chromium.launch();
  const problems = [];
  for (const [w, h] of [[1280, 860], [390, 844]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce', hasTouch: w < 500, isMobile: w < 500 });
    const p = await ctx.newPage();
    p.on('pageerror', e => problems.push(`${w}: pageerror ${e.message}`));
    p.on('console', m => { if ((m.type() === 'error' || (m.type() === 'warning' && /CV feature failed|Content Security Policy|Refused/.test(m.text())))) problems.push(`${w}: console ${m.type()} ${m.text().slice(0, 220)}`); });
    p.on('response', r => { if (r.status() >= 400 && r.url().startsWith(origin)) problems.push(`${w}: HTTP ${r.status()} ${r.url()}`); });
    const nav = await p.goto(target, { waitUntil: 'networkidle' });
    if (profile === 'tool' && nav && nav.status() >= 400) problems.push(`${w}: HTTP ${nav.status()} ${target}`);
    await p.waitForTimeout(400);
    await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 1400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 10)); } window.scrollTo(0, 0); });
    await p.waitForTimeout(200);
    if (profile === 'tool') {
      const r = await p.evaluate(() => {
        const main = document.querySelector('main, [role="main"]');
        let visible = false;
        if (main) {
          const cs = getComputedStyle(main), box = main.getBoundingClientRect();
          const hiddenAncestor = main.closest('[aria-hidden="true"], [hidden], dialog:not([open])');
          // Text alone is not enough: a page whose tool only opens in a dialog also has an intro. Something to press or fill in must be on screen.
          const control = [...main.querySelectorAll('button, input:not([type=hidden]), select, textarea, a[href]')].some(e => { const r = e.getBoundingClientRect(), c = getComputedStyle(e); return r.width > 0 && r.height > 0 && c.visibility !== 'hidden' && c.display !== 'none' && !e.closest('[hidden], dialog:not([open])'); });
          visible = cs.display !== 'none' && cs.visibility !== 'hidden' && box.width > 0 && box.height > 0 && !hiddenAncestor && main.innerText.trim().length >= 40 && control;
        }
        return {
          overflow: document.documentElement.scrollWidth - window.innerWidth,
          cv: !!window.CV,
          h1: document.querySelectorAll('h1').length,
          title: document.title.trim(),
          hasMain: !!main,
          visible,
        };
      });
      if (r.overflow > 1) problems.push(`${w}: horizontal overflow ${r.overflow}px`);
      if (!r.cv) problems.push(`${w}: CV core missing`);
      if (r.h1 !== 1) problems.push(`${w}: expected exactly one h1, found ${r.h1}`);
      if (!r.title) problems.push(`${w}: empty title`);
      if (!r.hasMain) problems.push(`${w}: no main landmark`);
      else if (!r.visible) problems.push(`${w}: tool content not visible without a click (main is hidden, empty, has nothing to press or fill in, or is inside a closed dialog)`);
    } else {
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
    }
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
