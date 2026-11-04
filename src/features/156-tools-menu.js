// @msg Cleaner cover: the crowded toolbar becomes three main actions plus one short Tools menu (eight items, with "It's happening now" first); everything else lives in the Toolkit
// @sel .cover
CV.ready(function () {
  var bar = CV.$('.cover .tools'); if (!bar) return;
  var keep = ['My plan', 'Share', 'Search'];
  // The menu is deliberately short. Anything not listed here is either in the Toolkit or reachable from where it's used.
  var MENU = { 'It’s happening now': 'In an incident', 'All tools': 'Your work', 'Your data': 'Your work',
    'Listen from here': 'Reading', 'Simple mode (just the report)': 'Reading', 'Reading settings': 'Reading', 'Glossary': 'Reading', 'Download the full PDF': 'Save' };
  var TOOLKIT = { 'Print a team pack': 'One copy per person: the five things, the call-back rule and who to call.',
    'Print my toolkit': 'Everything you have filled in, printed together.', 'Present to my team': 'The report as slides for a short team meeting.',
    'Calendar reminders': 'Every date from your plan and the report, as calendar reminders.' };
  CV.toolkitExtras = CV.toolkitExtras || [];
  var ORDER = ['In an incident', 'Your work', 'Reading', 'Save'];
  var btn = CV.h('button', { type: 'button', class: 'tool tm-btn', 'aria-haspopup': 'true', 'aria-expanded': 'false', 'aria-controls': 'tools-menu' }, 'Tools ', CV.h('span', { 'aria-hidden': 'true' }, '▾'));
  var menu = CV.h('div', { class: 'tm', id: 'tools-menu', role: 'menu', hidden: true, 'aria-label': 'Tools' });
  var groups = {};
  ORDER.forEach(function (g) { groups[g] = CV.h('div', { class: 'tm-g', role: 'group', 'aria-label': g }, CV.h('p', { class: 'tm-h', 'aria-hidden': 'true' }, g)); menu.appendChild(groups[g]); });
  var menuItems = [];
  function add(label, fn, src) {
    if (TOOLKIT[label]) { CV.toolkitExtras.push({ title: label, sub: TOOLKIT[label], fn: fn }); return null; }
    if (!MENU[label]) return null;
    var item = CV.h('button', { type: 'button', role: 'menuitem', class: 'tm-i' }, label);
    item.addEventListener('click', function () { close(); fn(); });
    groups[MENU[label]].appendChild(item);
    if (src) menuItems.push({ el: src, item: item });
    return item;
  }
  CV.$$('.tool, .theme-toggle', bar).forEach(function (b) {
    var label = CV.text(b).replace(/\s*\d+$/, '').replace(/\s*\/$/, '').trim();
    if (b.id === 'themeToggle') return;
    if (keep.some(function (k) { return label.indexOf(k) === 0; })) return;
    if (b.getAttribute('aria-label') && b.textContent.trim() === 'Aa') label = 'Reading settings';
    b.classList.add('tm-moved');
    var item = add(label, function () { b.click(); }, b);
    var pressed = b.getAttribute('aria-pressed'); if (item && pressed != null) { item.setAttribute('aria-checked', pressed); item.setAttribute('role', 'menuitemcheckbox'); }
  });
  CV.addTool(btn);
  btn.after(menu);
  function items() { return CV.$$('[role^="menuitem"]', menu); }
  function open() {
    menuItems.forEach(function (m) { var p = m.el.getAttribute('aria-pressed'); if (p != null) m.item.setAttribute('aria-checked', p); });
    ORDER.forEach(function (g) { groups[g].hidden = !groups[g].querySelector('[role^="menuitem"]'); });
    menu.hidden = false; btn.setAttribute('aria-expanded', 'true'); items()[0].focus();
  }
  function close(refocus) { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); if (refocus) btn.focus(); }
  btn.addEventListener('click', function () { if (menu.hidden) open(); else close(); });
  menu.addEventListener('keydown', function (e) {
    var it = items(), i = it.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); it[(i + 1) % it.length].focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); it[(i - 1 + it.length) % it.length].focus(); }
    if (e.key === 'Home') { e.preventDefault(); it[0].focus(); }
    if (e.key === 'End') { e.preventDefault(); it[it.length - 1].focus(); }
    // Escape returns focus to the Tools button; stop it reaching the page-level shortcuts too.
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true); }
    if (e.key === 'Tab') close();
  });
  document.addEventListener('click', function (e) { if (!menu.hidden && !menu.contains(e.target) && e.target !== btn && !btn.contains(e.target)) close(); });
  CV.toolsMenu = { add: function (label, fn) { return add(label, fn); } };
  if (CV.openGlossary) add('Glossary', CV.openGlossary);
  if (CV.present) add('Present to my team', CV.present);
  add('All tools', function () { CV.openToolkit && CV.openToolkit(); });
  add('Listen from here', function () { if (CV.listenHere) CV.listenHere(); else CV.toast('Your browser can’t read aloud'); });
});
