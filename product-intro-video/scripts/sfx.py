# Sound effects via ElevenLabs sound generation. Run in the video project dir.
# Makes the default set plus any extras in video.json "sfx": {name: prompt}. Skips files that exist.
import json, os, urllib.request, urllib.error

DEFAULT = {
    'scratch': ('Vinyl record scratch, short comedic stop, clean, no music', 1.2),
    'bonk': ('Soft cartoon bonk, gentle wooden knock, comedic, single hit', 0.8),
    'whoosh': ('Soft airy swoosh transition, gentle, short', 0.8),
    'pop': ('Soft bubble pop, cute UI pop sound, single', 0.5),
    'click': ('Single soft computer mouse click, close mic, clean', 0.5),
    'typing': ('Soft laptop keyboard typing, light quick keystrokes, close mic', 3.0),
    'chime': ('Gentle positive UI success chime, two soft bell notes', 1.2),
    'ding': ('Single soft desk bell ding, gentle', 1.0),
}
extra = {k: (v, 1.2) if isinstance(v, str) else tuple(v) for k, v in json.load(open('video.json')).get('sfx', {}).items()}
KEY = os.environ['ELEVEN_LABS_API_KEY']
os.makedirs('audio/sfx', exist_ok=True)
for name, (text, dur) in {**DEFAULT, **extra}.items():
    out = f'audio/sfx/{name}.mp3'
    if os.path.exists(out): continue
    req = urllib.request.Request('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128',
        data=json.dumps({'text': text, 'duration_seconds': dur, 'prompt_influence': 0.6}).encode(),
        headers={'xi-api-key': KEY, 'Content-Type': 'application/json'})
    try:
        data = urllib.request.urlopen(req).read()  # read first: a failed request must not leave an empty file that later runs skip
        open(out, 'wb').write(data); print('made', name)
    except urllib.error.HTTPError as e:
        print(name, 'HTTP', e.code, e.read()[:200])
