// @msg Every tool has its own link: share cyberoutlook.sbcsg.uk/#check, #plan, #poster and more, and the tool opens straight away
// @sel #start
CV.ready(function () {
  var R = {
    check: function () { CV.openCheck && CV.openCheck(); }, plan: function () { CV.plan && CV.plan.open(); }, share: function () { CV.openShare && CV.openShare(); },
    poster: function () { CV.openPoster && CV.openPoster(); }, itmail: function () { CV.openItMail && CV.openItMail(); }, fivefive: function () { CV.openFiveFive && CV.openFiveFive(); },
    aitools: function () { CV.openAiTools && CV.openAiTools(); }, readiness: function () { CV.openCE && CV.openCE(); }, progress: function () { CV.openProgress && CV.openProgress(); },
    forecasts: function () { CV.openForecasts && CV.openForecasts(); }, glossary: function () { CV.openGlossary && CV.openGlossary(); }, notes: function () { CV.openNotes && CV.openNotes(); },
    search: function () { CV.openSearch && CV.openSearch(); }, present: function () { CV.present && CV.present(); }, restore: function () { CV.openRestore && CV.openRestore(); },
    // toolkit: the Toolkit loads after this file, so on a cold visit wait for it
    toolkit: function () { if (CV.openToolkit) CV.openToolkit(); else CV.on('ready', function () { CV.openToolkit && CV.openToolkit(); }); }, mfa: function () { CV.openMfa && CV.openMfa(); }, incident: function () { CV.openIncident && CV.openIncident(); }, mydata: function () { CV.openMyData && CV.openMyData(); }
  };
  CV.toolRoutes = Object.keys(R);
  function route() {
    var k = location.hash.slice(1); if (!R[k] || k === 'check') return; // #check is handled by the check itself
    history.replaceState(null, '', location.pathname + location.search);
    setTimeout(R[k], 50);
  }
  window.addEventListener('hashchange', route);
  route();
});
