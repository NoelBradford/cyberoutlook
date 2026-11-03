// @msg AI tool register: list your team's AI tools and flag any that has all three risky abilities at once
// @sel #theme-2 .table-wrap
CV.ready(function () {
  var saved = CV.store.get('aitools', { tools: [], rule: '' });
  var d = CV.dialog({ id: 'aitools', title: 'AI tool register', wide: true,
    note: 'Based on Theme 2: for any AI tool that can read your data, process outside content, and send messages out, switch off at least one of the three. Stays in this browser.' });
  var ABIL = [['data', 'Reads our data'], ['outside', 'Processes outside content'], ['send', 'Sends messages out']];
  var list = CV.h('div', { class: 'ai-list' });
  var rule = CV.h('textarea', { placeholder: 'e.g. No client personal data goes into any AI tool that isn’t on this list.' }); rule.value = saved.rule || '';
  rule.addEventListener('input', function () { saved.rule = rule.value; save(false); });
  function save(re) { CV.store.set('aitools', saved); if (re !== false) render(); }
  function render() {
    list.innerHTML = '';
    if (!saved.tools.length) list.appendChild(CV.h('p', { class: 'ff-empty' }, 'No tools yet. Add the ones your team actually uses, approved or not.'));
    saved.tools.forEach(function (t, i) {
      var three = ABIL.every(function (a) { return t[a[0]]; });
      var name = CV.h('input', { type: 'text', class: 'cv-input', placeholder: 'Tool, e.g. ChatGPT, Copilot', 'aria-label': 'Tool ' + (i + 1) + ' name' }); name.value = t.name || '';
      var who = CV.h('input', { type: 'text', class: 'cv-input', placeholder: 'Who uses it', 'aria-label': 'Who uses tool ' + (i + 1) }); who.value = t.who || '';
      name.addEventListener('change', function () { t.name = name.value; save(); });
      who.addEventListener('change', function () { t.who = who.value; save(); });
      var checks = CV.h('div', { class: 'ai-abil' });
      ABIL.forEach(function (a) {
        var id = 'ai-' + i + '-' + a[0];
        var cb = CV.h('input', { type: 'checkbox', id: id }); cb.checked = !!t[a[0]];
        cb.addEventListener('change', function () { t[a[0]] = cb.checked; save(); });
        checks.appendChild(CV.h('div', { class: 'qz-opt-inline' }, cb, CV.h('label', { for: id }, a[1])));
      });
      var card = CV.h('div', { class: 'ai-card' + (three ? ' risky' : '') },
        CV.h('div', { class: 'ai-top' }, name, who, CV.h('button', { type: 'button', class: 'plan-rm', 'aria-label': 'Remove tool ' + (i + 1), onclick: function () { saved.tools.splice(i, 1); save(); } }, '×')),
        checks,
        three ? CV.h('p', { class: 'ai-warn' }, CV.h('b', null, 'All three are on.'), ' Switch off at least one: limit what it can read, stop it processing outside content, or stop it sending messages out.') : null);
      list.appendChild(card);
    });
    var risky = saved.tools.filter(function (t) { return ABIL.every(function (a) { return t[a[0]]; }); }).length;
    sum.textContent = saved.tools.length ? saved.tools.length + ' tool' + (saved.tools.length === 1 ? '' : 's') + ' listed. ' + (risky ? risky + ' with all three abilities.' : 'None has all three abilities.') : '';
  }
  var sum = CV.h('p', { class: 'ai-sum', 'aria-live': 'polite' });
  d.body.appendChild(sum);
  d.body.appendChild(list);
  d.body.appendChild(CV.h('div', { class: 'cv-row' }, CV.button('+ Add a tool', function () { saved.tools.push({}); save(); var ins = list.querySelectorAll('.ai-card input[type=text]'); if (ins.length) ins[ins.length - 2].focus(); })));
  d.body.appendChild(CV.field('Your client data rule', rule));
  d.body.appendChild(CV.h('div', { class: 'cv-row' }, CV.button('Print the register', function () {
    var t = CV.h('table', null, CV.h('thead', null, CV.h('tr', null, ['Tool', 'Who uses it', 'Reads our data', 'Outside content', 'Sends out'].map(function (x) { return CV.h('th', null, x); }))));
    var tb = CV.h('tbody'); saved.tools.forEach(function (x) { tb.appendChild(CV.h('tr', null, CV.h('td', null, x.name || ''), CV.h('td', null, x.who || ''), ABIL.map(function (a) { return CV.h('td', null, x[a[0]] ? 'Yes' : 'No'); }))); }); t.appendChild(tb);
    CV.printSheet(CV.h('div', { class: 'ai-sheet' }, CV.h('h2', null, 'AI tool register'), t, CV.h('h3', null, 'Client data rule'), CV.h('p', null, saved.rule || '______________________________________________'), CV.h('p', { class: 'pst-src' }, 'From the UK Small Business Cyber Outlook 2027 · cyberoutlook.sbcsg.uk')));
  }, 'primary'), CV.plan ? CV.button('Add this action to my plan', function () { CV.plan.add('t2-1'); }) : null));
  render();
  CV.openAiTools = function () { d.open(); };
  var tw = CV.$('#theme-2 .table-wrap');
  if (tw) tw.after(CV.h('div', { class: 'cta-card cv-noprint' },
    CV.h('div', null, CV.h('p', { class: 'cv-kicker' }, 'Tool'), CV.h('p', { class: 'cta-title' }, 'Build your AI tool register'),
      CV.h('p', { class: 'cta-sub' }, 'List the tools, tick what each can do, and spot any with all three risky abilities.')),
    CV.button('Start the register', function () { d.open(); }, 'primary')));
});
