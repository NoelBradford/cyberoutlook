// @msg Plain-English glossary: jargon is underlined once per section; tap it for a one-line explanation, or open the full glossary
// @sel #theme-2
CV.ready(function () {
  var G = [
    ['multi-factor authentication', 'A second check when you log in, such as a code or an approval on your phone, on top of your password.', /\bmulti-factor authentication\b/i],
    ['passkey', 'A login that uses your phone or computer’s fingerprint, face or PIN instead of a password. Much harder to phish than a texted code.', /\bpasskeys?\b/i],
    ['phishing', 'A message pretending to be someone you trust, designed to get you to click, log in, pay or share information.', /\bphishing\b/i],
    ['ransomware', 'Malicious software that locks or steals your files and demands payment to give them back or keep them quiet.', /\bransomware\b/i],
    ['prompt injection', 'Hidden instructions in a document, email or web page that trick an AI tool into doing something you didn’t ask for.', /\bprompt injection\b/i],
    ['authorised push payment fraud', 'When a criminal tricks you into sending money yourself, for example by faking a supplier’s new bank details.', /\bauthorised push payment fraud\b/i],
    ['Cyber Essentials', 'The UK government-backed certificate showing a business has five basic security controls in place. Plus adds an independent technical check.', /\bCyber Essentials\b/],
    ['managed service provider', 'An outside IT company that runs your computers, accounts and systems for you, often with remote access to them.', /\bmanaged service provider\b|\bMSP\b/],
    ['tabletop exercise', 'A one-hour meeting where you talk through a pretend incident, step by step, to test your plan.', /\btabletop\b/i],
    ['deepfake', 'Fake audio or video, made with AI, that sounds or looks like a real person, such as your managing director.', /\bdeepfake\b/i],
    ['patch', 'A software update that fixes a security flaw. Criminals often use the flaw within days of it being published.', /\bpatch(es|ing)?\b/i]
  ];
  var tip = CV.h('div', { class: 'gl-tip', role: 'tooltip', id: 'gl-tip', hidden: true });
  document.body.appendChild(tip);
  function show(btn, g) {
    tip.innerHTML = ''; tip.appendChild(CV.h('b', null, g[0])); tip.appendChild(CV.h('p', null, g[1]));
    tip.hidden = false; var r = btn.getBoundingClientRect(), w = Math.min(320, window.innerWidth - 32); tip.style.width = w + 'px';
    var x = Math.max(16, Math.min(window.innerWidth - w - 16, r.left)); var y = r.bottom + 8; if (y + tip.offsetHeight > window.innerHeight - 8) y = r.top - tip.offsetHeight - 8;
    tip.style.left = x + 'px'; tip.style.top = y + 'px'; btn.setAttribute('aria-expanded', 'true'); open = btn;
  }
  var open = null;
  function hide() { tip.hidden = true; if (open) open.setAttribute('aria-expanded', 'false'); open = null; }
  document.addEventListener('click', function (e) { if (open && !e.target.closest('.gl-term')) hide(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hide(); });
  window.addEventListener('scroll', hide, { passive: true });
  CV.$$('main section.section').forEach(function (sec) {
    if (/sources|disclaimer/.test(sec.id)) return;
    var used = {};
    var walker = document.createTreeWalker(sec, NodeFilter.SHOW_TEXT, { acceptNode: function (n) { var p = n.parentNode; return p.closest('h2,h3,h4,a,button,label,sup,abbr,table,.gl-term,.forecast,.cv-noprint,.listen,.listen-src,figure,caption,dialog') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; } });
    var nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      G.forEach(function (g, gi) {
        if (used[gi] || !node.parentNode) return;
        var m = node.nodeValue.match(g[2]); if (!m) return;
        used[gi] = true;
        var after = node.splitText(m.index); after.nodeValue = after.nodeValue.slice(m[0].length);
        var b = CV.h('button', { type: 'button', class: 'gl-term', 'aria-expanded': 'false', 'aria-describedby': 'gl-tip' }, m[0]);
        b.addEventListener('click', function (e) { e.stopPropagation(); if (open === b) hide(); else show(b, g); });
        node.parentNode.insertBefore(b, after); node = after;
      });
    });
  });
  var d = CV.dialog({ id: 'glossary', title: 'Plain-English glossary', note: 'Short explanations to help you read the report. They aren’t legal or technical definitions.' });
  d.body.appendChild(CV.h('dl', { class: 'gl-list' }, G.slice().sort(function (a, b) { return a[0].localeCompare(b[0]); }).map(function (g) { return CV.h('div', null, CV.h('dt', null, g[0]), CV.h('dd', null, g[1])); })));
  CV.openGlossary = function () { d.open(); };
  var hr = CV.$$('#how-to-read p').filter(function (p) { return /technical term/i.test(p.textContent); })[0];
  if (hr) hr.appendChild(CV.h('span', { class: 'cv-noprint' }, ' ', CV.h('button', { type: 'button', class: 'gl-open', onclick: function () { d.open(); } }, 'Open the glossary')));
});
