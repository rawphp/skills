#!/usr/bin/env bash
# Engine smoke test: builds the fixture project, renders two stills, checks the timeline shape. No ElevenLabs, no ffmpeg mux.
set -euo pipefail
SK="$(cd "$(dirname "$0")" && pwd)"; PY="${PY:-python3.14}"
T="$(mktemp -d)"; cp -R "$SK/fixtures/smoke/." "$T"; cd "$T"
node "$SK/build.mjs" >/dev/null
$PY - <<'EOF'
import json; tl=json.load(open('timeline.json')); s=tl['scenes']
assert [x['type'] for x in s]==['card','footage'], s
assert s[1]['capBottom'] is True and s[1]['src']==1
assert abs(s[1]['rings'][0]['t']-1.15)<1e-6
print('timeline ok')
EOF
node "$SK/render.mjs" --at 0.6,$($PY -c "import json;tl=json.load(open('timeline.json'));print(round(tl['scenes'][1]['start']+1.45,1))") >/dev/null
$PY - <<'EOF'
from PIL import Image; import glob
ims=sorted(glob.glob('preview/*.jpg')); assert len(ims)==2, ims
im=Image.open(ims[1]).convert('RGB'); px=im.getpixel
# the ring stroke is drawn OUTSIDE the rect: a highlight pixel must exist 3 px left of the rect's zoomed left edge; the exact x is derived below
import json; tl=json.load(open('timeline.json')); r=tl['scenes'][1]['rings'][0]['rect']
# camera framing: zoom 1.5 about the rect centre; the compositor maps rect x=600 to viewport (960-(800-600)*1.5)=660
left=int(960-(800-r['x'])*1.5)
assert any(px((left-3,540))[0]>200 and px((left-3,540))[2]<120 for _ in [0]), 'ring stroke not outside the rect'
print('render ok')
EOF
# a project folder that carries its own engine copy must be refused by check.sh, by name (check.sh can fail for other reasons)
mkdir engine; out=$("$SK/check.sh" --project "$T" 2>&1 || true)
if ! grep -q "MISS project" <<<"$out"; then echo "copied engine NOT refused"; exit 1; fi
echo "smoke ok"
