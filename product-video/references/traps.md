# Traps

Read before the first recording, and whenever a stage fails. Symptom → cause → default action.

## Capture

| Symptom | Cause | Default action |
|---------|-------|----------------|
| Zoomed shots are soft; frames are 1920 wide | Screencast and `recordVideo` return CSS-size frames whatever `deviceScaleFactor` is | Keep `rec.mjs` as is: it polls `Page.captureScreenshot` at clip scale 2 on a DSF 2 page (~15 fps, 3840×2160). Don't "fix" it back to screencast |
| Page motion looks steppy but the cursor is smooth | Capture runs at ~15 fps; the compositor draws the cursor at 30 fps | Expected. Keep scrolls at 0.7 s or longer and zoom out during them. Heavy pages (GitHub) capture at 7–8 fps: keep their scrolls short too |
| A scene's footage is minutes long and the cue log has a 30 s gap | A `waitFor` timed out (a click missed, or the state never arrived) | Read `footage/<id>-fail.png`, fix the beat, re-record that scene only |
| The second click lands on the wrong control | The layout was still settling after the previous click (year or tab switch) | `await page.getByText('new state').waitFor()` between them |
| Typed text is appended to old text | The app remembers the last search or input across pages | `await r.selectAll()` before `r.type` |
| A splash or tour covers the first scene | The dismissal lives in localStorage | Find the key and exact value in the app source and put them in `app.localStorage` |
| A select "does nothing" on camera | Choosing the already-selected option sends no request | Start the scene on a different option |
| A feature driven by today's date (a month under review, a window that opens on the 8th) hides itself or shows the wrong period | `rec.mjs` doesn't fake the browser clock, so the page and the demo server can disagree on the date | Pin both to the same instant: `page.clock.install({ time })` once per run in the first scene's `setup` (keep a flag on `ctx`), then `ctx.goto` so the app reads it |
| History or activity scenes show today's date on rows written earlier in the take (a submitted form, a sent message) | The browser clock is frozen at the seed anchor, but the demo server stamps writes with the real time | Pin the demo server's clock to the same anchor (e.g. a PHP `auto_prepend_file` that sets the framework's test-now), then re-record every scene so all share one clock |
| A composer, a modal's submit button or another bottom-pinned control sits under the captions | The camera clamps to the page, so anything near the viewport bottom stays in the bottom ~140 px | Before a beat on such a control, re-`cam` to a rect that ends at the control (that lifts it above y≈940), or move the beat higher on the page |
| A third-party page (GitHub) shows logged out | `rec.mjs` opens a context with no login | Have the user save a session once (`"$SK/node_modules/.bin/playwright" open --channel chrome --save-storage /tmp/<name>.json https://github.com/login`), `page.context().addCookies(...)` from it in each scene's `setup`, and delete the file after the last take |
| A Chrome extension the tour needs doesn't load | Branded Chrome no longer loads unpacked extensions from flags | Stand in for `chrome.storage.local`, run the extension's content scripts with `page.evaluate(src)` (not bound by the site's CSP), and add its CSS as an adopted stylesheet |
| A native `prompt()`, `confirm()` or `title` tooltip never shows in the capture | The browser draws them outside the page screenshot | Answer a dialog with `page.on('dialog')`. Keep a hover beat. Put the answer or the tooltip text on screen as a sticker cued on the word |
| A target below a dialog's fold stays clipped and the ring lands on the dialog's edge | `r.ensureVisible` scrolls only when the target is outside the viewport band, and a target clipped by the dialog's own overflow can sit inside that band | Scroll it first, `await loc.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'smooth' })); await r.wait(0.7);`, then `r.cam` |
| A video element records as a black box | `preload="metadata"` and no poster, so nothing is decoded until play | After the page settles, set `video.currentTime` to about a second with `page.evaluate`, then capture |
| A scene stalls waiting on a model-driven turn that finished | The model can end its turn with no text, so neither a reply nor an error state ever shows | Wait for any end state (a reply, the error state, the pending state clearing) and log which one happened |
| A chat or assistant scene's rings land 6–10 s late, or the reply differs (sometimes wrong) on every take | Each model turn takes longer than the voice allows, and turns are not deterministic | Send the turns in `setup`, then walk the finished conversation on cue with cam and ring; type live only when the reply is instant. Ask a question with one short factual answer that does not depend on today's date, find the reply by structure (the assistant group's first paragraph), and read the whole visible reply in every ring still |
| A terminal channel has to appear in a live-app video | `rec.mjs` records pages, not terminals | Record the real session with asciinema (an interactive TUI driven by expect), replay it in a local asciinema-player page and record that page. Start the player 122 px down, hide `.ap-overlay*` and start playback on the scene's first frame. Arm ahead: play until the next output is on screen, pause, hold until the cue, replay at 4–6x, and never call `play()` after the last cue (a finished cast restarts). An Ink TUI under an expect pty flushes everything at exit: cut the cast before the alt-screen leave (`\x1b[?1049l`) and the typed `/exit`. Ring only lines still on the player's screen |
| A scene needs a link the app emails (sign-in, invite) and the local stack sends none | Dev mode writes it to a server log | Record the log's byte size in `setup`, read only what was appended after the click, `page.goto(url)` on the cue, and cue a flat sticker ("From the email"). Count the app's per-address send limit across the dry walk, dry run and every take |
| A confirm dialog's button is never found | Some alert dialogs have role `alertdialog`, not `dialog` | Query `[role=alertdialog]` |
| A graph canvas (React Flow) won't move with the wheel | The wheel zooms | Pan with `page.mouse.down()`, `r.move` 300 px, `page.mouse.up()`, starting on empty canvas: edges carry `nopan` |
| Every microphone capture gets the same answer | Chromium's fake audio device plays one file for every capture | `page.addInitScript` a stub `getUserMedia` (an empty `MediaStream`) and a stub `MediaRecorder` whose `stop()` returns a pre-encoded clip picked per beat (a window variable naming a file served by `page.route`). The real upload and everything after it still run |
| A dry run writes to a live third-party service | `--dry` still runs every beat | Fake those POSTs with `page.route` when `process.argv` includes `--dry` |
| Every dry run passes, then a recording has the wrong scroll region or hangs on a screenshot during a navigation | `--dry` doesn't capture frames, so capture-only bugs never show | After a clean dry run, record the shortest scene that scrolls or navigates and preview one still from it before recording the rest |

## Timing

| Symptom | Cause | Default action |
|---------|-------|----------------|
| `late 0.9s at "word"` | The beat before it (typing, a scroll, a slow page) overran | Start that beat earlier (`r.at(prev, 1, -0.5)`), type faster, or cut text. Under 1 s late is usually invisible |
| `no word "x" #2` | Cue words match without punctuation and case; the nth one doesn't exist | Print the timings (`python3 tts.py <id>` lists them) and pick the right n |
| A click lands late although its `dur` fits | `r.click(target, {dur})` spends about 0.7 s on top of `dur` (visibility wait, 60 Hz mouse steps, the press); a menu and then its item cost about 2.5 s | Budget clicks at glide time plus ~0.7 s. Start the first of two chained clicks a sentence early, e.g. on the line before "Hit create" |
| A ring on a card just scrolled into place lands 30–40 px off on tape | Recorded frames trail the cue log by about 0.5 s, so the scroll is still moving at ring + 0.3; a scroll started right after a ring drags that ring too | Start a scroll at least a sentence (≥ 1 s) before the ring's cue, and the next scroll only after the previous ring ends |
| A modal or menu opens slowly on camera and the next cues run late | It fetches lists on open (pickers, lookups), or it is the first visit to a route on a dev server, which compiles on camera | In `setup`, open it, wait for its data and cancel; load a route once, then go to the scene's start page. The on-camera open is then instant |
| A cue fires well before the word you meant and the rest of the scene cascades late | `r.at('And')` takes the first match, and short words turn up mid-sentence; single letters of a spelled-out acronym ("A P I") repeat | Pick a distinctive word, or read the `tts.py` timings and pass `n` |
| The video runs longer than planned | Each scene holds 0.6 s before and 0.8 s after its voice | Trim voice lines, not the holds |

## Voice and sound

| Symptom | Cause | Default action |
|---------|-------|----------------|
| HTTP 403 `output_format_not_allowed` | Free tier allows only `mp3_44100_128` | Leave `tts.py` as is |
| Acronyms read wrong | TTS reads letters or words its own way; a spelled plural ("K P Is") is read as letters plus "is" | Try the plain acronym ("KPIs") first. Test any spelling over several takes in the sentence it will sit in, then map it back in `captions.replace` |
| A name like "Phase four B" gets a 0.8–1.4 s pause inside it on some lines | TTS treats the letter as a new phrase | Hyphenate it ("four-B", mapped back in `captions.replace`) and scan the `tts.py` word timings for gaps over 0.5 s inside a name before recording |
| Edited a line but the old audio plays | `tts.py` skips lines that already have audio | `python3 tts.py <id>` regenerates just that line. Its word timings move, so re-record that scene |
| Music louder than voice in places | The sidechain ducks only under speech | Lower `music.lufs` (-27 default; -30 is quieter) |

Credits: the ElevenLabs free tier needs attribution and excludes commercial use. Say so to the user and keep "Voice: ElevenLabs" in `credits`.

## Rings

| Symptom | Cause | Default action |
|---------|-------|----------------|
| A ring needs fixing on a scene that cannot or need not be retaken (bunched or overrunning rings, a wrong rect) | — | Rings, cams and stickers are render-time data: edit `footage/<id>/meta.json`. Re-measure the control on the same screen at the same viewport and write the rect there |
| Rings re-measured on a separate page sit ~15 px left of right-anchored targets | `rec.mjs` hides scrollbars, so the recorded page is wider | Give every measuring page `app.hideCss` plus `*{scrollbar-width:none!important}`, or measure on the recorded frames (unzoomed frame px = page px) |
| Chat and terminal rings fail for empty space on the right or strokes through neighbouring lines | `r.ring(locator)` boxes the element, and paragraphs and terminal lines are full-width blocks | Ring the text extent (a DOM Range rect for chat; the non-space span of `.ap-line`) with a small pad, and pull packed lines in to the glyph box (y+7, h−14 on a 31 px terminal row) |
| Every ring in a zoomed live scene fails on padding | `r.ring` already adds `pad` (8 CSS px) and the zoom scales it; a rect with its own padding doubles it | Pass rects with no padding and set `r.ring(x, { pad })` to about 8 ÷ zoom. For a card, target the nearest ancestor holding the card's label |
| A ring is failed for a stroke on a divider although the padding looks right | The ~5 px stroke is drawn outside the rect | Keep the rect edge ≥ 6 px inside any divider, border or neighbouring pill. Siblings closer than the stroke: ring the named group, or zoom first |
| A ring around a focused field reads as one thick border | The field's focus outline sits ~1 px outside its box | Pad 7 on a focused field; pull in any side with a neighbouring control within 10 px |
| The cursor sits on the label the line names, right after the scene clicked it | — | After `r.click` on a control the next ring names, glide the cursor 70–150 px down off it before the ring |

## Render

| Symptom | Cause | Default action |
|---------|-------|----------------|
| A still shows a half-size picture in a corner | Footage frames are not 2x | Re-record; check a frame is 3840×2160 |
| A zoom does nothing | The target is too wide to zoom (see api.md) | Frame a narrower rect |
| `unknown card template "x"` | Nothing registered that name | Check the `addCard` name matches `script.json` and `cards.js` sits in the project folder |
| A custom card jumps or flickers between frames | `draw` depends on something other than `lt` (a CSS transition, a timer, state from the last frame) | Compute every style from `lt` alone |
| Card-to-card changes are hard cuts | The compositor crossfades only into footage scenes | Build enter and exit transitions into the card's `draw` from `lt` and `scene.dur` (`scene.endAt` on the last scene) |
| `qa.py` lists 2–3 "hard cuts" a frame apart | A dark card crossfading into a light app screen | Grab frames at those times before changing anything: an even fade over ~0.35 s is fine. A single listed time between two cards is a real cut |
| Fonts fall back to system | Google Fonts didn't load (offline), or a `cards.js` called `document.fonts.load()` before its stylesheet `<link>` arrived (only the first still falls back) | Render with network access. In `cards.js`, await the link's `onload`/`onerror` in `setup` before `document.fonts.load()` (the house `cards.js` does) |
| Disk fills up | 4K frames run about 1 GB per 3 minutes; mix WAVs about 300 MB | Remove `footage/` only after the final cut is approved |

## Designs only (no app yet)

| Symptom | Cause | Default action |
|---------|-------|----------------|
| Only design artboards (HTML mockups) exist and the user wants them "brought to life" | Static mockups have no navigation or state | Serve render copies of the artboards locally (with whatever runtime they need) and inject one project-folder `demo.js` that wires the beats the script needs: links fade to the next screen, buttons change state, warnings clear, toasts appear. Never edit the design source. Put "Designs, not the live app" on the title card |
| A dialog or sheet is its own artboard, but the flow needs it to open over the page | Separate artboards can't stack, and pasting one page's markup into another clashes their styles | In `demo.js`, fetch the dialog page and mount its `[role=dialog]` plus its styles in an open shadow root over the current page. Playwright role, text and CSS locators reach into it, but XPath (`..`) doesn't, so give anything a scene needs a `data-` hook |

## Safety

- A shell rule may block `rm -rf` on generated folders; `rec.mjs` clears each scene folder itself, so don't delete by hand first.
- Record against demo data only. Scenes that write (start, reopen, save) must be in `reset.before`, and you run the reset again after the last take.
- Stop any app servers you started, and say which ones you left running.
