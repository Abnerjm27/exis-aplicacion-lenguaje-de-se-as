const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testLetterIAnime() {
  console.log("=== VERIFICACIÓN PLAYWRIGHT: CLIP ANIME IA LETRA I ===");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 850 } });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  await page.goto('http://localhost:8000/', { waitUntil: 'networkidle' });

  // 1. Activar Modo Anime IA
  console.log("--- 1. Activando Modo Anime IA ---");
  await page.click('#btnModeAnime');
  await page.waitForTimeout(400);

  // 2. Cambiar a categoría Letras y seleccionar Letra I
  console.log("--- 2. Cambiando a categoría Letras y seleccionando Letra I ---");
  await page.click('#catLettersBtn');
  await page.waitForTimeout(400);
  await page.click('#btn-sign-I');
  await page.waitForTimeout(800);

  const iBodyState = await page.evaluate(() => {
    const v = document.getElementById('signVideo');
    const badge = document.getElementById('badgeText');
    return {
      src: v ? v.src : null,
      mode: window.VideoPlayer ? window.VideoPlayer.getMode() : null,
      view: window.VideoPlayer ? window.VideoPlayer.getView() : null,
      sign: window.VideoPlayer ? window.VideoPlayer.getSign() : null,
      badgeText: badge ? badge.textContent : '',
      currentTime: v ? v.currentTime : 0,
      paused: v ? v.paused : true,
      consoleErrors: window.__consoleErrors || []
    };
  });
  console.log("Estado de Letra I (Cuerpo) en Anime IA:", iBodyState);

  if (!iBodyState.src || !iBodyState.src.includes('videos/anime/I_body.mp4')) {
    throw new Error(`Letra I no cargó el video anime esperado: ${iBodyState.src}`);
  }

  // Captura de pantalla de vista Cuerpo
  const screenshotDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
  await page.screenshot({ path: path.join(screenshotDir, 'letter_i_anime_body.png') });
  console.log("Captura guardada: screenshots/letter_i_anime_body.png");

  // 3. Probar vista de mano en Letra I
  console.log("--- 3. Cambiando a vista Mano en Letra I ---");
  await page.click('#btnViewHand');
  await page.waitForTimeout(800);

  const iHandState = await page.evaluate(() => {
    const v = document.getElementById('signVideo');
    return {
      src: v ? v.src : null,
      view: window.VideoPlayer ? window.VideoPlayer.getView() : null,
      currentTime: v ? v.currentTime : 0,
      paused: v ? v.paused : true
    };
  });
  console.log("Estado de Letra I (Mano) en Anime IA:", iHandState);

  if (!iHandState.src || !iHandState.src.includes('videos/anime/I_hand.mp4')) {
    throw new Error(`Letra I Mano no cargó el video anime esperado: ${iHandState.src}`);
  }

  await page.screenshot({ path: path.join(screenshotDir, 'letter_i_anime_hand.png') });
  console.log("Captura guardada: screenshots/letter_i_anime_hand.png");

  // 4. Verificar ausencia de errores de consola
  const globalConsoleErrors = await page.evaluate(() => window.__consoleErrors || []);
  console.log(`Errores capturados por page.on('console'): ${errors.length}`);
  console.log(`Errores capturados por window.__consoleErrors: ${globalConsoleErrors.length}`);

  if (errors.length > 0 || globalConsoleErrors.length > 0) {
    console.error("Errores:", errors, globalConsoleErrors);
    throw new Error("Se detectaron errores en consola durante la prueba");
  }

  await browser.close();
  console.log("\n=== PRUEBA DE LETRA I EN ANIME IA APROBADA AL 100% (0 ERRORES) ===");
}

testLetterIAnime().catch(err => {
  console.error("FALLÓ EL TEST DE LETRA I:", err);
  process.exit(1);
});
