// @msg My plan: copy, download, email or print your plan as a clean one-page document
// @sel #theme-1 table.actions
CV.ready(function () {
  if (!CV.plan) return;
  function asText() {
    var items = CV.plan.list(), lines = ['MY CYBER PLAN', 'From the ' + CV.TITLE + ' (' + CV.SITE + ')', ''];
    [0, 1, 2, 3].forEach(function (t) {
      var g = items.filter(function (x) { return x.a.theme === t; }); if (!g.length) return;
      lines.push(CV.themeLabel(t));
      g.forEach(function (x) {
        var meta = [x.a.spend + ' spend', x.a.effort]; if (x.meta.owner) meta.push('Owner: ' + x.meta.owner); if (x.meta.due) meta.push('Due: ' + CV.fmtDate(CV.parseDate(x.meta.due)));
        lines.push((x.meta.done ? '[x] ' : '[ ] ') + x.a.text); lines.push('    ' + meta.join(' | '));
      });
      lines.push('');
    });
    return lines.join('\n');
  }
  CV.plan.asText = asText;
  function printPlan() {
    var items = CV.plan.list();
    var sheet = CV.h('div', { class: 'plan-print', id: 'plan-print' },
      CV.h('div', { class: 'pp-head' }, CV.h('h2', null, 'My cyber plan'), CV.h('p', null, 'From the ' + CV.TITLE + ' · cyberoutlook.sbcsg.uk · printed ' + CV.fmtDate(CV.today()))));
    var tbl = CV.h('table', null, CV.h('thead', null, CV.h('tr', null, CV.h('th', null, ''), CV.h('th', null, 'Action'), CV.h('th', null, 'Owner'), CV.h('th', null, 'Due'), CV.h('th', null, 'Spend'))));
    var tb = CV.h('tbody');
    items.forEach(function (x) { tb.appendChild(CV.h('tr', null, CV.h('td', null, x.meta.done ? '☑' : '☐'), CV.h('td', null, x.a.text), CV.h('td', null, x.meta.owner || ''), CV.h('td', null, x.meta.due ? CV.fmtDate(CV.parseDate(x.meta.due)) : ''), CV.h('td', null, x.a.spend))); });
    tbl.appendChild(tb); sheet.appendChild(tbl);
    var old = CV.$('#plan-print'); if (old) old.remove();
    document.body.appendChild(sheet);
    document.body.classList.add('print-myplan');
    CV.planDialog.close();
    setTimeout(function () { window.print(); }, 50);
  }
  window.addEventListener('afterprint', function () { document.body.classList.remove('print-myplan'); });
  CV.on('plan-render', function (d) {
    if (d.empty) return;
    var row = CV.h('div', { class: 'cv-row plan-export' },
      CV.h('span', { class: 'cv-kicker' }, 'Take it with you'),
      CV.button('Copy', function () { CV.copy(asText(), 'Plan copied'); }),
      CV.button('Download', function () { CV.download('my-cyber-plan.txt', 'text/plain', asText()); }),
      CV.h('a', { class: 'tool', href: 'mailto:?subject=' + encodeURIComponent('Our cyber plan') + '&body=' + encodeURIComponent(asText()) }, 'Email'),
      CV.button('Print', printPlan));
    d.body.appendChild(row);
  });
});
