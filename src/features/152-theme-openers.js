// @msg Theme openers: each of the three themes now opens with a giant numeral and its forecast set as a headline, so the structure is unmistakable
// @sel #theme-2
CV.ready(function () {
  ['theme-1', 'theme-2', 'theme-3', 'rules'].forEach(function (id, i) {
    var sec = document.getElementById(id); if (!sec) return;
    sec.classList.add('opener', 'op-' + (i + 1));
    var h = sec.querySelector('h2'); if (!h) return;
    var num = CV.h('span', { class: 'op-num', 'aria-hidden': 'true' }, i < 3 ? String(i + 1) : '+');
    sec.insertBefore(num, sec.firstChild);
  });
});
