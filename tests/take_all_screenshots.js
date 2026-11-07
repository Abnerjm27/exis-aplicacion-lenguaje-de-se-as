const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const dir = path.resolve('tests/screenshots');
  fs.mkdirSync(dir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  // 1. Landing Hero & Scrolly
  await page.goto('http://localhost:8000/landing.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(dir, 'v2_landing_hero.png'), fullPage: false });

  // 2. Login Page
  await page.goto('http://localhost:8000/login.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(dir, 'v2_login_page.png'), fullPage: false });

  // 3. Register Page
  await page.goto('http://localhost:8000/register.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(dir, 'v2_register_page.png'), fullPage: false });

  // 4. Onboarding Quiz
  await page.goto('http://localhost:8000/onboarding.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(dir, 'v2_onboarding_quiz.png'), fullPage: false });

  // 5. App Index Studio & Chat
  await page.goto('http://localhost:8000/index.html?screen=studio', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  // Open chat drawer to show mascot
  await page.click('#btnToggleChat');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(dir, 'v2_app_studio_chat.png'), fullPage: false });

  await browser.close();
  console.log("All screenshots captured successfully!");
})();
