/**
 * responsive-card-images.mjs — stop sending 1280px files to 306px card slots.
 *
 * WHY THIS EXISTS
 * After downscale-oversized-images.mjs took every source to 1280px, PageSpeed
 * still reported 130 KiB of avoidable image bytes, and the offenders were all
 * card thumbnails. The reason is in the CSS: a news rail card is
 * `flex: 0 0 clamp(260px, 80vw, 306px)`, so its image never renders wider than
 * 306 CSS px. Even a 3x screen needs about 900px, and most need 612.
 *
 * These files cannot simply be made smaller, because several double as
 * og:image, where the guidance is at least 1200px wide. A social scraper and a
 * card slot want different sizes of the same picture, which is exactly what
 * srcset is for.
 *
 * WHAT IT DOES
 *   1. Finds every <img> in the two card contexts, .sf-thumb (section grids)
 *      and .sf-news-card-media (news rails), and collects their sources.
 *   2. Writes -640 and -960 variants beside each source, only where the source
 *      is actually wider.
 *   3. Adds srcset and a sizes attribute derived from the real layout, not a
 *      guess: the grid columns for section cards, the clamp() for rail cards.
 *
 * The sizes values matter more than the variants. Get them wrong and the
 * browser picks a candidate that is too small and the card looks soft, so both
 * are written from the CSS that is actually in shared.css and the Tailwind grid
 * classes on the containers.
 *
 * Usage:  node tools/responsive-card-images.mjs [--apply]
 * Idempotent: images that already carry a srcset are left alone.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, relative, basename } from 'path';
import sharp from 'sharp';

const ROOT = process.cwd();
const APPLY = process.argv.includes('--apply');
const IMG_DIR = join(ROOT, 'assets', 'img');
const WIDTHS = [640, 960];
const QUALITY = 82;

// Section grid: grid-cols-1 / md:grid-cols-2 / lg:grid-cols-3 inside the
// max-w-container with px-6 md:px-12 padding.
const SIZES_THUMB = '(min-width: 1024px) 400px, (min-width: 768px) 45vw, 92vw';
// Rail card: flex: 0 0 clamp(260px, 80vw, 306px). 80vw reaches 306 at 382px.
const SIZES_RAIL = '(max-width: 382px) 80vw, 306px';

const files = [];
(function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', '_pagefind'].includes(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name === 'index.html') files.push(p);
  }
})(ROOT);

/** Card <img> tags, with the context that decides their sizes attribute. */
function cardImages(html) {
  const out = [];
  for (const ctx of [
    { re: /<div[^>]*class="[^"]*sf-thumb[^"]*"[^>]*>([\s\S]{0,900}?)<\/div>/g, sizes: SIZES_THUMB },
    { re: /<div[^>]*class="sf-news-card-media"[^>]*>([\s\S]{0,900}?)<\/div>/g, sizes: SIZES_RAIL },
  ]) {
    for (const block of html.matchAll(ctx.re)) {
      for (const tag of block[1].matchAll(/<img\b[^>]*>/g)) out.push({ tag: tag[0], sizes: ctx.sizes });
    }
  }
  return out;
}

// 1. Which sources are used in cards.
const needed = new Set();
for (const f of files) {
  for (const { tag } of cardImages(readFileSync(f, 'utf8'))) {
    const src = (tag.match(/src="([^"]+)"/) || [])[1];
    if (!src) continue;
    const name = basename(src.split('?')[0]);
    if (/\.webp$/i.test(name) && !/-(\d{3,4})\.webp$/.test(name)) needed.add(name);
  }
}
// The rail is also filled at runtime from data/*.json, and dynamic-news.js
// builds variant filenames by string substitution. Any image that feed can
// show therefore needs its variants to exist, not just the ones that happened
// to be prerendered into the page under the current limit.
for (const dataFile of ['data/news.json', 'data/latest.json']) {
  const p = join(ROOT, dataFile);
  if (!existsSync(p)) continue;
  for (const item of JSON.parse(readFileSync(p, 'utf8')).items || []) {
    if (!item.image) continue;
    const name = basename(String(item.image).split('?')[0]);
    if (/\.webp$/i.test(name) && !/-(\d{3,4})\.webp$/.test(name)) needed.add(name);
  }
}

console.log(`imagenes usadas en tarjetas o en el feed: ${needed.size}`);

// 2. Generate the variants.
let made = 0;
let bytes = 0;
for (const name of needed) {
  const srcPath = join(IMG_DIR, name);
  if (!existsSync(srcPath)) continue;
  const input = readFileSync(srcPath);
  const meta = await sharp(input).metadata();
  for (const w of WIDTHS) {
    if (!meta.width || meta.width <= w) continue;
    const outName = name.replace(/\.webp$/i, `-${w}.webp`);
    const outPath = join(IMG_DIR, outName);
    if (existsSync(outPath)) continue;
    const buf = await sharp(input).resize({ width: w, withoutEnlargement: true }).webp({ quality: QUALITY }).toBuffer();
    if (APPLY) writeFileSync(outPath, buf);
    made++;
    bytes += buf.length;
  }
}
console.log(`variantes ${APPLY ? 'creadas' : 'a crear'}: ${made} (${Math.round(bytes / 1024)}KB en total)`);

// 3. Add srcset/sizes to the card tags.
let pages = 0;
let tags = 0;
for (const f of files) {
  const rel = relative(ROOT, f).replace(/\\/g, '/');
  let html = readFileSync(f, 'utf8');
  let changed = false;

  for (const { tag, sizes } of cardImages(html)) {
    if (/\ssrcset=/.test(tag)) continue;
    const src = (tag.match(/src="([^"]+)"/) || [])[1];
    if (!src) continue;
    const name = basename(src.split('?')[0]);
    if (!/\.webp$/i.test(name) || /-(\d{3,4})\.webp$/.test(name)) continue;

    const srcPath = join(IMG_DIR, name);
    if (!existsSync(srcPath)) continue;
    const meta = await sharp(readFileSync(srcPath)).metadata();
    const candidates = WIDTHS.filter((w) => meta.width > w).map((w) => `${src.replace(/\.webp$/i, `-${w}.webp`)} ${w}w`);
    if (!candidates.length) continue;
    candidates.push(`${src} ${meta.width}w`);

    const next = tag.replace(/<img\b/, `<img srcset="${candidates.join(', ')}" sizes="${sizes}"`);
    html = html.split(tag).join(next);
    changed = true;
    tags++;
  }

  if (changed) {
    pages++;
    if (APPLY) writeFileSync(f, html);
  }
}

console.log(`paginas ${APPLY ? 'actualizadas' : 'a actualizar'}: ${pages} | etiquetas <img> con srcset: ${tags}`);
if (!APPLY) console.log('\n(simulacion: no se ha escrito nada. Ejecuta con --apply)');
