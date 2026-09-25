# Tracker: do-work.io

Load only when `tracker.backend` is `do-work-io`.

Need `tracker.dowork.base_url` and `tracker.dowork.project`. Empty project slug → hard-stop. Empty `${token_env}` is OK if MCP tools work (PAT may live in the host).

**No MCP tools is not yet a hard-stop.** Run `capabilities auth status` first. If `logged_in=true` for the configured `base_url`, use the CLI for every op with the same DTO fields (`capabilities req claim --input=JSON --json`). CLI quirks: `req append-run-note` takes `payload` as an object; `req update --status` does not move status — use `req set-status`.

**Wire:** search underscore name first (`req_claim`), then dotted (`req.claim`). Use the observed qualified name. Always pass `project: {tracker.dowork.project}` except `project_ensure` (uses `slug`).

Product noun: **Issue**. Agent id: `UR-NNN` (param `ur`). Units: `REQ-NNN` (param `req`). Never invent `issue.create`.

## Rediscover

Every op: `search_tool` wire name, then dotted id, or server `dowork.control`. `use_tool` only with that search's schema.

## Ops

| Op | Wire | Args |
|----|------|------|
| `ensure_product_container` | `project_ensure` | `{ slug, name? }` |
| `create_ur` | `ur_create` | `{ project, title, brief }` → `data.slug` |
| `read_ur` | `ur_get` | `{ project, ur }` |
| `create_req` | `req_create` | `{ project, ur, title, files? }` → `data.slug` |
| `set_acceptance_criteria` | `req_set-acceptance-criteria` | `{ project, req, items: [{ body, is_checked: false }] }` — at create; tick at archive |
| `read_req` | `req_get` | `{ project, req }` includes `active_claim` |
| `set_files` | `req_set-files` | `{ project, req, files }` |
| `set_blocked_by` | `req_set-blocked-by` | `{ project, req, depends_on }` |
| `list_claimable_reqs` | `req_list-claimable` | `{ project }` |
| `claim_req` | `req_claim` | `{ project, req, agent_id }` |
| `heartbeat_req` | `req_heartbeat` | `{ project, req }` — no second claim |
| `set_req_status` | `req_set-status` | `{ project, req, status }` backlog/in_progress/stopped/done |
| `archive_req` | `req_archive` | set `closure_proof` + `done` + checked AC first; `{ project, req }` |
| `unblock_req` | `req_unblock` | `{ project, req }` |
| `append_run_note` | `req_append-run-note` | `{ project, payload, req?, ur? }` |
| `append_decision` | `decision_append` | `{ project, date, decision, rationale? }` |

`agent_id` = `$(hostname).$$` or the session id. Same id refreshes. Errors starting `concurrent-conflict:` / `footprint-overlap:` / `not-claimable:` → stop.

Archive gate needs at least one checked acceptance criterion plus `criteria_approved`. Tick the criteria brief wrote (`is_checked: true`, re-sending the full list). If an older REQ has none, `req_set-acceptance-criteria` with items `{ "body": "…", "is_checked": true }` from `done:` (any other shape fails and leaves the list empty), then set `criteria_approved: true` via `req update`.

MCP death after claim: leave claimed. `/dw` resume or unblock after MCP recovers. Never markdown.

## Hard-stop

```text
HARD STOP: do-work-io is configured but MCP/PAT/project is not usable.
No local REQ/Issue files were invented.
What failed: <MCP missing | unauthenticated | project slug missing | …>
Fix: export $token_env; set tracker.dowork.{base_url,project} in .dw/config.yml;
point MCP at {base_url}/mcp/{mcp_profile}; search_tool req_claim.
```
