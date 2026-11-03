// @msg Print my toolkit: one print run gives you every sheet you've made, from the poster and wallet cards to the briefing and evidence summary
// @sel #start
CV.ready(function () {
  if (!CV.printSheet || !CV.toolsMenu) return;
  var d = CV.dialog({ id: 'toolkit', title: 'Print my toolkit', note: 'Each sheet prints on its own page.', onopen: function () { OPTS.forEach(function (o) { if (boxes[o[0]]) boxes[o[0]].checked = !!o[2](); }); } });
  var OPTS = [
    ['plan', 'My plan (actions, owners, dates)', function () { return CV.plan && CV.plan.count(); }, function () { return CV.$('#plan-print') || null; }],
    ['poster', 'Call-back rule poster', function () { return true; }, function () { var p = CV.$('#poster .poster'); return p && p.cloneNode(true); }],
    ['wallet', 'Wallet cards', function () { return true; }, null],
    ['briefing', 'Five-minute team briefing', function () { return !!CV.openBriefing; }, null],
    ['evidence', 'Renewal evidence summary', function () { return !!CV.openRenewal; }, null]
  ];
  var boxes = {};
  d.body.appendChild(CV.h('div', { class: 'hr-steps' }, OPTS.map(function (o) { var cb = CV.h('input', { type: 'checkbox', id: 'tk-' + o[0] }); cb.checked = !!o[2](); boxes[o[0]] = cb; return CV.h('div', { class: 'qz-opt-inline' }, cb, CV.h('label', { for: 'tk-' + o[0] }, o[1])); })));
  d.body.appendChild(CV.h('div', { class: 'cv-row' }, CV.button('Print selected', function () {
    var sheets = [];
    // Generate each sheet by asking its tool to build it, capturing what it hands to printSheet.
    var orig = CV.printSheet, captured = null; CV.printSheet = function (el) { captured = el; };
    var origPrint = window.print; window.print = function () {};
    try {
      if (boxes.plan.checked && CV.plan && CV.plan.count()) { var btn = null; CV.plan.open(); btn = CV.$$('#plan button').filter(function (b) { return b.textContent === 'Print'; })[0]; if (btn) btn.click(); var pp = CV.$('#plan-print'); if (pp) { var c = pp.cloneNode(true); c.removeAttribute('id'); sheets.push(c); } document.body.classList.remove('print-myplan'); CV.planDialog.close(); }
      if (boxes.poster.checked) { var pb = CV.$$('#poster button').filter(function (b) { return /Print the poster/.test(b.textContent); })[0]; if (pb) { pb.click(); if (captured) sheets.push(captured); captured = null; } }
      if (boxes.wallet.checked && CV.printWalletCards) { CV.printWalletCards(); if (captured) sheets.push(captured); captured = null; }
      if (boxes.briefing.checked) { var bb = CV.$$('#briefing button').filter(function (b) { return /Print the briefing/.test(b.textContent); })[0]; if (bb) { bb.click(); if (captured) sheets.push(captured); captured = null; } }
      if (boxes.evidence.checked && CV.openRenewal) { CV.openRenewal(); var eb = CV.$$('#renewal button').filter(function (b) { return b.textContent === 'Print it'; })[0]; if (eb) { eb.click(); if (captured) sheets.push(captured); captured = null; } }
    } finally { CV.printSheet = orig; window.print = origPrint; CV.$$('dialog[open]').forEach(function (x) { x.close(); }); }
    if (!sheets.length) { CV.toast('Nothing selected to print'); return; }
    var wrap = CV.h('div', { class: 'tk-pack' }, sheets.map(function (s) { s.classList.add('cv-sheet', 'tk-page'); return s; }));
    CV.printSheet(wrap);
  }, 'primary')));
  CV.toolsMenu.add('Print my toolkit', function () { d.open(); }, 'Share and print');
});
