# Voice-over with word timings via ElevenLabs. Run in the video project dir.
#   python3 tts.py            generate every script.json line that has no audio/<id>.mp3 yet
#   python3 tts.py s03 s07    regenerate these lines (after editing their vo text)
# Needs ELEVEN_LABS_API_KEY. Writes audio/<id>.mp3 and audio/<id>.json {words:[{w,s,e}], end}.
import json, os, sys, base64, urllib.request, urllib.error

cfg = json.load(open('video.json'))['voice']
if not cfg.get('id') or cfg['id'].startswith('<'):
    sys.exit('video.json voice.id is not set. Pick a voice at the approval gate (references/script-writing.md)')
script = json.load(open('script.json'))
KEY = os.environ['ELEVEN_LABS_API_KEY']
os.makedirs('audio', exist_ok=True)
only = set(sys.argv[1:])

def words_from(a):
    words, cur, st, end = [], '', None, None
    for ch, t0, t1 in zip(a['characters'], a['character_start_times_seconds'], a['character_end_times_seconds']):
        if ch.isspace():
            if cur: words.append({'w': cur, 's': st, 'e': end}); cur = ''
            continue
        if not cur: st = t0
        cur += ch; end = t1
    if cur: words.append({'w': cur, 's': st, 'e': end})
    return words

for i, s in enumerate(script):
    out = f"audio/{s['id']}"
    if only and s['id'] not in only: continue
    if not only and os.path.exists(out + '.mp3'): continue
    body = {
        'text': s['vo'], 'model_id': cfg.get('model', 'eleven_multilingual_v2'),
        'voice_settings': {'stability': cfg.get('stability', 0.5), 'similarity_boost': cfg.get('similarity', 0.8),
                           'style': cfg.get('style', 0.25), 'use_speaker_boost': True, 'speed': cfg.get('speed', 0.97)},
        # Neighbouring lines keep the delivery continuous across separately generated scenes.
        'previous_text': script[i - 1]['vo'] if i else None,
        'next_text': script[i + 1]['vo'] if i + 1 < len(script) else None,
    }
    # mp3_44100_128 is the best format the free tier allows.
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{cfg['id']}/with-timestamps?output_format=mp3_44100_128",
                                 data=json.dumps(body).encode(), headers={'xi-api-key': KEY, 'Content-Type': 'application/json'})
    try:
        r = json.load(urllib.request.urlopen(req))
    except urllib.error.HTTPError as e:
        sys.exit(f"{s['id']}: HTTP {e.code} {e.read()[:300]!r}")
    open(out + '.mp3', 'wb').write(base64.b64decode(r['audio_base64']))
    a = r['alignment']
    json.dump({'words': words_from(a), 'end': a['character_end_times_seconds'][-1]}, open(out + '.json', 'w'))
    print(f"{s['id']} {a['character_end_times_seconds'][-1]:.2f}s")

# Word timings, for choosing cue words in scenes.mjs and script.json.
for s in script:
    p = f"audio/{s['id']}.json"
    if os.path.exists(p) and (not only or s['id'] in only):
        d = json.load(open(p))
        print(s['id'], ' '.join(f"{w['w']}@{w['s']:.1f}" for w in d['words']))
