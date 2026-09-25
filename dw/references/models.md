# Models

Load before Make and Check.

Read `models` from `{repo}/.dw/config.yml` (else `.do-work/config.yml`).

```yaml
models:
  default: grok
  available:
    grok:
      id: grok-4.6
      via: host
    fable:
      id: fable-5
      via: host
    opus:
      id: opus-4.8
      via: host
    gpt:
      id: gpt-5.5
      via: codex
```

## Resolve

1. **Maker** = `models.default` → that entry's `id` + `via`. Make, debug, contract use this.
2. **Checker** = first `available` key **other than** `default`, if any. Review personas use this.
3. If that `via` is unusable this session, fall back to default and set `checker: default (peer unavailable)` on the receipt.
4. One provider only → checker is the same model, different instructions. Still dispatch personas. Not a skip.
5. `via: host` means an id this host can actually start. Before the first pane, list the host's models (or probe `claude --model <id> -p`; aliases like `opus` track the latest, so a pinned version needs its full id, e.g. `claude-opus-4-8`). If `models.default` is absent, use the host default; if the checker is also absent, use that same id; write both on the receipt as fallen back. Do not spawn a different vendor instead.
6. An id not under `available` does not exist. Do not call it because `~/AGENTS.md` listed it.

## via

| via | How |
|-----|-----|
| `host` | This session or a host subagent/pane with that model slug |
| `codex` | Codex CLI only, after `delegating-to-codex`. Missing/broken → unavailable |

Never invent a peer. Never spawn Codex/Claude because a global table lists them.
