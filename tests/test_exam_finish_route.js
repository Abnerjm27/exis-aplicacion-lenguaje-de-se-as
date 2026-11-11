const { chromium } = require('playwright');
const assert = require('assert');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--no-sandbox']
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 850 } });

  console.log("Cargando aplicación http://localhost:8000/ ...");
  await page.goto('http://localhost:8000/', { waitUntil: 'networkidle' });

  // 1. Ir a la vista de Ruta (Skill Tree)
  console.log("Navegando a la vista de Ruta (#viewLearningPath) ...");
  await page.evaluate(() => window.ViewRouter.switchToPathView());
  await page.waitForTimeout(400);

  let currentView = await page.evaluate(() => window.ViewRouter.getCurrentView());
  assert.strictEqual(currentView, 'path', 'Debe estar en la vista de Ruta');

  // 2. Iniciar examen desde el nodo Trofeo Final
  console.log("Haciendo clic en el nodo Trofeo de Examen Final...");
  const trophy = await page.$('#btnPathFinalExamNode');
  await trophy.scrollIntoViewIfNeeded();
  await trophy.click();
  await page.waitForTimeout(400);

  // Verificar que el modal de la arena de examen está abierto
  const examModalVisible = await page.evaluate(() => {
    const m = document.getElementById('examSessionModal');
    return m && !m.classList.contains('hidden');
  });
  assert.strictEqual(examModalVisible, true, 'La arena de examen debe estar visible');
  console.log("✓ Arena de examen abierta exitosamente sobre la ruta");

  // Verificar que no se forzó el estudio en el background
  const pathHidden = await page.evaluate(() => {
    const p = document.getElementById('viewLearningPath');
    return p && p.classList.contains('hidden');
  });
  assert.strictEqual(pathHidden, false, '#viewLearningPath no debe ocultarse al iniciar el examen');
  console.log("✓ La vista de Ruta se mantuvo en el background sin saltar al estudio");

  // 3. Probar salir del examen con el botón 'Salir del examen' (#btnExamClose)
  console.log("Probando salida voluntaria con #btnExamClose ...");
  await page.click('#btnExamClose');
  await page.waitForTimeout(400);

  let viewAfterClose = await page.evaluate(() => window.ViewRouter.getCurrentView());
  assert.strictEqual(viewAfterClose, 'path', 'Al salir del examen debe permanecer en la Ruta');
  console.log("✓ Salida voluntaria regresó a la Ruta (viewLearningPath)");

  // 4. Iniciar nuevamente y completar el examen hasta el final
  console.log("Iniciando examen nuevamente para completarlo hasta el certificado final...");
  await page.click('#btnPathFinalExamNode');
  await page.waitForTimeout(400);

  // Simular responder o saltar todas las preguntas del examen
  const totalQuestions = await page.evaluate(() => {
    return window.BlindExamController ? 6 : 0;
  });

  console.log("Avanzando por las preguntas del examen...");
  for (let i = 0; i < 8; i++) {
    const isFinished = await page.evaluate(() => {
      const summaryModal = document.getElementById('examSummaryModal');
      return summaryModal && !summaryModal.classList.contains('hidden');
    });
    if (isFinished) break;

    await page.evaluate(() => {
      if (window.BlindExamController && window.BlindExamController.isExamActive()) {
        window.BlindExamController.skipCurrentQuestion();
      }
    });
    await page.waitForTimeout(200);
  }

  // 5. Verificar que se abrió el modal de resumen (#examSummaryModal)
  const summaryModalVisible = await page.evaluate(() => {
    const m = document.getElementById('examSummaryModal');
    return m && !m.classList.contains('hidden');
  });
  assert.strictEqual(summaryModalVisible, true, 'El modal de resumen/certificado debe estar visible al acabar el examen');
  console.log("✓ Certificado final (#examSummaryModal) visible");

  // 6. Hacer clic en 'Aceptar' (#btnCloseExamSummary)
  console.log("Haciendo clic en 'Aceptar' para cerrar el resumen...");
  await page.click('#btnCloseExamSummary');
  await page.waitForTimeout(400);

  // 7. VERIFICACIÓN CRÍTICA: ¿Estamos en la Ruta o en el Estudio?
  const finalView = await page.evaluate(() => window.ViewRouter.getCurrentView());
  const pathVisible = await page.evaluate(() => {
    const p = document.getElementById('viewLearningPath');
    return p && !p.classList.contains('hidden');
  });
  const studioHidden = await page.evaluate(() => {
    const s = document.getElementById('viewPracticeStudio');
    return s && s.classList.contains('hidden');
  });

  console.log(`Vista final: '${finalView}', pathVisible: ${pathVisible}, studioHidden: ${studioHidden}`);
  assert.strictEqual(finalView, 'path', 'Al acabar el examen debe regresar a la Ruta (path), NO al estudio');
  assert.strictEqual(pathVisible, true, '#viewLearningPath debe estar visible');
  assert.strictEqual(studioHidden, true, '#viewPracticeStudio debe estar oculto');

  console.log("🎉 VERIFICACIÓN 100% EXITOSA: Al acabar el examen regresa a la Ruta de Aprendizaje!");
  await browser.close();
})();
