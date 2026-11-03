// @msg Living charts: the report's bar charts grow into place as you reach them, and each bar names its exact figure when you point at it
// @sel #theme-1 figure svg.chart
CV.ready(function () {
  var charts = CV.$$('svg.chart'); if (!charts.length) return;
  var tip = CV.h('div', { class: 'ch-tip', 'aria-hidden': 'true', hidden: true }); document.body.appendChild(tip);
  charts.forEach(function (svg) {
    var bars = CV.$$('rect.c-bar, rect.c-bar2', svg);
    var labels = CV.$$('text.c-label', svg), values = CV.$$('text.c-value', svg);
    bars.forEach(function (r) {
      var y = +r.getAttribute('y');
      var lab = labels.filter(function (t) { return Math.abs(+t.getAttribute('y') - (y - 6)) < 12; })[0] || labels.reduce(function (a, t) { return Math.abs(+t.getAttribute('y') - y) < Math.abs(+a.getAttribute('y') - y) ? t : a; }, labels[0]);
      var val = values.filter(function (t) { return Math.abs(+t.getAttribute('y') - y) < 14; })[0];
      r.addEventListener('mouseenter', function (e) { if (!lab || !val) return; tip.textContent = lab.textContent + ': ' + val.textContent; tip.hidden = false; r.classList.add('hot'); });
      r.addEventListener('mousemove', function (e) { tip.style.left = (e.clientX + 12) + 'px'; tip.style.top = (e.clientY - 34) + 'px'; });
      r.addEventListener('mouseleave', function () { tip.hidden = true; r.classList.remove('hot'); });
    });
    if (CV.reduced() || !('IntersectionObserver' in window)) return;
    if (svg.getBoundingClientRect().top < window.innerHeight) return;
    svg.classList.add('ch-wait');
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); svg.classList.remove('ch-wait'); svg.classList.add('ch-grow'); } }, { threshold: 0.4 });
    io.observe(svg);
  });
});
