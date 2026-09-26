# Tracker: Linear

Load only when `tracker.backend` is `linear`.

Need a resolvable team (`tracker.linear.team_id` and/or `team_key`) and `product_project` (name or UUID; else `project.name`; else git-root basename). Every `status_map` name must exist on the team. Missing any of these → hard-stop.

**Hierarchy:** Issue (brief) = Project Milestone (`<!-- do-work-ur -->`). Unit = Linear issue id (`ENG-123`, `<!-- do-work-req -->`). Shared product Project, not one Project per Issue. Never steal a human assignee.

## Rediscover

Every op: `search_tool` scoped to Linear. `use_tool` only with the observed name + schema. Official MCP: `https://mcp.linear.app/mcp`.

## Markers

On create, include the HTML marker in the description. On read, missing marker → stop the op; do not invent headers.

## Claim / heartbeat

Claim: set workflow to `in_progress` (mapped) **and** a claim comment `<!-- do-work-claim -->` with `agent_id` + `heartbeat`. Fresh foreign claim → `concurrent-conflict`. Human assignee → do not steal; stop.

**Heartbeat patches in place.** When the claim comment id is known, update that comment's heartbeat. Do not post a second active claim comment unless update tools are missing.

Mid-flight MCP death: leave claimed.

## Archive

Evidence + Check clean → mapped `done` + `archive_req` sequence for this backend (close/done per team map). Release the claim comment (delete or mark inactive). Gate fail → leave in `done`/`in_progress` as Linear returned; do not markdown.

## Git

Branch `req/<sanitized-linear-id>`. Commit `feat(ENG-123):` with `Issue:` / `UR:` footer.

## Hard-stop

```text
HARD STOP: Linear is configured but Linear MCP is not usable.
No local REQ/Issue files were invented.
What failed: <MCP missing | team unresolved | status_map state missing | product_project …>
Fix: connect Linear MCP; set tracker.linear.team_id and product_project in .dw/config.yml;
status_map names must exist on the team. Then /dw resume or unblock if a claim was live.
```
