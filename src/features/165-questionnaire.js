// @msg Supplier questionnaire answers: fill in a few facts once and get paste-ready answers for the cyber questions customers and insurers now ask
// @sel #rules .example
CV.ready(function () {
  var ex = CV.$$('#rules .example').pop(); if (!ex) return;
  var s = CV.store.get('sq', {});
  function sel(id, opts, v) { var e = CV.h('select', { id: id }); opts.forEach(function (o) { var op = CV.h('option', { value: o[0] }, o[1]); if (v === o[0]) op.selected = true; e.appendChild(op); }); return e; }
  var f = {
    ce: sel('sq-ce', [['', 'Choose'], ['plus', 'Yes, Cyber Essentials Plus'], ['yes', 'Yes, Cyber Essentials'], ['booked', 'Booked, not yet certified'], ['no', 'No']], s.ce),
    cert: CV.h('input', { id: 'sq-cert', type: 'text', placeholder: 'Certificate number and expiry' }),
    mfa: sel('sq-mfa', [['', 'Choose'], ['all', 'On every cloud service'], ['most', 'On most services, rolling out'], ['no', 'Not yet']], s.mfa),
    plan: sel('sq-plan', [['', 'Choose'], ['yes', 'Yes, written and printed'], ['no', 'Not yet']], s.plan),
    who: CV.h('input', { id: 'sq-who', type: 'text', placeholder: 'Name, role' }),
    tel: CV.h('input', { id: 'sq-tel', type: 'text', placeholder: 'Phone and email' }),
    restore: CV.h('input', { id: 'sq-restore', type: 'date' })
  };
  f.cert.value = s.cert || ''; f.who.value = s.who || ''; f.tel.value = s.tel || ''; f.restore.value = s.restore || '';
  var out = CV.h('pre', { class: 'cv-pre', 'aria-live': 'polite' });
  function text() {
    var L = [];
    L.push('Q: Do you hold Cyber Essentials?\nA: ' + ({ plus: 'Yes, Cyber Essentials Plus.', yes: 'Yes, Cyber Essentials.', booked: 'Our assessment is booked.', no: 'Not yet. We are working towards it.' }[f.ce.value] || '[answer]') + (f.cert.value && /plus|yes/.test(f.ce.value) ? ' Certificate: ' + f.cert.value + '.' : ''));
    L.push('Q: Is multi-factor authentication enabled on all cloud services?\nA: ' + ({ all: 'Yes, on every cloud service that supports it.', most: 'On most services, with the remainder being rolled out.', no: 'Not yet. It is being rolled out, starting with email.' }[f.mfa.value] || '[answer]'));
    L.push('Q: Do you have an incident response plan?\nA: ' + ({ yes: 'Yes. A written one-page plan, with a printed copy kept off site.', no: 'We are writing one.' }[f.plan.value] || '[answer]'));
    L.push('Q: Who is your named contact for security incidents, and how quickly will you notify us?\nA: ' + (f.who.value || '[name, role]') + ', ' + (f.tel.value || '[phone and email]') + '. We will notify you within 24 hours of becoming aware of an incident that affects you.');
    L.push('Q: When did you last test restoring from backup?\nA: ' + (f.restore.value ? CV.fmtDate(CV.parseDate(f.restore.value)) + '.' : '[date]'));
    return L.join('\n\n');
  }
  var touched = false;
  Object.keys(f).forEach(function (k) { f[k].addEventListener('input', function () { touched = true; }, true); f[k].addEventListener('change', function () { touched = true; }, true); });
  function refresh() { Object.keys(f).forEach(function (k) { s[k] = f[k].value; }); if (touched) CV.store.set('sq', s); out.textContent = text(); }
  Object.keys(f).forEach(function (k) { f[k].addEventListener('input', refresh); f[k].addEventListener('change', refresh); });
  var d = CV.dialog({ id: 'sq', title: 'Questionnaire answers', wide: true, note: 'Only answer "yes" where it’s true. The 24-hour line matches the notification window customers are starting to ask for; change it if your contract says otherwise.' });
  d.body.appendChild(CV.h('div', { class: 'cv-grid2' }, CV.field('Cyber Essentials', f.ce), CV.field('Certificate details', f.cert), CV.field('Multi-factor authentication', f.mfa), CV.field('Incident plan', f.plan), CV.field('Incident contact', f.who), CV.field('Contact details', f.tel), CV.field('Last restore test', f.restore)));
  d.body.appendChild(out);
  d.body.appendChild(CV.h('div', { class: 'cv-row' }, CV.button('Copy the answers', function () { CV.copy(text(), 'Answers copied'); }, 'primary'), CV.openCE ? CV.button('Check Cyber Essentials readiness', function () { d.close(); CV.openCE(); }) : null));
  refresh();
  ex.after(CV.h('div', { class: 'cta-card cv-noprint' }, CV.h('div', null, CV.h('p', { class: 'cv-kicker' }, 'Tool'), CV.h('p', { class: 'cta-title' }, 'Make Gary’s ten-minute form yours'), CV.h('p', { class: 'cta-sub' }, 'Fill in a few facts once. Get paste-ready answers for supplier and insurance questionnaires.')), CV.button('Write my answers', function () { d.open(); }, 'primary')));
});
