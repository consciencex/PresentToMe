// Open every slide at every press in a real browser.  npm run check  [-- --shots]  [-- --only 3,7]
// Needs Playwright once:  npm i -D playwright && npx playwright install chromium
// Fails on: a script error, a missing file, text or boxes that leave the 1920 × 1080 stage, a box that cuts off its content,
// a phone layout that scrolls sideways, placeholder text (TODO), a slide that still carries the title of the example the deck
// was started from (--as-example skips that one), and a deck that misses the bar of the design kit
// (the rules are in KIT_RULES below). A rule the deck has a reason to miss is switched off in deck.config.json:
//   "kit": { "allow": { "figure": "the subject is a policy, nothing physical" } }
// With --shots it saves one PNG per slide at its last press into shots/. Look at them: a passing check does not mean a good slide.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { build, ROOT } from "./build.mjs";
import { fileFor, loadChromium, outDir } from "./pw.mjs";

const chromium = await loadChromium();
const args = process.argv.slice(2);
const SHOTS = args.includes("--shots");
const only = args.includes("--only") ? args[args.indexOf("--only") + 1].split(",").map(Number) : null;
// new-deck.mjs records the titles of the example slides a deck starts with
const started = !args.includes("--as-example") && fs.existsSync(path.join(ROOT, ".recipe.json")) ? JSON.parse(fs.readFileSync(path.join(ROOT, ".recipe.json"), "utf8")).titles || {} : {};
const DIST = outDir(ROOT);
if (!build({ quiet: true, out: DIST }).ok) { console.error("the build has errors; fix them first"); process.exit(1); }

const TYPES = { ".html": "text/html", ".css": "text/css", ".woff2": "font/woff2", ".mp3": "audio/mpeg", ".mp4": "video/mp4", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".webp": "image/webp" };
const server = http.createServer((req, res) => {
  const f = fileFor(DIST, req.url);
  if (!f || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(f)] || "application/octet-stream" }); res.end(fs.readFileSync(f));
});
await new Promise((ready) => server.listen(0, "127.0.0.1", ready));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const page = await browser.newPage({ viewport: { width: 1952, height: 1136 } });
const errors = [];
page.on("pageerror", (e) => errors.push(`script error: ${e.message}`));
page.on("console", (m) => { if (m.type() === "error" && !/fonts\.g|Failed to load resource/.test(m.text())) errors.push(`console: ${m.text()}`); });
page.on("requestfailed", (r) => { if (!/fonts\.g/.test(r.url())) errors.push(`missing file: ${r.url().replace(base, "")}`); });
page.on("response", (r) => { if (r.status() === 404) errors.push(`missing file: ${r.url().replace(base, "")}`); });

await page.goto(`${base}/index.html#s1`, { waitUntil: "load" });
await page.waitForTimeout(800);
const n = await page.evaluate(() => Deck.slides.length);
if (SHOTS) fs.mkdirSync(path.join(ROOT, "shots"), { recursive: true });

// anything visible that leaves the stage, and any text box whose content is wider or taller than the box
const spill = () => page.evaluate(() => {
  const s = Deck.slides[Deck.i], st = document.getElementById("stage").getBoundingClientRect(), k = Deck.scale, out = [];
  const name = (e) => e.tagName.toLowerCase() + (e.id ? "#" + e.id : e.classList[0] ? "." + e.classList[0] : "");
  for (const e of s.querySelectorAll(".in *, .in")) {
    if (e.closest("svg") && e.tagName.toLowerCase() !== "svg") continue;                  // drawings clip themselves
    if (e.closest("[data-allow-overflow]")) continue;
    const cs = getComputedStyle(e); if (cs.visibility === "hidden" || cs.display === "none" || +cs.opacity === 0) continue;
    const r = e.getBoundingClientRect(); if (!r.width || !r.height) continue;
    const off = Math.max(st.left - r.left, r.right - st.right, st.top - r.top, r.bottom - st.bottom) / k;
    if (off > 4) out.push(`${name(e)} leaves the stage by ${Math.round(off)} px`);
    // a box that hides its overflow and holds more than fits: a list cut off at the bottom of its card, a line cut at the right
    else if (cs.overflowX !== "visible" || cs.overflowY !== "visible") {
      const dx = e.scrollWidth - e.clientWidth, dy = e.scrollHeight - e.clientHeight;
      if (e.textContent.trim() && (dx > 2 || dy > 2)) out.push(`${name(e)} cuts off its content (${Math.max(dx, dy)} px hidden)`);
    }
  }
  return [...new Set(out)].slice(0, 4);
});

// What the slide on screen uses from the design kit. Sizes are shares of the 1920 × 1080 stage.
const kitOf = () => page.evaluate(() => {
  const s = Deck.slides[Deck.i], k = Deck.scale, STAGE = 1920 * 1080;
  const seen = (e) => { const cs = getComputedStyle(e); return cs.display !== "none" && cs.visibility !== "hidden" && +cs.opacity > 0.05; };
  const share = (e) => { const r = e.getBoundingClientRect(); return (r.width / k) * (r.height / k) / STAGE; };
  const total = (els) => els.filter(seen).reduce((t, e) => t + share(e), 0);
  const shapes = "path, rect, circle, ellipse, line, polygon, polyline, text";
  const drawings = [...s.querySelectorAll("svg")].filter((v) => !v.closest(".brand, .iso") && v.querySelectorAll(shapes).length > 3);
  const figures = [...s.querySelectorAll(".iso")];
  // a colour counts as dark when it is opaque and its luminance is under 0.4
  const dark = (e) => {
    const c = getComputedStyle(e).backgroundColor, v = (c.match(/[\d.]+/g) || []).map(Number);
    if (v.length < 3 || (v[3] !== undefined && v[3] < 0.5)) return false;
    return (0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]) / (c.startsWith("color(") ? 1 : 255) < 0.4;
  };
  const hook = typeof H === "object" && H[s.id];
  return {
    id: s.id, body: !s.dataset.appendix, plain: s.hasAttribute("data-plain"),
    drawn: total(drawings), figure: total(figures), figures: figures.length, reach: Math.max(0, ...figures.filter(seen).map((e) => e.getBoundingClientRect().height / k / 1080)), photo: total([...s.querySelectorAll("img, video, canvas")].filter((e) => !e.closest(".brand") && share(e) > 0.03)),
    live: s.querySelectorAll("input[type=range], select, .seg button, [data-live]").length, raised: s.querySelectorAll(".raised").length,
    hook: !!(hook && (hook.step || hook.enter)) || !!s.querySelector("[data-kit]"),
    dark: [s, ...s.querySelectorAll(":scope > *, :scope > .in > *")].some((e) => seen(e) && (e === s || share(e) > 0.35) && dark(e)),
    todo: /\bTODO\b/.test(s.textContent) || !!s.querySelector("[data-todo]"),
  };
});
const kit = [];

const report = [];
for (let i = 0; i < n; i++) {
  if (only && !only.includes(i + 1)) continue;
  const before = errors.length;
  // arriving from the slide before starts the morphs: Morph.live holds one entry for each element in flight
  const { id, steps, title, flights } = await page.evaluate((i) => { Deck.go(i, 0); return { id: Deck.slides[i].id, steps: Deck.maxStep(Deck.slides[i]), title: Deck.slides[i].dataset.title, flights: Morph.live.length }; }, i);
  await page.waitForTimeout(350);
  for (let k = 1; k <= steps; k++) { await page.evaluate((k) => Deck.go(Deck.i, k), k); await page.waitForTimeout(250); }
  await page.waitForTimeout(SHOTS ? 1800 : 700);
  for (const s of await spill()) errors.push(s);
  const used = { ...(await kitOf()), steps, flights };
  kit.push(used);
  if (used.todo) errors.push("placeholder text is still on the slide or in its notes (TODO)");
  if (started[id] && started[id] === title) errors.push("still carries the example's title: rewrite the slide for this story, or remove it");
  // stepping back must rebuild the earlier state without an error
  if (steps) { await page.evaluate(() => { Deck.go(Deck.i, 0); Deck.go(Deck.i, Deck.maxStep(Deck.slides[Deck.i])); }); await page.waitForTimeout(150); }
  if (SHOTS) await page.locator("#stage").screenshot({ path: path.join(ROOT, "shots", `${String(i + 1).padStart(2, "0")}-${id}.png`) });
  const pct = (v) => Math.round(v * 100) + "%";
  const has = [used.figure > 0 && `3D figure ${pct(used.figure)}`, used.drawn >= 0.01 && `drawing ${pct(used.drawn)}`, used.photo > 0 && `photo ${pct(used.photo)}`, used.live && "live", used.hook && "hook", used.flights && `${used.flights} morph${used.flights > 1 ? "s" : ""} in`, used.plain && "plain"].filter(Boolean).join(" · ");
  report.push(`${String(i + 1).padStart(2)}  ${id.padEnd(14)} ${String(steps).padStart(2)} presses  ${errors.length > before ? "✗ " + errors.slice(before).join(" | ") : "ok"}${has ? "   " + has : used.body ? "   text only" : ""}`);
}
await page.setViewportSize({ width: 400, height: 860 });
await page.evaluate(() => Deck.go(Math.min(1, Deck.slides.length - 1), 0)); await page.waitForTimeout(400);
const sideways = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
await browser.close(); server.close();

// The bar of the design kit. A deck can pass every check above and still be pages of text in someone else's style.
// Each rule returns a message when the deck misses it. It fails the check on a deck of four body slides or more,
// unless deck.config.json gives a reason under kit.allow.<key>. On a shorter deck it is advice.
// the least share of the stage that counts as the slide's picture. A narrow figure (a rocket, a bottle) counts by its height instead
const PICTURE = 0.06, PHOTO = 0.05, REACH = 0.35;
const KIT_RULES = (body, all) => {
  const ids = (list) => list.map((k) => k.id).join(", ");
  const shown = body.filter((k) => !k.plain), plain = body.filter((k) => k.plain);
  const drawn = (k) => k.drawn + k.figure >= PICTURE || k.reach >= REACH;
  const photos = shown.filter((k) => !drawn(k) && k.photo >= PHOTO), flat = shown.filter((k) => !drawn(k) && k.photo < PHOTO);
  const still = shown.filter((k) => k.steps && !k.hook), dark = body.filter((k) => k.dark);
  const joints = all.reduce((t, k) => t + k.flights, 0);
  const count = (f) => all.reduce((t, k) => t + f(k), 0), wantJoints = body.length >= 6 ? 2 : 1;
  return {
    line: `pictures on ${shown.length - flat.length} of ${shown.length} slides · 3D figures ${count((k) => k.figures)} · live controls ${count((k) => k.live)} · morphs ${joints} · raised cards ${count((k) => k.raised)}`,
    rules: [
      ["pictures", flat.length && `no picture on: ${ids(flat)}. A slide of text and boxes is a page of a document. Draw the point with a kit component (Kit.bars, Kit.versus, Kit.timeline, Kit.figure), or cut the slide`],
      ["pictures", plain.length > Math.max(1, Math.floor(body.length / 4)) && `${plain.length} of ${body.length} slides are marked data-plain (${ids(plain)}). One slide in four is the most a deck carries`],
      ["photos", photos.length > 2 && `a photograph is the only picture on ${photos.length} slides (${ids(photos)}). A photo is evidence, on two slides at most. Draw the subject`],
      ["figure", !count((k) => k.figures) && "no 3D figure. Draw the subject, or the thing the story is about, with a preset: see anatomy/scenes/presets.mjs and Kit.figure"],
      ["live", !count((k) => k.live) && "nothing the room can change. Give the deck one slide with a slider or a choice, after the claim it tests"],
      ["morph", joints < wantJoints && `${joints} of ${wantJoints} morphs. Carry the key object or number from a slide into the next with the same data-morph name on both. It must be on screen when the first slide is left and present when the next one appears`],
      ["motion", still.length && `presses that only fade text in: ${ids(still)}. Give each a hook (pressHook or a kit component), so every press moves the drawing`],
      ["style", dark.length && `dark slides: ${ids(dark)}. The house style is light. Change the tokens in styles/style.css for a brand, and keep the slides light`],
      ["style", !count((k) => k.raised) && "no raised card. The deck is not using the house style (.card.raised in styles/style.css)"],
    ].filter(([, miss]) => miss),
  };
};

console.log(report.join("\n"));
console.log(sideways ? "✗ phone layout scrolls sideways" : "phone layout ok");

if (!only) {
  const allow = JSON.parse(fs.readFileSync(path.join(ROOT, "deck.config.json"), "utf8")).kit?.allow || {};
  const body = kit.filter((k) => k.body), { line, rules } = KIT_RULES(body, kit);
  console.log(`\nkit   ${line}`);
  for (const [key, miss] of rules) {
    if (typeof allow[key] === "string" && allow[key].trim()) console.log(`  · allowed (${key}: ${allow[key].trim()}): ${miss}`);
    else if (body.length >= 4) errors.push(`kit · ${miss}  [to allow: "kit": { "allow": { "${key}": "the reason" } } in deck.config.json]`);
    else console.log(`  · ${miss}`);
  }
}
const bad = errors.length > 0 || sideways;
const kitErrors = errors.filter((e) => e.startsWith("kit · "));
if (kitErrors.length) console.log("\n" + kitErrors.map((e) => "✗ " + e).join("\n"));
console.log(bad ? `\n${errors.length + (sideways ? 1 : 0)} problem(s) found` : "\nall slides ok");
process.exit(bad ? 1 : 0);
