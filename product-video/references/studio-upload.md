# Uploading through YouTube Studio

Read only when the user asks you to do the upload, not just package it. Drive Studio in the user's own Chrome with the `browser-harness` skill.

## Getting in

- Chrome first asks "Allow remote debugging?". The user has to click it.
- The upload dialog's video `input[type=file]` takes `DOM.setFileInputFiles` directly, with no OS picker. The thumbnail input is the one with `accept=image/jpeg,image/png`.

## Traps

- Studio rewrites the title from the filename when the upload finishes, even after you filled it. Wait until the dialog shows "Upload complete", "Checking" or "Processing up to", then fill the title and description, and read the title back again just before Next.
- The Visibility step can open on Public (a channel default). Select privacy with `document.querySelector('ytcp-uploads-dialog #privacy-radios tp-yt-paper-radio-button[name=UNLISTED]').click()` and read every radio's `aria-checked` back before Save.
- Coordinate clicks do nothing when the tab is unfocused. Drive Next and Save with `#next-button` / `#done-button` `.click()`.
- Title, description and the schedule date field are all `#textbox`. Fill one by selecting the node's contents and calling `Input.insertText`. `Cmd+A` key events do not select.
- The category dropdown's visible list is not the `tp-yt-paper-item` set a selector finds. Click the trigger, click the option where a screenshot shows it, and read the value back.
- To schedule, click the day cell in the date picker rather than typing a date, and type `HH:MM` into the time input. The time zone defaults to local.
- A "We're still checking your content" notice can block Schedule until you click "Got it".
- The "Video published" dialog can show a stale title. Confirm titles, visibility and dates from the content list's rows (`ytcp-video-row`), not the dialog.

## After upload

- A playlist sorted "Date added (oldest)" keeps a series in upload order.

- A/B tests live on the video's edit page under A/B Testing, then "Title and thumbnail". Enter the three pairs and Save.
- A Short's "Related video" field, which links it to the long video, exists only on the Short's edit page after upload. The upload dialog doesn't have it.
