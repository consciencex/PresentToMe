// The place the subject goes: a two-storey house, 9 × 7 m, 2.8 m a floor.  node anatomy/scenes/house.mjs --audit
// For another subject, draw the place it belongs to with another preset, such as a rack for a server or a box for a product.
// PLACE in src/js/hooks.js names the floors by their ids and stands the subject on "base".
import { building } from "./presets.mjs";
building({
  name: "house", size: [9, 7], floor: 2.8, W: 900, H: 700,
  floors: [{ id: "living" }, { id: "bedrooms" }],
  label: "A two-storey house: the living floor, the bedroom floor and the roof.",
});
