/* ===== An explainer deck: one thing, from the outside, to the inside, to a day in use =====
   EXAMPLE CONTENT. To retell this deck for another subject, change three places and leave the drawing code alone:
     1. The data block below. Every list may grow or shrink. Give its slide one press per row (data-steps) and one note per press.
     2. INPUT, DAY and runModel in model.js: the numbers, and how one follows from another.
     3. The words in slides/*.html.
   The two figures are anatomy/scenes/battery.mjs (the subject) and house.mjs (the place it goes). Call another preset there
   (laptop, phone, tower, rack, box, column), run the scene file, and keep the piece names in step with PARTS and PLACE. */
(function () {
  /* ---------- the data: everything in this block is about a home battery ---------- */
  const THING = SCN.battery;
  const GLOW = ['cells'];        // the pieces that light on the title once the figure has come together

  // whole: the card shown before the first part. parts: one per press. piece is a layer of the figure, fig returns the one number on the card
  const WHOLE = { tag: 'The battery', h: 'One cabinet, four layers', line: 'No bigger than a suitcase. It comes apart from the floor up.', fig: () => ['60', 'cm tall'] };   // example data
  const PARTS = [
    { piece: 'base', tag: '1 · Base', h: 'Carries the weight', line: 'A steel foot, bolted to the floor. The cabinet is as heavy as a full fridge.', fig: () => ['120', 'kg'] },   // example data
    { piece: 'cells', tag: '2 · Cells', h: 'Store the energy', line: 'Everything the cabinet holds is in this block. Nothing else stores anything.', fig: () => [n1(INPUT.capacity), 'kWh'] },
    { piece: 'board', tag: '3 · Control board', h: 'Decides when', line: 'Charges when the roof has power to spare. Gives it back when the house asks.', fig: () => [n1(INPUT.power), 'kW at once'] },
    { piece: 'cover', tag: '4 · Cover', h: 'Keeps it sealed', line: 'Steel, with no fan and nothing that moves. It can stand outside.', fig: () => ['0', 'moving parts'] },
  ];

  // place: the scene the subject goes into, the piece of it the subject stands on, and the parts of the scene it works with.
  // size is the subject's width as a share of the scene's, and nudge moves it by the same share. whole is the card shown on arriving
  const PLACE = {
    scene: SCN.house, on: 'base', size: 0.15, nudge: [0.045, -0.012],
    whole: { tag: 'The battery', h: 'Stands by the wall', line: 'On the ground, where the power comes into the house.', fig: () => ['0.2', 'm² of floor'] },   // example data
    parts: [
      { piece: 'roof', tag: '1 · Roof', h: 'Makes power by day', line: 'Panels turn daylight into power. Most of it comes around noon.', fig: () => [n1(MODEL.sunPeak), 'kW at noon'], lift: 0.45 },
      { piece: 'living', tag: '2 · Rooms', h: 'Use most after dark', line: 'Cooking, lights and screens come on when the sun has gone.', fig: () => [n1(INPUT.evening), 'kWh an evening'], tone: 'm3', lift: 0 },
    ],
  };

  // day: the rows of the chart, top to bottom. fills are drawn over each other, and rows with the same scale share it.
  // A note with a time is written to the left of that point of the row, or to the right of a ring. A note with rule: true is a line across the row
  const LANES = [
    { id: 'roof', tag: 'Roof', does: 'makes', scale: 'made', top: m => m.sunPeak, ghost: m => m.sun, fills: [{ of: m => m.sun, tone: 'm1' }],
      notes: m => [{ t: m.sunPeakAt, v: m.sunPeak, text: `${n1(m.sunPeak)} kW at noon`, tone: 'm1' }] },
    { id: 'battery', tag: 'Battery', does: 'holds', scale: 'held', top: (m, I) => I.capacity, fills: [{ of: m => m.level, tone: 'm1' }],
      notes: (m, I) => [{ v: I.capacity, rule: true, text: `full at ${n1(I.capacity)} kWh` }, m.emptyAt != null && { t: m.emptyAt, v: 0, ring: true, text: `empty ${clock(m.emptyAt)}`, tone: 'risk' }] },
    { id: 'house', tag: 'House', does: 'uses', scale: 'used', top: m => m.eveningPeak, ghost: m => m.use, fills: [{ of: m => m.use, tone: 'm2', soft: true }, { of: m => m.own, tone: 'm1' }], line: { of: m => m.use, tone: 'm3' },
      notes: (m, I) => [{ t: m.eveningPeakAt - 1, v: m.eveningPeak, text: `${n1(I.evening)} kWh this evening`, tone: 'm3' }] },
  ];
  // the traveller is one parcel of energy. It starts on a row at an hour, and each stage carries it to the next row and hour.
  // fig returns the number on the stage's card and the line under it
  const TRIP = { lane: 'roof', at: m => m.fillsFrom ?? 8 };
  const STAGES = [
    { to: { lane: 'battery', at: m => m.fullAt ?? 13 }, fig: m => [`${n1(m.peak)} kWh`, m.fullAt == null ? 'the most it reaches' : `full by ${clock(m.fullAt)}`] },
    { to: { lane: 'battery', at: m => m.givesFrom ?? 17 }, fig: m => [`${n1((m.givesFrom ?? 17) - (m.fullAt ?? 13))} h`, `held until ${clock(m.givesFrom ?? 17)}`] },
    { to: { lane: 'house', at: () => 24 }, fig: m => [`${n1(m.givenKwh)} kWh`, 'given back by midnight'] },
  ];

  // numbers and limits: one kit drawing per card, in the order of the cards on the slide. options reads the model on entering
  const NUMBERS = [
    { kit: 'tank', options: () => ({ value: INPUT.evening, cap: INPUT.capacity, unit: 'kWh', tone: 'm3', capLabel: 'holds', caption: 'One evening' }) },
    { kit: 'number', options: m => ({ value: +m.hours.toFixed(1), unit: 'hours', line: 'at the evening\'s average draw', tone: 'm1' }) },
    { kit: 'bars', options: m => ({ format: 'pct', caption: 'Share of one day from the roof', items: [{ label: 'Roof alone', value: m.roofShare }, { label: 'With the battery', value: m.ownShare, tone: 'm1' }] }) },
  ];
  // example data: a winter evening in kWh, the share of the sun that gets through thick cloud, and two appliances in kW
  const WINTER = 14, CLOUD = 0.25, OVEN = 3, CAR = 7;
  const LIMITS = [
    { kit: 'tank', options: () => ({ value: WINTER, cap: INPUT.capacity, unit: 'kWh', tone: 'm3', capLabel: 'holds', caption: 'One winter evening' }) },
    { kit: 'bars', options: m => ({ unit: 'kWh', caption: 'Sun to spare in one day', ref: { value: INPUT.evening, label: 'one evening' },
      items: [{ label: 'Clear day', value: +m.spareKwh.toFixed(1), tone: 'm1' }, { label: 'Thick cloud', value: +runModel({ ...INPUT, sun: CLOUD }).spareKwh.toFixed(1), tone: 'risk' }] }) },
    { kit: 'bars', options: m => ({ unit: 'kW', caption: 'Power at one moment', ref: { value: INPUT.power, label: 'the most it gives' },
      items: [{ label: 'Usual evening', value: +m.eveningPeak.toFixed(1), tone: 'm3' }, { label: 'Oven and car', value: +(m.eveningPeak + OVEN + CAR).toFixed(1), tone: 'risk' }] }) },
  ];

  // tryit: the verdict under the sliders
  const VERDICT = m => m.emptyAt == null
    ? { ok: true, chip: 'Lasts the evening', text: `At midnight ${n1(m.left)} kWh is still in the battery.` }
    : { ok: false, chip: `Empty at ${clock(m.emptyAt)}`, text: 'From then until midnight the house runs on the grid.' };

  /* ---------- the drawing code: nothing below names the subject ---------- */
  const mono = (size, color, weight = 500) => F(weight, size, color, 'var(--f-mono)');
  const HALO = ';paint-order:stroke;stroke:var(--bg);stroke-width:6px;stroke-linejoin:round';
  const ink = tone => C[/^m\d$/.test(tone) ? tone + '-ink' : tone];
  const light = (fig, pieces) => fig.querySelectorAll('[data-piece]').forEach(g => g.querySelectorAll('.iso-solid').forEach(e => pieces.includes(g.dataset.piece) ? e.setAttribute('data-lit', '') : e.removeAttribute('data-lit')));
  // a figure box takes the largest width that keeps the scene's shape inside the element around it, less the height of what shares that element
  const fit = (box, scn) => { const room = box.parentNode, taken = [...room.children].reduce((t, e) => t + (e !== box && getComputedStyle(e).position !== 'absolute' ? e.offsetHeight : 0), 0); box.style.width = Math.floor(Math.min(room.clientWidth, (room.clientHeight - taken) * scn.data.W / scn.data.H)) + 'px'; };
  const listOf = (ol, parts) => ol.replaceChildren(...parts.map(p => { const li = document.createElement('li'), n = document.createElement('span'), [num, name] = p.tag.split(' · '); n.textContent = num; li.append(n, name); return li; }));

  /* title and close: the figure comes together from an explode of `from`, then the named pieces light */
  function hero(box, pieces, from, done) {
    let fig = null, run = null;
    return {
      enter() {
        if (!fig) { fit($(box), THING); fig = placeScene($(box), THING); }
        run && run.stop(); light(fig, []); done && done(false);
        explodeScene(fig, THING, from);
        run = tween(1.3, u => explodeScene(fig, THING, from * (1 - easeOut(u))), () => { light(fig, pieces); done && done(true); });
      },
      leave() { run && run.stop(); }
    };
  }
  H.title = hero('#titleFig', GLOW, 1, on => $('#titleCap').classList.toggle('on', on));
  H.close = hero('#clFig', PARTS.map(p => p.piece), 0.35);

  /* parts and place: a figure explained one part per press. Kit.figure lifts and lights the part, fills the card and aims the leader.
     Before the first press the card is about the whole thing, in the same form. ready(fig) runs once and returns where that card points */
  function partsHook({ box, list, card, lead, scene, parts, whole, ready, assemble }) {
    let fig = null, aim = null;
    const root = $(lead).parentNode, within = el => { let x = 0, y = 0; for (let e = el; e && e !== root; e = e.offsetParent) { x += e.offsetLeft; y += e.offsetTop; } return [x, y]; };
    const row = (tag, cls, text, unit) => { const el = document.createElement(tag); el.className = cls; el.textContent = text; if (unit) { const u = document.createElement('small'); u.textContent = unit; el.append(u); } return el; };
    const first = () => {
      const c = $(card), [value, unit] = whole.fig(), [cx, cy] = within(c), [tx, ty] = aim(within);
      c.dataset.tone = 'm1';
      c.replaceChildren(row('p', 'tag', whole.tag), row('h3', '', whole.h), row('p', '', whole.line), row('p', 'kf-num', value, unit));
      c.classList.add('on');
      svgEl('path', { d: `M${cx} ${cy + 46} H${cx - 36} L${tx.toFixed(1)} ${ty.toFixed(1)}`, fill: 'none', stroke: C.m1, 'stroke-width': 1.6, 'stroke-dasharray': '2 5', 'stroke-linecap': 'round' }, $(lead));
      svgEl('circle', { cx: tx.toFixed(1), cy: ty.toFixed(1), r: 6, fill: C.m1, stroke: C.bg, 'stroke-width': 2.5 }, $(lead));
    };
    return pressHook({
      build() {
        if (fig) return;
        listOf($(list), parts); fit($(box), scene);
        fig = Kit.figure($(box), scene, { parts, card: $(card), list: $(list), leader: $(lead), seconds: 1.2 });
        aim = ready(fig);
      },
      settle(k) { fig.settle(k); if (k === 0) first(); },
      play(k, m) {
        if (k > 0 || assemble) fig.play(k, m);
        // the card waits until the figure has landed. It is hidden at once, so a card left on from an earlier visit does not fade out first
        if (k === 0) { const c = $(card); c.style.transition = 'none'; c.classList.remove('on'); void c.offsetWidth; c.style.transition = ''; $(lead).replaceChildren(); m.later(950, first); }
      }
    });
  }
  // parts: the figure arrives whole from the title, so it does not assemble a second time. Its first card points at the top layer
  H.parts = partsHook({
    box: '#ptFig', list: '#ptList', card: '#ptCard', lead: '#ptLead', scene: THING, parts: PARTS, whole: WHOLE,
    ready: fig => within => { const f = fig.el.offsetWidth / THING.data.W, [x, y] = within(fig.el), [ax, ay] = THING.data.ANCHORS[PARTS[PARTS.length - 1].piece]; return [x + ax * f, y + ay * f]; }
  });
  // place: the scene assembles as the subject lands on it, small. The middle of the subject's own base goes to the anchor of the piece it stands on
  H.place = partsHook({
    box: '#plFig', list: '#plList', card: '#plCard', lead: '#plLead', scene: PLACE.scene, parts: PLACE.parts, whole: PLACE.whole, assemble: true,
    ready(fig) {
      const scn = PLACE.scene, unit = $('#plUnit'), small = placeScene(unit, THING), wide = fig.el.offsetWidth, f = wide / scn.data.W, w = wide * PLACE.size, g = w / THING.data.W;
      const foot = small.querySelector('[data-piece="base"]').getBBox(), body = small.querySelector('g[class$="-items"]').getBBox(), [ax, ay] = scn.data.ANCHORS[PLACE.on];
      light(small, PARTS.map(p => p.piece));
      unit.style.width = w + 'px';
      unit.style.left = fig.el.offsetLeft + ax * f + PLACE.nudge[0] * wide - (foot.x + foot.width / 2) * g + 'px';
      unit.style.top = fig.el.offsetTop + ay * f + PLACE.nudge[1] * wide - (foot.y + foot.height / 2) * g + 'px';
      return within => { const [x, y] = within(unit); return [x + (body.x + body.width * .62) * g, y + (body.y + body.height * .3) * g]; };
    }
  });

  /* the day as rows over one time axis. reveal(hour) draws everything left of that hour in colour.
     sized is the model and the inputs that set each row's scale: the current ones, or the largest the sliders allow */
  let uid = 0;
  function dayChart(svg, M, { from = 6, sized = [M, INPUT] } = {}) {
    svg.replaceChildren();
    const [, , W, H] = svg.getAttribute('viewBox').split(' ').map(Number);
    const n = M.use.length, to = 24, dt = to / n, per = Math.round(1 / dt);
    const x0 = 176, x1 = W - 14, top = 34, axis = 36, gap = 14, head = 32, rowH = (H - top - axis - gap * (LANES.length - 1)) / LANES.length;
    const X = linear(from, to, x0, x1), T = linear(x0, x1, from, to), notes = [];
    const max = {}; LANES.forEach(l => { max[l.scale] = Math.max(max[l.scale] || 0, l.top(...sized)); });
    // a rate has one value per step and is drawn through the middle of each hour. A level has one more, and is drawn point by point
    const mean = (v, h) => v.slice(h * per, (h + 1) * per).reduce((a, b) => a + b, 0) / per;
    const points = v => v.length > n ? v.map((y, i) => [i * dt, y]).filter(p => p[0] >= from)
      : [[from, mean(v, from)], ...Array.from({ length: to - from }, (_, i) => [from + i + .5, mean(v, from + i)]), [to, mean(v, to - 1)]];
    const curve = (v, Y) => { const p = points(v).map(([t, y]) => [X(t), Y(y)]); return v.length > n ? 'M' + p.map(q => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join('L') : smoothPath(p); };

    const id = 'day' + ++uid, clip = svgEl('rect', { x: x0 - 2, y: 0, width: 0, height: H }, svgEl('clipPath', { id }, svgEl('defs', {}, svg)));
    const back = svgEl('g', {}, svg), shown = svgEl('g', { 'clip-path': `url(#${id})` }, svg), ghosts = [], mid = {};
    for (let h = from; h <= to; h += 3) {
      svgEl('line', { x1: X(h), x2: X(h), y1: top, y2: H - axis + 6, stroke: C['line-2'], 'stroke-width': 1 }, back);
      txt(back, X(h), H - 8, clock(h), { 'text-anchor': h === from ? 'start' : h === to ? 'end' : 'middle', style: mono(17, C['fg-3']) });
    }
    LANES.forEach((l, i) => {
      const y1 = top + rowH * (i + 1) + gap * i, Y = linear(0, max[l.scale], y1, y1 - rowH + head), under = d => `${d} L${x1} ${y1} L${x0} ${y1} Z`;
      mid[l.id] = y1 - (rowH - head) / 2;
      txt(back, 0, mid[l.id] - 2, l.tag.toUpperCase(), { style: mono(19, C.fg, 600) + ';letter-spacing:.06em' });
      txt(back, 0, mid[l.id] + 24, l.does, { style: F(400, 20, C['fg-3']) });
      svgEl('line', { x1: x0, x2: x1, y1, y2: y1, stroke: C.line, 'stroke-width': 1.5 }, back);
      if (l.ghost) ghosts.push(svgEl('path', { d: curve(l.ghost(M), Y), fill: 'none', stroke: C.line, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, back));
      l.fills.forEach(a => svgEl('path', { d: under(curve(a.of(M), Y)), fill: C[a.tone], 'fill-opacity': a.soft ? .3 : 1 }, shown));
      if (l.line) svgEl('path', { d: curve(l.line.of(M), Y), fill: 'none', stroke: C[l.line.tone], 'stroke-width': 3.5, 'stroke-linejoin': 'round' }, shown);
      (l.notes ? l.notes(M, INPUT) : []).filter(Boolean).forEach(a => {
        if (a.rule) {
          svgEl('line', { x1: x0, x2: x1, y1: Y(a.v), y2: Y(a.v), stroke: C['fg-3'], 'stroke-width': 1.5, 'stroke-dasharray': '5 6' }, back);
          txt(back, x0 + 8, Y(a.v) - 9, a.text, { style: F(600, 18, C['fg-2']) + HALO });
          return;
        }
        // a note on the curve waits, whole, until the hour it sits at has been reached
        const px = X(a.t), py = Y(a.v), g = svgEl('g', { style: 'transition:opacity .35s ease' }, svg);
        if (a.ring) svgEl('circle', { cx: px, cy: py, r: 9, fill: C.bg, stroke: C[a.tone], 'stroke-width': 3.5 }, g);
        const label = txt(g, px + (a.ring ? 18 : -8), py - (a.ring ? 14 : 10), a.text, { 'text-anchor': a.ring ? 'start' : 'end', style: F(600, 19, ink(a.tone)) + HALO });
        // a label that would run past the right edge moves back inside, above its ring
        const over = a.ring ? px + 18 + label.getComputedTextLength() - x1 : 0;
        if (over > 0) { label.setAttribute('x', px + 18 - over); label.setAttribute('y', py - 26); }
        notes.push({ t: a.t, g });
      });
    });
    const reveal = h => { clip.setAttribute('width', Math.max(0, X(h) - x0 + 2)); notes.forEach(a => { a.g.style.opacity = h >= a.t - .01 ? 1 : 0; }); };
    return { svg, reveal, X, T, mid, ghosts, from, to, top, bottom: H - axis + 6, clip: `url(#${id})` };
  }

  /* the traveller on a day chart. go(p): p is the stage reached, and its fraction the way to the next */
  function tripOn(chart, M) {
    const stops = [TRIP, ...STAGES.map(s => s.to)].map(p => [chart.X(p.at(M)), chart.mid[p.lane]]);
    const trail = svgEl('g', { 'clip-path': chart.clip }, chart.svg);
    const legs = stops.slice(1).map(([bx, by], i) => {
      const [ax, ay] = stops[i], h = (bx - ax) / 2;
      const d = `M${ax} ${ay} C${ax + h} ${ay} ${bx - h} ${by} ${bx} ${by}`, dots = { d, fill: 'none', 'stroke-dasharray': '0 12', 'stroke-linecap': 'round' };
      svgEl('path', { ...dots, stroke: C.bg, 'stroke-width': 6.5 }, trail);     // a paper ring round each dot, so the trail reads on a fill
      return svgEl('path', { ...dots, stroke: C.fg, 'stroke-width': 3 }, trail);
    });
    const now = svgEl('line', { y1: chart.top - 4, y2: chart.bottom, stroke: C['fg-2'], 'stroke-width': 1.5 }, chart.svg);
    const time = txt(chart.svg, 0, chart.top - 12, '', { 'text-anchor': 'middle', style: mono(18, C.fg, 600) });
    const dot = svgEl('circle', { r: 14, fill: C['m1-ink'], stroke: C.bg, 'stroke-width': 4 }, chart.svg);
    return p => {
      const i = clamp(Math.floor(p), 0, legs.length - 1), leg = legs[i], at = leg.getPointAtLength(leg.getTotalLength() * clamp(p - i, 0, 1)), hour = chart.T(at.x);
      dot.setAttribute('cx', at.x); dot.setAttribute('cy', at.y);
      now.setAttribute('x1', at.x); now.setAttribute('x2', at.x);
      time.setAttribute('x', Math.min(at.x, chart.X(chart.to) - 44)); time.textContent = clock(hour);
      chart.reveal(hour);
    };
  }

  /* day: the chart is revealed one stage per press, as the traveller moves. Stage card i belongs to STAGES[i] */
  let day = null;
  const stageCards = k => day.cards.forEach((c, i) => { c.classList.toggle('on', k === i + 1); c.classList.toggle('done', k > i + 1); });
  H.day = pressHook({
    build(s) {
      const chart = dayChart($('#dyChart'), MODEL), cards = $$('.dy-stage', s);
      STAGES.forEach((st, i) => { const [value, note] = st.fig(MODEL); cards[i].querySelector('.dy-n b').textContent = value; cards[i].querySelector('.dy-n small').textContent = note; });
      day = { chart, cards, go: tripOn(chart, MODEL) };
    },
    settle(k) { day.chart.ghosts.forEach(g => { g.style.strokeDasharray = ''; g.style.strokeDashoffset = ''; }); day.go(k); stageCards(k); },
    play(k, m) {
      if (k === 0) { day.chart.ghosts.forEach((g, i) => m.add(drawPath(g, 1.2, .2 + i * .5))); return; }
      stageCards(k); m.tw(1.8, t => day.go(k - 1 + ease(t)), .15);
    }
  });

  /* numbers and limits: card i holds drawing i, and press i + 1 plays it */
  const kitCards = specs => {
    let charts = [];
    return pressHook({
      build(s) { const boxes = $$('.ex-kit', s); charts = specs.map((c, i) => Kit[c.kit](boxes[i], Object.assign({ size: [480, 470], label: boxes[i].getAttribute('aria-label') }, c.options(MODEL)))); },
      settle(k) { charts.forEach((c, i) => c.set(k > i ? 1 : 0)); },
      play(k, m) { const c = charts[k - 1]; if (c) m.tw(c.dur, c.set, .25); }
    });
  };
  H.numbers = kitCards(NUMBERS);
  H.limits = kitCards(LIMITS);

  /* tryit: each slider writes INPUT and calls recompute(). The chart, the verdict and every bound number follow */
  const DEFAULTS = { ...INPUT };
  let live = null, sized = null;
  function drawTry() {
    const v = VERDICT(MODEL);
    $$('#tyInputs input[type=range]').forEach(el => { el.value = INPUT[el.dataset.k]; el.parentNode.querySelector('output').textContent = `${n1(INPUT[el.dataset.k])} ${el.dataset.unit || ''}`; });
    $('#tyChip').className = `chip ${v.ok ? 'g' : 'r'}`; $('#tyChip span').textContent = v.chip; $('#tyText').textContent = v.text;
    live = dayChart($('#tyChart'), MODEL, { sized });
    live.reveal(live.to);
  }
  H.tryit = pressHook({
    build() {
      if (sized) return;
      // the rows keep one scale while the sliders move, set by the largest values the sliders allow
      const most = { ...INPUT }; $$('#tyInputs input[type=range]').forEach(el => { most[el.dataset.k] = +el.max; });
      sized = [runModel(most), most];
      $('#tyInputs').addEventListener('input', e => { const k = e.target.dataset.k; if (!k) return; INPUT[k] = +e.target.value; recompute(); });
      $('#tyReset').onclick = () => { Object.assign(INPUT, DEFAULTS); recompute(); };
      document.addEventListener('model', drawTry);
    },
    settle: drawTry,
    play(k, m) { m.tw(1.4, t => live.reveal(lerp(live.from, live.to, ease(t)))); }
  });
})();
