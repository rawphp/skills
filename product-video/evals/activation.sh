#!/usr/bin/env bash
# activation.sh: for each "expected<TAB>prompt" line, the FIRST Skill call must equal expected. Runs claude -p so nothing is built.
# The run has only the Skill tool (--tools Skill), so it cannot do the work, and runs in an empty folder, so no project
# instructions steer it. Costs roughly $0.3-1 per prompt on the default model.
set -uo pipefail
D="$(cd "$(dirname "$0")" && pwd)"; miss=0
cd "$(mktemp -d)"
while IFS=$'\t' read -r want p; do
  [ -z "${p:-}" ] && continue
  out=$(claude -p "$p. (Activation test: invoke the skill you would start with, then stop; do no other work.)" --output-format json --max-turns 2 --tools Skill 2>/dev/null </dev/null)
  first=$(printf '%s' "$out" | python3 -c "
import sys, json
try: d = json.load(sys.stdin)
except Exception: print('error'); sys.exit()
calls = []
for m in d if isinstance(d, list) else d.get('messages', [d]):
    content = m.get('message', m).get('content')
    for c in (content if isinstance(content, list) else []):
        if isinstance(c, dict) and c.get('type') == 'tool_use' and c.get('name') == 'Skill': calls.append(c['input'].get('skill'))
print(calls[0] if calls else 'none')")
  if [ "$first" = "$want" ]; then echo "ok   $p"; else echo "MISS $p -> $first (expected $want)"; miss=$((miss+1)); fi
done < "$D/activation.txt"
echo "$miss misses"; exit $((miss > 0))
