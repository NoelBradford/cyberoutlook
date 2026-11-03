// @msg Arrival-aware welcome: visitors from LinkedIn, a printed QR code or the podcast get a one-line welcome and the single best next step for them
// @sel #start
CV.ready(function () {
  var q = new URLSearchParams(location.search), src = (q.get('utm_source') || '').toLowerCase(), med = (q.get('utm_medium') || '').toLowerCase();
  var ref = document.referrer || '';
  var kind = med === 'qr' || src === 'print' ? 'print' : /linkedin/.test(src) || /linkedin\.com|lnkd\.in/.test(ref) ? 'linkedin' : /podcast/.test(src) || /thesmallbusinesscybersecurityguy/.test(ref) ? 'podcast' : '';
  if (!kind || CV.store.get('welcomed-' + kind, false)) return;
  var M = {
    linkedin: ['Welcome from LinkedIn.', 'Short on time? The two-minute check shows where you stand.', 'Take the check', function () { CV.openCheck && CV.openCheck(); }],
    print: ['Welcome from the printed copy.', 'Online you can fill in the one-page plan, tick off the five things and add everything to your calendar.', 'Open the one-page plan', function () { location.hash = '#mvc'; }],
    podcast: ['Welcome, podcast listener.', 'Every theme here has a tool to go with the episode. Start with the five things before January.', 'See the five things', function () { location.hash = '#h-if-you-do-five-things-before-january'; }]
  }[kind];
  var bar = CV.h('div', { class: 'aw', role: 'status' },
    CV.h('p', null, CV.h('b', null, M[0] + ' '), M[1]),
    CV.h('div', { class: 'cv-row' }, CV.button(M[2], function () { close(); M[3](); }, 'primary'), CV.h('button', { type: 'button', class: 'wb-x', 'aria-label': 'Dismiss', onclick: close }, '×')));
  function close() { CV.store.set('welcomed-' + kind, true); bar.remove(); }
  var start = CV.$('.start-inner'); if (start) start.insertBefore(bar, start.firstChild);
  CV.store.set('arrival', kind);
});
