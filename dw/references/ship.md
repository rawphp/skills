# Ship

Load at step 5 after Check is clean (or user interrupt **ship** with no unnamed blockers). Heartbeat `step: Ship`.

## Commit

Make and Check already committed (`references/commits.md`). Ship only commits leftover named files (format, lockfile). If the tree is clean, skip commit and push.

Never squash Make or Check commits. Never `git add -A` or `git add .`. Never co-author trailers.

## PR

Before the push, read the base's latest CI (`gh run list --branch <base> --limit 1`). Red → name the failing tests on the receipt and tell the user. Do not report a clean ship.

```bash
git push -u origin HEAD
gh pr create --body-file <receipt path>
```

Receipt: `references/receipt.md`. Include tracker slugs, maker/checker, review cycles, leftovers.

Existing PR for this branch: `gh pr edit` with the same body file, do not open a second.

No remote / `gh` missing: local commit only. Say so. Still `archive_req` if the unit is done.

`gh` answers 404 or `Could not resolve to a Repository` while `git push` works: the active `gh` account cannot see the repo. That is not "no remote" or "no CI". `gh auth status`, then per command `GH_TOKEN=$(gh auth token --user <acct>) gh … --repo <owner/name>`. Do not `gh auth switch`.

Push rejected as non-fast-forward (a worker pushed early): never force-push. Push the reviewed tip under a new branch name, open the PR from that, close any PR on the stale branch with a note, and leave the stale branch for the user to delete.

Stacked on an unmerged sibling (`references/isolate.md`): `git fetch` the blocker first. If it moved, merge it in and re-run the suites. `gh pr create --base <blocker branch>`, first receipt line `Merge #N first, then retarget to <integration>`. Blocker already merged → the base is the integration branch. A stacked PR can show MERGED on a dead parent branch: merged means `git merge-base --is-ancestor <head> origin/<integration>`.

A local merge into a branch that is checked out in a dirty primary (split integration): do it in `git worktree add --detach <path> <branch>`, then `git push origin HEAD:refs/heads/<branch>`. Leave the primary alone and tell the user to `git pull --ff-only` once it is clean.

**watch** on: `gh pr checks` until green or a real failure. Convergent CI fail → Make. Divergent product reversal → **human**.

## Teardown

After the PR URL: remove the worktree. Keep the branch. Return to the primary checkout.

## Archive

`read_req`. `check_ac` any AC still unticked that the diff proves, with evidence (`references/tracker.md` § Acceptance criteria). If `check_ac` fails, use the backend file's fallback.

The archive gate needs every AC checked. An AC still unticked that the diff cannot prove: do not archive. Raise **human** naming the AC, and stop the heartbeat loop (`references/tracker.md` § Heartbeat loop).

Otherwise `archive_req` (backend file), then stop the heartbeat loop (same section). Do not archive if Check stopped with open blockers and the user did not ship.
