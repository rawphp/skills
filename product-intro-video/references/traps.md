# Traps

Read before the first recording, and whenever a stage fails. Symptom → cause → default action.

## Capture

| Symptom | Cause | Default action |
|---------|-------|----------------|
| Zoomed shots are soft; frames are 1920 wide | Screencast and `recordVideo` return CSS-size frames whatever `deviceScaleFactor` is | Keep `rec.mjs` as is: it polls `Page.captureScreenshot` at clip scale 2 on a DSF 2 page (~15 fps, 3840×2160). Don't "fix" it back to screencast |
| Page motion looks steppy but the cursor is smooth | Capture runs at ~15 fps; the compositor draws the cursor at 30 fps | Expected. Keep scrolls at 0.7 s or longer and zoom out during them |
| A scene's footage is minutes long and the cue log has a 30 s gap | A `waitFor` timed out (a click missed, or the state never arrived) | Read `footage/<id>-fail.png`, fix the beat, re-record that scene only |
| The second click lands on the wrong control | The layout was still settling after the previous click (year or tab switch) | `await page.getByText('new state').waitFor()` between them |
| Typed text is appended to old text | The app remembers the last search or input across pages | `await r.selectAll()` before `r.type` |
| A splash or tour covers the first scene | The dismissal lives in localStorage | Find the key and exact value in the app source and put them in `app.localStorage` |
| A select "does nothing" on camera | Choosing the already-selected option sends no request | Start the scene on a different option |

## Timing

| Symptom | Cause | Default action |
|---------|-------|----------------|
| `late 0.9s at "word"` | The beat before it (typing, a scroll, a slow page) overran | Start that beat earlier (`r.at(prev, 1, -0.5)`), type faster, or cut text. Under 1 s late is usually invisible |
| `no word "x" #2` | Cue words match without punctuation and case; the nth one doesn't exist | Print the timings (`python3 tts.py <id>` lists them) and pick the right n |
| The video runs longer than planned | Each scene holds 0.6 s before and 0.8 s after its voice | Trim voice lines, not the holds |

## Voice and sound

| Symptom | Cause | Default action |
|---------|-------|----------------|
| HTTP 403 `output_format_not_allowed` | Free tier allows only `mp3_44100_128` | Leave `tts.py` as is |
| Acronyms read wrong | TTS reads letters or words its own way | Spell them in `vo` ("R and D") and map them back in `captions.replace` |
| Edited a line but the old audio plays | `tts.py` skips lines that already have audio | `python3 tts.py <id>` regenerates just that line. Its word timings move, so re-record that scene |
| Music louder than voice in places | The sidechain ducks only under speech | Lower `music.lufs` (-27 default; -30 is quieter) |

Credits: the ElevenLabs free tier needs attribution and excludes commercial use. Say so to the user and keep "Voice: ElevenLabs" in `credits`.

## Render

| Symptom | Cause | Default action |
|---------|-------|----------------|
| A still shows a half-size picture in a corner | Footage frames are not 2x | Re-record; check a frame is 3840×2160 |
| A zoom does nothing | The target is too wide to zoom (see api.md) | Frame a narrower rect |
| `unknown card template "x"` | Nothing registered that name | Check the `addCard` name matches `script.json` and `cards.js` sits in the project folder |
| A custom card jumps or flickers between frames | `draw` depends on something other than `lt` (a CSS transition, a timer, state from the last frame) | Compute every style from `lt` alone |
| Fonts fall back to system | Google Fonts didn't load (offline) | Render with network access |
| Disk fills up | 4K frames run about 1 GB per 3 minutes; mix WAVs about 300 MB | Remove `footage/` only after the final cut is approved |

## Safety

- A shell rule may block `rm -rf` on generated folders; `rec.mjs` clears each scene folder itself, so don't delete by hand first.
- Record against demo data only. Scenes that write (start, reopen, save) must be in `reset.before`, and you run the reset again after the last take.
- Stop any app servers you started, and say which ones you left running.
