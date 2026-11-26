# Running rounds and gates beside other sessions

Read before the first round. SKILL.md says when to run a round or a gate; this file says how to launch and stop one so it survives the tool cap, how to tell a hollow round, and how to work beside other loops and the factory.

## Scratch dir

`<scratch>` is `~/.cache/rg-<repo>-<N>-<session id>/`: `/tmp` gets wiped mid-loop, and a second loop on the same PR writes into an unsuffixed dir. Round `--out` dirs, suite logs, the round and settle scripts, and each round's edits as a script all live there.

## Launching

- **A round** outlives the 600 000 ms cap that kills a `run_in_background` call; a round takes 10 to 25 minutes. Write `<scratch>/round.sh <R> [flags]`: it reads title and body with `gh pr view` inline (retry each read a few times, 10 s apart, on a network blip), refuses to start when either is empty, runs the CLI, and writes its exit code to `<scratch>/round<R>.exit`. Delete a stale exit file, launch with `nohup bash <scratch>/round.sh <R> >/dev/null 2>&1 </dev/null & disown` in its own call, then within 30 s check `pgrep -f "review_gate review.*<scratch dir name>"` (macOS has no `setsid`, and a failed background launch is silent). Poll the exit file in bounded waits, then read only `verdict.json`.
- **A full gate** that must outlive the cap: `( { a && b && c; } > <log> 2>&1; echo "exit $?" >> <log> ) </dev/null >/dev/null 2>&1 & disown`, then poll the log's `exit` line. Not `nohup`: an ignored SIGHUP survives `exec`, and tests that expect a child to die on hang-up fail every time. Redirect all three fds or the call stays open to its timeout. Chain with `&&`, not `( set -e; … )`, which zsh runs past a failing formatter; grep the log for the formatter's own diff marker before committing.
- **Gate each fix commit in a detached worktree** of its own (`git worktree add --detach <path> <sha>`, provisioned as in `setup.md`; reuse it with `git checkout --detach <next sha>`). A gate in the loop's tree reads whatever files are there when each test loads, so fixing the next round meanwhile voids it.
- **Launch the next round only after the push landed** (`git rev-parse <remote>/<pr-branch>` equals `HEAD`), in its own call. `a && git push && nohup … & disown` backgrounds the whole chain, gates and push included, because `&` binds looser than `&&`.
- **A time gate goes on the action**, not the loop: `for …; do [ now -ge T ] && break; sleep; done; <action>` runs the action when the loop runs out.

## Stopping

- Kill only your own processes: record `$!` or start under a process group, check `lsof -a -p <pid> -d cwd` is your worktree or the log path is in its command line, then kill in a separate command. Never by a `pgrep pest` / `ps | grep` match, which can hit another worktree's run.
- A `nohup`'d CLI ignores SIGINT: `kill -TERM` exits it (143) with nothing saved.
- `pgrep -f 'review_gate review'` is machine-wide: match your own round by its `--out` dir. Use `-f`, not `-fl`, which prints the whole command line, body included.

## Hollow rounds

The CLI picks reviewers unlike the maker: a maker string containing "opus" puts the reviewers on sonnet. Leave `--maker-model` out on an opus-made PR; never pass one model to every PR. After each round, read `model`, `num_turns` and `duration_ms` on each `persona_finished` in `events.jsonl` (only those fields). Every persona at one turn in under ~10 s is hollow, not clean: compare with the repo's earlier rounds (`~/.cache/rg-<repo>-*/round*/events.jsonl`) and rerun on the stronger model. A short round with several turns per persona is real; so is one with `round_started.scope` and `head` naming the new head.

## Other writers

Another loop, a person's session or the factory can work the same PR, on this machine or another, from a clone that `git worktree list` and `lsof` in this repo never show.

- **After each round exits and before the first edit**, `git ls-remote <remote> refs/heads/<pr-branch>` against the head you adopted (a clone whose fetch refspec names only `main` leaves `<remote>/<pr-branch>` frozen), `pgrep -f 'review_gate review'`, and `git -C <each clone> worktree list | grep <pr-branch>`. Before every commit, settle and round, read `git branch --show-current` and `git rev-parse HEAD` in the tree you run from; at the first foreign commit or branch switch, move to your own worktree outside the repo.
- **Who pushed a foreign commit:** `git -C <clone> reflog show <pr-branch>` in the person's other clones and Paradev worktrees gives its creation, commit and push times; `<clone>/.git/review/<branch, / as %2f>.json` shows a second loop's last round. The factory's run ledger rules the factory in or out.
- **A subagent that reports "interrupted"** may rerun the round by itself minutes later. Send it "run nothing further" before launching the round yourself.
- **As a babysit-prs worker,** read the lead's answers file as a gate in each push chain, not only in the waits.

## The factory

The factory-runner ledger is `~/.config/factory-runner/runs/<owner>__<repo>__<issue>__<attempt>.jsonl` (t3fac on `trilogy-mac`: `~/.config/t3fac/factory/runs/`). Read it with `jq -c 'select(.event=="step_changed" or .event=="state_changed")|{ts,event,data}' <ledger> | tail`; a grep for `"step"` also matches `cause.step`.

- **Before step 2,** read the newest attempt's ledger and the issue's labels. `factory:building`, a recent `session_launched` (on any machine), a gate post or a push in the last 30 minutes, or the PR back in draft (`isDraft`, the timeline's `convert_to_draft` actor) means the factory is rebuilding: stop and ask, and by default wait until it releases the PR.
- **At `pr-open`** every push makes the factory re-gate the head in its own checkout. A red re-gate, even an untouched timing test under load, turns the PR back to draft and relaunches a session that pushes. Push only when the last `state_changed` is `to: pr-open` and the gate on the current head has finished; after a push, wait for `gate-passed <sha>` before the next. When it relaunches, keep your fix local, wait for its push and gate, merge its head, gate, then push.
- **Its gate has a hard timeout.** Before a full local suite, check the last `gate_checkout` has a `gate_finished` after it; otherwise gate later or run only the touched files.
- **A push whose only commit is `Merge remote-tracking branch 'origin/main'`**, with the ledger reading pr-open → building → gate-passed <that sha> → pr-open, is the factory re-gating after the base moved. Merge `<remote>/<pr-branch>`, gate, run the next round with `--full`.
- **`gate_finished` (exit 2) then "Factory sessions send failed."** is not stuck: wait a couple of minutes for a new `gate_checkout`, and read the gate log's `FAIL` lines.
- **`stuck` then `finished` with `outcome: stuck`** means the factory has let the PR go: nothing re-gates a push, so pushing is safe. The PR stays a draft until the person marks it ready.

## Shell and git traps

- zsh reads `$b:r`, `$b:a`, `$b:f` as modifiers: brace every variable before a colon (`"${b}:path"`, `+refs/heads/${b}:refs/remotes/<remote>/${b}`), and check `git rev-parse <remote>/${b}` equals `headRefOid` before trusting a trial merge.
- jq cannot add a string and a boolean: gate on `-q '.state+(.isDraft|tostring)'` equal to `OPENfalse`.
- `pest --parallel` (paratest) takes one path: several exit "Too many arguments", which reads as a failure. List the files in a throwaway copy of `phpunit.xml` and run `-c <copy>`, or one path per call, and grep for the runner's own result line.
