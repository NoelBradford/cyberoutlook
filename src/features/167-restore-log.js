// @msg Restore-test log: record each time you get files back from backup, how long it took, and get reminders for the next quarterly test
// @sel #theme-3 .table-wrap
CV.ready(function () {
  var tw = CV.$('#theme-3 .table-wrap'); if (!tw) return;
  var log = CV.store.get('restores', []);
  var d = CV.dialog({ id: 'restore', title: 'Restore-test log', wide: true, note: 'From Theme 3: keep a backup ransomware can’t reach, and test a restore every quarter. The 90-day plan does the first one in week 9.' });
  function due() { if (!log.length) return null; var l = CV.parseDate(log[log.length - 1].date); l.setMonth(l.getMonth() + 3); return l; }
  function render() {
    var b = d.body; b.innerHTML = '';
    var dt = CV.h('input', { type: 'date', id: 'rs-date' }); dt.valueAsDate = new Date();
    var what = CV.h('input', { type: 'text', id: 'rs-what', placeholder: 'e.g. Accounts folder, 2 GB' });
    var mins = CV.h('input', { type: 'number', id: 'rs-min', min: '1', placeholder: 'Minutes' });
    var ok = CV.h('select', { id: 'rs-ok' }, CV.h('option', { value: 'yes' }, 'Yes, everything came back'), CV.h('option', { value: 'part' }, 'Partly'), CV.h('option', { value: 'no' }, 'No'));
    b.appendChild(CV.h('div', { class: 'cv-grid2' }, CV.field('Date', dt), CV.field('What you restored', what), CV.field('How long it took', mins), CV.field('Did it work?', ok)));
    b.appendChild(CV.h('div', { class: 'cv-row' }, CV.button('Add to the log', function () { if (!dt.value) return; log.push({ date: dt.value, what: what.value.trim(), mins: mins.value, ok: ok.value }); log.sort(function (a, c) { return a.date < c.date ? -1 : 1; }); CV.store.set('restores', log); CV.toast('Restore test logged'); render(); }, 'primary')));
    var n = due();
    if (n) b.appendChild(CV.h('p', { class: 'rs-due' + (n < CV.today() ? ' late' : '') }, CV.h('b', null, n < CV.today() ? 'Overdue: ' : 'Next test due: '), CV.fmtDate(n)));
    if (log.length) {
      var t = CV.h('table', { class: 'md-t' }, CV.h('thead', null, CV.h('tr', null, ['Date', 'Restored', 'Time', 'Worked'].map(function (x) { return CV.h('th', { scope: 'col' }, x); }))), CV.h('tbody', null, log.slice().reverse().map(function (l) { return CV.h('tr', null, CV.h('td', null, CV.fmtDate(CV.parseDate(l.date))), CV.h('td', null, l.what || '–'), CV.h('td', null, l.mins ? l.mins + ' min' : '–'), CV.h('td', null, { yes: 'Yes', part: 'Partly', no: 'No' }[l.ok])); })));
      b.appendChild(CV.h('div', { class: 'table-wrap' }, t));
    }
    b.appendChild(CV.h('div', { class: 'cv-row' },
      CV.button('Quarterly reminders for a year', function () { var s = due() || CV.today(); var ev = []; for (var i = 0; i < 4; i++) { var x = new Date(s.getTime()); x.setMonth(s.getMonth() + i * 3); ev.push({ title: 'Cyber: test a restore from backup', date: x, description: 'Pick one important folder, get it back from backup, and time it. Log it at ' + CV.SITE + '#restore', url: CV.SITE }); } CV.ics(ev, 'restore-test-reminders.ics'); }),
      log.length ? CV.button('Copy the log', function () { CV.copy('RESTORE TESTS\n' + log.map(function (l) { return l.date + ' | ' + (l.what || '-') + ' | ' + (l.mins || '-') + ' min | ' + l.ok; }).join('\n'), 'Log copied'); }) : null));
  }
  CV.openRestore = function () { render(); d.open(); };
  tw.after(CV.h('div', { class: 'cta-card cv-noprint' }, CV.h('div', null, CV.h('p', { class: 'cv-kicker' }, 'Tool'), CV.h('p', { class: 'cta-title' }, 'Prove your backup works'), CV.h('p', { class: 'cta-sub' }, 'Log each restore test and get a reminder every quarter. Insurers like evidence.')), CV.button('Open the restore log', CV.openRestore, 'primary')));
});
