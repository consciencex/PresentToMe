/* ===== Kit.figure: an anatomy figure that shows one part per press =====
   Kit.figure(box, scene, { parts, card, list, leader, lift, seconds }) places the scene (an entry of SCN) in box and
   returns { settle, play } for pressHook. On entering, the figure settles from exploded to assembled. Press k lights
   part k, lifts it, moves away the pieces that cover it, dims the other moving pieces, fills the card and draws a
   dotted leader from the card to the part. At the last press every named part is lit.
     parts   [{ piece, tag, h, line, fig: () => [value, unit], tone, lift }]   one per press; only piece is required
     card    the element that shows the part in words. Left or right of the figure
     list    an element whose children name the parts in order (or an array of elements): the current one is marked
     leader  true (default) draws the leader in an overlay it adds; false leaves it out; an <svg> is used as the overlay
     lift    how far a part moves when it is shown, as a share of its move (default 0.6)
   Markup mode needs no JavaScript: <div data-kit="figure" data-scene="name"> holding one
   <template data-piece="…" data-tag="…" data-h="…" data-value="…" data-unit="…">One line.</template> per part. */
(function () {
  const NS = (() => { try { return Kit; } catch (e) { return (window.Kit = window.Kit || {}); } })();
  const TONES = { m2: ['m2', 'm2-ink'], m3: ['m3', 'm3-ink'], risk: ['risk', 'risk'], ok: ['ok', 'ok'] };
  const CSS = `
.kf-fig [data-piece].kf-dim{--anatomy-hi:var(--line);--anatomy-mid:var(--line);--anatomy-lo:var(--line-2);--anatomy-faint:var(--line-2)}
.kf-card,.kf-list li{--kf:var(--m1);--kf-ink:var(--m1-ink)}
${Object.entries(TONES).map(([t, [paint, ink]]) => `.kf-fig [data-kf-tone="${t}"],.kf-card[data-tone="${t}"],.kf-list li[data-tone="${t}"]{--kf:var(--${paint});--kf-ink:var(--${ink})}`).join('\n')}
.kf-fig [data-kf-tone]{--anatomy-face:color-mix(in srgb,var(--kf) 30%,var(--bg));--anatomy-lit-top:color-mix(in srgb,var(--kf) 15%,var(--bg));--anatomy-lit-shade:color-mix(in srgb,var(--kf) 55%,var(--bg));--anatomy-lit:var(--kf-ink)}
.kf-card{gap:12px;opacity:0;transform:translateY(12px);transition:opacity .5s ease,transform .5s cubic-bezier(.2,.7,.2,1)}
.kf-card.on{opacity:1;transform:none}
.kf-card .tag,.kf-card .kf-num{color:var(--kf-ink)}
.kf-card .kf-num{font:700 76px/1 var(--f-display);font-stretch:118%;letter-spacing:-.02em;font-variant-numeric:tabular-nums;margin-top:8px}
.kf-card .kf-num small{font:500 24px/1 var(--f-mono);letter-spacing:.02em;color:var(--fg-3);margin-left:10px}
.kf-list{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:10px 24px}
.kf-list li{font:500 20px/1 var(--f-mono);letter-spacing:.06em;text-transform:uppercase;color:var(--fg-3);padding:12px 0;border-top:1px solid var(--line-2);transition:color .4s ease}
.kf-list li span{margin-right:10px}
.kf-list li.on{color:var(--kf-ink);border-top-color:var(--kf)}
svg.kf-lead{position:absolute;left:0;top:0;width:100%;height:100%;max-width:none;overflow:visible;pointer-events:none}
.kf{position:relative;display:grid;grid-template-columns:minmax(0,1fr) 520px;gap:56px;align-items:center}
.kf[data-side="left"]{grid-template-columns:520px minmax(0,1fr)}
.kf[data-side="left"]>.kf-side{order:-1}
.kf>.kf-fig{justify-self:center;width:100%}
.kf-side{display:flex;flex-direction:column;gap:26px;min-width:0}
.kf-none{display:grid;place-items:center;min-height:320px;padding:32px;border:1px dashed var(--line);border-radius:20px;font:500 20px/1.5 var(--f-mono);color:var(--fg-3);text-align:center}`;
  // the rules ride with the script, so the helper works in any deck that lists it. Added last, so a deck overrides them with a slide id
  function css() { if (css.done) return; css.done = true; const el = document.createElement('style'); el.dataset.kit = 'figure'; el.textContent = CSS; document.head.appendChild(el); }
  const add = (parent, tag, cls) => { const el = document.createElement(tag); if (cls) el.className = cls; parent.appendChild(el); return el; };

  // Kit.auto hands every data-kit element to its component as (drawing, options): for a figure the markup is the options
  function figure(box, scn, options) {
    const host = !(scn && scn.data) && box.closest('[data-kit="figure"]');
    if (!host) return make(box, scn, options);
    if (box !== host) box.remove();
    return auto(host);
  }
  function make(box, scn, { parts = [], card = null, list = null, leader = true, lift = .6, seconds = 1.8, name = '' } = {}) {
    const data = scn && scn.data;
    css();
    box.classList.add('kf-fig');
    const SH = data ? data.shifts : {}, AN = (data && data.ANCHORS) || {}, COVERS = (data && data.COVERS) || {};
    const iso = data ? placeScene(box, scn) : add(box, 'div', 'kf-none');
    if (!data) iso.textContent = name ? `Figure "${name}" is not built yet. Write anatomy/scenes/${name}.mjs with a preset from anatomy/scenes/presets.mjs, run node anatomy/scenes/${name}.mjs, then build.` : 'This figure names no scene. Give it data-scene="name".';
    const groups = data ? [...iso.querySelectorAll('[data-piece]')] : [], known = new Set(groups.map(g => g.dataset.piece));
    const n = parts.length, items = !list ? [] : list.children ? [...list.children] : [...list];
    if (list && list.classList) list.classList.add('kf-list');
    if (card) card.classList.add('kf-card');
    parts.forEach((p, i) => {
      if (data && !known.has(p.piece)) console.warn(`Kit.figure: the scene has no piece "${p.piece}". It has: ${[...known].join(', ')}`);
      if (!p.tone) return;
      groups.forEach(g => { if (g.dataset.piece === p.piece) g.dataset.kfTone = p.tone; });
      if (items[i]) items[i].dataset.tone = p.tone;
    });

    // the leader is drawn in an overlay on the nearest element that holds both the figure and the card
    let root = null, lead = null;
    if (leader && card && data) {
      if (leader instanceof SVGElement) { lead = leader; root = lead.parentNode; }
      else { root = box.parentNode; while (root && !root.contains(card)) root = root.parentNode; }
      if (root && getComputedStyle(root).position === 'static') root.style.position = 'relative';
      if (root && !lead) lead = svgEl('svg', { class: 'kf-lead', 'aria-hidden': 'true' }, root);
    }
    // offsetLeft and offsetTop ignore the stage scale and the card's own entrance transform
    const from = el => { let x = 0, y = 0; for (let e = el; e && e !== root; e = e.offsetParent) { x += e.offsetLeft; y += e.offsetTop; } return [x, y]; };

    let u = 0, lifts = {}, aimed = null;
    const share = piece => Math.max(u, lifts[piece] || 0);
    // nl: { piece: share of its move }; nu: share of the whole explode
    function pose(nu, nl) {
      u = nu; lifts = nl;
      groups.forEach(g => { const sh = SH[g.dataset.piece]; if (!sh) return; const t = share(g.dataset.piece); g.setAttribute('transform', `translate(${(sh[0] * t).toFixed(2)} ${(sh[1] * t).toFixed(2)})`); });
      if (aimed) aim();
    }
    function aim() {
      const { path, dot, piece } = aimed, sh = SH[piece] || [0, 0], t = share(piece), f = iso.offsetWidth / data.W, [fx, fy] = from(iso), [x0, y0] = from(card);
      const ax = fx + (AN[piece][0] + sh[0] * t) * f, ay = fy + (AN[piece][1] + sh[1] * t) * f;
      const right = x0 + card.offsetWidth / 2 > ax, cx = right ? x0 : x0 + card.offsetWidth, cy = y0 + 46;
      path.setAttribute('d', `M${cx} ${cy} H${cx + (right ? -36 : 36)} L${ax.toFixed(1)} ${ay.toFixed(1)}`); dot.setAttribute('cx', ax.toFixed(1)); dot.setAttribute('cy', ay.toFixed(1));
    }
    function light(k) {
      const lit = k >= n ? parts.map(p => p.piece) : k >= 1 ? [parts[k - 1].piece] : [];
      groups.forEach(g => {
        const piece = g.dataset.piece, on = lit.includes(piece);
        g.querySelectorAll('.iso-solid').forEach(e => on ? e.setAttribute('data-lit', '') : e.removeAttribute('data-lit'));
        g.classList.toggle('kf-dim', k >= 1 && k < n && piece !== 'base' && !on);
      });
      items.forEach((li, i) => li.classList.toggle('on', i < k && (k >= n || i === k - 1)));
    }
    function show(k, animate) {
      if (lead) lead.replaceChildren();
      aimed = null;
      if (!card) return;
      if (k < 1) { card.classList.remove('on'); return; }
      const p = parts[k - 1], tone = p.tone || 'm1', num = p.fig ? p.fig() : null;
      card.dataset.tone = tone;
      card.innerHTML = (p.tag ? `<p class="tag">${p.tag}</p>` : '') + (p.h ? `<h3>${p.h}</h3>` : '') + (p.line ? `<p>${p.line}</p>` : '') + (num ? `<p class="kf-num">${num[0]}<small>${num[1] ?? ''}</small></p>` : '');
      if (animate) { card.classList.remove('on'); void card.offsetWidth; }   // restart the fade from the hidden state
      card.classList.add('on');
      if (!lead || !AN[p.piece]) return;
      const path = svgEl('path', { fill: 'none', stroke: C[tone], 'stroke-width': 1.6, 'stroke-dasharray': '2 5', 'stroke-linecap': 'round' }, lead);
      const dot = svgEl('circle', { r: 6, fill: C[tone], stroke: C.bg, 'stroke-width': 2.5 }, lead);
      aimed = { path, dot, piece: p.piece }; aim();
    }
    function liftsFor(k) {
      if (k < 1 || !n) return {};
      const p = parts[Math.min(k, n) - 1], out = {};
      (COVERS[p.piece] || []).forEach(c => { out[c] = 1; });
      out[p.piece] = p.lift ?? lift;
      return out;
    }
    function settle(k) { k = Math.min(k, n); pose(0, liftsFor(k)); light(k); show(k, false); }
    function play(k, m) {
      if (k === 0) { pose(1, {}); m.tw(seconds, t => pose(1 - ease(t), {})); return; }   // on entering, the figure settles together
      if (k > n) return;
      const a = liftsFor(k - 1), b = liftsFor(k), keys = [...new Set([...Object.keys(a), ...Object.keys(b)])];
      light(k); show(k, true);
      m.tw(.8, t => pose(0, Object.fromEntries(keys.map(piece => [piece, lerp(a[piece] || 0, b[piece] || 0, ease(t))]))));
    }
    return { settle, play, el: iso, parts };
  }

  /* ---------- markup mode: the element becomes a figure, an optional parts list (data-list) and a card (data-side="left" to swap sides) ---------- */
  const built = new WeakMap();
  function auto(el) {
    if (built.has(el)) return built.get(el);
    css();
    const name = el.dataset.scene || '', scn = SCN[name], room = el.clientHeight;
    const parts = [...el.querySelectorAll(':scope > template[data-piece]')].map(t => ({
      piece: t.dataset.piece, tag: t.dataset.tag, h: t.dataset.h, line: t.innerHTML.trim(), tone: t.dataset.tone,
      lift: t.dataset.lift ? +t.dataset.lift : undefined, fig: t.dataset.value !== undefined ? () => [t.dataset.value, t.dataset.unit || ''] : null,
    }));
    el.classList.add('kf');
    const box = add(el, 'div'), side = add(el, 'div', 'kf-side');
    let list = null;
    if (el.hasAttribute('data-list')) {
      list = add(side, 'ol');
      parts.forEach(p => { const m = /^(\S+)\s*·\s*(.+)$/.exec(p.tag || ''); add(list, 'li').innerHTML = m ? `<span>${m[1]}</span>${m[2]}` : p.tag || p.piece; });
    }
    const card = add(side, 'div', 'card raised');
    card.setAttribute('aria-live', 'polite');
    // the figure takes the height the slide leaves it, so a tall scene does not push the card off the stage
    if (scn && room > 120) box.style.maxWidth = Math.floor(room * scn.data.W / scn.data.H) + 'px';
    const fig = make(box, scn, { parts, card, list, name });
    // the card keeps the height of its longest part, so it does not jump between presses
    const tall = Math.max(0, ...parts.map((p, i) => { fig.settle(i + 1); return card.offsetHeight; }));
    fig.settle(0);
    if (tall) card.style.minHeight = tall + 'px';
    const steps = +(el.closest('.slide')?.dataset.steps || 0);
    if (steps !== parts.length) console.warn(`Kit.figure: "${name}" has ${parts.length} parts but its slide has data-steps="${steps}". Give the slide one press per part.`);
    // set and dur make it a kit component for Kit.auto; the presses are driven below, so set has nothing to do
    const c = { el, dur: 1, part: {}, set() {}, settle: fig.settle, play: fig.play, parts };
    built.set(el, c);
    return c;
  }
  // every slide that holds data-kit="figure" gets its presses from here, after the slide's own hook has run
  const hooks = new WeakMap();
  function hookOf(slide) {
    if (!hooks.has(slide)) {
      const els = [...slide.querySelectorAll('[data-kit="figure"]')];
      let figs = [];
      hooks.set(slide, els.length ? pressHook({ build() { figs = els.map(auto); }, settle(k) { figs.forEach(f => f.settle(k)); }, play(k, m) { figs.forEach(f => f.play(k, m)); } }) : null);
    }
    return hooks.get(slide);
  }
  const call = Deck.call;
  Deck.call = function (s, name, arg) {
    call.call(this, s, name, arg);
    const hook = hookOf(s);
    if (hook && hook[name]) try { hook[name](s, arg); } catch (e) { console.error(s.id, 'figure', e); }
  };

  figure.auto = auto;
  NS.figure = figure;
})();
