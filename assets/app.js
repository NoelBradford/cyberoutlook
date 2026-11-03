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
