// Ready-made anatomy figures. One call writes <name>.data.json beside the scene file that makes the call:
//   // anatomy/scenes/air.mjs
//   import { laptop } from "./presets.mjs";
//   laptop({ name: "air", fan: false });
// Run it with  node anatomy/scenes/air.mjs --audit , then build: the deck has the figure under that name.
// Every preset names its pieces, gives each one a move, an anchor and the list of pieces that cover it,
// and sizes the figure to hold the full explode. Sizes are real numbers in the unit each preset states.
// x runs right and down on screen, y runs left and down, z is up. The camera sees the +x and +y faces.
import { dirname } from "node:path";
import * as k from "../kit/iso-kit.mjs";
import { scene } from "./scene.mjs";

const range = (n) => Array.from({ length: n }, (_, i) => i);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* ---------- solids: plain data in real units, drawn once the bounds of the whole figure are known ---------- */
const slab = (name, piece, [x, y, w, d], z, h, o = {}) => ({ name, piece, plan: { x, y, w, d, r: o.r ?? 0 }, z, h, tone: "hi", ...o });
const cornersOf = (b) => b.turn ? b.outline.flatMap(([z, r]) => [-r, r].flatMap((dx) => [-r, r].map((dy) => [b.turn[0] + dx, b.turn[1] + dy, z])))
  : b.pts ? b.pts.flatMap(([a, z]) => [b.y0, b.y1].map((c) => (b.along === "x" ? [c, a, z] : [a, c, z])))
  : (b.ring ?? [[b.plan.x, b.plan.y], [b.plan.x + b.plan.w, b.plan.y], [b.plan.x + b.plan.w, b.plan.y + b.plan.d], [b.plan.x, b.plan.y + b.plan.d]]).flatMap(([x, y]) => [[x, y, b.z], [x, y, b.z + b.h]]);

// a surface is a rectangle to draw on: u runs left to right on screen for the two side faces, v runs up
const topOf = (b) => ({ w: b.plan.w, h: b.plan.d, at: (u, v) => [b.plan.x + u, b.plan.y + v, b.z + b.h] });
const sideX = (b) => ({ w: b.plan.d, h: b.h, at: (u, v) => [b.plan.x + b.plan.w, b.plan.y + b.plan.d - u, b.z + v] });
const sideY = (b) => ({ w: b.plan.w, h: b.h, at: (u, v) => [b.plan.x + u, b.plan.y + b.plan.d, b.z + v] });
const within = (S, u0, v0, u1, v1) => ({ w: u1 - u0, h: v1 - v0, at: (u, v) => S.at(u0 + u, v0 + v) });
const edge = (S) => 0.07 * Math.min(S.w, S.h);

function pen(s, K) {
  const at = (p) => s.at(p.map((v) => v * K));
  const poly = (S, pts, closed = false) => k.pathOf(pts.map(([u, v]) => at(S.at(u, v))), closed);
  return {
    poly,
    seg: (S, u0, v0, u1, v1) => poly(S, [[u0, v0], [u1, v1]]),
    rect: (S, u0, v0, u1, v1, r = 0) => poly(S, k.roundedPlan({ x: u0, y: v0, w: u1 - u0, d: v1 - v0, r }, 4), true),
    circle: (S, cu, cv, r, n = 28) => poly(S, k.circleRing(cu, cv, r, n), true),
    dots: (S, pts, style) => k.dotsSvg(pts.map(([u, v]) => at(S.at(u, v))), style),
    // on a round body: the half of a ring the camera sees, a whole ring on a top, and upright lines on the near side
    arc: ([x, y], r, z) => k.sideArc(x * K, y * K, r * K, z * K, s.P),
    ring: ([x, y], r, z) => k.ring(x * K, y * K, r * K, z * K, s.P),
    ribs: ([x, y], r, z0, z1, n) => k.knurl(x * K, y * K, r * K, z0 * K, z1 * K, n, s.P, 0),
    line: s.line,
  };
}

/* ---------- surface patterns: the `detail` of a layer. Each draws on any surface, so one pattern serves a top and a face ---------- */
const PATTERNS = {
  none: () => "",
  grid(S, g, { m = edge(S), cell = Math.max(S.w, S.h) / 12 } = {}) {
    const nu = Math.max(1, Math.round((S.w - 2 * m) / cell)), nv = Math.max(1, Math.round((S.h - 2 * m) / cell));
    let d = "";
    for (let i = 1; i < nu; i++) d += g.seg(S, m + (i * (S.w - 2 * m)) / nu, m, m + (i * (S.w - 2 * m)) / nu, S.h - m);
    for (let j = 1; j < nv; j++) d += g.seg(S, m, m + (j * (S.h - 2 * m)) / nv, S.w - m, m + (j * (S.h - 2 * m)) / nv);
    return g.line(d, { tone: "faint" }) + g.line(g.rect(S, m, m, S.w - m, S.h - m), { tone: "lo" });
  },
  vents(S, g, { m = edge(S) * 1.6, pitch = Math.max(S.w, S.h) / 26, tone = "lo" } = {}) {
    const n = Math.max(2, Math.floor((S.w - 2 * m) / pitch));
    return g.line(range(n).map((i) => g.seg(S, m + ((i + 0.5) * (S.w - 2 * m)) / n, m, m + ((i + 0.5) * (S.w - 2 * m)) / n, S.h - m)).join(""), { tone });
  },
  ports(S, g, { n = 3, m = Math.max(edge(S), S.w * 0.06) } = {}) {
    const ph = Math.min(S.h * 0.42, S.w / 24), pw = ph * 2.6, v = (S.h - ph) / 2;
    return g.line(range(n).map((i) => g.rect(S, m + i * pw * 1.7, v, m + i * pw * 1.7 + pw, v + ph, ph * 0.3)).join(""), { tone: "mid" });
  },
  cells(S, g, { n = 3, m = edge(S) * 1.3 } = {}) {
    const long = S.w >= S.h, L = (long ? S.w : S.h) - 2 * m, gap = m * 0.5, c = (L - gap * (n - 1)) / n;
    const one = (i) => (long ? g.rect(S, m + i * (c + gap), m, m + i * (c + gap) + c, S.h - m, m * 0.7) : g.rect(S, m, m + i * (c + gap), S.w - m, m + i * (c + gap) + c, m * 0.7));
    return g.line(range(n).map(one).join(""), { tone: "mid" });
  },
  chips(S, g) {
    const q = Math.min(S.w, S.h), c = q * 0.3, cu = S.w * 0.46, cv = S.h * 0.54;
    const main = g.rect(S, cu - c / 2, cv - c / 2, cu + c / 2, cv + c / 2, c * 0.08) + g.rect(S, cu - c * 0.3, cv - c * 0.3, cu + c * 0.3, cv + c * 0.3);
    const small = g.rect(S, S.w * 0.68, S.h * 0.22, S.w * 0.68 + q * 0.16, S.h * 0.22 + q * 0.24) + g.rect(S, S.w * 0.68, S.h * 0.58, S.w * 0.68 + q * 0.16, S.h * 0.58 + q * 0.12) + g.rect(S, S.w * 0.1, S.h * 0.14, S.w * 0.1 + q * 0.2, S.h * 0.14 + q * 0.09);
    const traces = [0.38, 0.5, 0.62].map((t) => g.poly(S, [[cu + c / 2, S.h * t], [S.w * 0.6, S.h * t], [S.w * 0.64, S.h * (t - 0.06)], [S.w * 0.68, S.h * (t - 0.06)]])).join("")
      + [0.34, 0.44].map((t) => g.poly(S, [[S.w * t, cv - c / 2], [S.w * t, S.h * 0.26], [S.w * (t - 0.07), S.h * 0.2]])).join("");
    return g.line(traces, { tone: "faint" }) + g.line(small, { tone: "lo" }) + g.line(main, { tone: "mid" });
  },
  screen(S, g, { m = edge(S) } = {}) {
    return g.line(g.rect(S, m, m, S.w - m, S.h - m, m * 0.5), { tone: "mid" });
  },
  windows(S, g, { bay = S.h * 1.05 } = {}) {
    const n = Math.max(1, Math.floor(S.w / bay)), b = S.w / n;
    return g.line(range(n).map((i) => g.rect(S, (i + 0.24) * b, S.h * 0.3, (i + 0.76) * b, S.h * 0.78)).join(""), { tone: "mid" });
  },
};
const ON_SIDES = new Set(["ports", "windows"]);
const pattern = (name) => PATTERNS[name] ?? (() => { throw new Error(`no detail "${name}". Have: ${Object.keys(PATTERNS).join(", ")}`); })();
const detailOf = (b, name, o) => (g) => (ON_SIDES.has(name) ? [sideX(b), sideY(b)] : [topOf(b)]).map((S) => pattern(name)(S, g, o)).join("");

/* ---------- emit: fit the camera to every solid at rest and at the end of its move, draw, write the file ---------- */
function emit({ name, dir = dirname(process.argv[1]), W, H, AZ = 40, EL = 27, pad = 26, label, solids, moves, anchors, covers = {}, audit }) {
  if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(name)) throw new Error(`name "${name}" must be letters, digits and _ only, starting with a letter: the deck reads the figure by that name`);
  const rest = solids.flatMap(cornersOf), span = (i) => Math.max(...rest.map((p) => p[i])) - Math.min(...rest.map((p) => p[i]));
  // the audit measures in absolute units (a touch is 0.15, a depth step 0.3), so every figure is drawn about 80 units across
  const K = 80 / Math.max(span(0), span(1), span(2)), up = (p) => p.map((v) => v * K);
  const reach = solids.flatMap((b) => cornersOf(b).flatMap((p) => [p, p.map((v, i) => v + (moves[b.piece]?.[i] ?? 0))]));
  // W and H left out: the figure takes the shape of what it holds, as large as fits 1100 × 700, the room a slide gives a figure
  const flat = reach.map((p) => k.iso(p, { origin: [0, 0], scale: 1, azimuth: AZ, elevation: EL })), wide = Math.max(...flat.map((p) => p[0])) - Math.min(...flat.map((p) => p[0])), tall = Math.max(...flat.map((p) => p[1])) - Math.min(...flat.map((p) => p[1]));
  const fit = W ? (W - 2 * pad) / wide : H ? (H - 2 * pad) / tall : Math.min((1100 - 2 * pad) / wide, (700 - 2 * pad) / tall);
  W ??= Math.round(wide * fit + 2 * pad);
  H ??= Math.round(tall * fit + 2 * pad);
  // the audit plays the explode as a spring, one piece after another in this order: the piece that travels furthest leaves first
  const order = Object.entries(moves).sort((a, b) => Math.hypot(...b[1]) - Math.hypot(...a[1]));
  // the draw order is solved for what a slide shows: the explode from 0 to 1, and each piece shown alone with its covers moved away
  const shown = Object.keys(moves).flatMap((id) => [0.3, 0.6, 1].map((t) => ({ label: `${id} shown at ${t}`, shares: { ...Object.fromEntries((covers[id] ?? []).map((c) => [c, 1])), [id]: t } })));
  const s = scene({ dir, file: `${name}.data.json`, prefix: name, W, H, AZ, EL, pad, bounds: { points: reach.map(up) }, moves: Object.fromEntries(order.map(([id, m]) => [id, up(m)])), label, states: [...range(11).map((i) => i / 10), ...shown] });
  const g = pen(s, K);
  for (const b of solids) {
    const style = { tone: b.tone }, opts = { piece: b.piece, bias: b.bias ?? 0, extra: b.draw ? b.draw(g) : "", ground: Boolean(b.ground) };
    if (b.turn) s.turned(b.name, up(b.turn), b.outline.map(([z, r, soft]) => [z * K, r * K, soft]), style, opts);
    else if (b.pts) s.profile(b.name, b.pts.map(up), b.y0 * K, b.y1 * K, style, { ...opts, along: b.along });
    else if (b.ring) s.prism(b.name, b.ring.map(up), b.z * K, b.h * K, style, opts);
    else s.box(b.name, { x: b.plan.x * K, y: b.plan.y * K, w: b.plan.w * K, d: b.plan.d * K, r: b.plan.r * K }, b.z * K, b.h * K, style, { ...opts, steps: b.plan.r ? 5 : 2 });
  }
  const feet = solids.filter((b) => b.ground).flatMap((b) => cornersOf(b.turn ? { ...b, outline: b.outline.slice(0, 1) } : b)), lo = (i) => Math.min(...feet.map((p) => p[i])), hi = (i) => Math.max(...feet.map((p) => p[i])), m = 0.03 * Math.max(span(0), span(1));
  const shadow = { x: (lo(0) - m) * K, y: (lo(1) - m) * K, w: (hi(0) - lo(0) + 2 * m) * K, d: (hi(1) - lo(1) + 2 * m) * K, r: 2 * m * K };
  s.finish([s.halo(shadow, lo(2) * K)], { anchors: Object.fromEntries(Object.entries(anchors).map(([id, p]) => [id, up(p)])), covers, audit });
  return { name, pieces: Object.keys(anchors) };
}

/* ---------- layers: named slabs on a base that lift apart. The body of stack, laptop, phone, building and box ---------- */
// skirt: true gives a layer walls on the two visible sides that hang down to the first layer, so the layers between are hidden until it lifts
function layersOf({ w, d, layers, gap, r = 0, wall = 0.012 * Math.max(w, d), z0 = 0, AZ = 40 }) {
  const solids = [], moves = {}, anchors = {}, covers = {}, byId = {}, ids = layers.map((L) => L.id);
  const hood = layers.findLastIndex((L) => L.skirt);
  let z = z0, lift = 0;
  layers.forEach((L, i) => {
    const inset = i > 0 && i < hood ? Math.max(L.inset ?? 0, wall * 1.4) : L.inset ?? 0;
    lift += i ? L.gap ?? gap : 0;
    moves[L.id] = [0, 0, lift];
    const b = slab(L.id, L.id, [inset, inset, w - 2 * inset, d - 2 * inset], z, L.h, { r: Math.max(0, (L.r ?? r) - inset), tone: L.tone ?? "hi", ground: i === 0 });
    b.draw = L.draw ? (g) => L.draw(g, b) : detailOf(b, L.detail ?? "none", L.detailOptions);
    solids.push(b);
    byId[L.id] = b;
    anchors[L.id] = [inset + (w - 2 * inset) * 0.8, inset + (d - 2 * inset) * 0.3, z + L.h];
    covers[L.id] = ids.slice(i + 1);
    z += L.h;
  });
  if (hood > 1) {
    // the band follows the outline between the two points where it turns away from the camera, and stops there:
    // carried further round, its ends would sit behind the layers it is meant to hide
    const top = byId[ids[hood]], z1 = byId[ids[0]].z + byId[ids[0]].h;
    const seen = (p) => {
      const arc = (cx, cy, a0, a1) => range(6).map((i) => { const a = ((a0 + ((a1 - a0) * i) / 5) * Math.PI) / 180; return [cx + p.r * Math.cos(a), cy + p.r * Math.sin(a)]; });
      return [...arc(p.x + p.w - p.r, p.y + p.r, AZ - 90, 0), ...arc(p.x + p.w - p.r, p.y + p.d - p.r, 0, 90), ...arc(p.x + p.r, p.y + p.d - p.r, 90, AZ + 90)].filter((q, i, all) => !i || Math.hypot(q[0] - all[i - 1][0], q[1] - all[i - 1][1]) > 1e-9);
    };
    const outer = seen({ x: 0, y: 0, w, d, r }), inner = seen({ x: wall, y: wall, w: w - 2 * wall, d: d - 2 * wall, r: Math.max(0, r - wall) });
    const band = { name: `${top.name}.skirt`, piece: top.piece, ring: [...outer, ...inner.reverse()], z: z1, h: top.z - z1, tone: top.tone };
    solids.push(band);
    byId[band.name] = band;
  }
  return { solids, moves, anchors, covers, byId, top: z };
}
const VIEW = ["dir", "W", "H", "AZ", "EL", "pad", "audit"];
const viewOf = (o) => Object.fromEntries(VIEW.filter((key) => o[key] !== undefined).map((key) => [key, o[key]]));
const list = (ids) => ids.join(", ").replace(/, ([^,]*)$/, " and $1");

/* 1. stack: the general preset. Any unit; the default is a 30 × 20 block of four layers */
export function stack(o = {}) {
  const { name = "stack", size = [30, 20], gap = 0.24 * Math.max(...size), r = 0.04 * Math.min(...size), label } = o;
  const layers = o.layers ?? [
    { id: "base", h: 2, tone: "lo" },
    { id: "cells", h: 3, inset: 0.6, detail: "cells", tone: "mid" },
    { id: "board", h: 1.2, inset: 0.6, detail: "chips", tone: "mid" },
    { id: "cover", h: 1.6, detail: "grid" },
  ];
  const L = layersOf({ w: size[0], d: size[1], layers, gap, r, AZ: o.AZ ?? 40 });
  return emit({ name, AZ: 40, EL: 27, ...viewOf(o), ...L, label: label ?? `A stack of ${layers.length} layers that lift apart: ${list(layers.map((l) => l.id))}.` });
}

/* 2. laptop: a 13-inch notebook, 30.4 wide × 21.5 deep × 1.1 cm closed. Sizes in cm */
export function laptop(o = {}) {
  const { name = "laptop", size = [30.4, 21.5, 1.1], lid = 110, parts = ["base", "battery", "board", "keys", "lid"], fan = true, ports = { left: 2, right: 1 }, label } = o;
  const [wide, deep, thick] = size, has = (id) => parts.includes(id), gap = o.gap ?? 0.21 * deep;
  // only one side face is seen, so the laptop is turned to show the side that has more ports
  const side = o.side ?? ((ports.right ?? 0) > (ports.left ?? 0) ? "right" : "left"), nPorts = ports[side] ?? 0;
  const lidT = has("lid") ? Math.max(0.3, 0.3 * thick) : 0, body = thick - lidT;
  const baseH = 0.18 * body, deckH = has("keys") ? 0.26 * body : 0, inside = body - baseH - deckH;
  const share = { battery: has("battery") ? 0.45 : 0, board: has("board") ? 0.25 : 0, fan: has("board") && fan ? 0.3 : 0 };
  const filled = share.battery + share.board + share.fan, hOf = (id) => (filled ? (inside * share[id]) / filled : 0);

  const keys = (g, b) => {
    const S = topOf(b), kb = within(S, 0.12 * deep, 0.07 * wide, 0.56 * deep, 0.93 * wide), rows = 5, cols = 14;
    let d = "";
    for (let i = 1; i < rows; i++) d += g.seg(kb, (i * kb.w) / rows, 0, (i * kb.w) / rows, kb.h);
    for (let j = 1; j < cols; j++) d += j > 4 && j < 10 ? g.seg(kb, 0, (j * kb.h) / cols, (kb.w * (rows - 1)) / rows, (j * kb.h) / cols) : g.seg(kb, 0, (j * kb.h) / cols, kb.w, (j * kb.h) / cols);
    return g.line(d, { tone: "faint" }) + g.line(g.rect(kb, 0, 0, kb.w, kb.h, 0.3), { tone: "lo" }) + g.line(g.rect(S, 0.64 * deep, 0.31 * wide, 0.93 * deep, 0.69 * wide, 0.5), { tone: "lo" });
  };
  const layers = [{ id: "base", h: baseH + (filled || deckH ? 0 : inside) }];
  if (has("battery")) layers.push({ id: "battery", h: hOf("battery"), tone: "mid", detail: "cells", detailOptions: { n: 3 } });
  if (has("board")) layers.push({ id: "board", h: hOf("board"), tone: "mid", detail: "chips" });
  if (has("keys")) layers.push({ id: "keys", h: deckH + (filled ? 0 : inside), skirt: true, draw: keys, gap: share.fan ? gap * 1.5 : gap });
  const L = layersOf({ w: deep, d: wide, layers, gap, r: 0.045 * deep, AZ: o.AZ ?? 36 });

  if (share.fan) {
    const board = L.byId.board, q = 0.24 * deep, f = slab("fan", "fan", [0.66 * deep, 0.12 * wide, q, q], board.z + board.h, hOf("fan"), { r: q * 0.12, tone: "mid" });
    f.draw = (g) => {
      const S = topOf(f), c = q / 2;
      const blades = range(9).map((i) => { const a = (i / 9) * Math.PI * 2; return g.poly(S, [[c + 0.16 * q * Math.cos(a), c + 0.16 * q * Math.sin(a)], [c + 0.4 * q * Math.cos(a + 0.5), c + 0.4 * q * Math.sin(a + 0.5)]]); }).join("");
      return g.line(blades, { tone: "faint" }) + g.line(g.circle(S, c, c, 0.42 * q) + g.circle(S, c, c, 0.14 * q, 14), { tone: "lo" });
    };
    L.solids.push(f);
    L.moves = Object.fromEntries(Object.entries(L.moves).flatMap(([id, m]) => (id === "board" ? [[id, m], ["fan", [0, 0, m[2] + gap * 0.5]]] : [[id, m]])));
    L.anchors.fan = [f.plan.x + q * 0.6, f.plan.y + q * 0.5, f.z + f.h];
    L.covers.fan = L.covers.board.slice();
    for (const id of ["base", "battery", "board"]) if (L.covers[id]) L.covers[id].push("fan");
  }
  if (nPorts) {
    const host = L.byId["keys.skirt"] ?? L.byId.keys ?? L.byId.base, S = { w: deep, h: host.h, at: (u, v) => [u, wide, host.z + v] };
    const ph = Math.min(0.26, host.h * 0.6), pw = 0.85, v = (host.h - ph) / 2, prior = host.draw;
    host.draw = (g) => (prior ? prior(g) : "") + g.line(range(nPorts).map((i) => g.rect(S, 0.09 * deep + i * 1.6, v, 0.09 * deep + i * 1.6 + pw, v + ph, ph * 0.45)).join(""), { tone: "mid" });
  }
  if (has("lid")) {
    const a = (clamp(lid, 60, 150) * Math.PI) / 180, dir = [Math.cos(a), Math.sin(a)], hx = 0.03 * deep + lidT / Math.sin(a), len = deep - 0.02 * deep;
    const on = (u, lift = 0) => [hx + dir[0] * u + dir[1] * lift, L.top + dir[1] * u - dir[0] * lift];
    const panel = { name: "lid", piece: "lid", pts: [on(0), on(len), [on(len)[0] - lidT / Math.sin(a), on(len)[1]], [hx - lidT / Math.sin(a), L.top]], y0: 0, y1: wide, tone: "hi" };
    const S = { w: wide, h: len, at: (u, v) => { const [x, z] = on(v); return [x, wide - u, z]; } }, m = 0.035 * wide;
    panel.draw = (g) => g.line(g.rect(S, m, m * 1.3, S.w - m, S.h - m, m * 0.5), { tone: "mid" }) + g.dots(S, [[S.w / 2, S.h - m * 0.5]], { size: 0.9, tone: "mid" });
    const under = layers[layers.length - 1].id;
    L.solids.push(panel);
    L.moves.lid = [0, 0, L.moves[under][2] + gap * 0.5];
    L.anchors.lid = S.at(S.w * 0.7, S.h * 0.55);
    L.covers.lid = [];
    for (const id of Object.keys(L.covers)) if (id !== "lid") L.covers[id].push("lid");
  }
  L.anchors.base = [deep, wide * 0.3, baseH / 2];
  if (L.anchors.keys) L.anchors.keys = [0.78 * deep, 0.4 * wide, L.byId.keys.z + L.byId.keys.h];
  return emit({ name, AZ: 36, EL: 27, ...viewOf(o), ...L, label: label ?? `An open laptop taken apart from the bottom up: ${list(Object.keys(L.moves))}.` });
}

/* 3. phone: a 6.1-inch handset, 7.2 wide × 14.7 long × 0.8 cm. Sizes in cm */
export function phone(o = {}) {
  const { name = "phone", size = [7.2, 14.7, 0.8], up = "back", camera = true, label } = o;
  const [wide, long, thick] = size, gap = o.gap ?? 0.24 * long, back = up !== "screen";
  const h = { glass: 0.1 * thick, display: 0.14 * thick, board: 0.2 * thick, battery: 0.38 * thick, back: 0.18 * thick };
  const face = (g, b) => {
    const S = topOf(b), m = 0.045 * wide;
    return g.line(g.rect(S, m, m, S.w - m, S.h - m, 0.11 * wide - m), { tone: "mid" }) + g.dots(S, [[m * 2.6, S.h / 2]], { size: 1.3, tone: "mid" });
  };
  const all = {
    glass: { id: "glass", h: h.glass, ...(back ? {} : { draw: face }) },
    display: { id: "display", h: h.display, tone: "mid", detail: "screen" },
    board: { id: "board", h: h.board, tone: "mid", detail: "chips" },
    battery: { id: "battery", h: h.battery, tone: "mid", detail: "cells", detailOptions: { n: 1 } },
    back: { id: "back", h: h.back },
  };
  const order = back ? ["glass", "display", "board", "battery", "back"] : ["back", "battery", "board", "display", "glass"];
  const layers = order.map((id, i) => ({ ...all[id], skirt: i === order.length - 1 }));
  const L = layersOf({ w: long, d: wide, layers, gap, r: 0.13 * wide, wall: 0.03 * wide, AZ: o.AZ ?? 44 });

  const band = L.byId[`${order[4]}.skirt`], end = { w: wide, h: band.h, at: (u, v) => [long, wide - u, band.z + v] }, flank = { w: long, h: band.h, at: (u, v) => [u, wide, band.z + v] };
  const slot = band.h * 0.34;
  band.draw = (g) => g.line(g.rect(end, wide * 0.43, (band.h - slot) / 2, wide * 0.57, (band.h + slot) / 2, slot * 0.45), { tone: "mid" })
    + g.dots(end, [0.28, 0.32, 0.36, 0.64, 0.68, 0.72].map((t) => [wide * t, band.h / 2]), { size: 0.7, tone: "mid" })
    + g.line(g.rect(flank, long * 0.2, band.h * 0.3, long * 0.3, band.h * 0.7) + g.rect(flank, long * 0.34, band.h * 0.3, long * 0.4, band.h * 0.7), { tone: "mid" });
  if (back && camera) {
    const q = 0.44 * wide, host = L.byId.back, bump = slab("camera", "camera", [0.05 * long, wide - 0.07 * wide - q, q, q], host.z + host.h, 0.16 * thick, { r: q * 0.24 });
    bump.draw = (g) => {
      const S = topOf(bump), lens = (u, v) => g.circle(S, u, v, 0.19 * q, 20) + g.circle(S, u, v, 0.1 * q, 14);
      return g.line(lens(0.28 * q, 0.7 * q) + lens(0.72 * q, 0.7 * q) + lens(0.28 * q, 0.28 * q), { tone: "mid" }) + g.dots(S, [[0.72 * q, 0.28 * q]], { size: 1.4, tone: "mid" });
    };
    L.solids.push(bump);
    L.moves.camera = [0, 0, L.moves.back[2] + gap * 0.45];
    L.anchors.camera = [bump.plan.x + q * 0.72, bump.plan.y + q * 0.3, bump.z + bump.h];
    L.covers.camera = [];
    for (const id of order) L.covers[id].push("camera");
  }
  return emit({ name, AZ: 44, EL: 27, ...viewOf(o), ...L, label: label ?? `A phone lying ${back ? "face down" : "face up"}, taken apart into ${list(Object.keys(L.moves))}.` });
}

/* 4. tower: a mid-tower desktop, 21 wide × 45 deep × 46 cm high. Sizes in cm. The front is the +y face, the open side +x */
export function tower(o = {}) {
  const { name = "tower", size = [21, 45, 46], parts = ["board", "gpu", "psu", "drives"], drives = 3, label } = o;
  const [w, d, h] = size, t = 0.018 * h, fb = 0.055 * d, has = (id) => parts.includes(id);
  const x0 = t, x1 = w - t, y0 = t, y1 = d - fb, slide = y1 + 0.05 * d;
  const solids = [], moves = { base: [0, 0, 0], panel: [0, -slide, 0] }, anchors = {}, covers = { base: [], panel: [] };
  const add = (b) => (solids.push(b), b);

  const bezel = add(slab("case.front", "base", [0, y1, w, fb], 0, h, { r: 0.02 * w, ground: true }));
  bezel.draw = (g) => {
    const S = sideY(bezel), m = 0.14 * w;
    return g.line(range(9).map((i) => g.seg(S, m, h * (0.1 + i * 0.03), w - m, h * (0.1 + i * 0.03))).join(""), { tone: "faint" })
      + g.line(g.rect(S, m, h * 0.52, w - m, h * 0.6) + g.rect(S, m, h * 0.63, w - m, h * 0.71) + g.circle(S, w / 2, h * 0.88, 0.07 * w, 16), { tone: "mid" });
  };
  add(slab("case.rear", "base", [0, 0, x1, t], 0, h, { ground: true }));
  add(slab("case.wall", "base", [0, y0, t, y1 - y0], 0, h, { ground: true }));
  add(slab("case.floor", "base", [x0, y0, x1 - x0, y1 - y0], 0, t, { ground: true }));
  add(slab("case.top", "base", [x0, y0, x1 - x0, y1 - y0], h - t, t));
  const panel = add(slab("panel", "panel", [x1, 0, t, y1], 0, h, { ground: true }));
  panel.draw = (g) => {
    const S = sideX(panel), m = 0.09 * S.w;
    return g.line(g.rect(S, m, m, S.w - m, S.h - m, m * 0.4), { tone: "lo" }) + g.line(g.rect(S, S.w - m * 0.7, S.h * 0.44, S.w - m * 0.3, S.h * 0.56), { tone: "mid" });
  };
  anchors.base = [w * 0.5, d, h * 0.3];
  anchors.panel = [w, y1 * 0.35, h * 0.55];

  // inner parts slide toward the open side and stop inside the case, so none of them crosses the panel on its way off
  const inner = (id, b, out) => { moves[id] = [out, 0, 0]; covers[id] = ["panel"]; anchors[id] ??= [b.plan.x + b.plan.w, b.plan.y + b.plan.d * 0.5, b.z + b.h * 0.6]; return add(b); };
  const by = y0 + 0.04 * d, bw = 0.03 * w, bh = 0.66 * h, bz = h - t - 0.03 * h - bh, bd = 0.58 * d;
  const far = has("board") ? x0 + bw : x0;
  if (has("board")) {
    const board = inner("board", slab("board", "board", [x0, by, bw, bd], bz, bh, { tone: "mid" }), 0.16 * w);
    if (has("gpu")) covers.board.push("gpu");
    board.draw = (g) => {
      const S = sideX(board);
      return g.line(range(4).map((i) => g.seg(S, S.w * (0.1 + i * 0.035), S.h * 0.5, S.w * (0.1 + i * 0.035), S.h * 0.9)).join("") + g.rect(S, S.w * 0.08, S.h * 0.06, S.w * 0.9, S.h * 0.12) + g.rect(S, S.w * 0.08, S.h * 0.16, S.w * 0.9, S.h * 0.2), { tone: "lo" });
    };
    const cq = 0.2 * d, cooler = add(slab("board.cooler", "board", [far, by + bd * 0.42, 0.24 * w, cq], bz + bh * 0.56, cq, { tone: "mid", r: 0 }));
    cooler.draw = (g) => { const S = sideX(cooler); return g.line(g.circle(S, S.w / 2, S.h / 2, S.w * 0.4) + g.circle(S, S.w / 2, S.h / 2, S.w * 0.13, 14), { tone: "lo" }); };
  }
  if (has("gpu")) {
    const card = inner("gpu", slab("gpu", "gpu", [far, by, 0.52 * w, 0.56 * d], bz + bh * 0.22, 0.09 * h), 0.28 * w);
    card.draw = (g) => { const S = sideX(card); return g.line(range(11).map((i) => g.seg(S, S.w * (0.08 + i * 0.03), S.h * 0.25, S.w * (0.08 + i * 0.03), S.h * 0.75)).join(""), { tone: "lo" }) + g.line(g.rect(S, S.w * 0.5, S.h * 0.25, S.w * 0.92, S.h * 0.75), { tone: "mid" }); };
  }
  if (has("psu")) {
    const psu = inner("psu", slab("psu", "psu", [x0, y0, 0.74 * w, 0.31 * d], t, 0.19 * h), 0.12 * w);
    psu.draw = (g) => { const T = topOf(psu), c = Math.min(T.w, T.h) / 2; return PATTERNS.vents(sideX(psu), g) + g.line(g.circle(T, T.w / 2, T.h / 2, c * 0.78) + g.circle(T, T.w / 2, T.h / 2, c * 0.2, 14), { tone: "lo" }); };
  }
  if (has("drives") && drives > 0) {
    const dh = 0.057 * h, dw = 0.7 * w, dd = 0.23 * d, dy = y1 - 0.06 * d - dd;
    range(drives).forEach((i) => {
      const bay = slab(`drives.${i}`, "drives", [x0, dy, dw, dd], t + i * dh, dh, { tone: "mid" });
      bay.draw = (g) => { const S = sideX(bay); return g.line(g.rect(S, S.w * 0.1, S.h * 0.28, S.w * 0.55, S.h * 0.72), { tone: "lo" }) + g.dots(S, [[S.w * 0.84, S.h * 0.5]], { size: 0.9, tone: "mid" }); };
      i === 0 ? inner("drives", bay, 0.14 * w) : add(bay);
    });
    anchors.drives = [x0 + dw, dy + dd * 0.5, t + drives * dh * 0.6];
  }
  return emit({ name, AZ: 34, EL: 24, ...viewOf(o), solids, moves, anchors, covers,
    label: label ?? `A desktop tower with its side panel slid off, showing ${list(Object.keys(moves).slice(2))} inside.` });
}

/* 5. rack: a 19-inch cabinet, 60 wide × 100 deep. Sizes in cm, unit heights in U (1 U = 4.45 cm). Units are listed from the top */
export function rack(o = {}) {
  const { name = "rack", size = [60, 100], units = 6, u = 5, slide, label } = o;
  const U = 4.45, [w, d] = size, t = 0.035 * w, rows = (Array.isArray(units) ? units : range(units).map(() => ({}))).map((row, i) => ({ id: `u${i + 1}`, u, detail: ["vents", "cells", "ports"][i % 3], ...row }));
  const tall = rows.reduce((sum, row) => sum + row.u * U, 0), h = tall + 2 * t, reach = slide ?? 0.55 * d;
  const solids = [], moves = { base: [0, 0, 0] }, anchors = { base: [d * 0.45, w, h * 0.5] }, covers = { base: [] };
  solids.push(slab("cabinet.floor", "base", [0, 0, d, w], 0, t, { ground: true }), slab("cabinet.far", "base", [0, 0, d, t], t, tall), slab("cabinet.rear", "base", [0, t, t, w - 2 * t], t, tall));
  const near = slab("cabinet.near", "base", [0, w - t, d, t], t, tall);
  near.draw = (g) => { const S = sideY(near), m = 0.06 * S.w; return g.line(g.rect(S, m, m, S.w - m, S.h - m), { tone: "faint" }) + PATTERNS.vents(within(S, m * 2, S.h * 0.08, S.w - m * 2, S.h * 0.2), g, { m: 0, tone: "faint" }); };
  solids.push(near, slab("cabinet.top", "base", [0, 0, d, w], t + tall, t));
  let z = t + tall;
  rows.forEach((row, i) => {
    const uh = row.u * U;
    z -= uh;
    const unit = slab(row.id, row.id, [t, t, d - t, w - 2 * t], z, uh, { tone: row.tone ?? "hi" });
    unit.draw = (g) => {
      const F = sideX(unit), e = 0.06 * F.w, panel = within(F, e * 1.6, uh * 0.16, F.w - e * 2.6, uh * 0.84);
      return pattern(row.detail)(panel, g, row.detailOptions) + g.line(g.rect(F, e * 0.4, uh * 0.25, e * 0.8, uh * 0.75) + g.rect(F, F.w - e * 0.8, uh * 0.25, F.w - e * 0.4, uh * 0.75), { tone: "mid" })
        + g.dots(F, [[F.w - e * 1.9, uh * 0.7], [F.w - e * 1.9, uh * 0.45]], { size: 1, tone: "mid" });
    };
    solids.push(unit);
    // lower units come out further, so each one shows its top when all of them are out
    moves[row.id] = [reach * (rows.length > 1 ? 0.6 + (0.4 * i) / (rows.length - 1) : 1), 0, 0];
    anchors[row.id] = [d, w * 0.4, z + uh * 0.5];
    covers[row.id] = [];
  });
  return emit({ name, AZ: 30, EL: 24, ...viewOf(o), solids, moves, anchors, covers, label: label ?? `A server cabinet with ${rows.length} units that slide out toward the viewer.` });
}

/* 6. building: a four-storey block, 20 × 12 m in plan, 3.2 m a floor. Sizes in m. Floors are listed from the ground up */
export function building(o = {}) {
  const { name = "building", size = [20, 12], floors = 4, floor = 3.2, label } = o;
  const [w, d] = size, m = 0.12 * Math.max(w, d), gap = o.gap ?? 0.75 * floor, G = 0.1 * floor;
  const rows = (Array.isArray(floors) ? floors : range(floors).map(() => ({}))).map((row, i) => ({ id: `f${i + 1}`, h: floor, ...row }));
  const rooms = (g, b) => {
    const S = topOf(b), e = 0.25, c = S.h * 0.42, n = Math.max(2, Math.round(S.w / 5));
    return g.line(g.seg(S, e, c, S.w - e, c) + g.seg(S, e, c + S.h * 0.16, S.w - e, c + S.h * 0.16)
      + range(n - 1).map((i) => g.seg(S, ((i + 1) * S.w) / n, e, ((i + 1) * S.w) / n, c) + g.seg(S, ((i + 1) * S.w) / n, c + S.h * 0.16, ((i + 1) * S.w) / n, S.h - e)).join(""), { tone: "faint" })
      + g.line(g.rect(S, e, e, S.w - e, S.h - e), { tone: "lo" });
  };
  const facade = (g, b, ground) => {
    const X = sideX(b), Y = sideY(b), bay = b.h * 1.05;
    if (!ground) return PATTERNS.windows(X, g, { bay }) + PATTERNS.windows(Y, g, { bay });
    const n = Math.max(1, Math.floor(Y.w / bay)), one = Y.w / n, at = Math.floor(n / 2);
    return PATTERNS.windows(X, g, { bay }) + g.line(range(n).filter((i) => i !== at).map((i) => g.rect(Y, (i + 0.24) * one, Y.h * 0.3, (i + 0.76) * one, Y.h * 0.78)).join("")
      + g.rect(Y, (at + 0.2) * one, 0, (at + 0.8) * one, Y.h * 0.74) + g.seg(Y, (at + 0.5) * one, 0, (at + 0.5) * one, Y.h * 0.74), { tone: "mid" });
  };
  const layers = [{ id: "base", h: G, tone: "lo", inset: -m }, ...rows.map((row, i) => ({ ...row, gap: row.gap ?? (i ? gap : gap * 0.6), draw: (g, b) => rooms(g, b) + (row.detail ? detailOf(b, row.detail, row.detailOptions)(g) : facade(g, b, i === 0)) })),
    { id: "roof", h: 0.12 * floor, inset: -0.02 * w, gap, tone: "hi", draw: (g, b) => g.line(g.rect(topOf(b), 0.5, 0.5, b.plan.w - 0.5, b.plan.d - 0.5), { tone: "faint" }) }];
  const L = layersOf({ w, d, layers, gap, r: 0 });
  L.byId.base.plan.r = 0.3 * m;
  const top = L.byId.roof, plant = (i, x, y, a, b2, hh) => { const unit = slab(`roof.plant${i}`, "roof", [x, y, a, b2], top.z + top.h, hh, { tone: "mid" }); unit.draw = (g) => PATTERNS.vents(sideX(unit), g) + PATTERNS.vents(sideY(unit), g); return unit; };
  L.solids.push(plant(0, w * 0.18, d * 0.3, w * 0.16, d * 0.3, floor * 0.36), plant(1, w * 0.56, d * 0.2, w * 0.12, d * 0.2, floor * 0.5));
  for (const row of rows) L.anchors[row.id] = [w, d * 0.35, L.byId[row.id].z + L.byId[row.id].h * 0.5];
  L.anchors.base = [w + m * 0.5, d * 0.3, G];
  return emit({ name, AZ: 38, EL: 25, ...viewOf(o), ...L, label: label ?? `A ${rows.length}-storey building taken apart floor by floor, with its roof lifted off.` });
}

/* 7. box: a plain product in its package, 24 × 16 × 9 cm. Sizes in cm. A tray, the product, and a lid that covers both */
export function box(o = {}) {
  const { name = "box", size = [24, 16, 9], product = true, detail = "screen", label } = o;
  const [w, d, h] = size, gap = o.gap ?? 0.9 * h, tray = 0.16 * h, cap = 0.05 * h;
  // the lid hangs down round the product, so it has to rise by the product's height before the two come apart
  const layers = [{ id: "base", h: tray, tone: "mid" }, ...(product ? [{ id: "product", h: h - tray - cap, inset: 0.1 * Math.min(w, d), r: 0.14 * Math.min(w, d), detail, gap: gap * 0.6 }] : []),
    { id: "lid", h: product ? cap : h - tray, skirt: product, gap: product ? h - tray - cap + gap * 0.6 : gap }];
  const L = layersOf({ w, d, layers, gap, r: 0.03 * Math.min(w, d), wall: 0.02 * Math.max(w, d), AZ: o.AZ ?? 40 });
  L.anchors.lid = [w, d * 0.3, h * 0.6];
  L.anchors.base = [w, d * 0.3, tray / 2];
  return emit({ name, AZ: 40, EL: 27, ...viewOf(o), ...L, label: label ?? `A box taken apart: ${list(Object.keys(L.moves))}.` });
}

/* 8. column: a vertical round body, 3.7 across × 40 high (a launcher, in m). Any unit. Segments are listed from the ground up */
export function column(o = {}) {
  const { name = "column", size = [3.7, 40], cap = "cone", base = "legs", label } = o;
  const [dia, high] = size, R = dia / 2, at = [0, 0], AZ = o.AZ ?? 40, gap = o.gap ?? 0.13 * high;
  const segments = o.segments ?? [{ id: "stage1", h: 23, detail: "bands" }, { id: "interstage", h: 2.5, r: R * 0.9, detail: "ribs", tone: "mid" }, { id: "stage2", h: 6.5, detail: "bands" }, { id: "nose", h: 8, r: R * 1.22 }];
  const scale = high / segments.reduce((sum, seg) => sum + seg.h, 0), pad = base === "pad" ? 0.08 * dia : 0;
  const solids = [], moves = {}, anchors = {}, covers = {}, ids = segments.map((seg) => seg.id), toward = ((AZ - 45) * Math.PI) / 180;
  if (pad) {
    solids.push(slab("pad", "base", [-1.5 * dia, -1.5 * dia, 3 * dia, 3 * dia], 0, pad, { r: 0.4 * dia, tone: "lo", ground: true }));
    moves.base = [0, 0, 0];
    anchors.base = [1.5 * dia, 0, pad];
    covers.base = ids.slice();
  }
  let z = pad, lift = 0;
  segments.forEach((seg, i) => {
    const h = seg.h * scale, [r0, r1] = Array.isArray(seg.r) ? seg.r : [seg.r ?? R, seg.r ?? R], last = i === segments.length - 1;
    const tip = !last || cap === "flat" ? 0 : cap === "dome" ? Math.min(0.7 * h, r1) : Math.min(0.7 * h, 2.4 * r1), z1 = z + h - tip;
    const outline = [[z, r0], [z1, r1], ...(cap === "dome" && tip ? range(8).map((j) => [z1 + tip * Math.sin(((j + 1) * Math.PI) / 16), Math.max(0.03 * r1, r1 * Math.cos(((j + 1) * Math.PI) / 16)), j < 7]) : tip ? [[z + h, 0.05 * r1]] : [])];
    const body = { name: seg.id, piece: seg.id, turn: at, outline, tone: seg.tone ?? "hi", ground: !pad && i === 0 };
    const z0 = z, even = (n) => range(n).map((j) => z0 + ((j + 1) * (z1 - z0)) / (n + 1)), straight = r0 === r1;
    body.draw = (g) => {
      const detail = seg.detail ?? "none", rings = straight && (detail === "bands" || detail === "grid") ? even(Math.max(1, Math.round((z1 - z0) / (2.2 * dia)))).map((zz) => g.arc(at, r0, zz)).join("") : "";
      const ribs = straight && (detail === "ribs" || detail === "grid") ? g.ribs(at, r0, z0, z1, 28) : "";
      if (!straight && detail !== "none" || !["none", "bands", "ribs", "grid"].includes(detail)) throw new Error(`column detail "${detail}" on "${seg.id}": use bands, ribs, grid or none, on a segment of one radius`);
      return g.line(rings, { tone: "lo" }) + g.line(ribs, { tone: "faint" }) + (tip ? g.line(g.arc(at, r1, z1), { tone: "faint" }) : g.line(g.ring(at, r1 * 0.84, z0 + h), { tone: "lo" }));
    };
    solids.push(body);
    lift += i || pad ? seg.gap ?? (i ? gap : gap * 0.5) : 0;
    moves[seg.id] = [0, 0, lift];
    anchors[seg.id] = [r0 * Math.cos(toward), r0 * Math.sin(toward), z0 + (h - tip) * 0.55];
    covers[seg.id] = ids.slice(i + 1);
    z += h;
  });
  if (base === "legs") {
    // four struts on the first segment: two as profiles across y, two turned to run along x
    const first = segments[0], r = Array.isArray(first.r) ? first.r[0] : first.r ?? R, t = 0.09 * dia, hi = 1.5 * dia, out = 0.95 * dia;
    [1, -1].forEach((side, j) => {
      const strut = [[side * r, hi], [side * r, hi * 0.42], [side * (r + out), 0], [side * (r + out * 0.82), 0]];
      solids.push({ name: `${first.id}.leg${j}`, piece: first.id, pts: strut, y0: -t / 2, y1: t / 2, tone: "mid" }, { name: `${first.id}.leg${j + 2}`, piece: first.id, pts: strut, y0: -t / 2, y1: t / 2, along: "x", tone: "mid" });
    });
  }
  return emit({ name, AZ: 40, EL: 20, ...viewOf(o), solids, moves, anchors, covers, label: label ?? `A tall round body in ${segments.length} sections that lift apart: ${list(ids)}.` });
}
