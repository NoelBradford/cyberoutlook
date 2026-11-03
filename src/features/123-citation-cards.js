// @msg Citation cards: hover, tap or focus a citation to see the source, its date and type, without leaving your place
// @sel #theme-1
CV.ready(function () {
  var card = CV.h('div', { class: 'cite-card', role: 'tooltip', id: 'cite-card', hidden: true });
  document.body.appendChild(card);
  var hideT, current;
  function kind(t) {
    if (/podcast|blog/i.test(t)) return 'Our own episode or article';
    if (/^(Department|National Cyber|Information Commissioner|UK Parliament|City of London Police)/.test(t)) return 'Official source';
    if (/IASME/.test(t)) return 'Certification body';
    if (/arXiv|Willison/.test(t)) return 'Research';
    return 'Press or industry report';
  }
  function build(a) {
    var li = document.getElementById(a.getAttribute('href').slice(1)); if (!li) return false;
    var clone = li.cloneNode(true); CV.$$('.backrefs', clone).forEach(function (n) { n.remove(); });
    var link = clone.querySelector('a[href^="http"]'), url = link ? link.href : '';
    if (link) link.remove();
    var vendor = !!clone.querySelector('.flag'); CV.$$('.flag', clone).forEach(function (n) { n.remove(); });
    var t = CV.text(clone).replace(/\s*\.?\s*$/, '');
    card.innerHTML = '';
    card.appendChild(CV.h('p', { class: 'cc-k' }, 'Source ' + li.id.slice(1) + ' · ' + kind(t) + (vendor ? ' · vendor figure' : '')));
    card.appendChild(CV.h('p', { class: 'cc-t' }, t));
    if (url) card.appendChild(CV.h('p', { class: 'cc-u' }, url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]));
    return true;
  }
  function place(a) {
    var r = a.getBoundingClientRect(), w = Math.min(340, window.innerWidth - 32);
    card.style.width = w + 'px';
    var x = Math.max(16, Math.min(window.innerWidth - w - 16, r.left + r.width / 2 - w / 2));
    card.hidden = false;
    var ch = card.offsetHeight, y = r.top - ch - 10 < 8 ? r.bottom + 10 : r.top - ch - 10;
    card.style.left = x + 'px'; card.style.top = y + 'px';
  }
  function show(a) { clearTimeout(hideT); if (current === a && !card.hidden) return; if (!build(a)) return; current = a; a.setAttribute('aria-describedby', 'cite-card'); a.removeAttribute('title'); place(a); }
  function hide() { hideT = setTimeout(function () { card.hidden = true; if (current) current.removeAttribute('aria-describedby'); current = null; }, 120); }
  CV.$$('sup.cite a[href^="#s"]').forEach(function (a) {
    a.removeAttribute('title');
    a.addEventListener('mouseenter', function () { show(a); });
    a.addEventListener('mouseleave', hide);
    a.addEventListener('focus', function () { show(a); });
    a.addEventListener('blur', hide);
  });
  card.addEventListener('mouseenter', function () { clearTimeout(hideT); });
  card.addEventListener('mouseleave', hide);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !card.hidden) { card.hidden = true; } });
  window.addEventListener('scroll', function () { if (!card.hidden) card.hidden = true; }, { passive: true });
});
