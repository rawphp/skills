# Presets

A preset is a video type. It changes what the line reads and what the script says, never the stages. Types differ in inputs and script shape, not pipeline.

## Type presets

`presets/<type>/preset.md`: YAML front matter, then a short body with what the type needs beyond the line.

| Key | Meaning |
|---|---|
| `source` | What the line reads for claims (a spec page, walk recordings, a Help Centre article, a PR) |
| `footage` | `cards` (no footage), `tape` (recorded walks, cut with `cut.py`), or `live` (the app recorded by `rec.mjs`) |
| `shape` | The ordered scene list, one line each |
| `tone` | 0–10 and three words |
| `claim` | `proposed` (a spec), `built` (on main), `live` (in the app today), or `review` (a PR under review) |
| `deliverables` | What the run hands over |

Optional keys: `cards` (a folder with its own `cards.js`), `voice`, `music`.

`validate.py <preset.md>` fails a preset missing any of the six keys, or with a `footage` or `claim` value outside the lists above. Run it on a new preset before its first video.

| Type | Footage | Claim |
|---|---|---|
| `build-summary` | tape | built |
| `spec-approval` | cards | proposed |
| `how-to-guide` | live | live |
| `pr-brief` | cards | review |

## House presets

`presets/trilogy/` is the brand, not a type: `cards.js` (the house card templates; cards take `walks` for the walk count and `fig` for the figure label), `video.json` (voice as `ENV:ELEVEN_LABS_VOICE_ID`, music, brand colours, sfx prompts, credits; copy it into the project and set `output`), `audio/sfx/` (copy into the project's `audio/sfx/` so no sfx credits are spent) and `music/` (two Kevin MacLeod beds, CC BY 4.0; the credit is in `video.json`). Set `music.file` and `music.fileA` to wherever the project keeps the copies.

## Publish targets

`presets/publish/youtube.md` and `presets/publish/watchalong.md` are stage 7 targets, not types, and carry no front matter.

## How the line reads a preset

Stage 1 reads the type preset and the house preset and writes the brief rows, the scene order and the claim strength into `PLAN.md`. Stage 2 uses `footage` to pick the source mode. Stage 3 follows `shape` and `tone`. Stage 7 runs only when the brief or the preset names a target.
