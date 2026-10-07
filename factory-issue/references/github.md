# GitHub Issues

`OWNER/REPO` is the repo's `origin`. All commands use `gh`. When the factory has its own `gh` login on this machine (`gh_config_dir` in `~/.config/softfac/config.yml`), prefix with `GH_CONFIG_DIR=<that dir>` to file as that login.

## Who am I

```sh
gh api user -q .login          # must be in factory.instructors of {repo}/.dw/config.yml
```

## Create

Write the body to a file first; it keeps headings and code fences intact.

```sh
gh issue create -R OWNER/REPO --title "<outcome in one line>" --body-file body.md --label factory:proposed
```

Labels: `factory:proposed`, `factory:ready`, `factory:needs-info`, `factory:triage`, `factory:building`, `factory:pr-open`, `factory:stuck`. Only the first two are yours to set; the factory writes the rest. A repo missing them is not set up for the factory.

## Link a dependency (blocked by)

GitHub dependency relationships are what the factory reads. The REST call takes the blocker's **node id**, not its number.

```sh
BLOCKER_ID=$(gh api repos/OWNER/REPO/issues/<blocker> --jq .id)
gh api -X POST repos/OWNER/REPO/issues/<dependant>/dependencies/blocked_by -F issue_id=$BLOCKER_ID
```

A blocker in another repo works the same way with that repo's path in the first line.

In the web UI: issue sidebar → Relationships → "Mark as blocked by".

## Verify

```sh
gh api graphql -f query='query{ repository(owner:"OWNER",name:"REPO"){ issue(number:<dependant>){ blockedBy(first:10){ nodes{ number state } } } } }' --jq '.data.repository.issue.blockedBy.nodes'
gh issue view <n> -R OWNER/REPO --json labels --jq '[.labels[].name]'
```

`blockedBy` must list every issue named under `## Depends on`. `state: OPEN` means the factory will print `<repo>#<n> ready: blocked by #<m>` each pass and claim nothing; `CLOSED` clears it.

## Mark ready

```sh
gh issue edit <n> -R OWNER/REPO --remove-label factory:proposed --add-label factory:ready
```

For a `factory:stuck` issue, remove `factory:stuck` instead. The issue must have no assignee.

## Close the blocker when its work lands

The factory never closes issues. Make the blocker's pull request body say `Closes #<blocker>`, or close the issue by hand after the merge. Until then every dependant waits.
