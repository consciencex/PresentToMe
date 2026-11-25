#!/usr/bin/env node
// Start a new deck from the PresentToMe starter.
//   node new-deck.mjs <target folder> --kind explainer|versus|decision|blank [--title "…"] [--brand "…"] [--currency "$"] [--lang en]
// --lang sets the page language. For Thai (th) it also adds a Thai typeface and the type rules Thai needs.
// A kind is a complete, working deck with the design kit already wired: a 3D figure, drawings that move on every press,
// a slide the room can change, and elements that travel between slides. Its story and its data are examples: replace them.
// Every kind stays readable in this skill: assets/recipes/<kind>/ and, for the decision deck, assets/starter/.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const KINDS = {
  explainer: "how something works, or what it is: the thing, its parts, the process, the numbers, a slide the room can try",
  versus: "A or B: two things on the same measures, what differs inside, the cost over time, a chooser",
  decision: "asking for a yes: why now, options on one basis, tests, how it works, the money, the ask",
  blank: "a title, questions and sources only, for a story that fits none of the three",
};
const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const VALUED = new Set(["title", "brand", "currency", "lang", "kind"]);
const target = args.find((a, i) => !a.startsWith("--") && !(i > 0 && VALUED.has(args[i - 1].slice(2))));
const kind = flag("example") ? "decision" : opt("kind", "");
const kinds = Object.entries(KINDS).map(([k, d]) => `  ${k.padEnd(10)} ${d}`).join("\n");
if (!target || !KINDS[kind]) {
  console.error(`usage: node new-deck.mjs <target folder> --kind <kind> [--title "…"] [--brand "…"] [--currency "$"] [--lang en]\n\nChoose the kind from what the talk is for:\n${kinds}`);
  process.exit(1);
}

// a language whose script the default typefaces lack brings a companion face and its own type rules
const LANGS = { th: { family: "IBM+Plex+Sans+Thai:wght@400;500;600;700", css: "styles/lang-th.css" } };
const lang = opt("lang", "en"), script = LANGS[lang];
const forLang = (cfg) => {
  cfg.lang = lang;
  if (!script) return cfg;
  cfg.fonts = { ...cfg.fonts, google: cfg.fonts.google.replace("&display=swap", `&family=${script.family}&display=swap`) };
  cfg.styles = [...cfg.styles, script.css];
  return cfg;
};

const HERE = path.dirname(fileURLToPath(import.meta.url));
const STARTER = path.resolve(HERE, "../assets/starter"), RECIPE = path.resolve(HERE, "../assets/recipes", kind);
const OUT = path.resolve(target);
// a new deck goes only into a new or empty folder, so this script can never overwrite someone's work
if (fs.existsSync(OUT) && fs.readdirSync(OUT).length) { console.error(`${OUT} exists and is not empty. Give a new folder name, for example ${path.join(OUT, "deck")}.`); process.exit(1); }

const whole = kind === "decision";                    // the decision deck is the starter as it stands
const recipe = whole || kind === "blank" ? null : path.join(RECIPE, "recipe.json");
if (recipe && !fs.existsSync(recipe)) { console.error(`This copy of the skill has no ${kind} deck (${recipe} is missing). Reinstall the skill, or use another kind.`); process.exit(1); }
const title = opt("title", whole ? null : "Untitled deck");
const brand = opt("brand", whole ? null : "");
const NEVER = new Set(["node_modules", "dist", "public-build", "shots", ".DS_Store", ".impeccable", "package-lock.json", "SLIDES.md", "recipe.json"]);
// the decision deck's own story: left out of every other kind
const DECISION_ONLY = new Set([
  ...["film", "title", "pressures", "options", "tests", "anatomy", "day", "money", "decision", "kit"].map((s) => `slides/${s}.html`),
  ...["hooks-open", "hooks-charts", "hooks-anatomy", "hooks-money", "hooks-kit", "model", "sources"].map((s) => `src/js/${s}.js`),
  "styles/slides-charts.css", "styles/slides-anatomy.css", "brand/logo.svg", "deck.config.json", "DECK.md",
  ...["hero", "system"].flatMap((s) => [`anatomy/scenes/${s}.mjs`, `anatomy/scenes/${s}.data.json`]),
]);

function copy(from, to, skip, rel = "") {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (NEVER.has(e.name) || skip.has(r)) continue;
    if (e.isDirectory()) copy(path.join(from, e.name), path.join(to, e.name), skip, r);
    else fs.copyFileSync(path.join(from, e.name), path.join(to, e.name));
  }
}
copy(STARTER, OUT, whole ? new Set() : DECISION_ONLY);
const write = (p, s) => { fs.mkdirSync(path.dirname(path.join(OUT, p)), { recursive: true }); fs.writeFileSync(path.join(OUT, p), s); };
const cfgFile = path.join(OUT, "deck.config.json");
const readJson = (f) => JSON.parse(fs.readFileSync(f, "utf8"));

if (whole) {
  const cfg = readJson(cfgFile);
  if (title) cfg.title = title;
  if (brand) cfg.brand = { ...cfg.brand, name: brand };
  fs.writeFileSync(cfgFile, JSON.stringify(opt("lang", "") ? forLang(cfg) : cfg, null, 2) + "\n");
} else {
  const base = readJson(path.join(STARTER, "deck.config.json"));
  const cfg = {
    title, description: "", lang, currency: opt("currency", "$"), motion: "full",
    brand: { name: brand, logo: "brand/logo.svg" },
    fonts: base.fonts,
    styles: ["styles/style.css", "styles/kit.css", "styles/slides.css"],
    scripts: ["engine", "presenter-link", "iso", "model", "sources", "kit", "kit-figure", "hooks", "hooks-appendix", "main"],
    chapters: [
      { title: "Open", num: null, slides: ["title"] },
      { title: "Why now", num: "01", slides: [] },
      { title: "Appendix", num: "A", slides: ["qa", "sources"] },
    ],
    eyebrowTags: {},
  };

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

  write("src/js/sources.js", `/* ===== Sources and questions: one registry for every outside figure in the deck, and the questions page. =====
   [id, group, title (publisher, date read), url ('' = given to us, no public link), slide ids that rely on it]
   Add a source here, never on a slide, and name the slides it supports. The appendix page lists them by group. */
const SOURCE_GROUPS = [['cost', 'Prices and costs'], ['method', 'Method']];
const SOURCES = [
  // ['tariff', 'cost', 'Publisher: what it is (read on a date)', 'https://…', ['slide-id', 'another-slide-id']],
];

/* The questions page: the hard questions, answered before they are asked. [question, answer] */
const QA = [
  ['TODO: the first question you expect', 'A short, honest answer, with the slide or source that backs it.'],
];
`);

  write("src/js/hooks.js", `/* ===== Slide hooks =====
   One hook per slide that draws or moves: H.<slide id> = pressHook({ build, settle, play, leave }).
   Every script shares one global scope, so each file keeps its names inside one function.
   Charts come from the kit (Kit.bars, Kit.versus, Kit.lines, …) and figures from Kit.figure: see references/kit-components.md
   and references/motion-and-interaction.md in the PresentToMe skill. */
(function () {

  // H.myslide = pressHook({
  //   build(s) { },            // draw from MODEL and INPUT; runs on every enter
  //   settle(k) { },           // the state after press k, with nothing moving
  //   play(k, m) { },          // animate the one thing press k adds: m.tw(seconds, fn, delaySeconds)
  // });

})();
`);

  for (const f of ["slides/qa.html"]) { const p = path.join(OUT, f); fs.writeFileSync(p, fs.readFileSync(p, "utf8").replace(/<p class="src">[\s\S]*?<\/p>/, "")); }
  write("DECK.md", fs.readFileSync(path.join(STARTER, "../DECK.template.md"), "utf8").replace("{{TITLE}}", title));

  // a recipe lays its own slides, hooks, model, sources, styles and scenes over the blank deck
  if (recipe) {
    const r = readJson(recipe);
    copy(RECIPE, OUT, new Set());
    Object.assign(cfg, { description: r.description, chapters: r.chapters, styles: [...cfg.styles, ...(r.styles || [])] });
    if (!opt("title", "")) cfg.title = r.title;
  }
  write("deck.config.json", JSON.stringify(forLang(cfg), null, 2) + "\n");
}

// The titles the deck starts with. The check reports any slide that still carries one: an example slide that was never rewritten.
if (kind !== "blank") {
  const titles = {};
  for (const f of fs.readdirSync(path.join(OUT, "slides"))) {
    const m = fs.readFileSync(path.join(OUT, "slides", f), "utf8").match(/<section\b[^>]*\bdata-title="([^"]*)"/);
    if (f.endsWith(".html") && m && !["qa", "sources"].includes(f.replace(".html", ""))) titles[f.replace(".html", "")] = m[1];
  }
  write(".recipe.json", JSON.stringify({ kind, titles }, null, 2) + "\n");
}

console.log(`${kind[0].toUpperCase() + kind.slice(1)} deck written to ${OUT}
${kind === "blank" ? "" : `\nIt is a working example. Its structure, figures and motion are yours to keep. Its story, titles, numbers and notes are not:\nreplace every one. \`npm run check\` fails while a slide still carries the example's title.\n`}
Next:
  cd ${path.relative(process.cwd(), OUT) || "."}
  npm install && npx playwright install chromium     (ask the user first: this downloads a browser)
  npm run dev            # http://localhost:5173
  npm run new -- <id> cards|drawing|split|versus|checklist
  npm run build && npm run check

Fill in DECK.md first: the Story Brief and the colour dictionary.`);
