/* ===== The model: every number the deck shows comes from here. =====
   EXAMPLE DATA. Example Foods is invented and so is every figure below; replace them with numbers you can source.
   A slide never types a number the model also knows: it binds to it (data-bind="key") or reads MODEL in its hook,
   so one edit here, or one slider on the money slide, changes every slide that depends on it. */
const INPUT = {
  billMonth: 42000,     // electricity bill today, a month
  growth: 0.04,         // grid price rise a year
  cover: 0.26,          // share of our use the roof supplies (800 kWp on this roof)
  ppaDiscount: 0.15,    // option B: a supplier owns the panels and sells us their power this much below the grid price
  capex: 720000,        // option C: we buy the system (800 kWp at $0.90 a watt)
  perWatt: 0.9,         // installed price, $ a watt, from the installer's quote
  omYear: 9000,         // option C: cleaning, monitoring, inverter reserve, a year
  years: 15,
};
// the three ways to pay. m1, m2, m3 are the deck's three meaning colours: the same option has the same colour on every slide
const OPTIONS = [
  { id: 'grid', name: 'Stay on the grid', short: 'Grid', tone: 'm2' },
  { id: 'ppa', name: 'Rent the panels', short: 'Rent', tone: 'm3' },
  { id: 'own', name: 'Own the panels', short: 'Own', tone: 'm1' },
];
// the grid price rise in each of the last five years, oldest first. The film and the price card both draw from it
const PAST_RISE = [0.05, 0.08, 0.11, 0.06, 0.05];
// one sunny weekday, kW by hour (0 to 23): what the site draws and what 800 kWp delivers
const DAY = {
  load: [520, 510, 505, 500, 505, 520, 560, 610, 650, 670, 680, 690, 695, 690, 680, 660, 640, 620, 600, 580, 560, 545, 535, 525],
  sun: [0, 0, 0, 0, 0, 0, 20, 110, 260, 410, 530, 600, 620, 590, 500, 370, 220, 80, 10, 0, 0, 0, 0, 0],
};
// the three tests the proposal has to pass: need against have, in the unit named. pass says which side of the need is good
const TESTS = [
  { id: 'roof', name: 'Roof', q: 'Is there room, and can it carry the weight?', unit: 'm²', need: 4400, have: 9200, pass: 'atLeast', more: 'Spare load 25 kg/m², panels add 15' },
  { id: 'sun', name: 'Sun', q: 'Is there enough sun here?', unit: 'sun hours a day', need: 3.5, have: 4.5, pass: 'atLeast', more: 'Yearly average at this latitude' },
  { id: 'pay', name: 'Payback', q: 'Does it pay back inside our limit?', unit: 'years', need: 7, have: null, pass: 'atMost', more: 'Our rule for equipment: 7 years' },   // have is filled from the model
];
const testPasses = t => t.have != null && (t.pass === 'atMost' ? t.have <= t.need : t.have >= t.need);

// Like for like: the three options are compared on the same energy, the share of our use the roof can supply.
// The rest comes from the grid at the same price whichever option we take, so it is left out of every line.
function runModel(I) {
  const months = I.years * 12, price = m => Math.pow(1 + I.growth, Math.floor((m - 1) / 12));   // grid price index in month m, year 1 = 1
  const cum = { grid: [0], ppa: [0], own: [I.capex] };
  for (let m = 1; m <= months; m++) {
    const part = I.billMonth * price(m) * I.cover;      // what the roof's share of our power costs on the grid this month
    cum.grid.push(cum.grid[m - 1] + part);
    cum.ppa.push(cum.ppa[m - 1] + part * (1 - I.ppaDiscount));
    cum.own.push(cum.own[m - 1] + I.omYear / 12);
  }
  // the month line a drops to line b, with the fraction of the month found by straight-line interpolation (null if never)
  const cross = (a, b) => {
    for (let m = 1; m <= months; m++) if (cum[a][m] <= cum[b][m]) { const d0 = cum[a][m - 1] - cum[b][m - 1], d1 = cum[a][m] - cum[b][m]; return m - 1 + (d0 === d1 ? 0 : d0 / (d0 - d1)); }
    return null;
  };
  return {
    months, cum, payback: cross('own', 'grid'), ownBeatsPpa: cross('own', 'ppa'),
    saveYear1: I.billMonth * 12 * I.cover - I.omYear,
    saved: cum.grid[months] - cum.own[months], savedPpa: cum.grid[months] - cum.ppa[months],
    end: { grid: cum.grid[months], ppa: cum.ppa[months], own: cum.own[months] },
    sunKwh: DAY.sun.reduce((t, v) => t + v, 0), loadKwh: DAY.load.reduce((t, v) => t + v, 0),
    noonShare: Math.max(...DAY.sun.map((v, h) => v / DAY.load[h])),
  };
}
const yrs = m => m == null ? 'never' : (m / 12).toFixed(1) + ' yrs';

/* ---------- live bindings: every element with data-bind="key" shows the model's current value ---------- */
let MODEL = null;
function recompute() {
  MODEL = runModel(INPUT);
  TESTS[2].have = MODEL.payback == null ? null : +(MODEL.payback / 12).toFixed(1);
  const set = (k, v) => $$(`[data-bind="${k}"]`).forEach(e => e.textContent = v);
  set('bill', fmtMoney(INPUT.billMonth)); set('billYear', fmtMoney(INPUT.billMonth * 12));
  set('capex', fmtMoney(INPUT.capex)); set('om', fmtMoney(INPUT.omYear));
  set('payback', yrs(MODEL.payback)); set('saved', fmtMoney(MODEL.saved)); set('saveYear1', fmtMoney(MODEL.saveYear1));
  set('years', INPUT.years); set('cover', Math.round(INPUT.cover * 100) + '%'); set('growth', (INPUT.growth * 100).toFixed(1) + '%');
  document.dispatchEvent(new CustomEvent('model'));      // hooks that draw from the model redraw on this event
}
