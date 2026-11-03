// @msg The one-page plan comes alive: answer its five questions right on the page, fill in the business name and review date, and print it complete
// @sel #mvc .a4
CV.ready(function () {
  var a4 = CV.$('.a4'); if (!a4) return;
  var s = CV.store.get('a4', { q: {} });
  CV.$$('ol.q li', a4).forEach(function (li, i) {
    var ta = CV.h('textarea', { class: 'a4-ans', rows: '2', placeholder: 'Your answer', 'aria-label': 'Answer to: ' + CV.text(li) }); ta.value = s.q[i] || '';
    function grow() { ta.style.height = 'auto'; ta.style.height = Math.max(44, ta.scrollHeight) + 'px'; }
    ta.addEventListener('input', function () { s.q[i] = ta.value; CV.store.set('a4', s); grow(); CV.emit('a4', s); });
    li.appendChild(ta); setTimeout(grow, 0);
  });
  var head = a4.querySelector('.a4-head p');
  if (head) {
    var biz = CV.h('input', { type: 'text', class: 'a4-in', placeholder: 'Business', 'aria-label': 'Business name', autocomplete: 'organization' }); biz.value = s.biz || '';
    var rev = CV.h('input', { type: 'date', class: 'a4-in', 'aria-label': 'Reviewed on' }); rev.value = s.rev || '';
    biz.addEventListener('input', function () { s.biz = biz.value; CV.store.set('a4', s); });
    rev.addEventListener('change', function () { s.rev = rev.value; CV.store.set('a4', s); });
    var line = CV.h('p', { class: 'a4-line cv-noprint' }, 'Business: ', biz, ' Reviewed: ', rev);
    head.classList.add('a4-printonly'); head.after(line);
    // Mirror typed values into the printed line.
    function mirror() { head.textContent = 'Business: ' + (s.biz || '____________________') + '    Reviewed: ' + (s.rev ? CV.fmtDate(CV.parseDate(s.rev)) : '___ / ___ / 20___'); }
    biz.addEventListener('input', mirror); rev.addEventListener('change', mirror); if (s.biz || s.rev) mirror();
  }
});
