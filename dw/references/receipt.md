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

No post-deploy monitoring section unless the user asked. No branding.
