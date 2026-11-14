// Optional email capture (UX-12). OFF unless src/pages/config.json sets captureEndpoint (a path on this site), privacyUrl and both
// wordings. When it is off this file does nothing: no form is drawn and nothing is ever sent. When it is on, a form only sends what
// is written beside its button: the address, the topics asked for, the page it was on, and (for the result) the score, the band and
// the numbers of the questions with a gap. It never sends the answers themselves. See worker/README.md for the other end.
(function () {
  var cfg = CV.config || {};
  var ON = !!(cfg.captureEndpoint && cfg.privacyUrl && cfg.wording && cfg.wording.newsletter && cfg.wording.updates);
  CV.capture = { enabled: ON };
  if (!ON) return;
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  // One request, no retry loop, no cookies.
  function post(body) {
    return fetch(cfg.captureEndpoint.replace(/\/$/, '') + '/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'omit', body: JSON.stringify(body) })
      .then(function (r) { if (!r.ok) throw new Error('status ' + r.status); });
  }

  // opts: { source, topics: ['result'] or ['download'], files, result, button, sends }
  CV.capture.form = function (opts) {
    var id = 'cap-' + Math.random().toString(36).slice(2, 7);
    var email = CV.h('input', { type: 'email', id: id + '-e', autocomplete: 'email', inputmode: 'email', placeholder: 'you@yourbusiness.co.uk', required: true });
    var err = CV.h('p', { class: 'cap-err', role: 'alert', hidden: true });
    function box(topic, w) {
      var cb = CV.h('input', { type: 'checkbox', id: id + '-' + topic }); // never pre-ticked
      return { cb: cb, row: CV.h('div', { class: 'qz-opt-inline' }, cb, CV.h('label', { for: id + '-' + topic }, w.text)), id: w.id };
    }
    var nl = box('newsletter', cfg.wording.newsletter), up = box('updates', cfg.wording.updates);
    var status = CV.h('p', { class: 'cap-status', 'aria-live': 'polite' });
    var go = CV.h('button', { type: 'submit', class: 'tool primary' }, opts.button);
    var form = CV.h('form', { class: 'cap-form', novalidate: true },
      CV.field('Email address', email), err,
      CV.h('p', { class: 'cap-sends' }, 'What we send to be able to do this: ', opts.sends, ' Nothing else.'),
      nl.row, up.row,
      CV.h('div', { class: 'cap-row' }, go, CV.h('a', { href: cfg.privacyUrl, class: 'cap-priv' }, 'Privacy notice')), status);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var addr = email.value.trim();
      if (!EMAIL.test(addr)) { err.textContent = 'Enter an email address like name@company.co.uk.'; err.hidden = false; email.focus(); return; }
      err.hidden = true; go.disabled = true; status.textContent = 'Sending…';
      var topics = opts.topics.slice(), wordings = {};
      if (nl.cb.checked) { topics.push('newsletter'); wordings.newsletter = nl.id; }
      if (up.cb.checked) { topics.push('report-updates'); wordings['report-updates'] = up.id; }
      var body = { email: addr, topics: topics, source: opts.source };
      if (Object.keys(wordings).length) body.wordings = wordings;
      if (opts.files) body.files = opts.files;
      if (opts.result) body.result = opts.result;
      post(body).then(function () {
        form.replaceWith(CV.h('p', { class: 'cap-done', role: 'status', tabindex: '-1' }, 'Now check your inbox. We have sent a link to confirm your address, and nothing else is sent until you open it.'));
        var d = document.querySelector('.cap-done'); if (d) d.focus();
        if (opts.onDone) opts.onDone();
      }, function () {
        go.disabled = false;
        status.textContent = 'That did not work, and nothing was sent. Your result is still on this page. Please try again later.';
      });
    });
    return form;
  };

  // The check result by email, only on /check/. Offered after the full result is showing: straight away when there is no soft gate,
  // or once someone has chosen to see the rest without emailing. When the soft gate is up, its own form does this job instead.
  function resultCard(r) {
    var body = document.querySelector('#check .cv-dialog-body'); if (!body || body.querySelector('.cap')) return;
    var h = body.querySelector('.qz-result h2'), band = r.band || (h ? h.textContent.trim() : '');
    var card = CV.h('section', { class: 'cap', 'aria-label': 'Email me my result' },
      CV.h('p', { class: 'cv-kicker' }, 'Optional'), CV.h('h2', { class: 'cap-h' }, 'Email me my result'),
      CV.capture.form({ source: '/check/', topics: ['result'], button: 'Email me my result',
        sends: 'your address, your score, your band and the numbers of the questions with a gap (not your answers).',
        result: { score: r.score, band: band, gaps: r.gaps.map(function (g) { return g.i + 1; }) } }));
    var nav = body.querySelector('.qz-nav'); body.insertBefore(card, nav || null);
  }
  if (CV.standalone) {
    CV.on('check-result', function (r) { if (!r.locked) resultCard(r); });
    CV.on('check-result-optional', resultCard);
  }
})();
