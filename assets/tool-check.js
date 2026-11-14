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

/* --- src/features/108-exposure-check.js --- */
// Two-minute exposure check: ten yes / not sure / no questions built from the report's own actions.
// Benchmarks quote only figures the report cites (CSBS 2025/26, source 1).
CV.ready(function () {
  var A = CV.actions();
  A.forEach(function (a) { if (!a.row.id) a.row.id = 'act-' + a.id; });
  CV.actionById = function (id) { for (var i = 0; i < A.length; i++) if (A[i].id === id) return A[i]; return null; };
  CV.goToAction = function (id) {
    if (CV.standalone) { location.href = '../#act-' + id; return; } // no report on this page: open it at the action
    var a = CV.actionById(id); if (!a) return;
    a.row.scrollIntoView({ block: 'center', behavior: CV.reduced() ? 'auto' : 'smooth' });
    a.row.classList.remove('cv-flash'); void a.row.offsetWidth; a.row.classList.add('cv-flash');
  };
  var Q = [
    { q: 'Is multi-factor authentication switched on for email and every other cloud service?', act: 't3-1' },
    { q: 'Do you have a call-back rule for any change to bank details or an urgent payment request?', act: 't1-3' },
    { q: 'Have you asked your IT provider the four questions in this report?', act: 't1-2' },
    { q: 'Have you listed your five key suppliers and customers, and what stops if each disappears for two weeks?', act: 't1-1',
      bench: 'Only 12% of micro firms and 22% of small ones have reviewed the cyber risks from their immediate suppliers.' },
    { q: 'Do you have a written list of the AI tools your team uses and what data each can reach?', act: 't2-1',
      bench: 'Of businesses using, adopting or considering AI, only 24% have any practice in place to manage the risk.' },
    { q: 'Are automatic updates switched on for every laptop and phone?', act: 't3-2' },
    { q: 'Do you have a backup ransomware can’t reach, and have you tested a restore in the last three months?', act: 't3-5' },
    { q: 'Do you have a written plan for what happens in a cyber incident?', go: '#mvc', goLabel: 'Fill in the one-page plan', planAct: 'p-plan',
      bench: 'Only 21% of micro firms have a formal incident response plan.' },
    { q: 'Is one named person, the owner or a director, responsible for cyber security?', go: '#mvc', goLabel: 'Name them on the one-page plan', planAct: 'p-owner',
      bench: 'Just 29% of micro firms have a board member or owner with named responsibility for cyber security.' },
    { q: 'Do you know what personal data you hold, where it lives and who can reach it?', act: 't3-6' }
  ];
  var saved = CV.store.get('check', {});
  var SA = !!CV.standalone; // a page of its own (/check/): render inline in <main> instead of in a modal
  var NOTE = 'Your answers stay in this browser. Benchmarks are from the Cyber Security Breaches Survey 2025/26 [source 1].';
  var NOTE_PAGE = 'Benchmarks are from the Cyber Security Breaches Survey 2025/26 [source 1].'; // the page's own promise sits beside question 1
  // CV.inlineHost (src/pages/standalone.js) has the same shape as CV.dialog and the hooks 111-check-to-plan looks for.
  var d = SA ? CV.inlineHost({ id: 'check', label: 'Two-minute exposure check', note: NOTE_PAGE }) : CV.dialog({ id: 'check', title: 'Two-minute exposure check', wide: true, note: NOTE });
  var H = SA ? 'h2' : 'h3'; // the page already has an h1
  function intro(show) { var i = CV.$('.page-intro'); if (i) i.hidden = !show; }
  // The 'what you get' rows and the survey figure are for before and during the check; the result replaces them.
  // The scale behind the page: one bar per question. It fills as you answer and shows your score at the end.
  function scale(n) { CV.$$('.entry-scale i').forEach(function (b, i) { b.classList.toggle('on', i < n); }); }
  function entry(show) { CV.$$('.entry-gets, .entry-stat').forEach(function (e) { e.hidden = !show; }); var m = CV.$('main'); if (m) m.classList.toggle('is-done', !show); }
  var step = 0;
  function answers() { return saved.a || {}; }
  function save() { CV.store.set('check', saved); CV.emit('check', saved); }
  function renderQ() {
    var b = d.body; b.innerHTML = '';
    var item = Q[step], a = answers()[step];
    var fresh = step === 0 && !Object.keys(answers()).length;
    // On the page itself the intro sits above question 1 only, and question 1 is there on arrival: no Start gate.
    // With the entry layout the intro stays put through the questions, so the page does not jump; it goes at the result.
    if (SA) { intro(fresh || !!CV.$('.entry-gets')); entry(true); scale(Object.keys(answers()).length); }
    if (SA && fresh) b.appendChild(CV.h('p', { class: 'qz-promise' }, 'Nothing you enter leaves your browser.'));
    if (SA && resumed) b.appendChild(CV.h('p', { class: 'qz-promise' }, 'Picking up where you left off. ',
      CV.button('Start again', function () { saved = {}; save(); step = 0; resumed = false; renderQ(); })));
    var bar = CV.h('div', { class: 'qz-bar', 'aria-hidden': 'true' }, CV.h('span', { style: 'width:' + (step / Q.length * 100) + '%' }));
    b.appendChild(CV.h('p', { class: 'cv-kicker' }, 'Question ' + (step + 1) + ' of ' + Q.length));
    b.appendChild(bar);
    var legend = CV.h('legend', { tabindex: '-1', id: 'qz-legend' }, item.q);
    var fs = CV.h('fieldset', { class: 'qz-q' }, legend);
    // Advance automatically only for a pointer tap or click. Arrow keys change the answer too, and must not move on.
    var tapped = false;
    fs.addEventListener('pointerdown', function () { tapped = true; });
    fs.addEventListener('keydown', function () { tapped = false; });
    var nextBtn = CV.button(step === Q.length - 1 ? 'See my result' : 'Next →', next, 'primary');
    nextBtn.disabled = !a;
    [['yes', 'Yes'], ['unsure', 'Not sure'], ['no', 'No']].forEach(function (o) {
      var id = 'qz-' + step + '-' + o[0];
      var input = CV.h('input', { type: 'radio', name: 'qz-' + step, id: id, value: o[0] });
      if (a === o[0]) input.checked = true;
      input.addEventListener('change', function () { saved.a = answers(); saved.a[step] = o[0]; save(); nextBtn.disabled = false; if (tapped) { var at = step; setTimeout(function () { if (step === at) next(); }, CV.reduced() ? 0 : 220); } });
      fs.appendChild(CV.h('div', { class: 'qz-opt' }, input, CV.h('label', { for: id }, o[1])));
    });
    b.appendChild(fs);
    var nav = CV.h('div', { class: 'cv-row qz-nav' });
    if (step > 0) nav.appendChild(CV.button('← Back', function () { step--; focusQ = true; renderQ(); }));
    nav.appendChild(nextBtn);
    b.appendChild(nav);
    // Focus the question itself so screen readers announce it; the answers follow in tab order.
    // Arriving on the page is not an action, so leave focus where the browser put it; every later step moves it.
    if (focusQ) legend.focus(); else if (!quiet) { var first = fs.querySelector('input:checked') || fs.querySelector('input'); if (first) first.focus(); }
    focusQ = false; quiet = false; resumed = false;
  }
  var focusQ = false, quiet = false, resumed = false;
  function next() { if (!answers()[step]) return; if (step < Q.length - 1) { step++; focusQ = true; renderQ(); } else renderResult(); }
  function score() { var s = 0, ans = answers(); Object.keys(ans).forEach(function (k) { if (ans[k] === 'yes') s++; }); return s; }
  CV.checkScore = function () { var ans = answers(); return Object.keys(ans).length === Q.length ? score() : null; };
  CV.checkGaps = function () { var ans = answers(); return Q.map(function (x, i) { return { i: i, q: x, a: ans[i] }; }).filter(function (g) { return g.a && g.a !== 'yes'; }); };
  function band(s) { return s >= 8 ? ['Strong foundations', 'You’ve done most of what this report asks. Close the last gaps and test your plan.']
    : s >= 4 ? ['Halfway there', 'The basics are partly in place. The gaps below are mostly free to fix.']
    : ['Start with the basics', 'Most of what’s missing costs nothing but an afternoon. Start at the top of the list below.']; }
  function renderResult() {
    if (SA) { intro(false); entry(false); scale(score()); }
    var b = d.body; b.innerHTML = ''; var s = score(), bd = band(s);
    saved.done = true; save();
    b.appendChild(CV.h('div', { class: 'qz-result' },
      CV.h('div', { class: 'qz-score', 'aria-label': s + ' out of ' + Q.length }, CV.h('b', null, String(s)), CV.h('span', null, '/ ' + Q.length)),
      CV.h('div', null, CV.h('p', { class: 'cv-kicker' }, 'Your result'), CV.h(H, null, bd[0]), CV.h('p', null, bd[1]))));
    var gaps = CV.checkGaps();
    if (gaps.length) {
      b.appendChild(CV.h(H, { class: 'qz-h' }, 'Your gaps, in order'));
      var ol = CV.h('ol', { class: 'qz-gaps' });
      gaps.forEach(function (g) {
        var li = CV.h('li', null, CV.h('p', null, g.q.q + ' ', CV.h('span', { class: 'qz-ans qz-' + g.a }, g.a === 'no' ? 'No' : 'Not sure')));
        if (g.q.bench) li.appendChild(CV.h('p', { class: 'qz-bench' }, g.q.bench + ' [1]'));
        if (SA) { li.appendChild(standaloneGapRow(g)); ol.appendChild(li); return; }
        var go = g.q.act ? CV.button('Show the action →', function () { d.close(); CV.goToAction(g.q.act); backPill(); })
          : CV.button((g.q.goLabel || 'Go') + ' →', function () { d.close(); location.hash = g.q.go; backPill(); });
        li.appendChild(CV.h('div', { class: 'cv-row' }, go));
        ol.appendChild(li);
      });
      b.appendChild(ol);
    } else b.appendChild(CV.h('p', null, 'No gaps. Print the one-page plan and run a one-hour tabletop against it.'));
    b.appendChild(CV.h('div', { class: 'cv-row qz-nav' }, CV.button(SA ? 'Retake' : 'Start again', function () { saved = {}; save(); step = 0; focusQ = SA; renderQ(); }),
      SA ? CV.h('a', { class: 'tool', href: '../' }, 'Read the full report') : null));
    var rh = b.querySelector('.qz-result ' + H); if (rh) { rh.setAttribute('tabindex', '-1'); rh.focus(); }
    CV.emit('check-result', { score: s, gaps: gaps });
  }
  // A standalone result has no report to jump around in: each gap links to where the report explains it, and can go in My plan.
  var planSyncs = [];
  if (SA) CV.on('plan', function () { planSyncs.forEach(function (f) { f(); }); });
  function standaloneGapRow(g) {
    var row = CV.h('div', { class: 'cv-row' });
    row.appendChild(CV.h('a', { class: 'tool', href: g.q.act ? '../#act-' + g.q.act : '../' + g.q.go }, 'Why this matters'));
    var pid = g.q.act || g.q.planAct;
    if (pid && CV.plan && CV.plan.byId[pid]) {
      var btn = CV.h('button', { type: 'button', class: 'tool qz-add' });
      var sync = function () { var on = CV.plan.has(pid); btn.textContent = on ? '✓ In My plan' : 'Add to My plan'; btn.setAttribute('aria-pressed', on ? 'true' : 'false'); btn.setAttribute('aria-label', (on ? 'Remove from My plan: ' : 'Add to My plan: ') + g.q.q); };
      btn.addEventListener('click', function () { if (CV.plan.has(pid)) CV.plan.remove(pid); else CV.plan.add(pid); });
      planSyncs.push(sync); sync(); row.appendChild(btn);
    }
    return row;
  }
  // Opening the check never throws away answers: a finished check shows its result, a half-finished one resumes.
  // Only "Start again" clears it.
  CV.openCheck = function () {
    if (pill) pill.remove();
    planSyncs.length = 0;
    if (saved.done) { d.open(); if (SA) intro(false); renderResult(); return; }
    var ans = answers(); step = 0; while (step < Q.length - 1 && ans[step]) step++;
    d.open();
    if (SA) { quiet = true; resumed = Object.keys(ans).length > 0; }
    renderQ();
  };
  // After jumping from a gap to its fix, offer a way back that doesn't rely on the browser's Back button.
  var pill = null;
  function backPill() {
    if (pill) pill.remove();
    pill = CV.h('div', { class: 'qz-back cv-noprint', role: 'region', 'aria-label': 'Exposure check' },
      CV.h('button', { type: 'button', class: 'qz-back-b', onclick: function () { CV.openCheck(); } }, '← Back to your results'),
      CV.h('button', { type: 'button', class: 'qz-back-x', 'aria-label': 'Hide', onclick: function () { pill.remove(); pill = null; } }, '×'));
    document.body.appendChild(pill);
  }
  // The check links on the cover and in Start here go to /check/ (UX-10), so they are left as plain links.
  if (saved.done) {
    var card = CV.$('.path[data-path="check"]');
    if (card) { card.querySelector('b').textContent = 'Your exposure check'; card.querySelector('.p-sub').textContent = 'See your result and your gaps again.'; }
    var cc = CV.$('.cc-btn'); if (cc) cc.textContent = 'See your check result';
  }
  // The cover carries the same scale: it fills as the check progresses and shows the score once it is done.
  if (!SA) { var coverScale = function () { var s = CV.checkScore(); scale(s === null ? Object.keys(answers()).length : s); }; coverScale(); CV.on('check', coverScale); }
  if (!SA && location.hash === '#check') CV.openCheck();
  // Row ids are added above, after the browser has already looked for the target, so a link such as /#act-t3-1 needs a nudge.
  var hit = /^#act-(t\d+-\d+)$/.exec(location.hash);
  if (!SA && hit) setTimeout(function () { CV.goToAction(hit[1]); }, 300);
});

/* --- src/features/109-my-plan.js --- */
// My plan: add any action from the three theme tables, then manage it in one place.
CV.ready(function () {
  var A = CV.actions();
  A.forEach(function (a) { if (!a.row.id) a.row.id = 'act-' + a.id; });
  var byId = {}; A.forEach(function (a) { byId[a.id] = a; });
  // Two controls from the exposure check live on the one-page plan, not in the theme tables.
  CV.THEMES[0] = 'Your one-page plan';
  CV.themeLabel = function (t) { return t ? 'Theme ' + t + ': ' + CV.THEMES[t] : CV.THEMES[0]; };
  [{ id: 'p-plan', theme: 0, text: 'Write your incident plan: fill in the one-page plan and print it.', spend: 'None', effort: 'Part of the one-page plan', row: null },
   { id: 'p-owner', theme: 0, text: 'Name the owner or director responsible for cyber security, on the one-page plan.', spend: 'None', effort: 'Part of the one-page plan', row: null }
  ].forEach(function (a) { byId[a.id] = a; });
  function data() { var p = CV.store.get('plan', { items: {}, order: [] }); p.items = p.items || {}; p.order = (p.order || []).filter(function (id) { return p.items[id]; }); return p; }
  function save(p) { CV.store.set('plan', p); CV.emit('plan', p); }
  CV.plan = {
    data: data, byId: byId,
    has: function (id) { return !!data().items[id]; },
    add: function (id, quiet) { var p = data(); if (!byId[id] || p.items[id]) return; p.items[id] = { added: Date.now() }; p.order.push(id); save(p); if (!quiet) CV.toast('Added to your plan'); },
    remove: function (id) { var p = data(); delete p.items[id]; save(p); },
    update: function (id, patch) { var p = data(); if (!p.items[id]) return; Object.keys(patch).forEach(function (k) { p.items[id][k] = patch[k]; }); save(p); },
    count: function () { return data().order.length; },
    list: function () { var p = data(); return p.order.map(function (id) { var a = byId[id]; return a && { id: id, a: a, meta: p.items[id] }; }).filter(Boolean); },
    open: function () { dlg.open(); }
  };
  // Row buttons
  A.forEach(function (a) {
    var cell = a.row.children[0];
    var b = CV.h('button', { type: 'button', class: 'plan-add', 'aria-pressed': 'false' });
    b.addEventListener('click', function () { if (CV.plan.has(a.id)) CV.plan.remove(a.id); else CV.plan.add(a.id); });
    cell.appendChild(b);
    a.btn = b;
  });
  function syncRows() { A.forEach(function (a) { var on = CV.plan.has(a.id); a.btn.textContent = on ? '✓ In my plan' : '+ Add to my plan'; a.btn.setAttribute('aria-pressed', on ? 'true' : 'false'); a.btn.setAttribute('aria-label', (on ? 'Remove from my plan: ' : 'Add to my plan: ') + a.text); a.row.classList.toggle('in-plan', on); }); }
  // Toolbar button
  var tb = CV.h('button', { type: 'button', class: 'tool plan-tool', onclick: function () { CV.plan.open(); } }, 'My plan ', CV.h('span', { class: 'plan-count' }, '0'));
  CV.addTool(tb, true);
  function syncTool() { var n = CV.plan.count(); tb.querySelector('.plan-count').textContent = n; tb.setAttribute('aria-label', 'My plan, ' + n + ' action' + (n === 1 ? '' : 's')); }
  // Dialog
  // True only on the plan page itself (/plan/): the plan is drawn inline there, with a list of the report's actions to add from.
  // On another tool page (for example /check/) it stays a dialog, opened by that page's next step.
  var SA = !!CV.standalone && ((CV.$('#main') || document.body).getAttribute('data-slug') === 'plan');
  var PLAN_NOTE = 'Your plan stays in this browser and nothing is sent anywhere. Browsers can clear it if you don’t visit for a while (Safari after seven days), so print it or add the dates to your calendar to keep a copy.';
  var dlg = SA ? CV.inlineHost({ id: 'plan', label: 'My plan', note: PLAN_NOTE, onopen: render }) : CV.dialog({ id: 'plan', title: 'My plan', wide: true, note: PLAN_NOTE, onopen: render });
  CV.planDialog = dlg;
  // Re-rendering replaces the list, so remember where focus was and put it back afterwards.
  var focusNext = null;
  function render() {
    var b = dlg.body, ae = document.activeElement, keep = focusNext || (ae && b.contains(ae) && ae.id) || null;
    var hadFocus = !!focusNext || (ae && b.contains(ae)); focusNext = null;
    b.innerHTML = '';
    setTimeout(function () { if (!hadFocus) return; var t = keep && document.getElementById(keep); if (!t || !b.contains(t)) t = b.querySelector('.plan-item input[type=checkbox]') || document.getElementById('plan-title'); if (t) { if (t.id === 'plan-title') t.setAttribute('tabindex', '-1'); t.focus(); } }, 0);
    var items = CV.plan.list();
    if (!items.length) {
      b.appendChild(CV.h('div', { class: 'plan-empty' },
        CV.h('p', null, 'Your plan is empty. Add actions from the three theme tables, or take the exposure check and add your gaps in one go.'),
        CV.h('div', { class: 'cv-row' },
          SA ? null : CV.button('Go to Theme 1 actions', function () { dlg.close(); CV.goToAction('t1-1'); }, 'primary'),
          SA ? CV.h('a', { class: 'tool primary', href: '../check/' }, 'Take the exposure check') : (CV.openCheck ? CV.button('Take the exposure check', function () { dlg.close(); CV.openCheck(); }) : null))));
      CV.emit('plan-render', { body: b, empty: true });
      if (SA) b.appendChild(picker());
      return;
    }
    var done = items.filter(function (x) { return x.meta.done; }).length;
    b.appendChild(CV.h('div', { class: 'plan-sum' },
      CV.h('div', { class: 'plan-bar', 'aria-hidden': 'true' }, CV.h('span', { style: 'width:' + (done / items.length * 100) + '%' })),
      CV.h('p', null, CV.h('b', null, done + ' of ' + items.length), ' actions done')));
    // One list in the order actions were added. The check adds your gaps most important first, so the top item is the one to do first.
    [items].forEach(function (group) {
      b.appendChild(CV.h(SA ? 'h2' : 'h3', { class: 'plan-theme' }, 'Your actions'));
      b.appendChild(CV.h('p', { class: 'plan-order' }, 'Most important first, in the order you added them.'));
      var ul = CV.h('ul', { class: 'plan-list' });
      group.forEach(function (x) {
        var cbid = 'pl-' + x.id;
        var cb = CV.h('input', { type: 'checkbox', id: cbid }); cb.checked = !!x.meta.done;
        cb.addEventListener('change', function () { CV.plan.update(x.id, { done: cb.checked }); render(); });
        var li = CV.h('li', { class: 'plan-item' + (x.meta.done ? ' done' : ''), 'data-id': x.id },
          cb, CV.h('div', { class: 'plan-main' },
            CV.h('label', { for: cbid }, x.a.text),
            CV.h('p', { class: 'plan-meta' }, CV.h('span', { class: 'chip ' + x.a.spend.toLowerCase() }, x.a.spend === 'None' ? 'Free' : x.a.spend), ' ', x.a.effort, CV.h('span', { class: 'plan-th' }, ' · ' + CV.themeLabel(x.a.theme)))),
          CV.h('button', { type: 'button', class: 'plan-rm', 'aria-label': 'Remove: ' + x.a.text, id: 'rm-' + x.id, onclick: function () { var nx = li.nextElementSibling || li.previousElementSibling; focusNext = nx ? 'pl-' + nx.getAttribute('data-id') : null; CV.plan.remove(x.id); render(); CV.toast('Removed from your plan'); } }, '×'));
        ul.appendChild(li);
        CV.emit('plan-item', { li: li, item: x });
      });
      b.appendChild(ul);
    });
    CV.emit('plan-render', { body: b, empty: false });
    if (SA) b.appendChild(picker());
  }
  // On a page of its own the report's action tables are not on screen, so the actions are listed here to add from.
  var pickOpen = false;
  function picker() {
    var det = CV.h('details', { class: 'plan-pick' }, CV.h('summary', null, 'Add an action from the report'));
    det.open = pickOpen; det.addEventListener('toggle', function () { pickOpen = det.open; }); // stays open while you add several
    [1, 2, 3].forEach(function (t) {
      det.appendChild(CV.h('h2', { class: 'plan-pick-h' }, CV.themeLabel(t)));
      var ul = CV.h('ul', { class: 'plan-pick-list' });
      A.filter(function (a) { return a.theme === t; }).forEach(function (a) {
        var on = CV.plan.has(a.id);
        var btn = CV.h('button', { type: 'button', class: 'tool', 'aria-pressed': on ? 'true' : 'false', 'aria-label': (on ? 'Remove from my plan: ' : 'Add to my plan: ') + a.text }, on ? '✓ In my plan' : '+ Add');
        btn.addEventListener('click', function () { if (CV.plan.has(a.id)) CV.plan.remove(a.id); else CV.plan.add(a.id, true); focusNext = null; render(); });
        ul.appendChild(CV.h('li', null, CV.h('span', null, a.text), btn));
      });
      det.appendChild(ul);
    });
    return det;
  }
  if (SA) CV.on('plan', function () { if (!dlg.dialog.hidden) render(); });
  CV.plan.render = render;
  CV.on('plan', function () { syncRows(); syncTool(); });
  syncRows(); syncTool();
});

/* --- src/features/110-plan-owners-dates.js --- */
// My plan: give every action an owner and a due date, then put the dates in your calendar.
CV.ready(function () {
  if (!CV.plan) return;
  CV.on('plan-item', function (d) {
    var x = d.item, main = d.li.querySelector('.plan-main');
    var who = CV.h('input', { type: 'text', class: 'cv-input', id: 'ow-' + x.id, placeholder: 'Who', autocomplete: 'off', 'aria-label': 'Owner for: ' + x.a.text });
    who.value = x.meta.owner || '';
    who.addEventListener('change', function () { CV.plan.update(x.id, { owner: who.value.trim() }); });
    var due = CV.h('input', { type: 'date', class: 'cv-input', id: 'du-' + x.id, 'aria-label': 'Due date for: ' + x.a.text, min: '2026-11-01', max: '2027-12-31' });
    due.value = x.meta.due || '';
    due.addEventListener('change', function () { CV.plan.update(x.id, { due: due.value }); });
    main.appendChild(CV.h('div', { class: 'plan-assign' }, who, due));
  });
  function events() {
    return CV.plan.list().filter(function (x) { return x.meta.due && !x.meta.done; }).map(function (x) {
      return { title: 'Cyber: ' + x.a.text.replace(/\.$/, '') + (x.meta.owner ? ' (' + x.meta.owner + ')' : ''), date: CV.parseDate(x.meta.due),
        description: 'From your plan, UK Small Business Cyber Outlook 2027. ' + CV.themeLabel(x.a.theme) + '. Effort: ' + x.a.effort + '.', url: CV.SITE + (x.a.row === null ? '#mvc' : '#act-' + x.id) };
    });
  }
  CV.on('plan-render', function (d) {
    if (d.empty) return;
    var bar = CV.h('div', { class: 'cv-row plan-actions' }), dated = events().length > 0;
    bar.appendChild(CV.button('Add due dates to my calendar', function () {
      var ev = events();
      if (!ev.length) { CV.toast('Give at least one open action a due date first'); return; }
      CV.ics(ev, 'my-cyber-plan.ics');
    }, dated ? 'primary' : ''));
    bar.appendChild(CV.button('Suggest dates from the 90-day plan', function () {
      // Spread undated actions one per week from the first Monday of January 2027.
      var start = new Date(2027, 0, 4), i = 0;
      CV.plan.list().forEach(function (x) { if (!x.meta.due && !x.meta.done) { var dt = new Date(start.getTime() + i * 7 * 86400000); i++; CV.plan.update(x.id, { due: dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0') }); } });
      CV.toast(i ? 'Suggested ' + i + ' date' + (i === 1 ? '' : 's') + ', one a week from 4 January' : 'Every open action already has a date');
      CV.plan.render();
    }, dated ? '' : 'primary'));
    d.body.insertBefore(bar, d.body.children[1] || null);
  });
});

/* --- src/features/111-check-to-plan.js --- */
// Exposure check -> plan: turn your gaps into a plan in one click.
CV.ready(function () {
  if (!CV.plan || !CV.openCheck) return;
  var map = { 't3-1': 't3-1', 't1-3': 't1-3', 't1-2': 't1-2', 't1-1': 't1-1', 't2-1': 't2-1', 't3-2': 't3-2', 't3-5': 't3-5', 't3-6': 't3-6' };
  CV.on('check-result', function (r) {
    var ids = r.gaps.map(function (g) { return g.q.act || g.q.planAct; }).filter(function (id) { return id && CV.plan.byId[id]; });
    var d = document.getElementById('check'); if (!d) return;
    var body = d.querySelector('.cv-dialog-body');
    var box = CV.h('div', { class: 'qz-plan' });
    if (ids.length) {
      var fresh = ids.filter(function (id) { return !CV.plan.has(id); });
      box.appendChild(CV.h('div', null, CV.h('p', { class: 'cv-kicker' }, 'Next step'),
        CV.h('p', null, fresh.length ? 'Turn your ' + ids.length + ' gap' + (ids.length === 1 ? '' : 's') + ' into a plan, with owners and dates.' : 'Your gaps are already in your plan.')));
      box.appendChild(CV.button(fresh.length ? (CV.standalone ? 'Turn these gaps into your plan' : 'Add my gaps to my plan') : 'Open my plan', function () {
        fresh.forEach(function (id) { CV.plan.add(id, true); });
        if (fresh.length) CV.toast(fresh.length + ' action' + (fresh.length === 1 ? '' : 's') + ' added to your plan');
        d.close(); CV.plan.open();
      }, 'primary'));
      // On the report the next step sits above the gaps. On a page of its own it closes the result, above Retake and the link to the report.
      var anchor = CV.standalone ? body.querySelector('.qz-nav') : body.querySelector('.qz-h');
      body.insertBefore(box, anchor || null);
    }
  });
});

/* --- src/features/219-email-capture.js --- */
// Optional email capture (UX-12). OFF unless src/pages/config.json sets captureEndpoint (a path on this site), privacyUrl and both
// wordings. When it is off this file does nothing: no form is drawn and nothing is ever sent. When it is on, a form only sends what
// is written beside its button: the address, the topics asked for, the page it was on, and (for the result) the score, the band and
// the numbers of the questions with a gap. It never sends the answers themselves. See worker/README.md for the other end.
(function () {
  var cfg = CV.config || {};
  var ON = !!(cfg.captureEndpoint && cfg.privacyUrl && cfg.wording && cfg.wording.newsletter && cfg.wording.updates);
  CV.capture = { enabled: ON };
  if (!ON) return;
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  // One request, no retry loop, no cookies.
  function post(body) {
    return fetch(cfg.captureEndpoint.replace(/\/$/, '') + '/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'omit', body: JSON.stringify(body) })
      .then(function (r) { if (!r.ok) throw new Error('status ' + r.status); });
  }

  // opts: { source, topics: ['result'] or ['download'], files, result, button, sends }
  CV.capture.form = function (opts) {
    var id = 'cap-' + Math.random().toString(36).slice(2, 7);
    var email = CV.h('input', { type: 'email', id: id + '-e', autocomplete: 'email', inputmode: 'email', placeholder: 'you@yourbusiness.co.uk', required: true });
    var err = CV.h('p', { class: 'cap-err', role: 'alert', hidden: true });
    function box(topic, w) {
      var cb = CV.h('input', { type: 'checkbox', id: id + '-' + topic }); // never pre-ticked
      return { cb: cb, row: CV.h('div', { class: 'qz-opt-inline' }, cb, CV.h('label', { for: id + '-' + topic }, w.text)), id: w.id };
    }
    var nl = box('newsletter', cfg.wording.newsletter), up = box('updates', cfg.wording.updates);
    var status = CV.h('p', { class: 'cap-status', 'aria-live': 'polite' });
    var go = CV.h('button', { type: 'submit', class: 'tool primary' }, opts.button);
    var form = CV.h('form', { class: 'cap-form', novalidate: true },
      CV.field('Email address', email), err,
      CV.h('p', { class: 'cap-sends' }, 'What we send to be able to do this: ', opts.sends, ' Nothing else.'),
      nl.row, up.row,
      CV.h('div', { class: 'cap-row' }, go, CV.h('a', { href: cfg.privacyUrl, class: 'cap-priv' }, 'Privacy notice')), status);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var addr = email.value.trim();
      if (!EMAIL.test(addr)) { err.textContent = 'Enter an email address like name@company.co.uk.'; err.hidden = false; email.focus(); return; }
      err.hidden = true; go.disabled = true; status.textContent = 'Sending…';
      var topics = opts.topics.slice(), wordings = {};
      if (nl.cb.checked) { topics.push('newsletter'); wordings.newsletter = nl.id; }
      if (up.cb.checked) { topics.push('report-updates'); wordings['report-updates'] = up.id; }
      var body = { email: addr, topics: topics, source: opts.source };
      if (Object.keys(wordings).length) body.wordings = wordings;
      if (opts.files) body.files = opts.files;
      if (opts.result) body.result = opts.result;
      post(body).then(function () {
        form.replaceWith(CV.h('p', { class: 'cap-done', role: 'status', tabindex: '-1' }, 'Now check your inbox. We have sent a link to confirm your address, and nothing else is sent until you open it.'));
        var d = document.querySelector('.cap-done'); if (d) d.focus();
      }, function () {
        go.disabled = false;
        status.textContent = 'That did not work, and nothing was sent. Your result is still on this page. Please try again later.';
      });
    });
    return form;
  };

  // The check result by email, after the result is shown and only on /check/. The result is always free and fully visible first.
  if (CV.standalone) CV.on('check-result', function (r) {
    var body = document.querySelector('#check .cv-dialog-body'); if (!body) return;
    var h = body.querySelector('.qz-result h2'), band = h ? h.textContent.trim() : '';
    var card = CV.h('section', { class: 'cap', 'aria-label': 'Email me my result' },
      CV.h('p', { class: 'cv-kicker' }, 'Optional'), CV.h('h2', { class: 'cap-h' }, 'Email me my result'),
      CV.capture.form({ source: '/check/', topics: ['result'], button: 'Email me my result',
        sends: 'your address, your score, your band and the numbers of the questions with a gap (not your answers).',
        result: { score: r.score, band: band, gaps: r.gaps.map(function (g) { return g.i + 1; }) } }));
    var nav = body.querySelector('.qz-nav'); body.insertBefore(card, nav || null);
  });
})();
