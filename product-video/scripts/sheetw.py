# Contact sheet of decoded walk frames. usage: sheetw.py W3 start end step out.jpg  (seconds; 4 cols, 480x270 tiles, labelled)
import sys
from PIL import Image, ImageDraw, ImageFont
w, a, b, step, out = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4]), sys.argv[5]
ts = []; t = a
while t <= b + 1e-6: ts.append(round(t, 2)); t += step
cols = 4; rows = (len(ts) + cols - 1) // cols; TW, TH = 480, 270
img = Image.new('RGB', (cols * TW, rows * (TH + 22)), 'white'); d = ImageDraw.Draw(img)
try: font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 18)
except Exception: font = None
for i, t in enumerate(ts):
    idx = int(round(t * 25)) + 1
    try: f = Image.open(f'cache/{w}/s{idx:05d}.jpg').resize((TW, TH))
    except FileNotFoundError: continue
    x, y = (i % cols) * TW, (i // cols) * (TH + 22)
    img.paste(f, (x, y + 22)); d.text((x + 4, y + 2), f'{w} {t:.1f}s', fill='black', font=font)
img.save(out, quality=85)
