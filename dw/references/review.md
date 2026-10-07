# Review

Native persona batch. Inspired by CE multi-lens review. Do not load `ce-code-review` or EA `code-review`.

## Select

Always spawn `correctness`.

Spawn when the diff earns it:

| Persona | When |
|---------|------|
| `testing` | Tests changed, or runtime behavior changed with no matching test work |
| `security` | Auth, public endpoints, user input, permissions, secrets |
| `api-contract` | External route/schema/event/package signature |
| `reliability` | Retries, jobs, timeouts, error paths, health |
| `maintainability` | Substantial structure, new abstractions, or ≥200 executable lines |
| `adversarial` | **review-deep**, or auth/payments/persistence writes |
| `docs` | Diff rewrites docs, help or a runbook |

Skip a lens that has no surface. Do not spawn "just in case."

Announce the roster in one line per extra persona, then dispatch.

## Dispatch

Each selected file in `references/reviewers/<name>.md` is the whole prompt plus:

- The unit diff (or path list + `git diff`)
- Contract `done` / `out` / `settled`
- Output shape below

One concurrent batch of host parallel subagents. Checker model from `references/models.md`.

Maker session does not play a persona.

One worktree → at most **one** reviewer (usually `testing`) may edit files; it restores with `git checkout` and ends on a clean `git status`. Every other persona is strictly read-only (read `git show HEAD:<path>` if code looks changed). After cycle 1, drop the read-only reviewers and keep the mutating one; its re-check is "re-run your surviving mutants." A blocker from `security` or `adversarial` whose fix adds code brings that persona back for the next cycle, until it approves. L unit: the last wave before Ship includes one `correctness` reviewer on the whole unit diff at the tip (`<base>..HEAD`), earlier findings marked known. If the maker model changes, keep at least one reviewer on a different model.

Parallel workers never share a mutable resource. A persona that runs tests does it in its own copy (`git worktree add --detach <scratch> <unit tip>`, never `HEAD` from the primary) with its own test resources (DB name, ports, caches: `<unit>_<persona>`). The orchestrator's own runs follow the same rule. A gate run that overlapped another process on the same tree or resource does not count: re-run it alone on the clean tip before push.

## Merge

Each reviewer writes its findings to the scratch file the packet names (absolute path, `.dw/review/<unit>-r<N>-<persona>.md`, not in a worktree) and returns only this as its final message:

```text
## Verdict
Approve | Request changes
blockers: <n> actions: <n> nits: <n>
findings: <absolute path>
```

The file holds the findings:

```text
- id: <persona>-<n>
  severity: blocker | action | nit
  file: <path:line>
  problem: <one sentence>
  fix: <one sentence>
```

Long reports are cut off in transit; the file never is. The orchestrator reads the file, not the message, for findings.

**blocker** / **action** → Make. **nit** → drop unless cheap and in `files`. Duplicate findings: keep one.

Empty blocker+action list → Check continues to Ship.

Do not invent findings the diff does not support. High conviction only.
