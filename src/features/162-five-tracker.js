// @msg The five things follow you: a compact tracker under the contents keeps your before-January list in view on every page of the report
// @sel .toc
CV.ready(function () {
  var toc = CV.$('.toc'), five = CV.$('#five'); if (!toc || !five) return;
  var dots = CV.h('span', { class: 'ft-dots', 'aria-hidden': 'true' });
  for (var i = 0; i < 5; i++) dots.appendChild(CV.h('span'));
  var label = CV.h('span', { class: 'ft-l' });
  var box = CV.h('a', { class: 'ft', href: '#h-if-you-do-five-things-before-january' }, CV.h('span', { class: 'ft-k' }, 'Before January'), dots, label);
  toc.appendChild(box);
  function sync() {
    var on = CV.$$('input', five).map(function (b) { return b.checked; }), n = on.filter(Boolean).length;
    CV.$$('span', dots).forEach(function (s, i) { s.classList.toggle('on', on[i]); });
    label.textContent = n === 5 ? 'All five done' : n + ' of 5 things done';
    box.classList.toggle('all', n === 5);
    box.setAttribute('aria-label', 'Five things before January: ' + label.textContent + '. Go to the list.');
  }
  five.addEventListener('change', sync);
  document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('.five-reset')) setTimeout(sync, 0); });
  sync();
});
