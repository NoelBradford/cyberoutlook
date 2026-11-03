// @msg Sources explorer: filter the 36 sources by type, search them, see how often each is cited, and copy any citation
// @sel #sources
CV.ready(function () {
  var ol = CV.$('ol.sources'); if (!ol) return;
  var lis = CV.$$('li', ol);
  function kind(t) {
    if (/podcast|blog\./i.test(t) || /Small Business Cyber Security Guy/.test(t)) return 'ours';
    if (/^(Department|National Cyber|Information Commissioner|UK Parliament|City of London Police)/.test(t)) return 'official';
    if (/^IASME/.test(t)) return 'official';
    if (/arXiv|Willison|Information Security Forum/.test(t)) return 'research';
    return 'press';
  }
  var NAMES = { all: 'All', official: 'Official', press: 'Press and industry', research: 'Research', ours: 'Our episodes and articles', vendor: 'Vendor figures' };
  var cites = {}; CV.$$('sup.cite a[href^="#s"]').forEach(function (a) { var k = a.getAttribute('href').slice(1); cites[k] = (cites[k] || 0) + 1; });
  lis.forEach(function (li) {
    var t = CV.text(li); li.dataset.kind = kind(t); li.dataset.vendor = li.querySelector('.flag') ? '1' : '';
    var n = cites[li.id] || 0;
    var meta = CV.h('span', { class: 'src-meta' }, CV.h('span', { class: 'src-k k-' + li.dataset.kind }, NAMES[li.dataset.kind]), n ? CV.h('span', null, 'Cited ' + n + '×') : null,
      CV.h('button', { type: 'button', class: 'src-copy', 'aria-label': 'Copy citation ' + li.id.slice(1) }, 'Copy'));
    meta.querySelector('.src-copy').addEventListener('click', function () { var c = li.cloneNode(true); CV.$$('.src-meta,.backrefs', c).forEach(function (x) { x.parentNode.removeChild(x); }); CV.copy(CV.text(c), 'Citation copied'); });
    li.appendChild(meta);
  });
  var counts = { all: lis.length, vendor: lis.filter(function (l) { return l.dataset.vendor; }).length };
  lis.forEach(function (l) { counts[l.dataset.kind] = (counts[l.dataset.kind] || 0) + 1; });
  var cur = 'all';
  var q = CV.h('input', { type: 'search', class: 'cv-input src-q', placeholder: 'Search sources', 'aria-label': 'Search sources' });
  var chips = CV.h('div', { class: 'src-chips', role: 'group', 'aria-label': 'Filter sources' });
  var status = CV.h('p', { class: 'src-status', 'aria-live': 'polite' });
  Object.keys(NAMES).forEach(function (k) {
    if (!counts[k]) return;
    var b = CV.h('button', { type: 'button', class: 'sh-tab', 'aria-pressed': k === 'all' ? 'true' : 'false' }, NAMES[k] + ' ' , CV.h('span', { class: 'src-n' }, String(counts[k])));
    b.addEventListener('click', function () { cur = k; CV.$$('button', chips).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); apply(); });
    chips.appendChild(b);
  });
  function apply() {
    var s = q.value.trim().toLowerCase(), shown = 0;
    lis.forEach(function (li) { var ok = (cur === 'all' || (cur === 'vendor' ? li.dataset.vendor : li.dataset.kind === cur)) && (!s || li.textContent.toLowerCase().indexOf(s) > -1); li.hidden = !ok; if (ok) shown++; });
    status.textContent = shown === lis.length ? '' : 'Showing ' + shown + ' of ' + lis.length + ' sources';
  }
  q.addEventListener('input', apply);
  ol.before(CV.h('div', { class: 'src-tools cv-noprint' }, chips, q, status));
});
