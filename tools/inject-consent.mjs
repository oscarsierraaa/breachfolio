#!/usr/bin/env node
/*
  Breachfolio — inject-consent.mjs
  Adds Consent Mode v2 default-denied gating in front of the existing
  Google tag (gtag.js) snippet, on every page. This default must be set before any Google tag
  loads regardless of who renders the visible consent UI — as of
  2026-07-20 that's Google's own AdSense consent message (configured in
  the AdSense dashboard, served through the adsbygoogle.js tag already on
  every page), not a site-built banner. Idempotent — skips files already
  patched, so it runs as `npm run build:consent` inside `npm run build`:
  any page created outside the n8n templates gets the default patched in
  on the next build instead of silently shipping ungated GTM. n8n pages
  are born patched via tools/templates/*.html.

  NOTE: the GitHub Action runs this but its git-add list does NOT include
  article HTML (loop-guard), so a consent fix for a hand-written page only
  reaches production when someone runs `npm run build` locally and commits —
  do that whenever adding pages outside n8n.
*/
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MARKER = 'sf-consent-default';

const GOOGLE_TAG_COMMENT = '<!-- Google tag (gtag.js) -->';

function consentDefaultSnippet() {
  return (
    `<!-- ${MARKER}: Consent Mode v2, default denied until consent is granted -->\n` +
    `<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}` +
    `gtag('consent','default',{'ad_storage':'denied','ad_user_data':'denied','ad_personalization':'denied','analytics_storage':'denied','wait_for_update':500});</script>\n`
  );
}

function walk(dir, out) {
  for (const name of readdirSync(dir)) {
    if (['node_modules', '_pagefind', '.git', 'tools'].includes(name)) continue;
    const p = path.join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (name.endsWith('.html')) out.push(p);
  }
  return out;
}

function main() {
  const files = walk(ROOT, []);
  let changed = 0;
  let skipped = 0;
  for (const file of files) {
    let html = readFileSync(file, 'utf-8');
    if (html.includes(MARKER)) { skipped++; continue; }
    if (!html.includes(GOOGLE_TAG_COMMENT)) {
      console.warn(`WARNING: no Google tag comment found, skipped: ${path.relative(ROOT, file)}`);
      continue;
    }
    html = html.replace(GOOGLE_TAG_COMMENT, () => consentDefaultSnippet() + GOOGLE_TAG_COMMENT);

    writeFileSync(file, html, 'utf-8');
    changed++;
  }
  console.log(`Patched: ${changed}, already patched (skipped): ${skipped}`);
}

main();
