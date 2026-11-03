// @msg Reminders hub: every calendar reminder the report offers in one place, plus monthly AI-memory checks and a six-month plan review
// @sel #start
CV.ready(function () {
  function addMonths(d, n) { var x = new Date(d.getTime()); x.setMonth(x.getMonth() + n); return x; }
  var start = CV.today();
  var SETS = [
    ['The 90-day plan', '13 weekly tasks from 4 January 2027', function () { var b = CV.$$('.nd-tools button')[0]; if (b) b.click(); }],
    ['Podcast episodes', 'The rest of the nine-part series', function () { var b = CV.$$('#ep-guide button').filter(function (x) { return /Remind/.test(x.textContent); })[0]; if (b) b.click(); else CV.toast('All episodes are already out'); }],
    ['My plan due dates', 'One reminder per dated action', function () { if (CV.plan && CV.plan.list().some(function (x) { return x.meta.due; })) { CV.plan.open(); setTimeout(function () { var b = CV.$$('#plan button').filter(function (x) { return /calendar/.test(x.textContent); })[0]; if (b) b.click(); }, 50); } else CV.toast('Add due dates in My plan first'); }],
    ['AI memory check', 'Monthly for a year (Theme 2)', function () { var ev = []; for (var i = 1; i <= 12; i++) ev.push({ title: 'Cyber: check AI memory features', date: addMonths(start, i), description: 'Check what your AI tools have remembered, or turn memory off. From Theme 2 of the ' + CV.TITLE + '.', url: CV.SITE + '#theme-2' }); CV.ics(ev, 'ai-memory-checks.ics'); }],
    ['Restore tests', 'Every quarter (Theme 3)', function () { if (CV.openRestore) { CV.openRestore(); } }],
    ['Review the one-page plan', 'In six months', function () { CV.ics([{ title: 'Cyber: review and reprint the one-page plan', date: addMonths(start, 6), description: 'Check names and numbers, update what changed, reprint two copies.', url: CV.SITE + '#mvc' }], 'plan-review.ics'); }]
  ];
  var d = CV.dialog({ id: 'reminders', title: 'Reminders', wide: true, note: 'Each button downloads a calendar file (.ics). Open it to add the reminders to Outlook, Google or Apple Calendar.' });
  d.body.appendChild(CV.h('ul', { class: 'rh-list' }, SETS.map(function (x) { return CV.h('li', null, CV.h('div', null, CV.h('b', null, x[0]), CV.h('span', null, x[1])), CV.button('Add to calendar', x[2])); })));
  CV.openReminders = function () { d.open(); };
  if (CV.toolsMenu) CV.toolsMenu.add('Calendar reminders', CV.openReminders, 'Your work');
  if (CV.toolRoutes) CV.toolRoutes.push('reminders');
  window.addEventListener('hashchange', function () { if (location.hash === '#reminders') { history.replaceState(null, '', location.pathname); d.open(); } });
  if (location.hash === '#reminders') setTimeout(function () { history.replaceState(null, '', location.pathname); d.open(); }, 60);
});
