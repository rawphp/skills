# Recording traps

Read before the dry-run. Symptom → cause → default action. No product names.

## Video file

| Symptom | Cause | Default action |
|---------|-------|----------------|
| Tape is a few seconds; walk was minutes | `recordVideo` is **per page**. `context.newPage()` (portal, extra tab) writes a second file. Saving `readdir()[0]` keeps the wrong one | One page. `page.goto` for the other host. Save `await page.video().path()` after close |
| Black or still first frame only | Context closed before the page flushed, or headless crashed | Close context, then read `video.path()`. Probe duration before calling it done |
| Recording a new story overwrites an existing `walkthrough.webm` | The skill default path is shared | If that file already holds another surface's tape, write this one under a named subdirectory. Do not clobber |

## Navigation

| Symptom | Cause | Default action |
|---------|-------|----------------|
| Search returns 0; the row exists | Search indexes one field (often title). List may show "—" for a different field (summary) | Do not navigate by search until proven. Use the detail URL and the id from create |
| Click times out; locator "resolved" | A drawer or modal overlay intercepts. Hidden duplicate of the same label sits in the DOM | `Escape` first. Click the control **in the open surface**. Prefer `getByRole` on a visible button, not `getByText().first()` |
| `getByText('…saved')` / `getByText('…updated')` fails strict mode on the record pass after a dry-run passed | Toast body and the activity title share the same words. `slowMo` keeps both on screen | Wait on `role=status` or the toast string **including its trailing period**. Do not use a substring that is also a feed heading |
| Option text click fails on a dropdown | Native `<select>`, not a custom listbox | `locator('select[aria-label="…"]').selectOption({ label })` |

## State and numbering

| Symptom | Cause | Default action |
|---------|-------|----------------|
| Unique constraint on a document number (`DOC-0013`) after a full seed | Minter uses **latest `created_at`**, not max numeric id. Fresh seed rows are newest and still on low numbers | After seed, set the newest live row's number past the historical max so the next UI create is free |
| Second take fails on a one-shot action | First take spent a one-shot status (converted, approved) | Reset script: hero → start status; delete every record the walk created |
| Action controls (complete, pay, send) missing or disabled | An upstream row was never created (a parent saved as draft because an optional field was skipped) | Dry-run must assert the next row exists. Fill the required field that creates it even if the form allows skip |

## Playwright install

| Symptom | Cause | Default action |
|---------|-------|----------------|
| ESM `import 'playwright'` fails from the record script | The product repo does not list Playwright | Session-install with `npm install --no-save playwright`. Do not add it to package.json unless the user asked |

## Recording vs discovery

| Symptom | Cause | Default action |
|---------|-------|----------------|
| Dozen record attempts, hero already spent | Recorded while discovering selectors | Dry-run with **no** video until every beat passes. Then reset. Then record once |
| Create form empty after a create action | Opened the global create modal instead of creating from the parent record | Stay on the parent record that owns the work. Prefill from its id |

## Recording the user's own browser

| Symptom | Cause | Default action |
|---------|-------|----------------|
| Tape ends on whatever tab was underneath, or captures the wrong display | `page.close()` activates the previous tab; with multiple monitors the window is not on capture device 0 | Record the display that actually contains the window. Stop the capture before closing the agent tab. Trim stillness against the last settled frame; keep ~1s after the picture stops changing |

## Stills

Chapter PNGs are the debug tape. If the video looks wrong, read the still for that beat before rewriting the whole script.
