// @msg My progress: one dashboard for everything you've done with the report, and the single next step that matters most
// @sel #start
CV.ready(function () {
  function n(key) { try { var v = JSON.parse(localStorage.getItem(key) || '{}'); return Object.keys(v).filter(function (k) { return v[k]; }).length; } catch (e) { return 0; } }
  function state() {
    var plan = CV.plan ? CV.plan.list() : [];
    var ff = CV.store.get('fivefive', { s: [], c: [] }), ai = CV.store.get('aitools', { tools: [] });
    return {
      score: CV.checkScore ? CV.checkScore() : null,
      five: n('cv-five-things'),
      planTotal: plan.length, planDone: plan.filter(function (x) { return x.meta.done; }).length,
      weeks: n('cv:ninety') || Object.keys(CV.store.get('ninety', {})).filter(function (k) { return CV.store.get('ninety', {})[k]; }).length,
      contacts: n('cv-plan-contacts'),
      mapped: (ff.s || []).concat(ff.c || []).filter(function (r) { return r.name && r.name.trim(); }).length,
      tools: (ai.tools || []).length,
      votes: Object.keys(CV.store.get('votes', {})).filter(function (k) { return CV.store.get('votes', {})[k]; }).length,
      notes: CV.store.get('marks', []).length
    };
  }
  function nextStep(s) {
    if (s.score == null) return ['Take the two-minute exposure check', function () { CV.openCheck && CV.openCheck(true); }];
    if (s.five < 5) return ['Finish the five things (' + s.five + ' of 5)', function () { location.hash = '#h-if-you-do-five-things-before-january'; }];
    if (s.contacts < 3) return ['Fill in who to call on the one-page plan', function () { location.hash = '#mvc'; }];
    if (s.planTotal === 0) return ['Add your next actions to My plan', function () { CV.goToAction && CV.goToAction('t1-1'); }];
    if (s.planDone < s.planTotal) return ['Work through My plan (' + s.planDone + ' of ' + s.planTotal + ' done)', function () { CV.plan.open(); }];
    return ['Run a one-hour tabletop against your plan', function () { location.hash = '#ninety'; }];
  }
  function tile(label, value, sub, fn) { return CV.h('button', { type: 'button', class: 'ph-tile', onclick: function () { d.close(); fn(); } }, CV.h('span', { class: 'ph-l' }, label), CV.h('b', null, value), CV.h('span', { class: 'ph-s' }, sub)); }
  var d = CV.dialog({ id: 'progress', title: 'My progress', wide: true, onopen: render, note: 'Everything here is stored only in this browser.' });
  function render() {
    var s = state(), b = d.body; b.innerHTML = '';
    var ns = nextStep(s);
    b.appendChild(CV.h('div', { class: 'ph-next' }, CV.h('div', null, CV.h('p', { class: 'cv-kicker' }, 'Your next step'), CV.h('p', { class: 'ph-nt' }, ns[0])), CV.button('Do it now', function () { d.close(); ns[1](); }, 'primary')));
    b.appendChild(CV.h('div', { class: 'ph-grid' },
      tile('Exposure check', s.score == null ? '–' : s.score + '/10', s.score == null ? 'Not taken yet' : 'Answers you said yes to', function () { CV.openCheck && CV.openCheck(); }),
      tile('Five things', s.five + '/5', 'Before January', function () { location.hash = '#h-if-you-do-five-things-before-january'; }),
      tile('My plan', s.planDone + '/' + s.planTotal, 'Actions done', function () { CV.plan && CV.plan.open(); }),
      tile('90 days', s.weeks + '/13', 'Weeks ticked off', function () { location.hash = '#ninety'; }),
      tile('Who to call', s.contacts + '/7', 'Contacts on your plan', function () { location.hash = '#mvc'; }),
      tile('Five and five', s.mapped + '/10', 'Suppliers and customers mapped', function () { CV.openFiveFive && CV.openFiveFive(); }),
      tile('AI tools', String(s.tools), 'Listed on your register', function () { CV.openAiTools && CV.openAiTools(); }),
      tile('Forecasts', s.votes + '/14', 'Calls you reacted to', function () { CV.openForecasts && CV.openForecasts(); }),
      tile('Notes', String(s.notes), 'Highlights saved', function () { CV.openNotes && CV.openNotes(); })));
    CV.emit('progress-render', { body: b, state: s });
  }
  CV.openProgress = function () { d.open(); };
  CV.progressState = state;
  CV.addTool(CV.h('button', { type: 'button', class: 'tool', onclick: function () { d.open(); } }, 'My progress'), true);
});
