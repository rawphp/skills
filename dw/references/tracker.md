# Tracker

Load at Isolate after the worktree exists. Sole work-item store is remote.

## Load

1. Read `{repo}/.dw/config.yml`, else `{repo}/.do-work/config.yml`.
2. `tracker.backend` must be `do-work-io` or `linear`. Missing/empty/other → hard-stop. Do not invent a local board. Do not fall through to the other backend.
3. Load this file, then **one** backend: `tracker-dowork.md` or `tracker-linear.md`.
4. Rediscover tools every call. Never hard-code `dowork__…` or Linear tool names.

## Ops (subset)

`ensure_product_container`, `create_issue`, `read_issue`, `create_req`, `set_acceptance_criteria`, `read_req`, `set_files`, `set_blocked_by`, `list_claimable_reqs`, `claim_req`, `heartbeat_req`, `set_req_status`, `archive_req`, `unblock_req`, `append_run_note`, `append_decision`, `list_reqs`, `raise_light`, `check_ac` (the last two do-work.io only; other backends skip them).

No ideate, verify/close reports, milestones, migrate, markdown, sqlite.

## Claim

Optimistic re-read. `concurrent-conflict` / `footprint-overlap` / `not-claimable` → stop. Mid-flight death → **leave claimed**. While claimed, `heartbeat_req` at every step change (§ Step) and after every commit, and keep the heartbeat loop running (§ Heartbeat loop). The server treats silence as a dead run. Recover: **resume** (clear the light, restart the heartbeat loop, heartbeat with the step, continue Make) or **unblock** (back to backlog). Workers the dead session spawned died with it: on resume, re-dispatch any review whose report is missing, against the same tip. Never stash.

## Step

`heartbeat_req` carries dw's step, so the REQ page shows what the run is doing. Send the new step at every change:

| Step | When |
|------|------|
| `Isolate` | Right after `claim_req` |
| `Make` | Make starts |
| `Check r<N>` | Review wave N goes out |
| `Fix r<N>` | Wave N's findings go back to Make |
| `Ship` | Ship starts |
| `waiting on you` | A light that waits is raised (§ Lights on the tracker) |

Commit heartbeats may omit `step`. The server keeps the last one. Linear skips `step`.

## Acceptance criteria

Tick each AC the moment it is proven, not at archive (`check_ac`, do-work.io only; Linear skips it). AC ids come from `read_req`. Evidence ≤500 chars.

| Moment | `checked` | `evidence` |
|--------|-----------|------------|
| Make: the commit whose tests prove the AC lands (the slice-green commit) | `true` | `<test name or file::test> @ <short sha>` |
| Check: an AC with no test (docs, visual) is verified by the orchestrator | `true` | `screenshot <path>` or `verified <file:line>` |
| Check: a blocker/action finding shows a ticked AC is not met | `false` | `<finding id>: <one line>` |
| Make: the fix commit for that finding is green | `true` | new test @ new sha |
| Ship: an AC is still unticked and the diff proves it | `true` | as above |

The sha is the commit that made the test green.

## Heartbeat loop

do-work.io only. A long Make or review wave passes the 900 s stale line between step beats. Right after `claim_req`, start `scripts/heartbeat-loop.sh`. It beats every 300 s without `step` (the server keeps dw's) and exits within one interval once the owning session process dies, so a dead run still goes stale. A failed beat does not stop it.

```bash
pidf=<primary checkout>/.dw/heartbeat-<REQ>.pid
nohup bash <skill-root>/scripts/heartbeat-loop.sh <profile> <project> <REQ> <owner_pid> >/dev/null 2>&1 &
echo $! >"$pidf"
```

Stop it on every exit that leaves the session alive, or it keeps a unit fresh that nobody is working:

- after `archive_req`
- on `unblock_req`
- on `set_req_status stopped` (review cap, 3 strikes, user stop)
- when Ship will not archive (an AC it cannot prove)
- on hard-stop after claim (tracker or MCP down)
- on an interrupt that leaves the unit claimed
- before starting another for the same REQ (resume)

Resume restarts it. Each exit site points here.

```bash
bash <skill-root>/scripts/heartbeat-loop.sh stop "$pidf"
```

`stop` kills only a `heartbeat-loop.sh` process, so a stale pid file spares whatever now holds that pid. It removes the pid file.

- `<owner_pid>`: the agent session process. Claude Code: `$PPID` in the Bash tool's shell (the `claude` process). Other hosts: the host's own pid if known, else the pid of a shell that lives as long as the session. A per-command shell dies at once and takes the loop with it.
- `<profile>`: the `capabilities` profile that `auth status` shows logged in for `base_url` (usually `default`). No CLI login → skip the loop; step beats carry the claim.
- Keep the pid file in the primary checkout's `.dw/`, because Ship removes the worktree before `archive_req`. Gitignore `.dw/heartbeat-*.pid` like `.dw/log.jsonl`.

## Git naming

| Backend | Branch | Commit |
|---------|--------|--------|
| do-work.io | `req/REQ-NNN` | `feat(REQ-NNN):` / `fix(REQ-NNN):` + `REQ:` / `Issue:` footer |
| Linear | `req/<sanitized-linear-id>` | `feat(ENG-123):` / `fix(ENG-123):` + `Issue:` footer |

## Dark vs create

- `/dw-brief` always creates the workset (`create_issue` + `create_req`). See `brief.md`.
- `/dw-work` never creates. Named REQ (`REQ-NNN`, Linear `ENG-123`) → `claim_req` if claimable. Named Issue (`<KEY>-NNN`) → its first claimable REQ. Nothing named → first claimable REQ, else hard-stop.
- L **scope** lives in brief: wait for go, then create.
- S on `/dw-work` with no unit: still need a workset from brief, or skip tracker only when already on a claimed unit.

## Hard-stop

Unusable configured backend → stop. After claim, stop the heartbeat loop (§ Heartbeat loop). Template lives in the backend file. Never write `REQ-*.md` as a substitute.

## Lights on the tracker

When a light makes dw stop and wait for the user (**scope**, **human**, hard-stop, review cap at cycle 5), call `raise_light` with the light and a one-line `prompt` naming what dw needs. Pass `req` when a unit is claimed. Then `heartbeat_req` with `step: "waiting on you"`.

Clear it with `raise_light` `light: null` when the user answers and dw resumes, on every claim or resume of a unit (including a fresh `/dw-work REQ-NNN` in a new session), and after every `archive_req`: a light left on silences the stall alarm for the whole Issue and leaves an unread notification. Then `heartbeat_req` with the step dw resumes into if a unit is claimed, before the next step, or a long wait reads as a dead run.

The server keeps one light per Issue and a clear is Issue-wide. Before any clear, `list_reqs` for the Issue and clear only when no **other** REQ is `in_progress` or `stopped`. A waiting sibling owns the light and clears it on its own resume.

Best effort: no Issue yet (scope before `create_issue`), a down tracker, or a failed call → skip it and keep waiting in chat. Never block on it.
