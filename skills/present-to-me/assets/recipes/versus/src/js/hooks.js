/* ===== Versus: two things, A or B =====
   To retell this deck for another pair, change three places and leave the code under the data block alone.
     1. The data block below. The two things, what they share, the rows that separate them, the parts of the opened
        figure, the words of the verdict. Any list may be longer or shorter. A slide whose presses follow a list
        (difference, why) needs the same number in its data-steps, and the console says so when they differ.
     2. INPUT and runModel in src/js/model.js. The measures of each thing, and the case the room can change.
     3. The words and the notes in slides/*.html.
   The two figures are anatomy/scenes/light.mjs and studio.mjs, one call to the laptop preset each. For another kind of
   thing, call another preset there (phone, tower, rack, building, box, column, stack), run the file, and use its piece names in PARTS. */
(function () {
  const THINGS = {
    a: { name: 'Light 13', tone: 'm1', scene: 'light', size: .86 },      // size is how large it is drawn beside the other
    b: { name: 'Studio 15', tone: 'm2', scene: 'studio', size: 1 },
  };
  // what both share, as [name, the value they share]
  const SAME = [['Memory', '16 GB'], ['Storage', '512 GB'], ['Display', '500 nits'], ['Ports', '3 fast ports'], ['Camera', '1080p'], ['Warranty', '2 years']];
  // what separates them, in the order of the argument. key is a measure both things have in the model
  const ROWS = [
    { label: 'Weight', key: 'kg', unit: 'kg', better: 'low' },
    { label: 'Battery', key: 'batteryH', unit: 'h', better: 'high' },
    { label: 'Price', key: 'price', format: 'moneyExact', better: 'low' },
    { label: 'Screen', key: 'screen', unit: 'in', better: 'high' },
    { label: 'One heavy job', key: 'jobMin', unit: 'min', better: 'low' },
  ];
  // the thing opened on the "why" slide and its parts, one per press. piece is a name the preset gives
  const OPENED = 'b';
  const PARTS = [
    { piece: 'board', tag: '1 · Chip', h: 'A chip that draws more', fig: M => [M.b.loadW, 'W'],
      line: M => `The Light 13 runs its chip at ${M.a.loadW} W. More power finishes a heavy job sooner.` },
    { piece: 'fan', tag: '2 · Fan', h: 'A fan to hold the speed', fig: M => [M.b.jobMin, 'min a job'],
      line: M => `It carries the heat out, so the chip never slows. The Light 13 has no fan and needs ${M.a.jobMin} min.` },
    { piece: 'battery', tag: '3 · Battery', h: 'A larger battery', fig: M => [M.b.wh, 'Wh'],
      line: M => `The Light 13 holds ${M.a.wh} Wh. The larger chip and screen still drain this one ${M.batteryMore} hours sooner.` },
  ];
  // what the chart and the chooser say. why is the model's outcome, and each pick names what it gives up
  const SAY = {
    cross: M => `paid back · ${span(M.payback)}`,
    ahead: { a: 'Light 13 has cost less', b: 'Studio 15 has cost less' },
    take: M => M.payback == null ? ['The Studio 15 never pays back.', 'The Light 13 costs less from the first day to the last.']
      : [`The Studio 15 pays back in ${span(M.payback)}.`, 'Until then the Light 13 has cost less.'],
    why: {
      pays: M => `It fits your budget and pays back in ${span(M.payback)}.`,
      budget: M => `The Studio 15 is ${money(M.over)} over your budget.`,
      late: M => `The Studio 15 needs ${span(M.payback)} to pay back, and you keep it ${INPUT.years}.`,
      never: () => 'With no heavy work at a desk, the Studio 15 never pays back.',
    },
    cost: {
      a: M => M.savedYear >= 1 ? `You give up about ${fmtN(M.savedYear)} hours a year to waiting.` : 'You give up nothing you would use.',
      b: M => `You give up ${M.kgMore} kg and ${plural(M.batteryMore, 'hour')} of battery.`,
    },
    budget: v => `your budget ${money(v)}`,
    gap: 'Extra price',
    earns: y => `Saved in ${y} years`,
  };
  // how each slider on the chooser prints its value
  const SHOW = { heavyHours: v => plural(v, 'hour'), awayDays: v => plural(v, 'day'), hourValue: money, budget: money };

  /* ---------- nothing below names the subject ---------- */
  const IDS = Object.keys(THINGS), seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const each = (o, fn) => Object.values(o).forEach(fn);
  const sizeOf = el => { const r = el.getBoundingClientRect(); return [Math.round(r.width / Deck.scale), Math.round(r.height / Deck.scale)]; };
  const active = id => Deck.slides[Deck.i] && Deck.slides[Deck.i].id === id;
  const fails = M => M.why === 'late' || M.why === 'never';      // b does not earn back its price in time
  // the check reads the console, so a list that no longer matches its slide stops the check with this line
  const presses = (s, n) => { if (+s.dataset.steps !== n) console.error(`${s.id}: data-steps="${s.dataset.steps}" but its list in hooks.js has ${n} entries. Make them equal, and give the notes one paragraph for each press.`); };

  // counts in titles are read from the lists: <span data-n="same"></span> prints "six"
  const COUNT = { same: SAME.length, parts: PARTS.length };
  const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  $$('[data-n]').forEach(e => { const n = COUNT[e.dataset.n], w = WORDS[n] ?? String(n); e.textContent = e.hasAttribute('data-cap') ? w[0].toUpperCase() + w.slice(1) : w; });

  /* ---------- the two figures ---------- */
  // A preset sizes its figure to hold the whole explode, so the assembled figure sits small in a tall box.
  // This is the same scene with its box drawn round the assembled figure. Lifted parts rise out of the box.
  function atRest(scn) {
    const probe = placeScene(document.body, scn, { style: `position:absolute;left:-9999px;top:0;width:${scn.data.W}px` });
    const b = probe.querySelector('svg').getBBox(), pad = 4, x = b.x - pad, y = b.y - pad, w = b.width + 2 * pad, h = b.height + 2 * pad;
    probe.remove();
    const move = ([px, py]) => [px - x, py - y];
    return { svg: scn.svg.replace(/viewBox="[^"]*"/, `viewBox="${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}"`), data: { ...scn.data, W: w, H: h, ANCHORS: Object.fromEntries(Object.entries(scn.data.ANCHORS).map(([k, p]) => [k, move(p)])) } };
  }
  const rest = t => t.rest || (t.rest = atRest(SCN[t.scene]));
  const dress = (box, t) => { box.dataset.tone = t.tone; box.style.setProperty('--size', t.size); box.setAttribute('role', 'img'); box.setAttribute('aria-label', t.name); };
  // every <div class="vs-fig" data-fig="a"> in a slide gets its figure, once
  const placed = new WeakMap();
  function figures(s) {
    if (!placed.has(s)) placed.set(s, Object.fromEntries($$('[data-fig]', s).map(box => {
      const t = THINGS[box.dataset.fig], el = placeScene(box, rest(t));
      dress(box, t);
      return [box.dataset.fig, { box, el, scn: rest(t), solids: $$('.iso-solid', el) }];
    })));
    return placed.get(s);
  }
  // 'lit' paints a figure in its own colour, 'same' in grey, 'off' steps it back to faint lines, '' is plain line art
  function look(f, state) { f.box.dataset.look = state; f.solids.forEach(e => e.toggleAttribute('data-lit', state === 'lit' || state === 'same')); }

  /* ---------- title: both figures assemble, then each takes its colour ---------- */
  (function () {
    let figs;
    H.title = pressHook({
      build(s) { figs = figures(s); },
      settle() { each(figs, f => { explodeScene(f.el, f.scn, 0); look(f, 'lit'); }); },
      play(k, m) {
        // coming back from the next slide the figures are carried in whole, so they do not assemble again
        m.later(0, () => {
          if (Morph.live.length) return;
          Object.values(figs).forEach((f, i) => {
            look(f, ''); explodeScene(f.el, f.scn, .4);
            m.tw(1.2, u => explodeScene(f.el, f.scn, .4 * (1 - easeOut(u))), .1 + i * .25, () => look(f, 'lit'));
          });
        });
      }
    });
  })();

  /* ---------- same: one line for each shared thing, from both figures to the name in the middle ---------- */
  (function () {
    let figs, ties;
    function draw(svg, items) {
      svg.replaceChildren();
      const [W, Ht] = sizeOf(svg), rowH = Math.min(Ht / items.length, 92), top = (Ht - rowH * items.length) / 2;
      svg.setAttribute('viewBox', `0 0 ${W} ${Ht}`); svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', `${items.length} lines join ${THINGS.a.name} and ${THINGS.b.name}, one for each thing that is the same in both: ${items.map(i => i[0]).join(', ')}`);
      const rows = items.map(([name, value], i) => {
        const g = svgEl('g', {}, svg), y = top + rowH * (i + .5);
        const lab = txt(g, 0, y + 8, name, { style: F(600, 25, C.fg) }), val = txt(g, 0, y + 8, value, { style: F(500, 21, C['fg-3'], 'var(--f-mono)') });
        const lw = lab.getComputedTextLength(), vw = val.getComputedTextLength(), x0 = (W - lw - 16 - vw) / 2, x1 = x0 + lw + 16 + vw;
        lab.setAttribute('x', x0); val.setAttribute('x', x0 + lw + 16);
        const ends = [[8, x0 - 24], [W - 8, x1 + 24]].map(([from, to]) => {
          const line = svgEl('line', { x1: from, x2: from, y1: y, y2: y, stroke: C['fg-3'], 'stroke-width': 2.5, 'stroke-linecap': 'round' }, g);
          svgEl('circle', { cx: from, cy: y, r: 6, fill: C['fg-3'] }, g);
          return { from, to, line };
        });
        return t => {
          g.setAttribute('opacity', t > 0 ? 1 : 0);
          ends.forEach(e => e.line.setAttribute('x2', lerp(e.from, e.to, ease(seg(t, 0, .8)))));
          [lab, val].forEach(n => n.setAttribute('opacity', seg(t, .6, 1)));
        };
      });
      const d = items.length > 1 ? .55 / (items.length - 1) : 0;
      return { set: t => rows.forEach((row, i) => row(seg(t, i * d, i * d + .45))), aside: t => svg.setAttribute('opacity', lerp(1, .4, t)), dur: 2.2 };
    }
    H.same = pressHook({
      build(s) {
        figs = figures(s); ties = draw($('#smSvg', s), SAME);
        $('#smLeft', s).replaceChildren(...ROWS.map(r => Object.assign(document.createElement('span'), { className: 'chip', textContent: r.label })));
      },
      settle(k) { ties.set(1); ties.aside(k >= 1 ? 1 : 0); each(figs, f => look(f, k >= 1 ? 'same' : 'lit')); },
      play(k, m) {
        if (k === 0) { ties.set(0); m.tw(ties.dur, ties.set, .5); }
        if (k === 1) { each(figs, f => look(f, 'same')); m.tw(.6, ties.aside); }
      }
    });
  })();

  /* ---------- difference: Kit.versus, one row per press ---------- */
  (function () {
    let chart;
    H.difference = pressHook({
      build(s) {
        presses(s, ROWS.length);
        each(figures(s), f => look(f, 'lit'));
        const svg = $('#dfSvg', s);
        chart = Kit.versus(svg, {
          size: sizeOf(svg), a: THINGS.a, b: THINGS.b, rows: ROWS.map(r => ({ ...r, a: MODEL.a[r.key], b: MODEL.b[r.key] })),
          label: `${THINGS.a.name} against ${THINGS.b.name} on ${ROWS.map(r => r.label.toLowerCase()).join(', ')}. A ring marks the better value in each row`,
        });
        chart.part.names(1);
      },
      settle(k) { ROWS.forEach((r, i) => chart.part.row(i, i < k ? 1 : 0)); },
      play(k, m) { if (k) m.tw(.9, t => chart.part.row(k - 1, t)); }
    });
  })();

  /* ---------- why: Kit.figure opens one of the two, a part per press ---------- */
  (function () {
    let fig;
    H.why = pressHook({
      build(s) {
        presses(s, PARTS.length);
        if (fig) return;
        const t = THINGS[OPENED], box = $('#wyFig', s), card = $('#wyCard', s), list = $('#wyList', s);
        dress(box, t);
        list.replaceChildren(...PARTS.map(p => { const [n, name] = p.tag.split(' · '), li = document.createElement('li'), no = document.createElement('span'); no.textContent = n; li.append(no, name); return li; }));
        fig = Kit.figure(box, rest(t), { card, list, parts: PARTS.map(p => ({ ...p, tone: t.tone, line: p.line(MODEL), fig: () => p.fig(MODEL) })) });
        // the card keeps the height of its longest part, so it does not jump between presses
        card.style.minHeight = Math.max(...PARTS.map((p, i) => { fig.settle(i + 1); return card.offsetHeight; })) + 'px';
      },
      settle(k) { fig.settle(k); },
      // the figure is carried in from the slide before, so it does not assemble on entering
      play(k, m) { if (k) fig.play(k, m); }
    });
  })();

  /* ---------- years: two cost lines from the model, and the ring where they cross ---------- */
  (function () {
    let chart;
    function draw(s) {
      const svg = $('#yrSvg', s), M = MODEL, end = INPUT.years, cut = M.payback != null && M.payback < end ? M.payback : end;
      // a band too narrow to hold its label is left out
      const bands = [['a', 0, cut], ['b', cut, end]].filter(([, from, to]) => (to - from) / end > .2).map(([id, from, to]) => ({ from, to, label: SAY.ahead[id], tone: THINGS[id].tone }));
      chart = Kit.lines(svg, {
        size: sizeOf(svg), x: M.x, min: 0, format: 'moneyExact', xFormat: v => v ? 'year ' + v : 'today', bands,
        series: IDS.map(id => ({ id, label: THINGS[id].name, tone: THINGS[id].tone, values: M.cum[id] })),
        cross: { a: 'a', b: 'b', label: SAY.cross(M), tone: THINGS.b.tone },
        label: `What each has cost over ${end} years, price plus waiting. ${THINGS.a.name} starts lower and climbs. ${THINGS.b.name} starts higher and stays flat. A ring marks where they cross`,
      });
      // Kit.lines centres the crossing label over its ring, where the rising line runs through it.
      // Left of the crossing nothing is above the flat line, so the label ends at the ring when it fits there
      const ring = svg.querySelector('circle'), text = ring && ring.nextElementSibling;
      if (text && +ring.getAttribute('cx') - text.getComputedTextLength() > 120) { text.setAttribute('text-anchor', 'end'); text.setAttribute('x', +ring.getAttribute('cx') - 6); }
      const [lead, tail] = SAY.take(M), b = document.createElement('b');
      b.textContent = lead; $('#yrTake', s).replaceChildren(b, ' ' + tail);
    }
    function settle(k) { chart.part.axes(1); chart.part.line('a', 1); chart.part.line('b', k >= 1 ? 1 : 0); chart.part.marks(k >= 1 ? 1 : 0); chart.part.bands(k >= 2 ? 1 : 0); }
    H.years = pressHook({
      build: draw, settle,
      play(k, m) {
        if (k === 0) { chart.part.line('a', 0); m.tw(1.4, t => chart.part.line('a', t), .3); }
        if (k === 1) { m.tw(1.4, t => chart.part.line('b', t)); m.tw(.5, chart.part.marks, 1.3); }
        if (k === 2) m.tw(.5, chart.part.bands);
      }
    });
    document.addEventListener('model', () => { if (active('years')) { draw($('#years')); settle(H.years.k); } });
  })();

  /* ---------- choose: four sliders write INPUT, and the two tests, the lit figure and the verdict follow ---------- */
  (function () {
    const KEYS = Object.keys(SHOW), DEF = Object.fromEntries(KEYS.map(k => [k, INPUT[k]]));
    let o = null;
    // the two tests as bars against a limit. Built again on every change, because the limit and the bar both move
    function tests() {
      const M = MODEL, b = THINGS.b, keep = INPUT.years;
      const budget = Kit.bars(o.budget, {
        size: sizeOf(o.budget), dir: 'h', format: 'moneyExact', max: +o.sliders.budget.max, ref: { value: INPUT.budget, label: SAY.budget(INPUT.budget) },
        items: IDS.map(id => ({ label: THINGS[id].name, value: M[id].price, tone: M[id].price > INPUT.budget ? 'risk' : THINGS[id].tone })),
        label: `The two prices against the budget of ${money(INPUT.budget)}`,
      });
      const pay = Kit.bars(o.pay, {
        size: sizeOf(o.pay), dir: 'h', format: 'moneyExact',
        items: [{ label: SAY.gap, value: M.gap }, { label: SAY.earns(keep), value: Math.round(M.earned), tone: fails(M) ? 'risk' : b.tone }],
        label: `The ${money(M.gap)} more that ${b.name} costs, against the waiting it saves in ${keep} years`,
      });
      return t => { budget.set(t); pay.set(t); };
    }
    function say() {
      const M = MODEL, t = THINGS[M.pick];
      KEYS.forEach(k => { o.sliders[k].value = INPUT[k]; o.sliders[k].nextElementSibling.textContent = SHOW[k](INPUT[k]); });
      IDS.forEach(id => look(o.figs[id], id === M.pick ? 'lit' : 'off'));
      o.name.textContent = t.name; o.name.className = 'ch-name ' + t.tone;
      o.why.textContent = SAY.why[M.why](M); o.cost.textContent = SAY.cost[M.pick](M);
      o.payLine.classList.toggle('risk', fails(M));
    }
    function build(s) {
      if (o) return;
      o = { figs: figures(s), budget: $('#chBudget', s), pay: $('#chPay', s), name: $('#chName', s), why: $('#chWhy', s), cost: $('#chCost', s), payLine: $('.ch-pay', s),
        sliders: Object.fromEntries(KEYS.map(k => [k, $(`[data-k="${k}"]`, s)])) };
      $('#chInputs', s).addEventListener('input', e => { const k = e.target.dataset.k; if (!k) return; INPUT[k] = +e.target.value; recompute(); });
      $('#chReset', s).onclick = () => { Object.assign(INPUT, DEF); recompute(); };
      document.addEventListener('model', () => { say(); if (active('choose')) tests()(1); });
    }
    H.choose = pressHook({
      build,
      settle() { say(); tests()(1); },
      play(k, m) { const set = tests(); set(0); m.tw(1, set, .3); }
    });
  })();

  /* ---------- verdict: both lines stay, and the one the chooser picked is framed ---------- */
  (function () {
    let figs, cards, pay;
    const mark = () => { IDS.forEach(id => { look(figs[id], 'lit'); cards[id].classList.toggle('is-pick', id === MODEL.pick); }); pay.classList.toggle('risk', fails(MODEL)); };
    H.verdict = pressHook({
      build(s) { figs = figures(s); pay = $('.vd-pay', s); cards = Object.fromEntries($$('[data-pick]', s).map(c => [c.dataset.pick, c])); },
      settle: mark
    });
    document.addEventListener('model', () => { if (figs) mark(); });
  })();
})();
