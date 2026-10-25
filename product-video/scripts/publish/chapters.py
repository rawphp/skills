# YouTube chapters.
#   python3 chapters.py scenes [project_dir]   list scene start times from a product-video project
#                                              (timeline.json + script.json): "M:SS id first words of the voice line"
#   python3 chapters.py check [video.mp4] < chapters.txt
#                                              validate chapter lines ("M:SS Title") against YouTube's rules
import json, os, re, subprocess, sys

def ts(s): s = int(s); return f"{s // 3600}:{s % 3600 // 60:02d}:{s % 60:02d}" if s >= 3600 else f"{s // 60}:{s % 60:02d}"
def secs(t): p = [int(x) for x in t.split(':')]; return sum(v * 60 ** i for i, v in enumerate(reversed(p)))

cmd = sys.argv[1] if len(sys.argv) > 1 else ''
if cmd == 'scenes':
    d = sys.argv[2] if len(sys.argv) > 2 else '.'
    tl = json.load(open(os.path.join(d, 'timeline.json'))); sc = {s['id']: s for s in json.load(open(os.path.join(d, 'script.json')))}
    for s in tl['scenes']:
        words = sc.get(s['id'], {}).get('vo', '').split()
        print(ts(0 if s is tl['scenes'][0] else s['start'] + 0.6), s['id'], ' '.join(words[:9]) + (' …' if len(words) > 9 else ''))
    print(f"total {ts(tl['total'])}")
elif cmd == 'check':
    dur = None
    if len(sys.argv) > 2:
        dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', sys.argv[2]], capture_output=True, text=True).stdout)
    rows = [(secs(m.group(1)), m.group(2).strip()) for line in sys.stdin if (m := re.match(r'\s*(\d+(?::\d\d){1,2})\s+(.+)', line))]
    errs = []
    if not rows or rows[0][0] != 0: errs.append('first chapter must be 0:00')
    if len(rows) < 3: errs.append('need at least 3 chapters')
    ends = [r[0] for r in rows[1:]] + [dur if dur else None]
    for (t, title), end in zip(rows, ends):
        if end is not None and end - t < 10: errs.append(f'"{title}" at {ts(t)} is shorter than 10 s')
    if any(b[0] <= a[0] for a, b in zip(rows, rows[1:])): errs.append('times must increase')
    print('\n'.join(errs) if errs else f'ok: {len(rows)} chapters')
    sys.exit(1 if errs else 0)
else:
    sys.exit(__doc__ or 'usage: chapters.py scenes [dir] | chapters.py check [video.mp4] < chapters.txt')
