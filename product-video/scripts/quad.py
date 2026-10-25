# quad.py W out.jpg t1 t2 t3 t4 : 2x2 sheet of decoded top-crop frames at 960x540, labelled
import sys
from PIL import Image, ImageDraw, ImageFont
W, out = sys.argv[1], sys.argv[2]; ts = [float(t) for t in sys.argv[3:7]]
img = Image.new('RGB', (1920, 1080), 'white'); d = ImageDraw.Draw(img)
font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 22)
for i, t in enumerate(ts):
    f = Image.open(f'cache/{W}/s{int(round(t*25))+1:05d}.jpg').resize((960, 540)); x, y = (i % 2) * 960, (i // 2) * 540
    img.paste(f, (x, y)); d.rectangle([x, y, x + 110, y + 28], fill='black'); d.text((x + 6, y + 3), f'{W} {t:.1f}s', fill='yellow', font=font)
img.save(out, quality=85)
