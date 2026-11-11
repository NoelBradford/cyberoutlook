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
  // CV.inlineHost (src/pages/standalone.js) has the same shape as CV.dialog and the hooks 111-check-to-plan looks for.
  var d = SA ? CV.inlineHost({ id: 'check', label: 'Two-minute exposure check', note: NOTE }) : CV.dialog({ id: 'check', title: 'Two-minute exposure check', wide: true, note: NOTE });
  var H = SA ? 'h2' : 'h3'; // the page already has an h1
  function intro(show) { var i = CV.$('.page-intro'); if (i) i.hidden = !show; }
  var step = 0;
  function answers() { return saved.a || {}; }
  function save() { CV.store.set('check', saved); CV.emit('check', saved); }
  function renderQ() {
    var b = d.body; b.innerHTML = '';
    var item = Q[step], a = answers()[step];
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
    if (focusQ) legend.focus(); else { var first = fs.querySelector('input:checked') || fs.querySelector('input'); if (first) first.focus(); }
    focusQ = false;
  }
  var focusQ = false;
  function next() { if (!answers()[step]) return; if (step < Q.length - 1) { step++; focusQ = true; renderQ(); } else renderResult(); }
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
  function renderStart(partial) {
    var b = d.body; b.innerHTML = ''; intro(true);
    b.appendChild(CV.h('div', { class: 'cv-row qz-start' }, CV.button(partial ? 'Continue' : 'Start', function () { intro(false); focusQ = true; renderQ(); }, 'primary')));
  }
  // Opening the check never throws away answers: a finished check shows its result, a half-finished one resumes.
  // Only "Start again" clears it.
  CV.openCheck = function () {
    if (pill) pill.remove();
    planSyncs.length = 0;
    if (saved.done) { d.open(); if (SA) intro(false); renderResult(); return; }
    var ans = answers(); step = 0; while (step < Q.length - 1 && ans[step]) step++;
    d.open();
    if (SA) { renderStart(Object.keys(ans).length > 0); return; } // the page's own heading and intro sit above the Start button
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
  // The check links on the cover and in Start here are in the page; wire them up.
  CV.$$('a[data-path="check"]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); CV.openCheck(); });
  });
  if (saved.done) {
    var card = CV.$('.path[data-path="check"]');
    if (card) { card.querySelector('b').textContent = 'Your exposure check'; card.querySelector('.p-sub').textContent = 'See your result and your gaps again.'; }
    var cc = CV.$('.cc-btn'); if (cc) cc.textContent = 'See your check result';
  }
  if (!SA && location.hash === '#check') CV.openCheck();
  // Row ids are added above, after the browser has already looked for the target, so a link such as /#act-t3-1 needs a nudge.
  var hit = /^#act-(t\d+-\d+)$/.exec(location.hash);
  if (!SA && hit) setTimeout(function () { CV.goToAction(hit[1]); }, 300);
});
