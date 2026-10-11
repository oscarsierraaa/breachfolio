/**
 * prerender-news-wire.mjs — put the news wire in the HTML instead of building it
 * on the client.
 *
 * WHY THIS EXISTS
 * The wire on /news/, /es/noticias/ and both homepages is filled by
 * assets/dynamic-news.js after a fetch of data/news.json. Rendering it with a
 * real browser took 9.3 seconds, and anything that does not run JavaScript sees
 * an empty rail: the AI crawlers the site goes out of its way to welcome in
 * robots.txt get a news page with no news on it.
 *
 * The data is a static JSON file written by the build. There is no reason for
 * the first paint to wait on a network round trip for a file we already have.
 *
 * HOW IT STAYS HONEST
 * It reproduces dynamic-news.js exactly: the same language filter, the same
 * expiry filter, the same dedupe by URL with image inheritance, the same sort
 * and limit, and the same card markup down to the class names. If the two ever
 * drift, the client render simply overwrites this one on load, so the failure
 * mode is "back to how it was", not a broken page.
 *
 * ONE DELIBERATE DIFFERENCE
 * Dates are formatted in UTC. The client formats in the reader's timezone, so a
 * reader far enough west may see the served date tick back by one day when the
 * script runs. Formatting server-side in a fixed zone is the only way to get a
 * deterministic build, and UTC is what the datetime attribute already carries.
 *
 * Usage:  node tools/prerender-news-wire.mjs [--apply]
 * Idempotent: the container's contents are replaced wholesale each run.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, relative, dirname, posix } from 'path';

const ROOT = process.cwd();
const APPLY = process.argv.includes('--apply');

const esc = (s) =>
  String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Igual que deDash() en dynamic-news.js: data/news.json trae guiones largos de
// los titulares que n8n genero antes de corregir su prompt, y el sitio no los usa.
const deDash = (s) => {
  let first = true;
  return String(s == null ? '' : s).replace(/\s*—\s*/g, () => {
    if (first) {
      first = false;
      return ': ';
    }
    return ', ';
  });
};

const fmtDate = (iso, lang) => {
  try {
    return new Date(iso).toLocaleDateString(lang === 'ES' ? 'es-ES' : 'en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
  } catch {
    return '';
  }
};

const SECTION_LABELS = {
  en: { guides: 'GUIDES', cybersecurity: 'SECURITY', ai: 'AI', compare: 'COMPARE', news: 'NEWS', lab: 'LAB', resources: 'RESOURCES' },
  es: { guias: 'GUÍAS', ciberseguridad: 'SEGURIDAD', ia: 'IA', comparativas: 'COMPARATIVAS', noticias: 'NOTICIAS', laboratorio: 'LAB', recursos: 'RECURSOS' },
};
function sectionLabel(url) {
  const parts = String(url || '').split('/').filter(Boolean);
  if (!parts.length) return '';
  const isEs = parts[0] === 'es';
  const seg = isEs ? parts[1] : parts[0];
  const table = isEs ? SECTION_LABELS.es : SECTION_LABELS.en;
  return (table && table[seg]) || '';
}

function cardItem(item, imgBase, lang) {
  let imgSrc = null;
  if (item.image) {
    imgSrc = /^https?:\/\//.test(item.image) ? item.image : imgBase + item.image.replace(/^\/?assets\/img\//, '');
  }
  // Mismo srcset que emite dynamic-news.js. Va aqui y no en
  // responsive-card-images.mjs para que el orden de los pasos del build no
  // importe: si aquel corriera antes, este lo habria borrado al reescribir el
  // contenedor entero.
  let srcsetAttr = '';
  if (imgSrc && /\.webp$/i.test(imgSrc) && !/-\d{3,4}\.webp$/i.test(imgSrc)) {
    const base = imgSrc.replace(/\.webp$/i, '');
    srcsetAttr = ` srcset="${esc(base + '-640.webp')} 640w, ${esc(base + '-960.webp')} 960w, ${esc(imgSrc)} 1280w" sizes="(max-width: 382px) 80vw, 306px"`;
  }
  const img = imgSrc ? `<img${srcsetAttr} src="${esc(imgSrc)}" alt="" loading="lazy" decoding="async" width="640" height="360" />` : '';
  const href = item.url || '#';
  const tag = sectionLabel(item.url);
  const tagHtml = tag ? `<span class="sf-news-card-tag">${esc(tag)}</span>` : '';
  const cta = lang === 'ES' ? 'Leer' : 'Read';
  return (
    '<article class="sf-news-card">' +
    `<a href="${esc(href)}" class="group flex flex-col flex-1">` +
    `<div class="sf-news-card-media">${img}${tagHtml}</div>` +
    '<div class="sf-news-card-body">' +
    `<time class="sf-news-card-date" datetime="${esc(item.published_at)}">${esc(fmtDate(item.published_at, lang))}</time>` +
    `<h3 class="sf-news-card-title line-clamp-2">${esc(deDash(item.title))}</h3>` +
    `<p class="sf-news-card-excerpt line-clamp-2">${esc(deDash(item.summary))}</p>` +
    `<span class="sf-news-card-cta">${cta}` +
    ' <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>' +
    '</div></a>' +
    '</article>'
  );
}

/** Finds the index just past the matching close of the div opened at `open`. */
function endOfDiv(html, open) {
  const re = /<div\b|<\/div>/g;
  re.lastIndex = open;
  let depth = 0;
  let m;
  while ((m = re.exec(html))) {
    if (m[0] === '</div>') {
      depth--;
      if (depth === 0) return m.index;
    } else depth++;
  }
  return -1;
}

const files = [];
(function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', '_pagefind'].includes(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name === 'index.html') files.push(p);
  }
})(ROOT);

const jsonCache = new Map();
function loadItems(absPath) {
  if (!jsonCache.has(absPath)) {
    try {
      jsonCache.set(absPath, JSON.parse(readFileSync(absPath, 'utf8')).items || []);
    } catch {
      jsonCache.set(absPath, []);
    }
  }
  return jsonCache.get(absPath);
}

let touched = 0;
let totalCards = 0;
const problems = [];

for (const file of files) {
  const rel = relative(ROOT, file).replace(/\\/g, '/');
  let html = readFileSync(file, 'utf8');
  if (!html.includes('data-sf-news=')) continue;

  const pageLang = (html.match(/<html[^>]*\bdata-lang="([^"]+)"/) || [])[1] || 'EN';
  const pageDir = dirname(file);
  let changed = false;

  const openRe = /<div\b[^>]*data-sf-news="([^"]+)"[^>]*>/g;
  let m;
  const edits = [];
  while ((m = openRe.exec(html))) {
    const openTag = m[0];
    const attrPaths = m[1].split(',').map((s) => s.trim()).filter(Boolean);
    const limit = parseInt((openTag.match(/data-sf-limit="(\d+)"/) || [])[1] || '0', 10);
    const mode = (openTag.match(/data-sf-mode="([^"]+)"/) || [])[1] || 'list';
    const feedOnly = /data-sf-feed-only/.test(openTag);
    if (mode !== 'cards') {
      problems.push(`${rel}: modo "${mode}" no soportado por el prerender, se deja al cliente`);
      continue;
    }

    const imgBase = attrPaths[0].replace(/data\/[a-z0-9-]+\.json$/, 'assets/img/');
    const lists = attrPaths.map((p) => loadItems(join(pageDir, p)));

    const now = Date.now();
    const seen = new Map();
    let items = []
      .concat(...lists)
      .filter((i) => i && i.title)
      .filter((i) => !i.lang || i.lang.toUpperCase() === pageLang.toUpperCase())
      .filter((i) => !i.expires_at || Date.parse(i.expires_at) > now)
      .filter((i) => {
        if (!feedOnly) return true;
        return !i.url || /\/(news|noticias)\/?$/.test(i.url);
      })
      .filter((i) => {
        const isFeedOnly = !i.url || /\/(news|noticias)\/?$/.test(i.url);
        const k = isFeedOnly ? (i.url || '') + '|' + i.title : i.url;
        if (seen.has(k)) {
          const kept = seen.get(k);
          if (!kept.image && i.image) kept.image = i.image;
          return false;
        }
        seen.set(k, i);
        return true;
      })
      .sort((a, b) => Date.parse(b.published_at || 0) - Date.parse(a.published_at || 0));
    if (limit > 0) items = items.slice(0, limit);
    if (!items.length) {
      problems.push(`${rel}: 0 items tras filtrar por idioma ${pageLang}, se conserva el respaldo estatico`);
      continue;
    }

    const openIdx = m.index;
    const innerStart = openIdx + openTag.length;
    const innerEnd = endOfDiv(html, openIdx);
    if (innerEnd < 0) {
      problems.push(`${rel}: no encuentro el cierre del contenedor`);
      continue;
    }
    const markup = '\n<!-- prerender-news-wire.mjs: dynamic-news.js lo reemplaza al cargar -->\n' + items.map((i) => cardItem(i, imgBase, pageLang)).join('\n') + '\n';
    edits.push({ innerStart, innerEnd, markup, count: items.length });
  }

  // De atras hacia delante para que los indices sigan siendo validos.
  for (const e of edits.reverse()) {
    html = html.slice(0, e.innerStart) + e.markup + html.slice(e.innerEnd);
    changed = true;
    totalCards += e.count;
  }

  if (changed) {
    touched++;
    console.log(`  ${APPLY ? 'prerenderizado' : 'prerenderizaria'}  ${rel}  (${edits.map((e) => e.count).join(', ')} tarjetas, ${pageLang})`);
    if (APPLY) writeFileSync(file, html);
  }
}

console.log('');
console.log(`paginas ${APPLY ? 'actualizadas' : 'a actualizar'}: ${touched} | tarjetas escritas: ${totalCards}`);
problems.forEach((p) => console.log(`  !! ${p}`));
if (!APPLY) console.log('\n(simulacion: no se ha escrito nada. Ejecuta con --apply)');
