// @msg Halfway nudge: readers who are deep in the report but haven't started a plan get one gentle, dismissible prompt to turn reading into action
// @sel #theme-3
CV.ready(function () {
  if (CV.store.get('nudged', false)) return;
  var shown = false;
  function eligible() { return !(CV.plan && CV.plan.count()) && !(CV.checkScore && CV.checkScore() != null) && !CV.$('dialog[open]') && !CV.$('.tour'); }
  var card = CV.h('aside', { class: 'nudge', role: 'complementary', 'aria-label': 'Suggestion' },
    CV.h('p', { class: 'cv-kicker' }, 'You’re halfway through'),
    CV.h('p', { class: 'nudge-t' }, 'Turn this into a plan in two minutes'),
    CV.h('p', { class: 'nudge-s' }, 'Answer ten yes-or-no questions and get your gaps as dated actions.'),
    CV.h('div', { class: 'cv-row' }, CV.button('Take the check', function () { done(); CV.openCheck && CV.openCheck(true); }, 'primary'), CV.button('Not now', function () { done(); })));
  function done() { CV.store.set('nudged', true); card.classList.remove('show'); setTimeout(function () { card.remove(); }, 300); window.removeEventListener('scroll', check); }
  function check() {
    if (shown) return;
    var h = document.documentElement.scrollHeight - window.innerHeight; if (h <= 0) return;
    if (window.scrollY / h > 0.45 && eligible()) { shown = true; document.body.appendChild(card); setTimeout(function () { card.classList.add('show'); }, 30); }
  }
  window.addEventListener('scroll', check, { passive: true });
});
