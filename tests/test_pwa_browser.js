const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];

  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') {
      // Filter out MediaPipe Camera or WebGL warnings if any in headless
      errors.push(msg.text());
    }
  });

  await page.goto('http://localhost:8000/', { waitUntil: 'networkidle' });

  const title = await page.title();
  const manifestHref = await page.$eval('link[rel="manifest"]', el => el.getAttribute('href'));
  const themeColor = await page.$eval('meta[name="theme-color"]', el => el.getAttribute('content'));
  const hasPWAManager = await page.evaluate(() => typeof window.PWAManager !== 'undefined');
  const serviceWorkerSupported = await page.evaluate(() => 'serviceWorker' in navigator);

  console.log('Page Title:', title);
  console.log('Manifest Link:', manifestHref);
  console.log('Theme Color:', themeColor);
  console.log('PWAManager Defined:', hasPWAManager);
  console.log('ServiceWorker Supported:', serviceWorkerSupported);
  console.log('Console Errors Count:', errors.length);
  if (errors.length > 0) {
    console.log('Errors:', errors);
  }

  await browser.close();

  if (errors.length > 0 || !manifestHref || !hasPWAManager) {
    process.exit(1);
  } else {
    console.log('Browser validation SUCCESSFUL!');
  }
})();
