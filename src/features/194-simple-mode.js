// @msg Simple mode: one switch hides every interactive extra (tools, prompts, badges, animations) for readers who just want the report
// @sel #start
CV.ready(function () {
  var on = CV.store.get('simple', false);
  function set(v, quiet) {
    on = v; CV.store.set('simple', v);
    document.documentElement.classList.toggle('simple', v);
    if (item) item.setAttribute('aria-checked', v ? 'true' : 'false');
    if (!quiet) CV.toast(v ? 'Simple mode on: just the report' : 'All the tools are back');
    CV.$$('.sm-exit').forEach(function (b) { b.hidden = !v; });
  }
  var item = CV.toolsMenu ? CV.toolsMenu.add('Simple mode (just the report)', function () { set(!on); }, 'Reading') : null;
  if (item) item.setAttribute('role', 'menuitemcheckbox');
  var exit = CV.h('button', { type: 'button', class: 'tool sm-exit', hidden: true, onclick: function () { set(false); } }, 'Show the tools');
  CV.addTool(exit, true);
  var line = CV.$('.start-head'); if (line) line.appendChild(CV.h('button', { type: 'button', class: 'sm-link', onclick: function () { set(true); } }, 'Just want to read? Switch to simple mode'));
  set(on, true);
});
