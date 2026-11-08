const { chromium } = require('playwright');
const assert = require('assert');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 850 } });
  const page = await context.newPage();

  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  console.log('=== 1. VERIFICANDO LANDING PAGE (landing.html) ===');
  await page.goto('http://localhost:8000/landing.html', { waitUntil: 'networkidle' });

  const landingMetrics = await page.evaluate(() => {
    const bodyBg = getComputedStyle(document.body).backgroundColor;
    const navBtnBg = getComputedStyle(document.getElementById('btnNavEnter')).backgroundColor;
    const heroBtnBg = getComputedStyle(document.getElementById('btnHeroStartRegister')).backgroundColor;
    const hudText = document.querySelector('.floating-hud-Tag span:last-child')?.textContent.trim();
    const hudColor = getComputedStyle(document.querySelector('.floating-hud-Tag span:last-child')).color;
    const overflow = document.documentElement.scrollWidth > document.documentElement.clientWidth;
    return { bodyBg, navBtnBg, heroBtnBg, hudText, hudColor, overflow };
  });

  console.log('Landing Metrics:', landingMetrics);
  assert.strictEqual(landingMetrics.bodyBg, 'rgb(15, 26, 48)', 'Fondo debe ser #0F1A30');
  assert.strictEqual(landingMetrics.navBtnBg, 'rgb(255, 107, 91)', 'CTA Navbar debe ser Coral #FF6B5B');
  assert.strictEqual(landingMetrics.heroBtnBg, 'rgb(255, 107, 91)', 'CTA Hero debe ser Coral #FF6B5B');
  assert.ok(landingMetrics.hudText.includes('EJEMPLO'), 'HUD debe indicar EJEMPLO');
  assert.strictEqual(landingMetrics.hudColor, 'rgb(31, 200, 186)', 'HUD debe usar Turquesa #1FC8BA');
  assert.strictEqual(landingMetrics.overflow, false, 'Cero overflow horizontal en Landing');

  await page.screenshot({ path: 'tests/screenshots/audit_landing_palette.png' });

  console.log('=== 2. VERIFICANDO APP PRINCIPAL (index.html) ===');
  await page.goto('http://localhost:8000/index.html?screen=studio', { waitUntil: 'networkidle' });

  const appMetrics = await page.evaluate(() => {
    const bodyBg = getComputedStyle(document.body).backgroundColor;
    const bodyColor = getComputedStyle(document.body).color;
    const surfaceCard = document.querySelector('#viewPracticeStudio .surface-card');
    const surfaceBg = surfaceCard ? getComputedStyle(surfaceCard).backgroundColor : null;
    const surfaceBorder = surfaceCard ? getComputedStyle(surfaceCard).borderColor : null;
    const studioBtnBg = getComputedStyle(document.getElementById('btnNavViewStudio')).backgroundColor;
    const camBtnBg = getComputedStyle(document.getElementById('toggleCameraBtn')).backgroundColor;
    const streakColor = getComputedStyle(document.getElementById('userStreakCount')).color;
    const overflow = document.documentElement.scrollWidth > document.documentElement.clientWidth;
    return { bodyBg, bodyColor, surfaceBg, surfaceBorder, studioBtnBg, camBtnBg, streakColor, overflow };
  });

  console.log('App Studio Metrics:', appMetrics);
  assert.strictEqual(appMetrics.bodyBg, 'rgb(15, 26, 48)', 'Fondo App debe ser #0F1A30');
  assert.strictEqual(appMetrics.bodyColor, 'rgb(244, 246, 250)', 'Texto principal debe ser #F4F6FA');
  assert.strictEqual(appMetrics.surfaceBg, 'rgb(23, 37, 68)', 'Superficie debe ser #172544');
  assert.strictEqual(appMetrics.surfaceBorder, 'rgb(42, 58, 94)', 'Borde debe ser #2A3A5E');
  assert.strictEqual(appMetrics.studioBtnBg, 'rgb(255, 107, 91)', 'Botón activo menú debe ser Coral #FF6B5B');
  assert.strictEqual(appMetrics.camBtnBg, 'rgb(255, 107, 91)', 'Botón Iniciar Cámara debe ser Coral #FF6B5B');
  assert.strictEqual(appMetrics.streakColor, 'rgb(255, 200, 87)', 'Racha/Progreso debe ser Amarillo #FFC857');
  assert.strictEqual(appMetrics.overflow, false, 'Cero overflow horizontal en Desktop');

  await page.screenshot({ path: 'tests/screenshots/audit_studio_palette.png' });

  console.log('=== 3. VERIFICANDO VISTA DE RUTA Y RESPONSIVE MÓVIL (390x844) ===');
  await page.click('#btnNavViewPath');
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'tests/screenshots/audit_path_palette.png' });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(200);
  const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  assert.strictEqual(mobileOverflow, false, 'Cero overflow horizontal en Móvil 390x844');

  console.log('Console Errors:', errors.length);
  if (errors.length > 0) {
    console.error('Errors found:', errors);
    process.exit(1);
  }

  await browser.close();
  console.log('>>> AUDITORÍA DE SUPERVISIÓN 100% EXITOSA <<<');
})();
