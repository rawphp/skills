---
name: factory-issue
description: 'Use when creating, filing or editing a GitHub issue (or any tracker ticket) that the software factory will build — "create an issue", "file a ticket", "make this a factory issue", "label it factory:ready", or when an issue says it depends on, is blocked by, or must wait for another. Covers which tracker the project uses, the issue shape the factory can build, and dependency links. Differentiator: filing side only; the factory skill is the build side.'
---

# Factory issue

The factory reads the tracker, not your prose. An issue is buildable when its text is a contract and its dependencies are tracker links. **Text under `## Depends on` is for people; only a link holds a claim back.**

Always read `references/field-lessons.md` if it exists before acting.

## Steps

1. **Resolve the repo and its tracker.**
   - Repo: the `origin` of the checkout you are in, or the one the user named.
   - Tracker: read `{repo}/.dw/config.yml`. A `factory` block with no `tracker.backend` means **GitHub Issues at `origin`**. A `tracker.backend` value names another tracker: open `references/<backend>.md`; when that file does not exist, stop and say the tracker is not supported here. Today only `references/github.md` exists.
   - Login: if `~/.config/softfac/config.yml` exists on this machine, file as the factory's login (`GH_CONFIG_DIR=<its gh_config_dir>` on every command, including the login check); otherwise as the default login. That login must be in `factory.instructors`. Only an instructor's `factory:ready` starts a build.
   - If `~/.config/softfac/config.yml` exists, confirm the repo is in its `repos`; a repo the factory does not watch is never claimed.

2. **Write the body in the four headings.** `## Outcome`, `## Acceptance criteria`, `## Depends on`, `## Notes`. One change per issue. Each criterion is something a test, a command or a person can check. The session copies the body as its brief and does not improve it. Write `None.` under `## Depends on` when there is nothing. When the user gave only a title, draft the criteria and show them before filing; do not invent a contract silently. Write the body to a file in the scratchpad, not the repo.

3. **Create the issue as `factory:proposed`** with the tracker's commands in `references/<tracker>.md`, and capture its number from the output. Proposed first, so it cannot be claimed before its links exist.

4. **Link every dependency** named under `## Depends on`, in the tracker. One link per blocker, blocker already closed included. A blocker clears when its issue is **closed**, not when its pull request merges, so the blocker's PR must close it (`Closes #N`) or a person closes it.

5. **Swap the label** to `factory:ready` to build now; leave `factory:proposed` to park it. Do not edit the body after `ready` unless you are an instructor.

6. **Verify** the links and labels read back from the tracker, then report: issue URL, labels, blockers (numbers and open/closed), and the instructor login used.

## Quick reference

| Situation | Do |
|---|---|
| Issue waits on another | Tracker link (step 4), **and** prose under `## Depends on` |
| Several changes in one brief | Several issues; link the wiring issue to the unit it needs |
| Not sure the factory should build yet | `factory:proposed`, no `factory:ready` |
| Body needs a fix after `ready` | An instructor edits; anyone else's edit refuses or stops the build |
| Blocker's PR merged but issue open | Close the issue, or the dependant waits forever |

## Common mistakes

- `## Depends on #12` with no link → the issue is claimed, the session reads the prose, stops, and the issue goes `factory:stuck`. A run wasted.
- Linking after `factory:ready` → the check runs at claim time only; a claim already made is not undone.
- Filing from a login that is not an instructor → refused back to `factory:proposed`.
- "Make it nicer" criteria → `factory:needs-info` in under a minute.

## References

- `references/github.md` — GitHub Issues: create, label, dependency links (REST and GraphQL), verify.
- The factory's own filing guide is `docs/issues.md` in the softfac repo; this skill follows it.
