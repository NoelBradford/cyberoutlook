// @msg Your data, your control: see exactly what this page has saved in your browser, back it up, move it to another device, or wipe it in one click
// @sel #disclaimer
CV.ready(function () {
  var LABELS = { 'cv:plan': 'My plan', 'cv:check': 'Exposure check answers', 'cv-five-things': 'Five things ticks', 'cv:ninety': '90-day plan ticks', 'cv-plan-contacts': 'Who-to-call contacts', 'cv:fivefive': 'Five-and-five map', 'cv:aitools': 'AI tool register', 'cv:poster': 'Poster details', 'cv:itmail': 'IT provider email details', 'cv:marks': 'Highlights and notes', 'cv:votes': 'Forecast reactions', 'cv:spend': 'Spend planner', 'cv:meeting': 'Team meeting details', 'cv:cert': 'Badge details', 'cv:pos': 'Reading position', 'cv:read': 'Reading settings', 'cv:short': 'Short version switch', 'cv:role': 'Your role', 'cv:rate': 'Read-aloud speed', 'cv:toured': 'First-visit tour seen', 'theme': 'Light or dark mode' };
  var d = CV.dialog({ id: 'mydata', title: 'Your data', wide: true, onopen: render, note: 'This site has no accounts, no tracking cookies and no server-side storage. Everything below lives in this browser on this device.' });
  function render() {
    var b = d.body; b.innerHTML = '';
    var keys = CV.store.keys();
    if (!keys.length) { b.appendChild(CV.h('p', null, 'Nothing saved yet.')); }
    else {
      var tb = CV.h('tbody');
      keys.forEach(function (k) { var v = ''; try { v = localStorage.getItem(k) || ''; } catch (e) {} tb.appendChild(CV.h('tr', null, CV.h('td', null, LABELS[k] || k), CV.h('td', null, v.length > 2 ? (Math.ceil(v.length / 100) / 10) + ' KB' : 'empty'))); });
      b.appendChild(CV.h('div', { class: 'table-wrap' }, CV.h('table', { class: 'md-t' }, CV.h('thead', null, CV.h('tr', null, CV.h('th', { scope: 'col' }, 'What'), CV.h('th', { scope: 'col' }, 'Size'))), tb)));
    }
    var file = CV.h('input', { type: 'file', accept: 'application/json,.json', class: 'cv-offscreen', id: 'md-file' });
    file.addEventListener('change', function () {
      var f = file.files[0]; if (!f) return; var r = new FileReader();
      r.onload = function () { try { var data = JSON.parse(r.result); if (data.app !== 'cyberoutlook') throw 0; Object.keys(data.items).forEach(function (k) { if (/^(cv:|cv-)|^theme$/.test(k)) localStorage.setItem(k, data.items[k]); }); CV.toast('Restored. Reloading'); setTimeout(function () { location.reload(); }, 700); } catch (e) { CV.toast('That file isn’t a Cyber Outlook backup'); } };
      r.readAsText(f);
    });
    b.appendChild(file);
    var confirmRow = CV.h('div', { class: 'md-confirm', hidden: true }, CV.h('p', null, CV.h('b', null, 'Delete everything? '), 'Your plan, ticks, notes and contacts will be gone from this browser.'),
      CV.button('Yes, delete it all', function () { CV.store.keys().forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} }); CV.toast('All your data deleted. Reloading'); setTimeout(function () { location.reload(); }, 700); }, 'primary md-danger'),
      CV.button('Cancel', function () { confirmRow.hidden = true; }));
    b.appendChild(CV.h('div', { class: 'cv-row' },
      CV.button('Download a backup', function () { var items = {}; CV.store.keys().forEach(function (k) { items[k] = localStorage.getItem(k); }); CV.download('cyber-outlook-backup.json', 'application/json', JSON.stringify({ app: 'cyberoutlook', saved: new Date().toISOString(), items: items }, null, 2)); }, 'primary'),
      CV.button('Restore from a backup', function () { file.click(); }),
      CV.button('Delete everything', function () { confirmRow.hidden = false; })));
    b.appendChild(confirmRow);
  }
  CV.openMyData = function () { d.open(); };
  if (CV.toolsMenu) CV.toolsMenu.add('Your data', CV.openMyData, 'Your work');
  var col = CV.$('.colophon'); if (col) col.appendChild(CV.h('p', { class: 'cv-noprint' }, 'This page keeps your plan and notes in your browser only. ', CV.h('button', { type: 'button', class: 'gl-open', onclick: CV.openMyData }, 'See or delete your data')));
});
