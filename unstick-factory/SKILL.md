---
name: unstick-factory
description: 'Clear a repo''s factory:stuck issues: group them by the reason the factory gave, salvage the work its t3/* branches already hold, and take each issue to an open pull request or a closed issue, N workers at a time, handing every PR to babysit-prs. Use for /unstick-factory, "unblock the stuck issues", "find all the stuck issues and fix them", "clear factory:stuck", or a /loop over stuck issues. Differentiator: orchestrates many stuck issues and stops at an open PR; factory-issue''s unblocking.md is the rule for one issue, babysit-prs takes PRs to merge.'
argument-hint: '[issue numbers | "all"] [--batch 5] [--repo OWNER/REPO]'
---

# Unstick factory

You are the lead. You find the stuck issues, work out why they are stuck, start one worker per issue, answer their questions, and hand each finished PR to the babysit-prs session. Workers do the building. Nobody here watches CI or merges.

**REQUIRED SUB-SKILLS:** `factory-issue` (its `references/unblocking.md` is the per-issue rule set; follow it, don't restate it), `babysit-prs` (takes every PR from open to merged), and `council` for decisions. Read `references/field-lessons.md` before starting.

## 1. Find and group

```bash
gh issue list -R O/R --label factory:stuck --state open --limit 300 --json number,title,updatedAt
```

For each issue, pull the factory's reason and the run's last event:

```bash
gh api repos/O/R/issues/N/comments --paginate -q '[.[]|select(.body|test("Reason:"))]|last|.body' | grep -m1 '^Reason:'
```

Read the stuck comment first: it often names the branch outright, and the prefix depends on the factory (`t3/*`, `superset/fac-<N>-<attempt>-<id>`, `fac/<N>-<attempt>`). The run record (`finished`: `outcome`, `reason`, `gate_attempts`, `pr_url`) lives on the machine that ran it. `factory-issue` step 1 says which machine and path. Group the issues by reason:

| Reason | What it usually means |
|---|---|
| `time-limit`, `gate_attempts: 0` | The session built most or all of it and ran out of time before the gate. Check its `t3/*` branch first (step 3). |
| `gate-retries-used-up` | The gate failed. Run the gate on `origin/main` before blaming the issue: the base may be red. |
| `session-stuck` / no FACTORY-DONE line | Read the session's last output in the stuck comment. Often a question or a machine fault. |
| 429 / credentials cooling down | Concurrency. `unblocking.md` covers it: re-ready one at a time, hours apart. |
| worktree or git timeout | Machine fault. Nothing in the issue is wrong. |

## 2. Report the shared cause before building

If most issues share one reason, that is the finding. Tell the person first, with the count and the setting behind it ("59 of 59 hit `limits.minutes: 90` with `gate_attempts: 0`; raising the limit stops new ones"). Hand-finishing clears today's queue. Only the config change stops tomorrow's. Don't change factory config or the repo's `.dw/config.yml` yourself: that needs its own issue or the person's yes.

## 3. Workers

One worker per issue, `--batch` at a time (default 5, or what the person said). Check `uptime` before each wave. Order newest first: newer bodies are grounded against a base closer to today's.

Write the brief once, from `references/worker-brief.md`, into a scratch file (`/tmp/unstick-<repo>/brief.md`), filling in the repo profile. Start each worker with a short prompt: "Read <brief> and follow it exactly. Your issue: #N (<title>)", plus anything issue-specific (an open PR it must stay clear of, a closed blocker to confirm on main, infra that must not touch AWS).

**Fix the brief, not the workers.** When a worker teaches you something (a branch named `t3/dummy`, a migration dated before main's), edit the brief file. Every later worker gets it for free. Message the running workers only if it changes what they are doing now.

Put issues that edit the same file, or where one blocks the other, on **one** worker in order, stacked when the second needs the first's code. Tell the worker which base each PR targets.

Each worker runs: salvage → triage → build → PR → relabel → clean up (details in the brief). Workers never watch CI and never push again once a PR is open.

Before starting a worker on an issue that has a branch or PR, check nobody holds it: `git worktree list | grep <branch>`, live processes in that worktree (`lsof +D <worktree>`), and unpushed commits there. A babysit-prs worker (`rl-pr<PR>` worktree) may be mid review loop even when the person says nobody is on it. To name the owning session, take a shell PID in the worktree, then its parent Claude PID, then that process's cwd (`lsof -a -p <pid> -d cwd`), and match it to a `ListAgents` row.

## 4. Hand off

As each PR opens, message the babysit-prs session. `ListAgents` shows peer sessions only by random worktree names, so at the start of the run ask the person which session it is, or to start `/babysit-prs`. Say, in one message per PR:

- PR number, issue number, base branch, stacked or not
- shared files with other open PRs, and merge-order traps (a ceiling test, a schema regen, a migration date)
- any "Decision before ready" still open in the issue body, so the merger raises it with the person before merging
- manual steps after merge (a stack deployed by hand)

Never post on a factory PR to hand it off. A comment there can relaunch the factory session.

## 5. Decisions

| A worker asks | You |
|---|---|
| Something the issue, a repo rule or the docs answer | Answer from that text. No council. |
| An operational call (one full local suite run, stack or not) | Decide it yourself, with the machine load in view. |
| A product or design choice the body leaves open | `council`, then act. Unattended or not, note it in the report so the person can reverse it. |
| Issue is too big | Take its proposed split and file the pieces with `factory-issue` as proposed. |

A "Decision before ready" note in a body the person has already marked `factory:ready` is treated as decided, and the PR is built. The caveat still goes to the merger and into your report.

## 6. Follow-ups

Keep a running list in the scratch dir: follow-up bugs workers found, flakes, stale `t3/*` branches safe to delete. At the end, file the follow-ups with `factory-issue`, as `factory:proposed` unless the person says ready (a factory still hitting the shared cause from step 2 will only add to the stuck pile). List the branches for the person, and don't delete them yourself.

## Reporting

After each handoff: one line, "#N → PR #M, handed to babysit-prs", plus any caveat. At the end, give:

- the counts (PRs opened, issues closed as already done, blocked, waiting on a decision)
- the shared cause and the config change that would stop it
- the open decisions that travelled with PRs
- follow-ups filed
- the leftover branches, and any cleanup a permission prompt refused
