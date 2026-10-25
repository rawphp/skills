# Writes <name>.srt, contact-sheet.jpg (one frame per scene) and script.md beside video.json's output mp4, from timeline.json + script.json.
import json, subprocess, os, tempfile
from PIL import Image, ImageDraw, ImageFont
cfg = json.load(open('video.json')); ROOT = os.getcwd()
NAME = os.path.splitext(os.path.basename(cfg['output']))[0]; OUT = os.path.dirname(os.path.join(ROOT, cfg['output'])); TITLE = cfg.get('title', NAME)
tl = json.load(open('timeline.json')); sc = {x['id']: x for x in json.load(open('script.json'))}
MP4 = f'{OUT}/{NAME}.mp4'
ts = lambda t: f'{int(t // 3600):02d}:{int(t % 3600 // 60):02d}:{int(t % 60):02d},{int(round(t % 1 * 1000)) % 1000:03d}'
with open(f'{OUT}/{NAME}.srt', 'w') as f:
    for i, c in enumerate(tl['captions'], 1): f.write(f"{i}\n{ts(c['t0'])} --> {ts(c['t1'])}\n{c['text']}\n\n")
# contact sheet: one frame per scene, 4 columns
names = {'open': 'Cold open', 'title': 'Title', 'recap': f'{TITLE} at a glance', 'close': 'Close'}
pick = {'open': 0.8, 'title': 0.6, 'recap': 0.92, 'close': 0.6}
W, H, C = 480, 270, 4; scenes = tl['scenes']; R = (len(scenes) + C - 1) // C; LB = 34
sheet = Image.new('RGB', (W * C, (H + LB) * R), 'white'); d = ImageDraw.Draw(sheet); tmp = tempfile.mkdtemp()
try: font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', 17)
except Exception: font = None
for i, s in enumerate(scenes):
    t = s['start'] + s['dur'] * pick.get(s['id'], 0.45 if s['type'] == 'footage' else 0.7)
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-ss', f'{t:.2f}', '-i', MP4, '-frames:v', '1', f'{tmp}/f.jpg'], check=True)
    x, y = (i % C) * W, (i // C) * (H + LB)
    sheet.paste(Image.open(f'{tmp}/f.jpg').resize((W, H)), (x, y + LB))
    label = names.get(s['id'], ('Walk ' + s['id'][1] if s['id'][0] == 'w' else 'Card ' + s['id'][1]))
    d.text((x + 8, y + 8), f"{s['id']}  {label}  @{s['start']:.1f}s  +{s['dur']:.1f}s", fill='black', font=font)
sheet.save(f'{OUT}/contact-sheet.jpg', quality=88)
with open(f'{OUT}/script.md', 'w') as f:
    f.write(f'# {TITLE}: narration\n\nVoice-over as spoken (ElevenLabs). Times are scene starts in the final cut.\n\n| Scene | Start | Length | Narration |\n|---|---|---|---|\n')
    for s in scenes: f.write(f"| {s['id']} | {s['start']:.1f}s | {s['dur']:.1f}s | {sc[s['id']]['vo']} |\n")
print('ok')
