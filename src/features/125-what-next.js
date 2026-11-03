// @msg What next: a closing panel after the 90-day plan with three clear routes: do it, share it, keep listening
// @sel #what-next
CV.ready(function () {
  var after = CV.$('#ninety'); if (!after) return;
  var five = 0; try { var s = JSON.parse(localStorage.getItem('cv-five-things') || '{}'); Object.keys(s).forEach(function (k) { if (s[k]) five++; }); } catch (e) {}
  function card(k, title, sub, btn, fn, primary) {
    return CV.h('div', { class: 'wn-card' + (primary ? ' primary' : '') }, CV.h('p', { class: 'cv-kicker' }, k), CV.h('p', { class: 'wn-t' }, title), CV.h('p', { class: 'wn-s' }, sub), btn ? CV.button(btn, fn, primary ? 'primary' : '') : null);
  }
  var panel = CV.h('section', { class: 'what-next cv-noprint', id: 'what-next', 'aria-labelledby': 'wn-h' },
    CV.h('h2', { id: 'wn-h' }, 'What next?'),
    CV.h('p', { class: 'wn-lead' }, 'You’ve read the plan. Here’s how to make it happen.'),
    CV.h('div', { class: 'wn-grid' },
      card('Do it', CV.plan && CV.plan.count() ? 'Open your plan' : 'Build your plan', CV.plan && CV.plan.count() ? CV.plan.count() + ' actions saved. Give each an owner and a date.' : 'Take the two-minute check and turn your gaps into dated actions.',
        CV.plan && CV.plan.count() ? 'Open my plan' : 'Take the check', function () { if (CV.plan && CV.plan.count()) CV.plan.open(); else if (CV.openCheck) CV.openCheck(true); }, true),
      card('Share it', 'Send it to one business owner', 'A link and one line from you is the easiest way to get it in front of someone who needs it.', 'Share the report', function () { if (CV.openShare) CV.openShare(); else CV.copy(CV.SITE, 'Link copied'); }),
      card('Keep going', 'Nine weekly episodes', 'The podcast series walks through every theme, Mondays to 28 December.', 'Go to the podcast', function () { window.open(CV.PODCAST, '_blank', 'noopener'); })),
    CV.h('p', { class: 'wn-five' }, five === 5 ? 'You’ve done all five things. That’s the floor in place.' : 'Five things done so far: ' + five + ' of 5. ', five < 5 ? CV.h('a', { href: '#h-if-you-do-five-things-before-january' }, 'Finish the list') : null));
  after.after(panel);
});
