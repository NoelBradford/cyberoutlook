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
  return { dialog: el, body: body, open: function () { el.hidden = false; }, close: function () {} };
};
