#!/usr/bin/env bash
# Render thumbnail HTML files to 1280x720 PNGs with headless Chrome, then write a review sheet.
#   shoot.sh [dir]            renders every thumb-*.html in dir (default .) -> thumb-*.png, sheet.jpg, sheet-small.jpg
# sheet-small.jpg shows each thumbnail at 320x180 with a fake duration badge: the size people actually see in search.
set -euo pipefail
DIR="${1:-.}"; cd "$DIR"
CH="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
[ -x "$CH" ] || CH="$(command -v google-chrome || command -v chromium || true)"
[ -n "$CH" ] || { echo "Chrome not found; set CHROME=/path/to/chrome" >&2; exit 1; }
shopt -s nullglob; files=(thumb-*.html)
[ ${#files[@]} -gt 0 ] || { echo "no thumb-*.html in $PWD" >&2; exit 1; }
for f in "${files[@]}"; do
  out="${f%.html}.png"
  "$CH" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size=1280,720 \
    --virtual-time-budget=4000 --screenshot="$PWD/$out" "file://$PWD/$f" >/dev/null 2>&1
  kb=$(( $(stat -f%z "$out" 2>/dev/null || stat -c%s "$out") / 1024 ))
  echo "$out ${kb} KB$([ $kb -gt 2000 ] && echo '  OVER 2 MB: YouTube rejects it')"
done
"${PY:-python3}" - <<'PY'
import glob
from PIL import Image, ImageDraw
fs = sorted(glob.glob('thumb-*.png'))
big = Image.new('RGB', (1280, 740 * len(fs)), 'white')
small = Image.new('RGB', (340 * len(fs), 200), 'white')
for i, f in enumerate(fs):
    im = Image.open(f).convert('RGB')
    big.paste(im, (0, i * 740))
    s = im.resize((320, 180), Image.LANCZOS); d = ImageDraw.Draw(s)
    d.rounded_rectangle((276, 158, 316, 175), 3, fill=(0, 0, 0)); d.text((281, 160), '4:06', fill='white')
    small.paste(s, (10 + i * 340, 10))
big.save('sheet.jpg', quality=85); small.save('sheet-small.jpg', quality=90)
print('sheet.jpg sheet-small.jpg')
PY
