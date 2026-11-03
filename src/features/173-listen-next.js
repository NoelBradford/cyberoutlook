// @msg Listen next: each section recommends the back-catalogue episodes it cites, so curious readers become podcast listeners
// @sel #theme-2 .lnx
CV.ready(function () {
  var MAP = { numbers: ['s26'], 'theme-1': ['s29', 's28'], 'theme-2': ['s33', 's34'], 'theme-3': ['s36'], rules: ['s35'] };
  Object.keys(MAP).forEach(function (id) {
    var sec = document.getElementById(id); if (!sec) return;
    var eps = MAP[id].map(function (sid) {
      var li = document.getElementById(sid); if (!li) return null;
      var a = li.querySelector('a[href*="podcast."]'); if (!a) return null;
      var t = CV.text(li).replace(/^The Small Business Cyber Security Guy podcast\.\s*/, '');
      var m = t.match(/^(.*?)\.\s*(\d{1,2} \w+ \d{4})/); if (!m) return null;
      return { title: m[1], date: m[2], url: a.href };
    }).filter(Boolean);
    if (!eps.length) return;
    var shelf = CV.h('aside', { class: 'lnx cv-noprint', 'aria-label': 'Listen next' },
      CV.h('p', { class: 'cv-kicker' }, 'From the back catalogue'),
      CV.h('ul', null, eps.map(function (e) { return CV.h('li', null, CV.h('a', { href: e.url, rel: 'noopener', target: '_blank' }, CV.h('span', { class: 'lnx-play', 'aria-hidden': 'true' }, '▶'), CV.h('span', { class: 'lnx-t' }, CV.h('b', null, e.title), CV.h('span', null, e.date + ' · cited in this section')))); })));
    var nav = sec.querySelector('.next-sec'); if (nav) sec.insertBefore(shelf, nav); else sec.appendChild(shelf);
  });
});
