/**
 * fix-news-card-bylines.mjs — the news hubs were still signed by a desk that
 * does not exist.
 *
 * WHY THIS EXISTS
 * On 2026-07-30 the site stopped attributing articles to invented
 * organizations. 215 articles moved from "Breachfolio Research" and
 * "Breachfolio Editorial desk" to two real Person nodes, because there is no
 * research division and no editorial desk: there are two people, and claiming
 * otherwise on a site that gives fraud advice is the same failure as the
 * methodology page that described a lab nobody owns.
 *
 * tools/real-authorship.mjs fixed the article pages: the JSON-LD, the visible
 * meta line and the author box. It never touched the news hubs, where each card
 * carries its own small byline block. So /news/ and /es/noticias/ kept showing
 * "Breachfolio / Editorial desk" and "Breachfolio / Redacción" on 15 cards
 * each, live, for two weeks after the fix.
 *
 * This is the trap written down in CONTEXTO-SESION §6: the signatures had four
 * variants rather than one, and the way it got solved the first time was by
 * enumerating every signature on the site at once instead of chasing the
 * obvious pattern. A fifth location had been missed. Enumerate first.
 *
 * The replacement puts the two real people on the top line and the site on the
 * second, which is what the card layout is shaped for and what the article
 * pages already say.
 *
 * Usage:  node tools/fix-news-card-bylines.mjs [--apply]
 * Idempotent: re-running makes no further change.
 */
import { readFileSync, writeFileSync } from 'fs';

const APPLY = process.argv.includes('--apply');

const FILES = [
  {
    path: 'news/index.html',
    from: '<div class="leading-tight"><div class="text-[13px] text-foreground font-medium">Breachfolio</div><div class="text-[11px] text-muted">Editorial desk</div></div>',
    to: '<div class="leading-tight"><div class="text-[13px] text-foreground font-medium">Daniel A. &amp; Óscar S.</div><div class="text-[11px] text-muted">Breachfolio</div></div>',
  },
  {
    path: 'es/noticias/index.html',
    from: '<div class="leading-tight"><div class="text-[13px] text-foreground font-medium">Breachfolio</div><div class="text-[11px] text-muted">Redacción</div></div>',
    to: '<div class="leading-tight"><div class="text-[13px] text-foreground font-medium">Daniel A. y Óscar S.</div><div class="text-[11px] text-muted">Breachfolio</div></div>',
  },
];

let total = 0;
for (const f of FILES) {
  const html = readFileSync(f.path, 'utf8');
  const n = html.split(f.from).length - 1;
  if (!n) {
    console.log(`  ya correcto (0 coincidencias): ${f.path}`);
    continue;
  }
  if (APPLY) writeFileSync(f.path, html.split(f.from).join(f.to));
  total += n;
  console.log(`  ${APPLY ? 'corregidas' : 'a corregir'} ${n} firmas en ${f.path}`);
}

console.log('');
console.log(`firmas ${APPLY ? 'corregidas' : 'a corregir'}: ${total}`);

// Red de seguridad: enumerar cualquier resto de las cuatro variantes inventadas
// en todo el HTML servido, que es como se resolvió esto la primera vez.
const LEFTOVERS = ['Editorial desk', 'Breachfolio Research', 'Investigación Breachfolio', 'Breachfolio · Redacción'];
console.log('');
console.log('resto de variantes inventadas en el HTML (debe ser 0 tras aplicar):');
for (const term of LEFTOVERS) {
  let count = 0;
  for (const f of FILES) {
    const html = readFileSync(f.path, 'utf8');
    count += html.split(term).length - 1;
  }
  console.log(`  ${term.padEnd(28)} ${count}`);
}
if (!APPLY) console.log('\n(simulacion: no se ha escrito nada. Ejecuta con --apply)');
