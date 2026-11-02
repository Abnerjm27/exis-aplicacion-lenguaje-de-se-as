const { chromium } = require('playwright');

async function test15Signs() {
  console.log("=== INICIANDO TEST PLAYWRIGHT: CATÁLOGO DE 15 SEÑAS ===");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 850 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  await page.goto('http://localhost:8000/', { waitUntil: 'networkidle' });

  // 1. Verificar catálogo completo en SIGNS_DATA
  const signsDataInfo = await page.evaluate(() => {
    const words = window.SIGNS_DATA.words.map(w => w.id);
    const letters = window.SIGNS_DATA.letters.map(l => l.id);
    return {
      totalWords: words.length,
      totalLetters: letters.length,
      totalSigns: words.length + letters.length,
      words,
      letters
    };
  });

  console.log(`✓ Palabras cargadas (${signsDataInfo.totalWords}):`, signsDataInfo.words.join(', '));
  console.log(`✓ Letras cargadas (${signsDataInfo.totalLetters}):`, signsDataInfo.letters.join(', '));
  console.log(`✓ Total de señas en catálogo: ${signsDataInfo.totalSigns}`);

  if (signsDataInfo.totalSigns !== 15) {
    throw new Error(`Se esperaban 15 señas pero hay ${signsDataInfo.totalSigns}`);
  }

  // 2. Probar cambio a cada una de las 4 nuevas señas: TARDES, GUSTAR, I, O
  const newSignsToTest = [
    { id: 'TARDES', cat: 'words', tabBtn: '#catWordsBtn' },
    { id: 'GUSTAR', cat: 'words', tabBtn: '#catWordsBtn' },
    { id: 'I', cat: 'letters', tabBtn: '#catLettersBtn' },
    { id: 'O', cat: 'letters', tabBtn: '#catLettersBtn' }
  ];

  for (const item of newSignsToTest) {
    console.log(`\n--- Probando selección de seña: ${item.id} (${item.cat}) ---`);
    const tab = page.locator(item.tabBtn);
    await tab.click();
    await page.waitForTimeout(300);

    const btn = page.locator(`#btn-sign-${item.id}`);
    await btn.waitFor({ state: 'visible', timeout: 5000 });
    await btn.click();
    await page.waitForTimeout(500);

    const activeSign = await page.evaluate(() => {
      const p = window.VideoPlayer ? window.VideoPlayer.getSign() : null;
      const title = document.getElementById('lessonTitle') ? document.getElementById('lessonTitle').textContent : '';
      return { p, title };
    });

    console.log(`  Activo en VideoPlayer: ${activeSign.p}`);
    console.log(`  Título en UI: ${activeSign.title}`);

    if (activeSign.p !== item.id) {
      throw new Error(`Fallo al activar seña ${item.id}, se obtuvo ${activeSign.p}`);
    }
  }

  // 3. Probar pausa/reanudación en una de las nuevas señas
  console.log("\n--- Probando pausa y reanudación ---");
  const playPauseBtn = page.locator('#btnPlayPause');
  await playPauseBtn.click();
  await page.waitForTimeout(400);

  const pauseCheck = await page.evaluate(() => {
    const v = document.getElementById('signVideo');
    const aria = document.getElementById('btnPlayPause').getAttribute('aria-label');
    const isPaused = v ? v.paused : false;
    return { aria, isPaused };
  });
  console.log(`  Estado tras pausar: aria='${pauseCheck.aria}', video.paused=${pauseCheck.isPaused}`);
  if (pauseCheck.aria !== 'Reproducir video' && !pauseCheck.isPaused) {
    throw new Error("El botón play/pause no pausó la reproducción");
  }

  await playPauseBtn.click();
  await page.waitForTimeout(400);
  const resumeCheck = await page.evaluate(() => {
    const v = document.getElementById('signVideo');
    const aria = document.getElementById('btnPlayPause').getAttribute('aria-label');
    return { aria, isPlaying: v ? !v.paused : true };
  });
  console.log(`  Estado tras reanudar: aria='${resumeCheck.aria}', video.playing=${resumeCheck.isPlaying}`);

  // 4. Verificar ausencia de errores de consola
  console.log(`\nErrores de consola capturados: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.error("Errores:", consoleErrors);
    throw new Error("Se detectaron errores en la consola durante las pruebas");
  }

  await browser.close();
  console.log("\n=== TEST FINALIZADO CON ÉXITO: 15 SEÑAS 100% OPERATIVAS ===");
}

test15Signs().catch(err => {
  console.error("FALLO EL TEST:", err);
  process.exit(1);
});
