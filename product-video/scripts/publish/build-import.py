#!/usr/bin/env python3
"""Build walkthroughs.import input from a product-video project folder.

Reads timeline.json (scene starts and durations), script.json (voice-over per scene) and video.json
(ElevenLabs voice id), measures the mp4 with ffprobe, and ends the last scene at the measured length.
Usage: build-import.py <project-dir> --title T --purpose P [--mp4 file] [--no-voice] > import.json
"""
import argparse, json, os, subprocess, sys

ap = argparse.ArgumentParser()
ap.add_argument('project')
ap.add_argument('--title', required=True)
ap.add_argument('--purpose', required=True, choices=['spec_review', 'build_signoff', 'delivery_feedback', 'custom'])
ap.add_argument('--mp4', help='defaults to video.json output inside the project')
ap.add_argument('--no-voice', action='store_true', help='leave voice_id out (default narrator voice)')
a = ap.parse_args()

p = a.project
tl = json.load(open(os.path.join(p, 'timeline.json')))
sc = json.load(open(os.path.join(p, 'script.json')))
vj = json.load(open(os.path.join(p, 'video.json'))) if os.path.exists(os.path.join(p, 'video.json')) else {}
mp4 = a.mp4 or os.path.join(p, vj.get('output', 'intro.mp4'))
dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4]).decode().strip())
dur = round(dur, 3)

vo = {s['id']: s.get('vo', '') for s in sc}
scenes = []
for s in sorted(tl['scenes'], key=lambda s: s['start']):
    scenes.append({'id': s['id'], 'start': round(s['start'], 3), 'duration': round(s['dur'], 3), 'voice_over': vo.get(s['id'], '')})
last = scenes[-1]
last['duration'] = round(dur - last['start'], 3)
if abs(tl.get('total', dur) - dur) > 0.05:
    print(f'warning: timeline total {tl.get("total")} differs from mp4 {dur}; last scene trimmed to end at {dur}', file=sys.stderr)
for prev, nxt in zip(scenes, scenes[1:]):
    gap = nxt['start'] - (prev['start'] + prev['duration'])
    if abs(gap) > 0.05:
        sys.exit(f'scenes {prev["id"]} and {nxt["id"]} do not meet: gap {gap:.3f}s')

out = {'title': a.title, 'purpose': a.purpose, 'duration_seconds': dur, 'scenes': scenes}
if not a.no_voice and vj.get('voice', {}).get('id'):
    v = vj['voice']['id']; out['voice_id'] = os.environ[v[4:]] if v.startswith('ENV:') else v   # ENV:<VAR> as in tts.py
json.dump(out, sys.stdout, indent=1)
print(f'{len(scenes)} scenes, {dur}s, voice {out.get("voice_id", "default")}', file=sys.stderr)
