---
name: filmcraft
description: 'Cut and export video with FilmCraft on the Trilogy Mac. Use for cut a screen recording, trim, join intro, main and outro, add or export SRT or VTT captions, transcribe, remove filler words or pauses, or export a YouTube 1080p video. Differentiator: Premiere-style timeline edit on the Trilogy host; a narrated product video stays with product-video.'
---

If the request is to make a narrated product video (a phase update, build summary, spec approval, how-to, PR brief, demo or walkthrough of an app), stop and invoke the `product-video` skill; it calls this skill's tools by path when a stage needs them. Carry on here only for this skill's own output.

# FilmCraft

Read `references/host.md` in the artcraft skill (`../artcraft/references/host.md`) and use the filmcraft row. Below, `$W` is `/Users/tomk/craft/work/filmcraft`.

## 1. State check

Confirm `ssh -o BatchMode=yes tomk@trilogy-mac true` works. When the filmcraft MCP server is connected in this session, read [references/mcp.md](references/mcp.md) and use it; otherwise use SSH and `filmcraft-cli`.

## 2. Files

Set `JOB` as host.md says and keep every file under `$W/in/$JOB/` and `$W/out/$JOB/`. The examples below omit `$JOB/` for brevity; put it in front of each filename.

`scp` media into `$W/in/`. Keep the project (`.fcproj`) and every export in `$W/out/` under new filenames.

## 3. Common jobs

Run these inside `ssh -o BatchMode=yes tomk@trilogy-mac bash -s <<'EOF' ... EOF` with `W=/Users/tomk/craft/work/filmcraft` and `P=$W/out/demo-cut.fcproj` at the top. Options (`--project`, `--save`, `--save-as`) go before the subcommand. Each call is a fresh headless process, so carry state in the project file with `--save`.

```
# Import into a new project
filmcraft-cli --save-as "$P" import "$W/in/intro.mp4" "$W/in/screen.mov" "$W/in/outro.mp4"

# Read item ids, then the timeline
filmcraft-cli --project "$P" inspect project
filmcraft-cli --project "$P" inspect sequence

# Sequence from the main recording
filmcraft-cli --project "$P" --save exec file.newSequenceFromClip '{"items":["<screen item id>"]}'

# Cut: razor at 12.5 s and 40 s on V1, then ripple-delete the clip between
filmcraft-cli --project "$P" --save exec timeline.razor seconds=12.5 track=V1
filmcraft-cli --project "$P" --save exec timeline.razor seconds=40 track=V1
filmcraft-cli --project "$P" inspect sequence
filmcraft-cli --project "$P" --save exec edit.rippleDelete '{"clips":["<clip id>"]}'

# Join: insert the intro at 0, place the outro at the sequence end
filmcraft-cli --project "$P" --save exec timeline.place '{"item":"<intro item id>","seconds":0,"insert":true}'
filmcraft-cli --project "$P" --save exec timeline.place '{"item":"<outro item id>","seconds":<end>,"insert":true}'

# Captions: import an SRT or VTT onto a caption track, or write one out
filmcraft-cli --project "$P" --save exec captions.newTrack '{"format":"Subtitle"}'
filmcraft-cli --project "$P" --save exec captions.import '{"path":"/Users/tomk/craft/work/filmcraft/in/demo.srt"}'
filmcraft-cli --project "$P" exec captions.export '{"path":"/Users/tomk/craft/work/filmcraft/out/demo-cut.vtt"}'

# Export for YouTube
filmcraft-cli --project "$P" export "$W/out/demo-cut.mp4" --preset "YouTube 1080p Full HD"

# Transcript. List models first. Download only after the user agrees.
filmcraft-cli --project "$P" exec transcript.models
filmcraft-cli --project "$P" exec transcript.downloadModel '{"model":"whisper-base"}'
filmcraft-cli --project "$P" --save exec transcript.generate '{"items":["<item id>"],"model":"whisper-base","language":"en"}'
filmcraft-cli --project "$P" --save exec transcript.removeFillers
filmcraft-cli --project "$P" --save exec transcript.removePauses
filmcraft-cli --project "$P" --save exec transcript.createCaptions '{"format":"Subtitle"}'
```

Use the ids `inspect` prints in place of the `<...>` placeholders. Other presets: `filmcraft-cli export --list-presets [query]`. `export` waits for the render to finish. `transcript.generate` is off until a sequence is open. If `describe transcript.generate` still says `enabled: false` with the project open, stop and say the speech model is not ready. Run `describe transcript.removePauses` before guessing its params.

## 4. Everything else

List commands and pick the id from the output. Do not guess an id.

```
ssh -o BatchMode=yes tomk@trilogy-mac 'filmcraft-cli commands <filter>'
ssh -o BatchMode=yes tomk@trilogy-mac 'filmcraft-cli describe <id>'
```

## 5. Verify

Run `filmcraft-cli probe` on the export and check duration, size and audio. Render a frame from each joined part (`filmcraft-cli --project "$P" render --seconds S --out "$W/out/check-S.png"`), `scp` the video and frames back, check they are non-empty, and look at them before telling the user it is done.

## 6. Failures

- **SSH or MCP endpoint fails:** Tailscale is required. Say so.
- **Path not found:** there is no MCP lock, but the cwd is the work dir. Use absolute paths under `in/` and `out/`.
- **Shared session:** over MCP another client may have a project open. Inspect first, work only on yours, and leave the rest open.
- **Exit status 1 or 2:** 1 is a failed command, 2 is a usage error. Read `describe <id>` for the params.
- **Command id missing:** run `commands <filter>`. If nothing matches, tell the user this build does not have it.
