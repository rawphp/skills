---
name: product-intro-video
description: 'Produce a finished, narrated product intro video from a live web app and its docs, with AI voice-over, 4K screen capture, animated zooms, cursor, captions, title and info cards, music and sound effects, in a straight, light or comedic tone. Use for product intro video, feature tour video, explainer video for staff or customers, launch video, walkthrough with voiceover and music. Differentiator: edited video with sound, built by a script-driven engine from real screens; product-demo-record makes a raw silent tape, and nothing here is AI-generated footage. Needs an ElevenLabs API key.'
---

# Product intro video

Turns a live app plus its docs into an edited MP4. The script drives everything: voice-over word timings cue every click, zoom and card. The engine lives in `scripts/`. Each video is a small project folder with three files you write: `video.json`, `script.json` and `scenes.mjs`, plus `cards.js` when a card needs a template that isn't built in. The scene list, the cards and the tone come from the product and the audience, not from the templates.

Always read `references/field-lessons.md` first. Read `references/traps.md` before the first recording.

Seed, reset and dry-run discipline follows `product-demo-record`.

## State check

Run this before the brief. Every voice line and sound effect comes from ElevenLabs, so without a working key there is no video.

```bash
SK="<this skill's directory>/scripts"
"$SK/check.sh"                        # ffmpeg, node, pillow+numpy, Chrome, playwright, ElevenLabs key (tier, characters left)
npm install --prefix "$SK"            # only if check.sh says playwright is missing
```

If the ElevenLabs line says MISS, stop and ask the user for a key (`export ELEVEN_LABS_API_KEY=...`). Don't brief or walk without one. Note the tier and characters left for the approval gate. The free tier needs attribution and excludes commercial use, so tell the user now if the video is for customers or marketing.

The app must run locally with seeded demo data and a persona sign-in (dev bypass or demo account). If there is no reset for the data the tour writes, stop and ask.

## Workflow

**1. Brief.** Infer what you can from the repo, then ask the user once for the rest:
- the audience: who watches, and what they do in the product
- the source material: help docs, guides, README, release notes, a spec or a URL. Every factual line in the script traces to it. If there is none, say so; the script then comes from the dry walk, and the user confirms each claim at the gate
- the target length, if they have one ("90 seconds", "about 3 minutes"). Without one, make the shortest video that covers the tasks
- the demo persona whose permissions match the audience
- where the project folder goes (default `output/intro-video/<slug>/` in the product repo, gitignored)

```bash
mkdir -p "$DIR" && cp "<skill dir>/templates/"* "$DIR/" && cd "$DIR"
```

**2. Walk before you write.** Dry-walk the audience's screens as the persona: headless screenshots, or `node "$SK/rec.mjs" --dry <id>` once scenes exist. Note the real states, messages and demo names. The story, and any jokes, come from these.

**3. Script.** Read `references/script-writing.md`. Build the scene list from the audience's tasks: each scene gets a visual and a voice line, and a card only where the screen can't make the point. **Gate:** show it with its estimated length against any target and its ElevenLabs cost, and ask about tone (straight, light or comedic), narrator voice and music bed before spending credits. If the source runs out short of the target, say so here rather than padding. Then write `script.json` and `video.json`, and `cards.js` if a card needs its own template (`references/api.md`).

**4. Audio.**
```bash
python3 "$SK/tts.py"          # voice lines + word timings (prints them; pick cue words from this)
python3 "$SK/sfx.py"          # default effects + video.json extras; skips existing files
curl -L -o audio/music.mp3 "<licensed track URL>"   # and add its credit to video.json
```
With a target, recheck the length from the real line lengths before recording (`references/script-writing.md`, Length).

**5. Scenes.** Write `scenes.mjs`, one entry per footage line. Cue each beat to a word with `r.at`, then dry-run until clean:
```bash
node "$SK/rec.mjs" --dry s03 s04      # no capture; footage/<id>-dry.png, prints late cues and failures
```

**6. Record.** It resets first when a scene is in `reset.before`, and takes about as long as the voice-over:
```bash
node "$SK/rec.mjs"                    # all footage scenes; or: node "$SK/rec.mjs" s07 to retake one
```

**7. Build and preview.**
```bash
node "$SK/build.mjs"                  # timeline.json; prints the total and each scene's start and length
node "$SK/render.mjs" --at 5,20.5,47  # preview/t*.jpg: look at cards, zooms, rings, stickers (loads cards.js)
```
Pick preview times from the build output (a zoom's cue plus 1 s). Fix, then re-record the scene or edit the card, and preview again.

**8. Render, mix, QA.**
```bash
node "$SK/render.mjs"                 # render/video.mp4, ~80 s for 3 min on 4 workers
python3 "$SK/mix.py"                  # voice -16 LUFS, ducked music, effects; muxes video.json output
python3 "$SK/qa.py"                   # flashes, hard cuts, loudness, qa/sheet.jpg
```
Read `qa/sheet.jpg`. You're done when there are no flashes, the loudness is about -16 LUFS, and every sheet frame shows the intended state.

**9. Leave it clean.** Run the reset command again after the last take. Stop any servers you started.

## Validation loop

`--dry` until no failures, then record, then preview stills, then fix. Then the full render and `qa.py`, then fix. Never render the full video to find a problem a still would show. Say plainly that you have not listened to the audio: levels are measured, but the voice delivery and generated effects need a human ear.

## Output contract

Report:
- the mp4 path, duration and size
- with a target: the target against the actual length, and if it's short, which source material ran out and what would fill the rest
- what's on screen by scene, the tone, and any jokes
- voice, music and licences (ElevenLabs free tier needs attribution and excludes commercial use)
- anything the audience should sign off (sensitive labels, real names in demo data)
- the reset run and servers stopped
- how to retake a scene: `rec.mjs <id>`, then build, render and mix

## Stop

| Condition | Action |
|-----------|--------|
| ElevenLabs key missing or rejected | Stop before the brief; ask for a key |
| No source material and the user won't confirm facts | Stop; don't script claims nobody can check |
| App or persona login unreachable | Stop; say what is down |
| A scene writes data with no reset | Stop; add a reset or drop the beat |
| User hasn't approved the script, voice and music | Don't generate audio |
| The script needs more characters than are left, or quota runs out mid-run | Stop; report characters left (`check.sh`) and what the rest needs |

## Guardrails

- Demo data and demo accounts only. Put "demo data" on screen when a named person is rated or judged.
- Never mock a real person or customer. Get sign-off on sensitive product labels before a joke uses them.
- Product selectors and seeds stay in the project folder, never in this skill.
