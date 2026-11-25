# Worker brief: unstick one factory:stuck issue on {{REPO}}

The lead copies this file to a scratch path, fills every `{{…}}`, and keeps editing that copy as workers report.

You own the issue number(s) your prompt names. Work alone, end to end, and report back.

## Why it is stuck
{{SHARED_CAUSE, e.g. "The factory gave up at its 90-minute run limit with gate_attempts: 0 and removed its worktree."}}
A `t3/*` branch may still hold the work it pushed (step 0). Re-readying it would hit the same limit, so you finish it
here and open a PR, unless triage says otherwise.

## Repo profile
- Instruction files to read first: {{e.g. root CLAUDE.md, source/backend/AGENTS.md, ~/EA/projects/AGENTS.md}}, plus any
  `docs/` page the issue names.
- Primary checkout to branch from (never edit it): `{{PRIMARY}}`. Make your own worktree:
  `git -C {{PRIMARY}} fetch origin {{BASE}} && git -C {{PRIMARY}} worktree add -b <type>/<N>-<slug> {{WORKTREE_DIR}}/stuck-<N> origin/{{BASE}}`
- Local test setup: {{e.g. Herd PHP + MySQL root@127.0.0.1, a database per worker named ..._stuck<N>; frontend npm ci needs Node 26 on PATH}}
- Narrow checks a worker may run: {{e.g. php artisan test --compact <files>, pint --dirty, npx vitest run <files>, npm run typecheck}}
- Never run locally: {{e.g. the full backend suite, e2e, production builds}}. CI runs them.
- Repo rules a PR must meet: {{e.g. 100% patch coverage under app/, docs/api.md for route changes, the domain page for behaviour changes}}
- Must never happen: {{e.g. cdk deploy or anything touching AWS}}

## Rules
- Absolute paths in every Bash call (parallel calls race the cwd). Never `git stash`.
- The machine is shared with the other workers. Keep runs narrow. Ask the lead before any full-suite run.
- Scope is the issue's acceptance criteria. Don't refactor neighbours.
- Commits and PRs carry the change only: strip `Co-Authored-By` trailers (factory commits have them) and any tool byline.

## Steps
0. **Salvage.** The factory usually pushed its work, named by slug, not issue number.
   `git -C {{PRIMARY}} fetch origin '+refs/heads/t3/*:refs/remotes/origin/t3/*'`, then
   `git -C {{PRIMARY}} for-each-ref --format='%(refname:short) %(committerdate:short) %(subject)' refs/remotes/origin/t3/`.
   Match on slug or commit subject (`git log origin/t3/<x> --grep '#<N>'`). The issue's factory comments may name the
   branch outright, and the name can be meaningless (`t3/dummy`), so read them too. Several runs can leave several
   branches: take the newest complete one. If found, check `git log origin/{{BASE}}..origin/t3/<x>` and its diff
   against every criterion, cherry-pick its commits (not its merge commits) onto your branch, and finish what's
   missing. Then:
   - Re-date any migration that now sorts before a migration already on base.
   - Run the static checks the factory never reached (PHPStan, typecheck). Its gate never ran, so a type error is the
     likeliest gap.
   - Prove the new tests fail without the fix (revert the fix file, run, restore).
1. **Triage**, before any new code. `gh issue view <N> -R {{REPO}} --comments`.
   - A blocker under `## Depends on` or blockedBy still open: stop, report "blocked by #X".
   - Already done on base (grep for the symbols, tests or behaviour the criteria name; `gh pr list --state all --search`):
     comment with the evidence (PR or sha, file:line), `gh issue close <N> --reason completed`, report it.
   - An open PR already covers it: report it, don't build.
   - The premise is wrong on today's base, or the criteria need a product call the code and docs don't settle: stop and
     report the question, the options and your recommendation.
   - Too big for one PR of sane size: report a proposed split (titles and criteria), don't build.
   - A "Decision before ready" line in a body the person set ready: build it, and name the open decision in your report.
2. **Build** test-first in your worktree. Narrow checks green. Conventional commit matching the issue type.
3. **Open the PR** against {{BASE}} (or the base the lead named for a stack), not draft. Title = the issue title.
   Body: a short summary, `Closes #<N>`, {{PR_BODY_SECTIONS, e.g. "## Testing (steps and expected result), ## Risk: n/5
   with one line why, ## How to revert"}}.
4. **Stop touching the PR.** The babysit-prs session takes it from here: CI, review, merge. Don't watch CI and don't
   push again.
5. **Relabel and note**, the relabel as its own command:
   `gh issue edit <N> -R {{REPO}} --remove-label factory:stuck --add-label factory:pr-open`, then comment on the issue:
   "Built by hand in #<PR> after the factory's run {{CAUSE_SHORT}}. Don't set factory:ready: that starts a fresh run from
   base and duplicates the PR."
6. **Clean up**: `git -C {{PRIMARY}} worktree remove --force <worktree>` (keep the branch), drop your test database, and delete
   your temp files.

## Report (your final message, short)
- Issue #, outcome: `pr-open #PR` | `closed: already on base (#PR/sha)` | `blocked by #X` | `needs decision: <question,
  options, recommendation>` | `split proposed: …`
- Where the code came from (which `t3/*` branch, what you changed in it).
- Files other open PRs also touch, merge-order traps, manual steps after merge.
- Follow-ups you found, flakes you saw, stale branches safe to delete, anything a permission prompt stopped you cleaning.
