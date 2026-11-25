// Live preview while editing.  npm run dev  →  http://localhost:5173
// Rebuilds on every save under slides/, styles/, src/, assets/, brand/, public/, anatomy/scenes/ or deck.config.json,
// then reloads the open browser tab on the same slide.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { build, ROOT } from "./build.mjs";
import { fileFor, outDir } from "./pw.mjs";

// The preview answers on this machine only. HOST=0.0.0.0 lets other devices on the network open the deck, speaker notes included.
const PORT = +(process.env.PORT || 5173), HOST = process.env.HOST || "127.0.0.1";
const DIST = outDir(ROOT);
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".woff2": "font/woff2", ".mp3": "audio/mpeg", ".mp4": "video/mp4" };
const clients = new Set();
const RELOAD = `<script>(()=>{const es=new EventSource('/__reload');es.onmessage=()=>location.reload();})();</script>`;

function rebuild(why) {
  try {
    const r = build({ quiet: true, out: DIST });
    console.log(`${new Date().toLocaleTimeString()}  rebuilt${why ? " (" + why + ")" : ""}${r.ok ? "" : "  (fix the ✗ items above)"}`);
    for (const c of clients) c.write("data: reload\n\n");
  } catch (e) { console.error("build failed:", e.message); }
}

rebuild();
let timer = null;
for (const dir of ["slides", "styles", "src", "assets", "brand", "public", "anatomy/scenes", "deck.config.json"]) {
  const p = path.join(ROOT, dir);
  if (!fs.existsSync(p)) continue;
  fs.watch(p, { recursive: true }, (ev, f) => {
    if (f && (/(^|\/)\./.test(f) || f.endsWith("~") || (dir === "anatomy/scenes" && !String(f).endsWith(".data.json")))) return;
    clearTimeout(timer); timer = setTimeout(() => rebuild(f ? path.join(dir, String(f)) : dir), 120);
  });
}

http.createServer((req, res) => {
  // a page on another site must not be able to read the preview by pointing its own host name at this machine
  const name = String(req.headers.host || "").replace(/:\d+$/, "");
  if (HOST === "127.0.0.1" && !["localhost", "127.0.0.1", "[::1]"].includes(name)) { res.writeHead(403).end(); return; }
  if (req.url.split("?")[0] === "/__reload") {
    res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
    res.write("retry: 500\n\n"); clients.add(res); req.on("close", () => clients.delete(res)); return;
  }
  let file = fileFor(DIST, req.url);
  if (!file) { res.writeHead(400).end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  if (!fs.existsSync(file)) { res.writeHead(404).end("not found"); return; }
  const ext = path.extname(file);
  let body = fs.readFileSync(file);
  if (ext === ".html") body = Buffer.from(body.toString().replace("</body>", RELOAD + "</body>"));
  // range requests so the narration and videos can seek
  const range = req.headers.range && /bytes=(\d*)-(\d*)/.exec(req.headers.range);
  if (range && !ext.endsWith("html")) {
    const start = range[1] ? +range[1] : 0, end = range[2] ? +range[2] : body.length - 1;
    res.writeHead(206, { "Content-Type": TYPES[ext] || "application/octet-stream", "Content-Range": `bytes ${start}-${end}/${body.length}`, "Accept-Ranges": "bytes", "Content-Length": end - start + 1 });
    res.end(body.subarray(start, end + 1)); return;
  }
  res.writeHead(200, { "Content-Type": TYPES[ext] || "application/octet-stream", "Cache-Control": "no-store", "Accept-Ranges": "bytes" });
  res.end(body);
}).listen(PORT, HOST, () => console.log(`\n  deck preview → http://localhost:${PORT}\n  (offline single file → http://localhost:${PORT}/offline.html)\n`));
