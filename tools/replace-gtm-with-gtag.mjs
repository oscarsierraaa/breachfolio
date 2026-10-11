#!/usr/bin/env node
/*
  Breachfolio — one-off migration: replace Google Tag Manager with a direct
  gtag.js install (2026-07-25). GTM was routing to a different tag ID
  (G-TS00P5KMWP) than the one Analytics' own "install manually" instructions
  give for this property (G-EGX7M6BMBR) — Analytics' tag detector never saw
  a hit. Swaps the GTM <script> block (head) for the direct gtag.js snippet,
  and removes the GTM <noscript> block (body) — gtag.js has no noscript
  equivalent. The consent-default script (sf-consent-default) stays exactly
  where it was, still runs before this.
*/
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// G-EGX7M6BMBR is the property's actual servable "Google tag" (inherited from
// the SecForge era via "use detected tag"); it routes to the G-TS00P5KMWP
// stream as a destination. gtag/js?id=G-TS00P5KMWP itself returns 404 — do
// NOT "fix" this back to the stream's measurement ID (see STATE.md 25-07).
const GA_ID = 'G-EGX7M6BMBR';

const HEAD_RE = /<!-- Google Tag Manager -->\r?\n<script>\(function\(w,d,s,l,i\)\{[\s\S]*?End Google Tag Manager -->/;
const BODY_RE = /<!-- Google Tag Manager \(noscript\) -->\r?\n<noscript><iframe src="https:\/\/www\.googletagmanager\.com\/ns\.html\?id=GTM-N3586MQV"[\s\S]*?<!-- End Google Tag Manager \(noscript\) -->\r?\n?/;

function gtagSnippet() {
  return (
    `<!-- Google tag (gtag.js) -->\n` +
    `<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>\n` +
    `<script>\n` +
    `  window.dataLayer = window.dataLayer || [];\n` +
    `  function gtag(){dataLayer.push(arguments);}\n` +
    `  gtag('js', new Date());\n` +
    `  gtag('config', '${GA_ID}');\n` +
    `</script>\n` +
    `<!-- End Google tag (gtag.js) -->`
  );
}

function walk(dir, out) {
  for (const name of readdirSync(dir)) {
    if (['node_modules', '_pagefind', '.git'].includes(name)) continue;
    const p = path.join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (name.endsWith('.html')) out.push(p);
  }
  return out;
}

function main() {
  const files = walk(ROOT, []);
  let changed = 0, noHead = 0, noBody = 0;
  for (const file of files) {
    let html = readFileSync(file, 'utf-8');
    if (!HEAD_RE.test(html)) { noHead++; continue; }
    html = html.replace(HEAD_RE, gtagSnippet());
    if (BODY_RE.test(html)) html = html.replace(BODY_RE, '');
    else noBody++;
    writeFileSync(file, html, 'utf-8');
    changed++;
  }
  console.log(`Migrados: ${changed} | sin bloque GTM en <head>: ${noHead} | sin noscript GTM: ${noBody}`);
}

main();
