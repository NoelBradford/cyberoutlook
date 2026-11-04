// @msg Listen cards: each section's "On the podcast" line becomes a card showing which episodes are out and where to listen
// @sel #theme-1 .listen
CV.ready(function () {
  var now = CV.today();
  CV.$$('main section .prose > p').forEach(function (p) {
    var strong = p.querySelector('strong'); if (!strong || !/On the podcast/i.test(strong.textContent)) return;
    var nums = (p.textContent.match(/episode\s+(\d)/gi) || []).map(function (m) { return +m.replace(/\D/g, ''); });
    var eps = CV.EPISODES.filter(function (e) { return nums.indexOf(e.n) > -1; }); if (!eps.length) return;
    var card = CV.h('aside', { class: 'listen', 'aria-label': 'Podcast episodes for this section' },
      CV.h('div', { class: 'listen-icon', 'aria-hidden': 'true' }, CV.h('span'), CV.h('span'), CV.h('span'), CV.h('span')),
      CV.h('div', { class: 'listen-main' },
        CV.h('p', { class: 'cv-kicker' }, 'On the podcast'),
        CV.h('ul', null, eps.map(function (e) { var out = CV.parseDate(e.date) <= now; return CV.h('li', null, CV.h('b', null, 'Ep ' + e.n + ': ' + e.title), CV.h('span', { class: 'listen-when' + (out ? ' out' : '') }, out ? 'Out now' : CV.parseDate(e.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }))); })),
        /Do it before/.test(p.textContent) ? CV.h('p', { class: 'listen-extra' }, 'Do it before everyone’s back.') : null),
      eps.some(function (e) { return CV.parseDate(e.date) <= now; })
        ? CV.h('a', { class: 'tool primary', href: CV.PODCAST, rel: 'noopener' }, 'Listen')
        : CV.button('Remind me', function () {
            CV.ics(eps.map(function (e) { return { title: 'New episode: ' + e.title, date: CV.parseDate(e.date), description: 'The Small Business Cyber Security Guy, episode ' + e.n + '. Companion to the UK Small Business Cyber Outlook 2027.', url: CV.PODCAST }; }), 'cyber-outlook-episodes.ics');
          }, 'primary'));
    p.classList.add('listen-src'); p.setAttribute('aria-hidden', 'true');
    p.after(card);
  });
});
