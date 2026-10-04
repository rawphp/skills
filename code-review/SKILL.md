---
name: code-review
description: 'Maintainability review of branch/PR changes at light, medium (default), or deep depth. Use for code quality audits, merge gates, spaghetti/file-size/abstraction checks. Invoke with light, medium, or deep.'
disable-model-invocation: true

---

# Code Quality Review

Strict maintainability review of the current branch's changes. Behavior must stay the same; structure and clarity can improve.

## 1. Resolve depth first

Before reviewing, set depth. Do not start deep by habit.

| Priority | Signal | Depth |
|----------|--------|--------|
| 1 | Explicit `light` / `medium` / `deep` | that mode |
| 1 | Synonyms: `quick`, `shallow` → light; `full`, `harsh`, `strict`, `thorough` → deep | mapped mode |
| 2 | Clear natural language ("quick pass", "be thorough", "full audit") | map accordingly |
| 3 | Nothing said | **medium** |

If ambiguous, default to **medium**. Do not ask unless the user clearly invited a choice.

State depth as the first line of the review output:

```text
Depth: medium
```

---

## 2. Shared baseline (all modes)

Apply at every depth:

> Review the current branch's changes for maintainability and implementation quality without changing required behavior. Prefer high-conviction findings over nit floods.

### Always-on standards

1. **File size** — Do not let a PR push a file from under 1k lines to over 1k without a very strong reason. Prefer extract/split first.
2. **Spaghetti growth** — New ad-hoc conditionals or special cases bolted onto unrelated flows are design problems, not style nits.
3. **Boring over magic** — Brittle, ad-hoc, or "magic" behavior that hides simple structure is a problem.
4. **Right layer + reuse** — Feature logic in shared paths, wrong package, or bespoke helpers when a canonical one exists — call it out.
5. **High conviction only** — Prefer fewer, sharper comments. No cosmetic drive-bys when larger issues exist.
6. **Cutover completeness** — Write/insert plus a later `delete()` is unfinished if compact/read never switched. Cite both call-sites. Isolation tests that name a join do not prove the daemon calls it. See [references/review-traps.md](references/review-traps.md).

### Shared finding priority

1. Structural / maintainability regressions
2. Spaghetti / branching complexity increases
3. Boundary, abstraction, or type-contract problems that hurt reasoning
4. File-size and decomposition concerns
5. Legibility (only when it materially affects maintainability)

---

## 3. Mode matrix

| Axis | Light | Medium (default) | Deep |
|------|-------|------------------|------|
| **Intent** | Merge gate: would I block this? | Solid maintainability gate | Full ambitious audit |
| **Ambition** | No structural hunting | Local, obvious cleaner structure only | Full code judo; hunt reframes that delete complexity |
| **Scope** | Clear regressions only | Standards + tempered design pressure | Everything below + full question/remedy set |
| **Skip** | Code judo, redesigns, type purity for its own sake, speculative decomposition, parallelization nits | Exhaustive "rethink the approach" unless the regression is severe | Nothing in this skill's deep checklist |
| **Volume cap** | **≤ 3** findings; silence is fine | **≤ 8** findings | No hard cap; still prioritize, no nit flood |
| **Tone** | Practical, short, merge-oriented | Direct, serious — not theatrical | Demanding about quality |
| **Approval blockers** | Clear regressions only | Regressions + obvious local mess | Plus obvious missed dramatic simplification |

---

## 4. Mode playbooks

### Light

**When:** small PRs, time-boxed pass, "is this OK to ship?"

**Check only:**

- Spaghetti bolted onto existing paths
- File crossing ~1k lines because of this change
- Feature logic leaking into shared/general code
- Obviously wrong layer or near-duplicate of an existing helper
- Obviously hacky/magic that makes the code harder to read

**Do not:** invent architecture rewrites, hunt code-judo reframes, push type purity when behavior is fine, or expand scope beyond the diff's clear damage.

**Optional one-liner** (only if something deep-worthy was intentionally skipped):

```text
Out of scope at light depth: …
```

**Approve unless** there is a clear maintainability regression. Missed simplification is **not** a blocker.

### Medium (default)

**When:** normal PR / branch review.

**Apply:** always-on standards, plus:

- Bias toward cleaning design when the fix is **local and obvious**
- Prefer direct code over thin wrappers / pass-through abstractions
- Flag types/boundaries (`any`, casts, fuzzy optionality) when they obscure a real invariant
- Flag needless sequential orchestration or non-atomic updates when the cleaner shape is obvious

**Code judo:** only when a simpler shape is sitting right there in the diff. Do **not** open a redesign of half the module unless the change already forces that conversation.

**Block on:** clear regressions, unjustified file-size explosion, obvious spaghetti growth, clear wrong-layer / duplicate-helper, obviously hacky abstraction.

**Do not block solely on:** "there might be a dramatic reframe somewhere."

### Deep

**When:** large refactors, architecture-sensitive diffs, user asked for harsh/full/thorough.

**Be ambitious.** Do not stop at local cleanup. Actively search for code-judo moves: restructurings that preserve behavior while making the implementation dramatically simpler, smaller, more direct, and more elegant.

**Also apply:**

0. **Structural simplification** — Prefer deleting whole branches, helpers, modes, or layers. Prefer the solution that feels inevitable in hindsight. If complexity can be deleted rather than rearranged, push hard for that path.
1–7. Always-on standards, design bias, boring code, types/boundaries, canonical layer/helpers, orchestration smells — all at full strength.

**Primary questions (every meaningful change):**

- Is there a code-judo move that would make this dramatically simpler?
- Can this be reframed so fewer concepts, branches, or helper layers are needed?
- Does this improve or worsen local architecture / coupling / scanability?
- Did branching complexity grow where a better abstraction should exist?
- Is logic in the right file and layer?
- Did a file cross a healthy size boundary?
- Is this abstraction earning its keep, or just a wrapper?
- Casts, optionality, or ad-hoc shapes obscuring the real invariant?
- Orchestration more sequential or less atomic than it needs to be?

**Preferred remedies:** delete indirection; reframe state so conditionals disappear; change ownership boundaries; extract helpers; split large files; replace condition chains with typed models/dispatchers; separate orchestration from business logic; reuse canonical helpers; parallelize only when it also simplifies.

**Approval bar (deep only):** also treat as presumptive blockers unless clearly justified:

- Preserves a lot of incidental complexity when a plausible code-judo path would delete it
- Missed obvious decomposition that would materially improve maintainability
- Solves a local problem by scattering feature checks across shared code
- Adds unnecessary abstraction/wrapper/cast-heavy contract that makes the design more indirect

Do not rubber-stamp "it works." Do not settle for a cleaner version of the same messy idea if a much simpler idea is visible.

---

## 5. Review tone by mode

| Mode | Voice |
|------|--------|
| Light | Short, practical. Ship-or-fix language. |
| Medium | Direct and serious. Name regressions clearly without soft-pedaling. |
| Deep | Demanding about quality. Not rude. If the code got messier or missed a dramatic simplification, say so plainly. |

**Useful phrases (medium/deep):**

- `this pushes the file past 1k lines. can we decompose this first?`
- `this adds another special-case branch into an already busy flow. can we move this behind its own abstraction?`
- `this works, but it makes the surrounding code more spaghetti. keep the behavior; restructure the implementation.`
- `this feels like feature logic leaking into a shared path. can we isolate it?`
- `this abstraction seems unnecessary. can we keep the direct flow?`
- `why does this need a cast / optional here? can we make the boundary more explicit?`
- `bespoke helper for something we already have — can we reuse the canonical one?`

**Deep-only phrases:**

- `there's a code-judo move here that makes this much simpler. can we reframe so these branches disappear?`
- `this refactor moves complexity around but doesn't delete it. can the model itself be simpler?`

---

## 6. Output format

```text
Depth: <light|medium|deep>

## Findings
1. …
2. …

## Verdict
Approve | Request changes
<one short reason tied to this mode's approval bar>
```

Rules:

- Order findings by the shared priority list (and deep's extra judo priority when in deep).
- Respect volume caps for light (≤3) and medium (≤8).
- If light finds nothing: say so under Findings; Verdict Approve is fine.
- No low-value nit lists when larger structural issues exist.
- Deep: still prioritize; thorough ≠ every cosmetic note.
- Immediately before writing findings, re-read every production file in scope. If a helper appeared mid-pass, grep its call-sites again. Do not ship citations from the opening read.

---

## 7. Scope of review

- Default target: **current branch changes** (diff vs base branch), unless the user names another target (PR, commit range, paths).
- Do not expand into an unrelated full-repo audit unless the user asked for that (usually deep + explicit).
- Preserve behavior; recommendations are structural/maintainability, not feature changes.
- When the range is an integration of similar tickets, judge merged duplication across files (see review-traps), not each commit in isolation.
