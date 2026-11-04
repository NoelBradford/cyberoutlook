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
    CV.followRow());
  (para && para.tagName === 'P' ? para : h).after(box);
});
