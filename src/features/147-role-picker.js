// @msg "I'm the…" picker: owners, office managers, IT leads and finance staff each get their own three-step route through the report
// @sel #start
CV.ready(function () {
  var start = CV.$('.start-inner'); if (!start) return;
  var ROUTES = {
    owner: { label: 'Owner or director', steps: [['Take the two-minute check', function () { CV.openCheck && CV.openCheck(); }], ['Read the executive summary', '#summary'], ['Name who owns cyber on the one-page plan', '#mvc']] },
    office: { label: 'Office manager', steps: [['Tick off the five things', '#h-if-you-do-five-things-before-january'], ['Print the call-back poster', function () { CV.openPoster && CV.openPoster(); }], ['Run the 90-day plan from your calendar', '#ninety']] },
    it: { label: 'IT lead or provider', steps: [['See what the rules now ask for', '#rules'], ['Read the four questions you’ll be asked', '#h-what-to-do'], ['Check the AI tool rule of three', '#theme-2']] },
    finance: { label: 'Finance or payments', steps: [['Read "Crime gets cheaper and faster"', '#theme-3'], ['Agree the call-back rule', function () { CV.openPoster && CV.openPoster(); }], ['Plan the spend', '#spend']] }
  };
  var role = CV.store.get('role', '');
  var box = CV.h('div', { class: 'rp' });
  var seg = CV.h('div', { class: 'rp-seg', role: 'radiogroup', 'aria-label': 'Your role' });
  var route = CV.h('ol', { class: 'rp-route', 'aria-live': 'polite' });
  Object.keys(ROUTES).forEach(function (k) {
    var b = CV.h('button', { type: 'button', role: 'radio', class: 'rp-opt', 'data-k': k }, ROUTES[k].label);
    b.addEventListener('click', function () { set(role === k ? '' : k); });
    seg.appendChild(b);
  });
  function set(k) {
    role = k; CV.store.set('role', k);
    CV.$$('.rp-opt', seg).forEach(function (b) { b.setAttribute('aria-checked', b.dataset.k === k ? 'true' : 'false'); });
    route.innerHTML = ''; box.classList.toggle('open', !!k);
    if (!k) return;
    ROUTES[k].steps.forEach(function (s, i) {
      var a = typeof s[1] === 'string' ? CV.h('a', { href: s[1], class: 'rp-step' }, CV.h('span', null, String(i + 1)), s[0]) : CV.h('button', { type: 'button', class: 'rp-step', onclick: s[1] }, CV.h('span', null, String(i + 1)), s[0]);
      route.appendChild(CV.h('li', null, a));
    });
    CV.emit('role', k);
  }
  box.appendChild(CV.h('p', { class: 'rp-q' }, 'I’m the…'));
  box.appendChild(seg); box.appendChild(route);
  start.appendChild(box);
  set(role);
});
