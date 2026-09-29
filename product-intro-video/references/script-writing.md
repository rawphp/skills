# Writing the script

Read before drafting `script.json`. The script is the product: every scene, zoom and card hangs off its words.

## Source and audience

- Draft from the source material agreed in the brief, read for this audience (their guide, their "who can do what" table, their tasks). Every factual line must trace to a sentence in it. With no source material, a line may only state what the dry walk showed on screen, and the user confirms each one at the gate. Jokes can exaggerate the feeling, never the fact.
- One persona drives the footage. Pick the demo account whose permissions match the audience, from the project's walk or seed docs.
- Features the audience never touches stay out.

## Story

There is no fixed shape. Build the scene list from the audience's job and what the dry walk showed.

1. List the tasks the audience does, in the order their work runs (set up, do, review, end of period). Each task is one footage scene of 9–26 s.
2. Add a card only where the screen can't make the point:
   - something that happens off the screen (emails, notifications, a nightly job): an `intro` card over the footage scene that follows it
   - the problem before the product: an opening card
   - the product name and who the tour is for: a `title` card
   - where the guides live: the `end` card
3. Pick a template for each card. `grid` fills a window with files, which suits "the old way". `title` is a brand-colour name card. `stack` slides items in, which suits messages. When none of them fits, write your own in `cards.js` (see `references/api.md`).

A feature tour often runs opener, title, 6–10 tasks, close. Use that only when it fits. A two-minute how-to can be all footage behind one title card, and a launch video can lean on cards.

## Length

Estimate before any audio. A scene runs its word count ÷ 2.5 seconds (about 150 words a minute), plus 1.4 s of lead-in and hold. The end card adds its `dur` (6 s by default). Twelve scenes of 30–55 words land near 3:20.

With no target, make the shortest video that covers the tasks.

With a target, plan the words to it: about 2.5 × (target − 1.4 × scenes − end card) words across all lines. Within about 10% counts as on target. Reach it with material, in this order:

1. More of the audience's tasks from the source, in the order their work runs.
2. More depth on each task: a second beat, a setting, a result the source describes.
3. A card for something the source documents that happens off the screen.

Never reach it with filler. No repeated points, padded voice lines, claims the source doesn't support, or longer holds. When the material runs out, stop at the longest honest script and report the gap at the gate: the target, the estimate, and what source material would cover the rest (a guide for another feature, the admin docs, release notes). The user can supply more, accept the shorter video, or drop the target.

If the target is shorter than the tasks need, cut the tasks the audience needs least and say which ones went.

After `tts.py`, check again with real numbers: the line lengths it prints, plus 1.4 s per scene and the end card. More than about 10% off means trim or add lines from the source and regenerate only those (`tts.py <id>`), before anything is recorded.

## Tone

The user picks one at the approval gate.

| Tone | Voice | Cards and stickers |
|------|-------|--------------------|
| Straight | Plain, one task per line | Stickers only as callouts ("Saves as you type"). No `punch`, `scratch` or `aside` |
| Light | Plain, with a dry line every few scenes | A few stickers; an `aside` on the title card |
| Comedic | Jokes set the pace | Stickers carry a second joke; `wobble`, `punch` and `scratch` on the opener; `pill` and `aside` on the title card |

Rules for every tone:

- Put "demo data" on screen whenever a named person is rated or judged.
- Never make a real person, a real team or a customer the butt of a joke.
- Get sign-off on sensitive product words (ratings, pay, health, performance) before a line leans on them.

### Light and comedic

- The villain is the old process (spreadsheets named FINAL FINAL, chasing people). The audience is the hero.
- The best jokes come from real screen states you find in the dry run: a refusal message, an awkward demo record, a warning that fires. Walk first, then write the gag around what's there.
- Dry one-beat lines after the fact land better than setups: "The report isn't judging. It's just counting."
- A sticker carries a joke the voice doesn't say ("Zero overdue. Suspicious."). Don't repeat the narration.
- Tease the builders, the coffee machine or the spreadsheet.

## Voice text rules

- Write for the ear: short sentences, one idea each. Commas make pauses.
- Spell out what TTS mangles ("R and D", "control C", "version two"), then map it back for captions with `captions.replace` in `video.json`.
- Plant a distinct cue word where each on-screen action should land ("Press **Start**", "until you **push**"). Repeated words are fine; scenes pick the nth one with `r.at(word, n)`.
- Give actions about a second. A click needs ~0.6 s of cursor travel before its word, and typing a sentence takes 1–1.5 s.

## Approval gate

Show the user the scene list (visual + voice line per scene) and ask three things before spending anything: tone (straight, light or comedic), narrator voice and music bed. Offer 2–3 options for each with a recommendation.

Show two numbers with it:

- **Length.** The estimate against the target, if there is one. When the source ran out before the target, say so here, with what would fill the rest.
- **Cost.** The total characters across all `vo` lines against the characters left from `check.sh`. On `eleven_multilingual_v2` each character spoken costs one, sound effects cost extra, and every regenerated line is charged again. If it won't fit with room for retakes, cut lines or say so before generating.

List premade voices with:

```bash
curl -s -H "xi-api-key: $ELEVEN_LABS_API_KEY" "https://api.elevenlabs.io/v2/voices?page_size=100&voice_type=default" \
  | python3 -c "import sys,json; [print(v['voice_id'], v['name'], v['labels'].get('accent')) for v in json.load(sys.stdin)['voices']]"
```

Match the accent to the audience and put the chosen id in `video.json` `voice.id`.

## Music

Use an instrumental that suits the tone, under a licence that allows reuse, and credit it in `video.json` `credits`. Kevin MacLeod's library (incompetech.com, CC BY 4.0) covers most tones. "Local Forecast - Elevator" is lounge music where the corporate-lobby feel is itself the joke. "Carefree" (ukulele) suits a light tone, and "Sneaky Snitch" (pizzicato) a comedic one. For a straight tone pick a calm instrumental from the same library. Direct download pattern: `https://incompetech.com/music/royalty-free/mp3-royaltyfree/<Title with %20>.mp3`, saved to `audio/music.mp3`. The mixer loops a short track and ducks it under the voice.
