/* ---------- anatomy: the system figure (SCN.system) assembles on entry; each press lifts and lights one part, with its card ---------- */
(function () {
  const PER_WATT = 0.9;   // installed price, $ a watt, as in model.js
  // one row per press. fig() reads INPUT at the moment the card shows, so a change on the money slide carries here
  const PARTS = [
    { piece: 'panels', tag: '1 · Panels', h: 'Sun into power', line: 'Rows across the whole roof turn daylight into direct current.', lift: .35,
      fig: () => [fmtN(INPUT.capex / PER_WATT / 1000), 'kWp'] },
    { piece: 'inverter', tag: '2 · Inverter', h: 'Power we can use', line: 'Turns that current into the mains power our plant runs on.', lift: .6,
      fig: () => ['750', 'kW'] },   // example data: three 250 kW cabinets
    { piece: 'battery', tag: '3 · Battery', h: 'A buffer for the cold', line: 'Rides through a cloud or a short outage, so the cold rooms stay cold.', lift: .6,
      fig: () => ['1', 'MWh'] },    // example data: one container
    { piece: 'meter', tag: '4 · Grid meter', h: 'The grid stays on', line: 'Brings in what the roof cannot make, day and night.', lift: .6, tone: 'm2',
      fig: () => [Math.round((1 - INPUT.cover) * 100) + '%', 'from the grid'] },
  ];
  const SCENE = SCN.system, SH = SCENE.data.shifts, AN = SCENE.data.ANCHORS;
  let o = null;

  function build(s) {
    o = { s, fig: $('#anFig', s), card: $('#anCard', s), list: [...$('#anList', s).children], lead: $('#anLead', s) };
    o.iso = placeScene(o.fig, SCENE);
    o.groups = [...o.iso.querySelectorAll('[data-piece]')];
  }
  // lifts: { piece: share of its move }; u: share of the whole explode
  function pose(u, lifts) {
    o.u = u; o.lifts = lifts;
    o.groups.forEach(g => { const p = g.dataset.piece, sh = SH[p], t = Math.max(u, lifts[p] || 0); if (sh) g.setAttribute('transform', `translate(${(sh[0] * t).toFixed(2)} ${(sh[1] * t).toFixed(2)})`); });
    if (o.leader) aim();
  }
  function aim() {
    const { path, dot, part } = o.leader, f = o.fig.offsetWidth / SCENE.data.W, sh = SH[part.piece], t = Math.max(o.u, o.lifts[part.piece] || 0);
    const ax = o.fig.offsetLeft + (AN[part.piece][0] + sh[0] * t) * f, ay = o.fig.offsetTop + (AN[part.piece][1] + sh[1] * t) * f;
    const cx = o.card.offsetLeft, cy = o.card.offsetTop + 46;
    path.setAttribute('d', `M${cx} ${cy} H${cx - 36} L${ax.toFixed(1)} ${ay.toFixed(1)}`); dot.setAttribute('cx', ax.toFixed(1)); dot.setAttribute('cy', ay.toFixed(1));
  }
  function light(k) {
    const lit = k >= 4 ? PARTS.map(p => p.piece) : k >= 1 ? [PARTS[k - 1].piece] : [];
    o.groups.forEach(g => {
      const p = g.dataset.piece, on = lit.includes(p);
      g.querySelectorAll('.iso-solid').forEach(e => on ? e.setAttribute('data-lit', '') : e.removeAttribute('data-lit'));
      g.classList.toggle('an-dim', k >= 1 && k < 4 && p !== 'base' && !on);
    });
    o.list.forEach((li, i) => li.classList.toggle('on', i < k && (k >= 4 || i === k - 1)));
  }
  function showCard(k, animate) {
    o.lead.innerHTML = ''; o.leader = null;
    if (k < 1) { o.card.classList.remove('on'); return; }
    const p = PARTS[k - 1], [n, unit] = p.fig(), tone = p.tone || 'm1';
    o.card.dataset.tone = tone;
    o.card.innerHTML = `<p class="tag">${p.tag}</p><h3>${p.h}</h3><p>${p.line}</p><p class="an-num">${n}<small>${unit}</small></p>`;
    if (animate) { o.card.classList.remove('on'); void o.card.offsetWidth; }   // restart the fade from the hidden state
    o.card.classList.add('on');
    const path = svgEl('path', { fill: 'none', stroke: C[tone], 'stroke-width': 1.6, 'stroke-dasharray': '2 5', 'stroke-linecap': 'round' }, o.lead);
    const dot = svgEl('circle', { r: 6, fill: C[tone], stroke: C.bg, 'stroke-width': 2.5 }, o.lead);
    o.leader = { path, dot, part: p }; aim();
  }
  const liftsFor = k => (k >= 1 ? { [PARTS[k - 1].piece]: PARTS[k - 1].lift } : {});
  function settle(k) { pose(0, liftsFor(k)); light(k); showCard(k, false); }

  H.anatomy = pressHook({
    build(s) { if (!o) build(s); },
    settle,
    play(k, m) {
      if (k === 0) { pose(1, {}); m.tw(1.8, t => pose(1 - ease(t), {})); return; }   // on entering, the figure settles together
      const from = liftsFor(k - 1), to = liftsFor(k), keys = [...new Set([...Object.keys(from), ...Object.keys(to)])];
      light(k); showCard(k, true);
      m.tw(.8, t => pose(0, Object.fromEntries(keys.map(p => [p, lerp(from[p] || 0, to[p] || 0, ease(t))]))));
    }
  });
})();
