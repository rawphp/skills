# stills.py [--only w3-4,w6-0]: ring stills (ring.t + 0.3 s) and after stills (ring end + 0.15 s) cut from the FINAL mp4,
# tiled 2x3 into review/ring-N.jpg and review/after-N.jpg, with review/manifest.json for the second-pass reviewer.
import json, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont
cfg = json.load(open('video.json')); MP4 = cfg['output']; tl = json.load(open('timeline.json'))
cuts = json.load(open('cuts.json')) if os.path.exists('cuts.json') else {}
sc = {x['id']: x for x in json.load(open('script.json'))}
only = set(sys.argv[sys.argv.index('--only') + 1].split(',')) if '--only' in sys.argv else None
os.makedirs('review', exist_ok=True)
font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 24)
def grab(t, p): subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-ss', f'{t:.2f}', '-i', MP4, '-frames:v', '1', p], check=True)
def tile(p, label):
    im = Image.open(p).resize((960, 540)); d = ImageDraw.Draw(im); d.rectangle([0, 0, 700, 34], fill='black'); d.text((6, 4), label, fill='yellow', font=font); return im
def sheets(tiles, prefix):
    for n in range(0, len(tiles), 6):
        s = Image.new('RGB', (1920, 1620), 'white')
        for j, im in enumerate(tiles[n:n + 6]): s.paste(im, ((j % 2) * 960, (j // 2) * 540))
        s.save(f'review/{prefix}-{n // 6 + 1}.jpg', quality=85)
man, at, aft = [], [], []
for s in tl['scenes']:
    if s['type'] != 'footage': continue
    for i, r in enumerate(s['rings']):
        key = f"{s['id']}-{i}"
        if only and key not in only: continue
        seg = cuts.get(s['id'], {}).get('segs', [{}] * (i + 1))[i] if cuts else {}
        cue = seg.get('ring_at') or seg.get('at') or f"ring {i}"
        t = round(s['start'] + r['t'] + 0.3, 1); a = round(s['start'] + r['t'] + r['dur'] + 0.15, 1)
        grab(t, f'review/{key}.jpg'); grab(a, f'review/{key}-after.jpg')
        at.append(tile(f'review/{key}.jpg', f'{key} @{t}s cue "{cue}"')); aft.append(tile(f'review/{key}-after.jpg', f'{key} AFTER @{a}s'))
        man.append({'scene': s['id'], 'seg': i, 'cue': cue, 'still': f'review/{key}.jpg', 't': t, 'after_still': f'review/{key}-after.jpg', 'after_t': a,
                    'sticker': seg.get('sticker', {}).get('text'), 'line': sc[s['id']]['vo']})
sheets(at, 'ring'); sheets(aft, 'after'); json.dump(man, open('review/manifest.json', 'w'), indent=1)
print(len(man), 'rings;', (len(man) + 5) // 6, 'sheets each')
