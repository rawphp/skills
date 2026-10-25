---
name: product-video
description: 'Produce a narrated product video of any type (build summary, spec approval, how-to guide, PR brief) from a spec, docs, recorded walks or a live app: one engine, one six-stage line, a preset per type. Use for product video, phase update, build summary, spec approval video, how-to video, PR brief video, demo video, walkthrough with voice-over. Differentiator: the engine and every stage tool live here; types are presets; validation is a geometry gate plus an independent second pass. Needs an ElevenLabs API key.'
---

# Product video

One skill for every narrated product video, from brief to published link. Formerly seven skills: demo-video, product-intro-video, product-demo-record, pr-brief-video, youtube-package, watchalong and video-production; a search for any of those names lands here.

Read `references/field-lessons.md` before stage 1.

## What this is

Three layers in one folder.

- **Engine** (`scripts/`). Compositor, build, render, mix, voice, sound effects, QA, the geometry gate, both footage front-ends (`rec.mjs` records a live app; `cut.py` and its measuring tools cut recorded tape), the walk recorder (`scripts/walk/`), the review stills, the deliverables, and the publish scripts (`scripts/publish/`). It holds no product words.
- **Line** (this file). Seven stages, in order. Stage 7 runs only when a publish target is named.
- **Presets** (`presets/`). One per video type (`build-summary`, `spec-approval`, `how-to-guide`, `pr-brief`), the house style (`trilogy`), and the two publish targets. `presets/README.md` explains the keys.

Every project, whatever the preset, is one folder holding the same files: `PLAN.md`, `video.json`, `script.json`, one of `cuts.json` (tape), `scenes.mjs` (live) or neither (cards only), `cards.js`, `audio/`, `footage/`, `timeline.json`, `VALIDATE.md`, and the deliverables `<name>.mp4`, `<name>.srt`, `contact-sheet.jpg`, `script.md`. Default location: `output/product-video/<slug>/` in the product repo, gitignored. Product selectors, seeds, reset scripts and walk scripts live in that folder, never in this skill.

The project calls the engine by path and never copies it. Set these once per shell:

```bash
SK=~/EA/skills/product-video/scripts     # the engine
PRESETS=~/EA/skills/product-video/presets
PY=python3.14                            # the newest python3.x that imports PIL and numpy
```

Run every engine command from the project folder.

## State check

```bash
PY=$PY "$SK/check.sh" --project "$PWD"   # ffmpeg, node, PIL+numpy, Chrome, playwright, ElevenLabs key (tier, characters left), no engine/ copy
npm install --prefix "$SK"               # only if check.sh says playwright is missing
df -h .                                  # free disk
```

- A project folder holding its own `engine/` fails the check: delete it and use `$SK`.
- Every voice line and sound effect comes from ElevenLabs. Without a working key there is no video. Note the tier and characters left for the script gate. The free tier needs attribution and excludes commercial use, so say so now if the video is for customers or marketing.
- 4K footage from earlier runs ends a run with `ENOSPC`. Under about 10 GB free, ask the user to clear an approved run's `footage/ render/ mix/ cache/` before stage 1.
- A live-app video needs the app running locally with seeded demo data, a persona sign-in, and a reset for every record the walk writes.

## Stage 1. Plan

Read `references/brief.md` and run it: answer from the repo what the repo can, then ask the user once, with every default filled in. Read the chosen `presets/<type>/preset.md` and the house preset (`presets/trilogy/`, or another brand's). Copy the house `video.json` and `cards.js` into the project and set `output`; copy `audio/sfx/` so no sfx credits are spent.

Write `PLAN.md` before any audio or frames:

- The brief rows: audience, takeaway, humour and tone words, hard no's, length, reference video, voice and music, claim strength. Mark each as the user's answer or the default.
- The claim strength from the preset's `claim`. A `proposed` video never says "built"; a `built` video never says "live".
- The ordered scene list from the preset's `shape`, ordered by the viewer's job, not the filename.
- Scene length: tape footage under 15 s, live footage 9–26 s. Do not pad.
- Voice and music come from the reference video when there is one: the same voice id, the same licensed bed.
- Jokes come only from a real on-screen refusal or label.

## Stage 2. Source

One folder of inputs, read in the mode the preset's `footage` names.

**Tape.** Recorded walks.

1. Beat list. For each beat, name the screen, the row it acts on, and the action that creates the next beat's row. If a beat has no row to act on, add it to the seed first.
2. Seed and reset. A project seeder makes the account look busy, with one hero entity the story follows. A reset returns the hero to the start state and deletes every record the walk created. Do not wipe the database unless the user asked. Read `references/record-traps.md` before the dry-run.
3. Dry-run every beat once with no video: land by URL or captured id, dismiss overlays, wait on `role=status` after a save, and assert the next beat's row exists. A failing beat means reset and fix; do not record.
4. Record on a private demo stack built from main, never the dev server. The project's `walks.mjs` (shape: `$SK/walk/walks.example.mjs`) imports the recorder from `$SK/walk/harness.mjs`:
   ```bash
   WALK_BASE=http://localhost:<port> WALK_OUT=<source dir> WALK_FIXTURE=<upload file> WALK_PROJECT=<frontend dir> \
   WALK_RESTORE='<restore command>' SK="$SK" node "$SK/walk/run.mjs" --restore [w1 w2 ...]
   ```
   Re-record one walk when its cursor parks on a claim (field lesson 9).
5. One row per clip in `PLAN.md`: file, length, what it shows, what it must not claim.

The walk tool burns a caption chip into the bottom of each frame. `cuts.json` names it (`"chip": {"y": 847, "h": 36}`) and the recordings folder (`"source": "<dir>"`); `cut.py` crops every frame above the chip. The chip is not evidence: a fact that existed only in the chip is not spoken or ringed. If the walk says a control is sample data, the scene says so and cuts to the live surface.

**Live.** The app recorded by `rec.mjs`. Dry-walk the audience's screens as the persona (headless screenshots, or `node "$SK/rec.mjs" --dry <id>` once scenes exist) and note the real states, messages and demo names. The story comes from these. Read `references/traps.md` before the first recording and `references/playwright-record.md` for the one-page rule.

**Cards.** No footage. Read the source the preset names (a spec page, a PR and its review, an article) and copy the exact lines each card will show.

**Dispatch point.** With more than three clips, send one agent per clip. Each gets the clip's contact sheet (`$PY "$SK/sheetw.py" <stem> 0 <end> 1 sheet.jpg` after `cut.py` decodes it), the narration line for its scene and this stage's rules, and returns its source row and a `cuts.json` fragment with proposed segments. The line merges the fragments and owns the result.

## Stage 3. Script

Read `references/script-writing.md`. Write `script.json` in the preset's `shape`; every card the shape lists is required. Write `video.json` from the house copy. A card that needs its own template goes in `cards.js` (`references/api.md`; house style notes in `references/tcv-cards.md`).

- Footage lines are short, one idea a sentence. Plant a distinct cue word on each control the picture must hit.
- A cue word occurs once in its line, or carries `n` (and `ring_n` whenever `n` is set). `gate.py` fails an ambiguous cue.
- Spell tokens the voice will mangle, and map them back in `video.json` `captions.replace`.
- Estimate length from the word count and cost from the character count.

**Gate.** Show the scene list with its estimated length against any target, the character cost against what is left, and the tone, voice and music. If the source runs out short of the target, say so here rather than padding. When the brief said "match the last video", that is the approval: same voice, same music, this script. Do not generate audio before the go, and do not generate it twice for a camera change.

```bash
$PY "$SK/tts.py"          # voice lines + word timings (pick cue words from these); tts.py <id> regenerates one line
$PY "$SK/sfx.py"          # default effects + video.json extras; skips existing files
```

`voice.id` may be `ENV:<VAR>`; the key stays in `ELEVEN_LABS_API_KEY`.

## Stage 4. Scene plan

**Tape: `cuts.json`.** One segment per spoken control, not one per walk. For each segment: `src [in, out]` on a stretch where that control stays still, the cue (`at`, `n`, `off`), the `ring [x, y, w, h]` in source px of the original frame (required), `ring_at`/`ring_n` when the ring cue differs from the cut, `zoom` (about 1.6–2.0; a target that will not fit gets a wider shot), `crop` (`top`, `low` or `zero`), `kind` for the measurer (`box`, `row`, `dialog`, `ink`), and an optional `sticker`.

- Measure on the decoded frame at the ring's own source time, which `cut.py` prints per segment. Tools: `bounds.py` (content bounds in a region), `grid.py` (a labelled source-px grid), `quad.py` (four times side by side), `still.py` (where the page stops moving).
- The target is the whole control: a row with its trailing menu, the whole card, a field with its adornment and helper text. Never an inner span, never a wrapper that also holds a sibling.
- Ring = the control's edges plus 6 source px, clamped to its card or dialog.
- `$PY "$SK/snap.py" --write` re-measures every ring from pixel profiles and settles the edges. A `MOVING` flag means the page was still moving: pick a later still stretch.

**Live: `scenes.mjs`.** One entry per footage line, each beat cued to a word with `r.at` (`references/api.md`; a starter is in `templates/`). Dry-run until clean: `node "$SK/rec.mjs" --dry s03 s04`.

**Cards.** Nothing to plan; the script is the plan.

## Stage 5. Assemble

From the project folder, in order:

1. Footage. Tape: `$PY "$SK/cut.py"` (all scenes) or `cut.py w3` (one). Live: `node "$SK/rec.mjs"` (all) or `rec.mjs s07` (one retake); it resets first when a scene is in `reset.before`.
2. `node "$SK/build.mjs"`: `timeline.json`, each scene's start and length.
3. `$PY "$SK/gate.py"`: ring edges, rings under captions, stickers on rings or captions, rings overrunning the next cue, ambiguous cue words. Fix `cuts.json` or `scenes.mjs` and repeat 1–3 until it prints 0 failures. Never relax a check to pass a video. `capBottom: true` on a script line moves that scene's captions to the bottom.
4. `node "$SK/render.mjs" --at <ring t + 0.3 for every ring>`, then look. With more than about a dozen stills, tile them 2×3 (960×540 tiles on a 1920×1620 canvas) and read the sheets. Fix and repeat. Never full-render to find what a still would show.
5. Create the output folder, then `node "$SK/render.mjs"` and `$PY "$SK/mix.py"` (voice at −16 LUFS, ducked music, effects; muxes to `video.json` `output`).
6. `$PY "$SK/qa.py"`: flashes, hard cuts, loudness, `qa/sheet.jpg`.
7. `$PY "$SK/deliver.py"`: `<name>.srt`, `contact-sheet.jpg` and `script.md` beside the mp4.

The engine renders 16:9 only. For a 9:16 social cut, do not re-render: in ffmpeg, scale the final video to 1080 wide, centre it on a solid brand-colour 1080×1920 `color` source, and overlay a Pillow-made headline PNG above it and the link below. A blurred copy of the video as the background turns pale on light scenes and the text disappears.

## Stage 6. Validate

`gate.py` and `qa.py` are necessary and not enough: neither reads the words.

1. `$PY "$SK/stills.py"`: ring stills (ring + 0.3 s) and after stills (ring end + 0.15 s) cut from the final mp4, tiled into `review/ring-N.jpg` and `review/after-N.jpg`, with `review/manifest.json`.
2. **Dispatch point.** The second pass is a fresh agent on a mid-tier model, given `references/review-pass.md` filled in with the project path. Never the agent that measured. It returns one row per ring.
3. A failed ring goes back to stage 4, then `stills.py --only <keys>` and the same reviewer on only those rings. A ring that cannot improve (no more margin exists in the source) is accepted by name in `VALIDATE.md`, not hidden.
4. Check the whole-video items: every card the preset's shape lists is present and the counts match; footage scene lengths are inside the preset's range; total length is inside the target or the gap is named; loudness about −16 LUFS; no single-frame flashes.

Write `VALIDATE.md`: the gate numbers (rings, failures), each review round, the per-ring table (scene-seg, cue, still, verdict per round), substitutions (another walk's surface, a re-recorded walk), and accepted items with the reason. Say plainly that nobody has listened: levels are measured, voice delivery needs a human ear.

## Stage 7. Publish

Only when the brief or the preset names a target. YouTube: `presets/publish/youtube.md` (thumbnails, titles, a description with chapters from `timeline.json`, upload answers, and the upload when asked). Watchalong: `presets/publish/watchalong.md` (checkpoints from `timeline.json`, the plan document, upload, publish). A PR brief's target is the PR body: the watch line in `presets/pr-brief/preset.md`. The link goes into `VALIDATE.md` under "Published" and into the report. Nothing is uploaded without the user's go. Other tools a stage can use (thumbnail art, intros, grading, research) are listed in `references/other-tools.md`; the line names the tool, it does not hand the video over.

## Learn

After every run, add one process lesson to `references/field-lessons.md` only if the next run of this skill would behave differently: symptom, cause, default, no product name. A geometry rule goes into `gate.py` as a check with a test in `scripts/tests/`, never into prose. Engine changes are made in `scripts/` and proved with `scripts/smoke.sh` and `$PY -m pytest scripts/tests presets/tests`.

## Output contract

Report:

- the mp4 path, duration and size; with a target, the target against the actual length and what ran out if short
- the preset and house preset used, and the scene list with what is on screen
- the gate result and the second-pass count, and anything accepted in `VALIDATE.md`
- voice, music and licences (the free ElevenLabs tier needs attribution and excludes commercial use)
- anything the audience should sign off (sensitive labels, real names in demo data)
- that nobody has listened to the audio
- for live or tape recording: the reset run and servers stopped
- how to retake one scene: `cut.py <id>` or `rec.mjs <id>`, then build, gate, render, mix
- the published link, when stage 7 ran

## Stop

| Condition | Action |
|-----------|--------|
| ElevenLabs key missing or rejected | Stop before the brief; ask for a key |
| The script needs more characters than are left, or quota runs out mid-run | Stop; report characters left (`check.sh`) and what the rest needs |
| The project folder holds an `engine/` copy | Delete it; call `$SK` by path |
| No source material and the user will not confirm facts | Stop; do not script claims nobody can check |
| App or persona login unreachable | Stop; say what is down |
| A beat writes data with no reset | Stop; add a reset or drop the beat |
| Dry-run cannot create the next beat's row | Fix the seed or form; do not record |
| A recorded tape is seconds long for a minutes-long walk | A second page took the tape; re-record on one page |
| The user has not approved the script, voice and music | Do not generate audio |
| `gate.py` reports failures | Do not full-render; fix the plan |
| A PR brief with no review on the PR | Run the review first; the video states its outcome |

## Guardrails

- Demo data and demo accounts only. Put "demo data" on screen when a named person is rated or judged. Never mock a real person or customer; get sign-off on sensitive product labels before a joke uses them.
- Product selectors, seeds, reset scripts and walk scripts stay in the project folder.
- The ElevenLabs key stays in `ELEVEN_LABS_API_KEY`, and voice ids may be `ENV:<VAR>`. No key or token in any file, still or report.
- Run the reset again after the last take. Stop any servers you started.
- 16:9 only from the engine; 9:16 is an ffmpeg pass on the final cut (stage 5).
- Nothing is uploaded, published or posted without the user's go.
