/* ===== The model: every number the deck shows comes from here. =====
   EXAMPLE DATA. Example Home is invented and so is every figure below. Replace them with numbers you can source.
   INPUT holds every assumption. runModel is pure: inputs in, results out. recompute() fills every data-bind element
   and tells the hooks to redraw. A slide never types a number the model also knows. */
const INPUT = {
  capacity: 10,    // kWh the battery can hold and give back
  evening: 8,      // kWh the house uses from 18:00 to midnight
  sun: 1,          // share of a clear day's sun that reaches the roof: 1 is a clear day, 0.25 a day of thick cloud
  power: 5,        // kW the battery can give at one moment
};
// one day by hour (0 to 23), kW averaged over each hour
const DAY = {
  sun: [0, 0, 0, 0, 0, 0, 0.1, 0.5, 1.3, 2.3, 3.2, 3.9, 4.2, 4.0, 3.4, 2.6, 1.6, 0.7, 0.1, 0, 0, 0, 0, 0],          // a 5 kW roof on a clear day
  base: [0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.6, 1.0, 0.8, 0.5, 0.5, 0.6, 0.8, 0.6, 0.5, 0.5, 0.6, 0.8],                // the house until the evening starts
  evening: [0.16, 0.22, 0.22, 0.18, 0.13, 0.09],                                                                 // how INPUT.evening is spread over the hours that follow
};
const STEP = 0.25;                                   // the day is walked in quarter hours
const EVENING_FROM = DAY.base.length;                // the hour the evening starts

function runModel(I) {
  const n = 24 / STEP, sun = [], use = [], own = [], level = [0];
  const sum = { use: 0, sun: 0, direct: 0, given: 0, stored: 0, spare: 0, evening: 0, eveningOwn: 0 };
  let soc = 0, fillsFrom = null, fullAt = null, givesFrom = null, emptyAt = null;
  for (let i = 0; i < n; i++) {
    const t = i * STEP, h = Math.floor(t), late = h >= EVENING_FROM;
    const s = DAY.sun[h] * I.sun, u = late ? I.evening * DAY.evening[h - EVENING_FROM] : DAY.base[h];
    const direct = Math.min(s, u), extra = Math.min(s - direct, I.power), need = Math.min(u - direct, I.power);
    // the roof's spare power fills the battery until it is full; what the roof cannot cover comes out until it is empty
    const room = I.capacity - soc, into = Math.min(extra, room / STEP), out = Math.min(need, soc / STEP);
    if (into > 0 && fillsFrom == null) fillsFrom = t;
    if (extra > 0 && fullAt == null && extra * STEP >= room) fullAt = t + room / extra;
    if (out > 0 && givesFrom == null) givesFrom = t;
    if (need > 0 && soc > 0 && emptyAt == null && need * STEP >= soc && t + soc / need < 24) emptyAt = t + soc / need;
    soc = clamp(soc + (into - out) * STEP, 0, I.capacity);
    sun.push(s); use.push(u); own.push(direct + out); level.push(soc);
    sum.use += u * STEP; sum.sun += s * STEP; sum.direct += direct * STEP; sum.given += out * STEP; sum.stored += into * STEP; sum.spare += (s - direct) * STEP;
    if (late) { sum.evening += u * STEP; sum.eveningOwn += (direct + out) * STEP; }
  }
  return {
    sun, use, own, level,                                   // by quarter hour; level has one more point, the end of the day
    useKwh: sum.use, sunKwh: sum.sun, givenKwh: sum.given, storedKwh: sum.stored, spareKwh: sum.spare, gridKwh: sum.use - sum.direct - sum.given,
    fillsFrom, fullAt, givesFrom, emptyAt, left: soc, peak: Math.max(...level),
    covered: sum.eveningOwn / sum.evening,                  // share of the evening's use that needs no grid
    ownShare: (sum.direct + sum.given) / sum.use, roofShare: sum.direct / sum.use,
    hours: I.capacity / (I.evening / DAY.evening.length),   // how long a full battery runs the house at the evening's average draw
    sunPeak: Math.max(...sun), eveningPeak: Math.max(...use.slice(EVENING_FROM / STEP)),
    sunPeakAt: DAY.sun.indexOf(Math.max(...DAY.sun)) + .5, eveningPeakAt: EVENING_FROM + DAY.evening.indexOf(Math.max(...DAY.evening)) + .5,   // the middle of the busiest hour
  };
}

const n1 = v => fmtN(v, Number.isInteger(+(+v).toFixed(1)) ? 0 : 1);                  // one decimal, and none when it is a whole number
const clock = t => { const min = Math.round(t * 60); return min >= 1440 ? 'midnight' : String(Math.floor(min / 60)).padStart(2, '0') + ':' + String(min % 60).padStart(2, '0'); };

/* ---------- live bindings: every element with data-bind="key" shows the model's current value ---------- */
let MODEL = null;
function recompute() {
  MODEL = runModel(INPUT);
  const set = (k, v) => $$(`[data-bind="${k}"]`).forEach(e => e.textContent = v);
  set('capacity', n1(INPUT.capacity) + ' kWh');
  set('covered', Math.round(MODEL.covered * 100) + '%'); set('ownShare', Math.round(MODEL.ownShare * 100) + '%');
  set('fullAt', MODEL.fullAt == null ? 'never' : clock(MODEL.fullAt));
  set('eveningFrom', clock(EVENING_FROM)); set('eveningHours', DAY.evening.length);
  document.dispatchEvent(new CustomEvent('model'));      // hooks that draw from the model redraw on this event
}
