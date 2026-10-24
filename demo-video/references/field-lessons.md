# demo-video field lessons

Read before stage 1. Add a lesson only when the next run of this skill would change. A product name, ticket, or path that the lesson needs in order to make sense does not belong here.

## 1. Silent assembly is the wrong product

Symptom: a fast cut with burned captions, speed ramps, and no voice. It looks nothing like the last update.
Cause: the line was skipped and frames were concatenated by hand.
Default: start at stage 1. The engine is `product-intro-video`, copied into the project. Voice timings drive the cuts, the cards, the zooms, and the mix.

## 2. A guessed ring misses the control

Symptom: the yellow box cuts through the card it should frame, includes the card underneath, or sits on empty space beside the control.
Cause: the rect was estimated from memory in source pixels. The camera and the ring then share that wrong rect.
Default: on the decoded frame at that source time, mark the control's own edges. The ring is those edges plus a few pixels. The camera is the same centre with the engine pad, so the ring sits inside the picture. Preview that still before the full render.

## 3. One ring for the whole sentence stays up too long

Symptom: the box is still on the first control after the voice has named the next one.
Cause: the ring duration is the segment, and the segment covers more than one noun.
Default: one segment and one ring per control. The ring starts at that cue word and ends before the next cue.

## 4. A 12-frame contact sheet will not catch this

Symptom: `qa.py` reports no flashes and a good loudness, and the video still has a bad box.
Cause: those checks never look at a ring against the words.
Default: stage 6 ring checks. One still per ring at `t + 0.3s`, and one still at the next cue. Fail the scene and return to stage 4. Write it in `VALIDATE.md`.

## 5. The cropped chip is not evidence

Symptom: the narration describes a refusal or a label the viewer cannot see.
Cause: the walk tool drew that text in the bottom chip, and the 16:9 crop removed it.
Default: speak and ring only what remains in the cropped frame.

## 6. A demo control sold as the feature

Symptom: the video treats a picker as shipped, and the walk itself says the picker is sample data and never reaches the record.
Cause: the scene used the first screen that looked right.
Default: if the source says the control is not live, say that, and cut to the surface the source calls the live answer.

## 7. No cold open

Symptom: the video starts on footage and a thin title. The last update opened with a problem card, a title, and a chapter before every walk.
Cause: those cards were treated as optional.
Default: stage 3 table is required. Copy the house `cards.js` and change the hardcoded walk count (squares, "OF N", figure labels) to this video.

## 8. Filename order is not the story

Symptom: walks play in file order and the viewer never sees a job.
Cause: the plan skipped the audience's sequence.
Default: order scenes by the job (set the scope, set the price, hit the rule, do the work, end it). Say so in `PLAN.md`.

## 9. The cutter ignores a plan it cannot read

Symptom: the scene plan has a tight ring and a short hold, and the film still shows the camera box for the whole segment.
Cause: the cutter copies the camera rect and sets the ring duration from the segment length. The plan never reaches the picture.
Default: before stage 5, read the cutter. It must refuse a segment with no ring rect of its own, and it must end each ring at the earlier of the hold and the next cue. Do not full-render until a still at the cue shows that.

## 10. The rect was read on a different frame

Symptom: the box is shifted by a steady amount, or one edge is the frame edge.
Cause: the page scrolled, zoomed, or animated between the measurement and the frame the cue shows. A half-visible target made the viewport the box.
Default: stage 4. Compute the source time the cue will show, read that frame twice, and only then mark the rect. If the target cannot fit, change the shot.

## 11. The rect is an inner node, or a wrapper

Symptom: the box cuts a menu, a chevron, a card bottom, or helper text. Or a sibling and a slab of empty space sit inside it.
Cause: the rect is a text span or a bare input, or it is a stretched cell with padding added on top.
Default: stage 4. Box the whole control. Content bounds, 6px, clamped to the card or dialog. A sibling inside the box fails.

## 12. The box, the note, and the caption disagree

Symptom: the note sits on a neighbour, the cursor is on a different control, or the box is up under the previous caption.
Cause: each layer picked its own target.
Default: one cue, one target. The ring and the sticker both use it, and the ring is up only while that caption is up.

## 13. The frame does not show the claim

Symptom: the box is on the right control and the words are still being typed, or the sentence that proves the line is the one underneath.
Cause: the source time was the first frame that looked close.
Default: stage 4. Name the words that must be readable, and do not cut until they are.

## 14. The measurer passes their own still

Symptom: the gate is marked pass and a later look fails most of the boxes.
Cause: the person who chose the rect also judged the still.
Default: stage 6. A second pass reads every still with the cue beside it. A new class of miss is added to stage 6 before the next full render.

## 15. The right and the bottom are the edges that miss

Symptom: the left side of the box looks fine, and a menu, icon, badge, or the last line sticks out of the right or the bottom.
Cause: the check looked at the easy edge.
Default: stage 6. Padding is about 6px on every side. Look at the right edge and the bottom edge before the box is called done.

## 16. The stroke eats the padding

Symptom: every box measures right in source pixels and still looks tight on the rendered still, about 3 px instead of 6.
Cause: the compositor draws the ring's border inside the rect, so a 5 px stroke takes most of the padding.
Default: before measuring, check where the engine draws the stroke. Draw it outside the rect (offset the ring by the stroke width) in the project's copy, then pad 6 source px.

## 17. A grid read by eye is still a guess

Symptom: rects read off a gridded, downscaled frame are 3 to 20 px off on one side, so boxes are loose on one edge and touching on the opposite one.
Cause: the eye snaps to the nearest grid line or reads a faint border, shadow or card edge as the target edge.
Default: measure edges from pixel profiles on the decoded frame at the ring's own source times (start, +0.3 s, end must agree). Read by eye only at 3× zoom or more, and only to confirm a profile.

## 18. The recorded cursor hides the claim

Symptom: the box is right and a claimed word sits under the walk's own cursor dot.
Cause: the walk tool parked the cursor on the control it last touched, and it stays there for the rest of the stretch.
Default: pick a stretch where the cursor is off the claimed words. If none exists in that walk, take the same live surface from another walk and say so in `VALIDATE.md`.
