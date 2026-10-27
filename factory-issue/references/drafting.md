# Drafting the body

The session sees only the issue body and its own repo's checkout on `base`. Each check below closes a gap that sent a real issue to `factory:needs-info`.

## Ground the brief before the criteria

- **Reproduce a bug report** the way the user ran it. If it works, ask where they saw the failure. A failure only an app or a background job sees: rerun as it runs, `env -i HOME=$HOME PATH=/usr/bin:/bin <cmd> </dev/null`. Put the reproduction in `## Notes`. When the fix renames or repurposes a command a script calls, the script change is a criterion.
- **Measure a vague ops brief** (`du` the dirs, read recent status and log lines, grep the docs for what is already handled) before cutting it into issues.
- **Diff a design image** element by element against the code. Say in `## Outcome` what already matches and must stay, and in `## Notes` which image-only text stays off the screen.
- **Quote a CI failure from the job log of base's latest run** (`gh run view <id> -R OWNER/REPO --json jobs`, then `--log | rg -i "<term>"`), not from a comment or an audit report, whose evidence goes stale within a day.
- **Check every claim about existing code.** Trace each field a screen shows to the response type, each HTTP status a criterion names to the framework's exception mapping, each path to the conventions of the code that has landed, each env or config key a fix names to the code that reads it. Settle each mismatch in the criteria and name the settled choices in the report.
- **Read the newest spec**, from the default branch on `origin`, not a stale local copy. Find designs a spec names but the repo lacks (grep `~/.claude/projects/<project>/*.jsonl` for the phrase and for `.html` paths). Quote copy from the mock's text instead of paraphrasing it, and check the mock's screens and buttons against the issues so none is unowned.
- **When the spec line is the error** (a contradiction with code on base, a stale path), add a criterion that fixes the spec and plan lines too, or the next issue citing that section bounces the same way.

## Put on base or in the body everything the session needs

- **A repo path in a criterion must be tracked:** `git ls-files --error-unmatch <path>`. Reading a file only proves it is on disk.
- **A spec, plan or mock not on base yet:** commit it beside the spec first, or open a no-label tracking issue, put `Closes #N` in the PR that adds it, and block every build issue on #N so they can all go `ready` now. A plan that will not be committed: paste its shared rules and out-of-scope list into every body's `## Notes`.
- **Evidence the session cannot reach** (a raw reply, a fixture, your scratchpad) goes into `## Notes`. Pin an open PR by head and base SHA, since its branch goes away on merge. Content from another repo: pin the source SHA and give the read command, `gh api "repos/O/R/contents/<path>?ref=<sha>" -H 'Accept: application/vnd.github.raw'`, plus "stop needs-info if unreadable". Check the factory login can read that repo (`GH_CONFIG_DIR=<dir> gh repo view O/R`); when it cannot, commit a pinned snapshot into this repo first (a `reference/` folder with a SHA table, secrets grepped out) and point the body there. A copy-a-template change gets a `diff` against the source at that SHA as its criterion.
- **Write cross-repo refs as `owner/repo#N`**; a bare `#N` links to this repo's issue. Keep them under `## Notes` unless they should block.
- **The code the issue changes must exist on the branch it builds from** (`factory.base`, or the `## Base` branch). `git grep` that branch for every class, capability, method or pattern a criterion treats as existing. Each miss is a sibling to add under `## Depends on` and link, or something this issue builds. When answering such a needs-info, prefer the dependency over a split unless the standalone half delivers the outcome alone.

## Criteria

- **Settle every open choice** before `ready`: a range to one value, rounding ties, which data rule each field takes. Give a worked example's inputs in the units the rule takes, and write the expected numbers.
- **A removal lists its consumers.** Before "delete X", grep every import and entry point of X, give each consumer its fate as a criterion (one owned by a building sibling keeps its contract untouched), and close with a grep that must print nothing.
- **Seed derived data through the domain.** A seed criterion that names a column the domain recomputes (a flag, a counter, a snapshot) must say the seed writes through the domain's own write path, with a fixed clock, and which inputs make the rule fire. Read the recompute class first; a hand-written value is erased by the next write.
- **Keep each criterion buildable inside this issue.** Say where a named setting is stored. When its screen belongs to another issue, move the requirement there instead of splitting it.
- **Run every check command** on the current base and confirm the stated pre-change output. A criterion that says a fix command will clear something (an audit fix, an auto-upgrade) must be proven too; when it falls short, name the exact change instead. Anchor a grep to the lines the change touches, so comments do not match.
- **Size the work to `limits.minutes`** (default 180). Split a larger one, or write the split rule into the body.
- **Out of scope, ops after merge:** steps the build must not do (a production re-sync, an admin action in a third-party tool) go under that line in `## Notes`, or the session tries them or bounces.
- **Approvals the session cannot ask for:** when the build needs a browser, a dev server or computer use and the repo's `AGENTS.md` says ask first, get the maintainer's yes in the chat and write "The maintainer has approved …" in `## Notes`. Split the part that needs it into its own issue, blocked by the rest. A value only an owner can create (a client ID): park at `factory:proposed` with a "pending, stop needs-info if still pending" line, and fill it before `ready`.

## Splitting for parallel builds

- **Split a big spec by layer** (storage, endpoint, UI) with chained links. All go `ready` at once and only the bottom is claimable.
- **Give shared files their own early issue** (a bootstrap with registration hooks, the schema, the shared UI system), so later issues add files instead of editing one. Fix shared names (routes, events, helpers) in the bodies so parallel issues agree.
- **Name the anchor for every shared-file touch** ("register the route directly after the `x` line"), a different one per issue, and prefer a new file per issue (an invokable controller) over methods added to one shared class. Then chain only issues that must edit the same function or component. A frontend issue gets its backend twin's API contract in `## Notes`, so the two build side by side.
- **A rule a test enforces, with siblings converting the old code:** file the rule first as a small issue whose test carries an exemption list, each line naming the sibling that removes it (a prefix entry covers code in-flight issues still add). Make the test fail on a stale exemption, so each sibling deletes its own line. Every later issue then depends only on the rule issue.
- **Porting code:** list each ported file's imports across directories before cutting. A file that imports code a dependant issue owns means the cut is wrong: move the shared classes down into the lower issue, strike them from the dependant, and park the rest as a `factory:proposed` + `postponed` sibling once you have checked who consumes it.
- **Before adding a criterion, grep the sibling bodies for it**, and put it in the issue that already owns that file or row. Two issues writing one row build conflicting code.

## Special cases

- **Adds a `.github/workflows/` file:** check the factory login's token has the `workflow` scope (`GH_CONFIG_DIR=<dir> gh auth status`), every secret it reads is visible (`gh secret list -R OWNER/REPO`, `gh api repos/O/R/actions/organization-secrets`), and a private action grants access (`actions/permissions/access`). State each result in `## Notes`.
- **Makes a new status or check appear on PRs:** check whether the base branch requires it (`gh api repos/O/R/rules/branches/main --jq '.[] | select(.type=="required_status_checks")'`; no output means none) and say so in `## Notes`.
- **An issue a bot keeps updated:** a rename by a non-instructor after `ready` stops the build as stuck. Check the workflow's schedule against the build time, and refresh the body from the bot's latest comment as an instructor, since the session reads the body, not the comments.
