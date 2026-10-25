# product-video field lessons

Read before stage 1. Add a lesson only when the next run of this skill would change. A geometry rule (where a ring, sticker or caption may sit) goes into `scripts/gate.py` as a check, never here. A product name, ticket or path that the lesson needs in order to make sense does not belong here.

Each lesson is symptom, cause, default.

## Line

### 1. Silent assembly is the wrong product

Symptom: a fast cut with burned captions, speed ramps and no voice. It looks nothing like the last video.
Cause: the line was skipped and frames were concatenated by hand.
Default: start at stage 1. The engine is `scripts/`, called by path. Voice timings drive the cuts, the cards, the zooms and the mix.

### 2. Loudness and flash checks do not see a bad ring

Symptom: `qa.py` reports no flashes and good loudness, and the video still has a box on the wrong thing.
Cause: those checks never look at a ring against the words.
Default: `gate.py` before the full render, then stage 6 stills from the final mp4 (`stills.py`) and the second pass. A failed ring returns to stage 4 and goes into `VALIDATE.md`.

### 3. The measurer passes their own still

Symptom: the gate is marked pass and a later look fails most of the boxes.
Cause: the person who chose the rect also judged the still.
Default: stage 6. A fresh agent reads every still with the cue beside it (`references/review-pass.md`). A new class of miss becomes a `gate.py` check, or a line in that brief when it cannot be measured, before the next full render.

### 4. Filename order is not the story

Symptom: walks play in file order and the viewer never sees a job.
Cause: the plan skipped the audience's sequence.
Default: order scenes by the job (set the scope, set the price, hit the rule, do the work, end it). Say so in `PLAN.md`.

### 5. No cold open

Symptom: the video starts on footage and a thin title, where the last one opened with a problem card, a title and a chapter before every walk.
Cause: the preset's cards were treated as optional.
Default: the preset's shape is required. Use the house `cards.js` and set its walk count (`walks` on the title and chapter cards) for this video.

### 6. The output folder does not exist

Symptom: the final mux fails with "Error opening output file … No such file or directory", after the full render and mix have run.
Cause: `mix.py` does not create the folder named in `video.json` `output`.
Default: create the output folder before `render.mjs`.

## Source

### 7. The cropped chip is not evidence

Symptom: the narration describes a refusal or a label the viewer cannot see.
Cause: the walk tool drew that text in the bottom chip, and the 16:9 crop removed it.
Default: speak and ring only what remains in the cropped frame.

### 8. A demo control sold as the feature

Symptom: the video treats a picker as shipped, and the walk itself says the picker is sample data and never reaches the record.
Cause: the scene used the first screen that looked right.
Default: if the source says the control is not live, say that, and cut to the surface the source calls the live answer.

### 9. The recorded cursor hides the claim

Symptom: the box is right and a claimed word sits under the walk's own cursor dot.
Cause: the walk recorder parked the cursor on the control it last touched, and it stays there for the rest of the stretch.
Default: if the recorder and its stack are still available, add a cursor glide to empty space after the scroll and re-record only that walk (about a minute), then re-decode its cache. Otherwise pick a stretch where the cursor is off the claimed words, or take the same live surface from another walk and say so in `VALIDATE.md`.

## Recording a live app

### 10. A modal's inner scroll is not the page's

Symptom: a target below a dialog's fold stayed clipped and the ring drew on the dialog's edge.
Cause: `r.ensureVisible` scrolls the page, not a modal's inner overflow box.
Default: scroll it yourself first, `await locator.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'smooth' })); await r.wait(0.7);`, then `r.cam`.

### 11. A native tooltip is never in the capture

Symptom: the "hover for the reason" beat shows nothing.
Cause: a native `title` tooltip is drawn by the OS, outside the page.
Default: keep the hover beat and carry the tooltip text in an `r.sticker` cued on the word.

### 12. The local dev server injects a badge into every page

Symptom: a dark "Edit with …" badge at the bottom right of every still, covering a button on one.
Cause: the local PHP server injects a loader script into every HTML response.
Default: in the record script, `context.route` that loader's path and abort it. Check the first dry-run still for any overlay the product itself did not draw.

### 13. A video with preload=metadata records as a black box

Symptom: a page shows a black video element in headless Chromium while another shows a real frame.
Cause: `preload="metadata"` and no poster, so nothing is decoded until play.
Default: after such a page settles, set `video.currentTime` to a second or so through `page.evaluate`, then take the still.

### 14. A model-driven turn can end with no text

Symptom: the walk stalls at a checkpoint. The agent's turn completed but the page never showed a reply or a "sorry" state.
Cause: the model called the resume tool without writing any words, so the wait condition could never pass.
Default: a wait on an LLM turn accepts three outcomes (reply, sorry, and "the paused state is gone") and records which one happened.

### 15. A spoken-answer product needs a fake recorder, not a fake device

Symptom: every microphone capture gets the same answer.
Cause: Chromium's fake audio device plays one file for every capture.
Default: `addInitScript` a stub `getUserMedia` (empty MediaStream) and a stub `MediaRecorder` whose `stop()` fetches a pre-encoded opus file chosen per beat through a window variable served by `context.route`. The real upload, transcription and agent turn still run.

## Cards

### 16. The house tick helper takes a scale

Symptom: a tick drawn the height of the card.
Cause: a canvas `tick(x, y, s, color, k)` helper took a scale, not a pixel size, and `s = 18` was passed.
Default: use a scale of about 1.

## Publish

### 17. Scenes with on-screen text go by too fast to read

Symptom: a viewer said some scenes were over before they could read everything.
Cause: scene length is set by the voice-over line, and a scene whose card shows more words than the line speaks ends before a reader finishes.
Default: before a Watchalong import or a YouTube upload, compare each scene's on-screen word count with its duration. Above 2.5 words a second, hold the last frame until it is under. A first-time viewer rarely pauses.
