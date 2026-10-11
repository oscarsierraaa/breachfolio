/**
 * downscale-oversized-images.mjs — stop shipping 1600px files for 600px slots.
 *
 * WHY THIS EXISTS
 * PageSpeed reported 327 KiB of avoidable image bytes on the homepage alone.
 * The card thumbnails are stored at 1500-1600px wide and displayed at roughly
 * 590-640 CSS px, so even a 2x screen never needs more than about 1280px.
 *
 * WHY 1280 AND NOT SMALLER
 * Several of these files double as og:image for social previews, where the
 * usual guidance is at least 1200px wide. 1280 is the smallest round number
 * that stays above that line, so the cards get lighter without degrading the
 * link previews. Files already at or below 1280 are left untouched.
 *
 * WHY THE FILENAMES DO NOT CHANGE
 * Rewriting src attributes across 273 pages to point at new variants is a much
 * larger change with a real chance of a broken image, and og:image URLs are
 * quoted in JSON-LD too. Re-encoding in place means every reference keeps
 * working and nothing in the HTML has to move.
 *
 * Usage:  node tools/downscale-oversized-images.mjs [--apply]
 * Idempotent: a second run finds nothing above the threshold.
 */
import { readdirSync, statSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import sharp from 'sharp';

const DIR = 'assets/img';
const MAX_WIDTH = 1280;
const QUALITY = 82;
const APPLY = process.argv.includes('--apply');

const files = readdirSync(DIR).filter((f) => /\.webp$/i.test(f));

let converted = 0;
let skipped = 0;
let before = 0;
let after = 0;
const failures = [];

for (const name of files) {
  const path = join(DIR, name);
  // Read into a buffer rather than letting sharp open the path itself. On
  // Windows sharp keeps the source handle open, and writing back to the same
  // path then fails with an opaque UNKNOWN error.
  const input = readFileSync(path);
  let meta;
  try {
    meta = await sharp(input).metadata();
  } catch (e) {
    failures.push([name, 'no se puede leer: ' + e.message.slice(0, 60)]);
    continue;
  }
  if (!meta.width || meta.width <= MAX_WIDTH) {
    skipped++;
    continue;
  }

  const sizeBefore = input.length;
  let buf;
  try {
    buf = await sharp(input).resize({ width: MAX_WIDTH, withoutEnlargement: true }).webp({ quality: QUALITY }).toBuffer();
  } catch (e) {
    failures.push([name, 'no se puede reescalar: ' + e.message.slice(0, 60)]);
    continue;
  }

  // Never write a file that came out bigger; re-encoding can do that on images
  // that were already well compressed.
  if (buf.length >= sizeBefore) {
    skipped++;
    continue;
  }

  before += sizeBefore;
  after += buf.length;
  converted++;
  if (APPLY) writeFileSync(path, buf);
  if (converted <= 8) {
    console.log(`  ${APPLY ? 'reescalada' : 'reescalaria'}  ${name}  ${meta.width}x${meta.height} -> ${MAX_WIDTH}px  ${Math.round(sizeBefore / 1024)}KB -> ${Math.round(buf.length / 1024)}KB`);
  }
}

console.log('');
console.log(`ficheros webp: ${files.length}`);
console.log(`${APPLY ? 'reescalados' : 'a reescalar'}: ${converted}`);
console.log(`sin cambios (ya <= ${MAX_WIDTH}px o no mejoraba): ${skipped}`);
console.log(`peso: ${Math.round(before / 1024)}KB -> ${Math.round(after / 1024)}KB  (ahorro ${Math.round((before - after) / 1024)}KB)`);
if (failures.length) {
  console.log(`fallos: ${failures.length}`);
  failures.forEach(([n, why]) => console.log(`  !! ${n} — ${why}`));
}
if (!APPLY) console.log('\n(simulacion: no se ha escrito nada. Ejecuta con --apply)');
