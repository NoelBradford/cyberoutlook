// @msg Send to the right person: role-based messages for your IT provider, finance lead, co-director or team, each pointing to the part they need
// @sel #start
CV.ready(function () {
  var d = document.getElementById('share'); if (!d) return;
  var body = d.querySelector('.cv-dialog-body');
  var ROLES = [
    { k: 'IT provider', anchor: '#h-what-to-do', msg: 'Hi, we’re working through the UK Small Business Cyber Outlook 2027 and want to go through the four questions for IT providers with you, plus one about backups. They’re here: ' },
    { k: 'Finance lead', anchor: '#theme-3', msg: 'Can you read the "Crime gets cheaper and faster" section of this? It covers payment fraud and the call-back rule we should agree before January: ' },
    { k: 'Co-director', anchor: '#summary', msg: 'Five-minute read before our next meeting: the executive summary of the UK Small Business Cyber Outlook 2027. Most of what it asks us to do is free: ' },
    { k: 'The whole team', anchor: '#h-if-you-do-five-things-before-january', msg: 'Five things we’re doing before January to keep the business safe. Please read this short list: ' }
  ];
  var ta = CV.h('textarea', { class: 'cv-input sh-text', id: 'col-text', 'aria-label': 'Message, editable', style: 'min-height:7rem' });
  var cur = ROLES[0];
  function set(r) { cur = r; ta.value = r.msg + CV.SITE + r.anchor; CV.$$('.col-tab', tabs).forEach(function (x) { x.setAttribute('aria-pressed', x.textContent === r.k ? 'true' : 'false'); }); }
  var tabs = CV.h('div', { class: 'sh-tabs' });
  ROLES.forEach(function (r) { var b = CV.h('button', { type: 'button', class: 'sh-tab col-tab' }, r.k); b.addEventListener('click', function () { set(r); }); tabs.appendChild(b); });
  CV.$$('.sh-tab', tabs).forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
  var wa = CV.h('a', { class: 'tool', href: '#', target: '_blank', rel: 'noopener' }, 'WhatsApp');
  wa.addEventListener('click', function () { wa.href = 'https://wa.me/?text=' + encodeURIComponent(ta.value); });
  var em = CV.h('a', { class: 'tool', href: '#' }, 'Email');
  em.addEventListener('click', function () { em.href = 'mailto:?subject=' + encodeURIComponent('Cyber Outlook 2027: for you') + '&body=' + encodeURIComponent(ta.value); });
  var block = CV.h('div', { class: 'col-block' },
    CV.h('h3', { class: 'qz-h' }, 'Send it to the right person'),
    CV.h('p', { class: 'cta-sub' }, 'Each message links straight to the part of the report that person needs.'),
    tabs, ta, CV.h('div', { class: 'cv-row' }, CV.button('Copy message', function () { CV.copy(ta.value, 'Message copied'); }, 'primary'), wa, em));
  body.insertBefore(block, body.children[1]);
  set(ROLES[0]);
});
