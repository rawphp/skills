# branch-ship-loop field lessons

## 1. Peer-package vendor patches are residual on the consuming branch

Symptom: a post-install script mutates `vendor/` so a documented peer API (`run()` returning a result envelope) actually works. Deep review wants Request changes / do-work.

Cause: the peer lives in another repo. The consuming branch cannot ship the real pipeline fix.

Default: if tests lock the patched path, list it as residual. Do not open do-work on the app branch. Do not block READY for it. Fix the peer, then bump.

## 2. Re-diff the working tree before A3 overwrites

Symptom: A3 starts from a review snapshot, then another agent (or you in another pane) writes the same files. Blind search-replace clobbers an aligned fix or leaves a half-merged parser name.

Cause: preconditions are not sticky. Shared checkouts keep moving.

Default: immediately before each A3/B3 edit, `git status` + `git diff` the finding paths. If the tree already contains the intended shrink/delete, keep it and only fill gaps. Do not revert aligned concurrent work.

## 3. Diff-check A1 subagent findings before A3

Symptom: a deep reviewer files unfinished-cutover or unused-abstraction findings on files this branch barely touched.

Cause: the subagent reviewed the module as it exists, not `git diff base...HEAD`.

Default: before classifying or opening do-work, confirm the cited lines changed vs base. Unchanged pre-existing soup is residual. Do not Intake it.

## 4. Unimplemented first-slice verbs are residual

Symptom: a deep review of a new HTTP plane plus a start-only daemon files "loop ignores stop" or "Events() is a fake" as Request changes / do-work.

Cause: the subagent scored protocol completeness, not maintainability of the laws this branch actually shipped.

Default: write-without-read of an existing helper (mint discarded, redeem returns empty) is incomplete cutover. Sibling verbs the first slice does not call yet are residual. Do not Intake "finish the daemon" from this skill.

## 5. Omit vs false-alive is a join — re-read HEAD before swapping

Symptom: A3 changes a daemon snapshot from omit-on-death to "keep listed, flag dead" (or the reverse) because deep review called Reap the wrong transition. A parallel REQ on the same tip already mapped omit → fail and listed-false → a different fail.

Cause: heartbeat listed-ness and the dead flag are two different server transitions. Preconditions and A1 snapshots go stale on a hot integration branch.

Default: before editing omit vs false, re-read the consumer's current transition table on HEAD. If a landed test already names omit-as-fail, keep omit. Do not "complete" liveness by swapping the two signals.

## 6. Hung A1 subagent is not a stalled loop

Symptom: a deep review subagent runs for many minutes (100+ tool calls, web fetches) and never writes findings. The loop waits instead of gating.

Cause: the subagent report is evidence. The orchestrator already has to re-open cited paths on HEAD. Waiting for a silent reviewer does not produce a better A1.

Default: bound the wait. If there is no findings document, kill the subagent and emit A1 from the orchestrator HEAD walk. Do not skip A3 because the reviewer never returned. If the reviewer starts `web_fetch` on a local `base...HEAD` git review, kill it then — do not wait for 100+ tools. A two-file diff still on turn 1 after ~60 local reads is wandering; kill then.

## 7. Named upcoming-churn spec is residual

Symptom: deep review wants Request changes on handshake/ack/copy files the user already said a design spec will rewrite.

Cause: A1 walks the whole `base...HEAD` range. The spec's Files table is the churn set.

Default: when the user names a spec as upcoming churn, treat that spec's Files table plus the wire/copy it names as residual. Do not A3 or Intake those paths. Gate the remainder. READY in that pass does not mean the deferred spec is ship-cleared.

## 8. Closed-Issue residual is not a new UR

Symptom: deep A1 re-files a lock/fail-close finding the standing Issue's close report already named residual, then Intake wants a second UR.

Cause: "prior READY is not evidence a cutover is done" gets read as "always reopen." The join did not change. Only the reviewer is new.

Default: re-check the cited paths on HEAD. If they still match that named residual and the production join is unchanged, keep it residual. Do not Intake. Re-open only when a helper or call-site of that law changed after the residual was written.

## 9. Non-simple on a review branch stays on that branch

Symptom: `/do-work go` after ship-loop Intake merges the REQ worktree into `new-work`, and the branch under review never gets the fix.

Cause: do-work `delivery.mode: merge` uses the integration base from `ensure-integration-base`, not the review branch.

Default: after Intake → Ideate → Capture for a ship-loop non-simple item on a named review branch, do serial in-session TDD and the REQ commit on that branch. Do not run go Stage B merge onto `new-work`.

## 10. In-flight claims on finding paths block Intake

Symptom: ship-loop Intake/Capture for an extract, then `claim` returns `footprint-overlap` because another factory already holds the same production files.

Cause: tip-relative Done on the standing Issue does not see a sibling Issue's `in_progress` claim. Files table overlap is the occupancy.

Default: before Intake, list in-progress (and done-unarchived) claims whose Files overlap the finding paths. Live heartbeat → do not Intake, do not `unblock`. Report NOT READY with the occupying REQ id. Resume after that claim archives.

## 11. Tagged version section is not Unreleased

Symptom: B3 or a prior READY commit names a published binary's new wire in the latest dated CHANGELOG section. That version is already tagged on the base. The gate looks documented. The tag does not contain the change.

Cause: today's date matching the last release date, plus "there is already an Added list, append here." Prior READY is not a version-story check.

Default: before treating CHANGELOG mitigation as adequate, compare the section heading to `git tag` / the base tip. If that version is already tagged, put new consumer bullets under Unreleased. Do not append to the tagged section. A prior READY that filed notes in the tagged section is still open until they move.

## 12. Review-model slugs the host rejects are not a stalled A1

Symptom: `spawn_subagent` with a review model the host does not list fails immediately, or a reviewer stays on turn 1 past ~60 local reads with no findings document.

Cause: launch-subagent prefers fable-5; some hosts only accept grok-4.5 / grok-4.6. The spawn never starts, or it wanders.

Default: omit `model` (inherit parent) or use a slug the host listed. Bound the wait per §6. Do not retry a rejected slug. If there is still no findings document, kill and emit A1 from the orchestrator HEAD walk.

## 13. Presentational chrome extract is simple

Symptom: deep A1 files cloned guest-shell CSS as Request changes / do-work because a layout wrapper is a "new abstraction."

Cause: "No new abstraction" is read as any new SFC. Size/S extract already wants serial in-session TDD, but classification still opens Intake.

Default: duplicated presentational chrome with existing view tests as AC is **simple**. Extract the wrapper inline. Do not Intake. New package design, lifecycle machines, or dual-write stay non-simple.

## 14. Tiny presentational diffs skip A1 spawn

Symptom: `--deep` on a 2–3 file class-token/CSS branch still launches a reviewer that stays on turn 1 and never writes findings.

Cause: deep is read as "always spawn." The orchestrator already has to emit A1 from HEAD. The spawn only adds wait.

Default: if `git diff --stat` is presentational-only (class tokens, scoped CSS) and ≤3 files, emit A1 from the orchestrator HEAD walk. Do not spawn. Deep still applies the deep bar; it does not require a subagent. If a spawn is already running and still on turn 1 with no findings, kill per §6.
