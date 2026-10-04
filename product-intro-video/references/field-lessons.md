# product-intro-video field lessons

Lessons from real runs that change how the next run goes. Apply while briefing, scripting and recording.

## 1. Frozen demo clock needs a frozen server clock

| Symptom | Cause | Default action |
|---------|-------|----------------|
| History/activity scenes show today's date on rows written earlier in the take (a submitted form, a sent message) | Browser clock is frozen at the seed anchor, but the demo server stamps writes with the real time | Pin the demo server's clock to the same anchor (e.g. a PHP `auto_prepend_file` that sets the framework's test-now), then re-record every scene so all share one clock |

## 2. Budget clicks at glide time plus ~0.7 s

`r.click(target, {dur})` spends about 0.7 s on top of `dur` (the visibility wait, 60 Hz mouse steps and the press). Two chained clicks, such as a menu and then its item, cost about 2.5 s. Start the first click a sentence early, e.g. on the line before "Hit create".

## 3. Warm data-loading modals in `setup`

A modal or menu that fetches lists on open (pickers, lookups) opens slowly on camera and makes the next cues late. In `setup`, open it, wait for its data, and cancel. The on-camera open is then instant. The same goes for the first visit to a route on a dev server, which compiles on camera: load it once in `setup`, then go to the scene's start page.

## 4. Short cue words match earlier than you think

`r.at('And')` takes the first "and" in the line, which is often mid-sentence well before the one you meant. A late cue then cascades through the scene. Pick a distinctive word, or read the `tts.py` timings and pass `n`.

## 5. Bottom-pinned controls sit under the caption strip

The camera clamps to the page, so a composer, a modal's submit button or anything else near the viewport bottom stays in the bottom ~140 px, under the captions. Before a beat on such a control, re-`cam` to a rect that ends at the control. That lifts it above y≈940 on screen, or you can move the beat higher on the page.

## 6. Check free disk before the brief

| Symptom | Cause | Default action |
|---------|-------|----------------|
| `ENOSPC` mid-run; even the shell tool can't write its output file | 4K footage, render frames and mix WAVs from earlier runs fill the disk; `check.sh` doesn't look at free space | In the state check, run `df -h` on the project volume and `du -sh` the sibling video folders' `footage/ render/ mix/`. Under ~10 GB free, ask the user to clear an approved run's intermediates before briefing |

## 7. Reuse a sibling video folder for the same product

A second video for the same product starts faster from the first one's folder: copy its reset/stack scripts, `audio/sfx/` (costs no ElevenLabs credits) and proven `scenes.mjs` selectors, then re-cue every beat to the new word timings. Rebuild the demo stack from current main first, so the footage matches the shipped UI.

## 8. Fully animated videos run card-only

No live app is needed when every `script.json` line has a `card`: skip `rec.mjs` and `reset`, and write one `addCard` per scene in `cards.js`.

| Symptom | Cause | Default action |
|---------|-------|----------------|
| One scene's text turns transparent or moves in another scene | Every `addCard` `css` is injected globally, so class names collide across scenes | Give each scene's classes a unique prefix, or scope them under `.t-<name>` |
| Card-to-card changes are hard cuts | The compositor crossfades only into footage scenes | Build enter and exit transitions into the card's `draw` from `lt` and `scene.dur` (and `scene.endAt` on the last scene) |
| A cue word lands on the wrong beat | Cues are matched after punctuation is stripped, and single letters repeat ("A P I", "M C P") | Pass `n` for spelled-out acronyms, and check the `tts.py` timings before writing `draw` |

## 9. Designs-only features can still be live footage

| Symptom | Cause | Default action |
|---------|-------|----------------|
| No app exists yet, only design artboards (HTML mockups), and the user wants them "brought to life" | Static mockups have no navigation or state | Serve render copies of the artboards locally (with whatever runtime they need), inject one project-folder `demo.js` that wires the beats the script needs: links fade to the next screen, buttons change state, warnings clear, toasts appear. Never edit the design source. Put "Designs, not the live app" on the title card |
| A dialog or sheet is its own artboard, but the flow needs it to open over the page | Separate artboards can't stack, and pasting one page's markup into another clashes their styles | In `demo.js`, fetch the dialog page and mount its `[role=dialog]` plus its styles in an open shadow root over the current page. Playwright role, text and CSS locators reach into it, but XPath (`..`) doesn't, so give anything a scene needs a `data-` hook |

## 10. Take one real scene before recording them all

`--dry` doesn't capture frames, so capture-only bugs (wrong scroll region, a hung screenshot during a navigation) pass every dry run. After the dry run is clean, record the shortest scene that scrolls or navigates, preview one still from it, and only then record the rest.

## 11. Validation videos: number the rules and ship a checklist

When the video exists to check a build against its rules, give each rule a number at the script gate. Show it as a square chip (`r.sticker`, rot 0, one fixed corner) when it is spoken, and keep tilted stickers for jokes. After the render, write `rules.md` beside the mp4: rule, chip time (from `timeline.json` stickers), persona and screen, the source line, the code that owns it, and **Shown** or **Stated**, so reviewers know which rules the screen proves and which only the voice claims. Drive each access rule as the persona it is about (sign in per scene in `setup`), not as one all-seeing demo account.

| Symptom | Cause | Default action |
|---------|-------|----------------|
| Two chips sit on top of each other | Stickers at a fixed spot overlap when a second lands within the first's `dur` | One `rule()` helper in `scenes.mjs` that tracks when the last chip ends and drops the next one a row lower |

## 12. Don't default to the file-grid opener

The `grid` "old way" opener (a window of FINAL v2.xlsx files) was called overused after several videos. Build a fresh opener for each video in `cards.js`, from the feature's own villain, and offer it at the gate.

## 13. qa.py flags a dark-to-light crossfade as hard cuts

A navy title card crossfading into a white app screen shows up as 2–3 "hard cuts" a frame apart. Grab frames at those times before changing anything: an even fade over ~0.35 s is fine. A single listed time between two cards is a real cut (see 8).
