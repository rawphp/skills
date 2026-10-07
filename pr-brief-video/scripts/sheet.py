# Tile preview/t*.jpg into preview/sheet.jpg (3 across) so one Read shows every card.
import glob, re
from PIL import Image
fs = sorted(glob.glob('preview/t*.jpg'), key=lambda f: float(re.search(r't([\d.]+)\.jpg', f).group(1)))
ims = [Image.open(f).resize((960, 540)) for f in fs]; rows = (len(ims) + 2) // 3
sheet = Image.new('RGB', (2880, 540 * rows), 'black')
for i, im in enumerate(ims): sheet.paste(im, ((i % 3) * 960, (i // 3) * 540))
sheet.save('preview/sheet.jpg', quality=85); print('preview/sheet.jpg', len(ims), 'frames')
