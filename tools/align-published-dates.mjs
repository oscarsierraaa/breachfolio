/**
 * align-published-dates.mjs — make the visible publication date tell the truth.
 *
 * WHY THIS EXISTS
 * 60 articles displayed a publication date that did not match the datePublished
 * in their own JSON-LD, and the gap always ran the same way: the visible date
 * was earlier, by 5 to 123 days. The visible dates spread across March to July
 * 2026. The JSON-LD dates clustered on the two bulk-authoring days.
 *
 * Three independent checks say the visible dates are the invented ones:
 *   1. The domain breachfolio.com was registered on 2026-07-11 (Verisign RDAP).
 *      Sixty articles claimed to be published before the domain existed, some
 *      by nearly four months.
 *   2. No page anywhere on the site declares a datePublished before 2026-07-08.
 *      If the site really had March content, some article would say so.
 *   3. All 60 files were already present when the codebase entered git on
 *      2026-07-10, and not one has a git date matching its visible date.
 *
 * This is the same class of problem as the old methodology page and the
 * invented author organizations: the site asserting something it cannot
 * support. A displayed date that predates the domain is not a rounding error.
 *
 * WHAT IT CHANGES, PER ARTICLE
 *   1. The visible date text in the meta line, rewritten from the page's own
 *      JSON-LD datePublished, in the page's own language and existing format.
 *   2. The <time datetime="..."> attribute, where the page uses one.
 * Nothing else. It does not touch the JSON-LD, the prose, or the FAQ.
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 * It does not invent a spread. Collapsing 60 articles onto two dates makes the
 * bulk-authoring pattern more visible, and that is the correct outcome: the
 * pattern is real, and the previous spread was the thing hiding it.
 *
 * Usage:  node tools/align-published-dates.mjs [--apply]
 * Without --apply it reports what it would change and writes nothing.
 * Idempotent: re-running makes no further change.
 */
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();
const APPLY = process.argv.includes('--apply');

const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** Reads datePublished out of the page's own JSON-LD. */
function datePublishedOf(html) {
  const blocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const b of blocks) {
    let parsed;
    try {
      parsed = JSON.parse(b[1]);
    } catch {
      continue;
    }
    let found = null;
    const walk = (o) => {
      if (found || !o) return;
      if (Array.isArray(o)) return o.forEach(walk);
      if (typeof o === 'object') {
        if (o.datePublished) {
          found = String(o.datePublished).slice(0, 10);
          return;
        }
        if (o['@graph']) walk(o['@graph']);
      }
    };
    walk(parsed);
    if (found) return found;
  }
  return null;
}

/**
 * Renders an ISO date the way this page already renders dates, so the fix does
 * not also change the format. Day padding is copied from what was there.
 */
function renderLike(iso, sample, lang) {
  const [y, m, d] = iso.split('-');
  const monthIdx = parseInt(m, 10) - 1;
  const padded = /\b0\d\b/.test(sample);
  const day = padded ? d : String(parseInt(d, 10));
  if (lang === 'es') {
    const abbrev = /\b\d{1,2}\s+de\s+(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\.?[\s,]/i.test(sample) && !/\bde\s+\w{5,}/i.test(sample);
    const month = abbrev ? MONTHS_ES[monthIdx].slice(0, 3) : MONTHS_ES[monthIdx];
    // The site uses two separators before the year: "28 de marzo, 2026" and
    // "22 de abril de 2026". Keep whichever this page already uses.
    const sep = /\s+de\s+\d{4}\b/.test(sample) ? ` de ${y}` : `, ${y}`;
    return `${day} de ${month}${sep}`;
  }
  const abbrev = /\b(Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\.?\s+\d{1,2},/.test(sample) && !MONTHS_EN.some((x) => sample.includes(x));
  const month = abbrev ? MONTHS_EN[monthIdx].slice(0, 3) : MONTHS_EN[monthIdx];
  return `${month} ${day}, ${y}`;
}

const DATE_EN = /\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sept?|Oct|Nov|Dec)\.?\s+(\d{1,2}),\s*(\d{4})\b/;
// Two separators are in use before the year: "28 de marzo, 2026" and
// "22 de abril de 2026". Both must match or the page is silently skipped.
const DATE_ES = /\b(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\.?(?:,|\s+de)\s*(\d{4})\b/i;

function isoFromVisible(text, lang) {
  if (lang === 'es') {
    const m = text.match(DATE_ES);
    if (!m) return null;
    const idx = MONTHS_ES.findIndex((x) => x.startsWith(m[2].toLowerCase().slice(0, 3)));
    if (idx < 0) return null;
    return `${m[3]}-${String(idx + 1).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`;
  }
  const m = text.match(DATE_EN);
  if (!m) return null;
  const idx = MONTHS_EN.findIndex((x) => x.toLowerCase().startsWith(m[1].toLowerCase().replace(/\.$/, '').slice(0, 3)));
  if (idx < 0) return null;
  return `${m[3]}-${String(idx + 1).padStart(2, '0')}-${String(m[2]).padStart(2, '0')}`;
}

/**
 * The meta line is the run of markup right after the intro paragraph that
 * carries the date, the reading time and the byline. We only rewrite a date
 * that sits inside a <time> element or inside that meta line, never a date
 * that appears in the prose (article bodies cite real dates of real incidents,
 * and those must not move).
 */
function fixMetaDate(html, targetIso, lang) {
  let changed = false;
  let out = html;

  // Case 1: the page uses <time>. Rewrite the attribute and the label together.
  out = out.replace(/<time\b([^>]*)>([\s\S]*?)<\/time>/gi, (whole, attrs, label) => {
    const currentIso = isoFromVisible(label, lang);
    if (!currentIso) return whole;
    const newLabel = renderLike(targetIso, label, lang);
    const newAttrs = /datetime\s*=/.test(attrs)
      ? attrs.replace(/datetime\s*=\s*["'][^"']*["']/i, `datetime="${targetIso}"`)
      : `${attrs} datetime="${targetIso}"`;
    if (newAttrs === attrs && newLabel === label) return whole;
    changed = true;
    return `<time${newAttrs}>${label.replace(lang === 'es' ? DATE_ES : DATE_EN, newLabel)}</time>`;
  });
  if (changed) return { html: out, changed };

  // Case 2: no <time>. Rewrite the first date inside the meta line only, which
  // is identified by the reading-time marker that always sits beside it.
  // There are several font-mono blocks per page (badges, nav, tags). Take the
  // one that carries the reading-time marker, which only the meta line has.
  const candidates = [...out.matchAll(/<div[^>]*class="[^"]*font-mono[^"]*"[^>]*>[\s\S]{0,900}?<\/div>/gi)].map((m) => m[0]);
  const metaLine = candidates.find((c) => /min read|min de lectura/i.test(c));
  if (metaLine) {
    const re = lang === 'es' ? DATE_ES : DATE_EN;
    const m = metaLine.match(re);
    if (m) {
      const replaced = metaLine.replace(re, renderLike(targetIso, m[0], lang));
      if (replaced !== metaLine) {
        out = out.replace(metaLine, replaced);
        changed = true;
      }
    }
  }
  return { html: out, changed };
}

// ---------------------------------------------------------------------------

const targets = JSON.parse(readFileSync(join(ROOT, 'tools', 'date-mismatch-urls.json'), 'utf8'));

let fixed = 0;
let already = 0;
let skipped = [];

for (const rel of targets) {
  const file = join(ROOT, rel);
  let html;
  try {
    html = readFileSync(file, 'utf8');
  } catch {
    skipped.push([rel, 'fichero no encontrado']);
    continue;
  }

  const lang = rel.startsWith('es/') ? 'es' : 'en';
  const iso = datePublishedOf(html);
  if (!iso) {
    skipped.push([rel, 'sin datePublished en el JSON-LD']);
    continue;
  }

  const { html: out, changed } = fixMetaDate(html, iso, lang);
  if (!changed) {
    already++;
    continue;
  }

  // Safety net: the only thing allowed to move is the date. If the byte delta
  // is larger than a date's worth of characters, something else was touched.
  if (Math.abs(out.length - html.length) > 24) {
    skipped.push([rel, `delta sospechoso de ${out.length - html.length} bytes`]);
    continue;
  }

  if (APPLY) writeFileSync(file, out);
  fixed++;
  const before = (html.match(/<time[^>]*>([^<]*)</) || [])[1] || '?';
  console.log(`  ${APPLY ? 'corregido' : 'corregiria'}  ${rel}  ${before.trim()} -> ${renderLike(iso, before, lang)}`);
}

console.log('');
console.log(`objetivos: ${targets.length}`);
console.log(`${APPLY ? 'corregidos' : 'a corregir'}: ${fixed}`);
console.log(`ya correctos: ${already}`);
if (skipped.length) {
  console.log(`omitidos: ${skipped.length}`);
  skipped.forEach(([r, why]) => console.log(`  !! ${r} — ${why}`));
}
if (!APPLY) console.log('\n(simulacion: no se ha escrito nada. Ejecuta con --apply)');
