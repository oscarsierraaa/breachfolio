/**
 * real-authorship-outliers.mjs — the 4 pages real-authorship.mjs could not do generically.
 *
 * 1. cybersecurity/ai-security + es/ciberseguridad/ia-y-ciberseguridad
 *    Section landing pages built from the i18n template. They carry TechArticle
 *    markup and ~1,200 words, so they need the author box too, but they have no
 *    prose container to append it to. Insert it as its own section, ahead of the
 *    newsletter CTA, matching the page's section rhythm.
 *
 * 2. cybersecurity/sigma-and-yara-rules + es/ciberseguridad/reglas-sigma-y-yara
 *    "Breachfolio Research" survives inside example Sigma/YARA rule metadata.
 *    Those are illustrative rules the site authored, so the field is legitimate;
 *    only the name is wrong. "Breachfolio" exists, "Breachfolio Research" does not.
 */
import { readFileSync, writeFileSync } from 'fs';

const BOX = {
  'cybersecurity/ai-security/index.html': {
    eyebrow: 'Who writes this',
    lead: 'Daniel A. and Óscar S.',
    body:
      'run Breachfolio, a small independent site about security and AI. This page was drafted with AI assistance and reviewed by a person before it went live. We write from documentation, vendor sources and published research rather than from original lab benchmarks, and we link a source in the sentence that relies on it.',
    meth: 'How we work',
    about: 'About us',
    methHref: '../../legal/methodology/',
    aboutHref: '../../legal/about/',
  },
  'es/ciberseguridad/ia-y-ciberseguridad/index.html': {
    eyebrow: 'Quién escribe esto',
    lead: 'Daniel A. y Óscar S.',
    body:
      'llevan Breachfolio, un sitio pequeño e independiente sobre seguridad e IA. Esta página se redactó con asistencia de IA y una persona la revisó antes de publicarla. Escribimos a partir de documentación, fuentes de los fabricantes e investigación publicada, no de pruebas de laboratorio propias, y enlazamos la fuente en la propia frase que se apoya en ella.',
    meth: 'Cómo trabajamos',
    about: 'Quiénes somos',
    methHref: '../../legal/methodology/',
    aboutHref: '../../legal/about/',
  },
};

for (const [file, t] of Object.entries(BOX)) {
  let html = readFileSync(file, 'utf8');
  if (html.includes('data-authorship')) { console.log(`ya hecho: ${file}`); continue; }

  const anchor = html.match(/\n(\s*)<!-- Newsletter CTA -->/);
  if (!anchor) { console.log(`SIN ancla, revisar a mano: ${file}`); continue; }
  const i = anchor[1];

  const section =
    '\n' + i + '<!-- Who writes this -->\n' +
    i + '<section class="pb-2">\n' +
    i + '  <div class="max-w-container mx-auto px-6 md:px-12">\n' +
    i + '    <div data-authorship class="max-w-prose pt-7 border-t border-border">\n' +
    i + '      <div class="font-mono text-[10px] tracking-[.22em] uppercase text-muted mb-3">' + t.eyebrow + '</div>\n' +
    i + '      <p class="text-[14.5px] leading-[1.75] text-muted-foreground">\n' +
    i + '        <strong class="text-foreground font-semibold">' + t.lead + '</strong> ' + t.body + '\n' +
    i + '        <a class="ul-link" href="' + t.methHref + '">' + t.meth + '</a> ·\n' +
    i + '        <a class="ul-link" href="' + t.aboutHref + '">' + t.about + '</a>\n' +
    i + '      </p>\n' +
    i + '    </div>\n' +
    i + '  </div>\n' +
    i + '</section>\n';

  html = html.slice(0, anchor.index) + section + html.slice(anchor.index);
  writeFileSync(file, html);
  console.log(`bloque de autoria insertado: ${file}`);
}

// The site exists; the "Research" division does not.
for (const file of [
  'cybersecurity/sigma-and-yara-rules/index.html',
  'es/ciberseguridad/reglas-sigma-y-yara/index.html',
]) {
  const html = readFileSync(file, 'utf8');
  const out = html.replace(/Breachfolio Research/g, 'Breachfolio');
  const n = (html.match(/Breachfolio Research/g) || []).length;
  if (n) writeFileSync(file, out);
  console.log(`reglas de ejemplo corregidas (${n}): ${file}`);
}
