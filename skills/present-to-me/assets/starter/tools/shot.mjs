// Screenshot one slide at one press, to look at a change.  node tools/shot.mjs <slide id> [press] [out.png] [extra wait ms]
//   e.g. node tools/shot.mjs options 2 shots/options-2.png 1500
// Builds first, then opens dist/offline.html. Needs Playwright (npm i -D playwright && npx playwright install chromium).
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build, ROOT } from "./build.mjs";
import { loadChromium, outDir } from "./pw.mjs";
const [, , id, step = "0", out = `shots/${id}-${step}.png`, extra = "0"] = process.argv;
if (!id) { console.error("usage: node tools/shot.mjs <slide id> [press] [out.png] [extra wait ms]"); process.exit(1); }
const DIST = outDir(ROOT);
if (!build({ quiet: true, out: DIST }).ok) process.exit(1);
const chromium = await loadChromium();
const b = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const p = await b.newPage({ viewport: { width: 1952, height: 1136 } });
await p.goto(pathToFileURL(path.join(DIST, "offline.html")).href + "#s1", { waitUntil: "load" });
await p.waitForTimeout(600);
const i = await p.evaluate((id) => Deck.slides.findIndex((s) => s.id === id), id);
if (i < 0) { console.error(`no slide with id "${id}"`); await b.close(); process.exit(1); }
await p.evaluate((i) => Deck.go(i, 0), i);
await p.waitForTimeout(1500);
for (let k = 1; k <= +step; k++) { await p.evaluate((k) => Deck.go(Deck.i, k), k); await p.waitForTimeout(900); }
await p.waitForTimeout(1200 + +extra);
fs.mkdirSync(path.dirname(path.resolve(ROOT, out)), { recursive: true });
await p.locator("#stage").screenshot({ path: path.resolve(ROOT, out) });
await b.close();
console.log(`slide ${i + 1} (${id}) press ${step} → ${out}`);
