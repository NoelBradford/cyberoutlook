// Mark the page ready once every feature has started, so the toolbar can drop its reserved height.
(function () {
  var done = function () { document.documentElement.classList.add('cv-ready'); };
  document.addEventListener('cv:ready', done);
  setTimeout(done, 6000); // never hold the toolbar for longer than this
})();
