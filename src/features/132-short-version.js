// @msg Short-version mode: one switch folds the report down to forecasts, key figures and actions, so you can skim it in ten minutes
// @sel #theme-1
CV.ready(function () {
  var KEEP = 'h2, .sec-num, .forecast, .lead, .call, .stats, .table-wrap, .cta-card, .listen, .what-next, .tiers, .months, .nd-tools, .a4-page, .plan-tools, figure.wf, ol.five, .five-foot, .five-note, .next-sec, .ep-guide';
  var on = CV.store.get('short', false);
  var banner = CV.h('div', { class: 'sv-banner', role: 'status' }, CV.h('p', null, CV.h('b', null, 'Short version. '), 'Showing forecasts, key figures and actions only.'), CV.button('Show everything', function () { set(false); }));
  function mark() {
    CV.$$('main section.section').forEach(function (sec) {
      if (sec.id === 'sources' || sec.id === 'disclaimer' || sec.id === 'method' || sec.id === 'how-to-read') { sec.classList.add('sv-hide-all'); return; }
      if (sec.id === 'summary') return; // the executive summary is already the short version
      CV.$$(':scope > .example, :scope > .box', sec).forEach(function (el) { el.classList.add('sv-x'); });
      CV.$$('.prose > *, .prose', sec).forEach(function (el) {
        if (el.matches('.prose')) return;
        var keep = el.matches(KEEP) || el.querySelector('.forecast,.lead') || el.matches('h3') && /five things|What to do/i.test(el.textContent);
        if (!keep) el.classList.add('sv-x');
      });
    });
  }
  function set(v) {
    on = v; CV.store.set('short', v);
    document.body.classList.toggle('short-v', v);
    tbtn.setAttribute('aria-pressed', v ? 'true' : 'false');
    tbtn.textContent = v ? 'Full version' : 'Short version';
    if (v && !banner.isConnected) CV.$('.layout').before(banner);
    if (!v && banner.isConnected) banner.remove();
    CV.toast(v ? 'Short version on' : 'Showing the full report');
  }
  mark();
  var tbtn = CV.h('button', { type: 'button', class: 'tool', 'aria-pressed': 'false' }, 'Short version');
  tbtn.addEventListener('click', function () { set(!on); });
  CV.addTool(tbtn);
  var pth = CV.$('.path[data-path="short"]');
  if (pth) pth.addEventListener('click', function () { if (!on) set(true); });
  if (on) set(true);
});
