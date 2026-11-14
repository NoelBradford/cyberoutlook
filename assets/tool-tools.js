/* Built by tools/build.py. Edit src/, not this file. */
/* --- src/core.js --- */
/* CyberOutlook interactive core.
   Everything a reader saves stays in their own browser (localStorage, "cv:" keys). Nothing is sent anywhere. */
window.CV = (function () {
  'use strict';
  var SITE = 'https://cyberoutlook.sbcsg.uk/';
  var TITLE = 'UK Small Business Cyber Outlook 2027';
  var PODCAST = 'https://podcast.thesmallbusinesscybersecurityguy.co.uk/';
  var AUTHOR_SITE = 'https://thesmallbusinesscybersecurityguy.co.uk';
  // Where to follow the podcast. Fill in a URL to show its button; empty ones are hidden.
  var FOLLOW = [
    { name: 'Apple Podcasts', url: '' },
    { name: 'Spotify', url: '' },
    { name: 'RSS feed', url: '' }
  ];
  // A "Follow the podcast" row: the apps that have links, the podcast site, and every upcoming episode as a calendar reminder.
  function followRow() {
    var now = today(), up = EPISODES.filter(function (e) { return parseDate(e.date) >= now; });
    var row = h('div', { class: 'follow' }, h('p', { class: 'follow-k' }, 'Follow the podcast'));
    var links = h('div', { class: 'cv-row' });
    FOLLOW.filter(function (f) { return f.url; }).forEach(function (f) { links.appendChild(h('a', { class: 'tool', href: f.url, rel: 'noopener', target: '_blank' }, f.name)); });
    links.appendChild(h('a', { class: 'tool primary', href: PODCAST, rel: 'noopener', target: '_blank' }, FOLLOW.some(function (f) { return f.url; }) ? 'Podcast site' : 'Follow on the podcast site'));
    if (up.length) links.appendChild(button('Put the next ' + (up.length === 1 ? 'episode' : up.length + ' episodes') + ' in my calendar', function () {
      ics(up.map(function (e) { return { title: 'New episode: ' + e.title, date: parseDate(e.date), description: 'The Small Business Cyber Security Guy, episode ' + e.n + '. Companion to the ' + TITLE + '.', url: PODCAST }; }), 'cyber-outlook-episodes.ics');
    }));
    row.appendChild(links);
    return row;
  }

  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('cv:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('cv:' + k, JSON.stringify(v)); } catch (e) {} emit('store', { key: k }); },
    del: function (k) { try { localStorage.removeItem('cv:' + k); } catch (e) {} emit('store', { key: k }); },
    keys: function () { var out = []; try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && (k.indexOf('cv:') === 0 || k.indexOf('cv-') === 0 || k === 'theme')) out.push(k); } } catch (e) {} return out; }
  };

  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.indexOf('on') === 0 && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, v);
    });
    for (var i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  }
  function append(el, kid) {
    if (kid == null || kid === false) return;
    if (Array.isArray(kid)) { kid.forEach(function (k) { append(el, k); }); return; }
    el.appendChild(typeof kid === 'string' ? document.createTextNode(kid) : kid);
  }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function on(name, fn) { document.addEventListener('cv:' + name, function (e) { fn(e.detail); }); }
  function emit(name, detail) { document.dispatchEvent(new CustomEvent('cv:' + name, { detail: detail })); }
  function toast(msg) { if (window.cvToast) window.cvToast(msg); }
  function text(el) { return (el && el.textContent || '').replace(/\s+/g, ' ').trim(); }
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function reduced() { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }

  function copy(str, okMsg) {
    function fallback() {
      var ta = h('textarea', { class: 'cv-offscreen', 'aria-hidden': 'true' }); ta.value = str; document.body.appendChild(ta);
      ta.select(); var ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
      ta.remove(); toast(ok ? (okMsg || 'Copied') : 'Select the text and copy it');
    }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(str).then(function () { toast(okMsg || 'Copied'); }, fallback);
    else fallback();
  }
  function download(name, mime, data) {
    var blob = data instanceof Blob ? data : new Blob([data], { type: mime });
    var url = URL.createObjectURL(blob);
    var a = h('a', { href: url, download: name, class: 'cv-offscreen' });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    toast('Downloaded ' + name);
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function icsDate(d) { return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()); }
  // events: [{title, date: Date (all-day), description, url}]
  function ics(events, name) {
    var now = new Date(), stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
    var fold = function (line) { var out = []; while (line.length > 74) { out.push(line.slice(0, 74)); line = ' ' + line.slice(74); } out.push(line); return out.join('\r\n'); };
    var clean = function (s) { return String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;'); };
    var lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//SBCSG//Cyber Outlook 2027//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
    events.forEach(function (ev, i) {
      var end = new Date(ev.date.getTime()); end.setDate(end.getDate() + 1);
      lines.push('BEGIN:VEVENT', 'UID:' + stamp + '-' + i + '@cyberoutlook.sbcsg.uk', 'DTSTAMP:' + stamp,
        'DTSTART;VALUE=DATE:' + icsDate(ev.date), 'DTEND;VALUE=DATE:' + icsDate(end),
        fold('SUMMARY:' + clean(ev.title)), fold('DESCRIPTION:' + clean((ev.description || '') + (ev.url ? '\n' + ev.url : ''))));
      if (ev.url) lines.push(fold('URL:' + ev.url));
      lines.push('END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    download(name || 'cyber-outlook.ics', 'text/calendar', lines.join('\r\n') + '\r\n');
  }

  // Accessible modal built on <dialog>. Returns {dialog, body, open(), close()}.
  function dialog(opts) {
    var d = h('dialog', { class: 'cv-dialog' + (opts.wide ? ' wide' : '') + (opts.cls ? ' ' + opts.cls : ''), 'aria-labelledby': opts.id + '-title', id: opts.id });
    var close = h('button', { type: 'button', class: 'cv-x', 'aria-label': 'Close' }, '\u00d7');
    var head = h('div', { class: 'cv-dialog-head' }, h('h2', { id: opts.id + '-title' }, opts.title), close);
    var body = h('div', { class: 'cv-dialog-body' });
    d.appendChild(head); d.appendChild(body);
    if (opts.note) d.appendChild(h('p', { class: 'cv-dialog-note' }, opts.note));
    document.body.appendChild(d);
    close.addEventListener('click', function () { d.close(); });
    d.addEventListener('click', function (e) { if (e.target === d) d.close(); });
    d.addEventListener('close', function () { document.documentElement.classList.remove('cv-modal-open'); if (opts.onclose) opts.onclose(); });
    return {
      dialog: d, body: body,
      // Focus starts on the title so screen readers announce what opened; tools that want a field focused do that after open().
      open: function () { if (opts.onopen) opts.onopen(body); if (!d.open) { d.showModal(); document.documentElement.classList.add('cv-modal-open'); var t = document.getElementById(opts.id + '-title'); if (t) { t.setAttribute('tabindex', '-1'); t.focus(); } } },
      close: function () { d.close(); }
    };
  }
  function button(label, fn, cls) { return h('button', { type: 'button', class: 'tool ' + (cls || ''), onclick: fn }, label); }
  function field(label, input) { var id = input.id || ('f-' + Math.random().toString(36).slice(2, 8)); input.id = id; return h('div', { class: 'cv-field' }, h('label', { for: id }, label), input); }

  // Data read from the report itself, so the tools never drift from the text.
  function actions() {
    var out = [];
    $$('table.actions').forEach(function (t, ti) {
      var theme = ti + 1;
      $$('tbody tr', t).forEach(function (tr, ri) {
        var c = tr.children;
        out.push({ id: 't' + theme + '-' + (ri + 1), theme: theme, text: text(c[0]), spend: text(c[1]), effort: text(c[2]), row: tr });
      });
    });
    return out;
  }
  var THEMES = { 1: "Other people's problems become yours", 2: 'AI in the back office', 3: 'Crime gets cheaper and faster' };
  var EPISODES = [
    { n: 1, title: 'Knocked over by somebody else\u2019s breach', date: '2026-11-02', section: 'theme-1' },
    { n: 2, title: 'Four questions for your IT provider', date: '2026-11-09', section: 'theme-1' },
    { n: 3, title: 'Shadow AI and the poisoned inbox', date: '2026-11-16', section: 'theme-2' },
    { n: 4, title: 'The weekend-built tool, and Dave with a subscription', date: '2026-11-23', section: 'theme-2' },
    { n: 5, title: 'The deepfake director', date: '2026-11-30', section: 'theme-3' },
    { n: 6, title: 'Exploited within days: the closing patch window', date: '2026-12-07', section: 'theme-3' },
    { n: 7, title: 'Cyber Essentials after Danzell', date: '2026-12-14', section: 'rules' },
    { n: 8, title: 'The Bill, your IT provider, and your next contract', date: '2026-12-21', section: 'rules' },
    { n: 9, title: 'Your plan on one sheet of A4', date: '2026-12-28', section: 'mvc' }
  ];
  function parseDate(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function today() { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function fmtDate(d) { return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); }

  // Toolbar slot on the cover: features add buttons here.
  function toolbar() { return $('.cover .tools'); }
  function addTool(el, before) { var t = toolbar(); if (!t) return; if (before) t.insertBefore(el, t.firstChild); else t.insertBefore(el, $('#themeToggle', t)); }

  // Run feature code after the page is ready, without blocking first paint.
  // Features start in order, in small slices when the browser is idle, so no single long task blocks taps and scrolling.
  var queue = [], scheduled = false;
  var idle = window.requestIdleCallback || function (cb) { return setTimeout(function () { cb({ didTimeout: true, timeRemaining: function () { return 0; } }); }, 1); };
  function pump(deadline) {
    scheduled = false;
    var start = Date.now();
    while (queue.length && (deadline.timeRemaining() > 3 || (deadline.didTimeout && Date.now() - start < 12))) {
      var fn = queue.shift();
      try { fn(); } catch (e) { if (window.console) console.warn('CV feature failed', e); }
    }
    if (queue.length) schedule(); else emit('ready');
  }
  function schedule() { if (scheduled) return; scheduled = true; idle(pump, { timeout: 600 }); }
  function ready(fn) {
    queue.push(fn);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule); else schedule();
  }

  return { SITE: SITE, TITLE: TITLE, PODCAST: PODCAST, AUTHOR_SITE: AUTHOR_SITE, FOLLOW: FOLLOW, followRow: followRow, store: store, h: h, $: $, $$: $$, on: on, emit: emit, toast: toast,
    text: text, slug: slug, esc: esc, reduced: reduced, copy: copy, download: download, ics: ics, dialog: dialog, button: button, field: field,
    actions: actions, THEMES: THEMES, EPISODES: EPISODES, parseDate: parseDate, today: today, fmtDate: fmtDate, addTool: addTool, ready: ready };
})();

/* --- standalone page flag (tools/build.py) --- */
CV.standalone = true;

/* --- src/pages/config.json (generated by tools/build.py) --- */
CV.config = {"captureEndpoint":"","privacyUrl":"","wording":{}};

/* --- src/pages/standalone.js --- */
// Helpers for tool pages only. tools/build.py adds this to each tool bundle straight after the CV.standalone flag,
// and never to assets/app.js, so the report does not carry it.

// A host for a tool that opens in a dialog on the report. It has the same shape as CV.dialog (body, open, close) and the hooks
// other features look for: an element with the dialog's id, a .cv-dialog-body inside it, and close() on the element.
// opts: id, label (accessible name), note (small print under the tool).
CV.inlineHost = function (opts) {
  var el = CV.h('section', { id: opts.id, class: 'cv-inline', 'aria-label': opts.label, hidden: true });
  var body = CV.h('div', { class: 'cv-dialog-body' });
  el.appendChild(body);
  if (opts.note) el.appendChild(CV.h('p', { class: 'cv-dialog-note' }, opts.note));
  el.close = function () {};
  (CV.$('#tool-root') || document.body).appendChild(el);
  // Like CV.dialog, opening runs opts.onopen(body) first (a tool that draws itself when opened).
  return { dialog: el, body: body, open: function () { if (opts.onopen) opts.onopen(body); el.hidden = false; }, close: function () {} };
};

// Printing one generated sheet on its own. The report gets this from the call-back poster feature, which a tool page may not load.
// A feature that defines CV.printSheet itself replaces this with the same thing.
CV.printSheet = function (el) {
  CV.$$('.cv-sheet').forEach(function (n) { n.remove(); });
  el.classList.add('cv-sheet'); document.body.appendChild(el);
  document.body.classList.add('print-sheet');
  setTimeout(function () { window.print(); }, 60);
};
window.addEventListener('afterprint', function () { document.body.classList.remove('print-sheet'); });

// There is no report on this page to scroll to, so "go to this action" opens the report at it. 108-exposure-check replaces this.
CV.goToAction = function (id) { location.href = '../#act-' + id; };
