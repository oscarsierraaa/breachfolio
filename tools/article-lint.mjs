#!/usr/bin/env node
/*
  Breachfolio — article-lint.mjs

  Validates a *filled* guide/article HTML page (not the template) against the
  structural + SEO conventions already used across the site's 111+ articles:
  title/description length, H1/H2 hierarchy, real lists/tables, JSON-LD that
  actually parses, a 3-4 item FAQPage, a closed document, no mojibake.

  Scoped to the guides/ template family (the one the n8n automation
  generates) — it locates the body via the exact markers used in
  tools/templates/guide-{en,es}.html, so running it against articles from
  other sections (cybersecurity/, ai/, etc., which use an older template
  without the TL;DR callout) will report a marker-not-found error, not a
  real defect.

  Usage: node tools/article-lint.mjs path/to/index.html [more.html ...]
  Exits 1 if any file fails.

  IMPORTANT: `lintArticle()` below is intentionally framework-free (only
  string/regex/JSON builtins, no `fs`/`import`) so it can be pasted verbatim
  into the n8n Code node that validates Gemini's output before a guide is
  ever shown for approval — n8n cloud can't `import` this file directly, so
  the same function lives in two places on purpose. Keep them identical.
*/

const BODY_START = '<div class="max-w-prose mx-auto prose-content text-[16px] leading-[1.8] text-foreground">';
const BODY_END = '<div class="mt-10 rounded-card border border-accent/20 bg-accent/5';
const TAG_WHITELIST = ['h2', 'h3', 'p', 'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'strong', 'em', 'a', 'code', 'div', 'br'];
const MOJIBAKE_SUBSTRINGS = ['Ã©', 'Ã³', 'Ã±', 'Ã­', 'Ã¡', 'Ãº', 'â€', 'Â¿', 'Â¡', '�'];

function lintArticle(html) {
  const errors = [];
  const warnings = [];

  // --- document shape ---
  if (!html.trim().endsWith('</html>')) {
    errors.push('Document does not end with </html> — likely truncated mid-generation.');
  }
  const htmlOpenCount = (html.match(/<html[ >]/g) || []).length;
  const htmlCloseCount = (html.match(/<\/html>/g) || []).length;
  if (htmlOpenCount !== 1 || htmlCloseCount !== 1) {
    errors.push(`Expected exactly one <html>/</html> pair, found ${htmlOpenCount} open / ${htmlCloseCount} close.`);
  }

  for (const bad of MOJIBAKE_SUBSTRINGS) {
    if (html.includes(bad)) {
      errors.push(`Mojibake detected: contains "${bad}" — check source encoding (UTF-8, no re-decode as cp1252/Windows-1252).`);
      break;
    }
  }

  // --- title / description ---
  const titleMatch = html.match(/<title>([^<]*)<\/title>/);
  if (!titleMatch) {
    errors.push('Missing <title>.');
  } else {
    const len = titleMatch[1].length;
    if (len < 30 || len > 70) errors.push(`<title> is ${len} chars, expected 30-70.`);
  }

  const descMatch = html.match(/<meta name="description" content="([^"]*)"/);
  if (!descMatch) {
    errors.push('Missing meta description.');
  } else {
    const len = descMatch[1].length;
    if (len < 100 || len > 175) errors.push(`meta description is ${len} chars, expected 100-175.`);
  }

  // --- JSON-LD blocks all parse, and FAQPage has 3-4 questions ---
  const ldBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (ldBlocks.length === 0) {
    errors.push('No JSON-LD script blocks found.');
  }
  let faqCount = null;
  for (const [, raw] of ldBlocks) {
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      errors.push(`A JSON-LD block failed to parse: ${e.message}`);
      continue;
    }
    const graph = parsed['@graph'] || [parsed];
    for (const node of graph) {
      if (node['@type'] === 'FAQPage' && Array.isArray(node.mainEntity)) {
        faqCount = node.mainEntity.length;
      }
    }
  }
  if (faqCount === null) {
    errors.push('No FAQPage.mainEntity found in JSON-LD.');
  } else if (faqCount < 3 || faqCount > 4) {
    errors.push(`FAQPage has ${faqCount} questions, expected 3-4.`);
  }

  // --- H1 (exactly one, outside the generated body) ---
  const h1Count = (html.match(/<h1[ >]/g) || []).length;
  if (h1Count !== 1) errors.push(`Expected exactly one <h1>, found ${h1Count}.`);

  // --- generated body content ---
  const startIdx = html.indexOf(BODY_START);
  const endIdx = html.indexOf(BODY_END);
  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    errors.push('Could not locate the article body between the prose-content wrapper and the TL;DR callout — template markers missing or reordered.');
  } else {
    const body = html.slice(startIdx + BODY_START.length, endIdx);

    const words = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
    if (words.length < 800) errors.push(`Body is ${words.length} words, expected >= 800.`);

    if (/<h1[ >]/.test(body)) errors.push('Body contains an <h1> — the template already renders the H1, the generated body must not.');
    const h2Count = (body.match(/<h2[ >]/g) || []).length;
    if (h2Count < 2) errors.push(`Body has ${h2Count} <h2>, expected >= 2.`);
    if (/<h[4-6][ >]/.test(body)) errors.push('Body uses <h4>/<h5>/<h6> — only <h2>/<h3> are allowed.');

    // h3 must not appear before the first h2 (no hierarchy skip)
    const firstH2 = body.search(/<h2[ >]/);
    const firstH3 = body.search(/<h3[ >]/);
    if (firstH3 !== -1 && (firstH2 === -1 || firstH3 < firstH2)) {
      errors.push('A <h3> appears before any <h2> — broken heading hierarchy.');
    }

    const hasList = /<(ul|ol)[ >]/.test(body);
    const hasTable = /<table[ >]/.test(body);
    if (!hasList && !hasTable) errors.push('Body has no <ul>/<ol>/<table> — at least one list or table is required.');

    // tag whitelist
    const tagsUsed = [...body.matchAll(/<\/?([a-z0-9]+)(?:\s|>|\/)/gi)].map((m) => m[1].toLowerCase());
    const disallowed = [...new Set(tagsUsed)].filter((t) => !TAG_WHITELIST.includes(t));
    if (disallowed.length) errors.push(`Body uses disallowed tags: ${disallowed.join(', ')}.`);

    // table structure: thead+tbody present, consistent column counts
    const tables = [...body.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/g)];
    for (const [i, [, tableInner]] of tables.entries()) {
      const thead = tableInner.match(/<thead>([\s\S]*?)<\/thead>/);
      const tbody = tableInner.match(/<tbody>([\s\S]*?)<\/tbody>/);
      if (!thead || !tbody) {
        errors.push(`Table ${i + 1} is missing <thead> or <tbody>.`);
        continue;
      }
      const headCols = (thead[1].match(/<th[ >]/g) || []).length;
      const bodyRows = [...tbody[1].matchAll(/<tr>([\s\S]*?)<\/tr>/g)];
      if (bodyRows.length === 0) errors.push(`Table ${i + 1} has no rows in <tbody>.`);
      for (const [j, [, rowInner]] of bodyRows.entries()) {
        const cols = (rowInner.match(/<td[ >]/g) || []).length;
        if (cols === 0) errors.push(`Table ${i + 1}, row ${j + 1} has no <td> cells.`);
        else if (headCols && cols !== headCols) {
          warnings.push(`Table ${i + 1}, row ${j + 1} has ${cols} cells, header has ${headCols}.`);
        }
      }
    }

    // dead links: href="#" or javascript:
    const hrefs = [...body.matchAll(/<a[^>]*href="([^"]*)"/g)].map((m) => m[1]);
    for (const href of hrefs) {
      if (href === '#' || href.startsWith('javascript:')) {
        errors.push(`Body contains a dead/placeholder link: href="${href}".`);
      }
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}

// --- CLI wrapper (Node-only, not part of the n8n-pasted function above) ---
const files = process.argv.slice(2);
if (files.length > 0) {
  const { readFileSync } = await import('node:fs');
  let anyFailed = false;
  for (const file of files) {
    const html = readFileSync(file, 'utf8');
    const { ok, errors, warnings } = lintArticle(html);
    if (ok) {
      console.log(`OK   ${file}${warnings.length ? ` (${warnings.length} warning(s))` : ''}`);
      for (const w of warnings) console.log(`  ⚠ ${w}`);
    } else {
      anyFailed = true;
      console.log(`FAIL ${file}`);
      for (const e of errors) console.log(`  ✗ ${e}`);
      for (const w of warnings) console.log(`  ⚠ ${w}`);
    }
  }
  process.exit(anyFailed ? 1 : 0);
}

export { lintArticle };
