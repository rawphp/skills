# product-demo-record field lessons

None yet. Add one when a run teaches something that changes how the next run goes, as symptom → cause → default action. Keep product names out.

## 2026-10-21 — a model-driven turn can end with no text

Symptom: the walk stalled at a checkpoint; the agent's turn completed but the page never showed a reply, and no "sorry" state appeared. Cause: the model called the resume tool without writing any words, so the player resumed silently and the wait condition (reply text or sorry) could never pass. Default action: a wait on an LLM turn accepts three outcomes, reply, sorry, and "the paused state is gone", and records which one happened.

## 2026-10-21 — the local dev tool injects a badge into every page

Symptom: a dark "Edit with …" badge at the bottom right of every still, covering a button on one. Cause: the local PHP server injects a loader script into every HTML response. Default action: in the record script, `context.route` that loader's path and abort it; check the first dry-run still for any overlay the product itself did not draw.

## 2026-10-21 — a video with preload=metadata records as a black box

Symptom: recap and detail pages showed a black video element in headless Chromium, while the player page showed a real frame. Cause: `preload="metadata"` and no poster, so nothing is decoded until play. Default action: after such a page settles, set `video.currentTime` to a second or so through `page.evaluate`, then take the still.

## 2026-10-21 — a spoken-answer product needs a fake recorder, not a fake device

Symptom: Chromium's fake audio device plays one file for every microphone capture, so every checkpoint would get the same answer. Default action: `addInitScript` a stub `getUserMedia` (empty MediaStream) and a stub `MediaRecorder` whose `stop()` fetches a pre-encoded opus file chosen per beat through a window variable served by `context.route`. The real upload, transcription and agent turn still run.
