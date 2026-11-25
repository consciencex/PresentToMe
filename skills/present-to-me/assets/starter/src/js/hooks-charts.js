/* ===== Chart slides: pressures, tests, day ===== */
// Every script is concatenated into one <script>, so this file keeps its names inside one function scope.
(function () {
  const mono = (size, color, weight = 500) => F(weight, size, color, 'var(--f-mono)');
  const disp = (size, color, weight = 700) => F(weight, size, color, 'var(--f-display)') + ';font-stretch:112%';
  const pct = v => Math.round(v * 100) + '%';

  /* ---------- 01 · pressures ---------- */
  // example data: one long cut, in hours from the left edge of the drawing, and the cold room's response
  const CUT = { from: 2, to: 5, span: 10, cold: -20, limit: -15, rise: 8, warmH: 2, coolH: 1.2, perYear: 4 };

  let price, peak, cut;

  function buildPrice(svg) {
    svg.replaceChildren();
    const b0 = INPUT.billMonth, g = INPUT.growth, past = [];
    for (let i = PAST_RISE.length - 1, v = b0; i >= 0; i--) { v /= 1 + PAST_RISE[i]; past.unshift(v); }
    const vals = [...past, b0, ...[1, 2, 3, 4, 5].map(y => b0 * Math.pow(1 + g, y))];
    const x0 = 24, x1 = 456, base = 372, top = 110, slot = (x1 - x0) / vals.length, bw = slot * 0.66;
    const y = linear(0, Math.max(...vals) * 1.04, base, top), today = past.length;
    txt(svg, x0, 40, 'MONTHLY POWER BILL', { style: mono(16, C['fg-3']) + ';letter-spacing:.06em' });
    svgEl('line', { x1: x0, x2: x1, y1: base, y2: base, stroke: C.line, 'stroke-width': 1.5 }, svg);
    const bars = vals.map((v, i) => {
      const fut = i > today, cx = x0 + slot * (i + .5);
      const r = svgEl('rect', { x: cx - bw / 2, width: bw, rx: 4, fill: fut ? C['m2-soft'] : C.m2, 'fill-opacity': i < today ? .55 : 1, stroke: fut ? C.m2 : 'none', 'stroke-width': 2, 'stroke-dasharray': fut ? '5 4' : '' }, svg);
      return { r, h: base - y(v), cx };
    });
    const lab = (i, s, style, dy = 14) => txt(svg, bars[i].cx, base - bars[i].h - dy, s, { 'text-anchor': 'middle', style });
    const labels = [
      lab(0, fmtMoney(vals[0]), F(500, 19, C['fg-3'])),
      lab(today, fmtMoney(b0), disp(32, C.fg)),
      lab(vals.length - 1, fmtMoney(vals[vals.length - 1]), disp(32, C['m2-ink'])),
      txt(svg, bars[today + 3].cx, 74, `+${fmtN(g * 100, g * 100 % 1 ? 1 : 0)}% a year`, { 'text-anchor': 'middle', style: F(600, 19, C['m2-ink']) }),
      ...[[0, '−5 yrs'], [today, 'today'], [vals.length - 1, '+5 yrs']].map(([i, s]) => txt(svg, bars[i].cx, base + 32, s, { 'text-anchor': 'middle', style: mono(16, i === today ? C.fg : C['fg-3'], i === today ? 600 : 500) })),
    ];
    const set = t => {
      bars.forEach((b, i) => { const u = easeOut(clamp(t * 1.6 - i * .055, 0, 1)), h = b.h * u; b.r.setAttribute('y', base - h); b.r.setAttribute('height', h); });
      labels.forEach(l => l.setAttribute('opacity', clamp((t - .7) / .3, 0, 1)));
    };
    return { set };
  }

  function buildPeak(svg) {
    svg.replaceChildren();
    const L = DAY.load, n = L.length, max = Math.max(...L), hMax = L.indexOf(max), avg = L.reduce((a, v) => a + v, 0) / n;
    const x0 = 24, x1 = 456, base = 372, top = 120, ymax = Math.ceil(max * 1.1 / 100) * 100;
    const x = linear(0, n - 1, x0, x1), y = linear(0, ymax, base, top), pts = L.map((v, h) => [x(h), y(v)]);
    txt(svg, x0, 40, 'WEEKDAY DRAW · kW', { style: mono(16, C['fg-3']) + ';letter-spacing:.06em' });
    const area = svgEl('path', { d: smoothPath(pts) + ` L${x1} ${base} L${x0} ${base} Z`, fill: C['m2-soft'] }, svg);
    svgEl('line', { x1: x0, x2: x1, y1: base, y2: base, stroke: C.line, 'stroke-width': 1.5 }, svg);
    const line = svgEl('path', { d: smoothPath(pts), fill: 'none', stroke: C.fg, 'stroke-width': 3.5, 'stroke-linejoin': 'round' }, svg);
    const len = line.getTotalLength(); line.style.strokeDasharray = len;
    const avgG = svgEl('g', {}, svg);
    svgEl('line', { x1: x0, x2: x1, y1: y(avg), y2: y(avg), stroke: C['fg-3'], 'stroke-width': 2, 'stroke-dasharray': '6 6' }, avgG);
    txt(avgG, x(hMax), y(avg) + 30, `average ${fmtN(avg)} kW`, { 'text-anchor': 'middle', style: F(500, 19, C['fg-3']) });
    const pkG = svgEl('g', {}, svg);
    svgEl('line', { x1: x0, x2: x1, y1: y(max), y2: y(max), stroke: C['m2-ink'], 'stroke-width': 2 }, pkG);
    svgEl('circle', { cx: x(hMax), cy: y(max), r: 9, fill: C['m2-ink'], stroke: C.bg, 'stroke-width': 3 }, pkG);
    txt(pkG, x0, y(max) - 44, `peak ${fmtN(max)} kW`, { style: disp(28, C['m2-ink']) });
    txt(pkG, x0, y(max) - 16, 'this hour sets the charge', { style: F(500, 19, C['m2-ink']) });
    [[0, '00:00'], [12, '12:00'], [23, '23:00']].forEach(([h, s]) => txt(svg, x(h), base + 32, s, { 'text-anchor': h ? h === 23 ? 'end' : 'middle' : 'start', style: mono(16, C['fg-3']) }));
    const set = t => {
      line.style.strokeDashoffset = len * (1 - ease(clamp(t / .55, 0, 1)));
      area.setAttribute('opacity', clamp((t - .3) / .3, 0, 1));
      avgG.setAttribute('opacity', clamp((t - .55) / .15, 0, 1));
      const p = clamp((t - .72) / .28, 0, 1);
      pkG.setAttribute('opacity', p); pkG.setAttribute('transform', `translate(0 ${(1 - easeOut(p)) * 10})`);
    };
    return { set };
  }

  function buildCut(svg) {
    svg.replaceChildren();
    const c = CUT, x0 = 24, x1 = 456, x = linear(0, c.span, x0, x1), ty = linear(-22, -12, 400, 168);
    const peakT = c.cold + c.rise * (1 - Math.exp(-(c.to - c.from) / c.warmH));
    const temp = h => h <= c.from ? c.cold : h <= c.to ? c.cold + c.rise * (1 - Math.exp(-(h - c.from) / c.warmH)) : c.cold + (peakT - c.cold) * Math.exp(-(h - c.to) / c.coolH);
    const pts = []; for (let h = 0; h <= c.span + 1e-9; h += .1) pts.push([x(h), ty(temp(h))]);
    const d = 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L');

    const defs = svgEl('defs', {}, svg);
    const reveal = svgEl('rect', { x: x0 - 4, y: 0, height: 440, width: 0 }, svgEl('clipPath', { id: 'pzReveal' }, defs));
    svgEl('rect', { x: 0, y: 0, width: 480, height: ty(c.limit) }, svgEl('clipPath', { id: 'pzHot' }, defs));

    txt(svg, x0, 40, 'COLD ROOM · °C', { style: mono(16, C['fg-3']) + ';letter-spacing:.06em' });
    txt(svg, x1, 40, `${c.perYear} cuts last year`, { 'text-anchor': 'end', style: F(500, 19, C['fg-3']) });
    txt(svg, x0, 84, 'grid', { style: mono(15, C['m2-ink']) });
    svgEl('rect', { x: x(c.from), y: 96, width: x(c.to) - x(c.from), height: 16, fill: C['risk-soft'] }, svg);
    txt(svg, (x(c.from) + x(c.to)) / 2, 138, `cut · ${c.to - c.from} h`, { 'text-anchor': 'middle', style: F(600, 19, C.risk) });
    svgEl('line', { x1: x0, x2: x1, y1: ty(c.limit), y2: ty(c.limit), stroke: C.risk, 'stroke-width': 2, 'stroke-dasharray': '7 5' }, svg);
    txt(svg, x0, ty(c.limit) - 12, `limit ${fmtN(c.limit).replace('-', '−')} °C`, { style: F(600, 19, C.risk) });
    svgEl('line', { x1: x0, x2: x1, y1: 400, y2: 400, stroke: C.line, 'stroke-width': 1.5 }, svg);
    [[0, '0 h'], [c.span, `${c.span} h`]].forEach(([h, s]) => txt(svg, x(h), 428, s, { 'text-anchor': h ? 'end' : 'start', style: mono(16, C['fg-3']) }));

    const shown = svgEl('g', { 'clip-path': 'url(#pzReveal)' }, svg);
    svgEl('rect', { x: x0, y: 96, width: x(c.from) - x0, height: 16, rx: 3, fill: C.m2 }, shown);
    svgEl('rect', { x: x(c.to), y: 96, width: x1 - x(c.to), height: 16, rx: 3, fill: C.m2 }, shown);
    svgEl('path', { d, fill: 'none', stroke: C.fg, 'stroke-width': 3.5, 'stroke-linejoin': 'round' }, shown);
    svgEl('path', { d, fill: 'none', stroke: C.risk, 'stroke-width': 4.5, 'stroke-linejoin': 'round', 'clip-path': 'url(#pzHot)' }, shown);

    const head = svgEl('g', {}, svg);
    svgEl('line', { y1: 92, y2: 400, stroke: C['fg-3'], 'stroke-width': 1.5 }, head);
    const dot = svgEl('circle', { r: 8, stroke: C.bg, 'stroke-width': 3 }, head);
    const read = txt(head, 0, 0, '');

    // one sweep of the playhead, then a pause on the full picture before it starts again
    const SWEEP = 5.2, HOLD = 1.6;
    const set = t => {
      const u = clamp((t % (SWEEP + HOLD)) / SWEEP, 0, 1), h = u * c.span, px = x(h), T = temp(h), hot = T > c.limit;
      reveal.setAttribute('width', px - x0 + 4);
      head.setAttribute('opacity', u > 0 && u < 1 ? 1 : 0);
      head.querySelector('line').setAttribute('x1', px); head.querySelector('line').setAttribute('x2', px);
      dot.setAttribute('cx', px); dot.setAttribute('cy', ty(T)); dot.setAttribute('fill', hot ? C.risk : C.fg);
      // the curve right of the playhead is not drawn yet, so the readout sits there; near the end it flips above-left
      const right = px < x1 - 120;
      read.setAttribute('x', right ? px + 16 : px - 12); read.setAttribute('y', right ? ty(T) + 8 : ty(T) - 18);
      read.setAttribute('text-anchor', right ? 'start' : 'end');
      read.setAttribute('style', disp(22, hot ? C.risk : C.fg));
      read.textContent = fmtN(T, 1).replace('-', '−') + ' °C';
    };
    const loop = loopOn('pressures', set);
    return { set, loop };
  }

  H.pressures = pressHook({
    build(s) {
      price = buildPrice(s.querySelector('#pzPrice'));
      peak = buildPeak(s.querySelector('#pzPeak'));
      cut = buildCut(s.querySelector('#pzCut'));
    },
    settle(k) {
      price.set(k >= 1 ? 1 : 0); peak.set(k >= 2 ? 1 : 0);
      if (k >= 3) cut.loop.start(); else { cut.loop.stop(); cut.set(0); }
    },
    play(k, m) {
      if (k === 1) m.tw(1.6, t => price.set(t), .2);
      if (k === 2) m.tw(2.2, t => peak.set(t), .2);
      if (k === 3) cut.loop.start();
    },
    leave() { cut && cut.loop.stop(); }
  });

  /* ---------- 02 · tests ---------- */
  // payback is a ceiling: we pass when ours is under the limit; the others pass when what we have covers the need
  const CEILING = Object.fromEntries(TESTS.map(t => [t.id, t.pass === 'atMost']));
  const WORDS = { pay: ['pays back in', 'our limit'], other: ['we have', 'we need'] };
  const dec = v => Number.isInteger(v) ? 0 : 1;
  const passes = t => t.have != null && (t.pass === 'atMost' ? t.have <= t.need : t.have >= t.need);

  function buildTest(box, t) {
    box.querySelector('.tag').textContent = t.name;
    box.querySelector('h3').textContent = t.q;
    box.querySelector('.pk').textContent = t.more;
    const svg = box.querySelector('svg'); svg.replaceChildren();
    const [haveW, needW] = WORDS[t.id] || WORDS.other, ok = passes(t), have = t.have ?? t.need * 1.5;
    svg.setAttribute('aria-label', `${t.name}: ${haveW} ${t.have == null ? 'never' : fmtN(t.have, dec(t.have))} ${t.unit}, ${needW} ${fmtN(t.need, dec(t.need))} ${t.unit}`);
    const x0 = 0, x1 = 470, x = linear(0, Math.max(t.need, have) * 1.18, x0, x1), by = 160, bh = 54;
    const head = txt(svg, x0, 26, haveW.toUpperCase(), { style: mono(17, C['fg-3']) + ';letter-spacing:.06em' });
    const val = txt(svg, x0, 118, '', { style: disp(88, C['m1-ink']) });
    const unit = txt(svg, 0, 118, t.unit, { style: F(500, 26, C['fg-2']) });
    svgEl('rect', { x: x0, y: by, width: x1 - x0, height: bh, rx: 8, fill: C['surface-2'] }, svg);
    const bar = svgEl('rect', { x: x0, y: by, height: bh, rx: 8, fill: ok ? C.m1 : C.risk }, svg);
    const mk = svgEl('g', {}, svg), nx = x(t.need);
    svgEl('line', { x1: nx, x2: nx, y1: by - 16, y2: by + bh + 16, stroke: C.fg, 'stroke-width': 3 }, mk);
    txt(mk, nx, by + bh + 46, `${needW} ${fmtN(t.need, dec(t.need))}`, { 'text-anchor': nx > 300 ? 'end' : 'middle', style: F(600, 23, C.fg) });
    const margin = t.have == null ? 'never pays back' : CEILING[t.id] ? `${fmtN(Math.abs(t.need - t.have), 1)} yrs ${ok ? 'inside' : 'over'} the limit` : `${fmtN(t.have / t.need, 1)}× what we need`;
    const res = txt(svg, x0, 326, margin, { style: F(600, 25, ok ? C.ok : C.risk) });
    const set = u => {
      const e = easeOut(clamp(u / .8, 0, 1));
      bar.setAttribute('width', Math.max(0, x(have) - x0) * e);
      val.textContent = t.have == null ? 'never' : fmtN(t.have * e, dec(t.have));
      unit.setAttribute('x', val.getComputedTextLength() + 12);
      res.setAttribute('opacity', clamp((u - .8) / .2, 0, 1));
      // before its press a box shows only the bar to clear: the empty track and the need line
      [head, val, unit].forEach(n => n.setAttribute('opacity', u > 0 ? 1 : 0));
    };
    return { set, ok };
  }

  let boxes = [], testSlide = null;
  function testState(k) {
    boxes.forEach((b, i) => {
      const reached = k >= i + 1, el = b.el;
      el.classList.toggle('lit', k === i + 1);
      el.classList.toggle('dim', !reached);
      el.classList.toggle('passed', reached && b.ok);
      el.classList.toggle('failed', reached && !b.ok);
      el.querySelector('.tz-flag').textContent = !reached ? '' : b.ok ? '✓ pass' : '✗ fails';
    });
  }
  function buildTests(s) {
    testSlide = s;
    boxes = [...s.querySelectorAll('.tz-b')].map((el, i) => Object.assign({ el }, buildTest(el, TESTS[i])));
  }
  H.tests = pressHook({
    build: buildTests,
    settle(k) { boxes.forEach((b, i) => b.set(k >= i + 1 ? 1 : 0)); testState(k); },
    play(k, m) {
      const b = boxes[k - 1]; if (!b) return;
      testState(k); b.el.classList.remove('passed', 'failed'); b.el.querySelector('.tz-flag').textContent = '';
      m.tw(1.4, u => { b.set(u); if (u >= 1) testState(k); }, .25);
    }
  });
  // the payback box reads the money model, so it redraws when the model changes (the money slide's controls)
  document.addEventListener('model', () => {
    if (!testSlide || !boxes.length) return;
    const k = H.tests.k ?? 0;
    boxes[2] = Object.assign({ el: boxes[2].el }, buildTest(boxes[2].el, TESTS[2]));
    boxes[2].set(k >= 3 ? 1 : 0); testState(k);
  });

  /* ---------- 02 · day ---------- */
  let day;
  function buildDay(s) {
    const svg = s.querySelector('#dyChart'); svg.replaceChildren();
    const L = DAY.load, S = DAY.sun, n = L.length;
    const x0 = 96, x1 = 1150, base = 500, top = 56;
    const ymax = Math.ceil(Math.max(...L) * 1.08 / 200) * 200, stepY = niceStep(ymax, 4);
    const x = linear(0, n - 1, x0, x1), y = linear(0, ymax, base, top);
    for (let v = 0; v <= ymax + 1e-9; v += stepY) {
      svgEl('line', { x1: x0, x2: x1, y1: y(v), y2: y(v), stroke: v ? C['line-2'] : C.line, 'stroke-width': v ? 1 : 1.5 }, svg);
      txt(svg, x0 - 16, y(v) + 6, fmtN(v), { 'text-anchor': 'end', style: mono(17, C['fg-3']) });
    }
    txt(svg, x0 - 16, top - 30, 'kW', { 'text-anchor': 'end', style: mono(17, C['fg-3']) });
    for (let h = 0; h < n; h += 3) txt(svg, x(h), base + 36, String(h).padStart(2, '0') + ':00', { 'text-anchor': 'middle', style: mono(17, C['fg-3']) });

    const gridA = svgEl('path', { fill: C.m2, 'fill-opacity': .26 }, svg);
    const sunA = svgEl('path', { fill: C.m1 }, svg);
    const line = svgEl('path', { d: smoothPath(L.map((v, h) => [x(h), y(v)])), fill: 'none', stroke: C.fg, 'stroke-width': 4, 'stroke-linejoin': 'round' }, svg);
    const len = line.getTotalLength(); line.style.strokeDasharray = len;
    const curve = vals => smoothPath(vals.map((v, h) => [x(h), y(v)]));
    const under = vals => curve(vals) + ` L${x1} ${base} L${x0} ${base} Z`;
    // the sun never exceeds the load, so an opaque sun area over the whole load area leaves exactly the grid's share in blue
    gridA.setAttribute('d', under(L));
    const area = u => sunA.setAttribute('d', under(S.map(v => v * u)));

    const noonH = S.indexOf(Math.max(...S));
    const lab = {
      load: txt(svg, x(n - 1), y(L[n - 1]) - 18, 'site draw', { 'text-anchor': 'end', style: F(600, 22, C.fg) }),
      grid: txt(svg, x(2.5), y(L[2] / 2) + 8, 'from the grid', { 'text-anchor': 'middle', style: F(600, 24, C['m2-ink']) }),
      sun: txt(svg, x(noonH), y(S[noonH] * .45) + 8, 'from our roof', { 'text-anchor': 'middle', style: F(700, 24, C.bg) }),
    };

    const hover = svgEl('line', { y1: top, y2: base, stroke: C['fg-3'], 'stroke-width': 1.5, opacity: 0 }, svg);
    const slot = (x1 - x0) / (n - 1);
    L.forEach((v, h) => {
      const r = svgEl('rect', { x: x(h) - slot / 2, y: top, width: slot, height: base - top, fill: 'transparent' }, svg);
      bindTip(r, () => {
        const k = H.day.k ?? 0, sun = k >= 2 ? S[h] : 0;
        return `<b>${String(h).padStart(2, '0')}:00</b> · site ${fmtN(v)} kW<br>${k >= 2 ? `roof ${fmtN(sun)} kW · ` : ''}grid ${fmtN(v - sun)} kW`;
      });
      r.addEventListener('pointerenter', () => { hover.setAttribute('x1', x(h)); hover.setAttribute('x2', x(h)); hover.setAttribute('opacity', 1); });
      r.addEventListener('pointerleave', () => hover.setAttribute('opacity', 0));
    });

    const share = MODEL.sunKwh / MODEL.loadKwh;
    s.querySelector('#dyLoad').innerHTML = `${fmtN(MODEL.loadKwh)} <small>kWh a day</small>`;
    s.querySelector('#dySunKwh').textContent = `${fmtN(MODEL.sunKwh)} of ${fmtN(MODEL.loadKwh)} kWh`;
    s.querySelector('#dyNoon').textContent = pct(MODEL.noonShare);
    const big = s.querySelector('#dyShare');

    const setLoad = u => { line.style.strokeDashoffset = len * (1 - ease(clamp(u / .8, 0, 1))); gridA.setAttribute('opacity', clamp((u - .4) / .6, 0, 1)); lab.load.setAttribute('opacity', clamp((u - .7) / .3, 0, 1)); lab.grid.setAttribute('opacity', clamp((u - .7) / .3, 0, 1)); };
    const setSun = u => { area(ease(u)); lab.sun.setAttribute('opacity', clamp((u - .75) / .25, 0, 1)); big.textContent = pct(share * easeOut(u)); };
    day = { setLoad, setSun };
  }
  H.day = pressHook({
    build: buildDay,
    settle(k) { day.setLoad(k >= 1 ? 1 : 0); day.setSun(k >= 2 ? 1 : 0); },
    play(k, m) {
      if (k === 1) m.tw(1.6, day.setLoad, .1);
      if (k === 2) m.tw(1.6, day.setSun, .2);
    }
  });
})();
