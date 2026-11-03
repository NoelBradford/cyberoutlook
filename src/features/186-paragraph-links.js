// @msg Link to any paragraph: hover a paragraph and copy a link that opens the report with that exact passage highlighted
// @sel #theme-1
CV.ready(function () {
  // Margin items (paragraph links, sidenotes) sit beside a paragraph, not inside it, so search and read-aloud never pick them up.
  CV.margin = CV.margin || (function () {
    var items = [];
    function place() { items.forEach(function (it) { it.el.style.top = it.p.offsetTop + 'px'; }); }
    var t; function soon() { clearTimeout(t); t = setTimeout(place, 80); }
    window.addEventListener('resize', soon);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
    if ('ResizeObserver' in window) { var ro = new ResizeObserver(soon); CV.$$('main').forEach(function (m) { ro.observe(m); }); }
    return { add: function (p, el) { p.parentNode.classList.add('mg-host'); p.parentNode.insertBefore(el, p); items.push({ p: p, el: el }); soon(); }, place: place };
  })();
  var paras = CV.$$('main section .prose > p').filter(function (p) { return !p.classList.contains('listen-src') && !p.classList.contains('pq-src') && !p.closest('.cv-noprint') && CV.text(p).length > 80; });
  paras.forEach(function (p) {
    var b = CV.h('button', { type: 'button', class: 'pl-btn', 'aria-label': 'Copy a link to the paragraph that starts: ' + CV.text(p).split(' ').slice(0, 6).join(' ') }, '¶');
    b.addEventListener('click', function () {
      var c = p.cloneNode(true); CV.$$('sup, button', c).forEach(function (n) { if (n.matches('.gl-term')) n.replaceWith(document.createTextNode(n.textContent)); else n.parentNode.removeChild(n); });
      var words = CV.text(c).split(' ').filter(Boolean);
      var enc = function (s) { return encodeURIComponent(s).replace(/-/g, '%2D').replace(/,/g, '%2C'); };
      var sec = p.closest('section[id]');
      CV.copy(CV.SITE + '#' + (sec ? sec.id : '') + ':~:text=' + enc(words.slice(0, 5).join(' ')) + ',' + enc(words.slice(-4).join(' ')), 'Link to this paragraph copied');
    });
    p.classList.add('pl-p');
    CV.margin.add(p, b);
  });
});
