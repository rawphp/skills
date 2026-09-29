# QA for a finished video. Run in the video project dir.
#   python3 qa.py [video.mp4] [t1,t2,...]
# Prints single-frame flashes and hard cuts, writes qa/sheet.jpg (12 evenly spaced frames, or the given times).
import json, os, subprocess, sys
import numpy as np
from PIL import Image

cfg = json.load(open('video.json'))
path = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1].endswith('.mp4') else cfg.get('output', 'video.mp4')
times_arg = next((a for a in sys.argv[1:] if not a.endswith('.mp4')), None)
dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path], capture_output=True, text=True).stdout)
print(f'{path}: {dur:.1f}s')

raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', path, '-vf', 'scale=96:54,format=gray', '-f', 'rawvideo', '-'], capture_output=True).stdout
n = len(raw) // (96 * 54); f = np.frombuffer(raw[:n * 96 * 54], dtype=np.uint8).reshape(n, 54, 96).astype(float)
d = np.abs(np.diff(f, axis=0)).mean(axis=(1, 2))
# A flash is one frame that jumps away and straight back; sustained change is a zoom, scroll or fade.
flashes = [i for i in range(1, len(d) - 1) if d[i - 1] > 12 and d[i] > 12 and abs(f[i - 1] - f[i + 1]).mean() < 4]
print('flashes:', [round(i / 30, 2) for i in flashes] or 'none')
print('hard cuts:', [round((i + 1) / 30, 2) for i, x in enumerate(d) if x > 25] or 'none')

os.makedirs('qa', exist_ok=True)
ts = [float(x) for x in times_arg.split(',')] if times_arg else [dur * (i + 0.5) / 12 for i in range(12)]
W, H = 640, 360; cols = 3
sheet = Image.new('RGB', (W * cols, H * ((len(ts) + cols - 1) // cols)), 'white')
for i, t in enumerate(ts):
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-ss', f'{t}', '-i', path, '-frames:v', '1', 'qa/_f.jpg'], check=True)
    sheet.paste(Image.open('qa/_f.jpg').resize((W, H)), ((i % cols) * W, (i // cols) * H))
sheet.save('qa/sheet.jpg', quality=82)
print('qa/sheet.jpg at', ', '.join(f'{t:.1f}' for t in ts))
r = subprocess.run(['ffmpeg', '-i', path, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
i = r.rfind('Integrated loudness'); print(' '.join(r[i:i + 400].split()[:12]))
