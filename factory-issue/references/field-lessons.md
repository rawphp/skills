# factory-issue field lessons

No pending field lessons. New lessons may be appended by the post-skill field-lessons loop.

## 2026-10-21 — "unblock" a `factory:stuck` issue that already has a draft PR

The factory's stuck comment says "fix the cause, then set `factory:ready`", but `stuck → ready` starts a **new run from base**, on a branch the factory names itself: the existing PR's branch is never resumed, and the state table allows no hand-set `pr-open`. When the stuck reason is the review cap (work complete, PR green), re-readying throws the work away and usually hits the same cap. Read the PR first (`gh pr view N --json isDraft,mergeStateStatus,body`), review the unreviewed tail, and offer the owner: finish the PR by hand on its branch, or tighten the criteria and rebuild. Record findings as a PR review either way, so the next actor reads them where it looks.

## 2026-10-21 — a review on a hand-assembled PR reaches no factory

The `pr-open` feedback loop watches only the pull request the factory's own live run opened (the `pr_url` on the run record). A PR a person assembled from the factory's merged parts (#562 on tc-people, from an integration branch) has no run behind it, and the issues' `factory:pr-open` labels are stale once their own PRs merged or closed. Before promising "the factory will pick it up", check the run records on the watching Mac (`~/.config/t3fac/factory/runs/<owner>__<repo>__<issue>__N.jsonl`, last `state_changed`/`finished` event). If every run is finished, the choices are: fix by hand on the PR branch, or file new issues with `## Base: <pr branch>` so child PRs land into it. Re-readying the old issues starts a fresh build from base and discards the branch.

## 2026-10-21 — filing for a repo that does not exist yet, with sources in another org

Bootstrap before any body: create the repo, commit the spec and plan and a `.dw/config.yml` whose gate passes on an empty tree (an aggregating `Makefile` whose targets are no-ops until each side registers its own `make.mk`), create the seven labels one `gh label create` per line (a `for … set --` loop silently passed empty colours), clone to `~/t3fac/<owner>/<repo>` and `t3 project add` it. The factory claimed the first two issues within a minute of `ready`, so the registration is live without a restart. Check `GH_CONFIG_DIR=… gh repo view` for every repo the bodies tell the session to read: the factory login (rawphp) could not see the Trilogy-Care repos, so ported sources went into the new repo as a pinned `reference/` snapshot (SHA table in `reference/SOURCES.md`, secrets grepped and a test APP_KEY redacted first). Two parallel scaffold issues must not share a file: separate workflow files and per-side make fragments instead of one `ci.yml` and one `Makefile`.

## 2026-10-21 — needs-info over a missing `reference/` source: supply it, do not redesign

When the session stops because a file the issue says to copy is not in the snapshot, the answer is the file, not a fallback design. Find the pinned commit in `reference/SOURCES.md`, a local clone of the source repo (`find ~ -maxdepth 4 -type d -name '<repo>'`), and `git show "${SHA}:path"` it into the snapshot on `main`, then compare `md5` against the source before committing. Quote the braces: in zsh `$SHA:path` is parsed as a parameter modifier and `git show` prints the commit instead of the file; the first push here shipped four copies of a commit header. Also follow every import of the files the issue names (CSS `@import`, `@/…` aliases) and fold each one into the criteria, so the next run has no second gap.
