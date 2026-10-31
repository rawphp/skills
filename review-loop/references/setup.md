# Setup: environment, access and the checkout

Read before the first round. SKILL.md's numbered steps say what to do; this file covers what goes wrong doing it on a new machine, repo or worktree.

## The CLI's checkout and tokens

- `$REVIEW_GATE_V2_HOME` is not exported on every machine. `cd -P <review-gate skill dir>/../..` follows the skill's symlink to the review-gate-v2 repo; use that path as `PYTHONPATH`.
- The CLI reads `GITHUB_TOKEN`, not `GH_TOKEN` and not gh's stored login. `pr-state` without it exits 2 with "GITHUB_TOKEN is not set" and leaves an empty state file. Put `GITHUB_TOKEN=$(gh auth token)` on the same command as every `pr-state` and `review` call, and the same line in the round brief.
- `gh auth status` can list several accounts, and the active one may not see the PR's repo (`gh pr view` fails with "Could not resolve to a Repository"; fetch and push are refused with "Repository not found"). Do not `gh auth switch`. Prefix each gh call with `GH_TOKEN=$(gh auth token -u <account>)`, give the CLI the same token as `GITHUB_TOKEN`, and run fetch and push with a per-command credential helper:

  ```text
  git -c credential.helper= -c credential.helper='!f(){ echo username=<account>; echo password=<token>; }; f' fetch <remote> <base> <branch>
  ```

  An `Authorization: Bearer` extraheader is rejected as invalid credentials.

## Who holds the branch

`git worktree add <branch>` is refused when the branch is checked out elsewhere. Find the holder first: `git worktree list`, and `lsof -a -d cwd +D <path>` says whether a live session sits in that worktree.

| Holder | What to do |
|---|---|
| A worktree another session is working in | Stop and say so |
| A registration whose directory is gone (a factory removes its worktree at `pr-open` without pruning; `git worktree list` still shows it) | `git worktree prune` from the main checkout, then add your own |
| A live factory worktree | Do not stop. `git worktree add --detach <abs path> <headRefOid>`, make and commit the fix there, and keep checking the holder. Once its worktree is gone: prune, then `git checkout -B <pr-branch>` in your worktree, which puts the branch at your commit without touching anyone's tree, and run the rounds from there |
| The person's primary checkout, dirty, on that branch | `git worktree add -b rl/<N> <abs path> <headRefOid>`; run every round from it (the CLI keys local state on the local branch name and never checks it against the PR) and push with `git push <remote> rl/<N>:<pr-branch>`. Never touch the primary checkout; tell the person their copy of the branch is now behind |
| An idle worktree from an earlier loop, at or ahead of the PR head | Usable. Ahead means unpushed fixes (SKILL.md step 2): gate and push them, never reset |

Your own worktree can be removed under you: a clean tree with no process in it looks idle to another session's disk sweep, and the harness then moves the cwd to the main checkout without a word. Check `ls -d <worktree>` before each step that writes, and keep the first commit close to the first edit. When the tree is gone, re-add it on the same branch; never carry on in the main checkout.

Another writer can also work in your tree, under your file names, and `lsof` misses a process that `cd`s per command. Before each commit, read the whole `git diff` against what you wrote (the diff stat alone passes), and rewrite any file you copied out of a shared tree from your own content. When a foreign write appears, move to a fresh worktree on `rl/<N>`, pushed as `rl/<N>:<pr-branch>`, and leave the shared tree alone: reverting under the other writer is worse than the duplication.

## A fresh worktree is not installed

- A worktree added by hand has no dependencies, no runner on `PATH` and no env file. Run the project's whole provision list (installs, the env file copy, key generation, whatever its setup script does) before the first gate run, not when the first test fails. A failing trace that starts inside the framework's bootstrap (an encryption key, a missing env value) is the provision, not the fix.
- Dependencies cloned from the main checkout (`cp -Rc`, instant on APFS) can be behind the lockfile: every failure then reads "class or module not found" for one package. Run the package managers' install in the worktree after cloning, and again after every merge of the base, before the suite: the merge can add a package. Against a cache it is quick.
- The runner is a project dependency. Install through the main checkout's copy (`<main checkout>/node_modules/.bin/<runner> i` from the worktree), then call the worktree's own `node_modules/.bin/<runner>` for every test, lint and format command, and prefix `PATH` with it for project scripts that expect the runner.
- A worktree under a folder the primary checkout's `.gitignore` ignores (`.worktrees/`) is invisible to formatters and linters that walk up to that file ("no files found", "excluded by ignore rules"), though the commit hook still formats. Format through stdin (`fmt --stdin-filepath=<f> < <f>`, write back only on a difference), lint with `--ignore-path <empty file>` or by directory, and let the pre-commit hook be the final format check.

## Before the first fix

- `gh pr checks N -R <owner/name>`, then `gh run view <id> --log-failed` for every red check; `references/ci.md` says how to read one. The PR's own red check is part of the loop: fix the gate in the round's commit, and regenerate and commit the generated files a catalogue or registry check reads. Run gate scripts without a pipe, or under `set -o pipefail`: `cmd | tail; echo $?` reports `tail`'s exit and hides a red gate for rounds. A background run (`suite > log; echo "exit $?" >> log; tail log`) notifies with `tail`'s exit too: end the wrapper with `exit $code`, and read the log's last lines before any push.
- The PR's test list covers tests beside the touched files. `git grep -l '<basename of each touched file>' -- '*.test.*'` and run every hit: a test that copies or bundles a touched file from another folder is red on the branch and in no list. A red one is round 1's bug, and the fix may have to stay dependency-free.
- Run the full suite on the head you adopt. A prior fix commit can have landed without it, and the rounds review the diff, not the suite. Any failure belongs to the first round's commit.
- A clean `merge-tree` does not mean CI's lint passes: CI lints the merge with the base, and the base can have gained lint rules the branch's config lacks. Run `git log HEAD..<remote>/<base> --oneline -- <lint config and rule paths>` (the linter's config, a rules folder, a budget file, `AGENTS.md`); when it lists anything, merge the base before the first round and lint under the merged rules.
- Read CI's runtime version (the workflow's version pin, the Dockerfile's `FROM`) against the local one. When the minor differs, run the analyser and the touched tests under CI's version too before each push: a static-analysis pass on one minor can fail on the other. Pin the analyser's target version to what the image ships rather than adding an inline ignore, which goes unmatched on the other version.

## A diff too big to review

A PR that merges an upstream by hand (a nightly sync) can have a `<base>...HEAD` diff of megabytes, and no round fits it. What needs review is the resolution, not upstream's code. Build a local base whose tree is upstream's side merged over the base, `git merge-tree --write-tree -X theirs <remote>/<base> <upstream ref>`, committed with `git commit-tree <tree> -p <remote>/<base> -p <upstream ref>`. On top of it put a local review branch with one commit per round that carries the PR head's exact tree (`git commit-tree <head>^{tree} -p <previous review commit>`). Run `review --base <synthetic> --head <review branch>`, and add a sentence to `--body` saying what the base is. The verdict holds for the pushed head because the trees are identical; say so in the report. Never push either branch.
