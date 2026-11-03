// @msg Share hub: one place to share the report, with three ready-to-post LinkedIn drafts built from its own figures
// @sel #start
CV.ready(function () {
  var POSTS = [
    { k: 'The honest number', t: 'You’ll see "43% of UK businesses had a breach" on a lot of slides this year. It counts phishing emails that arrived and did nothing.\n\nThe honest numbers from the government’s Cyber Security Breaches Survey 2025/26: 1 in 5 businesses was the victim of a cyber crime. Take phishing out and it’s 1 in 33.\n\nThe risk for a small firm sits in email, payments and trust. Noel Bradford’s UK Small Business Cyber Outlook 2027 is free to read:' },
    { k: 'Five things', t: 'Five things a UK small business can do before January, almost all of them free:\n\n1. Multi-factor authentication on every cloud service, email first\n2. A call-back rule for any change to bank details or urgent payment\n3. Four questions to your IT provider\n4. A list of your five key suppliers, five key customers and the AI tools your staff use\n5. A one-page incident plan, printed\n\nFrom the UK Small Business Cyber Outlook 2027:' },
    { k: 'Suppliers', t: 'The incident most likely to stop a small UK firm trading in 2027 will start at somebody else’s business.\n\nOnly 12% of micro firms and 22% of small ones have reviewed the cyber risks from their immediate suppliers (Cyber Security Breaches Survey 2025/26).\n\nStart with five suppliers, five customers, and what stops if each disappears for two weeks. The UK Small Business Cyber Outlook 2027:' }
  ];
  var d = CV.dialog({ id: 'share', title: 'Share the outlook', wide: true, note: 'Every figure in these drafts is from the report and its sources. Edit them to sound like you.' });
  var url = CV.SITE;
  var quick = CV.h('div', { class: 'cv-row sh-quick' },
    CV.h('a', { class: 'tool primary', href: 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url), rel: 'noopener', target: '_blank' }, 'Share link on LinkedIn'),
    CV.h('a', { class: 'tool', href: 'https://wa.me/?text=' + encodeURIComponent('Worth 10 minutes before January: the UK Small Business Cyber Outlook 2027 ' + url), rel: 'noopener', target: '_blank' }, 'WhatsApp'),
    CV.h('a', { class: 'tool', href: 'mailto:?subject=' + encodeURIComponent(CV.TITLE) + '&body=' + encodeURIComponent('Thought this was worth a look before January:\n\n' + url) }, 'Email'),
    CV.button('Copy link', function () { CV.copy(url, 'Link copied'); }));
  d.body.appendChild(quick);
  d.body.appendChild(CV.h('h3', { class: 'qz-h' }, 'Ready-made LinkedIn posts'));
  var tabs = CV.h('div', { class: 'sh-tabs', role: 'tablist', 'aria-label': 'Post drafts' });
  var ta = CV.h('textarea', { class: 'cv-input sh-text', id: 'sh-text', 'aria-label': 'Post text, editable' });
  POSTS.forEach(function (p, i) {
    var b = CV.h('button', { type: 'button', role: 'tab', class: 'sh-tab', id: 'sh-tab-' + i, 'aria-controls': 'sh-text' }, p.k);
    b.addEventListener('click', function () { ta.value = p.t + ' ' + url; CV.$$('.sh-tab', tabs).forEach(function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); }); });
    tabs.appendChild(b);
  });
  d.body.appendChild(tabs); d.body.appendChild(ta);
  d.body.appendChild(CV.h('div', { class: 'cv-row' },
    CV.button('Copy post', function () { CV.copy(ta.value, 'Post copied'); }, 'primary'),
    CV.button('Copy and open LinkedIn', function () { CV.copy(ta.value, 'Post copied. Paste it into LinkedIn'); window.open('https://www.linkedin.com/feed/?shareActive=true&text=' + encodeURIComponent(ta.value), '_blank', 'noopener'); }),
    CV.h('a', { class: 'tool', href: 'linkedin/CyberOutlook2027_LinkedIn_Carousel.pdf' }, 'Get the 10-slide carousel (PDF)')));
  tabs.firstChild.click();
  CV.openShare = function () { d.open(); };
  var li = CV.$('.cover .tools a[href*="linkedin.com/sharing"]');
  var btn = CV.button('Share', function () { d.open(); });
  if (li) li.replaceWith(btn); else CV.addTool(btn);
});
