// @msg Cover chart: the "outlook" isobars drawn as a pressure chart, once, without animation
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
  // Drawn once, and again only when the size or theme changes. No animation loop, no pointer tracking.
  t = 2.4; size(); draw();
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { size(); draw(); }, 120); });
  var mo = new MutationObserver(function () { draw(); }); mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
});
