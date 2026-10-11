#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generates unique, crisp vector hero illustrations (one per new article) in the
established Breachfolio style (dark ground, grid, accent glow, a topical technical
motif, corner labels). Vector => sharp at any DPI, never blurry. Each article
gets its OWN motif so no two new articles share art.
Run: python tools/gen-article-art.py
Output: assets/articles/art-*.svg
"""
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "articles")

W, H = 1200, 675
BG = "hsl(240 10% 4%)"
BG2 = "hsl(240 9% 7%)"
AC = "hsl(142 70% 45%)"      # Breachfolio green accent
MUT = "hsl(240 5% 65%)"

def frame(inner, accent, tag_top, tag_bottom):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid slice" font-family="ui-monospace, 'JetBrains Mono', SFMono-Regular, monospace">
<defs>
  <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="hsl(0 0% 100% / 0.05)" stroke-width="1"/></pattern>
  <radialGradient id="glow" cx="0.5" cy="0.45" r="0.55"><stop offset="0%" stop-color="{accent}" stop-opacity="0.34"/><stop offset="55%" stop-color="{accent}" stop-opacity="0.06"/><stop offset="100%" stop-color="{accent}" stop-opacity="0"/></radialGradient>
  <linearGradient id="vfade" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="{BG}" stop-opacity="0"/><stop offset="100%" stop-color="{BG}" stop-opacity="0.92"/></linearGradient>
</defs>
<rect width="{W}" height="{H}" fill="{BG}"/>
<rect width="{W}" height="{H}" fill="{BG2}" opacity="0.6"/>
<rect width="{W}" height="{H}" fill="url(#grid)"/>
<ellipse cx="640" cy="300" rx="560" ry="380" fill="url(#glow)"/>
{inner}
<rect width="{W}" height="{H}" fill="url(#vfade)"/>
<g font-size="14" letter-spacing="3" font-weight="500">
  <text x="40" y="56" fill="{accent}" opacity="0.95">{tag_top}</text>
  <text x="40" y="620" fill="{MUT}" opacity="0.6">{tag_bottom}</text>
  <text x="1160" y="620" text-anchor="end" fill="{MUT}" opacity="0.4">BREACHFOLIO</text>
</g>
<circle cx="1160" cy="50" r="4" fill="{accent}"/>
<circle cx="1160" cy="50" r="9" fill="{accent}" opacity="0.25"/>
</svg>
'''

def title(x, y, s, size=22, ls=2, op=0.95):
    return f'<text x="{x}" y="{y}" font-family="Sora, sans-serif" font-size="{size}" font-weight="600" fill="{AC}" letter-spacing="{ls}" opacity="{op}">{s}</text>'

# ---- motifs -------------------------------------------------------------
def m_roadmap():
    # branching path with milestone nodes
    nodes = [(230,430),(430,360),(620,430),(820,330),(1000,410)]
    p = f'<path d="M{nodes[0][0]} {nodes[0][1]} '
    for x,y in nodes[1:]:
        p += f'L{x} {y} '
    p += f'" fill="none" stroke="{AC}" stroke-width="3" stroke-linecap="round" opacity="0.85"/>'
    dots = ''
    labels = ['BASE','NET','OS','LAB','ROLE']
    for i,(x,y) in enumerate(nodes):
        dots += f'<circle cx="{x}" cy="{y}" r="11" fill="{BG}" stroke="{AC}" stroke-width="3"/><circle cx="{x}" cy="{y}" r="4" fill="{AC}"/>'
        dots += f'<text x="{x}" y="{y-26}" text-anchor="middle" font-size="13" fill="{MUT}" opacity="0.7" letter-spacing="2">{labels[i]}</text>'
    # branch to careers
    branch = f'<path d="M1000 410 L1000 300 M1000 300 L1090 300 M1000 340 L1075 340" fill="none" stroke="{AC}" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/>'
    return title(230,300,'HOW TO START ->')+p+branch+dots

def m_teams():
    cx,cy,r = 560,360,120
    red='hsl(0 72% 55%)'; blue='hsl(212 80% 58%)'; pur='hsl(270 70% 62%)'
    g = f'<g fill="none" stroke-width="3">'
    g += f'<circle cx="{cx-70}" cy="{cy-30}" r="{r}" stroke="{red}" opacity="0.85"/>'
    g += f'<circle cx="{cx+70}" cy="{cy-30}" r="{r}" stroke="{blue}" opacity="0.85"/>'
    g += f'<circle cx="{cx}" cy="{cy+80}" r="{r}" stroke="{pur}" opacity="0.9"/>'
    g += '</g>'
    g += f'<text x="{cx-120}" y="{cy-40}" text-anchor="middle" font-size="15" fill="{red}" letter-spacing="2">RED</text>'
    g += f'<text x="{cx+120}" y="{cy-40}" text-anchor="middle" font-size="15" fill="{blue}" letter-spacing="2">BLUE</text>'
    g += f'<text x="{cx}" y="{cy+150}" text-anchor="middle" font-size="15" fill="{pur}" letter-spacing="2">PURPLE</text>'
    return title(230,190,'ATTACK · DEFEND · IMPROVE')+g

def m_learn():
    # ascending steps
    g=''
    base=470
    for i in range(6):
        x=250+i*110; h=40+i*45; y=base-h
        op=0.35+i*0.11
        g+=f'<rect x="{x}" y="{y}" width="78" height="{h}" rx="4" fill="{AC}" opacity="{op:.2f}"/>'
    # arrow up
    g+=f'<path d="M250 500 L900 180" fill="none" stroke="{AC}" stroke-width="2.5" stroke-dasharray="2 8" stroke-linecap="round" opacity="0.7"/>'
    g+=f'<path d="M900 180 l-22 4 M900 180 l4 22" stroke="{AC}" stroke-width="2.5" stroke-linecap="round" fill="none"/>'
    return title(250,150,'ACTIVE > PASSIVE')+g

def m_agentic():
    cx,cy=560,360
    g=f'<circle cx="{cx}" cy="{cy}" r="46" fill="{BG}" stroke="{AC}" stroke-width="3"/><text x="{cx}" y="{cy+5}" text-anchor="middle" font-size="16" fill="{AC}" letter-spacing="1">LLM</text>'
    import math
    tools=['SHELL','HTTP','FILES','MAIL','API']
    for i,t in enumerate(tools):
        a=-1.15+i*0.62
        x2=cx+math.cos(a)*250; y2=cy+math.sin(a)*175
        g+=f'<path d="M{cx+math.cos(a)*50:.0f} {cy+math.sin(a)*50:.0f} L{x2-math.cos(a)*44:.0f} {y2-math.sin(a)*20:.0f}" stroke="{AC}" stroke-width="2.5" opacity="0.6" marker-end=""/>'
        g+=f'<rect x="{x2-42:.0f}" y="{y2-19:.0f}" width="84" height="38" rx="6" fill="{BG2}" stroke="{AC}" stroke-width="1.6" opacity="0.9"/>'
        g+=f'<text x="{x2:.0f}" y="{y2+5:.0f}" text-anchor="middle" font-size="12" fill="{MUT}" letter-spacing="1">{t}</text>'
    return title(230,150,'WHEN THE MODEL CAN ACT')+g

def m_mcp():
    cx,cy=430,360
    g=f'<rect x="{cx-52}" y="{cy-34}" width="104" height="68" rx="8" fill="{BG}" stroke="{AC}" stroke-width="3"/><text x="{cx}" y="{cy+5}" text-anchor="middle" font-size="15" fill="{AC}">CLIENT</text>'
    servers=['fs','db','web','tool']
    for i,s in enumerate(servers):
        y=200+i*95; x=880
        g+=f'<path d="M{cx+52} {cy} C 640 {cy}, 700 {y+18}, {x-70} {y+18}" fill="none" stroke="{AC}" stroke-width="2" opacity="0.5"/>'
        g+=f'<rect x="{x-70}" y="{y}" width="150" height="38" rx="6" fill="{BG2}" stroke="{AC}" stroke-width="1.6" opacity="0.9"/>'
        g+=f'<text x="{x+5}" y="{y+24}" text-anchor="middle" font-size="12" fill="{MUT}" letter-spacing="2">MCP: {s}</text>'
    return title(230,150,'EVERY LINK = A TRUST DECISION')+g

def m_target():
    cx,cy=560,350
    g=''
    for r,op in [(150,0.25),(110,0.4),(70,0.6),(32,0.9)]:
        g+=f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{AC}" stroke-width="2.5" opacity="{op}"/>'
    g+=f'<circle cx="{cx}" cy="{cy}" r="9" fill="{AC}"/>'
    g+=f'<path d="M{cx} {cy-170} v40 M{cx} {cy+170} v-40 M{cx-170} {cy} h40 M{cx+170} {cy} h-40" stroke="{AC}" stroke-width="2" opacity="0.5"/>'
    g+=f'<text x="{cx}" y="{cy+210}" text-anchor="middle" font-size="14" fill="{MUT}" letter-spacing="3" opacity="0.7">SAFE · LEGAL · ISOLATED</text>'
    return title(230,150,'A TARGET BUILT TO BE BROKEN')+g

def term(x,y,w,h,lines):
    g=f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="10" fill="{BG2}" stroke="{AC}" stroke-width="2" opacity="0.95"/>'
    g+=f'<circle cx="{x+22}" cy="{y+22}" r="5" fill="hsl(0 72% 55%)"/><circle cx="{x+42}" cy="{y+22}" r="5" fill="hsl(45 90% 55%)"/><circle cx="{x+62}" cy="{y+22}" r="5" fill="{AC}"/>'
    ly=y+62
    for ln,op in lines:
        g+=f'<text x="{x+22}" y="{ly}" font-size="15" fill="{AC}" opacity="{op}" letter-spacing="0.5">{ln}</text>'
        ly+=30
    return g

def m_walkthrough():
    lines=[('$ nmap -sV -p- 10.0.0.20',0.9),('  21/tcp  open  ftp   vsftpd 2.3.4',0.6),
           ('$ msfconsole -q',0.9),('  msf6 > use exploit/.../vsftpd_234',0.55),
           ('  msf6 > set RHOSTS 10.0.0.20',0.55),('  meterpreter > getuid  =>  root',0.85)]
    return title(230,150,'DISCOVER · ENUMERATE · EXPLOIT')+term(230,200,740,300,lines)

def m_siem():
    g=''
    cols=[('SPLUNK',300,0.8),('WAZUH',540,0.65),('ELK',780,0.7)]
    base=470
    import random
    random.seed(7)
    for name,x,op in cols:
        for j in range(4):
            h=60+ (j*30 + (hash(name+str(j))%50))
            bx=x-70+j*36; y=base-h
            g+=f'<rect x="{bx}" y="{y}" width="26" height="{h}" rx="3" fill="{AC}" opacity="{0.3+j*0.15:.2f}"/>'
        g+=f'<text x="{x-16}" y="{base+28}" text-anchor="middle" font-size="14" fill="{MUT}" letter-spacing="2" opacity="0.8">{name}</text>'
    return title(230,150,'LOG VOLUME = COST')+g

def m_ids():
    # packet waveform
    import math
    p='M200 360 '
    for i in range(0,820,8):
        x=200+i
        y=360+math.sin(i/38.0)*70*math.exp(-((i-380)**2)/240000.0)
        p+=f'L{x:.0f} {y:.0f} '
    g=f'<path d="{p}" fill="none" stroke="{AC}" stroke-width="2.5" opacity="0.85"/>'
    # rule match markers
    for x in [430,560,690]:
        g+=f'<line x1="{x}" y1="250" x2="{x}" y2="470" stroke="{AC}" stroke-width="1" stroke-dasharray="3 6" opacity="0.45"/>'
        g+=f'<rect x="{x-30}" y="230" width="60" height="22" rx="4" fill="{BG2}" stroke="{AC}" stroke-width="1.2" opacity="0.85"/><text x="{x}" y="245" text-anchor="middle" font-size="11" fill="{AC}">alert</text>'
    return title(200,180,'RULES OVER THE WIRE')+g

def m_scanners():
    # magnifier over grid of hosts
    g=''
    for r in range(4):
        for c in range(7):
            x=260+c*70; y=280+r*60
            g+=f'<rect x="{x}" y="{y}" width="40" height="40" rx="5" fill="none" stroke="{AC}" stroke-width="1.4" opacity="0.35"/>'
    # a few flagged
    for x,y in [(330,340),(540,280),(680,400)]:
        g+=f'<rect x="{x}" y="{y}" width="40" height="40" rx="5" fill="{AC}" opacity="0.4"/>'
    g+=f'<g transform="translate(620 360)"><circle r="80" fill="none" stroke="{AC}" stroke-width="4"/><circle r="80" fill="{AC}" opacity="0.06"/><line x1="57" y1="57" x2="130" y2="130" stroke="{AC}" stroke-width="8" stroke-linecap="round"/></g>'
    return title(230,180,'FIND WHAT IS EXPOSED')+g

def m_certs():
    # tiered badges
    g=''
    tiers=[('SECURITY+',300,0.9),('CEH',430,0.7),('OSCP',560,0.85),('CISSP',690,0.75)]
    base=460
    for i,(name,x,op) in enumerate(tiers):
        h=90+i*40; y=base-h
        g+=f'<path d="M{x-45} {y+18} q0 -18 45 -18 q45 0 45 18 v{h-40} q0 30 -45 42 q-45 -12 -45 -42 z" fill="{BG2}" stroke="{AC}" stroke-width="2" opacity="{op}"/>'
        g+=f'<path d="M{x-14} {y+40} l10 12 l20 -24" fill="none" stroke="{AC}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'
        g+=f'<text x="{x}" y="{base+26}" text-anchor="middle" font-size="12" fill="{MUT}" letter-spacing="1" opacity="0.8">{name}</text>'
    return title(230,150,'WHICH ONE IS WORTH IT')+g

def m_netcmd():
    lines=[('$ ip addr show',0.9),('  inet 10.0.0.20/24  eth0',0.55),
           ('$ ss -tulpn',0.9),('  LISTEN 0 128 *:443  nginx',0.55),
           ('$ tcpdump -i eth0 port 53',0.85)]
    return title(230,150,'ip · ss · tcpdump')+term(230,200,740,260,lines)

def m_hardening():
    cx,cy=560,340
    g=f'<path d="M{cx} {cy-150} L{cx+130} {cy-105} V{cy+10} Q{cx+130} {cy+120} {cx} {cy+165} Q{cx-130} {cy+120} {cx-130} {cy+10} V{cy-105} Z" fill="{AC}" opacity="0.07" stroke="{AC}" stroke-width="3"/>'
    items=[-70,-20,30,80]
    for dy in items:
        g+=f'<path d="M{cx-55} {cy+dy} l14 16 l30 -34" fill="none" stroke="{AC}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
        g+=f'<line x1="{cx-5}" y1="{cy+dy}" x2="{cx+70}" y2="{cy+dy}" stroke="{AC}" stroke-width="2" opacity="0.4"/>'
    return title(230,150,'FRESH INSTALL != SECURE')+g

ARTS = [
    ("art-cyber-roadmap.svg",    m_roadmap(),   "GUIDES / ROADMAP",  "HOW TO START IN CYBERSECURITY"),
    ("art-cyber-teams.svg",      m_teams(),     "GUIDES / TEAMS",    "RED · BLUE · PURPLE TEAM"),
    ("art-cyber-learn.svg",      m_learn(),     "GUIDES / METHOD",   "HOW TO ACTUALLY LEARN"),
    ("art-ai-agentic.svg",       m_agentic(),   "AI / SECURITY",     "AGENTIC AI SECURITY"),
    ("art-ai-mcp.svg",           m_mcp(),       "AI / SECURITY",     "MCP ATTACK SURFACE"),
    ("art-lab-metasploitable.svg", m_target(),  "LAB / TARGETS",     "WHAT IS METASPLOITABLE 2"),
    ("art-lab-walkthrough.svg",  m_walkthrough(), "LAB / WALKTHROUGH","METASPLOITABLE 2 STEP BY STEP"),
    ("art-cmp-siem.svg",         m_siem(),      "COMPARE / SIEM",    "SPLUNK vs WAZUH vs ELK"),
    ("art-cmp-ids.svg",          m_ids(),       "COMPARE / IDS",     "SNORT vs SURICATA"),
    ("art-cmp-scanners.svg",     m_scanners(),  "COMPARE / SCANNERS","NESSUS vs OPENVAS"),
    ("art-res-certs.svg",        m_certs(),     "RESOURCES / CAREER","CERTIFICATIONS COMPARED"),
    ("art-res-netcmd.svg",       m_netcmd(),    "RESOURCES / GLOSSARY","NETWORK COMMAND GLOSSARY"),
    ("art-res-hardening.svg",    m_hardening(), "RESOURCES / CHECKLIST","LINUX HARDENING CHECKLIST"),
]

for fname, inner, tt, tb in ARTS:
    svg = frame(inner, AC, tt, tb)
    with open(os.path.join(OUT, fname), "w", encoding="utf-8") as f:
        f.write(svg)
    print("wrote", fname, len(svg), "bytes")
print("done:", len(ARTS), "unique article illustrations")
