// Open every slide at every press in a real browser.  npm run check  [-- --shots]  [-- --only 3,7]
// Needs Playwright once:  npm i -D playwright && npx playwright install chromium
// Fails on: a script error, a missing file, text or boxes that leave the 1920 × 1080 stage, a phone layout that scrolls sideways.
// With --shots it saves one PNG per slide at its last press into shots/. Look at them: a passing check does not mean a good slide.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { build, ROOT } from "./build.mjs";
import { loadChromium, outDir } from "./pw.mjs";

const chromium = await loadChromium();
const args = process.argv.slice(2);
const SHOTS = args.includes("--shots");
const only = args.includes("--only") ? args[args.indexOf("--only") + 1].split(",").map(Number) : null;
const DIST = outDir(ROOT);
if (!build({ quiet: true, out: DIST }).ok) { console.error("the build has errors; fix them first"); process.exit(1); }

const TYPES = { ".html": "text/html", ".css": "text/css", ".woff2": "font/woff2", ".mp3": "audio/mpeg", ".mp4": "video/mp4", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".webp": "image/webp" };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  const f = path.join(DIST, url === "/" ? "index.html" : url);
  if (!f.startsWith(DIST) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(f)] || "application/octet-stream" }); res.end(fs.readFileSync(f));
}).listen(0);
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

const report = [];
for (let i = 0; i < n; i++) {
  if (only && !only.includes(i + 1)) continue;
  const before = errors.length;
  const { id, steps } = await page.evaluate((i) => { Deck.go(i, 0); return { id: Deck.slides[i].id, steps: Deck.maxStep(Deck.slides[i]) }; }, i);
  await page.waitForTimeout(350);
  for (let k = 1; k <= steps; k++) { await page.evaluate((k) => Deck.go(Deck.i, k), k); await page.waitForTimeout(250); }
  await page.waitForTimeout(SHOTS ? 1800 : 700);
  for (const s of await spill()) errors.push(s);
  // stepping back must rebuild the earlier state without an error
  if (steps) { await page.evaluate(() => { Deck.go(Deck.i, 0); Deck.go(Deck.i, Deck.maxStep(Deck.slides[Deck.i])); }); await page.waitForTimeout(150); }
  if (SHOTS) await page.locator("#stage").screenshot({ path: path.join(ROOT, "shots", `${String(i + 1).padStart(2, "0")}-${id}.png`) });
  report.push(`${String(i + 1).padStart(2)}  ${id.padEnd(14)} ${String(steps).padStart(2)} presses  ${errors.length > before ? "✗ " + errors.slice(before).join(" | ") : "ok"}`);
}
await page.setViewportSize({ width: 400, height: 860 });
await page.evaluate(() => Deck.go(Math.min(1, Deck.slides.length - 1), 0)); await page.waitForTimeout(400);
const sideways = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
await browser.close(); server.close();

console.log(report.join("\n"));
console.log(sideways ? "✗ phone layout scrolls sideways" : "phone layout ok");
const bad = errors.length > 0 || sideways;
console.log(bad ? `\n${errors.length + (sideways ? 1 : 0)} problem(s) found` : "\nall slides ok");
process.exit(bad ? 1 : 0);
