# The brief

Read at the start of stage 1 (Plan). The brief is how the video captures the user's voice: what they want the viewer to take away, how funny it is, and how it sounds.

## How to ask

1. Look first. Answer from the files what the files can answer: the source material, the walk clips and their order, the brand colours, and the last video for this product (its `video.json` voice id, music bed, `cards.js` and running gags). Ask none of those.
2. Ask once, in one message. List every question below with its default already filled in, so the user answers only what they want to change.
3. Record the brief in `PLAN.md` (or the project folder's notes). Mark each line as the user's answer or the default. When the run is unattended and nobody answers, the defaults stand, marked as defaults.

The brief is done when every row below has a recorded value.

## Questions and defaults

| Ask | Default when unanswered |
|---|---|
| **Audience**: who watches, and what they already know | An internal stakeholder who knows the product. No tour of the basics. |
| **Takeaway**: the one thing the viewer should leave with | "What this release delivered, and that it works." |
| **Humour, 0–10** | 5. Jokes come only from real on-screen refusals or labels. |
| **Tone words**: three adjectives, plus one line the user would say about this release | "Dry, confident, plain." |
| **Hard no's**: people, topics or words that are off limits | Never joke about a person, a team or a customer. Sensitive labels (pay, ratings, health, performance) need sign-off before a line leans on them. |
| **Length** | Phase or release update: about 2:30–3:00, each walk footage scene under 15 s. Feature tour: the shortest video that covers the tasks. |
| **House preset**: the brand's folder of `cards.js`, `video.json`, `audio/sfx/`, `music/` | The folder the last video for this product used; with none, `presets/house/` in the skill. |
| **Reference video**: "like this one" | The last video for this product, found on disk. |
| **Narrator**: accent, gender, energy | The reference video's voice. With no reference, an accent that matches the audience's country. |
| **Music and energy** | The reference video's bed. With no reference, a CC BY Kevin MacLeod track picked by humour level (`script-writing.md`, Music). Humour 5 and up uses `pace` `{lead: 0.35, tail: 0.45}`. |
| **Claim strength**: built, shipped or live | "Built", unless the release is deployed. "Live" only with proof it is in production. |
| **Running gags** | Carry on from the reference video (a refusal count, a recurring sticker). |
| **Where it will be shown** | An internal meeting or Slack: captions burned in, 16:9 only. Customers or marketing change the ElevenLabs tier and the credits; say so. |
| **Words to use or avoid, and spelling** | The product's own UI words. Spelling follows the repo's own English (AU, UK or US). |
| **Budget**: ElevenLabs credits | Stop at the approval gate if the script needs more than half the credits left. |

Live-app videos (footage `live`) also ask:

| Ask | Default when unanswered |
|---|---|
| **Source material**: help docs, guides, release notes, a spec or a URL | The repo's `docs/` and `help/`. With none, the script comes from the dry walk and the user confirms each claim at the gate. |
| **Demo persona** whose permissions match the audience | The demo account the repo's seed or walk docs name for that audience. |
| **Project folder** | `output/intro-video/<slug>/` in the product repo, gitignored. |

## Using the answers

- Humour maps to the tone table in `script-writing.md`: 0–2 straight, 3–6 light, 7–10 comedic.
- The tone words and the user's own line set the register of every voice line. Read the draft script against them before the approval gate: a line the user would not say gets rewritten.
- The approval gate confirms the brief's tone, voice and music with the script. It asks again only what the brief left open.
