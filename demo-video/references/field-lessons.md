# demo-video field lessons

Read before stage 1. Add a lesson only when the next run of this skill would change. A product name, ticket, or path that the lesson needs in order to make sense does not belong here.

## 1. Silent assembly is the wrong product

Symptom: a fast cut with burned captions, speed ramps, and no voice. It looks nothing like the last update.
Cause: the line was skipped and frames were concatenated by hand.
Default: start at stage 1. The engine is `product-intro-video`, copied into the project. Voice timings drive the cuts, the cards, the zooms, and the mix.

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

## 14. The measurer passes their own still

Symptom: the gate is marked pass and a later look fails most of the boxes.
Cause: the person who chose the rect also judged the still.
Default: stage 6. A second pass reads every still with the cue beside it. A new class of miss is added to stage 6 before the next full render.

## 18. The recorded cursor hides the claim

Symptom: the box is right and a claimed word sits under the walk's own cursor dot.
Cause: the walk tool parked the cursor on the control it last touched, and it stays there for the rest of the stretch.
Default: pick a stretch where the cursor is off the claimed words. If none exists in that walk, take the same live surface from another walk and say so in `VALIDATE.md`.

## 20. The parked cursor is fixed at the source when the recorder is at hand

Symptom: the walk's cursor sits on the claimed words for the whole stretch (lesson 18), and no other walk shows that surface.
Cause: the recorder scrolled the target into view and left the mouse where the last click was.
Default: if the walk recorder and its stack are still available, add a cursor glide to empty space after the scroll and re-record only that walk (about a minute), then re-decode its cache. Substitute another walk's surface only when re-recording is not possible.
