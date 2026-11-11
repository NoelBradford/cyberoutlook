// Email gate for the full report PDF and the ten-slide deck (UX-12). OFF unless the email capture is configured (see 219): then a click
// on a link to either PDF opens a short form instead of the file, and the file link is sent by email once the address is confirmed.
// With it off, the links work as they always did.
//
// IMPORTANT: this only stops the links on the page. The PDFs are still public files in the repo and on the site until they are moved to
// private storage and removed from the repo (see docs/email-platform-design.md). It is not a real gate until then.
CV.ready(function () {
  if (!CV.capture || !CV.capture.enabled) return;
  var FILES = { 'assets/UK-Small-Business-Cyber-Outlook-2027.pdf': 'report', 'linkedin/CyberOutlook2027_LinkedIn_Carousel.pdf': 'deck' };
  var LABEL = { report: 'the full report (PDF)', deck: 'the ten-slide summary (PDF)' };
  function open(file) {
    var d = CV.dialog({ id: 'gate-' + file, title: 'Get ' + LABEL[file], note: 'We email you a link, which works once for a few minutes. Joining the newsletter or the update list is your choice and is not needed for the download.' });
    d.body.appendChild(CV.h('p', { class: 'cap-gate-intro' }, 'Enter your email address and we will send you a link to confirm it. Then you can download ' + LABEL[file] + '.'));
    d.body.appendChild(CV.capture.form({ source: '/', topics: ['download'], files: [file], button: 'Email me the link', sends: 'your address and which file you asked for.' }));
    d.open();
    var e = d.body.querySelector('input[type=email]'); if (e) e.focus();
  }
  CV.gate = { open: open };
  // Any link to either file, wherever it is on the page (the cover, the Tools menu, the Share hub), including a click made by script.
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
    var path = (a.getAttribute('href') || '').replace(/^\.?\//, '').split(/[?#]/)[0];
    if (!FILES[path]) return;
    e.preventDefault(); e.stopPropagation();
    open(FILES[path]);
  }, true);
});
