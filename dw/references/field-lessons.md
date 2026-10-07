# dw field lessons

**Only lessons that improve the next /dw run.** Gate before every append:
**“Will this improve dw?”** — Yes → here (skill process: weight, isolate, tracker, review cycle, ship). No → project docs via session-capture.



- 2026-10-06 (tc-people PR #486): reviewing a stacked PR against its stack base missed that `main` had moved (a sibling PR renamed the same label again). Before dispatching reviewers on a PR whose base is not `main`, run `git log <base>..<main> --oneline`, and if it is non-empty, hand the drift commits to every persona as context and have `correctness` check the merged tree (`git merge-tree`), not just the PR diff.

- **Review of a stacked/factory PR: the remote branch can be force-rebased under you mid-run** (2026-10-06, tc-people #485: another session rebased `factory/security` onto a refreshed base while the fix cycles ran; the first push was refused). Before Ship, `git fetch` the branch and check `merge-base --is-ancestor <remote tip> HEAD`; if not, `git rebase --onto <remote tip> <old tip>`, then re-run the full gate on the rebased tip (the base changed, so earlier green runs do not count), then push. Drop any local-only test tweaks (private-DB `phpunit.xml`) before rebasing.
