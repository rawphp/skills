# Second-pass ring review: the reviewer brief

Stage 6 hands this brief, filled in, to a fresh agent (model: SKILL.md stage 6). Never give it to the agent that measured the rects. Run `stills.py` from the final mp4 first, so the stills and the manifest exist. Fill `<project>` and `<N>` (the walk or chapter count), then send everything below the line as the prompt.

---

You are the independent second pass on a product video's "ring" overlays. The person who measured the rects must not pass their own stills, so you judge them cold. Report only; do not edit any file.

Project folder: `<project>/`
- `review/manifest.json`: one entry per ring: scene, seg, cue word, still path (frame 0.3 s after the yellow ring appears), after_still (frame just after the ring should have ended), sticker text if any, and the full narration line of that scene.
- `review/ring-1.jpg` … `ring-N.jpg`: contact sheets, six stills each (960×540 tiles, label top-left "scene-seg @time cue"), in manifest order.
- `review/after-1.jpg` … `after-N.jpg`: the matching "after" stills, same order.
- The individual full-size stills are `review/<scene>-<seg>.jpg` and `review/<scene>-<seg>-after.jpg` (1920×1080). Open a full-size still whenever a tile is too small to judge an edge or read text, and for every edge that looks borderline on a tile. Do not pass a borderline edge from a tile.

The yellow rounded box is the ring. The caption at the top of the frame is the spoken line (at the bottom on a scene with `capBottom`). A tilted yellow note is a sticker.

For EVERY ring in the manifest, check each line below. One miss fails the ring. A check you cannot make is a fail, say why.
1. The claimed words (what that part of the narration line names, around the cue word) are readable in the frame. The frame is not mid-typing unless the line is about typing.
2. The whole target control is inside the picture with a margin. No box edge is the frame edge.
3. The box contains the whole target: a row includes its trailing menu/icon; a card is the whole card; a field includes its label, adornment and helper text; a toast is the whole toast.
4. No sibling control sits inside the box (a neighbouring row, column, button, or a slab of empty space). Padding looks about 6 source px (about 8 px on the 1920 frame) on every side. Check the RIGHT and BOTTOM edges on purpose.
5. If there is a sticker, it names the same target as the box and does not cover a neighbouring control or claimed words.
6. The recorded walk cursor (a small disc with an arrow) does not cover a claimed word.
7. In the AFTER still, the previous ring is gone, or a different ring is up on the next target. A box left over on the previous target fails.

Then also open `<mp4 dir>/contact-sheet.jpg` (one frame per scene of the whole video) and report anything broken on the cards: clipped text, overlapping elements, wrong counts (<N> walks, "WALK 0n / 0<N>"), a stamp off-centre, credits unreadable.

Output format: a markdown table with one row per ring: scene-seg | cue | PASS or FAIL | what is wrong (specific: which edge, which sibling, which word). Then a short list for the cards. Then a one-line count: N pass, M fail. Be strict and concrete; do not soften a fail.

---

## Later rounds

After fixes, re-run `stills.py --only <the failed keys>` and send the same seven checks for only those rings, naming what changed in each and asking for the same table and count. A ring that cannot be improved (no more margin exists in the source) is named as such, and the reviewer says whether it still fails and why. Record the verdict per round in `VALIDATE.md`.
