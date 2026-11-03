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
      open: function () { if (opts.onopen) opts.onopen(body); if (!d.open) { d.showModal(); document.documentElement.classList.add('cv-modal-open'); } },
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
  function ready(fn) {
    var run = function () { try { fn(); } catch (e) { if (window.console) console.warn('CV feature failed', e); } };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
  }

  return { SITE: SITE, TITLE: TITLE, PODCAST: PODCAST, AUTHOR_SITE: AUTHOR_SITE, store: store, h: h, $: $, $$: $$, on: on, emit: emit, toast: toast,
    text: text, slug: slug, esc: esc, reduced: reduced, copy: copy, download: download, ics: ics, dialog: dialog, button: button, field: field,
    actions: actions, THEMES: THEMES, EPISODES: EPISODES, parseDate: parseDate, today: today, fmtDate: fmtDate, addTool: addTool, ready: ready };
})();

/* --- src/features/107-start-here.js --- */
// Countdown to 1 January 2027, tied to the five-things checklist.
CV.ready(function () {
  var el = CV.$('#countdown'); if (!el) return;
  function count() { var d = 0; try { var s = JSON.parse(localStorage.getItem('cv-five-things') || '{}'); Object.keys(s).forEach(function (k) { if (s[k]) d++; }); } catch (e) {} return d; }
  function render() {
    var now = CV.today(), jan = new Date(2027, 0, 1), done = count();
    var days = Math.round((jan - now) / 86400000);
    if (days > 0) el.innerHTML = '<b>' + days + '</b> days to January. ' + (done === 5 ? 'All five things done.' : done + ' of 5 things done.');
    else el.textContent = done === 5 ? 'All five things done.' : 'It’s 2027. ' + done + ' of the five things done.';
  }
  render();
  document.addEventListener('change', function (e) { if (e.target.closest && e.target.closest('#five')) render(); });
  document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('.five-reset')) setTimeout(render, 0); });
  CV.render = CV.render || {}; CV.render.countdown = render;
});

/* --- src/features/108-exposure-check.js --- */
// Two-minute exposure check: ten yes / not sure / no questions built from the report's own actions.
// Benchmarks quote only figures the report cites (CSBS 2025/26, source 1).
CV.ready(function () {
  var A = CV.actions();
  A.forEach(function (a) { if (!a.row.id) a.row.id = 'act-' + a.id; });
  CV.actionById = function (id) { for (var i = 0; i < A.length; i++) if (A[i].id === id) return A[i]; return null; };
  CV.goToAction = function (id) {
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
    { q: 'Do you have a written plan for what happens in a cyber incident?', go: '#mvc', goLabel: 'Fill in the one-page plan',
      bench: 'Only 21% of micro firms have a formal incident response plan.' },
    { q: 'Is one named person, the owner or a director, responsible for cyber security?', go: '#mvc', goLabel: 'Name them on the one-page plan',
      bench: 'Just 29% of micro firms have a board member or owner with named responsibility for cyber security.' },
    { q: 'Do you know what personal data you hold, where it lives and who can reach it?', act: 't3-6' }
  ];
  var saved = CV.store.get('check', {});
  var d = CV.dialog({ id: 'check', title: 'Two-minute exposure check', wide: true,
    note: 'Your answers stay in this browser. Benchmarks are from the Cyber Security Breaches Survey 2025/26 [source 1].' });
  var step = 0;
  function answers() { return saved.a || {}; }
  function save() { CV.store.set('check', saved); CV.emit('check', saved); }
  function renderQ() {
    var b = d.body; b.innerHTML = '';
    var item = Q[step], a = answers()[step];
    var bar = CV.h('div', { class: 'qz-bar', 'aria-hidden': 'true' }, CV.h('span', { style: 'width:' + (step / Q.length * 100) + '%' }));
    b.appendChild(CV.h('p', { class: 'cv-kicker' }, 'Question ' + (step + 1) + ' of ' + Q.length));
    b.appendChild(bar);
    var fs = CV.h('fieldset', { class: 'qz-q' }, CV.h('legend', null, item.q));
    [['yes', 'Yes'], ['unsure', 'Not sure'], ['no', 'No']].forEach(function (o) {
      var id = 'qz-' + step + '-' + o[0];
      var input = CV.h('input', { type: 'radio', name: 'qz-' + step, id: id, value: o[0] });
      if (a === o[0]) input.checked = true;
      input.addEventListener('change', function () { saved.a = answers(); saved.a[step] = o[0]; save(); setTimeout(next, CV.reduced() ? 0 : 180); });
      fs.appendChild(CV.h('div', { class: 'qz-opt' }, input, CV.h('label', { for: id }, o[1])));
    });
    b.appendChild(fs);
    var nav = CV.h('div', { class: 'cv-row qz-nav' });
    if (step > 0) nav.appendChild(CV.button('← Back', function () { step--; renderQ(); }));
    if (a) nav.appendChild(CV.button(step === Q.length - 1 ? 'See my result' : 'Next →', next, 'primary'));
    b.appendChild(nav);
    var first = fs.querySelector('input:checked') || fs.querySelector('input'); if (first) first.focus();
  }
  function next() { if (step < Q.length - 1) { step++; renderQ(); } else renderResult(); }
  function score() { var s = 0, ans = answers(); Object.keys(ans).forEach(function (k) { if (ans[k] === 'yes') s++; }); return s; }
  CV.checkScore = function () { var ans = answers(); return Object.keys(ans).length === Q.length ? score() : null; };
  CV.checkGaps = function () { var ans = answers(); return Q.map(function (x, i) { return { i: i, q: x, a: ans[i] }; }).filter(function (g) { return g.a && g.a !== 'yes'; }); };
  function band(s) { return s >= 8 ? ['Strong foundations', 'You’ve done most of what this report asks. Close the last gaps and test your plan.']
    : s >= 4 ? ['Halfway there', 'The basics are partly in place. The gaps below are mostly free to fix.']
    : ['Start with the basics', 'Most of what’s missing costs nothing but an afternoon. Start at the top of the list below.']; }
  function renderResult() {
    var b = d.body; b.innerHTML = ''; var s = score(), bd = band(s);
    saved.done = true; save();
    b.appendChild(CV.h('div', { class: 'qz-result' },
      CV.h('div', { class: 'qz-score', 'aria-label': s + ' out of ' + Q.length }, CV.h('b', null, String(s)), CV.h('span', null, '/ ' + Q.length)),
      CV.h('div', null, CV.h('p', { class: 'cv-kicker' }, 'Your result'), CV.h('h3', null, bd[0]), CV.h('p', null, bd[1]))));
    var gaps = CV.checkGaps();
    if (gaps.length) {
      b.appendChild(CV.h('h3', { class: 'qz-h' }, 'Your gaps, in order'));
      var ol = CV.h('ol', { class: 'qz-gaps' });
      gaps.forEach(function (g) {
        var li = CV.h('li', null, CV.h('p', null, g.q.q + ' ', CV.h('span', { class: 'qz-ans qz-' + g.a }, g.a === 'no' ? 'No' : 'Not sure')));
        if (g.q.bench) li.appendChild(CV.h('p', { class: 'qz-bench' }, g.q.bench + ' [1]'));
        var go = g.q.act ? CV.button('Show the action →', function () { d.close(); CV.goToAction(g.q.act); })
          : CV.button((g.q.goLabel || 'Go') + ' →', function () { d.close(); location.hash = g.q.go; });
        li.appendChild(CV.h('div', { class: 'cv-row' }, go));
        ol.appendChild(li);
      });
      b.appendChild(ol);
    } else b.appendChild(CV.h('p', null, 'No gaps. Print the one-page plan and run a one-hour tabletop against it.'));
    b.appendChild(CV.h('div', { class: 'cv-row qz-nav' }, CV.button('Start again', function () { saved = {}; save(); step = 0; renderQ(); })));
    CV.emit('check-result', { score: s, gaps: gaps });
  }
  CV.openCheck = function (fresh) { if (fresh || !saved.done) { step = 0; d.open(); renderQ(); } else { d.open(); renderResult(); } };
  // Make it the first path in "Start here".
  var paths = CV.$('.paths');
  if (paths) {
    var li = CV.h('li', null, CV.h('a', { class: 'path primary', href: '#check', 'data-path': 'check', onclick: function (e) { e.preventDefault(); CV.openCheck(); } },
      CV.h('span', { class: 'p-time' }, '2 min'), CV.h('b', null, saved.done ? 'Your exposure check' : 'Check your exposure'),
      CV.h('span', { class: 'p-sub' }, saved.done ? 'See your result and your gaps again.' : 'Ten yes-or-no questions. See where you stand against UK small firms.')));
    paths.insertBefore(li, paths.firstChild);
    paths.classList.add('four');
  }
  if (location.hash === '#check') CV.openCheck();
});

/* --- src/features/109-my-plan.js --- */
// My plan: add any action from the three theme tables, then manage it in one place.
CV.ready(function () {
  var A = CV.actions();
  A.forEach(function (a) { if (!a.row.id) a.row.id = 'act-' + a.id; });
  var byId = {}; A.forEach(function (a) { byId[a.id] = a; });
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
  var dlg = CV.dialog({ id: 'plan', title: 'My plan', wide: true, note: 'Your plan stays in this browser. Nothing is sent anywhere.', onopen: render });
  CV.planDialog = dlg;
  function render() {
    var b = dlg.body; b.innerHTML = '';
    var items = CV.plan.list();
    if (!items.length) {
      b.appendChild(CV.h('div', { class: 'plan-empty' },
        CV.h('p', null, 'Your plan is empty. Add actions from the three theme tables, or take the exposure check and add your gaps in one go.'),
        CV.h('div', { class: 'cv-row' },
          CV.button('Go to Theme 1 actions', function () { dlg.close(); CV.goToAction('t1-1'); }, 'primary'),
          CV.openCheck ? CV.button('Take the exposure check', function () { dlg.close(); CV.openCheck(); }) : null)));
      CV.emit('plan-render', { body: b, empty: true });
      return;
    }
    var done = items.filter(function (x) { return x.meta.done; }).length;
    b.appendChild(CV.h('div', { class: 'plan-sum' },
      CV.h('div', { class: 'plan-bar', 'aria-hidden': 'true' }, CV.h('span', { style: 'width:' + (done / items.length * 100) + '%' })),
      CV.h('p', null, CV.h('b', null, done + ' of ' + items.length), ' actions done')));
    [1, 2, 3].forEach(function (t) {
      var group = items.filter(function (x) { return x.a.theme === t; });
      if (!group.length) return;
      b.appendChild(CV.h('h3', { class: 'plan-theme' }, 'Theme ' + t + ': ' + CV.THEMES[t]));
      var ul = CV.h('ul', { class: 'plan-list' });
      group.forEach(function (x) {
        var cbid = 'pl-' + x.id;
        var cb = CV.h('input', { type: 'checkbox', id: cbid }); cb.checked = !!x.meta.done;
        cb.addEventListener('change', function () { CV.plan.update(x.id, { done: cb.checked }); render(); });
        var li = CV.h('li', { class: 'plan-item' + (x.meta.done ? ' done' : ''), 'data-id': x.id },
          cb, CV.h('div', { class: 'plan-main' },
            CV.h('label', { for: cbid }, x.a.text),
            CV.h('p', { class: 'plan-meta' }, CV.h('span', { class: 'chip ' + x.a.spend.toLowerCase() }, x.a.spend), ' ', x.a.effort)),
          CV.h('button', { type: 'button', class: 'plan-rm', 'aria-label': 'Remove: ' + x.a.text, onclick: function () { CV.plan.remove(x.id); render(); } }, '×'));
        ul.appendChild(li);
        CV.emit('plan-item', { li: li, item: x });
      });
      b.appendChild(ul);
    });
    CV.emit('plan-render', { body: b, empty: false });
  }
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
        description: 'From your plan, UK Small Business Cyber Outlook 2027. Theme ' + x.a.theme + ': ' + CV.THEMES[x.a.theme] + '. Effort: ' + x.a.effort + '.', url: CV.SITE + '#act-' + x.id };
    });
  }
  CV.on('plan-render', function (d) {
    if (d.empty) return;
    var bar = CV.h('div', { class: 'cv-row plan-actions' });
    bar.appendChild(CV.button('Add due dates to my calendar', function () {
      var ev = events();
      if (!ev.length) { CV.toast('Give at least one open action a due date first'); return; }
      CV.ics(ev, 'my-cyber-plan.ics');
    }, 'primary'));
    bar.appendChild(CV.button('Suggest dates from the 90-day plan', function () {
      // Spread undated actions one per week from the first Monday of January 2027.
      var start = new Date(2027, 0, 4), i = 0;
      CV.plan.list().forEach(function (x) { if (!x.meta.due && !x.meta.done) { var dt = new Date(start.getTime() + i * 7 * 86400000); i++; CV.plan.update(x.id, { due: dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0') }); } });
      CV.toast(i ? 'Suggested ' + i + ' date' + (i === 1 ? '' : 's') + ', one a week from 4 January' : 'Every open action already has a date');
      CV.plan.render();
    }));
    d.body.insertBefore(bar, d.body.children[1] || null);
  });
});

/* --- src/features/111-check-to-plan.js --- */
// Exposure check -> plan: turn your gaps into a plan in one click.
CV.ready(function () {
  if (!CV.plan || !CV.openCheck) return;
  var map = { 't3-1': 't3-1', 't1-3': 't1-3', 't1-2': 't1-2', 't1-1': 't1-1', 't2-1': 't2-1', 't3-2': 't3-2', 't3-5': 't3-5', 't3-6': 't3-6' };
  CV.on('check-result', function (r) {
    var ids = r.gaps.map(function (g) { return g.q.act; }).filter(function (id) { return id && map[id]; });
    var d = document.getElementById('check'); if (!d) return;
    var body = d.querySelector('.cv-dialog-body');
    var box = CV.h('div', { class: 'qz-plan' });
    if (ids.length) {
      var fresh = ids.filter(function (id) { return !CV.plan.has(id); });
      box.appendChild(CV.h('div', null, CV.h('p', { class: 'cv-kicker' }, 'Next step'),
        CV.h('p', null, fresh.length ? 'Turn your ' + ids.length + ' gap' + (ids.length === 1 ? '' : 's') + ' into a plan, with owners and dates.' : 'Your gaps are already in your plan.')));
      box.appendChild(CV.button(fresh.length ? 'Add my gaps to my plan' : 'Open my plan', function () {
        fresh.forEach(function (id) { CV.plan.add(id, true); });
        if (fresh.length) CV.toast(fresh.length + ' action' + (fresh.length === 1 ? '' : 's') + ' added to your plan');
        d.close(); CV.plan.open();
      }, 'primary'));
      var anchor = body.querySelector('.qz-h');
      body.insertBefore(box, anchor || null);
    }
  });
});

/* --- src/features/112-plan-export.js --- */
// @msg My plan: copy, download, email or print your plan as a clean one-page document
// @sel #theme-1 table.actions
CV.ready(function () {
  if (!CV.plan) return;
  function asText() {
    var items = CV.plan.list(), lines = ['MY CYBER PLAN', 'From the ' + CV.TITLE + ' (' + CV.SITE + ')', ''];
    [1, 2, 3].forEach(function (t) {
      var g = items.filter(function (x) { return x.a.theme === t; }); if (!g.length) return;
      lines.push('Theme ' + t + ': ' + CV.THEMES[t]);
      g.forEach(function (x) {
        var meta = [x.a.spend + ' spend', x.a.effort]; if (x.meta.owner) meta.push('Owner: ' + x.meta.owner); if (x.meta.due) meta.push('Due: ' + CV.fmtDate(CV.parseDate(x.meta.due)));
        lines.push((x.meta.done ? '[x] ' : '[ ] ') + x.a.text); lines.push('    ' + meta.join(' | '));
      });
      lines.push('');
    });
    return lines.join('\n');
  }
  CV.plan.asText = asText;
  function printPlan() {
    var items = CV.plan.list();
    var sheet = CV.h('div', { class: 'plan-print', id: 'plan-print' },
      CV.h('div', { class: 'pp-head' }, CV.h('h2', null, 'My cyber plan'), CV.h('p', null, 'From the ' + CV.TITLE + ' · cyberoutlook.sbcsg.uk · printed ' + CV.fmtDate(CV.today()))));
    var tbl = CV.h('table', null, CV.h('thead', null, CV.h('tr', null, CV.h('th', null, ''), CV.h('th', null, 'Action'), CV.h('th', null, 'Owner'), CV.h('th', null, 'Due'), CV.h('th', null, 'Spend'))));
    var tb = CV.h('tbody');
    items.forEach(function (x) { tb.appendChild(CV.h('tr', null, CV.h('td', null, x.meta.done ? '☑' : '☐'), CV.h('td', null, x.a.text), CV.h('td', null, x.meta.owner || ''), CV.h('td', null, x.meta.due ? CV.fmtDate(CV.parseDate(x.meta.due)) : ''), CV.h('td', null, x.a.spend))); });
    tbl.appendChild(tb); sheet.appendChild(tbl);
    var old = CV.$('#plan-print'); if (old) old.remove();
    document.body.appendChild(sheet);
    document.body.classList.add('print-myplan');
    CV.planDialog.close();
    setTimeout(function () { window.print(); }, 50);
  }
  window.addEventListener('afterprint', function () { document.body.classList.remove('print-myplan'); });
  CV.on('plan-render', function (d) {
    if (d.empty) return;
    var row = CV.h('div', { class: 'cv-row plan-export' },
      CV.h('span', { class: 'cv-kicker' }, 'Take it with you'),
      CV.button('Copy', function () { CV.copy(asText(), 'Plan copied'); }),
      CV.button('Download', function () { CV.download('my-cyber-plan.txt', 'text/plain', asText()); }),
      CV.h('a', { class: 'tool', href: 'mailto:?subject=' + encodeURIComponent('Our cyber plan') + '&body=' + encodeURIComponent(asText()) }, 'Email'),
      CV.button('Print', printPlan));
    d.body.appendChild(row);
  });
});

/* --- src/features/113-plan-share-link.js --- */
// @msg My plan: share it as a link, so a colleague opens the report with your plan ready to import
// @sel #start
CV.ready(function () {
  if (!CV.plan) return;
  // Link format: #plan=t1-1.Sam.20270104~t3-5..~ (id.owner.due), owner limited to letters, digits and spaces.
  function encode() {
    return CV.plan.list().map(function (x) {
      var o = (x.meta.owner || '').replace(/[^A-Za-z0-9 ]/g, '').slice(0, 24).replace(/ /g, '_');
      return [x.id, o, (x.meta.due || '').replace(/-/g, '')].join('.');
    }).join('~');
  }
  function decode(s) {
    return s.split('~').map(function (p) {
      var f = p.split('.'); if (!/^t[123]-[1-9]$/.test(f[0]) || !CV.plan.byId[f[0]]) return null;
      var due = /^\d{8}$/.test(f[2] || '') ? f[2].slice(0, 4) + '-' + f[2].slice(4, 6) + '-' + f[2].slice(6) : '';
      return { id: f[0], owner: (f[1] || '').replace(/_/g, ' '), due: due };
    }).filter(Boolean);
  }
  CV.on('plan-render', function (d) {
    if (d.empty) return;
    var row = d.body.querySelector('.plan-export'); if (!row) return;
    row.appendChild(CV.button('Copy share link', function () { CV.copy(CV.SITE + '#plan=' + encode(), 'Share link copied'); }));
  });
  var m = location.hash.match(/^#plan=([A-Za-z0-9_.~-]+)$/);
  if (!m) return;
  var incoming = decode(decodeURIComponent(m[1]));
  history.replaceState(null, '', location.pathname + location.search);
  if (!incoming.length) return;
  var d = CV.dialog({ id: 'plan-import', title: 'A plan was shared with you', note: 'Importing adds these actions to the plan stored in this browser.' });
  var ul = CV.h('ul', { class: 'imp-list' });
  incoming.forEach(function (x) { var a = CV.plan.byId[x.id]; ul.appendChild(CV.h('li', null, a.text, x.owner || x.due ? CV.h('span', { class: 'imp-meta' }, [x.owner, x.due && CV.fmtDate(CV.parseDate(x.due))].filter(Boolean).join(' · ')) : null)); });
  d.body.appendChild(CV.h('p', null, 'Someone sent you ' + incoming.length + ' action' + (incoming.length === 1 ? '' : 's') + ' from the ' + CV.TITLE + '.'));
  d.body.appendChild(ul);
  d.body.appendChild(CV.h('div', { class: 'cv-row' },
    CV.button('Import into my plan', function () {
      incoming.forEach(function (x) { CV.plan.add(x.id, true); CV.plan.update(x.id, { owner: x.owner, due: x.due }); });
      d.close(); CV.toast('Plan imported'); CV.plan.open();
    }, 'primary'),
    CV.button('Not now', function () { d.close(); })));
  d.open();
});

/* --- src/features/114-ninety-day-tracker.js --- */
// @msg 90-day plan: tick off the 13 weeks, see progress per month, and put every week in your calendar
// @sel #ninety .months
CV.ready(function () {
  var months = CV.$$('#ninety .month'); if (!months.length) return;
  var saved = CV.store.get('ninety', {});
  var weeks = [];
  months.forEach(function (m, mi) {
    var lis = CV.$$('li', m);
    var meter = CV.h('div', { class: 'nd-meter', 'aria-hidden': 'true' }, CV.h('span'));
    var label = CV.h('p', { class: 'nd-count' });
    m.querySelector('.sub').after(meter, label);
    lis.forEach(function (li) {
      var wk = (li.querySelector('strong') || {}).textContent || '';
      var n = parseInt((wk.match(/\d+/) || [0])[0], 10); if (!n) return;
      var id = 'wk-' + n;
      var cb = CV.h('input', { type: 'checkbox', id: id, class: 'nd-cb' }); cb.checked = !!saved[n];
      var lab = CV.h('label', { for: id }); while (li.firstChild) lab.appendChild(li.firstChild);
      li.appendChild(cb); li.appendChild(lab); li.classList.add('nd-li');
      cb.addEventListener('change', function () { saved[n] = cb.checked; CV.store.set('ninety', saved); li.classList.toggle('done', cb.checked); update(); });
      li.classList.toggle('done', cb.checked);
      weeks.push({ n: n, text: CV.text(lab).replace(/^Week \d+:\s*/, ''), m: m, meter: meter, label: label });
    });
    m.classList.add('nd-month');
  });
  function update() {
    months.forEach(function (m) {
      var ws = weeks.filter(function (w) { return w.m === m; }); if (!ws.length) return;
      var d = ws.filter(function (w) { return saved[w.n]; }).length;
      ws[0].meter.firstChild.style.width = (d / ws.length * 100) + '%';
      ws[0].label.textContent = d + ' of ' + ws.length + ' weeks done';
      m.classList.toggle('complete', d === ws.length);
    });
    CV.emit('ninety', saved);
  }
  update();
  var tools = CV.h('div', { class: 'nd-tools cv-noprint' },
    CV.h('p', null, CV.h('b', null, 'Run it from your calendar.'), ' One reminder each Monday from 4 January 2027, with that week’s task.'),
    CV.button('Add all 13 weeks to my calendar', function () {
      var start = new Date(2027, 0, 4);
      CV.ics(weeks.map(function (w) { return { title: 'Cyber week ' + w.n + ': ' + w.text.replace(/\.$/, ''), date: new Date(start.getTime() + (w.n - 1) * 7 * 86400000), description: 'Your first 90 days of 2027, from the ' + CV.TITLE + '.', url: CV.SITE + '#ninety' }; }), 'cyber-90-days-2027.ics');
    }, 'primary'));
  CV.$('#ninety .months').after(tools);
});

/* --- src/features/115-it-provider-email.js --- */
// @msg IT provider email builder: the four questions plus the backup question, ready to send
// @sel #h-what-to-do
CV.ready(function () {
  var h = CV.$('#h-what-to-do'); if (!h) return;
  var ol = h.parentNode.querySelector('ol'); if (!ol) return;
  var qs = CV.$$('li', ol).map(CV.text);
  var backup = 'Where are our backups held, by whom, and is there a copy with a different supplier?';
  var saved = CV.store.get('itmail', {});
  var d = CV.dialog({ id: 'itmail', title: 'Email your IT provider', wide: true, note: 'Nothing is sent from this page. Copy the email, or open it in your own email app.' });
  var prov = CV.h('input', { type: 'text', id: 'im-prov', autocomplete: 'organization', placeholder: 'e.g. Acme IT' });
  var who = CV.h('input', { type: 'text', id: 'im-who', autocomplete: 'name', placeholder: 'Your name' });
  var firm = CV.h('input', { type: 'text', id: 'im-firm', autocomplete: 'organization', placeholder: 'Your business' });
  var inclB = CV.h('input', { type: 'checkbox', id: 'im-b' }); inclB.checked = saved.b !== false;
  prov.value = saved.prov || ''; who.value = saved.who || ''; firm.value = saved.firm || '';
  var pre = CV.h('pre', { class: 'cv-pre', 'aria-live': 'polite' });
  function body() {
    var list = qs.slice(); if (inclB.checked) list.push(backup);
    return 'Hi' + (prov.value ? ' ' + prov.value.trim() + ' team' : '') + ',\n\nAs part of our cyber security review for 2027, could you answer these ' + list.length + ' questions in writing?\n\n' +
      list.map(function (q, i) { return (i + 1) + '. ' + q; }).join('\n') +
      '\n\nWe’d like to keep your answers on file with our incident plan. A reply within two weeks would be great.\n\nThanks,\n' + (who.value.trim() || '[Your name]') + (firm.value.trim() ? '\n' + firm.value.trim() : '');
  }
  function subject() { return 'Cyber security questions for 2027' + (firm.value.trim() ? ' (' + firm.value.trim() + ')' : ''); }
  function refresh() { pre.textContent = 'Subject: ' + subject() + '\n\n' + body(); saved = { prov: prov.value, who: who.value, firm: firm.value, b: inclB.checked }; CV.store.set('itmail', saved); }
  [prov, who, firm, inclB].forEach(function (i) { i.addEventListener('input', refresh); i.addEventListener('change', refresh); });
  var mail = CV.h('a', { class: 'tool', href: '#' }, 'Open in my email app');
  mail.addEventListener('click', function () { mail.href = 'mailto:?subject=' + encodeURIComponent(subject()) + '&body=' + encodeURIComponent(body()); });
  d.body.appendChild(CV.h('div', { class: 'cv-grid2' }, CV.field('IT provider', prov), CV.field('Your name', who), CV.field('Your business', firm)));
  d.body.appendChild(CV.h('div', { class: 'qz-opt-inline' }, inclB, CV.h('label', { for: 'im-b' }, 'Include the fifth question about backups (recommended for 2027)')));
  d.body.appendChild(pre);
  d.body.appendChild(CV.h('div', { class: 'cv-row' }, CV.button('Copy email', function () { CV.copy('Subject: ' + subject() + '\n\n' + body(), 'Email copied'); }, 'primary'), mail,
    CV.plan ? CV.button('Add "send the questions" to my plan', function () { CV.plan.add('t1-2'); }) : null));
  refresh();
  var cta = CV.h('div', { class: 'cta-card cv-noprint' },
    CV.h('div', null, CV.h('p', { class: 'cv-kicker' }, 'Tool'), CV.h('p', { class: 'cta-title' }, 'Turn these into an email in 30 seconds'),
      CV.h('p', { class: 'cta-sub' }, 'Add your IT provider’s name and yours. Copy it or open it in your email app.')),
    CV.button('Write the email', function () { d.open(); prov.focus(); }, 'primary'));
  var after = ol.nextElementSibling && ol.nextElementSibling.tagName === 'P' ? ol.nextElementSibling : ol;
  after.after(cta);
  CV.openItMail = function () { d.open(); };
});

/* --- src/features/116-callback-poster.js --- */
// @msg Call-back rule poster: print an A4 poster for the office wall, with your business name and who to call
// @sel #h-what-to-do-3
CV.ready(function () {
  // Shared helper: print one generated sheet on its own.
  CV.printSheet = function (el) {
    CV.$$('.cv-sheet').forEach(function (n) { n.remove(); });
    el.classList.add('cv-sheet'); document.body.appendChild(el);
    document.body.classList.add('print-sheet');
    CV.$$('dialog[open]').forEach(function (d) { d.close(); });
    setTimeout(function () { window.print(); }, 60);
  };
  window.addEventListener('afterprint', function () { document.body.classList.remove('print-sheet'); });
  var saved = CV.store.get('poster', {});
  var d = CV.dialog({ id: 'poster', title: 'Call-back rule poster', note: 'The rule is the one in this report: no change to bank details or urgent payment goes through without a phone call to a number you already hold.' });
  var firm = CV.h('input', { type: 'text', autocomplete: 'organization', placeholder: 'Your business' }); firm.value = saved.firm || '';
  var who = CV.h('input', { type: 'text', placeholder: 'e.g. Priya in accounts, 01234 567890' }); who.value = saved.who || '';
  var word = CV.h('input', { type: 'checkbox', id: 'pst-word' }); word.checked = !!saved.word;
  function build() {
    return CV.h('div', { class: 'poster' },
      CV.h('p', { class: 'pst-firm' }, (firm.value.trim() || 'Our business') + ' · payment rule'),
      CV.h('h2', null, 'Stop. ', CV.h('span', null, 'Call back.')),
      CV.h('p', { class: 'pst-rule' }, 'No change to bank details or urgent payment goes through without a phone call to a number we already hold.'),
      CV.h('ol', null,
        CV.h('li', null, 'Don’t use any number, link or contact in the email, text or message asking for the change.'),
        CV.h('li', null, 'Call the person on the number already in our records.'),
        word.checked ? CV.h('li', null, 'Ask for our code word. No code word, no payment.') : null,
        CV.h('li', null, 'Urgency is a warning sign, not a reason to skip this. Directors included.')),
      CV.h('p', { class: 'pst-who' }, 'Not sure? Ask ', CV.h('b', null, who.value.trim() || '____________________'), ' before you pay.'),
      CV.h('p', { class: 'pst-src' }, 'From the UK Small Business Cyber Outlook 2027 · cyberoutlook.sbcsg.uk'));
  }
  var prev = CV.h('div', { class: 'pst-preview', 'aria-hidden': 'true' });
  function refresh() { saved = { firm: firm.value, who: who.value, word: word.checked }; CV.store.set('poster', saved); prev.innerHTML = ''; prev.appendChild(build()); }
  [firm, who, word].forEach(function (i) { i.addEventListener('input', refresh); i.addEventListener('change', refresh); });
  d.body.appendChild(CV.h('div', { class: 'cv-grid2' }, CV.field('Business name', firm), CV.field('Who to ask if unsure', who)));
  d.body.appendChild(CV.h('div', { class: 'qz-opt-inline' }, word, CV.h('label', { for: 'pst-word' }, 'We also use a code word for urgent payment requests')));
  d.body.appendChild(prev);
  d.body.appendChild(CV.h('div', { class: 'cv-row' }, CV.button('Print the poster', function () { CV.printSheet(build()); }, 'primary')));
  refresh();
  CV.openPoster = function () { d.open(); };
  var h = CV.$('#h-what-to-do-3'), tbl = h && h.closest('section').querySelector('.table-wrap');
  if (tbl) tbl.after(CV.h('div', { class: 'cta-card cv-noprint' },
    CV.h('div', null, CV.h('p', { class: 'cv-kicker' }, 'Tool'), CV.h('p', { class: 'cta-title' }, 'Put the call-back rule on the wall'),
      CV.h('p', { class: 'cta-sub' }, 'Print an A4 poster for everyone who touches payments.')),
    CV.button('Make the poster', function () { d.open(); }, 'primary')));
});

/* --- src/features/117-five-and-five.js --- */
// @msg Five-and-five map: list your key suppliers and customers, rate what stops for two weeks, see your weak spots
// @sel #theme-1 .table-wrap
CV.ready(function () {
  var saved = CV.store.get('fivefive', { s: [], c: [] });
  ['s', 'c'].forEach(function (k) { while (saved[k].length < 5) saved[k].push({ name: '', stops: '', impact: 0 }); });
  var d = CV.dialog({ id: 'fivefive', title: 'Five-and-five map', wide: true,
    note: 'From Theme 1: list your five most important suppliers and five most important customers, and write what stops if each disappears for two weeks. Stays in this browser.' });
  var LEVELS = ['Not rated', 'Annoying', 'Painful', 'We stop trading'];
  function save() { CV.store.set('fivefive', saved); renderMap(); }
  var map = CV.h('div', { class: 'ff-map', 'aria-live': 'polite' });
  function rows(k, label) {
    var wrap = CV.h('fieldset', { class: 'ff-set' }, CV.h('legend', null, label));
    saved[k].forEach(function (r, i) {
      var n = CV.h('input', { type: 'text', class: 'cv-input', placeholder: (k === 's' ? 'Supplier ' : 'Customer ') + (i + 1), 'aria-label': (k === 's' ? 'Supplier ' : 'Customer ') + (i + 1) + ' name' }); n.value = r.name;
      var s = CV.h('input', { type: 'text', class: 'cv-input', placeholder: 'What stops for two weeks?', 'aria-label': 'What stops if ' + (k === 's' ? 'supplier ' : 'customer ') + (i + 1) + ' disappears' }); s.value = r.stops;
      var sel = CV.h('select', { class: 'cv-input', 'aria-label': 'Impact of losing ' + (k === 's' ? 'supplier ' : 'customer ') + (i + 1) });
      LEVELS.forEach(function (l, li) { var o = CV.h('option', { value: String(li) }, l); if (r.impact === li) o.selected = true; sel.appendChild(o); });
      n.addEventListener('input', function () { r.name = n.value; save(); });
      s.addEventListener('input', function () { r.stops = s.value; save(); });
      sel.addEventListener('change', function () { r.impact = +sel.value; save(); });
      wrap.appendChild(CV.h('div', { class: 'ff-row' }, n, s, sel));
    });
    return wrap;
  }
  function renderMap() {
    map.innerHTML = '';
    var all = saved.s.map(function (r) { return [r, 'Supplier']; }).concat(saved.c.map(function (r) { return [r, 'Customer']; })).filter(function (x) { return x[0].name.trim(); });
    if (!all.length) { map.appendChild(CV.h('p', { class: 'ff-empty' }, 'Your map appears here as you fill in names.')); return; }
    all.sort(function (a, b) { return b[0].impact - a[0].impact; });
    var crit = all.filter(function (x) { return x[0].impact === 3; }).length;
    map.appendChild(CV.h('p', { class: 'ff-sum' }, crit ? CV.h('b', null, crit + ' would stop you trading. ') : null,
      crit ? 'Start there: ask how they would tell you about a breach, and what your fallback is.' : 'Rate each one to see where you’re most exposed.'));
    var grid = CV.h('ul', { class: 'ff-grid' });
    all.forEach(function (x) { grid.appendChild(CV.h('li', { class: 'ff-tile lv' + x[0].impact }, CV.h('span', { class: 'ff-kind' }, x[1]), CV.h('b', null, x[0].name), x[0].stops ? CV.h('span', null, x[0].stops) : null, CV.h('span', { class: 'ff-lv' }, LEVELS[x[0].impact]))); });
    map.appendChild(grid);
  }
  d.body.appendChild(CV.h('div', { class: 'ff-sets' }, rows('s', 'Your five key suppliers'), rows('c', 'Your five key customers')));
  d.body.appendChild(CV.h('h3', { class: 'qz-h' }, 'Your map'));
  d.body.appendChild(map);
  d.body.appendChild(CV.h('div', { class: 'cv-row' },
    CV.button('Print the map', function () { var c = map.cloneNode(true); var sheet = CV.h('div', { class: 'ff-sheet' }, CV.h('h2', null, 'Five-and-five map'), CV.h('p', null, 'What stops if each disappears for two weeks. From the UK Small Business Cyber Outlook 2027.'), c); CV.printSheet(sheet); }, 'primary'),
    CV.plan ? CV.button('Mark this action in my plan', function () { CV.plan.add('t1-1'); }) : null));
  renderMap();
  CV.openFiveFive = function () { d.open(); };
  var tw = CV.$('#theme-1 .table-wrap');
  if (tw) tw.after(CV.h('div', { class: 'cta-card cv-noprint' },
    CV.h('div', null, CV.h('p', { class: 'cv-kicker' }, 'Tool'), CV.h('p', { class: 'cta-title' }, 'Map your five and five'),
      CV.h('p', { class: 'cta-sub' }, 'Name your key suppliers and customers, rate what stops, and see your weak spots.')),
    CV.button('Start the map', function () { d.open(); }, 'primary')));
});

/* --- src/features/118-ai-tool-register.js --- */
// @msg AI tool register: list your team's AI tools and flag any that has all three risky abilities at once
// @sel #theme-2 .table-wrap
CV.ready(function () {
  var saved = CV.store.get('aitools', { tools: [], rule: '' });
  var d = CV.dialog({ id: 'aitools', title: 'AI tool register', wide: true,
    note: 'Based on Theme 2: for any AI tool that can read your data, process outside content, and send messages out, switch off at least one of the three. Stays in this browser.' });
  var ABIL = [['data', 'Reads our data'], ['outside', 'Processes outside content'], ['send', 'Sends messages out']];
  var list = CV.h('div', { class: 'ai-list' });
  var rule = CV.h('textarea', { placeholder: 'e.g. No client personal data goes into any AI tool that isn’t on this list.' }); rule.value = saved.rule || '';
  rule.addEventListener('input', function () { saved.rule = rule.value; save(false); });
  function save(re) { CV.store.set('aitools', saved); if (re !== false) render(); }
  function render() {
    list.innerHTML = '';
    if (!saved.tools.length) list.appendChild(CV.h('p', { class: 'ff-empty' }, 'No tools yet. Add the ones your team actually uses, approved or not.'));
    saved.tools.forEach(function (t, i) {
      var three = ABIL.every(function (a) { return t[a[0]]; });
      var name = CV.h('input', { type: 'text', class: 'cv-input', placeholder: 'Tool, e.g. ChatGPT, Copilot', 'aria-label': 'Tool ' + (i + 1) + ' name' }); name.value = t.name || '';
      var who = CV.h('input', { type: 'text', class: 'cv-input', placeholder: 'Who uses it', 'aria-label': 'Who uses tool ' + (i + 1) }); who.value = t.who || '';
      name.addEventListener('change', function () { t.name = name.value; save(); });
      who.addEventListener('change', function () { t.who = who.value; save(); });
      var checks = CV.h('div', { class: 'ai-abil' });
      ABIL.forEach(function (a) {
        var id = 'ai-' + i + '-' + a[0];
        var cb = CV.h('input', { type: 'checkbox', id: id }); cb.checked = !!t[a[0]];
        cb.addEventListener('change', function () { t[a[0]] = cb.checked; save(); });
        checks.appendChild(CV.h('div', { class: 'qz-opt-inline' }, cb, CV.h('label', { for: id }, a[1])));
      });
      var card = CV.h('div', { class: 'ai-card' + (three ? ' risky' : '') },
        CV.h('div', { class: 'ai-top' }, name, who, CV.h('button', { type: 'button', class: 'plan-rm', 'aria-label': 'Remove tool ' + (i + 1), onclick: function () { saved.tools.splice(i, 1); save(); } }, '×')),
        checks,
        three ? CV.h('p', { class: 'ai-warn' }, CV.h('b', null, 'All three are on.'), ' Switch off at least one: limit what it can read, stop it processing outside content, or stop it sending messages out.') : null);
      list.appendChild(card);
    });
    var risky = saved.tools.filter(function (t) { return ABIL.every(function (a) { return t[a[0]]; }); }).length;
    sum.textContent = saved.tools.length ? saved.tools.length + ' tool' + (saved.tools.length === 1 ? '' : 's') + ' listed. ' + (risky ? risky + ' with all three abilities.' : 'None has all three abilities.') : '';
  }
  var sum = CV.h('p', { class: 'ai-sum', 'aria-live': 'polite' });
  d.body.appendChild(sum);
  d.body.appendChild(list);
  d.body.appendChild(CV.h('div', { class: 'cv-row' }, CV.button('+ Add a tool', function () { saved.tools.push({}); save(); var ins = list.querySelectorAll('.ai-card input[type=text]'); if (ins.length) ins[ins.length - 2].focus(); })));
  d.body.appendChild(CV.field('Your client data rule', rule));
  d.body.appendChild(CV.h('div', { class: 'cv-row' }, CV.button('Print the register', function () {
    var t = CV.h('table', null, CV.h('thead', null, CV.h('tr', null, ['Tool', 'Who uses it', 'Reads our data', 'Outside content', 'Sends out'].map(function (x) { return CV.h('th', null, x); }))));
    var tb = CV.h('tbody'); saved.tools.forEach(function (x) { tb.appendChild(CV.h('tr', null, CV.h('td', null, x.name || ''), CV.h('td', null, x.who || ''), ABIL.map(function (a) { return CV.h('td', null, x[a[0]] ? 'Yes' : 'No'); }))); }); t.appendChild(tb);
    CV.printSheet(CV.h('div', { class: 'ai-sheet' }, CV.h('h2', null, 'AI tool register'), t, CV.h('h3', null, 'Client data rule'), CV.h('p', null, saved.rule || '______________________________________________'), CV.h('p', { class: 'pst-src' }, 'From the UK Small Business Cyber Outlook 2027 · cyberoutlook.sbcsg.uk')));
  }, 'primary'), CV.plan ? CV.button('Add this action to my plan', function () { CV.plan.add('t2-1'); }) : null));
  render();
  CV.openAiTools = function () { d.open(); };
  var tw = CV.$('#theme-2 .table-wrap');
  if (tw) tw.after(CV.h('div', { class: 'cta-card cv-noprint' },
    CV.h('div', null, CV.h('p', { class: 'cv-kicker' }, 'Tool'), CV.h('p', { class: 'cta-title' }, 'Build your AI tool register'),
      CV.h('p', { class: 'cta-sub' }, 'List the tools, tick what each can do, and spot any with all three risky abilities.')),
    CV.button('Start the register', function () { d.open(); }, 'primary')));
});

/* --- src/features/119-wallet-card.js --- */
// @msg Wallet card: print your "who to call" contacts as cards for every wallet and the office
// @sel #mvc .plan-tools
CV.ready(function () {
  var rows = CV.$$('.a4 tbody tr'); if (!rows.length) return;
  function contacts() {
    var saved = {}; try { saved = JSON.parse(localStorage.getItem('cv-plan-contacts') || '{}'); } catch (e) {}
    var cells = CV.$$('.a4 td.fill');
    return rows.map(function (tr) { var c = tr.children; var fill = tr.querySelector('td.fill'); var idx = cells.indexOf(fill); return { n: CV.text(c[0]), who: CV.text(c[1]), when: CV.text(c[2]), contact: (idx > -1 && saved[idx]) ? saved[idx] : (fill ? CV.text(fill) : '') }; });
  }
  function card() {
    var list = contacts();
    return CV.h('div', { class: 'wc' },
      CV.h('div', { class: 'wc-head' }, CV.h('b', null, 'Cyber incident?'), CV.h('span', null, 'Call in this order')),
      CV.h('ol', null, list.map(function (x) { return CV.h('li', null, CV.h('span', { class: 'wc-who' }, x.who.replace(/\s*\(.*\)$/, '')), CV.h('span', { class: 'wc-c' }, x.contact || ' ')); })),
      CV.h('p', { class: 'wc-foot' }, 'From our one-page plan · cyberoutlook.sbcsg.uk'));
  }
  function print() {
    var sheet = CV.h('div', { class: 'wc-sheet' }, card(), card(), card(), card(), card(), card());
    CV.printSheet(sheet);
  }
  var tools = CV.$('.plan-tools');
  if (tools) {
    var b = CV.button('Print wallet cards', print);
    b.title = 'Six credit-card-sized copies of your contact list on one page';
    tools.insertBefore(b, tools.querySelector('.plan-note'));
  }
  CV.printWalletCards = print;
});

/* --- src/features/120-waffle-43.js --- */
// @msg The 43% problem, drawn: an interactive 100-business grid showing 43%, 1 in 5 and 1 in 33
// @sel #h-43
CV.ready(function () {
  var h = CV.$('#h-43'); if (!h) return;
  var host = h.closest('.box') || h.parentNode;
  var VIEWS = [
    { k: 'all', n: 43, label: '43 in 100', title: 'Identified a breach or attack', note: 'The headline. Includes phishing emails that arrived and did nothing.' },
    { k: 'crime', n: 19, label: '1 in 5', title: 'Victim of at least one cyber crime', note: '19% of businesses. 17% of micro firms, 24% of small ones.' },
    { k: 'nophish', n: 3, label: '1 in 33', title: 'Victim of cyber crime other than phishing', note: '3% of businesses. Where the risk really sits: email, payments and trust.' }
  ];
  var grid = CV.h('div', { class: 'wf-grid', 'aria-hidden': 'true' });
  for (var i = 0; i < 100; i++) grid.appendChild(CV.h('span'));
  var big = CV.h('p', { class: 'wf-big', 'aria-live': 'polite' });
  var note = CV.h('p', { class: 'wf-note' });
  var tabs = CV.h('div', { class: 'wf-tabs', role: 'radiogroup', 'aria-label': 'Which figure to show' });
  function show(v) {
    CV.$$('span', grid).forEach(function (s, i) { s.className = i < v.n ? 'on ' + v.k : ''; });
    big.innerHTML = ''; big.appendChild(CV.h('b', null, v.label)); big.appendChild(document.createTextNode(' ' + v.title.toLowerCase()));
    note.textContent = v.note;
    CV.$$('button', tabs).forEach(function (b) { var on = b.dataset.k === v.k; b.setAttribute('aria-checked', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; });
  }
  VIEWS.forEach(function (v, i) {
    var b = CV.h('button', { type: 'button', role: 'radio', 'data-k': v.k, class: 'wf-tab' }, CV.h('b', null, v.label), CV.h('span', null, v.title));
    b.addEventListener('click', function () { show(v); });
    b.addEventListener('keydown', function (e) { var d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0; if (!d) return; e.preventDefault(); var nv = VIEWS[(i + d + VIEWS.length) % VIEWS.length]; show(nv); tabs.querySelector('[data-k="' + nv.k + '"]').focus(); });
    tabs.appendChild(b);
  });
  var fig = CV.h('figure', { class: 'wf' },
    CV.h('div', { class: 'wf-top' }, CV.h('p', { class: 'cv-kicker' }, 'Picture 100 UK businesses'), tabs),
    CV.h('div', { class: 'wf-body' }, grid, CV.h('div', { class: 'wf-text' }, big, note)),
    CV.h('figcaption', null, 'Cyber Security Breaches Survey 2025/26 [1]. Each square is one business in 100.'));
  host.after(fig);
  show(VIEWS[0]);
  // Gentle auto-step once when it first comes into view, unless the reader prefers less motion.
  if (!CV.reduced() && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); setTimeout(function () { show(VIEWS[1]); }, 1400); setTimeout(function () { show(VIEWS[2]); }, 2900); } }, { threshold: 0.6 });
    io.observe(fig);
  }
});

/* --- src/features/121-episode-guide.js --- */
// @msg Podcast episode guide: all nine episodes with dates, what's out now, and calendar reminders for the rest
// @sel #ep-guide
CV.ready(function () {
  var h = CV.$$('#how-to-read h3').filter(function (x) { return /podcast series/i.test(x.textContent); })[0];
  if (!h) return;
  var para = h.nextElementSibling;
  var now = CV.today();
  var ol = CV.h('ol', { class: 'ep-list' });
  CV.EPISODES.forEach(function (e) {
    var d = CV.parseDate(e.date), out = d <= now, next = !out && !ol.querySelector('.next');
    var sec = CV.$('#' + e.section), secName = sec ? CV.text(sec.querySelector('h2')) : '';
    ol.appendChild(CV.h('li', { class: 'ep' + (out ? ' out' : '') + (next ? ' next' : '') },
      CV.h('span', { class: 'ep-n' }, String(e.n)),
      CV.h('div', { class: 'ep-main' },
        CV.h('b', null, e.title),
        CV.h('span', { class: 'ep-meta' }, d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }), ' · ', CV.h('a', { href: '#' + e.section }, secName))),
      CV.h('span', { class: 'ep-state' }, out ? 'Out now' : next ? 'Next' : 'Coming')));
  });
  var upcoming = CV.EPISODES.filter(function (e) { return CV.parseDate(e.date) > now; });
  var box = CV.h('div', { class: 'ep-guide cv-noprint', id: 'ep-guide' },
    CV.h('div', { class: 'ep-head' }, CV.h('p', { class: 'cv-kicker' }, 'Companion podcast'), CV.h('p', { class: 'ep-title' }, 'Nine episodes, one a week')),
    ol,
    CV.h('div', { class: 'cv-row' },
      CV.h('a', { class: 'tool primary', href: CV.PODCAST, rel: 'noopener' }, 'Listen on the podcast site'),
      upcoming.length ? CV.button('Remind me of the next ' + upcoming.length, function () {
        CV.ics(upcoming.map(function (e) { return { title: 'Podcast ep ' + e.n + ': ' + e.title, date: CV.parseDate(e.date), description: 'The Small Business Cyber Security Guy, companion series to the ' + CV.TITLE + '.', url: CV.PODCAST }; }), 'cyber-outlook-podcast.ics');
      }) : null));
  (para && para.tagName === 'P' ? para : h).after(box);
});

/* --- src/features/122-listen-cards.js --- */
// @msg Listen cards: each section's "On the podcast" line becomes a card showing which episodes are out and where to listen
// @sel #theme-1 .listen
CV.ready(function () {
  var now = CV.today();
  CV.$$('main section .prose > p').forEach(function (p) {
    var strong = p.querySelector('strong'); if (!strong || !/On the podcast/i.test(strong.textContent)) return;
    var nums = (p.textContent.match(/episode\s+(\d)/gi) || []).map(function (m) { return +m.replace(/\D/g, ''); });
    var eps = CV.EPISODES.filter(function (e) { return nums.indexOf(e.n) > -1; }); if (!eps.length) return;
    var card = CV.h('aside', { class: 'listen', 'aria-label': 'Podcast episodes for this section' },
      CV.h('div', { class: 'listen-icon', 'aria-hidden': 'true' }, CV.h('span'), CV.h('span'), CV.h('span'), CV.h('span')),
      CV.h('div', { class: 'listen-main' },
        CV.h('p', { class: 'cv-kicker' }, 'On the podcast'),
        CV.h('ul', null, eps.map(function (e) { var out = CV.parseDate(e.date) <= now; return CV.h('li', null, CV.h('b', null, 'Ep ' + e.n + ': ' + e.title), CV.h('span', { class: 'listen-when' + (out ? ' out' : '') }, out ? 'Out now' : CV.parseDate(e.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }))); })),
        /Do it before/.test(p.textContent) ? CV.h('p', { class: 'listen-extra' }, 'Do it before everyone’s back.') : null),
      CV.h('a', { class: 'tool primary', href: CV.PODCAST, rel: 'noopener' }, 'Listen'));
    p.classList.add('listen-src'); p.setAttribute('aria-hidden', 'true');
    p.after(card);
  });
});

/* --- src/features/123-citation-cards.js --- */
// @msg Citation cards: hover, tap or focus a citation to see the source, its date and type, without leaving your place
// @sel #theme-1
CV.ready(function () {
  var card = CV.h('div', { class: 'cite-card', role: 'tooltip', id: 'cite-card', hidden: true });
  document.body.appendChild(card);
  var hideT, current;
  function kind(t) {
    if (/podcast|blog/i.test(t)) return 'Our own episode or article';
    if (/^(Department|National Cyber|Information Commissioner|UK Parliament|City of London Police)/.test(t)) return 'Official source';
    if (/IASME/.test(t)) return 'Certification body';
    if (/arXiv|Willison/.test(t)) return 'Research';
    return 'Press or industry report';
  }
  function build(a) {
    var li = document.getElementById(a.getAttribute('href').slice(1)); if (!li) return false;
    var clone = li.cloneNode(true); CV.$$('.backrefs', clone).forEach(function (n) { n.remove(); });
    var link = clone.querySelector('a[href^="http"]'), url = link ? link.href : '';
    if (link) link.remove();
    var vendor = !!clone.querySelector('.flag'); CV.$$('.flag', clone).forEach(function (n) { n.remove(); });
    var t = CV.text(clone).replace(/\s*\.?\s*$/, '');
    card.innerHTML = '';
    card.appendChild(CV.h('p', { class: 'cc-k' }, 'Source ' + li.id.slice(1) + ' · ' + kind(t) + (vendor ? ' · vendor figure' : '')));
    card.appendChild(CV.h('p', { class: 'cc-t' }, t));
    if (url) card.appendChild(CV.h('p', { class: 'cc-u' }, url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]));
    return true;
  }
  function place(a) {
    var r = a.getBoundingClientRect(), w = Math.min(340, window.innerWidth - 32);
    card.style.width = w + 'px';
    var x = Math.max(16, Math.min(window.innerWidth - w - 16, r.left + r.width / 2 - w / 2));
    card.hidden = false;
    var ch = card.offsetHeight, y = r.top - ch - 10 < 8 ? r.bottom + 10 : r.top - ch - 10;
    card.style.left = x + 'px'; card.style.top = y + 'px';
  }
  function show(a) { clearTimeout(hideT); if (current === a && !card.hidden) return; if (!build(a)) return; current = a; a.setAttribute('aria-describedby', 'cite-card'); a.removeAttribute('title'); place(a); }
  function hide() { hideT = setTimeout(function () { card.hidden = true; if (current) current.removeAttribute('aria-describedby'); current = null; }, 120); }
  CV.$$('sup.cite a[href^="#s"]').forEach(function (a) {
    a.removeAttribute('title');
    a.addEventListener('mouseenter', function () { show(a); });
    a.addEventListener('mouseleave', hide);
    a.addEventListener('focus', function () { show(a); });
    a.addEventListener('blur', hide);
  });
  card.addEventListener('mouseenter', function () { clearTimeout(hideT); });
  card.addEventListener('mouseleave', hide);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !card.hidden) { card.hidden = true; } });
  window.addEventListener('scroll', function () { if (!card.hidden) card.hidden = true; }, { passive: true });
});

/* --- src/features/124-share-quote.js --- */
// @msg Share a quote: select any sentence to post it to LinkedIn or copy it with a link straight back to that spot
// @sel #foreword
CV.ready(function () {
  var pop = CV.h('div', { class: 'sq', role: 'toolbar', 'aria-label': 'Share this quote', hidden: true });
  var li = CV.h('button', { type: 'button', class: 'sq-b' }, 'Post on LinkedIn');
  var cp = CV.h('button', { type: 'button', class: 'sq-b' }, 'Copy quote');
  pop.appendChild(li); pop.appendChild(cp); document.body.appendChild(pop);
  var quote = '';
  function link() {
    var words = quote.split(/\s+/); var frag = words.length > 8 ? encodeURIComponent(words.slice(0, 4).join(' ')) + ',' + encodeURIComponent(words.slice(-4).join(' ')) : encodeURIComponent(quote);
    return CV.SITE + '#:~:text=' + frag.replace(/-/g, '%2D');
  }
  function update() {
    var sel = window.getSelection(); if (!sel || sel.isCollapsed || !sel.rangeCount) { pop.hidden = true; return; }
    var r = sel.getRangeAt(0), node = r.commonAncestorContainer; node = node.nodeType === 1 ? node : node.parentNode;
    if (!node.closest || !node.closest('main') || node.closest('input,textarea,dialog,table,.cv-dialog')) { pop.hidden = true; return; }
    quote = sel.toString().replace(/\s+/g, ' ').replace(/\[\d+\]/g, '').trim();
    if (quote.length < 20 || quote.length > 600) { pop.hidden = true; return; }
    var rect = r.getBoundingClientRect(); pop.hidden = false;
    var w = pop.offsetWidth, x = Math.max(12, Math.min(window.innerWidth - w - 12, rect.left + rect.width / 2 - w / 2));
    var y = rect.top - pop.offsetHeight - 10; if (y < 10) y = rect.bottom + 10;
    pop.style.left = x + 'px'; pop.style.top = y + 'px';
  }
  document.addEventListener('mouseup', function () { setTimeout(update, 10); });
  document.addEventListener('keyup', function (e) { if (e.shiftKey || e.key === 'Shift') update(); });
  document.addEventListener('selectionchange', function () { var s = window.getSelection(); if (!s || s.isCollapsed) pop.hidden = true; });
  window.addEventListener('scroll', function () { pop.hidden = true; }, { passive: true });
  pop.addEventListener('mousedown', function (e) { e.preventDefault(); });
  cp.addEventListener('click', function () { CV.copy('“' + quote + '”\n— Noel Bradford, ' + CV.TITLE + '\n' + link(), 'Quote copied with a link'); pop.hidden = true; });
  li.addEventListener('click', function () {
    var text = '“' + quote + '”\n\nFrom the ' + CV.TITLE + ' by Noel Bradford: ' + CV.SITE;
    CV.copy(text, 'Quote copied. Paste it into your LinkedIn post');
    window.open('https://www.linkedin.com/feed/?shareActive=true&text=' + encodeURIComponent(text), '_blank', 'noopener');
    pop.hidden = true;
  });
});

/* --- src/features/125-what-next.js --- */
// @msg What next: a closing panel after the 90-day plan with three clear routes: do it, share it, keep listening
// @sel #what-next
CV.ready(function () {
  var after = CV.$('#ninety'); if (!after) return;
  var five = 0; try { var s = JSON.parse(localStorage.getItem('cv-five-things') || '{}'); Object.keys(s).forEach(function (k) { if (s[k]) five++; }); } catch (e) {}
  function card(k, title, sub, btn, fn, primary) {
    return CV.h('div', { class: 'wn-card' + (primary ? ' primary' : '') }, CV.h('p', { class: 'cv-kicker' }, k), CV.h('p', { class: 'wn-t' }, title), CV.h('p', { class: 'wn-s' }, sub), btn ? CV.button(btn, fn, primary ? 'primary' : '') : null);
  }
  var panel = CV.h('section', { class: 'what-next cv-noprint', id: 'what-next', 'aria-labelledby': 'wn-h' },
    CV.h('h2', { id: 'wn-h' }, 'What next?'),
    CV.h('p', { class: 'wn-lead' }, 'You’ve read the plan. Here’s how to make it happen.'),
    CV.h('div', { class: 'wn-grid' },
      card('Do it', CV.plan && CV.plan.count() ? 'Open your plan' : 'Build your plan', CV.plan && CV.plan.count() ? CV.plan.count() + ' actions saved. Give each an owner and a date.' : 'Take the two-minute check and turn your gaps into dated actions.',
        CV.plan && CV.plan.count() ? 'Open my plan' : 'Take the check', function () { if (CV.plan && CV.plan.count()) CV.plan.open(); else if (CV.openCheck) CV.openCheck(true); }, true),
      card('Share it', 'Send it to one business owner', 'A link and one line from you is the easiest way to get it in front of someone who needs it.', 'Share the report', function () { if (CV.openShare) CV.openShare(); else CV.copy(CV.SITE, 'Link copied'); }),
      card('Keep going', 'Nine weekly episodes', 'The podcast series walks through every theme, Mondays to 28 December.', 'Go to the podcast', function () { window.open(CV.PODCAST, '_blank', 'noopener'); })),
    CV.h('p', { class: 'wn-five' }, five === 5 ? 'You’ve done all five things. That’s the floor in place.' : 'Five things done so far: ' + five + ' of 5. ', five < 5 ? CV.h('a', { href: '#h-if-you-do-five-things-before-january' }, 'Finish the list') : null));
  after.after(panel);
});

/* --- src/features/126-stat-cards.js --- */
// @msg Shareable stat cards: turn any figure in "The year in numbers" into a branded image for LinkedIn
// @sel #numbers .stats
CV.ready(function () {
  var stats = CV.$$('#numbers .stat'); if (!stats.length) return;
  var logo = CV.$('.brand');
  function wrap(ctx, text, x, y, maxW, lh) {
    var words = text.split(' '), line = '', lines = [];
    words.forEach(function (w) { var t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; });
    if (line) lines.push(line);
    lines.forEach(function (l, i) { ctx.fillText(l, x, y + i * lh); });
    return lines.length;
  }
  function render(n, label, src) {
    var c = document.createElement('canvas'); c.width = 1200; c.height = 1200; var x = c.getContext('2d');
    x.fillStyle = '#0e161b'; x.fillRect(0, 0, 1200, 1200);
    x.strokeStyle = 'rgba(98,184,181,0.35)'; x.lineWidth = 3;
    for (var k = 0; k < 4; k++) { x.beginPath(); x.moveTo(0, 940 + k * 40); x.bezierCurveTo(300, 880 + k * 40, 600, 1000 + k * 40, 1200, 900 + k * 40); x.stroke(); }
    x.strokeStyle = '#e6b043'; x.beginPath(); x.moveTo(0, 900); x.bezierCurveTo(300, 840, 600, 960, 1200, 860); x.stroke();
    x.fillStyle = '#e6b043'; x.font = '600 30px "IBM Plex Sans", sans-serif'; x.fillText('UK SMALL BUSINESS CYBER OUTLOOK 2027', 90, 130);
    x.fillStyle = '#e2e9e9'; x.font = '700 320px "Barlow Condensed", "Arial Narrow", sans-serif'; x.fillText(n, 80, 470);
    x.font = '400 54px "Source Serif 4", Georgia, serif'; var lines = wrap(x, label, 90, 580, 1000, 70);
    x.fillStyle = '#9aa9ae'; x.font = '500 28px "IBM Plex Sans", sans-serif'; x.fillText('Source: ' + src, 90, 600 + lines * 70 + 10);
    x.fillStyle = '#62b8b5'; x.font = '600 34px "IBM Plex Sans", sans-serif'; x.fillText('cyberoutlook.sbcsg.uk', 90, 1110);
    if (logo && logo.complete) { try { x.drawImage(logo, 1200 - 90 - 150, 1110 - 120, 150, 150); } catch (e) {} }
    return c;
  }
  var d = CV.dialog({ id: 'statcard', title: 'Share this figure', note: 'The image is made in your browser. The figure and source are exactly as in the report.' });
  var img = CV.h('img', { class: 'sc-img', alt: '' });
  var cur;
  d.body.appendChild(img);
  d.body.appendChild(CV.h('div', { class: 'cv-row' },
    CV.button('Download image', function () { cur.c.toBlob(function (b) { CV.download('cyber-outlook-' + CV.slug(cur.n) + '.png', 'image/png', b); }); }, 'primary'),
    CV.button('Copy post text', function () { CV.copy(cur.n + ' ' + cur.label + '\n\nSource: ' + cur.src + ', via the ' + CV.TITLE + ' by Noel Bradford.\n\n' + CV.SITE, 'Post text copied'); })));
  stats.forEach(function (st) {
    var n = CV.text(st.querySelector('.n')), l = CV.text(st.querySelector('.l')), s = CV.text(st.querySelector('.s')).replace(/\s*\[\d+\]/g, '').replace(/\s*;\s*/g, '; ').replace(/\bCSBS\b/g, 'Cyber Security Breaches Survey').trim();
    var b = CV.h('button', { type: 'button', class: 'sc-btn', 'aria-label': 'Share this figure: ' + n + ' ' + l }, 'Share');
    b.addEventListener('click', function () {
      document.fonts.ready.then(function () { var c = render(n, l, s); cur = { c: c, n: n, label: l, src: s }; img.src = c.toDataURL('image/png'); img.alt = n + ' ' + l; d.open(); });
    });
    st.appendChild(b);
  });
});

/* --- src/features/127-share-hub.js --- */
// @msg Share hub: one place to share the report, with three ready-to-post LinkedIn drafts built from its own figures
// @sel #start
CV.ready(function () {
  var POSTS = [
    { k: 'The honest number', t: 'You’ll see "43% of UK businesses had a breach" on a lot of slides this year. It counts phishing emails that arrived and did nothing.\n\nThe honest numbers from the government’s Cyber Security Breaches Survey 2025/26: 1 in 5 businesses was the victim of a cyber crime. Take phishing out and it’s 1 in 33.\n\nThe risk for a small firm sits in email, payments and trust. Noel Bradford’s UK Small Business Cyber Outlook 2027 is free to read:' },
    { k: 'Five things', t: 'Five things a UK small business can do before January, almost all of them free:\n\n1. Multi-factor authentication on every cloud service, email first\n2. A call-back rule for any change to bank details or urgent payment\n3. Four questions to your IT provider\n4. A list of your five key suppliers, five key customers and the AI tools your staff use\n5. A one-page incident plan, printed\n\nFrom the UK Small Business Cyber Outlook 2027:' },
    { k: 'Suppliers', t: 'The incident most likely to stop a small UK firm trading in 2027 will start at somebody else’s business.\n\nOnly 12% of micro firms and 22% of small ones have reviewed the cyber risks from their immediate suppliers (Cyber Security Breaches Survey 2025/26).\n\nStart with five suppliers, five customers, and what stops if each disappears for two weeks. The UK Small Business Cyber Outlook 2027:' }
  ];
  var d = CV.dialog({ id: 'share', title: 'Share the outlook', wide: true, note: 'Every figure in these drafts is from the report and its sources. Edit them to sound like you.' });
  var url = CV.SITE;
  var quick = CV.h('div', { class: 'cv-row sh-quick' },
    CV.h('a', { class: 'tool primary', href: 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url), rel: 'noopener', target: '_blank' }, 'Share link on LinkedIn'),
    CV.h('a', { class: 'tool', href: 'https://wa.me/?text=' + encodeURIComponent('Worth 10 minutes before January: the UK Small Business Cyber Outlook 2027 ' + url), rel: 'noopener', target: '_blank' }, 'WhatsApp'),
    CV.h('a', { class: 'tool', href: 'mailto:?subject=' + encodeURIComponent(CV.TITLE) + '&body=' + encodeURIComponent('Thought this was worth a look before January:\n\n' + url) }, 'Email'),
    CV.button('Copy link', function () { CV.copy(url, 'Link copied'); }));
  d.body.appendChild(quick);
  d.body.appendChild(CV.h('h3', { class: 'qz-h' }, 'Ready-made LinkedIn posts'));
  var tabs = CV.h('div', { class: 'sh-tabs', role: 'tablist', 'aria-label': 'Post drafts' });
  var ta = CV.h('textarea', { class: 'cv-input sh-text', id: 'sh-text', 'aria-label': 'Post text, editable' });
  POSTS.forEach(function (p, i) {
    var b = CV.h('button', { type: 'button', role: 'tab', class: 'sh-tab', id: 'sh-tab-' + i, 'aria-controls': 'sh-text' }, p.k);
    b.addEventListener('click', function () { ta.value = p.t + ' ' + url; CV.$$('.sh-tab', tabs).forEach(function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); }); });
    tabs.appendChild(b);
  });
  d.body.appendChild(tabs); d.body.appendChild(ta);
  d.body.appendChild(CV.h('div', { class: 'cv-row' },
    CV.button('Copy post', function () { CV.copy(ta.value, 'Post copied'); }, 'primary'),
    CV.button('Copy and open LinkedIn', function () { CV.copy(ta.value, 'Post copied. Paste it into LinkedIn'); window.open('https://www.linkedin.com/feed/?shareActive=true&text=' + encodeURIComponent(ta.value), '_blank', 'noopener'); }),
    CV.h('a', { class: 'tool', href: 'linkedin/CyberOutlook2027_LinkedIn_Carousel.pdf' }, 'Get the 10-slide carousel (PDF)')));
  tabs.firstChild.click();
  CV.openShare = function () { d.open(); };
  var li = CV.$('.cover .tools a[href*="linkedin.com/sharing"]');
  var btn = CV.button('Share', function () { d.open(); });
  if (li) li.replaceWith(btn); else CV.addTool(btn);
});

/* --- src/features/128-send-to-colleague.js --- */
// @msg Send to the right person: role-based messages for your IT provider, finance lead, co-director or team, each pointing to the part they need
// @sel #start
CV.ready(function () {
  var d = document.getElementById('share'); if (!d) return;
  var body = d.querySelector('.cv-dialog-body');
  var ROLES = [
    { k: 'IT provider', anchor: '#h-what-to-do', msg: 'Hi, we’re working through the UK Small Business Cyber Outlook 2027 and want to go through the four questions for IT providers with you, plus one about backups. They’re here: ' },
    { k: 'Finance lead', anchor: '#theme-3', msg: 'Can you read the "Crime gets cheaper and faster" section of this? It covers payment fraud and the call-back rule we should agree before January: ' },
    { k: 'Co-director', anchor: '#summary', msg: 'Five-minute read before our next meeting: the executive summary of the UK Small Business Cyber Outlook 2027. Most of what it asks us to do is free: ' },
    { k: 'The whole team', anchor: '#h-if-you-do-five-things-before-january', msg: 'Five things we’re doing before January to keep the business safe. Please read this short list: ' }
  ];
  var ta = CV.h('textarea', { class: 'cv-input sh-text', id: 'col-text', 'aria-label': 'Message, editable', style: 'min-height:7rem' });
  var cur = ROLES[0];
  function set(r) { cur = r; ta.value = r.msg + CV.SITE + r.anchor; CV.$$('.col-tab', tabs).forEach(function (x) { x.setAttribute('aria-pressed', x.textContent === r.k ? 'true' : 'false'); }); }
  var tabs = CV.h('div', { class: 'sh-tabs' });
  ROLES.forEach(function (r) { var b = CV.h('button', { type: 'button', class: 'sh-tab col-tab' }, r.k); b.addEventListener('click', function () { set(r); }); tabs.appendChild(b); });
  CV.$$('.sh-tab', tabs).forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
  var wa = CV.h('a', { class: 'tool', href: '#', target: '_blank', rel: 'noopener' }, 'WhatsApp');
  wa.addEventListener('click', function () { wa.href = 'https://wa.me/?text=' + encodeURIComponent(ta.value); });
  var em = CV.h('a', { class: 'tool', href: '#' }, 'Email');
  em.addEventListener('click', function () { em.href = 'mailto:?subject=' + encodeURIComponent('Cyber Outlook 2027: for you') + '&body=' + encodeURIComponent(ta.value); });
  var block = CV.h('div', { class: 'col-block' },
    CV.h('h3', { class: 'qz-h' }, 'Send it to the right person'),
    CV.h('p', { class: 'cta-sub' }, 'Each message links straight to the part of the report that person needs.'),
    tabs, ta, CV.h('div', { class: 'cv-row' }, CV.button('Copy message', function () { CV.copy(ta.value, 'Message copied'); }, 'primary'), wa, em));
  body.insertBefore(block, body.children[1]);
  set(ROLES[0]);
});

/* --- src/features/129-welcome-back.js --- */
// @msg Welcome back: returning readers pick up exactly where they stopped, with their progress in one line
// @sel #start
CV.ready(function () {
  var secs = CV.$$('main section.section[id]');
  var last = CV.store.get('pos', null);
  var t;
  function remember() {
    clearTimeout(t);
    t = setTimeout(function () {
      var y = window.innerHeight * 0.3, cur = null;
      secs.forEach(function (s) { if (s.getBoundingClientRect().top <= y) cur = s; });
      if (!cur) return;
      var h = cur.querySelector('h2');
      var ratio = Math.max(0, Math.min(1, (y - cur.getBoundingClientRect().top) / cur.offsetHeight));
      CV.store.set('pos', { id: cur.id, title: CV.text(h).replace(/#$/, '').trim(), r: Math.round(ratio * 100) / 100, at: Date.now() });
    }, 400);
  }
  window.addEventListener('scroll', remember, { passive: true });
  if (!last || location.hash || !document.getElementById(last.id) || Date.now() - last.at < 60000) return;
  if (last.id === 'foreword' && last.r < 0.1) return;
  var bits = [];
  var five = 0; try { var s = JSON.parse(localStorage.getItem('cv-five-things') || '{}'); Object.keys(s).forEach(function (k) { if (s[k]) five++; }); } catch (e) {}
  bits.push(five + ' of 5 things done');
  if (CV.plan && CV.plan.count()) bits.push(CV.plan.count() + ' actions in your plan');
  var bar = CV.h('div', { class: 'wb', role: 'region', 'aria-label': 'Welcome back' },
    CV.h('div', { class: 'wb-in' },
      CV.h('p', null, CV.h('b', null, 'Welcome back. '), 'You were reading ', CV.h('i', null, last.title), '. ', CV.h('span', { class: 'wb-p' }, bits.join(' · '))),
      CV.h('div', { class: 'cv-row' },
        CV.button('Carry on reading', function () {
          var sec = document.getElementById(last.id);
          var y = sec.getBoundingClientRect().top + window.scrollY + sec.offsetHeight * last.r - window.innerHeight * 0.3;
          window.scrollTo({ top: Math.max(0, y), behavior: CV.reduced() ? 'auto' : 'smooth' }); bar.remove();
        }, 'primary'),
        CV.h('button', { type: 'button', class: 'wb-x', 'aria-label': 'Dismiss', onclick: function () { bar.remove(); } }, '×'))));
  document.body.appendChild(bar);
  setTimeout(function () { bar.classList.add('show'); }, 50);
});

/* --- src/features/130-search.js --- */
// @msg Search the report: press / or Ctrl+K, type, and jump straight to the paragraph, with matches highlighted
// @sel #start
CV.ready(function () {
  var blocks = CV.$$('main p, main li, main h2, main h3, main td, main .stat').filter(function (el) { return !el.closest('dialog,.next-sec,.listen,.ep-guide,.what-next,.cta-card,.plan-tools,.five-foot,.wf') && !el.classList.contains('listen-src') && CV.text(el).length > 2; });
  function txt(el) { var c = el.cloneNode(true); CV.$$('.h-anchor,.sc-btn,.plan-add,.backrefs', c).forEach(function (n) { n.parentNode.removeChild(n); }); return CV.text(c); }
  var index = blocks.map(function (el) { var sec = el.closest('section[id]'); return { el: el, t: txt(el), lc: txt(el).toLowerCase(), sec: sec ? CV.text(sec.querySelector('h2')).replace(/#$/, '').trim() : '' }; });
  var d = CV.dialog({ id: 'search', title: 'Search the report', wide: true, cls: 'top' });
  var input = CV.h('input', { type: 'search', id: 'sr-q', class: 'cv-input sr-q', placeholder: 'Try "backup", "MFA", "Danzell", "invoice"', autocomplete: 'off', 'aria-controls': 'sr-res' });
  var count = CV.h('p', { class: 'sr-count', 'aria-live': 'polite' });
  var res = CV.h('ol', { class: 'sr-res', id: 'sr-res' });
  d.body.appendChild(input); d.body.appendChild(count); d.body.appendChild(res);
  function snippet(t, q) { var i = t.toLowerCase().indexOf(q), s = Math.max(0, i - 60), e = Math.min(t.length, i + q.length + 90); var pre = (s ? '…' : '') + t.slice(s, i), hit = t.slice(i, i + q.length), post = t.slice(i + q.length, e) + (e < t.length ? '…' : ''); return [pre, CV.h('mark', null, hit), post]; }
  function clearMarks() { CV.$$('.sr-hit').forEach(function (n) { n.classList.remove('sr-hit'); }); }
  function go(el) { d.close(); clearMarks(); el.classList.add('sr-hit'); el.scrollIntoView({ block: 'center', behavior: CV.reduced() ? 'auto' : 'smooth' }); setTimeout(clearMarks, 4000); }
  var t;
  function run() {
    var q = input.value.trim().toLowerCase(); res.innerHTML = '';
    if (q.length < 2) { count.textContent = ''; return; }
    var hits = index.filter(function (x) { return x.lc.indexOf(q) > -1; });
    count.textContent = hits.length ? hits.length + ' match' + (hits.length === 1 ? '' : 'es') + (hits.length > 40 ? '. Showing the first 40.' : '') : 'No matches. Try a shorter word.';
    hits.slice(0, 40).forEach(function (x, i) {
      var b = CV.h('button', { type: 'button', class: 'sr-item' }, CV.h('span', { class: 'sr-sec' }, x.sec), CV.h('span', { class: 'sr-snip' }, snippet(x.t, q)));
      b.addEventListener('click', function () { go(x.el); });
      res.appendChild(CV.h('li', null, b));
    });
  }
  input.addEventListener('input', function () { clearTimeout(t); t = setTimeout(run, 120); });
  input.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown') { var f = res.querySelector('button'); if (f) { e.preventDefault(); f.focus(); } } if (e.key === 'Enter') { var f2 = res.querySelector('button'); if (f2) f2.click(); } });
  res.addEventListener('keydown', function (e) { var bs = CV.$$('button', res), i = bs.indexOf(document.activeElement); if (e.key === 'ArrowDown' && i < bs.length - 1) { e.preventDefault(); bs[i + 1].focus(); } if (e.key === 'ArrowUp') { e.preventDefault(); (i > 0 ? bs[i - 1] : input).focus(); } });
  CV.openSearch = function () { d.open(); setTimeout(function () { input.focus(); input.select(); }, 30); };
  document.addEventListener('keydown', function (e) {
    var tag = (e.target.tagName || '').toLowerCase(), typing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
    if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !typing)) { e.preventDefault(); CV.openSearch(); }
  });
  var b = CV.h('button', { type: 'button', class: 'tool search-tool', 'aria-keyshortcuts': '/ Control+K', onclick: CV.openSearch }, 'Search', CV.h('kbd', { 'aria-hidden': 'true' }, '/'));
  CV.addTool(b);
});

/* --- src/features/131-app-bar.js --- */
// @msg App bar: once you scroll past the cover, a slim bar keeps your place, plan, search and share one tap away (bottom dock on phones)
// @sel #theme-1
CV.ready(function () {
  var cover = CV.$('.cover'); if (!cover) return;
  function ico(path) { return '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="' + path + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'; }
  var I = {
    toc: 'M4 6h16M4 12h16M4 18h10',
    plan: 'M9 11l3 3 8-8M20 12v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h11',
    search: 'M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zM21 21l-5-5',
    share: 'M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M12 3v12M7 8l5-5 5 5',
    check: 'M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4z'
  };
  function btn(label, icon, fn, extra) { var b = CV.h('button', { type: 'button', class: 'ab-b', 'aria-label': label, onclick: fn, html: ico(icon) + '<span class="ab-l">' + label + '</span>' }); if (extra) b.appendChild(extra); return b; }
  var count = CV.h('span', { class: 'ab-badge', 'aria-hidden': 'true' });
  var where = CV.h('span', { class: 'ab-where' });
  var pct = CV.h('span', { class: 'ab-pct', 'aria-hidden': 'true' });
  var bar = CV.h('nav', { class: 'ab', 'aria-label': 'Report tools' },
    CV.h('a', { class: 'ab-title', href: '#top' }, CV.h('b', null, 'Cyber Outlook 2027'), where),
    CV.h('div', { class: 'ab-tools' },
      btn('Contents', I.toc, function () { var t = CV.$('#toc-h'); var tg = CV.$('.toc-toggle'); if (tg && tg.getAttribute('aria-expanded') === 'false') tg.click(); t.scrollIntoView({ behavior: CV.reduced() ? 'auto' : 'smooth' }); t.focus({ preventScroll: true }); }),
      CV.openCheck ? btn('Check', I.check, function () { CV.openCheck(); }) : null,
      btn('My plan', I.plan, function () { CV.plan && CV.plan.open(); }, count),
      btn('Search', I.search, function () { CV.openSearch && CV.openSearch(); }),
      btn('Share', I.share, function () { CV.openShare && CV.openShare(); })),
    pct);
  document.body.appendChild(bar);
  var secs = CV.$$('main section.section[id]');
  function sync() {
    var past = cover.getBoundingClientRect().bottom < 0;
    bar.classList.toggle('show', past);
    document.body.classList.toggle('ab-on', past);
    var y = window.innerHeight * 0.3, cur = null; secs.forEach(function (s) { if (s.getBoundingClientRect().top <= y) cur = s; });
    where.textContent = cur ? ' · ' + CV.text(cur.querySelector('h2')).replace(/#$/, '').trim() : '';
    var h = document.documentElement.scrollHeight - window.innerHeight; pct.style.transform = 'scaleX(' + (h > 0 ? window.scrollY / h : 0) + ')';
  }
  function syncCount() { var n = CV.plan ? CV.plan.count() : 0; count.textContent = n || ''; count.hidden = !n; }
  var tk = false; window.addEventListener('scroll', function () { if (!tk) { tk = true; requestAnimationFrame(function () { tk = false; sync(); }); } }, { passive: true });
  window.addEventListener('resize', sync);
  CV.on('plan', syncCount);
  sync(); syncCount();
  // The old thin progress line is redundant now.
  var old = CV.$('.progress'); if (old) old.classList.add('ab-replaced');
});

/* --- src/features/132-short-version.js --- */
// @msg Short-version mode: one switch folds the report down to forecasts, key figures and actions, so you can skim it in ten minutes
// @sel #theme-1
CV.ready(function () {
  var KEEP = 'h2, .sec-num, .forecast, .lead, .call, .stats, .table-wrap, .cta-card, .listen, .what-next, .tiers, .months, .nd-tools, .a4-page, .plan-tools, figure.wf, ol.five, .five-foot, .five-note, .next-sec, .ep-guide';
  var on = CV.store.get('short', false);
  var banner = CV.h('div', { class: 'sv-banner', role: 'status' }, CV.h('p', null, CV.h('b', null, 'Short version. '), 'Showing forecasts, key figures and actions only.'), CV.button('Show everything', function () { set(false); }));
  function mark() {
    CV.$$('main section.section').forEach(function (sec) {
      if (sec.id === 'sources' || sec.id === 'disclaimer' || sec.id === 'method' || sec.id === 'how-to-read') { sec.classList.add('sv-hide-all'); return; }
      if (sec.id === 'summary') return; // the executive summary is already the short version
      CV.$$(':scope > .example, :scope > .box', sec).forEach(function (el) { el.classList.add('sv-x'); });
      CV.$$('.prose > *, .prose', sec).forEach(function (el) {
        if (el.matches('.prose')) return;
        var keep = el.matches(KEEP) || el.querySelector('.forecast,.lead') || el.matches('h3') && /five things|What to do/i.test(el.textContent);
        if (!keep) el.classList.add('sv-x');
      });
    });
  }
  function set(v) {
    on = v; CV.store.set('short', v);
    document.body.classList.toggle('short-v', v);
    tbtn.setAttribute('aria-pressed', v ? 'true' : 'false');
    tbtn.textContent = v ? 'Full version' : 'Short version';
    if (v && !banner.isConnected) CV.$('.layout').before(banner);
    if (!v && banner.isConnected) banner.remove();
    CV.toast(v ? 'Short version on' : 'Showing the full report');
  }
  mark();
  var tbtn = CV.h('button', { type: 'button', class: 'tool', 'aria-pressed': 'false' }, 'Short version');
  tbtn.addEventListener('click', function () { set(!on); });
  CV.addTool(tbtn);
  var pth = CV.$('.path[data-path="short"]');
  if (pth) pth.addEventListener('click', function () { if (!on) set(true); });
  if (on) set(true);
});

/* --- src/features/133-listen-aloud.js --- */
// @msg Listen to any section: your device reads it aloud, highlighting each paragraph as it goes, with pause and speed controls
// @sel #foreword
CV.ready(function () {
  if (!('speechSynthesis' in window) || !window.SpeechSynthesisUtterance) return;
  var synth = window.speechSynthesis, queue = [], idx = 0, playing = false, rate = CV.store.get('rate', 1);
  var player = CV.h('div', { class: 'tts', role: 'region', 'aria-label': 'Read aloud', hidden: true });
  var title = CV.h('p', { class: 'tts-t' });
  var play = CV.h('button', { type: 'button', class: 'tts-b', 'aria-label': 'Pause' }, '❚❚');
  var next = CV.h('button', { type: 'button', class: 'tts-b', 'aria-label': 'Next paragraph' }, '⏭');
  var speed = CV.h('button', { type: 'button', class: 'tts-b tts-speed', 'aria-label': 'Reading speed' }, rate + '×');
  var stop = CV.h('button', { type: 'button', class: 'tts-b', 'aria-label': 'Stop reading' }, '×');
  player.appendChild(CV.h('div', { class: 'tts-eq', 'aria-hidden': 'true' }, CV.h('span'), CV.h('span'), CV.h('span')));
  player.appendChild(title); player.appendChild(play); player.appendChild(next); player.appendChild(speed); player.appendChild(stop);
  document.body.appendChild(player);
  function voice() { var vs = synth.getVoices(); return vs.filter(function (v) { return /en-GB/i.test(v.lang); })[0] || vs.filter(function (v) { return /^en/i.test(v.lang); })[0] || null; }
  function clean(el) { var c = el.cloneNode(true); CV.$$('sup, .h-anchor, .plan-add, .sc-btn, .backrefs', c).forEach(function (n) { n.parentNode.removeChild(n); }); return CV.text(c); }
  function mark(el) { CV.$$('.tts-now').forEach(function (n) { n.classList.remove('tts-now'); }); if (el) { el.classList.add('tts-now'); var r = el.getBoundingClientRect(); if (r.top < 70 || r.bottom > window.innerHeight - 90) el.scrollIntoView({ block: 'center', behavior: CV.reduced() ? 'auto' : 'smooth' }); } }
  function speak() {
    if (idx >= queue.length) { end(); return; }
    var el = queue[idx], u = new SpeechSynthesisUtterance(clean(el)); var v = voice(); if (v) u.voice = v; u.lang = 'en-GB'; u.rate = rate;
    u.onend = function () { if (!playing) return; idx++; speak(); };
    mark(el); synth.speak(u);
  }
  function start(section) {
    synth.cancel();
    queue = CV.$$('h2, .forecast, .prose > p:not(.listen-src), .prose > ul > li, .prose > ol > li, .call h4, .call p, .example p, .example h3', section).filter(function (e) { return CV.text(e).length > 1 && !e.closest('.cv-noprint,.listen,.cta-card'); });
    idx = 0; playing = true; player.hidden = false; title.textContent = CV.text(section.querySelector('h2')).replace(/#$/, '');
    play.textContent = '❚❚'; play.setAttribute('aria-label', 'Pause'); player.classList.add('on');
    speak();
  }
  function end() { synth.cancel(); playing = false; player.hidden = true; player.classList.remove('on'); mark(null); }
  play.addEventListener('click', function () {
    if (synth.paused) { synth.resume(); play.textContent = '❚❚'; play.setAttribute('aria-label', 'Pause'); player.classList.add('on'); }
    else { synth.pause(); play.textContent = '▶'; play.setAttribute('aria-label', 'Resume'); player.classList.remove('on'); }
  });
  next.addEventListener('click', function () { synth.cancel(); idx++; setTimeout(speak, 60); });
  speed.addEventListener('click', function () { rate = rate >= 1.5 ? 0.85 : rate === 0.85 ? 1 : rate + 0.25; CV.store.set('rate', rate); speed.textContent = rate + '×'; synth.cancel(); setTimeout(speak, 60); });
  stop.addEventListener('click', end);
  window.addEventListener('beforeunload', function () { synth.cancel(); });
  CV.$$('main section.section').forEach(function (sec) {
    if (/sources|disclaimer/.test(sec.id)) return;
    var h = sec.querySelector('h2'); if (!h) return;
    var b = CV.h('button', { type: 'button', class: 'tts-start', 'aria-label': 'Listen to this section: ' + CV.text(h).replace(/#$/, '') }, CV.h('span', { 'aria-hidden': 'true' }, '▶'), ' Listen');
    b.addEventListener('click', function () { start(sec); });
    var num = sec.querySelector('.sec-num'); (num || h).appendChild(b);
  });
});

/* --- src/features/134-glossary.js --- */
// @msg Plain-English glossary: jargon is underlined once per section; tap it for a one-line explanation, or open the full glossary
// @sel #theme-2
CV.ready(function () {
  var G = [
    ['multi-factor authentication', 'A second check when you log in, such as a code or an approval on your phone, on top of your password.', /\bmulti-factor authentication\b/i],
    ['passkey', 'A login that uses your phone or computer’s fingerprint, face or PIN instead of a password. Much harder to phish than a texted code.', /\bpasskeys?\b/i],
    ['phishing', 'A message pretending to be someone you trust, designed to get you to click, log in, pay or share information.', /\bphishing\b/i],
    ['ransomware', 'Malicious software that locks or steals your files and demands payment to give them back or keep them quiet.', /\bransomware\b/i],
    ['prompt injection', 'Hidden instructions in a document, email or web page that trick an AI tool into doing something you didn’t ask for.', /\bprompt injection\b/i],
    ['authorised push payment fraud', 'When a criminal tricks you into sending money yourself, for example by faking a supplier’s new bank details.', /\bauthorised push payment fraud\b/i],
    ['Cyber Essentials', 'The UK government-backed certificate showing a business has five basic security controls in place. Plus adds an independent technical check.', /\bCyber Essentials\b/],
    ['managed service provider', 'An outside IT company that runs your computers, accounts and systems for you, often with remote access to them.', /\bmanaged service provider\b|\bMSP\b/],
    ['tabletop exercise', 'A one-hour meeting where you talk through a pretend incident, step by step, to test your plan.', /\btabletop\b/i],
    ['deepfake', 'Fake audio or video, made with AI, that sounds or looks like a real person, such as your managing director.', /\bdeepfake\b/i],
    ['patch', 'A software update that fixes a security flaw. Criminals often use the flaw within days of it being published.', /\bpatch(es|ing)?\b/i]
  ];
  var tip = CV.h('div', { class: 'gl-tip', role: 'tooltip', id: 'gl-tip', hidden: true });
  document.body.appendChild(tip);
  function show(btn, g) {
    tip.innerHTML = ''; tip.appendChild(CV.h('b', null, g[0])); tip.appendChild(CV.h('p', null, g[1]));
    tip.hidden = false; var r = btn.getBoundingClientRect(), w = Math.min(320, window.innerWidth - 32); tip.style.width = w + 'px';
    var x = Math.max(16, Math.min(window.innerWidth - w - 16, r.left)); var y = r.bottom + 8; if (y + tip.offsetHeight > window.innerHeight - 8) y = r.top - tip.offsetHeight - 8;
    tip.style.left = x + 'px'; tip.style.top = y + 'px'; btn.setAttribute('aria-expanded', 'true'); open = btn;
  }
  var open = null;
  function hide() { tip.hidden = true; if (open) open.setAttribute('aria-expanded', 'false'); open = null; }
  document.addEventListener('click', function (e) { if (open && !e.target.closest('.gl-term')) hide(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hide(); });
  window.addEventListener('scroll', hide, { passive: true });
  CV.$$('main section.section').forEach(function (sec) {
    if (/sources|disclaimer/.test(sec.id)) return;
    var used = {};
    var walker = document.createTreeWalker(sec, NodeFilter.SHOW_TEXT, { acceptNode: function (n) { var p = n.parentNode; return p.closest('h2,h3,h4,a,button,label,sup,abbr,table,.gl-term,.forecast,.cv-noprint,.listen,.listen-src,figure,caption,dialog') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; } });
    var nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      G.forEach(function (g, gi) {
        if (used[gi] || !node.parentNode) return;
        var m = node.nodeValue.match(g[2]); if (!m) return;
        used[gi] = true;
        var after = node.splitText(m.index); after.nodeValue = after.nodeValue.slice(m[0].length);
        var b = CV.h('button', { type: 'button', class: 'gl-term', 'aria-expanded': 'false', 'aria-describedby': 'gl-tip' }, m[0]);
        b.addEventListener('click', function (e) { e.stopPropagation(); if (open === b) hide(); else show(b, g); });
        node.parentNode.insertBefore(b, after); node = after;
      });
    });
  });
  var d = CV.dialog({ id: 'glossary', title: 'Plain-English glossary', note: 'Short explanations to help you read the report. They aren’t legal or technical definitions.' });
  d.body.appendChild(CV.h('dl', { class: 'gl-list' }, G.slice().sort(function (a, b) { return a[0].localeCompare(b[0]); }).map(function (g) { return CV.h('div', null, CV.h('dt', null, g[0]), CV.h('dd', null, g[1])); })));
  CV.openGlossary = function () { d.open(); };
  var hr = CV.$$('#how-to-read p').filter(function (p) { return /technical term/i.test(p.textContent); })[0];
  if (hr) hr.appendChild(CV.h('span', { class: 'cv-noprint' }, ' ', CV.h('button', { type: 'button', class: 'gl-open', onclick: function () { d.open(); } }, 'Open the glossary')));
});

/* --- src/features/135-reading-settings.js --- */
// @msg Reading settings: text size, line spacing and an easy-to-read font, remembered for next time
// @sel #foreword
CV.ready(function () {
  var s = CV.store.get('read', { size: 0, space: 0, font: 'default' });
  var root = document.documentElement;
  if (s.font === 'easy' && !document.getElementById('cv-easy-font')) {
    document.head.appendChild(CV.h('link', { rel: 'stylesheet', id: 'cv-easy-font', href: 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&display=swap' }));
  }
  function apply() {
    root.style.setProperty('--rs-size', [1, 1.12, 1.25, 1.4][s.size]);
    root.style.setProperty('--rs-lh', [1.62, 1.8, 2][s.space]);
    root.classList.toggle('rs-on', s.size > 0 || s.space > 0 || s.font !== 'default');
    root.dataset.font = s.font;
    if (s.font === 'easy' && !document.getElementById('cv-easy-font')) document.head.appendChild(CV.h('link', { rel: 'stylesheet', id: 'cv-easy-font', href: 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&display=swap' }));
    CV.store.set('read', s);
  }
  function seg(label, key, opts) {
    var g = CV.h('div', { class: 'rs-seg', role: 'radiogroup', 'aria-label': label });
    opts.forEach(function (o) {
      var b = CV.h('button', { type: 'button', role: 'radio', class: 'rs-opt' }, o[1]);
      function sync() { var on = s[key] === o[0]; b.setAttribute('aria-checked', on ? 'true' : 'false'); }
      b.addEventListener('click', function () { s[key] = o[0]; apply(); CV.$$('.rs-opt', g).forEach(function (x) { x._sync(); }); });
      b._sync = sync; sync(); g.appendChild(b);
    });
    return CV.h('div', { class: 'rs-row' }, CV.h('p', { class: 'cv-kicker' }, label), g);
  }
  var d = CV.dialog({ id: 'reading', title: 'Reading settings', note: 'Saved in this browser.' });
  d.body.appendChild(seg('Text size', 'size', [[0, 'A'], [1, 'A+'], [2, 'A++'], [3, 'A+++']]));
  d.body.appendChild(seg('Line spacing', 'space', [[0, 'Normal'], [1, 'Roomy'], [2, 'Extra']]));
  d.body.appendChild(seg('Font', 'font', [['default', 'Report font'], ['easy', 'Easy to read'], ['sans', 'Plain sans']]));
  d.body.appendChild(CV.h('p', { class: 'rs-sample' }, 'Good security doesn’t have to be expensive, but stupidity always is.'));
  d.body.appendChild(CV.h('div', { class: 'cv-row' }, CV.button('Reset', function () { s = { size: 0, space: 0, font: 'default' }; apply(); CV.$$('#reading .rs-opt').forEach(function (x) { x._sync(); }); })));
  CV.openReading = function () { d.open(); };
  CV.addTool(CV.h('button', { type: 'button', class: 'tool', 'aria-label': 'Reading settings', onclick: function () { d.open(); } }, 'Aa'));
  apply();
});

/* --- src/features/136-highlights.js --- */
// @msg Highlights and notes: highlight any passage, add a note, and export everything you marked as your own briefing
// @sel #foreword
CV.ready(function () {
  var pop = CV.$('.sq'); if (!pop) return;
  var hl = CV.h('button', { type: 'button', class: 'sq-b sq-hl' }, 'Highlight');
  pop.insertBefore(hl, pop.firstChild);
  var marks = CV.store.get('marks', []);
  var paras = CV.$$('main .prose p, main .prose li, main .call p, main .example p');
  function keyOf(el) { return paras.indexOf(el); }
  function paint() {
    CV.$$('mark.cv-hl').forEach(function (m) { var p = m.parentNode; while (m.firstChild) p.insertBefore(m.firstChild, m); p.removeChild(m); p.normalize(); });
    marks.forEach(function (mk, i) {
      var el = paras[mk.p]; if (!el) return;
      var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), n;
      while ((n = walker.nextNode())) {
        var at = n.nodeValue.indexOf(mk.q.slice(0, 40)); if (at < 0) continue;
        var len = Math.min(mk.q.length, n.nodeValue.length - at);
        var r = document.createRange(); r.setStart(n, at); r.setEnd(n, at + len);
        var m = CV.h('mark', { class: 'cv-hl' + (mk.note ? ' has-note' : ''), 'data-i': String(i), title: mk.note || 'Highlighted' });
        try { r.surroundContents(m); } catch (e) {}
        break;
      }
    });
    badge();
  }
  function save() { CV.store.set('marks', marks); paint(); }
  var sel = null;
  document.addEventListener('mouseup', function () { var s = window.getSelection(); if (s && !s.isCollapsed && s.rangeCount) sel = s.getRangeAt(0).cloneRange(); });
  hl.addEventListener('click', function () {
    if (!sel) return;
    var node = sel.startContainer.nodeType === 1 ? sel.startContainer : sel.startContainer.parentNode;
    var el = paras.filter(function (p) { return p.contains(node); })[0];
    if (!el) { CV.toast('Highlight within one paragraph at a time'); return; }
    var q = sel.toString().replace(/\s+/g, ' ').trim(); if (q.length < 3) return;
    var sec = el.closest('section'); marks.push({ p: keyOf(el), q: q, sec: sec ? CV.text(sec.querySelector('h2')).replace(/#$/, '').trim() : '', at: Date.now() });
    window.getSelection().removeAllRanges(); pop.hidden = true; save(); CV.toast('Highlighted. Find it in My notes');
  });
  // Notes panel
  var d = CV.dialog({ id: 'notes', title: 'My highlights and notes', wide: true, note: 'Kept in this browser only.', onopen: render });
  function render() {
    var b = d.body; b.innerHTML = '';
    if (!marks.length) { b.appendChild(CV.h('p', null, 'Select any passage in the report and choose Highlight. Your highlights and notes collect here.')); return; }
    var ul = CV.h('ul', { class: 'nt-list' });
    marks.forEach(function (mk, i) {
      var ta = CV.h('textarea', { class: 'cv-input nt-note', placeholder: 'Add a note: what will you do about this?', 'aria-label': 'Note for highlight ' + (i + 1) }); ta.value = mk.note || '';
      ta.addEventListener('change', function () { mk.note = ta.value.trim(); save(); });
      ul.appendChild(CV.h('li', null, CV.h('p', { class: 'cv-kicker' }, mk.sec), CV.h('blockquote', null, mk.q), ta,
        CV.h('div', { class: 'cv-row' }, CV.button('Go to it', function () { d.close(); var m = CV.$('mark.cv-hl[data-i="' + i + '"]'); if (m) m.scrollIntoView({ block: 'center', behavior: CV.reduced() ? 'auto' : 'smooth' }); }), CV.button('Remove', function () { marks.splice(i, 1); save(); render(); }))));
    });
    b.appendChild(ul);
    var text = function () { return 'MY NOTES: ' + CV.TITLE + '\n' + CV.SITE + '\n\n' + marks.map(function (m) { return '— ' + m.sec + '\n“' + m.q + '”' + (m.note ? '\nNote: ' + m.note : ''); }).join('\n\n'); };
    b.appendChild(CV.h('div', { class: 'cv-row' }, CV.button('Copy all', function () { CV.copy(text(), 'Notes copied'); }, 'primary'), CV.button('Download', function () { CV.download('my-cyber-outlook-notes.txt', 'text/plain', text()); })));
  }
  var tool = CV.h('button', { type: 'button', class: 'tool notes-tool', onclick: function () { d.open(); } }, 'My notes ', CV.h('span', { class: 'plan-count' }, '0'));
  function badge() { tool.querySelector('.plan-count').textContent = marks.length; }
  CV.addTool(tool);
  document.addEventListener('click', function (e) { var m = e.target.closest && e.target.closest('mark.cv-hl'); if (m && !window.getSelection().toString()) d.open(); });
  CV.openNotes = function () { d.open(); };
  paint();
});

/* --- src/features/137-focus-mode.js --- */
// @msg Focus mode: hide the contents, toolbars and tools, centre the text, and just read (press F to toggle)
// @sel #foreword
CV.ready(function () {
  var on = false;
  var exit = CV.h('button', { type: 'button', class: 'fm-exit', hidden: true }, 'Exit focus mode');
  document.body.appendChild(exit);
  function set(v) {
    on = v; document.body.classList.toggle('focus-mode', v); exit.hidden = !v;
    btn.setAttribute('aria-pressed', v ? 'true' : 'false');
    if (v) CV.toast('Focus mode. Press F or Esc to leave');
  }
  var btn = CV.h('button', { type: 'button', class: 'tool', 'aria-pressed': 'false', 'aria-keyshortcuts': 'f', onclick: function () { set(!on); } }, 'Focus');
  CV.addTool(btn);
  exit.addEventListener('click', function () { set(false); });
  document.addEventListener('keydown', function (e) {
    var tag = (e.target.tagName || '').toLowerCase(); if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'f' || e.key === 'F') { if (CV.$('dialog[open]')) return; set(!on); }
    if (e.key === 'Escape' && on && !CV.$('dialog[open]')) set(false);
  });
  CV.setFocusMode = set;
});

/* --- src/features/139-bill-timeline.js --- */
// @msg Bill tracker: the Cyber Security and Resilience Bill's journey as a timeline, showing where it stood when the report went to press
// @sel #bill-track
CV.ready(function () {
  var h = CV.$$('#rules h3').filter(function (x) { return /Resilience Bill/.test(x.textContent); })[0]; if (!h) return;
  var STAGES = [
    { d: '12 Nov 2025', t: 'Introduced', s: 'done' },
    { d: '6 Jan 2026', t: 'Commons second reading', s: 'done' },
    { d: '26 Oct 2026', t: 'Lords Report Stage', note: 'Government defeated twice', s: 'done' },
    { d: '2 Nov 2026', t: 'Lords Third Reading', note: 'Scheduled on publication day; outcome not covered', s: 'now' },
    { d: 'Next', t: 'Commons considers Lords amendments', note: 'May pass back and forth', s: 'later' },
    { d: 'Late 2026 to spring 2027', t: 'Royal Assent expected', s: 'later' },
    { d: 'After that', t: 'Secondary legislation', note: 'Most detailed duties arrive here', s: 'later' }
  ];
  var ol = CV.h('ol', { class: 'bt' });
  STAGES.forEach(function (x) { ol.appendChild(CV.h('li', { class: 'bt-' + x.s }, CV.h('span', { class: 'bt-dot', 'aria-hidden': 'true' }), CV.h('span', { class: 'bt-d' }, x.d), CV.h('b', null, x.t), x.note ? CV.h('span', { class: 'bt-n' }, x.note) : null, x.s === 'now' ? CV.h('span', { class: 'cv-offscreen' }, ' (where things stood at publication)') : null)); });
  var fig = CV.h('figure', { class: 'bt-fig', id: 'bill-track' },
    CV.h('p', { class: 'cv-kicker' }, 'Where the Bill stood at publication'),
    CV.h('div', { class: 'bt-scroll', tabindex: '0', role: 'region', 'aria-label': 'Bill timeline' }, ol),
    CV.h('figcaption', null, 'Status as at 31 October 2026. Check the Bill’s page on the UK Parliament website for later stages [14].'));
  var p = h.nextElementSibling; (p && p.tagName === 'P' ? p : h).after(fig);
});

/* --- src/features/140-forecasts.js --- */
// @msg Forecast scorecard: react to every "Our call" forecast (agree, unsure, disagree) and see all of them, and your outlook, in one place
// @sel #theme-1 .call
CV.ready(function () {
  var calls = CV.$$('main aside.call').filter(function (a) { return !/Example/i.test(a.getAttribute('aria-label') || ''); });
  if (!calls.length) return;
  var votes = CV.store.get('votes', {});
  var OPTS = [['agree', 'Agree'], ['unsure', 'Not sure'], ['disagree', 'Disagree']];
  var items = calls.map(function (a, i) {
    var id = a.id || ('call-' + (i + 1)); a.id = id;
    var sec = a.closest('section'), label = a.querySelector('.call-label span');
    return { id: id, el: a, title: CV.text(a.querySelector('h4')), theme: label ? CV.text(label) : '', sec: sec ? CV.text(sec.querySelector('h2')).replace(/#$/, '').trim() : '' };
  });
  function voteRow(it) {
    var g = CV.h('div', { class: 'fc-vote', role: 'group', 'aria-label': 'Do you agree with this forecast?' }, CV.h('span', { class: 'fc-q' }, 'Your call?'));
    OPTS.forEach(function (o) {
      var b = CV.h('button', { type: 'button', class: 'fc-b fc-' + o[0], 'aria-pressed': votes[it.id] === o[0] ? 'true' : 'false' }, o[1]);
      b.addEventListener('click', function () { votes[it.id] = votes[it.id] === o[0] ? undefined : o[0]; CV.store.set('votes', votes); sync(); });
      g.appendChild(b);
    });
    return g;
  }
  items.forEach(function (it) { it.row = voteRow(it); it.el.appendChild(it.row); });
  function sync() {
    items.forEach(function (it) { CV.$$('.fc-b', it.row).forEach(function (b, i) { b.setAttribute('aria-pressed', votes[it.id] === OPTS[i][0] ? 'true' : 'false'); }); });
    if (d.dialog.open) render();
  }
  var d = CV.dialog({ id: 'forecasts', title: 'All of Noel’s calls for 2027', wide: true, onopen: render, note: 'Forecasts are opinion, marked "Our call" in the report. Your reactions stay in this browser.' });
  function render() {
    var b = d.body; b.innerHTML = '';
    var c = { agree: 0, unsure: 0, disagree: 0 }; items.forEach(function (it) { if (votes[it.id]) c[votes[it.id]]++; });
    var n = c.agree + c.unsure + c.disagree;
    b.appendChild(CV.h('div', { class: 'fc-sum' },
      CV.h('p', null, n ? 'You’ve reacted to ' + n + ' of ' + items.length + ' forecasts.' : items.length + ' forecasts. React to each one as you read, or here.'),
      CV.h('div', { class: 'fc-bars', 'aria-hidden': 'true' }, OPTS.map(function (o) { return CV.h('span', { class: 'fc-' + o[0], style: 'flex-grow:' + (c[o[0]] || 0) }); })),
      n ? CV.h('p', { class: 'fc-legend' }, c.agree + ' agree · ' + c.unsure + ' not sure · ' + c.disagree + ' disagree') : null));
    var ol = CV.h('ol', { class: 'fc-list' });
    items.forEach(function (it) {
      ol.appendChild(CV.h('li', null, CV.h('p', { class: 'cv-kicker' }, it.sec + (it.theme && it.theme !== it.sec ? ' · ' + it.theme : '')),
        CV.h('a', { href: '#' + it.id, class: 'fc-t', onclick: function () { d.close(); } }, it.title), voteRow(it)));
    });
    b.appendChild(ol);
  }
  CV.openForecasts = function () { d.open(); };
  var how = CV.$('#how-to-read aside.call');
  if (how) how.after(CV.h('div', { class: 'cta-card cv-noprint' }, CV.h('div', null, CV.h('p', { class: 'cv-kicker' }, 'Forecasts'), CV.h('p', { class: 'cta-title' }, items.length + ' calls for 2027'), CV.h('p', { class: 'cta-sub' }, 'See every forecast in one list and say whether you agree.')), CV.button('See all the calls', function () { d.open(); }, 'primary')));
});

/* --- src/features/141-count-up.js --- */
// @msg The year in numbers comes alive: each figure counts up as it scrolls into view (the real value is always shown at rest)
// @sel #numbers .stats
CV.ready(function () {
  if (CV.reduced() || !('IntersectionObserver' in window)) return;
  var ns = CV.$$('#numbers .stat .n'); if (!ns.length) return;
  ns.forEach(function (el) {
    var orig = el.textContent, m = orig.match(/^(\D*)([\d,.]+)(\D*)$/); if (!m) return;
    var target = parseFloat(m[2].replace(/,/g, '')); if (!isFinite(target) || target === 0) return;
    el.setAttribute('aria-label', orig);
    var io = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return; io.disconnect();
      // Only animate figures that are fully below the fold when the page loads.
      var t0 = performance.now(), dur = 900 + Math.min(target, 600) * 0.6;
      el.classList.add('cu-run');
      function tick(t) {
        var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        el.textContent = m[1] + Math.round(target * e).toLocaleString('en-GB') + m[3];
        if (k < 1) requestAnimationFrame(tick); else { el.textContent = orig; el.classList.remove('cu-run'); el.classList.add('cu-done'); }
      }
      requestAnimationFrame(tick);
    }, { threshold: 0.9 });
    if (el.getBoundingClientRect().top > window.innerHeight) io.observe(el);
  });
});

/* --- src/features/142-present.js --- */
// @msg Present mode: brief your team from the report itself, with eight full-screen slides built from the executive summary (arrow keys to move)
// @sel #summary
CV.ready(function () {
  function rows() { return CV.$$('#summary table.glance tbody tr').map(function (tr) { return CV.$$('td,th', tr).map(CV.text); }); }
  function five() { return CV.$$('#five li label, #five li').map(function (el) { return CV.text(el.querySelector ? (el.querySelector('label') || el) : el); }).filter(function (t, i, a) { return t && a.indexOf(t) === i; }).slice(0, 5); }
  function stat(i) { var s = CV.$$('#numbers .stat')[i]; return s ? [CV.text(s.querySelector('.n')), CV.text(s.querySelector('.l'))] : ['', '']; }
  function slides() {
    var g = rows(), out = [];
    out.push({ cls: 'title', html: '<p class="pr-k">Team briefing</p><h2>UK Small Business Cyber Outlook <span>2027</span></h2><p class="pr-sub">Three themes, the rules that change, and five things to do before January.</p>' });
    var a = stat(0), b = stat(1);
    out.push({ html: '<p class="pr-k">Where we start</p><div class="pr-stats"><div><b>' + CV.esc(a[0]) + '</b><span>' + CV.esc(a[1]) + '</span></div><div><b>' + CV.esc(b[0]) + '</b><span>' + CV.esc(b[1]) + '</span></div></div><p class="pr-src">Cyber Security Breaches Survey 2025/26</p>' });
    g.forEach(function (r, i) { out.push({ html: '<p class="pr-k">' + (i < 3 ? 'Theme ' + (i + 1) : 'Plus') + '</p><h2>' + CV.esc(r[0].replace(/^\d\.\s*|^Plus:\s*/i, '')) + '</h2><p class="pr-body">' + CV.esc(r[1]) + '</p><p class="pr-watch"><b>Watch for:</b> ' + CV.esc(r[2] || '') + '</p>' }); });
    out.push({ html: '<p class="pr-k">Before January</p><h2>Five things</h2><ol class="pr-five">' + five().map(function (t) { return '<li>' + CV.esc(t) + '</li>'; }).join('') + '</ol>' });
    out.push({ cls: 'title', html: '<p class="pr-k">Next step</p><h2>Who does what, by when?</h2><p class="pr-sub">Agree an owner and a date for each of the five. Full report: cyberoutlook.sbcsg.uk</p>' });
    return out;
  }
  var deck = CV.h('div', { class: 'pr', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Presentation', hidden: true });
  var stage = CV.h('div', { class: 'pr-stage', 'aria-live': 'polite' });
  var count = CV.h('span', { class: 'pr-count' });
  var prev = CV.h('button', { type: 'button', class: 'pr-nav', 'aria-label': 'Previous slide' }, '←');
  var next = CV.h('button', { type: 'button', class: 'pr-nav', 'aria-label': 'Next slide' }, '→');
  var close = CV.h('button', { type: 'button', class: 'pr-nav pr-close', 'aria-label': 'Close presentation' }, '×');
  deck.appendChild(stage); deck.appendChild(CV.h('div', { class: 'pr-bar' }, prev, count, next, close));
  document.body.appendChild(deck);
  var S = [], i = 0, lastFocus;
  function show() { var s = S[i]; stage.className = 'pr-stage ' + (s.cls || ''); stage.innerHTML = '<div class="pr-slide">' + s.html + '</div><p class="pr-foot">cyberoutlook.sbcsg.uk</p>'; count.textContent = (i + 1) + ' / ' + S.length; prev.disabled = i === 0; next.disabled = i === S.length - 1; }
  function open() { S = slides(); i = 0; lastFocus = document.activeElement; deck.hidden = false; document.documentElement.classList.add('cv-modal-open'); show(); next.focus(); if (deck.requestFullscreen) deck.requestFullscreen().catch(function () {}); }
  function shut() { deck.hidden = true; document.documentElement.classList.remove('cv-modal-open'); if (document.fullscreenElement) document.exitFullscreen().catch(function () {}); if (lastFocus) lastFocus.focus(); }
  prev.addEventListener('click', function () { if (i > 0) { i--; show(); } });
  next.addEventListener('click', function () { if (i < S.length - 1) { i++; show(); } });
  close.addEventListener('click', shut);
  stage.addEventListener('click', function () { if (i < S.length - 1) { i++; show(); } });
  document.addEventListener('keydown', function (e) {
    if (deck.hidden) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); next.click(); }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prev.click(); }
    if (e.key === 'Escape') shut();
    if (e.key === 'Tab') { var f = [prev, next, close].filter(function (b) { return !b.disabled; }); var k = f.indexOf(document.activeElement); e.preventDefault(); f[(k + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus(); }
  });
  CV.present = open;
  var h = CV.$('#h-summary');
  if (h) h.closest('section').querySelector('.prose').appendChild(CV.h('div', { class: 'cta-card cv-noprint' }, CV.h('div', null, CV.h('p', { class: 'cv-kicker' }, 'Team meeting'), CV.h('p', { class: 'cta-title' }, 'Present this to your team'), CV.h('p', { class: 'cta-sub' }, 'Eight full-screen slides from this summary. Arrow keys to move, Esc to finish.')), CV.button('Start presenting', open, 'primary')));
});

/* --- src/features/143-meeting-pack.js --- */
// @msg Team meeting pack: a printable 30-minute agenda that walks your team through the five things and assigns each one
// @sel #summary
CV.ready(function () {
  var cta = CV.$('#summary .cta-card'); if (!cta) return;
  var saved = CV.store.get('meeting', {});
  var d = CV.dialog({ id: 'meeting', title: '30-minute team meeting', wide: true, note: 'Print it, run it, fill in the owners in the room.' });
  var firm = CV.h('input', { type: 'text', autocomplete: 'organization', placeholder: 'Your business' }); firm.value = saved.firm || '';
  var date = CV.h('input', { type: 'date' }); date.value = saved.date || '';
  var chair = CV.h('input', { type: 'text', placeholder: 'Who chairs' }); chair.value = saved.chair || '';
  [firm, date, chair].forEach(function (i) { i.addEventListener('change', function () { saved = { firm: firm.value, date: date.value, chair: chair.value }; CV.store.set('meeting', saved); }); });
  function five() { return CV.$$('#five li').map(function (li) { return CV.text(li.querySelector('label') || li); }); }
  function agenda() {
    var f = five();
    return [
      ['0–5 min', 'Why we’re here', 'One in five UK businesses was the victim of a cyber crime in the year covered by the government’s latest survey. Most of what follows costs nothing. (Present mode, slides 1 and 2.)'],
      ['5–10 min', 'Payments', f[1] || 'Call-back rule for bank detail changes and urgent payments.'],
      ['10–15 min', 'Logins', f[0] || 'Multi-factor authentication on every cloud service.'],
      ['15–20 min', 'Suppliers and AI tools', (f[3] || '') + ' ' + (f[2] || '')],
      ['20–25 min', 'If it goes wrong', f[4] || 'The one-page plan.'],
      ['25–30 min', 'Who does what, by when', 'Write an owner and a date next to each of the five below.']
    ];
  }
  function sheet() {
    var when = date.value ? CV.fmtDate(CV.parseDate(date.value)) : '____________';
    var t = CV.h('table', { class: 'mt-ag' }, CV.h('tbody', null, agenda().map(function (r) { return CV.h('tr', null, CV.h('td', null, r[0]), CV.h('td', null, CV.h('b', null, r[1]), CV.h('br'), r[2])); })));
    var o = CV.h('table', { class: 'mt-own' }, CV.h('thead', null, CV.h('tr', null, CV.h('th', null, 'The five things'), CV.h('th', null, 'Owner'), CV.h('th', null, 'Done by'))), CV.h('tbody', null, five().map(function (x) { return CV.h('tr', null, CV.h('td', null, x), CV.h('td'), CV.h('td')); })));
    return CV.h('div', { class: 'mt-sheet' },
      CV.h('div', { class: 'pp-head' }, CV.h('h2', null, 'Cyber: 30-minute team meeting'), CV.h('p', null, (firm.value || 'Our business') + ' · ' + when + ' · Chair: ' + (chair.value || '__________'))),
      t, o, CV.h('p', { class: 'pst-src' }, 'Based on the UK Small Business Cyber Outlook 2027 · cyberoutlook.sbcsg.uk'));
  }
  d.body.appendChild(CV.h('div', { class: 'cv-grid2' }, CV.field('Business', firm), CV.field('Meeting date', date), CV.field('Chair', chair)));
  var prev = CV.h('div', { class: 'mt-prev' });
  d.body.appendChild(prev);
  d.body.appendChild(CV.h('div', { class: 'cv-row' }, CV.button('Print the agenda', function () { CV.printSheet(sheet()); }, 'primary'), CV.present ? CV.button('Present the slides', function () { d.close(); CV.present(); }) : null,
    CV.button('Add to calendar', function () { if (!date.value) { CV.toast('Pick a meeting date first'); return; } CV.ics([{ title: 'Cyber: 30-minute team meeting', date: CV.parseDate(date.value), description: agenda().map(function (r) { return r[0] + ' ' + r[1]; }).join('\n'), url: CV.SITE + '#summary' }], 'cyber-team-meeting.ics'); })));
  function refresh() { prev.innerHTML = ''; var ol = CV.h('ol', { class: 'mt-list' }); agenda().forEach(function (r) { ol.appendChild(CV.h('li', null, CV.h('span', null, r[0]), CV.h('b', null, r[1]))); }); prev.appendChild(ol); }
  refresh();
  var row = CV.h('div', { class: 'cv-row' }); var start = cta.querySelector('button'); start.replaceWith(row); row.appendChild(start); row.appendChild(CV.button('Plan the meeting', function () { refresh(); d.open(); }));
});

/* --- src/features/144-progress-hub.js --- */
// @msg My progress: one dashboard for everything you've done with the report, and the single next step that matters most
// @sel #start
CV.ready(function () {
  function n(key) { try { var v = JSON.parse(localStorage.getItem(key) || '{}'); return Object.keys(v).filter(function (k) { return v[k]; }).length; } catch (e) { return 0; } }
  function state() {
    var plan = CV.plan ? CV.plan.list() : [];
    var ff = CV.store.get('fivefive', { s: [], c: [] }), ai = CV.store.get('aitools', { tools: [] });
    return {
      score: CV.checkScore ? CV.checkScore() : null,
      five: n('cv-five-things'),
      planTotal: plan.length, planDone: plan.filter(function (x) { return x.meta.done; }).length,
      weeks: n('cv:ninety') || Object.keys(CV.store.get('ninety', {})).filter(function (k) { return CV.store.get('ninety', {})[k]; }).length,
      contacts: n('cv-plan-contacts'),
      mapped: (ff.s || []).concat(ff.c || []).filter(function (r) { return r.name && r.name.trim(); }).length,
      tools: (ai.tools || []).length,
      votes: Object.keys(CV.store.get('votes', {})).filter(function (k) { return CV.store.get('votes', {})[k]; }).length,
      notes: CV.store.get('marks', []).length
    };
  }
  function nextStep(s) {
    if (s.score == null) return ['Take the two-minute exposure check', function () { CV.openCheck && CV.openCheck(true); }];
    if (s.five < 5) return ['Finish the five things (' + s.five + ' of 5)', function () { location.hash = '#h-if-you-do-five-things-before-january'; }];
    if (s.contacts < 3) return ['Fill in who to call on the one-page plan', function () { location.hash = '#mvc'; }];
    if (s.planTotal === 0) return ['Add your next actions to My plan', function () { CV.goToAction && CV.goToAction('t1-1'); }];
    if (s.planDone < s.planTotal) return ['Work through My plan (' + s.planDone + ' of ' + s.planTotal + ' done)', function () { CV.plan.open(); }];
    return ['Run a one-hour tabletop against your plan', function () { location.hash = '#ninety'; }];
  }
  function tile(label, value, sub, fn) { return CV.h('button', { type: 'button', class: 'ph-tile', onclick: function () { d.close(); fn(); } }, CV.h('span', { class: 'ph-l' }, label), CV.h('b', null, value), CV.h('span', { class: 'ph-s' }, sub)); }
  var d = CV.dialog({ id: 'progress', title: 'My progress', wide: true, onopen: render, note: 'Everything here is stored only in this browser.' });
  function render() {
    var s = state(), b = d.body; b.innerHTML = '';
    var ns = nextStep(s);
    b.appendChild(CV.h('div', { class: 'ph-next' }, CV.h('div', null, CV.h('p', { class: 'cv-kicker' }, 'Your next step'), CV.h('p', { class: 'ph-nt' }, ns[0])), CV.button('Do it now', function () { d.close(); ns[1](); }, 'primary')));
    b.appendChild(CV.h('div', { class: 'ph-grid' },
      tile('Exposure check', s.score == null ? '–' : s.score + '/10', s.score == null ? 'Not taken yet' : 'Answers you said yes to', function () { CV.openCheck && CV.openCheck(); }),
      tile('Five things', s.five + '/5', 'Before January', function () { location.hash = '#h-if-you-do-five-things-before-january'; }),
      tile('My plan', s.planDone + '/' + s.planTotal, 'Actions done', function () { CV.plan && CV.plan.open(); }),
      tile('90 days', s.weeks + '/13', 'Weeks ticked off', function () { location.hash = '#ninety'; }),
      tile('Who to call', s.contacts + '/7', 'Contacts on your plan', function () { location.hash = '#mvc'; }),
      tile('Five and five', s.mapped + '/10', 'Suppliers and customers mapped', function () { CV.openFiveFive && CV.openFiveFive(); }),
      tile('AI tools', String(s.tools), 'Listed on your register', function () { CV.openAiTools && CV.openAiTools(); }),
      tile('Forecasts', s.votes + '/14', 'Calls you reacted to', function () { CV.openForecasts && CV.openForecasts(); }),
      tile('Notes', String(s.notes), 'Highlights saved', function () { CV.openNotes && CV.openNotes(); })));
    CV.emit('progress-render', { body: b, state: s });
  }
  CV.openProgress = function () { d.open(); };
  CV.progressState = state;
  CV.addTool(CV.h('button', { type: 'button', class: 'tool', onclick: function () { d.open(); } }, 'My progress'), true);
});

/* --- src/features/145-certificate.js --- */
// @msg Five-things badge: finish all five and make a branded "done before January" badge to download or post on LinkedIn
// @sel #h-if-you-do-five-things-before-january
CV.ready(function () {
  var list = CV.$('#five'); if (!list) return;
  function count() { return CV.$$('input:checked', list).length; }
  var saved = CV.store.get('cert', {});
  var d = CV.dialog({ id: 'cert', title: 'You did the five things', note: 'The badge is made in your browser. Nothing is checked or sent anywhere.' });
  var firm = CV.h('input', { type: 'text', autocomplete: 'organization', placeholder: 'Your business (optional)' }); firm.value = saved.firm || '';
  var img = CV.h('img', { class: 'sc-img', alt: '' });
  var canvas;
  function draw() {
    var c = document.createElement('canvas'); c.width = 1200; c.height = 1200; var x = c.getContext('2d');
    x.fillStyle = '#0e161b'; x.fillRect(0, 0, 1200, 1200);
    x.strokeStyle = '#e6b043'; x.lineWidth = 10; x.strokeRect(60, 60, 1080, 1080);
    x.fillStyle = '#e6b043'; x.font = '600 32px "IBM Plex Sans", sans-serif'; x.textAlign = 'center';
    x.fillText('UK SMALL BUSINESS CYBER OUTLOOK 2027', 600, 190);
    x.beginPath(); x.arc(600, 420, 150, 0, Math.PI * 2); x.fillStyle = '#62b8b5'; x.fill();
    x.strokeStyle = '#0e161b'; x.lineWidth = 34; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.moveTo(525, 425); x.lineTo(580, 480); x.lineTo(685, 365); x.stroke();
    x.fillStyle = '#e2e9e9'; x.font = '700 120px "Barlow Condensed", "Arial Narrow", sans-serif'; x.fillText('FIVE THINGS', 600, 720);
    x.fillText('DONE', 600, 840);
    x.fillStyle = '#e6b043'; x.font = '700 64px "Barlow Condensed", "Arial Narrow", sans-serif'; x.fillText('BEFORE JANUARY 2027', 600, 930);
    var name = firm.value.trim();
    x.fillStyle = '#9aa9ae'; x.font = '500 36px "IBM Plex Sans", sans-serif'; x.fillText(name ? name + ' · ' + CV.fmtDate(CV.today()) : CV.fmtDate(CV.today()), 600, 1020);
    x.fillStyle = '#62b8b5'; x.font = '600 30px "IBM Plex Sans", sans-serif'; x.fillText('cyberoutlook.sbcsg.uk', 600, 1090);
    return c;
  }
  function refresh() { CV.store.set('cert', { firm: firm.value }); document.fonts.ready.then(function () { canvas = draw(); img.src = canvas.toDataURL('image/png'); img.alt = 'Badge: five things done before January 2027' + (firm.value ? ', ' + firm.value : ''); }); }
  firm.addEventListener('input', refresh);
  var post = 'We’ve done the five things from the UK Small Business Cyber Outlook 2027 before January: MFA everywhere, a call-back rule for payments, four questions to our IT provider, our key suppliers, customers and AI tools listed, and a one-page incident plan printed.\n\nMost of it cost nothing. ' + CV.SITE;
  d.body.appendChild(CV.h('p', null, 'All five done. Most UK firms haven’t written down an incident plan, and now you have. Make a badge for your team or your LinkedIn.'));
  d.body.appendChild(CV.field('Business name on the badge', firm));
  d.body.appendChild(img);
  d.body.appendChild(CV.h('div', { class: 'cv-row' },
    CV.button('Download badge', function () { canvas.toBlob(function (b) { CV.download('five-things-done-2027.png', 'image/png', b); }); }, 'primary'),
    CV.button('Copy LinkedIn post', function () { CV.copy(post, 'Post copied. Add the badge image to it on LinkedIn'); })));
  CV.openCert = function () { refresh(); d.open(); };
  var foot = CV.$('.five-foot');
  var b = CV.button('Get your badge', CV.openCert, 'primary cert-btn');
  if (foot) foot.appendChild(b);
  function sync() { var all = count() === 5; b.hidden = !all; }
  list.addEventListener('change', function () { var before = saved.shown; sync(); if (count() === 5 && !before) { saved.shown = true; CV.store.set('cert', { firm: firm.value, shown: true }); setTimeout(CV.openCert, 400); } });
  document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('.five-reset')) setTimeout(sync, 0); });
  sync();
});

/* --- src/features/146-spend-builder.js --- */
// @msg Spend planner: tick what you'll do from each spend column and get a one-line budget picture to take to whoever signs off spending
// @sel #spend .tiers
CV.ready(function () {
  var tiers = CV.$$('#spend .tier'); if (!tiers.length) return;
  var saved = CV.store.get('spend', {});
  var NAMES = ['No spend', 'Modest spend', 'Planned spend'];
  var sum = CV.h('div', { class: 'sp-sum', 'aria-live': 'polite' });
  tiers.forEach(function (t, ti) {
    CV.$$('li', t).forEach(function (li, i) {
      var id = 'sp-' + ti + '-' + i;
      var cb = CV.h('input', { type: 'checkbox', id: id, class: 'sp-cb' }); cb.checked = !!saved[id];
      var lab = CV.h('label', { for: id }); while (li.firstChild) lab.appendChild(li.firstChild);
      li.appendChild(cb); li.appendChild(lab); li.classList.add('sp-li');
      cb.addEventListener('change', function () { saved[id] = cb.checked; CV.store.set('spend', saved); li.classList.toggle('on', cb.checked); render(); });
      li.classList.toggle('on', cb.checked);
    });
    t.classList.add('sp-tier');
  });
  function picked(ti) { return CV.$$('li', tiers[ti]).filter(function (li) { return li.querySelector('input').checked; }).map(function (li) { return CV.text(li.querySelector('label')); }); }
  function render() {
    sum.innerHTML = '';
    var p = [0, 1, 2].map(picked), total = p[0].length + p[1].length + p[2].length;
    if (!total) { sum.appendChild(CV.h('p', null, CV.h('b', null, 'Tick what you’ll do. '), 'Start with the first column: it costs nothing.')); return; }
    sum.appendChild(CV.h('div', { class: 'sp-bars', 'aria-hidden': 'true' }, p.map(function (x, i) { return CV.h('span', { class: 'sp-b' + i, style: 'flex-grow:' + x.length }); })));
    sum.appendChild(CV.h('p', null, CV.h('b', null, total + ' item' + (total === 1 ? '' : 's') + ': '), p.map(function (x, i) { return x.length + ' ' + NAMES[i].toLowerCase(); }).join(', ') + '.'));
    if (p[1].length + p[2].length && p[0].length < CV.$$('li', tiers[0]).length) sum.appendChild(CV.h('p', { class: 'sp-tip' }, 'Worth finishing the first column too: it costs nothing, and on its own it puts you ahead of most firms in the government’s survey on suppliers and incident planning.'));
    sum.appendChild(CV.h('div', { class: 'cv-row' }, CV.button('Copy budget note', function () {
      var t = 'Cyber budget for 2027 (from the UK Small Business Cyber Outlook 2027, ' + CV.SITE + '#spend)\n\n' + p.map(function (x, i) { return x.length ? NAMES[i] + ' (' + CV.text(tiers[i].querySelector('.sub')) + '):\n' + x.map(function (s) { return '- ' + s; }).join('\n') : ''; }).filter(Boolean).join('\n\n');
      CV.copy(t, 'Budget note copied');
    }, 'primary')));
  }
  CV.$('#spend .tiers').after(sum);
  render();
});

/* --- src/features/147-role-picker.js --- */
// @msg "I'm the…" picker: owners, office managers, IT leads and finance staff each get their own three-step route through the report
// @sel #start
CV.ready(function () {
  var start = CV.$('.start-inner'); if (!start) return;
  var ROUTES = {
    owner: { label: 'Owner or director', steps: [['Take the two-minute check', function () { CV.openCheck && CV.openCheck(); }], ['Read the executive summary', '#summary'], ['Name who owns cyber on the one-page plan', '#mvc']] },
    office: { label: 'Office manager', steps: [['Tick off the five things', '#h-if-you-do-five-things-before-january'], ['Print the call-back poster', function () { CV.openPoster && CV.openPoster(); }], ['Run the 90-day plan from your calendar', '#ninety']] },
    it: { label: 'IT lead or provider', steps: [['See what the rules now ask for', '#rules'], ['Read the four questions you’ll be asked', '#h-what-to-do'], ['Check the AI tool rule of three', '#theme-2']] },
    finance: { label: 'Finance or payments', steps: [['Read "Crime gets cheaper and faster"', '#theme-3'], ['Agree the call-back rule', function () { CV.openPoster && CV.openPoster(); }], ['Plan the spend', '#spend']] }
  };
  var role = CV.store.get('role', '');
  var box = CV.h('div', { class: 'rp' });
  var seg = CV.h('div', { class: 'rp-seg', role: 'radiogroup', 'aria-label': 'Your role' });
  var route = CV.h('ol', { class: 'rp-route', 'aria-live': 'polite' });
  Object.keys(ROUTES).forEach(function (k) {
    var b = CV.h('button', { type: 'button', role: 'radio', class: 'rp-opt', 'data-k': k }, ROUTES[k].label);
    b.addEventListener('click', function () { set(role === k ? '' : k); });
    seg.appendChild(b);
  });
  function set(k) {
    role = k; CV.store.set('role', k);
    CV.$$('.rp-opt', seg).forEach(function (b) { b.setAttribute('aria-checked', b.dataset.k === k ? 'true' : 'false'); });
    route.innerHTML = ''; box.classList.toggle('open', !!k);
    if (!k) return;
    ROUTES[k].steps.forEach(function (s, i) {
      var a = typeof s[1] === 'string' ? CV.h('a', { href: s[1], class: 'rp-step' }, CV.h('span', null, String(i + 1)), s[0]) : CV.h('button', { type: 'button', class: 'rp-step', onclick: s[1] }, CV.h('span', null, String(i + 1)), s[0]);
      route.appendChild(CV.h('li', null, a));
    });
    CV.emit('role', k);
  }
  box.appendChild(CV.h('p', { class: 'rp-q' }, 'I’m the…'));
  box.appendChild(seg); box.appendChild(route);
  start.appendChild(box);
  set(role);
});

/* --- src/features/148-like-yours.js --- */
// @msg Businesses like yours: meet the builder, the broker and the heating firm, and jump straight to the story closest to your own
// @sel #like-yours
CV.ready(function () {
  var after = CV.$$('#how-to-read h3').filter(function (h) { return /businesses in the examples/i.test(h.textContent); })[0]; if (!after) return;
  var P = [
    { who: 'Gary', what: 'Builder', where: 'Essex, about 12 staff', h: 'h-picture-this-happening-to-gary', hook: 'Other people’s problems become yours', theme: 'Theme 1' },
    { who: 'Rachel', what: 'Mortgage broker', where: 'Milton Keynes', h: 'h-say-rachel-a-mortgage-broker-in-milton-keynes', hook: 'AI in the back office', theme: 'Theme 2' },
    { who: 'Dave', what: 'Heating firm', where: 'Horsham', h: 'h-take-dave-a-heating-firm-in-horsham', hook: 'Crime gets cheaper and faster', theme: 'Theme 3' }
  ].filter(function (x) { return document.getElementById(x.h); });
  if (!P.length) return;
  var grid = CV.h('div', { class: 'ly', id: 'like-yours' },
    CV.h('p', { class: 'cv-kicker' }, 'Businesses like yours'),
    CV.h('div', { class: 'ly-grid' }, P.map(function (x) {
      return CV.h('a', { class: 'ly-card', href: '#' + x.h },
        CV.h('span', { class: 'ly-av', 'aria-hidden': 'true' }, x.who[0]),
        CV.h('span', { class: 'ly-main' }, CV.h('b', null, x.who + ', ' + x.what.toLowerCase()), CV.h('span', { class: 'ly-where' }, x.where), CV.h('span', { class: 'ly-hook' }, x.theme + ': ' + x.hook)),
        CV.h('span', { class: 'ly-go', 'aria-hidden': 'true' }, '→'));
    })));
  var p = after.nextElementSibling; (p && p.tagName === 'P' ? p : after).after(grid);
});

/* --- src/features/149-offline.js --- */
// Offline reading: register the service worker and show a quiet "available offline" note.
CV.ready(function () {
  if (!('serviceWorker' in navigator) || location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') return;
  var note = CV.h('p', { class: 'off-note', 'aria-live': 'polite', hidden: true });
  var cnt = CV.$('.start-head'); if (cnt) cnt.appendChild(note);
  function online() { note.textContent = navigator.onLine ? '✓ Saved for offline reading' : 'You’re offline. Reading the saved copy.'; note.classList.toggle('off', !navigator.onLine); }
  window.addEventListener('online', online); window.addEventListener('offline', online);
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js').then(function (reg) { return navigator.serviceWorker.ready; }).then(function () { note.hidden = false; online(); }).catch(function () {});
  });
});

/* --- src/features/150-live-charts.js --- */
// @msg Living charts: the report's bar charts grow into place as you reach them, and each bar names its exact figure when you point at it
// @sel #theme-1 figure svg.chart
CV.ready(function () {
  var charts = CV.$$('svg.chart'); if (!charts.length) return;
  var tip = CV.h('div', { class: 'ch-tip', 'aria-hidden': 'true', hidden: true }); document.body.appendChild(tip);
  charts.forEach(function (svg) {
    var bars = CV.$$('rect.c-bar, rect.c-bar2', svg);
    var labels = CV.$$('text.c-label', svg), values = CV.$$('text.c-value', svg);
    bars.forEach(function (r) {
      var y = +r.getAttribute('y');
      var lab = labels.filter(function (t) { return Math.abs(+t.getAttribute('y') - (y - 6)) < 12; })[0] || labels.reduce(function (a, t) { return Math.abs(+t.getAttribute('y') - y) < Math.abs(+a.getAttribute('y') - y) ? t : a; }, labels[0]);
      var val = values.filter(function (t) { return Math.abs(+t.getAttribute('y') - y) < 14; })[0];
      r.addEventListener('mouseenter', function (e) { if (!lab || !val) return; tip.textContent = lab.textContent + ': ' + val.textContent; tip.hidden = false; r.classList.add('hot'); });
      r.addEventListener('mousemove', function (e) { tip.style.left = (e.clientX + 12) + 'px'; tip.style.top = (e.clientY - 34) + 'px'; });
      r.addEventListener('mouseleave', function () { tip.hidden = true; r.classList.remove('hot'); });
    });
    if (CV.reduced() || !('IntersectionObserver' in window)) return;
    if (svg.getBoundingClientRect().top < window.innerHeight) return;
    svg.classList.add('ch-wait');
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); svg.classList.remove('ch-wait'); svg.classList.add('ch-grow'); } }, { threshold: 0.4 });
    io.observe(svg);
  });
});

/* --- src/features/151-pressure-map.js --- */
// @msg Living cover: the "outlook" isobars become a slow, generative pressure chart that bends around your pointer (still for reduced motion)
// @sel .cover
CV.ready(function () {
  var svg = CV.$('.cover .isobars'); if (!svg) return;
  var c = CV.h('canvas', { class: 'pm', 'aria-hidden': 'true' });
  svg.after(c); svg.classList.add('pm-replaced');
  var x = c.getContext('2d'), W, H, dpr = Math.min(2, window.devicePixelRatio || 1), mx = -1, my = -1, t = 0, raf;
  function css(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || '#0d5b60'; }
  function size() { var r = c.getBoundingClientRect(); W = r.width; H = r.height; c.width = W * dpr; c.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0); }
  function draw() {
    x.clearRect(0, 0, W, H);
    var acc = css('--accent'), sig = css('--signal');
    for (var k = 0; k < 7; k++) {
      var hot = k === 3, base = H * (0.16 + k * 0.12);
      x.beginPath();
      for (var px = 0; px <= W; px += 6) {
        var u = px / W;
        var y = base + Math.sin(u * 5.2 + t * 0.6 + k * 0.7) * H * 0.07 + Math.sin(u * 11 - t * 0.35 + k) * H * 0.025;
        if (mx >= 0) { var dx = px - mx, dy = y - my, d2 = dx * dx + dy * dy; y += (dy / Math.sqrt(d2 + 1)) * 28 * Math.exp(-d2 / 9000); }
        if (px === 0) x.moveTo(px, y); else x.lineTo(px, y);
      }
      x.strokeStyle = hot ? sig : acc; x.globalAlpha = hot ? 0.95 : 0.22 + (k % 3) * 0.12; x.lineWidth = hot ? 2.4 : 1.3;
      x.stroke();
    }
    x.globalAlpha = 1;
    // a single high-pressure marker that follows the hot line
    var hx = W * (0.72 + Math.sin(t * 0.2) * 0.08), hy = H * (0.16 + 3 * 0.12) + Math.sin(hx / W * 5.2 + t * 0.6 + 2.1) * H * 0.07;
    x.fillStyle = sig; x.font = '700 14px "Barlow Condensed", sans-serif'; x.fillText('2027', hx + 8, hy - 8);
    x.beginPath(); x.arc(hx, hy, 4, 0, Math.PI * 2); x.fill();
  }
  function loop() { t += 0.012; draw(); raf = requestAnimationFrame(loop); }
  size(); draw();
  window.addEventListener('resize', function () { size(); draw(); });
  c.parentNode.addEventListener('pointermove', function (e) { var r = c.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; if (CV.reduced()) draw(); });
  c.parentNode.addEventListener('pointerleave', function () { mx = my = -1; if (CV.reduced()) draw(); });
  if (!CV.reduced() && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { if (es[0].isIntersecting) { if (!raf) loop(); } else { cancelAnimationFrame(raf); raf = null; } }).observe(c);
  }
  var mo = new MutationObserver(function () { draw(); }); mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
});

/* --- src/features/152-theme-openers.js --- */
// @msg Theme openers: each of the three themes now opens with a giant numeral and its forecast set as a headline, so the structure is unmistakable
// @sel #theme-2
CV.ready(function () {
  ['theme-1', 'theme-2', 'theme-3', 'rules'].forEach(function (id, i) {
    var sec = document.getElementById(id); if (!sec) return;
    sec.classList.add('opener', 'op-' + (i + 1));
    var h = sec.querySelector('h2'); if (!h) return;
    var num = CV.h('span', { class: 'op-num', 'aria-hidden': 'true' }, i < 3 ? String(i + 1) : '+');
    sec.insertBefore(num, sec.firstChild);
  });
});

/* --- src/features/153-sources-explorer.js --- */
// @msg Sources explorer: filter the 36 sources by type, search them, see how often each is cited, and copy any citation
// @sel #sources
CV.ready(function () {
  var ol = CV.$('ol.sources'); if (!ol) return;
  var lis = CV.$$('li', ol);
  function kind(t) {
    if (/podcast|blog\./i.test(t) || /Small Business Cyber Security Guy/.test(t)) return 'ours';
    if (/^(Department|National Cyber|Information Commissioner|UK Parliament|City of London Police)/.test(t)) return 'official';
    if (/^IASME/.test(t)) return 'official';
    if (/arXiv|Willison|Information Security Forum/.test(t)) return 'research';
    return 'press';
  }
  var NAMES = { all: 'All', official: 'Official', press: 'Press and industry', research: 'Research', ours: 'Our episodes and articles', vendor: 'Vendor figures' };
  var cites = {}; CV.$$('sup.cite a[href^="#s"]').forEach(function (a) { var k = a.getAttribute('href').slice(1); cites[k] = (cites[k] || 0) + 1; });
  lis.forEach(function (li) {
    var t = CV.text(li); li.dataset.kind = kind(t); li.dataset.vendor = li.querySelector('.flag') ? '1' : '';
    var n = cites[li.id] || 0;
    var meta = CV.h('span', { class: 'src-meta' }, CV.h('span', { class: 'src-k k-' + li.dataset.kind }, NAMES[li.dataset.kind]), n ? CV.h('span', null, 'Cited ' + n + '×') : null,
      CV.h('button', { type: 'button', class: 'src-copy', 'aria-label': 'Copy citation ' + li.id.slice(1) }, 'Copy'));
    meta.querySelector('.src-copy').addEventListener('click', function () { var c = li.cloneNode(true); CV.$$('.src-meta,.backrefs', c).forEach(function (x) { x.parentNode.removeChild(x); }); CV.copy(CV.text(c), 'Citation copied'); });
    li.appendChild(meta);
  });
  var counts = { all: lis.length, vendor: lis.filter(function (l) { return l.dataset.vendor; }).length };
  lis.forEach(function (l) { counts[l.dataset.kind] = (counts[l.dataset.kind] || 0) + 1; });
  var cur = 'all';
  var q = CV.h('input', { type: 'search', class: 'cv-input src-q', placeholder: 'Search sources', 'aria-label': 'Search sources' });
  var chips = CV.h('div', { class: 'src-chips', role: 'group', 'aria-label': 'Filter sources' });
  var status = CV.h('p', { class: 'src-status', 'aria-live': 'polite' });
  Object.keys(NAMES).forEach(function (k) {
    if (!counts[k]) return;
    var b = CV.h('button', { type: 'button', class: 'sh-tab', 'aria-pressed': k === 'all' ? 'true' : 'false' }, NAMES[k] + ' ' , CV.h('span', { class: 'src-n' }, String(counts[k])));
    b.addEventListener('click', function () { cur = k; CV.$$('button', chips).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); apply(); });
    chips.appendChild(b);
  });
  function apply() {
    var s = q.value.trim().toLowerCase(), shown = 0;
    lis.forEach(function (li) { var ok = (cur === 'all' || (cur === 'vendor' ? li.dataset.vendor : li.dataset.kind === cur)) && (!s || li.textContent.toLowerCase().indexOf(s) > -1); li.hidden = !ok; if (ok) shown++; });
    status.textContent = shown === lis.length ? '' : 'Showing ' + shown + ' of ' + lis.length + ' sources';
  }
  q.addEventListener('input', apply);
  ol.before(CV.h('div', { class: 'src-tools cv-noprint' }, chips, q, status));
});

/* --- src/features/154-facts-lens.js --- */
// @msg Facts and forecasts lens: one switch tints every sourced fact teal and every forecast amber, making the report's evidence visible at a glance
// @sel #theme-1
CV.ready(function () {
  // Mark sentences ending in a citation as facts; forecasts are the "Our call" panels and section forecasts.
  CV.$$('main .prose p, main .prose li').forEach(function (p) {
    if (p.closest('.call,.cv-noprint') || !p.querySelector('sup.cite')) return;
    p.classList.add('lens-fact');
  });
  CV.$$('main aside.call, main .forecast').forEach(function (el) { el.classList.add('lens-call'); });
  var mode = '';
  var bar = CV.h('div', { class: 'lens-bar cv-noprint', role: 'group', 'aria-label': 'Evidence lens' },
    CV.h('span', { class: 'lens-t' }, 'Evidence lens'));
  [['', 'Off'], ['facts', 'Sourced facts'], ['calls', 'Forecasts'], ['both', 'Both']].forEach(function (o) {
    var b = CV.h('button', { type: 'button', class: 'lens-b', 'aria-pressed': o[0] === '' ? 'true' : 'false' }, o[1]);
    b.addEventListener('click', function () { mode = o[0]; document.body.dataset.lens = mode; CV.$$('.lens-b', bar).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); count(); });
    bar.appendChild(b);
  });
  var n = CV.h('span', { class: 'lens-n', 'aria-live': 'polite' }); bar.appendChild(n);
  function count() {
    var f = CV.$$('.lens-fact').length, c = CV.$$('aside.lens-call').length;
    n.textContent = mode === 'facts' ? f + ' passages with sources' : mode === 'calls' ? c + ' forecasts' : mode === 'both' ? f + ' sourced, ' + c + ' forecasts' : '';
  }
  // Put the switch where the report explains its approach.
  var h = CV.$$('#how-to-read h3').filter(function (x) { return /Facts and forecasts/i.test(x.textContent); })[0];
  if (h) { var p = h.nextElementSibling; (p && p.tagName === 'P' ? p : h).after(bar); }
  CV.setLens = function (m) { var b = CV.$$('.lens-b', bar).filter(function (x, i) { return ['', 'facts', 'calls', 'both'][i] === m; })[0]; if (b) b.click(); };
});

/* --- src/features/155-shortcuts.js --- */
// @msg Keyboard shortcuts: press ? for a cheat sheet; J and K jump between sections, P opens your plan, C the check, G the glossary
// @sel #start
CV.ready(function () {
  var secs = CV.$$('main section.section[id]');
  function cur() { var y = window.innerHeight * 0.3, c = -1; secs.forEach(function (s, i) { if (s.getBoundingClientRect().top <= y) c = i; }); return c; }
  function jump(d) { var i = Math.max(0, Math.min(secs.length - 1, cur() + d)); secs[i].scrollIntoView({ behavior: CV.reduced() ? 'auto' : 'smooth' }); var h = secs[i].querySelector('h2'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); } }
  var KEYS = [
    ['/', 'Search the report', function () { CV.openSearch && CV.openSearch(); }],
    ['j', 'Next section', function () { jump(1); }],
    ['k', 'Previous section', function () { jump(-1); }],
    ['p', 'Open my plan', function () { CV.plan && CV.plan.open(); }],
    ['c', 'Two-minute exposure check', function () { CV.openCheck && CV.openCheck(); }],
    ['g', 'Glossary', function () { CV.openGlossary && CV.openGlossary(); }],
    ['n', 'My highlights and notes', function () { CV.openNotes && CV.openNotes(); }],
    ['m', 'My progress', function () { CV.openProgress && CV.openProgress(); }],
    ['f', 'Focus mode', null],
    ['?', 'This list', function () { d.open(); }]
  ];
  var d = CV.dialog({ id: 'keys', title: 'Keyboard shortcuts', note: 'Shortcuts work when you’re not typing in a box.' });
  d.body.appendChild(CV.h('dl', { class: 'ks' }, KEYS.map(function (k) { return CV.h('div', null, CV.h('dt', null, CV.h('kbd', null, k[0].toUpperCase())), CV.h('dd', null, k[1])); })));
  document.addEventListener('keydown', function (e) {
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable || e.ctrlKey || e.metaKey || e.altKey) return;
    if (CV.$('dialog[open]') || !CV.$('.pr[hidden]') && CV.$('.pr')) return;
    var key = e.key === '?' ? '?' : e.key.toLowerCase();
    var k = KEYS.filter(function (x) { return x[0] === key && x[2]; })[0];
    if (k && key !== '/') { e.preventDefault(); k[2](); }
  });
});

/* --- src/features/156-tools-menu.js --- */
// @msg Cleaner cover: the crowded toolbar becomes three main actions plus one tidy Tools menu that groups everything else
// @sel .cover
CV.ready(function () {
  var bar = CV.$('.cover .tools'); if (!bar) return;
  var keep = ['My plan', 'Share', 'Search'];
  var buttons = CV.$$('.tool, .theme-toggle', bar);
  var menuItems = [];
  buttons.forEach(function (b) {
    var label = CV.text(b).replace(/\s*\d+$/, '').replace(/\s*\/$/, '').trim();
    if (b.id === 'themeToggle') return;
    if (keep.some(function (k) { return label.indexOf(k) === 0; })) return;
    menuItems.push({ el: b, label: b.getAttribute('aria-label') && b.textContent.trim() === 'Aa' ? 'Reading settings' : label });
  });
  var GROUPS = { 'My progress': 'Your work', 'My notes': 'Your work', 'Short version': 'Reading', 'Focus': 'Reading', 'Reading settings': 'Reading', 'Copy link': 'Share and print', 'Print or save PDF': 'Share and print' };
  var btn = CV.h('button', { type: 'button', class: 'tool tm-btn', 'aria-haspopup': 'true', 'aria-expanded': 'false', 'aria-controls': 'tools-menu' }, 'Tools ', CV.h('span', { 'aria-hidden': 'true' }, '▾'));
  var menu = CV.h('div', { class: 'tm', id: 'tools-menu', role: 'menu', hidden: true, 'aria-label': 'Tools' });
  var groups = {};
  menuItems.forEach(function (m) {
    var g = GROUPS[m.label] || 'More';
    if (!groups[g]) { groups[g] = CV.h('div', { class: 'tm-g', role: 'group', 'aria-label': g }, CV.h('p', { class: 'tm-h', 'aria-hidden': 'true' }, g)); }
    var item = CV.h('button', { type: 'button', role: 'menuitem', class: 'tm-i' }, m.label);
    var pressed = m.el.getAttribute('aria-pressed'); if (pressed != null) item.setAttribute('aria-checked', pressed), item.setAttribute('role', 'menuitemcheckbox');
    var badge = m.el.querySelector('.plan-count'); if (badge) item.appendChild(CV.h('span', { class: 'tm-n' }, badge.textContent));
    item.addEventListener('click', function () { close(); m.el.click(); });
    groups[g].appendChild(item); m.item = item;
    m.el.classList.add('tm-moved');
  });
  ['Your work', 'Reading', 'Share and print', 'More'].forEach(function (g) { if (groups[g]) menu.appendChild(groups[g]); });
  CV.addTool(btn);
  btn.after(menu);
  function items() { return CV.$$('[role^="menuitem"]', menu); }
  function open() { menuItems.forEach(function (m) { var p = m.el.getAttribute('aria-pressed'); var it = m.item; if (it && p != null) it.setAttribute('aria-checked', p); var bd = m.el.querySelector('.plan-count'), tn = it && it.querySelector('.tm-n'); if (bd && tn) { tn.textContent = bd.textContent; tn.classList.toggle('zero', bd.textContent === '0'); } }); menu.hidden = false; btn.setAttribute('aria-expanded', 'true'); items()[0].focus(); }
  function close(refocus) { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); if (refocus) btn.focus(); }
  btn.addEventListener('click', function () { if (menu.hidden) open(); else close(); });
  menu.addEventListener('keydown', function (e) {
    var it = items(), i = it.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); it[(i + 1) % it.length].focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); it[(i - 1 + it.length) % it.length].focus(); }
    if (e.key === 'Home') { e.preventDefault(); it[0].focus(); }
    if (e.key === 'End') { e.preventDefault(); it[it.length - 1].focus(); }
    if (e.key === 'Escape' || e.key === 'Tab') close(e.key === 'Escape');
  });
  document.addEventListener('click', function (e) { if (!menu.hidden && !menu.contains(e.target) && e.target !== btn && !btn.contains(e.target)) close(); });
  CV.toolsMenu = { add: function (label, fn, group) { var g = group || 'More'; if (!groups[g]) { groups[g] = CV.h('div', { class: 'tm-g', role: 'group', 'aria-label': g }, CV.h('p', { class: 'tm-h', 'aria-hidden': 'true' }, g)); menu.appendChild(groups[g]); } var it = CV.h('button', { type: 'button', role: 'menuitem', class: 'tm-i' }, label); it.addEventListener('click', function () { close(); fn(); }); groups[g].appendChild(it); return it; } };
  // Glossary and shortcuts have no toolbar button yet; give them a home.
  if (CV.openGlossary) CV.toolsMenu.add('Glossary', CV.openGlossary, 'Reading');
  CV.toolsMenu.add('Keyboard shortcuts', function () { var d = document.getElementById('keys'); if (d) d.showModal(); }, 'More');
  if (CV.openForecasts) CV.toolsMenu.add('All the forecasts', CV.openForecasts, 'Reading');
  if (CV.present) CV.toolsMenu.add('Present to my team', CV.present, 'Share and print');
});

/* --- src/features/157-your-data.js --- */
// @msg Your data, your control: see exactly what this page has saved in your browser, back it up, move it to another device, or wipe it in one click
// @sel #disclaimer
CV.ready(function () {
  var LABELS = { 'cv:plan': 'My plan', 'cv:check': 'Exposure check answers', 'cv-five-things': 'Five things ticks', 'cv:ninety': '90-day plan ticks', 'cv-plan-contacts': 'Who-to-call contacts', 'cv:fivefive': 'Five-and-five map', 'cv:aitools': 'AI tool register', 'cv:poster': 'Poster details', 'cv:itmail': 'IT provider email details', 'cv:marks': 'Highlights and notes', 'cv:votes': 'Forecast reactions', 'cv:spend': 'Spend planner', 'cv:meeting': 'Team meeting details', 'cv:cert': 'Badge details', 'cv:pos': 'Reading position', 'cv:read': 'Reading settings', 'cv:short': 'Short version switch', 'cv:role': 'Your role', 'cv:rate': 'Read-aloud speed', 'cv:toured': 'First-visit tour seen', 'theme': 'Light or dark mode' };
  var d = CV.dialog({ id: 'mydata', title: 'Your data', wide: true, onopen: render, note: 'This site has no accounts, no tracking cookies and no server-side storage. Everything below lives in this browser on this device.' });
  function render() {
    var b = d.body; b.innerHTML = '';
    var keys = CV.store.keys();
    if (!keys.length) { b.appendChild(CV.h('p', null, 'Nothing saved yet.')); }
    else {
      var tb = CV.h('tbody');
      keys.forEach(function (k) { var v = ''; try { v = localStorage.getItem(k) || ''; } catch (e) {} tb.appendChild(CV.h('tr', null, CV.h('td', null, LABELS[k] || k), CV.h('td', null, v.length > 2 ? (Math.ceil(v.length / 100) / 10) + ' KB' : 'empty'))); });
      b.appendChild(CV.h('div', { class: 'table-wrap' }, CV.h('table', { class: 'md-t' }, CV.h('thead', null, CV.h('tr', null, CV.h('th', { scope: 'col' }, 'What'), CV.h('th', { scope: 'col' }, 'Size'))), tb)));
    }
    var file = CV.h('input', { type: 'file', accept: 'application/json,.json', class: 'cv-offscreen', id: 'md-file' });
    file.addEventListener('change', function () {
      var f = file.files[0]; if (!f) return; var r = new FileReader();
      r.onload = function () { try { var data = JSON.parse(r.result); if (data.app !== 'cyberoutlook') throw 0; Object.keys(data.items).forEach(function (k) { if (/^(cv:|cv-)|^theme$/.test(k)) localStorage.setItem(k, data.items[k]); }); CV.toast('Restored. Reloading'); setTimeout(function () { location.reload(); }, 700); } catch (e) { CV.toast('That file isn’t a Cyber Outlook backup'); } };
      r.readAsText(f);
    });
    b.appendChild(file);
    var confirmRow = CV.h('div', { class: 'md-confirm', hidden: true }, CV.h('p', null, CV.h('b', null, 'Delete everything? '), 'Your plan, ticks, notes and contacts will be gone from this browser.'),
      CV.button('Yes, delete it all', function () { CV.store.keys().forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} }); CV.toast('All your data deleted. Reloading'); setTimeout(function () { location.reload(); }, 700); }, 'primary md-danger'),
      CV.button('Cancel', function () { confirmRow.hidden = true; }));
    b.appendChild(CV.h('div', { class: 'cv-row' },
      CV.button('Download a backup', function () { var items = {}; CV.store.keys().forEach(function (k) { items[k] = localStorage.getItem(k); }); CV.download('cyber-outlook-backup.json', 'application/json', JSON.stringify({ app: 'cyberoutlook', saved: new Date().toISOString(), items: items }, null, 2)); }, 'primary'),
      CV.button('Restore from a backup', function () { file.click(); }),
      CV.button('Delete everything', function () { confirmRow.hidden = false; })));
    b.appendChild(confirmRow);
  }
  CV.openMyData = function () { d.open(); };
  if (CV.toolsMenu) CV.toolsMenu.add('Your data', CV.openMyData, 'Your work');
  var col = CV.$('.colophon'); if (col) col.appendChild(CV.h('p', { class: 'cv-noprint' }, 'This page keeps your plan and notes in your browser only. ', CV.h('button', { type: 'button', class: 'gl-open', onclick: CV.openMyData }, 'See or delete your data')));
});

/* --- src/features/158-tour.js --- */
// @msg First-visit tour: four quick pointers show new readers the check, the plan and the tools, once, and never again
// @sel #start
CV.ready(function () {
  if (CV.store.get('toured', false) || location.hash) return;
  var STEPS = [
    ['.path.primary', 'Start with the two-minute check', 'Ten yes-or-no questions. You get a score and your gaps, linked to the actions that fix them.'],
    ['.plan-tool', 'Build your plan', 'Add actions from anywhere in the report. Give each an owner and a date, then put them in your calendar.'],
    ['.tm-btn', 'Everything else is in Tools', 'Short version, focus mode, reading settings, notes, glossary, present to your team, and your data.'],
    ['.rp', 'Tell us who you are', 'Pick your role for a three-step route through the report.']
  ].filter(function (s) { return CV.$(s[0]); });
  if (!STEPS.length) return;
  var i = 0, ring = CV.h('div', { class: 'tour-ring', 'aria-hidden': 'true' });
  var box = CV.h('div', { class: 'tour', role: 'dialog', 'aria-modal': 'false', 'aria-labelledby': 'tour-t' });
  function end() { CV.store.set('toured', true); ring.remove(); box.remove(); window.removeEventListener('resize', place); window.removeEventListener('scroll', place); }
  function place() {
    var el = CV.$(STEPS[i][0]); if (!el) return end();
    var r = el.getBoundingClientRect();
    ring.style.cssText = 'left:' + (r.left - 6) + 'px;top:' + (r.top - 6) + 'px;width:' + (r.width + 12) + 'px;height:' + (r.height + 12) + 'px';
    var w = Math.min(320, window.innerWidth - 32); box.style.width = w + 'px';
    var x = Math.max(16, Math.min(window.innerWidth - w - 16, r.left)); var y = r.bottom + 14;
    if (y + box.offsetHeight > window.innerHeight - 12) y = Math.max(12, r.top - box.offsetHeight - 14);
    box.style.left = x + 'px'; box.style.top = y + 'px';
  }
  function show() {
    var s = STEPS[i], el = CV.$(s[0]);
    box.innerHTML = '';
    box.appendChild(CV.h('p', { class: 'cv-kicker' }, (i + 1) + ' of ' + STEPS.length));
    box.appendChild(CV.h('h2', { id: 'tour-t' }, s[1]));
    box.appendChild(CV.h('p', null, s[2]));
    var next = CV.button(i < STEPS.length - 1 ? 'Next' : 'Got it', function () { if (i < STEPS.length - 1) { i++; show(); } else end(); }, 'primary');
    box.appendChild(CV.h('div', { class: 'cv-row' }, next, CV.button('Skip the tour', end)));
    el.scrollIntoView({ block: 'center', behavior: 'auto' });
    setTimeout(function () { place(); next.focus({ preventScroll: true }); }, 30);
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && box.isConnected) end(); });
  window.addEventListener('resize', place); window.addEventListener('scroll', place, { passive: true });
  setTimeout(function () { if (CV.$('dialog[open]')) return; document.body.appendChild(ring); document.body.appendChild(box); show(); }, 1200);
});

/* --- src/features/159-full-pdf.js --- */
// Full-report PDF: offer it in the Tools menu and the share hub too.
CV.ready(function () {
  var href = 'assets/UK-Small-Business-Cyber-Outlook-2027.pdf';
  function get() { var a = CV.h('a', { href: href, download: '' }); document.body.appendChild(a); a.click(); a.remove(); }
  if (CV.toolsMenu) CV.toolsMenu.add('Download the full PDF', get, 'Share and print');
  var share = document.getElementById('share');
  if (share) { var row = share.querySelector('.cv-dialog-body > .cv-row:last-child'); if (row) row.appendChild(CV.h('a', { class: 'tool', href: href, download: '' }, 'Full report (PDF)')); }
});

/* --- src/features/161-toc-progress.js --- */
// @msg Contents with a sense of distance: every section shows its reading time and a ring that fills as you read it
// @sel .toc
CV.ready(function () {
  var links = CV.$$('.toc a[href^="#"]'); if (!links.length) return;
  var rows = links.map(function (a) {
    var sec = document.getElementById(a.getAttribute('href').slice(1)); if (!sec) return null;
    var words = CV.text(sec).split(' ').length, mins = Math.max(1, Math.round(words / 230));
    var ring = CV.h('span', { class: 'tp-ring', 'aria-hidden': 'true' });
    var min = CV.h('span', { class: 'tp-min' }, mins + ' min');
    a.appendChild(min); a.appendChild(ring);
    a.setAttribute('aria-label', CV.text(a).replace(/\d+ min$/, '').trim() + ', about ' + mins + ' minute' + (mins === 1 ? '' : 's'));
    return { a: a, sec: sec, ring: ring, max: CV.store.get('read-' + sec.id, 0) };
  }).filter(Boolean);
  var saved = CV.store.get('readpct', {});
  function update() {
    var vh = window.innerHeight;
    rows.forEach(function (r) {
      var rect = r.sec.getBoundingClientRect();
      var pct = Math.max(0, Math.min(1, (vh * 0.7 - rect.top) / Math.max(1, rect.height)));
      var best = Math.max(saved[r.sec.id] || 0, pct);
      if (best > (saved[r.sec.id] || 0) + 0.02 || best === 1 && saved[r.sec.id] !== 1) saved[r.sec.id] = Math.round(best * 100) / 100;
      r.ring.style.setProperty('--p', (saved[r.sec.id] || 0) * 100 + '%');
      r.a.classList.toggle('tp-done', (saved[r.sec.id] || 0) > 0.9);
    });
  }
  var t, tk = false;
  window.addEventListener('scroll', function () { if (!tk) { tk = true; requestAnimationFrame(function () { tk = false; update(); clearTimeout(t); t = setTimeout(function () { CV.store.set('readpct', saved); }, 600); }); } }, { passive: true });
  update();
});

/* --- src/features/162-five-tracker.js --- */
// @msg The five things follow you: a compact tracker under the contents keeps your before-January list in view on every page of the report
// @sel .toc
CV.ready(function () {
  var toc = CV.$('.toc'), five = CV.$('#five'); if (!toc || !five) return;
  var dots = CV.h('span', { class: 'ft-dots', 'aria-hidden': 'true' });
  for (var i = 0; i < 5; i++) dots.appendChild(CV.h('span'));
  var label = CV.h('span', { class: 'ft-l' });
  var box = CV.h('a', { class: 'ft', href: '#h-if-you-do-five-things-before-january' }, CV.h('span', { class: 'ft-k' }, 'Before January'), dots, label);
  toc.appendChild(box);
  function sync() {
    var on = CV.$$('input', five).map(function (b) { return b.checked; }), n = on.filter(Boolean).length;
    CV.$$('span', dots).forEach(function (s, i) { s.classList.toggle('on', on[i]); });
    label.textContent = n === 5 ? 'All five done' : n + ' of 5 things done';
    box.classList.toggle('all', n === 5);
    box.setAttribute('aria-label', 'Five things before January: ' + label.textContent + '. Go to the list.');
  }
  five.addEventListener('change', sync);
  document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('.five-reset')) setTimeout(sync, 0); });
  sync();
});

/* --- src/features/163-plan-nudge.js --- */
// @msg Halfway nudge: readers who are deep in the report but haven't started a plan get one gentle, dismissible prompt to turn reading into action
// @sel #theme-3
CV.ready(function () {
  if (CV.store.get('nudged', false)) return;
  var shown = false;
  function eligible() { return !(CV.plan && CV.plan.count()) && !(CV.checkScore && CV.checkScore() != null) && !CV.$('dialog[open]') && !CV.$('.tour'); }
  var card = CV.h('aside', { class: 'nudge', role: 'complementary', 'aria-label': 'Suggestion' },
    CV.h('p', { class: 'cv-kicker' }, 'You’re halfway through'),
    CV.h('p', { class: 'nudge-t' }, 'Turn this into a plan in two minutes'),
    CV.h('p', { class: 'nudge-s' }, 'Answer ten yes-or-no questions and get your gaps as dated actions.'),
    CV.h('div', { class: 'cv-row' }, CV.button('Take the check', function () { done(); CV.openCheck && CV.openCheck(true); }, 'primary'), CV.button('Not now', function () { done(); })));
  function done() { CV.store.set('nudged', true); card.classList.remove('show'); setTimeout(function () { card.remove(); }, 300); window.removeEventListener('scroll', check); }
  function check() {
    if (shown) return;
    var h = document.documentElement.scrollHeight - window.innerHeight; if (h <= 0) return;
    if (window.scrollY / h > 0.45 && eligible()) { shown = true; document.body.appendChild(card); setTimeout(function () { card.classList.add('show'); }, 30); }
  }
  window.addEventListener('scroll', check, { passive: true });
});

/* --- src/features/164-ce-readiness.js --- */
// @msg Cyber Essentials readiness check: five questions based on the new v3.3 rules tell you what to fix before you book an assessment
// @sel #rules
CV.ready(function () {
  var h = CV.$$('#rules h3').filter(function (x) { return /Cyber Essentials, Requirements/.test(x.textContent); })[0]; if (!h) return;
  var Q = [
    { q: 'Is multi-factor authentication switched on for every cloud service that offers it, free or paid?', fix: 'Missing MFA on any cloud service where it’s available is an automatic fail under v3.3.', must: true },
    { q: 'Have you listed every cloud service you use, including email, accounting and booking systems?', fix: 'Cloud services can’t be excluded from scope, so you need the full list.', must: true },
    { q: 'Do the owner and finance staff sign in with passkeys or security keys where possible?', fix: 'Passwordless sign-in and passkeys are highlighted as good practice. Not required, but worth doing.', must: false },
    { q: 'Are automatic updates switched on for every laptop and phone?', fix: 'Keeping devices updated is one of the basic controls the certificate checks.', must: true },
    { q: 'Do you know who will do your assessment and roughly when?', fix: 'The 90-day plan books it in week 11. A certification body or your IT provider can help.', must: false }
  ];
  var ans = CV.store.get('ce', {});
  var d = CV.dialog({ id: 'ce', title: 'Cyber Essentials readiness', wide: true, note: 'A quick self-check based on the changes described in this report. Only an assessment tells you whether you pass.' });
  function render() {
    var b = d.body; b.innerHTML = '';
    var list = CV.h('ol', { class: 'ce-list' });
    Q.forEach(function (x, i) {
      var g = CV.h('div', { class: 'ce-opts', role: 'radiogroup', 'aria-label': x.q });
      [['yes', 'Yes'], ['no', 'No']].forEach(function (o) {
        var id = 'ce-' + i + '-' + o[0]; var r = CV.h('input', { type: 'radio', name: 'ce-' + i, id: id }); r.checked = ans[i] === o[0];
        r.addEventListener('change', function () { ans[i] = o[0]; CV.store.set('ce', ans); render(); var f = document.getElementById(id); if (f) f.focus(); });
        g.appendChild(CV.h('span', { class: 'ce-o' }, r, CV.h('label', { for: id }, o[1])));
      });
      list.appendChild(CV.h('li', { class: ans[i] === 'no' ? 'no' : ans[i] === 'yes' ? 'yes' : '' }, CV.h('p', null, x.q, x.must ? '' : CV.h('span', { class: 'ce-opt' }, ' Good practice')), g, ans[i] === 'no' ? CV.h('p', { class: 'ce-fix' }, x.fix) : null));
    });
    b.appendChild(list);
    var answered = Object.keys(ans).length, blockers = Q.filter(function (x, i) { return x.must && ans[i] === 'no'; }).length;
    if (answered === Q.length) b.appendChild(CV.h('div', { class: 'ce-res ' + (blockers ? 'fix' : 'ok') }, CV.h('b', null, blockers ? blockers + ' thing' + (blockers === 1 ? '' : 's') + ' to fix before you book.' : 'Looks ready to book an assessment.'), ' ', blockers ? 'Fix the items marked above first.' : 'Book it, and add it to your plan.'));
    b.appendChild(CV.h('div', { class: 'cv-row' }, CV.plan ? CV.button('Add "MFA on every cloud service" to my plan', function () { CV.plan.add('t3-1'); }) : null, CV.button('Start again', function () { ans = {}; CV.store.set('ce', ans); render(); })));
  }
  var p = h.nextElementSibling; while (p && p.tagName !== 'UL') p = p.nextElementSibling;
  (p || h).after(CV.h('div', { class: 'cta-card cv-noprint' }, CV.h('div', null, CV.h('p', { class: 'cv-kicker' }, 'Tool'), CV.h('p', { class: 'cta-title' }, 'Are you ready for Cyber Essentials?'), CV.h('p', { class: 'cta-sub' }, 'Five questions based on the v3.3 changes. See what to fix before you book.')), CV.button('Check my readiness', function () { render(); d.open(); }, 'primary')));
  CV.openCE = function () { render(); d.open(); };
});

/* --- src/features/165-questionnaire.js --- */
// @msg Supplier questionnaire answers: fill in a few facts once and get paste-ready answers for the cyber questions customers and insurers now ask
// @sel #rules .example
CV.ready(function () {
  var ex = CV.$$('#rules .example').pop(); if (!ex) return;
  var s = CV.store.get('sq', {});
  function sel(id, opts, v) { var e = CV.h('select', { id: id }); opts.forEach(function (o) { var op = CV.h('option', { value: o[0] }, o[1]); if (v === o[0]) op.selected = true; e.appendChild(op); }); return e; }
  var f = {
    ce: sel('sq-ce', [['', 'Choose'], ['plus', 'Yes, Cyber Essentials Plus'], ['yes', 'Yes, Cyber Essentials'], ['booked', 'Booked, not yet certified'], ['no', 'No']], s.ce),
    cert: CV.h('input', { id: 'sq-cert', type: 'text', placeholder: 'Certificate number and expiry' }),
    mfa: sel('sq-mfa', [['', 'Choose'], ['all', 'On every cloud service'], ['most', 'On most services, rolling out'], ['no', 'Not yet']], s.mfa),
    plan: sel('sq-plan', [['', 'Choose'], ['yes', 'Yes, written and printed'], ['no', 'Not yet']], s.plan),
    who: CV.h('input', { id: 'sq-who', type: 'text', placeholder: 'Name, role' }),
    tel: CV.h('input', { id: 'sq-tel', type: 'text', placeholder: 'Phone and email' }),
    restore: CV.h('input', { id: 'sq-restore', type: 'date' })
  };
  f.cert.value = s.cert || ''; f.who.value = s.who || ''; f.tel.value = s.tel || ''; f.restore.value = s.restore || '';
  var out = CV.h('pre', { class: 'cv-pre', 'aria-live': 'polite' });
  function text() {
    var L = [];
    L.push('Q: Do you hold Cyber Essentials?\nA: ' + ({ plus: 'Yes, Cyber Essentials Plus.', yes: 'Yes, Cyber Essentials.', booked: 'Our assessment is booked.', no: 'Not yet. We are working towards it.' }[f.ce.value] || '[answer]') + (f.cert.value && /plus|yes/.test(f.ce.value) ? ' Certificate: ' + f.cert.value + '.' : ''));
    L.push('Q: Is multi-factor authentication enabled on all cloud services?\nA: ' + ({ all: 'Yes, on every cloud service that supports it.', most: 'On most services, with the remainder being rolled out.', no: 'Not yet. It is being rolled out, starting with email.' }[f.mfa.value] || '[answer]'));
    L.push('Q: Do you have an incident response plan?\nA: ' + ({ yes: 'Yes. A written one-page plan, with a printed copy kept off site.', no: 'We are writing one.' }[f.plan.value] || '[answer]'));
    L.push('Q: Who is your named contact for security incidents, and how quickly will you notify us?\nA: ' + (f.who.value || '[name, role]') + ', ' + (f.tel.value || '[phone and email]') + '. We will notify you within 24 hours of becoming aware of an incident that affects you.');
    L.push('Q: When did you last test restoring from backup?\nA: ' + (f.restore.value ? CV.fmtDate(CV.parseDate(f.restore.value)) + '.' : '[date]'));
    return L.join('\n\n');
  }
  function refresh() { Object.keys(f).forEach(function (k) { s[k] = f[k].value; }); CV.store.set('sq', s); out.textContent = text(); }
  Object.keys(f).forEach(function (k) { f[k].addEventListener('input', refresh); f[k].addEventListener('change', refresh); });
  var d = CV.dialog({ id: 'sq', title: 'Questionnaire answers', wide: true, note: 'Only answer "yes" where it’s true. The 24-hour line matches the notification window customers are starting to ask for; change it if your contract says otherwise.' });
  d.body.appendChild(CV.h('div', { class: 'cv-grid2' }, CV.field('Cyber Essentials', f.ce), CV.field('Certificate details', f.cert), CV.field('Multi-factor authentication', f.mfa), CV.field('Incident plan', f.plan), CV.field('Incident contact', f.who), CV.field('Contact details', f.tel), CV.field('Last restore test', f.restore)));
  d.body.appendChild(out);
  d.body.appendChild(CV.h('div', { class: 'cv-row' }, CV.button('Copy the answers', function () { CV.copy(text(), 'Answers copied'); }, 'primary'), CV.openCE ? CV.button('Check Cyber Essentials readiness', function () { d.close(); CV.openCE(); }) : null));
  refresh();
  ex.after(CV.h('div', { class: 'cta-card cv-noprint' }, CV.h('div', null, CV.h('p', { class: 'cv-kicker' }, 'Tool'), CV.h('p', { class: 'cta-title' }, 'Make Gary’s ten-minute form yours'), CV.h('p', { class: 'cta-sub' }, 'Fill in a few facts once. Get paste-ready answers for supplier and insurance questionnaires.')), CV.button('Write my answers', function () { d.open(); }, 'primary')));
});

/* --- src/features/166-incident-mode.js --- */
// @msg "It's happening now" mode: one tap turns your one-page plan into a calm, full-screen incident card with tap-to-call contacts and a timestamped log
// @sel #mvc
CV.ready(function () {
  var rows = CV.$$('.a4 tbody tr'); if (!rows.length) return;
  function contacts() {
    var saved = {}; try { saved = JSON.parse(localStorage.getItem('cv-plan-contacts') || '{}'); } catch (e) {}
    var cells = CV.$$('.a4 td.fill');
    return rows.map(function (tr) { var c = tr.children, fill = tr.querySelector('td.fill'), idx = cells.indexOf(fill); var who = CV.text(c[1]); var mine = idx > -1 && saved[idx] ? saved[idx] : ''; var num = (mine.match(/(\+?\d[\d\s]{7,}\d)/) || who.match(/(0\d{3} \d{3} \d{4})/) || [])[1]; return { n: CV.text(c[0]), who: who, when: CV.text(c[2]), mine: mine, tel: num ? num.replace(/\s/g, '') : '' }; });
  }
  var log = CV.store.get('inclog', []);
  var el = CV.h('div', { class: 'inc', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'inc-h', hidden: true });
  document.body.appendChild(el);
  function stamp() { var d = new Date(); return d.toLocaleDateString('en-GB') + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); }
  function add(t) { log.push({ t: stamp(), x: t }); CV.store.set('inclog', log); render(); }
  function render() {
    el.innerHTML = '';
    var close = CV.h('button', { type: 'button', class: 'inc-x', 'aria-label': 'Close incident mode' }, '×');
    close.addEventListener('click', shut);
    el.appendChild(CV.h('div', { class: 'inc-head' }, CV.h('div', null, CV.h('p', { class: 'inc-k' }, 'Incident mode'), CV.h('h2', { id: 'inc-h' }, 'Stay calm. Work down the list.')), close));
    var ol = CV.h('ol', { class: 'inc-list' });
    contacts().forEach(function (c) {
      ol.appendChild(CV.h('li', null, CV.h('span', { class: 'inc-n' }, c.n), CV.h('div', { class: 'inc-m' }, CV.h('b', null, c.who), CV.h('span', null, c.when), c.mine ? CV.h('span', { class: 'inc-mine' }, c.mine) : CV.h('span', { class: 'inc-miss' }, 'No contact saved yet')),
        c.tel ? CV.h('a', { class: 'inc-call', href: 'tel:' + c.tel, onclick: function () { add('Called ' + c.who); } }, 'Call') : CV.button('Done', function () { add('Contacted ' + c.who); })));
    });
    el.appendChild(ol);
    var note = CV.h('input', { type: 'text', class: 'cv-input', placeholder: 'What just happened? e.g. "Bank confirmed payment stopped"', 'aria-label': 'Add to the incident log' });
    note.addEventListener('keydown', function (e) { if (e.key === 'Enter' && note.value.trim()) { add(note.value.trim()); } });
    el.appendChild(CV.h('div', { class: 'inc-log' }, CV.h('p', { class: 'inc-k' }, 'Incident log'), CV.h('div', { class: 'inc-add' }, note, CV.button('Add', function () { if (note.value.trim()) add(note.value.trim()); }, 'primary')),
      log.length ? CV.h('ul', null, log.slice().reverse().map(function (l) { return CV.h('li', null, CV.h('time', null, l.t), ' ', l.x); })) : CV.h('p', { class: 'inc-miss' }, 'Everything you add is time-stamped. Your insurer and the ICO may ask for this.'),
      CV.h('div', { class: 'cv-row' }, log.length ? CV.button('Download the log', function () { CV.download('incident-log.txt', 'text/plain', 'INCIDENT LOG\n\n' + log.map(function (l) { return l.t + '  ' + l.x; }).join('\n')); }) : null, log.length ? CV.button('Clear the log', function () { log = []; CV.store.set('inclog', log); render(); }) : null)));
    setTimeout(function () { (CV.$('.inc-call', el) || close).focus(); }, 30);
  }
  var last;
  function open() { last = document.activeElement; render(); el.hidden = false; document.documentElement.classList.add('cv-modal-open'); if (!log.length) add('Incident mode opened'); }
  function shut() { el.hidden = true; document.documentElement.classList.remove('cv-modal-open'); if (last) last.focus(); }
  document.addEventListener('keydown', function (e) { if (!el.hidden && e.key === 'Escape') shut(); });
  CV.openIncident = open;
  var tools = CV.$('.plan-tools'); if (tools) tools.insertBefore(CV.button('It’s happening now', open, 'inc-btn'), tools.firstChild);
  if (CV.toolsMenu) CV.toolsMenu.add('It’s happening now', open, 'Your work');
});

/* --- src/features/167-restore-log.js --- */
// @msg Restore-test log: record each time you get files back from backup, how long it took, and get reminders for the next quarterly test
// @sel #theme-3 .table-wrap
CV.ready(function () {
  var tw = CV.$('#theme-3 .table-wrap'); if (!tw) return;
  var log = CV.store.get('restores', []);
  var d = CV.dialog({ id: 'restore', title: 'Restore-test log', wide: true, note: 'From Theme 3: keep a backup ransomware can’t reach, and test a restore every quarter. The 90-day plan does the first one in week 9.' });
  function due() { if (!log.length) return null; var l = CV.parseDate(log[log.length - 1].date); l.setMonth(l.getMonth() + 3); return l; }
  function render() {
    var b = d.body; b.innerHTML = '';
    var dt = CV.h('input', { type: 'date', id: 'rs-date' }); dt.valueAsDate = new Date();
    var what = CV.h('input', { type: 'text', id: 'rs-what', placeholder: 'e.g. Accounts folder, 2 GB' });
    var mins = CV.h('input', { type: 'number', id: 'rs-min', min: '1', placeholder: 'Minutes' });
    var ok = CV.h('select', { id: 'rs-ok' }, CV.h('option', { value: 'yes' }, 'Yes, everything came back'), CV.h('option', { value: 'part' }, 'Partly'), CV.h('option', { value: 'no' }, 'No'));
    b.appendChild(CV.h('div', { class: 'cv-grid2' }, CV.field('Date', dt), CV.field('What you restored', what), CV.field('How long it took', mins), CV.field('Did it work?', ok)));
    b.appendChild(CV.h('div', { class: 'cv-row' }, CV.button('Add to the log', function () { if (!dt.value) return; log.push({ date: dt.value, what: what.value.trim(), mins: mins.value, ok: ok.value }); log.sort(function (a, c) { return a.date < c.date ? -1 : 1; }); CV.store.set('restores', log); CV.toast('Restore test logged'); render(); }, 'primary')));
    var n = due();
    if (n) b.appendChild(CV.h('p', { class: 'rs-due' + (n < CV.today() ? ' late' : '') }, CV.h('b', null, n < CV.today() ? 'Overdue: ' : 'Next test due: '), CV.fmtDate(n)));
    if (log.length) {
      var t = CV.h('table', { class: 'md-t' }, CV.h('thead', null, CV.h('tr', null, ['Date', 'Restored', 'Time', 'Worked'].map(function (x) { return CV.h('th', { scope: 'col' }, x); }))), CV.h('tbody', null, log.slice().reverse().map(function (l) { return CV.h('tr', null, CV.h('td', null, CV.fmtDate(CV.parseDate(l.date))), CV.h('td', null, l.what || '–'), CV.h('td', null, l.mins ? l.mins + ' min' : '–'), CV.h('td', null, { yes: 'Yes', part: 'Partly', no: 'No' }[l.ok])); })));
      b.appendChild(CV.h('div', { class: 'table-wrap' }, t));
    }
    b.appendChild(CV.h('div', { class: 'cv-row' },
      CV.button('Quarterly reminders for a year', function () { var s = due() || CV.today(); var ev = []; for (var i = 0; i < 4; i++) { var x = new Date(s.getTime()); x.setMonth(s.getMonth() + i * 3); ev.push({ title: 'Cyber: test a restore from backup', date: x, description: 'Pick one important folder, get it back from backup, and time it. Log it at ' + CV.SITE + '#restore', url: CV.SITE }); } CV.ics(ev, 'restore-test-reminders.ics'); }),
      log.length ? CV.button('Copy the log', function () { CV.copy('RESTORE TESTS\n' + log.map(function (l) { return l.date + ' | ' + (l.what || '-') + ' | ' + (l.mins || '-') + ' min | ' + l.ok; }).join('\n'), 'Log copied'); }) : null));
  }
  CV.openRestore = function () { render(); d.open(); };
  tw.after(CV.h('div', { class: 'cta-card cv-noprint' }, CV.h('div', null, CV.h('p', { class: 'cv-kicker' }, 'Tool'), CV.h('p', { class: 'cta-title' }, 'Prove your backup works'), CV.h('p', { class: 'cta-sub' }, 'Log each restore test and get a reminder every quarter. Insurers like evidence.')), CV.button('Open the restore log', CV.openRestore, 'primary')));
});

/* --- src/features/168-mfa-tracker.js --- */
// @msg MFA rollout tracker: list your cloud services and mark each one off, from no MFA to passkeys, with email first as the report advises
// @sel #h-what-to-do-3
CV.ready(function () {
  var h = CV.$('#h-what-to-do-3'); if (!h) return;
  var LV = [['none', 'Not on'], ['sms', 'Text message code'], ['app', 'Authenticator app'], ['key', 'Passkey or security key']];
  var s = CV.store.get('mfa', { list: [{ name: 'Email', lv: 'none' }, { name: 'Accounting software', lv: 'none' }, { name: 'Bank', lv: 'none' }] });
  var d = CV.dialog({ id: 'mfa', title: 'MFA rollout tracker', wide: true, note: 'From Theme 3: MFA is the floor for every account. Passkeys or security keys are stronger than codes by text message. Never switch MFA off because it’s inconvenient.' });
  function save() { CV.store.set('mfa', s); render(); }
  function render() {
    var b = d.body; b.innerHTML = '';
    var on = s.list.filter(function (x) { return x.lv !== 'none'; }).length, strong = s.list.filter(function (x) { return x.lv === 'key'; }).length;
    b.appendChild(CV.h('div', { class: 'plan-sum' }, CV.h('div', { class: 'plan-bar', 'aria-hidden': 'true' }, CV.h('span', { style: 'width:' + (s.list.length ? on / s.list.length * 100 : 0) + '%' })),
      CV.h('p', null, CV.h('b', null, on + ' of ' + s.list.length), ' services have MFA on. ' + (strong ? strong + ' use passkeys or security keys.' : ''))));
    var ul = CV.h('ul', { class: 'mfa-list' });
    s.list.forEach(function (x, i) {
      var name = CV.h('input', { type: 'text', class: 'cv-input', value: x.name, 'aria-label': 'Service ' + (i + 1) });
      name.addEventListener('change', function () { x.name = name.value; save(); });
      var sel = CV.h('select', { class: 'cv-input', 'aria-label': 'MFA status for ' + x.name }); LV.forEach(function (l) { var o = CV.h('option', { value: l[0] }, l[1]); if (x.lv === l[0]) o.selected = true; sel.appendChild(o); });
      sel.addEventListener('change', function () { x.lv = sel.value; save(); });
      ul.appendChild(CV.h('li', { class: 'mfa-' + x.lv }, CV.h('span', { class: 'mfa-dot', 'aria-hidden': 'true' }), name, sel, CV.h('button', { type: 'button', class: 'plan-rm', 'aria-label': 'Remove ' + x.name, onclick: function () { s.list.splice(i, 1); save(); } }, '×')));
    });
    b.appendChild(ul);
    b.appendChild(CV.h('div', { class: 'cv-row' }, CV.button('+ Add a service', function () { s.list.push({ name: '', lv: 'none' }); save(); var ins = CV.$$('#mfa .mfa-list input'); ins[ins.length - 1].focus(); }),
      CV.plan ? CV.button('Add "MFA everywhere" to my plan', function () { CV.plan.add('t3-1'); }) : null));
    var email = s.list.filter(function (x) { return /mail|outlook|gmail|365/i.test(x.name); })[0];
    if (email && email.lv === 'none') b.appendChild(CV.h('p', { class: 'ce-fix' }, CV.h('b', null, 'Start with email. '), 'Whoever controls your email can reset almost every other password.'));
  }
  CV.openMfa = function () { render(); d.open(); };
  var tw = h.closest('section').querySelector('.table-wrap');
  var host = h.parentNode.querySelector('p:last-of-type') || h;
  host.after(CV.h('div', { class: 'cta-card cv-noprint' }, CV.h('div', null, CV.h('p', { class: 'cv-kicker' }, 'Tool'), CV.h('p', { class: 'cta-title' }, 'Track your MFA rollout'), CV.h('p', { class: 'cta-sub' }, 'List every cloud service and mark it off, from no MFA to passkeys.')), CV.button('Start tracking', CV.openMfa, 'primary')));
});

/* --- src/features/169-code-word.js --- */
// @msg Payment code-word generator: make a memorable, random three-word code for urgent payment requests and put it straight on your call-back poster
// @sel #poster
CV.ready(function () {
  var d = document.getElementById('poster'); if (!d) return;
  var W = 'amber anchor apple arrow aspen badger banjo basil beacon birch bison bramble bridge brook cabin canal candle canyon cedar chalk cherry cider clover cobalt comet copper coral cotton crane cricket crystal daisy delta denim dingo dolphin drift eagle ember falcon fennel fern ferry fig flint forest fox garnet gecko ginger glacier granite gravel harbour hazel heron hickory hollow honey indigo iris island ivory jasper juniper kayak kestrel kettle kiwi lagoon lantern larch lava lemon lilac linen lotus magpie mango maple marble meadow melon mint mosaic moss nectar nickel nutmeg oak oasis olive onyx orchid otter oyster paddle panda parsley pebble pepper pigeon pine plum polar poppy prism quartz quill rabbit radish raven reef ribbon river robin rocket saffron sage salmon sapphire satin shingle silver slate sparrow spruce stork summit swan teal thistle thunder tiger timber toffee topaz tulip tundra velvet violet walnut wave willow wren yacht zebra zinc'.split(' ');
  function pick() { var a = new Uint32Array(3); (window.crypto || window.msCrypto).getRandomValues(a); return Array.prototype.map.call(a, function (n) { return W[n % W.length]; }).join('-'); }
  var out = CV.h('output', { class: 'cw-out', 'aria-live': 'polite' }, pick());
  var box = CV.h('div', { class: 'cw' },
    CV.h('p', { class: 'cv-kicker' }, 'Code word'),
    CV.h('p', { class: 'cw-s' }, 'Made in your browser and not saved anywhere. Share it in person or by phone, never by email.'),
    out,
    CV.h('div', { class: 'cv-row' }, CV.button('New code word', function () { out.textContent = pick(); }), CV.button('Copy', function () { CV.copy(out.textContent, 'Code word copied. Share it in person'); })));
  var body = d.querySelector('.cv-dialog-body');
  var anchor = body.querySelector('.qz-opt-inline');
  if (anchor) anchor.after(box);
  var cb = document.getElementById('pst-word');
  function sync() { box.hidden = !cb.checked; }
  if (cb) { cb.addEventListener('change', sync); sync(); }
});

/* --- src/features/170-team-pack.js --- */
// @msg Team pack: one button prints the executive summary, the five things, your plan and who to call as a short pack for your team or board
// @sel #summary
CV.ready(function () {
  function print() {
    document.body.classList.add('print-pack');
    CV.$$('dialog[open]').forEach(function (d) { d.close(); });
    setTimeout(function () { window.print(); }, 60);
  }
  window.addEventListener('afterprint', function () { document.body.classList.remove('print-pack'); });
  if (CV.toolsMenu) CV.toolsMenu.add('Print a team pack', print, 'Share and print');
  var cta = CV.$('#summary .cta-card .cv-row'); if (cta) cta.appendChild(CV.button('Print a team pack', print));
  CV.printPack = print;
});

/* --- src/features/171-tool-links.js --- */
// @msg Every tool has its own link: share cyberoutlook.sbcsg.uk/#check, #plan, #poster and more, and the tool opens straight away
// @sel #start
CV.ready(function () {
  var R = {
    check: function () { CV.openCheck && CV.openCheck(); }, plan: function () { CV.plan && CV.plan.open(); }, share: function () { CV.openShare && CV.openShare(); },
    poster: function () { CV.openPoster && CV.openPoster(); }, itmail: function () { CV.openItMail && CV.openItMail(); }, fivefive: function () { CV.openFiveFive && CV.openFiveFive(); },
    aitools: function () { CV.openAiTools && CV.openAiTools(); }, readiness: function () { CV.openCE && CV.openCE(); }, progress: function () { CV.openProgress && CV.openProgress(); },
    forecasts: function () { CV.openForecasts && CV.openForecasts(); }, glossary: function () { CV.openGlossary && CV.openGlossary(); }, notes: function () { CV.openNotes && CV.openNotes(); },
    search: function () { CV.openSearch && CV.openSearch(); }, present: function () { CV.present && CV.present(); }, restore: function () { CV.openRestore && CV.openRestore(); },
    mfa: function () { CV.openMfa && CV.openMfa(); }, incident: function () { CV.openIncident && CV.openIncident(); }, mydata: function () { CV.openMyData && CV.openMyData(); }
  };
  CV.toolRoutes = Object.keys(R);
  function route() {
    var k = location.hash.slice(1); if (!R[k] || k === 'check') return; // #check is handled by the check itself
    history.replaceState(null, '', location.pathname + location.search);
    setTimeout(R[k], 50);
  }
  window.addEventListener('hashchange', route);
  route();
  // Let every tool dialog copy its own link.
  var MAP = { plan: 'plan', share: 'share', poster: 'poster', itmail: 'itmail', fivefive: 'fivefive', aitools: 'aitools', ce: 'readiness', progress: 'progress', forecasts: 'forecasts', glossary: 'glossary', restore: 'restore', mfa: 'mfa', check: 'check' };
  Object.keys(MAP).forEach(function (id) {
    var d = document.getElementById(id); if (!d) return;
    var head = d.querySelector('.cv-dialog-head'); if (!head) return;
    var b = CV.h('button', { type: 'button', class: 'dl-link', 'aria-label': 'Copy a link to this tool' }, 'Copy link');
    b.addEventListener('click', function () { CV.copy(CV.SITE + '#' + MAP[id], 'Link to this tool copied'); });
    head.insertBefore(b, head.querySelector('.cv-x'));
  });
});

/* --- src/features/172-arrival-welcome.js --- */
// @msg Arrival-aware welcome: visitors from LinkedIn, a printed QR code or the podcast get a one-line welcome and the single best next step for them
// @sel #start
CV.ready(function () {
  var q = new URLSearchParams(location.search), src = (q.get('utm_source') || '').toLowerCase(), med = (q.get('utm_medium') || '').toLowerCase();
  var ref = document.referrer || '';
  var kind = med === 'qr' || src === 'print' ? 'print' : /linkedin/.test(src) || /linkedin\.com|lnkd\.in/.test(ref) ? 'linkedin' : /podcast/.test(src) || /thesmallbusinesscybersecurityguy/.test(ref) ? 'podcast' : '';
  if (!kind || CV.store.get('welcomed-' + kind, false)) return;
  var M = {
    linkedin: ['Welcome from LinkedIn.', 'Short on time? The two-minute check shows where you stand.', 'Take the check', function () { CV.openCheck && CV.openCheck(); }],
    print: ['Welcome from the printed copy.', 'Online you can fill in the one-page plan, tick off the five things and add everything to your calendar.', 'Open the one-page plan', function () { location.hash = '#mvc'; }],
    podcast: ['Welcome, podcast listener.', 'Every theme here has a tool to go with the episode. Start with the five things before January.', 'See the five things', function () { location.hash = '#h-if-you-do-five-things-before-january'; }]
  }[kind];
  var bar = CV.h('div', { class: 'aw', role: 'status' },
    CV.h('p', null, CV.h('b', null, M[0] + ' '), M[1]),
    CV.h('div', { class: 'cv-row' }, CV.button(M[2], function () { close(); M[3](); }, 'primary'), CV.h('button', { type: 'button', class: 'wb-x', 'aria-label': 'Dismiss', onclick: close }, '×')));
  function close() { CV.store.set('welcomed-' + kind, true); bar.remove(); }
  var start = CV.$('.start-inner'); if (start) start.insertBefore(bar, start.firstChild);
  CV.store.set('arrival', kind);
});

/* --- src/features/173-listen-next.js --- */
// @msg Listen next: each section recommends the back-catalogue episodes it cites, so curious readers become podcast listeners
// @sel #theme-2 .lnx
CV.ready(function () {
  var MAP = { numbers: ['s26'], 'theme-1': ['s29', 's28'], 'theme-2': ['s33', 's34'], 'theme-3': ['s36'], rules: ['s35'] };
  Object.keys(MAP).forEach(function (id) {
    var sec = document.getElementById(id); if (!sec) return;
    var eps = MAP[id].map(function (sid) {
      var li = document.getElementById(sid); if (!li) return null;
      var a = li.querySelector('a[href*="podcast."]'); if (!a) return null;
      var t = CV.text(li).replace(/^The Small Business Cyber Security Guy podcast\.\s*/, '');
      var m = t.match(/^(.*?)\.\s*(\d{1,2} \w+ \d{4})/); if (!m) return null;
      return { title: m[1], date: m[2], url: a.href };
    }).filter(Boolean);
    if (!eps.length) return;
    var shelf = CV.h('aside', { class: 'lnx cv-noprint', 'aria-label': 'Listen next' },
      CV.h('p', { class: 'cv-kicker' }, 'From the back catalogue'),
      CV.h('ul', null, eps.map(function (e) { return CV.h('li', null, CV.h('a', { href: e.url, rel: 'noopener', target: '_blank' }, CV.h('span', { class: 'lnx-play', 'aria-hidden': 'true' }, '▶'), CV.h('span', { class: 'lnx-t' }, CV.h('b', null, e.title), CV.h('span', null, e.date + ' · cited in this section')))); })));
    var nav = sec.querySelector('.next-sec'); if (nav) sec.insertBefore(shelf, nav); else sec.appendChild(shelf);
  });
});

/* --- src/features/174-plan-answers.js --- */
// @msg The one-page plan comes alive: answer its five questions right on the page, fill in the business name and review date, and print it complete
// @sel #mvc .a4
CV.ready(function () {
  var a4 = CV.$('.a4'); if (!a4) return;
  var s = CV.store.get('a4', { q: {} });
  CV.$$('ol.q li', a4).forEach(function (li, i) {
    var ta = CV.h('textarea', { class: 'a4-ans', rows: '2', placeholder: 'Your answer', 'aria-label': 'Answer to: ' + CV.text(li) }); ta.value = s.q[i] || '';
    function grow() { ta.style.height = 'auto'; ta.style.height = Math.max(44, ta.scrollHeight) + 'px'; }
    ta.addEventListener('input', function () { s.q[i] = ta.value; CV.store.set('a4', s); grow(); CV.emit('a4', s); });
    li.appendChild(ta); setTimeout(grow, 0);
  });
  var head = a4.querySelector('.a4-head p');
  if (head) {
    var biz = CV.h('input', { type: 'text', class: 'a4-in', placeholder: 'Business', 'aria-label': 'Business name', autocomplete: 'organization' }); biz.value = s.biz || '';
    var rev = CV.h('input', { type: 'date', class: 'a4-in', 'aria-label': 'Reviewed on' }); rev.value = s.rev || '';
    biz.addEventListener('input', function () { s.biz = biz.value; CV.store.set('a4', s); });
    rev.addEventListener('change', function () { s.rev = rev.value; CV.store.set('a4', s); });
    var line = CV.h('p', { class: 'a4-line cv-noprint' }, 'Business: ', biz, ' Reviewed: ', rev);
    head.classList.add('a4-printonly'); head.after(line);
    // Mirror typed values into the printed line.
    function mirror() { head.textContent = 'Business: ' + (s.biz || '____________________') + '    Reviewed: ' + (s.rev ? CV.fmtDate(CV.parseDate(s.rev)) : '___ / ___ / 20___'); }
    biz.addEventListener('input', mirror); rev.addEventListener('change', mirror); if (s.biz || s.rev) mirror();
  }
});

/* --- src/features/175-supplier-email.js --- */
// @msg Ask your suppliers: turn your five-and-five map into a short email asking each key supplier how and how fast they'd tell you about a breach
// @sel #fivefive
CV.ready(function () {
  var d = document.getElementById('fivefive'); if (!d) return;
  function names() { var ff = CV.store.get('fivefive', { s: [] }); return (ff.s || []).map(function (r) { return (r.name || '').trim(); }).filter(Boolean); }
  var who = CV.h('input', { type: 'text', placeholder: 'Your name and business', autocomplete: 'organization' }); who.value = CV.store.get('supmail-who', '');
  who.addEventListener('input', function () { CV.store.set('supmail-who', who.value); });
  function body(name) {
    return 'Hi' + (name ? ' ' + name + ' team' : '') + ',\n\nYou’re one of our most important suppliers, so we’re checking how we’d work together if either of us had a cyber incident.\n\n' +
      '1. If you were breached, or one of your own suppliers was, how and how quickly would you tell us?\n2. Who should we contact at your end, and on what number?\n3. If your service stopped for two weeks, what would you be able to keep running for us?\n\nA short reply is fine. We’ll keep it with our incident plan.\n\nThanks,\n' + (who.value.trim() || '[Your name]');
  }
  var box = CV.h('div', { class: 'se' },
    CV.h('h3', { class: 'qz-h' }, 'Ask your suppliers'),
    CV.h('p', { class: 'cta-sub' }, 'One short email per supplier: how they’d tell you about a breach, who to call, and what keeps running.'),
    CV.field('Sign it from', who),
    CV.h('div', { class: 'se-list' }));
  function render() {
    var list = box.querySelector('.se-list'); list.innerHTML = '';
    var n = names();
    if (!n.length) { list.appendChild(CV.h('p', { class: 'ff-empty' }, 'Add supplier names above and an email appears for each.')); return; }
    n.forEach(function (name) {
      var mail = CV.h('a', { class: 'tool', href: '#' }, 'Email ' + name);
      mail.addEventListener('click', function () { mail.href = 'mailto:?subject=' + encodeURIComponent('Quick question: if either of us had a cyber incident') + '&body=' + encodeURIComponent(body(name)); });
      list.appendChild(CV.h('div', { class: 'cv-row' }, mail, CV.button('Copy', function () { CV.copy(body(name), 'Email to ' + name + ' copied'); })));
    });
  }
  d.querySelector('.cv-dialog-body').appendChild(box);
  d.addEventListener('input', function (e) { if (e.target.closest('.ff-set')) render(); });
  render();
});

/* --- src/features/176-briefing.js --- */
// @msg Five-minute team briefing: a printable script on fake quote requests, payment changes and urgent "director" calls, built from Theme 3's actions
// @sel #theme-3
CV.ready(function () {
  var sec = CV.$('#theme-3'); if (!sec) return;
  var POINTS = [
    ['Quote requests', 'Treat quote requests with links or attachments from unknown senders with care. Never log in from a link in one. If it asks you to sign in to see the details, close it and ask.'],
    ['Bank detail changes', 'No change to supplier bank details goes through without a phone call to a number we already hold. Not the number in the email.'],
    ['Urgent payments', 'An urgent payment request from a director, by email, message, phone or video, gets the call-back or the code word first. Urgency is the warning sign.'],
    ['Logins', 'Approve MFA prompts only when you’ve just tried to log in yourself. An unexpected prompt means someone else has your password: tell us.'],
    ['Saying something', 'If you’ve clicked, paid or typed a password somewhere odd, tell us straight away. The sooner we know, the less it costs.']
  ];
  function sheet() {
    return CV.h('div', { class: 'br-sheet' },
      CV.h('div', { class: 'pp-head' }, CV.h('h2', null, 'Five-minute briefing'), CV.h('p', null, 'Fake requests and payments · from the UK Small Business Cyber Outlook 2027 · cyberoutlook.sbcsg.uk')),
      CV.h('ol', null, POINTS.map(function (p) { return CV.h('li', null, CV.h('b', null, p[0] + '. '), p[1]); })),
      CV.h('p', { class: 'br-sign' }, 'Briefed by ________________   Date ___________   Attended ______________________________'));
  }
  var d = CV.dialog({ id: 'briefing', title: 'Five-minute team briefing', wide: true, note: 'Read it out at your next team meeting, then ask everyone to sign the sheet.' });
  d.body.appendChild(CV.h('ol', { class: 'br-list' }, POINTS.map(function (p) { return CV.h('li', null, CV.h('b', null, p[0]), CV.h('span', null, p[1])); })));
  d.body.appendChild(CV.h('div', { class: 'cv-row' }, CV.button('Print the briefing', function () { CV.printSheet(sheet()); }, 'primary'), CV.button('Copy as text', function () { CV.copy('FIVE-MINUTE BRIEFING\n\n' + POINTS.map(function (p, i) { return (i + 1) + '. ' + p[0] + ': ' + p[1]; }).join('\n\n'), 'Briefing copied'); }), CV.plan ? CV.button('Add the briefing to my plan', function () { CV.plan.add('t3-4'); }) : null));
  CV.openBriefing = function () { d.open(); };
  var host = CV.$$('#theme-3 .cta-card').pop() || CV.$('#theme-3 .table-wrap');
  if (host) host.after(CV.h('div', { class: 'cta-card cv-noprint' }, CV.h('div', null, CV.h('p', { class: 'cv-kicker' }, 'Tool'), CV.h('p', { class: 'cta-title' }, 'Brief your team in five minutes'), CV.h('p', { class: 'cta-sub' }, 'A printable script on fake quote requests, bank detail changes and urgent payments.')), CV.button('Open the briefing', CV.openBriefing, 'primary')));
});

/* --- src/features/177-reminders-hub.js --- */
// @msg Reminders hub: every calendar reminder the report offers in one place, plus monthly AI-memory checks and a six-month plan review
// @sel #start
CV.ready(function () {
  function addMonths(d, n) { var x = new Date(d.getTime()); x.setMonth(x.getMonth() + n); return x; }
  var start = CV.today();
  var SETS = [
    ['The 90-day plan', '13 weekly tasks from 4 January 2027', function () { var b = CV.$$('.nd-tools button')[0]; if (b) b.click(); }],
    ['Podcast episodes', 'The rest of the nine-part series', function () { var b = CV.$$('#ep-guide button').filter(function (x) { return /Remind/.test(x.textContent); })[0]; if (b) b.click(); else CV.toast('All episodes are already out'); }],
    ['My plan due dates', 'One reminder per dated action', function () { if (CV.plan && CV.plan.list().some(function (x) { return x.meta.due; })) { CV.plan.open(); setTimeout(function () { var b = CV.$$('#plan button').filter(function (x) { return /calendar/.test(x.textContent); })[0]; if (b) b.click(); }, 50); } else CV.toast('Add due dates in My plan first'); }],
    ['AI memory check', 'Monthly for a year (Theme 2)', function () { var ev = []; for (var i = 1; i <= 12; i++) ev.push({ title: 'Cyber: check AI memory features', date: addMonths(start, i), description: 'Check what your AI tools have remembered, or turn memory off. From Theme 2 of the ' + CV.TITLE + '.', url: CV.SITE + '#theme-2' }); CV.ics(ev, 'ai-memory-checks.ics'); }],
    ['Restore tests', 'Every quarter (Theme 3)', function () { if (CV.openRestore) { CV.openRestore(); } }],
    ['Review the one-page plan', 'In six months', function () { CV.ics([{ title: 'Cyber: review and reprint the one-page plan', date: addMonths(start, 6), description: 'Check names and numbers, update what changed, reprint two copies.', url: CV.SITE + '#mvc' }], 'plan-review.ics'); }]
  ];
  var d = CV.dialog({ id: 'reminders', title: 'Reminders', wide: true, note: 'Each button downloads a calendar file (.ics). Open it to add the reminders to Outlook, Google or Apple Calendar.' });
  d.body.appendChild(CV.h('ul', { class: 'rh-list' }, SETS.map(function (x) { return CV.h('li', null, CV.h('div', null, CV.h('b', null, x[0]), CV.h('span', null, x[1])), CV.button('Add to calendar', x[2])); })));
  CV.openReminders = function () { d.open(); };
  if (CV.toolsMenu) CV.toolsMenu.add('Calendar reminders', CV.openReminders, 'Your work');
  if (CV.toolRoutes) CV.toolRoutes.push('reminders');
  window.addEventListener('hashchange', function () { if (location.hash === '#reminders') { history.replaceState(null, '', location.pathname); d.open(); } });
  if (location.hash === '#reminders') setTimeout(function () { history.replaceState(null, '', location.pathname); d.open(); }, 60);
});

/* --- src/features/178-phone-section-chip.js --- */
// @msg Phones always know where they are: a slim chip above the bottom dock names the current section and opens the contents in one tap
// @sel #theme-1
CV.ready(function () {
  var ab = CV.$('.ab'); if (!ab) return;
  var chip = CV.h('button', { type: 'button', class: 'ab-chip', 'aria-label': 'Current section. Open contents' });
  ab.insertBefore(chip, ab.firstChild);
  var secs = CV.$$('main section.section[id]');
  function sync() {
    var y = window.innerHeight * 0.3, cur = null; secs.forEach(function (s) { if (s.getBoundingClientRect().top <= y) cur = s; });
    if (!cur) { chip.hidden = true; return; }
    var num = CV.text(cur.querySelector('.sec-num')).match(/\d+/), t = CV.text(cur.querySelector('h2')).replace(/#$/, '').trim();
    chip.hidden = false; chip.textContent = ''; chip.appendChild(CV.h('span', { class: 'ab-chip-n' }, num ? num[0] : '')); chip.appendChild(document.createTextNode(t)); chip.appendChild(CV.h('span', { class: 'ab-chip-c', 'aria-hidden': 'true' }, '▴'));
  }
  chip.addEventListener('click', function () { var tg = CV.$('.toc-toggle'); if (tg && tg.getAttribute('aria-expanded') === 'false') tg.click(); var h = CV.$('#toc-h'); h.scrollIntoView({ behavior: CV.reduced() ? 'auto' : 'smooth' }); h.focus({ preventScroll: true }); });
  var tk = false; window.addEventListener('scroll', function () { if (!tk) { tk = true; requestAnimationFrame(function () { tk = false; sync(); }); } }, { passive: true });
  sync();
});

/* --- src/features/179-cover-strip.js --- */
// @msg Cover numbers strip: the three figures that frame the whole report sit right under the title, each linking to where it's explained
// @sel .cover
CV.ready(function () {
  var dek = CV.$('.cover .dek'); if (!dek) return;
  var F = [
    ['1 in 5', 'UK businesses were victims of a cyber crime', '#h-43'],
    ['1 in 33', 'once you take phishing out', '#h-43'],
    ['21%', 'of micro firms have a formal incident plan', '#h-how-firms-are-preparing']
  ].filter(function (f) { return document.getElementById(f[2].slice(1)); });
  var strip = CV.h('ul', { class: 'cs', 'aria-label': 'Key figures' }, F.map(function (f) { return CV.h('li', null, CV.h('a', { href: f[2] }, CV.h('b', null, f[0]), CV.h('span', null, f[1]))); }));
  dek.after(strip);
  dek.after(CV.h('p', { class: 'cs-src' }, 'Cyber Security Breaches Survey 2025/26'));
  strip.after(CV.$('.cs-src'));
});

/* --- src/features/180-pull-quote.js --- */
// @msg The line people remember: Noel's sign-off becomes a full-width pull quote you can share as an image or a post
// @sel .pq
CV.ready(function () {
  var p = CV.$$('#foreword .prose p').filter(function (x) { return /stupidity always is/.test(x.textContent); })[0]; if (!p) return;
  var q = CV.text(p);
  var share = CV.button('Share this line', function () {
    var c = document.createElement('canvas'); c.width = 1200; c.height = 1200; var x = c.getContext('2d');
    x.fillStyle = '#0e161b'; x.fillRect(0, 0, 1200, 1200);
    x.fillStyle = '#e6b043'; x.font = '700 260px "Barlow Condensed", sans-serif'; x.fillText('“', 90, 330);
    x.fillStyle = '#e2e9e9'; x.font = '700 96px "Barlow Condensed", "Arial Narrow", sans-serif';
    var words = q.toUpperCase().split(' '), line = '', y = 470, lines = [];
    words.forEach(function (w) { var t = line ? line + ' ' + w : w; if (x.measureText(t).width > 1000 && line) { lines.push(line); line = w; } else line = t; }); lines.push(line);
    lines.forEach(function (l, i) { x.fillText(l, 100, y + i * 104); });
    x.fillStyle = '#62b8b5'; x.font = '600 36px "IBM Plex Sans", sans-serif'; x.fillText('Noel Bradford · UK Small Business Cyber Outlook 2027', 100, 1060);
    x.fillStyle = '#9aa9ae'; x.font = '500 30px "IBM Plex Sans", sans-serif'; x.fillText('cyberoutlook.sbcsg.uk', 100, 1110);
    document.fonts.ready.then(function () { c.toBlob(function (b) { CV.download('good-security-quote.png', 'image/png', b); }); });
    CV.copy('“' + q + '” — Noel Bradford, ' + CV.TITLE + '\n' + CV.SITE, 'Image saved and quote copied');
  }, 'primary');
  var fig = CV.h('figure', { class: 'pq' }, CV.h('blockquote', null, CV.h('p', null, q)), CV.h('figcaption', null, 'Noel Bradford'), CV.h('div', { class: 'cv-row cv-noprint' }, share));
  p.classList.add('pq-src'); p.setAttribute('aria-hidden', 'true');
  p.after(fig);
});

/* --- src/features/183-slim-start.js --- */
// @msg Returning readers skip the intro: once you've started, "Start here" shrinks to a one-line progress bar with your next step, expandable any time
// @sel #start
CV.ready(function () {
  var start = CV.$('#start'); if (!start || !CV.progressState) return;
  var s = CV.progressState();
  var started = s.score != null || s.five > 0 || s.planTotal > 0;
  if (!started) return;
  var bits = []; if (s.score != null) bits.push('Check ' + s.score + '/10'); bits.push(s.five + '/5 things'); if (s.planTotal) bits.push(s.planDone + '/' + s.planTotal + ' plan actions');
  var slim = CV.h('div', { class: 'ss' },
    CV.h('p', null, CV.h('b', null, 'Your progress: '), bits.join(' · ')),
    CV.h('div', { class: 'cv-row' }, CV.button('Next step', function () { CV.openProgress(); }, 'primary'), CV.h('button', { type: 'button', class: 'tool ss-more', 'aria-expanded': 'false', 'aria-controls': 'start' }, 'Show start options')));
  start.classList.add('slim');
  start.querySelector('.start-inner').insertBefore(slim, start.querySelector('.start-inner').firstChild);
  var more = slim.querySelector('.ss-more');
  more.addEventListener('click', function () { var open = start.classList.toggle('slim'); more.setAttribute('aria-expanded', open ? 'false' : 'true'); more.textContent = open ? 'Show start options' : 'Hide start options'; });
});

/* --- src/features/184-author-card.js --- */
// @msg Meet the author: the colophon bio becomes a proper author card with the podcast, the blog and the companion series one tap away
// @sel .colophon
CV.ready(function () {
  var bio = CV.$('.colophon .bio'); if (!bio) return;
  var img = bio.querySelector('img');
  var next = CV.EPISODES.filter(function (e) { return CV.parseDate(e.date) >= CV.today(); })[0];
  var card = CV.h('section', { class: 'auth cv-noprint', 'aria-labelledby': 'auth-h' },
    img ? CV.h('img', { src: img.src, alt: '', width: '160', height: '160', loading: 'lazy', decoding: 'async' }) : null,
    CV.h('div', { class: 'auth-main' },
      CV.h('p', { class: 'cv-kicker' }, 'About the author'),
      CV.h('h2', { id: 'auth-h' }, 'Noel Bradford'),
      CV.h('p', { class: 'auth-role' }, 'The Small Business Cyber Security Guy'),
      CV.h('p', null, '45 years in IT leadership, from Intel to Disney to the BBC. Runs security for a security-first managed service provider, and hosts the podcast and blog for UK small businesses.'),
      next ? CV.h('p', { class: 'auth-next' }, CV.h('b', null, 'Next episode: '), 'Ep ' + next.n + ', “' + next.title + '”, ' + CV.parseDate(next.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) + '.') : null,
      CV.h('div', { class: 'cv-row' },
        CV.h('a', { class: 'tool primary', href: CV.PODCAST, rel: 'noopener', target: '_blank' }, 'Listen to the podcast'),
        CV.h('a', { class: 'tool', href: CV.AUTHOR_SITE, rel: 'noopener', target: '_blank' }, 'Read the blog'),
        CV.openShare ? CV.button('Share this report', CV.openShare) : null)));
  bio.parentNode.insertBefore(card, bio);
  bio.classList.add('auth-orig');
});

/* --- src/features/185-episode-chip.js --- */
// @msg Next episode, always visible: the app bar counts down to the next weekly podcast episode, and it's one tap to the guide
// @sel #theme-1
CV.ready(function () {
  var ab = CV.$('.ab .ab-tools'); if (!ab) return;
  var now = CV.today(), next = CV.EPISODES.filter(function (e) { return CV.parseDate(e.date) >= now; })[0];
  var latest = CV.EPISODES.filter(function (e) { return CV.parseDate(e.date) <= now; }).pop();
  var e = next || latest; if (!e) return;
  var days = Math.round((CV.parseDate(e.date) - now) / 86400000);
  var when = next ? (days === 0 ? 'out today' : days === 1 ? 'tomorrow' : 'in ' + days + ' days') : 'latest';
  var chip = CV.h('a', { class: 'ep-chip', href: '#ep-guide', title: 'Episode ' + e.n + ': ' + e.title }, CV.h('span', { class: 'ep-chip-k' }, 'Ep ' + e.n), CV.h('span', null, when));
  chip.setAttribute('aria-label', 'Podcast episode ' + e.n + ', ' + e.title + ', ' + when + '. Open the episode guide.');
  ab.parentNode.insertBefore(chip, ab);
});

/* --- src/features/186-paragraph-links.js --- */
// @msg Link to any paragraph: hover a paragraph and copy a link that opens the report with that exact passage highlighted
// @sel #theme-1
CV.ready(function () {
  // Margin items (paragraph links, sidenotes) sit beside a paragraph, not inside it, so search and read-aloud never pick them up.
  CV.margin = CV.margin || (function () {
    var items = [];
    function place() { items.forEach(function (it) { it.el.style.top = it.p.offsetTop + 'px'; }); }
    var t; function soon() { clearTimeout(t); t = setTimeout(place, 80); }
    window.addEventListener('resize', soon);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
    if ('ResizeObserver' in window) { var ro = new ResizeObserver(soon); CV.$$('main').forEach(function (m) { ro.observe(m); }); }
    return { add: function (p, el) { p.parentNode.classList.add('mg-host'); p.parentNode.insertBefore(el, p); items.push({ p: p, el: el }); soon(); }, place: place };
  })();
  var paras = CV.$$('main section .prose > p').filter(function (p) { return !p.classList.contains('listen-src') && !p.classList.contains('pq-src') && !p.closest('.cv-noprint') && CV.text(p).length > 80; });
  paras.forEach(function (p) {
    var b = CV.h('button', { type: 'button', class: 'pl-btn', 'aria-label': 'Copy a link to the paragraph that starts: ' + CV.text(p).split(' ').slice(0, 6).join(' ') }, '¶');
    b.addEventListener('click', function () {
      var c = p.cloneNode(true); CV.$$('sup, button', c).forEach(function (n) { if (n.matches('.gl-term')) n.replaceWith(document.createTextNode(n.textContent)); else n.parentNode.removeChild(n); });
      var words = CV.text(c).split(' ').filter(Boolean);
      var enc = function (s) { return encodeURIComponent(s).replace(/-/g, '%2D').replace(/,/g, '%2C'); };
      var sec = p.closest('section[id]');
      CV.copy(CV.SITE + '#' + (sec ? sec.id : '') + ':~:text=' + enc(words.slice(0, 5).join(' ')) + ',' + enc(words.slice(-4).join(' ')), 'Link to this paragraph copied');
    });
    p.classList.add('pl-p');
    CV.margin.add(p, b);
  });
});

/* --- src/features/187-sidenotes.js --- */
// @msg Sidenotes on big screens: on wide displays, each citation's source appears in the margin beside the sentence, like a well-made book
// @sel #theme-1
CV.ready(function () {
  if (!CV.margin) return;
  var mq = window.matchMedia('(min-width: 1500px)');
  var built = false;
  function build() {
    if (built) return; built = true;
    CV.$$('main .prose > p').forEach(function (p) {
      var cites = CV.$$('sup.cite a[href^="#s"]', p); if (!cites.length || p.closest('.cv-noprint') || p.classList.contains('listen-src')) return;
      var seen = {}, items = [];
      cites.forEach(function (a) { var id = a.getAttribute('href').slice(1); if (seen[id]) return; seen[id] = 1; var li = document.getElementById(id); if (!li) return; var c = li.cloneNode(true); CV.$$('a,.backrefs,.src-meta,.flag', c).forEach(function (n) { n.parentNode.removeChild(n); }); items.push(CV.h('li', null, CV.h('a', { href: '#' + id, tabindex: '-1' }, id.slice(1)), ' ', CV.text(c).replace(/\s*\.?\s*$/, '').slice(0, 140))); });
      if (items.length) CV.margin.add(p, CV.h('aside', { class: 'sn', 'aria-hidden': 'true' }, CV.h('ol', null, items)));
    });
  }
  function apply() { if (mq.matches) build(); document.body.classList.toggle('sn-on', mq.matches); CV.margin.place(); }
  if (mq.addEventListener) mq.addEventListener('change', apply);
  apply();
});

/* --- src/features/188-forecast-cards.js --- */
// @msg Share a forecast: every "Our call" can be posted as a branded image card, with your own agree or disagree added to the post text
// @sel #theme-1 .call
CV.ready(function () {
  var calls = CV.$$('main aside.call').filter(function (a) { return !/Example/i.test(a.getAttribute('aria-label') || ''); });
  function card(title, body, theme) {
    var c = document.createElement('canvas'); c.width = 1200; c.height = 1200; var x = c.getContext('2d');
    x.fillStyle = '#0e161b'; x.fillRect(0, 0, 1200, 1200); x.fillStyle = '#e6b043'; x.fillRect(0, 0, 16, 1200);
    x.font = '600 30px "IBM Plex Sans", sans-serif'; x.fillText('OUR CALL FOR 2027 · ' + theme.toUpperCase(), 90, 140);
    function wrap(t, font, color, y, lh, maxLines) { x.font = font; x.fillStyle = color; var w = t.split(' '), line = '', n = 0; for (var i = 0; i < w.length; i++) { var test = line ? line + ' ' + w[i] : w[i]; if (x.measureText(test).width > 1020 && line) { if (n === maxLines - 1) { x.fillText(line + '…', 90, y); return y + lh; } x.fillText(line, 90, y); y += lh; n++; line = w[i]; } else line = test; } x.fillText(line, 90, y); return y + lh; }
    var y = wrap(title.toUpperCase(), '700 88px "Barlow Condensed", "Arial Narrow", sans-serif', '#e2e9e9', 270, 92, 4);
    wrap(body, '400 40px "Source Serif 4", Georgia, serif', '#c9d4d4', y + 40, 56, 7);
    x.fillStyle = '#62b8b5'; x.font = '600 32px "IBM Plex Sans", sans-serif'; x.fillText('Noel Bradford · cyberoutlook.sbcsg.uk', 90, 1120);
    return c;
  }
  calls.forEach(function (a) {
    var row = a.querySelector('.fc-vote');
    var b = CV.h('button', { type: 'button', class: 'fc-b fc-share' }, 'Share');
    b.addEventListener('click', function () {
      var title = CV.text(a.querySelector('h4')), body = CV.text(a.querySelector('p:not(.call-label)')), theme = CV.text(a.querySelector('.call-label span')) || 'Outlook';
      document.fonts.ready.then(function () {
        card(title, body, theme).toBlob(function (bl) { CV.download('our-call-' + CV.slug(title) + '.png', 'image/png', bl); });
        var votes = CV.store.get('votes', {}), v = votes[a.id];
        var mine = v === 'agree' ? 'I agree with this one.' : v === 'disagree' ? 'I’m not convinced by this one.' : v === 'unsure' ? 'Not sure about this one yet.' : '';
        CV.copy('“' + title + '”\n\nOne of Noel Bradford’s calls for 2027 in the UK Small Business Cyber Outlook. ' + mine + '\n\n' + CV.SITE + '#' + a.id, 'Image saved and post text copied');
      });
    });
    (row || a).appendChild(b);
  });
});

/* --- src/features/189-hire-check.js --- */
// @msg Remote hire check: a quick checklist and record for each freelancer you take on, built from Theme 1's "freelancer who isn't" advice
// @sel #theme-1 .table-wrap
CV.ready(function () {
  var tw = CV.$$('#theme-1 .cta-card').pop() || CV.$('#theme-1 .table-wrap'); if (!tw) return;
  var STEPS = ['Video call with camera on', 'Photo ID checked on the call, and it matches', 'Bank account is in their own name', 'You’ve written down what you checked and when'];
  var recs = CV.store.get('hires', []);
  var d = CV.dialog({ id: 'hires', title: 'Remote hire check', wide: true, note: 'From Theme 1: verify remote freelance hires on a video call with photo ID, and pay only into accounts in their own name.' });
  function render() {
    var b = d.body; b.innerHTML = '';
    var name = CV.h('input', { type: 'text', id: 'hr-name', placeholder: 'Name and role, e.g. "A. Patel, web developer"' });
    var boxes = STEPS.map(function (s, i) { var cb = CV.h('input', { type: 'checkbox', id: 'hr-' + i }); return [cb, CV.h('div', { class: 'qz-opt-inline' }, cb, CV.h('label', { for: 'hr-' + i }, s))]; });
    b.appendChild(CV.field('Who are you hiring?', name));
    b.appendChild(CV.h('div', { class: 'hr-steps' }, boxes.map(function (x) { return x[1]; })));
    b.appendChild(CV.h('div', { class: 'cv-row' }, CV.button('Save this check', function () {
      if (!name.value.trim()) { name.focus(); CV.toast('Add a name first'); return; }
      var ok = boxes.map(function (x) { return x[0].checked; });
      recs.push({ who: name.value.trim(), ok: ok, at: new Date().toISOString().slice(0, 10) }); CV.store.set('hires', recs);
      CV.toast(ok.every(Boolean) ? 'Saved. All checks done' : 'Saved. Some checks still open'); render();
    }, 'primary'), CV.plan ? CV.button('Add this action to my plan', function () { CV.plan.add('t1-4'); }) : null));
    if (recs.length) {
      b.appendChild(CV.h('h3', { class: 'qz-h' }, 'Your records'));
      b.appendChild(CV.h('ul', { class: 'hr-recs' }, recs.slice().reverse().map(function (r) { var n = r.ok.filter(Boolean).length; return CV.h('li', { class: n === STEPS.length ? 'ok' : 'open' }, CV.h('b', null, r.who), CV.h('span', null, CV.fmtDate(CV.parseDate(r.at)) + ' · ' + n + ' of ' + STEPS.length + ' checks')); })));
      b.appendChild(CV.h('div', { class: 'cv-row' }, CV.button('Copy records', function () { CV.copy('REMOTE HIRE CHECKS\n' + recs.map(function (r) { return r.at + ' | ' + r.who + ' | ' + STEPS.map(function (s, i) { return (r.ok[i] ? '[x] ' : '[ ] ') + s; }).join('; '); }).join('\n'), 'Records copied'); })));
    }
  }
  CV.openHires = function () { render(); d.open(); };
  tw.after(CV.h('div', { class: 'cta-card cv-noprint' }, CV.h('div', null, CV.h('p', { class: 'cv-kicker' }, 'Tool'), CV.h('p', { class: 'cta-title' }, 'Check remote hires properly'), CV.h('p', { class: 'cta-sub' }, 'Four checks before a freelancer gets access, and a record that you did them.')), CV.button('Start a hire check', CV.openHires, 'primary')));
});

/* --- src/features/190-renewal-pack.js --- */
// @msg Renewal evidence pack: pulls together everything you've recorded with these tools into one summary for your insurer, customers or auditor
// @sel #rules .example
CV.ready(function () {
  function lines() {
    var sq = CV.store.get('sq', {}), mfa = CV.store.get('mfa', { list: [] }), rs = CV.store.get('restores', []), a4 = CV.store.get('a4', { q: {} });
    var contacts = 0; try { var c = JSON.parse(localStorage.getItem('cv-plan-contacts') || '{}'); contacts = Object.keys(c).filter(function (k) { return c[k]; }).length; } catch (e) {}
    var five = 0; try { var f = JSON.parse(localStorage.getItem('cv-five-things') || '{}'); five = Object.keys(f).filter(function (k) { return f[k]; }).length; } catch (e) {}
    var on = mfa.list.filter(function (x) { return x.lv !== 'none'; }).length, keys = mfa.list.filter(function (x) { return x.lv === 'key'; }).length;
    var last = rs.length ? rs[rs.length - 1] : null;
    var plan = CV.plan ? CV.plan.list() : [];
    return [
      ['Cyber Essentials', { plus: 'Certified, Cyber Essentials Plus', yes: 'Certified', booked: 'Assessment booked', no: 'Not certified yet' }[sq.ce] || 'Not recorded', sq.cert || ''],
      ['Multi-factor authentication', mfa.list.length ? on + ' of ' + mfa.list.length + ' cloud services' + (keys ? ', ' + keys + ' with passkeys or security keys' : '') : 'Not recorded', ''],
      ['Incident plan', Object.keys(a4.q || {}).filter(function (k) { return a4.q[k]; }).length + ' of 5 questions answered, ' + contacts + ' of 7 contacts filled in', a4.rev ? 'Reviewed ' + CV.fmtDate(CV.parseDate(a4.rev)) : ''],
      ['Backup restore test', last ? 'Last tested ' + CV.fmtDate(CV.parseDate(last.date)) + ({ yes: ', worked', part: ', partly worked', no: ', failed' }[last.ok] || '') : 'Not recorded', last && last.mins ? last.mins + ' minutes' : ''],
      ['Named contact for incidents', sq.who || 'Not recorded', sq.tel || ''],
      ['Five things before January', five + ' of 5 done', ''],
      ['Action plan', plan.length ? plan.filter(function (x) { return x.meta.done; }).length + ' of ' + plan.length + ' actions done' : 'Not started', '']
    ];
  }
  var d = CV.dialog({ id: 'renewal', title: 'Renewal evidence pack', wide: true, note: 'Built only from what you’ve recorded in this browser. Check every line is still true before you send it.' });
  function render() {
    var b = d.body; b.innerHTML = '';
    var L = lines();
    b.appendChild(CV.h('div', { class: 'table-wrap' }, CV.h('table', { class: 'md-t rn-t' }, CV.h('tbody', null, L.map(function (l) { return CV.h('tr', { class: /Not recorded|Not started|Not certified/.test(l[1]) ? 'gap' : '' }, CV.h('th', { scope: 'row' }, l[0]), CV.h('td', null, l[1], l[2] ? CV.h('span', null, ' · ' + l[2]) : null)); })))));
    var gaps = L.filter(function (l) { return /Not recorded|Not started|Not certified/.test(l[1]); }).length;
    if (gaps) b.appendChild(CV.h('p', { class: 'ce-fix' }, gaps + ' line' + (gaps === 1 ? '' : 's') + ' not recorded yet. Use the tools in each section to fill them in.'));
    b.appendChild(CV.h('div', { class: 'cv-row' }, CV.button('Copy the summary', function () { CV.copy('CYBER SECURITY SUMMARY\nPrepared ' + CV.fmtDate(CV.today()) + '\n\n' + L.map(function (l) { return l[0] + ': ' + l[1] + (l[2] ? ' (' + l[2] + ')' : ''); }).join('\n'), 'Summary copied'); }, 'primary'),
      CV.button('Print it', function () { CV.printSheet(CV.h('div', { class: 'rn-sheet' }, CV.h('div', { class: 'pp-head' }, CV.h('h2', null, 'Cyber security summary'), CV.h('p', null, 'Prepared ' + CV.fmtDate(CV.today()))), b.querySelector('table').cloneNode(true))); })));
  }
  CV.openRenewal = function () { render(); d.open(); };
  if (CV.toolsMenu) CV.toolsMenu.add('Renewal evidence pack', CV.openRenewal, 'Your work');
  var host = CV.$$('#rules .cta-card').pop();
  if (host) host.after(CV.h('div', { class: 'cta-card cv-noprint' }, CV.h('div', null, CV.h('p', { class: 'cv-kicker' }, 'Tool'), CV.h('p', { class: 'cta-title' }, 'Your renewal evidence, in one page'), CV.h('p', { class: 'cta-sub' }, 'Everything you’ve recorded here, summarised for your insurer, customers or auditor.')), CV.button('Build my evidence pack', CV.openRenewal, 'primary')));
});

/* --- src/features/191-toolkit-print.js --- */
// @msg Print my toolkit: one print run gives you every sheet you've made, from the poster and wallet cards to the briefing and evidence summary
// @sel #start
CV.ready(function () {
  if (!CV.printSheet || !CV.toolsMenu) return;
  var d = CV.dialog({ id: 'toolkit', title: 'Print my toolkit', note: 'Each sheet prints on its own page.', onopen: function () { OPTS.forEach(function (o) { if (boxes[o[0]]) boxes[o[0]].checked = !!o[2](); }); } });
  var OPTS = [
    ['plan', 'My plan (actions, owners, dates)', function () { return CV.plan && CV.plan.count(); }, function () { return CV.$('#plan-print') || null; }],
    ['poster', 'Call-back rule poster', function () { return true; }, function () { var p = CV.$('#poster .poster'); return p && p.cloneNode(true); }],
    ['wallet', 'Wallet cards', function () { return true; }, null],
    ['briefing', 'Five-minute team briefing', function () { return !!CV.openBriefing; }, null],
    ['evidence', 'Renewal evidence summary', function () { return !!CV.openRenewal; }, null]
  ];
  var boxes = {};
  d.body.appendChild(CV.h('div', { class: 'hr-steps' }, OPTS.map(function (o) { var cb = CV.h('input', { type: 'checkbox', id: 'tk-' + o[0] }); cb.checked = !!o[2](); boxes[o[0]] = cb; return CV.h('div', { class: 'qz-opt-inline' }, cb, CV.h('label', { for: 'tk-' + o[0] }, o[1])); })));
  d.body.appendChild(CV.h('div', { class: 'cv-row' }, CV.button('Print selected', function () {
    var sheets = [];
    // Generate each sheet by asking its tool to build it, capturing what it hands to printSheet.
    var orig = CV.printSheet, captured = null; CV.printSheet = function (el) { captured = el; };
    var origPrint = window.print; window.print = function () {};
    try {
      if (boxes.plan.checked && CV.plan && CV.plan.count()) { var btn = null; CV.plan.open(); btn = CV.$$('#plan button').filter(function (b) { return b.textContent === 'Print'; })[0]; if (btn) btn.click(); var pp = CV.$('#plan-print'); if (pp) { var c = pp.cloneNode(true); c.removeAttribute('id'); sheets.push(c); } document.body.classList.remove('print-myplan'); CV.planDialog.close(); }
      if (boxes.poster.checked) { var pb = CV.$$('#poster button').filter(function (b) { return /Print the poster/.test(b.textContent); })[0]; if (pb) { pb.click(); if (captured) sheets.push(captured); captured = null; } }
      if (boxes.wallet.checked && CV.printWalletCards) { CV.printWalletCards(); if (captured) sheets.push(captured); captured = null; }
      if (boxes.briefing.checked) { var bb = CV.$$('#briefing button').filter(function (b) { return /Print the briefing/.test(b.textContent); })[0]; if (bb) { bb.click(); if (captured) sheets.push(captured); captured = null; } }
      if (boxes.evidence.checked && CV.openRenewal) { CV.openRenewal(); var eb = CV.$$('#renewal button').filter(function (b) { return b.textContent === 'Print it'; })[0]; if (eb) { eb.click(); if (captured) sheets.push(captured); captured = null; } }
    } finally { CV.printSheet = orig; window.print = origPrint; CV.$$('dialog[open]').forEach(function (x) { x.close(); }); }
    if (!sheets.length) { CV.toast('Nothing selected to print'); return; }
    var wrap = CV.h('div', { class: 'tk-pack' }, sheets.map(function (s) { s.classList.add('cv-sheet', 'tk-page'); return s; }));
    CV.printSheet(wrap);
  }, 'primary')));
  CV.toolsMenu.add('Print my toolkit', function () { d.open(); }, 'Share and print');
});

/* --- src/features/192-since-last-visit.js --- */
// @msg Since your last visit: returning readers see what they've ticked off since they were last here and what's new in the podcast series
// @sel #start
CV.ready(function () {
  if (!CV.progressState) return;
  var now = CV.progressState(), prev = CV.store.get('snap', null);
  var snap = { at: Date.now(), five: now.five, planDone: now.planDone, weeks: now.weeks, contacts: now.contacts };
  window.addEventListener('pagehide', function () { var s = CV.progressState(); CV.store.set('snap', { at: Date.now(), five: s.five, planDone: s.planDone, weeks: s.weeks, contacts: s.contacts }); });
  if (!prev || Date.now() - prev.at < 3600000) { if (!prev) CV.store.set('snap', snap); return; }
  var gains = [];
  if (now.five > prev.five) gains.push('+' + (now.five - prev.five) + ' of the five things');
  if (now.planDone > prev.planDone) gains.push('+' + (now.planDone - prev.planDone) + ' plan actions');
  if (now.weeks > prev.weeks) gains.push('+' + (now.weeks - prev.weeks) + ' weeks of the 90-day plan');
  var newEps = CV.EPISODES.filter(function (e) { var d = CV.parseDate(e.date).getTime(); return d > prev.at && d <= CV.today().getTime(); });
  var days = Math.max(1, Math.round((Date.now() - prev.at) / 86400000));
  if (!gains.length && !newEps.length) return;
  var box = CV.h('div', { class: 'slv' },
    CV.h('p', { class: 'cv-kicker' }, 'Since your last visit, ' + days + ' day' + (days === 1 ? '' : 's') + ' ago'),
    gains.length ? CV.h('p', null, CV.h('b', null, gains.join(', ') + '.'), ' Good progress.') : null,
    newEps.length ? CV.h('p', null, 'New on the podcast: ', newEps.map(function (e) { return 'Ep ' + e.n + ', “' + e.title + '”'; }).join('; '), '. ', CV.h('a', { href: CV.PODCAST, rel: 'noopener', target: '_blank' }, 'Listen')) : null);
  var start = CV.$('.start-inner'); if (start) start.insertBefore(box, start.firstChild);
});

/* --- src/features/193-section-share.js --- */
// @msg Share or copy a whole section: every section heading gets a small menu to copy its link, copy it as plain text for an email, or post it to LinkedIn
// @sel #theme-2
CV.ready(function () {
  CV.$$('main section.section[id]').forEach(function (sec) {
    var num = sec.querySelector('.sec-num'), h = sec.querySelector('h2'); if (!num || !h) return;
    var title = function () { return CV.text(h).replace(/#$/, '').trim(); };
    function plain() {
      var out = [title().toUpperCase(), ''];
      CV.$$('.forecast, .prose > p, .prose > h3, .prose > ul > li, .prose > ol > li, aside.call h4, aside.call p:not(.call-label)', sec).forEach(function (el) {
        if (el.closest('.cv-noprint') || el.classList.contains('listen-src') || el.classList.contains('pq-src')) return;
        var c = el.cloneNode(true); if (el.matches('.forecast')) { var sm = c.querySelector('small'); if (sm) sm.parentNode.removeChild(sm); }
        CV.$$('sup, button, .sn', c).forEach(function (n) { if (n.matches('.gl-term')) n.replaceWith(document.createTextNode(n.textContent)); else n.parentNode.removeChild(n); });
        var t = CV.text(c); if (!t) return;
        out.push(el.matches('li') ? '• ' + t : el.matches('h3, h4') ? '\n' + t.toUpperCase() : t);
      });
      out.push('', 'From the ' + CV.TITLE + ' by Noel Bradford: ' + CV.SITE + '#' + sec.id);
      return out.join('\n');
    }
    var b = CV.h('button', { type: 'button', class: 'tts-start ss-btn', 'aria-haspopup': 'true', 'aria-expanded': 'false' }, '↗ Share');
    var menu = CV.h('div', { class: 'ss-menu', role: 'menu', hidden: true },
      CV.h('button', { type: 'button', role: 'menuitem' }, 'Copy link to this section'),
      CV.h('button', { type: 'button', role: 'menuitem' }, 'Copy as plain text'),
      CV.h('button', { type: 'button', role: 'menuitem' }, 'Post on LinkedIn'));
    var items = CV.$$('button', menu);
    items[0].addEventListener('click', function () { close(); CV.copy(CV.SITE + '#' + sec.id, 'Section link copied'); });
    items[1].addEventListener('click', function () { close(); CV.copy(plain(), 'Section copied as text'); });
    items[2].addEventListener('click', function () { close(); var t = title() + ': from the ' + CV.TITLE + ' by Noel Bradford. ' + CV.SITE + '#' + sec.id; CV.copy(t, 'Post text copied'); window.open('https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(CV.SITE + '#' + sec.id), '_blank', 'noopener'); });
    function close() { menu.hidden = true; b.setAttribute('aria-expanded', 'false'); }
    b.addEventListener('click', function (e) { e.stopPropagation(); var open = menu.hidden; CV.$$('.ss-menu').forEach(function (m) { m.hidden = true; }); menu.hidden = !open; b.setAttribute('aria-expanded', open ? 'true' : 'false'); if (open) items[0].focus(); });
    menu.addEventListener('keydown', function (e) { var i = items.indexOf(document.activeElement); if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % 3].focus(); } if (e.key === 'ArrowUp') { e.preventDefault(); items[(i + 2) % 3].focus(); } if (e.key === 'Escape') { close(); b.focus(); } });
    var wrap = CV.h('span', { class: 'ss-wrap' }, b, menu);
    num.appendChild(wrap);
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('.ss-wrap')) CV.$$('.ss-menu').forEach(function (m) { m.hidden = true; }); });
});

/* --- src/features/194-simple-mode.js --- */
// @msg Simple mode: one switch hides every interactive extra (tools, prompts, badges, animations) for readers who just want the report
// @sel #start
CV.ready(function () {
  var on = CV.store.get('simple', false);
  function set(v, quiet) {
    on = v; CV.store.set('simple', v);
    document.documentElement.classList.toggle('simple', v);
    if (item) item.setAttribute('aria-checked', v ? 'true' : 'false');
    if (!quiet) CV.toast(v ? 'Simple mode on: just the report' : 'All the tools are back');
    CV.$$('.sm-exit').forEach(function (b) { b.hidden = !v; });
  }
  var item = CV.toolsMenu ? CV.toolsMenu.add('Simple mode (just the report)', function () { set(!on); }, 'Reading') : null;
  if (item) item.setAttribute('role', 'menuitemcheckbox');
  var exit = CV.h('button', { type: 'button', class: 'tool sm-exit', hidden: true, onclick: function () { set(false); } }, 'Show the tools');
  CV.addTool(exit, true);
  var line = CV.$('.start-head'); if (line) line.appendChild(CV.h('button', { type: 'button', class: 'sm-link', onclick: function () { set(true); } }, 'Just want to read? Switch to simple mode'));
  set(on, true);
});
