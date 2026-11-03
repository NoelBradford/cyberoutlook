// @msg Cleaner cover: the crowded toolbar becomes three main actions plus one tidy Tools menu that groups everything else
// @sel .cover
CV.ready(function () {
  var bar = CV.$('.cover .tools'); if (!bar) return;
  var keep = ['My plan', 'Share', 'Search'];
  var buttons = CV.$$('.tool, .theme-toggle', bar);
  var menuItems = [];
  buttons.forEach(function (b) {
    var label = CV.text(b).replace(/\s*\d+$/, '').replace(/\s*\/$/, '').trim();
    if (b.id === 'themeToggle') return;
    if (keep.some(function (k) { return label.indexOf(k) === 0; })) return;
    menuItems.push({ el: b, label: b.getAttribute('aria-label') && b.textContent.trim() === 'Aa' ? 'Reading settings' : label });
  });
  var GROUPS = { 'My progress': 'Your work', 'My notes': 'Your work', 'Short version': 'Reading', 'Focus': 'Reading', 'Reading settings': 'Reading', 'Copy link': 'Share and print', 'Print or save PDF': 'Share and print' };
  var btn = CV.h('button', { type: 'button', class: 'tool tm-btn', 'aria-haspopup': 'true', 'aria-expanded': 'false', 'aria-controls': 'tools-menu' }, 'Tools ', CV.h('span', { 'aria-hidden': 'true' }, '▾'));
  var menu = CV.h('div', { class: 'tm', id: 'tools-menu', role: 'menu', hidden: true, 'aria-label': 'Tools' });
  var groups = {};
  menuItems.forEach(function (m) {
    var g = GROUPS[m.label] || 'More';
    if (!groups[g]) { groups[g] = CV.h('div', { class: 'tm-g', role: 'group', 'aria-label': g }, CV.h('p', { class: 'tm-h', 'aria-hidden': 'true' }, g)); }
    var item = CV.h('button', { type: 'button', role: 'menuitem', class: 'tm-i' }, m.label);
    var pressed = m.el.getAttribute('aria-pressed'); if (pressed != null) item.setAttribute('aria-checked', pressed), item.setAttribute('role', 'menuitemcheckbox');
    var badge = m.el.querySelector('.plan-count'); if (badge) item.appendChild(CV.h('span', { class: 'tm-n' }, badge.textContent));
    item.addEventListener('click', function () { close(); m.el.click(); });
    groups[g].appendChild(item); m.item = item;
    m.el.classList.add('tm-moved');
  });
  ['Your work', 'Reading', 'Share and print', 'More'].forEach(function (g) { if (groups[g]) menu.appendChild(groups[g]); });
  CV.addTool(btn);
  btn.after(menu);
  function items() { return CV.$$('[role^="menuitem"]', menu); }
  function open() { menuItems.forEach(function (m) { var p = m.el.getAttribute('aria-pressed'); var it = m.item; if (it && p != null) it.setAttribute('aria-checked', p); var bd = m.el.querySelector('.plan-count'), tn = it && it.querySelector('.tm-n'); if (bd && tn) { tn.textContent = bd.textContent; tn.classList.toggle('zero', bd.textContent === '0'); } }); menu.hidden = false; btn.setAttribute('aria-expanded', 'true'); items()[0].focus(); }
  function close(refocus) { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); if (refocus) btn.focus(); }
  btn.addEventListener('click', function () { if (menu.hidden) open(); else close(); });
  menu.addEventListener('keydown', function (e) {
    var it = items(), i = it.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); it[(i + 1) % it.length].focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); it[(i - 1 + it.length) % it.length].focus(); }
    if (e.key === 'Home') { e.preventDefault(); it[0].focus(); }
    if (e.key === 'End') { e.preventDefault(); it[it.length - 1].focus(); }
    if (e.key === 'Escape' || e.key === 'Tab') close(e.key === 'Escape');
  });
  document.addEventListener('click', function (e) { if (!menu.hidden && !menu.contains(e.target) && e.target !== btn && !btn.contains(e.target)) close(); });
  CV.toolsMenu = { add: function (label, fn, group) { var g = group || 'More'; if (!groups[g]) { groups[g] = CV.h('div', { class: 'tm-g', role: 'group', 'aria-label': g }, CV.h('p', { class: 'tm-h', 'aria-hidden': 'true' }, g)); menu.appendChild(groups[g]); } var it = CV.h('button', { type: 'button', role: 'menuitem', class: 'tm-i' }, label); it.addEventListener('click', function () { close(); fn(); }); groups[g].appendChild(it); return it; } };
  // Glossary and shortcuts have no toolbar button yet; give them a home.
  if (CV.openGlossary) CV.toolsMenu.add('Glossary', CV.openGlossary, 'Reading');
  CV.toolsMenu.add('Keyboard shortcuts', function () { var d = document.getElementById('keys'); if (d) d.showModal(); }, 'More');
  if (CV.openForecasts) CV.toolsMenu.add('All the forecasts', CV.openForecasts, 'Reading');
  if (CV.present) CV.toolsMenu.add('Present to my team', CV.present, 'Share and print');
});
