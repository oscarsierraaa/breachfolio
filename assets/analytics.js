/* Breachfolio — event tracking (dataLayer).
   Pushes named events to window.dataLayer for GTM to pick up; does not
   define GTM triggers/tags itself (that half lives in the GTM container,
   outside this repo). Deliberately does NOT push page_view — GTM's own
   base snippet already fires that automatically; duplicating it here
   would double-count every pageview. */
(function () {
  window.dataLayer = window.dataLayer || [];

  // Este fichero se escribió para GTM: empujaba {event: 'nombre', ...} al
  // dataLayer y el contenedor lo recogía. El sitio ya no usa GTM (lo sustituyó
  // tools/replace-gtm-with-gtag.mjs por gtag.js directo, y no queda ni un
  // GTM-XXXX en ninguna página), y gtag.js NO lee ese formato: solo procesa las
  // entradas con forma de argumentos que deja la propia función gtag(). Es
  // decir, los trece eventos de abajo llevaban desde la migración cayendo en un
  // dataLayer que ya no consume nadie.
  //
  // Se mantiene el push al dataLayer, que es inofensivo y deja la puerta abierta
  // a volver a GTM, y se añade la llamada a gtag('event', ...), que es la que de
  // verdad llega a GA4. page_view sigue sin mandarse a propósito: lo emite ya
  // gtag('config', ...) en el <head> y duplicarlo contaría cada visita dos veces.
  function track(name, params) {
    window.dataLayer.push(Object.assign({ event: name }, params || {}));
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, params || {});
    }
  }
  window.SFTrack = track;

  var isEs = (document.documentElement.dataset.lang || 'EN').toUpperCase() === 'ES';

  /* Scroll depth: 25/50/75/90, once each per page view. */
  (function () {
    var fired = {};
    var thresholds = [25, 50, 75, 90];
    function onScroll() {
      var doc = document.documentElement;
      var scrolled = doc.scrollTop || document.body.scrollTop;
      var height = (doc.scrollHeight || document.body.scrollHeight) - doc.clientHeight;
      if (height <= 0) return;
      var pct = (scrolled / height) * 100;
      for (var i = 0; i < thresholds.length; i++) {
        var t = thresholds[i];
        if (pct >= t && !fired[t]) {
          fired[t] = true;
          track('scroll_depth', { percent: t });
        }
      }
    }
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { onScroll(); ticking = false; });
    }, { passive: true });
  })();

  /* Delegated click tracking — safe against dynamically-inserted elements
     (search button, TOC links, related-article links all get built by
     page.js after this script runs). */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (a) {
      var inAside = !!a.closest('aside');
      var isAnchor = a.getAttribute('href').indexOf('#') === 0;
      if (inAside && isAnchor) {
        track('toc_click', { link_text: a.textContent.trim().slice(0, 80) });
      } else if (inAside && !isAnchor) {
        track('related_article_click', { link_url: a.href, link_text: a.textContent.trim().slice(0, 80) });
      }
      if (a.closest('nav[aria-label="Breadcrumb"]')) {
        track('hub_click', { link_text: a.textContent.trim().slice(0, 80), link_url: a.href });
      }
      if (a.target === '_blank') {
        try {
          if (new URL(a.href).hostname !== location.hostname) {
            track('official_source_click', { link_url: a.href, link_domain: new URL(a.href).hostname });
          }
        } catch (err) {}
      }
    }

    var langBtn = e.target.closest && e.target.closest('#sf-lang-menu button[data-lang]');
    if (langBtn) track('language_switch', { to_lang: langBtn.dataset.lang });

    var filterBtn = e.target.closest && e.target.closest('#filters [data-filter]');
    if (filterBtn) track('filter_use', { filter_value: filterBtn.dataset.filter, page_type: document.body.dataset.section || document.documentElement.dataset.section || '' });

    var shareBtn = e.target.closest && e.target.closest('[data-sf-share]');
    if (shareBtn) track('share_click', { method: (navigator.share ? 'native' : 'copy_link') });
  });

  /* Internal search (Pagefind): debounced query tracking + zero-results
     detection. Pagefind UI is injected lazily by page.js on first open,
     so this watches for #sf-pagefind to appear before attaching. */
  (function () {
    var searchTimer = null;
    document.addEventListener('input', function (e) {
      if (e.target && e.target.matches && e.target.matches('#sf-pagefind input')) {
        clearTimeout(searchTimer);
        var q = e.target.value.trim();
        if (!q) return;
        searchTimer = setTimeout(function () { track('internal_search', { query_length: q.length }); }, 600);
      }
    });
    var watched = false;
    function watchPagefindResults(container) {
      if (watched) return;
      watched = true;
      var resultsObserver = new MutationObserver(function () {
        var msg = container.querySelector('.pagefind-ui__message');
        if (msg && /\b0\b.*result|sin resultado/i.test(msg.textContent)) {
          track('search_no_results', {});
        }
      });
      resultsObserver.observe(container, { childList: true, subtree: true });
    }
    var bodyObserver = new MutationObserver(function () {
      var el = document.getElementById('sf-pagefind');
      if (el) watchPagefindResults(el);
    });
    bodyObserver.observe(document.body, { childList: true, subtree: true });
  })();

  /* Copy-command button on every code block: real UX addition (one-click
     copy for a technical audience) that also gives copy_command a genuine
     trigger instead of a hypothetical one. */
  (function () {
    function wire() {
      var blocks = document.querySelectorAll('main pre');
      for (var i = 0; i < blocks.length; i++) {
        var pre = blocks[i];
        if (pre.dataset.sfCopyReady) continue;
        pre.dataset.sfCopyReady = '1';
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'sf-copy-btn';
        btn.setAttribute('aria-label', isEs ? 'Copiar comando' : 'Copy command');
        var label = isEs ? 'Copiar' : 'Copy';
        btn.textContent = label;
        btn.addEventListener('click', function (pre, btn) {
          return function () {
            var text = pre.innerText;
            if (!navigator.clipboard) return;
            navigator.clipboard.writeText(text).then(function () {
              btn.textContent = isEs ? 'Copiado' : 'Copied';
              btn.classList.add('is-copied');
              track('copy_command', { char_count: text.length });
              setTimeout(function () { btn.textContent = label; btn.classList.remove('is-copied'); }, 1500);
            }).catch(function () {});
          };
        }(pre, btn));
        pre.appendChild(btn);
      }
    }
    wire();
    new MutationObserver(wire).observe(document.body, { childList: true, subtree: true });
  })();

  /* Newsletter form submit (form id set in shared.js: sf-nl-form). */
  document.addEventListener('submit', function (e) {
    if (e.target && e.target.id === 'sf-nl-form') {
      track('newsletter_signup', {});
      track('form_submit', { form_id: 'sf-nl-form' });
    }
  });
})();
