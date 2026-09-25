#!/usr/bin/env bash
# Episode log: append | query | gc
set -euo pipefail
cmd="${1:-}"
log="${2:-}"

usage() {
  echo "usage: log-episode.sh append <log.jsonl>   # JSON object on stdin" >&2
  echo "       log-episode.sh query  <log.jsonl> <text> [k=3]" >&2
  echo "       log-episode.sh gc     <log.jsonl> [days=90]" >&2
  exit 2
}

[ -n "$cmd" ] && [ -n "$log" ] || usage
mkdir -p "$(dirname "$log")"

py() {
  if command -v python3 >/dev/null 2>&1; then
    python3 "$@"
  else
    echo "python3 required" >&2
    exit 1
  fi
}

case "$cmd" in
append)
  payload="$(cat)"
  py - "$log" "$payload" <<'PY'
import json, sys, datetime
path = sys.argv[1]
raw = sys.argv[2].strip()
if not raw:
    sys.exit("empty episode")
obj = json.loads(raw)
obj.setdefault("ts", datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"))
obj.setdefault("pin", False)
need = ("task", "weight", "outcome")
missing = [k for k in need if not obj.get(k)]
if missing:
    sys.exit("episode missing: " + ",".join(missing))
with open(path, "a") as f:
    f.write(json.dumps(obj, separators=(",", ":")) + "\n")
print("appended", path)
PY
  ;;
query)
  text="${3:-}"
  k="${4:-3}"
  [ -n "$text" ] || usage
  [ -f "$log" ] || { echo "no log"; exit 0; }
  py - "$log" "$text" "$k" <<'PY'
import json, sys, re
path, text, k = sys.argv[1], sys.argv[2].lower(), int(sys.argv[3])
words = set(re.findall(r"[a-z0-9_./-]{3,}", text))
rows = []
with open(path) as f:
    for line in f:
        line = line.strip()
        if not line:
            continue
        try:
            obj = json.loads(line)
        except json.JSONDecodeError:
            continue
        blob = " ".join([
            str(obj.get("task") or ""),
            str(obj.get("approach") or ""),
            str(obj.get("errors") or ""),
            " ".join(obj.get("files") or []),
        ]).lower()
        score = sum(1 for w in words if w in blob)
        if score:
            rows.append((score, obj))
rows.sort(key=lambda x: -x[0])
for score, obj in rows[:k]:
    print(json.dumps({"score": score, "episode": obj}, separators=(",", ":")))
PY
  ;;
gc)
  days="${3:-90}"
  [ -f "$log" ] || exit 0
  py - "$log" "$days" <<'PY'
import json, sys, datetime
path, days = sys.argv[1], int(sys.argv[2])
cutoff = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=days)
keep = []
dropped = 0
with open(path) as f:
    for line in f:
        line = line.strip()
        if not line:
            continue
        try:
            obj = json.loads(line)
        except json.JSONDecodeError:
            keep.append(line)
            continue
        if obj.get("pin"):
            keep.append(json.dumps(obj, separators=(",", ":")))
            continue
        ts = obj.get("ts") or ""
        try:
            dt = datetime.datetime.strptime(ts, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=datetime.timezone.utc)
        except ValueError:
            keep.append(json.dumps(obj, separators=(",", ":")))
            continue
        if dt >= cutoff:
            keep.append(json.dumps(obj, separators=(",", ":")))
        else:
            dropped += 1
with open(path, "w") as f:
    f.write("\n".join(keep) + ("\n" if keep else ""))
print(f"gc dropped={dropped} kept={len(keep)}")
PY
  ;;
*)
  usage
  ;;
esac
