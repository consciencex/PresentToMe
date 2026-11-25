// The subject: a battery cabinet, 70 wide × 30 deep × 60 cm high, in four layers that lift apart.  node anatomy/scenes/battery.mjs --audit
// For another subject, call another preset from presets.mjs or rename the layers. PARTS in src/js/hooks.js names each layer by its id.
import { stack } from "./presets.mjs";
stack({
  name: "battery", size: [70, 30], gap: 22, W: 760, H: 820,
  layers: [
    { id: "base", h: 6, tone: "lo" },
    { id: "cells", h: 36, inset: 1.5, detail: "cells", detailOptions: { n: 4 }, tone: "mid" },
    { id: "board", h: 12, inset: 1.5, detail: "chips", tone: "mid" },
    { id: "cover", h: 6, detail: "screen" },
  ],
  label: "A home battery cabinet in four layers: a base, the cells, a control board and a cover.",
});
