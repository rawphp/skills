#!/usr/bin/env bash
# State check before a video run. Prints what is missing; exit 1 if anything blocks.
dir="$(cd "$(dirname "$0")" && pwd)"; bad=0
need() { if eval "$2" >/dev/null 2>&1; then echo "ok   $1"; else echo "MISS $1 — $3"; bad=1; fi; }
need ffmpeg        "command -v ffmpeg && command -v ffprobe"          "brew install ffmpeg"
need node          "command -v node"                                  "install Node 20+"
PY="${PY:-python3}"
need python-libs   "$PY -c 'import PIL, numpy'"                       "set PY to a python3.x that imports PIL and numpy, or pip3 install pillow numpy"
need chrome        "test -d '/Applications/Google Chrome.app' || command -v google-chrome || command -v google-chrome-stable" "install Google Chrome (Playwright uses channel chrome)"
need playwright    "test -d '$dir/node_modules/playwright'"           "npm install --prefix '$dir'"
# ElevenLabs voices and effects: the key must be set and accepted. Prints the tier and characters left.
if [ -z "$ELEVEN_LABS_API_KEY" ]; then
  echo "MISS elevenlabs — export ELEVEN_LABS_API_KEY (create one at elevenlabs.io under API keys)"; bad=1
else
  r=$(curl -s -m 10 -w '\n%{http_code}' -H "xi-api-key: $ELEVEN_LABS_API_KEY" https://api.elevenlabs.io/v1/user/subscription)
  code=${r##*$'\n'}; body=${r%$'\n'*}
  # a past_due or unpaid subscription still answers this read, then the first tts.py call fails 401 payment_required
  sub=$(python3 -c 'import sys,json; print(json.load(sys.stdin).get("status", ""))' <<<"$body" 2>/dev/null)
  if [ "$code" = 200 ] && [[ "$sub" =~ ^(past_due|unpaid|incomplete|incomplete_expired|canceled)$ ]]; then
    echo "MISS elevenlabs — subscription is $sub; voice generation will fail until it is paid"; bad=1
  elif [ "$code" = 200 ]; then
    echo "ok   elevenlabs — $(python3 -c 'import sys,json; d=json.load(sys.stdin); print(d["tier"], "tier,", d["character_limit"] - d["character_count"], "characters left")' <<<"$body")"
  elif [ "$code" = 000 ]; then
    echo "MISS elevenlabs — can't reach api.elevenlabs.io"; bad=1
  elif grep -q missing_permissions <<<"$body"; then
    echo "ok   elevenlabs — key accepted; it lacks user_read, so characters left are unknown"
  else
    echo "MISS elevenlabs — key rejected (HTTP $code). Check it at elevenlabs.io under API keys"; bad=1
  fi
fi
# --project <dir>: refuse a project that carries a copied engine (drift). Reference scripts by path ($SK) instead.
if [ "${1:-}" = "--project" ] && [ -d "$2/engine" ]; then echo "MISS project — $2/engine exists; delete it and call the engine by path: SK=$dir"; bad=1; fi
exit $bad
