// @msg Cover numbers strip: the three figures that frame the whole report sit right under the title, each linking to where it's explained
// @sel .cover
CV.ready(function () {
  var dek = CV.$('.cover .dek'); if (!dek || CV.$('.cover .cs')) return; // the strip is static HTML now
  var F = [
    ['1 in 5', 'UK businesses were victims of a cyber crime', '#h-43'],
    ['1 in 33', 'once you take phishing out', '#h-43'],
    ['21%', 'of micro firms have a formal incident plan', '#h-how-firms-are-preparing']
  ].filter(function (f) { return document.getElementById(f[2].slice(1)); });
  var strip = CV.h('ul', { class: 'cs', 'aria-label': 'Key figures' }, F.map(function (f) { return CV.h('li', null, CV.h('a', { href: f[2] }, CV.h('b', null, f[0]), CV.h('span', null, f[1]))); }));
  dek.after(strip);
  dek.after(CV.h('p', { class: 'cs-src' }, 'Cyber Security Breaches Survey 2025/26'));
  strip.after(CV.$('.cs-src'));
});
