// Tests the optional email capture and the PDF gate against a mock endpoint. Usage: node tools/capture-check.js
// It copies the repo to a temporary folder, builds it there with different src/pages/config.json files, serves it with a mock
// POST /api/subscribe, and drives it with Playwright. Nothing in the repo changes.
//   - OFF (the shipped config): no form, no request to /api, and the PDF links work as they always did.
//   - ON: the form on /check/ and the gate on the PDF links send exactly the documented fields, nothing is pre-ticked, a bad address is
//     refused before any request, a failed request makes one request and a plain message, and no request goes to another site.
//   - The build refuses a capture endpoint that is not a path on this site, and one with no privacy notice or wording.
//   - END TO END: the same pages talk to the real Worker handler (worker/src/index.js) on SQLite with a memory mailer, so the page and the
//     Worker are shown to agree: confirmation email, confirm link, result email, marketing welcome with one-click unsubscribe, a gated
//     download that works once, the preferences page, and "delete my data".
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const { pathToFileURL } = require('url');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.pdf': 'application/pdf', '.xml': 'application/xml', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain' };
const ON = { captureEndpoint: '/api', privacyUrl: '/privacy/', wording: {
  newsletter: { id: 'test-newsletter-1', text: 'TEST WORDING ONLY. Send me the newsletter from SBCSG Enterprises Ltd. I can unsubscribe at any time.' },
  updates: { id: 'test-updates-1', text: 'TEST WORDING ONLY. Tell me by email when the report is updated.' } } };
const problems = [];
const check = (ok, msg) => { if (!ok) problems.push(msg); };

function python() { for (const c of ['python3', 'python']) { try { cp.execFileSync(c, ['--version'], { stdio: 'ignore' }); return c; } catch (e) { /* try the next */ } } throw new Error('no python on PATH'); }
function stage(config) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cap-'));
  fs.cpSync(ROOT, dir, { recursive: true, filter: s => !/[\\/](node_modules|\.git)([\\/]|$)/.test(s) });
  if (config) fs.writeFileSync(path.join(dir, 'src', 'pages', 'config.json'), JSON.stringify(config));
  return dir;
}
const build = dir => cp.execFileSync(python(), ['tools/build.py'], { cwd: dir, stdio: 'pipe' });
function serve(dir, state) {
  return new Promise(res => {
    const srv = http.createServer((req, rsp) => {
      const u = new URL(req.url, 'http://x');
      if (u.pathname.startsWith('/api/')) {
        let raw = ''; req.on('data', c => raw += c); req.on('end', () => {
          state.api.push({ method: req.method, path: u.pathname, body: raw && req.headers['content-type'] && /json/.test(req.headers['content-type']) ? JSON.parse(raw) : null, ct: req.headers['content-type'], cookie: req.headers.cookie || '' });
          if (state.real && !state.fail) { // hand the request to the real Worker
            const headers = new Headers(); for (const [k, v] of Object.entries(req.headers)) if (k !== 'host' && typeof v === 'string') headers.set(k, v);
            const fetchReq = new Request('http://' + req.headers.host + req.url, { method: req.method, headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : raw });
            state.real.worker.fetch(fetchReq, state.real.env).then(async res => { rsp.writeHead(res.status, Object.fromEntries(res.headers)); rsp.end(Buffer.from(await res.arrayBuffer())); });
            return;
          }
          rsp.writeHead(state.fail ? 500 : 200, { 'Content-Type': 'application/json' }); rsp.end(JSON.stringify(state.fail ? { error: 'x' } : { ok: true }));
        }); return;
      }
      let f = path.join(dir, decodeURIComponent(u.pathname)); if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
      if (!fs.existsSync(f)) { rsp.writeHead(404); return rsp.end('not found'); }
      rsp.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(rsp);
    }).listen(0, '127.0.0.1', () => res({ srv, origin: 'http://127.0.0.1:' + srv.address().port }));
  });
}
async function page(b, origin, state, path0) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
  const p = await ctx.newPage(); state.other = [];
  p.on('request', r => { const u = r.url(); if (/^https?:/.test(u) && !u.startsWith(origin) && !/^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(u)) state.other.push(u); });
  p.on('pageerror', e => problems.push('page error: ' + e.message));
  await p.goto(origin + path0, { waitUntil: 'networkidle' }); await p.waitForTimeout(1200);
  return { p, ctx };
}
async function finishCheck(p) {
  await p.click('#tool-root button');
  const ans = ['no', 'unsure', 'yes', 'no', 'no', 'yes', 'unsure', 'no', 'yes', 'no']; // score 3, gaps 1,2,4,5,7,8,10
  for (let i = 0; i < 10; i++) { await p.click(`#qz-${i}-${ans[i]}`); await p.waitForTimeout(120); }
  await p.waitForTimeout(300);
}

(async () => {
  // the build refuses unsafe or incomplete config
  for (const [name, cfg] of [['an endpoint on another site', { ...ON, captureEndpoint: 'https://evil.example/api' }], ['an endpoint with no privacy notice', { ...ON, privacyUrl: '' }], ['an endpoint with no wording', { captureEndpoint: '/api', privacyUrl: '/privacy/', wording: {} }]]) {
    const dir = stage(cfg); let refused = false; try { build(dir); } catch (e) { refused = true; }
    check(refused, `the build accepted ${name}`); fs.rmSync(dir, { recursive: true, force: true });
  }
  { // the deployed site and the sitemap: PDFs included while the gate is off, left out while it is on
    const PDFS = ['assets/UK-Small-Business-Cyber-Outlook-2027.pdf', 'linkedin/CyberOutlook2027_LinkedIn_Carousel.pdf'];
    for (const [label, cfg] of [['off', null], ['on', ON]]) {
      const dir = stage(cfg); build(dir); const out = path.join(dir, '_staged');
      cp.execFileSync(process.execPath, ['tools/stage-site.js', out, '--preview'], { cwd: dir, stdio: 'pipe' });
      const sitemap = fs.readFileSync(path.join(dir, 'sitemap.xml'), 'utf8');
      for (const f of PDFS) {
        check(fs.existsSync(path.join(out, f)) === (label === 'off'), `STAGE ${label}: ${f} should be ${label === 'off' ? 'in' : 'left out of'} the deployed site`);
        check(sitemap.includes(f) === (label === 'off'), `STAGE ${label}: ${f} should be ${label === 'off' ? 'in' : 'left out of'} the sitemap`);
      }
      check(fs.existsSync(path.join(out, 'check', 'index.html')) && fs.existsSync(path.join(out, 'tools', 'index.html')) && !fs.existsSync(path.join(out, 'src')) && !fs.existsSync(path.join(out, 'worker')) && !fs.existsSync(path.join(out, 'tools', 'build.py')), `STAGE ${label}: the deployed site is missing pages or contains source, the Worker or scripts`);
      check(/noindex/.test(fs.readFileSync(path.join(out, '_headers'), 'utf8')), `STAGE ${label}: the preview has no noindex header`);
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
  const b = await chromium.launch();

  { // OFF: the shipped config
    const dir = stage(null); build(dir); const state = { api: [] }; const { srv, origin } = await serve(dir, state);
    const { p, ctx } = await page(b, origin, state, '/check/');
    await finishCheck(p);
    check(!(await p.$('.cap')), 'OFF: an email form is drawn on /check/');
    check(await p.evaluate(() => CV.capture && CV.capture.enabled === false), 'OFF: CV.capture.enabled is not false');
    check(state.api.length === 0, 'OFF: a request went to /api');
    await ctx.close();
    const r = await page(b, origin, state, '/'); const hit = []; r.p.on('request', q => { if (/\.pdf$/.test(q.url())) hit.push(q.url()); });
    await r.p.evaluate(() => { const a = document.querySelector('a[href$="UK-Small-Business-Cyber-Outlook-2027.pdf"]'); a.removeAttribute('download'); a.setAttribute('target', '_blank'); });
    await r.p.click('a[href$="UK-Small-Business-Cyber-Outlook-2027.pdf"]', { noWaitAfter: true }); await r.p.waitForTimeout(600);
    check(!(await r.p.$('dialog[open]')), 'OFF: a dialog opened when the PDF link was clicked');
    check(state.api.length === 0, 'OFF: the PDF link sent a request to /api');
    await r.ctx.close(); srv.close(); fs.rmSync(dir, { recursive: true, force: true });
  }

  { // ON
    const dir = stage(ON); build(dir); const state = { api: [], fail: false }; const { srv, origin } = await serve(dir, state);
    // the result form
    let { p, ctx } = await page(b, origin, state, '/check/'); await finishCheck(p);
    const card = await p.$('.cap'); check(!!card, 'ON: no email form on /check/ after the result');
    if (card) {
      check(await p.evaluate(() => [...document.querySelectorAll('.cap input[type=checkbox]')].every(c => !c.checked) && document.querySelectorAll('.cap input[type=checkbox]').length === 2), 'ON: a marketing box is pre-ticked, or there are not two');
      check(await p.evaluate(() => /TEST WORDING ONLY/.test(document.querySelector('.cap').textContent)), 'ON: the configured wording is not shown');
      check(await p.evaluate(() => document.querySelector('.cap a.cap-priv').getAttribute('href') === '/privacy/'), 'ON: the privacy notice is not linked beside the form');
      check(await p.evaluate(() => !!document.querySelector('.cap h2') && document.querySelector('#check .qz-result h2') !== null), 'ON: the result is not shown above the form');
      await p.fill('.cap input[type=email]', 'not-an-address'); await p.click('.cap button[type=submit]'); await p.waitForTimeout(300);
      check(state.api.length === 0, 'ON: a bad address was sent');
      check(await p.evaluate(() => !document.querySelector('.cap-err').hidden), 'ON: no message for a bad address');
      await p.fill('.cap input[type=email]', 'Sam@Example.co.uk'); await p.click('.cap button[type=submit]'); await p.waitForTimeout(500);
      check(state.api.length === 1, `ON: expected one request, saw ${state.api.length}`);
      const m = state.api[0];
      if (m) {
        check(m.method === 'POST' && m.path === '/api/subscribe' && /^application\/json/.test(m.ct), 'ON: wrong method, path or content type');
        check(JSON.stringify(m.body) === JSON.stringify({ email: 'Sam@Example.co.uk', topics: ['result'], source: '/check/', result: { score: 3, band: 'Start with the basics', gaps: [1, 2, 4, 5, 7, 8, 10] } }), 'ON: the body is not exactly the documented fields: ' + JSON.stringify(m.body));
        check(!/answer/i.test(JSON.stringify(m.body)) && m.cookie === '', 'ON: answers or a cookie were sent');
      }
      check(await p.evaluate(() => /Now check your inbox/.test(document.querySelector('.cap').textContent)), 'ON: no confirmation message after sending');
    }
    check(state.other.length === 0, 'ON: a request went to another site: ' + state.other.join(', '));
    await ctx.close();
    // both boxes ticked
    state.api.length = 0; ({ p, ctx } = await page(b, origin, state, '/check/')); await finishCheck(p);
    await p.fill('.cap input[type=email]', 'a@b.co'); await p.check('.cap input[id$="-newsletter"]'); await p.check('.cap input[id$="-updates"]'); await p.click('.cap button[type=submit]'); await p.waitForTimeout(500);
    check(state.api[0] && JSON.stringify(state.api[0].body.topics) === JSON.stringify(['result', 'newsletter', 'report-updates']) && JSON.stringify(state.api[0].body.wordings) === JSON.stringify({ newsletter: 'test-newsletter-1', 'report-updates': 'test-updates-1' }), 'ON: ticked boxes are not sent with their wording ids: ' + JSON.stringify(state.api[0] && state.api[0].body));
    await ctx.close();
    // a failing endpoint
    state.api.length = 0; state.fail = true; ({ p, ctx } = await page(b, origin, state, '/check/')); await finishCheck(p);
    await p.fill('.cap input[type=email]', 'a@b.co'); await p.click('.cap button[type=submit]'); await p.waitForTimeout(2500);
    check(state.api.length === 1, `FAIL: expected one request and no retry, saw ${state.api.length}`);
    check(await p.evaluate(() => /nothing was sent/.test(document.querySelector('.cap-status').textContent) && !document.querySelector('.cap button[type=submit]').disabled), 'FAIL: no plain message, or the button stayed disabled');
    check(await p.evaluate(() => !!document.querySelector('#check .qz-result h2')), 'FAIL: the result disappeared');
    await ctx.close(); state.fail = false;
    // the gate on the report
    state.api.length = 0; const g = await page(b, origin, state, '/'); const pdfHits = []; g.p.on('request', q => { if (/\.pdf$/.test(q.url())) pdfHits.push(q.url()); });
    await g.p.click('a[href$="UK-Small-Business-Cyber-Outlook-2027.pdf"]'); await g.p.waitForTimeout(500);
    check(await g.p.evaluate(() => !!document.querySelector('dialog[open] input[type=email]')), 'GATE: the report PDF link did not open the form');
    check(pdfHits.length === 0 && g.p.url() === origin + '/', 'GATE: the report PDF was fetched or the page navigated');
    await g.p.fill('dialog[open] input[type=email]', 'a@b.co'); await g.p.click('dialog[open] button[type=submit]'); await g.p.waitForTimeout(500);
    check(state.api[0] && JSON.stringify(state.api[0].body) === JSON.stringify({ email: 'a@b.co', topics: ['download'], source: '/', files: ['report'] }), 'GATE: the report request is not exactly the documented fields: ' + JSON.stringify(state.api[0] && state.api[0].body));
    await g.p.keyboard.press('Escape');
    await g.p.click('a[href$="CyberOutlook2027_LinkedIn_Carousel.pdf"]'); await g.p.waitForTimeout(400);
    check(await g.p.evaluate(() => /ten-slide/.test(document.querySelector('dialog[open]').textContent)), 'GATE: the deck link did not open the deck form');
    await g.p.keyboard.press('Escape');
    await g.p.click('.tm-btn'); await g.p.click('.tm-i:has-text("Download the full PDF")'); await g.p.waitForTimeout(400);
    check(await g.p.evaluate(() => /full report/.test(document.querySelector('dialog[open]') ? document.querySelector('dialog[open]').textContent : '')), 'GATE: the Tools menu download was not gated');
    check(pdfHits.length === 0, 'GATE: a PDF was fetched from the page');
    await g.ctx.close(); srv.close(); fs.rmSync(dir, { recursive: true, force: true });
  }
  { // END TO END: the real Worker behind the real pages
    const W = await import(pathToFileURL(path.join(ROOT, 'worker', 'src', 'index.js')).href);
    const S = await import(pathToFileURL(path.join(ROOT, 'worker', 'test', 'd1-shim.js')).href);
    const M = await import(pathToFileURL(path.join(ROOT, 'worker', 'src', 'mailer.js')).href);
    const mailer = M.memoryMailer(), db = S.makeDb();
    const dir = stage(ON); build(dir); const state = { api: [], real: { worker: W.default, env: null } };
    const { srv, origin } = await serve(dir, state);
    state.real.env = { DB: db, mailer, FILES: S.makeFiles({ 'UK-Small-Business-Cyber-Outlook-2027.pdf': 'REPORT-BYTES', 'CyberOutlook2027_LinkedIn_Carousel.pdf': 'DECK-BYTES' }), SECRET: 'e2e-secret', SITE: origin, SENDER_NAME: 'SBCSG Enterprises Ltd', SENDER_ADDRESS: 'hello@example.test' };
    const rows = sql => db.raw.prepare(sql).all();
    const linkIn = (text, re) => (text.match(re) || [])[0];
    // 1. the result, with the newsletter ticked
    let { p, ctx } = await page(b, origin, state, '/check/'); await finishCheck(p);
    await p.fill('.cap input[type=email]', 'Sam@Example.co.uk'); await p.check('.cap input[id$="-newsletter"]'); await p.click('.cap button[type=submit]'); await p.waitForTimeout(800);
    check(await p.evaluate(() => /Now check your inbox/.test(document.querySelector('.cap').textContent)), 'E2E: the page did not accept the Worker\'s answer');
    check(mailer.sent.length === 1 && /Confirm/.test(mailer.sent[0].subject) && mailer.sent[0].to === 'sam@example.co.uk', 'E2E: expected one confirmation email to the lower-cased address, saw ' + mailer.sent.map(m => m.subject).join('|'));
    check(rows('SELECT confirmed_at FROM consents').every(r => r.confirmed_at === null) && rows('SELECT * FROM consents').length === 2, 'E2E: consent should be recorded but unconfirmed');
    const confirmLink = mailer.sent[0] && linkIn(mailer.sent[0].text, /https?:\/\/[^\s]+\/api\/confirm\?t=[\w-]+/);
    check(!!confirmLink, 'E2E: no confirm link in the confirmation email');
    if (confirmLink) {
      await p.goto(confirmLink); await p.waitForTimeout(400);
      check(await p.evaluate(() => /Your address is confirmed/.test(document.body.textContent)), 'E2E: the confirm page did not load');
      check(mailer.sent.length === 3 && mailer.sent.some(m => /3 out of 10/.test(m.subject) && /Questions with a gap: 1, 2, 4, 5, 7, 8, 10/.test(m.text)) , 'E2E: the result email is missing or wrong: ' + mailer.sent.map(m => m.subject).join('|'));
      const welcome = mailer.sent.find(m => /newsletter list/.test(m.subject));
      check(!!welcome && /List-Unsubscribe/.test(Object.keys(welcome.headers || {}).join()) && welcome.headers['List-Unsubscribe-Post'] === 'List-Unsubscribe=One-Click', 'E2E: the newsletter welcome has no one-click unsubscribe headers');
      check(rows('SELECT confirmed_at FROM consents').every(r => r.confirmed_at !== null), 'E2E: consents are not confirmed after the link');
      const wording = rows("SELECT wording FROM consents WHERE topic = 'newsletter'")[0];
      check(wording && wording.wording === 'test-newsletter-1', 'E2E: the wording id was not stored with the newsletter consent');
      await p.goto(confirmLink); check(await p.evaluate(() => /expired or was already used/.test(document.body.textContent)), 'E2E: the confirm link worked twice');
      // preferences, then one-click unsubscribe, then delete my data
      const prefs = welcome && linkIn(welcome.text, /https?:\/\/[^\s]+\/api\/preferences\?s=\d+&sig=[\w-]+/);
      check(!!prefs, 'E2E: no preferences link in the marketing email');
      if (prefs) {
        await p.goto(prefs); check(await p.evaluate(() => /The newsletter/.test(document.body.textContent)), 'E2E: the preferences page does not list the newsletter');
        const oneClick = welcome.headers['List-Unsubscribe'].replace(/^<|>$/g, '');
        const rsp = await p.request.post(oneClick, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, data: 'List-Unsubscribe=One-Click' });
        check(rsp.status() === 200 && rows("SELECT * FROM suppressions WHERE topic = 'newsletter'").length === 1, 'E2E: the one-click unsubscribe did not suppress the newsletter');
        await p.goto(prefs); check(await p.evaluate(() => /not on any list/.test(document.body.textContent)), 'E2E: the preferences page still lists the newsletter after unsubscribing');
        await p.click('button:has-text("Delete my data")'); await p.waitForTimeout(500);
        check(await p.evaluate(() => /has been deleted/.test(document.body.textContent)), 'E2E: no confirmation after deleting data');
        check(rows('SELECT * FROM subscribers').length === 0 && rows('SELECT * FROM consents').length === 0 && rows('SELECT * FROM tokens').length === 0, 'E2E: address data remains after deleting');
        check(rows('SELECT * FROM counts').length > 0, 'E2E: the counts are gone after deleting');
      }
    }
    await ctx.close();
    // 2. the gated report, from the front page
    mailer.sent.length = 0; state.api.length = 0;
    const g = await page(b, origin, state, '/'); await g.p.click('a[href$="UK-Small-Business-Cyber-Outlook-2027.pdf"]'); await g.p.waitForTimeout(400);
    await g.p.fill('dialog[open] input[type=email]', 'gate@example.co.uk'); await g.p.click('dialog[open] button[type=submit]'); await g.p.waitForTimeout(800);
    const gl = mailer.sent[0] && linkIn(mailer.sent[0].text, /https?:\/\/[^\s]+\/api\/confirm\?t=[\w-]+/);
    check(!!gl, 'E2E gate: no confirm link was emailed');
    if (gl) {
      await g.p.goto(gl); await g.p.waitForTimeout(400);
      const dl = await g.p.evaluate(() => (document.querySelector('a[href*="/api/download/report"]') || {}).href);
      check(!!dl, 'E2E gate: the confirm page has no download link');
      if (dl) {
        const a = await g.p.request.get(dl); const body = await a.text();
        check(a.status() === 200 && body === 'REPORT-BYTES' && /attachment/.test(a.headers()['content-disposition'] || '') && /no-store/.test(a.headers()['cache-control'] || ''), 'E2E gate: the file did not download with the right headers');
        check((await g.p.request.get(dl)).status() === 410, 'E2E gate: the download link worked twice');
        check((await g.p.request.get(origin + '/api/download/report?t=guess')).status() === 410, 'E2E gate: a guessed link worked');
      }
    }
    check(mailer.sent.every(m => !m.headers), 'E2E gate: the download email carried marketing headers');
    await g.ctx.close(); srv.close(); fs.rmSync(dir, { recursive: true, force: true });
  }
  await b.close();
  if (problems.length) { console.log('FAIL\n' + [...new Set(problems)].join('\n')); process.exit(1); }
  console.log('OK');
})().catch(e => { console.error(e); process.exit(1); });
