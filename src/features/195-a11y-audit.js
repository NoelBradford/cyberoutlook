// @msg Accessibility audit (axe-core) and fixes: dark bands stay dark in dark mode, amber text meets contrast, callouts become notes, and every landmark is uniquely named
// @sel #start
CV.ready(function () {
  // Callouts and podcast panels are notes inside the report, not page-level landmarks.
  CV.$$('main aside.call, main aside.listen, main aside.lnx, main aside.sn').forEach(function (a) { a.setAttribute('role', 'note'); });
  CV.$$('main aside[aria-labelledby]').forEach(function (a) { if (!a.closest('.call')) a.setAttribute('role', 'note'); });
  // Each "next section" nav gets a unique name.
  CV.$$('.next-sec').forEach(function (n) { var s = n.closest('section'), h = s && s.querySelector('h2'); if (h) n.setAttribute('aria-label', 'After ' + CV.text(h).replace(/#$/, '').trim()); });
  // Keep the floating back-to-top link inside a landmark.
  var top = CV.$('.to-top'); if (top && !top.closest('nav, main, header, footer')) { var nav = CV.h('nav', { 'aria-label': 'Back to top', class: 'top-nav' }); top.parentNode.insertBefore(nav, top); nav.appendChild(top); }
});
