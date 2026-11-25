// Shared helper for anatomy scenes: every solid is recorded for the overlap audit, each piece can have one move,
// and the figure is written to <name>.data.json (the build exposes it as SCN.<name>). Run a scene with --audit to check it.
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import * as k from "../kit/iso-kit.mjs";
import * as G from "../kit/lathe.mjs";
import * as A from "../kit/audit.mjs";

// states: the poses the draw order must hold in, as shares 0..1 of the whole explode or { label, shares: { piece: share } }.
// Left out, it is every frame of the kit's spring explode, which is thorough and slow once many pieces move.
export function scene({ dir, file, prefix, W, H, AZ = 52, EL = 26, bounds, moves, label, pad = 18, states }) {
  // bounds: { plan, z0, z1 } for a box around everything, or { points: [[x, y, z], …] } for a tighter fit
  const P = k.fitProjection(bounds.points ?? k.boxCorners(bounds.plan, bounds.z0, bounds.z1), W, H, { pad, azimuth: AZ, elevation: EL });
  const V = G.viewOf(P);
  const at = (p) => k.iso(p, P);
  const R = A.recorder(P, { order: Object.keys(moves), spring: { stagger: 0.06, stiffness: 64, damping: 14.2, substeps: 4 } });
  const S = (paths, style) => k.solidSvg(paths, style);
  function box(name, plan, z, h, style = {}, { piece = "base", bias = 0, extra = "", ground = false, steps = 2 } = {}) {
    plan = { r: 0.1, ...plan };
    const shape = R.solid(A.slab(plan, z, h, { name, ...(ground ? { ground: true } : {}) }, steps));
    R.put({ name, at: [plan.x + plan.w / 2, plan.y + plan.d / 2, z + h / 2], bias, svg: S(k.slabOf(plan, z, h, P, steps), { tone: "mid", ...style }) + extra, shapes: [shape], piece, move: moves[piece] ?? [0, 0, 0] });
  }
  // a side profile of [x, z] points extruded along y from y0 to y1: tilted panels, sloped roofs, ramps.
  // along: "x" turns it a quarter: [y, z] points extruded along x from y0 to y1
  const ACROSS = G.frameOf([0, 0, 0], [0, 1, 0], [0, 0, 1], [1, 0, 0]), ALONG = G.frameOf([0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
  function profile(name, pts, y0, y1, style = {}, { piece = "base", bias = 0, extra = "", along = "y" } = {}) {
    const turn = along === "x", F = turn ? ALONG : ACROSS, poly = turn ? pts : pts.map(([x, z]) => [z, x]);
    const shape = R.solid(A.prism(F, poly, y0, y1, { name }));
    const cx = pts.reduce((t, p) => t + p[0], 0) / pts.length, cz = pts.reduce((t, p) => t + p[1], 0) / pts.length;
    R.put({ name, at: turn ? [(y0 + y1) / 2, cx, cz] : [cx, (y0 + y1) / 2, cz], bias, svg: S(G.prismOf(F, poly, y0, y1, P), { tone: "mid", ...style }) + extra, shapes: [shape], piece, move: moves[piece] ?? [0, 0, 0] });
  }
  // a round body on a vertical axis through [x, y]: outline is [[z, radius], …] from the bottom up.
  // Two points make a cylinder or a taper, and a last radius near 0 a cone. A third value of true on a point rounds the outline through it
  function turned(name, [x, y], outline, style = {}, { piece = "base", bias = 0, extra = "", ground = false } = {}) {
    const F = G.frameOf([x, y, 0], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
    const shape = R.solid(A.solid(F, outline, { name, ...(ground ? { ground: true } : {}) }));
    R.put({ name, at: [x, y, (outline[0][0] + outline[outline.length - 1][0]) / 2], bias, svg: S(G.solidOf(outline, F, P), { tone: "mid", ...style }) + extra, shapes: [shape], piece, move: moves[piece] ?? [0, 0, 0] });
  }
  // any plan outline of [x, y] points extruded upward: an L-shaped wall, a band that follows a rounded edge
  function prism(name, ring, z, h, style = {}, { piece = "base", bias = 0, extra = "", ground = false } = {}) {
    const shape = R.solid(A.extruded(ring, z, h, { name, ...(ground ? { ground: true } : {}) }));
    const cx = ring.reduce((t, p) => t + p[0], 0) / ring.length, cy = ring.reduce((t, p) => t + p[1], 0) / ring.length;
    R.put({ name, at: [cx, cy, z + h / 2], bias, svg: S(k.extrude(ring, z, h, P, { convex: false }), { tone: "mid", ...style }) + extra, shapes: [shape], piece, move: moves[piece] ?? [0, 0, 0] });
  }
  // flat rectangles on a face, for grilles, doors and labels
  const rectX = (x, y0, y1, z0, z1) => k.pathOf([at([x, y0, z0]), at([x, y1, z0]), at([x, y1, z1]), at([x, y0, z1])], true);
  const rectY = (y, x0, x1, z0, z1) => k.pathOf([at([x0, y, z0]), at([x1, y, z0]), at([x1, y, z1]), at([x0, y, z1])], true);
  const line = (d, style) => k.lineSvg(d, style);
  const dots = (pts, style) => k.dotsSvg(pts.map(at), style);
  const halo = (plan, z) => `<path class="iso-halo" d="${k.haloOf(plan, z, 0.4, P)}"/>`;
  // anchors: { name: [x, y, z] } in world units, written as figure pixels so a slide can point leader lines at parts
  // covers: { piece: [pieces that hide it while assembled] }, so a slide can move them away when it shows that piece
  function finish(back = [], { anchors = {}, covers = {}, front = [], audit = {} } = {}) {
    A.settle(R, P, states ? { states } : {});
    R.items.sort((a, b) => a.key - b.key);
    const f2 = (v) => Math.round(v * 100) / 100;
    const ITEMS = R.items.map((it) => ({ p: it.piece, n: it.name, k: f2(it.key), m: moves[it.piece] ? 1 : 0 }));
    const groups = R.items.map((it, i) => `<g class="it" data-i="${i}" data-piece="${it.piece}">${it.svg}</g>`).join("");
    const svg = k.figureSvg({ width: W, height: H, label, body: [...back, `<g class="${prefix}-items">${groups}</g>`, ...front] });
    const shifts = Object.fromEntries(Object.entries(moves).map(([id, m]) => [id, [f2(k.axisVector(P, m)[0]), f2(k.axisVector(P, m)[1]), f2(G.dot3(m, V))]]));
    const ANCHORS = Object.fromEntries(Object.entries(anchors).map(([n, p]) => [n, at(p).map(f2)]));
    const COVERS = Object.keys(covers).length ? { COVERS: covers } : {};
    writeFileSync(join(dir, file), JSON.stringify({ svg, css: "", data: { ITEMS, shifts, ANCHORS, ...COVERS, W, H } }));
    console.log(`wrote ${file}`, (svg.length / 1024).toFixed(0), "KB,", R.items.length, "items");
    A.auditOrExit(R, P, audit);
  }
  return { P, at, box, profile, prism, turned, rectX, rectY, line, dots, halo, finish };
}
