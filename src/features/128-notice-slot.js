// One returning-visitor message at a time. Each message asks for the slot before it shows itself (first to ask wins on this page),
// and a dismissal is remembered against a token (for example the time of the last visit), so the same message does not come back.
CV.notice = {
  taken: null,
  claim: function (key) { if (CV.notice.taken) return false; CV.notice.taken = key; return true; },
  dismissed: function (key, token) { return CV.store.get('dismissed', {})[key] === token; },
  dismiss: function (key, token) { var d = CV.store.get('dismissed', {}); d[key] = token; CV.store.set('dismissed', d); }
};
