# gate.py: geometry and cue checks on timeline.json (+ cuts.json). Exit 1 on any failure. Run before the full render.
import json, os, re, sys
W, H = 1920, 1080; MARGIN = 12; STROKE = 5
CAP_TOP, CAP_BOTTOM = (34, 110), (1000, 1056)
tl = json.load(open('timeline.json')); caps = tl['captions']
cuts = json.load(open('cuts.json')) if os.path.exists('cuts.json') else {}
script = {x['id']: x for x in json.load(open('script.json'))} if os.path.exists('script.json') else {}
norm = lambda s: ''.join(c for c in s.lower() if c.isalnum() or c == '-')
fails, warns, nrings = [], [], 0
def fail(scene, i, check, detail): fails.append(f'FAIL {scene}-{i} {check}: {detail}')
def view_at(scene, t):   # camera view rect (output px) at scene-local t: the last cam entry whose t <= t, padded 1.3 about its centre, capped by zoom
    cams = [c for c in scene['cam'] if c['t'] <= t + 1e-6] or scene['cam'][:1]
    c = cams[-1]; r = c['rect']; pad = c.get('pad', 1.3); z = max(1.0, min(c['zoom'], W / (r['w'] * pad), H / (r['h'] * pad)))
    vw, vh = W / z, H / z; cx, cy = r['x'] + r['w'] / 2, r['y'] + r['h'] / 2
    x0 = min(max(0, cx - vw / 2), W - vw); y0 = min(max(0, cy - vh / 2), H - vh)
    return x0, y0, x0 + vw, y0 + vh, z
def overlap(a, b): return not (a[2] <= b[0] or b[2] <= a[0] or a[3] <= b[1] or b[3] <= a[1])
for s in tl['scenes']:
    if s['type'] != 'footage': continue
    rings = sorted(s.get('rings', []), key=lambda r: r['t'])
    for i, r in enumerate(rings):
        nrings += 1; rect = r['rect']; t = r['t'] + 0.3
        x0, y0, x1, y1, z = view_at(s, t)
        # the ring in frame px: the rect through the camera, then the stroke, which the compositor draws in screen px (not zoomed)
        boxv = ((rect['x'] - x0) * z - STROKE, (rect['y'] - y0) * z - STROKE,
                (rect['x'] + rect['w'] - x0) * z + STROKE, (rect['y'] + rect['h'] - y0) * z + STROKE)
        m = min(boxv[0], boxv[1], W - boxv[2], H - boxv[3])
        if m < MARGIN: fail(s['id'], i, 'edge', f'{m:.0f} px to the frame edge (need {MARGIN})')
        band = CAP_BOTTOM if s.get('capBottom') else CAP_TOP
        up = any(c['t0'] <= s['start'] + t <= c['t1'] for c in caps)
        if up and overlap(boxv, (0, band[0], W, band[1])): fail(s['id'], i, 'caption', 'ring under the caption band; set capBottom or move the shot')
        for k in s.get('stickers', []):
            if not (k['t'] <= t <= k['t'] + k['dur']): continue
            sw, sh = 0.46 * k['size'] * len(k['text']), 1.5 * k['size']
            sb = (k['x'] - sw / 2, k['y'] - sh / 2, k['x'] + sw / 2, k['y'] + sh / 2)
            if overlap(sb, boxv): fail(s['id'], i, 'sticker', f'"{k["text"]}" overlaps the ring')
            if overlap(sb, (0, band[0], W, band[1])): fail(s['id'], i, 'sticker', f'"{k["text"]}" sits in the caption band')
        if i + 1 < len(rings) and r['t'] + r['dur'] > rings[i + 1]['t'] - 0.1 + 1e-6: fail(s['id'], i, 'overrun', 'ring still up when the next ring starts')
    segs = cuts.get(s['id'], {}).get('segs', []); line = script.get(s['id'], {}).get('vo', '')
    words = [norm(w) for w in line.split()]
    for i, seg in enumerate(segs):
        for key, nkey in (('at', 'n'), ('ring_at', 'ring_n')):
            w = seg.get(key)
            if not w: continue
            c = words.count(norm(w))
            if c == 0: fail(s['id'], i, 'cue', f'"{w}" is not in the line')
            elif c > 1 and nkey not in seg: fail(s['id'], i, 'cue', f'"{w}" occurs {c} times; set {nkey}')
        if 'n' in seg and 'ring_at' in seg and 'ring_n' not in seg: fail(s['id'], i, 'cue', 'n is set but ring_n is not; the ring cue would use n')
for line in fails: print(line)
print(f'gate: {nrings} rings, {len(fails)} failures')
sys.exit(1 if fails else 0)
