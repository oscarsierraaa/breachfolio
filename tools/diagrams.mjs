// Generadores de diagramas SVG inline, propios y adaptados al tema del sitio
// (usan las variables CSS --accent/--surface/--border/--foreground/--muted,
// así que funcionan en claro y oscuro automáticamente). Sin dependencias.
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// Flujo vertical (o pila): lista de cajas conectadas por flechas hacia abajo.
// steps: [ "Label" | {t:"Título", s:"subtítulo"} ]. opts.arrows=false -> pila.
export function verticalFlow(steps, opts = {}) {
  const arrows = opts.arrows !== false;
  const Bw = 360, PX = 12;
  const W = Bw + PX * 2;
  const rows = steps.map(st => (typeof st === 'object' && st.s) ? 60 : 48);
  const G = arrows ? 28 : 12;
  let y = 2, H = rows.reduce((a, b) => a + b, 0) + (steps.length - 1) * G + 4;
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" xmlns="http://www.w3.org/2000/svg" font-family="Sora, system-ui, sans-serif">`;
  steps.forEach((st, i) => {
    const Bh = rows[i];
    const label = typeof st === 'string' ? st : st.t;
    const sub = typeof st === 'object' ? st.s : '';
    s += `<rect x="${PX}" y="${y}" width="${Bw}" height="${Bh}" rx="10" fill="hsl(var(--surface))" stroke="hsl(var(--border))"/>`;
    s += `<rect x="${PX}" y="${y}" width="4" height="${Bh}" rx="2" fill="hsl(var(--accent))"/>`;
    s += `<text x="${PX + 24}" y="${y + (sub ? 24 : 29)}" fill="hsl(var(--foreground))" font-size="15" font-weight="600">${esc(label)}</text>`;
    if (sub) s += `<text x="${PX + 24}" y="${y + 44}" fill="hsl(var(--muted))" font-size="12">${esc(sub)}</text>`;
    if (arrows && i < steps.length - 1) {
      const cx = PX + Bw / 2, ay = y + Bh;
      s += `<path d="M ${cx} ${ay + 3} L ${cx} ${ay + G - 6}" stroke="hsl(var(--accent))" stroke-width="1.5"/>`;
      s += `<path d="M ${cx - 4} ${ay + G - 10} L ${cx} ${ay + G - 5} L ${cx + 4} ${ay + G - 10}" fill="none" stroke="hsl(var(--accent))" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    y += Bh + G;
  });
  return s + `</svg>`;
}

// Pirámide de bandas (p.ej. Pirámide del Dolor). layers de arriba (estrecha) a abajo (ancha).
export function pyramid(layers, opts = {}) {
  const W = 460, rowH = 46, gap = 6, PX = 10;
  const H = layers.length * rowH + (layers.length - 1) * gap + 4;
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" xmlns="http://www.w3.org/2000/svg" font-family="Sora, system-ui, sans-serif">`;
  const n = layers.length;
  layers.forEach((lb, i) => {
    const t = i / (n - 1); // 0 arriba .. 1 abajo
    const w = 150 + t * (W - PX * 2 - 150);
    const x = (W - w) / 2, y = i * (rowH + gap) + 2;
    // color: más "dolor" abajo (más saturado)
    const op = (0.30 - t * 0.20).toFixed(2);
    s += `<rect x="${x}" y="${y}" width="${w}" height="${rowH}" rx="6" fill="hsl(var(--accent) / ${op})" stroke="hsl(var(--accent) / 0.5)"/>`;
    s += `<text x="${W / 2}" y="${y + rowH / 2 + 5}" text-anchor="middle" fill="hsl(var(--foreground))" font-size="13.5" font-weight="600">${esc(lb)}</text>`;
  });
  return s + `</svg>`;
}

// Árbol 2 niveles: raíz -> hijos (p.ej. dominio -> subdominios).
export function tree(root, children) {
  const W = 480, rootY = 20, childY = 120, chH = 40, PX = 12;
  const n = children.length;
  const cw = Math.min(120, (W - PX * 2) / n - 8);
  const H = childY + chH + 16;
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" xmlns="http://www.w3.org/2000/svg" font-family="Sora, system-ui, sans-serif">`;
  // raíz
  const rw = 180, rx = (W - rw) / 2;
  s += `<rect x="${rx}" y="${rootY}" width="${rw}" height="40" rx="10" fill="hsl(var(--accent) / 0.14)" stroke="hsl(var(--accent) / 0.5)"/>`;
  s += `<text x="${W / 2}" y="${rootY + 25}" text-anchor="middle" fill="hsl(var(--foreground))" font-size="14" font-weight="700">${esc(root)}</text>`;
  children.forEach((c, i) => {
    const step = (W - PX * 2) / n;
    const cx = PX + step * i + step / 2;
    const x = cx - cw / 2;
    s += `<path d="M ${W / 2} ${rootY + 40} C ${W / 2} ${childY - 20}, ${cx} ${rootY + 60}, ${cx} ${childY}" fill="none" stroke="hsl(var(--border))" stroke-width="1.4"/>`;
    s += `<rect x="${x}" y="${childY}" width="${cw}" height="${chH}" rx="8" fill="hsl(var(--surface))" stroke="hsl(var(--border))"/>`;
    s += `<text x="${cx}" y="${childY + chH / 2 + 4}" text-anchor="middle" fill="hsl(var(--foreground))" font-size="12" font-weight="600">${esc(c)}</text>`;
  });
  return s + `</svg>`;
}

// Dos columnas comparativas. left/right = {title, items:[...]}.
export function twoCol(left, right) {
  const W = 520, colW = 244, gap = 20, PX = 6, headH = 40, rowH = 30;
  const rows = Math.max(left.items.length, right.items.length);
  const H = headH + rows * rowH + 20;
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" xmlns="http://www.w3.org/2000/svg" font-family="Sora, system-ui, sans-serif">`;
  [[PX, left], [PX + colW + gap, right]].forEach(([x, col]) => {
    s += `<rect x="${x}" y="2" width="${colW}" height="${H - 6}" rx="12" fill="hsl(var(--surface))" stroke="hsl(var(--border))"/>`;
    s += `<rect x="${x}" y="2" width="${colW}" height="${headH}" rx="12" fill="hsl(var(--accent) / 0.12)"/>`;
    s += `<text x="${x + colW / 2}" y="${26}" text-anchor="middle" fill="hsl(var(--foreground))" font-size="13.5" font-weight="700">${esc(col.title)}</text>`;
    col.items.forEach((it, i) => {
      const y = headH + 6 + i * rowH;
      s += `<circle cx="${x + 18}" cy="${y + rowH / 2}" r="2.5" fill="hsl(var(--accent))"/>`;
      s += `<text x="${x + 30}" y="${y + rowH / 2 + 4}" fill="hsl(var(--muted-foreground, var(--muted)))" font-size="12">${esc(it)}</text>`;
    });
  });
  return s + `</svg>`;
}

// Hub radial: centro + radios (p.ej. all-source: OSINT/HUMINT/SIGINT...).
export function hub(center, spokes) {
  const W = 460, H = 300, cx = W / 2, cy = H / 2, R = 110;
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" xmlns="http://www.w3.org/2000/svg" font-family="Sora, system-ui, sans-serif">`;
  const n = spokes.length;
  spokes.forEach((sp, i) => {
    const a = (-90 + i * 360 / n) * Math.PI / 180;
    const x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R;
    s += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="hsl(var(--border))" stroke-width="1.3"/>`;
    const bw = 96, bh = 30;
    s += `<rect x="${x - bw / 2}" y="${y - bh / 2}" width="${bw}" height="${bh}" rx="8" fill="hsl(var(--surface))" stroke="hsl(var(--border))"/>`;
    s += `<text x="${x}" y="${y + 4}" text-anchor="middle" fill="hsl(var(--foreground))" font-size="12" font-weight="600">${esc(sp)}</text>`;
  });
  s += `<circle cx="${cx}" cy="${cy}" r="52" fill="hsl(var(--accent) / 0.15)" stroke="hsl(var(--accent) / 0.6)"/>`;
  s += `<text x="${cx}" y="${cy + 4}" text-anchor="middle" fill="hsl(var(--foreground))" font-size="12.5" font-weight="700">${esc(center)}</text>`;
  return s + `</svg>`;
}
