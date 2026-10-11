# -*- coding: utf-8 -*-
"""One-off: adds a rich <meta name="keywords">, expands JSON-LD Article
keywords, and injects an FAQPage block into each of the 12 Guides articles."""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DATA = {
    "guides/fake-credit-card-website/index.html": {
        "lang": "en",
        "canonical": "https://breachfolio.com/guides/fake-credit-card-website/",
        "keywords": "entered credit card on fake website, phishing card details, what to do if you entered card info on a scam site, fake checkout page scam, card fraud after phishing site, unauthorized credit card charges, report card fraud, Fair Credit Billing Act refund, is my card compromised, phishing website stole my card, cancel card after phishing scam, credit card scam recovery steps",
        "faq": [
            ("What should I do first if I entered my card on a fake website?",
             "Call your card issuer immediately using the number on the back of your card (not any number from the site) and ask them to block the card or flag it for suspicious activity."),
            ("Will my bank refund unauthorized charges from a phishing site?",
             "In the US, the Fair Credit Billing Act caps your liability for unauthorized credit card charges at $50, and most issuers waive even that if you report quickly."),
            ("How do I report a fake checkout website?",
             "File a report at reportfraud.ftc.gov and ic3.gov, and flag the URL to Google Safe Browsing and Microsoft so browsers warn other visitors."),
        ],
    },
    "guides/fake-irs-text-message/index.html": {
        "lang": "en",
        "canonical": "https://breachfolio.com/guides/fake-irs-text-message/",
        "keywords": "fake IRS text message, is this IRS text real, IRS smishing scam, IRS text refund scam, IRS never texts you, report IRS phishing text, irs.gov scam warning, tax refund text scam, IRS impersonation scam, identitytheft.gov, IRS Identity Protection PIN, fake tax refund SMS, IRS scam phone number",
        "faq": [
            ("Does the IRS send text messages about refunds?",
             "No. The IRS does not initiate contact by text message, email, or social media to request personal or financial information, or to announce a refund."),
            ("What should I do if I get a text claiming to be from the IRS?",
             "Don't click any link or reply. Go directly to irs.gov by typing the address yourself, and report the text through the IRS's phishing-report process."),
            ("I already clicked the link in a fake IRS text — what now?",
             "If you entered personal information, start a recovery plan at identitytheft.gov; if you entered card or bank details, contact your bank immediately."),
        ],
    },
    "guides/report-scam-website/index.html": {
        "lang": "en",
        "canonical": "https://breachfolio.com/guides/report-scam-website/",
        "keywords": "how to report a scam website, report phishing site, FTC fraud report, reportfraud.ftc.gov, IC3 report cybercrime, report fake online store, Google Safe Browsing report phishing, Microsoft report unsafe site, report scam to FBI, consumer sentinel network, evidence for scam report, how to document a phishing site",
        "faq": [
            ("Where do I report a scam website in the US?",
             "Report it at reportfraud.ftc.gov for general consumer fraud, and at ic3.gov if there's financial loss or identity theft involved."),
            ("What evidence should I save before reporting a scam site?",
             "The full URL, screenshots of the page and any forms, the original message that led you there, and the date and channel you found it through."),
            ("Does reporting a scam website get my money back?",
             "No — reporting helps get the site investigated and taken down; getting your money back is a separate process through your bank or card issuer."),
        ],
    },
    "guides/hacked-messaging-account/index.html": {
        "lang": "en",
        "canonical": "https://breachfolio.com/guides/hacked-messaging-account/",
        "keywords": "hacked WhatsApp account, recover hacked WhatsApp, WhatsApp account stolen, someone registered my number on WhatsApp, WhatsApp two-step verification, linked devices WhatsApp hacked, WhatsApp verification code scam, recover messaging account, WhatsApp hijacked contacts scam, SIM swap WhatsApp, WhatsApp account recovery steps",
        "faq": [
            ("How do I recover a hacked WhatsApp account?",
             "Open WhatsApp on your own device and re-register your number — this typically ends the other session automatically, since WhatsApp only stays active on one device per number."),
            ("Should I share a WhatsApp verification code if someone asks for it?",
             "Never. A legitimate request never requires you to share your verification code with anyone, including someone claiming to be WhatsApp support."),
            ("How do I stop someone from re-hijacking my WhatsApp?",
             "Enable two-step verification with a PIN you don't reuse elsewhere, and review your linked devices for anything you don't recognize."),
        ],
    },
    "guides/check-suspicious-domain/index.html": {
        "lang": "en",
        "canonical": "https://breachfolio.com/guides/check-suspicious-domain/",
        "keywords": "how to check if a domain is fake, is this website fake, check suspicious domain, ICANN Lookup domain check, Google Safe Browsing transparency report, phishing domain checklist, fake bank website domain, domain age check, spot a phishing link, verify a website is legitimate, suspicious URL checker, brand impersonation domain",
        "faq": [
            ("Does HTTPS mean a website is safe?",
             "No. A valid HTTPS certificate only means the connection is encrypted — it says nothing about who actually owns or runs the site."),
            ("How can I check who registered a domain?",
             "Use ICANN Lookup (lookup.icann.org) to see public registration data like the registrar and creation date, where available."),
            ("What's the strongest sign a domain is a scam?",
             "A page using a real brand's name while asking for passwords, card numbers, or one-time codes — legitimate sites rarely need that combination."),
        ],
    },
    "guides/instagram-impersonation/index.html": {
        "lang": "en",
        "canonical": "https://breachfolio.com/guides/instagram-impersonation/",
        "keywords": "someone impersonating me on Instagram, fake Instagram account with my photos, report Instagram impersonation, Instagram fake profile scam, how to report a fake account on Instagram, Instagram identity theft, protect Instagram account from impersonation, Instagram hacked account recovery, catfish Instagram account, Instagram impersonation report form",
        "faq": [
            ("How do I report someone impersonating me on Instagram?",
             "Use Instagram's built-in reporting flow from the fake profile's ‘···’ menu, or the Help Center's impersonation-report form."),
            ("How can I tell if an Instagram account is really impersonating me?",
             "Real impersonation usually copies your actual photos and bio closely, contacts your followers, or asks for money or information while posing as you — not just a similar name."),
            ("Should I confront the fake account directly?",
             "No — document it with screenshots first, then report it through Instagram's official channel; confronting it can tip off the account before you've saved evidence."),
        ],
    },
    "es/guias/tarjeta-web-falsa/index.html": {
        "lang": "es",
        "canonical": "https://breachfolio.com/es/guias/tarjeta-web-falsa/",
        "keywords": "he metido mi tarjeta en una web falsa, qué hacer si metí mi tarjeta en una web falsa, phishing tarjeta bancaria, cargo no autorizado tarjeta, bloquear tarjeta por fraude, denunciar fraude tarjeta INCIBE, web falsa robo de tarjeta, cómo saber si mi tarjeta está comprometida, reembolso cargo fraudulento banco de españa, seguridad tarjeta bancaria online",
        "faq": [
            ("¿Qué debo hacer primero si metí mi tarjeta en una web falsa?",
             "Contacta con tu banco inmediatamente desde la app oficial o el teléfono de atención al cliente para bloquear la tarjeta o limitar las operaciones online."),
            ("¿Me devuelven el dinero si he sido víctima de una web fraudulenta?",
             "Si avisas rápido a tu banco, la normativa de servicios de pago protege frente a cargos no autorizados; cuanto antes lo comuniques, mejor la protección."),
            ("¿Dónde denuncio una web que me robó los datos de la tarjeta?",
             "Puedes reportarla en INCIBE (incibe.es/ciudadania/ayuda/reporte-de-fraude) además de avisar a tu banco."),
        ],
    },
    "es/guias/sms-aeat-falso/index.html": {
        "lang": "es",
        "canonical": "https://breachfolio.com/es/guias/sms-aeat-falso/",
        "keywords": "SMS falso de la AEAT, cómo saber si un SMS de Hacienda es falso, phishing Agencia Tributaria, smishing AEAT, reembolso falso Hacienda SMS, AEAT nunca envía SMS, denunciar SMS falso AEAT, phishing tributario España, enlace falso Agencia Tributaria, robo de datos SMS Hacienda",
        "faq": [
            ("¿La Agencia Tributaria envía SMS sobre reembolsos?",
             "No. La AEAT no inicia contacto por SMS pidiendo datos personales o bancarios ni anuncia reembolsos por ese medio."),
            ("¿Qué hago si recibo un SMS sospechoso de la AEAT?",
             "No pulses el enlace ni respondas; consulta cualquier notificación real entrando manualmente en la sede electrónica oficial de la Agencia Tributaria."),
            ("¿Ya pulsué el enlace de un SMS falso de la AEAT, qué hago?",
             "Si solo abriste la página, ciérrala sin introducir datos; si ya introdujiste datos bancarios, contacta con tu banco de inmediato."),
        ],
    },
    "es/guias/denunciar-web-fraudulenta/index.html": {
        "lang": "es",
        "canonical": "https://breachfolio.com/es/guias/denunciar-web-fraudulenta/",
        "keywords": "cómo denunciar una web fraudulenta, reportar phishing España, denunciar página falsa INCIBE, web fraudulenta qué hacer, reportar estafa online España, denuncia phishing paso a paso, evidencias para denunciar una estafa, reportar sitio falso a Google, denunciar tienda online fraudulenta",
        "faq": [
            ("¿Dónde denuncio una web fraudulenta en España?",
             "Puedes reportarla en INCIBE (incibe.es/ciudadania/ayuda/reporte-de-fraude), y si hay pérdida económica, considera también la denuncia ante las autoridades."),
            ("¿Qué pruebas necesito antes de denunciar una web falsa?",
             "La URL completa, capturas de pantalla de la página y los formularios, el mensaje original que llevó hasta ella, y la fecha en que la encontraste."),
            ("¿Denunciar una web fraudulenta recupera mi dinero?",
             "No directamente — eso depende de tu banco; la denuncia sirve para que se investigue y se retire la infraestructura del fraude."),
        ],
    },
    "es/guias/whatsapp-hackeado/index.html": {
        "lang": "es",
        "canonical": "https://breachfolio.com/es/guias/whatsapp-hackeado/",
        "keywords": "WhatsApp hackeado qué hacer, recuperar cuenta de WhatsApp robada, mi número se registró en otro dispositivo WhatsApp, verificación en dos pasos WhatsApp, dispositivos vinculados WhatsApp hackeado, código de verificación WhatsApp estafa, WhatsApp secuestrado contactos, duplicado de SIM WhatsApp",
        "faq": [
            ("¿Cómo recupero mi cuenta de WhatsApp hackeada?",
             "Abre WhatsApp en tu propio teléfono y vuelve a registrar tu número; esto suele cerrar automáticamente la sesión de quien accedió sin permiso."),
            ("¿Debo compartir un código de verificación de WhatsApp si me lo piden?",
             "Nunca. Ninguna gestión legítima requiere que compartas tu código de verificación con nadie."),
            ("¿Cómo evito que vuelvan a hackear mi WhatsApp?",
             "Activa la verificación en dos pasos con un PIN que no uses en otras cuentas y revisa periódicamente los dispositivos vinculados."),
        ],
    },
    "es/guias/dominio-falso/index.html": {
        "lang": "es",
        "canonical": "https://breachfolio.com/es/guias/dominio-falso/",
        "keywords": "cómo saber si un dominio es falso, comprobar si una web es fraudulenta, dominio sospechoso cómo detectarlo, ICANN Lookup comprobar dominio, Google Safe Browsing España, phishing dominio falso banco, verificar legitimidad de una web, checklist dominio sospechoso, suplantación de marca dominio falso",
        "faq": [
            ("¿El candado HTTPS garantiza que una web es segura?",
             "No. El HTTPS solo indica que la conexión está cifrada, no dice nada sobre quién controla realmente la web."),
            ("¿Cómo compruebo quién registró un dominio?",
             "Con ICANN Lookup (lookup.icann.org) puedes consultar datos públicos de registro como el registrador y la fecha de creación."),
            ("¿Cuál es la señal más clara de que un dominio es falso?",
             "Que use el nombre de una marca conocida mientras pide contraseñas, tarjeta bancaria o códigos de un solo uso — algo que una web legítima rara vez necesita a la vez."),
        ],
    },
    "es/guias/suplantacion-instagram/index.html": {
        "lang": "es",
        "canonical": "https://breachfolio.com/es/guias/suplantacion-instagram/",
        "keywords": "me suplantan en Instagram qué hacer, cuenta falsa de Instagram con mis fotos, denunciar suplantación Instagram, perfil falso Instagram estafa, cómo reportar una cuenta falsa en Instagram, robo de identidad en redes sociales, recuperar cuenta de Instagram hackeada, cuenta duplicada Instagram",
        "faq": [
            ("¿Cómo denuncio a alguien que me suplanta en Instagram?",
             "Usa el flujo de reporte de Instagram desde el perfil falso (menú ··· → Reportar) o el Centro de ayuda para casos de suplantación."),
            ("¿Cómo sé si una cuenta realmente me está suplantando?",
             "La suplantación real suele copiar tus fotos y biografía, contactar a tus seguidores o pedir dinero haciéndose pasar por ti — no solo tener un nombre parecido."),
            ("¿Debo contactar directamente con la cuenta falsa?",
             "No — primero guarda pruebas con capturas de pantalla y después repórtalo por el canal oficial de Instagram."),
        ],
    },
}

for relpath, info in DATA.items():
    path = os.path.join(ROOT, relpath)
    content = open(path, encoding="utf-8").read()

    # 1) <meta name="keywords"> right after <meta name="description">
    if 'name="keywords"' not in content:
        content = re.sub(
            r'(<meta name="description"[^>]*/>\n)',
            r'\1  <meta name="keywords" content="' + info["keywords"].replace('"', "&quot;") + '" />\n',
            content, count=1,
        )

    # 2) expand JSON-LD Article "keywords" field
    content = re.sub(
        r'("keywords":\s*)"[^"]*"',
        lambda m: m.group(1) + json.dumps(info["keywords"]),
        content, count=1,
    )

    # 3) inject FAQPage into the @graph array, right after the BreadcrumbList object
    faq_entities = [
        {"@type": "Question", "name": q,
         "acceptedAnswer": {"@type": "Answer", "text": a}}
        for q, a in info["faq"]
    ]
    faq_obj = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "@id": info["canonical"] + "#faq",
        "mainEntity": faq_entities,
    }
    faq_json = json.dumps(faq_obj, ensure_ascii=False, indent=6)
    # indent to match surrounding graph items (6 spaces) and insert as new array element
    faq_json_indented = "\n".join(
        ("      " + line if i > 0 else line) for i, line in enumerate(faq_json.split("\n"))
    )

    # Find end of BreadcrumbList object: the "]\n    }\n  ]\n}</script>" tail of the 2nd ld+json block
    pattern = re.compile(r'(\{\s*"@type":\s*"ListItem".*?\}\s*\]\s*\}\s*)\n(\s*\]\s*\n\}</script>)', re.S)
    m = pattern.search(content)
    if not m:
        print("PATTERN NOT FOUND:", relpath)
        continue
    replacement = m.group(1) + ",\n    " + faq_json_indented + "\n" + m.group(2)
    content = content[:m.start()] + replacement + content[m.end():]

    open(path, "w", encoding="utf-8").write(content)
    print("updated", relpath)
