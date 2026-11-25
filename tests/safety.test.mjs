// Safety checks for the starter's tools.  node --test tests/safety.test.mjs
// Each test scaffolds a deck into a temporary folder with new-deck.mjs and runs the real tools there.
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NEW_DECK = path.join(REPO, "skills/present-to-me/scripts/new-deck.mjs");
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), "ptm-"));
const KINDS = ["blank", "explainer", "versus", "decision"];
const deck = (kind = "blank") => { const d = path.join(tmp(), "deck"); execFileSync(process.execPath, [NEW_DECK, d, "--kind", kind], { stdio: "pipe" }); return d; };
const build = (d, ...args) => spawnSync(process.execPath, ["tools/build.mjs", "--quiet", ...args], { cwd: d, encoding: "utf8" });

test("the build refuses a folder that holds files it did not write, and touches none of them", () => {
  const d = deck("decision"), out = tmp();
  fs.writeFileSync(path.join(out, "keep.txt"), "mine");
  fs.writeFileSync(path.join(out, "index.html"), "my own page");
  const r = build(d, "--out", out);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /did not write/);
  assert.equal(fs.readFileSync(path.join(out, "keep.txt"), "utf8"), "mine");
  assert.equal(fs.readFileSync(path.join(out, "index.html"), "utf8"), "my own page");
});

test("the build refuses its own folder under another name (a symlink)", () => {
  const d = deck("decision"), link = path.join(tmp(), "alias");
  fs.symlinkSync(d, link);
  assert.equal(build(d, "--out", link).status, 1);
  assert.equal(build(d, "--out", path.join(link, "slides")).status, 1);
  assert.ok(fs.existsSync(path.join(d, "slides/title.html")));
});

test("the public build has no notes, and checking or rebuilding the deck does not put them back", () => {
  const d = deck("decision"), pub = path.join(d, "public-build");
  const count = () => (fs.readFileSync(path.join(pub, "index.html"), "utf8").match(/<aside\b|Say nothing\. Let it play\./g) || []).length;
  assert.equal(build(d, "--no-notes", "--out", "public-build").status, 0);
  assert.equal(count(), 0);
  assert.equal(build(d).status, 0);
  assert.ok(fs.existsSync(path.join(d, "dist/presenter.html")));
  assert.equal(count(), 0);
  assert.ok(!fs.existsSync(path.join(pub, "presenter.html")));
});

test("a build without notes drops notes however the tag is written, and HTML comments", () => {
  const d = deck("decision"), f = path.join(d, "slides/qa.html");
  fs.writeFileSync(f, fs.readFileSync(f, "utf8")
    .replace('<aside class="notes">', '<!-- private remark one --><aside class="notes" lang="th">')
    .replace("</section>", '<aside lang="en" class="extra notes"><p>private remark two</p></aside></section>'));
  assert.equal(build(d, "--no-notes", "--out", "public-build").status, 0);
  const html = fs.readFileSync(path.join(d, "public-build/index.html"), "utf8");
  for (const s of ["private remark one", "private remark two", "Reference page. Click a question"]) assert.ok(!html.includes(s), `"${s}" is still in the page`);
});

test("a slide cannot pull a file from outside the assets folder into the page", () => {
  const d = deck("decision"), f = path.join(d, "slides/qa.html");
  fs.writeFileSync(path.join(d, ".env.local"), "TOKEN=do-not-embed");
  fs.writeFileSync(f, fs.readFileSync(f, "utf8").replace('<div class="qa-grid', '<img src="assets/../.env.local" alt=""><div class="qa-grid'));
  const r = build(d);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /outside the assets folder/);
});

test("a rebuild removes a file its earlier run wrote and the deck no longer has", () => {
  const d = deck("decision");
  fs.writeFileSync(path.join(d, "public/old-chart.png"), "x");
  assert.equal(build(d).status, 0);
  assert.ok(fs.existsSync(path.join(d, "dist/old-chart.png")));
  fs.rmSync(path.join(d, "public/old-chart.png"));
  assert.equal(build(d).status, 0);
  assert.ok(!fs.existsSync(path.join(d, "dist/old-chart.png")));
});

test("a manifest that names paths outside the output folder deletes nothing there", () => {
  const d = deck("decision"), out = path.join(tmp(), "out"), victim = path.join(path.dirname(out), "victim.txt");
  fs.mkdirSync(out); fs.writeFileSync(victim, "mine");
  fs.writeFileSync(path.join(out, ".deck-build.json"), JSON.stringify(["../victim.txt", victim, ".", ""]));
  assert.equal(build(d, "--out", out).status, 0);
  assert.equal(fs.readFileSync(victim, "utf8"), "mine");
});

test("the font tool refuses a link that is not https", () => {
  const d = deck();
  const cfgFile = path.join(d, "deck.config.json"), cfg = JSON.parse(fs.readFileSync(cfgFile, "utf8"));
  cfg.fonts = { google: "http://fonts.googleapis.com/css2?family=X" };
  fs.writeFileSync(cfgFile, JSON.stringify(cfg));
  assert.equal(spawnSync(process.execPath, ["tools/fonts.mjs"], { cwd: d, encoding: "utf8" }).status, 1);
});

test("the build refuses an output folder that is the deck or one of its source folders", () => {
  const d = deck("decision");
  for (const bad of [".", "slides", "src/js", "..", "assets/logos"]) {
    const r = build(d, "--out", bad);
    assert.equal(r.status, 1, `--out ${bad} should be refused`);
    assert.match(r.stderr, /output folder/);
  }
  assert.ok(fs.existsSync(path.join(d, "slides/title.html")));
});

test("a build with --no-notes carries no speaker notes and no presenter window", () => {
  const d = deck("decision");
  assert.equal(build(d).status, 0);
  assert.ok(fs.existsSync(path.join(d, "dist/presenter.html")));
  assert.equal(build(d, "--no-notes").status, 0);
  assert.ok(!fs.existsSync(path.join(d, "dist/presenter.html")));
  const html = fs.readFileSync(path.join(d, "dist/index.html"), "utf8") + fs.readFileSync(path.join(d, "dist/offline.html"), "utf8");
  assert.ok(!html.includes('<aside class="notes">'));
  assert.ok(!html.includes("Say nothing. Let it play."), "a sentence from the film slide's notes is still in the page");
});

test("the servers resolve a request only inside the folder they serve", async () => {
  const d = deck();
  const { fileFor } = await import(pathToFileURL(path.join(d, "tools/pw.mjs")).href);
  const root = path.join(d, "dist");
  assert.equal(fileFor(root, "/index.html"), path.join(root, "index.html"));
  assert.equal(fileFor(root, "/"), root);
  assert.equal(fileFor(root, "/a/../b.png?x=1"), path.join(root, "b.png"));
  for (const bad of ["/../package.json", "/..%2f..%2fsecret", "/%2e%2e/%2e%2e/etc/passwd", "/../dist-other/x"]) {
    const f = fileFor(root, bad);
    assert.ok(f === null || f === root || f.startsWith(root + path.sep), `${bad} resolved to ${f}`);
  }
  assert.equal(fileFor(root, "/%E0%A4%A"), null);
});

test("the font tool fetches from Google Fonts only", () => {
  const d = deck();
  const cfgFile = path.join(d, "deck.config.json"), cfg = JSON.parse(fs.readFileSync(cfgFile, "utf8"));
  cfg.fonts = { google: "https://example.com/css2?family=X" };
  fs.writeFileSync(cfgFile, JSON.stringify(cfg));
  const r = spawnSync(process.execPath, ["tools/fonts.mjs"], { cwd: d, encoding: "utf8" });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /fonts\.googleapis\.com/);
  assert.ok(!fs.existsSync(path.join(d, "public/fonts/fonts.css")));
});

test("new-deck never writes into a folder that already has files", () => {
  for (const kind of KINDS) {
    const dir = tmp();
    fs.writeFileSync(path.join(dir, "notes.txt"), "mine");
    const r = spawnSync(process.execPath, [NEW_DECK, dir, "--kind", kind], { encoding: "utf8" });
    assert.equal(r.status, 1);
    assert.match(r.stderr, /not empty/);
    assert.deepEqual(fs.readdirSync(dir), ["notes.txt"]);
  }
});

test("new-deck with no kind, or an unknown one, lists the kinds and writes nothing", () => {
  for (const flags of [[], ["--kind", "poster"]]) {
    const dir = path.join(tmp(), "deck");
    const r = spawnSync(process.execPath, [NEW_DECK, dir, ...flags], { encoding: "utf8" });
    assert.equal(r.status, 1);
    for (const kind of KINDS) assert.match(r.stderr, new RegExp(`\\b${kind}\\b`));
    assert.ok(!fs.existsSync(dir));
  }
});

test("every kind of deck builds with no error and leaves no file out of the deck", () => {
  for (const kind of KINDS) {
    const d = deck(kind), r = spawnSync(process.execPath, ["tools/build.mjs"], { cwd: d, encoding: "utf8" });
    const said = r.stdout + r.stderr;
    assert.equal(r.status, 0, `${kind}: ${said}`);
    assert.ok(!/✗/.test(said), `${kind}: ${said}`);
    assert.ok(!/is not in deck\.config\.json|but no slide in the deck has that id/.test(said), `${kind}: ${said}`);
  }
});

test("a deck started from an example records the example's titles, and a blank deck records none", () => {
  for (const kind of KINDS) {
    const lock = path.join(deck(kind), ".recipe.json");
    if (kind === "blank") { assert.ok(!fs.existsSync(lock)); continue; }
    const { titles } = JSON.parse(fs.readFileSync(lock, "utf8"));
    assert.ok(Object.keys(titles).length >= 5, `${kind}: ${JSON.stringify(titles)}`);
    assert.ok(!("sources" in titles) && !("qa" in titles));
  }
});
