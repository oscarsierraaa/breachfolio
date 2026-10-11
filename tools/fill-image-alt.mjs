#!/usr/bin/env node
/*
  Breachfolio — fill-image-alt.mjs (27-07)

  185 imágenes de contenido en 134 páginas tenían `alt=""`. Un alt vacío le
  dice al lector de pantalla "ignora esta imagen", que es correcto para un
  adorno pero no para la imagen que ilustra el artículo: quien navega con
  lector de pantalla se queda sin saber qué hay ahí, y Google Imágenes no
  tiene con qué indexarla. `STATE.md` ya recogía que este trabajo se empezó
  ("batches 1-1c de 25") y se quedó a medias: 83 páginas lo tenían y 130 no.

  Se rellena con el H1 de la propia página, que es exactamente lo que la
  imagen ilustra. Es el mismo estilo que ya usaban las 83 páginas hechas
  (p. ej. alt="AI red teaming, from zero.").

  NO se toca lo que ya está bien:
  - Imágenes dentro de un contenedor `aria-hidden="true"`: ahí el alt vacío
    es la marca correcta de "decorativa" y ponerle texto sería un error de
    accesibilidad, no una mejora. Son 12 y se quedan como están.
  - Imágenes que ya tienen alt descriptivo.
  - Logos y favicons.
*/
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (['node_modules', '_pagefind', '.git', 'tools', 'assets', 'imagenes', '.vscode'].includes(name)) continue;
    const p = path.join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (name.endsWith('.html')) out.push(p);
  }
  return out;
}

// Texto del H1, sin etiquetas y con las entidades y comillas ya seguras para
// meterlo dentro de un atributo.
function h1Text(html) {
  const m = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/);
  if (!m) return null;
  const t = m[1]
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!t || t.length < 8) return null;
  return t.replace(/&(?!(amp|lt|gt|quot|#\d+);)/g, '&amp;').replace(/"/g, '&quot;');
}

function main() {
  const files = walk(ROOT);
  let filled = 0, skippedDecorative = 0, noH1 = 0, touched = 0;

  for (const file of files) {
    const before = readFileSync(file, 'utf-8');
    const alt = h1Text(before);
    let out = before, changed = 0;

    out = out.replace(/<img\b[^>]*alt=""[^>]*>/g, (tag, idx) => {
      // ¿está dentro de un contenedor marcado como decorativo?
      const ctx = before.slice(Math.max(0, idx - 400), idx);
      const lastDiv = ctx.lastIndexOf('<div');
      const decorative = /aria-hidden/.test(tag) ||
        (lastDiv !== -1 && /aria-hidden="true"/.test(ctx.slice(lastDiv)));
      if (decorative) { skippedDecorative++; return tag; }
      if (/logo\.png|favicon/.test(tag)) return tag;
      if (!alt) { noH1++; return tag; }
      changed++; filled++;
      return tag.replace('alt=""', `alt="${alt}"`);
    });

    if (changed) { writeFileSync(file, out, 'utf-8'); touched++; }
  }

  console.log(`Páginas modificadas: ${touched}`);
  console.log(`  alt rellenados desde el H1: ${filled}`);
  console.log(`  decorativas respetadas (alt vacío correcto): ${skippedDecorative}`);
  console.log(`  sin H1 utilizable (no tocadas): ${noH1}`);
}

main();
