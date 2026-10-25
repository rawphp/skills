// Shape example for a project's walks.mjs (copy into the project folder; never keep product selectors in the skill).
// Each export is one walk; ALL lists them in recording order. Run: node "$SK/walk/run.mjs" [--restore] [w1 ...]
import path from "node:path"
import { pathToFileURL } from "node:url"
const { walk } = await import(pathToFileURL(path.join(process.env.SK, "walk/harness.mjs")).href)

export const w1 = () => walk("w1-help", { identity: "demo-user" /* seeded under WALK_IDENTITY_KEY when set */ }, async (h) => {
  const { page, say, click, go, pause } = h
  await go("/help", "Help")
  await say("One sentence on what this walk proves.")
  await pause(2000)
  await click(page.getByRole("link", { name: "Help" }), { settle: 1500 })
  await say("A second sentence, said while the control is on screen.")
  await pause(3000)
  await page.keyboard.press("Escape")
})

export const ALL = { w1 }
