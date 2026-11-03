// Offline reading: register the service worker and show a quiet "available offline" note.
CV.ready(function () {
  if (!('serviceWorker' in navigator) || location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') return;
  var note = CV.h('p', { class: 'off-note', 'aria-live': 'polite', hidden: true });
  var cnt = CV.$('.start-head'); if (cnt) cnt.appendChild(note);
  function online() { note.textContent = navigator.onLine ? '✓ Saved for offline reading' : 'You’re offline. Reading the saved copy.'; note.classList.toggle('off', !navigator.onLine); }
  window.addEventListener('online', online); window.addEventListener('offline', online);
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js').then(function (reg) { return navigator.serviceWorker.ready; }).then(function () { note.hidden = false; online(); }).catch(function () {});
  });
});
