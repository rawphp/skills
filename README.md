# Agent Skills

A collection of **agent skills** for Claude Code, Codex, Grok, and other [Agent Skills](https://agentskills.io)–compatible clients.

Each folder is one skill: a `SKILL.md` (instructions + routing description) plus optional `scripts/`, `references/`, and assets. Skills are portable runbooks the agent loads only when relevant — not always-on system-prompt bloat.

This repository is the **source** tree. Agents typically do not read it in place. Finished skills install into a shared hub that every wired client sees.

## Layout

| Layer | Path | Role |
|-------|------|------|
| **Source** | `<this-repo>/<name>/` | Author, edit, version control |
| **Hub** | `~/.agents/skills/` | Active install target |
| **Clients** | `~/.claude/skills`, `~/.codex/skills`, `~/.grok/skills` | Directory symlinks → hub |

```text
<path-to-this-repo>/<name>/     # edit here
        │
        │  install.sh
        ▼
~/.agents/skills/<name>  →  <path-to-this-repo>/<name>
        ▲
~/.claude/skills  ──────────┘
~/.codex/skills   ──────────┘
~/.grok/skills    ──────────┘
```

**Never** point the hub at this repository root. Half-finished edits would go live for every agent. Author in the clone, install to the hub when ready.

Hub layout, client wiring, and import-from-GitHub details: [`skills-hub`](./skills-hub/SKILL.md).

## Install a skill

From a clone of this repo:

```bash
./<name>/install.sh
# → ~/.agents/skills/<name> → absolute path of ./<name>
```

Override hub for tests:

```bash
AGENTS_SKILLS_HUB=/tmp/test-hub ./<name>/install.sh
```

Publish for every hub-wired agent after a skill is finished:

```bash
# Same as install.sh once clients symlink the hub
./<name>/install.sh
```

Verify:

```bash
ls -la ~/.agents/skills/<name>
ls -la ~/.claude/skills ~/.codex/skills ~/.grok/skills
# Each client path should resolve to ~/.agents/skills
```

## Skill anatomy

```text
my-skill/
├── SKILL.md          # Required: YAML frontmatter + instructions
├── install.sh        # Symlink into ~/.agents/skills
├── scripts/          # Optional: CLIs and helpers
├── references/       # Optional: detail loaded on demand
└── assets/           # Optional: templates, static files
```

Frontmatter `name` must match the folder name. The `description` is the routing contract (what + when + differentiator) — agents only see that until the skill loads.

Installer template: [`skills-hub/references/install-template.sh`](./skills-hub/references/install-template.sh).

## What’s in here

| Skill | Purpose |
|-------|---------|
| [`skills-hub`](./skills-hub/SKILL.md) | Source / hub / client layout, install, import from GitHub |
| [`dw`](./dw/SKILL.md) | Dark-factory work loop: brief → worktree → TDD → review → PR |
| [`factory-issue`](./factory-issue/SKILL.md) | File GitHub or Linear issues the software factory can build |
| [`code-review`](./code-review/SKILL.md) | Maintainability review of a branch or PR (light / medium / deep) |
| [`release-safe`](./release-safe/SKILL.md) | Release gate for breaking changes and client-visible risk |
| [`branch-ship-loop`](./branch-ship-loop/SKILL.md) | Loop code-review and release-safe until a branch is ship-ready |
| [`devils-advocate-loop`](./devils-advocate-loop/SKILL.md) | Multi-round critic ↔ builder loop on a design or rollout plan |
| [`product-demo-record`](./product-demo-record/SKILL.md) | Record a live product walkthrough as a screen tape |
| [`product-intro-video`](./product-intro-video/SKILL.md) | Narrated product intro video with voice-over, captions, music |
| [`pr-brief-video`](./pr-brief-video/SKILL.md) | Two-minute reviewer brief video for one pull request |

## Create a new skill

1. Copy structure from a small existing skill.
2. Folder name = `name` in `SKILL.md` frontmatter (lowercase, hyphens).
3. Write description first (what / when / differentiator + trigger phrases).
4. Keep `SKILL.md` lean; push detail to `references/` and logic to `scripts/`.
5. Add `install.sh` from the hub template if missing.
6. Install and smoke-test routing + execution with a real agent.

```bash
cp skills-hub/references/install-template.sh my-skill/install.sh
chmod +x my-skill/install.sh
./my-skill/install.sh
```

## Conventions

- **One skill, one concern.** Compose at runtime; don’t ship mega-workflows.
- **Description routes; body executes.** Never put the full procedure in the description.
- **Hub once.** Install into `~/.agents/skills` — not into each client tree when clients already symlink the hub.
- **Edit in the clone, run from the hub.** Hub entries should be symlinks into this repository so changes ship without reinstalling.

## Related docs

- Hub skill: [`skills-hub/SKILL.md`](./skills-hub/SKILL.md)
- Import from GitHub: [`skills-hub/references/import-from-github.md`](./skills-hub/references/import-from-github.md)
