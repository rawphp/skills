# Worker brief

Fill every `<...>` and delete lines that do not apply. The brief is the worker's only context: what you leave out, it rediscovers or gets wrong. Keep the hard rules word for word.

```text
Get pull request #<N> (branch `<branch>`, base `<base>`, closes issue #<issue>, repo <owner/name>) to: CI green on the pushed head AND a local review-gate round scoring 5/5 (`done`) on that same pushed head. Do NOT merge it and do NOT mark it ready; I do that. The person asked for the findings to be fixed, so you are the author for the loop. Poll in bounded ~2-minute Bash waits inside your turn while a round or CI runs, and while you wait for an answer from me; do not end your turn until you have written a final report or hit a stop rule.

TALKING TO ME (use files; messages are unreliable):
- To tell me anything (5/5 + green CI, a stop rule, a decision you need, any status): overwrite <inbox>/pr<N>.md with the full message.
- To get my answer: poll <inbox>/answers/pr<N>.md (watch for it to appear or its mtime to change) every ~2 minutes, and act on what it says. Keep working on everything that does not depend on the answer.

How: load the `review-loop` skill and follow it, with `review-gate` for round mechanics. Read their field-lessons files.

What I already know (<date, time>):
- <draft or ready; head sha; diff size; files and lines; one line on what the PR does>
- <CI state on that head: which checks fail, when that run was, and what it is probably not>
- <the base moved: merge origin/<base> in first, never rebase or force-push; expected conflicts and how to resolve generated files>
- <what the base is red on right now, and that it is being fixed elsewhere>
- <known flakes and the command that clears them>
- <what the PR author's own gate skips that CI runs: the guard tests and environment differences that bit earlier PRs>
- <sibling PRs in the same files: which, and who merges first>
- <decisions already made that this PR must respect>
- <the review rules that matter for this kind of change: money, auth, migrations, offline storage, infrastructure, AI features>
- <whether the review Action will review this PR; whether `--state-file` is needed; existing worktree or local review state>
- Main checkout: <path> (on <base>). Create your own worktree outside the repo at <path>. Absolute paths in every Bash call. Never `git stash`.

Hard rules:
- <model-call routing for this machine, e.g. the env prefix every review_gate call needs>
- Post NO comments on the PR<: reason>. `git fetch` before every commit and push; if someone else pushed, merge their commits.
- Do not settle findings yourself and do not file issues on your own. Plain defects with one obvious fix: just fix them. If a finding is wrong, pinned by the issue's acceptance criteria, already on the base, or a real choice between alternatives, report it once (the file) with: the finding, the issue text that pins it, lettered options, and your recommendation. Do not implement a default and do not run another round while it is open.
- Keep the PR body true with `gh pr edit <N> --body-file` (only stale lines); remove any tool byline.
- <local test limits: what may run locally, with timeouts; what to leave to CI>. If a cleanup command is refused by a permission prompt, leave it and name it in your report.
- Commits: change only, no co-author trailer, no byline, no --no-verify, never skip or weaken a test.
- Stop per the skill's no-progress rule, or if a round is `incomplete` twice.

Final report (in the file), short: final head sha; last round's score, status, round number and counts; CI state on that head; what you fixed (one line each); settled findings with their reasons; anything left open with why; what a deploy of this change does, if it has one; the worktree path (leave it in place).
```

## Extra lines by kind of PR

- **Infrastructure:** never run a deploy, a diff against an account, or any command that changes cloud state; synth and assertion tests only. Ask for a plain "what deploying this does" paragraph: in-place update or replacement, restart or not, which environments.
- **Mobile or native:** CI only bundles. Ask for a "verify on a real device before go-live" list in the docs and the PR body.
- **Money, approval, auth:** authorisation on every route with a cross-tenant test, state transitions and their races, lock order, idempotency, an audit entry per action, one rounding rule.
- **A PR that touches a file a follow-up issue also names:** say which issue, and that its fix is not this PR's.
- **A takeover of a stalled worker's PR:** list the worktree, the unpushed commits, the unstaged files and the old worker's last command, and tell the replacement to verify all of it, and throw nothing away unread, before building on it.
