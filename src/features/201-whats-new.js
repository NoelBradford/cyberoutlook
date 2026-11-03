// @msg What's new: readers who saw the original report get a short tour of what the web edition now does, once, with a link to each new tool
// @sel #start
CV.ready(function () {
  var NEW = [
    ['Two-minute exposure check', 'Ten questions, a score, and your gaps linked to the fixes.', function () { CV.openCheck && CV.openCheck(true); }],
    ['My plan', 'Add any action, give it an owner and a date, put it in your calendar.', function () { CV.plan && CV.plan.open(); }],
    ['Tools in every section', 'IT provider email, call-back poster, supplier map, AI register, MFA tracker and more.', function () { location.hash = '#theme-1'; }],
    ['It’s happening now', 'Your one-page plan as a full-screen incident card with tap-to-call.', function () { CV.openIncident && CV.openIncident(); }],
    ['Read it your way', 'Short version, listen aloud, focus mode, reading settings, simple mode.', function () { var b = CV.$('.tm-btn'); if (b) b.click(); }]
  ];
  var d = CV.dialog({ id: 'whatsnew', title: 'New in the web edition', wide: true, note: 'Same report, same figures. Everything new stays in your browser.' });
  d.body.appendChild(CV.h('ul', { class: 'wn2' }, NEW.map(function (x) { return CV.h('li', null, CV.h('div', null, CV.h('b', null, x[0]), CV.h('span', null, x[1])), CV.button('Try it', function () { d.close(); x[2](); })); })));
  CV.openWhatsNew = function () { d.open(); };
  if (CV.toolsMenu) CV.toolsMenu.add('What’s new', CV.openWhatsNew, 'More');
  // Show once to people who visited before the web edition (they have older saved data but haven't seen this).
  var returning = (function () { try { return !!(localStorage.getItem('cv-five-things') || localStorage.getItem('cv-plan-contacts') || localStorage.getItem('theme')); } catch (e) { return false; } })();
  if (returning && !CV.store.get('seen-new', false) && !location.hash) { CV.store.set('seen-new', true); CV.store.set('toured', true); setTimeout(function () { if (!CV.$('dialog[open]')) d.open(); }, 1500); }
});
