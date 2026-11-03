// @msg Highlights and notes: highlight any passage, add a note, and export everything you marked as your own briefing
// @sel #foreword
CV.ready(function () {
  var pop = CV.$('.sq'); if (!pop) return;
  var hl = CV.h('button', { type: 'button', class: 'sq-b sq-hl' }, 'Highlight');
  pop.insertBefore(hl, pop.firstChild);
  var marks = CV.store.get('marks', []);
  var paras = CV.$$('main .prose p, main .prose li, main .call p, main .example p');
  function keyOf(el) { return paras.indexOf(el); }
  function paint() {
    CV.$$('mark.cv-hl').forEach(function (m) { var p = m.parentNode; while (m.firstChild) p.insertBefore(m.firstChild, m); p.removeChild(m); p.normalize(); });
    marks.forEach(function (mk, i) {
      var el = paras[mk.p]; if (!el) return;
      var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), n;
      while ((n = walker.nextNode())) {
        var at = n.nodeValue.indexOf(mk.q.slice(0, 40)); if (at < 0) continue;
        var len = Math.min(mk.q.length, n.nodeValue.length - at);
        var r = document.createRange(); r.setStart(n, at); r.setEnd(n, at + len);
        var m = CV.h('mark', { class: 'cv-hl' + (mk.note ? ' has-note' : ''), 'data-i': String(i), title: mk.note || 'Highlighted' });
        try { r.surroundContents(m); } catch (e) {}
        break;
      }
    });
    badge();
  }
  function save() { CV.store.set('marks', marks); paint(); }
  var sel = null;
  document.addEventListener('mouseup', function () { var s = window.getSelection(); if (s && !s.isCollapsed && s.rangeCount) sel = s.getRangeAt(0).cloneRange(); });
  hl.addEventListener('click', function () {
    if (!sel) return;
    var node = sel.startContainer.nodeType === 1 ? sel.startContainer : sel.startContainer.parentNode;
    var el = paras.filter(function (p) { return p.contains(node); })[0];
    if (!el) { CV.toast('Highlight within one paragraph at a time'); return; }
    var q = sel.toString().replace(/\s+/g, ' ').trim(); if (q.length < 3) return;
    var sec = el.closest('section'); marks.push({ p: keyOf(el), q: q, sec: sec ? CV.text(sec.querySelector('h2')).replace(/#$/, '').trim() : '', at: Date.now() });
    window.getSelection().removeAllRanges(); pop.hidden = true; save(); CV.toast('Highlighted. Find it in My notes');
  });
  // Notes panel
  var d = CV.dialog({ id: 'notes', title: 'My highlights and notes', wide: true, note: 'Kept in this browser only.', onopen: render });
  function render() {
    var b = d.body; b.innerHTML = '';
    if (!marks.length) { b.appendChild(CV.h('p', null, 'Select any passage in the report and choose Highlight. Your highlights and notes collect here.')); return; }
    var ul = CV.h('ul', { class: 'nt-list' });
    marks.forEach(function (mk, i) {
      var ta = CV.h('textarea', { class: 'cv-input nt-note', placeholder: 'Add a note: what will you do about this?', 'aria-label': 'Note for highlight ' + (i + 1) }); ta.value = mk.note || '';
      ta.addEventListener('change', function () { mk.note = ta.value.trim(); save(); });
      ul.appendChild(CV.h('li', null, CV.h('p', { class: 'cv-kicker' }, mk.sec), CV.h('blockquote', null, mk.q), ta,
        CV.h('div', { class: 'cv-row' }, CV.button('Go to it', function () { d.close(); var m = CV.$('mark.cv-hl[data-i="' + i + '"]'); if (m) m.scrollIntoView({ block: 'center', behavior: CV.reduced() ? 'auto' : 'smooth' }); }), CV.button('Remove', function () { marks.splice(i, 1); save(); render(); }))));
    });
    b.appendChild(ul);
    var text = function () { return 'MY NOTES: ' + CV.TITLE + '\n' + CV.SITE + '\n\n' + marks.map(function (m) { return '— ' + m.sec + '\n“' + m.q + '”' + (m.note ? '\nNote: ' + m.note : ''); }).join('\n\n'); };
    b.appendChild(CV.h('div', { class: 'cv-row' }, CV.button('Copy all', function () { CV.copy(text(), 'Notes copied'); }, 'primary'), CV.button('Download', function () { CV.download('my-cyber-outlook-notes.txt', 'text/plain', text()); })));
  }
  var tool = CV.h('button', { type: 'button', class: 'tool notes-tool', onclick: function () { d.open(); } }, 'My notes ', CV.h('span', { class: 'plan-count' }, '0'));
  function badge() { tool.querySelector('.plan-count').textContent = marks.length; }
  CV.addTool(tool);
  document.addEventListener('click', function (e) { var m = e.target.closest && e.target.closest('mark.cv-hl'); if (m && !window.getSelection().toString()) d.open(); });
  CV.openNotes = function () { d.open(); };
  paint();
});
