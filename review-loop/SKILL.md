---
name: review-loop
description: Use when a pull request has review-gate findings to fix, from the GitHub Action's comment or a local round, and the person wants them fixed, pushed and re-reviewed until the pushed head scores 5/5. Triggers: /review-loop, "fix the review issues on PR N and re-review", "loop review-gate until clean", "fix issues from review then run review-gate". Needs a repo gated by review-gate-v2. Not for a read-only review (review-gate) or for implementing new work (dw).
argument-hint: <pr-url | N> [--base <ref>]
---

# Review loop

The author side of `review-gate`, wrapped around a pull request that already has findings: adopt the review the PR already has, fix, re-review, push, and repeat until the PR's pushed head scores 5/5 with nothing left unpushed. "Decide" says when that is and what else ends the loop; this skill owns what happens between rounds.

**REQUIRED SUB-SKILL:** `review-gate` runs each round and defines the exit codes, the report shape, the progress pair and settling. Do not restate them; follow them. Its rule to stop when a saved round does not improve does not apply here: "Decide" replaces it.

Read `references/field-lessons.md` first if it holds lessons, then `references/setup.md` before the first round and `references/fixing.md` before the first fix.

## Before the first round

Every CLI call below is `PYTHONPATH=<checkout> python3 -P -m review_gate <command>`, where `<checkout>` is `$REVIEW_GATE_V2_HOME` or the review-gate-v2 repo path; `review-gate` explains why. The CLI reads `GITHUB_TOKEN`, not `GH_TOKEN`; `references/setup.md` covers the checkout path, tokens and accounts.

1. **Resolve the PR.** Take `<owner/name>` from the PR URL and pass `-R <owner/name>` to every `gh pr` call: in a fork checkout gh's default repo can be the upstream, whose PR N is a different change. `gh pr view N -R <owner/name> --json headRefName,baseRefName,headRefOid,state,title,body`. Save title and body to `/tmp/rg-<repo>-<N>/title.txt` and `body.txt`, empty or not; `<repo>` is the name half of `<owner/name>`, since two repos' PR N would otherwise share one directory and its state. `<remote>` below is the git remote that PR lives on.
2. **Own the checkout.** The PR branch is checked out in a worktree you own, at `headRefOid`, by `review-gate`'s "Review a pull request" rules (`git-worktree` for the mechanics). Who holds the branch decides how (`references/setup.md`, "Who holds the branch"): a worktree another session is working in means stop and say so; a dead registration, a live factory worktree and the person's dirty primary checkout each have a way through. Before moving a local copy of the branch to `headRefOid`, run `git merge-base --is-ancestor <headRefOid> <local>`: true means unpushed fixes from an earlier loop, which you gate and push, never reset away.
3. **Base is the PR's base.** `git fetch <remote> <baseRefName>`, then pass `--base <remote>/<baseRefName>`, never the default branch. A stacked PR reviewed against `main` reports every lower part's diff as yours. Fetch the base again before every round: a stale local base ref puts a merged sibling PR's whole change into round 1. Run `git merge-tree --write-tree <remote>/<base> HEAD` here too, not only before the push: on a conflict, merge the base in before the first local round, so every round reads the final diff instead of spending rounds on partial ones. A diff too big for any round (a hand-merged upstream sync) gets a synthetic base (`references/setup.md`, "A diff too big to review").
4. **Adopt the Action's review.** When the PR has a review-gate comment: `pr-state --repo <owner/name> --pr N > /tmp/rg-<repo>-<N>/state.json`, and check the file parses. Its stored head must exist locally; if a force-push removed it, the PR comment has to be deleted to start over, and that is the person's call. No comment means no PR state, but not always round 1: `ls "$(git rev-parse --git-common-dir)/review/"` for a local state of the branch (a factory's own rounds). The CLI continues it; keep it, and pass `--full` when the base was merged since its last round. When the state's `head` is `headRefOid` and nothing is open, the Action already finished the job: check `merge-tree` and the files the base changed since the merge base against the PR's, and with no overlap report its verdict and run no round. A local branch state from an earlier loop can disagree with the PR's on round and ids; the PR's wins: copy the local file aside and run the first round with `--state-file`, which overwrites it on save.
5. **Collect the findings** from the PR comment and review threads (`gh api repos/<o/n>/pulls/N/comments`): the full scenario and fix text is there. Check each finding's sites against `git diff --stat <remote>/<base>...HEAD`. A finding on a file the PR no longer changes came in with a merge of the base and is not this PR's to fix: report it as the person's to settle ("already on the base") or to raise against the base.
6. **Check the branch itself.** `gh pr checks N -R <owner/name>`: a red check on the PR is part of the loop (`references/setup.md`, "Before the first fix"). Start the full suite on the adopted head while you read the findings; a failure there goes into the first round's commit. Until it finishes, edit only files it does not load (a frontend or docs tree), so neither the baseline nor the fixed run tests a mix.

**Paths.** The harness moves the shared working directory between a sibling call's `cd` and this call's commands, so in a parallel batch write every command as `git -C /abs/worktree …`, `make -C /abs/worktree …` and absolute file paths. Keep `cd <worktree> &&` for a call that runs alone (a suite, a worktree add, anything whose result matters) and print `pwd` first so a drift shows. `git worktree add` always takes an absolute path; `git worktree move <wrong> <right>` recovers one that landed inside another tree.

## Each round

### Fix

Per finding, read the code first. The reviewer can be wrong. `references/fixing.md` is the checklist: which findings are not yours to fix, what makes a fix come back next round, and the mutation check before a coverage commit.

| Finding kind | What fixing means |
|---|---|
| Behaviour (missing check, wrong rule, FK rule) | Failing test that states the rule, then the fix, then green |
| Test coverage (`untested-*`) | The test only. It must pass on the existing code; if it fails, you found a bug: fix it in the same commit. No honest test possible? Leave it open and say why |
| CI evidence (a cache hit or path no run has shown) | A run, not code: `references/ci.md`, "A finding that needs a run" |
| Nit | Leave it alone unless the fix is provably identical for every caller; nits do not count toward the stop rule, so a regression from one costs a round for nothing. Fix it in full or not at all: a half-fixed nit comes back as an action |
| The person's call (content, a spec conflict, a trade-off to pick) | Leave it open and take it to the person before the round, with options. An untouched finding climbs one severity per round, and a doc note does not clear a behaviour finding |
| You disagree | Leave it open. One sentence why, for the person, with the probe that showed it. Never `settle` on your own word. When the probe is a test that passes because of a guard the reviewer could not see (a global scope, a middleware), keep the test, prove it by bypassing that guard and watching it fail, and add one comment at the site naming the guard; that closes it |

Each round, re-read a held finding's fix text against the reason you held it: reviewers re-word findings, and the conflict can drop out, which makes it a ten-minute fix.

Run the touched tests, then the suites they belong to, then only the formatter the project's gate names for those files; with none named, format nothing (an `npx` formatter on an unconfigured repo rewrites the file in its defaults). The project's test rules apply (unit first, mock I/O, no skipped tests). One test run at a time per worktree: two runs that migrate the same test database turn each other red. One commit per round, saying what changed, with plain `git commit`. Committed nothing? Run no round: a round on an unchanged head spends a round and can mark open findings fixed that nobody fixed. Either everything open is the person's call or the loop is stalled; "Decide" covers both.

Before the commit, `git fetch <remote> <pr-branch>`: another session or a factory can push to the PR branch mid-loop (`references/fixing.md`, "The branch moves under you").

### Round

Dispatch `review-gate` in a subagent on a cheap model with `references/round-brief.md` filled in, once per loop. For later rounds, `SendMessage` the same agent the new head, the round number and the state-file rule; it keeps the recipe, the paths and the report shape, and its reports come back whole. The CLI picks its own reviewer models. The subagent returns the round row and counts first, then every open finding verbatim, then fixed ids; you never read the report files.

If the subagent ends its turn while the CLI still runs, resume it ("keep waiting on `$run/exit`, then report"); never start a second round, which races the first on the same branch state. With no person to resume the session (a factory or headless run), stay in the turn until the round reports: a session that ends kills the CLI, and the round reads `aborted` with no score. If it ends with no report after the CLI exited, read `<out>/verdict.json` yourself and check its `head` is your commit; after two such losses, run the next round's CLI yourself per the brief and read only verdict.json.

| Which local round | `--state-file` |
|---|---|
| First, and the PR has an Action comment | Yes. It continues the PR's numbering, so it is round 2 or later |
| First, no comment | No. Round 1, unless a local state of the branch exists (step 4) |
| Every later round | No. The CLI saved local branch state after the last saved round |

The PR can gain an Action round between local rounds. Before every local round, run `pr-state` and compare its `round` and `head` with the last read: a newer PR round means this round also takes `--state-file` from the fresh state (the PR's ids win), and its findings join this round's fix list. After any push mid-loop, wait for the review-gate run on the pushed head to finish before the next local round: one started while it runs splits the numbering.

When a merge of the base is among the commits since the last saved round, pass `--full`: the round reviews `<base>...HEAD` and keeps round count, ids and settles. Without it the round reads everything between the saved head and the new one, base commits included, and raises findings on other PRs' files. Pass it too when a fix touches code whose test an earlier round committed: a round that reads only the new commits cannot see that test and raises the code as untested. And pass it on the head you mean to push when the local rounds since the last full read covered only fix commits: a narrow local `done` on a large PR is followed by the Action's first full read, which can open ten new findings.

### Decide

The loop is done when both hold:

1. **5/5 on the pushed head.** The review of record for the PR's current `headRefOid` scores 5/5. The CLI gives 5 exactly when no blocker or action is open (`done`); nits do not move the score. The review of record is the Action's, read with `pr-state` after its run on that head. When the Action does not review that head (the repo has no review-gate workflow or reviews only on a `/review-gate-v2` comment, or its runs there end `incomplete`), it is a local round on that same head, with `--full` when earlier local rounds read only fix commits. Expect that after merging the base into a PR whose Action state is rounds behind: its next run reviews from the old saved head, base commits included, and every reviewer fails on size ("Prompt is too long", "exceeds 10MB"). Grep the run's log for those rather than waiting on `pr-state`, take the verdict from a local round with `--state-file` and `--full`, and say in the report that the PR comment is stale and why.
2. **Everything pushed.** After `git fetch <remote> <pr-branch>`, `git rev-parse HEAD` equals the PR's `headRefOid` and `git status --porcelain` is empty.

A local `done` on an unpushed head means push, not stop. There is no round cap, and a saved round that does not improve the pair (open blockers, open actions) means change the fix, not stop. Check usage between rounds per `stay-within-limits`.

Only three things end the loop short of 5/5:

- **Two `incomplete` rounds in a row.** The reviewers are failing, not the code: report the failed reviewers. One `incomplete` round reruns as it is on the same head: the one exception to "committed nothing? run no round", because an incomplete round is not saved and so cannot mark anything fixed. Read its verdict first: the reviewers that finished still list findings, and when they are specific, fix and commit before the rerun.
- **The PR merged or closed** (`references/fixing.md`, "The PR merged or closed").
- **The person's call with no person in the session** (a factory or headless run): hand over what is left.

Four cases read the pair differently. Each one keeps the loop going:

- **Your regression.** A new blocker or action whose every site is in lines the previous local round wrote: fix it and run again. Before fixing the same lines a second time, remove the claim the reviewer keeps falsifying instead of refining it.
- **First full read.** A `--full` round after rounds on partial diffs (or after adopting a PR state rounds behind the local one) can return the same pair made entirely of new ids. Compare the open ids: that is the reviewers' first read of those lines, not a stall. Say so and keep going.
- **The person's call.** An open blocker or action you cannot close alone: a disagreement, a spec conflict, a trade-off, a finding out of the diff, or one of these promoted a severity because it stayed open. Ask the person when it first appears, one multiple-choice question per finding (settle with this reason; fix it this way; file a follow-up and settle with its number), apply the answer, and keep going. When the answer is a doc note, write it once covering every case, ask in the same question whether to settle fN with that choice as the reason, and run the round after the settle: a note alone comes back each round asking for the decision to be recorded.
- **Stalled.** The same open findings survive your fixes in two saved rounds in a row: the fix is not landing. Compare titles and sites, not only ids: the CLI keeps an id while the sentence it names changes, which is progress. Take those ids to the person as above, with what you tried, and keep going on their answer.

**A merge watcher** (the project merges on a local `done`) makes every local round a deciding one. Push the fix commit first, wait for the review-gate run on that head, read `pr-state`, and only then run the local round with `--state-file`, so the `done` the watcher sees already covers the Action's findings. Never start a local round, the first fix round included, while the Action's review of that head is still running. After any local `done`, check `gh pr view --json state` before editing again: the merge also removes the worktree, uncommitted edits with it, so keep each round's edits in a script outside the tree.

**Settling** is the person's. When they name findings to settle: `settle` before the first saved local round has no state to write to, so run that round first, or copy the `pr-state` output to `<git common dir>/review/<branch, / as %2f>.json`, then settle, and check it printed `settled fN` (exit 0 alone means nothing happened). A round on the unchanged head after settling the last open finding is the other exception to "committed nothing? run no round": it returns `done` with the settles counted. Local settles never reach the PR comment, and every copy of `pr-state` over the local state wipes them: keep each settle line once in a script (copy the state, then settle each id with its reason), append new ids to it, and run it before every local round that follows an Action round. Give the person the reason text per id to post as settle comments on the PR: the Action's state, and so the review of record, counts a settle only once it is posted there. Read `pr-state` again after they post.

A bare re-invoke of the loop after a hand-over means "fix, don't settle": fix every open finding the diff owns whose fix cannot break a spec the issue pins, nits that climbed included. For spec-pinned findings, ask one multiple-choice question (settle all and file follow-ups for the real bugs; fix some here; fix all) and commit nothing until it is answered.

## Push and hand over

Any commit after a `done` fixes the open nits too: the next round re-reads them and can promote one to an action.


Before the push, and right before every later push: `[ "$(gh pr view N -R <owner/name> --json state -q .state)" = OPEN ] || { echo "not open"; exit 1; }` as a gate in the push chain, since printing the state exits 0 and the chain pushes on (a merged PR's head is frozen and a push to its branch updates nothing GitHub shows; a watcher can merge before 5/5), `git fetch <remote> <pr-branch>` (moved means someone else pushed; never force-push), and `git merge-tree --write-tree <remote>/<base> HEAD`, also as a gate in the chain (it exits 1 on a conflict; printing it and pushing on once pushed a conflicting head that ran no workflows). A conflict means a merge of the base first, gated, pushed with the fixes, then a round with `--full`. `references/fixing.md`, "The branch moves under you", has each case.

Push the PR branch, one branch per push command. Then the project's post-push rules, from its memory or `AGENTS.md`: a stack merges upward from this part and its preview branch follows the top (`references/stack-merge.md`); with no such rules the push is the end.

After the push, wait until `gh run list -R <owner/name> --branch <pr-branch> -L 5` shows runs for the pushed head; seconds after a push it is empty because nothing has registered yet (`references/ci.md`, "Waiting"). No runs after minutes: read `mergeable`, since GitHub fires no `pull_request` workflows while the PR conflicts with its base; a conflict means merging the base (`references/fixing.md`, "The base moved") and pushing again. Runs without review-gate among them: the repo has no review-gate workflow or reviews only on a `/review-gate-v2` comment, the PR comment is stale until someone posts one, and a local round on the pushed head is the review of record. A review-gate run: read `pr-state` on the pushed head; `references/ci.md` covers a run that did not review. The Action's reviewers are not the local ones and can raise a new finding on your own lines; that is one more fix round, run with `--state-file` from the fresh state, and one more push. Hand over only when "Decide" says the loop is done or ended.

Report: the round row of the 5/5 review, whether it was the Action's or local, and the pushed head sha; fixed ids; the settle text per id when the person settled anything locally; any PR body or issue line a fix overturned, for the person to update; the local report path; and whether the PR's comment is stale until someone comments `/review-gate-v2`. Posting that comment is the person's call unless they asked for it. Ending short of 5/5, lead with why, then the open ids with your one-sentence reasons, out-of-diff findings and spec conflicts named as such.

## Guardrails

- Never weaken, skip or delete a test to clear a finding. Never edit `.review.md` or the review workflows.
- Commit with plain `git commit`. Never `--no-verify`, and never pass `core.hooksPath` to point hooks elsewhere: the repo's hook may not live in `.git/hooks`, and skipping it by mistake is the same thing. Undo one with `git reset --soft HEAD~1` and a plain recommit on the same message.
- Never force-push the PR branch, and never reset a local branch that is a descendant of the PR head.
- Never comment on, resolve or react to review threads. The only PR write is the push.
- The score is advice. Say "no open findings", never "approved".

## Red flags

| Thought | Reality |
|---|---|
| "A fresh local round 1 is simpler than pr-state" | The PR's ids then never close and the Action reports the same findings again |
| "Coverage finding: the code is right, so note it and move on" | The fix for `untested-*` is the test. Write it |
| "Local round says 5/5, so we're done" | Done is 5/5 on the pushed head. Push, then read the review of that head |
| "Three rounds without 5/5, time to hand over" | No round cap. Change the fix, or ask the person about the ids that keep surviving |
| "Rerun on the same head to see if it clears" | Nothing changed, so nothing is fixed. Commit first, or ask the person |
| "Settle it, the reviewer is clearly wrong" | Only the person settles. Report why and leave it open |
| "A new blocker appeared, so the stop rule says stop" | If every site is in your last round's lines, it is your regression. Fix it |
| "The person re-ran the loop, so settle what they left" | A bare re-invoke means fix, not settle |
| "A fresh subagent per round is cleaner" | One subagent per loop keeps the recipe; fresh ones lose reports to truncation |
| "Push every branch in one command" | One branch per push; multi-branch pushes get refused as a remote repoint |
