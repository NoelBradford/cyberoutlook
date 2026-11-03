// @msg Reading settings: text size, line spacing and an easy-to-read font, remembered for next time
// @sel #foreword
CV.ready(function () {
  var s = CV.store.get('read', { size: 0, space: 0, font: 'default' });
  var root = document.documentElement;
  if (s.font === 'easy' && !document.getElementById('cv-easy-font')) {
    document.head.appendChild(CV.h('link', { rel: 'stylesheet', id: 'cv-easy-font', href: 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&display=swap' }));
  }
  function apply() {
    root.style.setProperty('--rs-size', [1, 1.12, 1.25, 1.4][s.size]);
    root.style.setProperty('--rs-lh', [1.62, 1.8, 2][s.space]);
    root.classList.toggle('rs-on', s.size > 0 || s.space > 0 || s.font !== 'default');
    root.dataset.font = s.font;
    if (s.font === 'easy' && !document.getElementById('cv-easy-font')) document.head.appendChild(CV.h('link', { rel: 'stylesheet', id: 'cv-easy-font', href: 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&display=swap' }));
    CV.store.set('read', s);
  }
  function seg(label, key, opts) {
    var g = CV.h('div', { class: 'rs-seg', role: 'radiogroup', 'aria-label': label });
    opts.forEach(function (o) {
      var b = CV.h('button', { type: 'button', role: 'radio', class: 'rs-opt' }, o[1]);
      function sync() { var on = s[key] === o[0]; b.setAttribute('aria-checked', on ? 'true' : 'false'); }
      b.addEventListener('click', function () { s[key] = o[0]; apply(); CV.$$('.rs-opt', g).forEach(function (x) { x._sync(); }); });
      b._sync = sync; sync(); g.appendChild(b);
    });
    return CV.h('div', { class: 'rs-row' }, CV.h('p', { class: 'cv-kicker' }, label), g);
  }
  var d = CV.dialog({ id: 'reading', title: 'Reading settings', note: 'Saved in this browser.' });
  d.body.appendChild(seg('Text size', 'size', [[0, 'A'], [1, 'A+'], [2, 'A++'], [3, 'A+++']]));
  d.body.appendChild(seg('Line spacing', 'space', [[0, 'Normal'], [1, 'Roomy'], [2, 'Extra']]));
  d.body.appendChild(seg('Font', 'font', [['default', 'Report font'], ['easy', 'Easy to read'], ['sans', 'Plain sans']]));
  d.body.appendChild(CV.h('p', { class: 'rs-sample' }, 'Good security doesn’t have to be expensive, but stupidity always is.'));
  d.body.appendChild(CV.h('div', { class: 'cv-row' }, CV.button('Reset', function () { s = { size: 0, space: 0, font: 'default' }; apply(); CV.$$('#reading .rs-opt').forEach(function (x) { x._sync(); }); })));
  CV.openReading = function () { d.open(); };
  CV.addTool(CV.h('button', { type: 'button', class: 'tool', 'aria-label': 'Reading settings', onclick: function () { d.open(); } }, 'Aa'));
  apply();
});
