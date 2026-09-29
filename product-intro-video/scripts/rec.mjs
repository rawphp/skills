// Records each footage scene of a video project as a true-2x screenshot stream, paced to its voice-over words.
// Run from the video project dir (video.json, script.json, scenes.mjs, audio/<id>.json).
//   node rec.mjs [id ...]         record (default: every scene in scenes.mjs)
//   node rec.mjs --dry [id ...]   walk the beats with no capture; screenshot to footage/<id>-dry.png
// Output per scene: footage/<id>/f00000.jpg ... + meta.json (frames, cursor path, clicks, typing, cam, rings, stickers, sfx).
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { chromium } from 'playwright';

export const LEAD = 0.6;   // VO starts this far into a scene
const TAIL = 0.8;          // hold after the VO ends
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const now = () => Date.now() / 1000;
const ease = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9-]/g, '');

export class Rec {
  constructor(page, id, { dry = false } = {}) {
    this.page = page; this.id = id; this.dry = dry;
    const vo = JSON.parse(fs.readFileSync(`audio/${id}.json`));
    this.words = vo.words; this.voEnd = vo.end;
    this.dir = `footage/${id}`;
    if (!dry) { fs.rmSync(this.dir, { recursive: true, force: true }); fs.mkdirSync(this.dir, { recursive: true }); }
    this.frames = []; this.late = [];
    this.ev = { path: [], clicks: [], typing: [], cam: [], rings: [], stickers: [], sfx: [] };
    this.pos = { x: 1100, y: 620 };
  }
  t() { return now() - this.t0; }
  async start() {
    await this.page.mouse.move(this.pos.x, this.pos.y);
    this.t0 = now();
    this.ev.path.push([0, this.pos.x, this.pos.y]);
    if (this.dry) return;
    // Screencast frames arrive at CSS size whatever the scale, so poll 2x screenshots (~15 fps, crisp when zoomed).
    this.cdp = await this.page.context().newCDPSession(this.page);
    let n = 0; this.capturing = true;
    this.loop = (async () => {
      while (this.capturing) {
        const a = now();
        const r = await this.cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 88, optimizeForSpeed: true, clip: { x: 0, y: 0, width: 1920, height: 1080, scale: 2 } });
        const file = `f${String(n++).padStart(5, '0')}.jpg`;
        fs.writeFileSync(`${this.dir}/${file}`, Buffer.from(r.data, 'base64'));
        this.frames.push({ t: Math.max(0, (a + now()) / 2 - this.t0), file });
      }
    })();
    await sleep(100);
  }
  word(w, n = 1) {
    const hits = this.words.filter((x) => norm(x.w) === norm(w));
    if (hits.length < n) throw new Error(`${this.id}: no word "${w}" #${n} in the VO`);
    return hits[n - 1];
  }
  // Wait until the narrator reaches word w (nth occurrence, punctuation ignored), plus off seconds.
  async at(w, n = 1, off = 0) {
    const target = LEAD + this.word(w, n).s + off;
    const wait = target - this.t();
    if (wait > 0) await sleep(wait * 1000);
    else if (wait < -0.4) { this.late.push(`${(-wait).toFixed(2)}s at "${w}"`); console.log(`  ${this.id}: late ${(-wait).toFixed(2)}s at "${w}"`); }
  }
  async wait(s) { await sleep(s * 1000); }
  async rect(loc) {
    await loc.waitFor({ state: 'visible', timeout: 15000 });
    return loc.boundingBox();
  }
  // Smoothly scroll the element's scroll container so it sits in view (top = target y).
  async ensureVisible(loc, { top = 180, dur = 0.7 } = {}) {
    const r = await this.rect(loc);
    if (r.y >= 110 && r.y + r.height <= 1000) return r;
    await this.scrollBy(loc, r.y - top, dur);
    return this.rect(loc);
  }
  async scrollBy(loc, dy, dur = 0.8) {
    const h = await loc.elementHandle();
    await this.page.evaluate(async ({ el, dy, dur }) => {
      const scroller = (() => {
        for (let n = el?.parentElement; n; n = n.parentElement) {
          const s = getComputedStyle(n);
          if (/(auto|scroll)/.test(s.overflowY) && n.scrollHeight > n.clientHeight + 2) return n;
        }
        return document.querySelector('main') || document.scrollingElement;
      })();
      const start = scroller.scrollTop; const t0 = performance.now();
      const e = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
      await new Promise((res) => {
        const step = (t) => { const p = Math.min(1, (t - t0) / dur); scroller.scrollTop = start + dy * e(p); p < 1 ? requestAnimationFrame(step) : res(); };
        requestAnimationFrame(step);
      });
    }, { el: h, dy, dur: dur * 1000 });
  }
  async move(target, { dur = 0.6, dx = 0, dy = 0 } = {}) {
    let x, y;
    if (target.x !== undefined && target.width === undefined) ({ x, y } = target);
    else {
      const r = target.width !== undefined ? target : await this.ensureVisible(target);
      x = r.x + r.width / 2; y = r.y + r.height / 2;
    }
    x += dx; y += dy;
    const from = { ...this.pos }; const t0 = now(); const steps = Math.max(2, Math.round(dur * 60));
    for (let i = 1; i <= steps; i++) {
      const p = ease(i / steps);
      const px = from.x + (x - from.x) * p, py = from.y + (y - from.y) * p;
      await this.page.mouse.move(px, py);
      this.ev.path.push([this.t(), px, py]);
      const due = t0 + (dur * i) / steps; const w = due - now(); if (w > 0) await sleep(w * 1000);
    }
    this.pos = { x, y };
  }
  async click(target, opts = {}) {
    await this.move(target, opts);
    await sleep(80);
    this.ev.clicks.push([this.t(), this.pos.x, this.pos.y]);
    await this.page.mouse.down(); await sleep(70); await this.page.mouse.up();
    await sleep(opts.after ?? 150);
  }
  async type(text, { delay = 55 } = {}) {
    const t0 = this.t();
    await this.page.keyboard.type(text, { delay });
    this.ev.typing.push([t0, this.t()]);
  }
  async selectAll() { await this.page.keyboard.press('ControlOrMeta+A'); }
  // Camera: zoom to fit a rect (viewport CSS px) or locator. zoom caps it; pad is breathing room around it.
  async cam(target, { dur = 0.9, zoom = 2.0, pad = 1.35, dx = 0, dy = 0, sfx = true } = {}) {
    const r = target.width !== undefined ? target : await this.rect(target);
    this.ev.cam.push({ t: this.t(), dur, rect: { x: r.x + dx, y: r.y + dy, w: r.width, h: r.height }, zoom, pad });
    if (sfx) this.ev.sfx.push({ t: this.t(), name: 'whoosh', vol: 0.11 });
  }
  camOut(dur = 0.9) { this.ev.cam.push({ t: this.t(), dur, full: true }); this.ev.sfx.push({ t: this.t(), name: 'whoosh', vol: 0.08 }); }
  async ring(target, { dur = 2.2, pad = 8 } = {}) {
    const r = target.width !== undefined ? target : await this.rect(target);
    this.ev.rings.push({ t: this.t(), dur, rect: { x: r.x - pad, y: r.y - pad, w: r.width + pad * 2, h: r.height + pad * 2 } });
  }
  // Sticky-note joke in screen space (1920x1080). An emoji-only text renders without the note.
  sticker(text, { x = 1500, y = 300, dur = 2.6, rot = -4, sfx = 'pop', size = 44 } = {}) {
    this.ev.stickers.push({ t: this.t(), dur, text, x, y, rot, size });
    if (sfx) this.ev.sfx.push({ t: this.t(), name: sfx, vol: 0.5 });
  }
  sfx(name, vol = 0.6) { this.ev.sfx.push({ t: this.t(), name, vol }); }
  async end() {
    const endAt = Math.max(this.t() + 0.5, LEAD + this.voEnd + TAIL);
    const w = endAt - this.t(); if (w > 0) await sleep(w * 1000);
    if (this.dry) return;
    this.capturing = false; await this.loop;
    const dur = this.t();
    fs.writeFileSync(`${this.dir}/meta.json`, JSON.stringify({ id: this.id, lead: LEAD, dur, frames: this.frames, ...this.ev }));
    console.log(`  ${this.id}: ${dur.toFixed(1)}s, ${this.frames.length} frames`);
  }
}

export async function openApp(app, { dsf = 1 } = {}) {
  const browser = await chromium.launch({ channel: 'chrome' });
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 }, deviceScaleFactor: dsf, colorScheme: 'light',
    ...(app.locale && { locale: app.locale }), ...(app.timezone && { timezoneId: app.timezone }),   // default: this machine's
  });
  await ctx.addInitScript(({ css, ls }) => {
    try { for (const [k, v] of Object.entries(ls)) localStorage.setItem(k, v); } catch {}
    const add = () => { const s = document.createElement('style'); s.textContent = css; document.documentElement.appendChild(s); };
    if (document.documentElement) add(); else document.addEventListener('DOMContentLoaded', add);
  }, { css: `*{scrollbar-width:none!important} ${app.hideCss || ''}`, ls: app.localStorage || {} });
  const page = await ctx.newPage();
  return { browser, page };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const cfg = JSON.parse(fs.readFileSync('video.json'));
  const { default: scenes } = await import(path.resolve('scenes.mjs'));
  const args = process.argv.slice(2); const dry = args.includes('--dry');
  const want = args.filter((a) => !a.startsWith('--')); const ids = want.length ? want : Object.keys(scenes);
  const reset = () => { if (cfg.reset?.cmd) { console.log('reset:', cfg.reset.cmd); execSync(cfg.reset.cmd, { cwd: cfg.reset.cwd || '.', stdio: 'ignore' }); } };
  if (ids.some((id) => (cfg.reset?.before || []).includes(id))) reset();
  const { browser, page } = await openApp(cfg.app, { dsf: 2 }); // 2x layout scale is what makes the 2x capture crisp
  const ctx = { base: cfg.app.base, goto: (p) => page.goto(cfg.app.base + p, { waitUntil: 'networkidle' }) };
  await ctx.goto(cfg.app.login || '/');
  await page.waitForTimeout(1500);
  let failed = 0;
  for (const id of ids) {
    const s = scenes[id];
    if (!s) throw new Error(`scenes.mjs has no scene ${id}`);
    console.log(dry ? 'dry' : 'scene', id);
    await s.setup(page, ctx);
    await page.waitForTimeout(1200);
    const r = new Rec(page, id, { dry });
    await r.start();
    try { await s.run(r, page, ctx); }
    catch (e) { failed++; console.error(`  ${id} FAILED: ${e.message.split('\n')[0]}`); fs.mkdirSync('footage', { recursive: true }); await page.screenshot({ path: `footage/${id}-fail.png` }); }
    await r.end();
    if (dry) { fs.mkdirSync('footage', { recursive: true }); await page.screenshot({ path: `footage/${id}-dry.png` }); console.log(`  ${id}: ok${r.late.length ? ', late ' + r.late.join(', ') : ''}`); }
  }
  await browser.close();
  if (dry && ids.some((id) => (cfg.reset?.before || []).includes(id))) reset();
  process.exit(failed ? 1 : 0);
}
