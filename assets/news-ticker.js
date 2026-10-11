/*
  Breachfolio — news-ticker.js
  Turns a populated .sf-news-rail-track (static fallback, or injected by
  dynamic-news.js) into a manual horizontal scroll-snap rail: no auto-scroll
  animation (easier to read/click, no motion-sensitivity concern), just
  native scroll/drag/swipe plus optional prev/next buttons on pointer
  devices. Buttons are injected here rather than hand-written in every page
  so the same behavior stays in one place.
*/
(function () {
  'use strict';

  var SVG_CHEVRON = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>';

  function updateNavState(track, prevBtn, nextBtn) {
    var max = track.scrollWidth - track.clientWidth;
    prevBtn.disabled = track.scrollLeft <= 4;
    nextBtn.disabled = track.scrollLeft >= max - 4;
  }

  function cardStep(track) {
    var first = track.querySelector('article');
    if (!first) return track.clientWidth * 0.9;
    var style = getComputedStyle(track);
    var gap = parseFloat(style.columnGap || style.gap || '0') || 0;
    return first.getBoundingClientRect().width + gap;
  }

  function wire(track) {
    var wrap = track.closest('.sf-news-rail-wrap');
    if (!wrap) return;

    if (!track.dataset.sfRailWired) {
      track.dataset.sfRailWired = '1';

      var prevBtn = document.createElement('button');
      prevBtn.type = 'button';
      prevBtn.className = 'sf-news-nav';
      prevBtn.dataset.dir = 'prev';
      prevBtn.setAttribute('aria-label', 'Scroll left');
      prevBtn.innerHTML = SVG_CHEVRON.replace('m9 6 6 6-6 6', 'm15 6-6 6 6 6');

      var nextBtn = document.createElement('button');
      nextBtn.type = 'button';
      nextBtn.className = 'sf-news-nav';
      nextBtn.dataset.dir = 'next';
      nextBtn.setAttribute('aria-label', 'Scroll right');
      nextBtn.innerHTML = SVG_CHEVRON;

      wrap.appendChild(prevBtn);
      wrap.appendChild(nextBtn);

      prevBtn.addEventListener('click', function () {
        track.scrollBy({ left: -cardStep(track), behavior: 'smooth' });
      });
      nextBtn.addEventListener('click', function () {
        track.scrollBy({ left: cardStep(track), behavior: 'smooth' });
      });

      track._sfRailRefresh = function () { updateNavState(track, prevBtn, nextBtn); };
      track.addEventListener('scroll', track._sfRailRefresh, { passive: true });
      window.addEventListener('resize', track._sfRailRefresh);
    }

    // dynamic-news.js swaps the track's innerHTML in place (same node) once its
    // fetch resolves, well after this ran the first time at DOMContentLoaded —
    // so the disabled state must be recomputed against the new content here too,
    // not just once at initial (often narrower, fallback-only) wiring.
    if (track._sfRailRefresh) track._sfRailRefresh();
  }

  function init() {
    document.querySelectorAll('.sf-news-rail-track').forEach(wire);
  }

  // dynamic-news.js replaces the track's innerHTML once its fetch resolves;
  // re-run wiring in case a fresh track element takes the old one's place.
  document.addEventListener('sf:news-rendered', function (e) {
    wire(e.target);
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
