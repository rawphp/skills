---
name: skills-hub
description: 'Operate the skills hub layout (source repo → hub → client symlinks), install or import skills, and wire agents to the hub. Use for skills hub, install skill, import from GitHub, wire Claude/Codex/Grok skills, or skill install.sh. Differentiator: machine layout and install path, not skill-writing craft.'
---

# Skills Hub

Skills shared by several agents on one machine use **one active hub**. Each client symlinks its skills directory to that hub. Skill *source* lives in a separate tree: your clone of this repo, written `$SKILLS_SRC` below (for example `~/src/skills`).

Always read `references/field-lessons.md` before acting.

## Layout (do not invert)

| Layer | Path | Role |
|-------|------|------|
| **Source** | `$SKILLS_SRC/<name>/` | Author, edit, git, import from upstream |
| **Hub** | `~/.agents/skills/` | Active install target |
| **Clients** | `~/.claude/skills`, `~/.codex/skills`, `~/.grok/skills` | **Directory symlinks → hub** |

```text
$SKILLS_SRC/<name>/     # source only
        │
        │  install.sh  (symlink into hub)
        ▼
~/.agents/skills/<name> → $SKILLS_SRC/<name>
        ▲
        │  whole-dir symlink
~/.claude/skills  ──┘
~/.codex/skills   ──┘
~/.grok/skills    ──┘
```

**Never** point the hub at `$SKILLS_SRC`. That tree is for authoring; half-finished edits would go live for every agent.

## State check (run first)

```bash
# Hub must be a real directory
ls -ld ~/.agents/skills
# Clients must be symlinks to the hub (skip clients you don't use)
ls -la ~/.claude/skills ~/.codex/skills ~/.grok/skills
# Expect each: .../skills -> <home>/.agents/skills
test "$(realpath ~/.claude/skills)" = "$(realpath ~/.agents/skills)"
test "$(realpath ~/.codex/skills)" = "$(realpath ~/.agents/skills)"
test "$(realpath ~/.grok/skills)" = "$(realpath ~/.agents/skills)"
```

If a client is a **real directory**, do not replace it until unique skills are merged into the hub. See [Wire a client](#wire-a-client-to-the-hub).

## Install a skill (source → hub)

1. Author under `$SKILLS_SRC/<name>/` with `SKILL.md` (frontmatter `name` matches the folder).
2. Ensure `install.sh` exists. Copy it from `references/install-template.sh` if missing and `chmod +x` it.
3. Run:

```bash
"$SKILLS_SRC/<name>/install.sh"
# → ~/.agents/skills/<name> → $SKILLS_SRC/<name>
```

Install straight into one client's directory (a single-agent setup, or a client that can't symlink to the hub):

```bash
AGENTS_SKILLS_HUB=~/.claude/skills "$SKILLS_SRC/<name>/install.sh"
```

The same variable points at a scratch hub for tests: `AGENTS_SKILLS_HUB=/tmp/test-hub`.

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
NAME=skill-name   # final folder name under $SKILLS_SRC

TMP=$(mktemp -d)
git clone --depth 1 --filter=blob:none --sparse "$REPO" "$TMP/repo"
git -C "$TMP/repo" sparse-checkout set "$SUBPATH"
mkdir -p "$SKILLS_SRC/$NAME"
cp -R "$TMP/repo/$SUBPATH/." "$SKILLS_SRC/$NAME/"
# Add install.sh if upstream lacks a hub-aware one
cp "$SKILLS_SRC/skills-hub/references/install-template.sh" "$SKILLS_SRC/$NAME/install.sh"
chmod +x "$SKILLS_SRC/$NAME/install.sh"
# If SKILL.md name: differs from $NAME, fix name or folder to match
"$SKILLS_SRC/$NAME/install.sh"
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
- Never wire clients to an empty hub while a client tree still holds the only copies.

## Uninstall (hub and plugin, not source)

1. Delete `~/.agents/skills/<name>` only if it is a symlink.
2. Plugin-packaged skill: uninstall it with the client's plugin command, then check the client's config no longer enables it. Grok, for example: `grok plugin uninstall <name> --confirm`, then remove `<name>` from `[plugins] enabled` in `~/.grok/config.toml` (uninstall can leave it there).
3. Remove any leftover symlink in a client that isn't wired to the hub, after checking it is not the only copy of unique content.
4. Leave `$SKILLS_SRC/<name>/` alone unless the user asked to delete the source.

## Publish / distribute

Installing into the hub is enough for every client whose skills directory symlinks to the hub. A client that can't use the hub needs its own install: run `install.sh` with `AGENTS_SKILLS_HUB` set to that client's skills directory.

## Anti-patterns

| Don’t | Do instead |
|-------|------------|
| Install into both `~/.claude/skills` and `~/.codex/skills` separately | Install once into hub |
| Author only in `~/.agents/skills` with no source tree | Author in `$SKILLS_SRC`, install to hub |
| Point the hub at `$SKILLS_SRC` | Hub stays `~/.agents/skills` |
| `cp -r` hub skill into a client that is already a symlink to hub | No-op / “are identical” — skip |
| Replace non-empty client dir without merge | Merge uniques, then symlink |
| Wire agents to an empty hub | Populate hub first |

## Failure modes

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Agent missing a skill | Not installed into hub | Run `install.sh` |
| Agent lists a skill but cannot read `SKILL.md` | Source moved or deleted; hub symlink left dangling | Delete dangling hub links; reinstall only skills still required |
| A client sees none of the hub's skills | Client is a real dir, not a hub symlink | Wire client (merge + symlink) |
| Install wrote to wrong place | Old dual-target `install.sh` | Replace with hub template |
| Edit in source not visible | Hub has a real copy, not a symlink to source | Re-run `install.sh` (symlink) |
| A client outside the hub misses a skill | That client keeps its own skills dir | Install into it with `AGENTS_SKILLS_HUB=<its dir>` |

## Output after a hub operation

Report briefly:

1. What changed (paths)
2. Hub entry: symlink target or real dir
3. Client realpath check (claude / codex / grok)
4. Any collisions or leftovers that need user choice
