# Isolate

Load at step 1, before any product-code write.

## Worktree

Read and follow the `git-worktree` skill. Do not reimplement it.

- Primary checkout → create a worktree. Work only there.
- Already in a linked worktree → stay.
- User said work in place this session → honor it.
- Primary dirty → **human**. Never stash.
- Unit's files untracked or ignored (`git ls-files <path>` empty, `git check-ignore -v <path>`) → **human** before claiming: edit in place, add to this repo, or its own repo.

Every later `git`, test, and install command starts with `cd <absolute-worktree-path> &&`.

Existing unit branch behind the integration branch: bring it up before Make. No commits of its own → `git merge --ff-only origin/<integration>`. Carries work → merge the integration branch in and send the resolution through review. Then check each open AC against the merged tip: one already met gets a pin test, not a rebuild.

Unit blocked by an unmerged sibling (`set_blocked_by`): branch from the blocker's tip and record that SHA. It is the diff base in every review packet, not the integration base.

Branch names: `references/tracker.md` § git naming (do-work.io `req/REQ-NNN`; Linear `req/<sanitized-id>`).

After Ship reports a PR URL: `git worktree remove <path>` (or host cleanup). Keep the branch.

## Tracker before pick

Named PR (user gave a PR URL to continue): the PR is the unit. Work on its branch; do not claim an unrelated REQ, do not create an Issue/REQ; receipt tracker = none.

Review-only brief (`review <PR or branch>`): no tracker unit either. Someone else's PR → Check only, in `git worktree add --detach <path> <head sha>` with the PR body as the contract. Verify each finding at file:line, then post one `COMMENT` review with an inline comment per finding. No Make, no PR. The user's own branch → Check → Make → Ship from a `dw/<slug>` worktree branch cut at its tip, pushed back with `git push origin HEAD:refs/heads/<branch>`.

Otherwise load `references/tracker.md` and the active backend file. `ensure_product_container`. Then pick/claim (or create for M dark / L after scope).
