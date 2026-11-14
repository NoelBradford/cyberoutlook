// @msg Welcome back: returning readers pick up exactly where they stopped, with their progress in one line
// @sel #start
CV.ready(function () {
  var secs = CV.$$('main section.section[id]');
  var last = CV.store.get('pos', null);
  var t;
  function remember() {
    clearTimeout(t);
    t = setTimeout(function () {
      var y = window.innerHeight * 0.3, cur = null;
      secs.forEach(function (s) { if (s.getBoundingClientRect().top <= y) cur = s; });
      if (!cur) return;
      var h = cur.querySelector('h2');
      var ratio = Math.max(0, Math.min(1, (y - cur.getBoundingClientRect().top) / cur.offsetHeight));
      CV.store.set('pos', { id: cur.id, title: CV.text(h).replace(/#$/, '').trim(), r: Math.round(ratio * 100) / 100, at: Date.now() });
    }, 400);
  }
  window.addEventListener('scroll', remember, { passive: true });
  if (!last || location.hash || !document.getElementById(last.id) || Date.now() - last.at < 60000) return;
  if (last.id === 'foreword' && last.r < 0.1) return;
  // Progress is said once, in the progress line in Start here, so this message only says where you were. It sits in Start here (never
  // fixed over the page), shows only if no other message has the slot, and a dismissal is remembered for this visit's position.
  var token = String(last.at), startIn = CV.$('.start-inner');
  if (!startIn || CV.notice.dismissed('wb', token) || !CV.notice.claim('wb')) return;
  var bar = CV.h('div', { class: 'wb', role: 'region', 'aria-label': 'Welcome back' },
    CV.h('p', null, CV.h('b', null, 'Welcome back. '), 'You were reading ', CV.h('i', null, last.title), '.'),
    CV.h('div', { class: 'cv-row' },
      CV.button('Carry on reading', function () {
        var sec = document.getElementById(last.id);
        var y = sec.getBoundingClientRect().top + window.scrollY + sec.offsetHeight * last.r - window.innerHeight * 0.3;
        window.scrollTo({ top: Math.max(0, y), behavior: CV.reduced() ? 'auto' : 'smooth' }); CV.notice.dismiss('wb', token); bar.remove();
      }, 'primary'),
      CV.h('button', { type: 'button', class: 'wb-x', 'aria-label': 'Dismiss', onclick: function () { CV.notice.dismiss('wb', token); bar.remove(); } }, '×')));
  startIn.insertBefore(bar, startIn.firstChild);
});
