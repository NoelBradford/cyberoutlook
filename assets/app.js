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
