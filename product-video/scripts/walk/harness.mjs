// The walk recorder: one context per walk with recordVideo, a visible cursor that
// follows the mouse, a caption pill that survives navigation, and clicks that glide.
// Configured by the environment, never by product paths in this file:
//   WALK_BASE     the app's base URL (a private demo stack, never the dev server)
//   WALK_OUT      where the walk .webm/.mp4/-sheet.png files go
//   WALK_FIXTURE  a file the walks upload (e.g. an import CSV)
//   WALK_PROJECT  the frontend dir whose node_modules/playwright is used
//   WALK_IDENTITY_KEY  optional: the sessionStorage key the app reads its demo identity from; walk(name, { identity }) seeds it
// The project's walks.mjs imports { walk } from this file; run.mjs runs them.
import { createRequire } from "node:module"
import { mkdirSync, renameSync, existsSync } from "node:fs"
import { execFileSync } from "node:child_process"
import path from "node:path"

const need = (k) => { const v = process.env[k]; if (!v) { console.error(`walk harness: set ${k} (see the header of walk/harness.mjs)`); process.exit(2) } return v }
const require = createRequire(path.join(need("WALK_PROJECT"), "package.json"))
const { chromium } = require("playwright")

export const BASE = need("WALK_BASE")
export const OUT = need("WALK_OUT")
export const FIXTURE = need("WALK_FIXTURE")

const OVERLAY = `(() => {
  const KEY = "__walkCaption";
  const ready = () => {
    if (!document.body || document.getElementById("__walk-cursor")) return;
    const style = document.createElement("style");
    style.textContent = "nextjs-portal{display:none!important}" +
      "#__walk-cursor{position:fixed;left:0;top:0;width:22px;height:22px;pointer-events:none;z-index:2147483647;transform:translate(-3px,-2px);transition:transform .05s linear;filter:drop-shadow(0 1px 2px rgba(0,0,0,.5))}" +
      "#__walk-cursor.__pulse::after{content:'';position:absolute;left:-14px;top:-14px;width:50px;height:50px;border-radius:50%;background:rgba(13,148,136,.28);animation:__walkpulse .45s ease-out}" +
      "@keyframes __walkpulse{from{transform:scale(.3);opacity:1}to{transform:scale(1);opacity:0}}" +
      "#__walk-caption{position:fixed;left:50%;bottom:26px;transform:translateX(-50%);max-width:70vw;background:rgba(17,24,39,.92);color:#fff;font:500 17px/1.35 system-ui,-apple-system,Segoe UI,sans-serif;padding:10px 18px;border-radius:999px;z-index:2147483646;pointer-events:none;box-shadow:0 6px 24px rgba(0,0,0,.28);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
      "#__walk-caption:empty{display:none}";
    document.head.appendChild(style);
    const c = document.createElement("div"); c.id = "__walk-cursor";
    c.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M4 2l16 9-7 1.5L9.5 20z" fill="#111827" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    document.body.appendChild(c);
    const cap = document.createElement("div"); cap.id = "__walk-caption";
    try { cap.textContent = sessionStorage.getItem(KEY) || ""; } catch {}
    document.body.appendChild(cap);
    let x = 0, y = 0; try { const p = JSON.parse(sessionStorage.getItem("__walkPos") || "null"); if (p) { x = p.x; y = p.y; } } catch {}
    c.style.left = x + "px"; c.style.top = y + "px";
    window.addEventListener("mousemove", (e) => { c.style.left = e.clientX + "px"; c.style.top = e.clientY + "px"; try { sessionStorage.setItem("__walkPos", JSON.stringify({ x: e.clientX, y: e.clientY })); } catch {} }, true);
    window.addEventListener("mousedown", () => { c.classList.remove("__pulse"); void c.offsetWidth; c.classList.add("__pulse"); }, true);
    window.__walkSay = (t) => { cap.textContent = t; try { sessionStorage.setItem(KEY, t); } catch {} };
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready); else ready();
  new MutationObserver(ready).observe(document.documentElement, { childList: true });
})()`

export async function walk(name, { identity, width = 1440, height = 900 }, steps) {
  mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width, height }, recordVideo: { dir: path.join(OUT, ".raw"), size: { width, height } }, locale: "en-AU", timezoneId: "Australia/Sydney" })
  // The demo identity, set once (never on a later navigation: an in-app switch must stick).
  const identityKey = process.env.WALK_IDENTITY_KEY
  if (identity && identityKey) await context.addInitScript(([k, who]) => { try { if (!sessionStorage.getItem(k)) sessionStorage.setItem(k, who) } catch {} }, [identityKey, identity])
  await context.addInitScript(OVERLAY)
  const page = await context.newPage()
  page.setDefaultTimeout(60_000)
  const t0 = Date.now()
  const h = helpers(page)
  try {
    await steps(h)
  } catch (e) {
    console.error(`[${name}] failed:`, e.message)
    await page.screenshot({ path: path.join(OUT, `${name}-FAILED.png`), fullPage: true }).catch(() => {})
    throw e
  } finally {
    const video = page.video()
    await context.close()
    const raw = await video.path()
    const webm = path.join(OUT, `${name}.webm`)
    if (existsSync(webm)) renameSync(webm, webm + ".old")
    renameSync(raw, webm)
    try {
      execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", webm, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-crf", "22", path.join(OUT, `${name}.mp4`)])
      execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", webm, "-vf", "fps=1/6,scale=480:-1,tile=4x6", path.join(OUT, `${name}-sheet.png`)])
    } catch (e) { console.error("ffmpeg:", e.message) }
    await browser.close()
    console.log(`[${name}] ${Math.round((Date.now() - t0) / 1000)}s → ${webm}`)
  }
}

function helpers(page) {
  let pos = { x: 20, y: 20 }
  const say = async (text) => { await page.evaluate((t) => window.__walkSay?.(t), text).catch(() => {}); await page.waitForTimeout(900) }
  const glide = async (x, y) => {
    const steps = 14
    for (let i = 1; i <= steps; i++) {
      const k = 1 - Math.pow(1 - i / steps, 3)
      await page.mouse.move(pos.x + (x - pos.x) * k, pos.y + (y - pos.y) * k)
      await page.waitForTimeout(16)
    }
    pos = { x, y }
  }
  const click = async (locator, { pause = 500, settle = 700 } = {}) => {
    await locator.scrollIntoViewIfNeeded()
    const b = await locator.boundingBox()
    if (!b) throw new Error("no box for " + String(locator))
    await glide(b.x + b.width / 2, b.y + b.height / 2)
    await page.waitForTimeout(pause)
    await page.mouse.down(); await page.waitForTimeout(70); await page.mouse.up()
    await page.waitForTimeout(settle)
  }
  const type = async (locator, text, { delay = 28 } = {}) => {
    await click(locator, { settle: 200 })
    await locator.fill("")
    await locator.pressSequentially(text, { delay })
    await page.waitForTimeout(400)
  }
  const go = async (url, heading) => {
    await page.goto(url.startsWith("http") ? url : BASE + url)
    await page.waitForLoadState("networkidle", { timeout: 90_000 }).catch(() => {})
    if (heading) await page.getByRole("heading", { level: 1 }).filter({ hasText: heading }).first().waitFor({ timeout: 60_000 })
    await page.waitForTimeout(900)
  }
  const pause = (ms) => page.waitForTimeout(ms)
  // Product-specific moves (a demo-user switcher, a login) live in the project's walks.mjs, built from page, click and glide.
  return { page, say, click, type, go, pause, glide }
}
