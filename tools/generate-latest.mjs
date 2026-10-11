// Genera data/latest.json: los artículos más recientes de TODA la web
// (todas las secciones, EN y ES), para la cinta "Latest" de la home y /news/.
// La cinta (assets/dynamic-news.js) filtra por idioma de la página.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd());
const SECTIONS = [
  'cybersecurity', 'ai', 'compare', 'lab', 'guides', 'resources', 'news',
  'es/ciberseguridad', 'es/ia', 'es/comparativas', 'es/laboratorio', 'es/guias', 'es/recursos', 'es/noticias',
];
const PER_LANG = 12; // guardamos un margen; la cinta muestra 8

// Borradores en disco, ya escritos pero sin publicar (sin commitear a main).
// Sin esta lista, cualquier borrador local con fecha reciente puede colarse
// en la cinta antes de tiempo o incluso desplazar contenido real ya
// publicado — pasó una vez (17 enlaces muertos en la cinta, 22-07).
// Mantener sincronizada con DRAFT_PATHS de generate-sitemap.mjs.
// Vacío desde el 2026-08-13. Las dos entradas que había (antivirus-vs-edr y su
// versión ES) se publicaron ese día y se retiraron del sitio el 17-08. La lista
// se mantiene porque el mecanismo sigue haciendo falta la próxima vez que haya
// un borrador en disco.
const DRAFT_PATHS = new Set();

function field(html, re) { const m = html.match(re); return m ? m[1].trim() : ''; }

const items = [];
for (const sec of SECTIONS) {
  const dir = path.join(ROOT, sec);
  if (!fs.existsSync(dir)) continue;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (/^page-\d+$/.test(entry.name)) continue;
    const f = path.join(dir, entry.name, 'index.html');
    if (!fs.existsSync(f)) continue;
    const html = fs.readFileSync(f, 'utf8');
    const canonical = field(html, /<link rel="canonical" href="([^"]+)"/);
    if (!canonical) continue;
    const urlPath = canonical.replace('https://breachfolio.com', '');
    if (DRAFT_PATHS.has(urlPath)) continue;
    const lang = urlPath.startsWith('/es/') ? 'es' : 'en';
    let title = field(html, /<meta property="og:title" content="([^"]+)"/) || field(html, /<title>([^<]+)<\/title>/);
    title = title.replace(/\s*[|·—]\s*Breachfolio\s*$/, '').trim();
    const summary = field(html, /<meta name="description" content="([^"]+)"/);
    let image = field(html, /<meta property="og:image" content="([^"]+)"/).replace('https://breachfolio.com', '');
    if (!/^\/assets\/img\//.test(image)) image = image ? image : null;
    const published = field(html, /"datePublished":\s*"([^"]+)"/) || '2026-01-01';
    items.push({
      id: urlPath,
      title,
      summary,
      url: urlPath,
      source_url: null,
      image: image || null,
      lang,
      published_at: published,
      expires_at: null,
    });
  }
}

// ordenar por fecha desc y quedarnos con los PER_LANG más recientes por idioma
const byLang = { en: [], es: [] };
for (const it of items) byLang[it.lang]?.push(it);
for (const l of ['en', 'es']) {
  byLang[l].sort((a, b) => (b.published_at + b.url).localeCompare(a.published_at + a.url));
  byLang[l] = byLang[l].slice(0, PER_LANG);
}
const out = {
  site: 'breachfolio',
  generated_at: new Date().toISOString(),
  items: [...byLang.en, ...byLang.es],
};
fs.writeFileSync(path.join(ROOT, 'data/latest.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`data/latest.json: ${byLang.en.length} EN + ${byLang.es.length} ES (de ${items.length} artículos escaneados)`);
console.log('  EN top3:', byLang.en.slice(0, 3).map(i => i.published_at + ' ' + i.url).join(' | '));
console.log('  ES top3:', byLang.es.slice(0, 3).map(i => i.published_at + ' ' + i.url).join(' | '));
