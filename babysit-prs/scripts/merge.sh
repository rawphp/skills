#!/usr/bin/env bash
# Guarded merge of one pull request at a reviewed head. Run from inside the repository.
set -uo pipefail

usage() {
  cat <<'EOF'
usage: merge.sh <PR> <head-sha-prefix> [--ready] [--worktree <path>] [--method squash|merge|rebase] [--keep-trailers]

Refuses unless the PR's head starts with <head-sha-prefix> and every check is pass or skipping.
  --ready            mark a draft ready for review before merging
  --worktree <path>  remove this worktree after the merge
  --method           merge method (default squash)
  --keep-trailers    keep Co-Authored-By trailers and tool bylines in the squash body
Exit: 0 merged, 1 refused (head moved, checks not green, merge rejected), 2 usage.
EOF
}

[ "$#" -ge 2 ] || { usage; exit 2; }
pr="$1"; want="$2"; shift 2
ready=0; worktree=""; method="squash"; strip=1
while [ "$#" -gt 0 ]; do
  case "$1" in
    --ready) ready=1 ;;
    --worktree) worktree="${2:-}"; shift ;;
    --method) method="${2:-}"; shift ;;
    --keep-trailers) strip=0 ;;
    --help) usage; exit 0 ;;
    *) usage; exit 2 ;;
  esac
  shift
done

head="$(gh pr view "$pr" --json headRefOid --jq .headRefOid)" || exit 1
case "$head" in
  "$want"*) ;;
  *) echo "refused: PR $pr head is $head, not $want. Review the new head first."; exit 1 ;;
esac

state="$(gh pr view "$pr" --json state --jq .state)"
[ "$state" = "OPEN" ] || { echo "refused: PR $pr is $state"; exit 1; }

not_green="$(gh pr checks "$pr" 2>/dev/null | awk -F'\t' 'NF>1 && $2!="pass" && $2!="skipping" {print "  " $2 "  " $1}')"
if [ -n "$not_green" ]; then
  echo "refused: checks on $head are not all pass/skipping:"; echo "$not_green"; exit 1
fi

threads="$(gh pr view "$pr" --json reviewDecision,url --jq .url)"
owner_repo="$(printf '%s' "$threads" | sed -E 's#https://github.com/([^/]+/[^/]+)/pull/.*#\1#')"
unresolved="$(gh api graphql -f query='query($o:String!,$r:String!,$n:Int!){repository(owner:$o,name:$r){pullRequest(number:$n){reviewThreads(first:100){nodes{isResolved}}}}}' \
  -f o="${owner_repo%/*}" -f r="${owner_repo#*/}" -F n="$pr" \
  --jq '[.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved | not)] | length' 2>/dev/null || echo 0)"
if [ "${unresolved:-0}" != "0" ]; then
  echo "refused: $unresolved unresolved review thread(s) on PR $pr"; exit 1
fi

args=(--"$method" --match-head-commit "$head")
if [ "$method" = "squash" ] && [ "$strip" -eq 1 ]; then
  body="$(mktemp)"
  gh pr view "$pr" --json commits \
    --jq '.commits[] | "* " + .messageHeadline + (if (.messageBody | length) > 0 then "\n\n" + .messageBody else "" end) + "\n"' \
    | grep -v -i -E '^co-authored-by:|generated with \[?claude code|claude\.com/claude-code' > "$body"
  args+=(--body-file "$body")
fi

if [ "$ready" -eq 1 ] && [ "$(gh pr view "$pr" --json isDraft --jq .isDraft)" = "true" ]; then
  gh pr ready "$pr" >/dev/null || { echo "refused: could not mark PR $pr ready"; exit 1; }
fi

gh pr merge "$pr" "${args[@]}" 2>&1
for _ in 1 2 3 4 5 6; do
  state="$(gh pr view "$pr" --json state --jq .state)"
  [ "$state" = "MERGED" ] && break
  sleep 3
done
if [ "$state" != "MERGED" ]; then
  echo "refused: PR $pr is $state after the merge call. Read the message above (base policy, unresolved threads, required checks)."
  exit 1
fi
echo "merged: PR $pr at $(gh pr view "$pr" --json mergeCommit --jq .mergeCommit.oid)"

if [ -n "$worktree" ] && [ -d "$worktree" ]; then
  git worktree remove --force "$worktree" && echo "removed worktree $worktree"
fi
inbox="${BABYSIT_INBOX:-/tmp/babysit-prs}"
rm -f "$inbox/pr$pr.md" "$inbox/answers/pr$pr.md"
exit 0
