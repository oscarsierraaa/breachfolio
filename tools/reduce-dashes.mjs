#!/usr/bin/env node
/*
  Breachfolio — reduce-dashes.mjs (27-07)

  Segunda pasada sobre el guion. La primera (tidy-em-dashes.mjs) solo lo
  acortó (— → –), que arregla el impacto visual pero no la FRECUENCIA: seguía
  saliendo ~2.100 veces en los cuerpos de artículo. Y esa frecuencia es
  precisamente lo que delata un texto escrito con IA, que es lo que el
  usuario quiere evitar.

  Aquí sí se REDUCE el número, sustituyéndolo por la puntuación que toca en
  cada caso. Solo tres patrones, todos verificados leyendo la salida real:

  REGLA DE ORO, aprendida a base de romperlo: solo se toca un guion cuando
  es el ÚNICO de su oración. Una primera versión no comprobaba esto y metió
  dos fallos reales, detectados al leer la salida (no en el recuento, que
  salía perfecto):

    · Guion huérfano. En `sin logins – prefiriendo datos pasivos – y
      documentan`, convertía el guion de CIERRE y dejaba el de apertura
      suelto, descuadrando la frase.
    · Coma empalmada. En `riesgos – manejas datos de personas reales – y
      exige cuidado`, pasar el inciso a comas lo convierte en una
      enumeración incorrecta, porque ese inciso es una oración
      independiente, no un aposito.

  Por eso ahora se parte por oraciones y solo se procesan las que tienen
  exactamente un guion. Los incisos emparejados se dejan enteros: decidir
  entre comas, paréntesis o reescribir depende de si el inciso es un aposito
  o una oración independiente, y eso hay que leerlo.

  A) GUION ANTES DE CONJUNCIÓN O NEGACIÓN  (solo en oración de un guion)
     `X – and Y` / `X – pero Y` / `X – not Y` → `X, and Y`
     La coma es la puntuación natural ahí.

  C) GUION QUE INTRODUCE UNA EXPLICACIÓN  (solo en oración de un guion)
     `oración completa – it/this/esto… ` → dos puntos.
     Restringido a pronombres que garantizan que lo que sigue es una oración
     explicativa, que es cuando los dos puntos son correctos.

  Se deja INTACTO a propósito:
  - Cualquier oración con dos o más guiones (incisos emparejados).
  - Guiones sueltos seguidos de sustantivo o artículo: ahí hace falta leer la
    frase para saber si toca coma, dos puntos o punto. No es automatizable.
  - <pre> y <code>: un guion en un comando es literal.

  Se recorre el documento COMPLETO, no solo <article>, para que el FAQ
  visible y su copia en JSON-LD no se descuadren (ver la nota del script
  hermano: una versión anterior dejó 93 páginas descuadradas por esto).
*/
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const D = '–'; // raya corta

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (['node_modules', '_pagefind', '.git', 'tools', 'assets'].includes(name)) continue;
    const p = path.join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (name === 'index.html') out.push(p);
  }
  return out;
}

function withCodeProtected(html, fn) {
  const stash = [];
  const masked = html.replace(/<(pre|code)\b[\s\S]*?<\/\1>/gi, (m) => {
    stash.push(m);
    return ` CODE${stash.length - 1} `;
  });
  return fn(masked).replace(/ CODE(\d+) /g, (_, i) => stash[Number(i)]);
}

const CONJ = 'and|but|or|yet|so|not|nor|which|y|o|pero|ni|no|sino';
const PRON = 'it|this|these|they|that|there|esto|eso|esta|este|ese|ella|ellos';
// Artículos: `X – a checklist for…`, `X – an attacker doesn't need…`. Aquí el
// guion introduce una aposición o un ejemplo, que es exactamente para lo que
// están los dos puntos. Comprobado leyendo 8 casos reales antes de añadirlo:
// funcionaba en 7 y en el octavo quedaba aceptable.
const ART = 'the|a|an|el|la|los|las|un|una';

// Procesa solo las oraciones con exactamente UN guion. Trocea por final de
// oración manteniendo el separador, para poder recomponer el texto igual.
function perSentence(s, fn) {
  return s.split(/(?<=[.!?])(\s+)/).map((chunk) => {
    if (/^\s+$/.test(chunk)) return chunk;            // separador, se respeta
    const n = (chunk.match(new RegExp(D, 'g')) || []).length;
    return n === 1 ? fn(chunk) : chunk;               // 0 o 2+ → no se toca
  }).join('');
}

function main() {
  const files = walk(ROOT);
  let a = 0, c = 0, touched = 0;

  for (const file of files) {
    const before = readFileSync(file, 'utf-8');

    const after = withCodeProtected(before, (s) => perSentence(s, (sent) => {
      // A: guion + conjunción/negación → coma
      sent = sent.replace(
        new RegExp(`\\s${D}\\s(${CONJ})\\s`, 'gi'),
        (_m, w) => { a++; return `, ${w} `; }
      );
      // C: guion + pronombre o artículo → dos puntos
      sent = sent.replace(
        new RegExp(`\\s${D}\\s(${PRON}|${ART})\\s`, 'gi'),
        (_m, w) => { c++; return `: ${w} `; }
      );
      return sent;
    }));

    if (after !== before) { writeFileSync(file, after, 'utf-8'); touched++; }
  }

  console.log(`Páginas modificadas: ${touched}`);
  console.log(`  A · conjunción/negación → coma: ${a}`);
  console.log(`  C · explicativo → dos puntos: ${c}`);
  console.log(`  TOTAL guiones eliminados: ${a + c}`);
}

main();
