const { chromium } = require('playwright');

async function test20Signs() {
  console.log("=== INICIANDO TEST PLAYWRIGHT: CATÁLOGO DE 20 SEÑAS ===");
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

  if (signsDataInfo.totalSigns !== 20) {
    throw new Error(`Se esperaban 20 señas pero hay ${signsDataInfo.totalSigns}`);
  }

  // 2. Probar cambio a cada una de las 5 nuevas señas: ANNOS, LICOR, D, E, U
  const newSignsToTest = [
    { id: 'ANNOS', cat: 'words', tabBtn: '#catWordsBtn' },
    { id: 'LICOR', cat: 'words', tabBtn: '#catWordsBtn' },
    { id: 'D', cat: 'letters', tabBtn: '#catLettersBtn' },
    { id: 'E', cat: 'letters', tabBtn: '#catLettersBtn' },
    { id: 'U', cat: 'letters', tabBtn: '#catLettersBtn' }
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
      const signId = window.VideoPlayer ? window.VideoPlayer.getSign() : null;
      const badge = document.getElementById('targetSignBadge') ? document.getElementById('targetSignBadge').textContent : '';
      const videoSrc = document.getElementById('signVideo') ? document.getElementById('signVideo').src : '';
      return {
        id: signId,
        badge,
        videoSrc
      };
    });

    console.log(`✓ Seña activa reportada por VideoPlayer: ${activeSign.id}`);
    console.log(`✓ Badge en interfaz: ${activeSign.badge}`);
    console.log(`✓ Fuente de video: ${activeSign.videoSrc}`);

    if (activeSign.id !== item.id) {
      throw new Error(`Se esperaba seña activa ${item.id} pero es ${activeSign.id}`);
    }
  }

  console.log("\n=== VERIFICACIÓN DE ERRORES DE CONSOLA ===");
  if (consoleErrors.length > 0) {
    console.error("Errores encontrados:", consoleErrors);
    throw new Error(`Se detectaron ${consoleErrors.length} errores en consola`);
  }
  console.log("✓ Cero errores de consola detectados en la prueba completa.");

  await page.screenshot({ path: 'tests/screenshots/catalogo_20_senas.png', fullPage: true });
  console.log("✓ Captura guardada en tests/screenshots/catalogo_20_senas.png");

  await browser.close();
  console.log("\n=== TEST FINALIZADO CON ÉXITO: 20 SEÑAS FUNCIONANDO ===");
}

test20Signs().catch(err => {
  console.error("Error en prueba Playwright:", err);
  process.exit(1);
});
