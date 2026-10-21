---
name: factory-issue
description: 'Use when creating, filing or editing a GitHub or Linear issue (or any tracker ticket) that the software factory will build — "create an issue", "file a ticket", "make this a factory issue", "label it factory:ready", or when an issue says it depends on, is blocked by, or must wait for another. Covers which tracker the project uses, the issue shape the factory can build, and dependency links. Differentiator: filing side only; the factory skill is the build side.'
---

# Factory issue

The factory reads the tracker, not your prose. An issue is buildable when its text is a contract and its dependencies are tracker links. **On GitHub, every open `#N` or `owner/repo#N` under `## Depends on` also holds the claim back, link or not; a sibling that should not wait goes under `## Notes`.**

Always read `references/field-lessons.md` if it exists before acting.

## Steps

1. **Resolve the repo, the factory that watches it, and its tracker.**
   - Repo: where the files the brief names live, else the `origin` of the checkout you are in, or the one the user named. A factory names a repo by its own clone's `origin`; in a checkout with several remotes, file on the repo the watching factory lists, not the remote whose old `factory:*` labels look busy.
   - Watched: this Mac runs the t3fac factory (softfac is retired here, and `~/.config/softfac/config.yml` is gone). It watches a repo when a clone is a T3 project with a `.dw/config.yml` `factory` block; there is no repo list. Settings → Factory lists the watched repos. Trilogy-Care repos are watched by the other factory on `trilogy-mac`: `ssh tomk@trilogy-mac 'grep -A2 "repo:" ~/.config/softfac/config.yml'`, and read the factory block over ssh too, since it may live only in that clone. One factory per repo. A repo no factory watches is never claimed; adding one is the factory's add-a-repo guide.
   - Tracker: t3fac is GitHub Issues only: open `references/github.md`. A `trilogy-mac` entry with `tracker.kind: linear` is filed in that Linear team (`tracker.team`): open `references/linear.md`.
   - Login (GitHub): any login in `factory.instructors`; the default login is fine and keeps the factory login's budget. Only an instructor's `factory:ready` starts a build. Before promising a build, check the factory's own login can see the repo: `GH_CONFIG_DIR=<gh_config_dir from ~/.config/t3fac/factory/config.yml> gh repo view OWNER/REPO`. A private repo under a personal account is invisible to it.
   - Login (Linear): file as a Linear user whose display name is in `factory.instructors`; `references/linear.md` says how.

2. **Check it is not already filed or built.** Pull the default branch, then search the target repo's issues and pull requests, open and closed, for the change and for any class or file you will name: `gh issue list -R OWNER/REPO --state all --search "<term>"`, and the same with `gh pr list`. An open one: report it and what blocks its merge instead of filing. A shipped one ("fixed in X, still broken in Y"): read its `## Notes` and cite the shipped paths in the new body. For a batch of review findings, re-check each on the current default branch, file only the rest, and name the covering issue in the report.

3. **Write the body in the four headings.** `## Outcome`, `## Acceptance criteria`, `## Depends on`, `## Notes`, all four in every body: text after `None.` falls under `## Depends on`, and a `None` line must name no `#N`. One change per issue. Each criterion is something a test, a command or a person can check. The session copies the body as its brief and does not improve it, and sees nothing else but its own repo on `base`; `references/drafting.md` lists what to check before writing criteria. An optional fifth heading, `## Base`, names the branch the work lands on when it is not `factory.base` (feature-branch groups): one plain branch name on its first line, and the branch must already exist on `origin`. A pull request merged into a feature branch does not close its issue, so a person closes it. When the user gave only a title, draft the criteria and show them before filing; do not invent a contract silently. Write the body to a file in the scratchpad, not the repo. Many linked issues at once: `references/bulk-filing.md`.

4. **Create the issue as `factory:proposed`** with the tracker's commands in `references/<tracker>.md`, and capture its number (GitHub) or identifier such as `ENG-42` (Linear) from the output. No assignee: the factory refuses an assigned issue. Proposed first, so it cannot be claimed before its links exist.

5. **Link every dependency** named under `## Depends on`, in the tracker. One link per blocker, blocker already closed included: a GitHub "blocked by" relationship, or a Linear `blocks` relation from the blocker to this issue. A blocker clears when its issue is **closed** (GitHub) or **completed or canceled** (Linear), not when its pull request merges, so the blocker's PR must close it (`Closes #N`, `Closes ENG-42`) or a person closes it.
   - A blocker is an issue. To wait on an open pull request, block on the issue its body closes; a pull request that closes no issue goes under `## Notes`.
   - A link clears at close, so it cannot wait for anything after the merge (a release, a mirror push, a switch to another factory). Keep such an issue at `factory:proposed` with a Notes line naming the trigger, or give it a "stop needs-info if <thing> is missing" line.
   - Before linking, list the open pull requests' changed files (`gh pr view N -R OWNER/REPO --json files`) and block any issue that edits the same files on the issue that PR closes. Chain issues that edit one file blocked-by each other, and by any `building` issue on that file.

6. **Swap the label** to `factory:ready` to build now; leave `factory:proposed` to park it. Try the swap once; if the harness refuses it as an external write, leave the issue proposed and give the user the one-line `gh issue edit` command to run with `!`. Do not edit the body after `ready` unless you are an instructor.

7. **Verify** the links and labels read back from the tracker, then report: issue URL, labels, blockers (numbers or identifiers, and open/closed), and the instructor login or display name used.

## Quick reference

| Situation | Do |
|---|---|
| Issue waits on another | Tracker link (step 5), **and** the reference under `## Depends on` |
| Sibling is related but should not wait | Name it under `## Notes`, never `## Depends on` |
| Several changes in one brief | Several issues; link the wiring issue to the unit it needs |
| Not sure the factory should build yet | `factory:proposed`, no `factory:ready` |
| Postponed on purpose | Keep `factory:proposed`, add a plain `postponed` label (create it if missing), and open `## Notes` with a bold "Postponed. Do not mark factory:ready" line and the trigger for un-parking it |
| Body needs a fix after `ready` | An instructor edits; anyone else's edit refuses or stops the build |
| Contract changes at `factory:pr-open` | Leave labels and the PR alone. Edit the body, then post one PR comment "rebuild to the rewritten #N" with the full new body in a four-backtick fence; an edit alone is not feedback |
| Answering `factory:needs-info`, or rewriting a filed issue | `references/editing.md` |
| Blocker's PR merged but issue open | Close the issue, or the dependant waits forever |

## Common mistakes

- "Pairs with #12" under `## Depends on` → #12 blocks the claim. Put it under `## Notes`.
- Linking after `factory:ready` → the check runs at claim time only; a claim already made is not undone.
- Filing from a login that is not an instructor → refused back to `factory:proposed`.
- "Make it nicer" criteria → `factory:needs-info` in under a minute.

## References

- `references/github.md` — GitHub Issues: labels, create, dependency links (REST and GraphQL), sub-issues, verify.
- `references/linear.md` — Linear: which team, create through the `linear` skill, label, `blocks` relations, verify.
- `references/drafting.md` — what to check and settle before the criteria, so the issue does not bounce `needs-info`.
- `references/editing.md` — answering `needs-info`, rewriting or splitting a filed issue.
- `references/bulk-filing.md` — many linked issues from one manifest.
- The factory's own filing rules are `factory/site/agents/issue-contract.md` and `factory/site/guide/filing-work.md` in the t3code-factory repo (`~/EA/projects/t3code-factory`); this skill follows them.
