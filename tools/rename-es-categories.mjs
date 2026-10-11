#!/usr/bin/env node
/*
  Breachfolio — rename-es-categories.mjs (one-off migration, not part of build)
  Translates the remaining English category slugs used under /es/ into
  Spanish, matching the convention /es/guias/ already used:
    cybersecurity -> ciberseguridad, ai -> ia, lab -> laboratorio,
    compare -> comparativas, resources -> recursos, news -> noticias.

  Two passes, both using slash-bounded segment matching so "ai" never
  matches inside "agentic-ai-security-basics" etc:
    1. Any file under es/: rewrite relative/absolute path segments
       (nav, footer, breadcrumbs, canonical, JSON-LD, sitemap-html links).
    2. Any file OUTSIDE es/ (the EN pages): rewrite ONLY the hreflang="es"
       href="..." attribute value — the EN page's own English nav/section
       links must not be touched.
  Directory renames on disk happen separately (see the shell step in the
  session) — this script only rewrites text references.
*/
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ES_ROOT = path.join(ROOT, 'es');
const SKIP_DIRS = new Set(['node_modules', '.git', '_pagefind', 'assets', 'tools', 'data']);

const SEGMENT_MAP = {
  cybersecurity: 'ciberseguridad',
  ai: 'ia',
  lab: 'laboratorio',
  compare: 'comparativas',
  resources: 'recursos',
  news: 'noticias',
};

function walk(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name === 'index.html') files.push(full);
  }
  return files;
}

function replaceSegments(text) {
  let out = text;
  for (const [en, es] of Object.entries(SEGMENT_MAP)) {
    const re = new RegExp(`/${en}/`, 'g');
    out = out.replace(re, `/${es}/`);
  }
  return out;
}

const allFiles = walk(ROOT);
let esFilesChanged = 0;
let enFilesChanged = 0;

for (const f of allFiles) {
  const isEs = f.startsWith(ES_ROOT + path.sep);
  let html = readFileSync(f, 'utf-8');
  const before = html;

  if (isEs) {
    html = replaceSegments(html);
  } else {
    // Only touch hreflang="es" href="..." values.
    html = html.replace(/(hreflang="es"\s+href=")([^"]+)(")/g, (m, p1, url, p3) => p1 + replaceSegments(url) + p3);
  }

  if (html !== before) {
    writeFileSync(f, html, 'utf-8');
    if (isEs) esFilesChanged++; else enFilesChanged++;
  }
}

console.log(`ES files rewritten: ${esFilesChanged}`);
console.log(`EN files rewritten (hreflang only): ${enFilesChanged}`);
