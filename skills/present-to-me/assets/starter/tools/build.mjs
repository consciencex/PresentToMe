// Build the deck.  node tools/build.mjs [--quiet] [--out <folder>] [--no-notes]
//
// Reads deck.config.json and writes:
//   dist/index.html      web version (fonts, media and assets served as files beside it)
//   dist/offline.html    one self-contained file: fonts and images inlined, works with no internet
//   dist/presenter.html  the presenter's window (key P in the deck): notes for the current press, next slide, timer
// and SLIDES.md, a numbered index of every slide and the file it lives in.
// A line that starts with ✗ is an error (exit code 1). A line that starts with · is advice.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rel = (p) => path.join(ROOT, p);
const has = (p) => fs.existsSync(rel(p));
const read = (p) => fs.readFileSync(rel(p), "utf8");
const MIME = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp", svg: "image/svg+xml", avif: "image/avif", mp3: "audio/mpeg", mp4: "video/mp4", webm: "video/webm", woff2: "font/woff2" };
const dataUri = (file) => `data:${MIME[path.extname(file).slice(1).toLowerCase()] || "application/octet-stream"};base64,${fs.readFileSync(file).toString("base64")}`;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const plain = (html) => html.replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/g, " ").replace(/\s+/g, " ").trim();

export function build({ quiet = false, out = null, notes = true } = {}) {
  const t0 = Date.now();
  const cfg = JSON.parse(read("deck.config.json"));
  const errors = [], advice = [];

  // ---------- slides, in config order, with chapter labels applied ----------
  const sections = [], index = [], seen = new Set(), bySlide = [];
  for (const ch of cfg.chapters) {
    ch.slides.forEach((id, k) => {
      const file = `slides/${id}.html`;
      if (!has(file)) { errors.push(`missing ${file} (listed in deck.config.json)`); return; }
      if (seen.has(id)) errors.push(`slide "${id}" is listed twice`);
      seen.add(id);
      let sec = read(file).replace(/<!--[\s\S]*?-->\s*(?=<section)/, "").trim();
      const m = sec.match(/^<section class="slide[^"]*" id="([^"]+)"/);
      if (!m) { errors.push(`${file} must start with <section class="slide…" id="${id}">`); return; }
      if (m[1] !== id) errors.push(`${file} has id="${m[1]}" but the config calls it "${id}"`);
      if (!/data-title="[^"]+"/.test(sec)) errors.push(`${file} needs data-title="…" (shown in the menu and the slide index)`);
      sec = /data-chapter="/.test(sec) ? sec.replace(/data-chapter="[^"]*"/, `data-chapter="${esc(ch.title)}"`) : sec.replace(/^<section /, `<section data-chapter="${esc(ch.title)}" `);
      const tag = cfg.eyebrowTags?.[id] ? ` · ${cfg.eyebrowTags[id]}` : "";
      const eyebrow = ch.num === "A" ? `<span class="ch">A${k + 1}</span> ${esc(ch.title)}${tag}` : ch.num ? `<span class="ch">${ch.num}</span> ${esc(ch.title)}${tag}` : null;
      if (eyebrow) sec = sec.replace(/<p class="eyebrow">[\s\S]*?<\/p>/, () => `<p class="eyebrow">${eyebrow}</p>`);
      const title = (sec.match(/data-title="([^"]*)"/) || [])[1] || id;
      lint(file, sec);
      // a source line stays in the slide file for the author; the deck shows it only on the appendix page "Sources by slide"
      const sm = sec.match(/<p class="src"[^>]*>([\s\S]*?)<\/p>/);
      if (sm) { bySlide.push({ n: index.length + 1, title, html: sm[1].trim() }); sec = sec.replace(sm[0], ""); }
      if (!notes) sec = sec.replace(/<aside class="notes">[\s\S]*?<\/aside>/, "");
      sections.push(sec);
      index.push({ n: index.length + 1, id, title, chapter: ch.title, steps: +((sec.match(/data-steps="(\d+)"/) || [])[1] || 0) });
    });
  }
  for (const f of fs.readdirSync(rel("slides"))) {
    const id = f.replace(/\.html$/, "");
    if (f.endsWith(".html") && !seen.has(id)) advice.push(`slides/${f} is not in deck.config.json, so it is left out (fine for drafts)`);
  }

  // checks that catch the mistakes this kind of deck makes most often
  function lint(file, sec) {
    const steps = +((sec.match(/data-steps="(\d+)"/) || [])[1] || 0);
    const maxS = Math.max(0, ...[...sec.matchAll(/data-s="(\d+)"/g)].map((x) => +x[1]));
    if (maxS > steps) errors.push(`${file}: an element has data-s="${maxS}" but data-steps="${steps}", so it never appears`);
    const body = sec.replace(/<aside class="notes">[\s\S]*?<\/aside>/, "").replace(/<p class="src"[\s\S]*?<\/p>/, "").replace(/<svg[\s\S]*?<\/svg>/g, " ");
    const h = (body.match(/<h2 class="t"[^>]*>([\s\S]*?)<\/h2>/) || [])[1];
    if (h && plain(h).length > 90) advice.push(`${file}: the title is ${plain(h).length} characters; a claim reads best under about 70`);
    const words = plain(body.replace(/<(label|button|output|select)\b[\s\S]*?<\/\1>/g, " ")).split(" ").filter(Boolean).length;   // controls are not prose
    if (words > 70) advice.push(`${file}: ${words} words on the slide; say it in the notes and show it in the drawing`);
    if (!/<aside class="notes">/.test(sec)) advice.push(`${file}: no speaker notes (<aside class="notes">)`);
    else if (steps > 0 && !/data-press="/.test(sec)) advice.push(`${file}: ${steps} presses but the notes are not split by press (<p data-press="1">…)`);
    if (/style="[^"]*#[0-9a-fA-F]{3,8}\b/.test(body)) advice.push(`${file}: a raw hex colour in a style attribute; use a token from styles/style.css so colour keeps one meaning`);
    for (const [, asset] of sec.matchAll(/["'(]assets\/([^"')?#]+)/g)) if (!has(`assets/${asset}`)) errors.push(`${file}: assets/${asset} is referenced but not found`);
  }

  let slides = sections.join("\n");
  // each appendix slide holding <!--SLIDE_SOURCES--> takes an equal share of the list by text length, in slide order
  const holders = slides.split("<!--SLIDE_SOURCES-->").length - 1;
  if (holders) {
    const w = bySlide.map((b) => plain(b.html).length + b.title.length + 90), total = w.reduce((t, v) => t + v, 0) || 1, parts = Array.from({ length: holders }, () => []);
    let cum = 0; bySlide.forEach((b, i) => { parts[Math.min(holders - 1, Math.floor((cum + w[i] / 2) / (total / holders)))].push(b); cum += w[i]; });
    let part = 0;
    slides = slides.replace(/<!--SLIDE_SOURCES-->/g, () => parts[part++].map((b) => `<li><b>${String(b.n).padStart(2, "0")}</b> <span>${b.title}</span> ${b.html}</li>`).join("\n"));
  } else if (bySlide.length) errors.push('slides have <p class="src"> lines but no slide holds <!--SLIDE_SOURCES--> (see slides/sources.html)');

  // ---------- brand: one logo symbol, a small copy in every slide footer ----------
  const brand = cfg.brand || {};
  if (brand.logo && has(brand.logo)) {
    const svg = read(brand.logo).trim(), vb = (svg.match(/viewBox="([^"]+)"/) || [])[1] || "0 0 200 60";
    const inner = svg.replace(/^[\s\S]*?<svg[^>]*>|<\/svg>\s*$/g, "");
    slides = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><symbol id="brandlogo" viewBox="${vb}">${inner}</symbol></svg>\n` + slides.replace(/<\/section>/g, `<span class="brand" aria-hidden="true"><svg viewBox="${vb}"><use href="#brandlogo"/></svg></span></section>`);
  } else if (brand.name) slides = slides.replace(/<\/section>/g, `<span class="brand brand-text" aria-hidden="true">${esc(brand.name)}</span></section>`);

  // ---------- generated figures and logos: every file in the folder is available, nothing to register ----------
  const SCN = {};
  if (has("anatomy/scenes")) for (const f of fs.readdirSync(rel("anatomy/scenes"))) if (f.endsWith(".data.json")) { const j = JSON.parse(read(`anatomy/scenes/${f}`)); SCN[f.replace(".data.json", "")] = { svg: j.svg, data: j.data }; }
  const LOGOS = {};
  if (has("assets/logos")) for (const f of fs.readdirSync(rel("assets/logos"))) if (/\.(svg|png|webp)$/i.test(f)) LOGOS[f.replace(/\.[a-z]+$/i, "")] = dataUri(rel(`assets/logos/${f}`));
  for (const m of slides.matchAll(/SCN\.([A-Za-z0-9_]+)/g)) if (!SCN[m[1]]) errors.push(`SCN.${m[1]} is used but anatomy/scenes/${m[1]}.data.json does not exist (run its .mjs file)`);

  // ---------- css + js ----------
  // "motion": "full" turns every reduced-motion media query into one that never matches; engine.js reads the same setting
  const full = cfg.motion !== "respect";
  const motion = (t) => (full ? t.replace(/\(prefers-reduced-motion:\s*reduce\)/g, "not all") : t);
  // the kit's stylesheet goes first, so styles/style.css can set the figures' tones (.iso[data-theme="light"])
  const css = motion([has("anatomy/kit/iso.css") ? read("anatomy/kit/iso.css") : "", ...cfg.styles.map(read)].join("\n"));
  for (const n of cfg.scripts) if (!has(`src/js/${n}.js`)) errors.push(`src/js/${n}.js is listed in deck.config.json "scripts" but not found`);
  const consts = (presenter) => `const MOTION = ${JSON.stringify(full ? "full" : "respect")};\nconst CURRENCY = ${JSON.stringify(cfg.currency ?? "$")};\nconst HAS_PRESENTER = ${presenter};\nconst SCN = ${JSON.stringify(SCN)};\nconst LOGOS = ${JSON.stringify(LOGOS)};\n`;
  const deckJs = motion(cfg.scripts.filter((n) => has(`src/js/${n}.js`)).map((n) => read(`src/js/${n}.js`)).join("\n"));
  for (const m of deckJs.matchAll(/SCN\.([A-Za-z0-9_]+)/g)) if (!SCN[m[1]]) errors.push(`SCN.${m[1]} is used in a script but anatomy/scenes/${m[1]}.data.json does not exist (run its .mjs file)`);
  for (const m of deckJs.matchAll(/H\.([A-Za-z0-9_]+)\s*=\s*\{/g)) if (!seen.has(m[1])) advice.push(`a script defines H.${m[1]} but no slide in the deck has that id`);

  const bodyTop = read("src/shell/body-top.html"), bodyBottom = read("src/shell/body-bottom.html");
  const body = (s) => bodyTop + s + bodyBottom;
  const baseCss = ":root{color-scheme:light}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}";
  const localFonts = has("public/fonts/fonts.css");
  const googleFonts = cfg.fonts?.google ? `<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="stylesheet" href="${esc(cfg.fonts.google)}">` : "";
  if (!localFonts && cfg.fonts?.google) advice.push("fonts load from Google Fonts, so offline.html needs internet for its typefaces: run `npm run fonts` once to embed them");
  const head = (fontsTag) => `<!doctype html>\n<html lang="${cfg.lang || "en"}">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n${cfg.noindex === false ? "" : '<meta name="robots" content="noindex,nofollow">\n'}<meta name="description" content="${esc(cfg.description || "")}">\n<title>${esc(cfg.title)}</title>\n${fontsTag}\n<style>${baseCss}</style>\n<style>\n${css}\n</style>\n</head>\n<body>\n`;

  // assets/… references become data URIs where everything must live in one file
  const inlineAssets = (html) => html.replace(/(["'(])assets\/([^"')?#]+)/g, (all, q, f) => (has(`assets/${f}`) ? q + dataUri(rel(`assets/${f}`)) : all));

  const web = head(localFonts ? '<link rel="stylesheet" href="fonts/fonts.css">' : googleFonts) + body(slides) + `<script>\n${consts(notes)}${deckJs}\n</script>\n</body>\n</html>\n`;
  const fontsCss = localFonts ? read("public/fonts/fonts.css").replace(/url\(([^)]+\.woff2)\)/g, (a, f) => `url(${dataUri(rel(`public/fonts/${f}`))})`) : "";
  const offline = head(localFonts ? `<style>${fontsCss}</style>` : googleFonts) + body(inlineAssets(slides)) + `<script>\n${consts(notes)}${deckJs}\n</script>\n</body>\n</html>\n`;

  // ---------- presenter window: the notes of each slide, split by press ----------
  const PRESENTER = { title: cfg.title, slides: index.map((s, i) => ({ id: s.id, n: s.n, title: s.title, steps: s.steps, notes: notesByPress(sections[i]) })) };
  const presenter = notes && has("src/presenter/presenter.html") ? read("src/presenter/presenter.html").replace("/*PRESENTER_DATA*/", () => `const PRESENTER = ${JSON.stringify(PRESENTER).replace(/</g, "\\u003c")};`) : null;

  // ---------- write ----------
  const dist = out ? path.resolve(out) : process.env.DECK_OUT ? path.resolve(process.env.DECK_OUT) : rel("dist");
  try { fs.rmSync(dist, { recursive: true, force: true }); } catch { /* some synced folders refuse deletes: files are overwritten instead */ }
  fs.mkdirSync(dist, { recursive: true });
  const copyDir = (from, to) => {
    fs.mkdirSync(to, { recursive: true });
    for (const e of fs.readdirSync(from, { withFileTypes: true })) {
      if (e.name.startsWith(".") || e.name.endsWith(".md")) continue;
      const a = path.join(from, e.name), b = path.join(to, e.name);
      if (e.isDirectory()) copyDir(a, b); else fs.copyFileSync(a, b);
    }
  };
  if (has("public")) copyDir(rel("public"), dist);
  if (has("assets")) copyDir(rel("assets"), path.join(dist, "assets"));
  fs.writeFileSync(path.join(dist, "index.html"), web);
  fs.writeFileSync(path.join(dist, "offline.html"), offline);
  if (presenter) fs.writeFileSync(path.join(dist, "presenter.html"), presenter);
  fs.writeFileSync(rel("SLIDES.md"), ["# Slide index", "", "Generated by `npm run build` from deck.config.json. Edit the file in the last column.", "", "| # | Chapter | Title | Presses | File |", "|---|---|---|---|---|",
    ...index.map((s) => `| ${s.n} | ${s.chapter} | ${s.title.replace(/\|/g, "\\|")} | ${s.steps} | slides/${s.id}.html |`), ""].join("\n"));

  const kb = (s) => (Buffer.byteLength(s) / 1024).toFixed(0) + " KB";
  if (!quiet) {
    const d = path.relative(ROOT, dist) || ".";
    console.log(`built ${index.length} slides in ${Date.now() - t0} ms`);
    console.log(`  ${d}/index.html      ${kb(web)}  (web)`);
    console.log(`  ${d}/offline.html    ${kb(offline)}  (single file${localFonts ? ", works offline" : ""})`);
    if (presenter) console.log(`  ${d}/presenter.html  ${kb(presenter)}  (presenter window, key P)`);
    if (!notes) console.log("  speaker notes left out (--no-notes)");
  }
  for (const p of errors) console.warn("  ✗ " + p);
  for (const p of advice) console.warn("  · " + p);
  return { ok: errors.length === 0, errors, advice, index };
}

// notes as one HTML string per press: a <p data-press="k"> starts press k, and paragraphs after it stay with it
function notesByPress(sec) {
  const m = sec.match(/<aside class="notes">([\s\S]*?)<\/aside>/);
  if (!m) return [];
  const out = []; let k = 0;
  for (const el of m[1].matchAll(/<(h4|p)([^>]*)>([\s\S]*?)<\/\1>/g)) {
    const p = el[2].match(/data-press="(\d+)"/); if (p) k = +p[1];
    out[k] = (out[k] || "") + `<${el[1]}>${el[3]}</${el[1]}>`;
  }
  return Array.from(out, (v) => v || "");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const o = process.argv.indexOf("--out");
  const r = build({ quiet: process.argv.includes("--quiet"), out: o > 0 ? process.argv[o + 1] : null, notes: !process.argv.includes("--no-notes") });
  if (!r.ok) process.exit(1);
}
