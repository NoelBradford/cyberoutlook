// @msg Phones always know where they are: the Contents button in the bottom dock shows the number of the current section and opens the contents in one tap
// @sel #theme-1
CV.ready(function () {
  var ab = CV.$('.ab'); if (!ab) return;
  // The dock used to carry a second strip above it with the section name. That strip is gone: the section's number is the label of the
  // Contents button (the first item), and its accessible name says which section you are in.
  var contents = CV.$('.ab-b', ab), lab = contents && CV.$('.ab-l', contents);
  if (!contents || !lab) return;
  var secs = CV.$$('main section.section[id]');
  var phone = window.matchMedia ? window.matchMedia('(max-width: 900px)') : { matches: false };
  function sync() {
    var y = window.innerHeight * 0.3, cur = null; secs.forEach(function (s) { if (s.getBoundingClientRect().top <= y) cur = s; });
    var num = cur && CV.text(cur.querySelector('.sec-num')).match(/\d+/), t = cur ? CV.text(cur.querySelector('h2')).replace(/#$/, '').trim() : '';
    if (!cur || !phone.matches) { lab.textContent = 'Contents'; contents.setAttribute('aria-label', 'Contents'); contents.removeAttribute('title'); return; }
    lab.textContent = num ? num[0] : 'Contents';
    contents.setAttribute('aria-label', 'Contents. You are in section ' + (num ? num[0] + ', ' : '') + t);
    contents.title = 'Contents (you are in ' + (num ? num[0] + ' ' : '') + t + ')';
  }
  var tk = false; window.addEventListener('scroll', function () { if (!tk) { tk = true; requestAnimationFrame(function () { tk = false; sync(); }); } }, { passive: true });
  window.addEventListener('resize', sync);
  sync();
});
