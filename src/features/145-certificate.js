// @msg Five-things badge: finish all five and make a branded "done before January" badge to download or post on LinkedIn
// @sel #h-if-you-do-five-things-before-january
CV.ready(function () {
  var list = CV.$('#five'); if (!list) return;
  function count() { return CV.$$('input:checked', list).length; }
  var saved = CV.store.get('cert', {});
  var d = CV.dialog({ id: 'cert', title: 'You did the five things', note: 'The badge is made in your browser. Nothing is checked or sent anywhere.' });
  var firm = CV.h('input', { type: 'text', autocomplete: 'organization', placeholder: 'Your business (optional)' }); firm.value = saved.firm || '';
  var img = CV.h('img', { class: 'sc-img', alt: '' });
  var canvas;
  function draw() {
    var c = document.createElement('canvas'); c.width = 1200; c.height = 1200; var x = c.getContext('2d');
    x.fillStyle = '#0e161b'; x.fillRect(0, 0, 1200, 1200);
    x.strokeStyle = '#e6b043'; x.lineWidth = 10; x.strokeRect(60, 60, 1080, 1080);
    x.fillStyle = '#e6b043'; x.font = '600 32px "IBM Plex Sans", sans-serif'; x.textAlign = 'center';
    x.fillText('UK SMALL BUSINESS CYBER OUTLOOK 2027', 600, 190);
    x.beginPath(); x.arc(600, 420, 150, 0, Math.PI * 2); x.fillStyle = '#62b8b5'; x.fill();
    x.strokeStyle = '#0e161b'; x.lineWidth = 34; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.moveTo(525, 425); x.lineTo(580, 480); x.lineTo(685, 365); x.stroke();
    x.fillStyle = '#e2e9e9'; x.font = '700 120px "Barlow Condensed", "Arial Narrow", sans-serif'; x.fillText('FIVE THINGS', 600, 720);
    x.fillText('DONE', 600, 840);
    x.fillStyle = '#e6b043'; x.font = '700 64px "Barlow Condensed", "Arial Narrow", sans-serif'; x.fillText('BEFORE JANUARY 2027', 600, 930);
    var name = firm.value.trim();
    x.fillStyle = '#9aa9ae'; x.font = '500 36px "IBM Plex Sans", sans-serif'; x.fillText(name ? name + ' · ' + CV.fmtDate(CV.today()) : CV.fmtDate(CV.today()), 600, 1020);
    x.fillStyle = '#62b8b5'; x.font = '600 30px "IBM Plex Sans", sans-serif'; x.fillText('cyberoutlook.sbcsg.uk', 600, 1090);
    return c;
  }
  function refresh() { CV.store.set('cert', { firm: firm.value }); document.fonts.ready.then(function () { canvas = draw(); img.src = canvas.toDataURL('image/png'); img.alt = 'Badge: five things done before January 2027' + (firm.value ? ', ' + firm.value : ''); }); }
  firm.addEventListener('input', refresh);
  var post = 'We’ve done the five things from the UK Small Business Cyber Outlook 2027 before January: MFA everywhere, a call-back rule for payments, four questions to our IT provider, our key suppliers, customers and AI tools listed, and a one-page incident plan printed.\n\nMost of it cost nothing. ' + CV.SITE;
  d.body.appendChild(CV.h('p', null, 'All five done. Most UK firms haven’t written down an incident plan, and now you have. Make a badge for your team or your LinkedIn.'));
  d.body.appendChild(CV.field('Business name on the badge', firm));
  d.body.appendChild(img);
  d.body.appendChild(CV.h('div', { class: 'cv-row' },
    CV.button('Download badge', function () { canvas.toBlob(function (b) { CV.download('five-things-done-2027.png', 'image/png', b); }); }, 'primary'),
    CV.button('Copy LinkedIn post', function () { CV.copy(post, 'Post copied. Add the badge image to it on LinkedIn'); })));
  CV.openCert = function () { refresh(); d.open(); };
  var foot = CV.$('.five-foot');
  var b = CV.button('Get your badge', CV.openCert, 'primary cert-btn');
  if (foot) foot.appendChild(b);
  function sync() { var all = count() === 5; b.hidden = !all; }
  list.addEventListener('change', function () { var before = saved.shown; sync(); if (count() === 5 && !before) { saved.shown = true; CV.store.set('cert', { firm: firm.value, shown: true }); setTimeout(CV.openCert, 400); } });
  document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('.five-reset')) setTimeout(sync, 0); });
  sync();
});
