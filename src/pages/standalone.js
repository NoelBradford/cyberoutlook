// Helpers for tool pages only. tools/build.py adds this to each tool bundle straight after the CV.standalone flag,
// and never to assets/app.js, so the report does not carry it.

// A host for a tool that opens in a dialog on the report. It has the same shape as CV.dialog (body, open, close) and the hooks
// other features look for: an element with the dialog's id, a .cv-dialog-body inside it, and close() on the element.
// opts: id, label (accessible name), note (small print under the tool).
CV.inlineHost = function (opts) {
  var el = CV.h('section', { id: opts.id, class: 'cv-inline', 'aria-label': opts.label, hidden: true });
  var body = CV.h('div', { class: 'cv-dialog-body' });
  el.appendChild(body);
  if (opts.note) el.appendChild(CV.h('p', { class: 'cv-dialog-note' }, opts.note));
  el.close = function () {};
  (CV.$('#tool-root') || document.body).appendChild(el);
  // Like CV.dialog, opening runs opts.onopen(body) first (a tool that draws itself when opened).
  return { dialog: el, body: body, open: function () { if (opts.onopen) opts.onopen(body); el.hidden = false; }, close: function () {} };
};

// Printing one generated sheet on its own. The report gets this from the call-back poster feature, which a tool page may not load.
// A feature that defines CV.printSheet itself replaces this with the same thing.
CV.printSheet = function (el) {
  CV.$$('.cv-sheet').forEach(function (n) { n.remove(); });
  el.classList.add('cv-sheet'); document.body.appendChild(el);
  document.body.classList.add('print-sheet');
  setTimeout(function () { window.print(); }, 60);
};
window.addEventListener('afterprint', function () { document.body.classList.remove('print-sheet'); });

// There is no report on this page to scroll to, so "go to this action" opens the report at it. 108-exposure-check replaces this.
CV.goToAction = function (id) { location.href = '../#act-' + id; };
