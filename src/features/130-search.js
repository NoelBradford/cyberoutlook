// @msg Search the report: press / or Ctrl+K, type, and jump straight to the paragraph, with matches highlighted
// @sel #start
CV.ready(function () {
  var blocks = CV.$$('main p, main li, main h2, main h3, main td, main .stat').filter(function (el) { return !el.closest('dialog,.next-sec,.listen,.ep-guide,.what-next,.cta-card,.plan-tools,.five-foot,.wf') && !el.classList.contains('listen-src') && CV.text(el).length > 2; });
  function txt(el) { var c = el.cloneNode(true); CV.$$('.h-anchor,.sc-btn,.plan-add,.backrefs', c).forEach(function (n) { n.parentNode.removeChild(n); }); return CV.text(c); }
  var index = blocks.map(function (el) { var sec = el.closest('section[id]'); return { el: el, t: txt(el), lc: txt(el).toLowerCase(), sec: sec ? CV.text(sec.querySelector('h2')).replace(/#$/, '').trim() : '' }; });
  var d = CV.dialog({ id: 'search', title: 'Search the report', wide: true, cls: 'top' });
  var input = CV.h('input', { type: 'search', id: 'sr-q', class: 'cv-input sr-q', placeholder: 'Try "backup", "MFA", "Danzell", "invoice"', autocomplete: 'off', 'aria-controls': 'sr-res' });
  var count = CV.h('p', { class: 'sr-count', 'aria-live': 'polite' });
  var res = CV.h('ol', { class: 'sr-res', id: 'sr-res' });
  d.body.appendChild(input); d.body.appendChild(count); d.body.appendChild(res);
  function snippet(t, q) { var i = t.toLowerCase().indexOf(q), s = Math.max(0, i - 60), e = Math.min(t.length, i + q.length + 90); var pre = (s ? '…' : '') + t.slice(s, i), hit = t.slice(i, i + q.length), post = t.slice(i + q.length, e) + (e < t.length ? '…' : ''); return [pre, CV.h('mark', null, hit), post]; }
  function clearMarks() { CV.$$('.sr-hit').forEach(function (n) { n.classList.remove('sr-hit'); }); }
  function go(el) { d.close(); clearMarks(); el.classList.add('sr-hit'); el.scrollIntoView({ block: 'center', behavior: CV.reduced() ? 'auto' : 'smooth' }); setTimeout(clearMarks, 4000); }
  var t;
  function run() {
    var q = input.value.trim().toLowerCase(); res.innerHTML = '';
    if (q.length < 2) { count.textContent = ''; return; }
    var hits = index.filter(function (x) { return x.lc.indexOf(q) > -1; });
    count.textContent = hits.length ? hits.length + ' match' + (hits.length === 1 ? '' : 'es') + (hits.length > 40 ? '. Showing the first 40.' : '') : 'No matches. Try a shorter word.';
    hits.slice(0, 40).forEach(function (x, i) {
      var b = CV.h('button', { type: 'button', class: 'sr-item' }, CV.h('span', { class: 'sr-sec' }, x.sec), CV.h('span', { class: 'sr-snip' }, snippet(x.t, q)));
      b.addEventListener('click', function () { go(x.el); });
      res.appendChild(CV.h('li', null, b));
    });
  }
  input.addEventListener('input', function () { clearTimeout(t); t = setTimeout(run, 120); });
  input.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown') { var f = res.querySelector('button'); if (f) { e.preventDefault(); f.focus(); } } if (e.key === 'Enter') { var f2 = res.querySelector('button'); if (f2) f2.click(); } });
  res.addEventListener('keydown', function (e) { var bs = CV.$$('button', res), i = bs.indexOf(document.activeElement); if (e.key === 'ArrowDown' && i < bs.length - 1) { e.preventDefault(); bs[i + 1].focus(); } if (e.key === 'ArrowUp') { e.preventDefault(); (i > 0 ? bs[i - 1] : input).focus(); } });
  CV.openSearch = function () { d.open(); setTimeout(function () { input.focus(); input.select(); }, 30); };
  document.addEventListener('keydown', function (e) {
    var tag = (e.target.tagName || '').toLowerCase(), typing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
    if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !typing)) { e.preventDefault(); CV.openSearch(); }
  });
  var b = CV.h('button', { type: 'button', class: 'tool search-tool', 'aria-keyshortcuts': '/ Control+K', onclick: CV.openSearch }, 'Search', CV.h('kbd', { 'aria-hidden': 'true' }, '/'));
  CV.addTool(b);
});
