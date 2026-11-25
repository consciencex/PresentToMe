// Title figure: the warehouse with a solar array over its roof. The array is one piece and lifts off.
// 1 unit = 1 m. x = depth (the dock face is at +x), y = along the building, z = up.
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../kit/iso-kit.mjs";
import { scene } from "./scene.mjs";
const D = 26, L = 50, HT = 9, G = 0.4;       // building depth, length, wall height; ground slab thickness
const s = scene({ dir: dirname(fileURLToPath(import.meta.url)), file: "hero.data.json", prefix: "hr", W: 760, H: 600, AZ: 28, EL: 27,
  bounds: { plan: { x: -3, y: -3, w: D + 15, d: L + 6 }, z0: 0, z1: G + HT + 7 }, moves: { base: [0, 0, 0], panels: [0, 0, 6] },
  label: "A cold-storage warehouse with loading docks on its front and rows of solar panels covering the roof." });
const { at, box, profile, rectX, line, halo, finish } = s;
const path = (pts, closed = false) => k.pathOf(pts.map(at), closed);

box("ground", { x: -3, y: -3, w: D + 15, d: L + 6, r: 0.6 }, 0, G, { tone: "lo" }, { ground: true,
  extra: line(Array.from({ length: 5 }, (_, i) => path([[D + 1, 6 + i * 9, G + 0.01], [D + 11, 6 + i * 9, G + 0.01]])).join(""), { tone: "faint" }) });

// the dock face: four roller doors, each with its bumper pads, and a canopy over them
const fx = D + 0.01, doors = [8, 17, 26, 35];
let face = "";
for (const y of doors) {
  face += line(rectX(fx, y, y + 4, G + 1.2, G + 5.4), { tone: "mid" });
  face += line(Array.from({ length: 7 }, (_, i) => path([[fx, y + 0.2, G + 1.8 + i * 0.52], [fx, y + 3.8, G + 1.8 + i * 0.52]])).join(""), { tone: "faint" });
  face += line(rectX(fx, y - 0.6, y - 0.2, G + 1, G + 1.8) + rectX(fx, y + 4.2, y + 4.6, G + 1, G + 1.8), { tone: "lo" });
}
face += line(rectX(fx, 43, 45, G, G + 2.6), { tone: "mid" });                                   // a people door
face += line(path([[fx, 0.6, G + HT - 0.8], [fx, L - 0.6, G + HT - 0.8]]), { tone: "faint" });  // the parapet line
const side = line(path([[0.6, L + 0.01, G + HT - 0.8], [D - 0.6, L + 0.01, G + HT - 0.8]]), { tone: "faint" });
box("shed", { x: 0, y: 0, w: D, d: L, r: 0.2 }, G, HT, { tone: "hi" }, { extra: face + side });
box("dock", { x: D, y: 6, w: 1.6, d: 34, r: 0.1 }, G, 1, { tone: "mid" });
box("canopy", { x: D, y: 6.5, w: 2.6, d: 33, r: 0.1 }, G + 6.2, 0.3, { tone: "mid" });

// the array: rows along the building, each a racked wedge whose top faces the dock side; module seams drawn on the top
const z0 = G + HT, ROW = 2.4, RISE = 0.7, rows = [1.5, 4.6, 7.7, 10.8, 13.9, 17, 20.1];
rows.forEach((x0, i) => {
  const lo = [x0 + ROW, z0 + 0.3], hi = [x0, z0 + 0.3 + RISE], on = (t, y) => [lo[0] + (hi[0] - lo[0]) * t, y, lo[1] + (hi[1] - lo[1]) * t + 0.02];
  const y0 = 1.5, y1 = L - 1.5;
  let seams = path([on(0.5, y0), on(0.5, y1)]);
  for (let y = y0 + 2; y < y1; y += 2) seams += path([on(0, y), on(1, y)]);
  profile(`panels.${i}`, [[x0, z0], [x0 + ROW, z0], lo, hi], y0, y1, { tone: "hi" }, { piece: "panels", extra: line(seams, { tone: "lo" }) });
});
finish([halo({ x: -3.5, y: -3.5, w: D + 16, d: L + 7, r: 1 }, 0)]);
