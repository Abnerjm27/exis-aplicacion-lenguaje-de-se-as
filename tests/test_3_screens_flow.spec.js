/**
 * Test E2E Playwright: Flujo de 3 Pantallas Dedicadas y Ruta Duolingo LSC
 * Valida:
 * 1. Pantalla 1: Portal de Bienvenida Futurista (landing.html) con Sol holográfica y telemetría.
 * 2. Pantalla 2: Vista de Ruta Estilo Duolingo (#viewLearningPath) con nodos táctiles y badge "¡EMPEZAR!".
 * 3. Pantalla 3: Estudio de Práctica y Examen (#viewPracticeStudio) con navegación de regreso y examen sin video.
 */

const { chromium } = require('playwright');
const assert = require('assert');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('=== INICIANDO PRUEBAS E2E: FLUJO DE 3 PANTALLAS Y RUTA DUOLINGO ===');

  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--no-sandbox'
    ]
  });

  try {
    // -------------------------------------------------------------------------
    // TEST 1: PANTALLA 1 - LANDING PORTAL FUTURISTA (landing.html)
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Validando Pantalla 1: Portal Landing Futurista (landing.html) ---');
    const landingContext = await browser.newContext({
      viewport: { width: 1280, height: 850 },
      permissions: ['camera']
    });
    const landingPage = await landingContext.newPage();

    const landingErrors = [];
    landingPage.on('console', msg => {
      if (msg.type() === 'error') landingErrors.push(msg.text());
    });

    await landingPage.goto('http://localhost:8000/landing.html', { waitUntil: 'networkidle' });
    await landingPage.waitForTimeout(400);

    // Verificar título y cápsula holográfica de Sol
    const pageTitle = await landingPage.title();
    console.log(`✓ Título de la página: "${pageTitle}"`);
    assert(pageTitle.includes('Manitas'), 'El título de landing.html debe incluir Manitas');

    const holoCapsule = await landingPage.$('#solHoloCapsule');
    assert(holoCapsule, 'Debe existir la cápsula holográfica #solHoloCapsule');

    const handLandmarksSvg = await landingPage.$('#svgHandLandmarks');
    assert(handLandmarksSvg, 'Debe existir el SVG de landmarks MediaPipe #svgHandLandmarks');

    // Verificar insignias de telemetría
    const badgeLatency = await landingPage.$('#telemetryLatencyBadge');
    const badgeFps = await landingPage.$('#telemetryFpsBadge');
    const badgeModel = await landingPage.$('#telemetryModelBadge');
    assert(badgeLatency && badgeFps && badgeModel, 'Deben existir los 3 badges de telemetría de IA');
    console.log('✓ Insignias de telemetría presentes (latencia, 30 fps, MediaPipe Hands)');

    // Captura de pantalla de Pantalla 1 (Hero Cinemático)
    const screen1Path = path.join(screenshotsDir, 'screen1_futuristic_landing.png');
    await landingPage.screenshot({ path: screen1Path, fullPage: false });
    console.log(`✓ Captura guardada: ${screen1Path}`);

    // Hacer scroll hacia la sección Scrollytelling y el Portal Login/Registro
    await landingPage.evaluate(() => {
      document.getElementById('scrollyShowcaseSection').scrollIntoView({ behavior: 'instant' });
    });
    await landingPage.waitForTimeout(300);
    await landingPage.click('[data-scrolly-step="2"]');
    await landingPage.waitForTimeout(200);
    const scrollyPath = path.join(screenshotsDir, 'screen1b_scrollytelling_showcase.png');
    await landingPage.screenshot({ path: scrollyPath, fullPage: false });
    console.log(`✓ Captura Scrollytelling guardada: ${scrollyPath}`);

    // Registro en página propia (register.html) y cuestionario en onboarding.html
    await landingPage.click('#btnNavEnter');
    await landingPage.waitForURL('**/register.html');
    await landingPage.fill('#authDisplayNameInput', 'Camila LSC');
    await landingPage.fill('#authIdentifierInput', `camila_${Date.now()}@correo.com`);
    await landingPage.fill('#authPasswordInput', 'exis2026');
    await landingPage.fill('#authConfirmInput', 'exis2026');

    const authCardPath = path.join(screenshotsDir, 'screen1c_standard_login_register.png');
    await landingPage.screenshot({ path: authCardPath, fullPage: false });
    console.log(`✓ Captura Registro guardada: ${authCardPath}`);

    await landingPage.click('#btnAuthSubmit');
    await landingPage.waitForURL('**/onboarding.html');
    const isQuizVisible = await landingPage.evaluate(() => {
      const m = document.getElementById('quizStep1');
      return m && !m.classList.contains('hidden');
    });
    assert.strictEqual(isQuizVisible, true, 'El cuestionario de nivel debe abrirse tras registrarse');
    console.log('✓ Cuestionario diagnóstico de nivel LSC abierto correctamente');

    const quizShotPath = path.join(screenshotsDir, 'screen1d_placement_quiz_modal.png');
    await landingPage.screenshot({ path: quizShotPath, fullPage: false });
    console.log(`✓ Captura Cuestionario Nivel LSC guardada: ${quizShotPath}`);

    await landingPage.click('#btnQuizNext'); // Paso 1 -> Paso 2
    await landingPage.waitForTimeout(150);
    await landingPage.click('#btnQuizNext'); // Paso 2 -> Paso 3
    await landingPage.waitForTimeout(150);
    await landingPage.fill('#quizCustomGoalInput', 'Quiero aprender a saludar y presentarme en LSC');

    console.log('✓ Cuestionario completado. Creando ruta hacia index.html?screen=path...');
    await Promise.all([
      landingPage.waitForNavigation({ waitUntil: 'networkidle' }),
      landingPage.click('#btnQuizNext')
    ]);

    const targetUrl = landingPage.url();
    console.log(`✓ Redirección completada a: ${targetUrl}`);
    assert(targetUrl.includes('screen=path'), 'La URL de redirección debe contener screen=path');

    // -------------------------------------------------------------------------
    // TEST 2: PANTALLA 2 - VISTA DE RUTA DUOLINGO (#viewLearningPath)
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Validando Pantalla 2: Vista de Ruta Estilo Duolingo (#viewLearningPath) ---');
    await landingPage.waitForTimeout(600);

    const isPathVisible = await landingPage.evaluate(() => {
      const el = document.getElementById('viewLearningPath');
      return el && !el.classList.contains('hidden');
    });
    const isStudioHidden = await landingPage.evaluate(() => {
      const el = document.getElementById('viewPracticeStudio');
      return el && el.classList.contains('hidden');
    });
    assert.strictEqual(isPathVisible, true, '#viewLearningPath debe ser visible');
    assert.strictEqual(isStudioHidden, true, '#viewPracticeStudio debe estar oculto en la pantalla de ruta');
    console.log('✓ #viewLearningPath visible y #viewPracticeStudio oculto');

    // Verificar estructura del camino serpenteante Duolingo
    const hasWindingPath = await landingPage.$('.duolingo-winding-path');
    assert(hasWindingPath, 'Debe existir el contenedor .duolingo-winding-path');

    const duolingoNodes = await landingPage.$$('.duolingo-node');
    console.log(`✓ Nodos Duolingo detectados en la ruta: ${duolingoNodes.length}`);
    assert(duolingoNodes.length >= 3, 'Deben existir al menos 3 nodos en la ruta');

    // Verificar pill de inicio "¡EMPEZAR!"
    const startPill = await landingPage.$('.duolingo-start-pill');
    assert(startPill, 'Debe existir la insignia flotante .duolingo-start-pill sobre el paso activo');
    const startPillText = await startPill.innerText();
    console.log(`✓ Insignia de inicio presente: "${startPillText}"`);
    assert(startPillText.includes('EMPEZAR'), 'La insignia debe contener "EMPEZAR"');

    // Verificar nodo de trofeo de examen de unidad
    const trophyNode = await landingPage.$('#btnPathFinalExamNode');
    assert(trophyNode, 'Debe existir el botón trofeo #btnPathFinalExamNode');
    console.log('✓ Nodo trofeo de examen final de unidad presente');

    // Captura de pantalla de Pantalla 2
    const screen2Path = path.join(screenshotsDir, 'screen2_duolingo_path.png');
    await landingPage.screenshot({ path: screen2Path, fullPage: false });
    console.log(`✓ Captura guardada: ${screen2Path}`);

    // -------------------------------------------------------------------------
    // TEST 3: NAVEGACIÓN A PANTALLA 3 - SESIÓN DE LECCIÓN Y ESTUDIO DE PRÁCTICA
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Validando Sesión de Lección y Navegación a Pantalla 3 (Estudio) ---');
    // Hacer clic en el primer nodo de la ruta abre la lección interactiva pedagógica
    await duolingoNodes[0].click();
    await landingPage.waitForTimeout(400);

    const isLessonModalOpen = await landingPage.evaluate(() => {
      const el = document.getElementById('lessonSessionModal');
      return el && !el.classList.contains('hidden');
    });
    assert.strictEqual(isLessonModalOpen, true, 'Hacer clic en un nodo debe abrir la sesión de lección interactiva #lessonSessionModal');
    console.log('✓ Clic en nodo abre la lección interactiva pedagógica (#lessonSessionModal)');

    // Cerrar lección para probar navegación al estudio libre
    await landingPage.click('#btnLessonClose');
    await landingPage.waitForTimeout(300);

    // Navegar a Estudio de Práctica mediante el botón de navbar #btnNavViewStudio
    await landingPage.click('#btnNavViewStudio');
    await landingPage.waitForTimeout(400);

    const isStudioVisibleAfterClick = await landingPage.evaluate(() => {
      const el = document.getElementById('viewPracticeStudio');
      return el && !el.classList.contains('hidden');
    });
    const isPathHiddenAfterClick = await landingPage.evaluate(() => {
      const el = document.getElementById('viewLearningPath');
      return el && el.classList.contains('hidden');
    });
    assert.strictEqual(isStudioVisibleAfterClick, true, '#viewPracticeStudio debe estar visible al entrar al estudio');
    assert.strictEqual(isPathHiddenAfterClick, true, '#viewLearningPath debe ocultarse al entrar al estudio');
    console.log('✓ Cambio de vista exitoso a #viewPracticeStudio');

    // Verificar barra de estudio, botón de regreso y migas de pan
    const btnBackToPath = await landingPage.$('#btnBackToPath');
    assert(btnBackToPath, 'Debe existir el botón #btnBackToPath');

    const breadcrumbPlan = await landingPage.$eval('#studioBreadcrumbPlanTitle', el => el.textContent.trim());
    const stepProgress = await landingPage.$eval('#studioStepProgressText', el => el.textContent.trim());
    console.log(`✓ Migas de pan del estudio: Plan="${breadcrumbPlan}", Progreso="${stepProgress}"`);
    assert(breadcrumbPlan.length > 0, 'El título del plan en las migas de pan no debe estar vacío');

    // Verificar elementos del estudio
    const signVideo = await landingPage.$('#signVideo');
    const webcamVideo = await landingPage.$('#webcamVideo');
    const outputCanvas = await landingPage.$('#outputCanvas');
    assert(signVideo && webcamVideo && outputCanvas, 'Los elementos clave del estudio (#signVideo, #webcamVideo, #outputCanvas) deben estar presentes');

    // Captura de pantalla de Pantalla 3
    const screen3Path = path.join(screenshotsDir, 'screen3_practice_studio.png');
    await landingPage.screenshot({ path: screen3Path, fullPage: false });
    console.log(`✓ Captura guardada: ${screen3Path}`);

    // -------------------------------------------------------------------------
    // TEST 4: REGRESO A LA RUTA CON #btnBackToPath
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Validando Botón de Regreso a la Ruta (#btnBackToPath) ---');
    await btnBackToPath.click();
    await landingPage.waitForTimeout(300);

    const isPathVisibleAfterBack = await landingPage.evaluate(() => {
      const el = document.getElementById('viewLearningPath');
      return el && !el.classList.contains('hidden');
    });
    assert.strictEqual(isPathVisibleAfterBack, true, 'Debe regresar a #viewLearningPath tras presionar #btnBackToPath');
    console.log('✓ Regreso a #viewLearningPath confirmado');

    // -------------------------------------------------------------------------
    // TEST 5: LANZAMIENTO DEL EXAMEN SIN VIDEO DESDE EL TROFEO DUOLINGO
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Validando Activación de Examen Ciego desde el Trofeo Duolingo ---');
    await landingPage.click('#btnPathFinalExamNode');
    await landingPage.waitForTimeout(400);

    const isExamActive = await landingPage.evaluate(() => {
      const overlay = document.getElementById('blindExamOverlay');
      const studio = document.getElementById('viewPracticeStudio');
      return studio && !studio.classList.contains('hidden') && overlay && !overlay.classList.contains('hidden');
    });
    assert.strictEqual(isExamActive, true, 'El examen ciego #blindExamOverlay debe estar activo en #viewPracticeStudio');
    console.log('✓ Examen ciego activo tras clic en el trofeo de unidad');

    // Salir del examen
    await landingPage.click('#btnExitExam');
    await landingPage.waitForTimeout(300);

    const isExamClosed = await landingPage.evaluate(() => {
      const overlay = document.getElementById('blindExamOverlay');
      return overlay && overlay.classList.contains('hidden');
    });
    assert.strictEqual(isExamClosed, true, 'El examen debe cerrarse tras hacer clic en salir');
    console.log('✓ Salida del examen confirmada');

    // -------------------------------------------------------------------------
    // TEST 6: AUDITORÍA DE ERRORES DE CONSOLA
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Auditoría de Consola (Regla 7 AGENTS.md) ---');
    const browserConsoleErrors = await landingPage.evaluate(() => window.__consoleErrors || []);
    const allErrors = [...landingErrors, ...browserConsoleErrors];
    console.log(`✓ Errores registrados en consola: ${allErrors.length}`);
    if (allErrors.length > 0) {
      console.warn('Errores detectados:', allErrors);
    }
    assert.strictEqual(allErrors.length, 0, 'No debe haber errores en consola durante el flujo de pantallas');

    await landingContext.close();

    // -------------------------------------------------------------------------
    // TEST 7: AUDITORÍA RESPONSIVE MÓVIL (390x844) EN TODAS LAS PANTALLAS
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Auditoría Responsive Móvil (390x844) - Cero Desbordamiento ---');
    const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const mobilePage = await mobileContext.newPage();

    // 7.1 Landing en móvil
    await mobilePage.goto('http://localhost:8000/landing.html', { waitUntil: 'networkidle' });
    const landingMobileOverflow = await mobilePage.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    assert.strictEqual(landingMobileOverflow, false, 'landing.html no debe tener desbordamiento horizontal en 390x844');
    console.log('✓ landing.html móvil: 0 desbordamiento horizontal');

    // 7.2 Ruta Duolingo en móvil
    await mobilePage.goto('http://localhost:8000/index.html?screen=path', { waitUntil: 'networkidle' });
    const pathMobileOverflow = await mobilePage.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    assert.strictEqual(pathMobileOverflow, false, 'index.html?screen=path no debe tener desbordamiento horizontal en 390x844');
    console.log('✓ Ruta Duolingo móvil: 0 desbordamiento horizontal');

    // 7.3 Estudio en móvil
    await mobilePage.goto('http://localhost:8000/index.html?screen=studio', { waitUntil: 'networkidle' });
    const studioMobileOverflow = await mobilePage.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    assert.strictEqual(studioMobileOverflow, false, 'index.html?screen=studio no debe tener desbordamiento horizontal en 390x844');
    console.log('✓ Estudio móvil: 0 desbordamiento horizontal');

    await mobileContext.close();

    console.log('\n===============================================================');
    console.log('🎉 TODAS LAS PRUEBAS DE 3 PANTALLAS Y RUTA DUOLINGO PASARON (100%)');
    console.log('===============================================================');
  } finally {
    await browser.close();
  }
})();
