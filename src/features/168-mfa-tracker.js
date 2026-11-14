// @msg MFA rollout tracker: list your cloud services and mark each one off, from no MFA to passkeys, with email first as the report advises
// @sel #h-what-to-do-3
CV.ready(function () {
  var SA = !!CV.standalone; // a page of its own (/mfa-tracker/)
  var h = CV.$('#h-what-to-do-3'); if (!h && !SA) return;
  var LV = [['none', 'Not on'], ['sms', 'Text message code'], ['app', 'Authenticator app'], ['key', 'Passkey or security key']];
  var s = CV.store.get('mfa', { list: [{ name: 'Email', lv: 'none' }, { name: 'Accounting software', lv: 'none' }, { name: 'Bank', lv: 'none' }] });
  var NOTE = 'From Theme 3: MFA is the floor for every account. Passkeys or security keys are stronger than codes by text message. Never switch MFA off because it’s inconvenient.';
  var d = SA ? CV.inlineHost({ id: 'mfa', label: 'MFA rollout tracker', note: NOTE }) : CV.dialog({ id: 'mfa', title: 'MFA rollout tracker', wide: true, note: NOTE });
  function save() { CV.store.set('mfa', s); render(); }
  function render() {
    var b = d.body; b.innerHTML = '';
    var on = s.list.filter(function (x) { return x.lv !== 'none'; }).length, strong = s.list.filter(function (x) { return x.lv === 'key'; }).length;
    b.appendChild(CV.h('div', { class: 'plan-sum' }, CV.h('div', { class: 'plan-bar', 'aria-hidden': 'true' }, CV.h('span', { style: 'width:' + (s.list.length ? on / s.list.length * 100 : 0) + '%' })),
      CV.h('p', null, CV.h('b', null, on + ' of ' + s.list.length), ' services have MFA on. ' + (strong ? strong + ' use passkeys or security keys.' : ''))));
    var ul = CV.h('ul', { class: 'mfa-list' });
    s.list.forEach(function (x, i) {
      var name = CV.h('input', { type: 'text', class: 'cv-input', value: x.name, 'aria-label': 'Service ' + (i + 1) });
      name.addEventListener('change', function () { x.name = name.value; save(); });
      var sel = CV.h('select', { class: 'cv-input', 'aria-label': 'MFA status for ' + x.name }); LV.forEach(function (l) { var o = CV.h('option', { value: l[0] }, l[1]); if (x.lv === l[0]) o.selected = true; sel.appendChild(o); });
      sel.addEventListener('change', function () { x.lv = sel.value; save(); });
      ul.appendChild(CV.h('li', { class: 'mfa-' + x.lv }, CV.h('span', { class: 'mfa-dot', 'aria-hidden': 'true' }), name, sel, CV.h('button', { type: 'button', class: 'plan-rm', 'aria-label': 'Remove ' + x.name, onclick: function () { s.list.splice(i, 1); save(); } }, '×')));
    });
    b.appendChild(ul);
    b.appendChild(CV.h('div', { class: 'cv-row' }, CV.button('+ Add a service', function () { s.list.push({ name: '', lv: 'none' }); save(); var ins = CV.$$('#mfa .mfa-list input'); ins[ins.length - 1].focus(); }),
      CV.plan ? CV.button('Add "MFA everywhere" to my plan', function () { CV.plan.add('t3-1'); }) : null,
      SA ? CV.h('a', { class: 'tool', href: '../#theme-3' }, 'Read why MFA comes first') : null));
    var email = s.list.filter(function (x) { return /mail|outlook|gmail|365/i.test(x.name); })[0];
    if (email && email.lv === 'none') b.appendChild(CV.h('p', { class: 'ce-fix' }, CV.h('b', null, 'Start with email. '), 'Whoever controls your email can reset almost every other password.'));
  }
  CV.openMfa = function () { render(); d.open(); };
  if (SA) return; // the call to action card is for the report
  var tw = h.closest('section').querySelector('.table-wrap');
  var host = h.parentNode.querySelector('p:last-of-type') || h;
  host.after(CV.h('div', { class: 'cta-card cv-noprint' }, CV.h('div', null, CV.h('p', { class: 'cv-kicker' }, 'Tool'), CV.h('p', { class: 'cta-title' }, 'Track your MFA rollout'), CV.h('p', { class: 'cta-sub' }, 'List every cloud service and mark it off, from no MFA to passkeys.')), CV.button('Start tracking', CV.openMfa, 'primary')));
});
