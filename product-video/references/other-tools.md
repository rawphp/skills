# Other tools by stage

The line names these tools at the stage that needs them; it does not hand the video to them. Open the named skill only for its own piece (a thumbnail, an intro animation, a fact check), then carry on with the line.

| Stage | Tools |
|---|---|
| Brief and scope | `superpowers:brainstorming`; `grilling` or `pre-mortem` to stress-test before any credits are spent |
| Source research and facts | `deep-research` (fact-check ledger); `pdf`, or `pdfcraft` on the Trilogy Mac, for source PDFs; `read-the-damn-docs` before relying on a provider feature (ElevenLabs models and languages); `youtube-transcript` and `podcast-extract` when the source is existing media; `last30days` for what people are saying |
| Script | `script-studio` (long-form, 3+ min); `ideate` or `creative-collision` for jokes and angles in volume; `unslop`, `humanize`, or `my-voice` (Tom's voice) for captions and on-screen copy |
| Storyboard and look | `visual-plan` to show a storyboard for approval; `design-directions` to choose a visual style |
| Voice and music | ElevenLabs through the engine (`tts.py`, `sfx.py`). Music: `references/script-writing.md` (Music), or the house beds in `presets/trilogy/music/` |
| Graphics and motion | `vectorcraft` (title cards, thumbnails, diagrams, vector charts); `effectcraft` (animated intro and outro, lower-thirds, title animation, Lottie); `photocraft` (cut-outs, crops, platform resizes); `lightcraft` (grade a photo set); `graphic-designer` (infographic cards); `dataviz` before any chart card; `image` for generated imagery (build exact text and numbers in code); `arch-viz` for architecture diagrams |
| Edit an existing recording | `filmcraft` (trim, join intro, main and outro, SRT or VTT captions, transcribe, export); the cross-app "Promo or YouTube video" pipeline in `artcraft` `references/jobs.md` |
| Review | `gate.py` and the second pass (stage 6); `fable-review` on the script and one finished cut; `devils-advocate-loop` when money, safety or legal claims are on screen |
| Package and publish | `presets/publish/` (stage 7: YouTube or Watchalong); `browser-harness` to drive YouTube Studio in Tom's Chrome; `youtube-transcript` to read the published captions back |
| Repurpose | `youtube-to-social`, `social`, `content-engine`, `launch-tweet`, `linkedin-coach`, `save-idea` |
| Run hygiene | `launch-subagent` before any parallel agents; `stay-within-limits` for long voice or render runs; `quick-recap`; `session-capture` at the end |

## When this skill is not the engine

| Job | Where |
|---|---|
| Animated explainer from a story or documents, with storyboard approval, cold-read review, fact recount, music score, lip-synced mascot | tc-video: run Claude Code inside `~/EA/projects/tc-video` (`/video-orchestrate` one-shot, or `/video` step by step). Trilogy-branded (Paul voice, Vimeo), so confirm with Tom before using it for other work |
| 10–15 s promo clip from a screen recording, overlays, voice-over, music | promo-video-producer, `~/EA/systems/promo-video-producer` (start at its README) |
| AI-generated footage, avatars or talking heads (HeyGen, Synthesia, Veo, Sora, Runway, Kling), Remotion, Hyperframes, a 15–60 s avatar script | `video` |
| The long-form YouTube clips format with face-cam and 3D bridges | `clips-explainer-video` |
| Cutting an existing recording | `filmcraft` |

## Trilogy Mac (ArtCraft)

The `*craft` apps run headless on the Trilogy Mac over Tailscale (`ssh -o BatchMode=yes tomk@trilogy-mac true` to check). Open `artcraft` first: it picks the app, holds the host, in and out folders, job ids and Tom's brand kit, then hands off to the app skill. They are the default for thumbnails, title cards, motion intros and outros, lower-thirds and caption edits.

## Gaps

No tool covers translation review. For a non-English voice-over, have a native speaker check the script before voicing, and round-trip every clip through speech-to-text before the render.
