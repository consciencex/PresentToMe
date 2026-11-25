/* ===== Deck engine: scaling stage, builds (data-s), navigation, notes, menu ===== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
// deck.config.json "motion": "full" (default) plays every animation whatever the OS says, because presenting machines often have
// "animation effects" switched off and the deck then freezes on its end states. "respect" follows the OS setting.
const REDUCED = MOTION === 'respect' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const NS = 'http://www.w3.org/2000/svg';
function svgEl(tag, attrs = {}, parent) { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; }
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOut = t => 1 - Math.pow(1 - t, 3);
// a round gridline step (1, 2, 5 or 10 × a power of ten) that gives about n lines over a span, whatever the numbers are
const niceStep = (span, n = 6) => { const raw = Math.max(span, 1) / n, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p; return (f <= 1.5 ? 1 : f <= 3 ? 2 : f <= 7 ? 5 : 10) * p; };
// money with the deck's currency sign (deck.config.json "currency"): $0, $350k, $2.4M, $1.25B
const fmtMoney = v => { const a = Math.abs(v), sign = v < 0 ? '−' : ''; return sign + CURRENCY + (a >= 1e9 ? (a / 1e9).toFixed(a >= 1e10 ? 1 : 2) + 'B' : a >= 1e6 ? (a / 1e6).toFixed(a >= 1e7 ? 1 : 2) + 'M' : a >= 1e3 ? Math.round(a / 1e3) + 'k' : Math.round(a)); };
const fmtN = (v, d = 0) => Number(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

const Deck = {
  slides: [], i: 0, step: 0, hooks: {}, scale: 1,
  init() {
    this.slides = $$('.slide');
    this.stage = $('#stage'); this.viewport = $('#viewport');
    this.slides.forEach((s, k) => { s.dataset.n = k + 1; const pg = s.querySelector('.pg'); if (pg) pg.textContent = String(k + 1).padStart(2, '0'); });
    window.addEventListener('resize', () => this.fit()); this.fit();
    this.bindKeys(); this.bindBar(); this.buildMenu();
    let start = 0; const h = (location.hash || '').replace('#', '');
    if (/^s\d+$/.test(h)) start = clamp(parseInt(h.slice(1), 10) - 1, 0, this.slides.length - 1);
    try { const saved = sessionStorage.getItem('deck-slide'); if (!h && saved) start = clamp(+saved, 0, this.slides.length - 1); } catch (e) {}
    this.go(start, 0, true);
  },
  fit() {
    const r = this.viewport.getBoundingClientRect();
    const s = Math.min(r.width / 1920, r.height / 1080);
    this.scale = s;
    this.stage.style.transform = `scale(${s})`;
    this.stage.style.left = Math.round((r.width - 1920 * s) / 2) + 'px';
    this.stage.style.top = Math.round((r.height - 1080 * s) / 2) + 'px';
  },
  maxStep(s) { return +(s.dataset.steps || 0); },
  go(i, step = 0, instant) {
    if (this.outro) { const o = this.outro; this.outro = null; o.cancel(); }
    i = clamp(i, 0, this.slides.length - 1);
    if (step === 'end') step = this.maxStep(this.slides[i]);
    const prev = this.slides[this.i];
    if (i !== this.i || instant) {
      if (prev && prev !== this.slides[i]) { prev.classList.remove('is-active'); this.call(prev, 'leave'); }
      this.i = i; const cur = this.slides[i];
      cur.classList.add('is-active');
      this.step = step;
      this.applySteps(cur);
      this.call(cur, 'enter');
      this.call(cur, 'step', this.step);
    } else {
      this.step = step; this.applySteps(this.slides[i]); this.call(this.slides[i], 'step', this.step);
    }
    this.updateBar();
    try { history.replaceState(null, '', '#s' + (this.i + 1)); } catch (e) {}
    try { sessionStorage.setItem('deck-slide', this.i); } catch (e) {}
    Presenter.publish();
  },
  applySteps(s) {
    s.dataset.step = this.step;
    $$('[data-s]', s).forEach(el => {
      const k = +el.dataset.s; el.classList.toggle('is-on', this.step >= k);
      if (el.dataset.dim) el.classList.toggle('is-dim', this.step >= +el.dataset.dim);
    });
  },
  // a hook may define outro(slide, done): it plays a hand-off into the next slide and returns { skip, cancel };
  // pressing → again skips to the end, any other move cancels it
  next() {
    if (this.outro) return this.outro.skip();
    const s = this.slides[this.i];
    if (this.step < this.maxStep(s)) return this.go(this.i, this.step + 1);
    if (this.i >= this.slides.length - 1) return;
    const h = this.hooks[s.id], from = this.i;
    if (h && h.outro && !REDUCED) { this.outro = h.outro(s, () => { this.outro = null; if (this.i === from) this.go(from + 1, 0); }); if (this.outro) return; }
    this.go(this.i + 1, 0);
  },
  prev() { if (this.step > 0) this.go(this.i, this.step - 1); else if (this.i > 0) this.go(this.i - 1, 'end'); },
  call(s, name, arg) { const h = this.hooks[s.id]; if (h && h[name]) try { h[name](s, arg); } catch (e) { console.error(s.id, name, e); } },
  bindKeys() {
    document.addEventListener('keydown', e => {
      const t = e.target; const tag = (t.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'select' || tag === 'textarea') { if (e.key === 'Escape') t.blur(); return; }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key;
      // a popup (this.modal = { close, toggle }) takes the keys: Esc closes it, Space plays or pauses its video, nothing moves the deck
      if (this.modal) { if (k === 'Escape') { e.preventDefault(); this.modal.close(); } else if (k === ' ' && this.modal.toggle) { e.preventDefault(); this.modal.toggle(); } else if (['ArrowRight', 'ArrowLeft', 'PageDown', 'PageUp', 'Enter', 'Backspace'].includes(k) && tag !== 'button') e.preventDefault(); return; }
      if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(k)) { if (k === 'Enter' && tag === 'button') return; e.preventDefault(); this.next(); }
      else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(k)) { e.preventDefault(); this.prev(); }
      else if (k === 'Home') this.go(0); else if (k === 'End') this.go(this.slides.length - 1);
      else if (k === 'n' || k === 'N') this.toggleNotes();
      else if (k === 'm' || k === 'M') this.toggleMenu();
      else if (k === 'f' || k === 'F') this.fullscreen();
      else if (k === 'p' || k === 'P') Presenter.open();
      else if (k === 'Escape') { $('#menu').hidden = true; $('#notes').hidden = true; this.updateBar(); }
    });
    let x0 = null, y0 = null;
    this.viewport.addEventListener('touchstart', e => { if (e.target.closest('input,button,.no-swipe')) { x0 = null; return; } x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    this.viewport.addEventListener('touchend', e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) dx < 0 ? this.next() : this.prev(); x0 = null; }, { passive: true });
  },
  bindBar() {
    $('#bPrev').onclick = () => this.prev(); $('#bNext').onclick = () => this.next();
    $('#bNotes').onclick = () => this.toggleNotes(); $('#bMenu').onclick = () => this.toggleMenu();
    $('#bFull').onclick = () => this.fullscreen();
    if (HAS_PRESENTER) $('#bPresent').onclick = () => Presenter.open(); else $('#bPresent').remove();
  },
  buildMenu() {
    const m = $('#menu'); let chap = null; const frag = document.createDocumentFragment();
    this.slides.forEach((s, k) => {
      if (s.dataset.chapter !== chap) { chap = s.dataset.chapter; const c = document.createElement('div'); c.className = 'chap'; c.textContent = chap; frag.appendChild(c); }
      const b = document.createElement('button'); b.type = 'button';
      b.innerHTML = `<span>${String(k + 1).padStart(2, '0')}</span>${s.dataset.title}`;
      b.onclick = () => { this.go(k, 0); m.hidden = true; this.updateBar(); };
      frag.appendChild(b);
    });
    m.appendChild(frag);
  },
  toggleNotes() { const n = $('#notes'); n.hidden = !n.hidden; this.updateBar(); },
  toggleMenu() { const m = $('#menu'); m.hidden = !m.hidden; this.updateBar(); },
  fullscreen() { const el = document.documentElement; try { if (!document.fullscreenElement) el.requestFullscreen && el.requestFullscreen().catch(() => {}); else document.exitFullscreen && document.exitFullscreen(); } catch (e) {} },
  updateBar() {
    const s = this.slides[this.i];
    $('#where').textContent = `${s.dataset.chapter} · ${s.dataset.title}`;
    $('#count').textContent = `${this.i + 1} / ${this.slides.length}`;
    $('#progress').style.width = ((this.i + 1) / this.slides.length * 100) + '%';
    const notes = s.querySelector('aside.notes');
    $('#notesBody').innerHTML = notes ? notes.innerHTML : '<p>No notes for this slide.</p>';
    // notes split by press (<p data-press="k">): what belongs to a later press is dimmed
    let pk = 0; [...$('#notesBody').children].forEach(el => { if (el.dataset.press) pk = +el.dataset.press; el.classList.toggle('later', pk > this.step); el.classList.toggle('now', pk === this.step); });
    $('#bNotes').setAttribute('aria-pressed', String(!$('#notes').hidden));
    $('#bMenu').setAttribute('aria-pressed', String(!$('#menu').hidden));
    $$('#menu button').forEach((b, k) => b.classList.toggle('cur', k === this.i));
  },
  // map client coords to stage coords
  toStage(cx, cy) { const r = this.stage.getBoundingClientRect(); return { x: (cx - r.left) / this.scale, y: (cy - r.top) / this.scale }; }
};

/* stage tooltip */
const Tip = {
  el: null,
  show(html, cx, cy) { if (!this.el) this.el = $('#tip'); this.el.innerHTML = html; this.el.hidden = false; const p = Deck.toStage(cx, cy); const w = this.el.offsetWidth, h = this.el.offsetHeight; this.el.style.left = clamp(p.x + 18, 8, 1912 - w) + 'px'; this.el.style.top = clamp(p.y + 18, 8, 1072 - h) + 'px'; },
  hide() { if (this.el) this.el.hidden = true; }
};
function bindTip(node, htmlFn) {
  node.addEventListener('pointermove', e => Tip.show(typeof htmlFn === 'function' ? htmlFn(e) : htmlFn, e.clientX, e.clientY));
  node.addEventListener('pointerleave', () => Tip.hide());
}

/* animation loop helper: runs only while its slide is active */
function loopOn(slideId, fn) {
  let raf = null, t0 = 0;
  const tick = now => { if (!t0) t0 = now; fn((now - t0) / 1000); raf = requestAnimationFrame(tick); };
  return {
    start() { if (raf) return; t0 = 0; raf = requestAnimationFrame(tick); },
    stop() { if (raf) cancelAnimationFrame(raf); raf = null; }
  };
}
/* tween helper */
function tween(dur, fn, done) {
  if (REDUCED) { fn(1); done && done(); return { stop() {} }; }
  let raf, t0; const tick = now => { if (!t0) t0 = now; const t = clamp((now - t0) / (dur * 1000), 0, 1); fn(t); if (t < 1) raf = requestAnimationFrame(tick); else done && done(); };
  raf = requestAnimationFrame(tick); return { stop() { cancelAnimationFrame(raf); } };
}
/* count-up for elements with data-count */
function countUp(el, to, dur = 1.2, dec = 0, pre = '', suf = '') {
  return tween(dur, t => { el.textContent = pre + fmtN(lerp(0, to, easeOut(t)), dec) + suf; });
}

/* 'YYYY-MM-DD' → decimal year */
const yearOf = s => { const [y, m, d] = s.split('-').map(Number); return y + (m - 1) / 12 + ((d || 1) - 1) / 365; };
/* monotone cubic smoothing through [x,y] points (no overshoot) */
function smoothPath(pts) {
  const n = pts.length, dx = [], m = [], s = [];
  if (n < 2) return `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < n - 1; i++) { dx[i] = pts[i + 1][0] - pts[i][0]; s[i] = (pts[i + 1][1] - pts[i][1]) / dx[i]; }
  m[0] = s[0]; m[n - 1] = s[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = s[i - 1] * s[i] <= 0 ? 0 : 3 * (dx[i - 1] + dx[i]) / ((2 * dx[i] + dx[i - 1]) / s[i - 1] + (dx[i] + 2 * dx[i - 1]) / s[i]);
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) { const h = dx[i] / 3; d += ` C${(pts[i][0] + h).toFixed(1)} ${(pts[i][1] + m[i] * h).toFixed(1)} ${(pts[i + 1][0] - h).toFixed(1)} ${(pts[i + 1][1] - m[i + 1] * h).toFixed(1)} ${pts[i + 1][0].toFixed(1)} ${pts[i + 1][1].toFixed(1)}`; }
  return d;
}

/* ---------- helpers for hooks ---------- */
const H = Deck.hooks;
const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
// C['m1-ink'] is the resolved value of --m1-ink: SVG attributes cannot read var(), so drawings take colours from here
const C = new Proxy({}, { get: (o, k) => o[k] || (o[k] = css('--' + k)) });
const F = (weight, size, color, family = 'var(--f-body)') => `font:${weight} ${size}px ${family};fill:${color}`;
function txt(parent, x, y, s, attrs = {}) { const t = svgEl('text', Object.assign({ x, y }, attrs), parent); t.textContent = s; return t; }
const linear = (d0, d1, r0, r1) => v => r0 + (v - d0) / (d1 - d0) * (r1 - r0);
// draw a path in, as if by pen. Returns { stop }
function drawPath(path, dur = 1.4, delay = 0) {
  const L = path.getTotalLength(); path.style.strokeDasharray = L; path.style.strokeDashoffset = L;
  let tw = null; const id = setTimeout(() => { tw = tween(dur, t => path.style.strokeDashoffset = L * (1 - ease(t))); }, delay * 1000);
  return { stop() { clearTimeout(id); tw && tw.stop(); } };
}

/* ---------- pressHook: the standard hook for a slide with presses ----------
   settle(k, s) draws the state after press k with nothing moving. It is the specification of the slide.
   play(k, m, s) animates the one thing press k adds, starting from settle(k − 1). play(0) is the entrance.
   The engine may call step with any k (stepping back, a jump from the menu, arriving at the end from the next slide),
   so only the natural next press animates and every other arrival shows the settled state.
   m tracks whatever play starts, and stops it on the next press and on leaving:
     m.tw(seconds, fn(t), delaySeconds)   m.later(ms, fn)   m.add(anything with a stop())
   build(s) runs on every enter, so a drawing made from the model picks up changes made on another slide. */
function tracker() {
  const live = [];
  return {
    tw(dur, fn, delay = 0, done) { let h = null; const id = setTimeout(() => { h = tween(dur, fn, done); }, delay * 1000); live.push({ stop() { clearTimeout(id); h && h.stop(); } }); },
    later(ms, fn) { const id = setTimeout(fn, ms); live.push({ stop() { clearTimeout(id); } }); },
    add(h) { if (h && h.stop) live.push(h); return h; },
    stop() { live.splice(0).forEach(h => h.stop()); }
  };
}
function pressHook({ build, settle, play, leave }) {
  const m = tracker(); let last = -1;
  const hook = {
    k: 0,
    enter(s) { last = -1; build && build(s); },
    step(s, k) {
      m.stop(); hook.k = k;
      const forward = k === last + 1; last = k;
      settle(forward && k > 0 ? k - 1 : k, s);
      if (forward && play) play(k, m, s);
    },
    leave(s) { m.stop(); last = -1; leave && leave(s); }
  };
  return hook;
}
// place a generated anatomy scene (SCN.<name>) in a container; lit = paint its solids in the accent face colour
function placeScene(box, scn, { lit = false, style = '' } = {}) {
  const d = document.createElement('div'); d.className = 'iso'; d.dataset.theme = 'light'; if (style) d.setAttribute('style', style);
  d.innerHTML = scn.svg; if (lit) d.querySelectorAll('.iso-solid').forEach(s => s.setAttribute('data-lit', ''));
  box.appendChild(d); return d;
}
// slide the pieces of a scene apart: u = 0 assembled, 1 fully exploded
function explodeScene(el, scn, u) { el.querySelectorAll('[data-piece]').forEach(g => { const s = scn.data.shifts[g.dataset.piece]; if (s) g.setAttribute('transform', `translate(${s[0] * u} ${s[1] * u})`); }); }
