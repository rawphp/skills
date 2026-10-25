#!/usr/bin/env bash
# Upload the mp4 to the ticket in import-result.json, then confirm it.
# Usage: upload-video.sh <import-result.json> <video.mp4> [profile]
set -euo pipefail
R="$1"; V="$2"; P="${3:-watchalong}"
D=$(mktemp -d)
jq -r '.data.upload.fields | to_entries[] | "form = " + ("\(.key)=\(.value)" | @json)' "$R" > "$D/upload.conf"
curl -fsS -o /dev/null -w "upload http %{http_code}\n" -K "$D/upload.conf" -F "file=@$V" "$(jq -r '.data.upload.url' "$R")"
capabilities --profile="$P" run walkthroughs.confirm-video \
  --input="$(jq -c '{walkthrough_id: .data.walkthrough_id, upload_id: .data.upload.upload_id}' "$R")"
rm -rf "$D"
