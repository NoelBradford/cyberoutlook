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
  // A note floats beside its own paragraph. If something above (the author photo, or a long earlier note)
  // pushes it below the end of that paragraph, it would sit beside the wrong text, so it is hidden there:
  // the citation number stays in the text and the source stays in the Sources list.
  function fit() {
    var notes = CV.$$('main .sn');
    notes.forEach(function (n) { n.classList.toggle('sn-off', false); });
    if (!mq.matches) return;
    notes.forEach(function (n) {
      var p = n.nextElementSibling; while (p && p.tagName !== 'P') p = p.nextElementSibling;
      if (!p || !n.offsetParent) return;
      if (n.getBoundingClientRect().top > p.getBoundingClientRect().bottom - 4) n.classList.toggle('sn-off', true);
    });
  }
  var t; function soon() { clearTimeout(t); t = setTimeout(fit, 120); }
  function apply() { if (mq.matches) build(); document.body.classList.toggle('sn-on', mq.matches); CV.margin.place(); fit(); }
  if (mq.addEventListener) mq.addEventListener('change', apply);
  window.addEventListener('resize', soon);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  apply();
});
