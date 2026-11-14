// Exposure check -> plan: turn your gaps into a plan in one click.
CV.ready(function () {
  if (!CV.plan || !CV.openCheck) return;
  var map = { 't3-1': 't3-1', 't1-3': 't1-3', 't1-2': 't1-2', 't1-1': 't1-1', 't2-1': 't2-1', 't3-2': 't3-2', 't3-5': 't3-5', 't3-6': 't3-6' };
  CV.on('check-result', function (r) {
    var ids = r.gaps.map(function (g) { return g.q.act || g.q.planAct; }).filter(function (id) { return id && CV.plan.byId[id]; });
    var d = document.getElementById('check'); if (!d) return;
    var body = d.querySelector('.cv-dialog-body');
    var box = CV.h('div', { class: 'qz-plan' });
    if (ids.length) {
      var fresh = ids.filter(function (id) { return !CV.plan.has(id); });
      box.appendChild(CV.h('div', null, CV.h('p', { class: 'cv-kicker' }, 'Next step'),
        CV.h('p', null, fresh.length ? 'Turn your ' + ids.length + ' gap' + (ids.length === 1 ? '' : 's') + ' into a plan, with owners and dates.' : 'Your gaps are already in your plan.')));
      box.appendChild(CV.button(fresh.length ? (CV.standalone ? 'Turn these gaps into your plan' : 'Add my gaps to my plan') : 'Open my plan', function () {
        fresh.forEach(function (id) { CV.plan.add(id, true); });
        if (fresh.length) CV.toast(fresh.length + ' action' + (fresh.length === 1 ? '' : 's') + ' added to your plan');
        d.close(); CV.plan.open();
      }, 'primary'));
      // The next step sits straight after the score, above the gaps, on the report and on a page of its own. It waits behind the
      // soft gate (src/features/108) because it adds every gap to the plan.
      if (r.locked) box.hidden = true;
      body.insertBefore(box, body.querySelector('.qz-h') || null);
    }
  });
});
