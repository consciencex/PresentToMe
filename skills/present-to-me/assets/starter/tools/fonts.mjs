// Download the deck's typefaces so offline.html carries them.  npm run fonts
// Reads "fonts.google" in deck.config.json (a Google Fonts css2 link), saves the .woff2 files and a fonts.css into public/fonts/.
// Run it once per deck, and again after changing the link. Check each family's licence before you redistribute the files.
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./build.mjs";
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, "deck.config.json"), "utf8"));
const url = cfg.fonts?.google;
if (!url) { console.error('deck.config.json has no "fonts": { "google": "https://fonts.googleapis.com/css2?…" }'); process.exit(1); }
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";   // a current browser gets woff2
const res = await fetch(url, { headers: { "User-Agent": UA } });
if (!res.ok) { console.error(`Google Fonts answered ${res.status}`); process.exit(1); }
let css = await res.text();
const dir = path.join(ROOT, "public/fonts"); fs.mkdirSync(dir, { recursive: true });
const files = [...new Set([...css.matchAll(/url\((https:[^)]+\.woff2)\)/g)].map((m) => m[1]))];
let n = 0;
for (const f of files) {
  const name = `f${String(++n).padStart(2, "0")}.woff2`;
  fs.writeFileSync(path.join(dir, name), Buffer.from(await (await fetch(f)).arrayBuffer()));
  css = css.split(f).join(name);
}
fs.writeFileSync(path.join(dir, "fonts.css"), css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ").replace(/} /g, "}\n"));
console.log(`saved ${n} font files and fonts.css to public/fonts/ (${(fs.readdirSync(dir).reduce((t, f) => t + fs.statSync(path.join(dir, f)).size, 0) / 1024).toFixed(0)} KB)`);
