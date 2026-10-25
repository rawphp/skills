# bounds.py W t low x y w h [thr] : bounding box (src px) of pixels that differ from the region's median colour, in a src-px region
import sys, numpy as np
from PIL import Image
W,t,low=sys.argv[1],float(sys.argv[2]),sys.argv[3]=='1'; x,y,w,h=map(float,sys.argv[4:8]); thr=int(sys.argv[8]) if len(sys.argv)>8 else 20
K=1920/1440; cy=33 if low else 8
im=np.asarray(Image.open(f'cache/{W}{"L" if low else ""}/s{int(round(t*25))+1:05d}.jpg').convert('RGB'),dtype=np.int16)
x0,y0,x1,y1=int(x*K),int((y-cy)*K),int((x+w)*K),int((y+h-cy)*K)
reg=im[y0:y1,x0:x1]; bg=np.median(reg.reshape(-1,3),0); m=np.abs(reg-bg).max(2)>thr
ys,xs=np.where(m)
if len(xs)==0: print('nothing'); sys.exit()
print(f'{W}@{t} content src x {x+xs.min()/K:.0f}-{x+(xs.max()+1)/K:.0f} y {y+ys.min()/K:.0f}-{y+(ys.max()+1)/K:.0f}   (rows with ink:', ' '.join(f'{y+r/K:.0f}' for r in np.where(m.sum(1)>0)[0][::6]), ')')
