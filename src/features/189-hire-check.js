// @msg Remote hire check: a quick checklist and record for each freelancer you take on, built from Theme 1's "freelancer who isn't" advice
// @sel #theme-1 .table-wrap
CV.ready(function () {
  var tw = CV.$$('#theme-1 .cta-card').pop() || CV.$('#theme-1 .table-wrap'); if (!tw) return;
  var STEPS = ['Video call with camera on', 'Photo ID checked on the call, and it matches', 'Bank account is in their own name', 'You’ve written down what you checked and when'];
  var recs = CV.store.get('hires', []);
  var d = CV.dialog({ id: 'hires', title: 'Remote hire check', wide: true, note: 'From Theme 1: verify remote freelance hires on a video call with photo ID, and pay only into accounts in their own name.' });
  function render() {
    var b = d.body; b.innerHTML = '';
    var name = CV.h('input', { type: 'text', id: 'hr-name', placeholder: 'Name and role, e.g. "A. Patel, web developer"' });
    var boxes = STEPS.map(function (s, i) { var cb = CV.h('input', { type: 'checkbox', id: 'hr-' + i }); return [cb, CV.h('div', { class: 'qz-opt-inline' }, cb, CV.h('label', { for: 'hr-' + i }, s))]; });
    b.appendChild(CV.field('Who are you hiring?', name));
    b.appendChild(CV.h('div', { class: 'hr-steps' }, boxes.map(function (x) { return x[1]; })));
    b.appendChild(CV.h('div', { class: 'cv-row' }, CV.button('Save this check', function () {
      if (!name.value.trim()) { name.focus(); CV.toast('Add a name first'); return; }
      var ok = boxes.map(function (x) { return x[0].checked; });
      recs.push({ who: name.value.trim(), ok: ok, at: new Date().toISOString().slice(0, 10) }); CV.store.set('hires', recs);
      CV.toast(ok.every(Boolean) ? 'Saved. All checks done' : 'Saved. Some checks still open'); render();
    }, 'primary'), CV.plan ? CV.button('Add this action to my plan', function () { CV.plan.add('t1-4'); }) : null));
    if (recs.length) {
      b.appendChild(CV.h('h3', { class: 'qz-h' }, 'Your records'));
      b.appendChild(CV.h('ul', { class: 'hr-recs' }, recs.slice().reverse().map(function (r) { var n = r.ok.filter(Boolean).length; return CV.h('li', { class: n === STEPS.length ? 'ok' : 'open' }, CV.h('b', null, r.who), CV.h('span', null, CV.fmtDate(CV.parseDate(r.at)) + ' · ' + n + ' of ' + STEPS.length + ' checks')); })));
      b.appendChild(CV.h('div', { class: 'cv-row' }, CV.button('Copy records', function () { CV.copy('REMOTE HIRE CHECKS\n' + recs.map(function (r) { return r.at + ' | ' + r.who + ' | ' + STEPS.map(function (s, i) { return (r.ok[i] ? '[x] ' : '[ ] ') + s; }).join('; '); }).join('\n'), 'Records copied'); })));
    }
  }
  CV.openHires = function () { render(); d.open(); };
  tw.after(CV.h('div', { class: 'cta-card cv-noprint' }, CV.h('div', null, CV.h('p', { class: 'cv-kicker' }, 'Tool'), CV.h('p', { class: 'cta-title' }, 'Check remote hires properly'), CV.h('p', { class: 'cta-sub' }, 'Four checks before a freelancer gets access, and a record that you did them.')), CV.button('Start a hire check', CV.openHires, 'primary')));
});
