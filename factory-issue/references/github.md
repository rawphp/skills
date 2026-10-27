# GitHub Issues

`OWNER/REPO` is the repo the watching factory names. All commands use `gh`. Pass `-R OWNER/REPO` on every call, read-only checks included: in a checkout with several remotes (a fork with `upstream`) a bare call can answer for the wrong repo and look clean. To act as the factory's own login, prefix `GH_CONFIG_DIR=<gh_config_dir>`. Do not export `GH_TOKEN` in a script that also sets `GH_CONFIG_DIR`, because `GH_TOKEN` wins.

## Who am I

```sh
gh api user -q .login          # must be in factory.instructors of {repo}/.dw/config.yml
```

## Labels

Labels: `factory:proposed`, `factory:ready`, `factory:needs-info`, `factory:triage`, `factory:building`, `factory:pr-open`, `factory:stuck`. Only the first two are yours to set; the factory writes the rest. The `type:*` labels (`SKILL.md` step 3) are this skill's own; the factory ignores them.

A watched repo can still lack them. Check before filing, or every create fails on the label:

```sh
gh label list -R OWNER/REPO --limit 200 --json name --jq '.[].name' | grep -E '^(factory|type):'
```

Create missing `factory:*` labels with the colours in the factory's add-a-repo guide (`factory/site/guide/add-a-repo.md` in t3code-factory), for example `gh label create factory:proposed -R OWNER/REPO --color c5def5`. Create missing `type:*` labels with these colours, one command each:

| Label | Colour |
|---|---|
| `type:feat` | `a2eeef` |
| `type:fix` | `d73a4a` |
| `type:refactor` | `5319e7` |
| `type:docs` | `0075ca` |
| `type:chore` | `ededed` |

## Create

Write the body to a file first; it keeps headings and code fences intact.

```sh
gh issue create -R OWNER/REPO --title "<type>: <outcome in one line>" --body-file body.md --label factory:proposed --label type:<type>
```

## Link a dependency (blocked by)

GitHub dependency relationships are what the factory reads first. The REST call takes the blocker's **node id**, not its number, and needs `-F`: `-f` sends the id as a string and the call returns 422.

```sh
BLOCKER_ID=$(gh api repos/OWNER/REPO/issues/<blocker> --jq .id)
gh api -X POST repos/OWNER/REPO/issues/<dependant>/dependencies/blocked_by -F issue_id=$BLOCKER_ID
```

The POST echoes the dependant's number, not the blocker's, so its output does not confirm the link; Verify does. A blocker in another repo works the same way with that repo's path in the first line.

In the web UI: issue sidebar → Relationships → "Mark as blocked by".

To remove a link: the machine's dangerous-command guard blocks a `DELETE` through `gh api`. The guard also matches the DELETE text inside an `echo`, so never print it from a script. Do the rest of the edit, then write this line in your reply for the user to run with `!`, or point at the sidebar's Relationships. The issue can sit at `factory:ready` meanwhile, since a link only holds the claim back.

```sh
gh api -X DELETE repos/OWNER/REPO/issues/<dependant>/dependencies/blocked_by/<blocker id>
```

## Sub-issues (parent and children)

```sh
gh api -X POST repos/OWNER/REPO/issues/<parent>/sub_issues -F sub_issue_id=<child .id>
```

The parent gets no `factory:*` label: a proposed parent gets bulk-flipped to ready and goes stuck. No child names the parent under `## Depends on`. Verify with `subIssues(first:N){ nodes{ number } }` on the parent.

## Verify

```sh
gh api graphql -f query='query{ repository(owner:"OWNER",name:"REPO"){ issue(number:<dependant>){ blockedBy(first:10){ nodes{ number state } } } } }' --jq '.data.repository.issue.blockedBy.nodes'
gh issue view <n> -R OWNER/REPO --json labels --jq '[.labels[].name]'
```

`blockedBy` must list every issue named under `## Depends on`. `state: OPEN` means the factory waits each pass and claims nothing; `CLOSED` clears it.

## Mark ready

```sh
gh issue edit <n> -R OWNER/REPO --remove-label factory:proposed --add-label factory:ready
```

For a `factory:stuck` issue, remove `factory:stuck` instead. The issue must have no assignee.

## Close the blocker when its work lands

The factory never closes issues. Make the blocker's pull request body say `Closes #<blocker>`, or close the issue by hand after the merge. Until then every dependant waits.
