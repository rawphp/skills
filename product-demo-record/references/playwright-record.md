# Playwright record pattern

One context, one page, video on the context. Staff host and customer host are both `page.goto`.

```js
const browser = await chromium.launch({ headless: true, slowMo: 180 });
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  colorScheme: 'light',
  ignoreHTTPSErrors: true, // local dev certs only
  recordVideo: {
    dir: outDir,
    size: { width: 1920, height: 1080 },
  },
  // match the demo audience so dates and money render as they expect
  // locale: 'en-US',
  // timezoneId: 'America/New_York',
});
const page = await context.newPage();

// walk every beat on `page` only
// await page.goto(staffUrl)
// await page.goto(portalUrl)  // same page
// never: await context.newPage()

const video = page.video();
await context.close();
await browser.close();
const src = await video.path();
// move src → output/product-demo/walkthrough.webm
```

Capture create ids from the same page:

```js
const pending = page.waitForResponse(
  (r) => r.url().includes('/api/') && r.request().method() === 'POST' && r.status() < 400
);
await saveButton.click();
const body = await (await pending).json();
const id = body.data?.id || body.id;
await page.goto(`${appUrl}/things/${id}`);
```

Linger on finished screens (`waitForTimeout` 1500–3000). Still each beat to `chapters/`.
