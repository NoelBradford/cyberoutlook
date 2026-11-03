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
