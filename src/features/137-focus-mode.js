// @msg Focus mode: hide the contents, toolbars and tools, centre the text, and just read (press F to toggle)
// @sel #foreword
CV.ready(function () {
  var on = false;
  var exit = CV.h('button', { type: 'button', class: 'fm-exit', hidden: true }, 'Exit focus mode');
  document.body.appendChild(exit);
  function set(v) {
    on = v; document.body.classList.toggle('focus-mode', v); exit.hidden = !v;
    btn.setAttribute('aria-pressed', v ? 'true' : 'false');
    if (v) CV.toast('Focus mode. Press F or Esc to leave');
  }
  var btn = CV.h('button', { type: 'button', class: 'tool', 'aria-pressed': 'false', 'aria-keyshortcuts': 'f', onclick: function () { set(!on); } }, 'Focus');
  CV.addTool(btn);
  exit.addEventListener('click', function () { set(false); });
  document.addEventListener('keydown', function (e) {
    var tag = (e.target.tagName || '').toLowerCase(); if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'f' || e.key === 'F') { if (CV.$('dialog[open]')) return; set(!on); }
    if (e.key === 'Escape' && on && !CV.$('dialog[open]')) set(false);
  });
  CV.setFocusMode = set;
});
