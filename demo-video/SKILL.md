---
name: demo-video
description: >
  Production line for a narrated product-demo or phase-update video: plan,
  source, script, scene plan, assemble, validate, then learn. Use for a demo
  video, product update, phase build video, or walkthrough made from screen
  recordings or a live app. Differentiator: a staged line that must pass a
  per-ring visual gate and that writes a process lesson after every cycle.
  product-intro-video is the engine. product-demo-record only makes the raw tape.
---

# Demo video

A production line. Do the stages in order. Do not skip to ffmpeg.

The picture is the Phase 1 shape: a cold-open card, a title card, a chapter card before each walk, footage cut to the voice, a zoom and a yellow ring on the control that line is naming, then a close card. `product-intro-video` is the engine. This skill is the line that drives it and the lessons that stop the last failure coming back.

Read `references/field-lessons.md` before stage 1. Read `product-intro-video` `references/field-lessons.md` and `references/script-writing.md` before the script.

## Stage 1. Plan

Write `PLAN.md` in the project folder before any audio or frames.

- Audience and what they already know. A product owner does not get a tour of the basics.
- Job of the video in one sentence.
- Length target. Walk footage scenes stay under 15s. Do not pad.
- Tone: straight, light, or comedic. Jokes come from a real on-screen refusal or label. Never mock a person, a team, or a customer.
- Engine: `product-intro-video`, copied into the project (`engine/`, `cards.js`). Do not edit the skill's own scripts.
- Voice and music. If the user says "like the last video", reuse that voice id and that licensed bed. Do not pick a new one.
- Ordered scene list: cold open, title, then each walk as chapter card + footage, then close. Order is the viewer's job, not the filename.

**Learn.** If the plan repeats a lesson already in `field-lessons.md`, do not add it again.

## Stage 2. Source

One folder of inputs. Each clip gets a row: file, duration, what it actually shows, what it must not claim.

- Pre-recorded walks: do not drive the live app and do not run `rec.mjs`. Decode each clip once.
- Walk tools burn a caption chip into the bottom edge. Crop a 16:10 frame to 16:9 from the top so the chip is gone. Frames are not 2x; the scene scale is 1.
- A fact that existed only in the chip is gone. Do not speak it.
- If the walk says a control is sample data and does not reach the real record, the scene must say so and cut to the live surface.
- House cards: copy the last video's `cards.js` when it is the same brand. The templates hardcode the walk count (squares, "OF 8", figure numbers). Change that count to this video.

**Learn.** A new way the source lies (chip, demo control, scrolled-off target) becomes one line in `field-lessons.md` before stage 3.

## Stage 3. Script

`script.json` and `video.json`. Read `product-intro-video` `references/script-writing.md` and follow it.

Required cards, in order:

| Card | Job |
| --- | --- |
| Cold open | The problem this release removes. A card, not footage. Phase 1 used two records that fail to match, then a stamp. |
| Title | Product, phase, what the build is, walk count as a pill. |
| Chapter | One before each walk. Number, name, one-line aside. The bar of segments matches the walk count. |
| Close | The phase shipped, in those words, plus a one-line recap of what the walks showed. No invented "what's next". Credits on the card. |

Footage lines are short. One idea a sentence. Plant a distinct cue word on each control the picture must hit. Spell tokens the voice will mangle, and map them back in `video.json` `captions.replace`.

Estimate length from word count before spending credits. Show the scene list. When the user has already said to match the last video, that is the approval: same voice, same music, this script. Do not generate audio twice for a camera change.

**Learn.** If a line had to be rewritten because the frame could not show it, record the class of claim to refuse.

## Stage 4. Scene plan

`cuts.json` before any footage is built. One segment per spoken control, not one segment per walk.

For each segment record:

- source in and out, on a stretch where that control stays still
- the cue word (`at`, plus `n` when the word repeats) and the words that must be readable in that frame
- the camera rect in **source pixels of the original frame**
- the ring rect, not the camera rect
- zoom about 1.6–2.0. A target that cannot fit at that zoom gets a wider shot. A box edge that is the frame edge is a miss.

Measure on the decoded frame at the source time the cue will show. Compute that time from the segment ramp. Read it twice. If the two reads differ, the page was still moving: pick a later still stretch and measure again.

The target is the whole control. A row includes its trailing menu. A card is the whole card. A field includes its adornment and its helper text. Do not box an inner text span. Do not box a wrapper that also holds a sibling.

Take the content bounds, add 6px, then clamp to the enclosing card or dialog. Drop the padding on a side that would overhang. If a sibling would fall inside, the rect is wrong.

The sticker names the same control as the ring, and it does not sit on a neighbour. The ring starts at the cue word (`ring_at` when the cut itself is earlier) and ends before the next cue, and only while that caption is up.

Do not use a frame mid-typing unless the line is about the typing. The claimed words have to be on screen.

**Learn.** When a rect was guessed and missed, write the measurement rule tighter if the current one did not prevent it. Do not add a one-off coordinate.

## Stage 5. Assemble

From the project directory, in order:

1. `python3 engine/tts.py` for lines with no audio yet
2. The project cutter (`tools/cut.py`) to build `footage/<id>/` from the plan
3. `node engine/build.mjs`
4. `node engine/render.mjs --at <one time per ring>`
5. Look. Fix the plan. Repeat 2–4. Do not full-render to discover a bad ring.
6. `node engine/render.mjs` then `python3 engine/mix.py` then `python3 engine/qa.py`

Copy the finished mp4 to the path the job asked for.

## Stage 6. Validate

`qa.py` is necessary and not enough. It catches flashes and loudness. It does not catch a ring on the wrong card.

Pass only when every line below is true. A miss goes back to stage 4, not into a note.

1. Cold open, title, a chapter per walk, and a close card are present. The close says the phase shipped. The chapter count matches the walks.
2. Every walk footage scene is under 15s. Total length is inside the target, or the gap is named.
3. Loudness about −16 LUFS. No single-frame flashes.
4. For every ring, the still at `ring.t + 0.3s` passes all of these. One miss fails the scene. A check you cannot make is a fail.
   - The claimed words are readable. The frame is not mid-typing unless the line is about the typing.
   - The whole target is inside the picture, with a margin. The frame edge is not a box edge.
   - The box contains the whole target (row and menu, card, field and adornment and helper).
   - No sibling sits inside the box. Padding is about 6px on every side, clamped so the box does not leave its card or dialog. Check the right edge and the bottom edge on purpose: a trailing icon, menu, badge, or wrapped line outside the box fails.
   - The sticker, if any, names that same target and does not cover a neighbour.
5. That ring is gone, or a different ring is up, by the next cue word. A box left over from the previous noun fails.
6. Every claim is visible in the cropped frame. Nothing is taken from a chip that was cropped off.
7. Say plainly that you have not listened. Levels are measured. Voice delivery needs a human ear.

The person who measured the rect does not close this gate alone. A second pass reads each still with the cue written beside it. A class of miss that pass names, and that stage 6 did not already forbid, is added here before the next full render.

Write the gate result into `VALIDATE.md`: scene, cue, still path, pass or fail, what is wrong. Failures are fixed before the video is called done.

**Learn.** Each failed check becomes one process line in `references/field-lessons.md` if the next run of this skill would behave differently. Symptom, cause, default action. No product name required. If the lesson dies when the product name is removed, it does not belong here.

## What this skill does not do

- It does not record a raw tape. That is `product-demo-record`.
- It does not own the compositor. That is `product-intro-video`.
- It does not publish. Hand off to `youtube-package` or the house publisher.
