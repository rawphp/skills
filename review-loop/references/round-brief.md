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
- PR: <N> in <owner/name>. The round script reads title and body from `gh pr view` itself.
- Previous round state: <scratch>/state.json (pass `--state-file`). <or: none; omit the flag> <or: pass `--full`; the base was merged since the last saved round>
- Scratch dir: <scratch>. Output dir: <scratch>/round<R>.
- Do NOT add `--maker-model`; the lead puts it in the round script only when the PR's maker is not opus.

## Run the round

Shell state does not persist between tool calls, so every command is self-contained.

Launch the round script the lead wrote, in its own Bash call. It survives the tool's 600000 ms cap; `run_in_background` does not, and a round takes 10 to 25 minutes:

rm -f <scratch>/round<R>.exit; cd <worktree path> && nohup bash <scratch>/round.sh <R> [--state-file <scratch>/state.json | --full] >/dev/null 2>&1 </dev/null & disown

Within 30 s, check `pgrep -f "review_gate review.*<scratch dir name>"` prints a pid; none and no exit file means the launch failed: report it and stop. Then poll `<scratch>/round<R>.exit` in bounded waits of about 2 minutes. Do not end your turn until it holds a number. If it holds one within the first minute, setup failed: report the last 20 lines of `<scratch>/round<R>.err` and stop.

Exit 0 or 1: cat <scratch>/round<R>/verdict.json in full. Read nothing else (not events.jsonl, report.md or summary.md).
Exit 2 or 4: no verdict. Report the last 20 lines of `<scratch>/round<R>.err`.

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
