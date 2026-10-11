/**
 * align-card-dates.mjs — keep listing cards in step with the articles they link to.
 *
 * WHY THIS EXISTS
 * Listings render each article as a card carrying its own data-date and a visible
 * label. When align-published-dates.mjs corrected the articles, the cards kept the
 * old values, so a listing and the page it links to disagreed. A listing that
 * contradicts its own target is the same defect one level up, and it is the more
 * visible one: the section index is what a reader sees first.
 *
 * The site has two card shapes and four date formats, and missing any of them
 * means a silent no-op rather than an error, so both are handled explicitly:
 *
 *   <article data-date="...">        news hubs        "Jul 2, 2026" / "2 jul 2026"
 *   <a class="card" data-date="...">  section indexes  "May 18, 2026" / "18 may 2026"
 *
 * Rather than reformat the label, the rewrite substitutes the day, month and year
 * tokens in place and leaves every separator exactly as it was. That way a card
 * written as "18 may 2026" does not silently become "18 de mayo, 2026".
 *
 * Usage:  node tools/align-card-dates.mjs [--apply]
 * Idempotent: re-running makes no further change.
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, relative, dirname, normalize } from 'path';

const ROOT = process.cwd();
const APPLY = process.argv.includes('--apply');

const EN_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const EN_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ES_FULL = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const ES_ABBR = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const MONTH_RE = new RegExp(`\\b(${[...EN_FULL, ...EN_ABBR, ...ES_FULL, ...ES_ABBR].join('|')})\\b`, 'i');

/**
 * Which month is this token, and was it abbreviated?
 *
 * The language comes from the page, never from the token. "may" is a valid
 * month name in both languages, so guessing from the string alone rewrote
 * Spanish cards reading "18 may 2026" into "15 july 2026". Only the caller
 * knows whether the file lives under es/.
 */
function readMonth(token, lang) {
  const t = token.toLowerCase();
  const [full, abbr] = lang === 'es' ? [ES_FULL, ES_ABBR] : [EN_FULL, EN_ABBR];
  let i = full.findIndex((m) => m.toLowerCase() === t);
  if (i >= 0) return { index: i, abbr: false };
  i = abbr.findIndex((m) => m.toLowerCase() === t);
  if (i >= 0) return { index: i, abbr: true };
  return null;
}

/**
 * Rewrites a visible date label to a new ISO date, changing only the day, month
 * and year tokens. Separators, "de", commas and casing all survive untouched.
 * Returns null when the label cannot be parsed, so the caller can skip it loudly
 * instead of writing something wrong.
 */
function relabel(label, iso, lang) {
  const monthMatch = label.match(MONTH_RE);
  if (!monthMatch) return null;
  const style = readMonth(monthMatch[1], lang);
  if (!style) return null;

  const [y, m, d] = iso.split('-');
  const newIdx = parseInt(m, 10) - 1;
  const list = lang === 'es' ? (style.abbr ? ES_ABBR : ES_FULL) : style.abbr ? EN_ABBR : EN_FULL;
  let newMonth = list[newIdx];
  // Preserve capitalisation of the original token.
  if (/^[A-Z]/.test(monthMatch[1])) newMonth = newMonth.charAt(0).toUpperCase() + newMonth.slice(1);
  else newMonth = newMonth.toLowerCase();

  let out = label.replace(MONTH_RE, newMonth);

  // Day: the 1-2 digit number that is not the year.
  const dayMatch = out.match(/\b(\d{1,2})\b/);
  if (!dayMatch) return null;
  const newDay = /^0\d$/.test(dayMatch[1]) ? d : String(parseInt(d, 10));
  out = out.replace(/\b\d{1,2}\b/, newDay);

  const yearMatch = out.match(/\b(19|20)\d{2}\b/);
  if (!yearMatch) return null;
  out = out.replace(/\b(19|20)\d{2}\b/, y);

  return out;
}

const files = [];
(function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', '_pagefind'].includes(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name === 'index.html') files.push(p);
  }
})(ROOT);

const truth = new Map();
for (const f of files) {
  const rel = relative(ROOT, f).replace(/\\/g, '/').replace(/\/index\.html$/, '');
  const m = readFileSync(f, 'utf8').match(/"datePublished"\s*:\s*"(\d{4}-\d{2}-\d{2})/);
  if (m) truth.set(rel, m[1]);
}

/** Swaps the first date-looking label inside a card body. */
function fixBody(body, iso, lang) {
  let done = false;
  let out = body.replace(/(<time[^>]*>)([^<]+)(<\/time>)/i, (w, a, label, c) => {
    const n = relabel(label, iso, lang);
    if (n === null) return w;
    done = true;
    return `${a}${n}${c}`;
  });
  out = out.replace(/(<time\b[^>]*)datetime="\d{4}-\d{2}-\d{2}"/i, `$1datetime="${iso}"`);
  if (!done) {
    out = out.replace(/(<span>)([^<]*\b(?:19|20)\d{2})(<\/span>)/i, (w, a, label, c) => {
      const n = relabel(label, iso, lang);
      if (n === null) return w;
      done = true;
      return `${a}${n}${c}`;
    });
  }
  return { out, done };
}

let fixed = 0;
let already = 0;
const unparsed = [];

for (const f of files) {
  const rel = relative(ROOT, f).replace(/\\/g, '/');
  const dir = dirname(rel).replace(/\\/g, '/');
  let html = readFileSync(f, 'utf8');
  let touched = false;

  // Shape 1: news hub rows.
  html = html.replace(/<article\b([^>]*)data-date="(\d{4}-\d{2}-\d{2})"([^>]*)>([\s\S]*?)<\/article>/gi, (whole, pre, dataDate, post, body) => {
    const href = [...body.matchAll(/href="([^"#]+)"/g)].map((x) => x[1]).find((h) => !/^https?:|^mailto:/.test(h));
    if (!href) return whole;
    const target = normalize(join(dir, href)).replace(/\\/g, '/').replace(/\/$/, '');
    const real = truth.get(target);
    if (!real) return whole;
    if (real === dataDate) { already++; return whole; }
    const { out, done } = fixBody(body, real, rel.startsWith('es/') ? 'es' : 'en');
    if (!done) { unparsed.push(`${rel} -> ${target}`); return whole; }
    touched = true; fixed++;
    console.log(`  ${APPLY ? 'corregido' : 'corregiria'}  ${rel} -> ${target}  ${dataDate} -> ${real}`);
    return `<article${pre}data-date="${real}"${post}>${out}</article>`;
  });

  // Shape 2: section index cards.
  html = html.replace(/<a\b([^>]*href="([^"]+)"[^>]*class="card[^"]*"[^>]*)data-date="(\d{4}-\d{2}-\d{2})"([^>]*)>([\s\S]*?)<\/a>/gi, (whole, pre, href, dataDate, post, body) => {
    const target = normalize(join(dir, href)).replace(/\\/g, '/').replace(/\/$/, '');
    const real = truth.get(target);
    if (!real) return whole;
    if (real === dataDate) { already++; return whole; }
    const { out, done } = fixBody(body, real, rel.startsWith('es/') ? 'es' : 'en');
    if (!done) { unparsed.push(`${rel} -> ${target}`); return whole; }
    touched = true; fixed++;
    console.log(`  ${APPLY ? 'corregido' : 'corregiria'}  ${rel} -> ${target}  ${dataDate} -> ${real}`);
    return `<a${pre}data-date="${real}"${post}>${out}</a>`;
  });

  if (touched && APPLY) writeFileSync(f, html);
}

console.log('');
console.log(`${APPLY ? 'tarjetas corregidas' : 'tarjetas a corregir'}: ${fixed}`);
console.log(`tarjetas ya correctas: ${already}`);
if (unparsed.length) {
  console.log(`OJO, etiqueta no interpretable en ${unparsed.length} tarjetas (no tocadas):`);
  unparsed.forEach((u) => console.log('  !! ' + u));
}
if (!APPLY) console.log('\n(simulacion: no se ha escrito nada. Ejecuta con --apply)');
