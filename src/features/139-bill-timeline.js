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
