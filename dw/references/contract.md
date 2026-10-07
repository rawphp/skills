# Contract

Load at step 2.

Copy the user's brief. Do not improve it.

## S

One sentence: what changes, which files.

## M (chat, then act)

Five lines, then implement. Do not write a file.

```text
done: <observable outcome>
out: <what is not in this unit>
risk: <none | auth | data | api | …>
test: <command>
files: <paths>
```

Optional `settled:` lines. Later Check/Make must not invert them.

`test:` must be able to fail `done`. For client-rendered UI, point it at a test that mounts or renders the changed UI, not an HTTP shell/component-name assertion that stays green when the copy is gutted.

The gate is `test:` plus every step the CI config runs (`.github/workflows/*`: lint, format, typecheck, build). Run them all before the first push. A gate you wrote yourself (an `rg` check, a script): run it on the base tree first. It must return the known hits and nothing else.

Contract change mid-unit (user edits a line): never send it into a running worker — mid-turn text arrives beside a tool result and a careful worker rightly refuses it. Write it into the next packet (Check-fix or a `-change` packet), say whose decision it is and that it overrides the earlier line, and send the pointer only when the worker is idle.

## L + scope

Write `{repo}/.dw/contract.md` with the same fields plus `settled:`. If that file already holds another unit's unshipped contract, write `{repo}/.dw/contract-<slug>.md` and leave the other alone. Stop until the user says go. Then create the workset (`brief.md`). Delete the file after Ship (it lives on the PR receipt).

## Tracker

`set_files` from `files:`. Split: one contract (or one REQ) per disjoint set.
