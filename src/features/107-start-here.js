// Countdown to 1 January 2027, tied to the five-things checklist.
CV.ready(function () {
  var el = CV.$('#countdown'); if (!el) return;
  function count() { var d = 0; try { var s = JSON.parse(localStorage.getItem('cv-five-things') || '{}'); Object.keys(s).forEach(function (k) { if (s[k]) d++; }); } catch (e) {} return d; }
  function render() {
    var now = CV.today(), jan = new Date(2027, 0, 1), done = count();
    var days = Math.round((jan - now) / 86400000);
    // The count of things done is in its own span: once the progress line is on screen (a returning reader) it hides, so it is said once.
    if (days > 0) el.innerHTML = '<b>' + days + '</b> days to January.<span class="start-things"> ' + (done === 5 ? 'All five things done.' : done + ' of 5 things done.') + '</span>';
    else el.innerHTML = 'It’s 2027.<span class="start-things"> ' + (done === 5 ? 'All five things done.' : done + ' of the five things done.') + '</span>';
  }
  render();
  document.addEventListener('change', function (e) { if (e.target.closest && e.target.closest('#five')) render(); });
  document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('.five-reset')) setTimeout(render, 0); });
  CV.render = CV.render || {}; CV.render.countdown = render;
});
