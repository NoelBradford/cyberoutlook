// @msg Listen to any section: your device reads it aloud, highlighting each paragraph as it goes, with pause and speed controls
// @sel #foreword
CV.ready(function () {
  if (!('speechSynthesis' in window) || !window.SpeechSynthesisUtterance) return;
  var synth = window.speechSynthesis, queue = [], idx = 0, playing = false, rate = CV.store.get('rate', 1);
  var player = CV.h('div', { class: 'tts', role: 'region', 'aria-label': 'Read aloud', hidden: true });
  var title = CV.h('p', { class: 'tts-t' });
  var play = CV.h('button', { type: 'button', class: 'tts-b', 'aria-label': 'Pause' }, '❚❚');
  var next = CV.h('button', { type: 'button', class: 'tts-b', 'aria-label': 'Next paragraph' }, '⏭');
  var speed = CV.h('button', { type: 'button', class: 'tts-b tts-speed', 'aria-label': 'Reading speed' }, rate + '×');
  var stop = CV.h('button', { type: 'button', class: 'tts-b', 'aria-label': 'Stop reading' }, '×');
  player.appendChild(CV.h('div', { class: 'tts-eq', 'aria-hidden': 'true' }, CV.h('span'), CV.h('span'), CV.h('span')));
  player.appendChild(title); player.appendChild(play); player.appendChild(next); player.appendChild(speed); player.appendChild(stop);
  document.body.appendChild(player);
  function voice() { var vs = synth.getVoices(); return vs.filter(function (v) { return /en-GB/i.test(v.lang); })[0] || vs.filter(function (v) { return /^en/i.test(v.lang); })[0] || null; }
  function clean(el) { var c = el.cloneNode(true); CV.$$('sup, .h-anchor, .plan-add, .sc-btn, .backrefs', c).forEach(function (n) { n.parentNode.removeChild(n); }); return CV.text(c); }
  function mark(el) { CV.$$('.tts-now').forEach(function (n) { n.classList.remove('tts-now'); }); if (el) { el.classList.add('tts-now'); var r = el.getBoundingClientRect(); if (r.top < 70 || r.bottom > window.innerHeight - 90) el.scrollIntoView({ block: 'center', behavior: CV.reduced() ? 'auto' : 'smooth' }); } }
  function speak() {
    if (idx >= queue.length) { end(); return; }
    var el = queue[idx], u = new SpeechSynthesisUtterance(clean(el)); var v = voice(); if (v) u.voice = v; u.lang = 'en-GB'; u.rate = rate;
    u.onend = function () { if (!playing) return; idx++; speak(); };
    mark(el); synth.speak(u);
  }
  function start(section) {
    synth.cancel();
    queue = CV.$$('h2, .forecast, .prose > p:not(.listen-src), .prose > ul > li, .prose > ol > li, .call h4, .call p, .example p, .example h3', section).filter(function (e) { return CV.text(e).length > 1 && !e.closest('.cv-noprint,.listen,.cta-card'); });
    idx = 0; playing = true; player.hidden = false; title.textContent = CV.text(section.querySelector('h2')).replace(/#$/, '');
    play.textContent = '❚❚'; play.setAttribute('aria-label', 'Pause'); player.classList.add('on');
    speak();
  }
  function end() { synth.cancel(); playing = false; player.hidden = true; player.classList.remove('on'); mark(null); }
  play.addEventListener('click', function () {
    if (synth.paused) { synth.resume(); play.textContent = '❚❚'; play.setAttribute('aria-label', 'Pause'); player.classList.add('on'); }
    else { synth.pause(); play.textContent = '▶'; play.setAttribute('aria-label', 'Resume'); player.classList.remove('on'); }
  });
  next.addEventListener('click', function () { synth.cancel(); idx++; setTimeout(speak, 60); });
  speed.addEventListener('click', function () { rate = rate >= 1.5 ? 0.85 : rate === 0.85 ? 1 : rate + 0.25; CV.store.set('rate', rate); speed.textContent = rate + '×'; synth.cancel(); setTimeout(speak, 60); });
  stop.addEventListener('click', end);
  window.addEventListener('beforeunload', function () { synth.cancel(); });
  CV.$$('main section.section').forEach(function (sec) {
    if (/sources|disclaimer/.test(sec.id)) return;
    var h = sec.querySelector('h2'); if (!h) return;
    var b = CV.h('button', { type: 'button', class: 'tts-start', 'aria-label': 'Listen to this section: ' + CV.text(h).replace(/#$/, '') }, CV.h('span', { 'aria-hidden': 'true' }, '▶'), ' Listen');
    b.addEventListener('click', function () { start(sec); });
    var num = sec.querySelector('.sec-num'); (num || h).appendChild(b);
  });
});
