---
name: skills-hub
description: 'Operate the skills hub layout (EA dev → hub → client symlinks), install/import skills, and wire agents. Use for skills hub, install skill, import from GitHub, wire Claude/Codex/Grok skills, or skill install.sh. Differentiator: machine layout/publish path — not skill writing craft.'
---

# Skills Hub

Portable multi-agent skills on this machine use **one active hub**. Clients symlink their skills directories to that hub. Skill *source* lives in a separate dev tree.

Always read `references/field-lessons.md` before acting.

## Layout (do not invert)

| Layer | Path | Role |
|-------|------|------|
| **Dev** | `~/EA/skills/<name>/` | Author, edit, git, import from upstream |
| **Hub** | `~/.agents/skills/` | Active install target (`sync_target` for agent-doctor) |
| **Clients** | `~/.claude/skills`, `~/.codex/skills`, `~/.grok/skills` | **Directory symlinks → hub** |

```text
~/EA/skills/<name>/     # dev only
        │
        │  install.sh  (symlink into hub)
        ▼
~/.agents/skills/<name> → ~/EA/skills/<name>
        ▲
        │  whole-dir symlink
~/.claude/skills  ──┘
~/.codex/skills   ──┘
~/.grok/skills    ──┘
```

**Never** set the hub to `~/EA/skills`. That tree is for development; half-finished edits would go live for every agent.

## State check (run first)

```bash
# Hub must be a real directory
ls -ld ~/.agents/skills
# Clients must be symlinks to the hub
ls -la ~/.claude/skills ~/.codex/skills ~/.grok/skills
# Expect each: .../skills -> /Users/.../.agents/skills
test "$(realpath ~/.claude/skills)" = "$(realpath ~/.agents/skills)"
test "$(realpath ~/.codex/skills)" = "$(realpath ~/.agents/skills)"
test "$(realpath ~/.grok/skills)" = "$(realpath ~/.agents/skills)"
```

If a client is a **real directory**, do not replace it until unique skills are merged into the hub. See [Wire a client](#wire-a-client-to-the-hub).

Optional health check (if installed):

```bash
agent-doctor status   # skills matrix should show agents on hub
```

## Install a skill (dev → hub)

1. Author under `~/EA/skills/<name>/` with `SKILL.md` (name matches folder). Follow `effective-agent-skills`.
2. Ensure `install.sh` exists — copy from `references/install-template.sh` if missing.
3. Run:

```bash
~/EA/skills/<name>/install.sh
# → ~/.agents/skills/<name> → ~/EA/skills/<name>
```

Override hub for tests only:

```bash
AGENTS_SKILLS_HUB=/tmp/test-hub ~/EA/skills/<name>/install.sh
```

Verify:

```bash
ls -la ~/.agents/skills/<name>
# Agents already wired to the hub pick it up without per-agent copies.
```

## Import from GitHub

```bash
# Example: single skill path in a monorepo
REPO=https://github.com/org/repo.git
SUBPATH=skills/path/to/skill-name
NAME=skill-name   # final folder name under ~/EA/skills

TMP=$(mktemp -d)
git clone --depth 1 --filter=blob:none --sparse "$REPO" "$TMP/repo"
git -C "$TMP/repo" sparse-checkout set "$SUBPATH"
mkdir -p "$HOME/EA/skills/$NAME"
cp -R "$TMP/repo/$SUBPATH/." "$HOME/EA/skills/$NAME/"
# Add install.sh if upstream lacks a hub-aware one
cp "$HOME/EA/skills/skills-hub/references/install-template.sh" \
   "$HOME/EA/skills/$NAME/install.sh"
chmod +x "$HOME/EA/skills/$NAME/install.sh"
# If SKILL.md name: differs from $NAME, fix name or folder to match
"$HOME/EA/skills/$NAME/install.sh"
rm -rf "$TMP"
```

More detail: `references/import-from-github.md`.

## Wire a client to the hub

Use when `~/.claude/skills` (or codex/grok) is a **real dir** instead of a hub symlink.

1. **List client-only names** not already in the hub:

```bash
HUB=~/.agents/skills
CLIENT=~/.codex/skills   # or .claude / .grok
comm -13 <(ls -A "$HUB" | sort) <(ls -A "$CLIENT" | sort)
```

2. **Move** those entries into the hub (preserve symlinks/dirs as-is). For name collisions, keep hub unless the user chooses otherwise; do not silent-overwrite different content without asking.

3. **Replace** the client path with a symlink:

```bash
# Only after every remaining name exists in hub
rm -rf "$CLIENT"    # client tree only — contents already merged or discardable
ln -s "$HUB" "$CLIENT"
```

4. **Verify** realpaths match (state check above).

Special cases:

- Codex may have `.system` under skills — move it into the hub so Codex still finds `skills/.system` via the symlink.
- Never `ln -s` over a non-empty client tree without the merge step.
- Never `agent-doctor fix --force` while the hub is nearly empty relative to a full client tree.

## Publish / distribute (related skill)

Installing into the hub is enough for Claude, Codex, and Grok **when their skills dirs already symlink to the hub**.

- Global “make every agent see this skill” → run that skill’s `install.sh` (this skill).
- Older multi-folder copy workflow and Hermes/Pi notes → `distribute-skill-to-all-agents` (thin; defers layout here).

## Anti-patterns

| Don’t | Do instead |
|-------|------------|
| Install into both `~/.claude/skills` and `~/.codex/skills` separately | Install once into hub |
| Author only in `~/.agents/skills` with no dev tree | Author in `~/EA/skills`, install to hub |
| Point hub / `sync_target` at `~/EA/skills` | Hub stays `~/.agents/skills` |
| `cp -r` hub skill into a client that is already a symlink to hub | No-op / “are identical” — skip |
| Replace non-empty client dir without merge | Merge uniques, then symlink |
| Force-wire agents to an empty hub | Populate hub first |

## Failure modes

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Agent missing a skill | Not installed into hub | Run `install.sh` |
| Agent lists a skill but cannot read `SKILL.md` | Source moved to archive; hub symlink left dangling | Delete dangling hub links after archive; restore only skills still required |
| `agent-doctor`: private tree / off hub | Client is real dir | Wire client (merge + symlink) |
| Install wrote to wrong place | Old dual-target `install.sh` | Replace with hub template |
| Edit in EA not visible | Hub has a real copy, not symlink to dev | Re-run `install.sh` (symlink) |
| Hermes/Pi missing skill | Separate from hub wiring | See `distribute-skill-to-all-agents` |

## Output after a hub operation

Report briefly:

1. What changed (paths)
2. Hub entry: symlink target or real dir
3. Client realpath check (claude / codex / grok)
4. Any collisions or leftovers that need user choice
