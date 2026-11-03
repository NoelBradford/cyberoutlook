// My plan: give every action an owner and a due date, then put the dates in your calendar.
CV.ready(function () {
  if (!CV.plan) return;
  CV.on('plan-item', function (d) {
    var x = d.item, main = d.li.querySelector('.plan-main');
    var who = CV.h('input', { type: 'text', class: 'cv-input', id: 'ow-' + x.id, placeholder: 'Who', autocomplete: 'off', 'aria-label': 'Owner for: ' + x.a.text });
    who.value = x.meta.owner || '';
    who.addEventListener('change', function () { CV.plan.update(x.id, { owner: who.value.trim() }); });
    var due = CV.h('input', { type: 'date', class: 'cv-input', id: 'du-' + x.id, 'aria-label': 'Due date for: ' + x.a.text, min: '2026-11-01', max: '2027-12-31' });
    due.value = x.meta.due || '';
    due.addEventListener('change', function () { CV.plan.update(x.id, { due: due.value }); });
    main.appendChild(CV.h('div', { class: 'plan-assign' }, who, due));
  });
  function events() {
    return CV.plan.list().filter(function (x) { return x.meta.due && !x.meta.done; }).map(function (x) {
      return { title: 'Cyber: ' + x.a.text.replace(/\.$/, '') + (x.meta.owner ? ' (' + x.meta.owner + ')' : ''), date: CV.parseDate(x.meta.due),
        description: 'From your plan, UK Small Business Cyber Outlook 2027. Theme ' + x.a.theme + ': ' + CV.THEMES[x.a.theme] + '. Effort: ' + x.a.effort + '.', url: CV.SITE + '#act-' + x.id };
    });
  }
  CV.on('plan-render', function (d) {
    if (d.empty) return;
    var bar = CV.h('div', { class: 'cv-row plan-actions' });
    bar.appendChild(CV.button('Add due dates to my calendar', function () {
      var ev = events();
      if (!ev.length) { CV.toast('Give at least one open action a due date first'); return; }
      CV.ics(ev, 'my-cyber-plan.ics');
    }, 'primary'));
    bar.appendChild(CV.button('Suggest dates from the 90-day plan', function () {
      // Spread undated actions one per week from the first Monday of January 2027.
      var start = new Date(2027, 0, 4), i = 0;
      CV.plan.list().forEach(function (x) { if (!x.meta.due && !x.meta.done) { var dt = new Date(start.getTime() + i * 7 * 86400000); i++; CV.plan.update(x.id, { due: dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0') }); } });
      CV.toast(i ? 'Suggested ' + i + ' date' + (i === 1 ? '' : 's') + ', one a week from 4 January' : 'Every open action already has a date');
      CV.plan.render();
    }));
    d.body.insertBefore(bar, d.body.children[1] || null);
  });
});
