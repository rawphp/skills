# Publish target: YouTube

Stage 7, when the brief or the preset names YouTube. It turns the finished video into everything the upload form asks for. Thumbnails are HTML rendered by headless Chrome, so they match the video exactly and re-render in seconds.

Read `references/youtube-rules.md` before writing titles or the description.

## Inputs

- The project folder: `video.json` (brand colours, credits, the music credit), `timeline.json` (scene times), `script.json` (the words), `cards.js` (the visual language) and the mp4. Every claim in the copy traces to the video or its source.
- The user's screenshot of the upload form, if they sent one: it shows the title they started with and which fields are left.

Ask nothing these answer. Ask only for what is missing and changes the output, such as the channel's audience when the video does not make it obvious.

Output goes to `publish/youtube/` beside the mp4. Never inside a repo's tracked tree.

## Workflow

**1. Find the hook.** Watch or read for the moment someone would click on: the cold open, the joke, the one diagram that explains the product. Pick three angles (story, promise, payoff; see the rules reference). Each becomes a thumbnail and title pair.

**2. Thumbnails.**
```bash
OUT="<mp4 dir>/publish/youtube"; mkdir -p "$OUT" && cp "$SK/publish/thumbs/base.css" "$OUT/"
```
Write `thumb-a.html`, `thumb-b.html` and `thumb-c.html` in `$OUT`, each 1280×720 and linking `base.css`. `$SK/publish/thumbs/examples/` has three worked thumbnails (chat mock-up, hub diagram, stamp over a phone) that show the kit classes in use. Set colours from the video's brand. Then render and look:
```bash
PY=$PY "$SK/publish/shoot.sh" "$OUT"   # thumb-*.png, sheet.jpg (full size), sheet-small.jpg (320×180 with a duration badge)
```
Read both sheets. Fix clipped words, text running under a mock-up, nodes off the edge, anything under the duration badge, and text you cannot read at small size. Re-render until clean. The first render nearly always has one collision. A PNG over 2 MB is rejected by YouTube; `shoot.sh` flags it.

**3. Chapters.**
```bash
python3 "$SK/publish/chapters.py" scenes "<project dir>"    # scene times and first words from timeline.json + script.json
```
Group scenes into 6 to 10 chapters and name each one. Without a project folder, take the times from the video. Validate before handing over:
```bash
printf '0:00 Cold open\n0:18 ...\n' | python3 "$SK/publish/chapters.py" check video.mp4
```

**4. Titles.** Three, one per thumbnail, each under 60 characters with the hook first. Mark the pick. The title may tease the story, but it must not promise anything the video does not show.

**5. Description.** Fill the template in the rules reference. Check that every link resolves (`gh repo view owner/repo --json visibility` for repos). Say plainly what is not released yet. Copy licence-required credits verbatim, the music credit from `video.json` included. Run the `unslop` pass on the prose, and use straight quotes.

**6. Upload answers.** Answer the form's questions from the rules reference, most importantly altered or synthetic content.

**7. Upload, only when asked.** Follow `references/studio-upload.md` (YouTube Studio driven in the user's Chrome through `browser-harness`). Write the video URL into `VALIDATE.md` under "Published".

## Output

- the thumbnail paths and a one-line pitch for each, with the pick marked
- the pick title and two A/B alternatives, each paired with its thumbnail
- the description in one fenced block, ready to paste
- the upload answers that need a decision, with the reason

## Stop

| Condition | Action |
|-----------|--------|
| No script, source or video content to check claims against | Ask for it; do not write copy from the title alone |
| A link or repo is private or 404 | Leave it out and say so |
| Music or footage licence unknown | Ask; do not publish a description without the required credit |
| Chrome missing | Set `CHROME=/path/to/chrome` or install Chrome |
