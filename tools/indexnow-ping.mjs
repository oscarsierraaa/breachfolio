// IndexNow: avisa a Bing/Yandex/Seznam de las URLs nuevas del sitio para que
// las indexen casi al instante (Google no usa IndexNow; a él le llega por
// sitemap + Search Console). Se ejecuta en la GitHub Action tras regenerar
// artefactos: compara el sitemap.xml del commit actual con el del commit
// anterior y pinguea solo las URLs añadidas. Tolerante a fallos: nunca rompe
// el build (la indexación rápida es un extra, no un requisito).
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const HOST = 'breachfolio.com';
const KEY = '0646fd957126cc12621fb8592c28694f'; // servida en /<KEY>.txt

function urlsDe(xml) {
  return new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim()));
}

let previas;
try {
  previas = urlsDe(execSync('git show HEAD~1:sitemap.xml', { encoding: 'utf8' }));
} catch (e) {
  console.log('indexnow: no hay sitemap previo (primer commit?) — nada que comparar.');
  process.exit(0);
}
const actuales = urlsDe(readFileSync('sitemap.xml', 'utf8'));
const nuevas = [...actuales].filter(u => !previas.has(u));

if (!nuevas.length) {
  console.log('indexnow: sin URLs nuevas en el sitemap.');
  process.exit(0);
}
console.log(`indexnow: ${nuevas.length} URL(s) nueva(s):`);
nuevas.forEach(u => console.log('  ' + u));

try {
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: nuevas.slice(0, 10000) }),
  });
  console.log(`indexnow: respuesta ${res.status} ${res.statusText}`);
} catch (e) {
  console.log('indexnow: ping falló (no bloqueante):', e.message);
}
