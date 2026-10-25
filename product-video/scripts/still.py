# still.py W a b : per 0.2 s, mean abs pixel change vs 0.2 s earlier (x1000), on the top-crop cache. Low = still.
import sys
import numpy as np
from PIL import Image
W, a, b = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
load = lambda t: np.asarray(Image.open(f'cache/{W}/s{int(round(t*25))+1:05d}.jpg').convert('L').resize((480, 270)), dtype=np.int16)
t = a; prev = load(t - 0.2); out = []
while t <= b + 1e-6:
    cur = load(t); d = np.abs(cur - prev).mean() * 10; out.append(f'{t:.1f}:{d:.0f}'); prev = cur; t += 0.2
print(W, ' '.join(out))
