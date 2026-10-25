# Publish target: Watchalong

Stage 7, when the brief or the preset names Watchalong. A watchalong is one narrated video plus a plan document, with checkpoints where the narrator stops and asks the viewer a question out loud. The viewer answers, the narrator replies from the plan, and the sender reads the transcript and open questions afterwards. Product docs: https://docs.watchalong.io/ (agent pages: `agents`, `agents/cli`, `make-the-video`, `checkpoints`, `publish-and-invite`).

Command recipes and the schemas the CLI hides are in `references/watchalong-capabilities.md`.

## State check

```bash
capabilities --profile=watchalong auth status              # logged_in=true, base_url=https://watchalong.io
capabilities --profile=watchalong run ping --input='{}'    # returns the user the token acts as
```

Not logged in: ask the user for a token from Profile › Access tokens, then `capabilities auth login --profile=watchalong --base-url=https://watchalong.io --token=<token>`. Never echo or save the token anywhere else. Use the CLI even when a `watchalong` MCP server exists: MCP config is project-scoped and the CLI works from any folder.

## Inputs

| Input | Where it comes from |
|-------|---------------------|
| The mp4 | `video.json` `output` |
| `duration_seconds` | `ffprobe` on that mp4, never the editor's number |
| Scenes with `start`, `duration`, `voice_over` | `timeline.json` + `script.json` (`scripts/publish/build-import.py` builds them) |
| `voice_id` | `video.json` `voice.id`; must be an ElevenLabs premade or Voice Library voice. An `ENV:` id is resolved from the environment |
| Plan document | Real source material from `PLAN.md` and `script.md`, plus the feature's user guide section, the PR body or the spec. Markdown, under 20 MB |
| Title and purpose | From the brief (below) |

## Brief

Ask once for what the project folder cannot tell you:

- **Audience and purpose.** `spec_review` or `build_signoff` close with a Sign-off and record a verdict; `delivery_feedback` closes with "Anything you'd change, now you've seen it?"; `custom` has no defaults. A finished feature shown to its users is `delivery_feedback`. The spec-approval preset maps to `spec_review`, build-summary to `build_signoff`.
- **Title.** The viewer sees it on the first screen: write it for them ("KPI catch-ups: Mark n/a"), not the branch name.
- **Who gets a link.** Names and emails, and whether to email now or hold. Default: hold. `invites.create` emails unless `send_email` is false.

## Workflow

Everything goes in a `watchalong/` folder inside the project: `import.json`, `import-result.json`, `attach.json`, `checkpoints.json`, `plan.md`. Nothing else goes in there.

0. **Resume before you import.** If `watchalong/import-result.json` exists, run `walkthroughs.show` on its `walkthrough_id` first. `published`: the job is done, report it. `draft`: carry on from the first missing piece (`has_video` false: `walkthroughs.video-ticket` then step 4; no document: step 5; no checkpoints: step 6). A draft nobody wants: `walkthroughs.discard`. A second import makes a second draft, never a retry.
1. **Check reading time.** For each scene, compare the on-screen word count with its duration. Above 2.5 words a second, hold the last frame until it is under, before import.
2. **Build the import.** `python3 "$SK/publish/build-import.py" <project-dir> --title ... --purpose ... > watchalong/import.json`. It reads the three project files, passes `voice.id` as `voice_id`, measures the mp4, and ends the last scene at the measured length. Scenes must cover the video back to back within 0.05 s or the import is refused.
3. **Import.** `capabilities --profile=watchalong run walkthroughs.import --input-file=watchalong/import.json > watchalong/import-result.json`. The result holds `walkthrough_id` and a 10-minute upload ticket.
4. **Upload and confirm** at once: `bash "$SK/publish/upload-video.sh" watchalong/import-result.json <mp4>`. The CLI does not upload files; the script posts the ticket fields then the file, and confirms. A late or failed upload: `walkthroughs.video-ticket` for a fresh ticket.
5. **Attach the plan.** Write `plan.md` from the real docs (a one-paragraph framing, a "what changes" list, then the guide section verbatim). `walkthroughs.attach-document` with `filename` and base64 `content`.
6. **Set checkpoints.** One `checkpoints.set` call with the whole list: `time` (seconds), `kind` (`comprehension`, `open`, `decision`, `approval`), `question` (blank uses the purpose's wording). Rules: 1 to 20; whole seconds; the last within 10 s of the end; `approval` only on the last. Place each one second before the next scene starts in `timeline.json`, so it lands after the scene it asks about, and check the result's `scene_id` matches. The closing one goes where the last voice line ends (its scene's `start` plus `end` from `audio/<id>.json`, or the end card's start when that is within 10 s of the end). A 90 s video takes three or four stops; a three-minute one, five to eight.
7. **Publish.** `walkthroughs.publish --walkthrough-id=...`. Then `walkthroughs.show` to confirm `status: published` and the checkpoints. Publishing renders every question in the narrator's voice and locks the video, plan, checkpoints, voice and purpose. Only the title can change after.
8. **Invites, when told to.** `invites.create --send-email=false` per person gives a link to hand over; `invites.send --invite-id=...` emails it later. One link per person, 14 days.

Write the Watchalong link into `VALIDATE.md` under "Published".

## Output

The watchalong id and title, length, the checkpoints as time, kind and question, the plan document's name and length, published at, and the invite state (none created, or links held).

## Stop

| Condition | Action |
|-----------|--------|
| `auth status` is not logged in and no token | Stop; ask for a token |
| Scenes do not cover the mp4's measured length | Fix the timeline or trim the last scene; do not pad with a fake scene |
| No real source material for the plan | Stop; the narrator answers from it, so an invented plan invents answers |
| Purpose unclear between sign-off and feedback | Ask; purpose cannot change after import |
| The user has not said who to invite | Publish and stop; create no invites |

## Guardrails

- A published watchalong with no sessions is still kept: archive a wrong one, never discard a published one. Discard is for drafts.
- A test run creates a real draft in the user's organisation. Use a title that says so, and discard it when done.
- The plan document reaches the viewer (their recap links to it). Nothing in it that the audience cannot see.
