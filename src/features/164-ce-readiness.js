// @msg Cyber Essentials readiness check: five questions based on the new v3.3 rules tell you what to fix before you book an assessment
// @sel #rules
CV.ready(function () {
  var SA = !!CV.standalone; // a page of its own (/readiness/): no report behind it
  var h = CV.$$('#rules h3').filter(function (x) { return /Cyber Essentials, Requirements/.test(x.textContent); })[0];
  if (!h && !SA) return; // on the report, do nothing unless the rules section is there
  var Q = [
    { q: 'Is multi-factor authentication switched on for every cloud service that offers it, free or paid?', fix: 'Missing MFA on any cloud service where it’s available is an automatic fail under v3.3.', must: true },
    { q: 'Have you listed every cloud service you use, including email, accounting and booking systems?', fix: 'Cloud services can’t be excluded from scope, so you need the full list.', must: true },
    { q: 'Do the owner and finance staff sign in with passkeys or security keys where possible?', fix: 'Passwordless sign-in and passkeys are highlighted as good practice. Not required, but worth doing.', must: false },
    { q: 'Are automatic updates switched on for every laptop and phone?', fix: 'Keeping devices updated is one of the basic controls the certificate checks.', must: true },
    { q: 'Do you know who will do your assessment and roughly when?', fix: 'The 90-day plan books it in week 11. A certification body or your IT provider can help.', must: false }
  ];
  var ans = CV.store.get('ce', {});
  var NOTE = 'A quick self-check based on the changes described in this report. Only an assessment tells you whether you pass.';
  var d = SA ? CV.inlineHost({ id: 'ce', label: 'Cyber Essentials readiness', note: NOTE }) : CV.dialog({ id: 'ce', title: 'Cyber Essentials readiness', wide: true, note: NOTE });
  function render() {
    var b = d.body; b.innerHTML = '';
    var list = CV.h('ol', { class: 'ce-list' });
    Q.forEach(function (x, i) {
      var g = CV.h('div', { class: 'ce-opts', role: 'radiogroup', 'aria-label': x.q });
      [['yes', 'Yes'], ['no', 'No']].forEach(function (o) {
        var id = 'ce-' + i + '-' + o[0]; var r = CV.h('input', { type: 'radio', name: 'ce-' + i, id: id }); r.checked = ans[i] === o[0];
        r.addEventListener('change', function () { ans[i] = o[0]; CV.store.set('ce', ans); render(); var f = document.getElementById(id); if (f) f.focus(); });
        g.appendChild(CV.h('span', { class: 'ce-o' }, r, CV.h('label', { for: id }, o[1])));
      });
      list.appendChild(CV.h('li', { class: ans[i] === 'no' ? 'no' : ans[i] === 'yes' ? 'yes' : '' }, CV.h('p', null, x.q, x.must ? '' : CV.h('span', { class: 'ce-opt' }, ' Good practice')), g, ans[i] === 'no' ? CV.h('p', { class: 'ce-fix' }, x.fix) : null));
    });
    b.appendChild(list);
    var answered = Object.keys(ans).length, blockers = Q.filter(function (x, i) { return x.must && ans[i] === 'no'; }).length;
    if (answered === Q.length) b.appendChild(CV.h('div', { class: 'ce-res ' + (blockers ? 'fix' : 'ok') }, CV.h('b', null, blockers ? blockers + ' thing' + (blockers === 1 ? '' : 's') + ' to fix before you book.' : 'No blockers among these basics.'), ' ', blockers ? 'Fix the items marked above first.' : 'This is a quick check, not the full requirements. Before you book, go through the official Cyber Essentials requirements for firewalls, malware protection, admin accounts and unsupported software, or ask your IT provider to.'));
    // On a page of its own the one next step is the report's section on the rules, so there is no plan button.
    b.appendChild(CV.h('div', { class: 'cv-row' }, !SA && CV.plan ? CV.button('Add "MFA on every cloud service" to my plan', function () { CV.plan.add('t3-1'); }) : null, CV.button('Start again', function () { ans = {}; CV.store.set('ce', ans); render(); }),
      SA ? CV.h('a', { class: 'tool primary', href: '../#rules' }, 'Read what the rules change') : null));
  }
  var p = h && h.nextElementSibling; while (p && p.tagName !== 'UL') p = p.nextElementSibling;
  if (h) (p || h).after(CV.h('div', { class: 'cta-card cv-noprint' }, CV.h('div', null, CV.h('p', { class: 'cv-kicker' }, 'Tool'), CV.h('p', { class: 'cta-title' }, 'Are you ready for Cyber Essentials?'), CV.h('p', { class: 'cta-sub' }, 'Five questions based on the v3.3 changes. See what to fix before you book.')), CV.button('Check my readiness', function () { render(); d.open(); }, 'primary')));
  CV.openCE = function () { render(); d.open(); };
});
