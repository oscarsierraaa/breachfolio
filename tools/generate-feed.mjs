#!/usr/bin/env node
/*
  Breachfolio — generate-feed.mjs
  Genera rss.xml (inglés) y es/rss.xml (español) a partir de data/latest.json.

  Por qué existe: hasta el 2026-08-26 el sitio no tenía feed. Eso cierra un
  canal de descubrimiento entero — lectores, agregadores y las listas de blogs
  de seguridad, que piden la URL del feed para aceptar una entrada. Para un
  dominio con cero enlaces entrantes es de las pocas cosas que dependen solo
  de nosotros.

  Se reutiliza data/latest.json en lugar de volver a recorrer el árbol: ya
  respeta DRAFT_PATHS, ya lee canonical/og:title/description/datePublished, y
  así el feed no puede desviarse de la cinta de portada. Eso obliga a que
  `build:feed` vaya DESPUÉS de `build:latest` en la cadena.

  Un feed por idioma, no uno mezclado: un lector español que se suscribe no
  quiere la mitad de las entradas en inglés, y <language> solo admite un valor.
*/
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://breachfolio.com';

const FEEDS = {
  en: {
    file: 'rss.xml',
    self: `${BASE}/rss.xml`,
    link: `${BASE}/`,
    title: 'Breachfolio',
    description: 'Practical cybersecurity guides, explained for people who need an answer tonight, not a glossary.',
  },
  es: {
    file: 'es/rss.xml',
    self: `${BASE}/es/rss.xml`,
    link: `${BASE}/es/`,
    title: 'Breachfolio',
    description: 'Guías prácticas de ciberseguridad, explicadas para quien necesita una respuesta esta noche, no un glosario.',
  },
};

// XML no perdona un & suelto ni un < en un título. Escapar siempre, aunque hoy
// ningún título los tenga: el primero que los lleve rompería el feed entero y
// los lectores lo descartan sin avisar.
const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const DIAS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MESES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// RSS exige fecha RFC 822. published_at viene como "2026-08-26" (sin hora), así
// que se ancla a mediodía UTC: a medianoche, un lector en zona horaria negativa
// vería el artículo con la fecha del día anterior.
function rfc822(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) throw new Error(`fecha ilegible: ${iso}`);
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const p = (n) => String(n).padStart(2, '0');
  return `${DIAS[dt.getUTCDay()]}, ${p(d)} ${MESES[m - 1]} ${y} 12:00:00 +0000`;
}

const MIME = { '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };

const latest = JSON.parse(readFileSync(path.join(ROOT, 'data/latest.json'), 'utf8'));

let total = 0;
for (const [lang, cfg] of Object.entries(FEEDS)) {
  const items = latest.items
    .filter((i) => i.lang === lang)
    .sort((a, b) => (b.published_at + b.url).localeCompare(a.published_at + a.url));

  if (!items.length) throw new Error(`sin entradas para "${lang}" — ¿ha corrido build:latest?`);

  // lastBuildDate sale de la entrada más reciente, no de la hora de ejecución:
  // así dos builds seguidos sin contenido nuevo producen el mismo fichero y no
  // ensucian el diff en cada push.
  const lastBuild = rfc822(items[0].published_at);

  const entradas = items
    .map((i) => {
      const url = BASE + i.url;
      const img = i.image
        ? `\n      <enclosure url="${esc(BASE + i.image)}" type="${MIME[path.extname(i.image)] || 'image/webp'}" length="0" />`
        : '';
      return `    <item>
      <title>${esc(i.title)}</title>
      <link>${esc(url)}</link>
      <guid isPermaLink="true">${esc(url)}</guid>
      <pubDate>${rfc822(i.published_at)}</pubDate>
      <description>${esc(i.summary)}</description>${img}
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(cfg.title)}</title>
    <link>${esc(cfg.link)}</link>
    <description>${esc(cfg.description)}</description>
    <language>${lang}</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <atom:link href="${esc(cfg.self)}" rel="self" type="application/rss+xml" />
${entradas}
  </channel>
</rss>
`;

  writeFileSync(path.join(ROOT, cfg.file), xml);
  console.log(`  ${cfg.file}: ${items.length} entradas (${items[items.length - 1].published_at} -> ${items[0].published_at})`);
  total += items.length;
}

console.log(`RSS regenerado: ${total} entradas en ${Object.keys(FEEDS).length} feeds`);
