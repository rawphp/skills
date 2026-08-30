# Field lessons

## 1. Write + delete with no read is an unfinished cutover

Symptom: a new store is inserted on the write/drain path and only `delete()`d after compact/commit.

Cause: the snapshot/read side never switched, or the old store was never stopped. Tests that only assert the row is gone do not prove the store is live.

Default: cite the write call-site and the compact/read call-site. If compact does not read the body, either complete the merge or delete the write.

Same miss when a mint/insert happens on start and the redeem/read endpoint returns empty or unused. The row existing is not a live contract.

Daemon/helper variant: tests that name the production join (`Add` then `MarkAlive`, parser X is the stream) do not prove the daemon calls those helpers. Cite the `cmd/` / supervisor call-site. Isolation tests plus an unused helper are incomplete cutover, not a residual sibling verb.

## 2. Integration of similar tickets: judge the merged duplication

Symptom: each commit looks local (one widget, one spec), but the branch range is N copy-paste REQs plus a late shared helper that the early files never adopted.

Cause: reviewing files as if they were still separate tickets. After merge, the harness/table that landed last is the simpler shape for all of them.

Default: when the range is an integration of similar tickets, treat cross-file clones as in-scope spaghetti even if no single commit introduced the whole mess. Ask whether the last extracted helper should have absorbed the earlier copies.

## 3. New worker plus HTTP plane: walk the contract table first

Symptom: a new client/daemon looks tidy file-by-file, while the HTTP plane already has pull, ack, material, events, heartbeat, complete, stop.

Cause: reviewing packages in isolation. The join is the product. A start-only loop plus a full route table is unfinished cutover, not a missing feature list.

Default: list the machine-facing endpoints, then check each one has a live client call and a live read of the result. Fail incomplete joins before local style. A method that only the fake implements does not belong on the production interface.

When a pull/ack path uses an allowlist to strip secrets, diff that list against the writer keys in the same pass. Writer-side tests that the extra keys are stored, plus pull tests that the allowlist is closed, can both stay green while the live reader never sees the fields. Complete the allowlist or delete the writes.

## 4. Re-read production files before the findings write

Symptom: a long deep pass cites line numbers and helpers that no longer match the tree.

Cause: the working tree moved (or a first read was cached) while the review was still walking tests and the peer HTTP plane.

Default: immediately before writing findings, re-read every production file in scope. If a helper appeared mid-pass, grep its call-sites again. Do not ship citations from the opening read.

## 5. A paste recipe is not the extracted helper

Symptom: an integration of similar tickets ends with a docs "Copy this" block and/or a source-scan test table over N files, while production still has N copies of the same overlay.

Cause: the last extract documented the clone instead of absorbing it. Lesson 2's "last helper" is then a template, not a shared implementation.

Default: the thing that should have absorbed earlier copies is one stylesheet or the shared primitive. Treat a paste recipe or per-file source-scan table as evidence of unabsorbed clones, not as the simplification.
