# Receipt

Write to a tempfile and pass `--body-file`. This is the change receipt.

```markdown
## Contract
- done: …
- out: …
- risk: …
- test: `<command>` → pass | skip (reason)

## Tracker
- backend: do-work-io | linear
- Issue: …
- REQ: …   # or Linear issue id

## Models
- maker: <id>
- checker: <id> | default (peer unavailable)

## Review
- cycles: n
- fixed: …
- leftovers: none | list (non-blockers only, or user-named)

## Commits
- `<sha>` `<subject>` — Make slice | Check cycle n | Ship leftover

## Files
- path — why
```

Write it from the diff, not the plan: check every concrete name (route, queue, flag, table, command) against `git diff <base>..HEAD` before `gh pr create`.

No post-deploy monitoring section unless the user asked. No branding.
