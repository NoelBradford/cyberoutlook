// @msg IT provider email builder: the four questions plus the backup question, ready to send
// @sel #h-what-to-do
CV.ready(function () {
  var h = CV.$('#h-what-to-do'); if (!h) return;
  var ol = h.parentNode.querySelector('ol'); if (!ol) return;
  var qs = CV.$$('li', ol).map(CV.text);
  var backup = 'Where are our backups held, by whom, and is there a copy with a different supplier?';
  var saved = CV.store.get('itmail', {});
  var d = CV.dialog({ id: 'itmail', title: 'Email your IT provider', wide: true, note: 'Nothing is sent from this page. Copy the email, or open it in your own email app.' });
  var prov = CV.h('input', { type: 'text', id: 'im-prov', autocomplete: 'organization', placeholder: 'e.g. Acme IT' });
  var who = CV.h('input', { type: 'text', id: 'im-who', autocomplete: 'name', placeholder: 'Your name' });
  var firm = CV.h('input', { type: 'text', id: 'im-firm', autocomplete: 'organization', placeholder: 'Your business' });
  var inclB = CV.h('input', { type: 'checkbox', id: 'im-b' }); inclB.checked = saved.b !== false;
  prov.value = saved.prov || ''; who.value = saved.who || ''; firm.value = saved.firm || '';
  var pre = CV.h('pre', { class: 'cv-pre', 'aria-live': 'polite' });
  function body() {
    var list = qs.slice(); if (inclB.checked) list.push(backup);
    return 'Hi' + (prov.value ? ' ' + prov.value.trim() + ' team' : '') + ',\n\nAs part of our cyber security review for 2027, could you answer these ' + list.length + ' questions in writing?\n\n' +
      list.map(function (q, i) { return (i + 1) + '. ' + q; }).join('\n') +
      '\n\nWe’d like to keep your answers on file with our incident plan. A reply within two weeks would be great.\n\nThanks,\n' + (who.value.trim() || '[Your name]') + (firm.value.trim() ? '\n' + firm.value.trim() : '');
  }
  function subject() { return 'Cyber security questions for 2027' + (firm.value.trim() ? ' (' + firm.value.trim() + ')' : ''); }
  var touched = false;
  function refresh() { pre.textContent = 'Subject: ' + subject() + '\n\n' + body(); if (!touched) return; saved = { prov: prov.value, who: who.value, firm: firm.value, b: inclB.checked }; CV.store.set('itmail', saved); }
  [prov, who, firm, inclB].forEach(function (i) { i.addEventListener('input', function () { touched = true; }, true); i.addEventListener('change', function () { touched = true; }, true); });
  [prov, who, firm, inclB].forEach(function (i) { i.addEventListener('input', refresh); i.addEventListener('change', refresh); });
  var mail = CV.h('a', { class: 'tool', href: '#' }, 'Open in my email app');
  mail.addEventListener('click', function () { mail.href = 'mailto:?subject=' + encodeURIComponent(subject()) + '&body=' + encodeURIComponent(body()); });
  d.body.appendChild(CV.h('div', { class: 'cv-grid2' }, CV.field('IT provider', prov), CV.field('Your name', who), CV.field('Your business', firm)));
  d.body.appendChild(CV.h('div', { class: 'qz-opt-inline' }, inclB, CV.h('label', { for: 'im-b' }, 'Include the fifth question about backups (recommended for 2027)')));
  d.body.appendChild(pre);
  d.body.appendChild(CV.h('div', { class: 'cv-row' }, CV.button('Copy email', function () { CV.copy('Subject: ' + subject() + '\n\n' + body(), 'Email copied'); }, 'primary'), mail,
    CV.plan ? CV.button('Add "send the questions" to my plan', function () { CV.plan.add('t1-2'); }) : null));
  refresh();
  var cta = CV.h('div', { class: 'cta-card cv-noprint' },
    CV.h('div', null, CV.h('p', { class: 'cv-kicker' }, 'Tool'), CV.h('p', { class: 'cta-title' }, 'Turn these into an email in 30 seconds'),
      CV.h('p', { class: 'cta-sub' }, 'Add your IT provider’s name and yours. Copy it or open it in your email app.')),
    CV.button('Write the email', function () { d.open(); prov.focus(); }, 'primary'));
  var after = ol.nextElementSibling && ol.nextElementSibling.tagName === 'P' ? ol.nextElementSibling : ol;
  after.after(cta);
  CV.openItMail = function () { d.open(); };
});
