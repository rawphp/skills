# YouTube upload rules and copy template

Read when writing titles, the description or the upload answers. These limits are checked by YouTube at upload; everything else here is a default that worked.

## Hard limits

| Field | Limit |
|-------|-------|
| Thumbnail | 1280×720 (16:9), under 2 MB, PNG or JPG |
| Title | 100 characters. About 60 show in search and on mobile, so the hook goes first |
| Description | 5,000 characters. About 150 show above "more" |
| Chapters | First line `0:00`, at least 3 chapters, each at least 10 s, times ascending, one `M:SS Title` per line in the description |
| Hashtags | The first 3 in the description show above the title. Use 3 to 5; YouTube ignores every hashtag on a video that over-tags |
| A/B testing | Up to 3 thumbnails and 3 titles; YouTube splits traffic and keeps the winner by watch time |

## Thumbnail defaults

- One idea per thumbnail, 3 to 5 words of text, 100 px type or bigger. Text must read on `sheet-small.jpg` (320×180).
- Reuse the video's own visual language: its palette, a real frame's layout, the joke the video opens with. A thumbnail that looks like a different video loses the click on the second look.
- Keep the bottom-right ~220×90 px clear: YouTube puts the duration badge there.
- Brand chip top-left, small. The headline carries the thumbnail, not the logo.
- Do not show text, numbers or UI the video never shows.

## Three angles

Each thumbnail pairs with one title, so the A/B test compares whole pitches, not fonts.

| Angle | Thumbnail | Title |
|-------|-----------|-------|
| **Story** (usually the pick) | The cold open or the problem, mid-disaster | The situation in the viewer's words, then what fixes it |
| **Promise** | The one diagram that explains the product | What it does, plainly, with the product name |
| **Payoff** | The punchline or the "after" state | The benefit, or the joke's callback |

## Description template

```
<Two sentences, the hook. The problem in the viewer's words. These show above "more".>

<What the product is and how it works, in two or three plain sentences.>

What's covered:
- <one line per chapter-worthy idea, concrete: names, commands, numbers>

Chapters
0:00 <title>
...

<Links: each one checked to resolve. Repos: gh repo view owner/name --json visibility>

<Honest status: version, what isn't published yet, how to install today.>

<Licence-required credits, verbatim. Kevin MacLeod / incompetech CC BY 4.0:>
Music: "<Track>" by Kevin MacLeod (incompetech.com)
Licensed under Creative Commons: By Attribution 4.0
http://creativecommons.org/licenses/by/4.0/
Voice: ElevenLabs

#Tag1 #Tag2 #Tag3
```

Chapter titles: 2 to 6 words each. Name what happens ("The CLI, for you and your agents"), not the section type ("Part 3").

## Upload answers

| Question | Default |
|----------|---------|
| Altered or synthetic content | **No** for animation, screen recordings and diagrams with an AI narrator. **Yes** if it shows a realistic person saying or doing something they didn't, or realistic footage of events that didn't happen (AI avatars, cloned voices of real people, generated realistic scenes) |
| Made for kids | No |
| Category | Science & Technology for dev tools; Education for tutorials |
| Paid promotion | Only if a sponsor paid for it |
