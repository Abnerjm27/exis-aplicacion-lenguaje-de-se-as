const { chromium } = require('playwright');
const assert = require('assert');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log("=== VERIFICACIÓN VISUAL Y FUNCIONAL DE LA ARENA DE EXAMEN (RETOS CÁMARA + PREGUNTAS QUIZ) ===");
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream']
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 850 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto('http://localhost:8000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  // Iniciar la Arena de Examen con plan alternado (HOLA, YO)
  console.log("Iniciando Arena de Examen con plan de prueba...");
  await page.evaluate(() => {
    if (window.BlindExamController) {
      window.BlindExamController.start({
        title: 'Examen LSC Completo',
        signs: ['HOLA', 'YO'],
        secondsPerQuestion: 25,
        difficultyLevel: 1
      });
    }
  });

  await page.waitForTimeout(500);

  // 1. Verificar Reto 1 (Cámara)
  const gestureVisible = await page.$eval('#examPaneGesture', el => !el.classList.contains('hidden'));
  assert.ok(gestureVisible, "Reto 1 debe mostrar el panel de cámara");

  const signName = await page.$eval('#examGestureSignName', el => el.textContent.trim());
  console.log(`✓ Reto 1: Seña en grande "${signName}"`);
  assert.strictEqual(signName, 'HOLA');

  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });
  await page.screenshot({ path: path.join(screenshotsDir, 'arena_reto1_camara.png') });
  console.log("✓ Captura guardada: arena_reto1_camara.png");

  // Saltar Reto 1 para pasar a la Pregunta 2 (Quiz)
  console.log("Saltando Reto 1 para evaluar la Pregunta 2 de Quiz...");
  await page.click('#btnExamSkipGesture');
  await page.waitForTimeout(500);

  // 2. Verificar Pregunta 2 (Quiz con 4 alternativas)
  const quizVisible = await page.$eval('#examPaneQuiz', el => !el.classList.contains('hidden'));
  assert.ok(quizVisible, "Pregunta 2 debe mostrar el panel de quiz");

  const optionsCount = await page.$$eval('.exam-quiz-opt-btn', btns => btns.length);
  console.log(`✓ Pregunta 2: ${optionsCount} opciones interactivas generadas`);
  assert.strictEqual(optionsCount, 4, "Deben generarse exactamente 4 opciones");

  await page.screenshot({ path: path.join(screenshotsDir, 'arena_pregunta2_quiz.png') });
  console.log("✓ Captura guardada: arena_pregunta2_quiz.png");

  // 3. Responder la opción correcta de la pregunta
  const correctOptionText = await page.$eval('.exam-quiz-opt-btn[data-is-correct="true"]', el => el.textContent.trim());
  console.log(`✓ Seleccionando opción correcta: "${correctOptionText.replace(/\s+/g, ' ')}"`);
  await page.click('.exam-quiz-opt-btn[data-is-correct="true"]');
  await page.waitForTimeout(800);

  // 4. Verificar que se muestra el certificado y resumen final (#examSummaryModal)
  const summaryVisible = await page.$eval('#examSummaryModal', el => !el.classList.contains('hidden'));
  assert.ok(summaryVisible, "Al terminar debe mostrarse el certificado final de resultados");

  const finalScore = await page.$eval('#examFinalScorePct', el => el.textContent.trim());
  console.log(`✓ Certificado mostrado con calificación: ${finalScore}`);

  // Cerrar resumen
  await page.click('#btnCloseExamSummary');
  await page.waitForTimeout(300);

  const summaryHidden = await page.$eval('#examSummaryModal', el => el.classList.contains('hidden'));
  assert.ok(summaryHidden, "El modal de resumen debe cerrarse correctamente");

  assert.strictEqual(consoleErrors.length, 0, `Cero errores de consola: ${JSON.stringify(consoleErrors)}`);

  await browser.close();
  console.log("\n✅ ¡FLUJO COMPLETO DE LA ARENA VERIFICADO CON ÉXITO! (Retos de Cámara + Preguntas Quiz)");
  process.exit(0);
})().catch(err => {
  console.error("❌ Error en verificación:", err);
  process.exit(1);
});
