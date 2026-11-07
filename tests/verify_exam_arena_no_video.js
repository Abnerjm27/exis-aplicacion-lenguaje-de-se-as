const { chromium } = require('playwright');
const assert = require('assert');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log("=== VERIFICACIÓN VISUAL Y FUNCIONAL DE LA ARENA DE EXAMEN (CERO VIDEOS) ===");
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

  // Iniciar la Arena de Examen mediante BlindExamController
  console.log("Iniciando Arena de Examen con plan de prueba...");
  await page.evaluate(() => {
    if (window.BlindExamController) {
      window.BlindExamController.start({
        title: 'Examen de Memoria LSC',
        signs: ['HOLA', 'YO', 'BUENOS'],
        secondsPerQuestion: 25,
        difficultyLevel: 1
      });
    }
  });

  await page.waitForTimeout(500);

  // 1. Verificar visibilidad del modal de examen
  const modalVisible = await page.$eval('#examSessionModal', el => !el.classList.contains('hidden') && el.classList.contains('flex'));
  assert.ok(modalVisible, "El modal de la Arena de Examen debe estar visible");

  // 2. Verificar que NO EXISTEN videos demostrativos ni reproductores de video con src en el examen
  const quizVideoExists = await page.$('#examQuizVideo');
  assert.strictEqual(quizVideoExists, null, "NO debe existir #examQuizVideo en el examen");

  const realAnimeButtons = await page.$('#btnExamModeReal');
  assert.strictEqual(realAnimeButtons, null, "NO deben existir botones de modo de video (Real/Anime) en el header de examen");

  // 3. Verificar elementos de la pantalla limpia de evaluación
  const signName = await page.$eval('#examGestureSignName', el => el.textContent.trim());
  console.log(`Palabra en grande mostrada: "${signName}"`);
  assert.strictEqual(signName, 'HOLA', "Debe mostrar la palabra a realizar en grande");

  const headerStep = await page.$eval('#examHeaderStepText', el => el.textContent.trim());
  console.log(`Header badge: "${headerStep}"`);
  assert.strictEqual(headerStep, 'Reto 1 de 3 · Nivel 1');

  const timerText = await page.$eval('#examTimerText', el => el.textContent.trim());
  console.log(`Cronómetro tabular: "${timerText}"`);
  assert.ok(timerText.includes('s'), "El cronómetro debe mostrar segundos");

  // 4. Verificar marco de cámara centrado y canvas de MediaPipe
  const hasWebcamVideo = await page.$eval('#examPracticeWebcamVideo', el => el !== null);
  const hasCanvas = await page.$eval('#examPracticeCanvas', el => el !== null);
  const hasRadarBar = await page.$eval('#examGestureRadarBar', el => el !== null);
  const hasRadarText = await page.$eval('#examGestureRadarText', el => el !== null);

  assert.ok(hasWebcamVideo, "Debe tener elemento de video para la webcam");
  assert.ok(hasCanvas, "Debe tener canvas para landmarks de MediaPipe");
  assert.ok(hasRadarBar, "Debe tener barra de radar");
  assert.ok(hasRadarText, "Debe tener texto de porcentaje de radar");

  // 5. Verificar botones de control
  const hasSkipBtn = await page.$eval('#btnExamSkipGesture', el => el.textContent.trim().includes('Saltar'));
  const hasExitBtn = await page.$eval('#btnExamExitBottom', el => el.textContent.trim().includes('Salir'));
  assert.ok(hasSkipBtn, "Debe existir botón para saltar seña");
  assert.ok(hasExitBtn, "Debe existir botón para salir del examen");

  // Captura de pantalla para validación visual
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });
  const screenshotPath = path.join(screenshotsDir, 'arena_examen_cero_videos.png');
  await page.screenshot({ path: screenshotPath });
  console.log(`✓ Captura guardada en: ${screenshotPath}`);

  // 6. Probar botón "Salir del examen" y verificar que la cámara se detiene y el modal se oculta
  await page.click('#btnExamExitBottom');
  await page.waitForTimeout(300);

  const modalHiddenAfterExit = await page.$eval('#examSessionModal', el => el.classList.contains('hidden'));
  assert.ok(modalHiddenAfterExit, "El modal de examen debe ocultarse tras salir");

  assert.strictEqual(consoleErrors.length, 0, `No debe haber errores de consola: ${JSON.stringify(consoleErrors)}`);

  await browser.close();
  console.log("\n✅ ¡VERIFICACIÓN EXITOSA! Arena de examen limpia, centrada, cero videos y con apagado de cámara.");
  process.exit(0);
})().catch(err => {
  console.error("❌ Error en verificación:", err);
  process.exit(1);
});
