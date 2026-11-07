const { chromium } = require('playwright');
const assert = require('assert');

(async () => {
  console.log('=== INICIANDO SUITE PLAYWRIGHT: PLATAFORMA DE APRENDIZAJE Y MODO EXAMEN ===');

  const browser = await chromium.launch({ headless: true });
  
  // 1. Prueba de Responsive y Cero Desbordamiento en Móvil (390x844)
  console.log('\n--- Test 1: Verificación Responsive en Móvil (390x844) ---');
  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mobilePage = await mobileContext.newPage();
  
  const mobileErrors = [];
  mobilePage.on('console', msg => {
    if (msg.type() === 'error') mobileErrors.push(msg.text());
  });

  await mobilePage.goto('http://localhost:8000/', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(500);

  const mobileOverflow = await mobilePage.evaluate(() => {
    const sw = document.documentElement.scrollWidth;
    const cw = document.documentElement.clientWidth;
    return { scrollWidth: sw, clientWidth: cw, overflow: sw > cw };
  });

  console.log(`✓ Móvil 390x844: scrollWidth=${mobileOverflow.scrollWidth}, clientWidth=${mobileOverflow.clientWidth}`);
  assert.strictEqual(mobileOverflow.overflow, false, 'No debe haber desbordamiento horizontal en 390x844');
  await mobileContext.close();

  // 2. Prueba Principal en Escritorio (1280x850)
  console.log('\n--- Test 2: Escritorio (1280x850) - Perfil, Planes IA y Modo Examen ---');
  const context = await browser.newContext({ viewport: { width: 1280, height: 850 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto('http://localhost:8000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // 2.1 Cero desbordamiento en escritorio
  const desktopOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth <= document.documentElement.clientWidth;
  });
  assert.ok(desktopOverflow, 'No debe haber desbordamiento horizontal en 1280x850');
  console.log('✓ Cero desbordamiento horizontal verificado en 1280x850');

  // 2.2 Flujo de Login y Registro (AuthProfileManager)
  console.log('\n--- Probando AuthProfileManager (Login, Validación y Persistencia) ---');
  const btnOpenAuth = page.locator('#btnOpenAuthModal');
  await btnOpenAuth.click();
  await page.waitForTimeout(200);

  const authModal = page.locator('#authModal');
  await authModal.waitFor({ state: 'visible', timeout: 3000 });

  // Validar error cuando el campo usuario está vacío
  const usernameInput = page.locator('#authUsernameInput');
  await usernameInput.fill('');
  const btnSubmitAuth = page.locator('#btnSubmitAuth');
  await btnSubmitAuth.click();
  await page.waitForTimeout(100);

  const errorText = await page.locator('#authFormError').textContent();
  assert.ok(errorText.length > 0, 'Debe mostrar mensaje de error al enviar usuario vacío');
  console.log('✓ Validación de usuario vacío comprobada correctamente:', errorText.trim());

  // Registrar usuario nuevo
  await usernameInput.fill('abner_lsc');
  await page.locator('#authDisplayNameInput').fill('Abner LSC');
  await btnSubmitAuth.click();
  await page.waitForTimeout(300);

  const displayedName = await page.locator('#userDisplayName').textContent();
  assert.strictEqual(displayedName.trim(), 'Abner LSC');
  console.log('✓ Usuario registrado y mostrado en UI:', displayedName.trim());

  // Verificar persistencia tras recargar página
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const reloadedName = await page.locator('#userDisplayName').textContent();
  assert.strictEqual(reloadedName.trim(), 'Abner LSC');
  console.log('✓ Persistencia tras reload verificada:', reloadedName.trim());

  // 2.3 Generador de Rutas con Sol IA (/api/plan + Mapa Hexagonal)
  console.log('\n--- Probando Generador de Rutas IA y Mapa Hexagonal ---');
  const btnNavPath = page.locator('#btnNavViewPath');
  if (await btnNavPath.isVisible()) {
    await btnNavPath.click();
    await page.waitForTimeout(300);
  }
  const aiInput = page.locator('#aiPlanPromptInput');
  await aiInput.fill('No sé nada, enséñame desde cero');
  const btnGenerateAi = page.locator('#btnGenerateAiPlan');
  await btnGenerateAi.click();
  await page.waitForTimeout(700);

  const hexNodesCount = await page.locator('#hexSkillTreeContainer .hex-node').count();
  console.log(`✓ Nodos hexagonales renderizados en Skill Tree: ${hexNodesCount}`);
  assert.ok(hexNodesCount >= 4, `Se esperaban al menos 4 nodos hexagonales, se encontraron ${hexNodesCount}`);

  // Probar clic en un nodo hexagonal y verificar que cambia la seña activa
  const firstHexNode = page.locator('#hexSkillTreeContainer .hex-node').first();
  const signId = await firstHexNode.getAttribute('data-sign-id');
  await firstHexNode.click();
  await page.waitForTimeout(300);

  const badgeText = await page.locator('#targetSignBadge').textContent();
  assert.strictEqual(badgeText.trim(), signId, `El badge debe mostrar la seña ${signId}`);
  console.log(`✓ Clic en nodo hexagonal ${signId} activó la seña correctamente en el reproductor.`);

  // 2.4 Constructor de Ruta Propia Manual (Custom Plan)
  console.log('\n--- Probando Constructor Manual de Rutas ---');
  const btnBack = page.locator('#btnBackToPath');
  if (await btnBack.isVisible()) {
    await btnBack.click();
    await page.waitForTimeout(300);
  }
  const btnOpenCustom = page.locator('#btnOpenCustomPlanModal');
  await btnOpenCustom.click();
  await page.waitForTimeout(200);

  const customModal = page.locator('#customPlanModal');
  await customModal.waitFor({ state: 'visible', timeout: 3000 });

  // Deseleccionar todas las señas para probar validación con 0 señas
  await page.evaluate(() => {
    document.querySelectorAll('[data-custom-sign]').forEach(btn => {
      if (btn.classList.contains('border-amber-500')) {
        btn.click();
      }
    });
  });
  await page.waitForTimeout(150);

  const btnSaveCustom = page.locator('#btnSaveCustomPlan');
  await btnSaveCustom.click();
  await page.waitForTimeout(100);

  const customError = await page.locator('#customPlanError').textContent();
  assert.ok(customError.includes('al menos 1 seña'), 'Debe advertir que se requiere al menos 1 seña');
  console.log('✓ Validación con 0 señas seleccionadas comprobada:', customError.trim());

  // Seleccionar HOLA, A, B y guardar ruta
  await page.evaluate(() => {
    ['HOLA', 'A', 'B'].forEach(id => {
      const el = document.querySelector(`[data-custom-sign="${id}"]`);
      if (el) el.click();
    });
  });
  await page.locator('#customPlanTitleInput').fill('Mi Ruta Personal');
  await btnSaveCustom.click();
  await page.waitForTimeout(300);

  const customNodesCount = await page.locator('#hexSkillTreeContainer .hex-node').count();
  console.log(`✓ Nodos tras guardar ruta personalizada: ${customNodesCount}`);
  assert.strictEqual(customNodesCount, 3, 'El mapa hexagonal debe contener exactamente 3 nodos');

  // 2.5 Modo Examen Sin Video (BlindExamController)
  console.log('\n--- Probando Modo Examen Sin Video (Evaluación Ciega) ---');
  const btnStartExam = page.locator('#btnStartBlindExam');
  await btnStartExam.click();
  await page.waitForTimeout(300);

  const isExamActive = await page.evaluate(() => {
    return window.BlindExamController ? window.BlindExamController.isExamActive() : false;
  });
  assert.strictEqual(isExamActive, true, 'El Modo Examen debe estar activo');

  // Verificar que el escudo opaco cubre el reproductor de video
  const overlayVisible = await page.evaluate(() => {
    const el = document.getElementById('blindExamOverlay');
    return el && !el.classList.contains('hidden');
  });
  assert.strictEqual(overlayVisible, true, 'El escudo #blindExamOverlay debe estar visible');

  // Verificar que la pista de ayuda está bloqueada contra trampas
  const tipText = await page.locator('#targetSignTip').textContent();
  assert.ok(tipText.includes('MODO EXAMEN ACTIVO'), 'La pista debe indicar que el examen está activo');
  console.log('✓ Escudo anti-trampas de video activado correctamente.');

  // Simular aprobación de las preguntas sin abrir el modal de felicitación normal
  for (let i = 0; i < 3; i++) {
    const currentPrompt = await page.locator('#examPromptSignName').textContent();
    console.log(`  -> Evaluando reto ${i + 1} de memoria: ${currentPrompt.trim()}`);

    // Disparar maestría simulada por visión artificial
    await page.evaluate((signName) => {
      window.onSignMastered({ id: signName, name: signName }, 96);
    }, currentPrompt.trim());

    // Verificar que NO se abrió el popup normal de felicitación
    const normalPopupVisible = await page.evaluate(() => {
      const p = document.getElementById('successPopup');
      return p && !p.classList.contains('hidden');
    });
    assert.strictEqual(normalPopupVisible, false, 'No debe abrirse el popup normal en Modo Examen');

    await page.waitForTimeout(550);
  }

  // Verificar que al terminar se abre el certificado #examSummaryModal
  await page.waitForTimeout(300);
  const summaryModalVisible = await page.evaluate(() => {
    const m = document.getElementById('examSummaryModal');
    return m && !m.classList.contains('hidden');
  });
  assert.strictEqual(summaryModalVisible, true, 'Debe abrirse el certificado de examen');

  const finalScore = await page.locator('#examFinalScorePct').textContent();
  const finalFraction = await page.locator('#examFinalFraction').textContent();
  console.log(`✓ Certificado de Examen: ${finalScore.trim()} (${finalFraction.trim()})`);
  assert.strictEqual(finalScore.trim(), '100%');

  // Cerrar modal de examen
  await page.locator('#btnCloseExamSummary').click();
  await page.waitForTimeout(200);

  // 2.6 Verificación estricta de Cero Errores de Consola
  console.log('\n--- Verificación de Errores de Consola (window.__consoleErrors) ---');
  const windowErrors = await page.evaluate(() => window.__consoleErrors || []);
  console.log(`window.__consoleErrors acumulados: ${windowErrors.length}`);
  if (windowErrors.length > 0) {
    console.error('Errores en window.__consoleErrors:', windowErrors);
  }
  assert.strictEqual(windowErrors.length, 0, 'No debe haber errores en window.__consoleErrors');

  if (consoleErrors.length > 0) {
    console.error('Errores de consola interceptados:', consoleErrors);
  }
  assert.strictEqual(consoleErrors.length, 0, 'No debe haber errores de consola');

  console.log('✓ CERO errores de consola detectados.');

  await page.screenshot({ path: 'tests/screenshots/learning_platform_exam_passed.png', fullPage: true });
  console.log('✓ Captura guardada en tests/screenshots/learning_platform_exam_passed.png');

  await browser.close();
  console.log('\n=== SUITE PLAYWRIGHT FINALIZADA CON ÉXITO: 100% PASS ===');
  process.exit(0);
})().catch(err => {
  console.error('\n❌ ERROR EN LA SUITE PLAYWRIGHT:', err);
  process.exit(1);
});
