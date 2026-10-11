/**
 * real-authorship.mjs — replace invented article authors with the two real people.
 *
 * WHY THIS EXISTS
 * Every article declared its author as an Organization called "Breachfolio
 * Research" (185) or "Breachfolio Editorial desk" (30). Neither exists. There
 * is no research division and no editorial desk; there are two people. That is
 * the same class of problem the old legal/methodology page had (claiming a test
 * lab that does not exist), and it is a direct E-E-A-T liability on a site that
 * publishes fraud and security advice.
 *
 * WHAT IT CHANGES, PER ARTICLE
 *   1. JSON-LD  "author"  ->  two Person nodes (Daniel A., Óscar S.) linked to
 *      the About page in the page's own language.
 *   2. The visible meta line gains a byline span, matching whichever of the two
 *      site layouts the page uses.
 *   3. An author box is appended to the end of the prose container.
 *
 * WHAT IT DELIBERATELY DOES NOT CLAIM
 * No "reviewed by <name>", no "verified by", no credentials, no per-article
 * attribution to one specific person. We do not know which of the two approved
 * which of 215 articles, and asserting a named technical review would be
 * inventing exactly the kind of credential that got the methodology page
 * rewritten. The box says what is true and what the methodology page already
 * says, word for word compatible: drafted with AI assistance, reviewed by a
 * person before publication, researched from documentation rather than lab work.
 *
 * Idempotent: re-running makes no further change.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative, dirname } from 'path';

const DRY = process.argv.includes('--dry');
const SKIP = new Set(['node_modules', '.git', '_pagefind', 'assets', 'tools']);

const files = [];
(function walk(d) {
  for (const e of readdirSync(d)) {
    if (SKIP.has(e)) continue;
    const p = join(d, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (e === 'index.html') files.push(p);
  }
})('.');

/** Relative href from an article's directory to a site path, POSIX style. */
const hrefTo = (file, target) =>
  (relative(dirname(file), target).split(/[\\/]/).join('/') || '.') + '/';

/** Walk forward from the opening tag at `open` to its matching </div>. */
function closeOfDiv(html, open) {
  const re = /<(\/?)div\b/g;
  re.lastIndex = open + 4;
  let depth = 1, m;
  while ((m = re.exec(html))) {
    depth += m[1] ? -1 : 1;
    if (depth === 0) return m.index;
  }
  return -1;
}

const COPY = {
  en: {
    byline: 'Daniel A. &amp; Óscar S.',
    eyebrow: 'Who writes this',
    lead: 'Daniel A. and Óscar S.',
    body:
      'run Breachfolio, a small independent site about security and AI. This article was drafted with AI assistance and reviewed by a person before it went live. We write from documentation, vendor sources and published research rather than from original lab benchmarks, and we link a source in the sentence that relies on it.',
    meth: 'How we work',
    about: 'About us',
    methPath: 'legal/methodology',
    aboutPath: 'legal/about',
  },
  es: {
    byline: 'Daniel A. y Óscar S.',
    eyebrow: 'Quién escribe esto',
    lead: 'Daniel A. y Óscar S.',
    body:
      'llevan Breachfolio, un sitio pequeño e independiente sobre seguridad e IA. Este artículo se redactó con asistencia de IA y una persona lo revisó antes de publicarlo. Escribimos a partir de documentación, fuentes de los fabricantes e investigación publicada, no de pruebas de laboratorio propias, y enlazamos la fuente en la propia frase que se apoya en ella.',
    meth: 'Cómo trabajamos',
    about: 'Quiénes somos',
    methPath: 'es/legal/methodology',
    aboutPath: 'es/legal/about',
  },
};

const stats = { jsonld: 0, byline: 0, box: 0, files: 0, skipped: [] };

for (const file of files) {
  let html = readFileSync(file, 'utf8');

  // Only real article pages: an Article-flavoured JSON-LD node.
  let isArticle = false;
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let j;
    try { j = JSON.parse(m[1]); } catch { continue; }
    const nodes = Array.isArray(j) ? j : (j['@graph'] || [j]);
    if (nodes.some(n => /Article/.test(String(n['@type'] || '')))) isArticle = true;
  }
  if (!isArticle) continue;

  const isES = /(^|[\\/])es[\\/]/.test(file);
  const t = COPY[isES ? 'es' : 'en'];
  const before = html;

  // ---- 1. JSON-LD author -------------------------------------------------
  const aboutUrl = 'https://breachfolio.com/' + t.aboutPath + '/';
  const persons =
    '[ { "@type": "Person", "name": "Daniel A.", "url": "' + aboutUrl + '" }, ' +
    '{ "@type": "Person", "name": "Óscar S.", "url": "' + aboutUrl + '" } ]';
  html = html.replace(
    /"author"\s*:\s*\{\s*"@type"\s*:\s*"Organization"\s*,\s*"name"\s*:\s*"Breachfolio (?:Research|Editorial desk)"\s*,\s*"url"\s*:\s*"[^"]*"\s*\}/g,
    () => { stats.jsonld++; return '"author": ' + persons; },
  );

  // ---- 2. visible byline in the meta line --------------------------------
  const dot = '<span class="w-1 h-1 rounded-full bg-muted/60"></span>';
  const bylineSpan = '<span class="text-accent">' + t.byline + '</span>';

  if (!html.includes(bylineSpan)) {
    // Replace the invented name where a byline already exists...
    if (/<span class="text-accent">Breachfolio (?:Research|Editorial desk)<\/span>/.test(html)) {
      html = html.replace(
        /<span class="text-accent">Breachfolio (?:Research|Editorial desk)<\/span>/g,
        () => { stats.byline++; return bylineSpan; },
      );
    } else {
      // ...otherwise append one to the first meta line.
      const meta = html.match(
        /<div class="[^"]*\bfont-mono\b[^"]*text-\[11px\][^"]*text-muted[^"]*tracking-wide[^"]*">/,
      );
      if (meta) {
        const open = meta.index;
        const close = closeOfDiv(html, open);
        if (close > 0) {
          const inner = html.slice(open + meta[0].length, close);
          const indent = (inner.match(/\n(\s*)\S/) || [, '        '])[1];
          // Insert after the last real content, not after the trailing newline,
          // so we never leave a whitespace-only line behind.
          const end = open + meta[0].length + inner.replace(/\s+$/, '').length;
          const compact = !/\n/.test(inner.trim()) && inner.trim().length > 0;
          const add = compact ? dot + bylineSpan : '\n' + indent + dot + '\n' + indent + bylineSpan;
          html = html.slice(0, end) + add + html.slice(end);
          stats.byline++;
        }
      }
    }
  }

  // ---- 3. author box at the end of the prose ------------------------------
  if (!html.includes('data-authorship')) {
    const prose = html.match(/<div class="[^"]*\bprose-(?:sec|content)\b[^"]*">/);
    if (prose) {
      const close = closeOfDiv(html, prose.index);
      if (close > 0) {
        const ind = (html.slice(0, close).match(/\n(\s*)<div class="[^"]*prose-/) || [, '    '])[1];
        const i = ind + '  ';
        const box =
          '\n\n' + i + '<div data-authorship class="mt-14 pt-7 border-t border-border">\n' +
          i + '  <div class="font-mono text-[10px] tracking-[.22em] uppercase text-muted mb-3">' + t.eyebrow + '</div>\n' +
          i + '  <p class="text-[14.5px] leading-[1.75] text-muted-foreground">\n' +
          i + '    <strong class="text-foreground font-semibold">' + t.lead + '</strong> ' + t.body + '\n' +
          i + '    <a class="ul-link" href="' + hrefTo(file, t.methPath) + '">' + t.meth + '</a> ·\n' +
          i + '    <a class="ul-link" href="' + hrefTo(file, t.aboutPath) + '">' + t.about + '</a>\n' +
          i + '  </p>\n' +
          i + '</div>\n' + ind;
        // Drop the existing run of whitespace before </div> so the box lands on a
        // clean line instead of leaving an indented blank one.
        const start = close - (html.slice(0, close).match(/\s*$/) || [''])[0].length;
        html = html.slice(0, start) + box + html.slice(close);
        stats.box++;
      }
    } else {
      stats.skipped.push(file);
    }
  }

  if (html !== before) {
    stats.files++;
    if (!DRY) writeFileSync(file, html);
  }
}

console.log(`${DRY ? '[dry run] ' : ''}archivos modificados : ${stats.files}`);
console.log(`  author JSON-LD reescrito : ${stats.jsonld}`);
console.log(`  firma visible            : ${stats.byline}`);
console.log(`  bloque de autoria        : ${stats.box}`);
if (stats.skipped.length) {
  console.log(`  SIN contenedor de prosa (revisar a mano): ${stats.skipped.length}`);
  stats.skipped.forEach(f => console.log('     ' + f));
}
