// @msg "It's happening now" mode: one tap turns your one-page plan into a calm, full-screen incident card with tap-to-call contacts and a timestamped log
// @sel #mvc
CV.ready(function () {
  var rows = CV.$$('.a4 tbody tr'); if (!rows.length) return;
  function contacts() {
    var saved = {}; try { saved = JSON.parse(localStorage.getItem('cv-plan-contacts') || '{}'); } catch (e) {}
    var cells = CV.$$('.a4 td.fill');
    return rows.map(function (tr) { var c = tr.children, fill = tr.querySelector('td.fill'), idx = cells.indexOf(fill); var who = CV.text(c[1]); var mine = idx > -1 && saved[idx] ? saved[idx] : ''; var num = (mine.match(/(\+?\d[\d\s]{7,}\d)/) || who.match(/(0\d{3} \d{3} \d{4})/) || [])[1]; return { n: CV.text(c[0]), who: who, when: CV.text(c[2]), mine: mine, tel: num ? num.replace(/\s/g, '') : '' }; });
  }
  var log = CV.store.get('inclog', []);
  var el = CV.h('div', { class: 'inc', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'inc-h', hidden: true });
  document.body.appendChild(el);
  function stamp() { var d = new Date(); return d.toLocaleDateString('en-GB') + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); }
  function add(t) { log.push({ t: stamp(), x: t }); CV.store.set('inclog', log); render(); }
  function render() {
    el.innerHTML = '';
    var close = CV.h('button', { type: 'button', class: 'inc-x', 'aria-label': 'Close incident mode' }, '×');
    close.addEventListener('click', shut);
    el.appendChild(CV.h('div', { class: 'inc-head' }, CV.h('div', null, CV.h('p', { class: 'inc-k' }, 'Incident mode'), CV.h('h2', { id: 'inc-h' }, 'Stay calm. Work down the list.')), close));
    var ol = CV.h('ol', { class: 'inc-list' });
    contacts().forEach(function (c) {
      ol.appendChild(CV.h('li', null, CV.h('span', { class: 'inc-n' }, c.n), CV.h('div', { class: 'inc-m' }, CV.h('b', null, c.who), CV.h('span', null, c.when), c.mine ? CV.h('span', { class: 'inc-mine' }, c.mine) : CV.h('span', { class: 'inc-miss' }, 'No contact saved yet')),
        c.tel ? CV.h('a', { class: 'inc-call', href: 'tel:' + c.tel, onclick: function () { add('Called ' + c.who); } }, 'Call') : CV.button('Done', function () { add('Contacted ' + c.who); })));
    });
    el.appendChild(ol);
    var note = CV.h('input', { type: 'text', class: 'cv-input', placeholder: 'What just happened? e.g. "Bank confirmed payment stopped"', 'aria-label': 'Add to the incident log' });
    note.addEventListener('keydown', function (e) { if (e.key === 'Enter' && note.value.trim()) { add(note.value.trim()); } });
    el.appendChild(CV.h('div', { class: 'inc-log' }, CV.h('p', { class: 'inc-k' }, 'Incident log'), CV.h('div', { class: 'inc-add' }, note, CV.button('Add', function () { if (note.value.trim()) add(note.value.trim()); }, 'primary')),
      log.length ? CV.h('ul', null, log.slice().reverse().map(function (l) { return CV.h('li', null, CV.h('time', null, l.t), ' ', l.x); })) : CV.h('p', { class: 'inc-miss' }, 'Everything you add is time-stamped. Your insurer and the ICO may ask for this.'),
      CV.h('div', { class: 'cv-row' }, log.length ? CV.button('Download the log', function () { CV.download('incident-log.txt', 'text/plain', 'INCIDENT LOG\n\n' + log.map(function (l) { return l.t + '  ' + l.x; }).join('\n')); }) : null, log.length ? CV.button('Clear the log', function () { log = []; CV.store.set('inclog', log); render(); }) : null)));
    setTimeout(function () { (CV.$('.inc-call', el) || close).focus(); }, 30);
  }
  var last;
  function open() { last = document.activeElement; render(); el.hidden = false; document.documentElement.classList.add('cv-modal-open'); if (!log.length) add('Incident mode opened'); }
  function shut() { el.hidden = true; document.documentElement.classList.remove('cv-modal-open'); if (last) last.focus(); }
  document.addEventListener('keydown', function (e) { if (!el.hidden && e.key === 'Escape') shut(); });
  CV.openIncident = open;
  var tools = CV.$('.plan-tools'); if (tools) tools.insertBefore(CV.button('It’s happening now', open, 'inc-btn'), tools.firstChild);
  if (CV.toolsMenu) CV.toolsMenu.add('It’s happening now', open, 'Your work');
});
