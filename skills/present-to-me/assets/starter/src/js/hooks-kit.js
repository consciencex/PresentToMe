/* ===== Appendix: every Kit component, small, with example data. The visual test of src/js/kit.js ===== */
(function () {
  const S = [490, 160];
  const DEMO = {
    bars: el => Kit.bars(el, { size: S, dir: 'h', unit: 'kg', label: 'Weight of three models against our limit', ref: { value: 1.8, label: 'our limit 1.8 kg' },
      items: [{ label: 'Air', value: 1.24, tone: 'm1' }, { label: 'Pro', value: 1.55, tone: 'm2' }, { label: 'Max', value: 2.1, tone: 'grey' }] }),
    versus: el => Kit.versus(el, { size: S, label: 'Model A against model B on weight and battery', a: { name: 'Model A' }, b: { name: 'Model B' },
      rows: [{ label: 'Weight', a: 1.24, b: 1.55, unit: 'kg', better: 'low' }, { label: 'Battery', a: 18, b: 14, unit: 'h', better: 'high' }] }),
    lines: el => Kit.lines(el, { size: S, label: 'Two cost lines that cross in year 4', x: [0, 1, 2, 3, 4, 5, 6], format: 'n',
      series: [{ id: 'own', label: 'Own', tone: 'm1', values: [60, 72, 84, 96, 108, 120, 132] }, { id: 'rent', label: 'Rent', tone: 'm3', dash: true, values: [0, 28, 56, 84, 112, 140, 168] }],
      cross: { a: 'own', b: 'rent', label: 'year 4' } }),
    area: el => Kit.area(el, { size: S, label: 'Three loads stacked over a day, under the limit', x: ['00', '06', '12', '18', '24'], limit: { value: 90, label: 'limit' },
      layers: [{ id: 'cold', label: 'Cold', tone: 'm2', values: [30, 32, 40, 36, 30] }, { id: 'light', label: 'Light', tone: 'm1', values: [8, 14, 18, 20, 9] }, { id: 'other', label: 'Other', tone: 'm3', values: [6, 10, 16, 12, 6] }] }),
    tank: el => Kit.tank(el, { size: S, label: 'Storage at 520 against a cap of 400', value: 520, cap: 400, unit: 'kWh', tone: 'm2' }),
    dots: el => Kit.dots(el, { size: S, label: '65 of 540 pallets at risk', total: 540, groups: [{ count: 65, label: 'at risk', tone: 'risk' }] }),
    timeline: el => Kit.timeline(el, { size: S, label: 'Three phases over a year with two milestones and today', start: 0, end: 12, ticks: [{ at: 0, label: 'Jan' }, { at: 6, label: 'Jul' }, { at: 12, label: 'Dec' }], today: 4.5,
      phases: [{ label: 'Survey', from: 0, to: 3, tone: 'grey' }, { label: 'Build', from: 3, to: 8, tone: 'm1' }, { label: 'Run', from: 8, to: 12, tone: 'm2' }],
      milestones: [{ at: 3, label: 'go' }, { at: 8, label: 'live' }] }),
    steps: el => Kit.steps(el, { size: S, label: 'Four steps from sun to saving', steps: [{ label: 'Sun on roof' }, { label: 'Inverter' }, { label: 'Our load first', tone: 'm1' }, { label: 'Grid gets the rest' }] }),
    number: el => Kit.number(el, { value: 72, unit: '%', line: 'of the roof is usable', tone: 'm1' }),
  };
  let cs = [];
  H.kit = pressHook({
    build(s) { cs = $$('[data-k]', s).map(el => DEMO[el.dataset.k](el)); },
    settle() { cs.forEach(c => c.set(1)); },
    play(k, m) { cs.forEach((c, i) => { c.set(0); m.tw(c.dur, c.set, .3 + i * .12); }); }
  });
})();
