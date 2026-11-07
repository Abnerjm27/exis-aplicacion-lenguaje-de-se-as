/**
 * LSC Learn · Proyecto EXIS
 * tests/verify_anime_and_checkpoints.spec.js
 * 
 * Validación Playwright en navegador real:
 * 1. Conmutador Real vs Anime IA en modal de lección (#lessonSessionModal) con carga de video/webp correspondiente.
 * 2. Nodos Checkpoint cada 3 palabras en el árbol Duolingo (#hexSkillTreeContainer) con dificultad ascendente (25s -> 20s -> 15s).
 * 3. Examen Final de Unidad (#btnPathFinalExamNode) que evalúa TODAS las palabras del plan.
 * 4. Cero errores de consola (Regla 7 AGENTS.md).
 */

const { chromium } = require('playwright');
const assert = require('assert');

(async () => {
  console.log('🎭 [PLAYWRIGHT] Iniciando prueba E2E: Videos Anime IA y Checkpoints de Examen...');

  const browser = await chromium.launch({
    headless: true,
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream']
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 850 } });
  const consoleErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    await page.goto('http://localhost:8000/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // 1. Navegar a la vista de Mapa de Aprendizaje (#viewLearningPath)
    console.log('1. Verificando árbol de habilidades Duolingo y Checkpoints...');
    const btnNavPath = page.locator('#btnNavViewPath');
    await btnNavPath.click();
    await page.waitForTimeout(500);

    // Verificar que los nodos checkpoint existen cada 3 palabras
    const checkpointNodes = page.locator('.duolingo-checkpoint-node');
    const cpCount = await checkpointNodes.count();
    console.log(`   Se encontraron ${cpCount} nodos checkpoint en el árbol.`);
    assert(cpCount >= 1, `Debe haber al menos 1 checkpoint, encontrados: ${cpCount}`);

    const cp1Text = await checkpointNodes.first().innerText();
    console.log(`   Texto de Checkpoint 1: "${cp1Text.replace(/\n/g, ' ')}"`);
    assert(cp1Text.toUpperCase().includes('CHECKPOINT 1'), 'Debe decir Checkpoint 1');
    assert(cp1Text.includes('Nvl 1'), 'Debe indicar Nvl 1');

    // 2. Probar apertura de lección interactiva y conmutador Real vs Anime IA
    console.log('2. Abriendo lección interactiva y probando toggle Real vs Anime...');
    const firstSignNode = page.locator('.hex-node').first();
    await firstSignNode.click();
    await page.waitForTimeout(600);

    const lessonModal = page.locator('#lessonSessionModal');
    assert(await lessonModal.isVisible(), 'El modal de lección debe estar visible');

    const btnReal = page.locator('#btnLessonModeReal');
    const btnAnime = page.locator('#btnLessonModeAnime');
    assert(await btnReal.isVisible(), 'El botón Real debe estar visible en el header');
    assert(await btnAnime.isVisible(), 'El botón Anime IA debe estar visible en el header');

    const demoVideo = page.locator('#lessonDemoVideo');
    const initialSrc = await demoVideo.getAttribute('src');
    console.log(`   Video inicial (Real): ${initialSrc}`);
    assert(initialSrc && initialSrc.includes('videos/real/'), `Video inicial debe ser de videos/real/, obtenido: ${initialSrc}`);

    // Conmutar a Anime
    console.log('   Haciendo click en botón "Anime IA"...');
    await btnAnime.click();
    await page.waitForTimeout(400);

    const animeSrc = await demoVideo.getAttribute('src');
    console.log(`   Video tras conmutar (Anime): ${animeSrc}`);
    assert(animeSrc && animeSrc.includes('videos/anime/'), `Video conmutado debe ser de videos/anime/, obtenido: ${animeSrc}`);

    // Conmutar de vuelta a Real
    console.log('   Haciendo click en botón "Real"...');
    await btnReal.click();
    await page.waitForTimeout(400);

    const backToRealSrc = await demoVideo.getAttribute('src');
    console.log(`   Video tras regresar a Real: ${backToRealSrc}`);
    assert(backToRealSrc && backToRealSrc.includes('videos/real/'), `Video restaurado debe ser de videos/real/, obtenido: ${backToRealSrc}`);

    // Cerrar lección
    await page.locator('#btnLessonClose').click();
    await page.waitForTimeout(500);

    // 3. Probar Checkpoint 1: Reto a ciegas con dificultad escalada
    console.log('3. Probando lanzamiento de Checkpoint 1...');
    await btnNavPath.click();
    await page.waitForTimeout(400);

    await checkpointNodes.first().scrollIntoViewIfNeeded();
    await checkpointNodes.first().click({ force: true });
    await page.waitForTimeout(800);

    // Debe haber cambiado al estudio en modo examen
    const overlay = page.locator('#blindExamOverlay');
    assert(await overlay.isVisible(), 'El escudo de examen ciego debe estar visible tras click en Checkpoint');

    const counterText = await page.locator('#examQuestionCounter').innerText();
    console.log(`   HUD de Checkpoint 1: "${counterText}"`);
    assert(counterText.toUpperCase().includes('RETO 1 DE 3'), `Debe evaluar 3 señas del checkpoint, pero dice: ${counterText}`);
    assert(counterText.toUpperCase().includes('NIVEL 1'), `Debe indicar Nivel 1, pero dice: ${counterText}`);

    // Salir del examen
    await page.locator('#btnExitExam').click();
    await page.waitForTimeout(400);

    // 4. Probar Examen Final de Unidad (#btnPathFinalExamNode) con TODAS las palabras
    console.log('4. Probando Examen Final de Unidad con todas las palabras del plan...');
    await btnNavPath.click();
    await page.waitForTimeout(400);

    const trophyBtn = page.locator('#btnPathFinalExamNode');
    assert(await trophyBtn.isVisible(), 'El trofeo de examen final debe estar visible');

    await trophyBtn.scrollIntoViewIfNeeded();
    await trophyBtn.click({ force: true });
    await page.waitForTimeout(800);

    assert(await overlay.isVisible(), 'El escudo de examen debe estar visible para el examen final');

    const finalCounterText = await page.locator('#examQuestionCounter').innerText();
    console.log(`   HUD de Examen Final: "${finalCounterText}"`);
    // En el plan por defecto 'saludos' hay 8 señas
    assert(finalCounterText.toUpperCase().includes('RETO 1 DE 8'), `El examen final debe incluir todas las 8 señas del plan, pero dice: ${finalCounterText}`);
    assert(finalCounterText.toUpperCase().includes('NIVEL 3'), `El examen final debe ser Nivel 3 o superior, pero dice: ${finalCounterText}`);

    await page.locator('#btnExitExam').click();

    // 5. Verificar cero errores de consola
    console.log('5. Verificando logs de consola...');
    console.log(`   Errores de consola encontrados: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.error('   Errores:', consoleErrors);
    }
    assert.strictEqual(consoleErrors.length, 0, 'No debe haber errores de consola (Regla 7 AGENTS.md)');

    console.log('\n✅ [PASS] ¡Todas las verificaciones E2E de Anime IA, Checkpoints y Examen Final pasaron al 100%!');
  } catch (err) {
    console.error('\n❌ [FAIL] Error en la prueba:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
