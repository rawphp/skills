# Mixes voice, music and sound effects from timeline.json to mix/final.m4a at -16 LUFS,
# then muxes render/video.mp4 + the mix into video.json "output". Run in the video project dir.
import json, math, os, re, subprocess

tl = json.load(open('timeline.json')); cfg = json.load(open('video.json'))
A = tl['audio']; TOTAL = tl['total']; SR = 48000
os.makedirs('mix', exist_ok=True)

def ff(args): subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', *args], check=True)
def lufs(path):
    r = subprocess.run(['ffmpeg', '-i', path, '-af', 'loudnorm=print_format=json', '-f', 'null', '-'], capture_output=True, text=True)
    return json.loads(re.search(r'\{[^{}]*"input_i"[^{}]*\}', r.stderr).group(0))
def peak(path):
    r = subprocess.run(['ffmpeg', '-i', path, '-af', 'volumedetect', '-f', 'null', '-'], capture_output=True, text=True)
    return float(re.search(r'max_volume: (-?[\d.]+) dB', r.stderr).group(1))
def stem(out, items):
    """items: (file, start_seconds, extra_filter) placed on one float track padded to TOTAL."""
    if not items:
        ff(['-f', 'lavfi', '-i', f'anullsrc=r={SR}:cl=stereo', '-t', str(TOTAL), '-c:a', 'pcm_f32le', out]); return
    args, parts = [], []
    for i, (f, t, extra) in enumerate(items):
        args += ['-i', f]; d = max(0, int(round(t * 1000)))
        parts.append(f'[{i}:a]aresample={SR},aformat=channel_layouts=stereo{"," + extra if extra else ""},adelay={d}|{d}[a{i}]')
    graph = ';'.join(parts) + ';' + ''.join(f'[a{i}]' for i in range(len(items))) + \
        f'amix=inputs={len(items)}:normalize=0:dropout_transition=0,apad=whole_dur={TOTAL},atrim=0:{TOTAL}[out]'
    ff([*args, '-filter_complex', graph, '-map', '[out]', '-c:a', 'pcm_f32le', out])

stem('mix/vo.wav', [(v['file'], v['t'], None) for v in A['voice']])
# Effects: each file levelled to a -3 dBFS peak, then the cue's volume.
gains = {f[:-4]: -3 - peak(f'audio/sfx/{f}') for f in os.listdir('audio/sfx') if f.endswith('.mp3')}
sfx = []
for e in A['sfx']:
    if e['name'] not in gains: print('missing sfx', e['name']); continue
    f = f"volume={gains[e['name']] + 20 * math.log10(e['vol']):.2f}dB"
    if e.get('len'): f = f"atrim=0:{e['len']:.2f},afade=t=out:st={max(0, e['len'] - 0.15):.2f}:d=0.15," + f
    sfx.append((f"audio/sfx/{e['name']}.mp3", e['t'], f))
stem('mix/sfx.wav', sfx)
# Music: bed A (cut by the cold-open scratch) and bed B (to the end, 3.5s fade). Loops if the track is short.
M = A['music']; beds = []
if M:
    for key, fin in (('a', 0), ('b', 0.4)):
        bed = M.get(key)
        if not bed: continue
        ln = bed['t1'] - bed['t0']; fade = 0.08 if key == 'a' else 3.5
        beds.append((M['file'], bed['t0'], f"aloop=loop=-1:size=2e9,atrim=0:{ln:.2f}" + (f",afade=t=in:d={fin}" if fin else '') + f",afade=t=out:st={ln - fade:.2f}:d={fade}"))
stem('mix/music.wav', beds)

vo_g = -16 - float(lufs('mix/vo.wav')['input_i'])
mu_i = lufs('mix/music.wav')['input_i']; mu_g = (M['lufs'] - float(mu_i)) if M and mu_i not in ('-inf', '-70.00') else 0
print(f'voice {vo_g:+.1f} dB, music {mu_g:+.1f} dB')
graph = (f'[0:a]volume={vo_g:.2f}dB,asplit=2[vo][key];[1:a]volume={mu_g:.2f}dB[mu];'
         f'[mu][key]sidechaincompress=threshold=0.04:ratio=5:attack=40:release=600:makeup=1[duck];'  # music ducks under the voice
         f'[vo][duck][2:a]amix=inputs=3:normalize=0[mix]')
ff(['-i', 'mix/vo.wav', '-i', 'mix/music.wav', '-i', 'mix/sfx.wav', '-filter_complex', graph, '-map', '[mix]', '-c:a', 'pcm_f32le', 'mix/premix.wav'])
m = lufs('mix/premix.wav')
ln = (f"loudnorm=I=-16:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:"
      f"measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
ff(['-i', 'mix/premix.wav', '-af', f'{ln},aresample={SR}', '-c:a', 'aac', '-b:a', '192k', 'mix/final.m4a'])
print('mix/final.m4a', lufs('mix/final.m4a')['input_i'], 'LUFS')
if os.path.exists('render/video.mp4'):
    out = cfg.get('output', 'video.mp4')
    ff(['-i', 'render/video.mp4', '-i', 'mix/final.m4a', '-map', '0:v', '-map', '1:a', '-c', 'copy', '-movflags', '+faststart', '-shortest', out])
    print('wrote', out)
