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
# Or use the distribute-skill-to-all-agents skill from an agent session
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

Authoring guide: [`effective-agent-skills`](./effective-agent-skills/SKILL.md).  
Installer template: [`skills-hub/references/install-template.sh`](./skills-hub/references/install-template.sh).

## What’s in here

~150 skills across product, engineering, GTM, content, and agent ops. Highlights by area:

### Agent platform & meta

Hub wiring, multi-agent orchestration, skill craft, session workflow.

| Skill | Purpose |
|-------|---------|
| [`skills-hub`](./skills-hub/SKILL.md) | Source / hub / client layout and install |
| [`distribute-skill-to-all-agents`](./distribute-skill-to-all-agents/SKILL.md) | Publish a finished skill to the hub |
| [`effective-agent-skills`](./effective-agent-skills/SKILL.md) | How to write skills well |
| [`delegating-to-agents`](./delegating-to-agents/SKILL.md) | Hand work to Pi / Codex / Claude / Hermes |
| [`cmux`](./cmux/SKILL.md) | cmux workspaces, panes, agent surfaces |
| [`do-work`](./do-work) | File-based autonomous task loop (REQ pipeline) |
| [`fable-mode`](./fable-mode/SKILL.md) | Multi-gate discipline for hard / multi-layer work |
| [`goal-loop`](./goal-loop/SKILL.md) | Long-running plan → act → test → review loops |
| [`handoff`](./handoff/SKILL.md) | End-of-session handoff for a fresh agent |
| [`global-agent-guardrails`](./global-agent-guardrails/SKILL.md) | Shared denylist of catastrophic shell commands |
| [`skill-optimizer`](./skill-optimizer/SKILL.md) | Eval-driven skill improvement loop |
| [`skill-seekers`](./skill-seekers/SKILL.md) | Generate skills from docs, repos, PDFs, video |

Also: `agent-self-scheduling`, `codex-subagent`, `creative-collision`, `ideate`, `party-mode`, `tournament`, `saas-thesis`, `prompt-me`, `setup-help`, `teach`, `level-up`, `short`, `remind`, and others under matching folder names.

### Engineering & architecture

| Skill | Purpose |
|-------|---------|
| [`software-architecture`](./software-architecture/SKILL.md) | Clean Architecture / DDD / SOLID design rules |
| [`architecture-analyst`](./architecture-analyst/SKILL.md) | Laravel + SPA best-practices audit |
| [`intended-vs-implemented`](./intended-vs-implemented/SKILL.md) | Intent vs code gap analysis |
| [`ease-of-change`](./ease-of-change/SKILL.md) | PEI / hotspot change-cost scorecard |
| [`data-quality-loop`](./data-quality-loop/SKILL.md) | Fix prod data bugs at the write path |
| [`log-coverage-loop`](./log-coverage-loop/SKILL.md) | Instrument important paths until logs are useful |
| [`shipping-artifacts`](./shipping-artifacts/SKILL.md) | Docs that make AI-built apps reviewable |
| [`launch-readiness-audit`](./launch-readiness-audit/SKILL.md) | Pre-launch issue register (find, don’t fix) |
| [`forge-inspect`](./forge-inspect/SKILL.md) | Read-only Laravel Forge prod logs / config |
| [`docs-sync`](./docs-sync/SKILL.md) | Bring docs in line with the implementation |
| [`brain-to-docs`](./brain-to-docs/SKILL.md) | Interview loop → README + ADRs |
| [`browser-harness`](./browser-harness/SKILL.md) | Direct CDP control of the user’s Chrome |
| [`create-readonly-db-role`](./create-readonly-db-role/SKILL.md) | Hardened SELECT-only Postgres for agents |

Also: `arch-viz`, `code-structure`, `kaizen`, `github-actions`, `ios-simulator`, `onboarding-friction-loop`, `test-scenarios`, `sql-queries`, `google-safe-browsing`, `cyber-audit`, and related folders.

### Product discovery & strategy

PRDs, JTBD, prioritization, canvases, interviews, metrics, experiments.

Examples: `create-prd`, `opportunity-solution-tree`, `job-stories`, `user-stories`, `wwas`, `user-personas`, `ideal-customer-profile`, `brainstorm-*`, `identify-assumptions-*`, `prioritize-*`, `pre-mortem`, `strategy-red-team`, `product-strategy`, `product-vision`, `lean-canvas`, `startup-canvas`, `business-model`, `north-star-metric`, `metrics-dashboard`, `ab-test-analysis`, `cohort-analysis`, `swot-analysis`, `porters-five-forces`, `pestle-analysis`, `sprint-plan`, `retro`, `interview-script`, `summarize-interview`, `summarize-meeting`.

### GTM, marketing & sales

Examples: `gtm-strategy`, `gtm-motions`, `gtm-skills`, `growth-loops`, `competitor-analysis`, `competitive-battlecard`, `positioning-ideas`, `landing-page-designer`, `email-marketer`, `marketing-ideas`, `promo-graphic-prompter`, `domain-namer`, `lead-research-assistant`.

### Content & writing

Examples: `author`, `editor`, `script-studio`, `ai-avatar-script`, `content-engine`, `content-research-writer`, `humanize`, `my-voice`, `grammar-check`, `changelog-generator`, `release-notes`, `cover-renderer`, `markdown-to-html`, `article-extractor`, `youtube-transcript`.

### Research & external tools

| Skill | Purpose |
|-------|---------|
| [`deep-research`](./deep-research/SKILL.md) | Sourced research reports, fact-check ledgers, decision cards |
| [`deepapi`](./deepapi/SKILL.md) | Search / scrape / image gen via DeepAPI (policy-gated) |
| [`defuddle`](./defuddle/SKILL.md) | Clean markdown from web pages |
| [`researcher`](./researcher/SKILL.md) | Product teardown → BUILD / CONSIDER / SKIP |
| [`storm-research`](./storm-research/SKILL.md) | Multi-lens STORM HTML briefings (explicit trigger only) |

Also: `reddit-fetch`, `research-prompt`, `obsidian-cli`, `obsidian-markdown`.

### Ops & personal tooling

Examples: `vps-server-management`, `xero-copilot`, `file-organizer`, `anti-sleep`, `dummy-dataset`, `draft-nda`, `privacy-policy`, `review-resume`, `building-blog`.

### Bundles & non-skill folders

| Path | Notes |
|------|--------|
| `career-helper/` | Career-helper plugin bundle (skills nested inside) |
| `marketing-skills/` | Marketing skill pack / plugin tree |
| `solo-skills/` | Solo-operator skill pack |
| `resume-tailoring-skill/` | Resume-tailoring package |
| `configs/` | Shared config snippets (e.g. GitHub Actions) |
| `docs/` | Plans/specs related to this tree |

## Create a new skill

1. Copy structure from a small existing skill or scaffold via `effective-agent-skills`.
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
- Authoring: [`effective-agent-skills/SKILL.md`](./effective-agent-skills/SKILL.md)
- Agent health / hub wiring check: `agent-doctor` (if installed)
