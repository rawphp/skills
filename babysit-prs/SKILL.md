---
name: babysit-prs
description: 'Work through a set of open pull requests until each is merged: CI green and review-gate 5/5 on the same pushed head, then squash-merge. Use for /babysit-prs, "babysit my PRs", "get all my PRs green and merged", "merge everything that passes the gate", or a /loop over open PRs. Needs gh and a repo gated by review-gate-v2. Differentiator: orchestrates many PRs with one worker each and owns the merge; review-loop fixes one PR and never merges, review-gate only reviews.'
argument-hint: '[PR numbers | "mine" | "all"] [--batch 3] [--every 15] [--attended]'
---

# Babysit PRs

You are the lead. You do not fix code. You pick PRs, start one worker per PR, answer the workers' questions, and merge a PR once its pushed head has green CI and a 5/5 review round. Workers do the fixing with `review-loop`.

**REQUIRED SUB-SKILLS:** `review-loop` (what each worker runs) and `review-gate` (round mechanics, settling). `council` for decisions: the run is unattended by default, and only `--attended` (or the person saying to ask them) sends real choices to the person. Read `references/field-lessons.md` before starting.

## The merge rule

Merge a PR only when all four hold for the **same head sha**:

1. That sha is the PR's current head on the remote.
2. Every check on it is `pass` or `skipping`. A skipped coverage or test job behind a failed shard is not a pass: wait for the real run.
3. A saved review-gate round on that sha is `done` at 5/5. A `## Review` section in the PR body (a factory build's in-house review) does not count: workers start at round 1 whatever the body says.
4. No unresolved review thread (a gated repo refuses the merge otherwise).

`scripts/merge.sh` checks 1 and 2 again at merge time. You check 3 from the worker's report and the local review state, and 4 with `gh`.

## Setup (once)

```bash
gh pr list --author @me --state open --json number,isDraft,headRefName,updatedAt   # the queue, oldest first
git remote get-url origin                                                          # which repo rules apply
uptime                                                                             # is the machine already loaded?
```

- Read the repo's and the person's instruction files for merge method, commit trailers, PR body sections, and machine limits. They override this skill.
- Skip, and tell the person why, any PR whose diff is in the megabytes (`git diff origin/<base>...origin/<branch> | wc -c`): review-gate cannot review it.
- If the review Action ends `incomplete` within a minute on every PR, it has hit its own usage limit. Read the failure once, note the reset time, and treat local rounds as the review of record until then.
- Ask the person only what you cannot find: which PRs (default: theirs, oldest first), and whether a comment on a PR has side effects in this repo (a bot that relaunches a build). If comments have side effects, nobody posts any.

## The loop

Work a batch of 3 (or `--batch`). Each tick:

```bash
gh pr list --author @me --state open --json number,isDraft,headRefName,updatedAt   # re-list: PRs open after the run started join the queue
scripts/tick.sh <PR> <PR> <PR>     # state, check counts, failed checks, local review state, worker reports
```

1. **Merge** every PR whose worker reports done and whose state agrees (see "Merge").
2. **Answer** every question in the inbox (see "Decisions"). Write the answer to the worker's answers file.
3. **Unstick** workers (see "Workers that stall").
4. **Refill** the batch with the next oldest PR: survey it (diff size, failing checks, draft or not, existing worktree or review state), then start a worker with `references/worker-brief.md`.
5. **Report** to the person: what merged, what you decided and why, what is waiting, anything they must know. Then schedule the next tick in `--every` minutes. The person can also set it in words ("check every 20 minutes"), at the start or mid-run. With no interval given, use 15 minutes, or 10 when a PR is one check from done. An interval the person set is used as given.

**The loop never ends on its own. Stop only when the person tells you to.** Always schedule the next tick. An empty queue is not the end: skip `tick.sh` (it needs at least one PR), report one line ("queue empty, watching"), and tick again at the usual interval so a PR opened later is picked up. When nothing can progress without the person, say what is waiting and keep ticking.

## Workers

One worker per PR, each in its own worktree outside the repo. Fill in `references/worker-brief.md`; the survey facts go in the brief so the worker does not rediscover them.

**Talk through files, not messages.** Worker-to-lead messages can arrive hours late, and a worker that is polling never reads a message.

```text
<inbox>/pr<N>.md            worker overwrites with every status, question and final report
<inbox>/answers/pr<N>.md    lead overwrites with every answer; worker polls its content hash
<inbox>/briefs/             briefs and drafts (tick.sh prints every *.md at the inbox root)
```

`<inbox>` is `$BABYSIT_INBOX`, default `/tmp/babysit-prs`. `scripts/tick.sh` prints every report. If the default inbox holds files you did not write, use `/tmp/babysit-prs-<repo>`. Workers poll answers by content hash (`md5 -q`), not mtime: the mtime can stay at the first write.

**Worktrees.** Before reusing or removing a worktree you did not create, check for processes running in it (`lsof -a -d cwd` over `pgrep -f <path>`) and its creation time. If anything runs there or it is minutes old, it is another session's: give the worker its own worktree and merge without `--worktree`. Each worktree keeps its own build output directory; a shared one (such as one `CARGO_TARGET_DIR`) lets a local gate test another branch's code.

Tell each worker what the last few taught you: the base's current red test, known flakes and how to clear them, guard tests the PR author's own gate skips. This is the cheapest speed-up in the loop.

### Workers that stall

| Symptom | Do |
|---|---|
| Report says "waiting on your answer" after you answered | It ended its turn. Send it a message: a stopped worker does receive one, and it resumes with that as its prompt. |
| Report unchanged, PR head unchanged, worker shows as running | Read the tail of its transcript. If its last tool call is over ~30 minutes old, stop it and start a replacement on the same worktree. Brief the replacement to inspect what the old one left (unpushed commits, unstaged files, a half-run git command) before building on it. |
| Worker is polling and you need it to change course | Stop it, then message it. It resumes with its context. |
| Worker went idle with no report | Read its last outgoing message from the transcript before pinging. The question is usually there. |
| Your session restarted and the workers died with it | Read each PR's saved verdict and report first. Where a round is `done` at 5/5 on the current head, watch CI and merge yourself. Start a replacement only for what a report would have held (a deploy paragraph, a migration analysis). |

## Decisions

A worker brings you a finding it must not decide alone. Route it:

| The finding | You |
|---|---|
| A plain defect with one fix | Tell the worker to fix it. It should not have asked. |
| Answered by the issue's own words, a repo rule, or an existing header, doc or pattern | Answer from that text and quote it. No council. |
| Same mechanism, sites and asked-for fix as one already settled on this PR | Settle with the same reason. Give the worker a standing rule for further re-raises. |
| A real choice between options (scope, behaviour, security trade-off, data migration, a new dependency) | Run `council`, then act. With `--attended`: ask the person, with options and a recommendation. |
| The same rule attacked from a third angle | Stop patching. Take the structural answer, or settle. |

Rules that held up:

- **A defect already on the base and outside the issue is settled with a filed follow-up**, not folded into the PR. File the issue first, then put its number in the settle reason.
- **Label a follow-up ready to build only when it holds no open question.** One that needs the person's call is filed as proposed, with the question stated.
- **Settles are local** (`review_gate settle`) when comments have side effects. Say in the report that a later Action review will not know about them.
- **Anything reserved for the person** (a dependency, a data-deleting migration, waiving a security finding): when a council decides it on delegation, say so plainly in the report so the person can reverse it. A merge the person keeps for themselves (a migration that drops a column) still gets a worker to 5/5 and green. Say in the brief you will not merge it, and ask for a decision section in the final report: data loss, `down()`, a mid-deploy failure, partial DDL state, whether the table is populated.
- **A finding settled as another issue's scope:** check which issue makes the gap reachable. If it does not depend on the issue that closes the gap, add that dependency (`## Depends on` in the body plus the tracker link) in the same tick, and name it in the settle reason.
- Record each council in the report in the council's own format, and keep the transcript path.

## Merge

```bash
scripts/merge.sh <PR> <head-sha-prefix> [--ready] [--worktree <path>]
```

It refuses if the head moved or any check is not pass/skipping, marks a draft ready when `--ready` is given, squash-merges with `--match-head-commit`, strips co-author trailers and tool bylines from the squash body, confirms `MERGED`, and removes the worktree. Use another merge method only if the repo's rules say so.

Before calling it:

- Read the worker's final report, not just its one-line message.
- Compare the report's head with the local review state's head and round status.
- Check the PR body no longer carries a tool byline, and that lines the fixes made untrue were corrected. Grep it for the headings the person's rules require (such as Testing, Risk, How to revert); add missing ones from the worker's final report, whose deploy paragraph gives the risk and revert text.
- Once the worker's status line names a 5/5 `done` round on the pushed head, watch that CI run yourself (`gh run watch <id> --exit-status`) and merge the moment it is green. Do not wait for the final report while a factory session could still push.
- If the worker holds an unpushed commit for something separate (a flaky test), merge the green head anyway. Tell the worker to put the commit on a new branch from the base as its own PR, and not to push to the merged branch.

After it: delete the PR's inbox files, tell the person what merged and what was settled or left open, and tell any worker whose PR touches the same files that the base moved. Compare the merge's files with each remaining green PR's (`comm -12` of the two `--name-only` diffs). On overlap in generated or shared files, send that worker back to merge the base, regenerate, and run a round on the new head before you merge it: there may be no textual conflict.

## Factory-built PRs

On a repo the factory builds into, the issue's `factory:*` label says who owns the branch. Read it, and the run ledger, before starting a worker and before every merge step.

- **`factory:building`:** the factory is still building or gating. Do not start a worker; wait for `gate-passed` / `factory:pr-open`. Past two gate attempts on the same head, read the ledger's `gate_command` exit codes and the gate log, and name the failing test and the loop to the person straight away. A loop can run for hours without the issue going `stuck`.
- **`factory:pr-open`:** the factory re-claims the issue on a red check and pushes its own fix, which voids the 5/5. Brief workers to push once per round and run no builds while a factory gate runs. Stand the worker down the moment the label leaves `pr-open`.
- **The four conditions hold and only a factory re-gate is pending:** merge, or ask the person, right then. A loaded machine can time the gate out and send the PR back to draft. Merging closes the issue and ends the run.
- **`factory:stuck` with a done draft PR green in CI:** start a worker on it like any other PR, name CI as the record in the body, and merge with `--ready`.
- **Relabelled `factory:ready` while its PR is 5/5 and green:** merge at once (closing the issue stops the claim) and tell the person. Otherwise the factory rebuilds it from the base.
- **Re-readied mid-loop:** have the worker commit its fix locally and run the round on that unpushed sha; a round counts once that same sha is pushed. Push only after the factory's session has ended (`pr_opened` in its run record).
- **Factory commits outside the issue's files:** run the failing test on the base and on the factory's head before building on them. When the base is green, have the worker revert them with new commits, in the same push as its own fix.

## When the base goes red

One failing test on the base blocks every PR that runs that job. Recognise it early: the same test fails on the base's own latest build and on PRs that do not touch it.

1. Confirm on the base's build, not from a PR.
2. Start a separate worker to fix it in its own small PR. If an issue for it is already being built by someone else, that worker takes over the existing PR instead of opening a second.
3. Tell blocked workers to hold at their head and not rerun. PRs that skip the red job (frontend-only, infra-only) keep moving.
4. When the fix merges and the base's build is green, write "base is green, merge it in" to each blocked worker's answers file.

A failure that clears on rerun is a flake: note which test, file one issue for it the second time it bites, and put it in every later brief.

## Reporting to the person

Lead each update with what merged. Then, briefly: decisions made and on whose authority; anything the review did not cover (a spec CI never runs, native behaviour only a device can show, what the next deploy will change); things left for them (open questions in follow-ups, cleanup a permission prompt refused). Never say the tool approved a change: a 5/5 is advice, and merging on it is the person's standing instruction, not the tool's verdict.

## Scripts

- `scripts/tick.sh <PR...>`: one status block per PR plus all worker reports. Run from the repo.
- `scripts/merge.sh`: the guarded merge above. `--help` lists its flags.
