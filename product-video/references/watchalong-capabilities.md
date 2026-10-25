# Watchalong through the capabilities CLI

Everything the CLI's `--help` doesn't say, learned on real runs. Every call is `capabilities --profile=watchalong run <name>`; add `--json` for the full envelope. Results are `{"ok": true, "data": {...}}`; an error is `ok: false` with `error`.

## Discovery

```bash
capabilities --profile=watchalong catalog --flat          # every capability name
capabilities --profile=watchalong run checkpoints.set --help   # flags, but array items show as "json-only"
capabilities --profile=watchalong describe checkpoints.set     # the full JSON Schema, including array item shapes
```

`run <name> --help` hides the shape of any array field. `describe` is the only place the item schema shows.

## walkthroughs.import

Input: `title`, `purpose` (`spec_review`, `build_signoff`, `delivery_feedback`, `custom`), `duration_seconds`, `voice_id` (optional), `scenes[]` of `{id, start, duration, voice_over?}`.

Output `data`: `walkthrough_id`, `upload.{upload_id, url, fields}`, `notice` (set when the default voice was used).

Scenes ordered by `start` must run back to back from 0 to `duration_seconds`, each join within 0.05 s. The engine's `timeline.json` `total` is the rendered length and usually matches `ffprobe` to the millisecond; measure anyway and end the last scene at the measured value.

## Upload

The ticket is an S3 presigned POST that expires in 10 minutes. Fields first, file last, as `file`:

```bash
jq -r '.data.upload.fields | to_entries[] | "form = " + ("\(.key)=\(.value)" | @json)' import-result.json > upload.conf
curl -fsS -o /dev/null -w "upload http %{http_code}\n" -K upload.conf -F file=@intro.mp4 "$(jq -r '.data.upload.url' import-result.json)"
# expect 204
capabilities --profile=watchalong run walkthroughs.confirm-video \
  --input="$(jq -c '{walkthrough_id: .data.walkthrough_id, upload_id: .data.upload.upload_id}' import-result.json)"
```

`confirm-video` returns `video_bytes` and `duration_seconds`. A 20 MB mp4 uploads in a few seconds.

## walkthroughs.attach-document

Input: `walkthrough_id`, `filename` (`.md` or `.pdf`), `content` (the file's bytes, base64). Output: `document_name`, `text_length`. Build the input with a script so the base64 never passes through a shell argument:

```bash
python3 -c "import json,base64;json.dump({'walkthrough_id':'$W','filename':'plan.md','content':base64.b64encode(open('plan.md','rb').read()).decode()},open('attach.json','w'))"
capabilities --profile=watchalong run walkthroughs.attach-document --input-file=attach.json
```

## checkpoints.set

```json
{"walkthrough_id": "...", "checkpoints": [
  {"time": 33, "kind": "comprehension", "question": "Does finding and ticking people on the list screen work the way you'd use it?"},
  {"time": 85, "kind": "open", "question": "Anything you'd change, now you've seen it?"}
]}
```

It replaces the whole list. The result gives each checkpoint an `id`, a `scene_id`, `time_seconds` and `is_closing`. A checkpoint at a scene's exact `start` belongs to that scene, so to ask about scene N put it at `start(N+1) - 1`.

The closing checkpoint lands where the last voice line has finished and must be within 10 s of the end. The engine appends the end card to the last scene, so that scene's `duration` includes the end card: compute `start(last) + `end` in audio/<id>.json (the voice line's length) + about 0.5`, and only use the end card's start when it is itself within 10 s of the end.

Purpose wording when `question` is blank:

| Purpose | Comprehension | Open | Closing |
|---|---|---|---|
| spec_review | Does this part match what you had in mind? | Any questions on this part of the spec? | Sign-off: Is this spec ready to build? |
| build_signoff | Does this work the way you expected? | Anything here you'd want changed before it ships? | Sign-off: Are you happy for this to go to production? |
| delivery_feedback | Does this part work the way you need it to? | Anything about this part you'd change? | Open: Anything you'd change, now you've seen it? |
| custom | Did that part make sense? | Any questions about that part? | none suggested |

The closing suggestion is only applied by the web editor; through the API, write it yourself.

## walkthroughs.video-ticket and discard

`video-ticket --walkthrough-id=...` returns a fresh `upload` ticket (same shape as import's) when the first expired or the upload failed; follow it with the upload recipe and `confirm-video`. `discard --walkthrough-id=...` hard-deletes a draft and its files; it refuses a published watchalong, which takes `archive --walkthrough-id=...` instead.

## walkthroughs.publish and show

`publish --walkthrough-id=...` returns `status` and `published_at`. It refuses with a named reason: no video, no voice ElevenLabs can speak in, no checkpoints, last checkpoint not within 10 s of the end, Sign-off not last, or ElevenLabs quota short. `walkthroughs.show --walkthrough-id=...` returns the purpose preset, `video_url` (signed, 10 minutes), `document_url`, `document_text_length`, scenes and checkpoints.

## invites

`invites.create`: `walkthrough_id`, `client_name`, `email`, `send_email` (default true), `expires_in_days` (1 to 365, default 14). Returns `invite_id`, `session_id`, `link`, `expires_at`. `invites.send --invite-id=...` emails it, again if already sent. An unpublished watchalong refuses invites.

## Afterwards

`sessions.list`, `sessions.show --session-id=...` (transcript aligned to the video, verdict), `questions.list`, `questions.answer`.
