// @msg Contents with a sense of distance: every section shows its reading time and a ring that fills as you read it
// @sel .toc
CV.ready(function () {
  var links = CV.$$('.toc a[href^="#"]'); if (!links.length) return;
  var rows = links.map(function (a) {
    var sec = document.getElementById(a.getAttribute('href').slice(1)); if (!sec) return null;
    var words = CV.text(sec).split(' ').length, mins = Math.max(1, Math.round(words / 230));
    var ring = CV.h('span', { class: 'tp-ring', 'aria-hidden': 'true' });
    var min = CV.h('span', { class: 'tp-min' }, mins + ' min');
    a.appendChild(min); a.appendChild(ring);
    a.setAttribute('aria-label', CV.text(a).replace(/\d+ min$/, '').trim() + ', about ' + mins + ' minute' + (mins === 1 ? '' : 's'));
    return { a: a, sec: sec, ring: ring, max: CV.store.get('read-' + sec.id, 0) };
  }).filter(Boolean);
  var saved = CV.store.get('readpct', {});
  function update() {
    var vh = window.innerHeight;
    rows.forEach(function (r) {
      var rect = r.sec.getBoundingClientRect();
      var pct = Math.max(0, Math.min(1, (vh * 0.7 - rect.top) / Math.max(1, rect.height)));
      var best = Math.max(saved[r.sec.id] || 0, pct);
      if (best > (saved[r.sec.id] || 0) + 0.02 || best === 1 && saved[r.sec.id] !== 1) saved[r.sec.id] = Math.round(best * 100) / 100;
      r.ring.style.setProperty('--p', (saved[r.sec.id] || 0) * 100 + '%');
      r.a.classList.toggle('tp-done', (saved[r.sec.id] || 0) > 0.9);
    });
  }
  var t, tk = false;
  window.addEventListener('scroll', function () { if (!tk) { tk = true; requestAnimationFrame(function () { tk = false; update(); clearTimeout(t); t = setTimeout(function () { CV.store.set('readpct', saved); }, 600); }); } }, { passive: true });
  update();
});
