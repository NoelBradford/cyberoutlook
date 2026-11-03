// @msg First-visit tour: four quick pointers show new readers the check, the plan and the tools, once, and never again
// @sel #start
CV.ready(function () {
  if (CV.store.get('toured', false) || location.hash) return;
  var STEPS = [
    ['.path.primary', 'Start with the two-minute check', 'Ten yes-or-no questions. You get a score and your gaps, linked to the actions that fix them.'],
    ['.plan-tool', 'Build your plan', 'Add actions from anywhere in the report. Give each an owner and a date, then put them in your calendar.'],
    ['.tm-btn', 'Everything else is in Tools', 'Short version, focus mode, reading settings, notes, glossary, present to your team, and your data.'],
    ['.rp', 'Tell us who you are', 'Pick your role for a three-step route through the report.']
  ].filter(function (s) { return CV.$(s[0]); });
  if (!STEPS.length) return;
  var i = 0, ring = CV.h('div', { class: 'tour-ring', 'aria-hidden': 'true' });
  var box = CV.h('div', { class: 'tour', role: 'dialog', 'aria-modal': 'false', 'aria-labelledby': 'tour-t' });
  function end() { CV.store.set('toured', true); ring.remove(); box.remove(); window.removeEventListener('resize', place); window.removeEventListener('scroll', place); }
  function place() {
    var el = CV.$(STEPS[i][0]); if (!el) return end();
    var r = el.getBoundingClientRect();
    ring.style.cssText = 'transform:translate(' + (r.left - 6) + 'px,' + (r.top - 6) + 'px);width:' + (r.width + 12) + 'px;height:' + (r.height + 12) + 'px';
    var w = Math.min(320, window.innerWidth - 32); box.style.width = w + 'px';
    var x = Math.max(16, Math.min(window.innerWidth - w - 16, r.left)); var y = r.bottom + 14;
    if (y + box.offsetHeight > window.innerHeight - 12) y = Math.max(12, r.top - box.offsetHeight - 14);
    box.style.transform = 'translate(' + x + 'px,' + y + 'px)';
  }
  function show() {
    var s = STEPS[i], el = CV.$(s[0]);
    box.innerHTML = '';
    box.appendChild(CV.h('p', { class: 'cv-kicker' }, (i + 1) + ' of ' + STEPS.length));
    box.appendChild(CV.h('h2', { id: 'tour-t' }, s[1]));
    box.appendChild(CV.h('p', null, s[2]));
    var next = CV.button(i < STEPS.length - 1 ? 'Next' : 'Got it', function () { if (i < STEPS.length - 1) { i++; show(); } else end(); }, 'primary');
    box.appendChild(CV.h('div', { class: 'cv-row' }, next, CV.button('Skip the tour', end)));
    el.scrollIntoView({ block: 'center', behavior: 'auto' });
    setTimeout(function () { place(); next.focus({ preventScroll: true }); }, 30);
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && box.isConnected) end(); });
  window.addEventListener('resize', place); window.addEventListener('scroll', place, { passive: true });
  setTimeout(function () { if (CV.$('dialog[open]')) return; document.body.appendChild(ring); document.body.appendChild(box); show(); }, 1200);
});
