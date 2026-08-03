---
name: devils-advocate-loop
description: >
  Before committing to an architecture, interface, or rollout plan, run a critic
  that argues it is wrong, then force the builder to fix-or-accept each high-impact
  weakness with verification. Maintains a repository-local objection log at
  .agent-reviews/redteam.md. When the do-work skill is available, code fixes route
  through it (start then go auto-advanced); otherwise fix code in-session with
  real verification. Use when the user says "devil's advocate", "devils advocate
  loop", "red-team this design", "attack this architecture", "challenge this
  API/interface", "stress-test this rollout", "critic pass before we commit", or
  wants adversarial review of a design/plan with a durable repo log. Differentiator:
  iterative critic↔builder loop with reopen rights, optional do-work for code, and
  stop conditions — not a one-shot strategy red-team or launch pre-mortem.
---

# Devil's Advocate Loop

Adversarial critic ↔ builder loop that must complete **before** treating an
architecture, interface, or rollout plan as committed. Objections live in the
repo so later sessions can continue or audit the decision.

## Roles

Run both roles in the same session (separate turns or subagents). Do **not**
collapse critic and builder into one soft summary.

| Role | Job |
|------|-----|
| **Critic** | Argue the proposal is wrong. Prefer concrete failure modes over vibes. May reopen answers that lack evidence or verification. |
| **Builder** | Answer each high-impact objection: fix + verify, or document why accepted. Cannot dismiss high impact without evidence. |

Prefer independent subagents when available so the critic does not soft-pedal
and the builder does not strawman.

## Setup

1. Identify the **proposal** (paths, PRD section, interface draft, rollout plan, or pasted text).
2. Ensure directory `.agent-reviews/` exists at the **repo root**.
3. If `.agent-reviews/redteam.md` is missing, copy the starter from
   `assets/redteam-template.md` into that path and fill header fields.
4. If the log already exists, **append** a new session (do not wipe prior rounds).
5. Read the log format in `references/log-format.md` before writing entries.

## Loop

Repeat rounds until a stop condition hits.

### Round N — Critic

1. Read the proposal and the current log.
2. Produce objections that are **specific and falsifiable**. Attack the steelman,
   not a cartoon version of the plan.
3. Assign each objection:
   - **Impact:** `high` | `medium` | `low` (see rubric below)
   - **Status:** `open`
4. Append them to `.agent-reviews/redteam.md` under Round N.
5. Do not invent weaknesses the proposal does not have. If something holds, say so.

### Round N — Builder

For every **high** impact objection still `open` or `reopened`:

1. **Fix** — remove the weakness, **then verify**. Set status `fixed` →
   `verified` only after the check lands. Choose the right fix path:

   | Kind of fix | How |
   |-------------|-----|
   | **Design / docs / plan only** | Edit the proposal in-session. Encode an explicit constraint, plus a re-runnable verification plan (e.g. "contract test rejects `?key=`", "canary checklist item 3"). Re-read the updated design against the objection; cite section anchors as evidence. |
   | **Code** (implementation, tests, config that ships, migrations, anything that changes product behavior in the repo) | If the **do-work skill exists**, use it (see **Code fixes via do-work**). If it does **not**, fix in-session and re-run a real check (test, typecheck, repro script). |

2. **Or accept** — leave the design as-is and document: risk accepted, who owns
   it, residual impact, and why the trade is correct. Set status `accepted`.
3. Medium/low may be fixed, accepted, or deferred (`deferred`) with one-line rationale.
4. If a later fix supersedes an earlier `accepted` item, set status `verified`
   and note `supersedes <ID>` in evidence — do not invent new status labels.
5. Update the log in place (status, evidence, links to commits/sections/URs).

Unsupported, hand-wavy, or evidence-free answers stay **open**. The critic does
not owe the builder a rubber stamp.

### Code fixes via do-work (only if the skill exists)

**Detect once per session** (before the first code fix):

1. Treat do-work as **available** if the agent can load the `do-work` skill
   (`SKILL.md` resolvable from the skills hub / installed skills — e.g. name
   `do-work` present and readable).
2. If not available: **do not install, invent, or stall for do-work.** Fix code
   in-session; verify with a re-runnable check; note `path: in-session` in
   Evidence. Skip the rest of this section.
3. Never require the user to install do-work solely to finish a redteam round.

When available and a high-impact (or chosen medium/low) fix requires **code**,
invoke do-work and **auto-advance the full pipeline** without pausing for the
human between phases. Read the do-work skill (`SKILL.md` + phase agents it
points at) and execute it — do not reimplement TDD/commit/archive rules here.

**Hard rules (do-work path only)**

- No direct product-code edits under this skill for a "fix" while do-work is
  available. Design/docs/plan edits stay here; code is owned by do-work workers.
- One do-work UR per objection (or one UR that lists multiple objections only when
  they share a single coherent change). Put the redteam ID(s) in the brief.
- Mark the objection `fixed` when the UR is created and work is in flight; mark
  `verified` only after do-work run finishes with evidence (tests/review/archive)
  and the failure mode is gone.
- If do-work hard-stops or score stays below threshold after auto-fix, leave the
  objection `open` or `reopened` and record the blocker in Evidence — do not
  invent a verified status. Fall back to in-session fix only if the user asks, or
  if do-work is unusable mid-session and the skill cannot continue.

**Auto-advance sequence** (same session, no human gate between steps):

1. Ensure the target repo is a do-work project (`{project}/.do-work/` exists). If
   not, run do-work **install** first, then continue.
2. **Start** with a brief derived from the objection (steelman of the required
   fix, acceptance criteria, and redteam ID). Prefer non-interactive start:
   - Effective: `/do-work start <brief> --no-ideate`
   - If ideate runs anyway, choose **Continue** (never stop for grill unless the
     brief is empty or contradictory).
3. Note the created `UR-NNN`. Write it into the redteam builder row Evidence
   immediately (`do-work UR-NNN`).
4. **Go** without waiting for the user:
   - Effective: `/do-work go UR-NNN --auto-fix`
   - That is verify → (auto-fix gaps once) → audit → run → review/evidence →
     archive/ledger for that UR's REQs.
5. If still below threshold after one `--auto-fix` pass, run once more with
   `--force` only when the remaining gaps are process noise (missing soft REQs),
   not when acceptance criteria are still unclear. If criteria are unclear, stop
   and leave the objection open with the verify report linked.
6. On success: set status `verified`; Evidence must include `UR-NNN`, REQ ids or
   commit SHAs, and the check that falsifies the original objection.
7. On failure / budget / review stopper: status stays `open` or becomes
   `reopened`; Evidence = do-work status snippet + blocker; critic re-check may
   reopen or stalemate per normal rules.

**Brief template** (paste into do-work start):

```text
Redteam fix for <ID>: <one-line objection>
Source: .agent-reviews/redteam.md (session <title>, round N)
Required outcome: <what must be true in the product after this UR>
Acceptance:
- <falsifiable check 1>
- <falsifiable check 2>
Out of scope: design-doc-only wording; accept-risk paths already chosen for other IDs
```

Batching: if several high-impact code fixes are independent, prefer separate URs
(serial or parallel do-work runs). If they are one atomic change, one UR with
multiple REQs is fine — list every redteam ID in the brief.

### Round N — Critic re-check

1. Review builder responses for high-impact items.
2. **Reopen** (`reopened`) any answer that lacks verification, misreads the
   objection, or papers over the failure mode.
3. Add **new** objections only if new evidence or a design change introduced them.
4. If the same high-impact issues repeat with **no new evidence**, mark them
   `stalemate` and stop (see stop conditions).

## Impact rubric

| Impact | Use when |
|--------|----------|
| **high** | Data loss, security breach, irreversible migration pain, user-visible outage, broken contract for existing clients, compliance failure, or the plan's core bet fails. |
| **medium** | Painful but recoverable: significant rework, degraded UX, ops burden, delayed launch. |
| **low** | Polish, naming, optional niceties, edge cases with cheap escape hatches. |

When unsure between high and medium, choose **high**.

## Stop conditions

Stop when **either**:

1. **No high-impact objection remains** in `open` or `reopened`, **or**
2. **Stalemate:** the same high-impact issues repeat for **two consecutive
   rounds** with no new evidence and no material design change.

Do not loop forever. Cap at **5 rounds** unless the user extends; if still
unresolved, stop with an explicit stalemate summary.

## Finish output

Write the **Decision** section at the bottom of `.agent-reviews/redteam.md`
and surface the same content in the chat:

```markdown
## Decision

- **Outcome:** proceed | proceed-with-accepts | revise | blocked-stalemate
- **Proposal:** <one-line>
- **Resolved (verified fixes):** …
- **Accepted (conscious risk):** …
- **Stalemate / still open high-impact:** … (or none)
- **Evidence:** links to log rounds, tests, design sections, do-work URs/commits
- **Next step:** …
```

Also print a short chat recap: outcome, count of high-impact verified vs
accepted vs stalemate, and path to the log.

## Rules of engagement

- Log is source of truth: every objection and status change goes in
  `.agent-reviews/redteam.md` in the same turn it is decided.
- Critic argues the plan is **wrong** until evidence says otherwise — not
  "balanced feedback."
- Builder may not mark high-impact `accepted` without residual risk + owner.
- Builder may not mark `verified` without a check another engineer could re-run.
- **Code fixes via do-work when that skill exists**, auto-advanced (`start` →
  `go --auto-fix`). If do-work is missing, fix code in-session with a real check
  — do not block the loop waiting for do-work.
- No silent scope shrink: if the "fix" is really a smaller product, say so and
  re-attack the new shape.
- Do not confuse this skill with `strategy-red-team` (one-shot assumption
  attack) or `pre-mortem` (imagine launch already failed). This skill **closes
  the loop** and leaves a durable decision record.

## Optional: subagent prompts

When spawning roles, keep prompts minimal and point them at the proposal + log.

**Critic:** "Argue this proposal is wrong. Append high/medium/low objections to
`.agent-reviews/redteam.md`. Prefer high-impact, falsifiable failure modes.
Reopen unsupported builder answers. Do not soft-pedal."

**Builder:** "For each high-impact open/reopened objection in
`.agent-reviews/redteam.md`, fix and verify or document acceptance with owner
and residual risk. Design/docs/plan: edit in-session. Code: if do-work skill
exists, auto-advance `/do-work start <brief> --no-ideate` then `/do-work go
UR-NNN --auto-fix`; if not, fix in-session and re-run a real check. Update
statuses and evidence in the log (include UR-NNN / commits when using do-work)."
