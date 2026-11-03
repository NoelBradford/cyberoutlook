// @msg Phones always know where they are: a slim chip above the bottom dock names the current section and opens the contents in one tap
// @sel #theme-1
CV.ready(function () {
  var ab = CV.$('.ab'); if (!ab) return;
  var chip = CV.h('button', { type: 'button', class: 'ab-chip', 'aria-label': 'Current section. Open contents' });
  ab.insertBefore(chip, ab.firstChild);
  var secs = CV.$$('main section.section[id]');
  function sync() {
    var y = window.innerHeight * 0.3, cur = null; secs.forEach(function (s) { if (s.getBoundingClientRect().top <= y) cur = s; });
    if (!cur) { chip.hidden = true; return; }
    var num = CV.text(cur.querySelector('.sec-num')).match(/\d+/), t = CV.text(cur.querySelector('h2')).replace(/#$/, '').trim();
    chip.hidden = false; chip.textContent = ''; chip.appendChild(CV.h('span', { class: 'ab-chip-n' }, num ? num[0] : '')); chip.appendChild(document.createTextNode(t)); chip.appendChild(CV.h('span', { class: 'ab-chip-c', 'aria-hidden': 'true' }, '▴'));
  }
  chip.addEventListener('click', function () { var tg = CV.$('.toc-toggle'); if (tg && tg.getAttribute('aria-expanded') === 'false') tg.click(); var h = CV.$('#toc-h'); h.scrollIntoView({ behavior: CV.reduced() ? 'auto' : 'smooth' }); h.focus({ preventScroll: true }); });
  var tk = false; window.addEventListener('scroll', function () { if (!tk) { tk = true; requestAnimationFrame(function () { tk = false; sync(); }); } }, { passive: true });
  sync();
});
