# -*- coding: utf-8 -*-
import os

W, H = 1200, 675
BG = "hsl(240 10% 4%)"
BG2 = "hsl(240 9% 7%)"
AC = "hsl(142 70% 45%)"
MUT = "hsl(240 5% 65%)"

def frame(inner, tag_top, tag_bottom):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid slice" font-family="ui-monospace, 'JetBrains Mono', SFMono-Regular, monospace">
<defs>
  <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="hsl(0 0% 100% / 0.05)" stroke-width="1"/></pattern>
  <radialGradient id="glow" cx="0.5" cy="0.45" r="0.55"><stop offset="0%" stop-color="{AC}" stop-opacity="0.34"/><stop offset="55%" stop-color="{AC}" stop-opacity="0.06"/><stop offset="100%" stop-color="{AC}" stop-opacity="0"/></radialGradient>
  <linearGradient id="vfade" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="{BG}" stop-opacity="0"/><stop offset="100%" stop-color="{BG}" stop-opacity="0.92"/></linearGradient>
</defs>
<rect width="{W}" height="{H}" fill="{BG}"/><rect width="{W}" height="{H}" fill="{BG2}" opacity="0.6"/><rect width="{W}" height="{H}" fill="url(#grid)"/>
<ellipse cx="640" cy="300" rx="560" ry="380" fill="url(#glow)"/>
{inner}
<rect width="{W}" height="{H}" fill="url(#vfade)"/>
<g font-size="14" letter-spacing="3" font-weight="500">
  <text x="40" y="56" fill="{AC}" opacity="0.95">{tag_top}</text>
  <text x="40" y="620" fill="{MUT}" opacity="0.6">{tag_bottom}</text>
  <text x="1160" y="620" text-anchor="end" fill="{MUT}" opacity="0.4">BREACHFOLIO</text>
</g>
<circle cx="1160" cy="50" r="4" fill="{AC}"/><circle cx="1160" cy="50" r="9" fill="{AC}" opacity="0.25"/>
</svg>
'''

def title(x, y, s):
    return f'<text x="{x}" y="{y}" font-family="Sora, sans-serif" font-size="22" font-weight="600" fill="{AC}" letter-spacing="2">{s}</text>'

def m_card():
    cx, cy = 560, 360
    red = "hsl(0 72% 55%)"
    g = f'<rect x="{cx-140}" y="{cy-90}" width="280" height="180" rx="16" fill="{BG2}" stroke="{AC}" stroke-width="3"/>'
    g += f'<rect x="{cx-110}" y="{cy-50}" width="44" height="34" rx="5" fill="{AC}" opacity="0.5"/>'
    g += f'<rect x="{cx-110}" y="{cy+20}" width="160" height="12" rx="4" fill="{MUT}" opacity="0.4"/>'
    g += f'<path d="M{cx-40} {cy+120} L{cx+40} {cy+200} M{cx+40} {cy+120} L{cx-40} {cy+200}" stroke="{red}" stroke-width="6" stroke-linecap="round" opacity="0.85"/>'
    g += f'<circle cx="{cx}" cy="{cy+160}" r="55" fill="none" stroke="{red}" stroke-width="3" opacity="0.6"/>'
    return title(230, 180, 'FAKE CHECKOUT') + g

def m_irs():
    cx, cy = 560, 340
    g = f'<rect x="{cx-160}" y="{cy-190}" width="320" height="200" rx="20" fill="{BG2}" stroke="{AC}" stroke-width="3"/>'
    for i, w in enumerate([220, 180, 240]):
        g += f'<rect x="{cx-140}" y="{cy-150+i*45}" width="{w}" height="24" rx="8" fill="{AC}" opacity="{0.25+i*0.15}"/>'
    g += f'<path d="M{cx-140} {cy-8} L{cx-40} {cy-8}" stroke="{AC}" stroke-width="10" stroke-linecap="round"/>'
    g += f'<g transform="translate({cx+120} {cy-260})"><circle r="34" fill="none" stroke="hsl(0 72% 55%)" stroke-width="4"/><text y="10" text-anchor="middle" font-size="34" fill="hsl(0 72% 55%)" font-weight="700">!</text></g>'
    return title(230, 150, 'NOT THE IRS') + g

def m_report():
    cx, cy = 560, 350
    g = f'<rect x="{cx-150}" y="{cy-120}" width="300" height="220" rx="14" fill="{BG2}" stroke="{AC}" stroke-width="3"/>'
    items = ['URL', 'SCREENSHOT', 'DATE/TIME', 'CHANNEL']
    for i, it in enumerate(items):
        y = cy - 80 + i * 45
        g += f'<circle cx="{cx-115}" cy="{y}" r="9" fill="none" stroke="{AC}" stroke-width="2.5"/><path d="M{cx-119} {y} l4 4 l7 -8" stroke="{AC}" stroke-width="2.5" fill="none" stroke-linecap="round"/>'
        g += f'<text x="{cx-90}" y="{y+5}" font-size="13" fill="{MUT}" letter-spacing="1">{it}</text>'
    g += f'<g transform="translate({cx+230} {cy})"><circle r="46" fill="none" stroke="{AC}" stroke-width="3"/><path d="M-14 0 L-2 12 L18 -14" stroke="{AC}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>'
    return title(230, 170, 'EVIDENCE FIRST') + g

def m_whatsapp():
    cx, cy = 560, 350
    g = f'<rect x="{cx-90}" y="{cy-160}" width="180" height="320" rx="24" fill="{BG2}" stroke="{AC}" stroke-width="3"/>'
    g += f'<circle cx="{cx}" cy="{cy-100}" r="24" fill="none" stroke="{AC}" stroke-width="2.5"/>'
    for i in range(3):
        y = cy - 40 + i * 50
        w = 110 if i != 1 else 70
        op = 0.55 if i != 1 else 0.85
        g += f'<rect x="{cx-70}" y="{y}" width="{w}" height="30" rx="10" fill="{AC}" opacity="{op}"/>'
    g += f'<g transform="translate({cx-260} {cy+60})" stroke="hsl(0 72% 55%)" stroke-width="4" fill="none"><path d="M0 20 A20 20 0 1 1 30 30" /><path d="M-6 22 l-8 14 M-6 22 l16 4"/></g>'
    for i, dx in enumerate([-220, -140, 140, 220]):
        y = cy - 140 if i % 2 == 0 else cy + 140
        g += f'<rect x="{cx+dx-18}" y="{y-14}" width="36" height="28" rx="5" fill="none" stroke="{MUT}" stroke-width="2" opacity="0.5"/>'
    return title(230, 150, 'LINKED DEVICES') + g

def m_domain():
    cx, cy = 560, 350
    g = f'<rect x="{cx-190}" y="{cy-40}" width="380" height="60" rx="14" fill="{BG2}" stroke="{AC}" stroke-width="3"/>'
    g += f'<circle cx="{cx-155}" cy="{cy-10}" r="10" fill="{AC}" opacity="0.6"/>'
    g += f'<text x="{cx-125}" y="{cy-2}" font-size="16" fill="{MUT}" letter-spacing="1">secure-login-verify.info</text>'
    g += f'<g transform="translate({cx+210} {cy+10})"><circle r="55" fill="none" stroke="{AC}" stroke-width="5"/><line x1="38" y1="38" x2="90" y2="90" stroke="{AC}" stroke-width="8" stroke-linecap="round"/></g>'
    g += f'<g transform="translate({cx+250} {cy+50})"><path d="M0 -14 L14 10 L-14 10 Z" fill="none" stroke="hsl(45 90% 55%)" stroke-width="3" stroke-linejoin="round"/><text y="7" text-anchor="middle" font-size="14" fill="hsl(45 90% 55%)" font-weight="700">!</text></g>'
    return title(230, 180, 'CHECK THE REAL DOMAIN') + g

def m_instagram():
    cx, cy = 560, 350
    red = "hsl(0 72% 55%)"
    g = f'<circle cx="{cx-90}" cy="{cy}" r="70" fill="none" stroke="{AC}" stroke-width="3"/>'
    g += f'<circle cx="{cx-90}" cy="{cy-20}" r="22" fill="{AC}" opacity="0.5"/>'
    g += f'<path d="M{cx-140} {cy+55} Q{cx-90} {cy+15} {cx-40} {cy+55}" fill="none" stroke="{AC}" stroke-width="4" opacity="0.6"/>'
    g += f'<circle cx="{cx-90}" cy="{cy}" r="90" fill="none" stroke="{AC}" stroke-width="2" stroke-dasharray="4 8" opacity="0.4"/>'
    g += f'<circle cx="{cx+120}" cy="{cy}" r="70" fill="none" stroke="{red}" stroke-width="3" stroke-dasharray="6 6"/>'
    g += f'<circle cx="{cx+120}" cy="{cy-20}" r="22" fill="{red}" opacity="0.35"/>'
    g += f'<path d="M{cx+70} {cy+55} Q{cx+120} {cy+15} {cx+170} {cy+55}" fill="none" stroke="{red}" stroke-width="4" opacity="0.5"/>'
    g += f'<g transform="translate({cx+120} {cy-90})"><path d="M0 -12 L12 9 L-12 9 Z" fill="none" stroke="{red}" stroke-width="2.5" stroke-linejoin="round"/><text y="6" text-anchor="middle" font-size="11" fill="{red}" font-weight="700">!</text></g>'
    return title(230, 150, 'REAL vs FAKE PROFILE') + g

ARTS = [
    ("art-guide-card.svg", m_card(), "GUIDES / FRAUD", "FAKE CHECKOUT PAGE"),
    ("art-guide-irs.svg", m_irs(), "GUIDES / PHISHING", "FAKE IRS TEXT"),
    ("art-guide-report.svg", m_report(), "GUIDES / REPORTING", "REPORT A SCAM SITE"),
    ("art-guide-whatsapp.svg", m_whatsapp(), "GUIDES / RECOVERY", "HACKED MESSAGING ACCOUNT"),
    ("art-guide-domain.svg", m_domain(), "GUIDES / PHISHING", "SUSPICIOUS DOMAIN"),
    ("art-guide-instagram.svg", m_instagram(), "GUIDES / IMPERSONATION", "FAKE PROFILE"),
]

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "articles")
for fname, inner, tt, tb in ARTS:
    svg = frame(inner, tt, tb)
    with open(os.path.join(OUT, fname), "w", encoding="utf-8") as f:
        f.write(svg)
    print("wrote", fname)
