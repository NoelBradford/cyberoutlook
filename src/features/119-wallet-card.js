// @msg Wallet card: print your "who to call" contacts as cards for every wallet and the office
// @sel #mvc .plan-tools
CV.ready(function () {
  var rows = CV.$$('.a4 tbody tr'); if (!rows.length) return;
  function contacts() {
    var saved = {}; try { saved = JSON.parse(localStorage.getItem('cv-plan-contacts') || '{}'); } catch (e) {}
    var cells = CV.$$('.a4 td.fill');
    return rows.map(function (tr) { var c = tr.children; var fill = tr.querySelector('td.fill'); var idx = cells.indexOf(fill); return { n: CV.text(c[0]), who: CV.text(c[1]), when: CV.text(c[2]), contact: (idx > -1 && saved[idx]) ? saved[idx] : (fill ? CV.text(fill) : '') }; });
  }
  function card() {
    var list = contacts();
    return CV.h('div', { class: 'wc' },
      CV.h('div', { class: 'wc-head' }, CV.h('b', null, 'Cyber incident?'), CV.h('span', null, 'Call in this order')),
      CV.h('ol', null, list.map(function (x) { return CV.h('li', null, CV.h('span', { class: 'wc-who' }, x.who.replace(/\s*\(.*\)$/, '')), CV.h('span', { class: 'wc-c' }, x.contact || ' ')); })),
      CV.h('p', { class: 'wc-foot' }, 'From our one-page plan · cyberoutlook.sbcsg.uk'));
  }
  function print() {
    var sheet = CV.h('div', { class: 'wc-sheet' }, card(), card(), card(), card(), card(), card());
    CV.printSheet(sheet);
  }
  var tools = CV.$('.plan-tools');
  if (tools) {
    var b = CV.button('Print wallet cards', print);
    b.title = 'Six credit-card-sized copies of your contact list on one page';
    tools.insertBefore(b, tools.querySelector('.plan-note'));
  }
  CV.printWalletCards = print;
});
