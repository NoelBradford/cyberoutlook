// @msg The line people remember: Noel's sign-off becomes a full-width pull quote you can share as an image or a post
// @sel .pq
CV.ready(function () {
  var p = CV.$$('#foreword .prose p').filter(function (x) { return /stupidity always is/.test(x.textContent); })[0]; if (!p) return;
  var q = CV.text(p);
  var share = CV.button('Share this line', function () {
    var c = document.createElement('canvas'); c.width = 1200; c.height = 1200; var x = c.getContext('2d');
    x.fillStyle = '#0e161b'; x.fillRect(0, 0, 1200, 1200);
    x.fillStyle = '#e6b043'; x.font = '700 260px "Barlow Condensed", sans-serif'; x.fillText('“', 90, 330);
    x.fillStyle = '#e2e9e9'; x.font = '700 96px "Barlow Condensed", "Arial Narrow", sans-serif';
    var words = q.toUpperCase().split(' '), line = '', y = 470, lines = [];
    words.forEach(function (w) { var t = line ? line + ' ' + w : w; if (x.measureText(t).width > 1000 && line) { lines.push(line); line = w; } else line = t; }); lines.push(line);
    lines.forEach(function (l, i) { x.fillText(l, 100, y + i * 104); });
    x.fillStyle = '#62b8b5'; x.font = '600 36px "IBM Plex Sans", sans-serif'; x.fillText('Noel Bradford · UK Small Business Cyber Outlook 2027', 100, 1060);
    x.fillStyle = '#9aa9ae'; x.font = '500 30px "IBM Plex Sans", sans-serif'; x.fillText('cyberoutlook.sbcsg.uk', 100, 1110);
    document.fonts.ready.then(function () { c.toBlob(function (b) { CV.download('good-security-quote.png', 'image/png', b); }); });
    CV.copy('“' + q + '” — Noel Bradford, ' + CV.TITLE + '\n' + CV.SITE, 'Image saved and quote copied');
  }, 'primary');
  var fig = CV.h('figure', { class: 'pq' }, CV.h('blockquote', null, CV.h('p', null, q)), CV.h('figcaption', null, 'Noel Bradford'), CV.h('div', { class: 'cv-row cv-noprint' }, share));
  p.classList.add('pq-src'); p.setAttribute('aria-hidden', 'true');
  p.after(fig);
});
