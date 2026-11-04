// @msg Businesses like yours: meet the builder, the broker and the heating firm, and jump straight to the story closest to your own
// @sel #like-yours
CV.ready(function () {
  var after = CV.$$('#how-to-read h3').filter(function (h) { return /businesses in the examples/i.test(h.textContent); })[0]; if (!after) return;
  var P = [
    { who: 'Gary', what: 'Builder', where: 'Essex, about 12 staff', tag: 'Real business, imagined scenario', h: 'h-picture-this-happening-to-gary', hook: 'Other people’s problems become yours', theme: 'Theme 1' },
    { who: 'Rachel', what: 'Mortgage broker', where: 'Milton Keynes', tag: 'Illustrative example', h: 'h-say-rachel-a-mortgage-broker-in-milton-keynes', hook: 'AI in the back office', theme: 'Theme 2' },
    { who: 'Dave', what: 'Heating firm', where: 'Horsham', tag: 'Illustrative example', h: 'h-take-dave-a-heating-firm-in-horsham', hook: 'Crime gets cheaper and faster', theme: 'Theme 3' }
  ].filter(function (x) { return document.getElementById(x.h); });
  if (!P.length) return;
  var grid = CV.h('div', { class: 'ly', id: 'like-yours' },
    CV.h('p', { class: 'cv-kicker' }, 'Businesses like yours'),
    CV.h('div', { class: 'ly-grid' }, P.map(function (x) {
      return CV.h('a', { class: 'ly-card', href: '#' + x.h },
        CV.h('span', { class: 'ly-av', 'aria-hidden': 'true' }, x.who[0]),
        CV.h('span', { class: 'ly-main' }, CV.h('b', null, x.who + ', ' + x.what.toLowerCase()), CV.h('span', { class: 'ly-where' }, x.where + ' · ' + x.tag), CV.h('span', { class: 'ly-hook' }, x.theme + ': ' + x.hook)),
        CV.h('span', { class: 'ly-go', 'aria-hidden': 'true' }, '→'));
    })));
  var p = after.nextElementSibling; (p && p.tagName === 'P' ? p : after).after(grid);
});
