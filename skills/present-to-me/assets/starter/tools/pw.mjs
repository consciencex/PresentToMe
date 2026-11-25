// Playwright, wherever it is installed: in this project, or in the folder named by PLAYWRIGHT_HOME
// (handy when several decks share one install:  PLAYWRIGHT_HOME=~/decks/first npm run check).
import { createRequire } from "node:module";
import path from "node:path";

export async function loadChromium() {
  try { return (await import("playwright")).chromium; } catch { /* try the shared install */ }
  if (process.env.PLAYWRIGHT_HOME) {
    try { return createRequire(path.join(path.resolve(process.env.PLAYWRIGHT_HOME), "package.json"))("playwright").chromium; } catch { /* reported below */ }
  }
  console.error("Playwright is not installed. Run:  npm i -D playwright && npx playwright install chromium");
  process.exit(2);
}
// where the build goes: dist/, or the folder named by DECK_OUT (so two checks can run at once without sharing dist/)
export const outDir = (root) => (process.env.DECK_OUT ? path.resolve(process.env.DECK_OUT) : path.join(root, "dist"));

// the file a request names inside root. null for a malformed path and for one that climbs out of root
export function fileFor(root, reqUrl) {
  let p;
  try { p = decodeURIComponent(String(reqUrl).split("?")[0]); } catch { return null; }
  const f = path.resolve(root, "." + path.posix.normalize("/" + p));
  return f === root || f.startsWith(root + path.sep) ? f : null;
}
