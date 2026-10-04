---
name: branch-ship-loop
description: 'Make a branch ship-ready by looping code-review and release-safe until both pass, fixing findings on the branch. Use for "make this branch shippable", pre-merge gate, review-and-release-safe, or /branch-ship-loop. Differentiator: fix loops on the branch, not observe-only review or product launch audit.'

---

# Branch ship loop

Get the **current branch** (or a named branch) to a shippable bar:

1. **Code review** → fix findings → re-review until **Approve**
2. **Release-safe** → fix open issues → re-gate until **Approved**

Do not stop after a single pass. Do not ship a half-fixed branch.

## Related skills (compose — do not re-implement)

| Skill | Role here |
|-------|-----------|
| `code-review` | Maintainability / structure gate (depth light \| medium \| deep) |
| `release-safe` | Compatibility / breaking-change / ship-risk gate (read-only method) |
| `do-work` | Full work cycle for **non-simple** fixes: Intake → Ideate → Capture, then serial TDD on the review branch |
| **this skill** | Orchestrates gates, classifies fix complexity, applies simple fixes, dispatches do-work for the rest |

Load full instructions when each phase starts:

```text
code-review → ~/.agents/skills/code-review/SKILL.md (or ~/EA/skills/code-review)
release-safe → ~/.agents/skills/release-safe/SKILL.md (or ~/EA/skills/release-safe)
do-work     → ~/.agents/skills/do-work/SKILL.md (hub may point at ~/EA/projects/do-work)
```

**Always read** [references/field-lessons.md](references/field-lessons.md) before acting when it has pending lessons. Append only skill-**process** that passes the global one gate + write test (re-assert branch, tip-relative findings, path-filtered commit, classify/do-work invoke defaults) — not product/stack fix cookbooks. **Transferable ≠ skill-process.**

## Hard rules

1. **Stay on the branch under review.** Default: current `HEAD` branch. Override only if the user names a branch; check it out only if clean or the user confirmed discarding/moving WIP.
2. **Re-assert branch on the critical path.** Before A3/B3 edits and before the completion commit: `git rev-parse --abbrev-ref HEAD` must match the branch under review. Preconditions are not sticky — parallel agents/worktrees can switch a shared checkout. If drifted: `git checkout <review-branch>` only if clean, else stop and report. Immediately before each A3/B3 edit, `git status` + `git diff` the finding paths. If the tree already contains the intended shrink/delete, keep it and only fill gaps. Do not revert aligned concurrent work.
3. **Finding classification is tip-relative.** On long/deep passes, before do-work Intake: re-check open finding paths on **current HEAD** (and tracker Done). If the work already landed, re-run the gate phase — do not invent a second UR. A prior READY/Approve on this branch is not evidence a cutover is done — re-check every helper/call-site of the old flag/contract before Approve. If cited paths still match a residual named on a closed Issue and the production join is unchanged, keep it residual — do not Intake. Re-open only when a helper or call-site of that law changed after the residual was written.
4. **Target = branch vs default base** (`origin/main` / `main` / `origin/master`). Same base as `code-review` and `release-safe`.
5. **Review/gate first, then fix.** Never "fix while reviewing." Emit the full phase report, then fix open items, then re-run the phase.
6. **Only fix findings from that phase.** No drive-by refactors, no feature work, no unrelated cleanups.
7. **Simple vs non-simple (mandatory).** Classify every open finding/issue before editing. Simple → fix inline. **Not simple → must run the full do-work cycle** (see [Non-simple fixes via do-work](#non-simple-fixes-via-do-work)). Never half-do a hard fix ad-hoc "to save time."
8. **Preserve behavior** for code-review fixes unless a release-safe issue requires a deliberate contract restore (then document it).
9. **No force-push, no merge, no deploy.** Do not push or open a PR unless the user asked. When do-work runs, **its** commit/worktree conventions apply (one commit per REQ, etc.). For simple inline fixes and any other uncommitted work this loop produced, **commit at run completion** (see [Completion commit](#completion-commit)). On a **hot integration tip** receiving parallel merges, commit simple fixes as soon as they are green — do not wait only for the end completion commit (re-diff HEAD after each merge).
10. **Cap loops.** Default **max 3 rounds** per phase. If still failing after 3, stop with a blocked report (do not thrash).
11. **Unfixable = stop and report.** Needs product decision, missing credentials, secrets already published, intentional break the user wants to keep without docs — list it; do not invent policy.
12. **Commit on completion when this loop fixed anything.** If review/gate found issues and this run applied fixes (simple inline and/or leftover uncommitted deltas after do-work), end the run with a git commit of those changes. Do not leave ship-loop fixes uncommitted for the user. Completion commit is **path-filtered** — never “everything currently staged.”

## Preconditions

```bash
git rev-parse --is-inside-work-tree
git rev-parse --abbrev-ref HEAD
git status --porcelain
# base (prefer origin/main, else main, else origin/master)
git merge-base HEAD origin/main 2>/dev/null || git merge-base HEAD main 2>/dev/null || true
git log --oneline "$(git merge-base HEAD origin/main 2>/dev/null || git merge-base HEAD main)..HEAD" | head -20
git diff --stat "$(git merge-base HEAD origin/main 2>/dev/null || git merge-base HEAD main)..HEAD"
```

| State | Action |
|-------|--------|
| Not a git repo | Stop |
| Empty diff vs base | Report clean; skip both phases or note nothing to gate |
| Dirty tree with unrelated WIP | Prefer fixing only branch-related paths; never clobber foreign WIP. Ask once if ambiguous |
| Detached HEAD | Ask to name a branch or create one before continuing |
| `do-work` skill missing when a non-simple fix is needed | Stop; install/wire do-work into the hub before continuing |

State at the top of every user-facing report:

```text
Branch: <name>
Base: <base-ref>
Depth (code-review): <light|medium|deep>   # default medium
```

Depth: user `light` / `medium` / `deep` (or synonyms from `code-review`); else **medium**.

---

## Fix classification (before any edit)

For each open finding (Phase A) or open Issue (Phase B), label **simple** or **non-simple**. When mixed, fix all simple items first (one batch), then run **one do-work cycle per non-simple item** (or one UR that groups tightly related non-simple items that share one design).

### Simple (inline fix allowed)

All of the following must hold:

- Fix is **local and obvious** — roughly one small edit surface (often one file, or a few mechanical touch points)
- **No new abstraction**, redesign, or multi-module ownership change
- Behavior/contract intent is already clear from the gate (e.g. add CHANGELOG bullets, restore a renamed export alias, delete a committed secret string, fix a typo in a public message, add a missing upgrade note)
- You could explain the entire fix in **one short paragraph** without design options

Examples that stay simple: CHANGELOG/upgrade-note fill-in; document a named 0.x break; one-line signature restore; env example key rename; remove accidental `.env` content from a tracked file; tiny pure rename with mechanical call-site updates already listed; dual-surface lag when the domain authority already owns the behavior (project a chip, pass actor, wire-or-delete dead helper); incomplete-cutover leftovers (dead exports, twin types, leftover 1-object helpers); allowlist a call-site classifier instead of extracting a mini-parser.

### Classification speed (portable)

| Finding class | Usually |
|---------------|---------|
| Missing CHANGELOG / one-line restore / sticky flag / display regression / executable-bit probe | **simple** |
| Duplicated presentational chrome with existing view tests as AC | **simple** — extract the wrapper inline. Do not Intake |
| Dual-surface or incomplete cutover when domain/store already owns the behavior | **simple** — add only missing tokens to existing copies, or delete dead wire. Do not invent a new process/worker/binary |
| Type landed outside a plan-named package | **simple** — move type + tests + call-sites. New package design or import-cycle = **non-simple** |
| Restricted-role / capability DENY | **simple** — inventory every mutation and sibling of that class (not sample list/show GETs); wrap + matrix + inventory test |
| Test-file call-site classifier (300+ line brace scanner) | **simple** — file allowlist + forbid elsewhere; do not extract the parser |
| Review judo that would add or remove listeners on an existing event | **residual** — do not open do-work |
| Peer-package vendor/dep patch locked by tests on the consuming branch | **residual** — do not Intake; do not block READY. Fix the peer, then bump |
| Sibling verbs a first slice does not call yet | **residual** — do not Intake "finish the protocol". Write-without-read of an existing helper is incomplete cutover (simple, wire-or-delete), not residual |
| User-named upcoming-churn spec (its Files table + named wire/copy) | **residual** — do not A3 or Intake those paths. Gate the remainder. READY this pass does not ship-clear the deferred spec |
| New pure module + tests + multi-handler rewire of a status/lifecycle machine | **non-simple** (do-work) |
| Auth, schema, dual-write, multi-approach API restore | **non-simple** |

### Non-simple (do-work required)

Any of the following → **non-simple**:

- Structural / maintainability work the review blocked on (decompose file, untangle spaghetti, re-layer, real code-judo)
- API/wire restore or dual-support that needs a design choice (deprecation window vs hard restore, dual-write shape, adapter boundary)
- Migrations, schema, durable state, jobs/queues, auth semantics
- Multi-file behavior change with non-obvious acceptance criteria
- Ambiguous product impact or more than one plausible approach
- Would need tests designed/rewritten as part of proving the fix
- You are unsure which approach is correct

**When in doubt → non-simple.** Prefer do-work over a clever ad-hoc patch.

### After a structural extract (re-review)

Approve when previously untested branch soup is gone into a pure unit-tested module and visible regressions are fixed. Do **not** re-block on “component still multi-duty” if side-effect glue is thin (bind / arm timer / dispatch only).

---

## Non-simple fixes via do-work

For each non-simple item (or tightly related cluster), run the **entire** do-work cycle. Do **not** skip Ideate. Do **not** invent a shortcut.

### Required cycle (in order)

1. **Intake** — record the brief as the next UR (`/do-work intake` / agents/intake.md)
2. **Ideate** — assumptions, risks, connections + ideate gate (`/do-work ideate` / agents/ideate.md). Honor Grill / Continue / Stop. **Stop** ends this item; report and do not Capture.
3. **Capture, then serial TDD on the review branch** — decompose into REQs (`/do-work capture` / agents/capture.md), then serial in-session TDD and the REQ commit on the branch under review. Do not run go Stage B merge onto the integration base. Prefer mechanical coverage fills in-session so the loop does not stall on nits that capture should own.

Equivalent orchestrators (same full cycle, still **must** include ideate):

```text
/do-work start <brief>     # intake + ideate + capture (default includes ideate — never pass --no-ideate from this skill)
# then serial in-session TDD + REQ commit on the review branch — not /do-work go Stage B merge
```

If using `start`, that covers Intake → Ideate → Capture. **Never** pass `--no-ideate` from branch-ship-loop. **Never** run go Stage B merge onto the integration base from this skill.

### How to invoke

1. Read `do-work/SKILL.md` fully, then the phase agent files as that skill requires (`agents/intake.md`, `ideate.md`, `capture.md`, `go.md` / start+go).
2. Ensure the project has do-work installed/conforming (`/do-work install` or conformance path as do-work specifies) before Intake if `.do-work/` is missing.
3. **Before Intake:** re-verify the finding against live HEAD and tracker Done (tip-relative). Prefer resuming an open REQ under a standing UR over a new milestone when that id already owns the work. List in-progress and done-unarchived claims whose Files overlap the finding paths. Live heartbeat → do not Intake, do not `unblock`. Report NOT READY with the occupying REQ id. Resume after that claim archives.
4. Build a **verbatim-quality brief** from the gate finding(s). The brief must include:
   - Source: `code-review` or `release-safe`
   - Branch + base
   - Finding/issue text (severity, client impact, mitigation missing)
   - Hard constraints: preserve required behavior unless the issue is an intentional contract restore; stay on this branch; no drive-by scope
   - Definition of done: re-running the originating gate phase must clear this item
5. Run the three steps in order (or `start`, then serial TDD on the review branch — not `go` Stage B merge).
6. After do-work finishes (or stops), return here and **re-run the originating phase** (A1 or B1). Do not claim READY without re-gate.

### do-work defaults under ship-loop

- Ideate gate: ship-loop intent is usually **Continue** (fix until gates pass), not Grill — still run ideate observations into the UR.
- After Capture on the named review branch: **serial in-session TDD and the REQ commit on that branch**. Do not run go Stage B merge onto the integration base. Size/S pure extracts (≈2–3 files) stay in-session; do not fan out to worktrees.
- One small pure-extraction REQ with explicit AC (“transitions unit-tested; SFC/host only dispatches”) closes deep structural findings faster than multi-REQ decomposition.
- If a **next-phase UR** already claims the same paths (`working/` / Files), open a **new UR** for the ship-loop extract — do not steal claimed files or `unblock` to take them. Ship-loop structural extract ≠ resume the next-phase UR.
- **Tracker backend owns work-item ids.** Use the returned remote slug for go/claim/archive. Never dual-write local `.do-work/user-requests/` as the store when the project backend is remote (e.g. do-work-io greenfield restarting at UR-001). Commit messages use the remote REQ id; product commits still stay on the review branch.

### do-work failure / halt

| Outcome | Action |
|---------|--------|
| Ideate **Stop** | Leave item open; report; do not Capture; do not invent an inline fix for it |
| Verify score too low and go did not run | Report gaps; optional `go --auto-fix` / `--force` only if the user asked |
| Worker/run blocked | Report UR/REQ ids + blocker; do not bypass with ad-hoc edits |
| do-work skill/Linear hard-stop | Surface setup instructions; **NOT READY** |

---

## Phase A — Code review + fix

### A1. Review

1. Read `code-review/SKILL.md` fully.
2. Run that skill's process on **this branch vs base** at the resolved depth. If `git diff --stat` is presentational-only (class tokens, scoped CSS) and ≤3 files, emit A1 from the orchestrator HEAD walk — do not spawn. Deep still applies the deep bar; it does not require a subagent.
3. Capture the full output (Findings + Verdict: **Approve** | **Request changes**).
4. **Orchestrator owns the A1 verdict.** A review-subagent report is evidence, not the phase verdict. Map it through the `code-review` bar before A2: re-open cited paths and drop false claims; product/UX nits are residual unless that gate owns them. Before classifying or Intake, confirm the cited lines changed vs base — unchanged pre-existing soup is residual; do not Intake it. Subagent “Approve with conditions” is **Request changes** only if a surviving finding is a real blocker for that depth. Do not A3 nits or false claims.
5. **Bound the A1 wait.** Omit `model` (inherit parent) or use a slug the host listed. Do not retry a rejected slug. No findings document → kill the subagent and emit A1 from the orchestrator HEAD walk. Do not skip A3 because the reviewer never returned. Kill immediately if the reviewer starts `web_fetch` on a local `base...HEAD` git review. A small diff still on turn 1 after ~60 local reads is wandering — kill then.

### A2. Branch

| Verdict | Action |
|---------|--------|
| **Approve** (or no material findings) | Proceed to Phase B |
| **Request changes** / open findings | Classify + fix (A3), then re-run A1. Count as one round |

### A3. Fix code-review findings

1. Classify each open finding: **simple** | **non-simple**.
2. State the classification in the turn (one line per finding).
3. **Simple:** fix inline. Priority: regressions → boundary/type contracts → local structure. Prefer smallest change; keep required behavior identical. Before swapping two mutually exclusive contract signals, re-read the consumer's current transition table on HEAD. If a landed test already names one as fail, keep it. Do not swap the two signals to complete the other.
4. **Non-simple:** run [Non-simple fixes via do-work](#non-simple-fixes-via-do-work) for that finding (or cluster). Do **not** patch it outside do-work.
5. After the fix batch (inline and/or do-work), re-run **A1**. Round counter: increment on each full A1→A3 cycle. At 3 failures → **Blocked (code-review)** and stop before Phase B unless the user says continue.

---

## Phase B — Release-safe + fix

Only start after Phase A is **Approve** (or empty/clean pass).

### B1. Gate

1. Read `release-safe/SKILL.md` fully.
2. Run that skill's **read-only** gate on the same branch vs base.
3. Capture the strict report: Kind, Verdict (**Approved** | **Not approved**), Issues (open only), Breaking inventory.

Do **not** fix during B1. Complete the gate first (per release-safe).

### B2. Branch

| Verdict | Action |
|---------|--------|
| **Approved** and Issues empty (or only non-blocking noise already closed) | Done — final report |
| **Not approved** or open Issues | Classify + fix (B3), then re-run B1. Count as one round |

### B3. Fix release-safe open issues

1. Classify each open Issue: **simple** | **non-simple**.
2. State the classification (severity + simple/non-simple).

| Severity | Default |
|----------|---------|
| **blocker** | Must clear. Simple → inline mitigation/docs/restore. Non-simple → do-work cycle |
| **major** | Same; library docs-only mitigations may be **simple** if only CHANGELOG/upgrade notes are missing |
| **minor** | Fix if cheap/simple; otherwise residual only if kind policy allows Approved with empty Issues |

3. **Simple:** apply the obvious remediation (CHANGELOG bullets with consumer impact, restore export, remove secret from tree, etc.). Prefer mitigation that matches **kind** (library vs project vs monorepo-mixed).
4. **Monorepo / kind notes:** Do not invent CHANGELOG debt for app-owned SPA chrome unless that package publishes externally. Do name Unreleased consumer impact for a **published agent/binary or library** wire change, package migrations, and runtime cache/index law — even when public types look additive. Before treating CHANGELOG mitigation as adequate, compare the section heading to `git tag` / the base tip. If that version is already tagged, put new consumer bullets under Unreleased. Do not append to the tagged section. A prior READY that filed notes in the tagged section is still open until they move.
5. **Non-simple:** full do-work cycle — Intake → Ideate → Capture, then serial TDD on the review branch (not go Stage B merge). Typical non-simple release items: dual-write/migration design, public API reshape, auth/default flips with real runtime risk.
6. Do not rubber-stamp: do not drop Issues without real fix or adequate mitigation.
7. After the batch, re-run **B1**. Max 3 rounds. Still failing → **Blocked (release-safe)**.

---

## Completion commit

Run this **after** the final phase re-gate (or after stop/blocked), and **before** the final report. Applies whenever this run produced uncommitted changes from fixes — READY or NOT READY.

### When to commit

| Situation | Action |
|-----------|--------|
| Working tree has uncommitted changes from this loop's fixes (simple inline, docs mitigations, leftover after do-work) | **Commit them** |
| Clean tree (Approve with no fixes, or do-work already committed everything) | Skip; report `Commit: none (clean tree)` |
| Only unrelated WIP remains (paths this loop never touched) | **Do not** stage/commit foreign WIP; report it under Files touched / notes |
| Mixed: loop fixes + unrelated WIP | Stage **only** paths this loop changed; commit those; leave foreign WIP alone |

Do **not** wait for the user to commit ship-loop fixes. Do **not** push unless the user asked.

### How to commit

1. Re-assert review branch name. Inspect: `git status`, `git diff` / `git diff --staged --name-only`, recent `git log` style on this branch.
2. Unstage foreign paths (`git restore --staged <path>`) if anything this loop did not touch is already in the index. Leave foreign WIP unstaged — do not force-add product renames from other sessions.
3. Stage only files this loop (or its do-work workers on this branch) modified for gate findings.
4. Commit with a message that states ship readiness and what was fixed. Use a HEREDOC:

```bash
git commit -m "$(cat <<'EOF'
branch-ship-loop: <READY|NOT READY> — <short summary of fixes>

<code-review and/or release-safe fixes; list key paths or findings>
EOF
)"
```

5. Confirm: `git status` clean for staged work (or only unrelated WIP left).
6. Put the resulting commit SHA (short) in the final report.

### Rules

- **One completion commit** for all remaining uncommitted simple/loop fixes from this run (do-work may already have made per-REQ commits earlier — do not squash those). Early hot-tip commits of simple fixes still count; do not squash them into a later completion commit.
- If a bad completion commit already included foreign paths and is unpushed: soft-reset → restage only loop files → recommit.
- No co-author trailers; use the repo's normal git author config.
- Do not amend prior commits unless the user explicitly asked and the amend is safe (HEAD unpushed, created by this run).
- If commit fails (hooks, empty stage after filtering WIP), report the failure; still emit the final report with readiness.

---

## Final report (always)

```text
## Branch ship loop

Branch: <name> vs <base>
Code-review depth: <depth>

### Phase A — code-review
Verdict: Approve | Request changes | Blocked
Rounds: <n>
Simple fixed: <short list or none>
Non-simple (do-work): <UR-NNN … + status | none>
Left open: <none | list>

### Phase B — release-safe
Kind: library | project | monorepo-mixed
Verdict: Approved | Not approved | Skipped (phase A blocked) | Blocked
Rounds: <n>
Simple fixed: <short list or none>
Non-simple (do-work): <UR-NNN … + status | none>
Left open: <none | list>

### Ship readiness
READY | NOT READY
One sentence why.

### Commit
<short-sha> — <subject> | none (clean tree) | skipped (unrelated WIP only) | failed: <reason>

### Files touched
- path — why (review finding / release issue / REQ)
```

If READY: branch cleared both gates. If NOT READY: remaining blockers + next human decision (including any open UR/REQ ids).

## Stop conditions

| Condition | Result |
|-----------|--------|
| A Approve + B Approved | **READY** → completion commit if needed → final report |
| Empty diff vs base | READY (nothing to gate); note it; no commit |
| Max rounds on A or B | **NOT READY** — blocked report; still completion-commit any fixes already applied |
| Unfixable open issue | **NOT READY** — list decision needed; still commit applied fixes |
| Non-simple item halted at ideate/go | **NOT READY** until that UR completes or user drops the finding; still commit applied simple fixes |
| User cancels mid-loop | Stop; completion-commit applied fixes unless user said discard; report partial progress |

## Out of scope

- Product/UX launch audit (`launch-readiness-audit`)
- Full-site SEO, copy, or marketing polish
- Deploy, tag, or publish to registries
- Opening PRs / merging unless the user explicitly asks after READY
- Replacing `code-review`, `release-safe`, or `do-work` with a weaker homemade checklist
- Skipping Ideate (`--no-ideate`) for non-simple fixes

## Failure modes

| Failure | Action |
|---------|--------|
| Sibling skill missing | Stop; install `code-review`, `release-safe`, and (for non-simple) `do-work` into the hub |
| Thin evidence (no base, unreadable diff) | Same as release-safe: Not approved / do not invent READY |
| Non-simple treated as simple | Treat as process failure; reopen via do-work before claiming READY |
| Dual-surface / incomplete cutover left as residual | Request changes until every consumer of the new law matches (agents + lib + docs); same batch wire-or-delete |
| Fix would expand product scope | Stop that item; report as human decision (or capture as do-work brief if user wants it in-scope) |
| Tests fail after a simple fix | Fix the regression or revert before the next re-run |
| In-flight claim whose Files overlap finding paths | Do not Intake; do not `unblock`. Report NOT READY with the occupying REQ id; resume after that claim archives |
| Checkout drifted off review branch | Stop edits/commits; re-checkout review branch if clean, else report |
| Infinite oscillation (fix A breaks B or reverse) | After one cross-phase regression, stop and report conflict |

## Invocation

```text
/branch-ship-loop
/branch-ship-loop light
/branch-ship-loop deep
/branch-ship-loop --branch feature/foo
```

Optional args:

- Depth token for code-review: `light` | `medium` | `deep`
- `--branch <name>` if not already checked out
- `--max-rounds N` (default 3 per phase)
