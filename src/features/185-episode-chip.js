// @msg Next episode, always visible: the app bar counts down to the next weekly podcast episode, and it's one tap to the guide
// @sel #theme-1
CV.ready(function () {
  var ab = CV.$('.ab .ab-tools'); if (!ab) return;
  var now = CV.today(), next = CV.EPISODES.filter(function (e) { return CV.parseDate(e.date) >= now; })[0];
  var latest = CV.EPISODES.filter(function (e) { return CV.parseDate(e.date) <= now; }).pop();
  var e = next || latest; if (!e) return;
  var days = Math.round((CV.parseDate(e.date) - now) / 86400000);
  var when = next ? (days === 0 ? 'out today' : days === 1 ? 'tomorrow' : 'in ' + days + ' days') : 'latest';
  var chip = CV.h('a', { class: 'ep-chip', href: '#ep-guide', title: 'Episode ' + e.n + ': ' + e.title }, CV.h('span', { class: 'ep-chip-k' }, 'Ep ' + e.n), CV.h('span', null, when));
  chip.setAttribute('aria-label', 'Podcast episode ' + e.n + ', ' + e.title + ', ' + when + '. Open the episode guide.');
  ab.parentNode.insertBefore(chip, ab);
});
