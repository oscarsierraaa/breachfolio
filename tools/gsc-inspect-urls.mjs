#!/usr/bin/env node
/*
  Breachfolio — auditoría de indexación en bloque (solo lectura).

  Pasa todas las URLs de un fichero por la URL Inspection API de Search Console
  y escribe un JSON con el estado real de cada una (indexada / descubierta pero
  no indexada / desconocida), la canónica que eligió Google y la última visita
  de Googlebot. Sirve para saber qué páginas hay que empujar a mano desde GSC.

  Uso:
    node tools/gsc-inspect-urls.mjs <urls.txt> <salida.json>

  Genera el fichero de URLs desde el sitemap con:
    grep -o '<loc>[^<]*</loc>' sitemap.xml | sed 's|<loc>||;s|</loc>||' > urls.txt

  Credenciales: la service account del MCP de GSC. Por defecto lee
  GOOGLE_APPLICATION_CREDENTIALS; si no está, usa GSC_SA_KEY.

  Cuotas de la API: 2000 inspecciones/día y 600/minuto por propiedad. Con
  CONC=8 se tarda ~4 min en las ~262 URLs del sitemap, muy lejos del límite.

  ALCANCE: esta herramienta apunta fija a breachfolio.com a propósito (ver
  CLAUDE.md). La misma service account ve otras propiedades; no tocarlas.
*/
import { readFileSync, writeFileSync } from 'fs';
import crypto from 'crypto';

const SITE = 'sc-domain:breachfolio.com';
const CONC = 8;
const KEY = process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GSC_SA_KEY;
const [URLS_FILE, OUT] = process.argv.slice(2);

if (!KEY) {
  console.error('Falta GOOGLE_APPLICATION_CREDENTIALS (o GSC_SA_KEY) con la ruta al JSON de la service account.');
  process.exit(1);
}
if (!URLS_FILE || !OUT) {
  console.error('Uso: node tools/gsc-inspect-urls.mjs <urls.txt> <salida.json>');
  process.exit(1);
}

const sa = JSON.parse(readFileSync(KEY, 'utf-8'));
const b64 = (o) => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');

async function token() {
  const now = Math.floor(Date.now() / 1000);
  const header = b64({ alg: 'RS256', typ: 'JWT' });
  const claim = b64({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  });
  const sig = crypto.createSign('RSA-SHA256').update(`${header}.${claim}`).sign(sa.private_key).toString('base64url');
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${header}.${claim}.${sig}`,
    }),
  });
  const j = await res.json();
  if (!j.access_token) throw new Error('sin token: ' + JSON.stringify(j));
  return j.access_token;
}

// La API devuelve 500 esporádicos que se resuelven al reintentar; no son un
// problema de la página (comprobado el 26-07-2026 con dos falsos negativos).
async function inspect(tk, url, attempt = 0) {
  const res = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tk}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inspectionUrl: url, siteUrl: SITE }),
  });
  if ((res.status === 429 || res.status >= 500) && attempt < 4) {
    await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)));
    return inspect(tk, url, attempt + 1);
  }
  if (!res.ok) return { url, error: `HTTP ${res.status}: ${(await res.text()).slice(0, 200)}` };
  const r = (await res.json()).inspectionResult?.indexStatusResult ?? {};
  return {
    url,
    verdict: r.verdict ?? null,
    coverageState: r.coverageState ?? null,
    robotsTxtState: r.robotsTxtState ?? null,
    indexingState: r.indexingState ?? null,
    lastCrawlTime: r.lastCrawlTime ?? null,
    pageFetchState: r.pageFetchState ?? null,
    googleCanonical: r.googleCanonical ?? null,
    userCanonical: r.userCanonical ?? null,
    sitemaps: (r.sitemap ?? []).length,
    crawledAs: r.crawledAs ?? null,
  };
}

const urls = readFileSync(URLS_FILE, 'utf-8').split(/\r?\n/).filter(Boolean);
const tk = await token();
const out = new Array(urls.length);
let next = 0, done = 0;
await Promise.all(
  Array.from({ length: CONC }, async () => {
    while (next < urls.length) {
      const i = next++;
      out[i] = await inspect(tk, urls[i]);
      if (++done % 25 === 0) console.error(`  ...${done}/${urls.length}`);
    }
  })
);
writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf-8');

const tally = {};
for (const r of out) {
  const k = r.error ? 'ERROR' : `${r.verdict} | ${r.coverageState}`;
  tally[k] = (tally[k] || 0) + 1;
}
console.log(JSON.stringify(tally, null, 2));
