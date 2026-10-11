/**
 * prioritize-hero-image.mjs — tell the browser the hero image is the LCP element.
 *
 * WHY THIS EXISTS
 * PageSpeed measured a mobile LCP of 5.1 s on the homepage and 3.3 s on an
 * article, against a 2.5 s threshold, and named the hero <img> as the LCP
 * element every time. The image is already loading="eager", but eager only
 * means "do not defer": it still queues behind the stylesheets and scripts in
 * <head>. fetchpriority="high" moves it to the front of that queue, which is
 * the single cheapest thing that can be done for this metric.
 *
 * It only touches images that are already marked eager AND carry the
 * data-pagefind-meta="image[src]" attribute, which on this site is exactly the
 * one full-bleed hero per page. Lazy images and in-body figures are left alone,
 * because raising their priority would compete with the very element we are
 * trying to speed up.
 *
 * Usage:  node tools/prioritize-hero-image.mjs [--apply]
 * Idempotent: re-running makes no further change.
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, relative } from 'path';

const ROOT = process.cwd();
const APPLY = process.argv.includes('--apply');

const files = [];
(function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', '_pagefind'].includes(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name === 'index.html') files.push(p);
  }
})(ROOT);

let touched = 0;
let already = 0;
let noHero = 0;

for (const f of files) {
  const rel = relative(ROOT, f).replace(/\\/g, '/');
  const html = readFileSync(f, 'utf8');
  let changed = false;

  const out = html.replace(/<img\b[^>]*>/gi, (tag) => {
    if (!/data-pagefind-meta="image\[src\]"/.test(tag)) return tag;
    if (!/loading="eager"/.test(tag)) return tag;
    if (/fetchpriority=/.test(tag)) {
      already++;
      return tag;
    }
    changed = true;
    return tag.replace(/\sloading="eager"/, ' loading="eager" fetchpriority="high"');
  });

  if (!changed) {
    if (!/data-pagefind-meta="image\[src\]"/.test(html)) noHero++;
    continue;
  }
  if (APPLY) writeFileSync(f, out);
  touched++;
  if (touched <= 5) console.log(`  ${APPLY ? 'marcada' : 'marcaria'}  ${rel}`);
}

console.log('');
console.log(`paginas ${APPLY ? 'actualizadas' : 'a actualizar'}: ${touched}`);
console.log(`ya tenian fetchpriority: ${already}`);
console.log(`sin hero marcada: ${noHero}`);
if (!APPLY) console.log('\n(simulacion: no se ha escrito nada. Ejecuta con --apply)');
