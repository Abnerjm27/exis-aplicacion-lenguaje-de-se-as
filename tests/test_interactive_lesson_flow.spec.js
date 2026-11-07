/**
 * Test E2E Playwright: Flujo de Lección Interactiva Gamificada Tipo Duolingo
 * 
 * Valida:
 * 1. Clic en un nodo de la ruta Duolingo (#hexSkillTreeContainer) lanza la sesión interactiva.
 * 2. Fase 1 (Demostración Guiada): Video demostrativo + tips del Zorrito Tutor.
 * 3. Fase 2 (Pregunta de Comprensión): Video ciego + 4 opciones táctiles + feedback sheet estilo Duolingo.
 * 4. Fase 3 (Práctica con Cámara): Split view con video guía + MediaPipe + radar de coincidencia >= 85%.
 * 5. Fase 4 (Resumen de Victoria): +50 XP, zorrito celebración y retorno al mapa con nodo completado.
 * 6. Cumplimiento de Reglas Duras: Cero errores de consola y cero desbordamiento horizontal.
 */

const { chromium } = require('playwright');
const assert = require('assert');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('=== INICIANDO PRUEBAS E2E: SESIÓN DE LECCIÓN INTERACTIVA (LSC LEARN) ===');

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
    const context = await browser.newContext({
      viewport: { width: 1280, height: 850 },
      permissions: ['camera']
    });
    const page = await context.newPage();

    page.on('response', resp => {
      if (resp.status() >= 400) {
        console.log(`⚠️ [HTTP ${resp.status()}] ${resp.url()}`);
      }
    });

    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    console.log('\n--- 1. Navegando a la Plataforma Manitas (http://localhost:8000/index.html?screen=path) ---');
    await page.goto('http://localhost:8000/index.html?screen=path', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    // Verificar que estamos en la vista de Ruta Duolingo (#viewLearningPath)
    const viewPath = await page.$('#viewLearningPath');
    assert(viewPath, 'Debe existir la vista de ruta #viewLearningPath');
    const isPathVisible = await viewPath.isVisible();
    assert(isPathVisible, 'La vista de ruta #viewLearningPath debe ser visible');
    console.log('✓ Vista de ruta Duolingo (#viewLearningPath) cargada exitosamente');

    // Verificar nodos del mapa hexagonal
    const nodes = await page.$$('#hexSkillTreeContainer .hex-node');
    assert(nodes.length >= 1, `Deben existir nodos en la ruta (encontrados: ${nodes.length})`);
    console.log(`✓ Encontrados ${nodes.length} nodos en el mapa hexagonal de aprendizaje`);

    // -------------------------------------------------------------------------
    // TEST 2: LANZAR LECCIÓN DESDE EL NODO 1 (HOLA)
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Haciendo clic en el Nodo 1 para iniciar la lección interactiva ---');
    const firstNode = nodes[0];
    await firstNode.click();
    await page.waitForTimeout(400);

    // Verificar que el modal de lección #lessonSessionModal se abrió
    const lessonModal = await page.$('#lessonSessionModal');
    assert(lessonModal, 'Debe existir el modal #lessonSessionModal');
    const isModalVisible = await lessonModal.isVisible();
    assert(isModalVisible, 'El modal #lessonSessionModal debe estar visible tras hacer clic en el nodo');
    console.log('✓ Modal de lección interactiva (#lessonSessionModal) abierto correctamente');

    // -------------------------------------------------------------------------
    // TEST 3: VALIDAR FASE 1 (DEMOSTRACIÓN GUIADA)
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Validando Fase 1: Demostración Guiada y Tips del Zorrito ---');
    const demoContainer = await page.$('#phaseDemoContainer');
    assert(await demoContainer.isVisible(), 'El contenedor de demo (#phaseDemoContainer) debe ser visible');

    const demoSignName = await page.$eval('#lessonDemoSignName', el => el.textContent.trim());
    console.log(`✓ Seña en demostración: "${demoSignName}"`);
    assert(demoSignName.length > 0, 'El nombre de la seña en demo no debe estar vacío');

    const btnContinue = await page.$('#btnLessonContinue');
    assert(btnContinue, 'Debe existir el botón continuar #btnLessonContinue');
    assert(!(await btnContinue.isDisabled()), 'El botón continuar debe estar activo en la fase demo');

    // Captura de pantalla de la Fase 1
    const screenshotDemo = path.join(screenshotsDir, 'lesson_phase1_demo.png');
    await page.screenshot({ path: screenshotDemo });
    console.log(`✓ Captura de Fase 1 guardada en: ${screenshotDemo}`);

    // Avanzar a Fase 2 (Quiz)
    await btnContinue.click();
    await page.waitForTimeout(400);

    // -------------------------------------------------------------------------
    // TEST 4: VALIDAR FASE 2 (TEST / PREGUNTA DE COMPRENSIÓN)
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Validando Fase 2: Pregunta de Comprensión Tipo Test ---');
    const quizContainer = await page.$('#phaseQuizContainer');
    assert(await quizContainer.isVisible(), 'El contenedor de quiz (#phaseQuizContainer) debe ser visible');

    const choiceButtons = await page.$$('#quizOptionsGrid .quiz-choice-btn');
    assert.strictEqual(choiceButtons.length, 4, 'Deben existir exactamente 4 opciones de respuesta');
    console.log('✓ Grilla de opciones tipo test con 4 alternativas generadas');

    // Botón continuar debe estar deshabilitado hasta responder
    assert(await btnContinue.isDisabled(), 'El botón continuar debe estar deshabilitado antes de responder');

    // Encontrar y hacer clic en la opción correcta
    const optionsData = await page.evaluate(() => {
      const controller = window.LessonSessionController.getInstance();
      return {
        targetSignId: controller.getCurrentSign()?.id,
        options: controller.getQuizOptions()
      };
    });

    console.log(`✓ Seña objetivo a identificar: ${optionsData.targetSignId}`);
    const correctBtn = await page.$(`.quiz-choice-btn[data-sign-id="${optionsData.targetSignId}"]`);
    assert(correctBtn, 'Debe existir el botón con la respuesta correcta');
    await correctBtn.click();
    await page.waitForTimeout(300);

    // Verificar que el feedback sheet apareció con estilo de éxito (.is-correct)
    const feedbackSheet = await page.$('#lessonFeedbackSheet');
    assert(await feedbackSheet.isVisible(), 'La franja de feedback #lessonFeedbackSheet debe ser visible');
    const hasSuccessClass = await page.$eval('#lessonFeedbackSheet', el => el.classList.contains('is-correct'));
    assert(hasSuccessClass, 'La franja de feedback debe tener la clase .is-correct tras un acierto');
    console.log('✓ Retroalimentación positiva mostrada en la franja estilo Duolingo');

    // Captura de pantalla de la Fase 2 (Quiz con feedback)
    const screenshotQuiz = path.join(screenshotsDir, 'lesson_phase2_quiz.png');
    await page.screenshot({ path: screenshotQuiz });
    console.log(`✓ Captura de Fase 2 guardada en: ${screenshotQuiz}`);

    // Avanzar a Fase 3 (Práctica con Cámara)
    await btnContinue.click();
    await page.waitForTimeout(500);

    // -------------------------------------------------------------------------
    // TEST 5: VALIDAR FASE 3 (PRÁCTICA CON CÁMARA / MEDIAPIPE)
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Validando Fase 3: Práctica de Réplica Motriz con Cámara ---');
    const practiceContainer = await page.$('#phasePracticeContainer');
    assert(await practiceContainer.isVisible(), 'El contenedor de práctica (#phasePracticeContainer) debe ser visible');

    // Verificar split view (guía espejo + cámara en vivo)
    const guideVideo = await page.$('#lessonPracticeGuideVideo');
    assert(guideVideo, 'Debe existir el video guía espejo en split view');

    // Simular cumplimiento de réplica motriz (85% durante 1.2s)
    console.log('✓ Simulando frame de detección MediaPipe con alta precisión...');
    await page.evaluate(() => {
      const controller = window.LessonSessionController.getInstance();
      controller.handleSignMasteredInLesson(controller.getCurrentSign(), 96);
    });
    await page.waitForTimeout(400);

    // Verificar que feedback de práctica exitosa está visible
    assert(await feedbackSheet.isVisible(), 'La franja de feedback debe confirmar la réplica exitosa');
    assert(await page.$eval('#lessonFeedbackSheet', el => el.classList.contains('is-correct')), 'Feedback de éxito confirmado');

    // Captura de pantalla de la Fase 3
    const screenshotPractice = path.join(screenshotsDir, 'lesson_phase3_practice.png');
    await page.screenshot({ path: screenshotPractice });
    console.log(`✓ Captura de Fase 3 guardada en: ${screenshotPractice}`);

    // Avanzar a Fase 4 (Resumen de Lección)
    await btnContinue.click();
    await page.waitForTimeout(400);

    // -------------------------------------------------------------------------
    // TEST 6: VALIDAR FASE 4 (RESUMEN DE VICTORIA Y OTORGAMIENTO DE XP)
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Validando Fase 4: Resumen de Victoria y Otorgamiento de +50 XP ---');
    const summaryContainer = await page.$('#phaseSummaryContainer');
    assert(await summaryContainer.isVisible(), 'El contenedor de resumen (#phaseSummaryContainer) debe ser visible');

    const xpText = await page.$eval('#lessonSummaryXp', el => el.textContent.trim());
    console.log(`✓ Recompensa de la lección: "${xpText}"`);
    assert(xpText.includes('+50 XP'), 'Debe mostrar la ganancia de +50 XP');

    // Captura de pantalla de la Fase 4
    const screenshotSummary = path.join(screenshotsDir, 'lesson_phase4_summary.png');
    await page.screenshot({ path: screenshotSummary });
    console.log(`✓ Captura de Fase 4 guardada en: ${screenshotSummary}`);

    // Finalizar lección y volver al mapa
    const btnFinish = await page.$('#btnLessonFinish');
    assert(btnFinish, 'Debe existir el botón #btnLessonFinish');
    await btnFinish.click();
    await page.waitForTimeout(500);

    // -------------------------------------------------------------------------
    // TEST 7: VALIDAR RETORNO AL MAPA Y NODO COMPLETADO
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Validando Cierre del Modal y Actualización del Nodo en la Ruta ---');
    const isModalClosed = await page.$eval('#lessonSessionModal', el => el.classList.contains('hidden'));
    assert(isModalClosed, 'El modal de lección debe estar cerrado (clase hidden)');
    console.log('✓ Modal cerrado con éxito, usuario de vuelta en el mapa');

    // Verificar que el perfil registró la seña dominada
    const profileData = await page.evaluate(() => {
      if (window.AuthProfileManager) {
        return window.AuthProfileManager.getCurrentProfile();
      }
      return null;
    });

    if (profileData) {
      console.log(`✓ Perfil actualizado - XP Total: ${profileData.xp}, Señas Dominadas: ${profileData.masteredSigns.join(', ')}`);
      assert(profileData.masteredSigns.includes(optionsData.targetSignId), 'La seña debe estar registrada como dominada');
    }

    // -------------------------------------------------------------------------
    // TEST 8: ACCESIBILIDAD Y RESPONSIVIDAD (390x844 Móvil y 1280x850 Escritorio)
    // -------------------------------------------------------------------------
    console.log('\n--- 8. Validando Accesibilidad y Cero Desbordamiento Horizontal ---');
    
    // Escritorio
    const desktopOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    assert(!desktopOverflow, 'No debe haber desbordamiento horizontal en escritorio (1280x850)');
    console.log('✓ Cero desbordamiento horizontal en escritorio (1280x850)');

    // Móvil (390x844)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);
    const mobileOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    assert(!mobileOverflow, 'No debe haber desbordamiento horizontal en móvil (390x844)');
    console.log('✓ Cero desbordamiento horizontal en móvil (390x844)');

    // -------------------------------------------------------------------------
    // TEST 9: AUDITORÍA DE CONSOLA (window.__consoleErrors == [])
    // -------------------------------------------------------------------------
    console.log('\n--- 9. Verificando Cero Errores en Consola (Regla 7 AGENTS.md) ---');
    const runtimeConsoleErrors = await page.evaluate(() => window.__consoleErrors || []);
    const totalErrors = [...consoleErrors, ...runtimeConsoleErrors];

    console.log(`✓ Errores capturados: ${totalErrors.length}`);
    if (totalErrors.length > 0) {
      console.error('Errores detectados:', totalErrors);
    }
    assert.strictEqual(totalErrors.length, 0, 'No deben existir errores en consola');
    console.log('✓ CERO errores en consola (Regla 7 cumplida al 100%)');

    console.log('\n🎉 ¡TODAS LAS PRUEBAS DE LA LECCIÓN INTERACTIVA PASARON AL 100%!');

  } catch (error) {
    console.error('\n❌ Error en la prueba E2E:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
