// @msg App bar: once you scroll past the cover, a slim bar keeps your place, plan, search and share one tap away (bottom dock on phones)
// @sel #theme-1
CV.ready(function () {
  var cover = CV.$('.cover'); if (!cover) return;
  function ico(path) { return '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="' + path + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'; }
  var I = {
    toc: 'M4 6h16M4 12h16M4 18h10',
    plan: 'M9 11l3 3 8-8M20 12v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h11',
    search: 'M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zM21 21l-5-5',
    share: 'M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M12 3v12M7 8l5-5 5 5',
    check: 'M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4z'
  };
  function btn(label, icon, fn, extra) { var b = CV.h('button', { type: 'button', class: 'ab-b', 'aria-label': label, onclick: fn, html: ico(icon) + '<span class="ab-l">' + label + '</span>' }); if (extra) b.appendChild(extra); return b; }
  // The check is a page of its own now, so the bar links to it. After the check is finished the same item reads "Your result".
  function checkItem() {
    var lab = CV.h('span', { class: 'ab-l' }, 'Check');
    var a = CV.h('a', { class: 'ab-b', href: 'check/' }, CV.h('span', { class: 'ab-i', 'aria-hidden': 'true', html: ico(I.check) }), lab);
    function sync() { var done = !!CV.store.get('check', {}).done; lab.textContent = done ? 'Your result' : 'Check'; }
    CV.on('check', sync); sync();
    return a;
  }
  var count = CV.h('span', { class: 'ab-badge', 'aria-hidden': 'true' });
  var where = CV.h('span', { class: 'ab-where' });
  var pct = CV.h('span', { class: 'ab-pct', 'aria-hidden': 'true' });
  var bar = CV.h('nav', { class: 'ab', 'aria-label': 'Report tools' },
    CV.h('a', { class: 'ab-title', href: '#top' }, CV.h('b', null, 'Cyber Outlook 2027'), where),
    CV.h('div', { class: 'ab-tools' },
      btn('Contents', I.toc, function () { var t = CV.$('#toc-h'); var tg = CV.$('.toc-toggle'); if (tg && tg.getAttribute('aria-expanded') === 'false') tg.click(); t.scrollIntoView({ behavior: CV.reduced() ? 'auto' : 'smooth' }); t.focus({ preventScroll: true }); }),
      checkItem(),
      btn('My plan', I.plan, function () { CV.plan && CV.plan.open(); }, count),
      btn('Search', I.search, function () { CV.openSearch && CV.openSearch(); }),
      btn('Share', I.share, function () { CV.openShare && CV.openShare(); })),
    pct);
  document.body.appendChild(bar);
  var secs = CV.$$('main section.section[id]');
  function sync() {
    var past = cover.getBoundingClientRect().bottom < 0;
    bar.classList.toggle('show', past);
    document.body.classList.toggle('ab-on', past);
    var y = window.innerHeight * 0.3, cur = null; secs.forEach(function (s) { if (s.getBoundingClientRect().top <= y) cur = s; });
    where.textContent = cur ? ' · ' + CV.text(cur.querySelector('h2')).replace(/#$/, '').trim() : '';
    var h = document.documentElement.scrollHeight - window.innerHeight; pct.style.transform = 'scaleX(' + (h > 0 ? window.scrollY / h : 0) + ')';
  }
  function syncCount() { var n = CV.plan ? CV.plan.count() : 0; count.textContent = n || ''; count.hidden = !n; }
  var tk = false; window.addEventListener('scroll', function () { if (!tk) { tk = true; requestAnimationFrame(function () { tk = false; sync(); }); } }, { passive: true });
  window.addEventListener('resize', sync);
  CV.on('plan', syncCount);
  sync(); syncCount();
  // The old thin progress line is redundant now.
  var old = CV.$('.progress'); if (old) old.classList.add('ab-replaced');
});
