# Check every card cue word in script.json exists in its voice line, and report the word and
# character totals for the gate. Exit 1 on a missing cue. Run from the project folder.
import json, re, sys
def norm(w): return re.sub(r'[^\w-]', '', w).lower()
def cues(o, acc):
    if isinstance(o, dict):
        if isinstance(o.get('at'), str): acc.append(o['at'])
        for v in o.values(): cues(v, acc)
    elif isinstance(o, list):
        for v in o: cues(v, acc)
script = json.load(open('script.json')); bad = 0
for s in script:
    ws = [norm(w) for w in s['vo'].split()]; acc = []; cues(s.get('card', {}), acc)
    for a in acc:
        hits = [i for i, w in enumerate(ws) if w == norm(a)]
        if not hits: print(f"{s['id']}: cue '{a}' MISSING"); bad += 1
        elif len(hits) > 1: print(f"{s['id']}: cue '{a}' matches words {hits}; the first is used")
words = sum(len(s['vo'].split()) for s in script); chars = sum(len(s['vo']) for s in script)
print(f"{len(script)} scenes, {words} words, {chars} chars, ~{words / 3.0 + 0.9 * len(script) + 7:.0f}s at the 1.5x pace")
sys.exit(1 if bad else 0)
