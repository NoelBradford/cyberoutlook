// @msg Cut: the eleven in-text tool cards fold into one Toolkit; only the three the report tells you to do on the spot stay inline (IT provider email, call-back rule, Gary's form)
// @sel #theme-1
CV.ready(function () {
  // Inline cards that stay: the report asks the reader to do these things at that exact point.
  var KEEP = [/email in 30 seconds/i, /call-back rule/i, /ten-minute form/i];
  var tools = [];
  CV.$$('main .cta-card').forEach(function (card) {
    var k = card.querySelector('.cv-kicker'); if (!k || CV.text(k) !== 'Tool') return;
    var title = CV.text(card.querySelector('.cta-title')), sub = card.querySelector('.cta-sub');
    var btn = CV.$$('button', card).filter(function (b) { return b.classList.contains('primary'); })[0] || card.querySelector('button');
    var sec = card.closest('section[id]');
    tools.push({ title: title, sub: sub ? CV.text(sub) : '', btn: btn, sec: sec ? CV.text(sec.querySelector('h2')).replace(/#$/, '').trim() : '' });
    if (!KEEP.some(function (r) { return r.test(title); })) card.remove();
  });
  var extra = [];
  CV.toolkit = { add: function (title, sub, fn) { extra.push({ title: title, sub: sub, fn: fn }); } };
  var d = CV.dialog({ id: 'alltools', title: 'Toolkit', wide: true, onopen: render, note: 'Everything you type stays in this browser. Each tool also has its own link, such as cyberoutlook.sbcsg.uk/#poster.' });
  function render() {
    var b = d.body; b.innerHTML = '';
    var ul = CV.h('ul', { class: 'tk-list' });
    tools.forEach(function (t) {
      ul.appendChild(CV.h('li', null, CV.h('div', null, CV.h('p', { class: 'tk-t' }, t.title), CV.h('p', { class: 'tk-s' }, t.sub || ('From ' + t.sec))),
        CV.button('Open', function () { d.close(); t.btn.click(); })));
    });
    // Print and present tools live behind the toolbar; list them here once they exist.
    var more = extra.slice();
    [['Print a team pack', 'One copy per person: the five things, the call-back rule and who to call.'], ['Print my toolkit', 'Everything you have filled in, printed together.']].forEach(function (x) {
      var el = CV.$$('.cover .tools .tool').filter(function (b) { return CV.text(b).indexOf(x[0]) === 0; })[0];
      if (el) more.push({ title: x[0], sub: x[1], fn: function () { el.click(); } });
    });
    if (CV.present) more.push({ title: 'Present to my team', sub: 'The report as slides for a short team meeting.', fn: CV.present });
    more.forEach(function (t) {
      ul.appendChild(CV.h('li', null, CV.h('div', null, CV.h('p', { class: 'tk-t' }, t.title), CV.h('p', { class: 'tk-s' }, t.sub)),
        CV.button('Open', function () { d.close(); t.fn(); })));
    });
    b.appendChild(ul);
  }
  CV.openToolkit = function () { d.open(); };
});
