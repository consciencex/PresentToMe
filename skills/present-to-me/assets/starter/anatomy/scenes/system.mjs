// Anatomy figure: the same site from the yard end, taken apart into the four parts the slide explains.
// panels (the roof array), inverter (cabinets on the end wall), battery (a container in the yard), meter (the grid connection
// at the far edge of the site, its line leaving toward the grid). Every part lifts; the building and the ground stay.
// 1 unit = 1 m. x = along the building (the yard is at +x), y = across it (the dock face is at +y), z = up.
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../kit/iso-kit.mjs";
import { scene } from "./scene.mjs";
const L = 34, D = 24, HT = 8, G = 0.4, X = L + 17;   // building length, depth, height; slab; far edge of the yard
const s = scene({ dir: dirname(fileURLToPath(import.meta.url)), file: "system.data.json", prefix: "sy", W: 1080, H: 720, AZ: 40, EL: 26, pad: 14,
  bounds: { plan: { x: -2, y: -2, w: X + 6, d: D + 8 }, z0: 0, z1: G + HT + 9.5 },
  moves: { base: [0, 0, 0], panels: [0, 0, 8], inverter: [0, 0, 4], battery: [0, 0, 4], meter: [0, 0, 4] },
  label: "The warehouse from its yard end, taken apart: the panel array lifted off the roof, the inverter cabinets on the end wall, a battery container in the yard, and the grid connection at the far edge of the site with its line leaving toward the grid." });
const { at, box, profile, rectX, rectY, line, halo, finish } = s;
const path = (pts, closed = false) => k.pathOf(pts.map(at), closed);

// ---------- base: the building and its dock face (the ground is added last, once the cable run is known) ----------
const dy = D + 0.01, ex = L + 0.01;
let face = line(path([[0.6, dy, G + HT - 0.7], [L - 0.6, dy, G + HT - 0.7]]), { tone: "faint" });
for (const x of [5, 13, 21]) {
  face += line(rectY(dy, x, x + 4, G + 1.2, G + 5.2), { tone: "mid" });
  face += line(Array.from({ length: 6 }, (_, i) => path([[x + 0.2, dy, G + 1.8 + i * 0.55], [x + 3.8, dy, G + 1.8 + i * 0.55]])).join(""), { tone: "faint" });
}
face += line(rectY(dy, 28, 30.2, G, G + 2.6), { tone: "mid" });
const end = line(path([[ex, 0.6, G + HT - 0.7], [ex, D - 0.6, G + HT - 0.7]]), { tone: "faint" });
box("shed", { x: 0, y: 0, w: L, d: D, r: 0.2 }, G, HT, { tone: "hi" }, { extra: face + end });
box("dock", { x: 4, y: D, w: 22, d: 1.5, r: 0.1 }, G, 1, { tone: "mid" });

// ---------- panels: rows across the roof, racked toward the yard, module seams on each top ----------
const z0 = G + HT, ROW = 2.3, RISE = 0.65;
Array.from({ length: 10 }, (_, i) => 1.4 + i * 3.15).forEach((x0, i) => {
  const lo = [x0 + ROW, z0 + 0.3], hi = [x0, z0 + 0.3 + RISE], on = (t, y) => [lo[0] + (hi[0] - lo[0]) * t, y, lo[1] + (hi[1] - lo[1]) * t + 0.02];
  const y0 = 1.4, y1 = D - 1.4;
  let seams = path([on(0.5, y0), on(0.5, y1)]);
  for (let y = y0 + 1.9; y < y1; y += 1.9) seams += path([on(0, y), on(1, y)]);
  profile(`panels.${i}`, [[x0, z0], [x0 + ROW, z0], lo, hi], y0, y1, { tone: "hi" }, { piece: "panels", extra: line(seams, { tone: "lo" }) });
});

// ---------- inverter: three cabinets on a plinth against the end wall, louvres and a display on each ----------
const iy = 2;
box("inverter.plinth", { x: L, y: iy, w: 1.6, d: 8.4, r: 0.1 }, G, 0.3, { tone: "lo" }, { piece: "inverter" });
[0.3, 3.1, 5.9].forEach((dy0, i) => {
  const y = iy + dy0, fx = L + 1.4 + 0.01;
  const louvres = Array.from({ length: 6 }, (_, j) => path([[fx, y + 0.4, G + 0.8 + j * 0.22], [fx, y + 2, G + 0.8 + j * 0.22]])).join("");
  box(`inverter.${i}`, { x: L + 0.1, y, w: 1.3, d: 2.4, r: 0.1 }, G + 0.3, 2.2, { tone: "hi" },
    { piece: "inverter", extra: line(louvres, { tone: "lo" }) + line(rectX(fx, y + 0.6, y + 1.8, G + 2.1, G + 2.3), { tone: "mid" }) });
});

// ---------- battery: a container-sized block on its own pad, ribbed side, doors at the end, a cooling unit ----------
const bx = L + 6, by = 15, BW = 2.5, BL = 12, BH = 2.6;
box("battery.pad", { x: bx - 0.5, y: by - 0.5, w: BW + 1, d: BL + 1, r: 0.1 }, G, 0.25, { tone: "lo" }, { piece: "battery" });
const bz = G + 0.25, rx = bx + BW + 0.01, ry = by + BL + 0.01;
const ribs = Array.from({ length: 23 }, (_, j) => path([[rx, by + 0.5 + j * 0.5, bz + 0.2], [rx, by + 0.5 + j * 0.5, bz + BH - 0.2]])).join("");
const doors = path([[bx + BW / 2, ry, bz + 0.2], [bx + BW / 2, ry, bz + BH - 0.2]]) + rectY(ry, bx + 0.2, bx + BW - 0.2, bz + 0.2, bz + BH - 0.2)
  + [0.7, 1.8].map((x) => path([[bx + x, ry, bz + 0.5], [bx + x, ry, bz + BH - 0.5]])).join("");
box("battery.box", { x: bx, y: by, w: BW, d: BL, r: 0.08 }, bz, BH, { tone: "hi" }, { piece: "battery", extra: line(ribs, { tone: "faint" }) + line(doors, { tone: "mid" }) });
box("battery.hvac", { x: rx, y: by + 3, w: 0.5, d: 1.6, r: 0.05 }, bz + 0.9, 1.1, { tone: "mid" }, { piece: "battery" });

// ---------- meter: a pad-mount transformer and a meter cabinet at the site edge, a pole carrying the line out to the grid ----------
const mx = X - 8, my = 1.5, mz = G + 0.25;
box("meter.pad", { x: mx - 0.4, y: my - 0.4, w: 5.3, d: 6.6, r: 0.1 }, G, 0.25, { tone: "lo" }, { piece: "meter" });
const fins = Array.from({ length: 7 }, (_, j) => path([[mx + 2.6 + 0.01, my + 0.4 + j * 0.3, mz + 0.3], [mx + 2.6 + 0.01, my + 0.4 + j * 0.3, mz + 1.7]])).join("");
box("meter.transformer", { x: mx, y: my, w: 2.6, d: 2.5, r: 0.1 }, mz, 2, { tone: "hi" }, { piece: "meter", extra: line(fins, { tone: "lo" }) });
box("meter.cabinet", { x: mx + 0.6, y: my + 3.3, w: 1.6, d: 1.4, r: 0.08 }, mz, 1.8, { tone: "hi" },
  { piece: "meter", extra: line(rectX(mx + 2.21, my + 3.5, my + 4.5, mz + 1, mz + 1.5), { tone: "mid" }) });
const px = mx + 4.2, py = my + 2.6, PH = 8;
box("meter.pole", { x: px - 0.15, y: py - 0.15, w: 0.3, d: 0.3, r: 0.05 }, mz, PH, { tone: "mid" }, { piece: "meter" });
box("meter.arm", { x: px - 0.12, y: py - 1.2, w: 0.24, d: 2.4, r: 0.04 }, mz + PH, 0.2, { tone: "mid" }, { piece: "meter" });
// the wires carry no volume, so they sit outside the audited items, in their own group that rides with the meter piece
const wires = `<g data-piece="meter">${line([-1, 1].map((d) => path([[px, py + d, mz + PH + 0.2], [px + 8, py + d * 1.5, mz + PH - 0.9]])).join(""), { tone: "mid" })}</g>`;

// the ground, with the buried cable run from the inverters to the grid connection marked on it; a line on a surface
// belongs to that surface's item, or the surface (drawn later) covers it
const run = line(path([[L + 1.6, iy + 8.6, G + 0.02], [mx + 1.3, iy + 8.6, G + 0.02], [mx + 1.3, my + 6.4, G + 0.02]]), { tone: "mid", dashed: true });
box("ground", { x: -2, y: -2, w: X + 2, d: D + 8, r: 0.6 }, 0, G, { tone: "lo" }, { ground: true, extra: run });
finish([halo({ x: -2.5, y: -2.5, w: X + 3, d: D + 9, r: 1 }, 0)], {
  front: [wires],
  anchors: {
    panels: [L * 0.62, D * 0.45, z0 + 1], inverter: [L + 1.4, iy + 4.2, G + 2.5], battery: [bx + BW / 2, by + BL * 0.45, bz + BH],
    meter: [mx + 1.3, my + 1.2, mz + 2], grid: [px + 8, py, mz + PH - 0.9],
  },
});
