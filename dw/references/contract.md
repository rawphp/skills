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

Contract change mid-unit (user edits a line): never send it into a working pane — mid-turn text arrives beside a tool result and a careful worker rightly refuses it. Write it into the next packet (Check-fix or a `-change` packet), say whose decision it is and that it overrides the earlier line, and send the pointer only when the pane composer is idle.

## L + scope

Write `{repo}/.dw/contract.md` with the same fields plus `settled:`. Stop until the user says go. Then create the workset (`brief.md`). Delete the file after Ship (it lives on the PR receipt).

## Tracker

`set_files` from `files:`. Split: one contract (or one REQ) per disjoint set.
