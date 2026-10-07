# Linear

For a repo whose `repos[]` entry in `~/.config/softfac/config.yml` has `tracker.kind: linear`. The team is `tracker.team` (a key such as `ENG`). Everything in `SKILL.md` still holds: four headings, one change per issue, proposed first, links before ready.

```yaml
repos:
  - repo: acme/widgets
    path: /Users/me/factory/acme/widgets
    tracker:
      kind: linear
      team: ENG
      token_file: /Users/me/.config/softfac/linear-token
```

`token_file` is the factory's own key. Never print it, never paste it anywhere.

## Who am I

File through the `linear` skill (the Linear MCP, your own login). Your Linear display name must be in `factory.instructors` of `{repo}/.dw/config.yml`: the factory matches instructors to display names, case-insensitively. Check with the skill's `get_user` or viewer call before filing. A `factory:ready` set by anyone else is refused back to `factory:proposed`.

## Create

Resolve the team by its key (`list_teams`), then `create_issue` with the title, the four-heading body, the team, and the label `factory:proposed`. No assignee, no state change: the factory refuses an assigned issue and claims from any state that is not completed or canceled. Capture the identifier (`ENG-42`) from the result.

Labels are the same seven as GitHub, on the team: `factory:proposed`, `factory:ready`, `factory:needs-info`, `factory:triage`, `factory:building`, `factory:pr-open`, `factory:stuck`. Only the first two are yours to set. A team missing them is not set up for the factory; `softfac repo add ... --tracker linear` creates them.

## Link a dependency (blocked by)

The factory reads a `blocks` relation on the blocked issue. Create it from the blocker to this issue, one per blocker, with the skill's relation call (`create_issue_relation` or the `update_issue` relations field, whichever the live schema offers):

```text
issue: ENG-41 (the blocker)  →  relatedIssue: ENG-42 (this issue)  type: blocks
```

Without the MCP, the GraphQL mutation is `issueRelationCreate(input: { issueId: "<blocker id>", relatedIssueId: "<this id>", type: blocks })`. A blocker in another team works the same way.

The factory does not read `KEY-n` text under `## Depends on` as a blocker. Prose there is for people; the relation holds the claim back.

## Verify

`get_issue` on the new issue: labels hold `factory:proposed` or `factory:ready`, `assignee` is empty, and its relations list every blocker as `blocks` pointing at it. In GraphQL that is `inverseRelations { nodes { type issue { identifier state { type } } } }`. A blocker whose `state.type` is not `completed` or `canceled` holds the claim.

## Mark ready

`update_issue`: remove `factory:proposed`, add `factory:ready`. For a `factory:stuck` issue, remove `factory:stuck` instead. The issue must have no assignee and must sit in a state that is not completed or canceled.

## Close the blocker when its work lands

The factory never closes issues. Make the blocker's pull request body say `Closes ENG-41`, so Linear's GitHub integration completes it on merge, or move it to a completed state by hand. Until then every dependant waits.
