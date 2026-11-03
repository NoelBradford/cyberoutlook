// @msg Spend planner: tick what you'll do from each spend column and get a one-line budget picture to take to whoever signs off spending
// @sel #spend .tiers
CV.ready(function () {
  var tiers = CV.$$('#spend .tier'); if (!tiers.length) return;
  var saved = CV.store.get('spend', {});
  var NAMES = ['No spend', 'Modest spend', 'Planned spend'];
  var sum = CV.h('div', { class: 'sp-sum', 'aria-live': 'polite' });
  tiers.forEach(function (t, ti) {
    CV.$$('li', t).forEach(function (li, i) {
      var id = 'sp-' + ti + '-' + i;
      var cb = CV.h('input', { type: 'checkbox', id: id, class: 'sp-cb' }); cb.checked = !!saved[id];
      var lab = CV.h('label', { for: id }); while (li.firstChild) lab.appendChild(li.firstChild);
      li.appendChild(cb); li.appendChild(lab); li.classList.add('sp-li');
      cb.addEventListener('change', function () { saved[id] = cb.checked; CV.store.set('spend', saved); li.classList.toggle('on', cb.checked); render(); });
      li.classList.toggle('on', cb.checked);
    });
    t.classList.add('sp-tier');
  });
  function picked(ti) { return CV.$$('li', tiers[ti]).filter(function (li) { return li.querySelector('input').checked; }).map(function (li) { return CV.text(li.querySelector('label')); }); }
  function render() {
    sum.innerHTML = '';
    var p = [0, 1, 2].map(picked), total = p[0].length + p[1].length + p[2].length;
    if (!total) { sum.appendChild(CV.h('p', null, CV.h('b', null, 'Tick what you’ll do. '), 'Start with the first column: it costs nothing.')); return; }
    sum.appendChild(CV.h('div', { class: 'sp-bars', 'aria-hidden': 'true' }, p.map(function (x, i) { return CV.h('span', { class: 'sp-b' + i, style: 'flex-grow:' + x.length }); })));
    sum.appendChild(CV.h('p', null, CV.h('b', null, total + ' item' + (total === 1 ? '' : 's') + ': '), p.map(function (x, i) { return x.length + ' ' + NAMES[i].toLowerCase(); }).join(', ') + '.'));
    if (p[1].length + p[2].length && p[0].length < CV.$$('li', tiers[0]).length) sum.appendChild(CV.h('p', { class: 'sp-tip' }, 'Worth finishing the first column too: it costs nothing, and on its own it puts you ahead of most firms in the government’s survey on suppliers and incident planning.'));
    sum.appendChild(CV.h('div', { class: 'cv-row' }, CV.button('Copy budget note', function () {
      var t = 'Cyber budget for 2027 (from the UK Small Business Cyber Outlook 2027, ' + CV.SITE + '#spend)\n\n' + p.map(function (x, i) { return x.length ? NAMES[i] + ' (' + CV.text(tiers[i].querySelector('.sub')) + '):\n' + x.map(function (s) { return '- ' + s; }).join('\n') : ''; }).filter(Boolean).join('\n\n');
      CV.copy(t, 'Budget note copied');
    }, 'primary')));
  }
  CV.$('#spend .tiers').after(sum);
  render();
});
