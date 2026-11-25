/* ===== Money: the three cost lines, the live workbench, the approval page. All three read MODEL. ===== */

/* ---------- options: cost lines that cross ----------
   One line per press. The zone bands under the axis use the crossings as their edges, so a band can never disagree with the lines. */
(function () {
  const o = {};
  const W = 1100, HT = 650, P = { l: 100, r: 190, t: 26, b: 150 };
  const SHOW = { grid: 0, ppa: 1, own: 2 };                       // the press that brings each line in
  const set = (el, v) => el && el.setAttribute('opacity', v);

  function draw() {
    const svg = $('#opSvg'), M = MODEL, n = M.months; svg.innerHTML = '';
    const top = Math.max(M.end.grid, M.end.ppa, M.end.own, INPUT.capex) * 1.08, st = niceStep(top, 5);
    const x = linear(0, n, P.l, W - P.r), y = linear(0, top, HT - P.b, P.t);
    for (let v = 0; v <= top; v += st) { svgEl('line', { x1: P.l, x2: W - P.r, y1: y(v), y2: y(v), stroke: C['line-2'] }, svg); txt(svg, P.l - 14, y(v) + 6, fmtMoney(v), { 'text-anchor': 'end', style: F(400, 17, C['fg-3'], 'var(--f-mono)') }); }
    const every = INPUT.years > 15 ? 5 : INPUT.years > 10 ? 3 : 2;
    for (let yr = 0; yr <= INPUT.years; yr += every) txt(svg, x(yr * 12), HT - P.b + 30, yr ? 'year ' + yr : 'today', { 'text-anchor': 'middle', style: F(400, 17, C['fg-3'], 'var(--f-mono)') });
    o.L = {};
    // end labels are pushed apart so two close lines never print on top of each other
    const ends = OPTIONS.map(op => ({ id: op.id, y: y(M.end[op.id]) })).sort((a, b) => a.y - b.y);
    for (let i = 1; i < ends.length; i++) ends[i].y = Math.max(ends[i].y, ends[i - 1].y + 28);
    OPTIONS.forEach(op => {
      const g = svgEl('g', {}, svg), pts = M.cum[op.id].map((v, m) => `${x(m).toFixed(1)} ${y(v).toFixed(1)}`);
      const d = (op.id === 'own' ? `M${x(0)} ${y(0)}L` : 'M') + pts.join('L');   // owning starts with the purchase: a vertical rise at today
      const path = svgEl('path', { d, fill: 'none', stroke: C[op.tone], 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
      const lab = txt(g, x(n) + 14, ends.find(e => e.id === op.id).y + 7, `${op.short} ${fmtMoney(M.end[op.id])}`, { style: F(600, 20, C[op.tone + '-ink']) });
      o.L[op.id] = { g, path, lab, marks: [] };
    });
    const at = (id, m) => { const a = M.cum[id], i = Math.floor(m); return a[i] + ((a[Math.min(n, i + 1)] ?? a[i]) - a[i]) * (m - i); };
    const mark = (m, label, up) => {
      if (m == null) return;
      const g = svgEl('g', {}, svg), cx = x(m), cy = y(at('own', m));
      svgEl('circle', { cx, cy, r: 10, fill: C.bg, stroke: C.m1, 'stroke-width': 3.5 }, g);
      txt(g, cx + (up ? -16 : 16), cy + (up ? -18 : 34), label, { 'text-anchor': up ? 'end' : 'start', style: F(600, 19, C['m1-ink']) });
      o.L.own.marks.push(g);
    };
    mark(M.payback, `beats the grid · ${yrs(M.payback)}`, true);
    mark(M.ownBeatsPpa, `beats renting · ${yrs(M.ownBeatsPpa)}`, false);
    // zone bands: which option has cost least so far. Before owning overtakes renting it is renting, after it is owning.
    const edge = M.ownBeatsPpa == null ? n : M.ownBeatsPpa, by = HT - P.b + 54, bh = 70;
    const band = (m0, m1, tone, a, b) => {
      const g = svgEl('g', {}, svg), x0 = x(m0) + 4, w = x(m1) - x(m0) - 8; if (w < 60) return g;
      svgEl('rect', { x: x0, y: by, width: w, height: bh, rx: 14, fill: C[tone], 'fill-opacity': .12 }, g);
      txt(g, x0 + w / 2, by + 30, a, { 'text-anchor': 'middle', style: F(600, 19, C[tone + '-ink']) });
      if (w > 200) txt(g, x0 + w / 2, by + 54, b, { 'text-anchor': 'middle', style: F(400, 16, C['fg-3'], 'var(--f-mono)') });
      return g;
    };
    o.zRent = band(0, edge, 'm3', 'Renting costs least', 'no money down');
    o.zOwn = band(edge, n, 'm1', 'Owning costs least', 'the system is paid off');
    $('#opA').textContent = fmtMoney(M.end.grid); $('#opB').textContent = fmtMoney(M.end.ppa); $('#opC').textContent = fmtMoney(M.end.own);
    $('#opYear').textContent = M.ownBeatsPpa == null ? '…' : Math.ceil(M.ownBeatsPpa / 12);
  }
  // the state after press k, with nothing moving
  function settle(k) {
    OPTIONS.forEach(op => { const L = o.L[op.id], on = k >= SHOW[op.id]; set(L.g, on ? 1 : 0); L.path.style.strokeDasharray = ''; L.path.style.strokeDashoffset = ''; set(L.lab, 1); L.marks.forEach(m => set(m, 1)); });
    set(o.zRent, k >= 1 ? 1 : 0); set(o.zOwn, k >= 2 ? 1 : 0);
  }
  // press k draws its line, then fades in the end label, the crossing rings and the band
  function play(k, m) {
    const id = Object.keys(SHOW).find(i => SHOW[i] === k); if (!id) return;
    const L = o.L[id]; set(L.g, 1); set(L.lab, 0); L.marks.forEach(r => set(r, 0));
    m.add(drawPath(L.path, 1.4));
    m.tw(.4, t => set(L.lab, t), 1.2);
    L.marks.forEach((r, i) => m.tw(.5, t => set(r, t), 1.3 + i * .25));
    const z = id === 'ppa' ? o.zRent : id === 'own' ? o.zOwn : null;
    if (z) { set(z, 0); m.tw(.5, t => set(z, t), 1.9); }
  }
  H.options = pressHook({ build: draw, settle, play });
  document.addEventListener('model', () => { if ($('#options').classList.contains('is-active')) { draw(); settle(H.options.k); } });
})();

/* ---------- money: every input writes INPUT and calls recompute(); every slide that shows money follows ---------- */
(function () {
  const DEF = JSON.parse(JSON.stringify(INPUT));
  const FMT = { billMonth: v => fmtMoney(v), growth: v => (v * 100).toFixed(1) + '%', cover: v => Math.round(v * 100) + '%', capex: v => fmtMoney(v), omYear: v => fmtMoney(v), ppaDiscount: v => Math.round(v * 100) + '%' };
  let built = false;
  const W = 1040, HT = 560, P = { l: 100, r: 170, t: 30, b: 60 };

  function sync() {
    $$('#mwInputs input[type=range]').forEach(el => { el.value = INPUT[el.dataset.k]; el.nextElementSibling.textContent = FMT[el.dataset.k](INPUT[el.dataset.k]); });
    $$('#mwYears button').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.y === INPUT.years)));
    const pass = TESTS[2].have != null && TESTS[2].have <= TESTS[2].need, r = $('#mwRule');
    r.textContent = pass ? `inside our ${TESTS[2].need}-year rule` : `past our ${TESTS[2].need}-year rule`; r.className = pass ? 'ok' : 'risk';
  }
  function draw() {
    const svg = $('#mwSvg'), M = MODEL, n = M.months; svg.innerHTML = '';
    const own = M.cum.grid.map((v, m) => v - M.cum.own[m]), rent = M.cum.grid.map((v, m) => v - M.cum.ppa[m]);
    const lo = Math.min(-INPUT.capex, 0), hi = Math.max(own[n], rent[n], 1), pad = (hi - lo) * .08, st = niceStep(hi - lo, 6);
    const x = linear(0, n, P.l, W - P.r), y = linear(lo - pad, hi + pad, HT - P.b, P.t);
    for (let v = Math.ceil((lo - pad) / st) * st; v <= hi + pad; v += st) {
      svgEl('line', { x1: P.l, x2: W - P.r, y1: y(v), y2: y(v), stroke: v === 0 ? C.line : C['line-2'], 'stroke-width': v === 0 ? 2 : 1 }, svg);
      txt(svg, P.l - 14, y(v) + 6, fmtMoney(v), { 'text-anchor': 'end', style: F(400, 17, C['fg-3'], 'var(--f-mono)') });
    }
    const every = INPUT.years > 15 ? 5 : INPUT.years > 10 ? 3 : 2;
    for (let yr = 0; yr <= INPUT.years; yr += every) txt(svg, x(yr * 12), HT - P.b + 32, yr ? 'year ' + yr : 'today', { 'text-anchor': 'middle', style: F(400, 17, C['fg-3'], 'var(--f-mono)') });
    const line = (a, tone, dash) => svgEl('path', { d: 'M' + a.map((v, m) => `${x(m).toFixed(1)} ${y(v).toFixed(1)}`).join('L'), fill: 'none', stroke: C[tone], 'stroke-width': dash ? 3.5 : 5, 'stroke-dasharray': dash ? '10 8' : '', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, svg);
    line(rent, 'm3', true); line(own, 'm1', false);
    let yo = y(own[n]), yr2 = y(rent[n]); if (Math.abs(yo - yr2) < 30) yr2 = yo + (yr2 >= yo ? 30 : -30);
    txt(svg, x(n) + 14, yo + 7, `Own ${fmtMoney(own[n])}`, { style: F(700, 21, C['m1-ink']) });
    txt(svg, x(n) + 14, yr2 + 7, `Rent ${fmtMoney(rent[n])}`, { style: F(600, 19, C['m3-ink']) });
    if (M.payback != null) {
      svgEl('line', { x1: x(M.payback), x2: x(M.payback), y1: y(0), y2: HT - P.b, stroke: C.m1, 'stroke-dasharray': '4 6', 'stroke-width': 2 }, svg);
      svgEl('circle', { cx: x(M.payback), cy: y(0), r: 11, fill: C.bg, stroke: C.m1, 'stroke-width': 3.5 }, svg);
      txt(svg, x(M.payback) + 20, y(0) + 36, `paid back · ${yrs(M.payback)}`, { style: F(700, 20, C['m1-ink']) });
    }
    txt(svg, x(0) + 6, y(-INPUT.capex) + 34, `the purchase · −${fmtMoney(INPUT.capex)}`, { style: F(500, 17, C['fg-3']) });
  }
  function build() {
    built = true;
    $('#mwInputs').addEventListener('input', e => { const k = e.target.dataset.k; if (!k) return; INPUT[k] = +e.target.value; recompute(); });
    $('#mwYears').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; INPUT.years = +b.dataset.y; recompute(); });
    $('#mwReset').onclick = () => { Object.assign(INPUT, DEF); recompute(); };
    document.addEventListener('model', () => { sync(); draw(); });
  }
  H.money = { enter() { if (!built) build(); sync(); draw(); } };
})();

/* ---------- decision: the list ticks itself; unticking a row takes its amount out of the total ---------- */
(function () {
  let timers = [], built = false;
  const boxes = () => $$('#apBox input');
  function render() {
    const on = k => boxes().some(b => b.dataset.cost === k && b.checked);
    const once = on('capex') ? INPUT.capex : 0, year = on('om') ? INPUT.omYear : 0;
    $('#apTotal').textContent = `${fmtMoney(once)} once + ${fmtMoney(year)} a year`;
    $('#apPay').textContent = on('capex') ? `pays back in ${yrs(MODEL.payback)}` : '';
  }
  H.decision = {
    enter() {
      if (!built) { built = true; $('#apBox').addEventListener('change', render); document.addEventListener('model', render); }
      timers.forEach(clearTimeout); boxes().forEach(b => b.checked = false); render();
      timers = boxes().map((b, i) => setTimeout(() => { b.checked = true; render(); }, 700 + i * 650));
    },
    leave() { timers.forEach(clearTimeout); timers = []; boxes().forEach(b => b.checked = true); render(); }
  };
})();
