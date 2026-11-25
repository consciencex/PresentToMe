// Preview a scene figure as a PNG, in the deck's light theme.
//   node anatomy/scenes/preview.mjs <name> [0..1 explode] [out.png] [lit piece]
// Loads iso.css then the deck's style.css, as the build does, so the figure has the deck's line weight and tones.
// Look at it at 0 and at 1: a passing audit does not mean the drawing reads.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadChromium } from "../../tools/pw.mjs";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const [name, u = "0", out = `shots/scene-${name}.png`, lit = ""] = process.argv.slice(2);
if (!name) { console.error("usage: node anatomy/scenes/preview.mjs <name> [0..1 explode] [out.png] [lit piece]"); process.exit(1); }
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const d = JSON.parse(read(`anatomy/scenes/${name}.data.json`));
const html = `<html><head><style>${read("anatomy/kit/iso.css")}${read("styles/style.css")} body{margin:0;background:var(--bg);overflow:hidden}</style></head><body>
<div class="iso" data-theme="light">${d.svg}</div>
<script>const D=${JSON.stringify(d.data)}, LIT=${JSON.stringify(lit)};
document.querySelectorAll('[data-piece]').forEach(g=>{const s=D.shifts[g.dataset.piece];if(s)g.setAttribute('transform','translate('+s[0]*${+u}+' '+s[1]*${+u}+')');
  if(LIT&&g.dataset.piece===LIT)g.querySelectorAll('.iso-solid').forEach(e=>e.setAttribute('data-lit',''))});</script></body></html>`;
const chromium = await loadChromium();
const b = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const p = await b.newPage({ viewport: { width: d.data.W, height: d.data.H }, deviceScaleFactor: 1.5 });
await p.setContent(html);
const file = path.resolve(ROOT, out);
fs.mkdirSync(path.dirname(file), { recursive: true });
await p.screenshot({ path: file }); await b.close(); console.log("saved", file);
