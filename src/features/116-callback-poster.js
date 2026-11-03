// @msg Call-back rule poster: print an A4 poster for the office wall, with your business name and who to call
// @sel #h-what-to-do-3
CV.ready(function () {
  // Shared helper: print one generated sheet on its own.
  CV.printSheet = function (el) {
    CV.$$('.cv-sheet').forEach(function (n) { n.remove(); });
    el.classList.add('cv-sheet'); document.body.appendChild(el);
    document.body.classList.add('print-sheet');
    CV.$$('dialog[open]').forEach(function (d) { d.close(); });
    setTimeout(function () { window.print(); }, 60);
  };
  window.addEventListener('afterprint', function () { document.body.classList.remove('print-sheet'); });
  var saved = CV.store.get('poster', {});
  var d = CV.dialog({ id: 'poster', title: 'Call-back rule poster', note: 'The rule is the one in this report: no change to bank details or urgent payment goes through without a phone call to a number you already hold.' });
  var firm = CV.h('input', { type: 'text', autocomplete: 'organization', placeholder: 'Your business' }); firm.value = saved.firm || '';
  var who = CV.h('input', { type: 'text', placeholder: 'e.g. Priya in accounts, 01234 567890' }); who.value = saved.who || '';
  var word = CV.h('input', { type: 'checkbox', id: 'pst-word' }); word.checked = !!saved.word;
  function build() {
    return CV.h('div', { class: 'poster' },
      CV.h('p', { class: 'pst-firm' }, (firm.value.trim() || 'Our business') + ' · payment rule'),
      CV.h('h2', null, 'Stop. ', CV.h('span', null, 'Call back.')),
      CV.h('p', { class: 'pst-rule' }, 'No change to bank details or urgent payment goes through without a phone call to a number we already hold.'),
      CV.h('ol', null,
        CV.h('li', null, 'Don’t use any number, link or contact in the email, text or message asking for the change.'),
        CV.h('li', null, 'Call the person on the number already in our records.'),
        word.checked ? CV.h('li', null, 'Ask for our code word. No code word, no payment.') : null,
        CV.h('li', null, 'Urgency is a warning sign, not a reason to skip this. Directors included.')),
      CV.h('p', { class: 'pst-who' }, 'Not sure? Ask ', CV.h('b', null, who.value.trim() || '____________________'), ' before you pay.'),
      CV.h('p', { class: 'pst-src' }, 'From the UK Small Business Cyber Outlook 2027 · cyberoutlook.sbcsg.uk'));
  }
  var prev = CV.h('div', { class: 'pst-preview', 'aria-hidden': 'true' });
  var touched = false;
  [firm, who, word].forEach(function (i) { i.addEventListener('input', function () { touched = true; }, true); i.addEventListener('change', function () { touched = true; }, true); });
  function refresh() { if (touched) { saved = { firm: firm.value, who: who.value, word: word.checked }; CV.store.set('poster', saved); } prev.innerHTML = ''; prev.appendChild(build()); }
  [firm, who, word].forEach(function (i) { i.addEventListener('input', refresh); i.addEventListener('change', refresh); });
  d.body.appendChild(CV.h('div', { class: 'cv-grid2' }, CV.field('Business name', firm), CV.field('Who to ask if unsure', who)));
  d.body.appendChild(CV.h('div', { class: 'qz-opt-inline' }, word, CV.h('label', { for: 'pst-word' }, 'We also use a code word for urgent payment requests')));
  d.body.appendChild(prev);
  d.body.appendChild(CV.h('div', { class: 'cv-row' }, CV.button('Print the poster', function () { CV.printSheet(build()); }, 'primary')));
  refresh();
  CV.openPoster = function () { d.open(); };
  var h = CV.$('#h-what-to-do-3'), tbl = h && h.closest('section').querySelector('.table-wrap');
  if (tbl) tbl.after(CV.h('div', { class: 'cta-card cv-noprint' },
    CV.h('div', null, CV.h('p', { class: 'cv-kicker' }, 'Tool'), CV.h('p', { class: 'cta-title' }, 'Put the call-back rule on the wall'),
      CV.h('p', { class: 'cta-sub' }, 'Print an A4 poster for everyone who touches payments.')),
    CV.button('Make the poster', function () { d.open(); }, 'primary')));
});
