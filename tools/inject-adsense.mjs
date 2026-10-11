#!/usr/bin/env node
/*
  Breachfolio — inject-adsense.mjs
  Adds the AdSense Auto ads script (ca-pub-3561721281285694) to every page's
  <head>. Idempotent — skips files already patched, so it runs as
  `npm run build:adsense` inside `npm run build`: any page created outside
  the n8n templates (hand-written articles, new pagination pages) gets
  patched on the next build instead of silently shipping without ads.
  n8n pages are born patched via tools/templates/*.html.

  NOTE: same caveat as inject-consent.mjs — the GitHub Action runs this but
  its git-add list does NOT include article HTML (loop-guard), so a fix for
  a hand-written page only reaches production when someone runs
  `npm run build` locally and commits. It DOES reach production for the
  paginated listing pages, since those are in the bot's allowlist.
  Run `npm run build` locally whenever adding pages outside n8n.
*/
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MARKER = 'pagead2.googlesyndication.com';
const SNIPPET = '  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3561721281285694"\n     crossorigin="anonymous"></script>\n';

// AdSense publisher policies prohibit ads on error pages — never patch this one.
const EXCLUDE_FILES = ['404.html'];

function walk(dir, out) {
  for (const name of readdirSync(dir)) {
    if (['node_modules', '_pagefind', '.git', 'tools'].includes(name)) continue;
    const p = path.join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (name.endsWith('.html') && !EXCLUDE_FILES.includes(name)) out.push(p);
  }
  return out;
}

function main() {
  const files = walk(ROOT, []);
  let changed = 0;
  let skipped = 0;
  for (const file of files) {
    let html = readFileSync(file, 'utf-8');
    if (html.includes(MARKER)) { skipped++; continue; }
    const headCloses = (html.match(/<\/head>/g) || []).length;
    if (headCloses !== 1) {
      console.warn(`WARNING: expected exactly one </head>, found ${headCloses}, skipped: ${path.relative(ROOT, file)}`);
      continue;
    }
    html = html.replace('</head>', SNIPPET + '</head>');
    writeFileSync(file, html, 'utf-8');
    changed++;
  }
  console.log(`Patched: ${changed}, already patched (skipped): ${skipped}`);
}

main();
