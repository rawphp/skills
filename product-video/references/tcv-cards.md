# tc-video cards

Read when the user asks for tc-video house style (Wow, stamps, the paper grid) inside cards. tc-video draws on a canvas: wrap its engine in `cards.js`, don't port its scenes to HTML.

## Build cards.js

Generate `cards.js` with a small `make-cards.mjs` that writes everything inside one IIFE:

1. The engine: `tc-video/engine/engine.js` up to `// ===================== ENGINE (continued)`, with `let ctx = document.getElementById('c')…` patched to `let ctx = null` and `let TL = null` dropped, so the compositor's `TL.captions` drive Wow's mouth. Then `engine/props.js`.
2. The video's `scenes-src.js`.

When `~/EA/projects/tc-video` isn't on the machine, take the engine from an earlier video's generated `cards.js`: everything between `(() => {` and that video's own scenes comment. Save it as `tcv-engine.js` beside `make-cards.mjs` and use it as step 1.

One `addCard('tcv')` template draws each scene on its own canvas. tc-video's `prog(t, a, b)` takes an absolute end time, unlike the compositor's `prog(lt, t0, dur)`. Wrap `window.setup` to load Space Grotesk, JetBrains Mono and Instrument Serif before the first frame. Card sound effects go in `card.sfx` with word cues; stamps and ticks are silent otherwise.

## Reuse an earlier tcv video

Start from three files, not one. Copy `tcv-engine.js`. Cut the earlier `scenes-src.js` into `helpers-src.js` and write a fresh `scenes-src.js`. Put the helpers' constants (`Q`, `ap`, `NAVY`) at the top of `helpers-src.js`, because lines like `const TONE = …` evaluate them at load. `make-cards.mjs` concatenates engine, helpers and scenes.

When `helpers-src.js` already exists, the earlier `scenes-src.js` can still hold scene-local helpers (`nametag`, `pill`). Grep it for `^function` before writing the new scene file, or a call to one passes `node --check` and fails only in the browser.
