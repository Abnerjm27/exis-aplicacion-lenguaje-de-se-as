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
  assert.strictEqual(landingMetrics.bodyBg, 'rgb(250, 248, 245)', 'Fondo 60% debe ser Blanco Crema #FAF8F5');
  assert.strictEqual(landingMetrics.navBtnBg, 'rgb(255, 122, 69)', 'CTA Navbar 10% debe ser Melocotón Cálido #FF7A45');
  assert.strictEqual(landingMetrics.heroBtnBg, 'rgb(255, 122, 69)', 'CTA Hero 10% debe ser Melocotón Cálido #FF7A45');
  assert.ok(landingMetrics.hudText.includes('EJEMPLO'), 'HUD debe indicar EJEMPLO');
  assert.strictEqual(landingMetrics.hudColor, 'rgb(255, 122, 69)', 'HUD debe usar acento Melocotón #FF7A45');
  assert.strictEqual(landingMetrics.overflow, false, 'Cero overflow horizontal en Landing');

  await page.screenshot({ path: 'tests/screenshots/audit_landing_palette.png' });

  console.log('=== 2. VERIFICANDO APP PRINCIPAL (index.html) ===');
  await page.goto('http://localhost:8000/index.html?screen=studio', { waitUntil: 'networkidle' });

  const appMetrics = await page.evaluate(() => {
    const bodyBg = getComputedStyle(document.body).backgroundColor;
    const bodyColor = getComputedStyle(document.body).color;
    const headerBg = getComputedStyle(document.querySelector('header')).backgroundColor;
    const webcamEl = document.getElementById('webcamStage');
    const webcamBg = webcamEl ? getComputedStyle(webcamEl).backgroundColor : null;
    const surfaceCard = document.querySelector('#viewPracticeStudio .surface-card');
    const surfaceBg = surfaceCard ? getComputedStyle(surfaceCard).backgroundColor : null;
    const surfaceBorder = surfaceCard ? getComputedStyle(surfaceCard).borderColor : null;
    const studioBtnBg = getComputedStyle(document.getElementById('btnNavViewStudio')).backgroundColor;
    const camBtnBg = getComputedStyle(document.getElementById('toggleCameraBtn')).backgroundColor;
    const streakColor = getComputedStyle(document.getElementById('userStreakCount')).color;
    const overflow = document.documentElement.scrollWidth > document.documentElement.clientWidth;
    return { bodyBg, bodyColor, headerBg, webcamBg, surfaceBg, surfaceBorder, studioBtnBg, camBtnBg, streakColor, overflow };
  });

  console.log('App Studio Metrics:', appMetrics);
  assert.strictEqual(appMetrics.bodyBg, 'rgb(250, 248, 245)', 'Fondo App 60% debe ser Blanco Crema #FAF8F5');
  assert.strictEqual(appMetrics.bodyColor, 'rgb(28, 25, 23)', 'Texto principal 30% debe ser Carbón Espresso Cálido #1C1917');
  assert.ok(!['rgb(15, 41, 66)', 'rgb(15, 26, 48)', 'rgb(15, 23, 42)'].includes(appMetrics.headerBg), `Header NO debe tener fondo azul/oscuro, obtenido: ${appMetrics.headerBg}`);
  assert.strictEqual(appMetrics.webcamBg, 'rgb(243, 239, 234)', 'Visor de cámara debe usar superficie cálida #F3EFEA sin azul');
  assert.strictEqual(appMetrics.surfaceBg, 'rgb(255, 255, 255)', 'Superficie 60% debe ser Blanco Puro #FFFFFF');
  assert.strictEqual(appMetrics.surfaceBorder, 'rgb(230, 223, 213)', 'Borde 30% debe ser Piedra Cálida #E6DFD5');
  assert.strictEqual(appMetrics.studioBtnBg, 'rgb(255, 122, 69)', 'Botón activo menú 10% debe ser Melocotón Cálido #FF7A45');
  assert.strictEqual(appMetrics.camBtnBg, 'rgb(255, 122, 69)', 'Botón Iniciar Cámara 10% debe ser Melocotón Cálido #FF7A45');
  assert.strictEqual(appMetrics.streakColor, 'rgb(158, 59, 22)', 'Racha/Progreso debe usar acento cálido contraste AAA (#9E3B16)');
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
