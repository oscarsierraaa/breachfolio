#!/usr/bin/env node
/*
  Breachfolio — generate-html-sitemap.mjs
  Regenerates the section listing inside sitemap/index.html from what's
  actually on disk, instead of the hand-maintained block that had drifted
  (confirmed in SEO audit: 0 of 32 Guides/Guías articles listed, several
  articles missing per section, no Spanish content at all). Mirrors the
  logic of generate-sitemap.mjs (which already does this for sitemap.xml).
  Run via `npm run build:html-sitemap` (add to `npm run build`).
*/
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXCLUDE_DIRS = new Set(['node_modules', '_pagefind', '.git', 'tools', 'assets', 'data']);

function walk(dir, out) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.has(entry.name)) continue;
      walk(full, out);
    } else if (entry.isFile() && entry.name === 'index.html') {
      out.push(full);
    }
  }
  return out;
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
}

function getH1(html) {
  const main = html.match(/<main[^>]*>([\s\S]*)<\/main>/);
  const scope = main ? main[1] : html;
  const m = scope.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  return m ? stripTags(m[1]) : null;
}

function getCanonical(html) {
  const m = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
  return m ? m[1].replace('https://breachfolio.com', '') : null;
}

function isNoindex(html) {
  const m = html.match(/<meta\s+name="robots"\s+content="([^"]*)"/i);
  return !!m && /noindex/i.test(m[1]);
}

const SECTION_LABELS = {
  en: { cybersecurity: 'Cybersecurity', ai: 'AI', lab: 'Lab', compare: 'Compare', resources: 'Resources', news: 'News', guides: 'Guides', legal: 'Legal & info' },
  es: { cybersecurity: 'Ciberseguridad', ai: 'IA', lab: 'Lab', compare: 'Comparativas', resources: 'Recursos', news: 'Noticias', guides: 'Guías', legal: 'Legal e información' },
};
const SECTION_ORDER = ['cybersecurity', 'ai', 'lab', 'compare', 'resources', 'news', 'guides', 'legal'];
const ALL_LABEL = {
  en: { cybersecurity: 'All cybersecurity guides', ai: 'All AI guides', lab: 'All lab walkthroughs', compare: 'All comparisons', resources: 'All resources', news: 'All news', guides: 'All guides' },
  es: { cybersecurity: 'Todas las guías de ciberseguridad', ai: 'Todas las guías de IA', lab: 'Todos los laboratorios', compare: 'Todas las comparativas', resources: 'Todos los recursos', news: 'Todas las noticias', guides: 'Todas las guías' },
};

function buildData(lang) {
  const base = lang === 'es' ? path.join(ROOT, 'es') : ROOT;
  const files = walk(base, []).sort();
  const sections = {};
  for (const s of SECTION_ORDER) sections[s] = [];

  for (const absPath of files) {
    const html = readFileSync(absPath, 'utf-8');
    if (isNoindex(html)) continue;
    const canonical = getCanonical(html);
    if (!canonical) continue;

    const relFromBase = path.relative(base, path.dirname(absPath)).split(path.sep).join('/');
    const segs = relFromBase.split('/').filter(Boolean);
    if (segs.length === 0) continue; // home, handled separately
    if (/^page-\d+$/.test(segs[segs.length - 1])) continue; // skip pagination pages
    if (segs[0] === 'sitemap') continue;

    let section = segs[0];
    if (section === 'guias') section = 'guides';
    if (!sections[section]) continue; // unknown top-level dir, skip defensively

    const h1 = getH1(html) || stripTags((html.match(/<title>([^<]*)<\/title>/) || [, ''])[1]).replace(/\s*\|\s*Breachfolio$/, '');
    const isIndex = segs.length === 1;
    sections[section].push({ url: canonical, label: h1, isIndex });
  }

  // sort: index page first, then articles alphabetically by label
  for (const s of Object.keys(sections)) {
    sections[s].sort((a, b) => (b.isIndex - a.isIndex) || a.label.localeCompare(b.label));
  }
  return sections;
}

function renderColumn(lang, sectionKey, items) {
  const label = SECTION_LABELS[lang][sectionKey];
  const prefix = lang === 'es' ? '..' : '..'; // both are one level deep from /sitemap/ or /es/sitemap/
  let html = `      <div>\n        <h2 class="font-display text-[13px] font-semibold uppercase tracking-wide text-accent">${label}</h2>\n        <ul class="mt-4 space-y-2.5 text-[14.5px] text-muted-foreground">\n`;
  for (const item of items) {
    const displayLabel = item.isIndex ? (ALL_LABEL[lang][sectionKey] || label) : item.label;
    html += `          <li><a class="ul-link hover:text-foreground" href="${item.url}">${displayLabel}</a></li>\n`;
  }
  html += '        </ul>\n      </div>\n';
  return html;
}

function renderHomeColumn(lang) {
  const label = lang === 'es' ? 'Inicio' : 'Home';
  const homeLabel = lang === 'es' ? 'Inicio' : 'Home';
  const otherLabel = lang === 'es' ? 'English (home)' : 'Español (home)';
  const homeHref = lang === 'es' ? '/es/' : '/';
  const otherHref = lang === 'es' ? '/' : '/es/';
  return `      <div>\n        <h2 class="font-display text-[13px] font-semibold uppercase tracking-wide text-accent">${label}</h2>\n        <ul class="mt-4 space-y-2.5 text-[14.5px] text-muted-foreground">\n          <li><a class="ul-link hover:text-foreground" href="${homeHref}">${homeLabel}</a></li>\n          <li><a class="ul-link hover:text-foreground" href="${otherHref}">${otherLabel}</a></li>\n        </ul>\n      </div>\n`;
}

function generateBlock(lang) {
  const sections = buildData(lang);
  let html = renderHomeColumn(lang);
  for (const key of SECTION_ORDER) {
    if (!sections[key] || !sections[key].length) continue;
    html += renderColumn(lang, key, sections[key]);
  }
  return html;
}

function patchFile(filePath, lang) {
  const html = readFileSync(filePath, 'utf-8');
  const startMarker = '<div class="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">';
  const startIdx = html.indexOf(startMarker);
  if (startIdx === -1) { console.log('  SKIP (marker not found):', filePath); return; }
  // find matching closing </div> for this block by scanning balanced divs
  let depth = 0, i = startIdx, endIdx = -1;
  const re = /<div\b|<\/div>/g;
  re.lastIndex = startIdx;
  let m;
  while ((m = re.exec(html))) {
    if (m[0] === '<div' || m[0].startsWith('<div')) depth++;
    else depth--;
    if (depth === 0) { endIdx = m.index + m[0].length; break; }
  }
  if (endIdx === -1) { console.log('  SKIP (unbalanced):', filePath); return; }

  const inner = generateBlock(lang);
  const replacement = startMarker + '\n\n' + inner + '\n    </div>';
  const newHtml = html.slice(0, startIdx) + replacement + html.slice(endIdx);
  writeFileSync(filePath, newHtml, 'utf-8');
  console.log('  Regenerated:', path.relative(ROOT, filePath));
}

function main() {
  patchFile(path.join(ROOT, 'sitemap', 'index.html'), 'en');
  console.log('HTML sitemap regenerated.');
}

main();
