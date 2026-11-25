// Add a slide from a template.  node tools/new-slide.mjs <id> [template] [chapter title]
//   templates: cards (default), drawing, split, checklist   (files in src/templates/)
// Creates slides/<id>.html and adds the id to the chapter in deck.config.json (the last chapter before the appendix by default).
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./build.mjs";
const [, , id, tpl = "cards", chapter] = process.argv;
if (!id || !/^[a-z][a-z0-9-]*$/.test(id)) { console.error("usage: node tools/new-slide.mjs <id> [template] [chapter title]   (id: lowercase letters, digits, hyphens)"); process.exit(1); }
const from = path.join(ROOT, `src/templates/${tpl}.html`), to = path.join(ROOT, `slides/${id}.html`);
if (!fs.existsSync(from)) { console.error(`no template "${tpl}". Have: ${fs.readdirSync(path.join(ROOT, "src/templates")).map((f) => f.replace(".html", "")).join(", ")}`); process.exit(1); }
if (fs.existsSync(to)) { console.error(`slides/${id}.html already exists`); process.exit(1); }
fs.writeFileSync(to, fs.readFileSync(from, "utf8").replace(/<!--[\s\S]*?-->\s*/, "").replace(/id="new-slide"/, `id="${id}"`));
const cfgFile = path.join(ROOT, "deck.config.json"), cfg = JSON.parse(fs.readFileSync(cfgFile, "utf8"));
const body = cfg.chapters.filter((c) => c.num !== "A");
const ch = chapter ? cfg.chapters.find((c) => c.title === chapter) : body[body.length - 1];
if (!ch) { console.error(`no chapter titled "${chapter}"`); process.exit(1); }
ch.slides.push(id);
fs.writeFileSync(cfgFile, JSON.stringify(cfg, null, 2) + "\n");
console.log(`created slides/${id}.html from "${tpl}" in chapter "${ch.title}". Draw it in src/js/ with a hook:  H["${id}"] = pressHook({ build, settle, play })  (references/motion-and-interaction.md).`);
