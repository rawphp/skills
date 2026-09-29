#!/usr/bin/env bash
# Test heartbeat-loop.sh against a stub `capabilities` on PATH.
# Run: bash dw/scripts/heartbeat-loop.test.sh   (use /bin/bash to prove 3.2)
set -u

here="$(cd "$(dirname "$0")" && pwd)"
loop="$here/heartbeat-loop.sh"
tmp="$(mktemp -d)"
started=""
cleanup() {
  for p in $started; do
    pkill -P "$p" sleep 2>/dev/null
    kill "$p" 2>/dev/null
  done
  rm -rf "$tmp"
}
trap cleanup EXIT

cat >"$tmp/capabilities" <<'EOF'
#!/bin/sh
echo "$*" >>"$STUB_LOG"
[ -f "$STUB_FAIL" ] && exit 5
exit 0
EOF
chmod +x "$tmp/capabilities"

export PATH="$tmp:$PATH"
export STUB_LOG="$tmp/calls.log"
export STUB_FAIL="$tmp/fail"
export DW_HEARTBEAT_INTERVAL=1
: >"$STUB_LOG"
pidf="$tmp/heartbeat-REQ-1.pid"

fails=0
ok() { echo "ok   $1"; }
bad() { echo "FAIL $1"; fails=$((fails + 1)); }
beats() { wc -l <"$STUB_LOG" | tr -d ' '; }
alive() { kill -0 "$1" 2>/dev/null; }
stop() { "${BASH:-bash}" "$loop" stop "$pidf"; }

# start [default]: owner + loop; `default` runs with DW_HEARTBEAT_INTERVAL unset.
start() {
  sleep 600 &
  owner=$!
  if [ "${1:-}" = default ]; then
    (unset DW_HEARTBEAT_INTERVAL; exec "${BASH:-bash}" "$loop" dev dw REQ-1 "$owner") &
  else
    "${BASH:-bash}" "$loop" dev dw REQ-1 "$owner" &
  fi
  pid=$!
  started="$started $owner $pid"
}

# (a) it beats, without step, with the right args
start
sleep 2.5
n="$(beats)"
[ "$n" -ge 2 ] && ok "beats ($n calls in 2.5 s)" || bad "beats: $n calls in 2.5 s"
want='--profile=dev req heartbeat --input={"project":"dw","req":"REQ-1"} --json'
[ "$(head -1 "$STUB_LOG")" = "$want" ] && ok "args: $want" || bad "args: $(head -1 "$STUB_LOG")"

# (c) it survives the stub failing
touch "$STUB_FAIL"
before="$(beats)"
sleep 2.5
after="$(beats)"
if alive "$pid" && [ "$after" -ge $((before + 2)) ]; then
  ok "survives failing beats ($((after - before)) failed calls, still running)"
else
  bad "failing beats: alive=$(alive "$pid" && echo y || echo n) calls=$((after - before))"
fi
rm -f "$STUB_FAIL"

# (b) it exits within one interval after the owner dies, with no beat after.
# Kill the owner right after a beat, so the loop is at the start of its sleep.
last="$(beats)"
i=0
while [ "$(beats)" = "$last" ] && [ "$i" -lt 30 ]; do sleep 0.1; i=$((i + 1)); done
kill "$owner"
wait "$owner" 2>/dev/null
dead_at="$(beats)"
sleep 1.5
if alive "$pid"; then bad "still running 1.5 s after owner died"; else ok "exits after owner died"; fi
[ "$(beats)" = "$dead_at" ] && ok "no beat after owner died" || bad "beat after owner died"

# default interval is 300 s (under the 900 s stale line)
start default
sleep 0.5
sleeper="$(pgrep -P "$pid" -f 'sleep 300')"
[ -n "$sleeper" ] && ok "default interval 300 s" || bad "default interval: no 'sleep 300' child"

# stop mode (the line tracker.md runs) ends the loop and its sleep, removes the pid file
echo "$pid" >"$pidf"
stop
sleep 0.3
if alive "$pid"; then bad "stop left the loop running"; else ok "stop ends the loop"; fi
if [ -n "$sleeper" ] && alive "$sleeper"; then bad "stop left 'sleep 300' behind"; else ok "stop ends its sleep"; fi
[ -f "$pidf" ] && bad "stop kept the pid file" || ok "stop removes the pid file"

# stop with a stale pid file spares the unrelated process that holds the pid
echo "$owner" >"$pidf"
stop
if alive "$owner"; then ok "stale pid file spares an unrelated pid"; else bad "stop killed an unrelated pid"; fi
[ -f "$pidf" ] && bad "stale pid file kept" || ok "stale pid file removed"
kill "$owner" 2>/dev/null
wait "$owner" 2>/dev/null

# stop with no pid file is a no-op
stop && ok "stop without a pid file" || bad "stop without a pid file failed"

# bad args
if "${BASH:-bash}" "$loop" dev dw REQ-1 notapid 2>/dev/null; then bad "accepted a bad pid"; else ok "rejects a bad owner pid"; fi

[ "$fails" -eq 0 ] && echo "PASS" || { echo "$fails failed"; exit 1; }
