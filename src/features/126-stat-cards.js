// @msg Shareable stat cards: turn any figure in "The year in numbers" into a branded image for LinkedIn
// @sel #numbers .stats
CV.ready(function () {
  var stats = CV.$$('#numbers .stat'); if (!stats.length) return;
  var logo = CV.$('.brand');
  function wrap(ctx, text, x, y, maxW, lh) {
    var words = text.split(' '), line = '', lines = [];
    words.forEach(function (w) { var t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; });
    if (line) lines.push(line);
    lines.forEach(function (l, i) { ctx.fillText(l, x, y + i * lh); });
    return lines.length;
  }
  function render(n, label, src) {
    var c = document.createElement('canvas'); c.width = 1200; c.height = 1200; var x = c.getContext('2d');
    x.fillStyle = '#0e161b'; x.fillRect(0, 0, 1200, 1200);
    x.strokeStyle = 'rgba(98,184,181,0.35)'; x.lineWidth = 3;
    for (var k = 0; k < 4; k++) { x.beginPath(); x.moveTo(0, 940 + k * 40); x.bezierCurveTo(300, 880 + k * 40, 600, 1000 + k * 40, 1200, 900 + k * 40); x.stroke(); }
    x.strokeStyle = '#e6b043'; x.beginPath(); x.moveTo(0, 900); x.bezierCurveTo(300, 840, 600, 960, 1200, 860); x.stroke();
    x.fillStyle = '#e6b043'; x.font = '600 30px "IBM Plex Sans", sans-serif'; x.fillText('UK SMALL BUSINESS CYBER OUTLOOK 2027', 90, 130);
    x.fillStyle = '#e2e9e9'; x.font = '700 320px "Barlow Condensed", "Arial Narrow", sans-serif'; x.fillText(n, 80, 470);
    x.font = '400 54px "Source Serif 4", Georgia, serif'; var lines = wrap(x, label, 90, 580, 1000, 70);
    x.fillStyle = '#9aa9ae'; x.font = '500 28px "IBM Plex Sans", sans-serif'; x.fillText('Source: ' + src, 90, 600 + lines * 70 + 10);
    x.fillStyle = '#62b8b5'; x.font = '600 34px "IBM Plex Sans", sans-serif'; x.fillText('cyberoutlook.sbcsg.uk', 90, 1110);
    if (logo && logo.complete) { try { x.drawImage(logo, 1200 - 90 - 150, 1110 - 120, 150, 150); } catch (e) {} }
    return c;
  }
  var d = CV.dialog({ id: 'statcard', title: 'Share this figure', note: 'The image is made in your browser. The figure and source are exactly as in the report.' });
  var img = CV.h('img', { class: 'sc-img', alt: '' });
  var cur;
  d.body.appendChild(img);
  d.body.appendChild(CV.h('div', { class: 'cv-row' },
    CV.button('Download image', function () { cur.c.toBlob(function (b) { CV.download('cyber-outlook-' + CV.slug(cur.n) + '.png', 'image/png', b); }); }, 'primary'),
    CV.button('Copy post text', function () { CV.copy(cur.n + ' ' + cur.label + '\n\nSource: ' + cur.src + ', via the ' + CV.TITLE + ' by Noel Bradford.\n\n' + CV.SITE, 'Post text copied'); })));
  stats.forEach(function (st) {
    var n = CV.text(st.querySelector('.n')), l = CV.text(st.querySelector('.l')), s = CV.text(st.querySelector('.s')).replace(/\s*\[\d+\]/g, '').replace(/\s*;\s*/g, '; ').replace(/\bCSBS\b/g, 'Cyber Security Breaches Survey').trim();
    var b = CV.h('button', { type: 'button', class: 'sc-btn', 'aria-label': 'Share this figure: ' + n + ' ' + l }, 'Share');
    b.addEventListener('click', function () {
      document.fonts.ready.then(function () { var c = render(n, l, s); cur = { c: c, n: n, label: l, src: s }; img.src = c.toDataURL('image/png'); img.alt = n + ' ' + l; d.open(); });
    });
    st.appendChild(b);
  });
});
