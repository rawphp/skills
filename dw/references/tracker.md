# Tracker

Load at Isolate after the worktree exists. Sole work-item store is remote.

## Load

1. Read `{repo}/.dw/config.yml`, else `{repo}/.do-work/config.yml`.
2. `tracker.backend` must be `do-work-io` or `linear`. Missing/empty/other → hard-stop. Do not invent a local board. Do not fall through to the other backend.
3. Load this file, then **one** backend: `tracker-dowork.md` or `tracker-linear.md`.
4. Rediscover tools every call. Never hard-code `dowork__…` or Linear tool names.

## Ops (subset)

`ensure_product_container`, `create_ur`, `read_ur`, `create_req`, `set_acceptance_criteria`, `read_req`, `set_files`, `set_blocked_by`, `list_claimable_reqs`, `claim_req`, `heartbeat_req`, `set_req_status`, `archive_req`, `unblock_req`, `append_run_note`, `append_decision`, `raise_light` (do-work.io only; other backends skip it).

No ideate, verify/close reports, milestones, migrate, markdown, sqlite.

## Claim

Optimistic re-read. `concurrent-conflict` / `footprint-overlap` / `not-claimable` → stop. Mid-flight death → **leave claimed**. While claimed, `heartbeat_req` at every step change and after every commit. The server treats silence as a dead run. Recover: **resume** (heartbeat, continue Make) or **unblock** (back to backlog). Never stash.

## Git naming

| Backend | Branch | Commit |
|---------|--------|--------|
| do-work.io | `req/REQ-NNN` | `feat(REQ-NNN):` / `fix(REQ-NNN):` + `REQ:` / `UR:` footer |
| Linear | `req/<sanitized-linear-id>` | `feat(ENG-123):` / `fix(ENG-123):` + `Issue:` / `UR:` footer |

## Dark vs create

- `/dw-brief` always creates the workset (`create_ur` + `create_req`). See `brief.md`.
- `/dw-work` never creates. Named slug → `claim_req` if claimable. Else first claimable REQ, else hard-stop.
- L **scope** lives in brief: wait for go, then create.
- S on `/dw-work` with no unit: still need a workset from brief, or skip tracker only when already on a claimed unit.

## Hard-stop

Unusable configured backend → stop. Template lives in the backend file. Never write `REQ-*.md` as a substitute.

## Lights on the tracker

When a light makes dw stop and wait for the user (**scope**, **human**, hard-stop, review cap at cycle 5), call `raise_light` with the light and a one-line `prompt` naming what dw needs. Pass `req` when a unit is claimed. When the user answers and dw resumes, call `raise_light` with `light: null` before the next step.

Best effort: no Issue yet (scope before `create_ur`), a down tracker, or a failed call → skip it and keep waiting in chat. Never block on it.
