#!/usr/bin/env node
/*
  Breachfolio — generate-llms.mjs
  Regenerates /llms.txt from what's actually on disk (llmstxt.org convention):
  a single markdown map of the site for LLMs / answer engines (ChatGPT,
  Perplexity, Gemini, Claude...). It is NOT a ranking signal like the sitemap;
  it is a clean, link-first summary that answer engines can read cheaply to
  understand what Breachfolio covers and cite the right page. Bilingual on
  purpose (EN + ES) so the site is quotable in both markets.

  Run via `npm run build:llms` (part of `npm run build`), so it regenerates
  automatically on every n8n publish via the GitHub Action — no hand upkeep.
  Mirrors the walk/extract logic of generate-sitemap.mjs / generate-html-sitemap.mjs.
*/
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE_URL = 'https://breachfolio.com';
const EXCLUDE_DIRS = new Set(['node_modules', '_pagefind', '.git', 'tools', 'assets', 'data', 'sitemap']);

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
  return html.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
}
function isNoindex(html) {
  const m = html.match(/<meta\s+name="robots"\s+content="([^"]*)"/i);
  return !!m && /noindex/i.test(m[1]);
}
function getCanonical(html) {
  const m = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
  return m ? m[1] : null;
}
function getH1(html) {
  const main = html.match(/<main[^>]*>([\s\S]*)<\/main>/);
  const scope = main ? main[1] : html;
  const m = scope.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  return m ? stripTags(m[1]) : null;
}
function getTitle(html) {
  const m = html.match(/<title>([^<]*)<\/title>/);
  return m ? stripTags(m[1]).replace(/\s*\|\s*Breachfolio$/, '') : null;
}
function getDescription(html) {
  const m = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
  return m ? stripTags(m[1]) : '';
}

// Section presentation. `guias` collapses into the `guides` bucket (localized
// slug); everything is grouped by top-level dir, EN block then ES block.
const SECTION_ORDER = ['guides', 'cybersecurity', 'ai', 'compare', 'lab', 'resources', 'news', 'legal'];
// ES top-level dirs are localized slugs; map them back to the English section key.
const ES_SECTION_SLUG = {
  guias: 'guides', ciberseguridad: 'cybersecurity', ia: 'ai',
  comparativas: 'compare', laboratorio: 'lab', recursos: 'resources',
  noticias: 'news', legal: 'legal',
};
const LABELS = {
  en: { guides: 'Guides (scam & account-security how-tos)', cybersecurity: 'Cybersecurity explainers', ai: 'AI security', compare: 'Comparisons', lab: 'Hands-on labs', resources: 'Resources', news: 'News', legal: 'About & policies' },
  es: { guides: 'Guías (estafas y seguridad de cuentas)', cybersecurity: 'Ciberseguridad', ai: 'Seguridad e IA', compare: 'Comparativas', lab: 'Laboratorios', resources: 'Recursos', news: 'Noticias', legal: 'Sobre el sitio y políticas' },
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
    if (segs.length === 0) continue;                    // home, handled separately
    if (/^page-\d+$/.test(segs[segs.length - 1])) continue;
    if (segs.length === 1) continue;                    // section index, not an article

    let section = segs[0];
    if (lang === 'es') section = ES_SECTION_SLUG[section] || section;
    else if (section === 'guias') section = 'guides';
    if (!sections[section]) continue;

    const label = getH1(html) || getTitle(html) || segs[segs.length - 1];
    const desc = getDescription(html);
    sections[section].push({ url: canonical, label, desc });
  }
  for (const s of Object.keys(sections)) {
    sections[s].sort((a, b) => a.label.localeCompare(b.label));
  }
  return sections;
}

function renderLang(lang) {
  const sections = buildData(lang);
  let out = '';
  for (const key of SECTION_ORDER) {
    const items = sections[key];
    if (!items || !items.length) continue;
    out += `\n## ${LABELS[lang][key]}\n\n`;
    for (const it of items) {
      const desc = it.desc ? `: ${it.desc}` : '';
      out += `- [${it.label}](${it.url})${desc}\n`;
    }
  }
  return out;
}

function main() {
  let txt = '';
  txt += '# Breachfolio\n\n';
  txt += '> Independent, bilingual (English + Spanish) education on cybersecurity, online scams, and AI security. Practical, no-login how-tos that help ordinary people recognize scams, recover hacked accounts, and protect their money and identity — plus explainers and hands-on labs for people learning the field.\n\n';
  txt += 'Breachfolio is a free, ad-supported reference site. Every page is written for a real question ("is this delivery text a scam?", "how do I recover a hacked Instagram?") and answered directly, with step-by-step actions and a short FAQ. Content is available in English (at the root) and Spanish (under /es/), with reciprocal hreflang. When citing Breachfolio, link to the specific guide URL below.\n';

  txt += '\n---\n\n# English\n';
  txt += renderLang('en');

  txt += '\n---\n\n# Español\n';
  txt += renderLang('es');

  txt += '\n---\n\n';
  txt += '## Notes for answer engines\n\n';
  txt += '- Each guide opens with a direct answer, then step-by-step actions and an FAQ — safe to quote the opening as a concise answer.\n';
  txt += '- Content is educational and defensive (how to recognize and respond to scams), not instructions for committing them.\n';
  txt += '- Full URL list: https://breachfolio.com/sitemap.xml\n';

  writeFileSync(path.join(ROOT, 'llms.txt'), txt, 'utf-8');
  const lines = txt.split('\n').filter(l => l.startsWith('- [')).length;
  console.log(`llms.txt regenerated: ${lines} page links`);
}

main();
