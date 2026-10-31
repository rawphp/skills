# CI: red checks and waiting on the Action

Read before acting on a red check or waiting on CI after a push. SKILL.md says when to wait; this file says how to tell whether a red check is the change, and how to wait without misreading a run.

## Reading a red check

- **Cancelled at the timeout after the tests passed.** Diff per-class durations against the previous green run (the time between consecutive test lines in the two logs). When classes the PR never touched are slower by the same factor, or the base's own last green runs spend most of the timeout on the same steps (`gh api …/jobs/<id>` step times), the runner or the margin is the cause: `gh run rerun <id> --failed`, watch again, and name the thin timeout margin in the hand-over.
- **A failing test the branch does not have.** The workflow tests `refs/pull/N/merge`, so a test the base added since runs against the PR's behaviour. Read it with `git show <remote>/<base>:<path>` and the run's report artifact (`gh run download <run> -n <artifact>`). When the PR's behaviour causes the failure it is the PR's: merge the base in, fix, and run that test on the merged tree before pushing.
- **A red base.** Two sibling PRs, each green alone, can merge minutes apart and leave the base red, and a merge of the base brings that into your gate. Before blaming the merge, `gh run list --branch <base>` for the tip. First `gh pr list -R <o/n> --state open` for a PR that already fixes the base: when a green one exists, wait for it to merge, then merge the base and run a `--full` round; copying its lines here duplicates the fix. A rerun does not help, since `gh run rerun` reuses the old `refs/pull/N/merge` commit and tests the old base. With no such PR, fix it in the round's commit (CI tests the merge ref, so the PR goes red too) and name both PRs in the commit and the hand-over.
- **A failing step that is a network call.** `gh run view --log-failed` refuses while any sibling job of the run is still going. `gh api repos/<o/n>/actions/jobs/<job id>` names the failed step at once. A registry, audit or download step that failed on the network is a rerun, not a fix.

## A finding that needs a run

Push, wait for the cold run, `gh run rerun <id>`, and read the second attempt. Steps inside a composite action never appear in the jobs API's `steps`, and the jobs logs endpoint often comes back empty: `gh run view -R <o/n> --job <id> --log | grep '<line>'` shows them. That command returns the run's latest attempt even for an earlier attempt's job id, so read the cold attempt before requesting the rerun. Cite the run id and attempt in the hand-over; the PR body line is the person's to change.

## The Action ran but did not review

A quiet PR comment after a push is not clean until the review-gate run says it reviewed.

- **"No gate went green."** The guard waits for the gates, then reviews. A cancelled gate, or one still queued when the guard's wait runs out, makes it log "no gate went green" and skip `review`, and a skipped review reads as done in `gh pr checks`. Wait for the build run on the head to complete, then check the review job's conclusion: `skipped` means getting the gate green (rerun a failed job; a slow one is already green), then `gh run rerun <review-gate run id>`, then `pr-state`.
- **A job stuck `in_progress`.** Every step done, the run `completed`, and the check run still pending: `gh api …/actions/jobs/<id>` shows `completed_at` null. `gh run rerun <run> --job <one stuck id>` replaces all the stale check runs; then rerun the review-gate run.
- **A green run with an unsaved round.** The run concludes `success`, yet `pr-state` still names the old round and head. Grep the review job's log for `incomplete`: nothing was saved, so the local round runs on the PR's last saved state plus your settles, and it decides.

## Waiting

- **Key the wait on the PR's head, not a run id.** Read `gh pr view N -R <o/n> --json headRefOid` each pass: another session's push cancels the run you watch, and a wait on that run reports "cancelled" and never sees the new head. When the head moved to a descendant, fast-forward the local branch, run the tests of the files it changed, and run one more round there (no `--full` unless a base merge came in). A `done` for a head the PR no longer has stops counting.
- **Write the wait loop for the shell it runs in.** BSD grep on macOS reads `\|` in a basic regex as a literal, so `grep 'a\|b'` never matches and the loop sleeps out its budget on a finished run: use `grep -E 'a|b'`. Decide "done" from `gh run list --json name,status` for the head's runs rather than by parsing `gh pr checks` text, and match run names as the runs print them, which can differ from the workflow file's title.
- **An empty answer is not green.** Seconds after a push, `gh pr checks` prints "no checks reported", which a loop that greps for pending lines reads as done. Key the wait on `gh run list --branch <b> --json headSha,status,conclusion` filtered to the pushed head, passed as the full `git rev-parse HEAD` (a pasted short sha never equals `headSha`): empty means not registered yet, and done means every run on that head is `completed`. A docs-only push can still start a path-filtered workflow, since `pull_request` path filters match the whole PR's files.
- **A draft flip can last seconds.** A PR can read `isDraft: true` right after a push and be ready again a minute later. Read the state again before obeying a stop-on-draft rule, do not push while it reads draft, and record the flip in the hand-over rather than ending the loop on it.
