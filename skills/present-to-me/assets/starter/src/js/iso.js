/* ===== Tiny isometric 3D renderer (SVG). World: x right-back, y left-back, z up. Viewer along (1,1,1). ===== */
function hexRgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function shadeHex(h, f, mixWhite = 0) { const [r, g, b] = hexRgb(h); const m = v => Math.round(clamp(v * f + (255 - v * f) * mixWhite, 0, 255)); return `rgb(${m(r)},${m(g)},${m(b)})`; }

class Iso {
  constructor(svg, o = {}) {
    this.svg = svg; this.o = Object.assign({ ox: 960, oy: 540, s: 1, yaw: 0, cx: 0, cy: 0 }, o);
    this.g = svgEl('g', {}, svg); this.lg = svgEl('g', {}, svg); this.boxes = [];
  }
  add(b) {
    b = Object.assign({ dx: 0, dy: 0, dz: 0, op: 1, stroke: 'rgba(31,35,41,.13)' }, b);
    b.g = svgEl('g', {}, this.g); b.faces = [];
    for (let k = 0; k < 5; k++) b.faces.push(svgEl('polygon', { 'stroke-linejoin': 'round', 'stroke-width': 1.2 }, b.g));
    if (b.onClick) { b.g.style.cursor = 'pointer'; b.g.addEventListener('click', () => b.onClick(b)); }
    if (b.tip) bindTip(b.g, b.tip);
    this.boxes.push(b); return b;
  }
  proj(x, y, z) {
    const o = this.o, c = Math.cos(o.yaw), s = Math.sin(o.yaw), dx = x - o.cx, dy = y - o.cy;
    const xr = c * dx - s * dy, yr = s * dx + c * dy;
    return [o.ox + (xr - yr) * 0.8660 * o.s, o.oy + (xr + yr) * 0.5 * o.s - z * o.s, xr + yr + z];
  }
  render() {
    const o = this.o, c = Math.cos(o.yaw), s = Math.sin(o.yaw);
    for (const b of this.boxes) {
      const X = b.x + b.dx, Y = b.y + b.dy, Z = b.z + b.dz;
      const P = (i, j, k) => this.proj(X + i * b.w, Y + j * b.d, Z + k * b.h);
      const p000 = P(0, 0, 0), p100 = P(1, 0, 0), p110 = P(1, 1, 0), p010 = P(0, 1, 0), p001 = P(0, 0, 1), p101 = P(1, 0, 1), p111 = P(1, 1, 1), p011 = P(0, 1, 1);
      const F = [[p001, p101, p111, p011, [0, 0, 1]], [p100, p110, p111, p101, [1, 0, 0]], [p010, p110, p111, p011, [0, 1, 0]], [p000, p010, p011, p001, [-1, 0, 0]], [p000, p100, p101, p001, [0, -1, 0]]];
      const col = b.color, hide = b.op <= 0.001;
      F.forEach((f, k) => {
        const el = b.faces[k]; const n = f[4];
        let vis = !hide, fill;
        if (k === 0) fill = b.top || shadeHex(col, 1.0, .14);
        else { const nx = c * n[0] - s * n[1], ny = s * n[0] + c * n[1]; vis = vis && (nx + ny) > 0.0001; const sx = (nx - ny) / 1.4142; fill = shadeHex(col, 0.70 - 0.16 * sx); }
        if (!vis) { el.setAttribute('display', 'none'); return; }
        el.removeAttribute('display');
        el.setAttribute('points', f.slice(0, 4).map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' '));
        el.setAttribute('fill', fill); el.setAttribute('stroke', b.stroke);
      });
      b.g.setAttribute('opacity', b.op);
      const cc = this.proj(X + b.w / 2, Y + b.d / 2, Z + b.h / 2);
      b.depth = cc[2] + (b.bias || 0);
      b.anchor = this.proj(X + (b.ax ?? b.w / 2), Y + (b.ay ?? b.d / 2), Z + b.h);
    }
    [...this.boxes].sort((a, b) => a.depth - b.depth).forEach(b => this.g.appendChild(b.g));
  }
  enableDrag(min = -0.9, max = 0.9, onChange) {
    let x0 = null, y0 = 0;
    this.svg.style.cursor = 'grab'; this.svg.classList.add('no-swipe');
    this.svg.addEventListener('pointerdown', e => { x0 = e.clientX; y0 = this.o.yaw; this.svg.setPointerCapture(e.pointerId); this.svg.style.cursor = 'grabbing'; });
    this.svg.addEventListener('pointermove', e => { if (x0 == null) return; this.o.yaw = clamp(y0 + (e.clientX - x0) / (260 * Deck.scale), min, max); this.render(); onChange && onChange(); });
    const up = () => { x0 = null; this.svg.style.cursor = 'grab'; };
    this.svg.addEventListener('pointerup', up); this.svg.addEventListener('pointercancel', up);
  }
}
