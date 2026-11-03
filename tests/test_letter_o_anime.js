const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testLetterOAnime() {
  console.log("=== VERIFICACIÓN PLAYWRIGHT: CLIP ANIME IA LETRA O ===");
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

  // 2. Cambiar a categoría Letras y seleccionar Letra O
  console.log("--- 2. Cambiando a categoría Letras y seleccionando Letra O ---");
  await page.click('#catLettersBtn');
  await page.waitForTimeout(400);
  await page.click('#btn-sign-O');
  await page.waitForTimeout(800);

  const oBodyState = await page.evaluate(() => {
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
  console.log("Estado de Letra O (Cuerpo) en Anime IA:", oBodyState);

  if (!oBodyState.src || !oBodyState.src.includes('videos/anime/O_body.mp4')) {
    throw new Error(`Letra O no cargó el video anime esperado: ${oBodyState.src}`);
  }

  // Captura de pantalla de vista Cuerpo
  const screenshotDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
  await page.screenshot({ path: path.join(screenshotDir, 'letter_o_anime_body.png') });
  console.log("Captura guardada: screenshots/letter_o_anime_body.png");

  // 3. Probar vista de mano en Letra O
  console.log("--- 3. Cambiando a vista Mano en Letra O ---");
  await page.click('#btnViewHand');
  await page.waitForTimeout(800);

  const oHandState = await page.evaluate(() => {
    const v = document.getElementById('signVideo');
    return {
      src: v ? v.src : null,
      view: window.VideoPlayer ? window.VideoPlayer.getView() : null,
      currentTime: v ? v.currentTime : 0,
      paused: v ? v.paused : true
    };
  });
  console.log("Estado de Letra O (Mano) en Anime IA:", oHandState);

  if (!oHandState.src || !oHandState.src.includes('videos/anime/O_hand.mp4')) {
    throw new Error(`Letra O Mano no cargó el video anime esperado: ${oHandState.src}`);
  }

  await page.screenshot({ path: path.join(screenshotDir, 'letter_o_anime_hand.png') });
  console.log("Captura guardada: screenshots/letter_o_anime_hand.png");

  // 4. Verificar ausencia de errores de consola
  const globalConsoleErrors = await page.evaluate(() => window.__consoleErrors || []);
  console.log(`Errores capturados por page.on('console'): ${errors.length}`);
  console.log(`Errores capturados por window.__consoleErrors: ${globalConsoleErrors.length}`);

  if (errors.length > 0 || globalConsoleErrors.length > 0) {
    console.error("Errores:", errors, globalConsoleErrors);
    throw new Error("Se detectaron errores en consola durante la prueba");
  }

  await browser.close();
  console.log("\n=== PRUEBA DE LETRA O EN ANIME IA APROBADA AL 100% (0 ERRORES) ===");
}

testLetterOAnime().catch(err => {
  console.error("FALLÓ EL TEST DE LETRA O:", err);
  process.exit(1);
});
