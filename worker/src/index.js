// HTTP layer for the email Worker. Routes sit under /api/ on the same origin as the site, so the page's Content-Security-Policy
// (connect-src 'self') does not need to change. Not deployed, and not called by any page yet.
import { subscribe, confirm, download, unsubscribe, purge } from './core.js';
import { cloudflareMailer } from './mailer.js';

const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const page = (title, html, status = 200) => new Response(`<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title><style>body{font:1.05rem/1.5 system-ui,sans-serif;max-width:36rem;margin:3rem auto;padding:0 1rem}a{color:#0d5b60}</style></head><body><h1>${title}</h1>${html}</body></html>`, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'self'" } });
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

async function turnstileOk(env, token, ip) {
  if (!env.TURNSTILE_SECRET) return true; // not configured: the form still works, with the per-address limit as the only brake
  const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: String(token || ''), remoteip: ip || '' }) });
  return !!(await r.json()).success;
}

export default {
  async fetch(request, env0) {
    const env = { ...env0, mailer: env0.mailer || cloudflareMailer(env0) };
    const url = new URL(request.url), path = url.pathname;
    try {
      if (path === '/api/subscribe' && request.method === 'POST') {
        // Only our own pages may post, and only JSON (so a plain HTML form on another site cannot).
        if (request.headers.get('Origin') !== env.SITE || !(request.headers.get('Content-Type') || '').startsWith('application/json')) return json({ error: 'Not allowed.' }, 403);
        const body = await request.json();
        if (!(await turnstileOk(env, body.turnstile, request.headers.get('CF-Connecting-IP')))) return json({ error: 'Please try again.' }, 400);
        const r = await subscribe(env, body);
        return json(r.error ? { error: r.error } : { ok: true }, r.status);
      }
      if (path === '/api/confirm' && request.method === 'GET') {
        const r = await confirm(env, url.searchParams.get('t'));
        if (r.error) return page('Link expired', `<p>${esc(r.error)}</p><p><a href="${esc(env.SITE)}">Back to the report</a></p>`, r.status);
        const links = r.downloads.map(d => `<li><a href="${esc(d.url)}" download>${esc(d.name)}</a></li>`).join('');
        return page('Thank you', `<p>Your address is confirmed.</p>${links ? `<p>Your download${r.downloads.length > 1 ? 's' : ''} (each link works once, for 15 minutes):</p><ul>${links}</ul>` : ''}${r.sent.length ? '<p>We have emailed you the rest.</p>' : ''}<p><a href="${esc(env.SITE)}">Back to the report</a></p>`);
      }
      const dl = path.match(/^\/api\/download\/([a-z]+)$/);
      if (dl && request.method === 'GET') {
        const r = await download(env, dl[1], url.searchParams.get('t'));
        if (r.status !== 200) return page('Download', `<p>${esc(r.error || 'Not found.')}</p>`, r.status);
        return new Response(r.body, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${r.name}"`, 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex' } });
      }
      if (path === '/api/unsubscribe') {
        const s = url.searchParams.get('s'), topic = url.searchParams.get('topic'), sig = url.searchParams.get('sig');
        if (request.method === 'POST') { const r = await unsubscribe(env, s, topic, sig); return r.error ? json({ error: r.error }, r.status) : json({ ok: true }); } // RFC 8058 one-click
        if (request.method === 'GET') { // a person following the link: confirm with one button, no account
          return page('Unsubscribe', `<p>Stop these emails?</p><form method="post" action="/api/unsubscribe?s=${esc(s)}&amp;topic=${esc(topic)}&amp;sig=${esc(sig)}"><button type="submit">Unsubscribe</button></form>`);
        }
      }
      return json({ error: 'Not found.' }, 404);
    } catch (e) {
      console.error('email worker error', e && e.message);
      return json({ error: 'Something went wrong. Please try again.' }, 500);
    }
  },
  // Daily (see wrangler.toml): delete what has outlived its purpose.
  async scheduled(event, env0) {
    const env = { ...env0, mailer: env0.mailer || cloudflareMailer(env0) };
    console.log('purge', JSON.stringify(await purge(env)));
  },
};
