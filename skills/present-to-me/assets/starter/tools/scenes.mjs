// Regenerate every anatomy figure.  npm run scenes  [-- <name> …]
// Runs each anatomy/scenes/<name>.mjs, which writes <name>.data.json beside it. The build picks up every .data.json as SCN.<name>.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./build.mjs";
const dir = path.join(ROOT, "anatomy/scenes"), only = process.argv.slice(2);
const SKIP = new Set(["scene.mjs", "preview.mjs"]);
let bad = 0;
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".mjs") && !SKIP.has(f) && (!only.length || only.includes(f.replace(".mjs", ""))))) {
  const r = spawnSync(process.execPath, [path.join(dir, f)], { stdio: "inherit" });
  if (r.status !== 0) { bad++; console.error(`  ✗ ${f} failed`); }
}
process.exit(bad ? 1 : 0);
