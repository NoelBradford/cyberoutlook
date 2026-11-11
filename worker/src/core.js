// Core logic for the email Worker. No Cloudflare imports: everything it needs comes in through `env`, so it can be tested on plain SQLite.
//   env.DB      D1 (prepare, bind, first, all, run)
//   env.FILES   R2 bucket holding the gated PDFs (get)
//   env.mailer  { send({ to, subject, text, headers }) }, one implementation per provider
//   env.SECRET  signing key for unsubscribe links
//   env.SITE    origin of the site, for example https://cyberoutlook.sbcsg.uk
// Nothing here is wired into the site or deployed. See worker/README.md.

export const HOUR = 3600 * 1000, DAY = 24 * HOUR;
export const TOPICS = {
  result: { marketing: false },            // the check result by email: transactional, address kept 30 days
  download: { marketing: false },          // a link to a gated PDF: transactional, address kept 30 days
  newsletter: { marketing: true },         // needs its own unticked box and wording
  'report-updates': { marketing: true },   // "email me when the report is updated": the same
};
export const FILES = {
  report: { key: 'UK-Small-Business-Cyber-Outlook-2027.pdf', name: 'UK-Small-Business-Cyber-Outlook-2027.pdf' },
  deck: { key: 'CyberOutlook2027_LinkedIn_Carousel.pdf', name: 'CyberOutlook2027_LinkedIn_Carousel.pdf' },
};
const BANDS = ['Strong foundations', 'Halfway there', 'Start with the basics'];
const CONFIRM_TTL = 48 * HOUR, DOWNLOAD_TTL = 15 * 60 * 1000, KEEP_TRANSACTIONAL = 30 * DAY, MAX_CONFIRMS_PER_HOUR = 3;

const enc = new TextEncoder();
export const b64url = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
export async function sha256(text) { return b64url(await crypto.subtle.digest('SHA-256', enc.encode(text))); }
export const newToken = () => b64url(crypto.getRandomValues(new Uint8Array(32)));
async function hmac(secret, text) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64url(await crypto.subtle.sign('HMAC', key, enc.encode(text)));
}
export function cleanEmail(raw) {
  const e = String(raw || '').trim().toLowerCase();
  return e.length <= 254 && /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/.test(e) ? e : null;
}
const q = (env, sql, ...args) => env.DB.prepare(sql).bind(...args);

// ---- links the emails carry ------------------------------------------------------------------------------------------
export async function unsubscribeUrl(env, subscriberId, topic) {
  const sig = await hmac(env.SECRET, `unsub|${subscriberId}|${topic}`);
  return `${env.SITE}/api/unsubscribe?s=${subscriberId}&topic=${encodeURIComponent(topic)}&sig=${sig}`;
}
const marketingHeaders = async (env, id, topic) => { const u = await unsubscribeUrl(env, id, topic); return { 'List-Unsubscribe': `<${u}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' }; };

// ---- 1. a form is submitted: record the request and send a confirmation, nothing more -------------------------------
// body: { email, topics: [...], source, wording, files?: ['report','deck'], result?: { score, band, gaps: [...] } }
// The answer never says whether the address was already known.
export async function subscribe(env, body, now = Date.now()) {
  const email = cleanEmail(body.email);
  if (!email) return { status: 400, error: 'Enter a valid email address.' };
  const topics = Array.isArray(body.topics) ? [...new Set(body.topics)] : [];
  if (!topics.length || topics.some(t => !TOPICS[t])) return { status: 400, error: 'Choose what you want us to send.' };
  const source = String(body.source || '').slice(0, 60);
  if (!/^\/[a-z0-9\-/]*$/.test(source)) return { status: 400, error: 'Unknown page.' };
  const wording = String(body.wording || '').slice(0, 40);
  // A marketing topic only counts if the box was ticked, which means the page sent it, with the id of the wording it showed.
  if (topics.some(t => TOPICS[t].marketing) && !/^[a-z0-9\-.]{2,40}$/.test(wording)) return { status: 400, error: 'Consent wording is missing.' };
  const files = topics.includes('download') ? (Array.isArray(body.files) ? [...new Set(body.files)] : []) : [];
  if (topics.includes('download') && (!files.length || files.some(f => !FILES[f]))) return { status: 400, error: 'Choose a file.' };
  let result = null;
  if (topics.includes('result')) {
    const r = body.result || {};
    const gaps = Array.isArray(r.gaps) ? r.gaps : [];
    if (!Number.isInteger(r.score) || r.score < 0 || r.score > 10 || !BANDS.includes(r.band) || gaps.length > 10 || gaps.some(g => !Number.isInteger(g) || g < 1 || g > 10)) return { status: 400, error: 'The result is not valid.' };
    result = { score: r.score, band: r.band, gaps: [...new Set(gaps)].sort((a, b) => a - b) };
  }
  const hash = await sha256(email);
  await q(env, 'INSERT OR IGNORE INTO subscribers (email, email_hash, created_at) VALUES (?, ?, ?)', email, hash, now).run();
  const sub = await q(env, 'SELECT id FROM subscribers WHERE email_hash = ?', hash).first();
  const recent = await q(env, "SELECT COUNT(*) AS n FROM tokens WHERE subscriber_id = ? AND purpose = 'confirm' AND created_at > ?", sub.id, now - HOUR).first();
  if (recent.n >= MAX_CONFIRMS_PER_HOUR) return { status: 200, ok: true }; // looks the same, sends nothing
  for (const topic of topics) await q(env, 'INSERT INTO consents (subscriber_id, topic, wording, source, asked_at) VALUES (?, ?, ?, ?, ?)', sub.id, topic, TOPICS[topic].marketing ? wording : '-', source, now).run();
  const token = newToken();
  await q(env, 'INSERT INTO tokens (token_hash, purpose, subscriber_id, payload, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
    await sha256(token), 'confirm', sub.id, JSON.stringify({ topics, files, result, source }), now, now + CONFIRM_TTL).run();
  const link = `${env.SITE}/api/confirm?t=${token}`;
  await env.mailer.send({
    to: email,
    subject: 'Confirm your email address',
    text: `You (or someone using this address) asked ${env.SENDER_NAME} for ${describe(topics, files)} on ${env.SITE}${source}.\n\nTo confirm, open this link within 48 hours:\n${link}\n\nIf this was not you, ignore this email and nothing will be sent. We do not keep the address once the request has run its course.\n\n${env.SENDER_NAME}\n${env.SENDER_ADDRESS}`,
  });
  return { status: 200, ok: true };
}
function describe(topics, files) {
  const bits = [];
  if (topics.includes('result')) bits.push('your exposure check result');
  if (topics.includes('download')) bits.push(`a download link for ${files.map(f => (f === 'report' ? 'the full report' : 'the slide deck')).join(' and ')}`);
  if (topics.includes('newsletter')) bits.push('the newsletter');
  if (topics.includes('report-updates')) bits.push('an email when the report is updated');
  return bits.join(', ');
}

// ---- 2. the link in the confirmation email is opened ------------------------------------------------------------------
// Consumes the token once. Returns what to show: download links (each single use, 15 minutes) and a note on what was sent.
export async function confirm(env, token, now = Date.now()) {
  const row = await q(env, "SELECT * FROM tokens WHERE token_hash = ? AND purpose = 'confirm'", await sha256(String(token || ''))).first();
  if (!row || row.used_at || row.expires_at < now) return { status: 410, error: 'This link has expired or was already used. Ask for a new one.' };
  await q(env, 'UPDATE tokens SET used_at = ? WHERE token_hash = ? AND used_at IS NULL', now, row.token_hash).run();
  const { topics, files, result } = JSON.parse(row.payload);
  const sub = await q(env, 'SELECT id, email, email_hash FROM subscribers WHERE id = ?', row.subscriber_id).first();
  for (const topic of topics) {
    await q(env, 'UPDATE consents SET confirmed_at = ? WHERE subscriber_id = ? AND topic = ? AND confirmed_at IS NULL AND asked_at <= ?', now, sub.id, topic, row.created_at).run();
    // a fresh, confirmed opt-in lifts an earlier unsubscribe from that topic
    if (TOPICS[topic].marketing) await q(env, 'DELETE FROM suppressions WHERE email_hash = ? AND topic = ?', sub.email_hash, topic).run();
  }
  const out = { status: 200, downloads: [], sent: [] };
  for (const f of files) {
    const t = newToken();
    await q(env, 'INSERT INTO tokens (token_hash, purpose, subscriber_id, payload, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)', await sha256(t), 'download', sub.id, JSON.stringify({ file: f }), now, now + DOWNLOAD_TTL).run();
    out.downloads.push({ file: f, name: FILES[f].name, url: `${env.SITE}/api/download/${f}?t=${t}` });
  }
  if (result) {
    const gaps = result.gaps.length ? `Questions with a gap: ${result.gaps.join(', ')}.` : 'No gaps.';
    await env.mailer.send({
      to: sub.email,
      subject: `Your exposure check result: ${result.score} out of 10`,
      text: `You scored ${result.score} out of 10: ${result.band}.\n${gaps}\n\nYour answers and your gaps in order are saved in the browser you used. Open ${env.SITE}/check/ there to see them, or turn them into a plan at ${env.SITE}/plan/.\n\nThis is a one-off email you asked for. It is not marketing, and we will not use your address for anything else unless you ticked another box.\n\n${env.SENDER_NAME}\n${env.SENDER_ADDRESS}`,
    });
    out.sent.push('result');
  }
  for (const topic of topics.filter(t => TOPICS[t].marketing)) {
    await env.mailer.send({
      to: sub.email,
      subject: topic === 'newsletter' ? 'You are on the newsletter list' : 'You will be told when the report is updated',
      text: `You confirmed: ${describe([topic], [])}. You can stop any time with one click:\n${await unsubscribeUrl(env, sub.id, topic)}\n\n${env.SENDER_NAME}\n${env.SENDER_ADDRESS}`,
      headers: await marketingHeaders(env, sub.id, topic),
    });
    out.sent.push(topic);
  }
  return out;
}

// ---- 3. a gated file is fetched ---------------------------------------------------------------------------------------
export async function download(env, file, token, now = Date.now()) {
  if (!FILES[file]) return { status: 404 };
  const row = await q(env, "SELECT * FROM tokens WHERE token_hash = ? AND purpose = 'download'", await sha256(String(token || ''))).first();
  if (!row || row.used_at || row.expires_at < now || JSON.parse(row.payload).file !== file) return { status: 410, error: 'This download link has expired or was already used.' };
  const obj = await env.FILES.get(FILES[file].key);
  if (!obj) return { status: 404 };
  await q(env, 'UPDATE tokens SET used_at = ? WHERE token_hash = ? AND used_at IS NULL', now, row.token_hash).run();
  return { status: 200, body: obj.body, name: FILES[file].name };
}

// ---- 4. unsubscribe: one click, no account, applied at once ------------------------------------------------------------
export async function unsubscribe(env, subscriberId, topic, sig, now = Date.now()) {
  const id = Number(subscriberId);
  if (!Number.isInteger(id) || !(topic === '*' || TOPICS[topic]) || sig !== await hmac(env.SECRET, `unsub|${id}|${topic}`)) return { status: 400, error: 'This unsubscribe link is not valid.' };
  const sub = await q(env, 'SELECT email_hash FROM subscribers WHERE id = ?', id).first();
  if (!sub) return { status: 200, ok: true }; // already deleted: nothing to do, and the hash may already be on the list
  const topics = topic === '*' ? Object.keys(TOPICS) : [topic];
  for (const t of topics) {
    await q(env, 'INSERT OR REPLACE INTO suppressions (email_hash, topic, at) VALUES (?, ?, ?)', sub.email_hash, t, now).run();
    await q(env, 'UPDATE consents SET withdrawn_at = ? WHERE subscriber_id = ? AND topic = ? AND withdrawn_at IS NULL', now, id, t).run();
  }
  return { status: 200, ok: true };
}

// ---- 5. the daily purge: nothing is kept longer than its purpose -------------------------------------------------------
// Removes expired links, unconfirmed requests older than the link's life, and an address whose only topics are transactional
// 30 days after it was confirmed. An address with an active marketing consent stays. Suppression hashes stay.
export async function purge(env, now = Date.now()) {
  const gone = { tokens: 0, subscribers: 0 };
  gone.tokens = (await q(env, 'DELETE FROM tokens WHERE expires_at < ?', now - DAY).run()).meta.changes;
  const subs = (await q(env, 'SELECT id FROM subscribers').all()).results;
  for (const { id } of subs) {
    const c = (await q(env, 'SELECT topic, confirmed_at, withdrawn_at, asked_at FROM consents WHERE subscriber_id = ?', id).all()).results;
    const liveMarketing = c.some(x => TOPICS[x.topic].marketing && x.confirmed_at && !x.withdrawn_at);
    if (liveMarketing) continue;
    const openRequest = c.some(x => !x.confirmed_at && x.asked_at > now - CONFIRM_TTL);
    // Only a transactional request that is still within its 30 days keeps the address. A withdrawn marketing consent does not.
    const lastTransactional = Math.max(0, ...c.filter(x => x.confirmed_at && !TOPICS[x.topic].marketing).map(x => x.confirmed_at));
    const transactionalWindowOpen = lastTransactional && lastTransactional > now - KEEP_TRANSACTIONAL;
    if (openRequest || transactionalWindowOpen) continue;
    await q(env, 'DELETE FROM subscribers WHERE id = ?', id).run(); // consents and tokens go with it (ON DELETE CASCADE)
    gone.subscribers++;
  }
  return gone;
}
