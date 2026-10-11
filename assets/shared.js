/*
  Breachfolio — shared theme + i18n for every page (React or static HTML).
  Loaded as a normal <script src="…/assets/shared.js"></script>.

  Exposes window.SF.* helpers:
    - SF.getTheme() / SF.setTheme('dark'|'light')
    - SF.getLang()  / SF.setLang('EN'|'ES'|'FR')
    - SF.applyI18n(root?) — swaps every [data-i18n="key"] element's text
    - SF.t(key)
    - SF.mountChrome(rootEl) — drops a translation/theme toolbar into static pages
    - SF.translations — the full dictionary so React can read from it

  Theme strategy: a `data-theme` attribute on <html>. CSS variables flip.
  Lang strategy: `data-lang` attribute on <html> + an event 'sf:lang' for React.
*/
(function () {
  'use strict';
  const LS_THEME = 'sf-theme';
  const LS_LANG  = 'sf-lang';

  // ─── Translations ─────────────────────────────────────────────────────────
  // Only UI labels and section copy that everyone sees. Long article bodies
  // stay in English — translating 12k-word lab write-ups belongs to a real
  // translation tool, not a hand-maintained dictionary.
  const T = {
    EN: {
      // Nav
      'nav.home':       'Home',
      'nav.tools':      'Compare',
      'nav.guides':     'Guides',
      'nav.ai':         'AI Security',
      'nav.blog':       'Blog',
      'nav.about':      'About',
      'nav.new':        'NEW',
      'nav.subscribe':  'Subscribe',
      'nav.getProtected': 'Get Protected',
      'nav.theme.dark': 'Dark mode',
      'nav.theme.light':'Light mode',
      'nav.body.note':  'Article body stays in English.',

      // Hero (home)
      'hero.eyebrow':   'PRACTICAL · CLEAR · ACCESSIBLE',
      'hero.title.l1':  'Cybersecurity for',
      'hero.title.l2':  'real-world threats.',
      'hero.sub':       'Learn how to detect phishing, recover hacked accounts, analyze suspicious domains and protect your digital life. Plus practical AI security education, tool comparisons and technical labs — step-by-step content designed for you to learn by applying real knowledge.',
      'hero.cta1':      'Start with cybersecurity',
      'hero.cta2':      'See the Guides',
      'hero.trust':     'Free to read. Privacy-respecting. No tracking pixels in your inbox.',

      // Interactive fake-hack terminal (home)
      'term.eyebrow':   'DEMO · YOUR FOOTPRINT, ATTACKER’S VIEW',
      'term.title':     'Look at your own machine the way an attacker would.',
      'term.body1':     'This is a harmless simulation. The IP shown is your own — fetched from a public lookup, never stored, never sent anywhere by Breachfolio. The commands and output are fake. The takeaway is real: this is roughly what a portscan, an ARP probe, and a whois of your address actually return.',
      'term.body2':     'If watching this makes you uncomfortable, you’re learning. That’s exactly how the start of a real attack feels for everyone — until you understand it. Then it’s just data.',
      'term.cta1':      'Learn how this works →',
      'term.cta2':      'What we do with your data',
      'term.note':      '100% local simulation · No data is sent · No real exploit runs',

      // Problem
      'problem.eyebrow':'THE PROBLEM',
      'problem.title':  'Most security comparisons are written by the vendors being compared.',
      'problem.body':   'Buyer guides cite Gartner. Gartner cites the vendors. Vendors cite each other. The same five marketing claims circulate for years, untested, while breach reports keep landing on the same misconfigurations. Security teams deserve an evaluation layer that does not answer to a product team — and that shows its work when it disagrees with the consensus.',

      // Solution
      'solution.eyebrow':   'HOW BREACHFOLIO IS DIFFERENT',
      'solution.title':     'Three things we will not negotiate on.',
      'solution.1.title':   'Tested, not summarised.',
      'solution.1.body':    'Every comparison is grounded in hands-on lab work — Atomic Red Team coverage, real network captures, configurable detections — and the raw artefacts are linked at the bottom of every article.',
      'solution.2.title':   'No paid placement.',
      'solution.2.body':    'Our revenue is the newsletter and clearly-labelled display advertising sold through a third-party network. Vendors cannot pay for a rating, a quadrant position, or an editorial mention. Disclosures are on every page.',
      'solution.3.title':   'Reproducible methodology.',
      'solution.3.body':    'Every score has a version number. When the test plan changes, we re-run prior comparisons and publish the diff. You can audit how a tool was scored eighteen months ago and why the number is different today.',

      // Tools (compare) section
      'tools.eyebrow':  'TOOLS',
      'tools.title':    'Tooling, head to head.',
      'tools.sub':      'Reproducible benchmarks of the offensive- and defensive-security tools practitioners actually argue about.',
      'tools.cta':      'Read comparison',
      'tools.seeAll':   'See all 5 comparisons',

      // Guides (learn) section
      'guides.eyebrow': 'GUIDES',
      'guides.title':   'Cybersecurity, from zero.',
      'guides.sub':     'A guided path. Start with the foundations — vocabulary, networks, the shell. Climb up to the tools, the prompts, and the playbooks security teams actually use.',
      'guides.seeAll':  'See all 5 guides',

      // Newsletter
      'news.eyebrow':   'WEEKLY DIGEST',
      'news.title':     'Get the weekly digest.',
      'news.sub':       'One Tuesday email. The week’s most important security comparisons, the analysis that did not make it onto the site, and a short note on the test plan we are running next. Free, no tracking pixels.',
      'news.placeholder':'work@email.com',
      'news.cta':       'Subscribe',
      'news.note':      'We will never sell, share, or rent your address. One-click unsubscribe in every email.',
      'news.invalid':   'Please enter a valid email address.',
      'news.done':      'Confirmation email sent. Check your inbox.',
      'news.submitting':'Subscribing…',
      'news.subscribed':'Subscribed',

      // AI Security page
      'ai.eyebrow':     'UPDATED · JULY 2026',
      'ai.title.l1':    'AI &',
      'ai.title.l2':    'Cybersecurity.',
      'ai.sub':         'How artificial intelligence is reshaping both attack and defense — and what you need to know right now.',
      'ai.tab.defense': 'Defense Tools',
      'ai.tab.offense': 'Offensive AI',
      'ai.signals':     'LIVE · AI SECURITY SIGNALS',
      'ai.feed':        'View feed',
      'ai.how.eyebrow': 'HOW IT WORKS',
      'ai.how.title':   'From signal to response — in under a second',
      'ai.how.sub':     'What an AI-native defense platform does between the first packet of an attack and the moment it’s contained.',
      'ai.how.s1.t':    'Ingest',
      'ai.how.s1.b':    'Logs, packets, endpoint telemetry, identity events. Normalised to a common schema. Time-aligned across every source.',
      'ai.how.s2.t':    'Score',
      'ai.how.s2.b':    'A model trained on labelled incidents assigns a confidence score to each chain of events. False-positive rates are calibrated weekly.',
      'ai.how.s3.t':    'Decide',
      'ai.how.s3.b':    'Above the threshold, contain. Below it, alert. The boundary is auditable, versioned, and explainable to a regulator.',
      'ai.how.s4.t':    'Respond',
      'ai.how.s4.b':    'Isolate the host. Revoke the token. Quarantine the inbox. The response playbook runs autonomously inside a documented blast radius.',

      // Index pages
      'learn.idx.eyebrow': 'GUIDES · STRUCTURED PATH',
      'learn.idx.title':   'Cybersecurity, from zero to working practitioner.',
      'learn.idx.sub':     'A guided path. Start with the foundations — vocabulary, networks, the shell. Climb up to the tools, the prompts, and the playbooks that security teams actually use day to day.',
      'learn.idx.l1':      'Level 1 · Foundations',
      'learn.idx.l2':      'Level 2 · Working tools',
      'learn.idx.l3':      'Level 3 · Methods & prompts',
      'compare.idx.eyebrow':'TOOLS · TOOL-BY-TOOL',
      'compare.idx.title':  'Security tooling, head to head.',
      'compare.idx.sub':    'Reproducible benchmarks of the offensive- and defensive-security tools practitioners actually argue about. Every score is versioned. Every test plan is published.',

      // Article meta
      'art.toc':        'On this page',
      'art.related':    'Related',
      'art.prev':       'Previous',
      'art.next':       'Next',
      'art.newsletter': 'Newsletter',
      'art.newsletter.b':'Tuesday digest. The week’s most important comparisons. Free.',
      'art.newsletter.cta':'Subscribe →',
      'art.research':   'Breachfolio Research',
      'art.section.guides': 'GUIDES',
      'art.section.tools':  'TOOLS',
      'art.bodyNote':   'Article body is in English. Localised versions are on the roadmap.',

      // Footer
      'foot.tagline':   'Learn AI and cybersecurity from zero. Practical, clear, up to date. Tech education accessible to everyone.',
      'foot.sections':  'Sections',
      'foot.legal':     'Legal',
      'foot.copy':      '© 2026 Breachfolio. Independent security writing — all sources disclosed.',
      'foot.method':    'Methodology',
      'foot.disc':      'Disclosures',
      'foot.priv':      'Privacy',
      'foot.news':      'Newsletter',
      'foot.about':     'About',
      'foot.privacy':   'Privacy',
      'foot.terms':     'Terms',
      'foot.cookies':   'Cookies',
      'foot.contact':   'Contact',
      'foot.learn':     'Learn',
      'foot.explore':   'Explore',
      'foot.sitemap':   'Site map',

      // Accessibility
      'a11y.skip':      'Skip to content',

      // Nav items
      'nav.prompts':    'Prompts',
      'nav.cyber':      'Cybersecurity',
      'nav.lab':        'Lab',
      'nav.news':       'News',
      'nav.resources':  'Resources',
      'nav.guides':     'Guides',
      'foot.guides':    'Guides',

      // Home · bloque Latest (data/news.json)
      'latest.kicker':  'Latest',
      'latest.title':   'Fresh from the wire.',
      'latest.all':     'All news →',

      // Sitemap human page
      'sitemap.eyebrow': 'SITE MAP',
      'sitemap.title':   'Every page on Breachfolio.',
      'sitemap.sub':     'Looking for something specific? Use this directory of every page on the site, grouped by section. There is also a machine-readable XML sitemap for crawlers.',
      'sitemap.home.label':       'Home',
      'sitemap.ai.label':         'AI',
      'sitemap.prompts.label':    'Prompts',
      'sitemap.compare.label':    'Compare',
      'sitemap.cyber.label':      'Cybersecurity',
      'sitemap.lab.label':        'Lab',
      'sitemap.news.label':       'News',
      'sitemap.resources.label':  'Resources',
      'sitemap.legal.label':      'Legal & info',
      'sitemap.es.label':         'Español',
      'sitemap.note':    'Missing something? This page is updated by hand alongside every publish. If you find a stale link or a missing page, please get in touch.',
    },

    ES: {
      'nav.home':       'Inicio',
      'nav.tools':      'Comparativas',
      'nav.guides':     'Guías',
      'nav.ai':         'IA & Seguridad',
      'nav.blog':       'Blog',
      'nav.about':      'Nosotros',
      'nav.new':        'NUEVO',
      'nav.subscribe':  'Suscribirse',
      'nav.getProtected':'Protégete',
      'nav.theme.dark': 'Modo oscuro',
      'nav.theme.light':'Modo claro',
      'nav.body.note':  'El cuerpo de los artículos sigue en inglés.',

      'hero.eyebrow':   'PRÁCTICO · CLARO · ACCESIBLE',
      'hero.title.l1':  'Ciberseguridad para',
      'hero.title.l2':  'amenazas reales.',
      'hero.sub':       'Aprende a detectar phishing, recuperar cuentas hackeadas, analizar dominios sospechosos y proteger tu vida digital. Además de educación práctica en seguridad de IA, comparativas de herramientas y laboratorios técnicos.',
      'hero.cta1':      'Empieza por ciberseguridad',
      'hero.cta2':      'Ver las Guías',
      'hero.trust':     'Gratis. Respeta tu privacidad. Sin píxeles de seguimiento en tu correo.',

      'term.eyebrow':   'DEMO · TU HUELLA, VISTA POR UN ATACANTE',
      'term.title':     'Mira tu propia máquina como la vería un atacante.',
      'term.body1':     'Es una simulación inofensiva. La IP que se muestra es la tuya — obtenida desde un servicio público de consulta, nunca almacenada, nunca enviada a ningún servidor de Breachfolio. Los comandos y la salida son falsos. La lección es real: así de poco hace falta para mapear una dirección IP.',
      'term.body2':     'Si verlo te incomoda, estás aprendiendo. Así se siente el inicio de un ataque real para todo el mundo — hasta que lo entiendes. Entonces son solo datos.',
      'term.cta1':      'Aprende cómo funciona →',
      'term.cta2':      'Qué hacemos con tus datos',
      'term.note':      'Simulación 100% local · No se envía ningún dato · No se ejecuta ningún exploit real',

      'problem.eyebrow':'EL PROBLEMA',
      'problem.title':  'La mayoría de comparativas las escribe el propio fabricante comparado.',
      'problem.body':   'Las guías citan a Gartner. Gartner cita a los fabricantes. Los fabricantes se citan entre sí. Las mismas cinco frases de marketing circulan durante años, sin verificar, mientras los informes de brechas siguen aterrizando sobre las mismas malas configuraciones. Los equipos de seguridad merecen una capa de evaluación que no rinda cuentas a un equipo de producto — y que muestre su trabajo cuando se aparta del consenso.',

      'solution.eyebrow':'CÓMO ES DIFERENTE BREACHFOLIO',
      'solution.title':  'Tres cosas que no negociamos.',
      'solution.1.title':'Probado, no resumido.',
      'solution.1.body': 'Cada comparativa está basada en trabajo de laboratorio — cobertura de Atomic Red Team, capturas reales de red, detecciones configurables — y los artefactos brutos están enlazados al final de cada artículo.',
      'solution.2.title':'Sin colocación pagada.',
      'solution.2.body': 'Nuestros ingresos son la newsletter y publicidad gráfica claramente etiquetada vendida vía red externa. Ningún fabricante puede pagar por una puntuación, un cuadrante o una mención editorial. Las divulgaciones están en cada página.',
      'solution.3.title':'Metodología reproducible.',
      'solution.3.body': 'Cada puntuación tiene una versión. Cuando cambia el plan de pruebas, repetimos las comparativas anteriores y publicamos el diff. Puedes auditar cómo se puntuó una herramienta hace 18 meses y por qué el número es diferente hoy.',

      'tools.eyebrow':  'HERRAMIENTAS',
      'tools.title':    'Herramientas, frente a frente.',
      'tools.sub':      'Benchmarks reproducibles de las herramientas ofensivas y defensivas sobre las que los profesionales realmente discuten.',
      'tools.cta':      'Leer comparativa',
      'tools.seeAll':   'Ver las 5 comparativas',

      'guides.eyebrow': 'GUÍAS',
      'guides.title':   'Ciberseguridad, desde cero.',
      'guides.sub':     'Un camino guiado. Empieza por las bases — vocabulario, redes, la shell. Sube hasta las herramientas, los prompts y los manuales que los equipos de seguridad usan a diario.',
      'guides.seeAll':  'Ver las 5 guías',

      'news.eyebrow':   'BOLETÍN SEMANAL',
      'news.title':     'Recíbelo cada martes.',
      'news.sub':       'Un email los martes. Las comparativas más importantes de la semana, el análisis que no entró en la web, y una nota sobre el próximo plan de pruebas. Gratis, sin píxeles de seguimiento.',
      'news.placeholder':'tu@correo.com',
      'news.cta':       'Suscribirse',
      'news.note':      'Nunca venderemos, compartiremos ni alquilaremos tu dirección. Un clic para darte de baja en cada email.',
      'news.invalid':   'Introduce una dirección de correo válida.',
      'news.done':      'Correo de confirmación enviado. Revisa tu bandeja.',
      'news.submitting':'Suscribiendo…',
      'news.subscribed':'Suscrito',

      'ai.eyebrow':     'ACTUALIZADO · JULIO 2026',
      'ai.title.l1':    'IA &',
      'ai.title.l2':    'Ciberseguridad.',
      'ai.sub':         'Cómo la inteligencia artificial está reformando el ataque y la defensa — y lo que necesitas saber ahora.',
      'ai.tab.defense': 'Herramientas de defensa',
      'ai.tab.offense': 'IA ofensiva',
      'ai.signals':     'EN VIVO · SEÑALES IA',
      'ai.feed':        'Ver feed',
      'ai.how.eyebrow': 'CÓMO FUNCIONA',
      'ai.how.title':   'De la señal a la respuesta — en menos de un segundo',
      'ai.how.sub':     'Lo que hace una plataforma de defensa basada en IA entre el primer paquete de un ataque y el momento en que está contenido.',
      'ai.how.s1.t':    'Ingerir',
      'ai.how.s1.b':    'Logs, paquetes, telemetría de endpoint, eventos de identidad. Normalizados a un esquema común. Alineados en el tiempo.',
      'ai.how.s2.t':    'Puntuar',
      'ai.how.s2.b':    'Un modelo entrenado sobre incidentes etiquetados asigna una puntuación a cada cadena de eventos. Falsos positivos calibrados semanalmente.',
      'ai.how.s3.t':    'Decidir',
      'ai.how.s3.b':    'Por encima del umbral, contener. Por debajo, alertar. La frontera es auditable, versionada y explicable a un regulador.',
      'ai.how.s4.t':    'Responder',
      'ai.how.s4.b':    'Aislar la máquina. Revocar el token. Poner en cuarentena el buzón. El playbook se ejecuta de forma autónoma dentro de un radio definido.',

      'learn.idx.eyebrow': 'GUÍAS · RUTA ESTRUCTURADA',
      'learn.idx.title':   'Ciberseguridad, de cero a profesional en activo.',
      'learn.idx.sub':     'Un camino guiado. Empieza por las bases — vocabulario, redes, la shell. Sube hasta las herramientas, los prompts y los manuales que los equipos de seguridad usan a diario.',
      'learn.idx.l1':      'Nivel 1 · Fundamentos',
      'learn.idx.l2':      'Nivel 2 · Herramientas',
      'learn.idx.l3':      'Nivel 3 · Métodos y prompts',
      'compare.idx.eyebrow':'HERRAMIENTAS · UNA A UNA',
      'compare.idx.title':  'Herramientas de seguridad, frente a frente.',
      'compare.idx.sub':    'Benchmarks reproducibles de las herramientas ofensivas y defensivas sobre las que los profesionales realmente discuten. Cada puntuación tiene versión. Cada plan de pruebas se publica.',

      'art.toc':        'En esta página',
      'art.related':    'Relacionados',
      'art.prev':       'Anterior',
      'art.next':       'Siguiente',
      'art.newsletter': 'Boletín',
      'art.newsletter.b':'Newsletter de los martes. Las comparativas más importantes. Gratis.',
      'art.newsletter.cta':'Suscribirse →',
      'art.research':   'Investigación Breachfolio',
      'art.section.guides':'GUÍAS',
      'art.section.tools': 'HERRAMIENTAS',
      'art.bodyNote':   'El cuerpo del artículo está en inglés. Las versiones localizadas están en el roadmap.',

      'foot.tagline':   'Aprende IA y ciberseguridad desde cero. Práctico, claro, actualizado. Educación tecnológica accesible para todos.',
      'foot.sections':  'Secciones',
      'foot.legal':     'Legal',
      'foot.copy':      '© 2026 Breachfolio. Contenido independiente — todas las fuentes citadas.',
      'foot.method':    'Metodología',
      'foot.disc':      'Divulgaciones',
      'foot.priv':      'Privacidad',
      'foot.news':      'Boletín',
      'foot.about':     'Sobre nosotros',
      'foot.privacy':   'Privacidad',
      'foot.terms':     'Términos',
      'foot.cookies':   'Cookies',
      'foot.contact':   'Contacto',
      'foot.learn':     'Aprender',
      'foot.explore':   'Explorar',
      'foot.sitemap':   'Mapa del sitio',

      'a11y.skip':      'Saltar al contenido',

      'nav.prompts':    'Prompts',
      'nav.cyber':      'Ciberseguridad',
      'nav.lab':        'Lab',
      'nav.news':       'Noticias',
      'nav.resources':  'Recursos',
      'foot.guides':    'Guías',

      // Home · bloque Novedades (data/news.json)
      'latest.kicker':  'Novedades',
      'latest.title':   'Recién publicado.',
      'latest.all':     'Todas las noticias →',

      'sitemap.eyebrow': 'MAPA DEL SITIO',
      'sitemap.title':   'Todas las páginas de Breachfolio.',
      'sitemap.sub':     '¿Buscas algo concreto? Usa este directorio de todas las páginas del sitio, agrupadas por sección. También hay un mapa XML para crawlers.',
      'sitemap.home.label':       'Inicio',
      'sitemap.ai.label':         'IA',
      'sitemap.prompts.label':    'Prompts',
      'sitemap.compare.label':    'Comparativas',
      'sitemap.cyber.label':      'Ciberseguridad',
      'sitemap.lab.label':        'Lab',
      'sitemap.news.label':       'Noticias',
      'sitemap.resources.label':  'Recursos',
      'sitemap.legal.label':      'Legal',
      'sitemap.es.label':         'Español',
      'sitemap.note':    '¿Falta algo? Esta página se actualiza a mano con cada publicación. Si encuentras un enlace caducado o una página ausente, contáctanos.',
    },

  };

  function getTheme() { return document.documentElement.dataset.theme || localStorage.getItem(LS_THEME) || 'dark'; }
  function setTheme(t) {
    document.documentElement.dataset.theme = t;
    localStorage.setItem(LS_THEME, t);
    window.dispatchEvent(new CustomEvent('sf:theme', { detail: t }));
  }
  function getLang() { return document.documentElement.dataset.lang || localStorage.getItem(LS_LANG) || 'EN'; }
  function setLang(l) {
    document.documentElement.dataset.lang = l;
    localStorage.setItem(LS_LANG, l);
    applyI18n();
    window.dispatchEvent(new CustomEvent('sf:lang', { detail: l }));
  }
  function t(key, lang) {
    const L = lang || getLang();
    return (T[L] && T[L][key]) || (T.EN[key] != null ? T.EN[key] : key);
  }
  function applyI18n(root) {
    const scope = root || document;
    scope.querySelectorAll('[data-i18n]').forEach((el) => {
      const k = el.getAttribute('data-i18n');
      const tr = t(k);
      if (el.dataset.i18nAttr) el.setAttribute(el.dataset.i18nAttr, tr);
      else el.textContent = tr;
    });
    scope.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const k = el.getAttribute('data-i18n-placeholder');
      el.setAttribute('placeholder', t(k));
    });
  }

  // Apply persisted state ASAP. The page's declared data-lang wins over the
  // stored preference (each URL is a single language), matching theme-init.js.
  const initTheme = localStorage.getItem(LS_THEME) || 'dark';
  const initLang  = document.documentElement.dataset.lang || localStorage.getItem(LS_LANG) || 'EN';
  document.documentElement.dataset.theme = initTheme;
  document.documentElement.dataset.lang  = initLang;

  // Apply i18n on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => applyI18n());
  } else {
    applyI18n();
  }

  // ─── Security utilities ─────────────────────────────────

  /**
   * Escape HTML entities to prevent XSS when inserting user text into DOM.
   * Use this instead of innerHTML whenever displaying user-provided content.
   */
  function sanitizeHTML(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  /**
   * Detect common SQL injection patterns in input strings.
   * Returns true if the string looks suspicious.
   */
  const SQL_PATTERNS = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|EXEC|UNION|TRUNCATE)\b)/i,
    /(--|#|\/\*|\*\/)/,
    /(\bOR\b\s+\d+\s*=\s*\d+)/i,
    /(\bAND\b\s+\d+\s*=\s*\d+)/i,
    /('\s*(OR|AND)\s+')/i,
    /(\b(SLEEP|BENCHMARK|WAITFOR|DELAY)\b\s*\()/i,
    /(;\s*(DROP|DELETE|INSERT|UPDATE)\b)/i,
  ];
  function hasSQLInjection(str) {
    if (typeof str !== 'string') return false;
    return SQL_PATTERNS.some(p => p.test(str));
  }

  /**
   * Detect XSS payloads in input strings.
   */
  const XSS_PATTERNS = [
    /<script\b/i,
    /javascript\s*:/i,
    /on(load|error|click|mouseover|focus|blur|submit|change)\s*=/i,
    /data\s*:\s*text\/html/i,
    /<iframe\b/i,
    /<object\b/i,
    /<embed\b/i,
    /<svg\s+onload/i,
  ];
  function hasXSS(str) {
    if (typeof str !== 'string') return false;
    return XSS_PATTERNS.some(p => p.test(str));
  }

  /**
   * Validate and sanitize a form input value.
   * Returns { safe: boolean, clean: string, reason?: string }
   */
  function validateInput(value, opts) {
    opts = opts || {};
    const maxLen = opts.maxLength || 500;
    let v = (value || '').trim();

    if (v.length > maxLen) {
      v = v.slice(0, maxLen);
    }
    if (hasSQLInjection(v)) {
      return { safe: false, clean: sanitizeHTML(v), reason: 'sql_injection' };
    }
    if (hasXSS(v)) {
      return { safe: false, clean: sanitizeHTML(v), reason: 'xss_attempt' };
    }
    return { safe: true, clean: v };
  }

  /**
   * Simple email validator (RFC 5322 simplified).
   */
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  }

  /**
   * Rate limiter — prevents abuse of any action.
   * Usage: const limiter = SF.rateLimiter(5, 60000); // 5 actions per 60s
   *        if (!limiter.allow()) { /* blocked * / }
   */
  function rateLimiter(maxActions, windowMs) {
    const timestamps = [];
    return {
      allow: function () {
        const now = Date.now();
        // Remove expired timestamps
        while (timestamps.length && timestamps[0] <= now - windowMs) {
          timestamps.shift();
        }
        if (timestamps.length >= maxActions) return false;
        timestamps.push(now);
        return true;
      },
      remaining: function () {
        const now = Date.now();
        while (timestamps.length && timestamps[0] <= now - windowMs) {
          timestamps.shift();
        }
        return Math.max(0, maxActions - timestamps.length);
      }
    };
  }

  /**
   * Auto-sanitize: attach to all current and future inputs/textareas.
   * Blocks submission if dangerous content is detected.
   */
  function initInputProtection() {
    document.addEventListener('submit', function (e) {
      const form = e.target;
      if (!form || form.tagName !== 'FORM') return;

      const inputs = form.querySelectorAll('input, textarea');
      for (const input of inputs) {
        if (input.type === 'hidden' || input.type === 'submit' || input.type === 'button') continue;
        const result = validateInput(input.value);
        if (!result.safe) {
          e.preventDefault();
          e.stopImmediatePropagation();
          input.value = result.clean;
          input.classList.add('sf-input-blocked');
          console.warn('[Breachfolio Security] Blocked form submission: ' + result.reason);

          // Visual feedback
          const origBorder = input.style.borderColor;
          input.style.borderColor = 'hsl(0, 84%, 65%)';
          setTimeout(function () {
            input.style.borderColor = origBorder;
            input.classList.remove('sf-input-blocked');
          }, 2000);
          return;
        }
      }
    }, true);

    // Also sanitize paste events
    document.addEventListener('paste', function (e) {
      const target = e.target;
      if (!target || (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA')) return;
      const pasted = (e.clipboardData || window.clipboardData).getData('text');
      if (hasXSS(pasted) || hasSQLInjection(pasted)) {
        e.preventDefault();
        console.warn('[Breachfolio Security] Blocked dangerous paste content');
      }
    }, true);
  }

  // Init input protection on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInputProtection);
  } else {
    initInputProtection();
  }

  window.SF = {
    getTheme, setTheme, getLang, setLang, applyI18n, t, translations: T,
    // Security API
    sanitizeHTML,
    validateInput,
    isValidEmail,
    hasSQLInjection,
    hasXSS,
    rateLimiter,
  };
})();

// Newsletter popup — self-contained, site-wide (every page loads shared.js).
// Shows once per browser (localStorage), never re-appears after a close or
// a successful signup. Writes only (INSERT) to Supabase via a public
// anon/publishable key — by design safe to embed client-side: the table's
// RLS policy grants that key INSERT only, no SELECT/UPDATE/DELETE, so it
// can never be used to read or tamper with other people's rows.
(function () {
  'use strict';
  // Popup desactivado (2026-07-17): todavía no hay envío de correos configurado
  // detrás, así que capturar emails no aporta nada y el popup solo molesta.
  // Para reactivarlo cuando exista la newsletter real: pon esto a true.
  const NEWSLETTER_POPUP_ENABLED = false;
  if (!NEWSLETTER_POPUP_ENABLED) return;
  const DISMISS_KEY = 'sf-newsletter-dismissed';
  if (localStorage.getItem(DISMISS_KEY)) return;

  const SUPABASE_URL = 'https://aarzgpypqqeptwophtbe.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_mOtGRbnaLEaOg3LdAYFilQ_USeYT8J4';
  const SITE_ID = 'af09864c-aa0f-481d-ba24-5cf975d2bac0';

  const es = (document.documentElement.dataset.lang || 'EN').toUpperCase() === 'ES' || location.pathname.indexOf('/es/') !== -1;
  const T = es ? {
    kicker: 'BOLETÍN · SIN SPAM',
    titleHtml: 'Un email al mes, <span class="sf-grad">cero relleno</span>.',
    body: 'Lo nuevo del sitio, resumido. Sin rastreadores en el correo, sin vender tu dirección a nadie.',
    placeholder: 'tu@email.com',
    submit: 'Apuntarme',
    submitting: 'Enviando…',
    success: 'Hecho. Revisa tu bandeja de entrada.',
    already: 'Ese email ya estaba apuntado.',
    error: 'Algo falló. Inténtalo de nuevo en un momento.',
    dismiss: 'No, gracias',
    trust: 'Sin spam · Cancela cuando quieras',
    successTitle: '¡Ya estás dentro!',
  } : {
    kicker: 'NEWSLETTER · NO SPAM',
    titleHtml: 'One email a month, <span class="sf-grad">zero filler</span>.',
    body: "What's new on the site, summarized. No trackers in the email, your address never gets sold.",
    placeholder: 'you@email.com',
    submit: 'Subscribe',
    submitting: 'Sending…',
    success: "Done. Check your inbox.",
    already: "That email's already subscribed.",
    error: 'Something failed. Try again in a moment.',
    dismiss: 'No thanks',
    trust: 'No spam · Unsubscribe anytime',
    successTitle: "You're in!",
  };

  function dismissForever() {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch (e) {}
  }

  function buildModal() {
    const modal = document.createElement('div');
    modal.id = 'sf-newsletter-modal';
    modal.className = 'fixed inset-0 z-[70] bg-background/80 backdrop-blur-sm flex items-center justify-center px-6';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML =
      '<div class="sf-nl-frame relative max-w-md w-full">' +
        '<div class="sf-nl-card relative rounded-card bg-surface shadow-2xl overflow-hidden">' +
          '<div class="sf-nl-glow" aria-hidden="true"></div>' +
          '<div class="sf-nl-grid" aria-hidden="true"></div>' +
          '<button type="button" id="sf-nl-close" aria-label="' + T.dismiss + '" class="absolute top-4 right-4 z-10 h-8 w-8 grid place-items-center rounded-full text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors">' +
            '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>' +
          '</button>' +
          '<div class="relative p-8 pt-9">' +
            '<div class="sf-nl-icon-wrap">' +
              '<div class="sf-nl-icon">' +
                '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="4.5" width="19" height="15" rx="3"/><path d="m3.5 6 8.5 6.5L20.5 6"/></svg>' +
              '</div>' +
            '</div>' +
            '<div class="mt-5 text-[11px] font-mono tracking-[0.2em] text-accent uppercase">' + T.kicker + '</div>' +
            '<h2 class="font-display mt-2.5 text-[24px] leading-[1.2] font-semibold text-balance">' + T.titleHtml + '</h2>' +
            '<p class="mt-3 text-[14px] leading-[1.6] text-muted-foreground">' + T.body + '</p>' +
            '<form id="sf-nl-form" class="mt-6 flex flex-col gap-3" novalidate>' +
              '<div class="sf-nl-input-wrap">' +
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="4.5" width="19" height="15" rx="3"/><path d="m3.5 6 8.5 6.5L20.5 6"/></svg>' +
                '<input type="email" id="sf-nl-email" required autocomplete="email" placeholder="' + T.placeholder + '" class="h-12 w-full pl-[46px] pr-4 rounded-full border border-border bg-background text-[14px] text-foreground transition-shadow focus:outline-none focus:border-accent/60 focus:shadow-[0_0_0_4px_hsl(var(--accent)/0.15)]" />' +
              '</div>' +
              '<button type="submit" id="sf-nl-submit" class="h-12 px-6 rounded-full text-[14.5px] font-semibold active:scale-[0.98] transition-all">' +
                '<span>' + T.submit + '</span>' +
                '<svg class="sf-nl-arrow" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>' +
              '</button>' +
              '<p id="sf-nl-msg" class="text-[12.5px] text-center min-h-[1.2em]" role="status" aria-live="polite"></p>' +
            '</form>' +
            '<div class="sf-nl-trust">' +
              '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>' +
              '<span>' + T.trust + '</span>' +
            '</div>' +
          '</div>' +
          '<div id="sf-nl-success" class="sf-nl-success" hidden>' +
            '<div class="sf-nl-check"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l6 6L20 6"/></svg></div>' +
            '<div class="font-display mt-4 text-[19px] font-semibold">' + T.successTitle + '</div>' +
            '<p class="mt-1.5 text-[13.5px] text-muted-foreground">' + T.success + '</p>' +
          '</div>' +
        '</div>' +
      '</div>';
    return modal;
  }

  function show() {
    if (localStorage.getItem(DISMISS_KEY)) return;
    const modal = buildModal();
    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.querySelector('.sf-nl-frame').classList.add('is-in'));

    const limiter = window.SF && window.SF.rateLimiter ? window.SF.rateLimiter(3, 60000) : { allow: () => true };
    const close = () => { dismissForever(); modal.remove(); };

    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    modal.querySelector('#sf-nl-close').addEventListener('click', close);
    document.addEventListener('keydown', function onEsc(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onEsc); }
    });

    const form = modal.querySelector('#sf-nl-form');
    const input = modal.querySelector('#sf-nl-email');
    const submitBtn = modal.querySelector('#sf-nl-submit');
    const msg = modal.querySelector('#sf-nl-msg');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const email = input.value.trim();
      const isValid = window.SF && window.SF.isValidEmail ? window.SF.isValidEmail(email) : /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
      if (!isValid) { msg.textContent = T.error; return; }
      if (!limiter.allow()) return;

      submitBtn.disabled = true;
      submitBtn.textContent = T.submitting;
      msg.textContent = '';

      fetch(SUPABASE_URL + '/rest/v1/subscribers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_KEY,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          site_id: SITE_ID,
          email: email,
          lang: es ? 'es' : 'en',
          source_path: location.pathname,
        }),
      }).then((res) => {
        if (res.ok) {
          dismissForever();
          const content = modal.querySelector('.relative.p-8');
          const successEl = modal.querySelector('#sf-nl-success');
          content.hidden = true;
          successEl.hidden = false;
          requestAnimationFrame(() => successEl.classList.add('is-in'));
          setTimeout(() => close(), 2200);
        } else if (res.status === 409) {
          msg.textContent = T.already;
          dismissForever();
          submitBtn.disabled = false;
          submitBtn.textContent = T.submit;
        } else {
          msg.textContent = T.error;
          submitBtn.disabled = false;
          submitBtn.textContent = T.submit;
        }
      }).catch(() => {
        msg.textContent = T.error;
        submitBtn.disabled = false;
        submitBtn.textContent = T.submit;
      });
    });

    setTimeout(() => input.focus(), 60);
  }

  let triggered = false;
  function maybeShow() {
    if (triggered || localStorage.getItem(DISMISS_KEY)) return;
    triggered = true;
    show();
  }

  const timer = setTimeout(maybeShow, 10000);
  window.addEventListener('scroll', function onScroll() {
    const doc = document.documentElement;
    const scrolled = doc.scrollTop / (doc.scrollHeight - doc.clientHeight || 1);
    if (scrolled >= 0.4) {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(timer);
      maybeShow();
    }
  }, { passive: true });
})();

// Cookie consent banner — site-wide (every page loads shared.js). The inline
// <head> script on every page sets Google Consent Mode v2 to fully "denied"
// and waits for an update (see sf-consent-default); before this banner,
// nothing anywhere ever called gtag('consent','update', ...), so consent
// stayed denied forever for every visitor and any tag gated on it (e.g. the
// GA4 config tag in GTM) never fired. This is what supplies that update.
(function () {
  'use strict';
  const CONSENT_KEY = 'sf-consent';

  function applyConsent(granted) {
    if (typeof window.gtag !== 'function') return;
    const state = granted ? 'granted' : 'denied';
    window.gtag('consent', 'update', {
      ad_storage: state,
      ad_user_data: state,
      ad_personalization: state,
      analytics_storage: state,
    });
  }

  const stored = localStorage.getItem(CONSENT_KEY);
  if (stored) {
    // Consent Mode state is per page load, not remembered by the browser
    // itself — re-apply the saved choice on every page.
    applyConsent(stored === 'granted');
    return;
  }

  const es = (document.documentElement.dataset.lang || 'EN').toUpperCase() === 'ES' || location.pathname.indexOf('/es/') !== -1;
  const T = es ? {
    body: 'Usamos cookies para analizar el tráfico del sitio y mostrar anuncios. Puedes aceptarlas todas o quedarte solo con las esenciales.',
    accept: 'Aceptar todas',
    reject: 'Solo esenciales',
    more: 'Política de cookies',
  } : {
    body: 'We use cookies to analyze site traffic and show ads. You can accept all of them or keep only the essential ones.',
    accept: 'Accept all',
    reject: 'Necessary only',
    more: 'Cookie policy',
  };

  function buildBanner() {
    const bar = document.createElement('div');
    bar.id = 'sf-cookie-banner';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', es ? 'Aviso de cookies' : 'Cookie notice');
    bar.innerHTML =
      '<div class="sf-cookie-inner">' +
        '<p class="sf-cookie-text">' + T.body + ' <a href="/legal/cookies/" class="sf-cookie-link">' + T.more + '</a></p>' +
        '<div class="sf-cookie-actions">' +
          '<button type="button" id="sf-cookie-reject" class="sf-cookie-btn sf-cookie-btn--ghost">' + T.reject + '</button>' +
          '<button type="button" id="sf-cookie-accept" class="sf-cookie-btn sf-cookie-btn--solid">' + T.accept + '</button>' +
        '</div>' +
      '</div>';
    return bar;
  }

  function respond(granted) {
    try { localStorage.setItem(CONSENT_KEY, granted ? 'granted' : 'denied'); } catch (e) {}
    applyConsent(granted);
    const bar = document.getElementById('sf-cookie-banner');
    if (bar) {
      bar.classList.remove('is-in');
      setTimeout(function () { bar.remove(); }, 220);
    }
  }

  function show() {
    const bar = buildBanner();
    document.body.appendChild(bar);
    requestAnimationFrame(function () { bar.classList.add('is-in'); });
    bar.querySelector('#sf-cookie-accept').addEventListener('click', function () { respond(true); });
    bar.querySelector('#sf-cookie-reject').addEventListener('click', function () { respond(false); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', show);
  } else {
    show();
  }
})();
