// @msg Five-minute team briefing: a printable script on fake quote requests, payment changes and urgent "director" calls, built from Theme 3's actions
// @sel #theme-3
CV.ready(function () {
  var sec = CV.$('#theme-3'); if (!sec) return;
  var POINTS = [
    ['Quote requests', 'Treat quote requests with links or attachments from unknown senders with care. Never log in from a link in one. If it asks you to sign in to see the details, close it and ask.'],
    ['Bank detail changes', 'No change to supplier bank details goes through without a phone call to a number we already hold. Not the number in the email.'],
    ['Urgent payments', 'An urgent payment request from a director, by email, message, phone or video, gets the call-back or the code word first. Urgency is the warning sign.'],
    ['Logins', 'Approve MFA prompts only when you’ve just tried to log in yourself. An unexpected prompt means someone else has your password: tell us.'],
    ['Saying something', 'If you’ve clicked, paid or typed a password somewhere odd, tell us straight away. The sooner we know, the less it costs.']
  ];
  function sheet() {
    return CV.h('div', { class: 'br-sheet' },
      CV.h('div', { class: 'pp-head' }, CV.h('h2', null, 'Five-minute briefing'), CV.h('p', null, 'Fake requests and payments · from the UK Small Business Cyber Outlook 2027 · cyberoutlook.sbcsg.uk')),
      CV.h('ol', null, POINTS.map(function (p) { return CV.h('li', null, CV.h('b', null, p[0] + '. '), p[1]); })),
      CV.h('p', { class: 'br-sign' }, 'Briefed by ________________   Date ___________   Attended ______________________________'));
  }
  var d = CV.dialog({ id: 'briefing', title: 'Five-minute team briefing', wide: true, note: 'Read it out at your next team meeting, then ask everyone to sign the sheet.' });
  d.body.appendChild(CV.h('ol', { class: 'br-list' }, POINTS.map(function (p) { return CV.h('li', null, CV.h('b', null, p[0]), CV.h('span', null, p[1])); })));
  d.body.appendChild(CV.h('div', { class: 'cv-row' }, CV.button('Print the briefing', function () { CV.printSheet(sheet()); }, 'primary'), CV.button('Copy as text', function () { CV.copy('FIVE-MINUTE BRIEFING\n\n' + POINTS.map(function (p, i) { return (i + 1) + '. ' + p[0] + ': ' + p[1]; }).join('\n\n'), 'Briefing copied'); }), CV.plan ? CV.button('Add the briefing to my plan', function () { CV.plan.add('t3-4'); }) : null));
  CV.openBriefing = function () { d.open(); };
  var host = CV.$$('#theme-3 .cta-card').pop() || CV.$('#theme-3 .table-wrap');
  if (host) host.after(CV.h('div', { class: 'cta-card cv-noprint' }, CV.h('div', null, CV.h('p', { class: 'cv-kicker' }, 'Tool'), CV.h('p', { class: 'cta-title' }, 'Brief your team in five minutes'), CV.h('p', { class: 'cta-sub' }, 'A printable script on fake quote requests, bank detail changes and urgent payments.')), CV.button('Open the briefing', CV.openBriefing, 'primary')));
});
