#!/usr/bin/env node
/*
  Breachfolio — bump-asset-version.mjs
  Every HTML page loads CSS/JS with a shared ?v=<version> cache-busting
  query string (long browser/CDN cache on these files, see .htaccess).
  That version was a hand-maintained literal date, so it was never bumped
  when the underlying files actually changed — returning visitors could
  keep serving stale, out-of-sync CSS/JS indefinitely after a deploy.

  This computes the version from the real content of the versioned assets
  (short sha256 hash) and rewrites every ?v=<old> to ?v=<new> across all
  HTML, so cache only busts — and always busts — when something actually
  changed. Run last in `npm run build`, after build:css.
*/
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { createHash } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const VERSIONED_ASSETS = [
  'assets/shared.css',
  'assets/tw.css',
  'assets/shared.js',
  'assets/page.js',
  'assets/analytics.js',
  'assets/theme-init.js',
  'assets/hero-fx.js',
  'assets/hack-terminal.js',
  'assets/news-ticker.js',
  'assets/dynamic-news.js',
];

function walk(dir, out) {
  for (const name of readdirSync(dir)) {
    if (['node_modules', '_pagefind', '.git', 'tools'].includes(name)) continue;
    const p = path.join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (name.endsWith('.html')) out.push(p);
  }
  return out;
}

function main() {
  const hash = createHash('sha256');
  for (const rel of VERSIONED_ASSETS) {
    const abs = path.join(ROOT, rel);
    try {
      hash.update(readFileSync(abs));
    } catch (e) {
      console.warn(`WARNING: versioned asset missing, skipped: ${rel}`);
    }
  }
  const version = hash.digest('hex').slice(0, 8);

  const files = walk(ROOT, []);
  let changed = 0;
  for (const file of files) {
    const html = readFileSync(file, 'utf-8');
    const updated = html.replace(/(assets\/[\w.-]+\?v=)[\w]+/g, `$1${version}`);
    if (updated !== html) {
      writeFileSync(file, updated, 'utf-8');
      changed++;
    }
  }

  console.log(`Asset version: ${version}`);
  console.log(`HTML files updated: ${changed}`);
}

main();
