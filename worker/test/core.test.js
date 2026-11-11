// Run with: node --test worker/test/   (Node 22.5 or newer: it uses the built-in node:sqlite, the same engine as D1).
import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { subscribe, confirm, download, unsubscribe, purge, unsubscribeUrl, sha256, DAY, HOUR } from '../src/core.js';
import { memoryMailer } from '../src/mailer.js';

const SCHEMA = readFileSync(new URL('../schema.sql', import.meta.url), 'utf8');

// A just-enough D1: prepare(sql).bind(...).first() / all() / run().
function makeDb() {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON'); // D1 enforces foreign keys
  db.exec(SCHEMA);
  return { raw: db, prepare(sql) {
    const st = db.prepare(sql); let args = [];
    const o = { bind(...a) { args = a; return o; }, async first() { return st.get(...args) ?? null; }, async all() { return { results: st.all(...args) }; }, async run() { const r = st.run(...args); return { meta: { changes: r.changes } }; } };
    return o;
  } };
}
function makeEnv() {
  const files = new Map([['UK-Small-Business-Cyber-Outlook-2027.pdf', 'REPORT'], ['CyberOutlook2027_LinkedIn_Carousel.pdf', 'DECK']]);
  return { DB: makeDb(), mailer: memoryMailer(), SECRET: 'test-secret', SITE: 'https://example.test', SENDER_NAME: 'SBCSG Enterprises Ltd', SENDER_ADDRESS: 'hello@example.test',
    FILES: { async get(k) { return files.has(k) ? { body: files.get(k) } : null; } } };
}
const tokenFrom = text => text.match(/[?&]t=([A-Za-z0-9_-]+)/)[1];
const count = (env, sql, ...a) => env.DB.raw.prepare(sql).get(...a).n;
const NOW = Date.UTC(2026, 10, 12, 10, 0, 0);

test('a bad address, an unknown topic or a missing wording is refused', async () => {
  const env = makeEnv();
  assert.equal((await subscribe(env, { email: 'nope', topics: ['result'], source: '/check/' }, NOW)).status, 400);
  assert.equal((await subscribe(env, { email: 'a@b.co', topics: ['spam'], source: '/check/' }, NOW)).status, 400);
  assert.equal((await subscribe(env, { email: 'a@b.co', topics: ['newsletter'], source: '/check/' }, NOW)).status, 400, 'a marketing topic needs the wording id');
  assert.equal((await subscribe(env, { email: 'a@b.co', topics: ['download'], files: ['nope'], source: '/' }, NOW)).status, 400);
  assert.equal((await subscribe(env, { email: 'a@b.co', topics: ['result'], source: '/check/', result: { score: 11, band: 'Halfway there', gaps: [] } }, NOW)).status, 400);
  assert.equal(env.mailer.sent.length, 0);
});

test('each marketing topic records its own wording id, and a topic without one is refused', async () => {
  const env = makeEnv();
  assert.equal((await subscribe(env, { email: 'a@b.co', topics: ['newsletter', 'report-updates'], wordings: { newsletter: 'nl-1' }, source: '/' }, NOW)).status, 400);
  assert.equal((await subscribe(env, { email: 'a@b.co', topics: ['newsletter', 'report-updates'], wordings: { newsletter: 'nl-1', 'report-updates': 'ru-1' }, source: '/' }, NOW)).status, 200);
  const rows = env.DB.raw.prepare('SELECT topic, wording FROM consents ORDER BY topic').all();
  assert.deepEqual(rows.map(r => `${r.topic}=${r.wording}`), ['newsletter=nl-1', 'report-updates=ru-1']);
});

test('subscribing sends one confirmation and nothing else, and records the request unconfirmed', async () => {
  const env = makeEnv();
  const r = await subscribe(env, { email: ' Sam@Example.CO ', topics: ['newsletter'], wording: 'nl-v1', source: '/check/' }, NOW);
  assert.deepEqual([r.status, r.ok], [200, true]);
  assert.equal(env.mailer.sent.length, 1);
  assert.match(env.mailer.sent[0].subject, /Confirm/);
  assert.equal(env.mailer.sent[0].to, 'sam@example.co');
  assert.equal(count(env, 'SELECT COUNT(*) AS n FROM consents WHERE confirmed_at IS NULL'), 1);
  assert.equal(env.mailer.sent[0].headers, undefined, 'the confirmation is not marketing');
});

test('the answer does not reveal whether an address is known, and an address is limited to three confirmations an hour', async () => {
  const env = makeEnv();
  const body = { email: 'a@b.co', topics: ['result'], source: '/check/', result: { score: 3, band: 'Start with the basics', gaps: [1, 2] } };
  const answers = [];
  for (let i = 0; i < 5; i++) answers.push(JSON.stringify(await subscribe(env, body, NOW + i * 1000)));
  assert.equal(new Set(answers).size, 1);
  assert.equal(env.mailer.sent.length, 3);
  await subscribe(env, body, NOW + 2 * HOUR);
  assert.equal(env.mailer.sent.length, 4);
});

test('confirming records consent, sends the marketing welcome with one-click unsubscribe headers, and works once', async () => {
  const env = makeEnv();
  await subscribe(env, { email: 'a@b.co', topics: ['newsletter', 'report-updates'], wording: 'nl-v1', source: '/' }, NOW);
  const t = tokenFrom(env.mailer.sent[0].text);
  const r = await confirm(env, t, NOW + 1000);
  assert.equal(r.status, 200);
  assert.deepEqual(r.sent.sort(), ['newsletter', 'report-updates']);
  const welcome = env.mailer.sent.slice(1);
  assert.equal(welcome.length, 2);
  for (const m of welcome) { assert.match(m.headers['List-Unsubscribe'], /api\/unsubscribe\?s=/); assert.equal(m.headers['List-Unsubscribe-Post'], 'List-Unsubscribe=One-Click'); }
  assert.equal(count(env, 'SELECT COUNT(*) AS n FROM consents WHERE confirmed_at IS NOT NULL'), 2);
  assert.equal((await confirm(env, t, NOW + 2000)).status, 410, 'a link works once');
  assert.equal((await confirm(env, 'x'.repeat(43), NOW)).status, 410);
});

test('a confirmation link expires after 48 hours', async () => {
  const env = makeEnv();
  await subscribe(env, { email: 'a@b.co', topics: ['result'], source: '/check/', result: { score: 5, band: 'Halfway there', gaps: [3] } }, NOW);
  assert.equal((await confirm(env, tokenFrom(env.mailer.sent[0].text), NOW + 49 * HOUR)).status, 410);
});

test('the result email is sent only after confirmation, carries the score and the numbers of the gaps, and is not marketing', async () => {
  const env = makeEnv();
  await subscribe(env, { email: 'a@b.co', topics: ['result'], source: '/check/', result: { score: 3, band: 'Start with the basics', gaps: [4, 1, 4] } }, NOW);
  assert.equal(env.mailer.sent.length, 1, 'only the confirmation so far');
  await confirm(env, tokenFrom(env.mailer.sent[0].text), NOW + 5000);
  const m = env.mailer.sent[1];
  assert.match(m.subject, /3 out of 10/);
  assert.match(m.text, /Start with the basics/);
  assert.match(m.text, /Questions with a gap: 1, 4\./);
  assert.equal(m.headers, undefined);
});

test('a gated file needs a confirmed, single-use link that expires after 15 minutes', async () => {
  const env = makeEnv();
  await subscribe(env, { email: 'a@b.co', topics: ['download'], files: ['report', 'deck'], source: '/' }, NOW);
  const r = await confirm(env, tokenFrom(env.mailer.sent[0].text), NOW + 1000);
  assert.equal(r.downloads.length, 2);
  const [rep, deck] = r.downloads.map(d => tokenFrom(d.url));
  assert.equal((await download(env, 'report', 'guess', NOW + 2000)).status, 410, 'no link, no file');
  assert.equal((await download(env, 'deck', rep, NOW + 2000)).status, 410, 'a link is for its own file');
  const ok = await download(env, 'report', rep, NOW + 2000);
  assert.deepEqual([ok.status, ok.body], [200, 'REPORT']);
  assert.equal((await download(env, 'report', rep, NOW + 3000)).status, 410, 'once only');
  assert.equal((await download(env, 'deck', deck, NOW + 16 * 60 * 1000)).status, 410, 'expired');
  assert.equal((await download(env, 'nope', deck, NOW)).status, 404);
});

test('unsubscribing is one step, needs a valid signature, suppresses the topic and records the withdrawal', async () => {
  const env = makeEnv();
  await subscribe(env, { email: 'a@b.co', topics: ['newsletter'], wording: 'nl-v1', source: '/' }, NOW);
  await confirm(env, tokenFrom(env.mailer.sent[0].text), NOW + 1000);
  const url = new URL(await unsubscribeUrl(env, 1, 'newsletter'));
  const { searchParams: p } = url;
  assert.equal((await unsubscribe(env, p.get('s'), p.get('topic'), 'bad-signature', NOW + 2000)).status, 400);
  assert.equal((await unsubscribe(env, p.get('s'), 'report-updates', p.get('sig'), NOW + 2000)).status, 400, 'the signature covers the topic');
  assert.equal((await unsubscribe(env, p.get('s'), p.get('topic'), p.get('sig'), NOW + 2000)).status, 200);
  assert.equal(count(env, "SELECT COUNT(*) AS n FROM suppressions WHERE topic = 'newsletter' AND email_hash = ?", await sha256('a@b.co')), 1);
  assert.equal(count(env, 'SELECT COUNT(*) AS n FROM consents WHERE withdrawn_at IS NOT NULL'), 1);
  assert.equal((await unsubscribe(env, p.get('s'), p.get('topic'), p.get('sig'), NOW + 3000)).status, 200, 'doing it twice is harmless');
});

test('a fresh confirmed opt-in lifts an earlier unsubscribe from that topic only', async () => {
  const env = makeEnv();
  const email = 'a@b.co', hash = await sha256(email);
  await subscribe(env, { email, topics: ['newsletter', 'report-updates'], wording: 'v1', source: '/' }, NOW);
  await confirm(env, tokenFrom(env.mailer.sent[0].text), NOW + 1000);
  const all = new URL(await unsubscribeUrl(env, 1, '*')).searchParams;
  await unsubscribe(env, all.get('s'), '*', all.get('sig'), NOW + 2000);
  assert.equal(count(env, 'SELECT COUNT(*) AS n FROM suppressions WHERE email_hash = ?', hash), 4);
  await subscribe(env, { email, topics: ['newsletter'], wording: 'v1', source: '/' }, NOW + 3 * HOUR);
  await confirm(env, tokenFrom(env.mailer.sent.at(-1).text), NOW + 3 * HOUR + 1000);
  assert.equal(count(env, "SELECT COUNT(*) AS n FROM suppressions WHERE email_hash = ? AND topic = 'newsletter'", hash), 0);
  assert.equal(count(env, "SELECT COUNT(*) AS n FROM suppressions WHERE email_hash = ? AND topic = 'report-updates'", hash), 1);
});

test('signup counts hold no address and survive the purge', async () => {
  const env = makeEnv();
  await subscribe(env, { email: 'a@b.co', topics: ['result', 'newsletter'], wordings: { newsletter: 'nl-1' }, source: '/check/', result: { score: 4, band: 'Halfway there', gaps: [2] } }, NOW);
  await confirm(env, tokenFrom(env.mailer.sent[0].text), NOW + 1000);
  await subscribe(env, { email: 'c@d.co', topics: ['download'], files: ['report'], source: '/' }, NOW + 2000); // never confirmed
  const rows = () => env.DB.raw.prepare('SELECT topic, source, asked, confirmed FROM counts ORDER BY topic').all().map(r => `${r.topic}|${r.source}|${r.asked}|${r.confirmed}`);
  const expected = ['download|/|1|0', 'newsletter|/check/|1|1', 'result|/check/|1|1'];
  assert.deepEqual(rows(), expected);
  await purge(env, NOW + 60 * DAY);
  assert.equal(count(env, "SELECT COUNT(*) AS n FROM subscribers WHERE email = 'c@d.co'"), 0, 'the unconfirmed address is gone');
  assert.deepEqual(rows(), expected, 'the counts are still there');
  const cols = env.DB.raw.prepare("PRAGMA table_info(counts)").all().map(c => c.name);
  assert.deepEqual(cols, ['day', 'topic', 'source', 'asked', 'confirmed'], 'no column could hold an address');
});

test('the purge deletes a transactional address after 30 days and an unconfirmed one after the link expires, but keeps live marketing consent and suppression hashes', async () => {
  const env = makeEnv();
  // transactional only, confirmed on day 0
  await subscribe(env, { email: 'tx@b.co', topics: ['result'], source: '/check/', result: { score: 2, band: 'Start with the basics', gaps: [1] } }, NOW);
  await confirm(env, tokenFrom(env.mailer.sent[0].text), NOW + 1000);
  // never confirmed
  await subscribe(env, { email: 'pending@b.co', topics: ['download'], files: ['report'], source: '/' }, NOW);
  // a newsletter subscriber who also asked for a result
  await subscribe(env, { email: 'keep@b.co', topics: ['newsletter', 'result'], wording: 'v1', source: '/check/', result: { score: 8, band: 'Strong foundations', gaps: [] } }, NOW);
  await confirm(env, tokenFrom(env.mailer.sent.find(m => m.to === 'keep@b.co').text), NOW + 1000);
  // an unsubscribed one
  await subscribe(env, { email: 'gone@b.co', topics: ['newsletter'], wording: 'v1', source: '/' }, NOW);
  await confirm(env, tokenFrom(env.mailer.sent.find(m => m.to === 'gone@b.co').text), NOW + 1000);
  const id = env.DB.raw.prepare("SELECT id FROM subscribers WHERE email = 'gone@b.co'").get().id;
  const u = new URL(await unsubscribeUrl(env, id, 'newsletter')).searchParams;
  await unsubscribe(env, u.get('s'), 'newsletter', u.get('sig'), NOW + 2000);

  const early = await purge(env, NOW + 10 * DAY);
  assert.equal(early.subscribers, 2, 'the pending one (link expired) and the unsubscribed one go; the 30 day window is still open for tx');
  assert.equal(count(env, "SELECT COUNT(*) AS n FROM subscribers WHERE email = 'tx@b.co'"), 1);
  const late = await purge(env, NOW + 31 * DAY);
  assert.equal(late.subscribers, 1, 'tx goes after 30 days');
  assert.equal(count(env, 'SELECT COUNT(*) AS n FROM subscribers'), 1, 'only the live newsletter subscriber is left');
  assert.equal(env.DB.raw.prepare('SELECT email FROM subscribers').get().email, 'keep@b.co');
  assert.equal(count(env, 'SELECT COUNT(*) AS n FROM suppressions'), 1, 'the suppression hash outlives the address');
  assert.equal(count(env, 'SELECT COUNT(*) AS n FROM tokens'), 0);
});
