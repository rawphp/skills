# Brief (create workset)

Load from `/dw-brief`, or from `/dw` before Work when no unit exists.

A **workset** is one Issue (brief) plus one or more REQs (units) on the configured tracker. Brief **creates** it. Work **runs** it. Do not implement here.

## Steps

1. Config: `{repo}/.dw/config.yml` else `{repo}/.do-work/config.yml`. Missing `tracker.backend` → hard-stop: run `/dw-init`.
2. Load `tracker.md` + backend file. `ensure_product_container`.
3. Query episodes (`keep.md`). Copy the user's brief. Do not improve it.
4. Contract (`contract.md`).
   - **scope** (WHAT/HOW is a real choice): write `{repo}/.dw/contract.md`, **stop until go**.
   - Else: five lines in chat (M) or one sentence (S), then create immediately.
5. `create_issue` with the verbatim brief as `brief` / title from the first line.
6. Units:
   - Default: one `create_req` titled from `done:`, `files` from the contract.
   - Every REQ gets acceptance criteria at creation (`set_acceptance_criteria`, unchecked): one observable item per part of `done:`, plus what `out:` keeps unchanged and a tests-green item. Never leave a REQ with none.
   - **split**: one REQ per disjoint file set. Same Issue. `set_files` on each. `set_blocked_by` only when one unit truly depends on another.
7. Stop. Report:

```text
Workset
Issue: …
REQ: …   (or Linear issue ids)
ACs: <count> per REQ
files: …
Next: /dw-work <REQ or Issue>
```

Do not claim, do not worktree, do not edit product files, do not open a PR.

## Resume later

`/dw-work <KEY>-NNN` (Issue) or `/dw-work REQ-NNN` (Linear: `ENG-123`).
