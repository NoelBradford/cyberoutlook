// @msg Team pack: one button prints the executive summary, the five things, your plan and who to call as a short pack for your team or board
// @sel #summary
CV.ready(function () {
  function print() {
    document.body.classList.add('print-pack');
    CV.$$('dialog[open]').forEach(function (d) { d.close(); });
    setTimeout(function () { window.print(); }, 60);
  }
  window.addEventListener('afterprint', function () { document.body.classList.remove('print-pack'); });
  if (CV.toolsMenu) CV.toolsMenu.add('Print a team pack', print, 'Share and print');
  var cta = CV.$('#summary .cta-card .cv-row'); if (cta) cta.appendChild(CV.button('Print a team pack', print));
  CV.printPack = print;
});
