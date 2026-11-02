const { chromium } = require('playwright');

async function testAnimeTardesGustar() {
  console.log("=== VERIFICACIÓN PLAYWRIGHT: CLIPS ANIME IA TARDES Y GUSTAR ===");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 850 } });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.goto('http://localhost:8000/', { waitUntil: 'networkidle' });

  // 1. Activar Modo Anime IA
  console.log("--- 1. Activando Modo Anime IA ---");
  await page.click('#btnModeAnime');
  await page.waitForTimeout(400);

  // 2. Probar TARDES en Anime IA
  console.log("--- 2. Seleccionando seña TARDES ---");
  await page.click('#btn-sign-TARDES');
  await page.waitForTimeout(600);

  const tardesState = await page.evaluate(() => {
    const v = document.getElementById('signVideo');
    const badge = document.getElementById('videoBadgeText');
    return {
      src: v.src,
      mode: window.VideoPlayer.getMode(),
      view: window.VideoPlayer.getView(),
      sign: window.VideoPlayer.getSign(),
      badgeText: badge ? badge.textContent : ''
    };
  });
  console.log("Estado de TARDES en Anime IA:", tardesState);
  if (!tardesState.src.includes('videos/anime/TARDES_body.mp4')) {
    throw new Error(`TARDES no cargó el video anime esperado: ${tardesState.src}`);
  }

  // 3. Probar vista de mano en TARDES
  console.log("--- 3. Cambiando a vista Mano en TARDES ---");
  await page.click('#btnViewHand');
  await page.waitForTimeout(500);
  const tardesHandSrc = await page.evaluate(() => document.getElementById('signVideo').src);
  console.log("Src TARDES Mano:", tardesHandSrc);
  if (!tardesHandSrc.includes('videos/anime/TARDES_hand.mp4')) {
    throw new Error(`TARDES Mano no cargó el video anime esperado: ${tardesHandSrc}`);
  }

  // 4. Volver a vista Cuerpo y probar GUSTAR en Anime IA
  console.log("--- 4. Cambiando a vista Cuerpo y seleccionando GUSTAR ---");
  await page.click('#btnViewBody');
  await page.waitForTimeout(300);
  await page.click('#btn-sign-GUSTAR');
  await page.waitForTimeout(600);

  const gustarState = await page.evaluate(() => {
    const v = document.getElementById('signVideo');
    return {
      src: v.src,
      sign: window.VideoPlayer.getSign(),
      mode: window.VideoPlayer.getMode()
    };
  });
  console.log("Estado de GUSTAR en Anime IA:", gustarState);
  if (!gustarState.src.includes('videos/anime/GUSTAR_body.mp4')) {
    throw new Error(`GUSTAR no cargó el video anime esperado: ${gustarState.src}`);
  }

  // 5. Probar vista Mano en GUSTAR
  console.log("--- 5. Cambiando a vista Mano en GUSTAR ---");
  await page.click('#btnViewHand');
  await page.waitForTimeout(500);
  const gustarHandSrc = await page.evaluate(() => document.getElementById('signVideo').src);
  console.log("Src GUSTAR Mano:", gustarHandSrc);
  if (!gustarHandSrc.includes('videos/anime/GUSTAR_hand.mp4')) {
    throw new Error(`GUSTAR Mano no cargó el video anime esperado: ${gustarHandSrc}`);
  }

  console.log(`Errores de consola: ${errors.length}`);
  if (errors.length > 0) {
    console.error("Errores:", errors);
    throw new Error("Se detectaron errores en consola durante la prueba");
  }

  await browser.close();
  console.log("\n=== PRUEBA DE TARDES Y GUSTAR EN ANIME IA APROBADA AL 100% ===");
}

testAnimeTardesGustar().catch(err => {
  console.error("FALLÓ EL TEST:", err);
  process.exit(1);
});
