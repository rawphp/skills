#!/usr/bin/env bash
# Keep a claimed do-work.io REQ fresh while the dw session that owns it lives.
# Beats every DW_HEARTBEAT_INTERVAL seconds (default 300) without `step`, so the
# server keeps dw's last step. Exits within one interval after owner_pid dies,
# so a dead run still goes stale. A failed beat does not stop the loop.
#
# `stop <pidfile>` ends the loop named in the pid file and removes the file. It
# kills only a heartbeat-loop.sh process, so a stale pid file spares whatever
# now holds that pid.
set -u

usage() {
  echo "usage: heartbeat-loop.sh <profile> <project> <req> <owner_pid>" >&2
  echo "       heartbeat-loop.sh stop <pidfile>" >&2
  exit 2
}

if [ "${1:-}" = stop ]; then
  [ "$#" -eq 2 ] || usage
  pid="$(cat "$2" 2>/dev/null)"
  case "$pid" in
  '' | *[!0-9]*) ;;
  *) ps -p "$pid" -o command= 2>/dev/null | grep -q heartbeat-loop.sh && kill "$pid" 2>/dev/null ;;
  esac
  rm -f "$2"
  exit 0
fi

[ "$#" -eq 4 ] || usage
profile="$1"
project="$2"
req="$3"
owner="$4"
interval="${DW_HEARTBEAT_INTERVAL:-300}"

case "$owner" in
'' | *[!0-9]*) usage ;;
esac

input="{\"project\":\"$project\",\"req\":\"$req\"}"
sleeper=""

trap '[ -n "$sleeper" ] && kill "$sleeper" 2>/dev/null; exit 0' TERM INT HUP

while :; do
  sleep "$interval" &
  sleeper=$!
  wait "$sleeper"
  sleeper=""
  kill -0 "$owner" 2>/dev/null || exit 0
  capabilities --profile="$profile" req heartbeat --input="$input" --json >/dev/null 2>&1 || true
done
