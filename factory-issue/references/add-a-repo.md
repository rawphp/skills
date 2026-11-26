# Adding a repo to factory-runner

factory-runner has no add-a-repo guide; the steps are in the comments of `~/.local/share/factory-runner/current/config.example.yml`. In order:

1. **All seven `factory:*` labels**, before anything goes `ready`. With `factory:triage` missing, the claim fails and the runner puts the issue back to `factory:proposed` on every pass. Copy names, colours and descriptions from a watched repo: `gh label list -R <watched> --json name,color,description`.
2. **A runner-only clone** at `~/factory-runner/<owner>/<repo>`, added as a Paradev project (`superset projects create --local --import <path>`).
3. **A `factory` block in `.dw/config.yml` on the default branch.** A block only in the checkout leaves the session with no config. Before calling that commit "no runtime effect", check whether the default branch deploys on push (compare merge times with release times on the server). If it does, the block's pull request is the owner's to merge, and the report names that merge as the blocker.
4. **A target:** `hosts` or `cloud`. Before giving a repo a cloud target, start a workspace from its environment and run the factory block's `provision` and `gate` once. The base image has git and node only; install any missing runtime and save it into the environment (`superset environments replace <env> --workspace <id> --yes`), or the first run goes stuck on provision.
5. **The `repos:` entry** in `~/.config/factory-runner/config.yml`.
6. **`launchctl kickstart -k`** the LaunchAgent, with no gate running.

The first pass logs `repo skipped` with the reason in `~/Library/Logs/factory-runner/runner.log`. Then check the target with `bin.ts status` (SKILL.md step 1).
