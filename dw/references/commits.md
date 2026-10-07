# Commits

Load at Make, after each Check-fix cycle, and at Ship.

The branch is the audit log. Do not wait for Ship to make the first commit. Do not squash Make or Check commits.

## When

| Moment | What to commit | Type |
|---|---|---|
| Make: a coherent slice is green | named product + test files for that slice | `feat(<id>):` |
| Make: the unit is green and the branch has no unit commit yet | named files for the unit | `feat(<id>):` |
| Check: findings applied and tests green | files that changed this cycle | `fix(<id>):` |
| Ship: leftover named files only (format, lockfile) | those files | `style(<id>):` or `chore(<id>):` |

**S mechanical:** one commit at Ship is enough.

If Check is clean and Make already committed, Ship does not invent a catch-all commit.

Before Check starts, the worktree branch must have at least one Make commit unless S or the unit changed no files.

After a Check-fix Make, commit **before** the next review wave. Reviewers read the tip that includes the fixes.

## How

From the worktree. Named files only. Never `git add -A` or `git add .`. Never co-author trailers. Never amend a commit that was pushed. A trailer on an unpushed tip (a worker obeyed a harness reminder): `git reset --soft HEAD~1` and recommit the same tree before review or push.

```bash
cd <worktree> && git status && git diff && git log -5 --oneline
git add -- <named files from this slice only>
git commit -m "$(cat <<'EOF'
<type>(<id>): <short>

REQ: <REQ-NNN>
Issue: <KEY>-NNN
Output: <primary path>
EOF
)"
```

`<id>` and footer from `references/tracker.md` git naming (Linear: one `Issue: <ENG-123>` line). Do not commit `.dw/` artifacts, review packets, or paths outside the unit `files:` (plus tests those files require).

## Do not

- Hold the whole unit uncommitted until Ship
- Squash review-fix commits into the Make commit
- Skip a Check-fix commit because Ship will "cover it"
