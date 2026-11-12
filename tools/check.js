// Page smoke test.
//
// Usage:
//   node tools/check.js <baseUrl> [shotDir] [label] [selector]
//       The report profile (default). Loads the home page at desktop and phone widths and fails on
//       script errors, CSP violations, sideways scrolling, broken in-page links, duplicate ids or a
//       broken theme toggle.
//   node tools/check.js <baseUrl> --profile tool --path /check/ [shotDir] [label] [selector]
//       The tool profile, for a standalone tool page. Fails on script errors, CSP violations, HTTP
//       errors, requests to any other origin (the web fonts excepted), sideways scrolling, broken
//       in-page links, duplicate ids, a missing CV core, anything other than exactly one h1, an empty
//       title, a missing or repeated <main> landmark, or no visible control inside <main> on arrival.
//   node tools/check.js <baseUrl> --pages tools/pages.txt
//       Runs the tool profile on every path listed in the file (one per line, # for comments).
//       An empty list passes, so the step can sit in CI before any tool page exists.
const { chromium } = require('playwright');
const fs = require('fs');

const FONT_HOSTS = /^https:\/\/fonts\.(googleapis|gstatic)\.com\//;

function parseArgs(argv) {
  const flags = { profile: 'report', path: '/', pages: null };
  const pos = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--profile') flags.profile = argv[++i];
    else if (a === '--path') flags.path = argv[++i];
    else if (a === '--pages') flags.pages = argv[++i];
    else pos.push(a);
  }
  if (!['report', 'tool'].includes(flags.profile)) { console.error(`Unknown profile "${flags.profile}". Use report or tool.`); process.exit(2); }
  return { flags, base: pos[0], shotDir: pos[1], label: pos[2], sel: pos[3] };
}

// Runs one page through both viewports. Returns a list of problems (empty when the page is fine).
async function checkPage(browser, { base, profile, pagePath, shotDir, label, sel }) {
  const problems = [];
  const target = new URL(pagePath, base).href;
  const origin = new URL(base).origin;
  for (const [w, h] of [[1280, 860], [390, 844]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce', hasTouch: w < 500, isMobile: w < 500 });
    const p = await ctx.newPage();
    p.on('pageerror', e => problems.push(`${w}: pageerror ${e.message}`));
    p.on('console', m => { if ((m.type() === 'error' || (m.type() === 'warning' && /CV feature failed|Content Security Policy|Refused/.test(m.text())))) problems.push(`${w}: console ${m.type()} ${m.text().slice(0, 220)}`); });
    p.on('response', r => { if (r.status() >= 400 && r.url().startsWith(base)) problems.push(`${w}: HTTP ${r.status()} ${r.url()}`); });
    if (profile === 'tool') {
      p.on('request', rq => {
        const u = rq.url();
        if (u.startsWith(origin) || u.startsWith('data:') || u.startsWith('blob:') || u.startsWith('about:') || FONT_HOSTS.test(u)) return;
        problems.push(`${w}: request to another origin ${u.slice(0, 160)}`);
      });
    }
    await p.goto(target, { waitUntil: 'networkidle' });
    await p.waitForTimeout(400);
    await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 1400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 10)); } window.scrollTo(0, 0); });
    await p.waitForTimeout(200);
    const r = await p.evaluate(() => {
      const ids = new Set([...document.querySelectorAll('[id]')].map(e => e.id));
      const dup = {}; document.querySelectorAll('[id]').forEach(e => dup[e.id] = (dup[e.id] || 0) + 1);
      const main = document.querySelectorAll('main, [role="main"]');
      const inView = el => { const b = el.getBoundingClientRect(); const s = getComputedStyle(el); return b.width > 0 && b.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && b.bottom > 0 && b.top < window.innerHeight && b.right > 0 && b.left < window.innerWidth; };
      return {
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        sections: document.querySelectorAll('main section.section').length,
        cv: !!window.CV,
        broken: [...document.querySelectorAll('a[href^="#"]')].map(a => a.getAttribute('href').slice(1)).filter(id => id && !id.includes('=') && !ids.has(id)),
        dupIds: Object.keys(dup).filter(k => dup[k] > 1),
        h1: document.querySelectorAll('h1').length,
        title: (document.title || '').trim(),
        mains: main.length,
        mainControlsInView: main.length === 1 ? [...main[0].querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button]')].filter(inView).length : 0,
      };
    });
    if (r.overflow > 1) problems.push(`${w}: horizontal overflow ${r.overflow}px`);
    if (!r.cv) problems.push(`${w}: CV core missing`);
    if (r.broken.length) problems.push(`${w}: broken anchors ${[...new Set(r.broken)].join(',')}`);
    if (r.dupIds.length) problems.push(`${w}: duplicate ids ${r.dupIds.join(',')}`);
    if (profile === 'report') {
      if (r.sections < 14) problems.push(`${w}: sections=${r.sections}`);
      const t = await p.evaluate(() => { const b = document.getElementById('themeToggle'); const a = getComputedStyle(document.body).backgroundColor; b.click(); const c = getComputedStyle(document.body).backgroundColor; b.click(); return a !== c; });
      if (!t) problems.push(`${w}: theme toggle broken`);
    } else {
      if (r.h1 !== 1) problems.push(`${w}: expected exactly one h1, found ${r.h1}`);
      if (!r.title) problems.push(`${w}: empty <title>`);
      if (r.mains !== 1) problems.push(`${w}: expected exactly one main landmark, found ${r.mains}`);
      else if (r.mainControlsInView < 1) problems.push(`${w}: no visible control inside <main> on arrival`);
    }
    if (shotDir) {
      if (sel) { const ok = await p.evaluate(s => { const e = document.querySelector(s); if (!e) return false; e.scrollIntoView({ block: 'start' }); window.scrollBy(0, -12); return true; }, sel); if (!ok) problems.push(`${w}: selector ${sel} not found`); await p.waitForTimeout(250); }
      await p.screenshot({ path: `${shotDir}/${label}-${w}.jpg`, type: 'jpeg', quality: 60 });
    }
    await ctx.close();
  }
  return problems;
}

(async () => {
  const { flags, base, shotDir, label, sel } = parseArgs(process.argv.slice(2));
  if (!base) { console.error('Usage: node tools/check.js <baseUrl> [--profile report|tool] [--path /p/] [--pages file] [shotDir] [label] [selector]'); process.exit(2); }
  const jobs = [];
  if (flags.pages) {
    const lines = fs.readFileSync(flags.pages, 'utf8').split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#'));
    for (const l of lines) jobs.push({ profile: 'tool', pagePath: l.startsWith('/') ? l : '/' + l });
    if (!jobs.length) { console.log(`OK (no tool pages listed in ${flags.pages})`); return; }
  } else {
    jobs.push({ profile: flags.profile, pagePath: flags.path });
  }
  const b = await chromium.launch();
  let failed = false;
  for (const job of jobs) {
    const problems = await checkPage(b, { base, profile: job.profile, pagePath: job.pagePath, shotDir, label: jobs.length > 1 ? `${label || 'page'}${job.pagePath.replace(/\W+/g, '-')}` : label, sel });
    const plainReport = jobs.length === 1 && job.profile === 'report'; // keeps the original output format
    if (problems.length) { failed = true; console.log((plainReport ? 'FAIL' : `FAIL ${job.profile} ${job.pagePath}`) + '\n' + [...new Set(problems)].join('\n')); }
    else if (jobs.length > 1 || job.profile === 'tool') console.log(`OK ${job.profile} ${job.pagePath}`);
  }
  await b.close();
  if (failed) process.exit(1);
  if (jobs.length === 1 && jobs[0].profile === 'report') console.log('OK');
})();
