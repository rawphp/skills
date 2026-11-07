# Receipt

Write to a tempfile and pass `--body-file`. This is the change receipt.

```markdown
## Testing
- <how a reviewer sees it work: setup, command or click path, expected result>
- suite: `<command>` → pass

## Risk: <0-5>/5
<one line: what could break and who would notice>

## How to revert
- `git revert <merge sha>`
- <anything a revert does not undo: migration ran, data written, message sent, config or flag changed> | nothing else

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

## Testing, Risk, How to revert

Every pull request has these three sections, in this order, at the top.

- **Testing:** steps a reviewer can follow without reading the diff. Name the setup, the command or click path, and what they should see.
- **Risk:** one score from 0 to 5.
  - 0: no runtime effect (docs, comments, tests only).
  - 1: cosmetic or isolated. A failure would be obvious and harmless.
  - 2: an ordinary change in one area, covered by tests.
  - 3: shared code, several callers, or behaviour a user will notice.
  - 4: auth, money, data writes, a public API, or infra and config.
  - 5: cannot be taken back: a schema or data migration, a delete, a message sent outside.
- **How to revert:** the revert command, then every step a revert does not undo. If a revert is not enough on its own, say so.

Write it from the diff, not the plan: check every concrete name (route, queue, flag, table, command) against `git diff <base>..HEAD` before `gh pr create`.

No post-deploy monitoring section unless the user asked. No branding.
