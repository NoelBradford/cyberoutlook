// @msg Plan prompt: one quiet card after Theme 3's actions for readers who haven't done the check or started a plan
// @sel #theme-3
CV.ready(function () {
  // Inline, never fixed: it sits in the reading flow and can't cover the text or other buttons.
  function eligible() { return !CV.store.get('nudged', false) && !(CV.plan && CV.plan.count()) && !(CV.checkScore && CV.checkScore() != null); }
  if (!eligible()) return;
  var host = CV.$$('#theme-3 .table-wrap').pop(); if (!host) return;
  var card = CV.h('aside', { class: 'nudge cv-noprint', 'aria-label': 'Suggestion' },
    CV.h('p', { class: 'nudge-t' }, 'Turn what you’ve read into a plan'),
    CV.h('p', { class: 'nudge-s' }, 'Ten questions, about two minutes. Your gaps become actions you can give an owner and a date.'),
    CV.h('div', { class: 'cv-row' }, CV.button('Take the check', function () { done(); CV.openCheck && CV.openCheck(true); }, 'primary'), CV.button('No thanks', function () { done(); })));
  function done() { CV.store.set('nudged', true); card.remove(); }
  host.after(card);
  CV.on('check', function () { if (!eligible()) card.remove(); });
  CV.on('plan', function () { if (!eligible()) card.remove(); });
});
