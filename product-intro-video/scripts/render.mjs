// Renders timeline.json through comp.html. Run in the video project dir.
//   node render.mjs --at 12.3,45     preview stills -> preview/t12.3.jpg ...
//   node render.mjs [--workers 4]    full render -> render/video.mp4 (silent; mix.py adds sound)
// A cards.js in the project dir is loaded into the compositor to add card templates.
import fs from 'node:fs';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const COMP = fileURLToPath(new URL('./comp.html', import.meta.url));
const tl = JSON.parse(fs.readFileSync('timeline.json'));
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const browser = await chromium.launch({ channel: 'chrome', args: ['--allow-file-access-from-files'] });
async function newPage() {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('pageerror', e.message));
  await page.goto('file://' + COMP);
  if (fs.existsSync('cards.js')) await page.addScriptTag({ path: path.resolve('cards.js') });
  await page.evaluate((t) => window.setup(t), tl);
  return page;
}
if (opt('--at')) {
  fs.mkdirSync('preview', { recursive: true });
  const page = await newPage();
  for (const t of opt('--at').split(',').map(Number)) {
    await page.evaluate((t) => window.renderAt(t), t);
    await page.screenshot({ path: `preview/t${t.toFixed(1)}.jpg`, type: 'jpeg', quality: 85 });
  }
  console.log('preview/ written');
  await browser.close(); process.exit(0);
}
const N = Number(opt('--workers', 4)); const total = tl.frames; const per = Math.ceil(total / N);
fs.mkdirSync('render', { recursive: true });
const t0 = Date.now();
await Promise.all([...Array(N).keys()].map(async (w) => {
  const a = w * per, b = Math.min(total, a + per); const page = await newPage();
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(tl.fps), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(tl.fps), `render/seg${w}.mp4`], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let f = a; f < b; f++) {
    await page.evaluate((t) => window.renderAt(t), f / tl.fps);
    const buf = await page.screenshot({ type: 'jpeg', quality: 94 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (w === 0 && (f - a) % 300 === 0) console.log(`frames ${f - a}/${b - a} per worker, ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end(); await new Promise((r) => ff.on('close', r));
}));
await browser.close();
fs.writeFileSync('render/list.txt', [...Array(N).keys()].map((w) => `file 'seg${w}.mp4'`).join('\n'));
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', 'render/list.txt', '-c', 'copy', 'render/video.mp4']);
console.log(`render/video.mp4 in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
