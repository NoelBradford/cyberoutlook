// @msg 90-day plan: tick off the 13 weeks, see progress per month, and put every week in your calendar
// @sel #ninety .months
CV.ready(function () {
  var months = CV.$$('#ninety .month'); if (!months.length) return;
  var saved = CV.store.get('ninety', {});
  var weeks = [];
  months.forEach(function (m, mi) {
    var lis = CV.$$('li', m);
    var meter = CV.h('div', { class: 'nd-meter', 'aria-hidden': 'true' }, CV.h('span'));
    var label = CV.h('p', { class: 'nd-count' });
    m.querySelector('.sub').after(meter, label);
    lis.forEach(function (li) {
      var wk = (li.querySelector('strong') || {}).textContent || '';
      var n = parseInt((wk.match(/\d+/) || [0])[0], 10); if (!n) return;
      var id = 'wk-' + n;
      var cb = CV.h('input', { type: 'checkbox', id: id, class: 'nd-cb' }); cb.checked = !!saved[n];
      var lab = CV.h('label', { for: id }); while (li.firstChild) lab.appendChild(li.firstChild);
      li.appendChild(cb); li.appendChild(lab); li.classList.add('nd-li');
      cb.addEventListener('change', function () { saved[n] = cb.checked; CV.store.set('ninety', saved); li.classList.toggle('done', cb.checked); update(); });
      li.classList.toggle('done', cb.checked);
      weeks.push({ n: n, text: CV.text(lab).replace(/^Week \d+:\s*/, ''), m: m, meter: meter, label: label });
    });
    m.classList.add('nd-month');
  });
  function update() {
    months.forEach(function (m) {
      var ws = weeks.filter(function (w) { return w.m === m; }); if (!ws.length) return;
      var d = ws.filter(function (w) { return saved[w.n]; }).length;
      ws[0].meter.firstChild.style.width = (d / ws.length * 100) + '%';
      ws[0].label.textContent = d + ' of ' + ws.length + ' weeks done';
      m.classList.toggle('complete', d === ws.length);
    });
    CV.emit('ninety', saved);
  }
  update();
  var tools = CV.h('div', { class: 'nd-tools cv-noprint' },
    CV.h('p', null, CV.h('b', null, 'Run it from your calendar.'), ' One reminder each Monday from 4 January 2027, with that week’s task.'),
    CV.button('Add all 13 weeks to my calendar', function () {
      var start = new Date(2027, 0, 4);
      CV.ics(weeks.map(function (w) { return { title: 'Cyber week ' + w.n + ': ' + w.text.replace(/\.$/, ''), date: new Date(start.getTime() + (w.n - 1) * 7 * 86400000), description: 'Your first 90 days of 2027, from the ' + CV.TITLE + '.', url: CV.SITE + '#ninety' }; }), 'cyber-90-days-2027.ics');
    }, 'primary'));
  CV.$('#ninety .months').after(tools);
});
