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
