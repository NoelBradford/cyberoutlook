// @msg Team meeting pack: a printable 30-minute agenda that walks your team through the five things and assigns each one
// @sel #summary
CV.ready(function () {
  var cta = CV.$('#summary .cta-card'); if (!cta) return;
  var saved = CV.store.get('meeting', {});
  var d = CV.dialog({ id: 'meeting', title: '30-minute team meeting', wide: true, note: 'Print it, run it, fill in the owners in the room.' });
  var firm = CV.h('input', { type: 'text', autocomplete: 'organization', placeholder: 'Your business' }); firm.value = saved.firm || '';
  var date = CV.h('input', { type: 'date' }); date.value = saved.date || '';
  var chair = CV.h('input', { type: 'text', placeholder: 'Who chairs' }); chair.value = saved.chair || '';
  [firm, date, chair].forEach(function (i) { i.addEventListener('change', function () { saved = { firm: firm.value, date: date.value, chair: chair.value }; CV.store.set('meeting', saved); }); });
  function five() { return CV.$$('#five li').map(function (li) { return CV.text(li.querySelector('label') || li); }); }
  function agenda() {
    var f = five();
    return [
      ['0–5 min', 'Why we’re here', 'One in five UK businesses was the victim of a cyber crime in the year covered by the government’s latest survey. Most of what follows costs nothing. (Present mode, slides 1 and 2.)'],
      ['5–10 min', 'Payments', f[1] || 'Call-back rule for bank detail changes and urgent payments.'],
      ['10–15 min', 'Logins', f[0] || 'Multi-factor authentication on every cloud service.'],
      ['15–20 min', 'Suppliers and AI tools', (f[3] || '') + ' ' + (f[2] || '')],
      ['20–25 min', 'If it goes wrong', f[4] || 'The one-page plan.'],
      ['25–30 min', 'Who does what, by when', 'Write an owner and a date next to each of the five below.']
    ];
  }
  function sheet() {
    var when = date.value ? CV.fmtDate(CV.parseDate(date.value)) : '____________';
    var t = CV.h('table', { class: 'mt-ag' }, CV.h('tbody', null, agenda().map(function (r) { return CV.h('tr', null, CV.h('td', null, r[0]), CV.h('td', null, CV.h('b', null, r[1]), CV.h('br'), r[2])); })));
    var o = CV.h('table', { class: 'mt-own' }, CV.h('thead', null, CV.h('tr', null, CV.h('th', null, 'The five things'), CV.h('th', null, 'Owner'), CV.h('th', null, 'Done by'))), CV.h('tbody', null, five().map(function (x) { return CV.h('tr', null, CV.h('td', null, x), CV.h('td'), CV.h('td')); })));
    return CV.h('div', { class: 'mt-sheet' },
      CV.h('div', { class: 'pp-head' }, CV.h('h2', null, 'Cyber: 30-minute team meeting'), CV.h('p', null, (firm.value || 'Our business') + ' · ' + when + ' · Chair: ' + (chair.value || '__________'))),
      t, o, CV.h('p', { class: 'pst-src' }, 'Based on the UK Small Business Cyber Outlook 2027 · cyberoutlook.sbcsg.uk'));
  }
  d.body.appendChild(CV.h('div', { class: 'cv-grid2' }, CV.field('Business', firm), CV.field('Meeting date', date), CV.field('Chair', chair)));
  var prev = CV.h('div', { class: 'mt-prev' });
  d.body.appendChild(prev);
  d.body.appendChild(CV.h('div', { class: 'cv-row' }, CV.button('Print the agenda', function () { CV.printSheet(sheet()); }, 'primary'), CV.present ? CV.button('Present the slides', function () { d.close(); CV.present(); }) : null,
    CV.button('Add to calendar', function () { if (!date.value) { CV.toast('Pick a meeting date first'); return; } CV.ics([{ title: 'Cyber: 30-minute team meeting', date: CV.parseDate(date.value), description: agenda().map(function (r) { return r[0] + ' ' + r[1]; }).join('\n'), url: CV.SITE + '#summary' }], 'cyber-team-meeting.ics'); })));
  function refresh() { prev.innerHTML = ''; var ol = CV.h('ol', { class: 'mt-list' }); agenda().forEach(function (r) { ol.appendChild(CV.h('li', null, CV.h('span', null, r[0]), CV.h('b', null, r[1]))); }); prev.appendChild(ol); }
  refresh();
  var row = CV.h('div', { class: 'cv-row' }); var start = cta.querySelector('button'); start.replaceWith(row); row.appendChild(start); row.appendChild(CV.button('Plan the meeting', function () { refresh(); d.open(); }));
});
