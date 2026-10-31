# Round brief for the review subagent

Fill every `<...>` and dispatch as the subagent's whole prompt (general-purpose, cheap model), once per loop. The subagent runs the CLI and reports; it fixes nothing. `--state-file` goes only on your first local round when the PR already has an Action comment (SKILL.md's round table); drop it otherwise. `<R>` is the PR's round number: the state's `round` plus one, or 1. Never paste a token value into the brief; it carries the `gh auth token` command, and a guard that blocks a bare `gh auth token` call is not a reason to print one.

For every later round, `SendMessage` the same agent: the new head sha, the new `<R>` and output dir, whether `--state-file` or `--full` applies, and "same recipe and report shape". It keeps the rest.

```text
You are running one review round of the review-gate-v2 CLI on a branch and reporting the verdict. You do NOT fix, commit or push anything. Run the CLI, wait for it, read verdict.json, report.

## Setup facts (verified, do not re-derive)

- Repo under review (a git worktree; run EVERY command from here, never cd elsewhere): <worktree path>
- Branch: <pr branch>. HEAD must be <head sha>. Verify with `git rev-parse HEAD` first; if it differs, stop and report.
- review-gate-v2 checkout: <$REVIEW_GATE_V2_HOME or checkout path> (use as PYTHONPATH on every python call).
- GitHub token: put `GITHUB_TOKEN="$(gh auth token<-u account, when setup needed one>)"` on the same command as every python call. The CLI reads GITHUB_TOKEN, not GH_TOKEN.
- Base ref: <remote>/<pr base branch> (the PR's base; already fetched).
- PR: <N> in <owner/name>. Title in /tmp/rg-<repo>-<N>/title.txt, body in /tmp/rg-<repo>-<N>/body.txt.
- Previous round state: /tmp/rg-<repo>-<N>/state.json (pass `--state-file`). <or: none; omit the flag> <or: pass `--full`; the base was merged since the last saved round>
- Output dir: /tmp/rg-<repo>-<N>/round<R>.
- Do NOT pass `--maker-model`.

## Run the round

Shell state does not persist between tool calls, so every command is self-contained. Make the scratch dir in its own call and note the printed path as <run>:

cd <worktree path> && run="$(mktemp -d)"; echo "$run"

Launch the CLI as its own Bash call with `run_in_background: true` and a 600000 ms timeout. Run it in that call's foreground, redirects and exit capture inline. Never `( … ) &`: a backgrounded subshell holds the tool call open to its timeout and nothing tracks the CLI.

cd <worktree path> && GITHUB_TOKEN="$(gh auth token<-u account>)" PYTHONPATH=<checkout> python3 -P -m review_gate review --format plain --base <remote>/<base> --pr <N> [--state-file /tmp/rg-<repo>-<N>/state.json | --full] --out /tmp/rg-<repo>-<N>/round<R> --title "$(cat /tmp/rg-<repo>-<N>/title.txt)" --body "$(cat /tmp/rg-<repo>-<N>/body.txt)" > <run>/out 2> <run>/err; echo $? > <run>/exit

If a guard refuses that call (an isolated session that cannot show the command is not git), write it to a script under the session's tmp dir (the cd, the command with "$@" for the extra flags, the exit capture) and run `bash <script>` the same way, background and timeout as above; do not retry the inline form.

The harness tells you when it exits; a round takes 10 to 25 minutes. Do not end your turn until <run>/exit holds a number. If it holds one within the first minute, setup failed: report all of <run>/err and stop.

Exit 0 or 1: cat /tmp/rg-<repo>-<N>/round<R>/verdict.json in full. Read nothing else (not events.jsonl, report.md, summary.md or <run>/out).
Exit 2 or 4: no verdict. Report the last 20 lines of <run>/err.

## Report back (exact shape, under about 4000 characters)

The notification that carries your report truncates long text, so what matters most comes first.

1. Round row: round, door.kind (and door.rollback if set), risk, score, status (done, open, or incomplete ...), pr.url. Then the exit code.
2. `counts` verbatim.
3. A table of EVERY finding whose status is open, nits included: id, severity, class, every site as file:line, full title, FULL scenario text, FULL fix text, copied out of verdict.json. If the cap would cut a finding, give its id, title and sites and write "fix text in verdict.json" instead of truncating mid-sentence.
4. Findings marked fixed or settled: ids only.
5. Absolute paths of report.markdown and report.html (html may be null).
6. Reviewers that failed, if any.

Be literal. Copy text out of verdict.json rather than paraphrasing.
```
