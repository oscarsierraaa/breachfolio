#!/usr/bin/env node
/*
  Breachfolio — fix-es-i18n-leaks.mjs (one-off audit fix, not part of build)
  Confirmed in SEO audit (Fase 2): most Spanish pages carry the raw English
  fallback text inside [data-i18n] nav/footer elements instead of the
  Spanish text a handful of correctly-authored ES pages already use. Since
  assets/shared.js swaps this text at runtime via data-lang, the bug is
  invisible once JS runs — but it's wrong in the raw HTML (view-source,
  no-JS clients, and the first paint before shared.js executes).
  This is a one-time corrective pass, run manually, not part of `npm run build`.
*/
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ES_ROOT = path.join(ROOT, 'es');

function walk(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name === 'index.html') files.push(full);
  }
  return files;
}

// key -> [English text to find, Spanish text to replace it with]
// Only exact, whole-text-node matches are replaced — nothing partial, nothing guessed.
const REPLACEMENTS = {
  'nav.home':      ['Home', 'Inicio'],
  'nav.tools':     ['Compare', 'Comparativas'],
  'nav.ai':        ['AI Security', 'IA & Seguridad'],
  'nav.cyber':     ['Cybersecurity', 'Ciberseguridad'],
  'nav.news':      ['News', 'Noticias'],
  'nav.resources': ['Resources', 'Recursos'],
  'foot.learn':    ['Learn', 'Aprender'],
  'foot.explore':  ['Explore', 'Explorar'],
  'foot.legal':    ['Legal & info', 'Legal e información'],
  'foot.about':    ['About', 'Sobre nosotros'],
  'foot.method':   ['Methodology', 'Metodología'],
  'foot.disc':     ['Disclosures', 'Divulgaciones'],
  'foot.privacy':  ['Privacy', 'Privacidad'],
  'foot.terms':    ['Terms', 'Términos'],
  'foot.contact':  ['Contact', 'Contacto'],
  'foot.sitemap':  ['Site map', 'Mapa del sitio'],
  'foot.guides':   ['Guides', 'Guías'],
  'foot.tagline':  ['Independent education on AI, cybersecurity, and the tools practitioners actually use.', 'Educación independiente sobre IA, ciberseguridad y las herramientas que de verdad usan los profesionales.'],
  'foot.copy':     ['© 2026 Breachfolio. Independent. Transparent.', '© 2026 Breachfolio. Independiente. Transparente.'],
  'a11y.skip':     ['Skip to content', 'Saltar al contenido'],
};

const files = walk(ES_ROOT);
let totalReplacements = 0;
let filesChanged = 0;

for (const f of files) {
  let html = readFileSync(f, 'utf-8');
  let changed = false;
  for (const [key, [en, es]] of Object.entries(REPLACEMENTS)) {
    // Match data-i18n="key" ... >EN_TEXT< — text node immediately after the opening tag close
    const re = new RegExp(`(data-i18n="${key.replace('.', '\\.')}"[^>]*>)${en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(<)`, 'g');
    const before = html;
    html = html.replace(re, (m, p1, p2) => { totalReplacements++; return p1 + es + p2; });
    if (html !== before) changed = true;
  }
  if (changed) {
    writeFileSync(f, html, 'utf-8');
    filesChanged++;
  }
}

console.log(`Fixed ${totalReplacements} English-leak text nodes across ${filesChanged} of ${files.length} ES pages.`);
