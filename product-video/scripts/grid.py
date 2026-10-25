# Render a decoded frame region in SOURCE px (1440x900 walk coords; crop starts y=8) with a labelled grid.
# usage: grid.py W1 t out.jpg [x y w h] [step]   default: whole frame, step 100 (minor = step/5)
import sys, os
from PIL import Image, ImageDraw, ImageFont
W, t, out = sys.argv[1], float(sys.argv[2]), sys.argv[3]
x0, y0, w, h = (map(float, sys.argv[4:8]) if len(sys.argv) >= 8 else (0, 33 if os.environ.get('LOW') == '1' else 8, 1440, 810))
step = float(sys.argv[8]) if len(sys.argv) >= 9 else 100
import os
K = 1920 / 1440
LOW = os.environ.get('LOW') == '1'; CY = 33 if LOW else 8
idx = int(round(t * 25)) + 1
fr = Image.open(f'cache/{W}{"L" if LOW else ""}/s{idx:05d}.jpg')
box = (int(x0 * K), int((y0 - CY) * K), int((x0 + w) * K), int((y0 + h - CY) * K))
im = fr.crop(box)
S = min(1500 / im.width, 1100 / im.height)   # display scale
im = im.resize((int(im.width * S), int(im.height * S)), Image.LANCZOS).convert('RGB')
d = ImageDraw.Draw(im, 'RGBA')
font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 14)
px = lambda sx: (sx - x0) * K * S; py = lambda sy: (sy - y0) * K * S
minor = step / 5
import math
gx = math.ceil(x0 / minor) * minor
while gx <= x0 + w:
    major = abs(gx / step - round(gx / step)) < 1e-6
    d.line([(px(gx), 0), (px(gx), im.height)], fill=(255, 0, 255, 150 if major else 45), width=1)
    if major: d.text((px(gx) + 2, 2), f'{gx:g}', fill=(200, 0, 200), font=font)
    gx += minor
gy = math.ceil(y0 / minor) * minor
while gy <= y0 + h:
    major = abs(gy / step - round(gy / step)) < 1e-6
    d.line([(0, py(gy)), (im.width, py(gy))], fill=(255, 0, 255, 150 if major else 45), width=1)
    if major: d.text((2, py(gy) + 2), f'{gy:g}', fill=(200, 0, 200), font=font)
    gy += minor
d.text((im.width - 120, im.height - 20), f'{W} {t:.2f}s', fill=(255, 0, 0), font=font)
R = os.environ.get('RECT')
if R:
    for rr in R.split(';'):
        rx, ry, rw, rh = map(float, rr.split(','))
        d.rectangle([px(rx), py(ry), px(rx + rw), py(ry + rh)], outline=(0, 200, 0, 255), width=3)
im.save(out, quality=88)
