/**
 * shorten-long-titles.mjs — get titles under the length Google will show.
 *
 * WHY THIS EXISTS
 * 58 pages had a <title> longer than 65 characters, topping out at 97. Past
 * roughly that point Google truncates, and the tail of the title stops doing
 * any work. Spanish suffers most, because the language runs longer than
 * English and then pays for the same " | Breachfolio" suffix on top.
 *
 * WHAT IT DOES, AND WHY ONLY THIS
 * It drops the brand suffix, and only on pages that are actually over the
 * limit. That alone brings 37 of the 58 back under 65 without touching a word
 * of the wording a human wrote, which is the part that is risky to automate.
 * Titles that are still too long afterwards are reported, not guessed at:
 * shortening those is an editorial decision, not a string operation.
 *
 * og:title and twitter:title keep the brand. They are read by social previews,
 * not by a SERP with a pixel budget, and the brand earns its place there.
 *
 * Usage:  node tools/shorten-long-titles.mjs [--apply]
 * Idempotent: re-running makes no further change.
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, relative } from 'path';

const ROOT = process.cwd();
const APPLY = process.argv.includes('--apply');
const LIMIT = 65;
const SUFFIX = /\s*\|\s*Breachfolio\s*$/;

const files = [];
(function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', '_pagefind'].includes(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name === 'index.html') files.push(p);
  }
})(ROOT);

let shortened = 0;
let fine = 0;
const stillLong = [];

for (const f of files) {
  const rel = relative(ROOT, f).replace(/\\/g, '/');
  const html = readFileSync(f, 'utf8');
  const m = html.match(/<title>([^<]*)<\/title>/);
  if (!m) continue;

  const title = m[1];
  if (title.length <= LIMIT) {
    fine++;
    continue;
  }
  if (!SUFFIX.test(title)) {
    stillLong.push([rel, title.length, title]);
    continue;
  }

  const next = title.replace(SUFFIX, '');
  if (next.length > LIMIT) {
    stillLong.push([rel, next.length, next]);
    continue;
  }

  if (APPLY) writeFileSync(f, html.replace(`<title>${title}</title>`, `<title>${next}</title>`));
  shortened++;
  if (shortened <= 6) console.log(`  ${APPLY ? 'acortado' : 'acortaria'}  ${String(title.length).padStart(3)} -> ${String(next.length).padStart(3)}  ${rel}`);
}

console.log('');
console.log(`titles ya dentro de ${LIMIT}: ${fine}`);
console.log(`${APPLY ? 'acortados' : 'a acortar'} quitando la marca: ${shortened}`);
console.log(`siguen por encima de ${LIMIT}, hay que reescribirlos a mano: ${stillLong.length}`);
stillLong.sort((a, b) => b[1] - a[1]).forEach(([rel, len, t]) => console.log(`  ${String(len).padStart(3)}  ${rel}\n       ${t}`));
if (!APPLY) console.log('\n(simulacion: no se ha escrito nada. Ejecuta con --apply)');
