// @msg Returning readers skip the intro: once you've started, "Start here" shrinks to a one-line progress bar with your next step, expandable any time
// @sel #start
CV.ready(function () {
  var start = CV.$('#start'); if (!start || !CV.progressState) return;
  var s = CV.progressState();
  var started = s.score != null || s.five > 0 || s.planTotal > 0;
  if (!started) return;
  var bits = []; if (s.score != null) bits.push('Check ' + s.score + '/10'); bits.push(s.five + '/5 things'); if (s.planTotal) bits.push(s.planDone + '/' + s.planTotal + ' plan actions');
  var slim = CV.h('div', { class: 'ss' },
    CV.h('p', null, CV.h('b', null, 'Your progress: '), bits.join(' · ')),
    CV.h('div', { class: 'cv-row' }, CV.button('Next step', function () { CV.openProgress(); }, 'primary'), CV.h('button', { type: 'button', class: 'tool ss-more', 'aria-expanded': 'false', 'aria-controls': 'start' }, 'Show start options')));
  start.classList.add('slim');
  start.querySelector('.start-inner').insertBefore(slim, start.querySelector('.start-inner').firstChild);
  var more = slim.querySelector('.ss-more');
  more.addEventListener('click', function () { var open = start.classList.toggle('slim'); more.setAttribute('aria-expanded', open ? 'false' : 'true'); more.textContent = open ? 'Show start options' : 'Hide start options'; });
});
