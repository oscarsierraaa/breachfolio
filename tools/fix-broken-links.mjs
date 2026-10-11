#!/usr/bin/env node
/*
  Breachfolio — fix-broken-links.mjs (29-07)

  27 enlaces internos no resolvían a ninguna página. Dos causas distintas:

  1) RUTA A OTRA SECCIÓN SIN EL PREFIJO. Desde un artículo de
     `cybersecurity/`, un `../check-suspicious-domain/` apunta a
     `cybersecurity/check-suspicious-domain/`, que no existe: la guía vive en
     `guides/`, así que hacen falta `../../guides/`. Mismo fallo en el lado
     español hacia `guias/` y `comparativas/`.

     Ojo con el idioma: una página en español debe enlazar a la guía EN
     ESPAÑOL, no a la inglesa. Por eso `check-suspicious-domain` se traduce a
     `dominio-falso` y `report-scam-website` a `denunciar-web-fraudulenta`.

  2) SLUG QUE NO EXISTE.
     - `certificados-tls-y-transparencia` era un error tipográfico: el real
       es `certificados-tls-transparencia`, sin la «y».
     - `threat-analyst-vs-cti-analyst` (y su gemelo español) prometía una
       comparativa que nunca se escribió. Se reapunta al artículo más cercano
       que sí existe, `soc-team-roles` / `roles-de-un-soc`, y se ajusta el
       texto del enlace para que no prometa algo que no está.
*/
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Reemplazos por prefijo de directorio, para no aplicar la ruta española a
// una página inglesa ni al revés.
const EN = [
  ['href="../check-suspicious-domain/"', 'href="../../guides/check-suspicious-domain/"'],
  ['href="../report-scam-website/"', 'href="../../guides/report-scam-website/"'],
  // el artículo prometido no existe: se reapunta y se ajusta el texto
  ['the people we compare in <a href="../threat-analyst-vs-cti-analyst/">threat analyst vs CTI analyst</a>',
   'the analysts whose roles we break down in <a href="../soc-team-roles/">SOC team roles</a>'],
];

const ES = [
  ['href="../check-suspicious-domain/"', 'href="../../guias/dominio-falso/"'],
  ['href="../report-scam-website/"', 'href="../../guias/denunciar-web-fraudulenta/"'],
  ['href="../certificados-tls-y-transparencia/"', 'href="../certificados-tls-transparencia/"'],
  ['href="../wireshark-vs-tcpdump/"', 'href="../../comparativas/wireshark-vs-tcpdump/"'],
  ['href="../splunk-vs-wazuh-vs-elk/"', 'href="../../comparativas/splunk-vs-wazuh-vs-elk/"'],
  ['href="../snort-vs-suricata/"', 'href="../../comparativas/snort-vs-suricata/"'],
  ['href="../metasploit-vs-sliver/"', 'href="../../comparativas/metasploit-vs-sliver/"'],
  ['href="../nmap-vs-masscan/"', 'href="../../comparativas/nmap-vs-masscan/"'],
  ['las personas que comparamos en <a href="../analista-de-amenazas-vs-cti/">analista de amenazas vs analista CTI</a>',
   'los perfiles que desglosamos en <a href="../roles-de-un-soc/">los roles de un SOC</a>'],
];

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

let fixed = 0, touched = 0;
for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file).split(path.sep).join('/');
  // solo artículos de estas dos secciones tienen el fallo
  const isEs = rel.startsWith('es/ciberseguridad/');
  const isEn = rel.startsWith('cybersecurity/');
  if (!isEs && !isEn) continue;

  const before = readFileSync(file, 'utf-8');
  let out = before;
  for (const [from, to] of isEs ? ES : EN) {
    if (out.includes(from)) { out = out.split(from).join(to); fixed++; }
  }
  if (out !== before) { writeFileSync(file, out, 'utf-8'); touched++; }
}

console.log(`Páginas modificadas: ${touched}`);
console.log(`Enlaces corregidos: ${fixed}`);
