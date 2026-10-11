# -*- coding: utf-8 -*-
"""One-off: build es/<section>/index.html from <section>/index.html (mechanical
path/hreflang/JSON-LD transform + a translation table for the visible strings
unique to that section). Not meant to be reusable/generic - just gets the
last 2 ES section indexes activated without hand-retyping ~500 lines each."""
import re, sys

def transform(section, translations, title_es, desc_es, filter_map, extra_pairs=()):
    f = f"{section}/index.html"
    html = open(f, encoding="utf-8").read()

    # 1. asset & sitemap paths (section/index.html is 1 level deep; es/section/index.html is 2 levels deep)
    html = html.replace('href="../assets/', 'href="../../assets/')
    html = html.replace('src="../assets/', 'src="../../assets/')
    html = html.replace('href="../sitemap.html"', 'href="../../sitemap.html"')

    # 2. <html> tag
    html = re.sub(r'<html lang="en" data-theme="dark" data-lang="EN"',
                   '<html lang="es" data-theme="dark" data-lang="ES"', html)

    # 3. canonical/og/hreflang -> /es/
    enurl = f"https://breachfolio.com/{section}/index.html"
    esurl = f"https://breachfolio.com/es/{section}/index.html"
    html = html.replace(f'href="{enurl}"', f'href="{esurl}"')
    html = html.replace(f'content="{enurl}"', f'content="{esurl}"')
    # restore the EN hreflang alternate line back to EN (canonical replace above overwrote it too)
    html = html.replace(f'<link rel="alternate" hreflang="en" href="{esurl}" />',
                         f'<link rel="alternate" hreflang="en" href="{enurl}" />')
    html = html.replace(f'<link rel="alternate" hreflang="x-default" href="{esurl}" />',
                         f'<link rel="alternate" hreflang="x-default" href="{enurl}" />')
    html = html.replace('og:locale" content="en_US"', 'og:locale" content="es_ES"')
    html = html.replace('og:locale:alternate" content="es_ES"', 'og:locale:alternate" content="en_US"')

    # 4. ItemList urls -> /es/
    html = re.sub(rf'"url": "https://breachfolio\.dev/{section}/([a-z0-9\-]+\.html)"',
                   rf'"url": "https://breachfolio.com/es/{section}/\1"', html)

    # 5. title/description
    html = re.sub(r'<title>[^<]*</title>', f'<title>{title_es}</title>', html)
    html = re.sub(r'(<meta name="description" content=")[^"]*(")', rf'\1{desc_es}\2', html)
    html = re.sub(r'(<meta property="og:title" content=")[^"]*(")', rf'\1{title_es}\2', html)
    html = re.sub(r'(<meta property="og:description" content=")[^"]*(")', rf'\1{desc_es}\2', html)
    html = re.sub(r'(<meta name="twitter:title" content=")[^"]*(")', rf'\1{title_es}\2', html)
    html = re.sub(r'(<meta name="twitter:description" content=")[^"]*(")', rf'\1{desc_es}\2', html)

    # 6. filter button labels (visible text only, keep data-filter attr values intact)
    for en_label, es_label in filter_map.items():
        html = html.replace(f'>{en_label}</button>', f'>{es_label}</button>')

    # 7. generic UI strings
    generic = {
        '>Newest first<': '>Más recientes primero<',
        '>Oldest first<': '>Más antiguos primero<',
        'data-label-desc="Newest first"': 'data-label-desc="Más recientes primero"',
        'data-label-asc="Oldest first"': 'data-label-asc="Más antiguos primero"',
        '>Previous<': '>Anterior<',
        '>Next<': '>Siguiente<',
        'placeholder="Search Cybersecurity…"': 'placeholder="Buscar en Ciberseguridad…"',
        'placeholder="Search AI…"': 'placeholder="Buscar en IA…"',
        'placeholder="Search Lab…"': 'placeholder="Buscar en Lab…"',
        'placeholder="Search Compare…"': 'placeholder="Buscar en Comparativas…"',
        'placeholder="Search Resources…"': 'placeholder="Buscar en Recursos…"',
        'aria-label="Search Cybersecurity"': 'aria-label="Buscar en Ciberseguridad"',
        'aria-label="Search AI"': 'aria-label="Buscar en IA"',
        'aria-label="Search Lab"': 'aria-label="Buscar en Lab"',
        'aria-label="Search Compare"': 'aria-label="Buscar en Comparativas"',
        'aria-label="Search Resources"': 'aria-label="Buscar en Recursos"',
    }
    for k, v in generic.items():
        html = html.replace(k, v)

    # 8. section-specific visible-string translations (title/excerpt/date/breadcrumb/hero/etc)
    for en, es in translations.items():
        if en not in html:
            print(f"  WARN not found in {section}: {en[:60]!r}")
        html = html.replace(en, es)

    for en, es in extra_pairs:
        html = html.replace(en, es)

    out = f"es/{section}/index.html"
    open(out, "w", encoding="utf-8").write(html)
    print(f"wrote {out} ({len(html)} bytes)")

# ---------------------------------------------------------------- CYBERSECURITY
cyber_translations = {
    '<li><a href="../index.html" class="hover:text-foreground ul-link">Home</a></li><li aria-hidden="true" class="text-muted">/</li><li><span aria-current="page" class="text-foreground">Cybersecurity</span></li>':
    '<li><a href="../index.html" class="hover:text-foreground ul-link">Inicio</a></li><li aria-hidden="true" class="text-muted">/</li><li><span aria-current="page" class="text-foreground">Ciberseguridad</span></li>',
    '<div class="text-[11px] font-mono tracking-[0.22em] text-accent uppercase">Cybersecurity · Knowledge base</div>':
    '<div class="text-[11px] font-mono tracking-[0.22em] text-accent uppercase">Ciberseguridad · Base de conocimiento</div>',
    'Knowledge that <span class="sf-grad">strengthens your defense.</span>':
    'Conocimiento que <span class="sf-grad">fortalece tu defensa.</span>',
    "In-depth guides, analyses and practical insight on threats, vulnerabilities, and the tools security teams rely on. A guided path from foundations to working practice.":
    "Guías en profundidad, análisis y conocimiento práctico sobre amenazas, vulnerabilidades y las herramientas en las que confían los equipos de seguridad. Un camino guiado desde los fundamentos hasta la práctica real.",
    '<div class="font-display text-[16px] font-semibold tracking-tight">Threat Intelligence</div>\n          <p class="text-muted-foreground text-[13px] leading-[1.6]">Adversaries, campaigns and how to think in threats, attacks and risk.</p>':
    '<div class="font-display text-[16px] font-semibold tracking-tight">Inteligencia de amenazas</div>\n          <p class="text-muted-foreground text-[13px] leading-[1.6]">Adversarios, campañas y cómo pensar en términos de amenazas, ataques y riesgo.</p>',
    '<div class="font-display text-[16px] font-semibold tracking-tight">Vulnerabilities</div>\n          <p class="text-muted-foreground text-[13px] leading-[1.6]">Discover, prioritise and understand the flaws that actually matter — OWASP Top 10.</p>':
    '<div class="font-display text-[16px] font-semibold tracking-tight">Vulnerabilidades</div>\n          <p class="text-muted-foreground text-[13px] leading-[1.6]">Descubre, prioriza y entiende los fallos que de verdad importan — OWASP Top 10.</p>',
    '<div class="font-display text-[16px] font-semibold tracking-tight">Web Security</div>\n          <p class="text-muted-foreground text-[13px] leading-[1.6]">Secure web apps and APIs — and the proxies used to test them end to end.</p>':
    '<div class="font-display text-[16px] font-semibold tracking-tight">Seguridad web</div>\n          <p class="text-muted-foreground text-[13px] leading-[1.6]">Asegura apps web y APIs — y los proxies usados para probarlas de principio a fin.</p>',
    '<div class="font-display text-[16px] font-semibold tracking-tight">Networks &amp; Cloud</div>\n          <p class="text-muted-foreground text-[13px] leading-[1.6]">How traffic really flows — IP, TCP, DNS, TLS — and where an attacker can lie.</p>':
    '<div class="font-display text-[16px] font-semibold tracking-tight">Redes y nube</div>\n          <p class="text-muted-foreground text-[13px] leading-[1.6]">Cómo fluye el tráfico de verdad — IP, TCP, DNS, TLS — y dónde puede mentir un atacante.</p>',
    '<div class="font-display text-[16px] font-semibold tracking-tight">Malware &amp; Targets</div>\n          <p class="text-muted-foreground text-[13px] leading-[1.6]">Reverse behaviours safely on intentionally-vulnerable, disposable targets.</p>':
    '<div class="font-display text-[16px] font-semibold tracking-tight">Malware y objetivos</div>\n          <p class="text-muted-foreground text-[13px] leading-[1.6]">Analiza comportamientos con seguridad en objetivos desechables y deliberadamente vulnerables.</p>',
    '<div class="font-display text-[16px] font-semibold tracking-tight">Incident Response</div>\n          <p class="text-muted-foreground text-[13px] leading-[1.6]">Detect, contain and recover — a calm, ordered playbook for the first 24 hours.</p>':
    '<div class="font-display text-[16px] font-semibold tracking-tight">Respuesta a incidentes</div>\n          <p class="text-muted-foreground text-[13px] leading-[1.6]">Detecta, contén y recupera — un manual tranquilo y ordenado para las primeras 24 horas.</p>',
    '<div class="text-[11px] font-mono tracking-[0.22em] text-accent uppercase">Latest insights</div>':
    '<div class="text-[11px] font-mono tracking-[0.22em] text-accent uppercase">Últimas novedades</div>',
    "<h2 class=\"font-display mt-3 text-[clamp(1.5rem,3vw,2rem)] leading-tight tracking-tight font-semibold\">Practical knowledge for today's defenders.</h2>":
    '<h2 class="font-display mt-3 text-[clamp(1.5rem,3vw,2rem)] leading-tight tracking-tight font-semibold">Conocimiento práctico para quienes defienden hoy.</h2>',
    '>May 14, 2026<': '>14 de mayo, 2026<', '>7 min read<': '>7 min de lectura<',
    'Cybersecurity 101: the words that mean what. — illustration': 'Ciberseguridad 101: las palabras que sí significan algo — ilustración',
    '>Cybersecurity 101: the words that mean what.<': '>Ciberseguridad 101: las palabras que sí significan algo.<',
    'Threat, vulnerability, exploit, risk — four words that get used interchangeably, and the one mental model that finally separates them.':
    'Amenaza, vulnerabilidad, exploit, riesgo — cuatro palabras que se usan indistintamente, y el modelo mental que por fin las separa.',
    '>May 10, 2026<': '>10 de mayo, 2026<', '>11 min read<': '>11 min de lectura<',
    'How networks actually work — illustration': 'Cómo funcionan las redes — ilustración',
    '>How networks actually work.<': '>Cómo funcionan las redes.<',
    'IP, TCP, DNS, TLS — traced through a single curl request. What each layer adds, and which ones an attacker can lie at.':
    'IP, TCP, DNS, TLS — trazado a través de una sola petición curl. Qué añade cada capa, y en cuáles puede mentir un atacante.',
    '>May 06, 2026<': '>6 de mayo, 2026<', '>13 min read<': '>13 min de lectura<',
    'Linux fundamentals for security, the working subset. — illustration': 'Fundamentos de Linux para seguridad, el subconjunto práctico — ilustración',
    '>Linux fundamentals for security, the working subset.<': '>Fundamentos de Linux para seguridad, el subconjunto práctico.<',
    'The 25 commands you will type every day, the five you will type in a hurry, and the file permissions that decide who owns the box.':
    'Los 25 comandos que escribirás cada día, los cinco que escribirás con prisa, y los permisos de archivo que deciden quién es dueño de la máquina.',
    '>May 01, 2026<': '>1 de mayo, 2026<', '>9 min read<': '>9 min de lectura<',
    'Cryptography you can actually use. — illustration': 'Criptografía que sí puedes usar — ilustración',
    '>Cryptography you can actually use.<': '>Criptografía que sí puedes usar.<',
    'Hashing vs encryption, symmetric vs asymmetric, and the three primitives you should reach for before rolling your own anything.':
    'Hashing frente a cifrado, simétrico frente a asimétrico, y las tres primitivas a las que recurrir antes de inventarte nada.',
    '>April 26, 2026<': '>26 de abril, 2026<', '>15 min read<': '>15 min de lectura<',
    'Threat modeling with STRIDE — illustration': 'Modelado de amenazas con STRIDE — ilustración',
    '>Threat modeling with STRIDE.<': '>Modelado de amenazas con STRIDE.<',
    'We pick a tiny web app and walk it through STRIDE, then write the prompt that gets an LLM to do 60% of the same work as a reviewer.':
    'Elegimos una app web diminuta y la recorremos con STRIDE, y luego escribimos el prompt que hace que un LLM haga el 60% del trabajo de un revisor.',
    'How to start in cybersecurity: the real roadmap. — illustration': 'Cómo empezar en ciberseguridad: el roadmap real — ilustración',
    '>How to start in cybersecurity: the real roadmap.<': '>Cómo empezar en ciberseguridad: el roadmap real.<',
    'The learning order that actually works, the official roadmap.sh path worth following, and the real job roles waiting at the other end.':
    'El orden de aprendizaje que de verdad funciona, el roadmap oficial de roadmap.sh que vale la pena seguir, y los puestos de trabajo reales al otro lado.',
    'Red team, blue team, purple team explained. — illustration': 'Equipo rojo, azul y morado explicado — ilustración',
    '>Red team, blue team, purple team.<': '>Equipo rojo, azul y morado.<',
    'Red attacks, blue defends, purple closes the loop between them. What each one actually does day to day, and how they map to real roles.':
    'El rojo ataca, el azul defiende, el morado cierra el círculo entre ambos. Qué hace cada uno en el día a día, y cómo se traduce en puestos reales.',
    'How to actually learn cybersecurity. — illustration': 'Cómo aprender ciberseguridad de verdad — ilustración',
    '>How to actually learn cybersecurity.<': '>Cómo aprender ciberseguridad de verdad.<',
    'Why tutorial-hell happens, what active learning looks like in this field, and a weekly rhythm that survives past month two.':
    'Por qué ocurre el infierno de los tutoriales, cómo es el aprendizaje activo en este campo, y un ritmo semanal que sobrevive más allá del segundo mes.',
    'AI in cybersecurity: attack and defense — illustration': 'IA en ciberseguridad: ataque y defensa — ilustración',
    '>Continue your path<': '>Continúa tu camino<',
    '>AI in cybersecurity: attack and defense →<': '>IA en ciberseguridad: ataque y defensa →<',
    "Where artificial intelligence actually shows up in a defender's day-to-day — its own sub-pillar, worth a dedicated visit.":
    'Dónde aparece de verdad la inteligencia artificial en el día a día de quien defiende — su propio sub-pilar, que merece una visita aparte.',
    '>No guides match this filter yet. <': '>Ningún artículo coincide con este filtro todavía. <',
    '>Clear filters<': '>Limpiar filtros<',
}
transform("cybersecurity", cyber_translations,
    "Ciberseguridad — De cero a profesional en activo | Breachfolio",
    "Un camino guiado de ciberseguridad desde los fundamentos hasta la práctica real. Vocabulario, redes, Linux, criptografía, modelado de amenazas. Práctico, gratuito.",
    {"ALL":"TODOS","LEVEL 1":"NIVEL 1","LEVEL 2":"NIVEL 2","LEVEL 3":"NIVEL 3"})

# ---------------------------------------------------------------- COMPARE
compare_translations = {
    '<li><a href="../index.html" class="hover:text-foreground ul-link">Home</a></li><li aria-hidden="true" class="text-muted">/</li><li><span aria-current="page" class="text-foreground">Compare</span></li>':
    '<li><a href="../index.html" class="hover:text-foreground ul-link">Inicio</a></li><li aria-hidden="true" class="text-muted">/</li><li><span aria-current="page" class="text-foreground">Comparativas</span></li>',
    '<div class="text-[11px] font-mono tracking-[0.22em] text-accent uppercase">Compare · Tool-by-tool</div>':
    '<div class="text-[11px] font-mono tracking-[0.22em] text-accent uppercase">Comparativas · Herramienta contra herramienta</div>',
    'Security tooling, <span class="sf-grad">head to head.</span>':
    'Herramientas de seguridad, <span class="sf-grad">cara a cara.</span>',
    'Reproducible benchmarks of the offensive- and defensive-security tools practitioners actually argue about. Every score is versioned. Every test plan is published — no paid placement, ever.':
    'Comparativas reproducibles de las herramientas ofensivas y defensivas sobre las que de verdad discuten los profesionales. Cada puntuación está versionada. Cada plan de pruebas está publicado — nunca hay colocación pagada.',
    '>April 30, 2026<': '>30 de abril, 2026<', '>8 min read<': '>8 min de lectura<',
    "A /24 sweep, a /16 sweep, then a hostile /8. Where Nmap&#x27;s service detection earns its seconds, and where Masscan stops being a footgun.":
    "Un barrido /24, uno /16, y luego un /8 hostil. Dónde la detección de servicios de Nmap se gana sus segundos, y dónde Masscan deja de ser un arma de doble filo.",
    '>Nmap vs Masscan: accuracy versus raw throughput.<': '>Nmap vs Masscan: precisión frente a rendimiento bruto.<',
    '>April 22, 2026<': '>22 de abril, 2026<', '>10 min read<': '>10 min de lectura<',
    "Eight deliberately-broken apps, both proxies driven by the same playbook. Manual testing ergonomics, extension surface, and the price of &#x27;free&#x27;.":
    "Ocho apps deliberadamente rotas, ambos proxies siguiendo el mismo guion. Ergonomía de pruebas manuales, superficie de extensiones, y el precio de lo 'gratis'.",
    '>Burp Suite vs OWASP ZAP: pays its rent?<': '>Burp Suite vs OWASP ZAP: ¿se gana el sueldo?<',
    '>April 14, 2026<': '>14 de abril, 2026<',
    "When you reach for a GUI, when you reach for a CLI, and how to make them work together in real incident response.":
    "Cuándo recurrir a una GUI, cuándo a una CLI, y cómo hacer que trabajen juntas en una respuesta a incidentes real.",
    '>Wireshark vs tcpdump: pick the right tool.<': '>Wireshark vs tcpdump: elige la herramienta correcta.<',
    '>March 28, 2026<': '>28 de marzo, 2026<',
    "The boring choice that costs hours: which distro is least painful as a daily driver, not just for a CTF screenshot.":
    "La decisión aburrida que cuesta horas: qué distro duele menos como uso diario, no solo para una captura de un CTF.",
    '>Kali Linux vs Parrot OS: the daily-driver test.<': '>Kali Linux vs Parrot OS: la prueba del uso diario.<',
    '>March 14, 2026<': '>14 de marzo, 2026<', '>11 min read<': '>11 min de lectura<',
    "An ageing classic against the modern Go-native challenger. Exploit library, listener ergonomics, and how each one survives a tuned EDR.":
    "Un clásico que envejece frente al retador moderno nativo en Go. Biblioteca de exploits, ergonomía de listeners, y cómo sobrevive cada uno a un EDR afinado.",
    '>Metasploit vs Sliver: post-exploitation frameworks in 2026.<': '>Metasploit vs Sliver: frameworks de post-explotación en 2026.<',
    '>July 08, 2026<': '>8 de julio, 2026<',
    'Three genuinely different cost models wearing the same "SIEM" label. The right pick depends on budget and team size, not a feature checklist.':
    'Tres modelos de coste genuinamente distintos bajo la misma etiqueta de "SIEM". La elección correcta depende del presupuesto y el tamaño del equipo, no de una lista de funciones.',
    '>Splunk vs Wazuh vs ELK: which SIEM fits your budget.<': '>Splunk vs Wazuh vs ELK: qué SIEM encaja con tu presupuesto.<',
    "Snort defined the rules format the whole industry still writes in. Suricata rebuilt the engine underneath it for modern multi-core hardware.":
    "Snort definió el formato de reglas en el que toda la industria sigue escribiendo. Suricata reconstruyó el motor por debajo para el hardware moderno multinúcleo.",
    '>Snort vs Suricata: the other IDS debate.<': '>Snort vs Suricata: el otro debate de IDS.<',
    "A polished commercial plugin feed against a free, community-driven one. The real difference shows up in accuracy, setup time, and audits.":
    "Un feed de plugins comercial y pulido frente a uno libre y comunitario. La diferencia real se nota en la precisión, el tiempo de puesta en marcha y las auditorías.",
    '>Tenable Nessus vs OpenVAS: scanners head to head.<': '>Tenable Nessus vs OpenVAS: escáneres cara a cara.<',
    '>No tools match this filter yet.<': '>Ninguna herramienta coincide con este filtro todavía.<',
}
transform("compare", compare_translations,
    "Comparativas — Herramientas de seguridad cara a cara | Breachfolio",
    "Comparativas reproducibles de las herramientas ofensivas y defensivas de las que hablan los profesionales. Cada puntuación versionada, cada plan de pruebas publicado.",
    {"ALL":"TODOS","SCANNERS":"ESCÁNERES"})

