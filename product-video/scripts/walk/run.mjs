// Run in the project dir (it holds walks.mjs):  node "$SK/walk/run.mjs" [--restore] [w1 w2 ...]   (default: every walk, in order)
// --restore runs $WALK_RESTORE (e.g. a pg_restore of the seed dump) as a shell command first.
import { execSync } from "node:child_process"
import path from "node:path"
import { pathToFileURL } from "node:url"
const { ALL } = await import(pathToFileURL(path.join(process.cwd(), "walks.mjs")).href)

const args = process.argv.slice(2)
const restore = args.includes("--restore")
const names = args.filter((a) => !a.startsWith("--"))
const picked = names.length ? names : Object.keys(ALL)

if (restore) {
  if (!process.env.WALK_RESTORE) { console.error("--restore: set WALK_RESTORE to the restore command"); process.exit(2) }
  console.log("restoring the seeded database…")
  execSync(process.env.WALK_RESTORE, { stdio: "inherit", shell: "/bin/bash" })
}

let failed = 0
for (const n of picked) {
  if (!ALL[n]) { console.error("unknown walk", n); process.exit(2) }
  try { await ALL[n]() } catch { failed++ }
}
console.log(failed ? `${failed} walk(s) failed` : "all walks recorded")
process.exit(failed ? 1 : 0)
