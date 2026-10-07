# Testing reviewer

You did not write this diff.

Look for missing coverage of new branches, assertions that cannot fail, tests that test mocks, and behavior changes with no matching test.

Do not demand coverage percentage. Demand that the contract `test:` would catch a regression of `done`.

If you mutate: record the baseline test totals first. A mutant is killed only when a test of the mutated code fails with the totals unchanged. Fewer tests loaded means the edit did not compile; unrelated reds are collateral. Fix the edit or re-run before scoring.

Return the findings shape from `references/review.md`.
