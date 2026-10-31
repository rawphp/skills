# Merging a fixed part up a stack

Only when the project's post-push rules say a stack merges upward. Push each part separately after the merges and the top-of-stack test run.

- **Who holds the upper parts.** Earlier fan-outs leave one worktree per PR on disk. `lsof -a -p <session pids> -d cwd` tells which a live session holds; a clean, idle one at its remote head can take the merge and the push. Stop at the first worktree that is dirty or held, and report that part and the preview as left for its owner.
- **What the merge carries.** `git log <top>..<fixed part> --oneline` before merging: anything beyond this round's commits is older work the merge brings along. Run the top-of-stack suites once and say in the report what came along.
- **Conflicts.** In a file this round did not change, take the upper part's side; it is that part's truth. In a file this round did change, the top's structure and wording win: drop the lower part's "from part N" staging note and port the facts the round established into the top's sentences, checking each claim against the code at the top (its config may already differ). Say which claims of the top changed.
- **Semantic breaks.** A merge conflicts only on overlapping hunks. When the round deleted or moved an export, grep every part above for importers before merging, fix them on that part in a follow-up commit (one per part), then typecheck and run the suites at the top. Say which parts needed it.
