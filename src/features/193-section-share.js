// @msg Share or copy a whole section: every section heading gets a small menu to copy its link, copy it as plain text for an email, or post it to LinkedIn
// @sel #theme-2
CV.ready(function () {
  CV.$$('main section.section[id]').forEach(function (sec) {
    var num = sec.querySelector('.sec-num'), h = sec.querySelector('h2'); if (!num || !h) return;
    var title = function () { return CV.text(h).replace(/#$/, '').trim(); };
    function plain() {
      var out = [title().toUpperCase(), ''];
      CV.$$('.forecast, .prose > p, .prose > h3, .prose > ul > li, .prose > ol > li, aside.call h4, aside.call p:not(.call-label)', sec).forEach(function (el) {
        if (el.closest('.cv-noprint') || el.classList.contains('listen-src') || el.classList.contains('pq-src')) return;
        var c = el.cloneNode(true); if (el.matches('.forecast')) { var sm = c.querySelector('small'); if (sm) sm.parentNode.removeChild(sm); }
        CV.$$('sup, button, .sn', c).forEach(function (n) { if (n.matches('.gl-term')) n.replaceWith(document.createTextNode(n.textContent)); else n.parentNode.removeChild(n); });
        var t = CV.text(c); if (!t) return;
        out.push(el.matches('li') ? '• ' + t : el.matches('h3, h4') ? '\n' + t.toUpperCase() : t);
      });
      out.push('', 'From the ' + CV.TITLE + ' by Noel Bradford: ' + CV.SITE + '#' + sec.id);
      return out.join('\n');
    }
    var b = CV.h('button', { type: 'button', class: 'tts-start ss-btn', 'aria-haspopup': 'true', 'aria-expanded': 'false' }, '↗ Share');
    var menu = CV.h('div', { class: 'ss-menu', role: 'menu', hidden: true },
      CV.h('button', { type: 'button', role: 'menuitem' }, 'Copy link to this section'),
      CV.h('button', { type: 'button', role: 'menuitem' }, 'Copy as plain text'),
      CV.h('button', { type: 'button', role: 'menuitem' }, 'Post on LinkedIn'));
    var items = CV.$$('button', menu);
    items[0].addEventListener('click', function () { close(); CV.copy(CV.SITE + '#' + sec.id, 'Section link copied'); });
    items[1].addEventListener('click', function () { close(); CV.copy(plain(), 'Section copied as text'); });
    items[2].addEventListener('click', function () { close(); var t = title() + ': from the ' + CV.TITLE + ' by Noel Bradford. ' + CV.SITE + '#' + sec.id; CV.copy(t, 'Post text copied'); window.open('https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(CV.SITE + '#' + sec.id), '_blank', 'noopener'); });
    function close() { menu.hidden = true; b.setAttribute('aria-expanded', 'false'); }
    b.addEventListener('click', function (e) { e.stopPropagation(); var open = menu.hidden; CV.$$('.ss-menu').forEach(function (m) { m.hidden = true; }); menu.hidden = !open; b.setAttribute('aria-expanded', open ? 'true' : 'false'); if (open) items[0].focus(); });
    menu.addEventListener('keydown', function (e) { var i = items.indexOf(document.activeElement); if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % 3].focus(); } if (e.key === 'ArrowUp') { e.preventDefault(); items[(i + 2) % 3].focus(); } if (e.key === 'Escape') { close(); b.focus(); } });
    var wrap = CV.h('span', { class: 'ss-wrap' }, b, menu);
    num.appendChild(wrap);
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('.ss-wrap')) CV.$$('.ss-menu').forEach(function (m) { m.hidden = true; }); });
});
