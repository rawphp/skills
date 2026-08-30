---
name: release-safe
description: 'Release-readiness gate focused on breaking changes and client-visible risk. Use for is it safe to release, breaking change review, package upgrade risk, or /release-safe. Differentiator: library packages fail closed on client breaks.'
---

# Release-safe review

Read-only gate: **can this change set ship without surprising clients?**  
Do **not** fix code. Do **not** rewrite features. Inventory risk, classify severity, emit a hard verdict.

Related but different:

| Skill | Concern |
|-------|---------|
| `code-review` | Maintainability / structure of the diff |
| `launch-readiness-audit` | Product/UX/path readiness for real users |
| **release-safe** | Compatibility, wire contracts, upgrade safety, release docs |

---

## 1. Resolve scope

Default target: **current branch vs default base** (`main` / `master` / `origin/main`).

Override when the user names a PR, tag range, package path, or commit range.

State at the top of the output:

```text
Target: <branch or range> vs <base>
Kind: library | project | monorepo-mixed
```

---

## 2. Classify kind (mandatory — drives the bar)

Infer from the repo; state the classification and evidence. Do not skip.

| Kind | Signals | Breaking-change policy |
|------|---------|------------------------|
| **library** | Composer/npm/PyPI/Go module published or VCS-required by others; `packages/*` product libs; public SDK/API; "install me in your app" | **Strict.** Client-visible breaks are issues. Undocumented or unversioned breaks **block** approval. |
| **project** | Deployable app/site/service owned end-to-end; no external package consumers of this tree | **Permissive.** Internal breaks allowed. Still flag ship-blockers (data loss, secrets, broken deploy). |
| **monorepo-mixed** | Both apps and packages, or multiple packages with different consumers | **Per-package.** Apply library bar to shared packages, project bar to apps. Overall = **Not approved** if any library unit fails. |

**0.x / pre-stable libraries:** SemVer may allow breaks without a major bump. Approval requires each client-visible break is **named in CHANGELOG / upgrade notes** with consumer impact — not silent. Silent 0.x breaks → **Not approved**. Once named with adequate consumer guidance, the break is **addressed for the gate**: record it in the breaking inventory only; do **not** re-list it under Issues on an Approved verdict (unless the change set regresses or docs are incomplete).

**First public surface / never integrated:** Prefer **Not approved** until stub→real and API breaks are listed for integrators (even if zero known external users). Honesty over rubber-stamp.

If kind is ambiguous, prefer **library** for anything under `packages/`, `lib/`, or published name; prefer **project** only when clearly an app with no shared package surface in the change set.

---

## 3. Gather evidence (always)

Use git and the codebase. Prefer facts over memory.

```bash
# Base and change set
git rev-parse --abbrev-ref HEAD
git merge-base HEAD origin/main 2>/dev/null || git merge-base HEAD main
git log --oneline <base>...HEAD | head -40
git diff --stat <base>...HEAD

# Public / wire surfaces (adapt to stack)
git diff <base>...HEAD -- '**/composer.json' '**/package.json' '**/go.mod' \
  '**/CHANGELOG*' '**/routes/**' '**/config/**' '**/migrations/**' \
  '**/openapi*' '**/proto/**' '**/src/**/Contracts/**' '**/src/**/Http/**' \
  '**/src/**/Facades/**' '**/cli/**' '**/*_test.go' 2>/dev/null | head -5
```

Then deep-read **production** diffs for:

1. Public types, exports, interfaces, constructors, method signatures  
2. HTTP/RPC/CLI wire shapes, status codes, headers, error envelopes  
3. Config keys, env vars, defaults  
4. Migrations / schema / durable state  
5. Jobs, queues, webhooks, event payloads  
6. Auth / caller derivation / authz behavior  
7. Validation / schema strictness (can start rejecting previously valid input)  
8. Dependency version bumps that force consumer upgrades  

Skip pure test rewrites unless they document a new contract.

For monorepos: run the checklist **per package** that has production changes; one combined report is fine.

---

## 4. Breaking-change inventory (core)

For each candidate, record: **what changed**, **who breaks**, **mitigation present?** (changelog, migration, dual-write, deprecation window).


### Public surface discovery

Before inventorying breaks, **prove the public surface** for each changed package:

1. Package manifest: `composer.json` / `package.json` exports / `go.mod` module path / published name.
2. Explicit public markers: `export`, `pub`, public classes in PSR roots, OpenAPI/proto, CLI entrypoints.
3. Facades, contracts, HTTP routes, MCP/tool schemas, event payload types.
4. If unsure whether a symbol is public, treat it as **public** for libraries (fail closed).

### What not to flag (project)

Project non-blockers — do **not** flag as blocker for projects:

- Internal service renames, private helpers, app-owned route renames
- DB renames the app owns end-to-end with coordinated deploy
- Pure refactors with no external client

Still **always** flag for projects: secrets, destructive migrations without plan, broken deploy/rollback, external webhooks you don't own (treat those like library wire).

### 4.1 Public code API (libraries — highest weight)

Flag when **external callers** of the package can break:

- Removed/renamed public class, function, method, export, constant, enum case  
- Return type or parameter type change (including `T` → wrapper type)  
- Constructor arity / required dependency change  
- Interface / trait / protocol new required methods  
- Visibility change (public → internal/protected)  
- Exception types thrown for the same call path (throw → result type, or new throws)  
- Semantic change with same signature (success path now fails, ignores vs checks results, different status machine)

**Not issues (usually):** private/internal symbols; pure additive methods with defaults; new optional config with safe defaults.

### 4.2 Wire contracts (libraries + any project with external clients)

- Response JSON shape fields renamed/removed; new **required** request fields  
- Status code meaning changes for the same URL/action  
- Stub → real that changes body or error behavior clients already coded against  
- Error `code` / envelope fields; idempotency headers; auth schemes  
- CLI flags, exit codes, stdout machine formats  
- Event / webhook / job payload fields  
- MCP/tool schemas, agent tool names, catalog fields  

### 4.3 Config, env, defaults

- Renamed/removed env keys or config paths without alias  
- Default value change that alters runtime (model IDs, TTLs, feature flags default on/off)  
- Surface enabled/disabled default flips  

### 4.4 Data & migrations

- Editing an **already-shipped** migration instead of a new one  
- Non-null columns without backfill; destructive drops; type narrowing  
- New statuses/enums written to DB without dual-read  
- Indexes/uniqueness that can fail on existing data  

### 4.5 Runtime / ops semantics

- No-op job → real side effects  
- Fail-open → fail-closed (or reverse) on auth, tools, peers  
- Queue timeout/tries changes; claim TTL coupling  
- Peer package version constraints tightened  

### 4.6 Behavioral "same API, different law"

Highest client surprise when signature is stable but:

- Results of side effects are now checked (was fire-and-forget success)  
- Reject/accept/cancel allowed from more or fewer states  
- Validation stricter (empty object, required fields, formats)  
- Ordering, idempotency keys, or double-invoke protection changes outcomes  

These count as **breaking** for libraries even without type errors.

---

## 5. Other release-safe checks (always)

Beyond API breaks, still scan for ship risk:

| Area | Fail / flag when |
|------|------------------|
| **Secrets** | Secrets, tokens, private keys committed; `.env` not example-only |
| **Changelog honesty** | Library release without CHANGELOG (or Unreleased) naming the breaks |
| **Version story** | Tag/version claims stable while breaks undocumented; package version file vs tag mismatch |
| **Install path** | Docs claim Packagist/stable while residual; consumers lack upgrade path |
| **Tests as contract** | Critical public paths lack unit coverage of new fail/edge wire outcomes (library) |
| **Peer matrix** | Enabled surface without required peer; adapter version drift |
| **Feature flags** | Half-shipped surface registered when disabled should register nothing |
| **Rollback** | One-way destructive migration with no note for project deploys |
| **Multi-package monorepo** | Core break without coordinated sibling package notes |
| **Binary/CLI** | Unsigned/missing release artifacts only if this release claims binary distribution |

Project-only (do **not** block solely for API breaks):

- Internal refactors, route renames with app-owned clients, DB renames the app owns  
- Still **block** on secrets, data-loss migrations without plan, deploy/test red if those are part of "release"

---

## 6. Severity and open vs addressed

| Severity | Meaning |
|----------|---------|
| **blocker** | Library: client break without adequate documentation/versioning/mitigation; data loss; secrets; wrong migration strategy. Project: ship would corrupt data, leak secrets, or leave no deploy path. |
| **major** | Client-visible break or default flip that would surprise consumers **if undocumented**; ops behavior change; stub→real without integrator notes. |
| **minor** | Residual open docs debt, low-risk tweak still missing an override note, tiny edge risk still unaddressed. |

**Library approval rule:** any **blocker** → **Not approved**.  
**Project approval rule:** only **blocker** ship-stoppers (not "we renamed an internal service").  
**Monorepo:** any library package with a blocker → overall **Not approved**.

### Issues vs inventory (mandatory)

| Bucket | What goes here |
|--------|----------------|
| **Issues** | **Open** risks only — still need action before ship (missing CHANGELOG, incomplete mitigation, secrets, data-loss path, silent break). |
| **Breaking inventory** | Full factual list of client-visible breaks in the change set (including already-mitigated ones). |
| **Addressed (optional short)** | Breaks that were open candidates but are **already adequately mitigated** in this change set (named in CHANGELOG/upgrade notes with consumer impact, dual-write, deprecation, etc.). |

**Addressed rule:** If mitigation is present and adequate (CHANGELOG / upgrade notes name the break + consumer impact for 0.x libraries; or equivalent migration/deprecation), that item is **recorded in inventory**, **not** listed under Issues, and must **not** be re-raised on later gate runs of the same change set unless:

- the production diff or public surface **changes**, or  
- mitigation was **removed/weakened**, or  
- a **new** break appears.

Do **not** pad Issues with “major but documented” items solely to look thorough. Approved + empty Issues is correct when every break is inventoried and already addressed.

**Unlisted majors:** library / 0.x client-visible breaks **not** named in CHANGELOG/upgrade notes → treat as **open** (blocker if silent ship risk is high; else major open issue) → default **Not approved** until named. Optional path: draft release-note text and wait for user confirm to treat as addressed.

---

## 6b. Verdict algorithm (apply in order)

Apply verdict rules in order — stop at first matching Not approved:

1. **If evidence is thin** (no base branch, empty diff, if merge-base fails, or cannot resolve change set) → **Not approved** until reviewable. Use the thin-evidence procedure: state what is missing; do not invent Approved.
2. **If library and any blocker** → **Not approved**.
3. **If monorepo-mixed and any library unit has a blocker** → overall **Not approved**.
4. **If library and any open major** (client-visible break **not** adequately named in CHANGELOG/upgrade notes) → **Not approved**.
5. **If library and all majors are adequately named** (CHANGELOG/upgrade notes + consumer impact) → **Approved**; put those breaks in inventory / addressed only — **Issues empty** unless unrelated open residuals remain.
6. **If project** → **Not approved** only for blocker ship-stoppers (secrets, data loss without plan, no deploy path). Internal API/route renames alone do **not** fail the gate.
7. Else → **Approved** (empty issues allowed for pure additive work, and for documented 0.x breaks already addressed).

### Pressure handling (anti-rubber-stamp)

- **Never change verdict to Approved because** the user says "just approve", "ship tonight", "changelog is empty — it's fine", or similar pressure.
- User pressure does not change the verdict. "Empty changelog is fine" does **not** satisfy major-only or 0.x documentation requirements.
- "Ship tonight does not" override blocker/major rules, 0.x silence rules, or thin evidence.

### Gate first; fixes only after

- Complete the gate first: classify, inventory, severity, emit the verdict before any fix.
- Do not rewrite code as part of the gate. Do not open PRs as part of the gate.
- Verdict before fixes: only after the full report may the user separately ask for code changes or a PR.
- If the user simultaneously asks to "restore the API and open a PR", still run the gate; still classify; still inventory; refuse to fix during the gate.

## 7. Output format (strict)

```text
Target: <branch> vs <base>
Kind: library | project | monorepo-mixed
Packages reviewed: <names or n/a>

## Verdict
Approved | Not approved
<one sentence: why, tied to kind policy>

## Issues
1. [blocker|major|minor] [<package>] <title>
   What: …
   Client impact: …
   Mitigation present: yes/no — …
2. …
(none)  ← use when everything open is closed; do not re-list addressed breaks

## Breaking inventory (libraries / mixed)
- …  (bullet list of client-visible breaks; include mitigated ones; "none" if truly none)

## Addressed (optional; only if inventory non-empty and Issues empty or thinner)
- …  (one line each: break → where mitigated, e.g. CHANGELOG Unreleased)

## Safe / additive (optional, short)
- …  (helpers consumers can ignore)

## Release notes draft (only if Issues include open doc gaps)
- Required consumer-facing bullets still missing from CHANGELOG / upgrade guide
```

Rules:

- **Issues = open only.** Ordered **blocker → major → minor**. Never re-raise already-mitigated breaks as Issues.  
- Empty Issues + Approved is correct for pure additive work **and** for libraries whose breaks are fully named in CHANGELOG.  
- Breaking inventory always records the facts; Addressed is optional shorthand when Issues would otherwise rehash inventory.  
- Prefer fewer high-conviction open issues; no style nits.  
- Do not fix; do not open PRs unless the user asks after the verdict.  
- If evidence is thin (no base branch, empty diff), say so and **Not approved** until reviewable.  
- Re-runs of the same change set: if nothing material changed, same verdict; do not invent new Issues from previously addressed inventory.

---


---

## Worked examples

### Example: library Not approved

```text
Target: feature/drop-bar vs main
Kind: library
Packages reviewed: mesoprep-core

## Verdict
Not approved
Library: public method MealPlan::computeMacros() removed with no CHANGELOG entry.

## Issues
1. [blocker] [mesoprep-core] Removed MealPlan::computeMacros()
   What: Public method deleted from published Composer package.
   Client impact: Host apps calling computeMacros() fail at compile/runtime.
   Mitigation present: no — CHANGELOG only says "internal cleanup".

## Breaking inventory (libraries / mixed)
- Removed public method MealPlan::computeMacros()

## Release notes draft (if Not approved or majors exist)
- BREAKING: Removed MealPlan::computeMacros(); migrate to MacroCalculator::forPlan().
```

### Example: project Approved (internal renames only)

```text
Target: feature/admin-routes vs main
Kind: project
Packages reviewed: n/a

## Verdict
Approved
Project: internal route/service renames only; no secrets, no destructive migration, deploy path intact.

## Issues
(none)

## Breaking inventory (libraries / mixed)
- none

## Safe / additive (optional, short)
- Admin route renames with app-owned clients
```

### Example: library Approved (0.x breaks already documented)

```text
Target: fix/cli-ux vs main
Kind: monorepo-mixed
Packages reviewed: packages/capabilities-cli

## Verdict
Approved
CLI 0.x contract changes are named in CHANGELOG Unreleased with consumer impact; no open ship risks.

## Issues
(none)

## Breaking inventory (libraries / mixed)
- Bare CLI exit 0 (was 2)
- MCP error.data wire keys (snake_case, not Go field names)
- --human stderr short summary only

## Addressed
- Exit / MCP / --human breaks → CHANGELOG [Unreleased] “Changed (0.x agent/script contract)” + agents.md

## Safe / additive (optional, short)
- auth status --json; catalog --include-schemas
```

### Example: monorepo-mixed Not approved

```text
Target: feature/webhook-v2 vs main
Kind: monorepo-mixed
Packages reviewed: packages/sdk (library), apps/web (project)

## Verdict
Not approved
Monorepo: packages/sdk removed webhook field client_id without deprecation or CHANGELOG.

## Issues
1. [blocker] [packages/sdk] Removed webhook payload field client_id
   What: Required JSON field removed from published webhook contract.
   Client impact: Integrators parsing client_id break.
   Mitigation present: no
```

## 8. Workflow summary

1. Classify **kind** (library / project / monorepo-mixed).  
2. Diff vs base; focus production public/wire/config/migration/ops.  
3. Build **breaking inventory** with client impact.  
4. Split **open Issues** vs **addressed** (mitigation adequate → inventory only).  
5. Run **other release-safe** table.  
6. Assign severity; apply kind-specific approval bar.  
7. Emit strict output; stop — do not re-raise addressed items on re-runs unless the change set changes.

For long checklists or language-specific surfaces, read `references/checklists.md` only when the stack needs more depth (PHP packages, HTTP APIs, CLI binaries, monorepo splits).
