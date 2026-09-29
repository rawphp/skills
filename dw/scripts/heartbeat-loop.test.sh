#!/usr/bin/env bash
# Test heartbeat-loop.sh against a stub `capabilities` on PATH.
# Run: bash dw/scripts/heartbeat-loop.test.sh   (use /bin/bash to prove 3.2)
set -u

here="$(cd "$(dirname "$0")" && pwd)"
loop="$here/heartbeat-loop.sh"
tmp="$(mktemp -d)"
trap 'kill "$owner" "$pid" 2>/dev/null; rm -rf "$tmp"' EXIT

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

fails=0
ok() { echo "ok   $1"; }
bad() { echo "FAIL $1"; fails=$((fails + 1)); }
beats() { wc -l <"$STUB_LOG" | tr -d ' '; }
alive() { kill -0 "$1" 2>/dev/null; }

start() {
  sleep 600 &
  owner=$!
  "${BASH:-bash}" "$loop" dev dw REQ-1 "$owner" &
  pid=$!
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

# (b) it exits within one interval after the owner dies
kill "$owner"
wait "$owner" 2>/dev/null
sleep 1.5
if alive "$pid"; then bad "still running 1.5 s after owner died"; else ok "exits after owner died"; fi
last="$(beats)"
sleep 1.5
[ "$(beats)" = "$last" ] && ok "no beats after exit" || bad "beat after exit"

# stop via kill (pid file path in dw) ends it at once
start
sleep 0.5
kill "$pid"
sleep 0.3
if alive "$pid"; then bad "TERM did not stop it"; else ok "stops on TERM"; fi
kill "$owner" 2>/dev/null
wait "$owner" 2>/dev/null

# bad args
if "${BASH:-bash}" "$loop" dev dw REQ-1 notapid 2>/dev/null; then bad "accepted a bad pid"; else ok "rejects a bad owner pid"; fi

[ "$fails" -eq 0 ] && echo "PASS" || { echo "$fails failed"; exit 1; }
