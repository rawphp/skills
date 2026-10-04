# Tracker: do-work.io

Load only when `tracker.backend` is `do-work-io`.

Need `tracker.dowork.base_url` and `tracker.dowork.project`. Empty project slug → hard-stop. Empty `${token_env}` is OK if MCP tools work (PAT may live in the host).

**No MCP tools is not yet a hard-stop.** Run `capabilities auth status` first. If `logged_in=true` for the configured `base_url`, use the CLI for every op with the same DTO fields (`capabilities req claim --input=JSON --json`). CLI quirks: `req append-run-note` takes `payload` as an object; `req update --status` does not move status — use `req set-status`.

**Wire:** search underscore name first (`req_claim`), then dotted (`req.claim`). Use the observed qualified name. Always pass `project: {tracker.dowork.project}` except `project_ensure` (uses `slug`).

Product noun: **Issue**. Agent id: `<KEY>-NNN` with a per-project key, e.g. `DW-104` (param `issue`). Units: `REQ-NNN` (param `req`).

## Rediscover

Every op: `search_tool` wire name, then dotted id, or server `dowork.control`. `use_tool` only with that search's schema.

## Ops

| Op | Wire | Args |
|----|------|------|
| `ensure_product_container` | `project_ensure` | `{ slug, name? }` |
| `create_issue` | `issue_create` | `{ project, title, brief }` → `data.slug` |
| `read_issue` | `issue_get` | `{ project, issue }` |
| `create_req` | `req_create` | `{ project, issue, title, files? }` → `data.slug` |
| `set_acceptance_criteria` | `req_set-acceptance-criteria` | `{ project, req, items: [{ body, is_checked: false }] }` — at create; archive fallback below |
| `check_ac` | `ac_check` | `{ project, req, ac, checked, evidence? }` — `ac` is the item `id` from `read_req`; `evidence` ≤500, required to untick (the reason). It broadcasts, so the REQ page ticks live and prints the evidence |
| `read_req` | `req_get` | `{ project, req }` includes `active_claim` |
| `set_files` | `req_set-files` | `{ project, req, files }` |
| `set_blocked_by` | `req_set-blocked-by` | `{ project, req, depends_on }` |
| `list_claimable_reqs` | `req_list-claimable` | `{ project }` |
| `claim_req` | `req_claim` | `{ project, req, agent_id, session? }` — pass `session: $DOWORK_RUN` when that env var is set (a do-work.io terminal session), so the server links the session to this Issue |
| `heartbeat_req` | `req_heartbeat` | `{ project, req, step? }` — `step` ≤40; omitted or blank keeps the last. No second claim |
| `set_req_status` | `req_set-status` | `{ project, req, status }` backlog/in_progress/stopped/done |
| `archive_req` | `req_archive` | set `closure_proof` + `done` + every AC checked first; `{ project, req }` |
| `unblock_req` | `req_unblock` | `{ project, req }` |
| `append_run_note` | `req_append-run-note` | `{ project, payload, req?, issue? }` |
| `append_decision` | `decision_append` | `{ project, date, decision, rationale? }` |
| `list_reqs` | `req_list` | `{ project, issue }` → each REQ's `slug` and `status` |
| `raise_light` | `issue_light` | `{ project, issue, light, req?, prompt? }` — `light`: `scope` / `human` / `hard_stop` / `review_cap`; `null` clears. Notifies the owner once; same light again is a no-op |

`agent_id` = `$(hostname).$$` or the session id. Same id refreshes. Heartbeat at every step change and after every commit, plus the background loop (`tracker.md` § Heartbeat loop). The REQ page shows Stale after 900 s without a beat; do-work.io notifies the owner after 30 min. Errors starting `concurrent-conflict:` / `footprint-overlap:` / `not-claimable:` → stop.

The CLI caches schemas. If `capabilities describe req.heartbeat --no-cache` shows no `step`, the server predates it. Heartbeat without `step`, since the CLI validates locally and refuses unknown fields.

`check_ac` and `step` are best effort. A failed call in Make or Check never blocks. Note it and move on. Ship's fallback still ticks the proven ACs.

Archive gate: status `done`, non-empty `closure_proof`, and every AC checked. An empty AC list fails, and so does one unchecked AC (`unchecked acceptance criteria`). Make and Check already ticked what they proved (`tracker.md` § Acceptance criteria). At Ship, `read_req` first. If an older REQ has no ACs at all, seed them from `done:` with `req_set-acceptance-criteria`, items `{ "body": "…", "is_checked": true }` (any other shape fails and leaves the list empty). Then `check_ac` any AC still unticked that the diff proves, with evidence. An AC the diff cannot prove blocks the archive (`ship.md` § Archive).

**Fallback** when `ac_check` fails (`forbidden` for this PAT, or an older server): don't retry, don't hard-stop. Send the whole list back through `req_set-acceptance-criteria` with each item's `id` and `body` (ids survive). Add `is_checked: true` only on the ACs the diff proves; leave `is_checked` off the rest so the server keeps their state. Put each proven AC's evidence in `closure_proof`. Any AC still unticked blocks the archive (`ship.md` § Archive).

`Not authorized to invoke "ac.check"`, even on the control profile, means the PAT predates the capability: a scoped PAT keeps the capability list it was minted with. Use the fallback for this run, put each AC's evidence in `closure_proof`, and tell the user to mint a fresh `dowork.control` PAT.

MCP death after claim: leave claimed and stop the heartbeat loop (`tracker.md` § Heartbeat loop). `/dw` resume or unblock after MCP recovers. Never markdown.

## Hard-stop

```text
HARD STOP: do-work-io is configured but MCP/PAT/project is not usable.
No local REQ/Issue files were invented.
What failed: <MCP missing | unauthenticated | project slug missing | …>
Fix: export $token_env; set tracker.dowork.{base_url,project} in .dw/config.yml;
point MCP at {base_url}/mcp/{mcp_profile}; search_tool req_claim.
```
