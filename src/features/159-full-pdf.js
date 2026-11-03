// Full-report PDF: offer it in the Tools menu and the share hub too.
CV.ready(function () {
  var href = 'assets/UK-Small-Business-Cyber-Outlook-2027.pdf';
  function get() { var a = CV.h('a', { href: href, download: '' }); document.body.appendChild(a); a.click(); a.remove(); }
  if (CV.toolsMenu) CV.toolsMenu.add('Download the full PDF', get, 'Share and print');
  var share = document.getElementById('share');
  if (share) { var row = share.querySelector('.cv-dialog-body > .cv-row:last-child'); if (row) row.appendChild(CV.h('a', { class: 'tool', href: href, download: '' }, 'Full report (PDF)')); }
});
