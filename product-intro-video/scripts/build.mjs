// Builds timeline.json from video.json, script.json, audio/<id>.json and footage/<id>/meta.json.
// Run in the video project dir: node build.mjs
import fs from 'node:fs';
import path from 'node:path';

const LEAD = 0.6; const FPS = 30;
const cfg = JSON.parse(fs.readFileSync('video.json'));
const script = JSON.parse(fs.readFileSync('script.json'));
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9-]/g, '');
const vo = (id) => JSON.parse(fs.readFileSync(`audio/${id}.json`));

// Caption phrase replacements, e.g. {"R and D": "R&D"}: merge the spoken words into one written token.
const REPL = Object.entries(cfg.captions?.replace || {}).map(([k, v]) => [k.split(/\s+/).map(norm), v]);
function captionWords(words) {
  const out = [];
  for (let i = 0; i < words.length; i++) {
    const hit = REPL.find(([p]) => p.every((w, j) => words[i + j] && norm(words[i + j].w) === w));
    if (hit) {
      const last = words[i + hit[0].length - 1];
      out.push({ w: hit[1] + (last.w.match(/[^\w]+$/)?.[0] || ''), s: words[i].s, e: last.e });
      i += hit[0].length - 1;
    } else out.push(words[i]);
  }
  return out;
}
function captions(words, offset) {
  const chunks = []; let cur = [];
  for (const w of captionWords(words)) {
    cur.push(w);
    const text = cur.map((x) => x.w).join(' ');
    if (/[.?!]$/.test(w.w) || text.length > 44 || (/,$/.test(w.w) && text.length > 26)) { chunks.push(cur); cur = []; }
  }
  if (cur.length) chunks.push(cur);
  return chunks.map((c, i) => ({
    t0: offset + c[0].s,
    t1: offset + Math.min(c[c.length - 1].e + 0.35, chunks[i + 1] ? chunks[i + 1][0].s : 1e9),
    text: c.map((x) => x.w).join(' '),
  }));
}

const scenes = []; const sfx = []; const voice = []; const caps = [];
let t = 0;
for (const line of script) {
  const { id } = line; const v = vo(id);
  const words = v.words.map((w) => ({ ...w, s: w.s + LEAD, e: w.e + LEAD }));
  // A cue is seconds, a word, or {at: word, n, off}. Returns scene-local seconds.
  const cue = (ref) => {
    if (typeof ref === 'number') return ref;
    const r = typeof ref === 'string' ? { at: ref } : ref;
    if (typeof r.at === 'number') return r.at + (r.off || 0);
    const hit = words.filter((w) => norm(w.w) === norm(r.at))[(r.n || 1) - 1];
    if (!hit) throw new Error(`${id}: no word "${r.at}" #${r.n || 1} for a card cue`);
    return hit.s + (r.off || 0);
  };
  const resolve = (card) => card && JSON.parse(JSON.stringify(card), (k, val) =>
    val && typeof val === 'object' && !Array.isArray(val) && 'at' in val ? { ...val, t: cue(val) } : val);
  let s;
  if (line.card) {
    const card = resolve(line.card);
    s = { id, type: 'card', card, dur: LEAD + v.end + (card.hold ?? (card.scratch ? 1.1 : 0.9)) };
    if (card.scratch) card.scratchT = s.dur - 0.75;
  } else {
    const metaPath = `footage/${id}/meta.json`;
    if (!fs.existsSync(metaPath)) throw new Error(`${id}: no ${metaPath}. Record it (rec.mjs ${id}) or give it a card`);
    const m = JSON.parse(fs.readFileSync(metaPath));
    s = { id, type: 'footage', dir: path.resolve(`footage/${id}`), dur: m.dur, frames: m.frames, path: m.path, clicks: m.clicks, cam: m.cam, rings: m.rings, stickers: m.stickers };
    for (const c of m.clicks) sfx.push({ t: t + c[0], name: 'click', vol: 0.4 });
    for (const [a, b] of m.typing) sfx.push({ t: t + a, name: 'typing', vol: 0.28, len: Math.max(0.3, b - a + 0.1) });
    for (const e of m.sfx) sfx.push({ t: t + e.t, name: e.name, vol: e.vol });
    if (line.intro) { s.intro = resolve(line.intro); s.intro.untilT = cue(s.intro.until); }
  }
  s.start = t;
  const card = s.card || s.intro;
  for (const it of card?.items || []) if (it.t !== undefined) sfx.push({ t: t + it.t, name: 'pop', vol: 0.34 });
  if (card?.pill?.t !== undefined) sfx.push({ t: t + card.pill.t, name: 'ding', vol: 0.45 });
  if (s.card?.scratch) sfx.push({ t: t + s.card.scratchT, name: 'scratch', vol: 0.8 });
  for (const e of card?.sfx || []) sfx.push({ t: t + e.t, name: e.name, vol: e.vol ?? 0.5 });
  voice.push({ file: `audio/${id}.mp3`, t: t + LEAD });
  caps.push(...captions(v.words, t + LEAD));
  if (scenes.length) sfx.push({ t: t - 0.05, name: 'whoosh', vol: 0.2 });
  scenes.push(s); t += s.dur;
}
// End card after the last scene.
const last = scenes.at(-1);
if (cfg.end) {
  last.endAt = last.dur; last.dur += cfg.end.dur ?? 6; t = last.start + last.dur;
  sfx.push({ t: last.start + last.endAt, name: 'chime', vol: 0.4 });
}
// Music: bed B from music.from to the end; bed A under a scratch cold open, cut by the scratch.
const total = t; const m = cfg.music || {};
const bStart = m.from ? scenes.find((x) => x.id === m.from).start : 0;
const first = scenes[0];
const music = m.file ? {
  file: m.file, lufs: m.lufs ?? -27,
  a: first.card?.scratch && bStart > 0 ? { t0: 0, t1: first.start + first.card.scratchT + 0.15 } : null,
  b: { t0: bStart, t1: total },
} : null;

const timeline = {
  fps: FPS, total, frames: Math.ceil(total * FPS), scenes, captions: caps,
  brand: cfg.brand || {}, end: cfg.end || null, credits: cfg.credits || [],
  audio: { voice, sfx, music },
};
fs.writeFileSync('timeline.json', JSON.stringify(timeline));
console.log(`total ${total.toFixed(1)}s, ${timeline.frames} frames, ${caps.length} captions, ${sfx.length} sfx`);
for (const s of scenes) console.log(` ${s.id} ${s.type.padEnd(7)} @${s.start.toFixed(1)} +${s.dur.toFixed(1)}`);
