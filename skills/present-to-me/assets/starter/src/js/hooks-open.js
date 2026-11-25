/* ===== Open: the cold-open film and the title ===== */

/* ---------- film: a pure function of time ----------
   Film.render(t) draws the frame for second t and nothing else decides what is on screen, so play, pause, scrub and a
   frame-by-frame video export all show the same film. Text is styled inline because the deck's `svg text` rule would win. */
const Film = (() => {
  const D = 16, E = {};
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);                                   // 0 → 1 while t runs from a to b
  const win = (t, a, b, fi = .5, fo = .5) => Math.min(seg(t, a, a + fi), 1 - seg(t, b - fo, b));   // fade in, hold, fade out
  const op = (el, v) => el.setAttribute('opacity', v.toFixed(3));
  const T = (g, x, y, s, st, a = {}) => txt(g, x, y, s, Object.assign({ style: st }, a));
  const big = (sz, col) => `font:700 ${sz}px var(--f-display);font-stretch:112%;letter-spacing:-.012em;fill:${col}`;
  const BARS = 12, PRICE = PAST_RISE.reduce((a, r) => [...a, a[a.length - 1] * (1 + r)], [100]);   // the price index, year by year, from the model's history
  const UP = PRICE[PRICE.length - 1] / 100 - 1;

  function build(svg) {
    svgEl('rect', { width: 1920, height: 1080, fill: C.bg }, svg);
    // 1 · twelve bills
    E.s1 = svgEl('g', {}, svg);
    E.h1 = T(E.s1, 960, 250, 'Every month, the same envelope.', big(74, C.fg), { 'text-anchor': 'middle' });
    E.bars = Array.from({ length: BARS }, (_, i) => svgEl('rect', { x: 410 + i * 94, width: 62, rx: 8, fill: C.m2 }, E.s1));
    E.bill = T(E.s1, 960, 930, '', big(92, C['m2-ink']), { 'text-anchor': 'middle' });
    E.billU = T(E.s1, 960, 985, 'a month, to the grid', `font:500 26px var(--f-mono);fill:${C['fg-3']}`, { 'text-anchor': 'middle' });
    // 2 · the price line
    E.s2 = svgEl('g', {}, svg);
    E.h2 = T(E.s2, 960, 250, 'It only goes one way.', big(74, C.fg), { 'text-anchor': 'middle' });
    const x = linear(0, PRICE.length - 1, 420, 1500), y = linear(95, PRICE[PRICE.length - 1] + 4, 820, 380);
    E.line = svgEl('path', { d: smoothPath(PRICE.map((v, i) => [x(i), y(v)])), fill: 'none', stroke: C.m2, 'stroke-width': 8, 'stroke-linecap': 'round' }, E.s2);
    E.lineLen = E.line.getTotalLength(); E.line.style.strokeDasharray = E.lineLen;
    E.up = T(E.s2, 1530, y(PRICE[PRICE.length - 1]) + 12, `+${Math.round(UP * 100)}% in ${PAST_RISE.length} years`, `font:600 34px var(--f-body);fill:${C['m2-ink']}`);
    // 3 · the roof
    E.s3 = svgEl('g', {}, svg);
    E.h3 = T(E.s3, 960, 250, 'Above us: a roof doing nothing.', big(74, C.fg), { 'text-anchor': 'middle' });
    svgEl('rect', { x: 460, y: 420, width: 1000, height: 420, rx: 14, fill: C.surface, stroke: C.line, 'stroke-width': 3 }, E.s3);
    E.cells = [];
    for (let r = 0; r < 6; r++) for (let c = 0; c < 16; c++) E.cells.push(svgEl('rect', { x: 484 + c * 60, y: 444 + r * 64, width: 50, height: 52, rx: 5, fill: C.m1 }, E.s3));
    E.roofN = T(E.s3, 960, 930, `${fmtN(TESTS[0].have)} ${TESTS[0].unit}, already ours`, `font:500 30px var(--f-mono);fill:${C['fg-3']}`, { 'text-anchor': 'middle' });
    // 4 · the line the title slide repeats
    E.s4 = svgEl('g', {}, svg);
    E.end1 = T(E.s4, 960, 520, 'The ', big(124, C.fg), { 'text-anchor': 'middle' });
    svgEl('tspan', { style: `fill:${C['m1-ink']}` }, E.end1).textContent = 'roof';
    E.end1.appendChild(document.createTextNode(' can pay'));
    E.end2 = T(E.s4, 960, 660, 'the power bill.', big(124, C.fg), { 'text-anchor': 'middle' });
  }
  function render(t) {
    op(E.s1, win(t, 0, 4.6));
    E.bars.forEach((b, i) => { const k = easeOut(seg(t, .5 + i * .22, 1.1 + i * .22)), h = (250 + i * 16) * k; b.setAttribute('y', 760 - h); b.setAttribute('height', h); });
    E.bill.textContent = fmtMoney(INPUT.billMonth * (1 + UP * seg(t, .5, 3.4)) / (1 + UP));
    op(E.s2, win(t, 4.6, 8.8));
    E.line.style.strokeDashoffset = E.lineLen * (1 - ease(seg(t, 5, 7.6)));
    op(E.up, seg(t, 7.3, 7.9));
    op(E.s3, win(t, 8.8, 13));
    E.cells.forEach((c, i) => op(c, seg(t, 10 + (i % 16) * .1 + Math.floor(i / 16) * .05, 10.4 + (i % 16) * .1 + Math.floor(i / 16) * .05)));
    op(E.roofN, seg(t, 9.4, 10));
    op(E.s4, seg(t, 13, 13.8));
    E.end2.setAttribute('opacity', seg(t, 13.6, 14.4).toFixed(3));
  }
  return { D, build, render };
})();

/* film player: play, pause, scrub. With an <audio id="filmAudio"> in the slide, the audio's own clock drives the film,
   so picture and voice cannot drift; without one the frame clock does. */
(function () {
  let built = false, playing = false, t = 0, raf = null, last = 0, hideT = null;
  const au = document.getElementById('filmAudio');
  const fmt = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  function show() { Film.render(t); $('#filmScrub').value = Math.round(t / Film.D * 1000); $('#filmTime').textContent = fmt(t) + ' / ' + fmt(Film.D); $('#filmPlay').textContent = playing ? '❚❚' : '▶'; $('#filmPlay').setAttribute('aria-label', playing ? 'Pause film' : 'Play film'); }
  function frame(now) {
    if (!playing) return;
    if (au && !au.paused && au.readyState >= 2) t = Math.min(Film.D, au.currentTime);
    else if (last) t = Math.min(Film.D, t + (now - last) / 1000);
    last = now; show();
    if (t >= Film.D) { playing = false; au && au.pause(); show(); wake(); return; }
    raf = requestAnimationFrame(frame);
  }
  // the controls fade while the film plays and come back when the pointer moves
  function wake() { const c = $('#filmCtl'); c.style.opacity = '.85'; clearTimeout(hideT); if (playing) hideT = setTimeout(() => { if (playing) c.style.opacity = '0'; }, 1800); }
  function play() { if (t >= Film.D) t = 0; playing = true; last = 0; if (au) { try { au.currentTime = t; } catch (e) {} au.play().catch(() => {}); } raf = requestAnimationFrame(frame); show(); wake(); }
  function pause() { playing = false; cancelAnimationFrame(raf); au && au.pause(); show(); wake(); }
  function build() {
    built = true; Film.build($('#filmSvg'));
    $('#filmPlay').onclick = () => playing ? pause() : play();
    $('#filmRestart').onclick = () => { t = 0; play(); };
    $('#filmScrub').addEventListener('input', e => { t = +e.target.value / 1000 * Film.D; if (au) try { au.currentTime = t; } catch (e) {} show(); });
    $('#film').addEventListener('pointermove', wake);
  }
  H.film = { enter() { if (!built) build(); if (t >= Film.D - .1) t = 0; play(); }, leave() { if (built) pause(); } };
})();

/* ---------- title: the figure assembles, then the roof lights up ---------- */
(function () {
  let fig = null, run = null, timer = null;
  H.title = {
    enter() {
      const box = $('#titleFig');
      if (!fig) fig = placeScene(box, SCN.hero);
      const solids = fig.querySelectorAll('[data-piece="panels"] .iso-solid');
      solids.forEach(s => s.removeAttribute('data-lit')); $('#titleCap').classList.remove('on');
      run && run.stop(); clearTimeout(timer);
      explodeScene(fig, SCN.hero, 1);
      run = tween(1.3, u => explodeScene(fig, SCN.hero, 1 - easeOut(u)), () => { solids.forEach(s => s.setAttribute('data-lit', '')); $('#titleCap').classList.add('on'); });
    },
    leave() { run && run.stop(); clearTimeout(timer); }
  };
})();
