// @msg Renewal evidence pack: pulls together everything you've recorded with these tools into one summary for your insurer, customers or auditor
// @sel #rules .example
CV.ready(function () {
  function lines() {
    var sq = CV.store.get('sq', {}), mfa = CV.store.get('mfa', { list: [] }), rs = CV.store.get('restores', []), a4 = CV.store.get('a4', { q: {} });
    var contacts = 0; try { var c = JSON.parse(localStorage.getItem('cv-plan-contacts') || '{}'); contacts = Object.keys(c).filter(function (k) { return c[k]; }).length; } catch (e) {}
    var five = 0; try { var f = JSON.parse(localStorage.getItem('cv-five-things') || '{}'); five = Object.keys(f).filter(function (k) { return f[k]; }).length; } catch (e) {}
    var on = mfa.list.filter(function (x) { return x.lv !== 'none'; }).length, keys = mfa.list.filter(function (x) { return x.lv === 'key'; }).length;
    var last = rs.length ? rs[rs.length - 1] : null;
    var plan = CV.plan ? CV.plan.list() : [];
    return [
      ['Cyber Essentials', { plus: 'Certified, Cyber Essentials Plus', yes: 'Certified', booked: 'Assessment booked', no: 'Not certified yet' }[sq.ce] || 'Not recorded', sq.cert || ''],
      ['Multi-factor authentication', mfa.list.length ? on + ' of ' + mfa.list.length + ' cloud services' + (keys ? ', ' + keys + ' with passkeys or security keys' : '') : 'Not recorded', ''],
      ['Incident plan', Object.keys(a4.q || {}).filter(function (k) { return a4.q[k]; }).length + ' of 5 questions answered, ' + contacts + ' of 7 contacts filled in', a4.rev ? 'Reviewed ' + CV.fmtDate(CV.parseDate(a4.rev)) : ''],
      ['Backup restore test', last ? 'Last tested ' + CV.fmtDate(CV.parseDate(last.date)) + ({ yes: ', worked', part: ', partly worked', no: ', failed' }[last.ok] || '') : 'Not recorded', last && last.mins ? last.mins + ' minutes' : ''],
      ['Named contact for incidents', sq.who || 'Not recorded', sq.tel || ''],
      ['Five things before January', five + ' of 5 done', ''],
      ['Action plan', plan.length ? plan.filter(function (x) { return x.meta.done; }).length + ' of ' + plan.length + ' actions done' : 'Not started', '']
    ];
  }
  var d = CV.dialog({ id: 'renewal', title: 'Renewal evidence pack', wide: true, note: 'Built only from what you’ve recorded in this browser. Check every line is still true before you send it.' });
  function render() {
    var b = d.body; b.innerHTML = '';
    var L = lines();
    b.appendChild(CV.h('div', { class: 'table-wrap' }, CV.h('table', { class: 'md-t rn-t' }, CV.h('tbody', null, L.map(function (l) { return CV.h('tr', { class: /Not recorded|Not started|Not certified/.test(l[1]) ? 'gap' : '' }, CV.h('th', { scope: 'row' }, l[0]), CV.h('td', null, l[1], l[2] ? CV.h('span', null, ' · ' + l[2]) : null)); })))));
    var gaps = L.filter(function (l) { return /Not recorded|Not started|Not certified/.test(l[1]); }).length;
    if (gaps) b.appendChild(CV.h('p', { class: 'ce-fix' }, gaps + ' line' + (gaps === 1 ? '' : 's') + ' not recorded yet. Use the tools in each section to fill them in.'));
    b.appendChild(CV.h('div', { class: 'cv-row' }, CV.button('Copy the summary', function () { CV.copy('CYBER SECURITY SUMMARY\nPrepared ' + CV.fmtDate(CV.today()) + '\n\n' + L.map(function (l) { return l[0] + ': ' + l[1] + (l[2] ? ' (' + l[2] + ')' : ''); }).join('\n'), 'Summary copied'); }, 'primary'),
      CV.button('Print it', function () { CV.printSheet(CV.h('div', { class: 'rn-sheet' }, CV.h('div', { class: 'pp-head' }, CV.h('h2', null, 'Cyber security summary'), CV.h('p', null, 'Prepared ' + CV.fmtDate(CV.today()))), b.querySelector('table').cloneNode(true))); })));
  }
  CV.openRenewal = function () { render(); d.open(); };
  if (CV.toolsMenu) CV.toolsMenu.add('Renewal evidence pack', CV.openRenewal, 'Your work');
  var host = CV.$$('#rules .cta-card').pop();
  if (host) host.after(CV.h('div', { class: 'cta-card cv-noprint' }, CV.h('div', null, CV.h('p', { class: 'cv-kicker' }, 'Tool'), CV.h('p', { class: 'cta-title' }, 'Your renewal evidence, in one page'), CV.h('p', { class: 'cta-sub' }, 'Everything you’ve recorded here, summarised for your insurer, customers or auditor.')), CV.button('Build my evidence pack', CV.openRenewal, 'primary')));
});
