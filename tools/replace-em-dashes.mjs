/**
 * replace-em-dashes.mjs — take the em dash out of served pages.
 *
 * WHY THIS EXISTS
 * The em dash reads as machine-written, and the site had 190 of them in served
 * HTML. Most were not written by hand at all: generate-pagination.mjs used one
 * as its "— Page N" separator and replicated it into the title, description,
 * og and twitter tags of every archive page, seven per page. That generator now
 * uses the middle dot the rest of the site already uses, which removed 144 of
 * them at the source.
 *
 * This handles what is left, and it replaces by context rather than globally,
 * because the right substitute is not the same everywhere:
 *
 *   inside <pre> code samples  ->  " - "   reads naturally in a shell comment
 *   inside alt="…"             ->  " – "   matches the en dash the English alts use
 *   "Page not found — Brand"   ->  " | "   matches every other page title
 *
 * WHY NOT tools/reduce-dashes.mjs
 * That one rewrites sentence structure and has broken grammar twice without the
 * counter noticing, which is why it only touches sentences with exactly one
 * dash. This tool never restructures a sentence: it swaps one punctuation mark
 * for another inside a known context, so there is nothing for it to break.
 *
 * Usage:  node tools/replace-em-dashes.mjs [--apply]
 * Idempotent: re-running makes no further change.
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, relative } from 'path';

const ROOT = process.cwd();
const APPLY = process.argv.includes('--apply');

const files = [];
(function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', '_pagefind', 'n8n'].includes(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.html$/.test(e.name)) files.push(p);
  }
})(ROOT);

let changedFiles = 0;
let swaps = 0;
const remaining = [];

for (const f of files) {
  const rel = relative(ROOT, f).replace(/\\/g, '/');
  const html = readFileSync(f, 'utf8');
  if (!html.includes('—')) continue;

  let out = html;

  // 1. Code samples: a shell comment reads fine with a plain hyphen.
  out = out.replace(/<pre[\s\S]*?<\/pre>/gi, (block) => block.replace(/\s—\s/g, ' - '));

  // 2. alt text: match the en dash the English alts already use.
  out = out.replace(/alt="([^"]*)"/g, (whole, text) => (text.includes('—') ? `alt="${text.replace(/\s—\s/g, ' – ')}"` : whole));

  // 3. Page titles and the social tags built from them.
  out = out.replace(/([^<>"]*?)\s—\s(Breachfolio)/g, '$1 | $2');

  if (out === html) {
    // Nothing matched a known context; report instead of guessing.
    for (const m of out.replace(/<!--[\s\S]*?-->/g, ' ').matchAll(/—/g)) {
      remaining.push([rel, out.slice(Math.max(0, m.index - 70), m.index + 70).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()]);
    }
    continue;
  }

  const before = (html.match(/—/g) || []).length;
  const after = (out.match(/—/g) || []).length;
  swaps += before - after;
  changedFiles++;
  if (APPLY) writeFileSync(f, out);
  if (changedFiles <= 8) console.log(`  ${APPLY ? 'corregido' : 'corregiria'}  ${rel}  (${before - after})`);

  for (const m of out.replace(/<!--[\s\S]*?-->/g, ' ').matchAll(/—/g)) {
    remaining.push([rel, out.slice(Math.max(0, m.index - 70), m.index + 70).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()]);
  }
}

console.log('');
console.log(`ficheros ${APPLY ? 'corregidos' : 'a corregir'}: ${changedFiles}`);
console.log(`guiones largos sustituidos: ${swaps}`);
console.log(`sin contexto reconocido, quedan para revisar a mano: ${remaining.length}`);
remaining.forEach(([rel, ctx]) => console.log(`  ${rel}\n     …${ctx}…`));
if (!APPLY) console.log('\n(simulacion: no se ha escrito nada. Ejecuta con --apply)');
