#!/usr/bin/env node
// Start a new deck from the PresentToMe starter.
//   node new-deck.mjs <target folder> [--title "…"] [--brand "…"] [--currency "$"] [--lang en] [--example] [--force]
// Default: a blank deck (title, questions and sources pages, an empty model, every tool, templates and the anatomy kit).
// --example copies the complete example deck instead, to study or to edit in place.
// The example always stays readable in this skill at assets/starter/.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const VALUED = new Set(["title", "brand", "currency", "lang"]);
const target = args.find((a, i) => !a.startsWith("--") && !(i > 0 && VALUED.has(args[i - 1].slice(2))));
if (!target) { console.error('usage: node new-deck.mjs <target folder> [--title "…"] [--brand "…"] [--currency "$"] [--lang en] [--example] [--force]'); process.exit(1); }

const STARTER = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../assets/starter");
const OUT = path.resolve(target);
if (fs.existsSync(OUT) && fs.readdirSync(OUT).length && !flag("force")) { console.error(`${OUT} exists and is not empty. Choose another folder, or pass --force to write into it.`); process.exit(1); }

const example = flag("example");
const title = opt("title", example ? null : "Untitled deck");
const brand = opt("brand", example ? null : "");
const NEVER = new Set(["node_modules", "dist", "shots", ".DS_Store", ".impeccable", "package-lock.json", "SLIDES.md"]);
// the example story: left out of a blank deck
const EXAMPLE_ONLY = new Set([
  ...["film", "title", "pressures", "options", "tests", "anatomy", "day", "money", "decision"].map((s) => `slides/${s}.html`),
  ...["hooks-open", "hooks-charts", "hooks-anatomy", "hooks-money", "model", "sources"].map((s) => `src/js/${s}.js`),
  "styles/slides-charts.css", "styles/slides-anatomy.css", "brand/logo.svg", "deck.config.json", "DECK.md",
  ...["hero", "system"].flatMap((s) => [`anatomy/scenes/${s}.mjs`, `anatomy/scenes/${s}.data.json`]),
]);

function copy(from, to, rel = "") {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (NEVER.has(e.name) || (!example && EXAMPLE_ONLY.has(r))) continue;
    if (e.isDirectory()) copy(path.join(from, e.name), path.join(to, e.name), r);
    else fs.copyFileSync(path.join(from, e.name), path.join(to, e.name));
  }
}
copy(STARTER, OUT);
const write = (p, s) => { fs.mkdirSync(path.dirname(path.join(OUT, p)), { recursive: true }); fs.writeFileSync(path.join(OUT, p), s); };
const cfgFile = path.join(OUT, "deck.config.json");

if (example) {
  const cfg = JSON.parse(fs.readFileSync(cfgFile, "utf8"));
  if (title) cfg.title = title;
  if (brand) cfg.brand = { ...cfg.brand, name: brand };
  fs.writeFileSync(cfgFile, JSON.stringify(cfg, null, 2) + "\n");
} else {
  const base = JSON.parse(fs.readFileSync(path.join(STARTER, "deck.config.json"), "utf8"));
  write("deck.config.json", JSON.stringify({
    title, description: "", lang: opt("lang", "en"), currency: opt("currency", "$"), motion: "full",
    brand: { name: brand, logo: "brand/logo.svg" },
    fonts: base.fonts,
    styles: ["styles/style.css", "styles/slides.css"],
    scripts: ["engine", "presenter-link", "iso", "model", "sources", "hooks", "hooks-appendix", "main"],
    chapters: [
      { title: "Open", num: null, slides: ["title"] },
      { title: "Why now", num: "01", slides: [] },
      { title: "Appendix", num: "A", slides: ["qa", "sources"] },
    ],
    eyebrowTags: {},
  }, null, 2) + "\n");

  write("slides/title.html", `<section class="slide bare" id="title" data-title="Title" data-steps="0">
  <div class="in title-in">
    <div class="title-copy">
      <p class="eyebrow">Who is speaking · to whom · for what decision</p>
      <h1 class="title-h">The one sentence, with its <em>key word</em> coloured.</h1>
      <ul class="title-rows">
        <li><span>One side of it</span><svg viewBox="0 0 60 16" aria-hidden="true"><path d="M2 8h52M46 2l8 6-8 6"/></svg><b class="pill m1">what we do about it</b></li>
        <li><span>The other side</span><svg viewBox="0 0 60 16" aria-hidden="true"><path d="M2 8h52M46 2l8 6-8 6"/></svg><b class="pill m2">what stays as it is</b></li>
      </ul>
      <p class="title-line"><b>One decision today:</b> say it in a clause.</p>
    </div>
    <div class="title-fig" id="titleFig" aria-label="Say what the figure shows"></div>
  </div>
  <aside class="notes"><h4>Title</h4><p>Say the one sentence. Say what you will ask for at the end. Lead into the first chapter.</p></aside>
</section>
`);

  write("src/js/model.js", `/* ===== The model: every number the deck shows comes from here. =====
   INPUT holds every assumption, with a comment saying where it comes from.
   runModel is pure: inputs in, results out. recompute() fills every data-bind element and tells the hooks to redraw.
   A slide never types a number the model also knows. */
const INPUT = {
  // costToday: 0,     // what it is, where the figure comes from, the date
  years: 5,
};

function runModel(I) {
  return {
    // every result the slides show
  };
}

/* ---------- live bindings: every element with data-bind="key" shows the model's current value ---------- */
let MODEL = null;
function recompute() {
  MODEL = runModel(INPUT);
  const set = (k, v) => $$(\`[data-bind="\${k}"]\`).forEach(e => e.textContent = v);
  set('years', INPUT.years);
  document.dispatchEvent(new CustomEvent('model'));      // hooks that draw from the model redraw on this event
}
`);

  write("src/js/sources.js", `/* ===== Sources: one registry for every outside figure in the deck. =====
   [id, group, title (publisher, date read), url ('' = given to us, no public link), slide ids that rely on it]
   Add a source here, never on a slide, and name the slides it supports. The appendix page lists them by group. */
const SOURCE_GROUPS = [['cost', 'Prices and costs'], ['method', 'Method']];
const SOURCES = [
  // ['tariff', 'cost', 'Publisher: what it is (read on a date)', 'https://…', ['slide-id', 'another-slide-id']],
];
`);

  write("src/js/hooks.js", `/* ===== Slide hooks =====
   One hook per slide that draws or moves: H.<slide id> = pressHook({ build, settle, play, leave }).
   Every script shares one global scope, so each file keeps its names inside one function.
   See references/motion-and-interaction.md in the PresentToMe skill, and the example hooks in its assets/starter/src/js/. */
(function () {

  // H.myslide = pressHook({
  //   build(s) { },            // draw from MODEL and INPUT; runs on every enter
  //   settle(k) { },           // the state after press k, with nothing moving
  //   play(k, m) { },          // animate the one thing press k adds: m.tw(seconds, fn, delaySeconds)
  // });

})();
`);

  const ap = path.join(OUT, "src/js/hooks-appendix.js");
  fs.writeFileSync(ap, fs.readFileSync(ap, "utf8")
    .replace(/const QA = \[[\s\S]*?\n\];/, "const QA = [\n  ['The first question you expect', 'A short, honest answer, with the slide or source that backs it.'],\n];")
    .replace(" EXAMPLE DATA.", ""));
  for (const f of ["slides/qa.html"]) { const p = path.join(OUT, f); fs.writeFileSync(p, fs.readFileSync(p, "utf8").replace(/<p class="src">[\s\S]*?<\/p>/, "")); }

  write("DECK.md", fs.readFileSync(path.join(STARTER, "../DECK.template.md"), "utf8").replace("{{TITLE}}", title));
}

console.log(`${example ? "Example deck" : "Blank deck"} written to ${OUT}

Next:
  cd ${path.relative(process.cwd(), OUT) || "."}
  npm install && npx playwright install chromium
  npm run dev            # http://localhost:5173
  npm run new -- <id> cards|drawing|split|checklist
  npm run build && npm run check

Fill in DECK.md first: the Story Brief and the colour dictionary.`);
