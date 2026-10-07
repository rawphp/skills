---
name: pr-brief-video
description: 'Make a narrated two-minute reviewer brief video for one pull request (what changed, where to look, review outcome, gates, deploy check) from all-animated cards, then put the share link at the top of the PR body. Use for PR video, reviewer brief, "video for this PR", pr video create, or after a /dw review when the PR needs a walkthrough. Differentiator: card-only cut of the product-intro-video engine, scripted from the PR body and its review; no app footage, no music. Needs an ElevenLabs API key.'
---

# PR brief video

A reviewer watches this before reading the diff. It says what the PR changes, why, where to look, what the review found and fixed, and what to check after merge. All cards, one voice, no music, 1.5× pace, about two minutes. The `product-intro-video` engine renders it; this skill is the PR-shaped script, cards and hand-off.

`SK` is this skill's `scripts/` directory. `PIV` is the `product-intro-video` skill's `scripts/` directory. Read `references/field-lessons.md` first. Read that skill's `references/api.md` when a card needs a field you have not used.

## Inputs

- The PR URL. `gh` uses the account already logged in for that host.
- The review on the PR (a `/dw review` comment or the body's Review section) and the gate numbers on the tip. If there is no review yet, say so and run one first; the video states the review outcome and must not invent it.
- ElevenLabs key: `"$PIV/check.sh"` prints the tier and characters left. Stop without one. The key stays in `ELEVEN_LABS_API_KEY`.

## Workflow

**1. Read the PR.** `gh pr view N --json title,body,headRefName,baseRefName,headRefOid,comments` and `gh pr diff N --stat`. Note the stack position (what merges before and after), each change area, the review counts (personas, cycles, fixes, blockers), the gate numbers, and anything the body leaves to a deploy check or outside the PR. Open the two or three files a reviewer should read first and copy the exact lines a code card will show.

**2. Project folder.** `output/product-demo/pr<N>-summary/` in the repo (confirm it is gitignored). Start from the previous PR brief in the same repo when one exists: copy its `cards.js`, `audio/sfx/`, `speedup.py` and `video.json`, so the voice, pace, brand and caption map carry over and no sfx credits are spent. Otherwise copy `templates/*` and `scripts/speedup.py` from this skill and set the brand colours. The template voice is ElevenLabs' public voice Charlie (`IKne3meq5aSn9XLyUdCD`). Replace `voice.id` when this repo already has a voice.

**3. Script.** Write `script.json` with 6–9 card scenes. The shape that has worked:

| Scene | Card | Says |
|---|---|---|
| s01 | `title` — eyebrow `REPO · PR N`, pill for the stack position, sub for branch → base | PR number, where it sits, what it answers |
| s02 | `shift` — the route or call before, the old code line, a Caveat punch line | The villain: what was wrong and who it hurt |
| s03 | `flow` — two lanes, path → what it sends now, notes per lane | The rule after the PR |
| s04 | `code` — up to two blocks with a marked range | The exact lines that enforce it |
| s05–s07 | `job` or `flow` — three rows each | The other change areas, grouped |
| s08 | `look` — three files + symbols, review box, deploy box | Where to look, review outcome, deploy check or outside-this-PR |
| end | `gates` — backend / frontend / infra numbers, note on merge order | 7 s |

Voice rules: short sentences; spell what TTS mangles (`four eighty five`, `P K C E`, `L L M`, `four oh one`) and map them back in `captions.replace`; put a distinct cue word where each card element should land; a cue that appears earlier in the line fires early. Budget: 330 words ≈ 1:45, 425 words ≈ 2:20 at this pace. Every claim traces to the PR body, the review or the code you opened. `references/example-script.json` is a fictional pull request. Copy the card shape and the cue style. The story is fiction.

```bash
python3 "$SK/cues.py"          # every cue resolves; word, char and length estimate for the gate
```

**Gate.** Show the user the scene table (card + gist per scene), the length estimate and the character cost against what is left. Voice, pace and no-music are standing choices from earlier PR briefs; only the script needs a go. Do not generate audio before it.

**4. Audio and timeline.**
```bash
python3 "$PIV/tts.py"          # voice at speed 1.2, prints word timings
python3 speedup.py 1.15        # atempo 1.15, timings scaled; originals in audio/slow/
node "$PIV/build.mjs"          # prints each scene's start and length — page.html needs these
```

**5. Preview every card, then render.**
```bash
node "$PIV/render.mjs" --at <one time per card, its last cue + 1 s>
python3 "$SK/sheet.py" && open preview/sheet.jpg   # or Read it
```
Fix wraps and overflows in `script.json` or `cards.js` (see field lessons), re-preview the changed cards, then:
```bash
node "$PIV/render.mjs" && python3 "$PIV/mix.py" && python3 "$PIV/qa.py"
```
Done when QA shows no flashes and about −16 LUFS. Two hard cuts are expected: title → first light card, last card → end card.

**6. page.html.** Fill the title, meta, duration, one row per scene with the start seconds from `build.mjs`, and the deploy box. It sits beside the mp4 for when artifact publishing is available.

**7. Hand-off.** Show the mp4 in its folder (`open -R <mp4>` on macOS). Two steps are the user's. Drag the mp4 onto the PR so GitHub shows an inline player. Put a second copy where a reviewer can open it by link. The drag-and-drop player has no stable URL, so the link has to be a place the reviewer can already open. When the user pastes that link, prepend this to the body with `gh pr edit N --body-file`. Read the live body first. If the watch line is already there, leave the body alone.

```
▶️ **[Watch the M min S s reviewer brief](<link>)** — what changed and where to look, before reading the diff.
```

## Report

The mp4 path, duration and size; the scene list; the gate numbers shown; that you have not listened to the audio (levels are measured); the two user steps.

## Stop

| Condition | Action |
|---|---|
| No ElevenLabs key or quota short of the script | Stop; report characters left |
| No review on the PR | Stop; run the review first, the video states its outcome |
| Gate numbers unknown for the tip | Run the gates or take them from the review comment; never estimate |
| User has not approved the script | Do not generate audio |
