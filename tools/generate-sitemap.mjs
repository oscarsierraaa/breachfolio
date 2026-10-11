#!/usr/bin/env node
/*
  Breachfolio — generate-sitemap.mjs
  Walks the deployable HTML tree and regenerates sitemap.xml from what's
  actually on disk, instead of a hand-maintained file that drifts as content
  grows. Run via `npm run build:sitemap` (also part of `npm run build`).

  Rules (derived from the sitemap's own prior conventions):
  - Skip any page whose <meta name="robots"> contains "noindex".
  - Skip 404.html (never indexable).
  - canonical  <- <link rel="canonical" href="...">  (page is skipped with a
    warning if it has none — every real page should declare one).
  - hreflang alternates <- every <link rel="alternate" hreflang="..."> tag
    already present on the page (both EN and ES sides declare these
    reciprocally; we don't invent alternates that don't exist as real pages).
  - lastmod <- the file's last real git commit date (falls back to the
    file's mtime if the file is not tracked yet, e.g. brand new).
  - priority/changefreq <- by path pattern (home, section index, article,
    news article, legal-primary, legal-secondary).
*/
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE_URL = 'https://breachfolio.com';

const EXCLUDE_DIRS = new Set(['node_modules', '_pagefind', '.git', 'tools']);
const EXCLUDE_FILES = new Set(['404.html']);

// Drafted-but-unpublished articles that exist on disk locally but were never
// pushed (they 404 in production). Excluded so the sitemap never tells
// search engines to crawl a URL that doesn't resolve. Note: this is NOT for
// pages that are live but simply unlinked from a hub page yet — those are
// legitimately crawlable and belong in the sitemap; only genuinely-unpublished
// (never-pushed) paths go here.
// Vacío desde el 2026-08-13. Las dos rutas que contenía (antivirus-vs-edr y su
// versión ES) se publicaron ese día y se retiraron del sitio entero el 17-08,
// así que ya no hay ficheros que excluir. La lista se conserva porque el
// mecanismo hace falta en cuanto vuelva a haber un borrador en disco.
const DRAFT_PATHS = new Set();

function walk(dir, out) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.has(entry.name)) continue;
      walk(full, out);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      if (EXCLUDE_FILES.has(entry.name)) continue;
      out.push(full);
    }
  }
  return out;
}

function isNoindex(html) {
  const m = html.match(/<meta\s+name="robots"\s+content="([^"]*)"/i);
  return !!m && /noindex/i.test(m[1]);
}

function getCanonical(html) {
  const m = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
  return m ? m[1] : null;
}

function getHreflangAlternates(html) {
  const alts = [];
  const re = /<link\s+rel="alternate"\s+hreflang="([^"]+)"\s+href="([^"]+)"/gi;
  let m;
  while ((m = re.exec(html))) alts.push({ hreflang: m[1], href: m[2] });
  return alts;
}

function gitLastMod(absPath) {
  try {
    const rel = path.relative(ROOT, absPath).split(path.sep).join('/');
    const out = execSync(`git log -1 --format=%ad --date=short -- "${rel}"`, {
      cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'],
    }).toString().trim();
    if (out) return out;
  } catch (e) { /* fall through to mtime */ }
  return statSync(absPath).mtime.toISOString().slice(0, 10);
}

function classify(relUrl) {
  // relUrl is the clean path portion after the domain, e.g.
  // "/ai/prompt-injection-explained/" or "/es/ciberseguridad/". Every page
  // now ends in a trailing slash (clean URLs), so section-index vs. article
  // is told apart by segment count, not by an ".html"/"index.html" suffix.
  const segs = relUrl.split('/').filter(Boolean);
  const isEs = segs[0] === 'es';
  const rest = isEs ? segs.slice(1) : segs;

  if (rest.length === 0) return { priority: '1.0', changefreq: 'weekly' }; // home
  if (rest[0] === 'legal') {
    if (['privacy', 'terms', 'cookies'].includes(rest[1])) return { priority: '0.3', changefreq: 'yearly' };
    return { priority: '0.4', changefreq: 'yearly' };
  }
  if (rest[0] === 'news' || rest[0] === 'noticias') {
    return rest.length === 1
      ? { priority: '0.8', changefreq: 'daily' }
      : { priority: '0.6', changefreq: 'monthly' };
  }
  if (rest.length === 1) return { priority: '0.8', changefreq: 'weekly' }; // any section index
  return { priority: '0.7', changefreq: 'monthly' }; // article
}

function main() {
  const files = walk(ROOT, []).sort();
  const entries = [];
  const warnings = [];

  for (const absPath of files) {
    const html = readFileSync(absPath, 'utf-8');
    if (isNoindex(html)) continue;

    const canonical = getCanonical(html);
    if (!canonical) {
      warnings.push(`SKIPPED (no canonical): ${path.relative(ROOT, absPath)}`);
      continue;
    }

    const relUrl = canonical.replace(BASE_URL, '');
    if (DRAFT_PATHS.has(relUrl)) continue;
    const alternates = getHreflangAlternates(html);
    const lastmod = gitLastMod(absPath);
    const { priority, changefreq } = classify(relUrl);

    entries.push({ canonical, alternates, lastmod, priority, changefreq });
  }

  // De-duplicate: EN and ES pages of the same pair both carry the full
  // alternate set, which would otherwise produce two near-identical <url>
  // blocks. Keep one <url> entry per canonical URL (already the case here
  // since we iterate files, not alternates), so no extra work needed —
  // each real file produces exactly one <url> block for its own canonical.

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  xml += '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n\n';

  for (const e of entries) {
    xml += '  <url>\n';
    xml += `    <loc>${e.canonical}</loc>\n`;
    for (const alt of e.alternates) {
      xml += `    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${alt.href}" />\n`;
    }
    xml += `    <lastmod>${e.lastmod}</lastmod>\n`;
    xml += `    <changefreq>${e.changefreq}</changefreq><priority>${e.priority}</priority>\n`;
    xml += '  </url>\n';
  }

  xml += '</urlset>\n';

  writeFileSync(path.join(ROOT, 'sitemap.xml'), xml, 'utf-8');

  console.log(`sitemap.xml regenerated: ${entries.length} URLs`);
  if (warnings.length) {
    console.log('\nWarnings:');
    warnings.forEach(w => console.log('  ' + w));
  }
}

main();
