// @msg Share a forecast: every "Our call" can be posted as a branded image card, with your own agree or disagree added to the post text
// @sel #theme-1 .call
CV.ready(function () {
  var calls = CV.$$('main aside.call').filter(function (a) { return !/Example/i.test(a.getAttribute('aria-label') || ''); });
  function card(title, body, theme) {
    var c = document.createElement('canvas'); c.width = 1200; c.height = 1200; var x = c.getContext('2d');
    x.fillStyle = '#0e161b'; x.fillRect(0, 0, 1200, 1200); x.fillStyle = '#e6b043'; x.fillRect(0, 0, 16, 1200);
    x.font = '600 30px "IBM Plex Sans", sans-serif'; x.fillText('OUR CALL FOR 2027 · ' + theme.toUpperCase(), 90, 140);
    function wrap(t, font, color, y, lh, maxLines) { x.font = font; x.fillStyle = color; var w = t.split(' '), line = '', n = 0; for (var i = 0; i < w.length; i++) { var test = line ? line + ' ' + w[i] : w[i]; if (x.measureText(test).width > 1020 && line) { if (n === maxLines - 1) { x.fillText(line + '…', 90, y); return y + lh; } x.fillText(line, 90, y); y += lh; n++; line = w[i]; } else line = test; } x.fillText(line, 90, y); return y + lh; }
    var y = wrap(title.toUpperCase(), '700 88px "Barlow Condensed", "Arial Narrow", sans-serif', '#e2e9e9', 270, 92, 4);
    wrap(body, '400 40px "Source Serif 4", Georgia, serif', '#c9d4d4', y + 40, 56, 7);
    x.fillStyle = '#62b8b5'; x.font = '600 32px "IBM Plex Sans", sans-serif'; x.fillText('Noel Bradford · cyberoutlook.sbcsg.uk', 90, 1120);
    return c;
  }
  calls.forEach(function (a) {
    var row = a.querySelector('.fc-vote');
    var b = CV.h('button', { type: 'button', class: 'fc-b fc-share' }, 'Share');
    b.addEventListener('click', function () {
      var title = CV.text(a.querySelector('h4')), body = CV.text(a.querySelector('p:not(.call-label)')), theme = CV.text(a.querySelector('.call-label span')) || 'Outlook';
      document.fonts.ready.then(function () {
        card(title, body, theme).toBlob(function (bl) { CV.download('our-call-' + CV.slug(title) + '.png', 'image/png', bl); });
        var votes = CV.store.get('votes', {}), v = votes[a.id];
        var mine = v === 'agree' ? 'I agree with this one.' : v === 'disagree' ? 'I’m not convinced by this one.' : v === 'unsure' ? 'Not sure about this one yet.' : '';
        CV.copy('“' + title + '”\n\nOne of Noel Bradford’s calls for 2027 in the UK Small Business Cyber Outlook. ' + mine + '\n\n' + CV.SITE + '#' + a.id, 'Image saved and post text copied');
      });
    });
    (row || a).appendChild(b);
  });
});
