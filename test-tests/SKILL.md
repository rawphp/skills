---
name: test-tests
description: Use when reviewing tests in a PR or auditing a test suite for tests that lie, meaning tests that are green without proving behaviour. Triggers include green CI on code that later broke, tests written by an agent, a PR that adds or changes tests, "are these tests any good", "check the tests", "test the tests", "tautological test", or "this test can't fail". Differentiator: judges whether a test could catch a real bug, not whether it passes or whether coverage is high.
---

# Test tests

Automated checks are cheap, so we stack them. They also lie. A green suite only means every test passed, not that any test could have failed. This skill finds the tests that cannot catch a bug and fixes or deletes them, so the checks above them (agent review, human review) have less to catch.

Read `references/field-lessons.md` first if it exists.

## Scope

- **PR review:** only tests the diff adds or changes (`git diff <base>...HEAD -- '**/*test*' '**/*spec*'` plus any test file whose subject changed).
- **Suite audit:** every test file. Work by directory, largest change-rate first (`git log --format= --name-only | sort | uniq -c`).

Say which scope you ran in the verdict.

When you fan the reading pass out to reviewers, have each one write its report from the start to a file named for this run (`/tmp/test-tests-<repo>-<date>-<area>.md`) and return only the path. Long reports get truncated in the completion notice, and same-named files from an earlier run look like this run's output.

## The three lies

Each test gets one question: **what bug would make this fail?** If the answer is "none" or "only a rename or reformat", it lies.

| Lie | What it looks like | Why it is harmless to bugs | Fix |
|---|---|---|---|
| **Tautological** | Asserts a value that is copied from the implementation. `expect(LIMIT).toBe(280)`. Snapshot of a constant. Asserting a mock returns what the mock was told to return. | Implementation and expectation are the same fact written twice. The only way it fails is editing the constant, which is not a bug. | Test the behaviour the value drives: `truncate("a".repeat(500)).length <= 280`. Delete the constant test. |
| **Structure-sensitive** | Reads source files as text, asserts on string positions, import order, private method names, call order of internal collaborators, DOM order of components by inspecting code rather than rendered output. | Breaks on reformat, rename, or reorder. Does not break when the user-visible behaviour breaks. | Test through the public interface: render it and query what the user sees, call the exported function and check its result. |
| **Cannot fail** | Subject's dependency stubbed with happy-path fakes that hide every error mode. The function under test is itself mocked. No assertion, or only `toBeDefined()` / "does not throw". `expect(true).toBe(true)`. Caught exceptions swallowed. | Every path the test can take ends green. The stub removed the conditions under which the real code fails. | Assert on an observable result (returned value, emitted event, DOM, persisted row). Replace the stub with a fake that has the real failure modes, or move the test up to an integration boundary. |

Grey areas that are usually fine: asserting a mock was called when the call *is* the behaviour (an email was sent, a webhook fired). Asserting an error is thrown for bad input. Snapshot tests of rendered output when the snapshot is reviewed.

## Verify by sabotage

Reading catches most lies. Running catches the rest. For every test you suspect, and for any test guarding money, auth, data deletion or outbound messaging, run the probe. A predicted probe result is a hypothesis, not a finding; run the probe before rewriting the test.

1. Break the behaviour the test claims to protect. Change the real logic, not the constant it compares against. Off-by-one, wrong branch, drop a line.
2. Run that test. **Green means it lies.** Note the exact edit that stayed green.
3. Revert. Then do a harmless edit the test should survive: rename a private symbol, reorder two independent lines. **Red means structure-sensitive.**
4. Revert.

Keep the probes to the tests under review. Run each against the narrowest, fastest-building target (for example `cargo test --lib <name>` before a `tests/*.rs` binary), and batch probes that share a build.

Revert a probe from a copy of the file taken before the edit, or commit each test fix before probing it. Never revert with `git checkout`: when tests live in the same file as the code, it also wipes the uncommitted test fix. Do not leave sabotage in the tree; `git diff` must be empty of probe edits before you report.

If the toolchain cannot run here, say so and report reading-only findings. Do not claim a probe you did not run.

## Fix, do not comment

The default output is a commit, not a review comment. For each lying test:

- Rewrite it to assert behaviour through the public interface, or
- Delete it when the behaviour is already covered or is not worth a test, and say which.

Leave a comment only for a question a human has to answer (for example, "this stub hides `AudioContext` suspended-state errors; do we handle those in prod?").

When the fix needs a design change (a module too shallow to test at its interface, a hidden dependency with no seam), stop at the finding and name the seam that is missing. That is a codebase-design job, not a test rewrite.

## Verdict shape

```
Scope: PR diff (4 test files) | suite audit (N files)
Probed: 3 tests by sabotage, toolchain: vitest

Lies found:
- test/limits.test.ts "has the X post character limit" — tautological. Fixed: deleted, truncation test already covers it.
- test/PitchDetailPage.test.ts "renders video after plan" — structure-sensitive (reads source text). Fixed: render + query section order.
- test/useAudioBoost.test.ts both tests — cannot fail (stubbed AudioContext, no assertions). Probe: removed gain wiring, stayed green. Fixed: assert gain value and connect chain on a fake with suspended-state error.

Honest: test/invoice.test.ts (probe: changed rounding, went red).

Open question for human: ...
```

## Red flags while reviewing

- "It's just a constant test, it's harmless." Harmless to bugs, costly to every rename. Delete it.
- "Coverage is 100%." Coverage counts lines executed, not bugs catchable.
- "The test passes." That is the symptom, not the evidence.
- "Mocking is standard here." Mocking the collaborator is fine. Mocking away its failure modes is the lie.
- "I'll flag it in a comment." Default is commit. Comments are for questions.
