---
name: clips-explainer-video
description: 'Plan and build a long-form YouTube "clips explainer": a narrator with a face-cam picture-in-picture stitches 10-20 interview clips of famous people into one argument, with animated 3D bridges between clips, a camera fly-in to every clip, context cards and keyword labels. Use for clips compilation, clips channel video, "Nobody''s ready for what X and Y are building" style, narrated interview supercut, or replicating the David Carbutt 3D-bridge format. Differentiator: talking-head clips plus 3D narration bridges; product-video makes narrated product videos and packages them for YouTube.'
---

If the request is to make a narrated product video (a phase update, build summary, spec approval, how-to, PR brief, demo or walkthrough of an app), stop and invoke the `product-video` skill; it calls this skill's tools by path when a stage needs them. Carry on here only for this skill's own output.

# Clips explainer video

A 35-45 minute video that answers one question by playing what two (sometimes three) famous people said about it. The narrator never shows up full-screen until the closing promo. They speak over a moving 3D world, set up each clip, and after it say what it meant. Reference cut: David Carbutt, *Nobody's Ready for What Elon & Jensen Are Building* (2026, 39:47, 1920×1080, 30 fps).

Read `references/field-lessons.md` first. The three references hold the measurements:

- `references/anatomy.md`: the reference video timed segment by segment, with every bridge's beats, labels and transitions. Copy its rhythm.
- `references/visual-spec.md`: pixel geometry, colours, type, the fly-in and pull-out transitions, context cards, audio levels. Build from it.
- `references/script-patterns.md`: the hook, bridge, fact-check and close formulas, with timing budgets. Write the narration from it.

## The format in one table

| Part | Share of runtime | What is on screen |
|---|---|---|
| Cold open (narrated) | 0:00-~1:00 | 3D fly-through, face-cam PiP, 6-10 keyword labels, glimpses of each clip playing on a 3D screen |
| Clip blocks, 16 of them | ~75% (avg 110 s, range 44-200 s) | Source footage full-screen and mostly raw. Context cards appear in some blocks (7 in the whole video) |
| Bridges, 16 after the open | ~23% (avg 30 s, range 17-52 s) | One continuous 3D camera move per bridge, PiP bottom-left for part of it, 2-13 keyword labels |
| Close + self-promo | last ~2 min | Final bridge with the payoff, then the host's face-cam full-screen, testimonials on blue panels |

The order alternates strictly: bridge, clip, bridge, clip. No two clips touch, and no two bridges do. Every change from one to the other is a 3D transition. The single exception is the hard cut from the cold open into clip 1.

## Workflow

**1. Pick the question and the two people.** One sentence that sets up a tension between them, for example "X is about to compete with the company that supplies him". Collect 6-10 source interviews from at least four separate appearances (conference stage, podcast, car or walk-and-talk, event Q&A). Note who owns each source. Using the clips is the user's call: this format uses other people's footage, and its fair-use case rests on the commentary and the transformation added in the bridges. Done when the question fits in one line and every source has a URL.

**2. Cut the clips.** Pull 16 clip blocks that average ~110 s, so the clips add up to about 29 min. Ask for 100-200 s blocks up front. Blocks picked from podcasts and stage talks drift to ~80 s, which leaves 16 blocks near 24 min and the video near 35 min. A few 44-60 s blocks are fine when the rest run long. Each block makes one point, starts on a complete sentence, and ends on a line that lands. Order the blocks into a chain where each one raises the question the next one answers. Alternate the two people roughly every block or two, and save the most visual claim for the last block (the reference ends on rockets and space).

Cut from transcripts. YouTube auto-caption VTT repeats each rolling line and timestamps only paragraph starts, so first collapse every source into timestamped ~12 s paragraphs with a short dedupe script. When agents read the transcripts, give each speaker a reader of their own working from their own files. Every in/out read off a transcript is an estimate, so mark it that way and check it by ear. Done when every block has an in/out timecode checked by ear, a one-line point and a "listen for" cue, and the blocks add up to about 29 min.

**3. Write the narration.** Follow `references/script-patterns.md`: the cold open teases the payoff, each bridge recaps the last clip and tees up the next one, and two or three bridges add "to be fair to the numbers" corrections. One subscribe line goes in the first bridge. The video closes with the payoff, then the promo. Done when each bridge reads aloud within its time budget and names the next speaker.

**4. Record the narrator.** Face-cam at desk, mic in shot, window light, 3:4 crop, recorded as one take per bridge. Deliver the lines animated with hands in frame, since the PiP is small and gestures sell energy. Done when every bridge has a clean take and a word-level transcript (for label timing).

**5. Build the 3D bridges.** One continuous camera path per bridge through low-poly, white-box sets that stand for the topic (factories, wafers, data centres, coin stacks, rockets). Pop in keyword labels on the narrator's stressed words, and start and end each bridge on a 3D screen playing the adjacent clip. Exact styles are in `references/visual-spec.md`. The deterministic route is Remotion with `@remotion/three`. Blender works too. Done when each bridge renders at 1920×1080 30 fps with its exit screen framed for the fly-in.

**6. Assemble.** Lay the timeline out as bridge, fly-in, clip, pull-out, then the next bridge. Composite the PiP over the bridges only. Add context cards inside the clips where a name, place or number needs a picture. Mix narration and clips to the same loudness. Done when the cut matches the segment pattern in `references/anatomy.md` and plays clean end to end.

**7. Package.** Package it with `product-video` stage 7 (`presets/publish/youtube.md`) for thumbnails, title and description. The title pattern is "Nobody's Ready for What A & B Are Building".

## Field lessons

Append to `references/field-lessons.md` only a lesson that will improve the next run of this skill on any topic.
