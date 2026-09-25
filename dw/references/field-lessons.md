# dw field lessons

**Only lessons that improve the next /dw run.** Gate before every append:
**“Will this improve dw?”** — Yes → here (skill process: weight, isolate, tracker, review cycle, ship). No → project docs via session-capture.

No pending field lessons. New lessons may be appended by the post-skill field-lessons loop.

## 1. Integration branch checked out on a dirty primary

| Symptom | Cause | Default action |
|---|---|---|
| Ship needs a `--no-ff` merge into a branch that is checked out in the primary checkout, which has someone else's staged work | Merging there would mix WIP in, and the never-stash rule forbids clearing it | `git worktree add --detach .worktrees/integ-<n> <branch>`, merge the unit branches there, prove the merged tree matches the reviewed tree (`git diff --quiet`), then `git push origin HEAD:refs/heads/<branch>`. Leave the primary alone and tell the user to `git pull --ff-only` once it is clean. |

## 2. Stacked unit reviewed against the integration base

| Symptom | Cause | Default action |
|---|---|---|
| A unit built on a sibling's unmerged branch gets reviewers whose `git diff <integration-base>..HEAD` also contains the sibling's already-reviewed commits | The review packet template names the integration base, not the parent's tip | For a `set_blocked_by` unit branched from its blocker, record the blocker's tip SHA at Isolate and put it in every review packet as the diff base; open the PR with `--base <blocker branch>` and say "merge #N first" at the top of the receipt. |

## 2. A stacked PR merged into a parent branch that had already landed

| Symptom | Cause | Default action |
|---|---|---|
| The child PR shows MERGED, but none of its commits are on the integration branch | The PR was stacked on a sibling unit's branch. The parent merged first and its branch was not deleted, so GitHub kept the child's base and the child merged into a dead branch | When you stack, write "retarget to `<integration>` once #parent merges" at the top of the receipt. At Ship, if the parent has already merged, open the PR against the integration branch instead. When asked "merged correctly?", check `git merge-base --is-ancestor <head> origin/<integration>`, not the PR state. |

## 4. REQ created with no acceptance criteria

| Symptom | Cause | Default action |
|---|---|---|
| The user opens a new REQ in the tracker and it has no ACs | Brief created the REQ from a title and files only; ACs only came up at the archive gate, where they were written already ticked | Right after `create_req`, `set_acceptance_criteria` with unchecked items taken from the contract's `done:` / `out:` plus a tests-green item. Tick them against the diff at Ship. Never leave a REQ with no ACs. |

## 5. Symlinked vendor in a PHP worktree tests the primary checkout

| Symptom | Cause | Default action |
|---|---|---|
| Backend tests in a worktree pass whatever the worktree's `app/` says | `vendor/` symlinked from the primary checkout carries a Composer classmap whose `App\` paths point at the primary's `app/` | At provisioning, copy `vendor/` (`cp -R`), create `bootstrap/cache` and `storage/`, then run `composer dump-autoload`. Never symlink `vendor/` into a worktree. `node_modules` symlinks are fine. |

## 6. Parallel reviewer panes share one private test database

| Symptom | Cause | Default action |
|---|---|---|
| A reviewer's backend run fails with "table already exists" while the unit is green | The review packet gives every persona the same per-worktree test DB config, and the panes run migrations at the same time | Give each reviewer that runs backend tests its own DB name in the packet (e.g. `<db>_<persona>`), or let only the testing persona run the backend suite and have the others read its result. |

## 6. Parallel reviewer panes collided on the maker's isolated test resource

| Symptom | Cause | Default action |
|---|---|---|
| Several reviewer panes ran the backend suite at once and reported reds ("table already exists") that the maker could not reproduce; one reviewer improvised its own copy, another gave up and trusted the maker | The packet told reviewers to use the maker's per-unit test database, while `{repo}/.dw/learnings.md` already said each reviewer needs its own | When learnings (or the project docs) carry a per-worker isolation rule (test DB, ports, caches, temp dirs), the review packet must restate it with a persona-specific value (`<unit>_<persona>`) and a teardown line. One shared resource across a parallel batch is a false-red generator, not a review. |

## 7. `/dw review <PR url>` on someone else's PR

| Symptom | Cause | Default action |
|---|---|---|
| The brief is "review this PR and comment on it", so Isolate/Contract/Make/Ship do not fit and there is no tracker unit to claim | dw only describes Check as a step inside a unit the maker built | Treat it as Check-only: `git worktree add --detach .worktrees/review-pr<N> <head sha>`, save `gh pr diff` to the scratchpad, dispatch the persona batch (correctness plus the lenses the diff earns) with the PR body as the contract, verify each finding at file:line yourself, then post one `POST /pulls/<N>/reviews` with `event: COMMENT`, a short index body, and one inline comment per finding on the RIGHT side. No tracker item, no Make, no PR. Remove the worktree afterwards. |

## 8. Parallel split units built from one under-specified brief table

| Symptom | Cause | Default action |
|---|---|---|
| Two sibling makers (for example a data/seed unit and the docs or tests that describe that data) each read an ambiguous line of the plan differently, and every reviewer of one unit reports "facts" that are really the other unit's choices | The split gave both makers the same table with gaps and no owner for the gaps; each filled them alone | Before the first review wave, diff the two reports for the same facts, settle each gap as an orchestrator decision, and send one `-change` packet per side that says whose decision it is and overrides the contract. Then give every reviewer the sibling worktree's tip as a cross-reference ("the seeders must produce what the walks say"), so a reviewer of one side can file findings against the other. Do not let makers negotiate through their reports. |

## 8. do-work.io archive refused with "status is not done"

| Symptom | Cause | Default action |
|---|---|---|
| `req archive` fails with `Archive gate failed: status is not done` after ticking the ACs and writing `closure_proof` via `req update` | `req update` never moves status, even with `terminal_state` set; the archive gate reads the status field | At Ship: tick ACs → `req update` (closure_proof, criteria_approved) → `req set-status done` → `req archive`, in that order. On the CLI path, `capabilities describe` wants the dotted name (`req.archive`), while invocation is `capabilities req archive --input=JSON --json`. |

## 9. Visual check run after the review wave

| Symptom | Cause | Default action |
|---|---|---|
| On a UI unit, every reviewer approved, then the orchestrator's own screenshot found a visible defect and forced an extra fix cycle | Personas read the diff and tests; none of them looks at the rendered screen, and the visual check ran only after they finished | For a UI unit, take the orchestrator's screenshot of the running worktree before sending the first review packet, and send any visual finding to Make with cycle 1's findings. Confirm the dev server's cwd is this worktree before trusting the page. |

## 9. Split units that change an API the next unit's screen reads

| Symptom | Cause | Default action |
|---|---|---|
| Unit 1 changes a response shape that the current screen uses, so its PR breaks the app until unit 2 (the screen) merges | The split follows layers (API, then UI) but each PR merges on its own | When splitting, put the new shape on a **new** endpoint or param in the API unit, and retire the old one in the unit that switches the screen over. Write this into the first REQ's ACs at brief time. |

## 10. UI maker screenshots arrive before the review wave

| Symptom | Cause | Default action |
|---|---|---|
| Reviewers spend findings on a layout problem the orchestrator can already see in the maker's screenshots, or argue with a design call the orchestrator is about to make | Screenshots are read after the review, or not at all | Read the maker's screenshots before dispatching reviewers. Decide any design fix yourself, write it into the review packets as "orchestrator decision, do not report", and send it in the cycle-1 fix packet as an override of the contract line. |

## 11. Brief finds a pending contract at `.dw/contract.md`

| Symptom | Cause | Default action |
|---|---|---|
| An L/scope brief needs `{repo}/.dw/contract.md`, but that file already holds another unit's contract that hasn't shipped | `brief.md` names one fixed path, so a second scope in flight would overwrite the first | Check that the existing contract's work landed (its `done:` in git on the integration branch) before writing. If it hasn't, write `.dw/contract-<slug>.md`, leave the other alone, and put the workset ids (`UR`/`REQ`) at the top of the new file once they're created. |

## 12. PR goes red on failures the integration branch already had

| Symptom | Cause | Default action |
|---|---|---|
| The unit is archived and reported shipped, then the user sends a red CI link for the PR; the failing tests are untouched by the diff | Ship opened the PR and archived without looking at CI, and the integration branch's own latest run was already red | At Ship, check the integration branch's latest CI conclusion (`gh run list --branch <base> --limit 1`). If it's red, say so on the receipt ("CI red on base before this PR: <tests>") and tell the user before archiving; do not report the unit as clean-shipped. |

## 13. The unit's files are not under version control

| Symptom | Cause | Default action |
|---|---|---|
| Isolate has no worktree or PR to make, because the target folder is untracked or ignored (for example a `*` gitignore that force-adds only some folders) | The repo tracks only part of the tree, or the folder was never in git | Check `git check-ignore -v <path>` and `git ls-files <path>` before claiming. If it's untracked, turn on **human** with three choices: edit in place, add it to the existing repo (say whether that repo is public), or give it its own repo. With the add option, commit the untouched baseline first so the unit's diff reviews on its own. |
