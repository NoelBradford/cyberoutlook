// @msg Forecast scorecard: react to every "Our call" forecast (agree, unsure, disagree) and see all of them, and your outlook, in one place
// @sel #theme-1 .call
CV.ready(function () {
  var calls = CV.$$('main aside.call').filter(function (a) { return !/Example/i.test(a.getAttribute('aria-label') || ''); });
  if (!calls.length) return;
  var votes = CV.store.get('votes', {});
  var OPTS = [['agree', 'Agree'], ['unsure', 'Not sure'], ['disagree', 'Disagree']];
  var items = calls.map(function (a, i) {
    var id = a.id || ('call-' + (i + 1)); a.id = id;
    var sec = a.closest('section'), label = a.querySelector('.call-label span');
    return { id: id, el: a, title: CV.text(a.querySelector('h4')), theme: label ? CV.text(label) : '', sec: sec ? CV.text(sec.querySelector('h2')).replace(/#$/, '').trim() : '' };
  });
  function voteRow(it) {
    var g = CV.h('div', { class: 'fc-vote', role: 'group', 'aria-label': 'Do you agree with this forecast?' }, CV.h('span', { class: 'fc-q' }, 'Your call?'));
    OPTS.forEach(function (o) {
      var b = CV.h('button', { type: 'button', class: 'fc-b fc-' + o[0], 'aria-pressed': votes[it.id] === o[0] ? 'true' : 'false' }, o[1]);
      b.addEventListener('click', function () { votes[it.id] = votes[it.id] === o[0] ? undefined : o[0]; CV.store.set('votes', votes); sync(); });
      g.appendChild(b);
    });
    return g;
  }
  items.forEach(function (it) { it.row = voteRow(it); it.el.appendChild(it.row); });
  function sync() {
    items.forEach(function (it) { CV.$$('.fc-b', it.row).forEach(function (b, i) { b.setAttribute('aria-pressed', votes[it.id] === OPTS[i][0] ? 'true' : 'false'); }); });
    if (d.dialog.open) render();
  }
  var d = CV.dialog({ id: 'forecasts', title: 'All of Noel’s calls for 2027', wide: true, onopen: render, note: 'Forecasts are opinion, marked "Our call" in the report. Your reactions stay in this browser.' });
  function render() {
    var b = d.body; b.innerHTML = '';
    var c = { agree: 0, unsure: 0, disagree: 0 }; items.forEach(function (it) { if (votes[it.id]) c[votes[it.id]]++; });
    var n = c.agree + c.unsure + c.disagree;
    b.appendChild(CV.h('div', { class: 'fc-sum' },
      CV.h('p', null, n ? 'You’ve reacted to ' + n + ' of ' + items.length + ' forecasts.' : items.length + ' forecasts. React to each one as you read, or here.'),
      CV.h('div', { class: 'fc-bars', 'aria-hidden': 'true' }, OPTS.map(function (o) { return CV.h('span', { class: 'fc-' + o[0], style: 'flex-grow:' + (c[o[0]] || 0) }); })),
      n ? CV.h('p', { class: 'fc-legend' }, c.agree + ' agree · ' + c.unsure + ' not sure · ' + c.disagree + ' disagree') : null));
    var ol = CV.h('ol', { class: 'fc-list' });
    items.forEach(function (it) {
      ol.appendChild(CV.h('li', null, CV.h('p', { class: 'cv-kicker' }, it.sec + (it.theme && it.theme !== it.sec ? ' · ' + it.theme : '')),
        CV.h('a', { href: '#' + it.id, class: 'fc-t', onclick: function () { d.close(); } }, it.title), voteRow(it)));
    });
    b.appendChild(ol);
  }
  CV.openForecasts = function () { d.open(); };
  var how = CV.$('#how-to-read aside.call');
  if (how) how.after(CV.h('div', { class: 'cta-card cv-noprint' }, CV.h('div', null, CV.h('p', { class: 'cv-kicker' }, 'Forecasts'), CV.h('p', { class: 'cta-title' }, items.length + ' calls for 2027'), CV.h('p', { class: 'cta-sub' }, 'See every forecast in one list and say whether you agree.')), CV.button('See all the calls', function () { d.open(); }, 'primary')));
});
