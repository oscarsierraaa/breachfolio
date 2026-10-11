/**
 * strengthen-internal-links.mjs — give under-linked evergreen articles a way in.
 *
 * WHY THIS EXISTS
 * 74 articles had two or fewer internal links pointing at them, against a site
 * median of five. Several were pages worth ranking: the password manager
 * comparison and the Signal/WhatsApp/Telegram piece each had exactly one, which
 * was their section index. A page that only its own index links to gets almost
 * no internal signal.
 *
 * HOW A DONOR IS CHOSEN, AND WHY IT IS NOT "SAME SECTION"
 * Picking any sibling from the same section is easy and produces links nobody
 * wants to click. This instead requires that the donor's own body text already
 * mentions the target's subject: if an article about account security already
 * says "password manager" three times, a link to the password manager
 * comparison is one a reader would follow, and it is relevant because the page
 * made it relevant, not because a script decided they share a folder.
 *
 * Terms come from the target's slug and H1, stripped of stopwords in both
 * languages. Donors are ranked by how often they mention them. Cross-section
 * links are allowed for exactly this reason; cross-language ones are not.
 *
 * RULES IT WILL NOT BREAK
 *   - Never links a page to itself, and never adds a link that already exists.
 *   - Only donors that already have a "Related reading" block, so nothing new
 *     is invented on a page that never had one.
 *   - At most 2 added links per donor, so no page turns into a link farm.
 *   - News articles are skipped as targets: they are dated pieces reached from
 *     the news hub and the wire, and pointing evergreen pages at them ages
 *     those pages badly.
 *   - Drafts that 404 in production are excluded by name.
 *
 * Usage:  node tools/strengthen-internal-links.mjs [--apply] [--min N]
 * Idempotent: a second run finds every link already present and does nothing.
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, relative, dirname, posix } from 'path';

const ROOT = process.cwd();
const APPLY = process.argv.includes('--apply');
const MIN = Number((process.argv.find((a) => a.startsWith('--min=')) || '--min=3').split('=')[1]);
const MAX_PER_DONOR = 2;

// Publicadas el 2026-08-13: estaban escritas desde el 22-07 pero nunca llegaron
// al repo, así que daban 404 y había que excluirlas como objetivo. Ya no.
const DRAFTS = new Set();
const SKIP_TARGET_SECTIONS = new Set(['news', 'es/noticias']);

const STOP = new Set(
  ('the a an and or of for to in on with your you what how why is are be that this it its from as at by not de la el los las un una y o para por con que como cual es son ser esta este esto su sus del al en se lo si mas más qué cómo ' +
    'explained explicado explicada basics guide guia guía vs versus compared comparados comparativa what-is que-es')
    .split(/\s+/)
);

/**
 * Words that are rare enough to look distinctive but mean different things in
 * different articles here. Each one produced a link that read as nonsense on
 * review, so they are excluded by name rather than by another threshold:
 *
 *   publica / privada  "clave pública" against "publica un aviso", and
 *                      "mensajería privada" against "información privada"
 *   cero / producción  "desde cero" and "en producción" are filler in a title
 *   cyber / tech       too close to the site's own subject to separate anything
 *   among              English filler that survives the length filter
 */
const AMBIGUOUS = new Set([
  'publica', 'pública', 'privada', 'privado', 'cero', 'produccion', 'producción',
  'cyber', 'tech', 'among', 'catch',
  // Generic nouns that slipped under the rarity threshold and paired an article
  // on AI and cryptography with one on fake tech support calls.
  'computer', 'ordenador', 'computador',
]);

const files = [];
(function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', '_pagefind', 'tools', 'n8n', 'data'].includes(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name === 'index.html') files.push(p);
  }
})(ROOT);

const norm = (u) => u.replace(/\/index\.html$/, '').replace(/\/$/, '');
const rels = files.map((f) => relative(ROOT, f).replace(/\\/g, '/'));
const all = new Set(rels.map(norm));

const pages = [];
for (let i = 0; i < files.length; i++) {
  const rel = rels[i];
  const key = norm(rel);
  const html = readFileSync(files[i], 'utf8');
  const lang = rel.startsWith('es/') ? 'es' : 'en';
  const parts = key.split('/');
  const section = lang === 'es' ? parts.slice(0, 2).join('/') : parts[0];
  const h1 = ((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<header[\s\S]*?<\/header>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .toLowerCase();

  const out = new Set();
  const dir = posix.dirname(rel);
  for (const m of html.matchAll(/href="([^"#]+)"/g)) {
    const h = m[1];
    if (/^(https?:|mailto:|tel:)/.test(h)) continue;
    const t = norm(posix.normalize(posix.join(dir, h)));
    if (all.has(t) && t !== key) out.add(t);
  }

  pages.push({
    key,
    rel,
    file: files[i],
    lang,
    section,
    h1,
    title,
    body,
    out,
    isArticle: /"@type":\s*"(Article|NewsArticle|TechArticle|HowTo)"/.test(html),
    hasRelated: /Related reading|Lecturas relacionadas/.test(html),
  });
}

const byKey = new Map(pages.map((p) => [p.key, p]));
const inl = new Map(pages.map((p) => [p.key, 0]));
for (const p of pages) for (const t of p.out) inl.set(t, (inl.get(t) || 0) + 1);

/** Significant words describing a target, from its slug and its H1. */
function termsOf(p) {
  const slugWords = p.key.split('/').pop().split('-');
  const h1Words = p.h1.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, ' ').split(/[\s-]+/);
  return [...new Set([...slugWords, ...h1Words])].filter(
    (w) => w.length >= 4 && !STOP.has(w) && !AMBIGUOUS.has(w) && !/^\d+$/.test(w)
  );
}

/**
 * How many pages contain each term. A word that appears on most of the site
 * ("security", "which", "2026") says nothing about whether two pages belong
 * together; a word that appears on a handful does.
 *
 * The first version of this tool matched on shared words alone and proposed
 * linking the intelligence-disciplines article to the Signal comparison,
 * because "signal" appears in both — in one of them as "signals intelligence".
 * Requiring at least one rare term in the overlap is what stops that.
 */
const docFreq = new Map();
{
  const corpus = pages.filter((p) => p.isArticle);
  for (const p of corpus) {
    for (const w of new Set(p.body.match(/[\p{L}\p{N}]{4,}/gu) || [])) {
      docFreq.set(w, (docFreq.get(w) || 0) + 1);
    }
  }
  var CORPUS_SIZE = corpus.length;
}
const RARE_MAX = Math.max(3, Math.round(CORPUS_SIZE * 0.12));
const isDistinctive = (term) => (docFreq.get(term) || 0) <= RARE_MAX;

const targets = pages
  .filter((p) => p.isArticle && !DRAFTS.has(p.key) && !SKIP_TARGET_SECTIONS.has(p.section) && inl.get(p.key) < MIN)
  .sort((a, b) => inl.get(a.key) - inl.get(b.key));

const addedPerDonor = new Map();
const plan = [];

for (const t of targets) {
  const terms = termsOf(t);
  if (terms.length < 2) continue;
  let need = MIN - inl.get(t.key) - plan.filter((x) => x.target === t.key).length;
  if (need <= 0) continue;

  const scored = pages
    .filter(
      (d) =>
        d.isArticle &&
        d.hasRelated &&
        d.lang === t.lang &&
        d.key !== t.key &&
        !d.out.has(t.key) &&
        !DRAFTS.has(d.key) &&
        (addedPerDonor.get(d.key) || 0) < MAX_PER_DONOR
    )
    .map((d) => {
      let score = 0;
      let rareMentions = 0;
      const matched = [];
      const rare = [];
      for (const term of terms) {
        const n = (d.body.match(new RegExp('\\b' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
        if (!n) continue;
        matched.push(term);
        if (isDistinctive(term)) {
          rare.push(term);
          rareMentions += n;
          // Un termino raro que se repite es la senal fuerte; uno comun apenas suma.
          score += n * 4;
        } else {
          score += n * 0.25;
        }
      }
      return { d, score, matched, rare, rareMentions, distinct: matched.length };
    })
    // Dos terminos distintivos, o uno solo si el donante lo repite de verdad.
    // Con un unico termino raro y una mencion suelta salian pares como
    // "clave publica" contra "publica un aviso", que comparten la palabra y
    // nada mas.
    .filter((x) => (x.rare.length >= 2 || (x.rare.length === 1 && x.rareMentions >= 5)) && x.distinct >= 2 && x.score >= 16)
    .sort((a, b) => b.score - a.score || b.rare.length - a.rare.length);

  for (const cand of scored.slice(0, need)) {
    plan.push({ target: t.key, targetLabel: t.h1, donor: cand.d.key, score: Math.round(cand.score), matched: cand.rare.slice(0, 4), lang: t.lang });
    addedPerDonor.set(cand.d.key, (addedPerDonor.get(cand.d.key) || 0) + 1);
  }
}

console.log(`objetivo: que ningun articulo perenne baje de ${MIN} inlinks`);
console.log(`articulos por debajo: ${targets.length}`);
console.log(`enlaces propuestos: ${plan.length}, repartidos entre ${new Set(plan.map((p) => p.donor)).size} donantes`);
console.log('');

/**
 * Card label: the target's <title>, minus the brand suffix.
 *
 * The H1 was the obvious source and it was the wrong one. H1s here carry a
 * subtitle after a dash and often run long, so cutting them to fit produced
 * labels like "Bitwarden vs 1Password vs KeePassXC: choosing" and
 * "Is that job offer real? How to spot fake" — each one stopping mid-phrase.
 * Titles are already written to stand alone inside 65 characters, so they
 * survive the trip into a card intact. Only when one is still too wide does
 * this fall back to the part before the colon, which is a complete phrase too.
 */
function labelFor(p) {
  let s = (p.title || p.h1 || p.key.split('/').pop().replace(/-/g, ' ')).replace(/\s*\|\s*Breachfolio\s*$/, '').trim();
  if (s.length > 58) {
    const head = s.split(/\s*[:?]\s*/)[0];
    if (head.length >= 12) s = head;
  }
  return s.replace(/[.:]$/, '').replace(/&(?!amp;|#)/g, '&amp;');
}

const byDonor = new Map();
for (const item of plan) {
  if (!byDonor.has(item.donor)) byDonor.set(item.donor, []);
  byDonor.get(item.donor).push(item);
}

let written = 0;
let failed = 0;
for (const [donorKey, items] of byDonor) {
  const donor = byKey.get(donorKey);
  let html = readFileSync(donor.file, 'utf8');
  const donorDir = posix.dirname(donor.rel);

  for (const item of items) {
    const target = byKey.get(item.target);
    let href = posix.relative(donorDir, item.target) + '/';
    if (!href.startsWith('.')) href = './' + href;
    const card = `\n          <a href="${href}" class="group flex items-center justify-between px-5 py-4 rounded-card border border-border bg-surface hover:border-accent/50 transition-colors">\n            <span class="text-[14px] text-foreground">${labelFor(target)}</span>\n            <span class="text-accent" aria-hidden="true">→</span>\n          </a>`;

    // Insertar como ultima tarjeta de la rejilla de relacionados.
    const gridStart = html.search(/(Related reading|Lecturas relacionadas)<\/div>\s*<div class="grid sm:grid-cols-2 gap-4">/);
    if (gridStart < 0) {
      failed++;
      console.log(`  !! no encuentro la rejilla en ${donor.rel}`);
      continue;
    }
    const gridOpen = html.indexOf('<div class="grid sm:grid-cols-2 gap-4">', gridStart);
    // Cierre de la rejilla: el </div> que sigue al ultimo </a> del bloque.
    const lastA = html.lastIndexOf('</a>', html.indexOf('</div>', html.lastIndexOf('</a>', gridOpen + 4000)));
    const insertAt = html.indexOf('</a>', gridOpen) >= 0 ? findGridEnd(html, gridOpen) : -1;
    if (insertAt < 0) {
      failed++;
      console.log(`  !! no encuentro el cierre de la rejilla en ${donor.rel}`);
      continue;
    }
    html = html.slice(0, insertAt) + card + html.slice(insertAt);
    written++;
    console.log(`  ${APPLY ? 'anadido' : 'anadiria'}  ${donor.rel.replace('/index.html', '')}  ->  ${item.target}   (terminos: ${item.matched.join(', ')})`);
  }

  if (APPLY) writeFileSync(donor.file, html);
}

/** Devuelve el indice justo antes del </div> que cierra la rejilla. */
function findGridEnd(html, gridOpen) {
  let i = gridOpen;
  let depth = 0;
  const re = /<div\b|<\/div>/g;
  re.lastIndex = gridOpen;
  let m;
  while ((m = re.exec(html))) {
    if (m[0] === '</div>') {
      depth--;
      if (depth === 0) return m.index;
    } else depth++;
    if (m.index - gridOpen > 8000) break;
  }
  return -1;
}

console.log('');
console.log(`${APPLY ? 'enlaces anadidos' : 'enlaces a anadir'}: ${written}`);
if (failed) console.log(`fallos: ${failed}`);
if (!APPLY) console.log('\n(simulacion: no se ha escrito nada. Ejecuta con --apply)');
