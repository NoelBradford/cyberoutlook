// @msg Payment code-word generator: make a memorable, random three-word code for urgent payment requests and put it straight on your call-back poster
// @sel #poster
CV.ready(function () {
  var d = document.getElementById('poster'); if (!d) return;
  var W = 'amber anchor apple arrow aspen badger banjo basil beacon birch bison bramble bridge brook cabin canal candle canyon cedar chalk cherry cider clover cobalt comet copper coral cotton crane cricket crystal daisy delta denim dingo dolphin drift eagle ember falcon fennel fern ferry fig flint forest fox garnet gecko ginger glacier granite gravel harbour hazel heron hickory hollow honey indigo iris island ivory jasper juniper kayak kestrel kettle kiwi lagoon lantern larch lava lemon lilac linen lotus magpie mango maple marble meadow melon mint mosaic moss nectar nickel nutmeg oak oasis olive onyx orchid otter oyster paddle panda parsley pebble pepper pigeon pine plum polar poppy prism quartz quill rabbit radish raven reef ribbon river robin rocket saffron sage salmon sapphire satin shingle silver slate sparrow spruce stork summit swan teal thistle thunder tiger timber toffee topaz tulip tundra velvet violet walnut wave willow wren yacht zebra zinc'.split(' ');
  function pick() { var a = new Uint32Array(3); (window.crypto || window.msCrypto).getRandomValues(a); return Array.prototype.map.call(a, function (n) { return W[n % W.length]; }).join('-'); }
  var out = CV.h('output', { class: 'cw-out', 'aria-live': 'polite' }, pick());
  var box = CV.h('div', { class: 'cw' },
    CV.h('p', { class: 'cv-kicker' }, 'Code word'),
    CV.h('p', { class: 'cw-s' }, 'Made in your browser and not saved anywhere. Share it in person or by phone, never by email.'),
    out,
    CV.h('div', { class: 'cv-row' }, CV.button('New code word', function () { out.textContent = pick(); }), CV.button('Copy', function () { CV.copy(out.textContent, 'Code word copied. Share it in person'); })));
  var body = d.querySelector('.cv-dialog-body');
  var anchor = body.querySelector('.qz-opt-inline');
  if (anchor) anchor.after(box);
  var cb = document.getElementById('pst-word');
  function sync() { box.hidden = !cb.checked; }
  if (cb) { cb.addEventListener('change', sync); sync(); }
});
