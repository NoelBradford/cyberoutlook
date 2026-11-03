// @msg Since your last visit: returning readers see what they've ticked off since they were last here and what's new in the podcast series
// @sel #start
CV.ready(function () {
  if (!CV.progressState) return;
  var now = CV.progressState(), prev = CV.store.get('snap', null);
  var snap = { at: Date.now(), five: now.five, planDone: now.planDone, weeks: now.weeks, contacts: now.contacts };
  window.addEventListener('pagehide', function () { var s = CV.progressState(); CV.store.set('snap', { at: Date.now(), five: s.five, planDone: s.planDone, weeks: s.weeks, contacts: s.contacts }); });
  if (!prev || Date.now() - prev.at < 3600000) { if (!prev) CV.store.set('snap', snap); return; }
  var gains = [];
  if (now.five > prev.five) gains.push('+' + (now.five - prev.five) + ' of the five things');
  if (now.planDone > prev.planDone) gains.push('+' + (now.planDone - prev.planDone) + ' plan actions');
  if (now.weeks > prev.weeks) gains.push('+' + (now.weeks - prev.weeks) + ' weeks of the 90-day plan');
  var newEps = CV.EPISODES.filter(function (e) { var d = CV.parseDate(e.date).getTime(); return d > prev.at && d <= CV.today().getTime(); });
  var days = Math.max(1, Math.round((Date.now() - prev.at) / 86400000));
  if (!gains.length && !newEps.length) return;
  var box = CV.h('div', { class: 'slv' },
    CV.h('p', { class: 'cv-kicker' }, 'Since your last visit, ' + days + ' day' + (days === 1 ? '' : 's') + ' ago'),
    gains.length ? CV.h('p', null, CV.h('b', null, gains.join(', ') + '.'), ' Good progress.') : null,
    newEps.length ? CV.h('p', null, 'New on the podcast: ', newEps.map(function (e) { return 'Ep ' + e.n + ', “' + e.title + '”'; }).join('; '), '. ', CV.h('a', { href: CV.PODCAST, rel: 'noopener', target: '_blank' }, 'Listen')) : null);
  var start = CV.$('.start-inner'); if (start) start.insertBefore(box, start.firstChild);
});
