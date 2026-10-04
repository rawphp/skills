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
| A unit built on a sibling's unmerged branch gets reviewers whose `git diff <integration-base>..HEAD` also contains the sibling's already-reviewed commits | The review packet template names the integration base, not the parent's tip | For a `set_blocked_by` unit branched from its blocker, record the blocker's tip SHA at Isolate and put it in every review packet as the diff base; open the PR with `--base <blocker branch>` and say "merge #N first" at the top of the receipt. At Ship, `git fetch` the blocker again: another session may have moved it (e.g. merged a stack top in). If it moved, merge it into the unit, re-run the full suites, and check `comm -12` of the unit's files against the blocker's delta. Only overlapping files and the remerge-diff need a look before the PR. |

## 2. A stacked PR merged into a parent branch that had already landed

| Symptom | Cause | Default action |
|---|---|---|
| The child PR shows MERGED, but none of its commits are on the integration branch | The PR was stacked on a sibling unit's branch. The parent merged first and its branch was not deleted, so GitHub kept the child's base and the child merged into a dead branch | When you stack, write "retarget to `<integration>` once #parent merges" at the top of the receipt. At Ship, if the parent has already merged, open the PR against the integration branch instead. When asked "merged correctly?", check `git merge-base --is-ancestor <head> origin/<integration>`, not the PR state. Run that same check on every REQ branch before `archive_req` when closing an Issue. If a unit is stranded, open a new PR from its branch to the integration branch and archive it only after that PR merges. |

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
| The brief is "review this PR and comment on it", so Isolate/Contract/Make/Ship do not fit and there is no tracker unit to claim | dw only describes Check as a step inside a unit the maker built | Treat it as Check-only: `git worktree add --detach .worktrees/review-pr<N> <head sha>`, save `gh pr diff` to the scratchpad, dispatch the persona batch (correctness plus the lenses the diff earns) with the PR body as the contract, verify each finding at file:line yourself, then post one `POST /pulls/<N>/reviews` with `event: COMMENT`, a short index body, and one inline comment per finding on the RIGHT side. No tracker item, no Make, no PR. Remove the worktree afterwards. Inline comments only land on lines in the diff: anchor a caller-side finding (a screen that can't handle a new status) on the diff line that causes it and cite the real file:line in the text, and put pre-existing holes outside the diff in the body as follow-ups, not as blockers. |
| After a review-only run, the user says "fix these" on that existing PR | There is no unit or worktree for the PR branch, and a local copy of the branch may already exist | Give each finding a maker on a side branch cut from the PR head. Settle each fix as an orchestrator decision in its packet. Then cherry-pick the fixes into one worktree on the PR branch, re-run the gates, and send a re-review of `<old head>..HEAD`. Before `git worktree add -B <branch>`, check that the local branch equals `origin/<branch>`: `-B` resets it, and any unpushed local commits are lost. Push only after an `--is-ancestor` check. Fix any PR-body line the fixes made false. |

## 8. Parallel split units built from one under-specified brief table

| Symptom | Cause | Default action |
|---|---|---|
| Two sibling makers (for example a data/seed unit and the docs or tests that describe that data) each read an ambiguous line of the plan differently, and every reviewer of one unit reports "facts" that are really the other unit's choices | The split gave both makers the same table with gaps and no owner for the gaps; each filled them alone | Before the first review wave, diff the two reports for the same facts, settle each gap as an orchestrator decision, and send one `-change` packet per side that says whose decision it is and overrides the contract. Then give every reviewer the sibling worktree's tip as a cross-reference ("the seeders must produce what the walks say"), so a reviewer of one side can file findings against the other. Do not let makers negotiate through their reports. |

## 8. do-work.io archive refused with "status is not done"

| Symptom | Cause | Default action |
|---|---|---|
| `req archive` fails with `Archive gate failed: status is not done` after ticking the ACs and writing `closure_proof` via `req update` | `req update` never moves status, even with `terminal_state` set; the archive gate reads the status field | At Ship: tick ACs → `req update` (closure_proof, criteria_approved) → `req set-status done` → `req archive`, in that order. If `req update` answers `Not authorized to invoke "req.update"`, drop `criteria_approved` and send `closure_proof` alone: a scoped PAT may refuse only that field. On the CLI path, `capabilities describe` wants the dotted name (`req.archive`), while invocation is `capabilities req archive --input=JSON --json`. |

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

## 14. Brief settles a data model before reading who depends on row identity

| Symptom | Cause | Default action |
|---|---|---|
| At Isolate the approved contract's data model turns out to break existing behaviour (e.g. copying whole row sets per version gives unchanged rows new ids, and scoring or history matches by id; or it breaks a one-row-per-X lock order) | The brief picked a storage shape from the product questions alone | Before writing a model into `settled:`, grep for the consumers of the rows it changes: what matches by id, what locks which row first, what unique keys readers assume. If the model is still wrong at Isolate, rewrite the contract's model with the reason before the first maker packet, and say so in the run report. Never let a maker discover it. |

## 15. An L unit with an API and screens: two sequential makers, with the first one's report as the contract

| Symptom | Cause | Default action |
|---|---|---|
| One maker carrying backend plus frontend on a large unit runs long and guesses response shapes | The shapes don't exist until the backend is built | Run part 1 (backend) with a packet that requires "the exact API shapes, with JSON examples" in its report and keeps old top-level keys working. Then part 2 (screens) in the same worktree, with "the report wins on shape; stop if it differs on behaviour". Draft part 2's packet while part 1 runs. |

## 16. Narrowed fix-cycle reviews leave the whole diff unread at the final tip

| Symptom | Cause | Default action |
|---|---|---|
| An L unit gets both reviewers' approval at cycle 5 and ships, but a fresh whole-diff wave on the same tip finds several action-level bugs (secondary entry points that skip the new guards, response fields for the wrong scope) | After cycle 1, the reviewers read only the fix commits (`git diff <prev>..HEAD`). Paths that cycle 1 missed never come up again, and neither do paths the fixes changed indirectly | On L units, the last review wave before Ship includes one correctness reviewer on the **whole** unit diff at the tip (`<base>..HEAD`), with earlier findings marked known. Only after it approves can Ship go ahead. |

## 17. Reopening a done do-work.io REQ for post-PR fixes

| Symptom | Cause | Default action |
|---|---|---|
| `req claim` on a REQ that shipped (status done) fails with `not-claimable: status in_progress` after you set it to in_progress | Only a backlog REQ can be claimed | To reopen: `req set-status backlog`, then `req claim`. At the end, run the lesson 8 order again (update closure_proof → set-status done → archive). |

If the REQ is **done** (or done + archived): `done → backlog` is refused; go `done → in_progress → backlog`. `req.update` ignores `archived`, and `closure_proof: null` is ignored (send `""` to clear it). A REQ that stays `archived: true` never appears in `req.list-claimable` — build it unclaimed and archive it again at Ship, or wait for a server that unarchives on reopen.

## 18. An approved sketch that redraws existing chrome gets built quietly as "add to what's there"

| Symptom | Cause | Default action |
|---------|-------|----------------|
| After the merge, the user notices the header or toolbar doesn't match the approved sketch. The maker's report listed wording choices only, and no reviewer compared screen to sketch | The packet said "build what it shows, in the app's own kit", and the maker read existing chrome as fixed. No Check persona owns sketch fidelity | At Brief, diff the sketch against the live screen and mark each difference build / keep app / ask. Ask the user the "ask" ones before Make; the app is the starting truth, but approved means build unless the sketch only shows it for context. The make packet names the chrome to restyle, the maker's report lists every frame difference, and one Check pass puts the maker's screenshots beside the sketch frames |

## 19. Resuming a stalled Issue whose branch is far behind the integration branch

| Symptom | Cause | Default action |
|---------|-------|----------------|
| `/dw <UR> is still open` finds an existing `issue/UR-NNN` branch with a done REQ, many commits behind main, and backlog REQs whose specs predate that main work | The earlier run stalled; later main work landed parts of the remaining REQs and changed files the done REQ touched | Work on the existing Issue branch in one worktree: merge main in first and resolve the conflicts as reviewed work. Then, before any Make, check every backlog REQ's ACs against the merged tip. Where an AC is already met, add a pin test and don't re-implement. Build only the real gaps, open one PR for the Issue, and send the whole `main...HEAD` diff (including the earlier REQ and the merge) to the first review wave |

## 17. Footprint overlap with in-flight siblings when a split unit needs shared paths

| Symptom | Cause | Default action |
|---|---|---|
| `req set-files` fails with `footprint-overlap` because sibling REQs claimed by other sessions hold paths the later maker (e.g. screens) needs; `set-files` also replaces the whole list | The tracker won't hold two in-flight claims on one path | Set the footprint to the paths the first maker needs (non-overlapping), run that part, then re-check the siblings. Once they ship, merge the integration branch into the unit branch, rerun the suites, and widen `set-files` before the next maker starts. Don't edit overlapping paths while the sibling is in flight. |

## 18. do-work.io CLI answers "Unauthenticated" mid-run

| Symptom | Cause | Default action |
|---|---|---|
| `capabilities auth status` says `logged_in=true`, but every `req` op answers `Unauthenticated.` partway through a unit | The stored default token expired or was revoked | Log in with the project's configured PAT under a separate profile (`capabilities auth login --base-url=<base_url> --token=<PAT> --profile=dw`) and use `--profile=dw` for the rest of the run; leave the default profile alone. If there is no usable PAT, hard-stop with the unit left claimed. In zsh, wrap it in a function (`c(){ capabilities --profile=dw "$@"; }`), not a string variable, or the command won't split. |

## 19. A maker's mutant check reverts the uncommitted fix

| Symptom | Cause | Default action |
|---|---|---|
| The maker runs a reviewer-style mutant (edit, test, `git checkout -- <file>`) before committing, and the fix in that same file is gone afterwards; `git status` no longer lists it | `git checkout --` restores the committed base, not the pre-mutant working copy | Commit the green slice first, then mutate and restore. If a mutant must run on uncommitted work, re-apply the patch after the restore and re-run the tests before committing. Reviewers are unaffected: they mutate a clean tree. |

## 20. A unit that interprets another unit's data log keeps finding new shapes, one review cycle at a time

| Symptom | Cause | Default action |
|---|---|---|
| Every fresh whole-diff correctness reviewer finds a new edge shape of the source data (gaps, folds, put-backs, per-month splits), and the unit hits the 5-cycle cap on interpretation bugs, not on code quality | The contract settled one interpretation rule ("first old, last new") without listing the source format's actual shapes, so each reviewer found the shapes the rule mishandles | At Contract, when the unit reads a log, diff or event format that another unit writes, copy that format's shape list into the contract. Write the interpretation per shape as a table, with what the source cannot tell apart marked as a known limit up front. Put that table in the maker packet and in every cycle-1 review packet, so shape coverage is checked in the first wave. |

## 17. A stacked UI unit renders data a sibling unit writes

| Symptom | Cause | Default action |
|---|---|---|
| The screens unit's screenshots and reviews only ever see seed data from the base, so the sibling's entry shapes are checked by fixtures alone, and a shape mismatch (a missing field in the types) turns up late | Both units branched from the same parent, and the one that writes the data hasn't merged yet | Once the writing sibling has passed its review, merge its branch into the screens unit **before the final review wave**. In the same cycle, have the maker check every sibling shape against the presenter and types, and retake screenshots on real rows. Scope the final correctness pass to the merge's remerge-diff plus the seam, and open the PR stacked on the sibling with "merge #N first, then retarget" at the top. |

## 18. do-work.io CLI says "Unauthenticated" while `auth status` says logged in

| Symptom | Cause | Default action |
|---|---|---|
| Every `capabilities` call fails with `Unauthenticated.` mid-run, even though `capabilities auth status` still reports `logged_in=true` | The default profile's stored token has expired or been revoked. Other profiles for the same `base_url` may still be valid | Before hard-stopping, run `capabilities auth list` and retry a read with `--profile=<each profile for the configured base_url>`. If one works, use it for every op for the rest of the run and tell the user the default profile is stale. Hard-stop only when no profile works. |

## 20. Claim refused by `footprint-overlap` with no live sibling

| Symptom | Cause | Default action |
|---------|-------|----------------|
| `req claim` fails with `footprint-overlap` although no in-flight unit of this run touches those files | An orphan claim on an old **done** (not archived) REQ from another agent still counts as in-flight | Find it: page `req list-account` (`per_page: 200` until `total`), keep `status in_progress` or `done` + `archived: false` whose `files` intersect yours, then `req get` those few to confirm `active_claim` (the list omits it). Do not archive someone else's REQ to free it (that needs a closure proof you don't have). Tell the maker to build unclaimed, archive at Ship (archive works without a claim), and report the orphan to the user. |

## 21. Existing Issue branch sits on an old main commit with no work

| Symptom | Cause | Default action |
|---------|-------|----------------|
| `origin/issue/UR-NNN` exists but carries no commits of its own; a worktree from it starts far behind main | An earlier run only created or pulled the branch | After `git worktree add` from it, `git merge --ff-only origin/main` before the first maker packet. If it does carry work, merge main in as reviewed work instead (lesson 19). |

## 22. "close UR-NNN" asked, but the ops table has no close op

| Symptom | Cause | Default action |
|---------|-------|----------------|
| The user asks to close an Issue; `tracker.md` lists no close op and says "no verify/close reports" | Closing lives on the Issue, not on a REQ | `req list` for the Issue. Every REQ must be done and archived, and each PR head must pass `git merge-base --is-ancestor <head> origin/<integration>` (lesson 2). Then `capabilities run issue.write-close-report --input='{project,issue,body}'`, which sets `closed_at`. Body: REQs, PR URLs, merge proof, anything left off by config. Check `closed_at` first; if it's already set, report that and don't write a second report. A REQ not yet done → stop and say which, unless its commits are verifiably on the integration branch (common: `backlog` + `archived` left over from a reopen). In that case, write `closure_proof` naming the merge commit, then `req set-status done`. |
| `req list` / other `issue`-keyed calls print nothing parseable, or fail validation on `ur` | The CLI's cached schema predates the `ur.*` → `issue.*` rename (`ur` → `issue` in inputs) | Pass `--no-cache` on **every** `issue`-keyed `req list` call. One `--no-cache` call does not refresh the cache for later calls. Inputs take `issue` (e.g. `DW-074`), not `ur`. |
| The `--is-ancestor` check fails for a PR that GitHub shows as merged, and no commit from the REQ branch is on main | The PR was squash-merged, so the branch tip will never be an ancestor of main | Find the squash commit (`git log origin/<integration> --grep=REQ-NNN`). Take the REQ's files from `git diff --name-only $(git merge-base <tip> origin/<integration>) <tip>`; `git diff <tip> origin/<integration> -- <those files>` must print nothing. Put the squash SHA and the empty diff in the close report as the merge proof. |

## 23. The mutating testing reviewer scores kills by exit code

| Symptom | Cause | Default action |
|---------|-------|----------------|
| Unrelated tests go red for a few mutants right after a migration or schema file was mutated, so a mutant counts as "killed" even though no test of the mutated code failed | A snapshot or golden test DB rebuilds after a schema file changes, and the next runs pick up collateral failures | Count a mutant as killed only when a test tied to the mutated code fails. When unrelated tests fail, re-run that mutant, and run the clean suite once at the end to prove the collateral reds are gone before writing findings |

## 24. Brief duplicates a unit already planned in a pending contract

| Symptom | Cause | Default action |
|---------|-------|----------------|
| A bug handed to `/dw-brief` is already a unit (or settled line) in another session's `{repo}/.dw/contract-*.md` that is waiting for go | Brief checks only the tracker for duplicates, and pending contracts have no workset yet | Before `create_ur`, grep `{repo}/.dw/contract-*.md` as well as open Issues for the bug. If a pending contract covers it, create nothing: tell the user which contract and unit, plus any evidence that contradicts its "What exists" lines, and let them fold it in on go. |

## 22. A gate command in a packet is itself wrong

| Symptom | Cause | Default action |
|---------|-------|----------------|
| The maker reports the packet's `rg` gate as unusable: thousands of false hits (`-i` on camelCase patterns matches `return`, `sure`), or a false pass (a repo whose `.gitignore` is `*` makes plain `rg` skip every file) | The orchestrator wrote the gate without running it | Before sending a packet, run its gate command yourself on the base tree. It must return the known hits and nothing else. Split case-sensitive and `-i` patterns, add `--no-ignore` where the repo ignores `*`, and put intended hits in an explicit allowlist, not "expected noise" |

## 23. Closing an Issue with a dropped unit

| Symptom | Cause | Default action |
|---------|-------|----------------|
| `issue.write-close-report` fails with "remaining requirements are not done" after the user drops a unit | The close gate needs every remaining REQ done, and a dropped REQ sits in `stopped` | Do not mark dropped work done. If the REQ has no claim, commits or closure proof, get the user's OK, then `req.delete` it. Record the drop in the close report body (a run note is deleted with the REQ), then close. |


## 25. A per-user resource pinned on a shared entity blocks the other members

| Symptom | Cause | Default action |
|---------|-------|----------------|
| The unit pins a per-user resource (account, token, key) onto an entity several users act on, and backfills the pin to the owner. Every review wave approves, and only the orchestrator notices that each non-owner now fails closed | The contract settled "pin wins, never guess" from the owner's view only. Reviewers check the diff against the contract, not who else acts on the entity | At Contract, when a unit binds a per-user resource to a shared entity, list every other actor and settle what each one resolves to (the pin, their own resource, or a failure). Put that table in the maker packet and the correctness packet. Before Ship, trace one non-owner through the resolver yourself |


## 26. A mutant that does not compile gets scored as survived or killed

| Symptom | Cause | Default action |
|---------|-------|----------------|
| The mutated run shows "N passed" with fewer tests than the baseline, or a failed test file with no named test failure | The scripted edit (regex, sed) produced code that does not parse, so the test file never loaded. A tally that only reads the pass/fail line counts it as survived or killed | Record the baseline file and test totals first. Score a mutant only when its run has the same totals and a named test fails (or none does). If the totals drop, fix the edit so it compiles and run it again |

## 26. The ship target changes after Make (a review stack, with the old integration branch kept as a mirror)

| Symptom | Cause | Default action |
|---------|-------|----------------|
| Mid-run the user says "PR onto the new stack, and also keep the preview/integration branch in step". The unit branch was cut from the old integration branch, which differs from the stack top | Isolate picked the base before the ship target existed | Before the first review wave, cherry-pick the unit's commits onto a new branch from the stack top, re-run the suites there, and point the review packets at the stack-top diff (map the old shas to the new ones). Ship: PR with `--base <stack top>`, add it to the stack, then `--no-ff` merge into the mirror branch in a detached worktree and push only after `git diff --quiet <merge> <new top>`. If the stack tool keeps local tracking in the primary `.git` and refuses to run in a linked worktree, use its remote link command (e.g. `gh stack link <stack#> <PR#>`), not a checkout in the primary |
| The contract's `Ship:` base was right at Isolate, but other sessions stacked more parts on top while Check ran | A stack's top moves under a long unit, and the contract names a base from when the unit started | Before pushing, re-read the live stack top (`gh pr list` bases, or the integration branch's last merge). If it moved, merge it into the unit tip in a detached scratch tree while the last review wave is still running, and run the full suites there (a sibling's renamed test can break this unit's citations without any conflict). Read `git show --remerge-diff <merge>` as the review of the resolution. Then fast-forward the unit branch and open the PR on the new top |

## 27. A mutating reviewer's live mutants leak into parallel reviewers and the gates

| Symptom | Cause | Default action |
|---------|-------|----------------|
| A read-only reviewer reports a flaky red ("exit 0, want 1") or a fix that "looks reverted" in `git status`; another reviewer warns "an uncommitted edit must be gone before anyone runs the gates" | The testing reviewer mutates files in the shared unit worktree while other personas run tests in that same tree | In every read-only review packet, say: run tests on a clean copy (`git worktree add --detach <scratch> HEAD`) or on `git show HEAD:` content, never in the shared tree while the testing pane is mutating. After the wave, the orchestrator checks `git status --short` is clean and re-runs the gates on the clean tip before push; a gate run that overlapped a mutating reviewer does not count |

## 28. `gh` says the repo doesn't exist while `git push` works

| Symptom | Cause | Default action |
|---|---|---|
| At Ship, `gh run list` (lesson 12's base-CI check) returns 404 and `gh pr create` fails with `Could not resolve to a Repository`, but the SSH push succeeded | The active `gh` account can't see the org repo; another logged-in account can | A gh 404 is not "no CI" or "no repo". Run `gh auth status`. If another account is logged in, use it for this call only (`GH_TOKEN=$(gh auth token --user <acct>) gh …`) and pass `--repo <owner/name>`; don't switch the active account. Re-run the base-CI check the same way before archiving |

## 29. Split units that share a design language: maintainability and the final pass belong at the Issue level

| Symptom | Cause | Default action |
|---|---|---|
| Each split unit passed its own review, but after the merges one Issue-wide maintainability pass found several copy-pasted blocks across units (the same page section in two units, the same shell CSS in four), page files over 1k lines, and one `settled:` rule implemented two different ways | Per-unit reviewers only see their own diff, so duplication *between* units is invisible to them, and each maker builds shared pieces locally because it may not touch siblings' files | For split L units, run correctness and testing per unit, and run maintainability **once**, on the integrated Issue diff after all unit merges. Before it, dispatch one integration maker for the makers' "needs from other units" lists. Make the lesson-16 final whole-diff correctness pass an Issue-level pass too. Never grant a unit packet an exception to a `settled:` line; amend `settled:` first, or the Issue-level pass will send it back |

## 28. A background maker sits "waiting on its own background work" for hours

| Symptom | Cause | Default action |
|---------|-------|----------------|
| A small (e.g. tests-only) cycle's maker hasn't reported long after earlier, bigger cycles finished; its notification says it is waiting on background work | The maker's full-suite run hung (e.g. parallel test workers stuck on dead DB sockets after the machine slept); nothing times out, so the maker waits forever | When a maker is silent for more than ~2x its slowest earlier cycle, check `ps -o pid,etime,stat` for its test processes. Long `etime` with near-zero CPU means hung: kill only that worktree's test processes (match the worktree path), let the maker re-run, and ask for the re-run's counts in the report |

## 25. `gh` answers 404 / "Could not resolve to a Repository" for a repo that pushes fine

| Symptom | Cause | Default action |
|---------|-------|----------------|
| `gh pr create` fails with "Could not resolve to a Repository", or `gh run list` returns HTTP 404, while `git push` over SSH works | The active `gh` account has no access to that org; another logged-in account does | Before Ship reads base CI or opens the PR, run `gh auth status` and probe each account with `GH_TOKEN=$(gh auth token --user <acct>) gh repo view <owner>/<repo> --json viewerPermission`. Use the account that resolves, per command via `GH_TOKEN` (don't `gh auth switch`). Never write "no CI on base" on a receipt from a 404 |

## 30. do-work.io `ac.check` answers 403 for the operator PAT

| Symptom | Cause | Default action |
|---|---|---|
| `capabilities ac check` (or any capability newer than the PAT) fails with `forbidden: Not authorized to invoke "<cap>"` although older ops like `req get` / `req update` work | A scoped PAT keeps the capability list it was minted with; the profile table allowing the cap doesn't reach a token minted before the cap existed | Don't retry and don't hard-stop. Use the fallback in `tracker-dowork.md` (proven ACs only, evidence in `closure_proof`), then the lesson 8 order. Tell the user to mint a fresh `dowork.control` PAT |

## 31. A docs unit reviewed with code lenses only ships wrong claims

| Symptom | Cause | Default action |
|---|---|---|
| A user-docs unit (guides, help pages, screenshots) passes correctness and testing, but the docs state rules, labels or links the code contradicts, and moving a section to another page breaks a test or script elsewhere that reads the old file path | The review roster has no lens that checks each prose claim against the code, and the contract's `files:` never listed who reads the page being moved | For a docs unit, add a docs-accuracy reviewer: confirm every factual claim (label, route, rule, flag) at a file:line in the product code, and open every referenced image. Split it by page set when the unit has more than about 4 pages. At Contract, `rg` the repo for every doc path the unit moves or renames, and put any test or script that reads it into `files:` |

## 32. Mutants behind env-gated tests get scored against the wrong suite

| Symptom | Cause | Default action |
|---|---|---|
| A testing reviewer scores a cleanup, docker or real-CLI mutant as killed because a real-infrastructure test catches it, but CI never runs that test; or scores it survived when a gated test would have caught it | Tests that need real docker, an image or a live binary skip unless an env var is set, and the reviewer ran only one of the two suites | Baseline the suite both ways (default and with the gate's env set, when the machine has what it needs). Re-run each survivor in gated code with the gate on, and report "caught only gated" separately from "uncaught". A fake that ignores `ctx` is the usual reason a cancel/cleanup mutant survives the default suite |

## 33. A mutant killed by one concurrency test gets scored as a solid kill

| Symptom | Cause | Default action |
|---|---|---|
| A queue-order or cancel mutant shows "killed" in one run, but only one test fails, and that test drives goroutines or a fake stream with waits and sleeps | The test only hits the ordering the code exists for when the scheduler cooperates, so the same regression passes some CI runs | When a single async test is a mutant's only kill, re-run that test alone with `-count=30` or more under the mutant. A kill rate below 100% means an intermittent guard, so report it with the rate. Propose a test that scripts the order, and prove it before reporting: add it as a scratch file, run it clean and under the mutant, then delete it |

## 34. A small API + screen feature is not a split just because it spans two packages

| Symptom | Cause | Default action |
|---|---|---|
| Weight's "two packages, disjoint files → L + split" row turns a small feature (one new endpoint plus the button that calls it) into two REQs, two worktrees and two PRs, where the first PR ships an endpoint nothing uses | The border row looks at file sets, not at whether each half is worth shipping alone | Keep it one M unit when the new API is additive and its only consumer is this unit's screen. Say why in the contract (`settled:`). Split only when each half ships value on its own or the halves need different reviewers. Lesson 9's API-first split is for changes to a shape an existing screen already reads |

## 35. Gate reds in the worktree that the diff never touches

| Symptom | Cause | Default action |
|---|---|---|
| The full gate in the unit worktree fails a few tests in files the diff does not touch | Some tests depend on the checkout (for example reading `.git/HEAD`, which is a pointer file in a linked worktree), and some are order-flaky under parallel runs | Rerun each red alone in the worktree, then alone in the primary checkout at the base commit. Put each on the receipt as worktree-only, flaky, or base defect, with those counts. Do not call the gate green, and do not edit an unrelated test inside the unit |

## 36. A backlog REQ that is really in flight

| Symptom | Cause | Default action |
|---|---|---|
| Brief creates a unit whose files overlap a sibling REQ that the tracker shows as `backlog` with no claim, so no `footprint-overlap` fires, but that sibling has live worktrees and recent commits that rewrite the same files | The sibling is being built unclaimed (or its claim lapsed); the tracker only guards claimed footprints | At Brief, run `git worktree list` and `git log -1 --format=%cr` on each `req/*` branch. If an unmerged branch touches the new unit's files, `set_blocked_by` that REQ and say so in the contract. Build after it merges, not in parallel |

## 37. A settled third-party asset fails on the account's plan mid-Make

| Symptom | Cause | Default action |
|---|---|---|
| A unit whose `settled:` names a vendor-generated asset (a TTS library voice, an image model, a stock licence) stops mid-Make on an entitlement error (e.g. HTTP 402 "paid plan required"), and the account's tier also decides whether the output may ship commercially | Contract picked the option from the vendor's catalogue without checking what the project's configured key can do | At Contract, make one minimal call with the project's key for each settled external asset (a two-word request, or the subscription read), and check the licence terms for that tier. If either blocks, put the entitlement question in the same batch as the scope questions, before creating the workset |

## 38. PR goes red on CI gates the contract's `test:` never listed

| Symptom | Cause | Default action |
|---|---|---|
| The unit is green locally (tests, build, the project's test command), the PR opens, and CI fails a lint, format or typecheck step on files the unit wrote | `test:` and the Ship gates came from the project docs' test commands; the CI workflow runs more steps than the docs mention | At Contract, read `.github/workflows/*` (or the CI config) and copy every step's command into the gate list. Run them all, in CI's order, before the first push. When the unit writes generated files, make the generator emit output that already passes the formatter |

## 39. A suite that fails at file load from the machine, not the code

| Symptom | Cause | Default action |
|---|---|---|
| The full-suite gate reports many test files failed with no test named (`FAIL <file> [ <file> ]`), and the same file passes alone | The machine ran out of disk (`ENOSPC`) or file handles (`EMFILE`) while the runner wrote its transform cache | Read one failure's error before calling the suite red. An `ENOSPC`/`EMFILE` load error is environment: it doesn't count toward Make's 3 strikes, and it goes to **human** with `df` output if you can't free your own artifacts. Check `df` before dispatching reviewer panes too, since a full disk also stops the panes and the tracker CLI. Re-run the whole suite once space is back; a filtered re-run doesn't clear the gate |

## 37. A slow mutating reviewer's findings land a cycle late and burn the review cap

| Symptom | Cause | Default action |
|---|---|---|
| On an L unit the fix Make starts once the read-only personas report. The testing reviewer (mutation runs) reports 60–90 min later against an older tip, its findings need their own Make and re-check, and the unit reaches cycle 5 with a test-only action still open | The wave was pipelined: the Make and its re-check counted as cycles while one persona of the same wave was still running | Wait for every persona of a wave before the fix Make. If you must start early, fold the late persona's findings into that same Make (a `-change` packet before its commit), not a new cycle. Bound the testing packet so it finishes near the others: a focused mutant set on new code, spot-check only on parts already mutation-tested, and a `wait-for` timeout of 2 h or more |

## 37. A unit whose server gate waits on a client release that isn't published

| Symptom | Cause | Default action |
|---|---|---|
| A reviewer finds that the new server refuses a feature to every client until one reports the next release, and that release doesn't exist yet. The deploy order is written nowhere | The contract settled "unknown or old client = refused" but not the order the two artifacts must ship in | At Contract, when the server's behavior depends on a version or field that only a later client release sends, add a `settled:` line with the deploy order (usually client first), and say whether old servers ignore the new field. Put that order in the CHANGELOG entry and in the first line of the PR receipt |

## 40. The orchestrator's own mutant run scores the wrong tree

| Symptom | Cause | Default action |
|---|---|---|
| A mutant the orchestrator runs to prove a new test "survives", or a mutant against a gated real-dependency test prints nothing useful, and `git diff --stat` in the scratch tree is empty | `git worktree add --detach <scratch> HEAD` was run from the primary checkout, so the tree holds the integration branch, not the unit; or the scripted edit matched nothing (whitespace, wrong text) | Create the scratch tree from the unit branch or tip SHA, never `HEAD` from the primary. Before scoring, check `git log -1` in it names the unit tip, the edit's match count is exactly 1, and `git diff --stat` shows the change. Bound gated runs with `go test -timeout` (or the runner's own flag); macOS has no `timeout` |

## 41. A serial REQ chain on one Issue branch: the dependents refuse the claim

| Symptom | Cause | Default action |
|---|---|---|
| `req claim` on the second unit of a `set_blocked_by` chain fails with `not-claimable: status backlog`, although nothing else holds its files | do-work.io only lets a REQ be claimed once its `depends_on` REQs are done, and the chain's first unit stays in progress until the Issue's one PR ships | Claim the first unit and heartbeat it for the whole chain. Build the dependents unclaimed on the same branch and write a run note saying so. At Ship, archive every unit in the lesson 8 order, and `set_files` each one to the files its commits actually touched |

## 42. Move-only units reviewed line by line

| Symptom | Cause | Default action |
|---|---|---|
| A refactor unit that moves code between files produces a diff of thousands of lines, and reviewers either skim it or spend the wave re-reading moved bodies | Nothing proves which lines only moved, so every line looks like a change | In the maker packet, require a verbatim-move proof: the unit's name set (tests, decls) is unchanged, and an AST hash of each top-level declaration (doc comment included) matches before and after, with only the file differing. The correctness reviewer re-proves it with its own tool, not the maker's, then reviews only the non-moved lines (`git diff --color-moved=dimmed-zebra`) |

## 17. The API part sits idle while the screens part runs

| Symptom | Cause | Default action |
|---|---|---|
| On an L unit split into API then screens (lesson 15), review of the API waits for the screens maker, and the API's fix cycle then waits for the screens' review, so the unit takes two serial fix cycles | Check starts only after all of Make is done | Once part 1's report is in, review it at part 1's tip in a detached review worktree while part 2 builds. Run part 1's fix cycle on a sibling branch cut from that tip, in its own worktree with its own test DB. When both are done, merge the sibling into the unit branch (`git diff --quiet <sibling> HEAD -- <part 1 paths>` proves it), then send part 2 one fix packet covering the API changes plus its own review findings. Tell part 2's reviewers which queued API changes not to file. |

## 43. The receipt repeats a plan fact the code changed

| Symptom | Cause | Default action |
|---|---|---|
| The PR body names a queue, route, flag or table the plan chose, but Make settled on a different one, so the body is wrong from the moment it's opened | The receipt was drafted from the contract and plan text while reviewers were still running, and nothing checked it against the diff | Before `gh pr create`, check every concrete name in the receipt (queues, routes, config keys, tables, commands) with `git diff <base>..HEAD` or `rg` on the tip. The REQ acceptance criteria are a quick cross-check. Fix the body before opening the PR, not after |

## 44. A unit that removes a manual control strands the states only it could exit

| Symptom | Cause | Default action |
|---|---|---|
| Late in Check (cycle 4 of 5), a reviewer finds records stuck in a state no remaining control can leave, e.g. a status the removed picker used to reset | The contract settled "remove the manual control, behaviour drives state" without listing which transitions only that control performed | At Contract, when a unit removes a manual control, list every transition it could make and name what makes each one now (a behaviour, another action, or nothing). Put the "nothing" rows in `settled:` with a recovery path before the first maker packet |

## 45. A unit that changes which artifact clients fetch surfaces its lifecycle one review cycle at a time

| Symptom | Cause | Default action |
|---|---|---|
| A small "pick the artifact version per client" change (image tag, bundle, model file) passes Make, then each review wave finds one more downstream effect: the artifact isn't published before the client that asks for it, old versions pile up on disk, a second fetch path skips the new pull. The unit reaches cycle 4 | The contract settled which version to fetch but never listed the artifact's lifecycle | At Contract, for any change to what clients download, write a `settled:` table covering publish order (does the artifact exist before any client asks?), every fetch path (not just the main one), first-fetch cost inside timeouts, and cleanup of the previous version. Put the table in the maker packet and the cycle-1 reliability packet |

## 46. A unit that needs a dependency release: check the dependency's main and publish pipeline at Contract

| Symptom | Cause | Default action |
|---|---|---|
| Mid-run, the orchestrator finds the dependency's main carries many unreleased commits (so "tag a minor" would ship them all), and later that the publish workflow for the chosen tag base has side effects (e.g. a split mirror pushing the tag's tree onto a public main). Each one needs a fresh user question | Contract settled "release a new version" without looking at the other repo | At Contract, for a cross-repo unit that ends in a release: run `git log <latest tag>..origin/main --oneline \| wc -l` in that repo, and read the tag-triggered publish workflow. Settle the release base (patch branch from the tag vs main) and any public-branch side effect in the same decision batch as the other scope questions. Prepare the carry-onto-main PR before tagging, so any restore step is minutes away |

## 47. Asset-pipeline units: importer side effects pass code review

| Symptom | Cause | Default action |
|---|---|---|
| Reviewers approve an asset-generator unit ("collision/nav now come from the helper mesh"), then the orchestrator's render shows the helper meshes drawn as visible geometry and the feature silently doing nothing | The engine importer applies name-suffix or naming conventions (e.g. `_col`, `-colonly`, LOD suffixes) that rename or re-purpose generated nodes; reviewers read the generator and the level script, not the imported scene | For any unit whose output is imported by an engine, put a runtime probe in the first review packet: load the level, count visible meshes, collision bodies and nav source meshes by name, and compare with the generator's intent. Land it as a smoke assertion before Ship |

## 48. Parallel units that both touch a generated file

| Symptom | Cause | Default action |
|---|---|---|
| Two units each regenerate a shared generated artifact (a scene, manifest or lockfile) from their own inputs; the textual merge succeeds or is hand-resolved, and nobody knows whether the merged file matches what the generator would now emit | Git merges generated text line by line; correctness depends on the combined inputs | After any merge that touches a generated file, rerun the generator in the unit worktree and require `git status` clean (byte-identical) before push. If it differs, commit the regenerated output as its own merge-fix commit and name it in the receipt |

## 49. A UI list keyed on a record state shows every orphan the predicate lets in

| Symptom | Cause | Default action |
|---|---|---|
| A new "live"/"active" list built from a state predicate (holds a claim, status open, has a lock) passes its tests, but real data holds records stuck in that state for weeks, and they would sit in the list forever | The contract wrote the predicate from the happy path; tests and seed data only contain fresh records | At Contract (or before the first review wave), read the real data for the predicate once (tracker list or read-only prod query), sorted by age. Settle each stale or orphan shape as include / exclude / label in `settled:`, and put that line in the maker packet and review packets |

## 50. A mutating reviewer's cleanup kills other sessions' processes

| Symptom | Cause | Default action |
|---|---|---|
| After a test-proof or mutation wave, the reviewer reports it ran `pkill -f "sleep 30"` to clean up; that pattern also matches `sleep 300` in heartbeat loops and other sessions' watchers | Review packets say which worktree to use but not how to clean up processes a test spawned | Every mutating-reviewer packet says: never `pkill`/`killall` by pattern; stop only processes you started, by the pid you recorded. After such a wave, check the unit's heartbeat loop pid is still alive |


## 51. A reviewer proving behaviour against a locally installed third-party tool writes into the real home

| Symptom | Cause | Default action |
|---|---|---|
| A reviewer runs a real installed tool (an editor/terminal wrapper, CLI shim) to prove the unit works with it, and the tool creates files under the user's real home although the packet set `HOME` to a temp dir | Third-party tools read their own env vars (session ids, socket paths) and some resolve paths without `HOME` | The packet says: run the tool under `env -i` with only the vars the test needs and a temp `HOME`; never with the tool's live session/socket vars set. Afterwards the orchestrator checks the real home for new files from that run (`find ~ -maxdepth 2 -newer <marker>`), verifies they came from the run, and removes them |

## 51. A dependency upgrade goes green only through a workaround on the dependency's internals

| Symptom | Cause | Default action |
|---|---|---|
| The maker of a dependency-upgrade unit reports a green suite, but only after it added host code that reaches into the dependency's private state (reflection, swapped internals) to restore behaviour the new version silently dropped | The upgrade packet asked for "adapt every breaking change" and nothing told the maker that a regression in the dependency is not the host's to patch | In every upgrade packet: "if a gate goes green only by touching the dependency's private/internal API, stop and report it as an orchestrator decision". When the user owns the dependency, offer to fix and release it upstream (lesson 46 applies), then move the host to the fixed version and drop the workaround. Survey the dependency's other consumers for the same pattern, and write the upgrade note for them in the release |

## 52. Resuming from a handoff that lists a reviewer as "still running"

| Symptom | Cause | Default action |
|---|---|---|
| The handoff says a Check reviewer was running and Ship waits on its report, but the report file never appears | Subagents die with the session that spawned them; the heartbeat loop can outlive it | On resume, check the report path and the old session's pid first. If the pid is dead and the report is missing, re-dispatch the same review against the same tip (reuse its read-only copy if clean) before anything else. Don't wait on it or ship without it |

## 53. A symlinked node_modules cannot resolve a package the lockfile already lists

| Symptom | Cause | Default action |
|---|---|---|
| The worktree suite fails at file load with "Failed to resolve import" for a package named in package.json, and the same failure happens in the primary checkout | The primary `node_modules` is incomplete, and the worktree symlinked it | Install inside the worktree (`npm ci` / the project's installer). Do not install into the shared primary tree, and do not count that resolve error as a Make strike. Confirm the same file loads in the primary checkout before calling it a product bug |

## 51. A test suite outside CI and outside the contract's `test:` ships red

| Symptom | Cause | Default action |
|---|---|---|
| A later unit's maker finds a suite failing on main that an earlier unit's own regenerated outputs broke; the earlier unit passed its gate and CI | The gate came from the project test command and the CI config (lesson 38); a repo suite that neither runs (e.g. a tool's own pytest) was never in the list | At Contract, list every test suite in the repo (`find . -name pytest.ini -o -name conftest.py -o -name '*_test.*'` outside vendored dirs) and put each one that the unit's files or regenerated outputs feed into the gate. Report each suite's count on the receipt |

## 52. CI's compiler is not the local one

| Symptom | Cause | Default action |
|---|---|---|
| Local build and tests are green on macOS clang; the PR's Linux GCC build fails on a header the code only got transitively (`<initializer_list>`, `<cstdint>`) after the unit changed an include | Compilers differ on transitive includes and leniency | When the unit touches includes or headers and CI builds with another compiler or OS, build CI's config with that compiler before the first push (e.g. `docker run gcc:<ver>` on the core-only config). Treat a compile-only CI red as a Make cycle, not a review cycle |

## 53. A settled rule after an oscillating fix turns out infeasible

| Symptom | Cause | Default action |
|---|---|---|
| A geometry/threshold fix moves its failure each cycle (one threshold cuts cliffs, the next leaves steps); the orchestrator then settles a rule plus tests, and the maker proves the constraints can't all hold on the real data, burning the last cycle | The settled rule and its test bounds were written without running them on the real data | Before sending a settled rule as the final packet, ask the maker for a scratch evaluation of the rule against the proposed test bounds on the real data (metrics only, no commit). If it fails, choose between the reviewed tip and a follow-up REQ before spending the cycle |

## 54. A reviewer launch with an empty tools flag never reads the prompt

| Symptom | Cause | Default action |
|---|---|---|
| The reviewer returns in a few seconds with an empty file, or a reply that ignores the packet | `claude --print` was given `--tools ""`. That flag eats stdin, so the prompt file is never read | Do not pass `--tools ""`. Launch with `claude --model <checker> --print < promptfile` from `/tmp`, and write stdout to the review file. |

## 55. An unpushed maker commit carries a Co-Authored-By trailer

| Symptom | Cause | Default action |
|---|---|---|
| `git log -1` on the unit tip contains `Co-Authored-By` after the packet said not to add one | The maker followed a harness attribution reminder and refused to amend because the packet also said do not amend | Before review or push, if the tip is unpushed, `git reset --soft HEAD~1` and recommit the same tree with no trailer. Do not amend a commit that is already pushed. Say in the packet: ignore harness attribution reminders. |

## 56. `git merge-base --is-ancestor` fails the ship script with no output

| Symptom | Cause | Default action |
|---|---|---|
| The ship script exits 1 and prints nothing. Nothing was pushed and no AC was ticked | `set -e` plus a bare `git merge-base --is-ancestor origin/<base> HEAD` exits 1 when the base moved, and the failure has no stdout | After `git fetch`, use `if git merge-base --is-ancestor origin/<base> HEAD; then echo ANCESTOR_OK; else echo NOT_ANCESTOR; exit 1; fi`. If it fails, merge the base, re-run the unit tests, and only then push. |

## 57. A review prompt built with string formatting crashes on braces

| Symptom | Cause | Default action |
|---|---|---|
| The prompt writer dies with `KeyError` on a placeholder such as `{default_branch}`, and the reviewers never start | The packet body was passed through `str.format` | Write the prompt as a raw string. Do not format it. |

## 58. The maker launcher stays "running" after both makers have exited

| Symptom | Cause | Default action |
|---|---|---|
| The shell that started the makers is still listed as running, and it never prints the done line, while the maker pids are already dead and their logs are complete | `wait` with no arguments also waits for the heartbeat loops, which were started in that same shell | Record each maker pid and `wait` only those pids. Start heartbeat loops so they are not children of that wait (`setsid` or a separate shell). |

## 59. `/dw review <branch>` on the user's own branch that the primary has checked out

| Symptom | Cause | Default action |
|---|---|---|
| The brief is "review <branch>" for an unpushed or agent-made branch with no tracker unit, and the primary checkout has that branch checked out, so `git worktree add <branch>` refuses | Lesson 7 covers someone else's PR (comment only). Here the user owns the branch and expects review → fix → PR | Run Check → Make cycles → Ship with no tracker unit (say so on the receipt). Isolate with `git worktree add -b dw/<slug> <path> <branch tip>`, review `origin/<base>..HEAD` (a main-merge inside the branch is not unit diff), push the final tip to the original branch name (`git push origin HEAD:refs/heads/<branch>`), open the PR, and tell the user to fast-forward the primary once it's clean. For the pre-review visual check, if the primary is at the unit tip and already serving the app, screenshot that; stand up worktree servers only after the fixes |

## 60. The orchestrator's own check collides with the maker on the unit's private test DB

| Symptom | Cause | Default action |
|---|---|---|
| The maker's full-suite gate reports hundreds of DB errors (e.g. 203 failed) that vanish on an immediate rerun | The orchestrator ran its own test (a flaky-test recheck) against the same per-unit test DB while the maker's suite was running | While a maker or mutating reviewer is working, the orchestrator runs tests only on its own DB name (`<unit>_orch`) or waits. A gate run that overlapped another process on the same DB does not count; rerun it alone |

## 61. The visual check's env edits redden the next gate run

| Symptom | Cause | Default action |
|---|---|---|
| After the orchestrator's visual check, the gate shows reds in auth or session tests that the diff never touches, and the reviewers' copies (which copied the env) show the same reds | To serve the worktree locally, the orchestrator changed the gitignored env file (DB, app URL, stateful/cookie domains), and the test runner reads that same file | Serve the visual check from a separate env (an env-var override on the serve command, or a copied env in a scratch dir), or restore the env file before any gate run. Do not give reviewers an env file a visual check has changed. A gate run against an edited env doesn't count, so re-run it on the restored env before the commit |

## 62. "Dispatch up to N agents" on one machine runs it out of memory

| Symptom | Cause | Default action |
|---|---|---|
| Minutes after a parallel wave of makers starts, the user reports the machine is out of memory and asks to limit the work; the makers have to be stopped mid-provisioning | The fan-out was sized by the user's agent count and by file footprints, not by what each unit's build, test and render processes cost on this machine | Before the first wave, read free memory and swap (`memory_pressure`, `sysctl vm.swapusage`) and estimate each unit's heaviest process from an existing worktree. Start at most two heavy units, state the cap in the first status, and raise it only after a wave runs with headroom. Put a memory rule in the shared maker and reviewer packets: one heavy process at a time, a bounded build `-j`, close what you start. Read-only reviewers do not count against the cap; the mutating one does |

## 63. The same blocker class comes back in consecutive review cycles

| Symptom | Cause | Default action |
|---|---|---|
| A reviewer breaks a guard, the fix cycle patches that case, and the next cycle's reviewer (or the maker) breaks the patched guard a different way; the unit burns cycles toward the cap of 5 on one rule | The orchestrator keeps settling a narrower rule per finding, so each fix adds a case and leaves the invariant unstated | At the second blocker of the same class, stop patching. Write the invariant in one sentence, pick the simplest model that satisfies it by construction even if it costs a feature, and say so to the user as a contract change with its cost. In the fix packet, tell the maker to try to break the stated rule before building it and to report, not hide, a hole. Ask for one regression test per attack found so far plus a property test of the invariant, and send the next wave's security or correctness reviewer the invariant, not the patch list |

## 64. A unit's branch is already on the remote at Ship

| Symptom | Cause | Default action |
|---|---|---|
| `git push` of the unit branch is rejected as non-fast-forward, although the orchestrator never pushed it; a PR opened against that branch points at an old tip | A maker pushed part-way ("to back up"), and Ship then rebuilt or split the branch | Put "Do NOT push, not even to back up" in every maker packet. Before the first push at Ship, `git ls-remote --heads origin '<unit branch>*'`. If a stale copy exists, do not force-push: push the reviewed tip under a new branch name, open the PR from that, close any PR that points at the stale branch with a note, and tell the user the stale remote branch is theirs to delete |

## 65. A unit that rewrites docs or help gets no reviewer who reads the words against the code

| Symptom | Cause | Default action |
|---|---|---|
| The code personas approve, and the rewritten docs or help still state rules the build changed, omit rules it added, or give deploy steps that would not work | `review.md`'s roster has no lens for prose, so nobody opens the code or the infrastructure files a sentence depends on | When a unit's diff rewrites docs, help or a runbook, add one read-only docs reviewer to the first wave. Its packet lists the settled departures from the brief and tells it to check every changed statement against the file that makes it true (code, config, infrastructure), citing doc line and code line for each false or missing one. A wording preference is not a finding. Re-run it on the fix cycle's doc diff |

## 66. Reviewing every PR of a stack (review → fix → verify per part, N at a time)

| Symptom | Cause | Default action |
|---|---|---|
| Reviewers on lower parts report bugs a higher part already rewrote, and fixes land in code the next part replaces | Each part is reviewed on its own diff with no view of the top | Ownership rule in the shared packet: a finding belongs to the part whose diff holds the code *in the form it has at the stack top*; check `git diff <part> <top> -- <file>` and drop it if rewritten higher. Exempt parts meant to ship alone (e.g. a prod hotfix at the bottom) |
| A worker reports "could not read common.md" from inside its worktree | Packets used repo-relative paths to gitignored orchestrator files (`.dw/…`), which do not exist in a worktree | Every packet path to orchestrator files is absolute |
| A reviewer's re-run dies mid-way: "files disappeared" | The orchestrator tore the worktree down on the worker's first summary message; the worker was still acting on a follow-up | Remove a worker's worktree only after its idle/finished notification, never on its first report |
| The upward cascade (merge each fixed part into the next, push) is refused by the permission classifier at the end | Pushing to many shared branches is a high-blast action the session was never cleared for | Before the first wave, tell the user the cascade + preview merge will push to every part branch and get an explicit go; until then keep fixes on each part's own branch. Simulate the whole cascade with `git merge-tree --write-tree` + `commit-tree` (no refs written) to list conflicts before asking |
| A cascade conflict in a test file resolves cleanly, but the merged test now passes for the wrong reason (an upper part added an earlier gate that refuses the fixture) | The resolution keeps both sides' tests; nobody re-proves the lower part's new test against the upper part's fixtures | After resolving a conflict in a test a fix cycle added, re-run that fix's mutation on the merged tree; it must still go red |
| Guard/architecture tests: each review cycle finds one more spelling that slips past | The fix adds the reviewer's spellings to a list | Fix packet states the rule and asks for a token-level scan by construction (forbid the identifier outside an allow-list with reasons), plus two self-found bypass attempts before committing |

## 67. A blocker fix on a security or data boundary re-reviewed by the testing persona alone

| Symptom | Cause | Default action |
|---|---|---|
| Cycle 1's security (or adversarial) reviewer finds a blocker; the fix adds new guard code; cycle 2 would go out with only the mutating reviewer and nobody attacks the new guard | `review.md` says to drop the read-only reviewers after cycle 1, which fits ordinary fixes but not a fix that is itself new boundary code | When a blocker came from `security` or `adversarial` and its fix adds code, send that persona back in for the next cycle alongside the mutating reviewer, with a short list of what to attack in the new code. Drop it again once it approves. In one run this second pass found two more holes in the hardening that the mutation reviewer could not have seen. |
