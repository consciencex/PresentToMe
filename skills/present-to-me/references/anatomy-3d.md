# Isometric 3D figures

A thin-line isometric drawing of the real thing (the machine, the building, the system) does what an icon cannot: the audience sees what is being bought or built, and the slide can light one part at a time. Use a figure when the subject is physical or has parts that sit inside each other. Do not use one for an abstract idea, where a chart or a diagram is clearer.

Two tools ship with the starter.

| Tool | For | How it works |
|---|---|---|
| Anatomy scenes (`anatomy/`) | Detailed line-art figures with named pieces that light up and move apart | A Node script draws the figure once and writes an SVG. The slide places it |
| `Iso` (`src/js/iso.js`) | Simple stacks and blocks that rotate by drag, lift, and take clicks | Boxes drawn live in the browser |

The scene tools are a vendored subset of the [Anatomy kit](https://github.com/wheresryan22/anatomy) by Ryan (MIT, `anatomy/KIT-LICENSE`). Anatomy is a full agent skill for detailed illustration, with curved bodies, turned parts and a stricter audit. When a figure needs more than boxes and extruded profiles, install that skill and use it.

## From scene file to slide

```
anatomy/scenes/hero.mjs  ──node──▶  anatomy/scenes/hero.data.json  ──build──▶  SCN.hero  ──hook──▶  placeScene(box, SCN.hero)
```

1. Write `anatomy/scenes/<name>.mjs`.
2. Run it: `node anatomy/scenes/<name>.mjs --audit`. It writes `<name>.data.json`.
3. Preview it: `node anatomy/scenes/preview.mjs <name> 0 shots/<name>-0.png`, and again with `1` for the exploded view. Look at both images.
4. `npm run build`. Every `.data.json` in the folder is available as `SCN.<name>`. Nothing needs registering.
5. Place it in a hook.

`npm run scenes` regenerates every scene. Commit the `.data.json` files.

## Writing a scene

`anatomy/scenes/hero.mjs` and `system.mjs` in the example are complete scenes. The shape of one:

```js
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../kit/iso-kit.mjs";
import { scene } from "./scene.mjs";

const D = 26, L = 50, HT = 9, G = 0.4;                 // real dimensions. 1 unit = 1 m
const s = scene({
  dir: dirname(fileURLToPath(import.meta.url)), file: "hero.data.json", prefix: "hr",
  W: 760, H: 600,                                      // the figure's pixel size
  AZ: 28, EL: 27,                                      // the camera: azimuth and elevation in degrees
  bounds: { plan: { x: -3, y: -3, w: D + 15, d: L + 6 }, z0: 0, z1: G + HT + 7 },   // everything, including the highest lift
  moves: { base: [0, 0, 0], panels: [0, 0, 6] },       // one world vector per piece: how far it travels when exploded
  label: "A warehouse with loading docks and rows of solar panels on the roof.",      // becomes the aria-label
});
const { at, box, profile, rectX, rectY, line, dots, halo, finish } = s;

box("ground", { x: -3, y: -3, w: D + 15, d: L + 6, r: 0.6 }, 0, G, { tone: "lo" }, { ground: true });
box("shed", { x: 0, y: 0, w: D, d: L, r: 0.2 }, G, HT, { tone: "hi" }, { extra: doorsAndLines });
profile("panels.0", [[x0, z0], [x0 + 2.4, z0], lo, hi], 1.5, L - 1.5, { tone: "hi" }, { piece: "panels" });
finish([halo({ x: -3.5, y: -3.5, w: D + 16, d: L + 7, r: 1 }, 0)], { anchors: { panels: [13, 25, z0 + 1] } });
```

| Helper | Draws |
|---|---|
| `box(name, { x, y, w, d, r }, z, height, style, { piece, extra, ground, bias, steps })` | A block with rounded corners, standing on height `z` |
| `profile(name, [[x, z], …], y0, y1, style, { piece, extra })` | A side profile extruded along y: a tilted panel row, a sloped roof, a ramp |
| `rectX(x, y0, y1, z0, z1)`, `rectY(y, x0, x1, z0, z1)` | A flat rectangle on a face, as a path: doors, grilles, vents |
| `line(path, { tone, dashed, dotted })` | A stroked path |
| `dots(points, { size, tone })` | Dots: perforations, foam, lights |
| `halo(plan, z)` | A soft shadow under the figure |
| `at([x, y, z])` | A world point in figure pixels, for building your own paths with `k.pathOf` |
| `finish(back, { anchors, front, audit })` | Sorts the items, writes the file. `anchors` exports named points for leader lines |

Tones are `hi`, `mid`, `lo`, `faint`: darker to lighter line colour. Use `hi` for the outline of what matters and `faint` for surface detail.

A piece is a group that moves and lights together. Every item names its `piece` (default `base`). Its move comes from `moves`.

## Rules of the camera and the draw order

These come from scenes that failed first.

1. **Choose the camera from where the labels will be.** With azimuth between 0 and 90 the camera sees the +x and +y faces. +x runs right and down on screen, +y runs left and down. A smaller azimuth turns the +x face toward the viewer. If the cards sit on the right of the slide, put the parts they name toward +x, so leader lines do not cross the drawing.
2. **Detail goes only on the two visible faces**, at `x = max + 0.01` or `y = max + 0.01`. Work done on a hidden face is lost.
3. **Preview at several azimuths before settling.** The first camera often shows the back of the object.
4. **A line on a surface belongs in that item's `extra`.** A line added to `back` disappears under the item that is drawn over it.
5. **A line with no volume that stands off a surface** (an overhead wire) goes in `front`, wrapped in `<g data-piece="…">` so it moves with its piece.
6. **Solids must not pass through each other.** Two crossing solids cannot be sorted, and the audit reports a cycle. Seat one on the other: the cross-arm on top of the pole, not through it.
7. **Every solid rests on something.** A part floating beside its base is reported as loose. Widen the base under it.
8. **Vertical moves are the safe default.** A sideways move needs an empty lane, and the audit checks for collisions in mid-flight.
9. **`bounds.z1` includes the largest lift**, or an exploded part leaves the figure. That headroom is empty space above the assembled figure. Place the figure with a negative top margin, or accept the space.
10. **Tilted parts are profiles.** Plans only extrude upward. A wedge with its base on the roof and a sloped top reads as a racked panel and passes the support check. Draw seams on the slope, lifted by 0.02.
11. **Run with `--audit`, then look.** The audit checks overlap, support and order. It does not see a hidden line or a wire that crosses a face. Only the preview image shows those.
12. **Use real dimensions.** One unit is one metre or one centimetre, stated in the first comment. Proportions then come out right without tuning.

## Placing and animating a figure

```js
(function () {
  let fig = null, run = null;
  H.title = {
    enter() {
      if (!fig) fig = placeScene($('#titleFig'), SCN.hero);                 // once
      const solids = fig.querySelectorAll('[data-piece="panels"] .iso-solid');
      solids.forEach(e => e.removeAttribute('data-lit'));
      explodeScene(fig, SCN.hero, 1);                                        // every piece at the end of its move
      run = tween(1.3, u => explodeScene(fig, SCN.hero, 1 - easeOut(u)),     // settle together
        () => solids.forEach(e => e.setAttribute('data-lit', '')));          // then light the roof
    },
    leave() { run && run.stop(); }
  };
})();
```

- `placeScene(box, scn, { lit })` adds the figure to an element and returns its wrapper. Size the wrapper's SVG with CSS (`width: 100%; height: auto`).
- `explodeScene(el, scn, u)` moves every piece by `u` times its move.
- To move one piece, set `transform="translate(sx·u sy·u)"` on its groups, with `[sx, sy] = scn.data.shifts[piece]`.
- `data-lit` on an `.iso-solid` paints it in the accent colour. Light only the part the slide is about.
- `scn.data.ANCHORS[name]` is a point in figure pixels. Multiply by `box.offsetWidth / scn.data.W` to get stage pixels, and add the piece's shift when it is lifted. Measure with `offsetLeft` and `offsetTop`, which ignore the stage scale.

### Tones

The figure's colours are CSS variables on `.iso[data-theme="light"]` in `styles/style.css`: line tones from the deck's ink, lit faces mixed from `--m1`. Change them there, once.

To light one piece in another meaning colour, override the lit variables on that piece. The example lights the grid connection in blue, because blue means the grid:

```css
#anatomy [data-piece="meter"] { --anatomy-face: color-mix(in srgb, var(--m2) 34%, white); --anatomy-lit: var(--m2-ink); }
```

To fade the parts not being discussed, lighten their line variables. Do not lower opacity, which lets hidden edges show through the fills.

### Patterns that use a figure

- **A part per press.** Light one piece, lift it slightly, show its card, draw a leader. Pattern 19, `H.anatomy` in the example.
- **A figure as a gauge.** Place the scene twice, the second copy lit and clipped from the bottom with `clip-path: inset(…)` to the share being shown.
- **Assembly on entering.** Explode from 1 to 0 over 1.2 to 1.8 seconds.
- **A hero.** The figure with the key part lit, on the title slide.

A figure appears on one slide only. For a second slide about the same object, write a second scene from a different angle or scale. Swapping the axes and changing the azimuth is enough to make it read as a new drawing.

## The small live renderer

`Iso` in `src/js/iso.js` draws boxes in the browser, for stacks and block diagrams that respond to the presenter.

```js
const iso = new Iso(svg, { ox: 500, oy: 520, s: 3.2 });
const plates = LAYERS.map((l, i) => iso.add({ x: 0, y: 0, z: i * 14, w: 120, d: 120, h: 9, color: C.m1, tip: l.name, onClick: () => focus(i) }));
iso.render();
plates[2].dz = 18; iso.render();          // lift one plate
iso.enableDrag(-0.9, 0.9);                // let the presenter turn it
```

Each box has `x, y, z, w, d, h, color`, optional offsets `dx, dy, dz`, opacity `op`, a tooltip and a click handler. Call `render()` after any change. Use it for pattern 18, the layer stack.
