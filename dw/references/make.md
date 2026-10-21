# Make

Load at step 3, and again when Check feeds findings back.

## Rules

- Behavior change (a reorder on a failure path is one): write a failing test first, then the code.
- Deleting tests: list what else each one asserted. Re-pin any neighbouring behaviour in the same commit, and name the deleted tests in the `testing` packet.
- Edit only the contract `files` (plus tests those files require).
- Follow existing patterns. No drive-by refactors.
- `cd` into the worktree on every command.
- Linear graph + already isolated → this session. **split** → one worktree per REQ, merge one at a time.
- Parallel wave size follows the machine, not the unit count. Check free memory before the first wave, start at most two heavy units (build, test, render), and raise the cap only after a wave runs with headroom. Read-only reviewers do not count.
- A background maker silent for more than about twice its slowest earlier cycle: check its test processes (`ps -o pid,etime,stat`). Long elapsed time with near-zero CPU is hung. Kill only that worktree's test processes and let the maker re-run.
- Heartbeat `step: Make` when Make starts (`Fix r<N>` when Check fed it) and after every commit (`references/tracker.md` § Step).
- 3 failed implement/test attempts on the same unit → `set_req_status` stopped, stop the heartbeat loop (`references/tracker.md` § Heartbeat loop), Keep as `blocked`. Do not grind.
- When a coherent slice is green, commit it (`references/commits.md`). Do not hold the unit until Ship.
- Right after that commit, `check_ac` each AC its tests prove, evidence `<test name or file::test> @ <short sha>` (`references/tracker.md` § Acceptance criteria). Do not save ticks for archive.

## Tip check

Before each Make, each review wave and Ship, check that the unit branch holds only what this run made. A read-only persona can still run git, and a stopped attempt of this same conversation really ran its commands.

- `git log <last known tip>..HEAD` and `git reflog -5`: a commit you did not make → stop and identify it before building on it. On a retried run, grep this session's own transcript for the SHA first.
- `git status`: unmerged paths, or a merge you did not start → `git merge --abort`, then re-run any gate it overlapped.

## Findings from Check

The review cycle's actionable items **are** the next Make contract. Same unit, same worktree, same `files` unless a finding names a missed path that is still this unit. Path-limit still holds.

Blockers (logic, security, missing test, API break, data loss) must be fixed. Scope-expanding nits → **human** or drop.

A finding's suggested fix is a hint, not the spec. When it says to treat records that meet some condition as Y, grep for how the product already recognises that condition and reuse it.

"Remove X": grep the unit's ACs and open issues (`gh issue list --search X`) first. If either needs X, raise **human** with the middle option instead.

A finding the PR body explicitly declines (a Decisions or known-limit line) is settled: do not Make it, and say so. A scope line such as `out:` is not a decline. A doc the change made false still gets fixed.

A finding that unticked an AC: after the fix commit is green, `check_ac` it again with the new test and sha.

## Failing behavior (no plan)

If the user brought a bug, not a brief: load `references/debug.md` first, then Make the fix.
