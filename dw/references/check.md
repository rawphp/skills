# Check

Load at step 4. This is a loop, not a report.

```text
tests green
  → review (persona batch)
      → no actionable findings → Ship
      → findings → Make → tests → review
until: no findings | cycle == 5 | user interrupt
```

## 1. Tests

Run the contract `test:` command from the worktree. Red → Make (counts toward Make's 3-strike, not the review cycle).

**S mechanical:** green (or no tests needed, say why) → Ship. No roster.

## 2. Review (M/L)

Load `references/review.md`. Dispatch the native roster on the unit diff. Maker does not play a persona. Checker model: `references/models.md`. Heartbeat `step: Check r<N>` as wave N goes out.

An AC with no test (docs, visual): verify it yourself and `check_ac` with `screenshot <path>` or `verified <file:line>`.

## 3. Feed into Make

Actionable in-scope findings become the next Make contract. Heartbeat `step: Fix r<N>`. Re-run tests. Blockers cannot be skipped.

A blocker or action finding that shows a ticked AC is not met: `check_ac` it `checked: false`, evidence `<finding id>: <one line>`. Make re-ticks it after the fix.

**Split sibling shipped first:** merge the integration branch into this unit's branch, resolve, run the suites there, and tell the next reviewers what the merge touched — conflict resolution must not land on integration unreviewed. At Ship, `git diff --quiet HEAD <unit-branch>` after the `--no-ff` merge proves the merged tree is the reviewed tree. If the tracker refuses a second claim on a shared file, give that unit its own file rather than editing outside the footprint.

When that Make is green, commit the cycle (`references/commits.md`, `fix(<id>):`) **before** the next review wave. Reviewers must see the tip that includes the fixes.

## 4. Cycle

Cycle starts at 1 after the first review. Empty actionable set → Ship. Else review again.

**Max 5.** At 5 with findings still open: `set_req_status` stopped, stop the heartbeat loop, list leftovers, do not archive, do not open a "good enough" PR unless the user interrupted with **ship**.

## 5. Interrupt

After a review report, before the next Make, honor:

| User says | Action |
|-----------|--------|
| stop / enough / leave it | Keep as partial. Leave claimed or `stopped` as they said. No PR unless they also said ship. |
| ship | PR with remaining **non-blockers** on the receipt. Blockers still refuse unless they named those leftovers. |

Do not ask every cycle. Only interrupt when they speak.

Receipt fields: `maker`, `checker`, `review_cycles`, findings fixed, leftovers.
