# Turns the pre-recorded walk clips into engine footage scenes: footage/<id>/f*.jpg + meta.json.
# Run in the project dir:  $PY "$SK/cut.py" [w1 w2 ...]
#
# cuts.json, top level: "source" (dir of the walk mp4s, relative to the project; default ../source) and
#   "chip" {y, h} (the burned caption chip; every crop must end above chip.y).
# cuts.json, per scene: {file: "W3", tail, segs: [...]}. Each seg:
#   src [in, out]      seconds in the walk clip; pick a stretch where the target stays still
#   at, n, off         the voice word the cut lands on (seg 0 has none; off defaults to -0.3)
#   ring [x,y,w,h]     REQUIRED. The control's own edges + ~6px, in source px of the 1440x900 walk frame
#   ring_at, ring_n    the cue word for the ring (defaults to the cut word; seg 0 defaults to 0.12 s)
#   hold               longest the ring stays up (default 1.8 s)
#   zoom               camera zoom cap (default 1.7); the camera frames the ring rect with the engine pad
#   cam [x,y,w,h]      only when the camera must frame more than the ring (the ring stays inside it)
#   crop "low"         take this seg from the frame cropped at y=33 (ends 843, still above the chip at 847)
#   sticker {text, at, n, x, y, rot, sfx}
#
# The walk tool's chip sits at y 847-883, so frames are cropped to 1440x810 (from y=8, or y=33 for "low") and
# scaled to 1920x1080 (src scale 1).
import json, math, os, re, subprocess, sys

ROOT = os.getcwd()
cfg = json.load(open('video.json')); LEAD = cfg.get('pace', {}).get('lead', 0.6)
cuts = json.load(open('cuts.json')); FPS = 30; SRC_FPS = 25; K = 1920 / 1440
SRC = os.path.join(ROOT, cuts.get('source', '../source'))
CHIP = cuts.get('chip', {'y': 847}); CROPS = {'top': 8, 'low': 33, 'zero': 0}
MAX_DUR = 14.6
RINGSRC = json.load(open('rings_src.json')) if os.path.exists('rings_src.json') else {}
norm = lambda s: ''.join(c for c in s.lower() if c.isalnum() or c == '-')

def word_i(words, w, n=1):
    hits = [i for i, x in enumerate(words) if norm(x['w']) == norm(w)]
    if len(hits) < n: sys.exit(f'no word "{w}" #{n}')
    return hits[n - 1]

def word_t(words, w, n=1): return words[word_i(words, w, n)]['s']

def sentence_end(words, i):   # scene-local time the caption holding word i comes down (sentence end + 0.35)
    for j in range(i, len(words)):
        if re.search(r'[.?!]$', words[j]['w']): return LEAD + words[j]['e'] + 0.35
    return LEAD + words[-1]['e'] + 0.35

def to_out(r, cy):   # source rect [x,y,w,h] -> output viewport rect
    x, y, w, h = r
    return {'x': x * K, 'y': (y - cy) * K, 'w': w * K, 'h': h * K}

def decode(stem, crop):
    d = f'cache/{stem}' + {'top': '', 'low': 'L', 'zero': 'Z'}[crop]
    if os.path.exists(f'{d}/done'): return d
    assert CROPS[crop] + 810 <= CHIP['y'], f'crop {crop} (y {CROPS[crop]}-{CROPS[crop] + 810}) runs into the caption chip at y {CHIP["y"]}'
    src = [f for f in os.listdir(SRC) if f.startswith(stem + '-') and f.endswith('.mp4')][0]
    os.makedirs(d, exist_ok=True)
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', os.path.join(SRC, src),
                    '-vf', f'crop=1440:810:0:{CROPS[crop]},scale=1920:1080:flags=lanczos', '-q:v', '2', f'{d}/s%05d.jpg'], check=True)
    open(f'{d}/done', 'w').close(); return d

def ramp(u, k):  # 0..1 -> 0..1; speed 1-A at the cut, 1+A mid-segment, when the segment is sped up
    A = 0.45 if k > 1.35 else 0.0
    return u - A / (2 * math.pi) * math.sin(2 * math.pi * u)

def build(walk):
    c = cuts[walk]; vo = json.load(open(f'audio/{walk}.json')); words = vo['words']
    dur = min(MAX_DUR, LEAD + vo['end'] + c.get('tail', 0.6))
    segs = c['segs']
    starts = [0.0 if i == 0 else LEAD + word_t(words, s['at'], s.get('n', 1)) + s.get('off', -0.3) for i, s in enumerate(segs)]
    starts.append(dur)
    out = f'footage/{walk}'
    if os.path.exists(out):
        for f in os.listdir(out): os.remove(f'{out}/{f}')
    os.makedirs(out, exist_ok=True)
    frames, cam, stickers, sfx, rings = [], [], [], [], []
    print(f'{walk}: {dur:.2f}s')
    for i, s in enumerate(segs):
        if 'ring' not in s: sys.exit(f'{walk} seg{i}: ring rect required')
        crop = s.get('crop', 'top'); cy = CROPS[crop]
        cache = decode(s.get('file', c['file']), crop); nsrc = len([f for f in os.listdir(cache) if f.endswith('.jpg')])
        a, b = s['src']; t0, t1 = starts[i], starts[i + 1]; L = t1 - t0; S = b - a; k = S / L
        for n in range(math.ceil(t0 * FPS - 1e-9), math.ceil(t1 * FPS - 1e-9)):
            t = n / FPS; st = a + S * ramp((t - t0) / L, k)
            idx = min(nsrc, max(1, int(round(st * SRC_FPS)) + 1))
            name = f'f{n:05d}.jpg'; os.link(f'{cache}/s{idx:05d}.jpg', f'{out}/{name}')
            frames.append({'t': t, 'file': name})
        rr = to_out(s['ring'], cy)
        cr = to_out(s['cam'], cy) if 'cam' in s else rr
        z = s.get('zoom', 1.7)
        cam.append({'t': t0, 'dur': 0.01, 'rect': cr, 'zoom': max(1.0, z * 0.8), 'pad': 1.3})
        cam.append({'t': t0 + 0.03, 'dur': min(0.9, L * 0.4), 'rect': cr, 'zoom': z, 'pad': 1.3})
        # The ring: the control's own edges. Up from its cue word until the earliest of the hold, the end of that
        # caption, and the next cut's cue.
        cue = s.get('ring_at') or s.get('at')
        if cue:
            ci = word_i(words, cue, s.get('ring_n', s.get('n', 1))); r0 = LEAD + words[ci]['s']; cap_end = sentence_end(words, ci)
        else:
            r0 = 0.12; cap_end = sentence_end(words, 0)
        rnext = t1
        if i + 1 < len(segs): rnext = LEAD + word_t(words, segs[i + 1]['at'], segs[i + 1].get('n', 1))
        if not (t0 - 1e-6 <= r0 < t1): sys.exit(f'{walk} seg{i}: ring cue {r0:.2f}s is outside its segment {t0:.2f}-{t1:.2f}')
        rend = min(r0 + s.get('hold', 1.8), cap_end, rnext - 0.1, t1 - 0.04)
        rdur = max(0.5, rend - r0)
        rings.append({'t': round(r0, 3), 'dur': round(rdur, 3), 'rect': rr})
        src_at = lambda tt: a + S * ramp((tt - t0) / L, k)
        RINGSRC.setdefault(walk, []).append({'seg': i, 'file': s.get('file', c['file']), 'crop': crop, 'ring': s['ring'], 'kind': s.get('kind', 'box'), 'src': [round(src_at(r0 + 0.05), 3), round(src_at(r0 + 0.3), 3), round(src_at(r0 + rdur - 0.05), 3)]})
        st_src = a + S * ramp((r0 + 0.3 - t0) / L, k)
        print(f'  seg{i} out {t0:5.2f}-{t1:5.2f} ({L:.2f}s) src {a}-{b} speed {k:.2f}{"  <-- check" if k < 0.6 or k > 3.2 else ""}'
              f' | ring {r0:.2f}+{rdur:.2f}s, src at ring+0.3 = {st_src:.2f}s [{crop}]')
        if i: sfx.append({'t': t0 - 0.04, 'name': 'whoosh', 'vol': 0.13})
        if 'sticker' in s:
            sk = s['sticker']; t = LEAD + word_t(words, sk['at'], sk.get('n', 1))
            stickers.append({'t': t, 'dur': max(1.2, min(sk.get('dur', 2.4), t1 - t - 0.05, dur - t - 0.1)), 'text': sk['text'],
                             'x': sk.get('x', 1650), 'y': sk.get('y', 215), 'rot': sk.get('rot', -5), 'size': sk.get('size', 50)})
            sfx.append({'t': t, 'name': sk.get('sfx', 'nope'), 'vol': 0.42})
    sfx.append({'t': dur - 1.1, 'name': 'riser', 'vol': 0.22})   # lift into the next chapter card
    meta = {'id': walk, 'lead': LEAD, 'dur': dur, 'src': 1, 'frames': frames, 'path': [], 'clicks': [], 'typing': [],
            'cam': cam, 'rings': rings, 'stickers': stickers, 'sfx': sfx}
    json.dump(meta, open(f'{out}/meta.json', 'w'))

for w in (sys.argv[1:] or [k for k, v in cuts.items() if isinstance(v, dict) and 'segs' in v]):
    RINGSRC.pop(w, None); build(w)
json.dump(RINGSRC, open('rings_src.json', 'w'), indent=1)
