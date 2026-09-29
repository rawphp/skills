# Ship

Load at step 5 after Check is clean (or user interrupt **ship** with no unnamed blockers). Heartbeat `step: Ship`.

## Commit

Make and Check already committed (`references/commits.md`). Ship only commits leftover named files (format, lockfile). If the tree is clean, skip commit and push.

Never squash Make or Check commits. Never `git add -A` or `git add .`. Never co-author trailers.

## PR

```bash
git push -u origin HEAD
gh pr create --body-file <receipt path>
```

Receipt: `references/receipt.md`. Include tracker slugs, maker/checker, review cycles, leftovers.

Existing PR for this branch: `gh pr edit` with the same body file, do not open a second.

No remote / `gh` missing: local commit only. Say so. Still `archive_req` if the unit is done.

**watch** on: `gh pr checks` until green or a real failure. Convergent CI fail → Make. Divergent product reversal → **human**.

## Teardown

After the PR URL: remove the worktree. Keep the branch. Return to the primary checkout.

## Archive

`read_req`. `check_ac` any AC still unticked that the diff proves, with evidence (`references/tracker.md` § Acceptance criteria). If `check_ac` fails, use the backend file's fallback.

The archive gate needs every AC checked. An AC still unticked that the diff cannot prove: do not archive. Raise **human** naming the AC, and stop the heartbeat loop (`references/tracker.md` § Heartbeat loop).

Otherwise `archive_req` (backend file), then stop the heartbeat loop (same section). Do not archive if Check stopped with open blockers and the user did not ship.
