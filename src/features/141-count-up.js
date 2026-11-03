// @msg The year in numbers comes alive: each figure counts up as it scrolls into view (the real value is always shown at rest)
// @sel #numbers .stats
CV.ready(function () {
  if (CV.reduced() || !('IntersectionObserver' in window)) return;
  var ns = CV.$$('#numbers .stat .n'); if (!ns.length) return;
  ns.forEach(function (el) {
    var orig = el.textContent, m = orig.match(/^(\D*)([\d,.]+)(\D*)$/); if (!m) return;
    var target = parseFloat(m[2].replace(/,/g, '')); if (!isFinite(target) || target === 0) return;
    el.setAttribute('aria-label', orig);
    var io = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return; io.disconnect();
      // Only animate figures that are fully below the fold when the page loads.
      var t0 = performance.now(), dur = 900 + Math.min(target, 600) * 0.6;
      el.classList.add('cu-run');
      function tick(t) {
        var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        el.textContent = m[1] + Math.round(target * e).toLocaleString('en-GB') + m[3];
        if (k < 1) requestAnimationFrame(tick); else { el.textContent = orig; el.classList.remove('cu-run'); el.classList.add('cu-done'); }
      }
      requestAnimationFrame(tick);
    }, { threshold: 0.9 });
    if (el.getBoundingClientRect().top > window.innerHeight) io.observe(el);
  });
});
