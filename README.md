# Breachfolio

**[breachfolio.com](https://breachfolio.com)** — a bilingual (English / Spanish) website about cybersecurity and AI.
It helps everyday users react to scams and account takeovers, and gives learners hands-on labs to practise
real defensive security.

The site is fully static, but the content behind it is fed by automated pipelines with a human approval step,
so it can grow every week without anyone hand-editing HTML.

## What's inside

| Section | What it offers |
|---|---|
| **Guides** | 30+ "what to do now" guides for real situations: phishing link clicked, hacked email or messaging account, fake tech-support, package-delivery, IRS and job-offer scams, AI voice cloning, browser-saved passwords… |
| **Labs** | Step-by-step home labs: building a lab on one laptop, Wazuh SIEM, Suricata IDS, network segmentation with pfSense, testing detections with Atomic Red Team, Metasploitable 2 and DVWA on Docker. |
| **AI** | AI security explained: agentic AI risks, the MCP attack surface, AI red teaming, deepfakes, LLMs for phishing detection. |
| **Cybersecurity / Compare / Resources** | Concepts, tool comparisons and curated resources. |
| **News** | A weekly recap of the most relevant security news. |

Every page exists in English and in Spanish (`/es/`), linked with `hreflang`.

## How it works

### Static site + build scripts
Pages are plain HTML styled with **Tailwind CSS**. A set of Node.js scripts in `tools/` generates
everything that would otherwise be maintained by hand: pagination, "latest articles" lists, XML and HTML
sitemaps, RSS feeds, `llms.txt`, asset versioning, and the injection of the consent banner and ad slots.
**Pagefind** builds a client-side search index, so search works without a server.

### Weekly news recap (n8n + Telegram)
An **n8n** workflow runs every Monday:
1. Reads 12 security RSS feeds (BleepingComputer, The Hacker News, Krebs, CISA advisories…).
2. Removes news already published (checked against **Supabase**) and keeps up to 10 candidates,
   max 3 per source so no outlet dominates.
3. Sends the list to a **Telegram** group with inline buttons; the team picks which ones to publish.
4. The selected items are stored in Supabase, the site JSON is regenerated and committed to GitHub,
   and the group gets a single confirmation message.

### Continuous build
A **GitHub Actions** workflow rebuilds the generated files (CSS, search index, feeds, sitemap) on every push,
so content published by automation is immediately searchable and indexed.

### Quality and SEO
- An editorial standard (`docs/estandar-editorial.md`): a topic is only written if it isn't already covered,
  has real search demand and can compete as a young domain.
- Structured data, Core Web Vitals work, Google Search Console monitoring and several technical SEO audits.
- Lint and fix scripts for articles: broken links, missing image alt text, date mismatches, i18n leaks.

## Tech stack

`HTML` · `Tailwind CSS` · `Node.js` · `Pagefind` · `n8n` · `Telegram Bot API` · `Supabase` ·
`GitHub Actions` · `Hostinger` · `Google Search Console`

## Run locally

```bash
npm install
npm run build
```
Then serve the folder with any static server (e.g. `npx serve .`).

## Credits

Built by Oscar Sierra together with Daniel Asensio.
