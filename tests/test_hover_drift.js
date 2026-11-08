const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--no-sandbox']
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 850 } });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  console.log("Cargando aplicación http://localhost:8000/ ...");
  await page.goto('http://localhost:8000/', { waitUntil: 'networkidle' });

  console.log("Navegando a la vista del mapa (#viewLearningPath) ...");
  await page.evaluate(() => window.ViewRouter.switchToPathView());
  await page.waitForTimeout(500);

  const container = await page.$('#hexSkillTreeContainer');
  const cRect = await container.boundingBox();

  // Test 1: Nodo Centro (HOLA, idx 0)
  const nodeHOLA = await page.$('#hex-node-HOLA');
  const bBoxHOLA = await nodeHOLA.boundingBox();
  const xHOLA_rest = Math.round(bBoxHOLA.x + bBoxHOLA.width / 2 - cRect.x);
  await nodeHOLA.hover();
  await page.waitForTimeout(250);
  const bBoxHOLA_hover = await nodeHOLA.boundingBox();
  const xHOLA_hover = Math.round(bBoxHOLA_hover.x + bBoxHOLA_hover.width / 2 - cRect.x);
  const driftHOLA = Math.abs(xHOLA_hover - xHOLA_rest);
  console.log(`[TEST 1] HOLA (Centro): rest=${xHOLA_rest}px, hover=${xHOLA_hover}px, drift=${driftHOLA}px`);

  // Test 2: Nodo Izquierda (YO, idx 1)
  const nodeYO = await page.$('#hex-node-YO');
  const bBoxYO = await nodeYO.boundingBox();
  const xYO_rest = Math.round(bBoxYO.x + bBoxYO.width / 2 - cRect.x);
  await nodeYO.hover();
  await page.waitForTimeout(250);
  const bBoxYO_hover = await nodeYO.boundingBox();
  const xYO_hover = Math.round(bBoxYO_hover.x + bBoxYO_hover.width / 2 - cRect.x);
  const driftYO = Math.abs(xYO_hover - xYO_rest);
  console.log(`[TEST 2] YO (Izquierda): rest=${xYO_rest}px, hover=${xYO_hover}px, drift=${driftYO}px`);

  // Test 3: Nodo Derecha (A, idx 2)
  const nodeA = await page.$('#hex-node-A');
  const bBoxA = await nodeA.boundingBox();
  const xA_rest = Math.round(bBoxA.x + bBoxA.width / 2 - cRect.x);
  await nodeA.hover();
  await page.waitForTimeout(250);
  const bBoxA_hover = await nodeA.boundingBox();
  const xA_hover = Math.round(bBoxA_hover.x + bBoxA_hover.width / 2 - cRect.x);
  const driftA = Math.abs(xA_hover - xA_rest);
  console.log(`[TEST 3] A (Derecha): rest=${xA_rest}px, hover=${xA_hover}px, drift=${driftA}px`);

  // Test 4: Mouse Down (:active) en Nodo Izquierda y Derecha
  await page.mouse.move(bBoxYO.x + bBoxYO.width / 2, bBoxYO.y + bBoxYO.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(100);
  const bBoxYO_active = await nodeYO.boundingBox();
  const xYO_active = Math.round(bBoxYO_active.x + bBoxYO_active.width / 2 - cRect.x);
  await page.mouse.up();
  const driftYO_active = Math.abs(xYO_active - xYO_rest);
  console.log(`[TEST 4] YO (:active click): rest=${xYO_rest}px, active=${xYO_active}px, drift=${driftYO_active}px`);

  // Si se abrió el modal de lección por el click, cerrarlo para continuar
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    if (window.LessonSessionController) {
      window.LessonSessionController.closeLesson();
    }
  });
  await page.waitForTimeout(300);

  // Test 5: Simulación en móvil (390x844)
  console.log("Probando en viewport móvil 390x844 ...");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);

  const containerMobile = await page.$('#hexSkillTreeContainer');
  const cRectMobile = await containerMobile.boundingBox();
  const nodeYOMobile = await page.$('#hex-node-YO');
  await nodeYOMobile.scrollIntoViewIfNeeded();
  const bBoxYOMobile = await nodeYOMobile.boundingBox();
  const xYO_mobile_rest = Math.round(bBoxYOMobile.x + bBoxYOMobile.width / 2 - cRectMobile.x);
  await nodeYOMobile.hover();
  await page.waitForTimeout(250);
  const bBoxYOMobile_hover = await nodeYOMobile.boundingBox();
  const xYO_mobile_hover = Math.round(bBoxYOMobile_hover.x + bBoxYOMobile_hover.width / 2 - cRectMobile.x);
  const driftYO_mobile = Math.abs(xYO_mobile_hover - xYO_mobile_rest);
  console.log(`[TEST 5] YO (Móvil 390px): rest=${xYO_mobile_rest}px, hover=${xYO_mobile_hover}px, drift=${driftYO_mobile}px`);

  // Verificaciones de aserción
  if (driftHOLA > 1 || driftYO > 1 || driftA > 1 || driftYO_active > 1 || driftYO_mobile > 1) {
    console.error("FALLO: Los nodos todavía presentan desplazamiento horizontal indeseado durante hover/active!");
    process.exit(1);
  }

  // Verificación de errores de consola
  const consoleErrors = await page.evaluate(() => window.__consoleErrors || []);
  console.log("Errores registrados en consola:", consoleErrors);

  if (consoleErrors.length > 0) {
    console.error("FALLO: Se encontraron errores en la consola:", consoleErrors);
    process.exit(1);
  }

  console.log("¡ÉXITO TOTAL! Cero desviación horizontal en hover/active y cero errores de consola.");
  await browser.close();
})();
