// @msg Share a quote: select any sentence to post it to LinkedIn or copy it with a link straight back to that spot
// @sel #foreword
CV.ready(function () {
  var pop = CV.h('div', { class: 'sq', role: 'toolbar', 'aria-label': 'Share this quote', hidden: true });
  var li = CV.h('button', { type: 'button', class: 'sq-b' }, 'Post on LinkedIn');
  var cp = CV.h('button', { type: 'button', class: 'sq-b' }, 'Copy quote');
  pop.appendChild(li); pop.appendChild(cp); document.body.appendChild(pop);
  var quote = '';
  function link() {
    var words = quote.split(/\s+/); var frag = words.length > 8 ? encodeURIComponent(words.slice(0, 4).join(' ')) + ',' + encodeURIComponent(words.slice(-4).join(' ')) : encodeURIComponent(quote);
    return CV.SITE + '#:~:text=' + frag.replace(/-/g, '%2D');
  }
  function update() {
    var sel = window.getSelection(); if (!sel || sel.isCollapsed || !sel.rangeCount) { pop.hidden = true; return; }
    var r = sel.getRangeAt(0), node = r.commonAncestorContainer; node = node.nodeType === 1 ? node : node.parentNode;
    if (!node.closest || !node.closest('main') || node.closest('input,textarea,dialog,table,.cv-dialog')) { pop.hidden = true; return; }
    quote = sel.toString().replace(/\s+/g, ' ').replace(/\[\d+\]/g, '').trim();
    if (quote.length < 20 || quote.length > 600) { pop.hidden = true; return; }
    var rect = r.getBoundingClientRect(); pop.hidden = false;
    var w = pop.offsetWidth, x = Math.max(12, Math.min(window.innerWidth - w - 12, rect.left + rect.width / 2 - w / 2));
    var y = rect.top - pop.offsetHeight - 10; if (y < 10) y = rect.bottom + 10;
    pop.style.left = x + 'px'; pop.style.top = y + 'px';
  }
  document.addEventListener('mouseup', function () { setTimeout(update, 10); });
  document.addEventListener('keyup', function (e) { if (e.shiftKey || e.key === 'Shift') update(); });
  document.addEventListener('selectionchange', function () { var s = window.getSelection(); if (!s || s.isCollapsed) pop.hidden = true; });
  window.addEventListener('scroll', function () { pop.hidden = true; }, { passive: true });
  pop.addEventListener('mousedown', function (e) { e.preventDefault(); });
  cp.addEventListener('click', function () { CV.copy('“' + quote + '”\n— Noel Bradford, ' + CV.TITLE + '\n' + link(), 'Quote copied with a link'); pop.hidden = true; });
  li.addEventListener('click', function () {
    var text = '“' + quote + '”\n\nFrom the ' + CV.TITLE + ' by Noel Bradford: ' + CV.SITE;
    CV.copy(text, 'Quote copied. Paste it into your LinkedIn post');
    window.open('https://www.linkedin.com/feed/?shareActive=true&text=' + encodeURIComponent(text), '_blank', 'noopener');
    pop.hidden = true;
  });
});
