/* Breachfolio — bootstrap de tema (anti-FOUC). Cargar SIN defer en <head>. */
(function(){
      try {
        var t = localStorage.getItem('sf-theme') || 'dark';
        // The page's own declared data-lang is authoritative: each URL is a
        // single language (EN at /x, ES at /es/x), so a page must render its
        // own chrome regardless of a stored preference. Fall back to the
        // stored preference only when a page declares no language.
        var declared = document.documentElement.getAttribute('data-lang');
        var l = declared || localStorage.getItem('sf-lang') || 'EN';
        document.documentElement.dataset.theme = t;
        document.documentElement.dataset.lang = l;
      } catch(e) {}
    })();
