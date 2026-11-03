// @msg Meet the author: the colophon bio becomes a proper author card with the podcast, the blog and the companion series one tap away
// @sel .colophon
CV.ready(function () {
  var bio = CV.$('.colophon .bio'); if (!bio) return;
  var img = bio.querySelector('img');
  var next = CV.EPISODES.filter(function (e) { return CV.parseDate(e.date) >= CV.today(); })[0];
  var card = CV.h('section', { class: 'auth cv-noprint', 'aria-labelledby': 'auth-h' },
    img ? CV.h('img', { src: img.src, alt: '', width: '160', height: '160', loading: 'lazy', decoding: 'async' }) : null,
    CV.h('div', { class: 'auth-main' },
      CV.h('p', { class: 'cv-kicker' }, 'About the author'),
      CV.h('h2', { id: 'auth-h' }, 'Noel Bradford'),
      CV.h('p', { class: 'auth-role' }, 'The Small Business Cyber Security Guy'),
      CV.h('p', null, '45 years in IT leadership, from Intel to Disney to the BBC. Runs security for a security-first managed service provider, and hosts the podcast and blog for UK small businesses.'),
      next ? CV.h('p', { class: 'auth-next' }, CV.h('b', null, 'Next episode: '), 'Ep ' + next.n + ', “' + next.title + '”, ' + CV.parseDate(next.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) + '.') : null,
      CV.h('div', { class: 'cv-row' },
        CV.h('a', { class: 'tool primary', href: CV.PODCAST, rel: 'noopener', target: '_blank' }, 'Listen to the podcast'),
        CV.h('a', { class: 'tool', href: CV.AUTHOR_SITE, rel: 'noopener', target: '_blank' }, 'Read the blog'),
        CV.openShare ? CV.button('Share this report', CV.openShare) : null)));
  bio.parentNode.insertBefore(card, bio);
  bio.classList.add('auth-orig');
});
