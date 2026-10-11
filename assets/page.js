/* Breachfolio — wiring común de página: idioma, tema, menú móvil, TOC, filtros.
   Todos los bloques llevan guardas: se autodesactivan si el elemento no existe. */
(function(){
      const btn  = document.getElementById('sf-lang-btn');
      const menu = document.getElementById('sf-lang-menu');
      const code = document.getElementById('sf-lang-code');
      if (btn && menu) {
        function reflectLang() {
          const cur = (window.SF && window.SF.getLang) ? window.SF.getLang() : 'EN';
          code.textContent = cur === 'EN' ? 'ES' : 'EN';
          menu.querySelectorAll('button').forEach(b => {
            const on = b.dataset.lang === cur;
            b.className = 'w-full flex items-center justify-between px-3.5 py-2.5 text-[13px] hover:bg-surface-2 transition-colors ' + (on ? 'text-foreground' : 'text-muted-foreground');
          });
        }
        function reflectTheme() {
          const cur = (window.SF && window.SF.getTheme) ? window.SF.getTheme() : 'dark';
          document.querySelectorAll('[data-theme-icon]').forEach(el => {
            el.style.display = (el.dataset.themeIcon === (cur === 'dark' ? 'dark' : 'light')) ? 'block' : 'none';
          });
        }
        btn.addEventListener('click', () => menu.classList.toggle('hidden'));
        document.addEventListener('mousedown', (e) => { if (!btn.contains(e.target) && !menu.contains(e.target)) menu.classList.add('hidden'); });
        // Absolute root paths (e.g. "/es/lab/index.html") only resolve correctly
        // when the site is served from true domain root. Any local preview whose
        // server root differs (a subfolder, a dev-server mount point, etc.) turns
        // that into a dead request. Computing a path relative to the CURRENT page
        // works everywhere — local preview and real production alike.
        function relativePath(fromPathname, toPathname) {
          // Every real page on this site is a clean, trailing-slash directory
          // URL (slug/index.html served at /slug/). Verified against the
          // actual WHATWG URL-resolution algorithm (new URL(rel, base)) for
          // both directions and the root-page edge case — a relative path
          // missing the target's trailing slash resolves to a bare filename
          // instead of a directory (works by luck where the host
          // auto-redirects directory requests, 404s where it doesn't); and
          // failing to special-case navigating from a subpath TO the root
          // under-counts the required "../" by one level.
          const fromTrailingSlash = fromPathname.endsWith('/');
          const toTrailingSlash = toPathname.endsWith('/');
          const fromParts = fromPathname.split('/').filter(Boolean);
          const toParts = toPathname.split('/').filter(Boolean);
          if (!fromTrailingSlash) fromParts.pop(); // strip an explicit filename to get its directory
          let i = 0;
          while (i < fromParts.length && i < toParts.length && fromParts[i] === toParts[i]) i++;
          const ups = fromParts.length - i;
          const downs = toParts.slice(i);
          const prefix = ups ? '../'.repeat(ups) : '';
          const path = downs.join('/');
          if (!path) return prefix || './';
          return prefix + path + (toTrailingSlash ? '/' : '');
        }
        menu.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
          const lang = b.dataset.lang;
          menu.classList.add('hidden');
          // Prefer navigating to this page's declared counterpart in the target
          // language (its hreflang alternate), via a relative path. Fall back to
          // a chrome-only swap when the page has no alternate in that language.
          const alt = document.querySelector('link[rel="alternate"][hreflang="' + lang.toLowerCase() + '"]');
          if (alt && alt.getAttribute('href')) {
            try {
              const u = new URL(alt.href, location.href);
              if (u.pathname !== location.pathname) {
                // hreflang tags declare true-domain-root paths. If this site
                // is mounted under an extra subpath (a local preview server
                // rooted above the deployable folder, a dev-server mount
                // point, etc.), that prefix needs to be reapplied — detected
                // from THIS page's OWN hreflang for its current language,
                // whose declared path must be a trailing match of the real
                // location.pathname; whatever's left over is the mount prefix.
                let mountPrefix = '';
                const curLang = (window.SF && window.SF.getLang) ? window.SF.getLang() : 'EN';
                const selfAlt = document.querySelector('link[rel="alternate"][hreflang="' + curLang.toLowerCase() + '"]');
                if (selfAlt && selfAlt.getAttribute('href')) {
                  try {
                    const selfPath = new URL(selfAlt.href, location.href).pathname;
                    if (selfPath !== '/' && location.pathname.endsWith(selfPath)) {
                      mountPrefix = location.pathname.slice(0, location.pathname.length - selfPath.length).replace(/\/$/, '');
                    }
                  } catch (e) { /* no mount prefix to detect */ }
                }
                location.href = relativePath(location.pathname, mountPrefix + u.pathname) + u.hash;
                return;
              }
            } catch (e) { /* fall through to chrome swap */ }
          }
          if (window.SF) window.SF.setLang(lang);
          reflectLang();
        }));
        const tBtn = document.getElementById('sf-theme-toggle');
        if (tBtn) tBtn.addEventListener('click', () => { if(window.SF) window.SF.setTheme(window.SF.getTheme() === 'dark' ? 'light' : 'dark'); reflectTheme(); });
        window.addEventListener('sf:lang', reflectLang);
        window.addEventListener('sf:theme', reflectTheme);
        reflectLang(); reflectTheme();
      }

      // Mobile menu toggle
      const mbtn = document.getElementById('sf-menu-btn');
      const mmenu = document.getElementById('sf-mobile-menu');
      const oIcon = document.getElementById('sf-menu-icon-open');
      const cIcon = document.getElementById('sf-menu-icon-close');
      if (mbtn && mmenu) {
        mbtn.addEventListener('click', () => {
          const open = !mmenu.classList.contains('hidden');
          if (open) {
            mmenu.classList.add('hidden');
            mbtn.setAttribute('aria-expanded','false');
            oIcon.style.display='block'; cIcon.style.display='none';
          } else {
            mmenu.classList.remove('hidden');
            mbtn.setAttribute('aria-expanded','true');
            oIcon.style.display='none'; cIcon.style.display='block';
          }
        });
      }


      // Header shadow on scroll
      const hdr = document.getElementById('sf-header');
      if (hdr) {
        const onScroll = () => {
          if (window.scrollY > 8) hdr.classList.add('shadow-lg','shadow-black/5');
          else hdr.classList.remove('shadow-lg','shadow-black/5');
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
      }

      // Keyboard support for nav dropdowns (Enter/Space opens, Escape closes)
      document.querySelectorAll('[data-nav-trigger]').forEach(t => {
        t.addEventListener('click', (e) => {
          e.preventDefault();
          const panel = document.querySelector('[data-nav-panel="'+t.dataset.navTrigger+'"]');
          if (!panel) return;
          const isOpen = panel.style.opacity === '1';
          // Close all
          document.querySelectorAll('[data-nav-panel]').forEach(p => { p.style.opacity=''; p.style.visibility=''; });
          document.querySelectorAll('[data-nav-trigger]').forEach(b => b.setAttribute('aria-expanded','false'));
          if (!isOpen) {
            panel.style.opacity='1'; panel.style.visibility='visible';
            t.setAttribute('aria-expanded','true');
          }
        });
      });
      document.addEventListener('click', (e) => {
        if (!e.target.closest('[data-nav-item]')) {
          document.querySelectorAll('[data-nav-panel]').forEach(p => { p.style.opacity=''; p.style.visibility=''; });
          document.querySelectorAll('[data-nav-trigger]').forEach(b => b.setAttribute('aria-expanded','false'));
        }
      });
    })();

(function() {
    const toc = document.getElementById('toc');
    if (!toc) return;
    const hs = document.querySelectorAll('.prose-sec h2');
    hs.forEach((h, i) => {
      const id = 's-' + i + '-' + (h.textContent.toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,40));
      h.id = id;
      const a = document.createElement('a');
      a.href = '#' + id;
      a.textContent = h.textContent;
      a.className = 'block hover:text-foreground transition-colors ul-link inline-block';
      const wrap = document.createElement('div');
      wrap.appendChild(a);
      toc.appendChild(wrap);
    });
  })();

(function(){
    const buttons = document.querySelectorAll('#filters [data-filter]');
    const cardsGrid = document.getElementById('cards');
    const cards = document.querySelectorAll('#cards .card');
    const empty = document.getElementById('empty');
    if (!cardsGrid || !empty) return; // solo en páginas con listado paginado
    // Filtro por etiquetas temáticas (checkboxes, multiselección). Si la página
    // trae el panel #sf-tag-list se usa ese modo nuevo; si trae los chips
    // antiguos #filters se usa el modo antiguo (migración sección a sección).
    const tagList = document.getElementById('sf-tag-list');
    const useTags = !!tagList;
    const selectedTags = new Set();
    // slug neutro -> etiqueta por idioma. Añadir aquí para ampliar el vocabulario.
    var TAG_LABELS = {
      'fundamentals': { en: 'Fundamentals', es: 'Fundamentos' },
      'networking':   { en: 'Networking',   es: 'Redes' },
      'linux':        { en: 'Linux',        es: 'Linux' },
      'crypto':       { en: 'Cryptography', es: 'Cripto' },
      'blue-team':    { en: 'Blue Team',    es: 'Blue Team' },
      'soc':          { en: 'SOC',          es: 'SOC' },
      'detection':    { en: 'Detection',    es: 'Detección' },
      'threat-intel': { en: 'Threat Intel', es: 'Threat Intel' },
      'red-team':     { en: 'Red Team',     es: 'Red Team' },
      'pentesting':   { en: 'Pentesting',   es: 'Pentesting' },
      'osint':        { en: 'OSINT',        es: 'OSINT' },
      'forensics':    { en: 'Forensics',    es: 'Forense' },
      'malware':      { en: 'Malware',      es: 'Malware' },
      'ai':           { en: 'AI',           es: 'IA' },
      'appsec':       { en: 'Web / AppSec', es: 'Web / AppSec' },
      'cloud':        { en: 'Cloud',        es: 'Cloud' },
      'tools':        { en: 'Tools',        es: 'Herramientas' },
      'guides':       { en: 'Guides',       es: 'Guías' },
      'news':         { en: 'News',         es: 'Noticias' },
      'career':       { en: 'Career',       es: 'Carrera' },
      'reference':    { en: 'Reference',    es: 'Referencia' },
      // Comparativas
      'c2':           { en: 'C2',           es: 'C2' },
      'distro':       { en: 'Distros',      es: 'Distros' },
      'ids':          { en: 'IDS',          es: 'IDS' },
      'packets':      { en: 'Packets',      es: 'Paquetes' },
      'recon':        { en: 'Recon',        es: 'Reconocimiento' },
      'scanners':     { en: 'Scanners',     es: 'Escáneres' },
      'siem':         { en: 'SIEM',         es: 'SIEM' },
      'web':          { en: 'Web',          es: 'Web' },
      // Guías (tipos de estafa)
      'account-recovery': { en: 'Account recovery', es: 'Recuperar cuenta' },
      'donation-scam':    { en: 'Donation scam',    es: 'Estafa de donación' },
      'extortion':        { en: 'Extortion',        es: 'Extorsión' },
      'impersonation':    { en: 'Impersonation',    es: 'Suplantación' },
      'investment-scam':  { en: 'Investment scam',  es: 'Estafa de inversión' },
      'payment-fraud':    { en: 'Payment fraud',    es: 'Fraude de pago' },
      'phishing':         { en: 'Phishing',         es: 'Phishing' },
      // IA
      'defense':      { en: 'Defense',      es: 'Defensa' },
      'foundations':  { en: 'Foundations',  es: 'Fundamentos' },
      'practical':    { en: 'Practical',    es: 'Práctico' },
      'prompts':      { en: 'Prompts',      es: 'Prompts' },
      'security':     { en: 'Security',     es: 'Seguridad' },
      // Laboratorio
      'getting-started': { en: 'Getting started', es: 'Primeros pasos' },
      'walkthrough':     { en: 'Walkthrough',      es: 'Guía práctica' },
      // Noticias
      'ai-security':  { en: 'AI security',  es: 'Seguridad IA' },
      'supply-chain': { en: 'Supply chain', es: 'Cadena de suministro' },
      'vulnerabilities': { en: 'Vulnerabilities', es: 'Vulnerabilidades' },
      // Recursos
      'cheat-sheet':  { en: 'Cheat sheet',  es: 'Chuleta' },
      'checklist':    { en: 'Checklist',    es: 'Checklist' },
      'faq':          { en: 'FAQ',          es: 'FAQ' },
      'glossary':     { en: 'Glossary',     es: 'Glosario' }
    };
    // Búsqueda y orden son opcionales: solo se activan si la página los incluye.
    const search = document.getElementById('sf-list-search');
    const sortBtn = document.getElementById('sf-list-sort');
    const clearBtn = document.getElementById('sf-list-clear');
    const dateFrom = document.getElementById('sf-date-from');
    const dateTo = document.getElementById('sf-date-to');
    let activeFilter = 'ALL';
    let sortDesc = true;

    const countEl = document.getElementById('sf-count');

    // Paginación: maximo 6 tarjetas visibles a la vez; el resto vive en
    // paginas siguientes (mismo patron que News, extendido a toda la web).
    const PAGE_SIZE = 6;
    let currentPage = 1;
    const pagePrev = document.getElementById('sf-page-prev');
    const pageNext = document.getElementById('sf-page-next');
    const pageNumbers = document.getElementById('sf-page-numbers');
    const paginationNav = document.getElementById('sf-pagination');
    let lastMatched = [];

    function renderPage() {
      const totalPages = Math.max(1, Math.ceil(lastMatched.length / PAGE_SIZE));
      if (currentPage > totalPages) currentPage = totalPages;
      if (currentPage < 1) currentPage = 1;
      cards.forEach(c => { c.style.display = 'none'; });
      const start = (currentPage - 1) * PAGE_SIZE;
      lastMatched.slice(start, start + PAGE_SIZE).forEach(c => { c.style.display = ''; });
      if (pagePrev) pagePrev.disabled = currentPage <= 1;
      if (pageNext) pageNext.disabled = currentPage >= totalPages;
      if (pageNumbers) {
        pageNumbers.innerHTML = '';
        for (let p = 1; p <= totalPages; p++) {
          // Real <a href> to the statically-generated archive page (see
          // tools/generate-pagination.mjs) so crawlers and no-JS visitors
          // have an actual path to page 2+, not just a JS-only control.
          // JS users still get the fast in-page switch via preventDefault.
          const el = document.createElement('a');
          el.href = p === 1 ? './' : `./page-${p}/`;
          el.className = 'sf-page';
          el.textContent = String(p);
          if (p === currentPage) el.setAttribute('aria-current', 'page');
          el.addEventListener('click', (e) => {
            e.preventDefault();
            currentPage = p;
            renderPage();
            if (cardsGrid) cardsGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
          });
          pageNumbers.appendChild(el);
        }
      }
    }
    if (pagePrev) pagePrev.addEventListener('click', () => { currentPage--; renderPage(); if (cardsGrid) cardsGrid.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    if (pageNext) pageNext.addEventListener('click', () => { currentPage++; renderPage(); if (cardsGrid) cardsGrid.scrollIntoView({ behavior: 'smooth', block: 'start' }); });

    function apply(resetPage) {
      const q = (search && search.value || '').trim().toLowerCase();
      lastMatched = [];
      const from = dateFrom && dateFrom.value;
      const to = dateTo && dateTo.value;
      // Iterar en el ORDEN ACTUAL del DOM, no en el NodeList estático capturado
      // al cargar: si no, tras ordenar (sortCards reordena el DOM) la paginación
      // seguiría eligiendo las tarjetas por su orden original y el artículo más
      // reciente podía quedar fuera de la página 1.
      const ordered = cardsGrid
        ? Array.prototype.slice.call(cardsGrid.querySelectorAll('.card'))
        : Array.prototype.slice.call(cards);
      ordered.forEach(c => {
        var okTag;
        if (useTags) {
          // multiselección: coincide si la tarjeta tiene ALGUNA etiqueta marcada
          if (selectedTags.size === 0) okTag = true;
          else okTag = (c.dataset.tags || '').split(/\s+/).some(function (t) { return selectedTags.has(t); });
        } else {
          okTag = activeFilter === 'ALL' || c.dataset.tag === activeFilter;
        }
        const okText = !q || c.textContent.toLowerCase().indexOf(q) !== -1;
        // Comparación de cadenas ISO (YYYY-MM-DD): mismo orden que cronológico,
        // sin necesidad de parsear a Date.
        const okDate = (!from || c.dataset.date >= from) && (!to || c.dataset.date <= to);
        if (okTag && okText && okDate) lastMatched.push(c);
      });
      empty.classList.toggle('hidden', lastMatched.length !== 0);
      if (countEl) countEl.textContent = lastMatched.length;
      if (resetPage !== false) currentPage = 1;
      renderPage();
    }
    function setFilter(filter) {
      activeFilter = filter;
      buttons.forEach(b => {
        const on = b.dataset.filter === filter;
        b.className = 'px-3 h-8 rounded-full border text-[12px] font-mono tracking-wider transition-colors ' + (on ? 'bg-accent/15 border-accent/40 text-accent' : 'border-border text-muted-foreground hover:text-foreground hover:border-border');
      });
      apply();
    }
    function sortCards() {
      if (!cardsGrid) return;
      const sorted = Array.prototype.slice.call(cards).sort((a, b) => {
        const da = new Date(a.dataset.date || 0).getTime();
        const db = new Date(b.dataset.date || 0).getTime();
        return sortDesc ? db - da : da - db;
      });
      sorted.forEach(c => cardsGrid.appendChild(c));
      apply();
    }
    function updateTagCount() {
      var el = document.getElementById('sf-tag-count');
      if (el) el.textContent = selectedTags.size ? '(' + selectedTags.size + ')' : '';
    }
    function buildTagFilter() {
      if (!tagList) return;
      var lang = (document.documentElement.dataset.lang || 'EN').toLowerCase();
      var counts = {};
      cards.forEach(function (c) {
        (c.dataset.tags || '').split(/\s+/).forEach(function (t) { if (t) counts[t] = (counts[t] || 0) + 1; });
      });
      var label = function (s) {
        if (TAG_LABELS[s] && TAG_LABELS[s][lang]) return TAG_LABELS[s][lang];
        return s.replace(/-/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
      };
      var slugs = Object.keys(counts).sort(function (a, b) { return label(a).localeCompare(label(b)); });
      tagList.innerHTML = slugs.map(function (s) {
        return '<label class="sf-tag-opt" data-label="' + label(s).toLowerCase() + '">' +
          '<input type="checkbox" value="' + s + '"><span>' + label(s) + '</span>' +
          '<span class="sf-tag-n">' + counts[s] + '</span></label>';
      }).join('');
      tagList.querySelectorAll('input[type=checkbox]').forEach(function (cb) {
        cb.addEventListener('change', function () {
          if (cb.checked) selectedTags.add(cb.value); else selectedTags.delete(cb.value);
          updateTagCount();
          apply();
        });
      });
      var ts = document.getElementById('sf-tag-search');
      if (ts) ts.addEventListener('input', function () {
        var q = ts.value.trim().toLowerCase();
        tagList.querySelectorAll('.sf-tag-opt').forEach(function (o) {
          o.style.display = (!q || o.dataset.label.indexOf(q) !== -1) ? '' : 'none';
        });
      });
      var btn = document.getElementById('sf-tag-btn');
      var panel = document.getElementById('sf-tag-panel');
      if (btn && panel) {
        btn.addEventListener('click', function (e) { e.stopPropagation(); panel.classList.toggle('hidden'); });
        document.addEventListener('click', function (e) {
          if (!panel.contains(e.target) && !btn.contains(e.target)) panel.classList.add('hidden');
        });
      }
    }
    buttons.forEach(b => b.addEventListener('click', () => setFilter(b.dataset.filter)));
    if (search) search.addEventListener('input', () => apply());
    // Clic en cualquier punto del campo abre el selector nativo de calendario
    // en vez de dejar que el usuario escriba la fecha a mano.
    [dateFrom, dateTo].forEach(el => {
      if (!el) return;
      el.addEventListener('change', () => apply());
      el.addEventListener('click', () => { if (el.showPicker) { try { el.showPicker(); } catch (e) {} } });
      el.addEventListener('focus', () => { if (el.showPicker) { try { el.showPicker(); } catch (e) {} } });
    });
    if (clearBtn) clearBtn.addEventListener('click', () => {
      if (search) search.value = '';
      if (dateFrom) dateFrom.value = '';
      if (dateTo) dateTo.value = '';
      if (useTags) {
        selectedTags.clear();
        if (tagList) tagList.querySelectorAll('input[type=checkbox]').forEach(function (cb) { cb.checked = false; });
        updateTagCount();
        apply();
      } else {
        setFilter('ALL');
      }
    });
    if (sortBtn) sortBtn.addEventListener('click', () => {
      sortDesc = !sortDesc;
      const icon = sortBtn.querySelector('.sf-sort-icon');
      if (icon) icon.style.transform = sortDesc ? '' : 'rotate(180deg)';
      const label = sortBtn.querySelector('[data-sort-label]');
      if (label) label.textContent = sortDesc ? (sortBtn.dataset.labelDesc || 'Newest first') : (sortBtn.dataset.labelAsc || 'Oldest first');
      sortCards();
    });
    if (useTags) { buildTagFilter(); apply(); } else { setFilter('ALL'); }
    // El botón de orden nace marcado "Newest first" pero las tarjetas se
    // renderizan en el orden en que están escritas en el HTML, no por fecha.
    // Sin este sortCards() inicial, esa etiqueta miente hasta el primer clic.
    if (sortBtn) sortCards();

    // Toggle vista lista/cuadrícula (solo si la página incluye los botones)
    const viewBtns = document.querySelectorAll('.sf-view-btn[data-view]');
    if (viewBtns.length && cardsGrid) {
      viewBtns.forEach(b => b.addEventListener('click', () => {
        viewBtns.forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
        cardsGrid.classList.toggle('is-grid', b.dataset.view === 'grid');
      }));
    }
  })();

// Búsqueda con Pagefind — inyecta botón + modal, carga Pagefind al abrir (lazy).
// Índice self-hosted en /_pagefind/ (raíz del dominio). CSP: script-src 'self' 'wasm-unsafe-eval'.
(function(){
  const actions = document.querySelector('header .flex.items-center.gap-2');
  if (!actions) return;
  const es = (document.documentElement.dataset.lang || 'EN').toUpperCase() === 'ES' || location.pathname.indexOf('/es/') !== -1;
  const label = es ? 'Buscar' : 'Search';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.id = 'sf-search-btn';
  btn.setAttribute('aria-label', label);
  btn.className = 'hidden md:inline-flex items-center gap-2 h-9 pl-3 pr-3.5 rounded-full border border-border bg-surface/40 text-[12.5px] text-muted-foreground hover:text-foreground transition-colors';
  btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg><span>' + label + '</span><kbd class="hidden xl:inline font-mono text-[10px] text-muted-foreground border border-border bg-background/60 px-1.5 py-0.5 rounded">' + (navigator.platform.indexOf('Mac') === 0 ? '⌘K' : 'Ctrl K') + '</kbd>';
  actions.insertBefore(btn, actions.firstChild);

  const modal = document.createElement('div');
  modal.id = 'sf-search-modal';
  modal.className = 'hidden fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm';
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = '<div class="max-w-3xl mx-auto mt-24 px-6"><div class="rounded-card border border-border bg-surface shadow-2xl overflow-hidden"><div id="sf-pagefind" class="p-4"></div></div><p class="text-center mt-3 text-[11px] font-mono text-muted">ESC</p></div>';
  document.body.appendChild(modal);

  // Root-relative depth, not a leading "/" — an absolute path only resolves
  // correctly when the site is served from true domain root; any local
  // preview or subpath mount turns it into a dead request (same class of
  // bug as the language toggle's path resolution).
  // Depth must come from the page's own declared canonical path, not the
  // raw browser pathname — a local preview mounted under an extra subpath
  // (e.g. /Pagina/Pagina/) has more real segments than the site's true
  // depth, and _pagefind/ lives at that mount's own root either way.
  const canonicalLink = document.querySelector('link[rel="canonical"]');
  let canonicalPath = location.pathname;
  if (canonicalLink && canonicalLink.getAttribute('href')) {
    try { canonicalPath = new URL(canonicalLink.href, location.href).pathname; } catch (e) {}
  }
  const rootPrefix = '../'.repeat(canonicalPath.split('/').filter(Boolean).length - (canonicalPath.endsWith('/') ? 0 : 1));

  let loaded = false, loading = false;
  function loadPagefind() {
    if (loaded || loading) return Promise.resolve();
    loading = true;
    return new Promise((resolve) => {
      const css = document.createElement('link');
      css.rel = 'stylesheet'; css.href = rootPrefix + '_pagefind/pagefind-ui.css';
      document.head.appendChild(css);
      const js = document.createElement('script');
      js.src = rootPrefix + '_pagefind/pagefind-ui.js';
      js.onload = () => {
        try {
          new window.PagefindUI({ element: '#sf-pagefind', showSubResults: true, showImages: true,
            translations: es ? { placeholder: 'Buscar en Breachfolio', zero_results: 'Sin resultados para [SEARCH_TERM]' } : { placeholder: 'Search Breachfolio' } });
          loaded = true;
          watchResultsForSectionTags();
        } catch (e) {}
        resolve();
      };
      js.onerror = () => { loading = false; resolve(); };
      document.body.appendChild(js);
    });
  }
  function open() {
    modal.classList.remove('hidden'); modal.setAttribute('aria-hidden', 'false');
    loadPagefind().then(() => { const inp = modal.querySelector('input'); if (inp) setTimeout(() => inp.focus(), 60); });
  }
  function close() { modal.classList.add('hidden'); modal.setAttribute('aria-hidden', 'true'); }

  // Etiqueta de sección por resultado (AI/Lab/Compare/...), derivada de la
  // URL del resultado — no requiere tocar ninguno de los 91 artículos.
  const SECTION_LABELS = {
    ai: 'AI SECURITY', cybersecurity: 'CYBERSECURITY', compare: 'COMPARE',
    lab: 'LAB', resources: 'RESOURCES', guides: 'GUIDES', guias: 'GUIDES',
    news: 'NEWS',
    ia: 'AI SECURITY', ciberseguridad: 'CYBERSECURITY', comparativas: 'COMPARE',
    laboratorio: 'LAB', recursos: 'RESOURCES', noticias: 'NEWS'
  };
  function sectionFromUrl(url) {
    const parts = url.replace(/^https?:\/\/[^/]+/, '').split('/').filter(Boolean);
    const seg = parts[0] === 'es' ? parts[1] : parts[0];
    return SECTION_LABELS[seg] || null;
  }
  function tagResult(resultEl) {
    if (resultEl.querySelector('.sf-result-tag')) return;
    const link = resultEl.querySelector('.pagefind-ui__result-link');
    const inner = resultEl.querySelector('.pagefind-ui__result-inner');
    if (!link || !inner) return;
    const section = sectionFromUrl(link.getAttribute('href') || '');
    if (!section) return;
    const tag = document.createElement('div');
    tag.className = 'sf-result-tag';
    tag.textContent = section;
    inner.insertBefore(tag, inner.firstChild);
  }
  function watchResultsForSectionTags() {
    const container = document.getElementById('sf-pagefind');
    if (!container) return;
    const apply = () => container.querySelectorAll('.pagefind-ui__result').forEach(tagResult);
    apply();
    new MutationObserver(apply).observe(container, { childList: true, subtree: true });
  }

  btn.addEventListener('click', open);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); open(); }
    if (e.key === 'Escape') close();
  });
})();
