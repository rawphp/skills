# Keep

Load at step 0 (query) and step 6 (append).

## Query (step 0)

```bash
bash <skill-root>/scripts/log-episode.sh query "{repo}/.dw/log.jsonl" "<task text>"
```

Inject the top 3 hits into working memory. If `{repo}/.dw/learnings.md` exists, load matching bullets. No log → continue.

If the user named `UR-NNN` / `REQ-NNN` / `ENG-123`, `read_ur` / `read_req` that item (`references/tracker.md`).

## Append (step 6)

```bash
bash <skill-root>/scripts/log-episode.sh append "{repo}/.dw/log.jsonl" <<'EOF'
{"task":"","weight":"S|M|L","approach":"","outcome":"success|fail|partial|blocked","errors":"","resolution":"","sha":"","files":[],"lights":[],"review_cycles":0,"ur":"","req":""}
EOF
```

Then `append_run_note` on the unit when a tracker item existed.

Then **at most one** durable write:

| Gate | Sink |
|------|------|
| Improves the next `/dw` run | this skill's `references/field-lessons.md` (one gate + write test) |
| Product fact | project AGENTS / docs, short pointer |
| Recurring method | `{repo}/.dw/learnings.md` — cap 8, supersede stale bullets |
| Continuity | `handoff` chat only |
| Same task class succeeded 3 times in the log | **propose** a skill, do not create it |

Empty Keep (episode only) is success.

```bash
bash <skill-root>/scripts/log-episode.sh gc "{repo}/.dw/log.jsonl"
```

Unpinned episodes older than 90 days drop. Default gitignore `.dw/log.jsonl`.
