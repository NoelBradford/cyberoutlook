// @msg Keyboard shortcuts: press ? for a cheat sheet; J and K jump between sections, P opens your plan, C the check, G the glossary
// @sel #start
CV.ready(function () {
  var secs = CV.$$('main section.section[id]');
  function cur() { var y = window.innerHeight * 0.3, c = -1; secs.forEach(function (s, i) { if (s.getBoundingClientRect().top <= y) c = i; }); return c; }
  function jump(d) { var i = Math.max(0, Math.min(secs.length - 1, cur() + d)); secs[i].scrollIntoView({ behavior: CV.reduced() ? 'auto' : 'smooth' }); var h = secs[i].querySelector('h2'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); } }
  var KEYS = [
    ['/', 'Search the report', function () { CV.openSearch && CV.openSearch(); }],
    ['j', 'Next section', function () { jump(1); }],
    ['k', 'Previous section', function () { jump(-1); }],
    ['p', 'Open my plan', function () { CV.plan && CV.plan.open(); }],
    ['c', 'Two-minute exposure check', function () { CV.openCheck && CV.openCheck(); }],
    ['g', 'Glossary', function () { CV.openGlossary && CV.openGlossary(); }],
    ['n', 'My highlights and notes', function () { CV.openNotes && CV.openNotes(); }],
    ['m', 'My progress', function () { CV.openProgress && CV.openProgress(); }],
    ['f', 'Focus mode', null],
    ['?', 'This list', function () { d.open(); }]
  ];
  var d = CV.dialog({ id: 'keys', title: 'Keyboard shortcuts', note: 'Shortcuts work when you’re not typing in a box.' });
  d.body.appendChild(CV.h('dl', { class: 'ks' }, KEYS.map(function (k) { return CV.h('div', null, CV.h('dt', null, CV.h('kbd', null, k[0].toUpperCase())), CV.h('dd', null, k[1])); })));
  document.addEventListener('keydown', function (e) {
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable || e.ctrlKey || e.metaKey || e.altKey) return;
    if (CV.$('dialog[open]') || !CV.$('.pr[hidden]') && CV.$('.pr')) return;
    var key = e.key === '?' ? '?' : e.key.toLowerCase();
    var k = KEYS.filter(function (x) { return x[0] === key && x[2]; })[0];
    if (k && key !== '/') { e.preventDefault(); k[2](); }
  });
});
