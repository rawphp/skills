---
name: dw
description: >-
  Dark-factory work loop. Classify S/M/L, isolate in a worktree, implement
  with TDD, persona-review completed work, feed findings back into Make,
  open a PR, archive the tracker unit. Use for /dw, do-work, run the loop,
  ship this, implement from a brief. Differentiator: successor to Compound
  Engineering and the old do-work skill; remote tracker (do-work.io or Linear);
  native review cycle (max 5, user can interrupt).
---

# /dw

Default work loop. Dark: act unattended. Light: only for risk.

Always read `references/field-lessons.md` before acting if it has lessons.

Load config from `{repo}/.dw/config.yml`, else `{repo}/.do-work/config.yml`. Missing `tracker.backend` (`do-work-io` or `linear`) → hard-stop: `/dw-init`. Write new keys only to `.dw/config.yml`.

**Split commands (preferred):** `/dw-brief` creates the workset. `/dw-work` runs isolate → make → check → ship (PR). `/dw` with a raw brief does brief then work. `/dw` with a slug is work only.

```text
0 Recall → 1 Isolate → 2 Contract → 3 Make → 4 Check → 5 Ship → 6 Keep
```

Classify weight once (`references/weight.md` if uncertain). Default **M**. Then run every step. Load a reference only when that step starts. No unit yet → `references/brief.md` first (do not make), then continue as `/dw-work`.

| Step | Load |
|------|------|
| 0 Recall | `references/keep.md` (query) |
| 1 Isolate | `references/isolate.md` then `references/tracker.md` + backend file |
| 2 Contract | `references/contract.md`; no unit yet → `references/brief.md` (create workset, then Work) |
| 3 Make | `references/make.md` then `references/commits.md` (failing behavior → `references/debug.md`) |
| 4 Check | `references/check.md` then `references/review.md`; after a fix cycle, `references/commits.md` before the next review |
| 5 Ship | `references/ship.md` + `references/commits.md` + `references/receipt.md` |
| 6 Keep | `references/keep.md` |
| Models | `references/models.md` before Make and Check |

## Weight

| | S | M (default) | L |
|---|---|---|---|
| Shape | Mechanical, no behavior | Behavior, one approach | Unclear WHAT, auth/schema/payments, or 2+ units |
| Tracker | Skip new items unless already claimed | Create or claim one unit | **scope** and/or **split** |
| Check | Tests if needed | Review → fix (commit) → review, max 5 | Same; **review-deep** if asked |
| Ship | Commit; PR if already on a feature branch | Push existing commits + PR + archive | Same; **watch** if asked |

Forced L: auth, payments, schema/migrations, secrets, prod, "I don't know what to build."
Forced S: formatter, lockfile, typo, generated-only.

## Lights (off unless earned)

| Switch | On when |
|--------|---------|
| **scope** | WHAT/HOW is a real choice → `.dw/contract.md`, wait for go |
| **split** | Disjoint file sets → one REQ + worktree each |
| **review-deep** | User asked full/deep |
| **watch** | User asked, or this PR is the release |
| **visible** | cmux and split |
| **human** | Dirty tree, irreversible, two product options |
| **interrupt** | User says stop / enough / ship after a review report |

A light that stops dw to wait (**scope**, **human**, hard-stop, review cap) also goes to the tracker as `raise_light`, cleared on resume (`references/tracker.md` § Lights on the tracker). Heartbeat the claim at every step change and commit.

## Hard rules

- Never stash. Dirty primary checkout → **human**.
- Product-code writes in a worktree (`git-worktree` skill). Close it after the PR URL. Keep the branch.
- Never `git add -A`. Named files only.
- Commit as you go (`references/commits.md`). Make-green slices and each Check-fix cycle are their own commits. Do not wait for Ship. Do not squash those commits.
- One configured tracker. No dual-write. Down tracker → hard-stop, leave claimed.
- Maker does not grade M/L. Findings go back into Make until clean, 5 cycles, or interrupt.
- Brief is copied, not improved.
- Empty Keep (episode only) is success.

## Commands

| Command | Does |
|---------|------|
| `/dw-init` | Write `.dw/config.yml` |
| `/dw-brief` | Create Issue + REQ workset. Stop. |
| `/dw-work` | Isolate, make, check, PR, archive |
| `/dw` | Brief then work, or work if a slug is given |

## Output

Report: weight, lights, tracker slugs, PR URL or stop reason, review cycles, episode appended. Then `/quick-recap`.
