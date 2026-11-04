// @msg My plan: share it as a link, so a colleague opens the report with your plan ready to import
// @sel #start
CV.ready(function () {
  if (!CV.plan) return;
  // Link format: #plan=t1-1.Sam.20270104~t3-5..~ (id.owner.due), owner limited to letters, digits and spaces.
  function encode() {
    return CV.plan.list().map(function (x) {
      var o = (x.meta.owner || '').replace(/[^A-Za-z0-9 ]/g, '').slice(0, 24).replace(/ /g, '_');
      return [x.id, o, (x.meta.due || '').replace(/-/g, '')].join('.');
    }).join('~');
  }
  function decode(s) {
    return s.split('~').map(function (p) {
      var f = p.split('.'); if (!/^(t[123]-[1-9]|p-(plan|owner))$/.test(f[0]) || !CV.plan.byId[f[0]]) return null;
      var due = /^\d{8}$/.test(f[2] || '') ? f[2].slice(0, 4) + '-' + f[2].slice(4, 6) + '-' + f[2].slice(6) : '';
      return { id: f[0], owner: (f[1] || '').replace(/_/g, ' '), due: due };
    }).filter(Boolean);
  }
  CV.on('plan-render', function (d) {
    if (d.empty) return;
    var row = d.body.querySelector('.plan-export'); if (!row) return;
    row.appendChild(CV.button('Copy share link', function () { CV.copy(CV.SITE + '#plan=' + encode(), 'Share link copied'); }));
  });
  var m = location.hash.match(/^#plan=([A-Za-z0-9_.~-]+)$/);
  if (!m) return;
  var incoming = decode(decodeURIComponent(m[1]));
  history.replaceState(null, '', location.pathname + location.search);
  if (!incoming.length) return;
  var d = CV.dialog({ id: 'plan-import', title: 'A plan was shared with you', note: 'Importing adds these actions to the plan stored in this browser.' });
  var ul = CV.h('ul', { class: 'imp-list' });
  incoming.forEach(function (x) { var a = CV.plan.byId[x.id]; ul.appendChild(CV.h('li', null, a.text, x.owner || x.due ? CV.h('span', { class: 'imp-meta' }, [x.owner, x.due && CV.fmtDate(CV.parseDate(x.due))].filter(Boolean).join(' · ')) : null)); });
  d.body.appendChild(CV.h('p', null, 'Someone sent you ' + incoming.length + ' action' + (incoming.length === 1 ? '' : 's') + ' from the ' + CV.TITLE + '.'));
  d.body.appendChild(ul);
  d.body.appendChild(CV.h('div', { class: 'cv-row' },
    CV.button('Import into my plan', function () {
      incoming.forEach(function (x) { CV.plan.add(x.id, true); CV.plan.update(x.id, { owner: x.owner, due: x.due }); });
      d.close(); CV.toast('Plan imported'); CV.plan.open();
    }, 'primary'),
    CV.button('Not now', function () { d.close(); })));
  d.open();
});
