# Weight

Load when S/M/L is uncertain. Default **M**.

## S — mechanical

All of these hold:

- 1–2 files, or a generated/lockfile set
- No behavior change (formatter, typo, comment, dep bump, generated artifact)
- You could explain the whole change in one sentence
- Not auth, payments, schema, secrets, or prod

Examples: prettier on one file; `package-lock.json` bump; fix a typo in a comment.

Skip new tracker items unless a unit is already claimed.

## M — default, dark

Behavior change, one approach, bounded files. Create or claim one tracker unit unattended. Five-line chat contract, then act. Review↔Make cycle.

Examples: add a validation branch + test; fix a failing spec; wire an existing helper.

## L — factory lights

Any of:

- WHAT or HOW is a real product choice (user would weigh it)
- Auth, payments, schema/migrations, secrets, prod deploy
- Two+ independent file sets (**split**)
- "I don't know what to build"

**scope:** write `.dw/contract.md`, wait for go.
**split:** one REQ per disjoint file set.

## Borders

| Looks like | Is |
|---|---|
| One-line API change with callers | **M** (behavior) |
| Rename across 20 files, no behavior | **S** if purely mechanical identifiers; **M** if public API |
| "Add settings page" with no design | **L** + **scope** |
| Two packages, overlapping files | **M** serial, not split |
| Two packages, disjoint files | **L** + **split** |
| New endpoint + the one screen that calls it | **M**, one unit. Split only when each half can merge alone and leave the app working |

When in doubt: **M**. S that was M ships bugs. L that was M is the old factories.
