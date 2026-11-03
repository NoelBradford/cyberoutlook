// @msg Ask your suppliers: turn your five-and-five map into a short email asking each key supplier how and how fast they'd tell you about a breach
// @sel #fivefive
CV.ready(function () {
  var d = document.getElementById('fivefive'); if (!d) return;
  function names() { var ff = CV.store.get('fivefive', { s: [] }); return (ff.s || []).map(function (r) { return (r.name || '').trim(); }).filter(Boolean); }
  var who = CV.h('input', { type: 'text', placeholder: 'Your name and business', autocomplete: 'organization' }); who.value = CV.store.get('supmail-who', '');
  who.addEventListener('input', function () { CV.store.set('supmail-who', who.value); });
  function body(name) {
    return 'Hi' + (name ? ' ' + name + ' team' : '') + ',\n\nYou’re one of our most important suppliers, so we’re checking how we’d work together if either of us had a cyber incident.\n\n' +
      '1. If you were breached, or one of your own suppliers was, how and how quickly would you tell us?\n2. Who should we contact at your end, and on what number?\n3. If your service stopped for two weeks, what would you be able to keep running for us?\n\nA short reply is fine. We’ll keep it with our incident plan.\n\nThanks,\n' + (who.value.trim() || '[Your name]');
  }
  var box = CV.h('div', { class: 'se' },
    CV.h('h3', { class: 'qz-h' }, 'Ask your suppliers'),
    CV.h('p', { class: 'cta-sub' }, 'One short email per supplier: how they’d tell you about a breach, who to call, and what keeps running.'),
    CV.field('Sign it from', who),
    CV.h('div', { class: 'se-list' }));
  function render() {
    var list = box.querySelector('.se-list'); list.innerHTML = '';
    var n = names();
    if (!n.length) { list.appendChild(CV.h('p', { class: 'ff-empty' }, 'Add supplier names above and an email appears for each.')); return; }
    n.forEach(function (name) {
      var mail = CV.h('a', { class: 'tool', href: '#' }, 'Email ' + name);
      mail.addEventListener('click', function () { mail.href = 'mailto:?subject=' + encodeURIComponent('Quick question: if either of us had a cyber incident') + '&body=' + encodeURIComponent(body(name)); });
      list.appendChild(CV.h('div', { class: 'cv-row' }, mail, CV.button('Copy', function () { CV.copy(body(name), 'Email to ' + name + ' copied'); })));
    });
  }
  d.querySelector('.cv-dialog-body').appendChild(box);
  d.addEventListener('input', function (e) { if (e.target.closest('.ff-set')) render(); });
  render();
});
