#!/usr/bin/env bash
# One status block per pull request, then every worker report in the inbox.
# Run from inside the repository. Usage: tick.sh <PR> [<PR> ...]
set -uo pipefail

if [ "$#" -eq 0 ] || [ "$1" = "--help" ]; then
  echo "usage: tick.sh <PR> [<PR> ...]   (env BABYSIT_INBOX, default /tmp/babysit-prs)"
  exit 2
fi

INBOX="${BABYSIT_INBOX:-/tmp/babysit-prs}"
common="$(git rev-parse --git-common-dir 2>/dev/null)" || { echo "not in a git repository"; exit 2; }
review_dir="$(cd "$common" && pwd)/review"

date
for n in "$@"; do
  view="$(gh pr view "$n" --json state,headRefOid,isDraft,mergeStateStatus,headRefName \
    --jq '[.state, .headRefOid[0:9], (if .isDraft then "draft" else "ready" end), .mergeStateStatus, .headRefName] | @tsv' 2>/dev/null)"
  if [ -z "$view" ]; then echo "$n  (could not read the pull request)"; continue; fi
  checks="$(gh pr checks "$n" 2>/dev/null)"
  counts="$(printf '%s\n' "$checks" | awk -F'\t' 'NF>1 {c[$2]++} END {for (k in c) printf "%s=%d ", k, c[k]}')"
  printf '%s  %s  | %s\n' "$n" "$view" "${counts:-no checks}"
  printf '%s\n' "$checks" | awk -F'\t' '$2=="fail" {print "    FAIL " $1}'

  # Local review-gate state for the PR branch, and for an rl/<N> worker branch if one exists.
  branch="$(printf '%s' "$view" | awk -F'\t' '{print $5}')"
  for b in "$branch" "rl/$n"; do
    f="$review_dir/$(printf '%s' "$b" | sed 's#/#%2f#g').json"
    [ -f "$f" ] || continue
    python3 - "$f" "$b" <<'PY'
import json, sys
d = json.load(open(sys.argv[1]))
open_ = [(f["id"], f["severity"], f["status"]) for f in d.get("findings", []) if f.get("status") != "fixed"]
print(f"    review {sys.argv[2]}: round {d.get('round')} at {str(d.get('head',''))[:9]} not-fixed {open_}")
PY
  done
done

running="$(pgrep -fl 'review_gate review' 2>/dev/null | grep -o -- '--pr [0-9]*' | tr '\n' ' ')"
echo "rounds running: ${running:-none}"

echo "--- worker reports ($INBOX)"
shopt -s nullglob
for f in "$INBOX"/*.md; do
  echo "## $(basename "$f") (written $(date -r "$f" '+%H:%M'))"
  head -c "${BABYSIT_REPORT_BYTES:-2500}" "$f"
  echo
done
uptime
