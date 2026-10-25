# Project files and scene API

Read when writing `video.json`, `script.json`, `scenes.mjs` or `cards.js`. Starting points are in `templates/`.

## Contents
- video.json
- script.json (voice lines and cards)
- scenes.mjs (footage beats)
- Camera, rings and stickers
- Custom cards (cards.js)

## video.json

| Key | Meaning |
|-----|---------|
| `output` | Final mp4 name, written by `mix.py` |
| `app.base`, `app.login` | App origin and the path that signs the demo persona in (a dev bypass such as `/?as=user`) |
| `app.hideCss` | CSS injected into every page to hide dev chrome: framework badges, persona chips, cookie banners |
| `app.localStorage` | Keys set before load to dismiss splashes and tours (use the exact value the app checks, often `"true"`) |
| `app.locale`, `app.timezone` | Optional, e.g. `"en-GB"`, `"Europe/London"`. Match the audience so dates and money read right. Default: this machine's |
| `reset` | `{cmd, cwd, before: [ids]}` runs once before recording any listed scene (and after a dry run of one). Scenes that write data must be listed |
| `pace` | Optional `{lead, tail}` in seconds: the hold before each line's voice (default 0.6) and after it (footage 0.8, cards 0.9). `{lead: 0.35, tail: 0.35}` suits a high-energy video. Re-record footage after changing it |
| `voice` | ElevenLabs `id`, `model`, `stability`, `similarity`, `style`, `speed` |
| `captions.replace` | Spoken phrase → written form, e.g. `"R and D": "R&D"` |
| `brand` | CSS colours: `primary` (title/end background), `accent`, `accent2`, `highlight` (rings, pill), `ink` |
| `music` | `{file, from: sceneId, lufs: -27}`. The bed starts at `from`; a scratch cold open gets its own bed that the scratch cuts |
| `sfx` | Extra effects `{name: prompt}` or `{name: [prompt, seconds]}`; defaults: scratch bonk whoosh pop click typing chime ding |
| `end` | End card `{eyebrow, title, lines: [html], note, dur}` appended after the last scene. Add `template` to use a card from `cards.js` |
| `credits` | Lines on the end card (voice, music licence) |

## script.json

An ordered array. Each line is one scene and one voice-over clip.

```json
{ "id": "s05", "vo": "Voice line." }                                   // footage: needs scenes.mjs s05
{ "id": "s01", "vo": "...", "card": { "template": "grid", ... } }      // card only, no footage
{ "id": "s12", "vo": "...", "intro": { "template": "stack", ..., "until": "KPI" } }  // card over the start of footage
```

A cue is a word (`"at": "Final"`, punctuation ignored), with `n` for its nth occurrence and `off` in seconds, or a number of seconds from scene start.

Built-in templates are below. `card` and `intro` take any of them, or one from `cards.js`.

| Template | Fields |
|----------|--------|
| `grid` | `window` (title bar text), `icon` (`xls` `doc` `pdf` `ppt` or an emoji), `items: [{text, at, icon?}]` (pop in on cue), `wobble: {at}`, `punch` (sticky note at the scratch), `scratch: true` (record scratch 0.75 s before the end; blurs the window) |
| `title` | `eyebrow`, `title`, `pill: {text, at}` (dings), `aside: {text, at}`, `sub: {text, at}`, `hold` (seconds after the voice, default 0.9) |
| `stack` | `heading`, `items: [{icon: "mail" or emoji, tone: "accent" or "highlight", from, title, sub, at}]` |
| any card | `sfx: [{name, at, vol}]` for extra sounds. Every `items[].at` pops and a `pill.at` dings |
| any intro | `until`: the cue where it fades to the footage |

## scenes.mjs

```js
export default {
  s05: {
    setup: async (page, ctx) => { await ctx.goto('/things?id=42'); },  // start state; not captured
    run: async (r, page, ctx) => { /* beats */ },
  },
};
```

`setup` lands by URL, never by search. `run` paces every beat to the voice:

| Call | Does |
|------|------|
| `await r.at(word, n = 1, off = 0)` | Wait until the narrator says the word. Logs "late Xs" when the previous beat overran |
| `await r.click(locatorOrRect, {dur, dx, dy, after})` | Glide the cursor there (scrolling it into view first), click, ripple and sound |
| `await r.move(target, {dur})` | Glide without clicking (hover states still fire) |
| `await r.type(text, {delay})`, `await r.selectAll()` | Type with keyboard sound. Select-all first: inputs can remember the last scene's text |
| `await r.cam(target, {zoom = 2, pad = 1.35, dur = 0.9, dx, dy})` | Zoom to fit a locator or `{x, y, width, height}` in viewport CSS px |
| `r.camOut(dur)` | Back to the full screen |
| `await r.ring(target, {dur, pad})` | Yellow highlight box around a target (follows the camera) |
| `r.sticker(text, {x, y, rot, size, dur, sfx})` | Sticky-note joke in screen px (1920×1080). Text that starts with an emoji renders as a bare emoji with the rest invisible, so put an emoji at the end |
| `r.sfx(name, vol)` | Play a sound now (`bonk`, `chime`, a custom one) |
| `await r.scrollBy(locator, dy, dur)`, `await r.ensureVisible(locator, {top})` | Smooth scroll of the element's scroll container |
| `await r.rect(locator)`, `await r.wait(s)` | Bounding box, plain wait |

After a click that navigates or changes state, wait for the new state (`await x.waitFor()`) before the next cue. A timer is not a state.

## Camera, rings and stickers

- The camera fits the target plus `pad`, capped at `zoom`. A target wider than about 1400 px can't zoom past 1.2, so frame the part that matters (a row's left half, one button).
- Zoom in on the thing the voice names, zoom out before a navigation or a scroll, and give each zoom about 0.9 s.
- A ring is for "look here" on text or a button. Keep it to about 2–3 s.
- Keep stickers clear of the caption strip (bottom 140 px) and of whatever the camera is showing.
- To fix a sticker in a recorded scene, edit `footage/<id>/meta.json` `stickers[].text` and rebuild. No retake.

## Custom cards (cards.js)

When no built-in template fits, add `cards.js` to the project folder. `render.mjs` loads it into the compositor before the first frame. Register each template with `addCard(name, {css, build, draw})`:

- `css` styles the card. Scope it under `.t-<name>` and give that root a solid background colour, under any gradient (`radial-gradient(...) #0b1020`). The crossfade into the next scene reads it, and a gradient alone reads as transparent, so the fade flashes light grey. The compositor styles some class names globally (`.item`, `.big`, `.pill`, `.sub`, `.line`, `.note`, `.aside`, `.eyebrow`), and they apply inside `.t-<name>` too. Prefix your own class names or override every inherited property.
- `build(card)` returns the card's HTML once. Escape text with `esc()`.
- `draw(el, card, lt, scene)` runs every frame with `lt`, the seconds since the scene started. Set styles from `lt` only (no timers or CSS transitions), so any frame renders the same on its own. Draw the card's frame (box, rail, strip) by 0.2–0.4 s and cue only the content to words; a card whose first element waits for a word 3 s in sits blank that long. Check each scene's first still (start + 3 s).
- Any field in the card that has an `at` gets a `t` in scene seconds, as in the built-in cards.
- In scope: `esc`, `prog(lt, t0, dur)` (0→1), `ease`, `easeOut`, `back` (overshoot), `isEmoji`, the brand variables (`--primary`, `--accent`, `--accent2`, `--highlight`, `--ink`) and the fonts Inter and Caveat. The frame is 1920×1080.

```js
// cards.js
addCard('quote', {
  css: `.t-quote { background: var(--primary); color: #fff; }
        .t-quote .q { position: absolute; left: 240px; right: 240px; top: 340px; font-size: 72px; font-weight: 800; line-height: 1.15; }
        .t-quote .who { position: absolute; left: 240px; top: 680px; font-size: 34px; font-weight: 600; color: var(--accent); }`,
  build: (c) => `<div class="q">${esc(c.text)}</div><div class="who">${esc(c.who.text)}</div>`,
  draw(el, c, lt) {
    const q = easeOut(prog(lt, 0.1, 0.6));
    el.querySelector('.q').style.cssText = `opacity:${q};transform:translateY(${(1 - q) * 40}px)`;
    el.querySelector('.who').style.opacity = easeOut(prog(lt, c.who.t, 0.5));
  },
});
```

```json
{ "id": "s09", "vo": "One team lead put it best. We stopped chasing people.", "card": { "template": "quote", "text": "We stopped chasing people.", "who": { "text": "Team lead, demo data", "at": "stopped" } } }
```

Run `node --check cards.js` as soon as it is written or generated, so a bracket slip doesn't surface minutes into a 4K render. It doesn't catch an undefined name, which throws a `ReferenceError` in the browser and aborts a whole `--at` batch, so render one still before the batch. Preview a custom card with `render.mjs --at` before the full render.

A fully animated video needs no live app: when every `script.json` line has a `card`, skip `rec.mjs` and `reset`, and write one `addCard` per scene. Every `css` is injected globally, so class names that aren't under their own `.t-<name>` collide across scenes. Generate a shared base stylesheet per template too (`.t-${name}`): the compositor puts only `.t-<name>` on the card root, so a base scoped to any other class never matches and headings render as unstyled text. Cards have no sticker layer. A joke note is an element inside the card, popped from `lt` with `back()` and kept clear of the bottom 140 px.
