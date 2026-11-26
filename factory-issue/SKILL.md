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
   - Watched: this Mac runs factory-runner (`factory-on-paradev`, LaunchAgent `io.github.original-solutions.factory-runner`). t3fac here was shut down on 2026-11-13, so `~/.config/t3fac/factory/` is stale. A repo is watched when it is in `repos:` of `~/.config/factory-runner/config.yml`, with a runner-only clone at `~/factory-runner/<owner>/<repo>` and a `.dw/config.yml` `factory` block on its default branch. Run records are `~/.config/factory-runner/runs/<owner>__<repo>__<issue>__N.jsonl`. Listed is not buildable: read the `target` lines of `node ~/.local/share/factory-runner/current/src/bin.ts status`. A host whose check fails takes no run (`hosts check <name>` prints why), `local` can be `0/0`, and cloud needs a per-repo environment; report a target that is down as the blocker. Adding a repo: `references/add-a-repo.md`.
   - Trilogy-Care repos are watched by the t3fac factory on `trilogy-mac`: `ssh tomk@trilogy-mac 'grep -A2 "repo:" ~/.config/t3fac/factory/config.yml'` lists each clone's `path` and `project_config`. Read that factory block over ssh, since it may live only in that clone, and run the login visibility and `workflow`-scope checks over ssh with that config's `gh_config_dir`. Before promising a build there, check claims are not paused (`ssh tomk@trilogy-mac 'cat ~/.config/t3fac/factory/claims-paused'` holds the pause time). One factory per repo. A repo no factory watches is never claimed.
   - Throughput: before promising a wide issue graph, read `max_concurrent_runs` and `max_concurrent_gates` in the watching factory's config. The slots and the merge pace set throughput, not the graph's width; say both in the plan.
   - Tracker: both factories read GitHub Issues only: open `references/github.md`.
   - Login (GitHub): any login in `factory.instructors`; the default login is fine and keeps the factory login's budget. Only an instructor's `factory:ready` starts a build. Before promising a build, check the factory's own login can see the repo: `GH_CONFIG_DIR=<gh_config_dir from the watching factory's config> gh repo view OWNER/REPO`. A private repo under a personal account is invisible to it. Check your own login can write before filing: `gh api repos/O/R --jq .permissions.push`. On a read-only repo `gh issue create` succeeds but `--label` fails "not found"; file with no label, and report that it carries none and no factory watches it.
   - Login (Linear): file as a Linear user whose display name is in `factory.instructors`; `references/linear.md` says how.

2. **Check it is not already filed or built.** Pull the default branch, then search the target repo's issues and pull requests, open and closed, for the change and for any class or file you will name: `gh issue list -R OWNER/REPO --state all --search "<term>"`, and the same with `gh pr list`. An open one: report it and what blocks its merge instead of filing. A shipped one ("fixed in X, still broken in Y"): read its `## Notes` and cite the shipped paths in the new body. For a batch of review findings, re-check each on the current default branch, file only the rest, and name the covering issue in the report. For a spec requirement marked missing, grep the code on base for the condition itself, not the spec's name for it; one an existing rule already meets is a spec fix, not an issue. A follow-up written against an open pull request can be stale within the hour: `git fetch` its branch and read its head and `git log origin/main..<branch>` right before drafting, and file only what is left.

3. **Title the issue `<type>: <outcome in one line>`** and give it the matching `type:<type>` label. Type is one of `feat` (new behaviour), `fix` (wrong behaviour made right), `refactor` (same behaviour, different code), `docs`, `test` (tests or walks only, no product change), or `chore` (dependencies, CI, syncs, config, lint). The pull request inherits the issue title, so the type carries to it. Settle both before `ready`: a title edit by a non-instructor after `ready` stops the build.

   **Write the body in the four headings.** `## Outcome`, `## Acceptance criteria`, `## Depends on`, `## Notes`, all four in every body: text after `None.` falls under `## Depends on`, and a `None` line must name no `#N`. Keep every `#N` but the blockers out of `## Depends on`; a merged PR ("#60, merged in PR #202") goes under `## Notes`. A brief's "depends on" list can name pull requests: `gh issue view` each number and block on the issue a PR closes. One change per issue. Each criterion is something a test, a command or a person can check. The session copies the body as its brief and does not improve it, and sees nothing else but its own repo on `base`; `references/drafting.md` lists what to check before writing criteria. An optional fifth heading, `## Base`, names the branch the work lands on when it is not `factory.base` (feature-branch groups): one plain branch name on its first line, and the branch must already exist on `origin`. A pull request merged into a feature branch does not close its issue, so a person closes it. When the user gave only a title, draft the criteria and show them before filing; do not invent a contract silently. Write the body to a file in the scratchpad, not the repo. Many linked issues at once: `references/bulk-filing.md`.

4. **Create the issue as `factory:proposed` plus its `type:<type>` label** with the tracker's commands in `references/<tracker>.md`, and capture its number (GitHub) or identifier such as `ENG-42` (Linear) from the output. No assignee: the factory refuses an assigned issue. Proposed first, so it cannot be claimed before its links exist.

5. **Link every dependency** named under `## Depends on`, in the tracker. One link per blocker, blocker already closed included: a GitHub "blocked by" relationship, or a Linear `blocks` relation from the blocker to this issue. A blocker clears when its issue is **closed** (GitHub) or **completed or canceled** (Linear), not when its pull request merges, so the blocker's PR must close it (`Closes #N`, `Closes ENG-42`) or a person closes it.
   - A blocker is an issue. To wait on an open pull request, block on the issue its body closes. For a pull request that closes no issue but edits the files this issue touches, a `## Notes` line alone lets the build collide with it: file a plain tracking issue with no `factory:*` label ("land or close #N"), block on it, and keep this issue at `factory:proposed` when the PR will change what the body asserts, so it gets re-grounded after the PR lands.
   - A link clears at close, so it cannot wait for anything after the merge (a release, a mirror push, a switch to another factory). Keep such an issue at `factory:proposed` with a Notes line naming the trigger, or give it a "stop needs-info if <thing> is missing" line.
   - Re-read each candidate blocker's own `blockedBy` immediately before the link, not from the list pulled at the start: parallel sessions re-chain siblings, and reversing a link later needs the owner's DELETE. Decide the direction once, on fresh data.
   - Before linking, list the open pull requests' changed files and block any issue that edits the same files on the issue that PR closes. Over many PRs, list numbers first and read each one's files over REST (`gh api --paginate repos/O/R/pulls/N/files?per_page=100 --jq ".[].filename"`, in the background); `gh pr list --json files` returns 502 when some PRs change thousands of files. For a change that moves or renames a shared file, also grep the PRs' added lines for imports of it (`gh pr diff N | grep '^+' | grep <file>`): the file lists miss a new importer. Skip the block only when the PR's hunks (`gh pr diff N -R OWNER/REPO`) sit apart from this change, such as an append at the tail; say so under `## Notes`. A needless block on a `factory:stuck` issue stalls the dependant. Chain issues that edit one file blocked-by each other, and by any `building` issue on that file, unless each body names its own anchor (`references/drafting.md`).

6. **Swap the label** to `factory:ready` to build now; leave `factory:proposed` to park it. Run the full verify (step 7) first: the factory claims and assigns the bottom issue within about a minute of the swap, so after it check labels only. Run the swap as its own command, never paired with a delete, a link or another write: the harness denies the whole line, and a link sent in parallel can fail while the swap lands. Try it once; if the harness refuses it as an external write, leave the issue proposed and give the user the one-line `gh issue edit` command to run with `!`. Do not edit the body after `ready` unless you are an instructor.

7. **Verify** the links and labels read back from the tracker, printing each dependant's open blockers. A blocker you expected open can merge while you draft: when one reads CLOSED, `git fetch`, grep base for its code, and reword the bodies from "waits for" to "on base" before the swap. Then report: issue URL, labels, blockers (numbers or identifiers, and open/closed), and the instructor login or display name used.

## Quick reference

| Situation | Do |
|---|---|
| Issue waits on another | Tracker link (step 5), **and** the reference under `## Depends on` |
| Sibling is related but should not wait | Name it under `## Notes`, never `## Depends on` |
| Several changes in one brief | Several issues; link the wiring issue to the unit it needs |
| Not sure the factory should build yet | `factory:proposed`, no `factory:ready` |
| Postponed on purpose | Keep `factory:proposed`, add a plain `postponed` label (create it if missing), and open `## Notes` with a bold "Postponed. Do not mark factory:ready" line and the trigger for un-parking it |
| Body needs a fix after `ready` | An instructor edits; anyone else's edit refuses or stops the build |
| Contract changes at `factory:pr-open` | Leave labels and the PR alone. Edit the body, then post one PR comment "rebuild to the rewritten #N" with the full new body in a four-backtick fence; an edit alone is not feedback. The comment reaches only a live run (`references/unblocking.md`) |
| Answering `factory:needs-info`, or rewriting a filed issue | `references/editing.md` |
| Unblocking `factory:stuck`, or a pull request whose run has finished | `references/unblocking.md`; `factory:ready` resumes an open PR or an unedited issue's pushed branch |
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
- `references/unblocking.md`: a `stuck` issue or a finished run, and whether to re-ready, hand-finish or wait.
- `references/bulk-filing.md` — many linked issues from one manifest.
- `references/add-a-repo.md` — putting a repo under factory-runner.
- The factory's own filing rules are `factory/site/agents/issue-contract.md` and `factory/site/guide/filing-work.md` in the t3code-factory repo (`~/EA/projects/t3code-factory`); this skill follows them.
