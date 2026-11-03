// @msg Five-and-five map: list your key suppliers and customers, rate what stops for two weeks, see your weak spots
// @sel #theme-1 .table-wrap
CV.ready(function () {
  var saved = CV.store.get('fivefive', { s: [], c: [] });
  ['s', 'c'].forEach(function (k) { while (saved[k].length < 5) saved[k].push({ name: '', stops: '', impact: 0 }); });
  var d = CV.dialog({ id: 'fivefive', title: 'Five-and-five map', wide: true,
    note: 'From Theme 1: list your five most important suppliers and five most important customers, and write what stops if each disappears for two weeks. Stays in this browser.' });
  var LEVELS = ['Not rated', 'Annoying', 'Painful', 'We stop trading'];
  function save() { CV.store.set('fivefive', saved); renderMap(); }
  var map = CV.h('div', { class: 'ff-map', 'aria-live': 'polite' });
  function rows(k, label) {
    var wrap = CV.h('fieldset', { class: 'ff-set' }, CV.h('legend', null, label));
    saved[k].forEach(function (r, i) {
      var n = CV.h('input', { type: 'text', class: 'cv-input', placeholder: (k === 's' ? 'Supplier ' : 'Customer ') + (i + 1), 'aria-label': (k === 's' ? 'Supplier ' : 'Customer ') + (i + 1) + ' name' }); n.value = r.name;
      var s = CV.h('input', { type: 'text', class: 'cv-input', placeholder: 'What stops for two weeks?', 'aria-label': 'What stops if ' + (k === 's' ? 'supplier ' : 'customer ') + (i + 1) + ' disappears' }); s.value = r.stops;
      var sel = CV.h('select', { class: 'cv-input', 'aria-label': 'Impact of losing ' + (k === 's' ? 'supplier ' : 'customer ') + (i + 1) });
      LEVELS.forEach(function (l, li) { var o = CV.h('option', { value: String(li) }, l); if (r.impact === li) o.selected = true; sel.appendChild(o); });
      n.addEventListener('input', function () { r.name = n.value; save(); });
      s.addEventListener('input', function () { r.stops = s.value; save(); });
      sel.addEventListener('change', function () { r.impact = +sel.value; save(); });
      wrap.appendChild(CV.h('div', { class: 'ff-row' }, n, s, sel));
    });
    return wrap;
  }
  function renderMap() {
    map.innerHTML = '';
    var all = saved.s.map(function (r) { return [r, 'Supplier']; }).concat(saved.c.map(function (r) { return [r, 'Customer']; })).filter(function (x) { return x[0].name.trim(); });
    if (!all.length) { map.appendChild(CV.h('p', { class: 'ff-empty' }, 'Your map appears here as you fill in names.')); return; }
    all.sort(function (a, b) { return b[0].impact - a[0].impact; });
    var crit = all.filter(function (x) { return x[0].impact === 3; }).length;
    map.appendChild(CV.h('p', { class: 'ff-sum' }, crit ? CV.h('b', null, crit + ' would stop you trading. ') : null,
      crit ? 'Start there: ask how they would tell you about a breach, and what your fallback is.' : 'Rate each one to see where you’re most exposed.'));
    var grid = CV.h('ul', { class: 'ff-grid' });
    all.forEach(function (x) { grid.appendChild(CV.h('li', { class: 'ff-tile lv' + x[0].impact }, CV.h('span', { class: 'ff-kind' }, x[1]), CV.h('b', null, x[0].name), x[0].stops ? CV.h('span', null, x[0].stops) : null, CV.h('span', { class: 'ff-lv' }, LEVELS[x[0].impact]))); });
    map.appendChild(grid);
  }
  d.body.appendChild(CV.h('div', { class: 'ff-sets' }, rows('s', 'Your five key suppliers'), rows('c', 'Your five key customers')));
  d.body.appendChild(CV.h('h3', { class: 'qz-h' }, 'Your map'));
  d.body.appendChild(map);
  d.body.appendChild(CV.h('div', { class: 'cv-row' },
    CV.button('Print the map', function () { var c = map.cloneNode(true); var sheet = CV.h('div', { class: 'ff-sheet' }, CV.h('h2', null, 'Five-and-five map'), CV.h('p', null, 'What stops if each disappears for two weeks. From the UK Small Business Cyber Outlook 2027.'), c); CV.printSheet(sheet); }, 'primary'),
    CV.plan ? CV.button('Mark this action in my plan', function () { CV.plan.add('t1-1'); }) : null));
  renderMap();
  CV.openFiveFive = function () { d.open(); };
  var tw = CV.$('#theme-1 .table-wrap');
  if (tw) tw.after(CV.h('div', { class: 'cta-card cv-noprint' },
    CV.h('div', null, CV.h('p', { class: 'cv-kicker' }, 'Tool'), CV.h('p', { class: 'cta-title' }, 'Map your five and five'),
      CV.h('p', { class: 'cta-sub' }, 'Name your key suppliers and customers, rate what stops, and see your weak spots.')),
    CV.button('Start the map', function () { d.open(); }, 'primary')));
});
