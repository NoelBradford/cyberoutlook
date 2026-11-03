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
