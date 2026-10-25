# Measure each ring's target on the decoded source frame at the ring's own source times, instead of by eye.
# usage: $PY "$SK/snap.py" [--write] [w3 ...]
# Reads rings_src.json (written by cut.py) and cuts.json. For every ring it finds the target's edges by
# scanning outward from the current estimate (ring minus 6 src px) until a 3-px clear run, on a mask chosen by
# the seg's "kind": box/ink = differs from the surrounding background; dialog = white body on a dimmed backdrop;
# row = divider lines above and below, ink left/right. Prints the target at ring start, +0.3 s and ring end (they
# must agree), and the ring that is target + 6 src px. --write puts those rings into cuts.json.
import json, sys
import numpy as np
from PIL import Image

K = 1920 / 1440; PAD = 6; CROPS = {'top': 8, 'low': 33, 'zero': 0}
cuts = json.load(open('cuts.json')); rs = json.load(open('rings_src.json'))
args = [a for a in sys.argv[1:] if not a.startswith('--')]; WRITE = '--write' in sys.argv

def frame(stem, crop, t):
    d = f'cache/{stem}' + {'top': '', 'low': 'L', 'zero': 'Z'}[crop]
    return np.asarray(Image.open(f'{d}/s{int(round(t * 25)) + 1:05d}.jpg').convert('RGB'), dtype=np.int16)

def to_out(r, cy): x, y, w, h = r; return [x * K, (y - cy) * K, (x + w) * K, (y + h - cy) * K]

def mask_for(img, box, kind):
    x0, y0, x1, y1 = [int(round(v)) for v in box]
    H, W, _ = img.shape
    if kind == 'dialog':
        return img.min(2) > 251
    band = np.concatenate([img[max(0, y0 - 16):max(0, y0 - 12), max(0, x0):min(W, x1)].reshape(-1, 3),
                           img[min(H - 1, y1 + 12):min(H, y1 + 16), max(0, x0):min(W, x1)].reshape(-1, 3),
                           img[max(0, y0):min(H, y1), max(0, x0 - 16):max(0, x0 - 12)].reshape(-1, 3),
                           img[max(0, y0):min(H, y1), min(W - 1, x1 + 12):min(W, x1 + 16)].reshape(-1, 3)])
    bg = np.median(band, 0)
    return np.abs(img - bg).max(2) > 13

def scan(profile, start, step, limit):   # walk outward; skip leading clear run, stop at the first 3-px clear run after content
    i, seen, last = start, False, None
    for _ in range(limit):
        if i < 0 or i >= len(profile): break
        if profile[i] > 2: seen, last = True, i
        elif seen and all(0 <= i + step * j < len(profile) and profile[i + step * j] <= 2 for j in range(3)): return last
        i += step
    return last if seen else None

def measure_dialog(img, est):   # mean luminance across the middle half; scan inward from 30 px outside until the band is white
    lum = img.mean(2); H, W = lum.shape
    x0, y0, x1, y1 = [int(round(v)) for v in est]
    my = slice((3 * y0 + y1) // 4, (y0 + 3 * y1) // 4); mx = slice((3 * x0 + x1) // 4, (x0 + 3 * x1) // 4)
    colp = lum[my, :].mean(0); rowp = lum[:, mx].mean(1)
    def inward(p, start, step):
        for j in range(60):
            i = start + step * j
            if 0 <= i < len(p) and p[i] >= 246: return i
        return None
    return [inward(colp, x0 - 30, 1), inward(rowp, y0 - 30, 1), inward(colp, x1 + 30, -1), inward(rowp, y1 + 30, -1)]

def measure(img, est, kind):
    if kind == 'dialog': return measure_dialog(img, est)
    m = mask_for(img, est, kind); H, W = m.shape
    x0, y0, x1, y1 = [int(round(v)) for v in est]
    ys = slice(max(0, y0 + 4), min(H, y1 - 4)); xs = slice(max(0, x0 + 4), min(W, x1 - 4))
    colp = m[ys, :].sum(0); rowp = m[:, xs].sum(1)
    L = scan(colp, x0 + 5, -1, 30); R = scan(colp, x1 - 5, 1, 30)
    if kind == 'row':
        width = (x1 - x0); dm = np.abs(np.diff(img.mean(2), axis=0)) > 6
        lines = [y for y in range(max(0, y0 - 18), min(H - 1, y1 + 18)) if dm[y, xs].sum() > 0.6 * width]
        T = max([y for y in lines if y < (y0 + y1) / 2], default=None); B = min([y for y in lines if y > (y0 + y1) / 2], default=None)
        T = T + 1 if T is not None else None
    else:
        T = scan(rowp, y0 + 5, -1, 30); B = scan(rowp, y1 - 5, 1, 30)
    return [L, T, R, B]

out = {}
for walk, rings in rs.items():
    if args and walk not in args: continue
    for r in rings:
        cy = CROPS[r['crop']]; ring = r['ring']
        est = to_out([ring[0] + PAD, ring[1] + PAD, ring[2] - 2 * PAD, ring[3] - 2 * PAD], cy)
        res = [measure(frame(r['file'], r['crop'], t), est, r['kind']) for t in r['src']]
        tgt = []
        for side in range(4):
            vals = [x[side] for x in res]
            tgt.append(None if None in vals else vals)
        def src(v, axis): return v / K if axis == 0 else v / K + cy
        line = f"{walk}-{r['seg']} {r['kind']:6} ring {ring}"
        if None in tgt:
            print(line, ' NO EDGE on side', [i for i, v in enumerate(tgt) if v is None], res); continue
        spread = max(max(v) - min(v) for v in tgt)
        L, T, R, B = [np.median(v) for v in tgt]
        t_src = [src(L, 0), src(T, 1), src(R + 1, 0), src(B + 1, 1)]
        gaps = [ring[0] + 0 - t_src[0], ring[1] - t_src[1], t_src[2] - (ring[0] + ring[2]), t_src[3] - (ring[1] + ring[3])]
        new = [round(t_src[0] - PAD), round(t_src[1] - PAD), round(t_src[2] - t_src[0] + 2 * PAD), round(t_src[3] - t_src[1] + 2 * PAD)]
        print(f"{line} target {[round(v, 1) for v in t_src]} pad L{-gaps[0]:.1f} T{-gaps[1]:.1f} R{-gaps[2]:.1f} B{-gaps[3]:.1f}"
              f" spread {spread/K:.1f}src -> {new}" + ('  <-- MOVING' if spread > 3 else ''))
        out[(walk, r['seg'])] = new
if WRITE:
    for (walk, seg), new in out.items(): cuts[walk]['segs'][seg]['ring'] = new
    json.dump(cuts, open('cuts.json', 'w'), indent=1); print('cuts.json updated')
