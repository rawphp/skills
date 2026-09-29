# product-intro-video field lessons

Lessons from real runs that change how the next run goes. Apply while briefing, scripting and recording.

## 1. Frozen demo clock needs a frozen server clock

| Symptom | Cause | Default action |
|---------|-------|----------------|
| History/activity scenes show today's date on rows written earlier in the take (a submitted form, a sent message) | Browser clock is frozen at the seed anchor, but the demo server stamps writes with the real time | Pin the demo server's clock to the same anchor (e.g. a PHP `auto_prepend_file` that sets the framework's test-now), then re-record every scene so all share one clock |

## 2. Budget clicks at glide time plus ~0.7 s

`r.click(target, {dur})` spends about 0.7 s on top of `dur` (the visibility wait, 60 Hz mouse steps and the press). Two chained clicks, such as a menu and then its item, cost about 2.5 s. Start the first click a sentence early, e.g. on the line before "Hit create".

## 3. Warm data-loading modals in `setup`

A modal or menu that fetches lists on open (pickers, lookups) opens slowly on camera and makes the next cues late. In `setup`, open it, wait for its data, and cancel. The on-camera open is then instant.

## 4. Short cue words match earlier than you think

`r.at('And')` takes the first "and" in the line, which is often mid-sentence well before the one you meant. A late cue then cascades through the scene. Pick a distinctive word, or read the `tts.py` timings and pass `n`.

## 5. Bottom-pinned controls sit under the caption strip

The camera clamps to the page, so a composer, a modal's submit button or anything else near the viewport bottom stays in the bottom ~140 px, under the captions. Before a beat on such a control, re-`cam` to a rect that ends at the control. That lifts it above y≈940 on screen, or you can move the beat higher on the page.
