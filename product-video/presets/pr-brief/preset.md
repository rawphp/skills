---
source: the PR body, its review comment and the two or three files a reviewer reads first
footage: cards
shape:
  - s01 title — eyebrow "REPO · PR N", pill for the stack position, sub for branch → base; says the PR number, where it sits, what it answers
  - s02 shift — the route or call before, the old code line, a Caveat punch line; the villain, what was wrong and who it hurt
  - s03 flow — two lanes, path → what it sends now, notes per lane; the rule after the PR
  - s04 code — up to two blocks with a marked range; the exact lines that enforce it
  - s05–s07 job or flow — three rows each; the other change areas, grouped
  - s08 look — three files + symbols, review box, deploy box; where to look, the review outcome, the deploy check or what is outside this PR
  - end gates — backend / frontend / infra numbers, a note on merge order; 7 s
tone: 2 · plain, fast (1.15× atempo), no music
claim: review
deliverables:
  - pr<N>-summary.mp4, page.html, the watch line for the PR body
---
# PR brief

A reviewer watches this before reading the diff: what the PR changes, why, where to look, what the review found and fixed, and what to check after merge. All cards, one voice, no music, about two minutes. Everything not written here follows the line in `SKILL.md`.

## Inputs

- The PR URL. `gh` uses the account already logged in for that host. When `gh` cannot resolve a private repo, the repo may belong to another logged-in account: `GH_TOKEN=$(gh auth token --user <login>) gh pr view …`.
- The review on the PR (a `/dw review` comment or the body's Review section) and the gate numbers on the tip. With no review yet, say so and run one first: the video states the review outcome and must not invent it. Gate numbers unknown for the tip: run the gates or take them from the review comment, never estimate.
- Read the PR with `gh pr view N --json title,body,headRefName,baseRefName,headRefOid,comments` and `gh pr diff N --stat`. Note the stack position, each change area, the review counts (personas, cycles, fixes, blockers), the gate numbers, and what the body leaves to a deploy check. Copy the exact lines a code card will show from the files you opened.

## Project folder

`output/product-demo/pr<N>-summary/` in the repo (confirm it is gitignored). Start from the previous PR brief in the same repo when one exists: copy its `cards.js`, `audio/sfx/`, `speedup.py` and `video.json`, so voice, pace, brand and caption map carry over and no sfx credits are spent. Otherwise copy this folder's `cards.js`, `page.html`, `video.json` and `speedup.py`, and set the brand colours. They carry no `audio/sfx/`, and `mix.py` fails without it: copy `presets/trilogy/audio/sfx/` or a set from an earlier video before spending credits. The template voice is ElevenLabs' public voice Charlie (`IKne3meq5aSn9XLyUdCD`); replace `voice.id` when the repo already has a voice.

## Script

6–9 card scenes in the shape above. `example-script.json` is a fictional pull request: copy its card shape and cue style, not its story.

- Spell what TTS mangles (`four eighty five`, `P K C E`, `L L M`, `four oh one`) and map it back in `captions.replace`. Map only what changes: an entry whose key and value differ only in case (`"api": "api"`) lowercases the caption.
- Budget: 330 words ≈ 1:45, 425 words ≈ 2:20 at this pace. Every claim traces to the PR body, the review or the code you opened.
- Card text limits: a `code` heading over about 55 characters wraps into the first block, so write `File.php · Class::method()`, not the full path. A `look` path over about 38 characters runs into the symbol column, so drop a leading `Http/` or `src/`. A `flow` lane `sub` over about 30 characters wraps under a two-word title, so keep it to the route.

```bash
$PY "$PRESETS/pr-brief/cues.py"     # every cue resolves; word, char and length estimate for the gate
```

Gate: show the scene table (card and gist per scene), the length estimate and the character cost against what is left. Voice, pace and no-music are standing choices from earlier PR briefs; only the script needs a go.

## Audio, preview, render

```bash
$PY "$SK/tts.py"                    # voice at speed 1.2, prints word timings
$PY speedup.py 1.15                 # atempo 1.15, timings scaled; originals in audio/slow/
node "$SK/build.mjs"                # each scene's start and length; page.html needs these
node "$SK/render.mjs" --at <one time per card, its last cue + 1 s>
$PY "$PRESETS/pr-brief/sheet.py"    # preview/sheet.jpg, three across
```

Fix wraps and overflows in `script.json` or `cards.js`, re-preview the changed cards, then render, mix and QA as in stage 5. Two hard cuts are expected: title to the first light card, and the last card to the end card. There is no footage, so `gate.py` has no rings to check.

## page.html and hand-off

Fill `page.html`: title, meta, duration, one row per scene with the start seconds from `build.mjs`, and the deploy box. It sits beside the mp4.

Show the mp4 in its folder (`open -R <mp4>` on macOS). Two steps are the user's: drag the mp4 onto the PR so GitHub shows an inline player, and put a second copy where a reviewer can open it by link (the drag-and-drop player has no stable URL). When the user pastes that link, read the live body first; if the watch line is not there yet, prepend it with `gh pr edit N --body-file`:

```
▶️ **[Watch the M min S s reviewer brief](<link>)** — what changed and where to look, before reading the diff.
```

Report the mp4 path, duration and size, the scene list, the gate numbers shown, that nobody has listened to the audio, and the two user steps.
