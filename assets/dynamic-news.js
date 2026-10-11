/*
  Breachfolio — dynamic-news.js
  Pinta noticias/artículos desde data/news.json y data/latest.json (generados
  por el pipeline de n8n desde Supabase). Progresivo: si el fetch falla o no
  hay items, el HTML estático de respaldo del contenedor se queda como está.

  Uso: <div data-sf-news="../data/latest.json,../data/news.json" data-sf-limit="3" data-sf-mode="cards"></div>
    data-sf-news : una o varias rutas de JSON separadas por comas; los items de
                   todas las fuentes se fusionan y ordenan por fecha (los
                   artículos del build y las noticias de n8n conviven así sin
                   que ningún proceso tenga que escribir el fichero del otro)
    data-sf-limit: máximo de items (opcional, 0 = todos)
    data-sf-mode : "list" (artículos grandes, página News) | "cards" (grid compacto, home)
*/
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // El guion largo no se usa en el sitio, pero data/news.json lo trae: el prompt
  // de n8n pedia titulares con el formato "hecho principal — el detalle", y 16
  // de las 30 entradas se generaron antes de corregirlo. El prompt ya no lo pide;
  // esto limpia lo que quedo escrito, y cualquier cosa que vuelva a colarse.
  // El primero pasa a dos puntos, que es lo que significa en esos titulares;
  // los siguientes a coma, para no acabar con dos "dos puntos" en una frase.
  function deDash(s) {
    var first = true;
    return String(s == null ? '' : s).replace(/\s*—\s*/g, function () {
      if (first) { first = false; return ': '; }
      return ', ';
    });
  }

  function fmtDate(iso, lang) {
    try {
      return new Date(iso).toLocaleDateString(lang === 'ES' ? 'es-ES' : 'en-GB',
        { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) { return ''; }
  }

  function lang() {
    return (document.documentElement.dataset.lang || 'EN').toUpperCase();
  }

  function srcLabel() { return lang() === 'ES' ? 'Fuente' : 'Source'; }
  function ctaLabel() { return lang() === 'ES' ? 'Leer' : 'Read'; }

  // Derives a short section badge (GUIDES, SECURITY, AI...) from an item's
  // own url prefix rather than the page language, so a card keeps its real
  // section even in the rare case it differs from the surrounding page.
  var SECTION_LABELS = {
    en: { guides: 'GUIDES', cybersecurity: 'SECURITY', ai: 'AI', compare: 'COMPARE', news: 'NEWS', lab: 'LAB', resources: 'RESOURCES' },
    es: { guias: 'GUÍAS', ciberseguridad: 'SEGURIDAD', ia: 'IA', comparativas: 'COMPARATIVAS', noticias: 'NOTICIAS', laboratorio: 'LAB', recursos: 'RECURSOS' }
  };
  function sectionLabel(url) {
    var parts = String(url || '').split('/').filter(Boolean);
    if (!parts.length) return '';
    var isEs = parts[0] === 'es';
    var seg = isEs ? parts[1] : parts[0];
    var table = isEs ? SECTION_LABELS.es : SECTION_LABELS.en;
    return (table && table[seg]) || '';
  }

  function listItem(item) {
    var source = item.source_url
      ? '<a href="' + esc(item.source_url) + '" target="_blank" rel="noopener noreferrer" class="mt-5 inline-flex items-center gap-1.5 text-accent text-[13.5px] font-medium ul-link">' + srcLabel() + ' →</a>'
      : '';
    return '<article class="bg-surface border border-border rounded-card p-7 md:p-8">' +
      '<div class="flex flex-wrap items-center gap-3 mb-4">' +
      '<span class="font-mono text-[10px] tracking-[0.22em] uppercase text-accent border border-accent/30 px-2.5 py-1 rounded-full bg-accent/5">NEWS</span>' +
      '<span class="font-mono text-[11px] text-muted">' + esc(fmtDate(item.published_at)) + '</span>' +
      '</div>' +
      '<h3 class="font-display text-[19px] md:text-[21px] leading-snug font-semibold tracking-tight text-balance">' + esc(deDash(item.title)) + '</h3>' +
      '<p class="mt-3 text-muted-foreground text-[14.5px] leading-[1.7]">' + esc(deDash(item.summary)) + '</p>' +
      source +
      '</article>';
  }

  function cardItem(item, imgBase) {
    // item.image llega como ruta ("/assets/img/x.webp") o como URL absoluta
    // (el pipeline de n8n guarda "https://breachfolio.com/assets/img/x.webp");
    // las rutas se reconstruyen relativas al mismo prefijo que usa data-sf-news
    // para que funcionen también en previews locales, las absolutas pasan tal cual.
    var imgSrc = null;
    if (item.image) {
      imgSrc = /^https?:\/\//.test(item.image)
        ? item.image
        : imgBase + item.image.replace(/^\/?assets\/img\//, '');
    }
    // Una tarjeta del rail nunca se pinta más ancha de 306 px CSS
    // (flex: 0 0 clamp(260px, 80vw, 306px) en shared.css), así que servir el
    // original de 1280 era mandar cuatro veces los bytes necesarios.
    // tools/responsive-card-images.mjs genera las variantes -640 y -960 para
    // TODA imagen referenciada en data/*.json, no solo las que caben en el
    // límite de la página, de modo que estos nombres siempre existen.
    var img = '';
    if (imgSrc) {
      var srcsetAttr = '';
      if (/\.webp$/i.test(imgSrc) && !/-\d{3,4}\.webp$/i.test(imgSrc)) {
        var base = imgSrc.replace(/\.webp$/i, '');
        srcsetAttr = ' srcset="' + esc(base + '-640.webp') + ' 640w, ' + esc(base + '-960.webp') + ' 960w, ' +
          esc(imgSrc) + ' 1280w" sizes="(max-width: 382px) 80vw, 306px"';
      }
      img = '<img' + srcsetAttr + ' src="' + esc(imgSrc) + '" alt="" loading="lazy" decoding="async" width="640" height="360" />';
    }
    // Se conserva el <article> (el CSS de la cinta lo dimensiona con ancho fijo);
    // el enlace envuelve TODO el contenido para que la tarjeta sea clicable hacia
    // NUESTRO artículo (item.url). Las noticias con fuente externa ya la citan dentro.
    var href = item.url || '#';
    var tag = sectionLabel(item.url);
    var tagHtml = tag ? '<span class="sf-news-card-tag">' + esc(tag) + '</span>' : '';
    return '<article class="sf-news-card">' +
      '<a href="' + esc(href) + '" class="group flex flex-col flex-1">' +
      '<div class="sf-news-card-media">' + img + tagHtml + '</div>' +
      '<div class="sf-news-card-body">' +
      '<time class="sf-news-card-date" datetime="' + esc(item.published_at) + '">' + esc(fmtDate(item.published_at, lang())) + '</time>' +
      '<h3 class="sf-news-card-title line-clamp-2">' + esc(deDash(item.title)) + '</h3>' +
      '<p class="sf-news-card-excerpt line-clamp-2">' + esc(deDash(item.summary)) + '</p>' +
      '<span class="sf-news-card-cta">' + ctaLabel() +
        ' <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>' +
      '</div></a>' +
      '</article>';
  }

  function render(el) {
    var attr = el.getAttribute('data-sf-news');
    var limit = parseInt(el.getAttribute('data-sf-limit') || '0', 10);
    var mode = el.getAttribute('data-sf-mode') || 'list';
    if (!attr) return;
    var paths = attr.split(',').map(function (p) { return p.trim(); }).filter(Boolean);
    var pageLang = lang().toLowerCase();
    // data/ y assets/ son hermanas en la raíz del sitio, así que el mismo
    // prefijo relativo que llega a data/*.json llega a assets/img/.
    var imgBase = paths[0].replace(/data\/[a-z0-9-]+\.json$/, 'assets/img/');

    // Cada fuente se tolera por separado: si una falla, las demás siguen.
    Promise.all(paths.map(function (p) {
      return fetch(p, { cache: 'no-cache' })
        .then(function (res) { if (!res.ok) throw new Error(res.status); return res.json(); })
        .then(function (data) { return data.items || []; })
        .catch(function () { return []; });
    }))
      .then(function (lists) {
        var now = Date.now();
        var seen = {};
        var items = [].concat.apply([], lists)
          .filter(function (i) { return i && i.title; })
          // El feed automatizado de n8n mezcla idiomas en un único JSON; sin
          // este filtro, un item en inglés se cuela en una página en español
          // (y viceversa) en cuanto el pipeline añade contenido en varios idiomas.
          .filter(function (i) { return !i.lang || i.lang.toLowerCase() === pageLang; })
          .filter(function (i) { return !i.expires_at || Date.parse(i.expires_at) > now; })
          // data-sf-feed-only: solo entradas SIN página propia (su url apunta a la
          // raíz de la sección). Las que tienen página ya salen como tarjeta estática
          // en el listado, y aquí duplicarían.
          .filter(function (i) {
            if (!el.hasAttribute('data-sf-feed-only')) return true;
            return !i.url || /\/(news|noticias)\/?$/.test(i.url);
          })
          // Una noticia con página propia aparece en las dos fuentes (a veces con
          // títulos distintos): se colapsa por URL y, si la copia guardada no
          // tenía imagen, hereda la de la duplicada. Los items de solo-feed
          // comparten la url de la sección y se distinguen por título.
          .filter(function (i) {
            var feedOnly = !i.url || /\/(news|noticias)\/?$/.test(i.url);
            var k = feedOnly ? (i.url || '') + '|' + i.title : i.url;
            if (seen[k]) {
              if (!seen[k].image && i.image) seen[k].image = i.image;
              return false;
            }
            seen[k] = i;
            return true;
          })
          .sort(function (a, b) { return Date.parse(b.published_at || 0) - Date.parse(a.published_at || 0); });
        if (limit > 0) items = items.slice(0, limit);
        if (!items.length) return; // conservar fallback estático
        var tpl = mode === 'cards' ? function (item) { return cardItem(item, imgBase); } : listItem;
        el.innerHTML = items.map(tpl).join('');
        // Un contenedor [data-sf-reveal] alrededor (cabecera + lista) empieza
        // oculto y solo se muestra si de verdad hay items que pintar.
        var wrap = el.closest('[data-sf-reveal]');
        if (wrap) wrap.hidden = false;
        el.dispatchEvent(new CustomEvent('sf:news-rendered', { bubbles: true }));
      });
  }

  function init() {
    document.querySelectorAll('[data-sf-news]').forEach(render);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
