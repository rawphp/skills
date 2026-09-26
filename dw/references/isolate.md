# Isolate

Load at step 1, before any product-code write.

## Worktree

Read and follow the `git-worktree` skill. Do not reimplement it.

- Primary checkout → create a worktree. Work only there.
- Already in a linked worktree → stay.
- User said work in place this session → honor it.
- Primary dirty → **human**. Never stash.

Every later `git`, test, and install command starts with `cd <absolute-worktree-path> &&`.

Branch names: `references/tracker.md` § git naming (do-work.io `req/REQ-NNN`; Linear `req/<sanitized-id>`).

After Ship reports a PR URL: `git worktree remove <path>` (or host cleanup). Keep the branch.

## Tracker before pick

Named PR (user gave a PR URL to continue): the PR is the unit. Work on its branch; do not claim an unrelated REQ, do not create an Issue/REQ; receipt tracker = none.

Otherwise load `references/tracker.md` and the active backend file. `ensure_product_container`. Then pick/claim (or create for M dark / L after scope).
