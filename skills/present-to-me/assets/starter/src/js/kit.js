/* ===== Kit: ready-made animated charts. Each returns { set(t), part, dur, el }: set(0) is empty, set(1) finished ===== */
const Kit = (function () {
  let uid = 0;
  const mono = (size, color, w = 500) => F(w, size, color, 'var(--f-mono)');
  const disp = (size, color, w = 700) => F(w, size, color, 'var(--f-display)') + ';font-stretch:112%;font-variant-numeric:tabular-nums';
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const op = (n, v) => n.setAttribute('opacity', v);
  const INK = { m1: 'm1-ink', m2: 'm2-ink', m3: 'm3-ink', grey: 'fg-2' };
  const ink = t => C[INK[t] || t];
  const paint = t => C[t === 'grey' ? 'fg-3' : t];
  const decs = v => { const s = String(v), i = s.indexOf('.'); return i < 0 ? 0 : Math.min(2, s.length - i - 1); };
  const FMT = { money: v => fmtMoney(v), moneyExact: v => (v < 0 ? '−' : '') + CURRENCY + fmtN(Math.abs(v)), pct: v => fmtN(v * 100) + '%', n: v => fmtN(v), n1: v => fmtN(v, 1), n2: v => fmtN(v, 2) };
  // default: as many decimals as the data has (max 2), so 1.24 counts up as 1.24 and not 1
  const formatter = (f, vals) => typeof f === 'function' ? f : FMT[f] || (d => v => fmtN(v, d))(Math.max(0, ...vals.map(decs)));
  const withUnit = (s, u) => u ? s + (/^[%×°]/.test(u) ? '' : ' ') + u : s;
  const g = parent => svgEl('g', {}, parent);
  // a label that may sit on a dashed line keeps a paper-coloured outline, so the dashes stop short of its letters
  const HALO = ';paint-order:stroke;stroke:var(--bg);stroke-width:6px;stroke-linejoin:round';

  function frame(svg, o, w, h) {
    svg.replaceChildren();
    const [W, H] = o.size || [w, h];
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('role', 'img'); svg.classList.add('kit-svg');
    if (o.label) svg.setAttribute('aria-label', o.label);
    const id = 'kit' + ++uid;
    svgEl('rect', { width: W, height: H }, svgEl('clipPath', { id }, svgEl('defs', {}, svg)));
    return { W, H, root: svgEl('g', { 'clip-path': `url(#${id})` }, svg) };
  }
  function measure(parent, s, style) { const n = txt(parent, 0, -999, s, { style }); const w = n.getComputedTextLength(); n.remove(); return w; }
  function caption(root, o) {
    if (!o.caption) return 0;
    txt(root, 0, 20, o.caption.toUpperCase(), { style: mono(16, C['fg-3']) + ';letter-spacing:.06em' });
    return 44;
  }
  // push labels apart vertically so none sits closer than gap; the group is shifted back up if it runs past hi
  function spread(items, gap, lo, hi) {
    const a = [...items].sort((p, q) => p.y - q.y);
    for (let i = 1; i < a.length; i++) a[i].y = Math.max(a[i].y, a[i - 1].y + gap);
    for (let i = a.length - 1; i >= 0; i--) a[i].y = Math.min(a[i].y, i === a.length - 1 ? hi : a[i + 1].y - gap);
    for (let i = 0; i < a.length; i++) a[i].y = Math.max(a[i].y, i ? a[i - 1].y + gap : lo);
    return items;
  }
  // an x position for an x value: numbers are placed by value, strings by their index
  function xAxis(xs) {
    const num = typeof xs[0] === 'number';
    const idx = v => {
      if (!num) return Math.max(0, xs.indexOf(v));
      for (let i = 0; i < xs.length - 1; i++) if (v <= xs[i + 1]) return i + clamp((v - xs[i]) / (xs[i + 1] - xs[i]), 0, 1);
      return xs.length - 1;
    };
    const at = (vals, fi) => { const i = Math.min(Math.floor(fi), vals.length - 2); return i < 0 ? vals[0] : lerp(vals[i], vals[i + 1], fi - i); };
    return { num, idx, at, val: fi => num ? at(xs, fi) : fi };
  }
  // gridlines, y ticks and x ticks for lines and area. Returns the scales and the group to fade
  function plotFrame(root, o, { W, top, base, lo, hi, step, right }) {
    const xs = o.x, ax = xAxis(xs), n = xs.length, tf = formatter(o.format, [step, lo]), xf = typeof o.xFormat === 'function' ? o.xFormat : String;
    const ticks = []; for (let v = lo; v <= hi + step * 1e-6; v += step) ticks.push(v);
    const left = Math.max(...ticks.map(v => measure(root, tf(v), mono(17, C['fg-3'])))) + 14;
    const x0 = left, x1 = W - right, y = linear(lo, hi, base, top);
    const X = fi => ax.num ? linear(xs[0], xs[n - 1], x0, x1)(ax.val(fi)) : linear(0, n - 1, x0, x1)(fi);
    const axes = g(root);
    ticks.forEach(v => {
      svgEl('line', { x1: x0, x2: x1, y1: y(v), y2: y(v), stroke: v === lo ? C.line : C['line-2'], 'stroke-width': v === lo ? 1.5 : 1 }, axes);
      txt(axes, x0 - 12, y(v) + 6, tf(v), { 'text-anchor': 'end', style: mono(17, C['fg-3']) });
    });
    if (o.unit) txt(axes, x0 - 12, top - 16, o.unit, { 'text-anchor': 'end', style: mono(17, C['fg-3']) });
    const every = Math.ceil(n / (W < 640 ? 4 : 7));
    for (let i = 0; i < n; i += every) txt(axes, X(i), base + 28, xf(xs[i]), { 'text-anchor': !i ? 'start' : X(i) > W - 40 ? 'end' : 'middle', style: mono(17, C['fg-3']) });
    return { x0, x1, y, X, ax, axes };
  }
  function yRange(o, vals, plotH) {
    const lo = o.min ?? Math.min(0, ...vals), max = o.max ?? Math.max(...vals);
    const step = niceStep(max - lo, clamp(Math.floor(plotH / 40), 2, 5));
    return { lo, hi: Math.max(step, Math.ceil(max / step - 1e-9) * step), step };
  }
  function ring(parent, cx, cy, tone, r = 10) { return svgEl('circle', { cx, cy, r, fill: C.bg, stroke: C[tone], 'stroke-width': 3.5 }, parent); }

  /* ---------- bars ---------- */
  function bars(svg, o) {
    const { W, H, root } = frame(svg, o, 480, 440), items = o.items, n = items.length;
    const fmt = formatter(o.format, items.map(d => d.value)), val = v => withUnit(fmt(v), o.unit);
    const top = caption(root, o) + (o.ref ? 34 : 4);
    const max = o.max ?? Math.max(...items.map(d => d.value), o.ref ? o.ref.value : 0) * 1.06;
    const LS = F(500, 20, C['fg-2']), VS = t => disp(24, ink(t));
    const lw = Math.max(...items.map(d => measure(root, d.label, LS)));
    const vw = Math.max(...items.map(d => measure(root, val(d.value), VS(d.tone || 'grey'))));
    const slot = W / n, horiz = o.dir ? o.dir === 'h' : lw > slot - 12 || vw > slot - 4;
    const labels = g(root), refG = g(root), parts = [], tone = d => d.tone || 'grey';
    // a value that would print across the reference line moves inside its bar, in white, when the bar is long enough, and past the line when it is not
    const valueText = (d, inside, attrs) => txt(root, 0, 0, '', Object.assign(attrs, { style: inside ? disp(24, C.bg) : VS(tone(d)) + HALO }));
    if (horiz) {
      const stacked = lw + 16 > W * .42, x0 = stacked ? 0 : lw + 16, x1 = W - vw - 14, rowH = (H - top) / n;
      const bh = Math.min(stacked ? rowH - 40 : rowH * .6, 46), x = linear(0, max, x0, x1), rx = o.ref ? x(o.ref.value) : null;
      items.forEach((d, i) => {
        const ry = top + rowH * i, cy = stacked ? ry + 32 + bh / 2 : ry + rowH / 2, end = x(d.value), w = measure(root, val(d.value), VS(tone(d)));
        const clash = rx != null && end + 10 < rx + 6 && end + 10 + w > rx - 6, inside = clash && end - x0 > w + 20, past = clash && !inside;
        txt(labels, 0, stacked ? ry + 22 : cy + 7, d.label, { style: LS });
        const r = svgEl('rect', { x: x0, y: cy - bh / 2, height: bh, rx: Math.min(6, bh / 2), fill: paint(tone(d)) }, root);
        const v = valueText(d, inside, { y: cy + 8, 'text-anchor': inside ? 'end' : 'start' });
        parts.push(u => { const bw = (end - x0) * u; r.setAttribute('width', bw); v.setAttribute('x', inside ? x0 + bw - 10 : past && x0 + bw + 10 + w > rx - 6 ? Math.min(rx + 10, W - w) : x0 + bw + 10); v.textContent = val(d.value * u); op(v, u > 0 ? 1 : 0); });
      });
      if (o.ref) {
        const lab = o.ref.label || val(o.ref.value), w = measure(root, lab, F(600, 19, C.fg));
        svgEl('line', { x1: rx, x2: rx, y1: top - 10, y2: H, stroke: ink(o.ref.tone || 'fg'), 'stroke-width': 2.5, 'stroke-dasharray': '7 5' }, refG);
        txt(refG, clamp(rx, w / 2, W - w / 2), top - 18, lab, { 'text-anchor': 'middle', style: F(600, 19, ink(o.ref.tone || 'fg')) });
      }
    } else {
      // the reference label sits in its own gutter at the right, level with its line, so no bar can run into it
      const refLab = o.ref ? o.ref.label || val(o.ref.value) : '', gut = o.ref ? measure(root, refLab, F(600, 19, C.fg)) + 16 : 0;
      const base = H - 34, y = linear(0, max, base, top - (o.ref ? 34 : 4) + 36), cw = W - gut, sl = cw / n, bw = Math.min(sl * .6, 96);
      const ry = o.ref ? y(o.ref.value) : null;
      svgEl('line', { x1: 0, x2: cw, y1: base, y2: base, stroke: C.line, 'stroke-width': 1.5 }, labels);
      if (o.ref) {
        svgEl('line', { x1: 0, x2: cw + 4, y1: ry, y2: ry, stroke: ink(o.ref.tone || 'fg'), 'stroke-width': 2.5, 'stroke-dasharray': '7 5' }, refG);
        txt(refG, W, ry + 7, refLab, { 'text-anchor': 'end', style: F(600, 19, ink(o.ref.tone || 'fg')) });
      }
      items.forEach((d, i) => {
        const cx = sl * (i + .5), h1 = base - y(d.value), ly = y(d.value) - 12;
        const clash = ry != null && ry > ly - 26 && ry < ly + 8, inside = clash && h1 > 44 && measure(root, val(d.value), VS(tone(d))) < bw - 10, past = clash && !inside;
        txt(labels, cx, base + 28, d.label, { 'text-anchor': 'middle', style: LS });
        const r = svgEl('rect', { x: cx - bw / 2, width: bw, rx: 5, fill: paint(tone(d)) }, root);
        const v = valueText(d, inside, { x: cx, 'text-anchor': 'middle' });
        parts.push(u => { const h = h1 * u; r.setAttribute('y', base - h); r.setAttribute('height', h); v.setAttribute('y', inside ? base - h + 32 : past && base - h - 12 < ry + 26 ? ry - 10 : base - h - 12); v.textContent = val(d.value * u); op(v, u > 0 ? 1 : 0); });
      });
    }
    const bar = (i, t) => parts[i](easeOut(t));
    const d = n > 1 ? .3 / (n - 1) : 0;
    const set = t => { op(labels, seg(t, 0, .12)); parts.forEach((p, i) => bar(i, seg(t, i * d, i * d + .7))); op(refG, seg(t, .75, 1)); };
    set(0);
    return { set, part: { bar }, dur: 1.2, el: svg };
  }

  /* ---------- versus: A against B, row by row, a ring on the better value ---------- */
  function versus(svg, o) {
    const { W, H, root } = frame(svg, o, 880, 480), A = o.a, B = o.b, rows = o.rows, ta = A.tone || 'm1', tb = B.tone || 'm2';
    const top = caption(root, o), LS = F(600, 22, C.fg);
    const text = (r, v) => withUnit(formatter(r.format ?? o.format, [r.a, r.b])(v), r.unit ?? o.unit);
    const lw = Math.max(...rows.map(r => measure(root, r.label, LS)));
    const vw = Math.max(...rows.flatMap(r => [r.a, r.b].map(v => measure(root, text(r, v), F(700, 20, C.fg))))) + 30;
    const stacked = lw + 28 > W * .38, x0 = stacked ? 0 : lw + 28, x1 = W - vw, head = top + 44, rowH = (H - head) / rows.length;
    // two value labels sit one above the other at the bar ends, so the two bar centres stay at least a text line apart
    const bh = clamp(rowH * (stacked ? .17 : .22), 8, 22), gap = Math.max(4, bh * .35, 24 - bh), rr = bh / 2 + 5;
    const header = g(root);
    let hx = x0;
    [[A, ta], [B, tb]].forEach(([s, t]) => {
      svgEl('rect', { x: hx, y: top + 14, width: 22, height: 8, rx: 4, fill: paint(t) }, header);
      const nm = txt(header, hx + 32, top + 24, s.name, { style: F(600, 22, ink(t)) });
      hx += 32 + nm.getComputedTextLength() + 36;
    });
    const rowFns = rows.map((r, i) => {
      const ry = head + rowH * i, G = g(root), m = r.max ?? Math.max(r.a, r.b) * 1.04, x = linear(0, m, x0, x1);
      const cy = stacked ? ry + 38 + Math.max(24, bh + gap) / 2 : ry + rowH / 2;
      if (i) svgEl('line', { x1: 0, x2: W, y1: ry, y2: ry, stroke: C['line-2'] }, G);
      const lab = txt(G, 0, stacked ? ry + 20 : cy + 8, r.label, { style: LS });
      const win = r.a === r.b ? null : (r.better === 'low') === (r.a < r.b) ? 'a' : 'b';
      const side = [['a', ta, cy - gap / 2 - bh / 2], ['b', tb, cy + gap / 2 + bh / 2]].map(([k, t, by]) => {
        const best = win === k;
        const rect = svgEl('rect', { x: x0, y: by - bh / 2, height: bh, rx: bh / 2, fill: paint(t) }, G);
        const v = txt(G, 0, by + 7, '', { style: best ? F(700, 20, ink(t)) : F(500, 20, C['fg-2']) });
        const ringEl = best ? ring(G, 0, by, t, rr) : null;
        return { k, rect, v, ringEl, best, by, end: x(r[k]) - x0 };
      });
      return t => {
        const u = easeOut(seg(t, 0, .8)), p = seg(t, .8, 1);
        op(lab, seg(t, 0, .2));
        side.forEach(s => {
          const w = Math.max(0, s.end * u);
          s.rect.setAttribute('width', w);
          s.v.setAttribute('x', x0 + w + (s.best ? rr + 10 : 10)); s.v.textContent = text(r, r[s.k] * u); op(s.v, u > 0 ? 1 : 0);
          if (s.ringEl) { s.ringEl.setAttribute('cx', x0 + w); s.ringEl.setAttribute('r', rr * (.6 + .4 * easeOut(p))); op(s.ringEl, p); }
        });
      };
    });
    const row = (i, t) => rowFns[i](t), names = t => op(header, t);
    const d = rows.length > 1 ? .3 / (rows.length - 1) : 0;
    const set = t => { names(seg(t, 0, .1)); rowFns.forEach((f, i) => f(seg(t, .05 + i * d, .05 + i * d + .6))); };
    set(0);
    return { set, part: { row, names }, dur: 1.6, el: svg };
  }

  /* ---------- lines: series over x, end labels, rings at named points and at a crossing, bands under the axis ---------- */
  function lines(svg, o) {
    const { W, H, root } = frame(svg, o, 960, 520), S = o.series, all = S.flatMap(s => s.values), n = o.x.length;
    const top = caption(root, o) + (o.unit ? 34 : 12), base = H - 34 - (o.bands ? 54 : 0);
    const fmt = formatter(o.format, all), { lo, hi, step } = yRange(o, all, base - top);
    const endText = s => s.end ?? `${s.label} ${fmt(s.values[n - 1])}`;
    const right = Math.max(...S.map(s => measure(root, endText(s), F(600, 20, C.fg)))) + 18;
    const { x0, x1, y, X, ax, axes } = plotFrame(root, o, { W, top, base, lo, hi, step, right });
    const ends = spread(S.map(s => ({ id: s.id, y: y(s.values[n - 1]) })), 26, top, base);
    const L = {};
    S.forEach((s, i) => {
      const tone = s.tone || ['m1', 'm2', 'm3'][i % 3], id = 'kit' + ++uid, G = g(root);
      const clip = svgEl('rect', { x: x0 - 8, y: 0, height: H, width: 0 }, svgEl('clipPath', { id }, svgEl('defs', {}, G)));
      const pts = s.values.map((v, k) => [X(k), y(v)]);
      svgEl('path', { d: o.smooth ? smoothPath(pts) : 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L'), fill: 'none', stroke: C[tone], 'stroke-width': s.dash ? 3.5 : 5, 'stroke-dasharray': s.dash ? '10 8' : '', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'clip-path': `url(#${id})` }, G);
      const lab = txt(G, x1 + 14, ends[i].y + 7, endText(s), { style: F(600, 20, ink(tone)) });
      L[s.id] = { s, tone, clip, lab };
    });
    const marks = g(root);
    const markAt = (cx, cy, tone, label) => {
      ring(marks, cx, cy, tone);
      if (!label) return;
      const below = cy < top + 44, anchor = cx > x1 - 120 ? 'end' : cx < x0 + 120 ? 'start' : 'middle';
      txt(marks, cx + (anchor === 'end' ? 8 : anchor === 'start' ? -8 : 0), below ? cy + 36 : cy - 20, label, { 'text-anchor': anchor, style: F(600, 19, ink(tone)) + HALO });
    };
    (o.marks || []).forEach(m => { const l = L[m.series], fi = ax.idx(m.x); markAt(X(fi), y(ax.at(l.s.values, fi)), m.tone || l.tone, m.label); });
    if (o.cross) {
      const a = L[o.cross.a].s.values, b = L[o.cross.b].s.values;
      for (let i = 0; i < n - 1; i++) {
        const d0 = a[i] - b[i], d1 = a[i + 1] - b[i + 1];
        if (d0 * d1 < 0 || (d1 === 0 && d0 !== 0)) { const fi = i + d0 / (d0 - d1); markAt(X(fi), y(ax.at(a, fi)), o.cross.tone || 'fg', o.cross.label); break; }
      }
    }
    const bands = g(root);
    (o.bands || []).forEach(b => {
      const bx = X(ax.idx(b.from)) + 3, w = X(ax.idx(b.to)) - bx - 3, tone = b.tone || 'grey';
      svgEl('rect', { x: bx, y: base + 42, width: w, height: 44, rx: 12, fill: paint(tone), 'fill-opacity': .12 }, bands);
      let fs = 19; while (fs > 14 && measure(bands, b.label, F(600, fs, C.fg)) > w - 16) fs--;
      txt(bands, bx + w / 2, base + 70, b.label, { 'text-anchor': 'middle', style: F(600, fs, ink(tone)) });
    });
    const line = (id, t) => { const l = L[id]; l.clip.setAttribute('width', (x1 - x0 + 16) * ease(seg(t, 0, .85))); op(l.lab, seg(t, .85, 1)); };
    const part = { line, axes: t => op(axes, t), marks: t => op(marks, t), bands: t => op(bands, t) };
    const d = S.length > 1 ? .25 / (S.length - 1) : 0;
    const set = t => { part.axes(seg(t, 0, .1)); S.forEach((s, i) => line(s.id, seg(t, .05 + i * d, .6 + i * d))); part.marks(seg(t, .85, .95)); part.bands(seg(t, .9, 1)); };
    set(0);
    return { set, part, dur: 2, el: svg };
  }

  /* ---------- area: stacked layers that rise one by one ---------- */
  function area(svg, o) {
    const { W, H, root } = frame(svg, o, 960, 520), Ls = o.layers, n = o.x.length;
    const totals = o.x.map((_, i) => Ls.reduce((a, l) => a + l.values[i], 0));
    const legend = g(root), ly = caption(root, o) + 16;
    let lx = 0;
    Ls.forEach((l, i) => {
      const tone = l.tone || ['m1', 'm2', 'm3'][i % 3];
      svgEl('rect', { x: lx, y: ly - 7, width: 22, height: 8, rx: 4, fill: C[tone] }, legend);
      lx += 32 + txt(legend, lx + 32, ly + 1, l.label, { style: F(600, 19, ink(tone)) }).getComputedTextLength() + 30;
    });
    const top = ly + 22 + (o.unit ? 30 : 8), base = H - 34;
    const { lo, hi, step } = yRange(o, [...totals, o.limit ? o.limit.value : 0], base - top);
    const { x0, x1, y, X, axes } = plotFrame(root, o, { W, top, base, lo, hi, step, right: 12 });
    const u = {}, shapes = Ls.map((l, i) => {
      const tone = l.tone || ['m1', 'm2', 'm3'][i % 3]; u[l.id] = 0;
      return { l, fill: svgEl('path', { fill: C[tone], 'fill-opacity': .22 }, root), edge: svgEl('path', { fill: 'none', stroke: C[tone], 'stroke-width': 3, 'stroke-linejoin': 'round' }, root) };
    });
    const draw = () => {
      let cum = o.x.map(() => 0);
      shapes.forEach(({ l, fill, edge }) => {
        const k = ease(u[l.id]), next = cum.map((c, i) => c + l.values[i] * k);
        const topE = next.map((v, i) => `${X(i).toFixed(1)} ${y(v).toFixed(1)}`), botE = cum.map((v, i) => `${X(i).toFixed(1)} ${y(v).toFixed(1)}`).reverse();
        fill.setAttribute('d', 'M' + topE.join('L') + 'L' + botE.join('L') + 'Z'); edge.setAttribute('d', 'M' + topE.join('L'));
        op(fill, u[l.id] > 0 ? 1 : 0); op(edge, u[l.id] > 0 ? 1 : 0);
        cum = next;
      });
    };
    const lim = g(root);
    if (o.limit) {
      const yy = y(o.limit.value), tone = o.limit.tone || 'risk';
      svgEl('line', { x1: x0, x2: x1, y1: yy, y2: yy, stroke: ink(tone), 'stroke-width': 2.5, 'stroke-dasharray': '7 5' }, lim);
      txt(lim, x1, yy - 10, o.limit.label || formatter(o.format, [o.limit.value])(o.limit.value), { 'text-anchor': 'end', style: F(600, 19, ink(tone)) });
    }
    const layer = (id, t) => { u[id] = t; draw(); };
    const d = Ls.length > 1 ? .45 / (Ls.length - 1) : 0;
    const set = t => {
      op(axes, seg(t, 0, .1)); op(legend, seg(t, 0, .1));
      Ls.forEach((l, i) => { u[l.id] = seg(t, .05 + i * d, .4 + i * d); }); draw();
      op(lim, seg(t, .85, 1));
    };
    set(0);
    return { set, part: { layer, limit: t => op(lim, t) }, dur: 2, el: svg };
  }

  /* ---------- tank: a vessel that fills to a level, a cap line, the overflow dashed above the cap ---------- */
  function tank(svg, o) {
    const { W, H, root } = frame(svg, o, 320, 440), tone = o.tone || 'm2', cap = o.cap;
    const fmt = formatter(o.format, [o.value, cap ?? 0]), top = caption(root, o) + 12, bottom = H - 4;
    const max = o.max ?? Math.max(o.value, cap ?? 0) * 1.12, y = linear(0, max, bottom, top);
    const VS = disp(40, ink(tone)), vtxt = v => withUnit(fmt(v), o.unit), capTxt = cap == null ? '' : `${o.capLabel || 'cap'} ${vtxt(cap)}`;
    const labW = Math.max(measure(root, vtxt(o.value), VS), cap == null ? 0 : measure(root, capTxt, F(600, 19, C.fg)));
    const vw = Math.min(W * .46, W - labW - 30, (bottom - top) * .8), vx = 2, lx = vx + vw + 18;
    const id = 'kit' + ++uid;
    svgEl('rect', { x: vx, y: top, width: vw, height: bottom - top, rx: 18 }, svgEl('clipPath', { id }, svgEl('defs', {}, root)));
    svgEl('rect', { x: vx, y: top, width: vw, height: bottom - top, rx: 18, fill: C['surface-2'] }, root);
    const liquid = svgEl('rect', { x: vx, width: vw, fill: C[tone], 'clip-path': `url(#${id})` }, root);
    const over = svgEl('rect', { x: vx + 2, width: vw - 4, rx: 6, fill: C['risk-soft'], stroke: C.risk, 'stroke-width': 2.5, 'stroke-dasharray': '7 5' }, root);
    svgEl('rect', { x: vx, y: top, width: vw, height: bottom - top, rx: 18, fill: 'none', stroke: C.line, 'stroke-width': 2 }, root);
    const capG = g(root);
    let capLab = null;
    if (cap != null) {
      svgEl('line', { x1: vx - 6, x2: vx + vw + 10, y1: y(cap), y2: y(cap), stroke: C.fg, 'stroke-width': 3 }, capG);
      capLab = txt(capG, lx, 0, capTxt, { style: F(600, 19, C['fg-2']) });
    }
    // the cap label sits level with its line; the value and the overflow stack under it, or at the top when there is no cap
    const capY = cap == null ? null : clamp(y(cap) + 7, top + 14, bottom - 80);
    if (capLab) capLab.setAttribute('y', capY);
    const vy = cap == null ? top + 36 : capY + 46;
    const val = txt(root, lx, vy, '', { style: VS });
    const overT = cap != null && o.value > cap ? txt(root, lx, vy + 30, `${o.overLabel || 'over by'} ${vtxt(o.value - cap)}`, { style: F(600, 19, C.risk) }) : null;
    const set = t => {
      const lv = o.value * easeOut(seg(t, 0, .75)), solid = cap == null ? lv : Math.min(lv, cap);
      liquid.setAttribute('y', y(solid)); liquid.setAttribute('height', bottom - y(solid));
      const ov = cap != null && lv > cap; over.setAttribute('y', y(lv)); over.setAttribute('height', ov ? y(cap) - y(lv) : 0); op(over, ov ? 1 : 0);
      op(capG, seg(t, 0, .15));
      val.textContent = vtxt(lv); op(val, t > 0 ? 1 : 0);
      if (overT) op(overT, seg(t, .8, 1));
    };
    set(0);
    return { set, part: {}, dur: 1.4, el: svg };
  }

  /* ---------- dots: N dots, coloured groups fill in order ---------- */
  function dots(svg, o) {
    const { W, H, root } = frame(svg, o, 480, 440), N = o.total, G = o.groups, fmt = formatter(o.format, [N, ...G.map(d => d.count)]);
    const head = caption(root, o) + 50, hy = head - 16, hdr = g(root);
    let hx = 0;
    const nums = G.map((d, i) => {
      const tone = d.tone || ['m1', 'm2', 'm3'][i % 3], nm = txt(hdr, hx, hy, fmt(d.count), { style: disp(40, ink(tone)) });
      const w = nm.getComputedTextLength(); nm.textContent = ''; nm.setAttribute('x', hx + w); nm.setAttribute('text-anchor', 'end');
      hx += w + 10 + txt(hdr, hx + w + 10, hy, d.label || '', { style: F(600, 19, ink(tone)) }).getComputedTextLength() + 30;
      return { d, tone, nm };
    });
    txt(hdr, W, hy, `of ${fmt(N)}`, { 'text-anchor': 'end', style: mono(17, C['fg-3']) });
    const aw = W, ah = H - head - 4, cols = o.cols || Math.ceil(Math.sqrt(N * aw / ah)), rows = Math.ceil(N / cols);
    const cell = Math.min(aw / cols, ah / rows), r = cell * .36, toneOf = [];
    G.forEach((d, i) => { for (let k = 0; k < d.count; k++) toneOf.push(i); });
    const field = g(root), cs = [];
    for (let i = 0; i < N; i++) cs.push(svgEl('circle', { cx: cell * (i % cols + .5), cy: head + cell * (Math.floor(i / cols) + .5), r, fill: C.line }, field));
    const K = toneOf.length;
    const set = t => {
      op(field, seg(t, 0, .12)); op(hdr, seg(t, 0, .12));
      const lit = Math.round(K * easeOut(seg(t, .12, .85)));
      cs.forEach((c, i) => c.setAttribute('fill', i < lit ? C[nums[toneOf[i]].tone] : C.line));
      let start = 0;
      nums.forEach(({ d, nm }) => { nm.textContent = fmt(clamp(lit - start, 0, d.count)); start += d.count; });
    };
    set(0);
    return { set, part: {}, dur: 1.6, el: svg };
  }

  /* ---------- timeline: phases as bars, milestones as diamonds, a today line ---------- */
  function timeline(svg, o) {
    const { W, H, root } = frame(svg, o, 960, 360), P = o.phases || [], M = o.milestones || [];
    const x = linear(o.start, o.end, 8, W - 8), tf = typeof o.tickFormat === 'function' ? o.tickFormat : String;
    const top = caption(root, o), base = H - 34, MS = F(600, 18, C.fg), TS = mono(16, C.fg, 600);
    // milestone labels and the today label share one lane; each takes the lowest level where it does not touch its left neighbour
    const marks = [...M.map(m => ({ m, s: m.label, st: MS })), ...(o.today != null ? [{ today: true, m: { at: o.today }, s: o.todayLabel || 'today', st: TS }] : [])]
      .map(p => { const w = measure(root, p.s, p.st); return Object.assign(p, { w, cx: clamp(x(p.m.at), w / 2, W - w / 2) }); }).sort((a, b) => a.cx - b.cx);
    const lv = [];
    marks.forEach(p => { let k = 0; while (lv[k] != null && lv[k] > p.cx - p.w / 2 - 12) k++; lv[k] = p.cx + p.w / 2; p.k = k; });
    const laneB = top + lv.length * 24, dy = laneB + 14, labY = k => laneB - 6 - k * 24;
    const ends = [], rowOf = P.map(p => { if (p.row != null) return p.row; let r = 0; while (ends[r] != null && ends[r] > p.from) r++; ends[r] = p.to; return r; });
    const rows = P.length ? Math.max(...rowOf) + 1 : 0, p0 = M.length ? dy + 16 : laneB + 8, rowH = Math.min(56, (base - 8 - p0) / Math.max(rows, 1));
    // a thick bar carries its label inside; a thin one carries it above
    const inside = rowH >= 30, bh = inside ? Math.min(34, rowH - 6) : Math.max(6, rowH - 22), py = base - 8 - rows * rowH;
    const axes = g(root);
    svgEl('line', { x1: 0, x2: W, y1: base, y2: base, stroke: C.line, 'stroke-width': 1.5 }, axes);
    const ticks = o.ticks || (() => { const s = niceStep(o.end - o.start, W < 640 ? 4 : 7), a = []; for (let v = Math.ceil(o.start / s) * s; v <= o.end; v += s) a.push(v); return a; })();
    ticks.forEach(tk => { const at = tk.at ?? tk, xx = x(at); svgEl('line', { x1: xx, x2: xx, y1: base, y2: base + 8, stroke: C.line, 'stroke-width': 1.5 }, axes); txt(axes, xx, base + 30, tk.label ?? tf(at), { 'text-anchor': xx < 40 ? 'start' : xx > W - 40 ? 'end' : 'middle', style: mono(17, C['fg-3']) }); });
    const phases = P.map((p, i) => {
      const tone = p.tone || 'grey', ry = py + rowOf[i] * rowH + (rowH - bh) / (inside ? 2 : 1), a = x(p.from), w = x(p.to) - a;
      const r = svgEl('rect', { x: a, y: ry, height: bh, rx: Math.min(10, bh / 2), fill: paint(tone) }, root);
      const fits = inside && measure(root, p.label, F(600, 18, C.fg)) < w - 20;
      const lab = txt(root, a + (fits ? 12 : 0), fits ? ry + bh / 2 + 6 : ry - 7, p.label, { style: F(600, 18, fits ? C.bg : ink(tone)) + (fits ? '' : HALO) });
      return t => { r.setAttribute('width', w * easeOut(t)); op(lab, seg(t, .8, 1)); };
    });
    const ms = marks.filter(p => !p.today).map(({ m, k, cx }) => {
      const G = g(root), mx = x(m.at), tone = m.tone || 'fg';
      svgEl('line', { x1: mx, x2: mx, y1: dy, y2: base, stroke: C['line-2'], 'stroke-width': 1.5, 'stroke-dasharray': '3 5' }, G);
      const dm = svgEl('path', { d: 'M0 -10L10 0L0 10L-10 0Z', fill: C.bg, stroke: ink(tone), 'stroke-width': 3.5, 'stroke-linejoin': 'round' }, G);
      const lab = txt(G, cx, labY(k), m.label, { 'text-anchor': 'middle', style: F(600, 18, ink(tone)) });
      return t => { op(G, t > 0 ? 1 : 0); dm.setAttribute('transform', `translate(${mx} ${dy}) scale(${.4 + .6 * easeOut(t)})`); op(lab, seg(t, .4, 1)); };
    });
    const today = g(root), tm = marks.find(p => p.today);
    let tLine = null;
    if (tm) {
      tLine = svgEl('line', { x1: x(o.today), x2: x(o.today), y1: labY(tm.k) + 8, stroke: C.fg, 'stroke-width': 2, 'stroke-dasharray': '4 6' }, today);
      txt(today, tm.cx, labY(tm.k), tm.s, { 'text-anchor': 'middle', style: TS });
    }
    const d = phases.length > 1 ? .3 / (phases.length - 1) : 0;
    const set = t => {
      op(axes, seg(t, 0, .1));
      phases.forEach((f, i) => f(seg(t, .05 + i * d, .45 + i * d)));
      ms.forEach((f, i) => f(seg(t, .65 + i * .04, .85 + i * .04)));
      op(today, seg(t, .85, 1)); if (tLine) tLine.setAttribute('y2', lerp(labY(tm.k) + 8, base, ease(seg(t, .85, 1))));
    };
    set(0);
    return { set, part: {}, dur: 1.8, el: svg };
  }

  /* ---------- steps: boxes joined by arrows that appear in order, with a travelling dot ---------- */
  function steps(svg, o) {
    const { W, H, root } = frame(svg, o, 960, 240), S = o.steps, n = S.length, gap = clamp(W * .06, 30, 60);
    const top = caption(root, o), bw = (W - gap * (n - 1)) / n, bh = Math.min(H - top - 8, 150, bw * .7 + 40), by = top + (H - top - bh) / 2, cy = by + bh / 2;
    // a label wraps at word breaks, then steps its type down, until it fits the box; it is never cut
    const wrap = (s, st) => s.split(' ').reduce((ls, w) => { const l = ls.length ? ls[ls.length - 1] + ' ' + w : w; if (ls.length && measure(root, l, st) <= bw - 20) ls[ls.length - 1] = l; else ls.push(w); return ls; }, []);
    const fit = (s, sub) => {
      for (let fs = 22; fs >= 14; fs--) {
        const st = F(600, fs, C.fg), ls = wrap(s, st);
        if (ls.length <= 3 && ls.every(l => measure(root, l, st) <= bw - 20) && ls.length * fs * 1.2 + (sub ? 26 : 0) <= bh - 16) return { lines: ls, fs };
      }
      return { lines: wrap(s, F(600, 14, C.fg)), fs: 14 };
    };
    const boxes = S.map((s, i) => {
      const G = g(root), bx = i * (bw + gap), tone = s.tone, { lines: ls, fs } = fit(s.label, s.sub);
      svgEl('rect', { x: bx, y: by, width: bw, height: bh, rx: 16, fill: C.bg, stroke: tone ? C[tone] : C.line, 'stroke-width': tone ? 2.5 : 1.5 }, G);
      const lh = fs * 1.2, h = ls.length * lh + (s.sub ? 26 : 0), y0 = cy - h / 2 + fs * .85;
      ls.forEach((l, k) => txt(G, bx + bw / 2, y0 + k * lh, l, { 'text-anchor': 'middle', style: F(600, fs, tone ? ink(tone) : C.fg) }));
      if (s.sub) txt(G, bx + bw / 2, y0 + ls.length * lh + 8, s.sub, { 'text-anchor': 'middle', style: mono(15, C['fg-3']) });
      return { G, bx };
    });
    const arrows = boxes.slice(0, -1).map(({ bx }) => {
      const a = bx + bw + 8, b = bx + bw + gap - 8, G = g(root);
      const ln = svgEl('line', { x1: a, y1: cy, y2: cy, stroke: C['fg-3'], 'stroke-width': 2.5, 'stroke-linecap': 'round' }, G);
      const hd = svgEl('path', { d: `M${b - 9} ${cy - 7}L${b} ${cy}L${b - 9} ${cy + 7}`, fill: 'none', stroke: C['fg-3'], 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, G);
      return { a, b, ln, hd };
    });
    const dot = svgEl('circle', { r: 7, cy, fill: C[o.tone || 'm1'], stroke: C.bg, 'stroke-width': 3 }, root);
    const place = (i, p) => { const ar = arrows[i]; op(dot, ar && p > 0 && p < 1 ? 1 : 0); if (ar) dot.setAttribute('cx', lerp(ar.a, ar.b, p)); };
    const flow = u => { if (!arrows.length) return; const s = clamp(u, 0, 1) * arrows.length, i = Math.min(Math.floor(s), arrows.length - 1); place(i, s - i); };
    const per = 1 / n;
    const set = t => {
      let moving = null;
      boxes.forEach((b, i) => { const p = easeOut(seg(t, i * per, i * per + per * .45)); op(b.G, p); b.G.setAttribute('transform', `translate(0 ${(1 - p) * 10})`); });
      arrows.forEach((ar, i) => {
        const p = seg(t, i * per + per * .45, (i + 1) * per);
        ar.ln.setAttribute('x2', lerp(ar.a, ar.b - 2, p)); op(ar.ln, p > 0 ? 1 : 0); op(ar.hd, p >= 1 ? 1 : 0);
        if (p > 0 && p < 1) moving = [i, p];
      });
      if (moving) place(...moving); else op(dot, 0);
    };
    set(0);
    return { set, part: { flow }, dur: .7 * n, el: svg };
  }

  /* ---------- number: a big figure that counts up, a unit and one grey line (HTML) ---------- */
  function number(el, o) {
    const fmt = formatter(o.format, [o.value]);
    el.replaceChildren(); el.classList.add('kit-num');
    if (o.label) { el.setAttribute('role', 'img'); el.setAttribute('aria-label', o.label); }
    const big = document.createElement('p'), v = document.createElement('span'), line = document.createElement('p');
    big.className = 'big kit-num-v'; if (o.tone) big.style.color = `var(--${INK[o.tone] || o.tone})`;
    if (o.px) big.style.fontSize = o.px + 'px';
    big.append(v);
    if (o.unit) { const u = document.createElement('small'); u.textContent = (/^[%×°]/.test(o.unit) ? '' : ' ') + o.unit; big.append(u); }
    line.className = 'kit-num-line'; line.textContent = o.line || '';
    el.append(big, line);
    const set = t => { v.textContent = (o.prefix || '') + fmt(o.value * easeOut(seg(t, 0, .85))); line.style.opacity = seg(t, .6, 1); };
    set(0);
    return { set, part: {}, dur: 1.2, el };
  }

  /* ---------- markup mode: <svg data-kit="bars" data-kit-data='{…}'> plays with its press, no JavaScript ---------- */
  const SVG_FREE = new Set(['number']);
  const state = new WeakMap();
  function build(el) {
    const name = el.dataset.kit, fn = API[name];
    if (typeof fn !== 'function' || name === 'auto') throw new Error(`data-kit="${name}" is not a Kit component`);
    let o;
    try { o = JSON.parse(el.dataset.kitData || '{}'); } catch (e) { throw new Error(`data-kit-data on data-kit="${name}" is not valid JSON: ${e.message}`); }
    if (!o.label && el.getAttribute('aria-label')) o.label = el.getAttribute('aria-label');
    const target = SVG_FREE.has(name) || el.tagName.toLowerCase() === 'svg' ? el : el.querySelector(':scope > svg.kit-svg') || svgEl('svg', {}, el);
    return fn(target, o);
  }
  function auto(slide) {
    const st = state.get(slide);
    if (st && st.fresh) return st.list;
    const list = $$('[data-kit]', slide).map(el => {
      const host = el.closest('[data-s]');
      return { el, c: build(el), press: host && slide.contains(host) ? +host.dataset.s : 0 };
    });
    state.set(slide, { list, fresh: true, last: -1, m: tracker() });
    return list;
  }
  function step(slide, k) {
    const st = state.get(slide); if (!st) return;
    st.m.stop();
    const forward = k === st.last + 1; st.last = k;
    let lead = 0;
    st.list.forEach(({ el, c, press }) => {
      if (forward && press === k) { c.set(0); st.m.tw(+el.dataset.kitDur || c.dur, c.set, .15 + lead); lead += .12; }
      else c.set(k >= press ? 1 : 0);
    });
  }
  const original = Deck.call;
  Deck.call = function (s, name, arg) {
    original.call(this, s, name, arg);
    if (!s.querySelector('[data-kit]')) return;
    try {
      if (name === 'enter') auto(s);
      else if (name === 'step') step(s, arg);
      else if (name === 'leave') { const st = state.get(s); if (st) { st.m.stop(); st.fresh = false; st.last = -1; } }
    } catch (e) { console.error(s.id, 'kit', e); }
  };

  const API = { bars, versus, lines, area, tank, dots, timeline, steps, number, auto };
  return API;
})();
