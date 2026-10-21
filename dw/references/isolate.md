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

After Ship reports a PR URL: `git worktree remove <path>` (or host cleanup). Keep the branch. Remove only a worktree this run created. One you found (another session's `.worktrees/pr<N>`) may carry your commits but stays.

## Tracker before pick

Named PR (user gave a PR URL to continue): the PR is the unit. Work on its branch; do not claim an unrelated REQ, do not create an Issue/REQ; receipt tracker = none.

Review report (a review-gate `report.md`, or review comments on a PR): its open findings are the contract and its PR is the unit, as above.

**PR units move.** Another session can push, rebase, merge or close the PR while you work. Before Make, before each review wave and before Ship: `git fetch`, `gh pr view <N> --json state,headRefOid`, and compare with the head you started from (a report's head, for a review report).

| Seen | Do |
|---|---|
| Closed, or its head already on the integration branch and you hold no unshipped commits | Moot. Tear down and report. |
| Merged while you hold unshipped fix commits | Cherry-pick them onto a branch off the new integration tip. Re-check each finding there, drop what it already fixed, run the gate, open a follow-up PR. |
| New commits on the head | `git log <your head>..<pr head>`, then read `git diff <your head>..<pr head> -- <files the findings cite>`. A base merge or an unrelated edit: take it and tell the next reviewer what it brought. A change to the behaviour a finding is about: re-judge that finding before Make. |
| Remote rebased (`git merge-base --is-ancestor <remote tip> HEAD` fails) | `git rebase --onto <remote tip> <old tip>` for your own commits, re-run the full gate (earlier greens do not count), then push. Never force-push. |

After moving reviewed commits onto a changed base, list what the base added near the diff (`git diff <old base> <new base> --stat`, new fields on the types the change writes) and give it to one `correctness` reviewer before Ship. A clean merge proves no conflict, not no interaction.

Review-only brief (`review <PR or branch>`): no tracker unit either. Someone else's PR → Check only, in `git worktree add --detach <path> <head sha>` with the PR body as the contract. Verify each finding at file:line, then post one `COMMENT` review with an inline comment per finding. No Make, no PR. The user's own branch → Check → Make → Ship from a `dw/<slug>` worktree branch cut at its tip, pushed back with `git push origin HEAD:refs/heads/<branch>`.

Otherwise load `references/tracker.md` and the active backend file. `ensure_product_container`. Then pick/claim (or create for M dark / L after scope).

## Factory repo

`.dw/config.yml` with a `factory:` block and no `tracker.backend`: the factory owns issue state. No tracker: skip claim, heartbeat, lights and archive. Receipt tracker = none.

Before the worktree, make sure the factory is not already on the work: `gh issue list --search 'label:factory:building,factory:ready'` and `gh pr list`. A match, or the PR's issue back at `factory:building` (a review comment relaunches a factory session on the PR branch), means stop and report the issue. Take over only once the user has stopped that run.

- A PR, or a review report on one: the PR is the unit (§ Tracker before pick).
- A fresh brief: file it verbatim as an issue with no `factory:*` label, so the factory does not build it too. Branch from `origin/main` and open the PR with `Fixes #N`.
