---
name: product-demo-record
description: 'Record a live product UI walkthrough as a marketing or demo screen tape. Use for record a walkthrough, marketing video of the app, demo recording, screen-record the product, product demo video of a real app, or owner walkthrough recording. Differentiator: live-app screen tape with seed/reset/dry-run; not AI-generated video and not a walk to find and fix friction.'
---

# Product demo record

Record a real product as a viewer would see it. Three passes. Do not record while discovering selectors.

Always read [references/field-lessons.md](references/field-lessons.md) first, then [references/traps.md](references/traps.md) before the dry-run.

## Configure

Infer from the repo. Ask once if login, URL, or the beat list is missing.

```yaml
entry:            <staff or marketing login URL>
account:          <seeded demo credentials>
beats:            <ordered owner/customer actions to show>
hero:             <one named entity the story follows>
output:           output/product-demo/   # repo-relative
viewport:         1920x1080
```

Product seeders, routes, and selectors stay in the **project**. This skill is the recording procedure.

## Workflow

### 0. Beat list

Write the tape as an ordered list of beats. For each beat name:

- the screen
- the row or entity it acts on
- the field or action that **creates the next beat's row**

If beat N acts on a record, beat N-1 must create that record. If that field is skippable in the UI, it is still required for the tape.

Stop and add a seed/reset gap if a beat has no row to click.

### 1. Seed and reset

1. Use or write a **project** seeder so the account looks busy (lists, calendar, money). Empty chrome is not a demo.
2. Add one **hero** entity the story follows (for example a named customer with an open request).
3. Write a **reset** that returns the hero to the start state and deletes every record the walk created. Recording spends the hero. The next take needs it back.
4. After seed, check how the app mints document numbers. If it uses latest `created_at` rather than max numeric id, bump the newest live row past the historical max so the UI create does not collide. Details: [references/traps.md](references/traps.md).

Do not wipe the database (`migrate:fresh` or your stack's equivalent) unless the user asked.

### 2. Dry-run (no video)

Walk every beat once **without** `recordVideo`.

For each beat:

1. Land on the screen by **URL or captured id**, not by search, unless you have proven what search indexes.
2. Dismiss overlays (`Escape`, close tour) before clicking a control behind a drawer.
3. Prefer native `<select>` `selectOption` over clicking option text.
4. After save/update, wait on `role=status` (or the toast including its trailing period). Do not `getByText` a substring that is also a feed heading.
5. Capture the create response id (`POST` body) and keep it for the next beat.
6. Assert the next beat's row exists (the child record, the item sent to the customer, and so on).

If a beat fails, **reset the hero** and fix the dry-run. Do not start recording.

### 3. Record

Read [references/playwright-record.md](references/playwright-record.md) before launching the browser.

If ESM `import 'playwright'` fails because the product repo does not list it, session-install with `npm install --no-save playwright`. Do not add it to package.json unless the user asked.

Hard rules:

1. **One Playwright page** for the whole tape. A second host (admin app, customer portal) is a `page.goto`, never `context.newPage()`.
2. `recordVideo` on the **context**. After `context.close()`, save `await page.video().path()` to `output/product-demo/walkthrough.webm`. Do not rename `readdir()[0]`. If that file already holds another surface's tape, write this one under a named subdirectory. Do not clobber.
3. Chapter stills to `output/product-demo/chapters/` at each beat (login, list, detail, success).
4. Linger 1.5–3s on each finished screen. `slowMo` ~150–200.
5. Same viewport the whole way (default 1920×1080, light scheme).
6. Reset the hero **immediately before** this pass so the dry-run did not spend it.

Convert to mp4 if `ffmpeg` exists:

```bash
ffmpeg -y -i output/product-demo/walkthrough.webm \
  -c:v libx264 -pix_fmt yuv420p -movflags +faststart \
  output/product-demo/walkthrough.mp4
```

Probe duration. If duration is a few seconds and the walk was minutes, a second page stole the tape. Re-record on one page.

## Output contract

Return:

1. Login URL, role, credentials (demo only)
2. Video path + duration
3. Beats on tape vs beats still needing a live pass
4. Hero reset command
5. Residual gaps (a disabled action, a missing child row) and the upstream row each one needs

## Stop

| Condition | Action |
|-----------|--------|
| App or login unreachable | Stop; say what is down |
| No reset for the hero | Stop; do not record a one-shot action |
| Dry-run cannot create the next row | Fix seed/form; do not record |
| Video duration << walk time | Second page; re-record on one page |

## Guardrails

- Demo/test accounts only. No production customer data in the tape.
- Do not log secrets in stills or the recap.
- Project seeders and record scripts stay in the repo. Do not copy product selectors into this skill.
