# Guide templates — placeholder reference

`guide-en.html` / `guide-es.html` are the canonical article template. Re-synced
2026-07-16 from `guides/sextortion-blackmail-scam/` and its ES pair
(`es/guias/sextorsion-chantaje/`) after the site-wide infra/restructure
(self-hosted fonts instead of Google Fonts CDN, `analytics.js`, `?v=` cache-bust
query strings, Spanish ES section slugs — `ciberseguridad/ia/laboratorio/
comparativas/recursos/noticias`). `es/guias` itself did NOT get renamed. n8n
fills these with a simple string replace, one `{{TOKEN}}` at a time.

## News templates (`news-en.html` / `news-es.html`)

Re-synced 2026-07-16 from `news/sharefile-zero-day-disruption/` and its ES pair
(`es/noticias/zero-day-sharefile/` — note the ES section is `es/noticias/`, not
the old `es/news/`). Same fill mechanism as guides, and now the SAME token
shape too: **`{{TITLE}}` (short SEO `<title>`/og/twitter text, ≤70 chars incl.
" | Breachfolio") is separate from `{{HEADLINE}}`** (the longer editorial H1 /
JSON-LD headline / breadcrumb text) — they used to be conflated into one token
because the first source article happened to have identical text in both
places; a later content-polish pass (commit `f821025`) shortened `<title>`
independently, exposing the gap. Differences vs guides: JSON-LD is
`NewsArticle` (not Article), and the "Go deeper" aside links are static.
Tokens: `{{TITLE}}` `{{HEADLINE}}` `{{DESCRIPTION}}` `{{BREADCRUMB_NAME}}`
`{{HREFLANG_EN_URL}}` `{{HREFLANG_ES_URL}}` (the same-language one doubles as
canonical) `{{OG_IMAGE}}` `{{HERO_IMAGE_REL}}` (hero `<img src>`, same
relative-path convention as guides — no more image-less `.sf-thumb`
placeholder; news now carry a real photo) `{{CATEGORY}}` (must be one of the 6
`data-filter` tokens in `news/index.html`: THREAT RESEARCH / VULNERABILITIES /
AI SECURITY / CLOUD SECURITY / SUPPLY CHAIN / RANSOMWARE) `{{DATE_PUBLISHED}}`
`{{DATE_DISPLAY}}` `{{READ_TIME}}` `{{BODY_HTML}}` (intro `<p>`s + `<h2>`
sections, tags h2/p/ul/ol/li/strong/em/a/code only) `{{SOURCE_URL}}`
`{{SOURCE_NAME}}` (the attribution callout) `{{FAQ_ITEMS_JSON}}` /
`{{FAQ_VISIBLE_HTML}}` (same mechanism as guides, see below — news pages now
carry a visible FAQ + FAQPage JSON-LD too).

Card insertion markers: `news/index.html` and `es/noticias/index.html` have
`<!-- n8n:news-card-insert -->` right after `<div id="cards" ...>` (newest
first). The `ItemList` JSON-LD is anchored on `"itemListElement": [` (never an
HTML comment inside JSON-LD), and `id="sf-count"` must be bumped on insert.

**News = genuine news only.** The News listing and the "from the wire" ribbon
show only real news items (n8n's `news`/`es/noticias` articles, fed by
`data/news.json`). Educational content from other sections (e.g. `cybersecurity/`
SOC/OSINT explainers) does NOT belong in News — it lives in its own section.
The ribbon (`marquee-track`, `data-sf-news`) loads `data/news.json` only. (An
earlier experiment that mirrored `cybersecurity/` "drip" articles into the News
listing was reverted 2026-07-17 — do not reintroduce it.)

Do not add new placeholders without updating `tools/article-lint.mjs` (it
checks the *filled* HTML, not the template, but assumes these exact fields
exist somewhere in the final page — title length, description length, H2
count, etc).

| Placeholder | Filled by | Notes |
|---|---|---|
| `{{TITLE}}` | Gemini | `"<headline> \| Breachfolio"`, 30–70 chars total |
| `{{DESCRIPTION}}` | Gemini | 100–175 chars |
| `{{KEYWORDS}}` | Gemini | comma-separated, no trailing comma |
| `{{HEADLINE}}` | Gemini | JSON-LD `Article.headline`, can differ slightly from `{{TITLE}}` |
| `{{H1}}` | Gemini | visible H1, can differ from `{{HEADLINE}}` |
| `{{SUBTITLE}}` | Gemini | one-sentence lede under H1 |
| `{{TLDR}}` | Gemini | closing callout, one sentence |
| `{{BODY_HTML}}` | Gemini | only `h2 h3 p ul ol li table thead tbody tr th td strong em a code` — no `h1`, the template already has it |
| `{{FAQ_ITEMS_JSON}}` | Gemini | raw JSON array (3–4 items) of `{"@type":"Question","name":...,"acceptedAnswer":{"@type":"Answer","text":...}}` — inserted as-is after `"mainEntity":` |
| `{{FAQ_VISIBLE_HTML}}` | n8n (from `faq_items`) | visible FAQ accordion (`<details class="group/faq">` blocks, markup copied from `guides/check-suspicious-domain/`) built deterministically from the SAME faq_items as the JSON-LD, so they can never drift apart. The `<h2>` heading ("Frequently asked questions" / "Preguntas frecuentes") is static in the template |
| `{{EYEBROW_CATEGORY}}` | n8n (fixed list) | one of: `PAYMENT FRAUD`, `PHISHING`, `ACCOUNT RECOVERY`, `IMPERSONATION`, `DONATION SCAM`, `INVESTMENT SCAM` — must match a `data-filter` button already in `guides/index.html` |
| `{{SLUG}}` | n8n | EN slug, kebab-case, unique — used to build every URL below, not literally present in the template |
| `{{CANONICAL_URL}}` | n8n | `https://breachfolio.com/guides/{{SLUG}}/` (EN) or `https://breachfolio.com/es/guias/{{SLUG_ES}}/` (ES) |
| `{{HREFLANG_ES_URL}}` / `{{HREFLANG_EN_URL}}` | n8n | the other language's canonical, computed from both slugs |
| `{{OG_IMAGE}}` | n8n | `https://breachfolio.com/assets/img/hero-guide-{{SLUG}}.png` — must exist before publish (n8n checks with an HTTP HEAD, see workflow) |
| `{{HERO_IMAGE_REL}}` | n8n | same image, relative path (`../../assets/img/...` EN, `../../../assets/img/...` ES) |
| `{{DATE_PUBLISHED}}` | n8n | `YYYY-MM-DD`, today |
| `{{DATE_DISPLAY}}` | n8n | `"July 9, 2026"` (EN) / `"9 de julio, 2026"` (ES) — derived from `{{DATE_PUBLISHED}}` |
| `{{READ_TIME}}` | n8n | `Math.ceil(words / 220) + " min read"` |
| `{{BREADCRUMB_NAME}}` | Gemini | short (2-5 word) breadcrumb label |
| `{{RELATED_1..3_URL}}` / `{{RELATED_1..3_TITLE}}` | n8n (Supabase query) | **never trust the LLM with real URLs** — n8n picks 3 real existing guides (same lang, most recent) from Supabase `articles` so related links can never 404 |

## FAQ_ITEMS_JSON example

```json
[
  { "@type": "Question", "name": "...", "acceptedAnswer": { "@type": "Answer", "text": "..." } },
  { "@type": "Question", "name": "...", "acceptedAnswer": { "@type": "Answer", "text": "..." } },
  { "@type": "Question", "name": "...", "acceptedAnswer": { "@type": "Answer", "text": "..." } }
]
```
