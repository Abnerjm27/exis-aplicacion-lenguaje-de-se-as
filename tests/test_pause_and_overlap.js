const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--no-sandbox', '--autoplay-policy=no-user-gesture-required']
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    errors.push(err.message);
  });

  console.log('--- 1. Cargando http://localhost:8000/ ---');
  await page.goto('http://localhost:8000/', { waitUntil: 'networkidle' });

  // 2. Verificar que no haya errores iniciales
  console.log('--- 2. Verificando consola limpia ---');
  const filteredErrors = errors.filter(e => !e.includes('favicon') && !e.includes('camera'));
  if (filteredErrors.length > 0) {
    console.error('Errores en consola:', filteredErrors);
    process.exit(1);
  }
  console.log('Consola 100% limpia (0 errores).');

  // 3. Verificar superposición entre activeCameraPill y trajectoryStatusPill
  console.log('--- 3. Verificando separación espacial de indicadores ---');
  const overlapCheck = await page.evaluate(() => {
    const pillCam = document.getElementById('activeCameraPill');
    const pillTraj = document.getElementById('trajectoryStatusPill');

    // Desocultar temporalmente para medir rectángulos renderizados
    pillCam.classList.remove('hidden');
    pillTraj.classList.remove('hidden');

    const rectCam = pillCam.getBoundingClientRect();
    const rectTraj = pillTraj.getBoundingClientRect();

    const overlaps = !(
      rectCam.right <= rectTraj.left ||
      rectCam.left >= rectTraj.right ||
      rectCam.bottom <= rectTraj.top ||
      rectCam.top >= rectTraj.bottom
    );

    return {
      camRect: { top: rectCam.top, bottom: rectCam.bottom, right: rectCam.right },
      trajRect: { top: rectTraj.top, bottom: rectTraj.bottom, right: rectTraj.right },
      overlaps
    };
  });

  console.log('Rect Cámara:', overlapCheck.camRect);
  console.log('Rect Trayectoria:', overlapCheck.trajRect);
  if (overlapCheck.overlaps) {
    console.error('ERROR: ¡Los indicadores se siguen superponiendo!');
    process.exit(1);
  }
  console.log('Prueba de superposición: PASÓ (0 solapamiento entre indicadores).');

  // 4. Probar pausa y reproducción en la interfaz interactiva
  console.log('--- 4. Verificando pausa y reproducción activa ---');
  await page.waitForTimeout(500);

  const initialPlayerState = await page.evaluate(() => {
    const v = document.getElementById('signVideo');
    const img = document.getElementById('signAnimatedWebp');
    const canvas = document.getElementById('webpFreezeCanvas');
    const isWebp = !img.classList.contains('hidden');
    return {
      isWebp,
      vPaused: v.paused,
      imgHidden: img.classList.contains('hidden'),
      canvasHidden: canvas.classList.contains('hidden'),
      aria: document.getElementById('btnPlayPause').getAttribute('aria-label')
    };
  });
  console.log('Estado inicial del reproductor:', initialPlayerState);

  // Clic en botón de pausa
  await page.click('#btnPlayPause');
  await page.waitForTimeout(300);

  const pausedPlayerState = await page.evaluate(() => {
    const v = document.getElementById('signVideo');
    const img = document.getElementById('signAnimatedWebp');
    const canvas = document.getElementById('webpFreezeCanvas');
    const isWebp = !v.classList.contains('hidden') ? false : true;
    return {
      isWebp,
      vPaused: v.paused,
      imgHidden: img.classList.contains('hidden'),
      canvasHidden: canvas.classList.contains('hidden'),
      aria: document.getElementById('btnPlayPause').getAttribute('aria-label')
    };
  });
  console.log('Estado tras pausar:', pausedPlayerState);

  if (pausedPlayerState.aria !== 'Reproducir video') {
    console.error('ERROR: El botón de pausa no cambió su aria-label a Reproducir video');
    process.exit(1);
  }

  if (pausedPlayerState.isWebp) {
    if (!pausedPlayerState.imgHidden || pausedPlayerState.canvasHidden) {
      console.error('ERROR: En WebP, la imagen animada no se ocultó o el canvas congelado no se mostró al pausar');
      process.exit(1);
    }
    console.log('Prueba de pausa en WebP: PASÓ (imagen animada oculta, canvas congelado visible).');
  } else {
    if (!pausedPlayerState.vPaused) {
      console.error('ERROR: En Video HTML5, el video no se pausó');
      process.exit(1);
    }
    console.log('Prueba de pausa en Video: PASÓ (video pausado).');
  }

  // Clic en botón para reanudar
  await page.click('#btnPlayPause');
  await page.waitForTimeout(300);

  const resumedPlayerState = await page.evaluate(() => {
    const v = document.getElementById('signVideo');
    const img = document.getElementById('signAnimatedWebp');
    const canvas = document.getElementById('webpFreezeCanvas');
    const isWebp = !v.classList.contains('hidden') ? false : true;
    return {
      isWebp,
      vPaused: v.paused,
      imgHidden: img.classList.contains('hidden'),
      canvasHidden: canvas.classList.contains('hidden'),
      aria: document.getElementById('btnPlayPause').getAttribute('aria-label')
    };
  });
  console.log('Estado tras reanudar:', resumedPlayerState);

  if (resumedPlayerState.aria !== 'Pausar video') {
    console.error('ERROR: El botón no volvió a Pausar video');
    process.exit(1);
  }

  if (resumedPlayerState.isWebp) {
    if (resumedPlayerState.imgHidden || !resumedPlayerState.canvasHidden) {
      console.error('ERROR: En WebP, la imagen animada no reanudó o el canvas no se ocultó');
      process.exit(1);
    }
    console.log('Prueba de reanudación en WebP: PASÓ (imagen restaurada, canvas oculto).');
  } else {
    if (resumedPlayerState.vPaused) {
      console.error('ERROR: En Video HTML5, el video no reanudó');
      process.exit(1);
    }
    console.log('Prueba de reanudación en Video: PASÓ (video en reproducción).');
  }

  // 5. Probar cambio de seña y verificar que la pausa siga funcionando
  console.log('--- 5. Verificando cambio de seña y funcionalidad de pausa continua ---');
  await page.click('#btn-sign-YO');
  await page.waitForTimeout(600);

  // Pausar en la nueva seña
  await page.click('#btnPlayPause');
  await page.waitForTimeout(300);

  const pausedYO = await page.evaluate(() => {
    const v = document.getElementById('signVideo');
    const img = document.getElementById('signAnimatedWebp');
    const canvas = document.getElementById('webpFreezeCanvas');
    const isWebp = !v.classList.contains('hidden') ? false : true;
    return {
      sign: window.VideoPlayer.getSign(),
      isWebp,
      paused: isWebp ? (!img.classList.contains('hidden') === false && !canvas.classList.contains('hidden')) : v.paused,
      aria: document.getElementById('btnPlayPause').getAttribute('aria-label')
    };
  });
  console.log('Estado pausado en YO:', pausedYO);

  if (!pausedYO.paused || pausedYO.aria !== 'Reproducir video') {
    console.error('ERROR: Al cambiar a seña YO no pausó correctamente');
    process.exit(1);
  }
  console.log('Prueba de pausa en nueva seña (YO): PASÓ.');

  // Reanudar en la nueva seña
  await page.click('#btnPlayPause');
  await page.waitForTimeout(300);

  const resumedYO = await page.evaluate(() => {
    const v = document.getElementById('signVideo');
    const img = document.getElementById('signAnimatedWebp');
    const canvas = document.getElementById('webpFreezeCanvas');
    const isWebp = !v.classList.contains('hidden') ? false : true;
    return {
      sign: window.VideoPlayer.getSign(),
      isWebp,
      playing: isWebp ? (!img.classList.contains('hidden') && canvas.classList.contains('hidden')) : !v.paused,
      aria: document.getElementById('btnPlayPause').getAttribute('aria-label')
    };
  });
  console.log('Estado reanudado en YO:', resumedYO);

  if (!resumedYO.playing || resumedYO.aria !== 'Pausar video') {
    console.error('ERROR: Al reanudar en seña YO no funcionó');
    process.exit(1);
  }
  console.log('Prueba de reanudación en nueva seña (YO): PASÓ.');

  console.log('\n=== TODAS LAS PRUEBAS PASARON EXITOSAMENTE ===');
  await browser.close();
  process.exit(0);
})();
