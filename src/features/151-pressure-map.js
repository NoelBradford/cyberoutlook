// @msg Living cover: the "outlook" isobars become a slow, generative pressure chart that bends around your pointer (still for reduced motion)
// @sel .cover
CV.ready(function () {
  var svg = CV.$('.cover .isobars'); if (!svg) return;
  var c = CV.h('canvas', { class: 'pm', 'aria-hidden': 'true' });
  svg.after(c); svg.classList.add('pm-replaced');
  var x = c.getContext('2d'), W, H, dpr = Math.min(2, window.devicePixelRatio || 1), mx = -1, my = -1, t = 0, raf;
  function css(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || '#0d5b60'; }
  function size() { var r = c.getBoundingClientRect(); W = r.width; H = r.height; c.width = W * dpr; c.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0); }
  function draw() {
    x.clearRect(0, 0, W, H);
    var acc = css('--accent'), sig = css('--signal');
    for (var k = 0; k < 7; k++) {
      var hot = k === 3, base = H * (0.16 + k * 0.12);
      x.beginPath();
      for (var px = 0; px <= W; px += 6) {
        var u = px / W;
        var y = base + Math.sin(u * 5.2 + t * 0.6 + k * 0.7) * H * 0.07 + Math.sin(u * 11 - t * 0.35 + k) * H * 0.025;
        if (mx >= 0) { var dx = px - mx, dy = y - my, d2 = dx * dx + dy * dy; y += (dy / Math.sqrt(d2 + 1)) * 28 * Math.exp(-d2 / 9000); }
        if (px === 0) x.moveTo(px, y); else x.lineTo(px, y);
      }
      x.strokeStyle = hot ? sig : acc; x.globalAlpha = hot ? 0.95 : 0.22 + (k % 3) * 0.12; x.lineWidth = hot ? 2.4 : 1.3;
      x.stroke();
    }
    x.globalAlpha = 1;
    // a single high-pressure marker that follows the hot line
    var hx = W * (0.72 + Math.sin(t * 0.2) * 0.08), hy = H * (0.16 + 3 * 0.12) + Math.sin(hx / W * 5.2 + t * 0.6 + 2.1) * H * 0.07;
    x.fillStyle = sig; x.font = '700 14px "Barlow Condensed", sans-serif'; x.fillText('2027', hx + 8, hy - 8);
    x.beginPath(); x.arc(hx, hy, 4, 0, Math.PI * 2); x.fill();
  }
  function loop() { t += 0.012; draw(); raf = requestAnimationFrame(loop); }
  size(); draw();
  window.addEventListener('resize', function () { size(); draw(); });
  c.parentNode.addEventListener('pointermove', function (e) { var r = c.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; if (CV.reduced()) draw(); });
  c.parentNode.addEventListener('pointerleave', function () { mx = my = -1; if (CV.reduced()) draw(); });
  if (!CV.reduced() && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { if (es[0].isIntersecting) { if (!raf) loop(); } else { cancelAnimationFrame(raf); raf = null; } }).observe(c);
  }
  var mo = new MutationObserver(function () { draw(); }); mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
});
