# Make

Load at step 3, and again when Check feeds findings back.

## Rules

- Behavior change: write a failing test first, then the code.
- Edit only the contract `files` (plus tests those files require).
- Follow existing patterns. No drive-by refactors.
- `cd` into the worktree on every command.
- Linear graph + already isolated → this session. **split** → one worktree per REQ, merge one at a time.
- Heartbeat the claim while working (`references/tracker.md`).
- 3 failed implement/test attempts on the same unit → `set_req_status` stopped, Keep as `blocked`. Do not grind.
- When a coherent slice is green, commit it (`references/commits.md`). Do not hold the unit until Ship.

## Findings from Check

The review cycle's actionable items **are** the next Make contract. Same unit, same worktree, same `files` unless a finding names a missed path that is still this unit. Path-limit still holds.

Blockers (logic, security, missing test, API break, data loss) must be fixed. Scope-expanding nits → **human** or drop.

## Failing behavior (no plan)

If the user brought a bug, not a brief: load `references/debug.md` first, then Make the fix.
