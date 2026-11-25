/* ===== The model: every number the deck shows comes from here. =====
   EXAMPLE DATA. Both laptops and their maker are invented, and so is every figure below: replace them with numbers you can source.
   A slide never types a number the model also knows: it binds to it (data-bind="key") or reads MODEL in its hook,
   so one edit here, or one slider on the chooser, changes every slide that depends on it. */
const INPUT = {
  // the two things, measured the same way. Every slide and the data block in hooks.js call them a and b
  a: { price: 1199, kg: 1.2, screen: 13.6, wh: 52, idleW: 3, loadW: 15, jobMin: 60 },   // Light 13
  b: { price: 1999, kg: 2.0, screen: 15.6, wh: 99, idleW: 9, loadW: 45, jobMin: 36 },   // Studio 15
  // the buyer's own case. The chooser slide writes these four
  heavyHours: 2,     // heavy work a week, in hours as it runs on a
  awayDays: 2,       // days a week it works away from a desk. On battery b is held to a's power, so it saves no time there
  hourValue: 20,     // what the buyer says an hour of waiting is worth: an estimate, and the first thing to doubt
  budget: 2200,      // the most the buyer will pay
  years: 4,          // how long the laptop is kept
};

// Like for like: the same heavy work on both, over the years the laptop is kept. The time both spend on that work is
// left out of every line. What is counted is each price, and the extra hours a makes the buyer wait.
// The hooks read a, b, x, cum, end, payback, gap, earned, over, why and pick. Keep those names when the sums change.
function runModel(I) {
  const spec = t => ({ ...t, batteryH: Math.round(t.wh / t.idleW) });           // hours of light work on one charge
  const a = spec(I.a), b = spec(I.b), gap = b.price - a.price;
  const saveShare = 1 - b.jobMin / a.jobMin;                                    // the share of a heavy hour b gives back
  const savedYear = I.heavyHours * saveShare * (7 - I.awayDays) / 7 * 52;       // hours a year, on the days at a desk
  const waitYear = savedYear * I.hourValue;                                     // what a's extra waiting costs a year
  const payback = waitYear > 0 ? gap / waitYear : null;                         // years until b has earned back its price. null: never
  const x = Array.from({ length: I.years * 2 + 1 }, (_, i) => i / 2);           // half-year steps
  const cum = { a: x.map(t => a.price + waitYear * t), b: x.map(() => b.price) };
  const over = b.price - I.budget;
  // b is the pick only when it fits the budget and pays back while the buyer still has it
  const why = over > 0 ? 'budget' : payback == null ? 'never' : payback > I.years ? 'late' : 'pays';
  return {
    a, b, gap, saveShare, savedYear, waitYear, payback, x, cum, over, why, pick: why === 'pays' ? 'b' : 'a',
    earned: waitYear * I.years,                                                 // the waiting b saves over the years it is kept
    end: { a: cum.a[x.length - 1], b: cum.b[x.length - 1] },
    kgMore: +(b.kg - a.kg).toFixed(1), batteryMore: a.batteryH - b.batteryH,
  };
}
const money = v => CURRENCY + fmtN(v);
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
// a length of time in years, said the way a person would: "5 months", "1.4 years", "never"
const span = y => y == null ? 'never' : y < 1 ? plural(Math.max(1, Math.round(y * 12)), 'month') : y.toFixed(1) + ' years';

/* ---------- live bindings: every element with data-bind="key" shows the model's current value ---------- */
let MODEL = null;
function recompute() {
  MODEL = runModel(INPUT);
  const M = MODEL, set = (k, v) => $$(`[data-bind="${k}"]`).forEach(e => e.textContent = v);
  for (const id of ['a', 'b']) {
    set(`${id}.price`, money(M[id].price)); set(`${id}.end`, money(M.end[id]));
    for (const k of ['kg', 'screen']) set(`${id}.${k}`, M[id][k].toFixed(1));
    for (const k of ['wh', 'loadW', 'jobMin', 'batteryH']) set(`${id}.${k}`, M[id][k]);
  }
  set('gap', money(M.gap)); set('kgMore', M.kgMore.toFixed(1)); set('batteryMore', M.batteryMore);
  set('payback', span(M.payback)); set('savedYear', fmtN(M.savedYear)); set('saveShare', Math.round(M.saveShare * 100) + '%');
  set('years', INPUT.years); set('hourValue', money(INPUT.hourValue)); set('budget', money(INPUT.budget));
  document.dispatchEvent(new CustomEvent('model'));      // hooks that draw from the model redraw on this event
}
