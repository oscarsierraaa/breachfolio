#!/usr/bin/env node
/*
  Breachfolio — generate-pagination.mjs
  Gives each section a real, crawlable URL per archive page once it grows
  past PAGE_SIZE articles, instead of relying only on the client-side
  show/hide in assets/page.js (which has no URL of its own for page 2+).

  Run via `npm run build:pagination` (part of `npm run build`). Safe to run
  every time: sections with <= PAGE_SIZE articles produce zero extra files,
  and any previously-generated page-N/ for a section that has shrunk back
  under the threshold is removed.

  Output: <section>/page-2/index.html, <section>/page-3/index.html, ...
  (clean URLs, one directory level deeper than the section's own index.html,
  so every relative link/asset path copied out of the section index needs an
  extra "../" — see deepenLinks()).
*/
import { readFileSync, writeFileSync, existsSync, unlinkSync, readdirSync, mkdirSync, rmdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGE_SIZE = 6;
// News is intentionally excluded: it's a curated row-layout digital-newspaper
// feed (see STATE.md), not a card grid, and is fed by the n8n pipeline rather
// than growing through the same 5/section article backlog as the other five.
// Labels match the breadcrumbs already used by each section's own articles.
const SECTIONS = [
  { dir: 'cybersecurity', label: 'Cybersecurity', lang: 'en', altDir: 'es/ciberseguridad' },
  { dir: 'ai', label: 'AI', lang: 'en', altDir: 'es/ia' },
  { dir: 'lab', label: 'Lab', lang: 'en', altDir: 'es/laboratorio' },
  { dir: 'compare', label: 'Compare', lang: 'en', altDir: 'es/comparativas' },
  { dir: 'resources', label: 'Resources', lang: 'en', altDir: 'es/recursos' },
  { dir: 'guides', label: 'Guides', lang: 'en', altDir: 'es/guias' },
  { dir: 'es/ciberseguridad', label: 'Ciberseguridad', lang: 'es', altDir: 'cybersecurity' },
  { dir: 'es/ia', label: 'IA', lang: 'es', altDir: 'ai' },
  { dir: 'es/laboratorio', label: 'Laboratorio', lang: 'es', altDir: 'lab' },
  { dir: 'es/comparativas', label: 'Comparativas', lang: 'es', altDir: 'compare' },
  { dir: 'es/recursos', label: 'Recursos', lang: 'es', altDir: 'resources' },
  { dir: 'es/guias', label: 'Guías', lang: 'es', altDir: 'guides' },
];

const STR = {
  en: { page: 'Page', of: 'of', archive: 'Archive', prev: 'Previous', next: 'Next', home: 'Home', backToAll: 'back to all' },
  es: { page: 'Página', of: 'de', archive: 'Archivo', prev: 'Anterior', next: 'Siguiente', home: 'Inicio', backToAll: 'volver a' },
};

function extractCards(html) {
  const cardsBlockMatch = html.match(/<div id="cards"[^>]*>([\s\S]*?)\n\s*<\/div>\s*\n\s*<div id="empty"/);
  if (!cardsBlockMatch) return null;
  const inner = cardsBlockMatch[1];
  const cardRe = /<a href="[^"]*"\s+class="card[\s\S]*?<\/a>/g;
  return inner.match(cardRe) || [];
}

// Cards are copied out of the section index (1 level deep from repo root)
// into a page-N/ subdirectory (2 levels deep) — every relative href/src on
// them needs one more "../" to still resolve correctly.
//
// srcset MUST be handled separately, and it was missed until 2026-08-17. Two
// reasons it hid for so long:
//   - `src="` does not match inside `srcset="`, so the rule below silently
//     skipped every responsive image.
//   - the `src` fallback on those same tags WAS rewritten and is correct, so
//     the HTML looks fine on inspection. But a browser picks its candidate from
//     srcset, and a candidate that 404s does not fall back to src: the card
//     just renders broken.
// The damage was 351 image URLs 404ing across 24 pagination pages, in both
// languages and every section, since responsive images were introduced.
//
// srcset is a comma-separated list of "url descriptor" pairs, so each URL has
// to be prefixed on its own; prefixing the attribute as a whole would only fix
// the first candidate.
function deepenLinks(html) {
  const isAbsolute = (v) => /^(https?:|#|mailto:|tel:|data:|\/)/.test(v);

  return html
    .replace(/(srcset=")([^"]+)(")/g, (m, pre, val, post) => {
      const rewritten = val
        .split(',')
        .map((part) => {
          const t = part.trim();
          if (!t) return null;
          const [url, ...rest] = t.split(/\s+/);
          if (isAbsolute(url)) return t;
          return ['../' + url, ...rest].join(' ');
        })
        .filter(Boolean)
        .join(', ');
      return pre + rewritten + post;
    })
    .replace(/((?:href|src)=")([^"]+)(")/g, (m, pre, val, post) => {
      if (isAbsolute(val)) return m;
      return pre + '../' + val + post;
    });
}

/**
 * Appends the "— Page N" marker to a description without pushing it past the
 * 165 characters Google will show. The section descriptions already sit near
 * that limit, so blindly appending put ten archive pages over it. The base is
 * trimmed back to a word boundary first, and only when it has to be.
 */
const DESCRIPTION_LIMIT = 165;
function fitDescription(base, suffix) {
  const full = `${base} ${suffix}`;
  if (full.length <= DESCRIPTION_LIMIT) return full;
  const room = DESCRIPTION_LIMIT - suffix.length - 1;
  let trimmed = base.slice(0, room);
  const lastSpace = trimmed.lastIndexOf(' ');
  if (lastSpace > 40) trimmed = trimmed.slice(0, lastSpace);
  trimmed = trimmed.replace(/[\s.,;:–-]+$/, '');
  return `${trimmed} ${suffix}`;
}

function buildPage({ headHtml, headerNavHtml, cardsOpenTag, cards, section, pageNum, totalPages, altTotalPages }) {
  const t9 = STR[section.lang];
  // El separador era un guion largo. El sitio usa el punto medio en el resto
  // de lineas meta, y ademas este sufijo se replica en title, description, og y
  // twitter, asi que un solo caracter aqui sembraba 7 guiones largos por pagina.
  const suffix = `· ${t9.page} ${pageNum}`;
  const base = `https://breachfolio.com/${section.dir}`;
  const canonical = `${base}/page-${pageNum}/`;
  const prevUrl = pageNum === 2 ? `${base}/` : `${base}/page-${pageNum - 1}/`;
  const nextUrl = pageNum < totalPages ? `${base}/page-${pageNum + 1}/` : null;
  const prevHref = pageNum === 2 ? '../' : `../page-${pageNum - 1}/`;
  const nextHref = pageNum < totalPages ? `../page-${pageNum + 1}/` : null;
  // page-N/ sits one level deeper than the section index; assets live at the
  // repo root, so the prefix depends on how deep the section itself is
  // ('guides' → ../../, 'es/guias' → ../../../).
  const rootPrefix = '../'.repeat(section.dir.split('/').length + 1);

  let head = headHtml
    // The brand suffix comes out of the paginated <title>. Keeping it and then
    // appending "— Page N" pushed every archive page past 65 characters, which
    // is where Google starts truncating; the section name plus the page number
    // is what actually helps a searcher here, and Google appends the site name
    // in results anyway. og:title and twitter:title keep the brand.
    .replace(/<title>([^<]*)<\/title>/, (m, t) => `<title>${t.replace(/\s*\|\s*Breachfolio\s*$/, '')} ${suffix}</title>`)
    .replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${canonical}" />`)
    .replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${canonical}" />`)
    .replace(/<meta property="og:title" content="([^"]*)" \/>/, (m, t) => `<meta property="og:title" content="${t} ${suffix}" />`)
    .replace(/<meta name="twitter:title" content="([^"]*)" \/>/, (m, t) => `<meta name="twitter:title" content="${t} ${suffix}" />`)
    .replace(/<meta name="description" content="([^"]*)" \/>/, (m, d) => `<meta name="description" content="${fitDescription(d, suffix)}" />`)
    .replace(/<meta property="og:description" content="([^"]*)" \/>/, (m, d) => `<meta property="og:description" content="${d} ${suffix}" />`)
    .replace(/<meta name="twitter:description" content="([^"]*)" \/>/, (m, d) => `<meta name="twitter:description" content="${d} ${suffix}" />`);

  // Point hreflang at the equivalent archive page in the other language,
  // not at the section index. Only added when that section has the same
  // number of archive pages on both sides (true for every section today —
  // article counts are kept 1:1 between EN and ES), so page-N always has a
  // real page-N counterpart. If the counts ever diverge, this section's
  // pagination pages simply go back to having no hreflang rather than
  // linking to a page that doesn't exist.
  head = head.replace(/\s*<link rel="alternate" hreflang="[^"]*" href="[^"]*" \/>\n/g, '\n');
  if (altTotalPages != null && pageNum <= altTotalPages) {
    const altBase = `https://breachfolio.com/${section.altDir}`;
    const altUrl = `${altBase}/page-${pageNum}/`;
    const enUrl = section.lang === 'en' ? canonical : altUrl;
    const esUrl = section.lang === 'es' ? canonical : altUrl;
    const hreflangLinks = [
      `  <link rel="alternate" hreflang="en" href="${enUrl}" />`,
      `  <link rel="alternate" hreflang="es" href="${esUrl}" />`,
      `  <link rel="alternate" hreflang="x-default" href="${enUrl}" />`,
    ].join('\n');
    head = head.replace('</head>', hreflangLinks + '\n</head>');
  }

  // Drop the page-1 ItemList (it lists the whole section, not just this slice).
  head = head.replace(/<script type="application\/ld\+json">\{\s*"@context": "https:\/\/schema\.org",\s*"@type": "ItemList",[\s\S]*?\]\s*\}<\/script>\s*/, '');

  // The head's own asset links (theme-init, favicon, shared.css, tw.css,
  // shared.js) were written for the section index's depth — deepen them too.
  head = deepenLinks(head);

  // The section index now carries its own <link rel="next"> to page-2, and this
  // head was copied from it. Left in place, page-2 would inherit a rel=next
  // pointing at itself. Strip whatever came along before writing our own pair.
  head = head.replace(/\s*<link rel="(?:prev|next)" href="[^"]*" \/>/g, '');

  const linkNav = [];
  linkNav.push(`  <link rel="prev" href="${prevUrl}" />`);
  if (nextUrl) linkNav.push(`  <link rel="next" href="${nextUrl}" />`);
  head = head.replace('</head>', linkNav.join('\n') + '\n</head>');

  const sectionLabel = section.label;
  const breadcrumb = `<nav aria-label="Breadcrumb" class="max-w-container mx-auto px-6 md:px-12 pt-6">
  <ol class="flex flex-wrap items-center gap-2 text-[12px] font-mono tracking-wide text-muted-foreground uppercase">
    <li><a href="../../" class="hover:text-foreground ul-link">${t9.home}</a></li><li aria-hidden="true" class="text-muted">/</li><li><a href="../" class="hover:text-foreground ul-link">${sectionLabel}</a></li><li aria-hidden="true" class="text-muted">/</li><li><span aria-current="page" class="text-foreground">${t9.page} ${pageNum}</span></li>
  </ol>
</nav>`;

  const pager = [];
  pager.push('<nav class="mt-10 flex items-center justify-between gap-4 border-t border-border pt-6" aria-label="Archive pagination">');
  pager.push(`  <a href="${prevHref}" class="sf-page inline-flex items-center gap-1.5 px-3"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6"/></svg><span class="hidden sm:inline">${t9.prev}</span></a>`);
  pager.push('  <div class="flex items-center gap-1">');
  for (let p = 1; p <= totalPages; p++) {
    const href = p === 1 ? '../' : `../page-${p}/`;
    if (p === pageNum) pager.push(`    <span class="sf-page" aria-current="page">${p}</span>`);
    else pager.push(`    <a class="sf-page" href="${href}">${p}</a>`);
  }
  pager.push('  </div>');
  if (nextHref) pager.push(`  <a href="${nextHref}" class="sf-page inline-flex items-center gap-1.5 px-3"><span class="hidden sm:inline">${t9.next}</span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>`);
  else pager.push(`  <span class="sf-page inline-flex items-center gap-1.5 px-3" aria-disabled="true"><span class="hidden sm:inline">${t9.next}</span></span>`);
  pager.push('</nav>');

  const deepHeaderNav = deepenLinks(headerNavHtml);
  const deepCards = cards.map(deepenLinks);

  return `${head}
${deepHeaderNav}${breadcrumb}
<main id="main">
  <section class="max-w-container mx-auto px-6 md:px-12 py-14 md:py-20">
    <div class="mb-8">
      <div class="text-[11px] font-mono tracking-[0.22em] text-accent uppercase">${sectionLabel} · ${t9.archive}</div>
      <h1 class="font-display mt-3 text-[clamp(1.5rem,3vw,2rem)] leading-tight tracking-tight font-semibold">${t9.page} ${pageNum} ${t9.of} ${totalPages}.</h1>
    </div>
    ${cardsOpenTag}
${deepCards.join('\n')}
    </div>
    ${pager.join('\n')}
  </section>
</main>
<footer class="bg-surface-2 border-t border-border mt-20">
  <div class="max-w-container mx-auto px-6 md:px-12 py-8 text-center text-[13px] text-muted-foreground">
    <a href="../../" class="ul-link hover:text-foreground">Breachfolio</a> · <a href="../" class="ul-link hover:text-foreground">${t9.backToAll} ${sectionLabel}</a>
  </div>
</footer>
<script src="${rootPrefix}assets/shared.js" defer></script>
<script src="${rootPrefix}assets/page.js" defer></script>
</body>
</html>
`;
}

/**
 * Puts the archive links into the section index as real HTML.
 *
 * assets/page.js already builds <a href="./page-N/"> for the numbered pager,
 * and its comment says the point was to give crawlers "an actual path to page
 * 2+, not just a JS-only control". It never reached the served HTML, because
 * the links are injected into #sf-page-numbers at runtime. The result was that
 * every section's page-2 sat in the sitemap with zero internal links pointing
 * at it: reachable only by JS execution, and invisible to any crawler that
 * does not run scripts.
 *
 * So the numbers are written server-side here, and page.js keeps enhancing
 * them (it clears the container and rebuilds it, so nothing ends up doubled).
 * A <link rel="next"> is added to match the <link rel="prev"> that page-2
 * already declared back at the index.
 *
 * Idempotent: the pager block and the rel=next are rewritten wholesale.
 */
function linkIndexToArchive(indexPath, section, totalPages) {
  let html = readFileSync(indexPath, 'utf-8');
  const before = html;
  const base = `https://breachfolio.com/${section.dir}`;

  const numbers = ['<span class="sf-page" aria-current="page">1</span>'];
  for (let p = 2; p <= totalPages; p++) {
    numbers.push(`<a class="sf-page" href="./page-${p}/">${p}</a>`);
  }
  html = html.replace(
    /(<div id="sf-page-numbers"[^>]*>)[\s\S]*?(<\/div>)/,
    (m, open, close) => `${open}\n${numbers.join('\n')}\n${close}`
  );

  html = html.replace(/\s*<link rel="next" href="[^"]*" \/>/g, '');
  if (totalPages > 1) {
    html = html.replace('</head>', `  <link rel="next" href="${base}/page-2/" />\n</head>`);
  }

  if (html === before) return false;
  writeFileSync(indexPath, html, 'utf-8');
  return true;
}

function main() {
  const results = [];

  // First pass: compute each section's total archive-page count so pages
  // can cross-reference their counterpart's page count for hreflang.
  const totalPagesByDir = {};
  for (const section of SECTIONS) {
    const indexPath = path.join(ROOT, section.dir, 'index.html');
    if (!existsSync(indexPath)) continue;
    const html = readFileSync(indexPath, 'utf-8');
    const cards = extractCards(html);
    if (!cards) continue;
    totalPagesByDir[section.dir] = Math.max(1, Math.ceil(cards.length / PAGE_SIZE));
  }

  for (const section of SECTIONS) {
    const indexPath = path.join(ROOT, section.dir, 'index.html');
    if (!existsSync(indexPath)) continue;
    const html = readFileSync(indexPath, 'utf-8');

    const cards = extractCards(html);
    if (!cards) { results.push(`${section.dir}: could not locate #cards block, skipped`); continue; }

    const totalPages = Math.max(1, Math.ceil(cards.length / PAGE_SIZE));
    const altTotalPages = totalPagesByDir[section.altDir] ?? null;
    const dir = path.join(ROOT, section.dir);

    // Clean up any stale generated page-N/ dirs first (e.g. section shrank).
    const existingGenerated = readdirSync(dir, { withFileTypes: true })
      .filter(e => e.isDirectory() && /^page-\d+$/.test(e.name));
    for (const e of existingGenerated) {
      const n = parseInt(e.name.match(/\d+/)[0], 10);
      if (n > totalPages || totalPages === 1) {
        const pageDir = path.join(dir, e.name);
        const indexFile = path.join(pageDir, 'index.html');
        if (existsSync(indexFile)) unlinkSync(indexFile);
        try { rmdirSync(pageDir); } catch { /* not empty / already gone */ }
        results.push(`${section.dir}: removed stale ${e.name}/`);
      }
    }

    if (totalPages <= 1) {
      results.push(`${section.dir}: ${cards.length} articles, 1 page — nothing to generate`);
      continue;
    }

    const headMatch = html.match(/^([\s\S]*?)<\/head>/);
    const headHtml = headMatch[0];
    const bodyOpenMatch = html.match(/<body[^>]*>/);
    const headerNavHtml = html.slice(bodyOpenMatch.index, html.indexOf('</header>') + '</header>'.length);
    const cardsOpenTagMatch = html.match(/<div id="cards"[^>]*>/);
    const cardsOpenTag = cardsOpenTagMatch[0];

    for (let n = 2; n <= totalPages; n++) {
      const slice = cards.slice((n - 1) * PAGE_SIZE, n * PAGE_SIZE);
      const pageHtml = buildPage({
        headHtml, headerNavHtml, cardsOpenTag,
        cards: slice,
        section,
        pageNum: n,
        totalPages,
        altTotalPages,
      });
      const pageDir = path.join(dir, `page-${n}`);
      mkdirSync(pageDir, { recursive: true });
      writeFileSync(path.join(pageDir, 'index.html'), pageHtml, 'utf-8');
      results.push(`${section.dir}: wrote page-${n}/index.html (${slice.length} articles)`);
    }

    if (linkIndexToArchive(indexPath, section, totalPages)) {
      results.push(`${section.dir}: index now links to page-2..${totalPages} in HTML`);
    }
  }
  console.log(results.join('\n'));
}

main();
