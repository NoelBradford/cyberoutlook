// @msg Every tool has its own link: share cyberoutlook.sbcsg.uk/#check, #plan, #poster and more, and the tool opens straight away
// @sel #start
CV.ready(function () {
  var R = {
    check: function () { CV.openCheck && CV.openCheck(); }, plan: function () { CV.plan && CV.plan.open(); }, share: function () { CV.openShare && CV.openShare(); },
    poster: function () { CV.openPoster && CV.openPoster(); }, itmail: function () { CV.openItMail && CV.openItMail(); }, fivefive: function () { CV.openFiveFive && CV.openFiveFive(); },
    aitools: function () { CV.openAiTools && CV.openAiTools(); }, readiness: function () { CV.openCE && CV.openCE(); }, progress: function () { CV.openProgress && CV.openProgress(); },
    forecasts: function () { CV.openForecasts && CV.openForecasts(); }, glossary: function () { CV.openGlossary && CV.openGlossary(); }, notes: function () { CV.openNotes && CV.openNotes(); },
    search: function () { CV.openSearch && CV.openSearch(); }, present: function () { CV.present && CV.present(); }, restore: function () { CV.openRestore && CV.openRestore(); },
    mfa: function () { CV.openMfa && CV.openMfa(); }, incident: function () { CV.openIncident && CV.openIncident(); }, mydata: function () { CV.openMyData && CV.openMyData(); }
  };
  CV.toolRoutes = Object.keys(R);
  function route() {
    var k = location.hash.slice(1); if (!R[k] || k === 'check') return; // #check is handled by the check itself
    history.replaceState(null, '', location.pathname + location.search);
    setTimeout(R[k], 50);
  }
  window.addEventListener('hashchange', route);
  route();
  // Let every tool dialog copy its own link.
  var MAP = { plan: 'plan', share: 'share', poster: 'poster', itmail: 'itmail', fivefive: 'fivefive', aitools: 'aitools', ce: 'readiness', progress: 'progress', forecasts: 'forecasts', glossary: 'glossary', restore: 'restore', mfa: 'mfa', check: 'check' };
  Object.keys(MAP).forEach(function (id) {
    var d = document.getElementById(id); if (!d) return;
    var head = d.querySelector('.cv-dialog-head'); if (!head) return;
    var b = CV.h('button', { type: 'button', class: 'dl-link', 'aria-label': 'Copy a link to this tool' }, 'Copy link');
    b.addEventListener('click', function () { CV.copy(CV.SITE + '#' + MAP[id], 'Link to this tool copied'); });
    head.insertBefore(b, head.querySelector('.cv-x'));
  });
});
