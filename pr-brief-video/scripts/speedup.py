# Speed every audio/<id>.mp3 by FACTOR with ffmpeg atempo and scale its word timings to match.
# Originals go to audio/slow/. Run once after tts.py; skips ids already in audio/slow/.
import json, os, subprocess, sys
FACTOR = float(sys.argv[1]) if len(sys.argv) > 1 else 1.15
os.makedirs('audio/slow', exist_ok=True)
for s in json.load(open('script.json')):
    i = s['id']; src = f'audio/slow/{i}'; cur = f'audio/{i}'
    if os.path.exists(src + '.mp3'): continue
    os.rename(cur + '.mp3', src + '.mp3'); os.rename(cur + '.json', src + '.json')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src + '.mp3', '-filter:a', f'atempo={FACTOR}', cur + '.mp3'], check=True)
    d = json.load(open(src + '.json'))
    d['words'] = [{'w': w['w'], 's': w['s'] / FACTOR, 'e': w['e'] / FACTOR} for w in d['words']]
    d['end'] = d['end'] / FACTOR
    json.dump(d, open(cur + '.json', 'w'))
    print(f"{i} {d['end']:.2f}s")
