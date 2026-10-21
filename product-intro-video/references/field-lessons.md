# product-intro-video field lessons

No pending field lessons. New lessons may be appended by the post-skill field-lessons loop.

## 2026-10-20 · catch-ups n/a video (tc-people)
- `r.ensureVisible` scrolls the page, not a modal's inner overflow box: a target below a dialog's fold stayed clipped and the ring drew on the dialog's edge. Scroll it yourself first: `await locator.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'smooth' })); await r.wait(0.7);` then `r.cam`.
- A native `title` tooltip ("hover for the reason") is OS-drawn and never in the capture. Keep the hover beat, and carry the tooltip text in a `r.sticker` cued on the word.
- tc-video's `tick(x, y, s, color, k)` takes a scale, not a pixel size: `s = 18` drew a tick the height of the card. Use about 1.
