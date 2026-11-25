/* ---------- anatomy: the system figure assembles on entry; each press lifts and lights one part, with its card (Kit.figure) ---------- */
// one row per press. fig() reads INPUT at the moment the card shows, so a change on the money slide carries here
H.anatomy = pressHook(Kit.figure($('#anFig'), SCN.system, {
  card: $('#anCard'), list: $('#anList'),
  parts: [
    { piece: 'panels', tag: '1 · Panels', h: 'Sun into power', line: 'Rows across the whole roof turn daylight into direct current.', lift: .35,
      fig: () => [fmtN(INPUT.capex / INPUT.perWatt / 1000), 'kWp'] },
    { piece: 'inverter', tag: '2 · Inverter', h: 'Power we can use', line: 'Turns that current into the mains power our plant runs on.',
      fig: () => ['750', 'kW'] },   // example data: three 250 kW cabinets
    { piece: 'battery', tag: '3 · Battery', h: 'A buffer for the cold', line: 'Rides through a cloud or a short outage, so the cold rooms stay cold.',
      fig: () => ['1', 'MWh'] },    // example data: one container
    { piece: 'meter', tag: '4 · Grid meter', h: 'The grid stays on', line: 'Brings in what the roof cannot make, day and night.', tone: 'm2',
      fig: () => [Math.round((1 - INPUT.cover) * 100) + '%', 'from the grid'] },
  ],
}));
