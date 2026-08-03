# `.agent-reviews/redteam.md` format

Repository-local log. One file per repo (append sessions; do not delete history).

## Status values

| Status | Meaning |
|--------|---------|
| `open` | Raised; not yet addressed |
| `fixed` | Design/code changed; verification not yet done |
| `verified` | Fix landed and check re-run successfully |
| `accepted` | Consciously kept; residual risk documented |
| `deferred` | Medium/low only; postponed with reason |
| `reopened` | Critic rejected the answer; needs new fix or better evidence |
| `stalemate` | Same high-impact issue two rounds, no new evidence |

## Impact values

`high` | `medium` | `low` — see SKILL.md rubric.

## Session structure

```markdown
# Devil's Advocate Log

## Session: <ISO-date> — <short title>
- **Proposal:** <path or one-line summary>
- **Owner:** <who requested / who decides accepts>
- **Started:** <ISO datetime>

### Round 1 — Critic

| ID | Objection | Impact | Status | Notes |
|----|-----------|--------|--------|-------|
| R1-01 | … | high | open | … |
| R1-02 | … | medium | open | … |

### Round 1 — Builder

| ID | Response | Status | Evidence |
|----|----------|--------|----------|
| R1-01 | Fixed by … | verified | test X / section Y |
| R1-02 | Accept because …; residual …; owner … | accepted | ADR / comment |

### Round 1 — Critic re-check

- Reopened: …
- New objections: none | see R2-…
- Same issues without new evidence: none | …

### Round 2 — …

## Decision

- **Outcome:** proceed | proceed-with-accepts | revise | blocked-stalemate
- **Proposal:** …
- **Resolved (verified fixes):** …
- **Accepted (conscious risk):** …
- **Stalemate / still open high-impact:** …
- **Evidence:** …
- **Next step:** …
```

## ID scheme

`R{round}-{nn}` — e.g. `R1-01`, `R2-03`. Keep IDs stable when reopening; do not renumber.

## Evidence bar

- **verified (code, do-work available):** route through do-work. Evidence includes
  `UR-NNN`, REQ ids and/or commit SHAs, and the check that falsifies the
  objection (command, test file, manual repro). Status `fixed` while the UR is
  in flight; `verified` only after do-work run completes with passable
  evidence/review.
- **verified (code, do-work missing):** in-session fix allowed. Evidence names the
  check (command, test file, manual repro) and notes `path: in-session`.
- **verified (design-only):** cite the updated design section that encodes the
  constraint, plus the re-runnable check that will enforce it later.
- **accepted:** residual impact, owner, and why the trade is correct — one paragraph max.
- **supersession:** if an `accepted` item is later fixed, change status to
  `verified` and write `supersedes <ID>` in Evidence (keep the original ID row).
- Vague "we'll be careful" is not evidence; leave `open` or set `reopened`.
- When do-work is available, product-code edits outside do-work are not valid
  evidence for a code fix. When it is missing, in-session fixes with a real check
  are valid.

## Append-only sessions

New work on a related proposal → new `## Session:` block under the same file.
Unrelated proposals in the same monorepo may share the file; title the session clearly.
