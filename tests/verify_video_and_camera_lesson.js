const { chromium } = require('playwright');
const assert = require('assert');

(async () => {
  console.log('=== VERIFICANDO REPRODUCCIÓN MULTIMEDIA, CÁMARA Y TRAYECTORIA EN MODAL DE LECCIÓN ===');

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--no-sandbox'
    ]
  });

  const page = await browser.newPage({
    viewport: { width: 1280, height: 850 },
    permissions: ['camera']
  });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    await page.goto('http://localhost:8000/index.html?screen=path', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // 1. Abrir modal haciendo clic en nodo HOLA
    console.log('1. Abriendo modal de lección...');
    await page.click('#hexSkillTreeContainer .hex-node');
    await page.waitForSelector('#lessonSessionModal:not(.hidden)');
    console.log('✓ Modal visible');

    // 2. Verificar Fase Demo: video o webp fallback activo
    console.log('2. Verificando medio en Fase 1 (Demo)...');
    await page.waitForTimeout(600);
    const demoMediaStatus = await page.evaluate(() => {
      const vid = document.getElementById('lessonDemoVideo');
      const webp = document.getElementById('lessonDemoWebp');
      const isVidVisible = vid && !vid.classList.contains('hidden');
      const isWebpVisible = webp && !webp.classList.contains('hidden');
      return {
        vidSrc: vid ? vid.src : null,
        vidReady: vid ? vid.readyState : 0,
        isVidVisible,
        isWebpVisible,
        webpSrc: webp ? webp.src : null
      };
    });
    console.log('Estado medio Demo:', demoMediaStatus);
    assert(demoMediaStatus.isVidVisible || demoMediaStatus.isWebpVisible, 'Debe haber un medio visible (Video o WebP)');
    console.log('✓ Demostración multimedia lista');

    // 3. Continuar a Quiz
    console.log('3. Avanzando a Fase 2 (Quiz)...');
    await page.click('#btnLessonContinue');
    await page.waitForSelector('#phaseQuizContainer:not(.hidden)');
    await page.waitForTimeout(500);

    // Responder correctamente el Quiz
    const correctBtn = await page.$('.quiz-choice-btn[data-sign-id="HOLA"]');
    assert(correctBtn, 'Debe existir la opción HOLA');
    await correctBtn.click();
    await page.waitForTimeout(300);

    // 4. Continuar a Práctica
    console.log('4. Avanzando a Fase 3 (Práctica con Cámara)...');
    await page.click('#btnLessonContinue');
    await page.waitForSelector('#phasePracticeContainer:not(.hidden)');
    await page.waitForTimeout(1000);

    // 5. Verificar video guía, selector de cámara y trayectoria
    const practiceStatus = await page.evaluate(() => {
      const guideVid = document.getElementById('lessonPracticeGuideVideo');
      const guideWebp = document.getElementById('lessonPracticeGuideWebp');
      const camVid = document.getElementById('lessonPracticeWebcamVideo');
      const canvas = document.getElementById('lessonPracticeCanvas');
      const loading = document.getElementById('lessonCameraLoading');
      const camSelect = document.getElementById('lessonCameraSelect');
      const trajPill = document.getElementById('lessonTrajectoryPill');
      const trajText = document.getElementById('lessonTrajectoryText');
      const hint = document.getElementById('lessonPracticeHint');

      return {
        guideVisible: (guideVid && !guideVid.classList.contains('hidden')) || (guideWebp && !guideWebp.classList.contains('hidden')),
        hasCamStream: !!(camVid && camVid.srcObject),
        camReadyState: camVid ? camVid.readyState : 0,
        camWidth: camVid ? camVid.videoWidth : 0,
        camHeight: camVid ? camVid.videoHeight : 0,
        canvasPresent: !!canvas,
        loadingHidden: loading ? loading.classList.contains('hidden') : true,
        camSelectPresent: !!camSelect,
        camSelectOptionsCount: camSelect ? camSelect.options.length : 0,
        camSelectValue: camSelect ? camSelect.value : null,
        trajPillVisible: trajPill ? !trajPill.classList.contains('hidden') : false,
        trajTextContent: trajText ? trajText.textContent : '',
        hintText: hint ? hint.textContent : ''
      };
    });

    console.log('Estado de práctica con cámara:', practiceStatus);
    assert(practiceStatus.guideVisible, 'El video guía espejo debe estar visible');
    assert(practiceStatus.hasCamStream, 'El video de cámara en vivo debe tener un MediaStream asignado');
    assert(practiceStatus.canvasPresent, 'El canvas de práctica debe estar presente en el DOM');
    assert(practiceStatus.camSelectPresent, 'El selector de cámara debe estar presente en la práctica');
    assert(practiceStatus.camSelectOptionsCount >= 1, 'El selector de cámara debe tener opciones disponibles');
    console.log('✓ Video guía y stream de cámara funcionando correctamente');
    console.log('✓ Selector de cámara detectado con', practiceStatus.camSelectOptionsCount, 'dispositivo(s)');

    // 6. Probar cambio de dispositivo en el selector de cámara
    console.log('5. Probando cambio de cámara desde el desplegable...');
    await page.evaluate(() => {
      const select = document.getElementById('lessonCameraSelect');
      if (select && select.options.length > 0) {
        select.selectedIndex = 0;
        select.dispatchEvent(new Event('change'));
      }
    });
    await page.waitForTimeout(600);
    const postSwitchStream = await page.evaluate(() => {
      const camVid = document.getElementById('lessonPracticeWebcamVideo');
      return !!(camVid && camVid.srcObject);
    });
    assert(postSwitchStream, 'El stream debe mantenerse activo tras cambiar de cámara');
    console.log('✓ Selector de cámara responde y mantiene stream activo');

    // 7. Simular detección de mano en HOLA para verificar actualización de puntos de trayectoria
    console.log('6. Simulando avance de trayectoria (Connect-the-Dots)...');
    await page.evaluate(() => {
      // Simular frame con mano cerca de la sien (Punto 1 de HOLA: x=0.38, y=0.36)
      if (window.TrajectoryTracker) {
        window.TrajectoryTracker.update([{
          0: { x: 0.38, y: 0.36, z: 0 },
          8: { x: 0.38, y: 0.30, z: 0 }
        }], 640, 480);
      }
    });
    await page.waitForTimeout(200);

    const trajAfterUpdate = await page.evaluate(() => {
      const trajPill = document.getElementById('lessonTrajectoryPill');
      const trajText = document.getElementById('lessonTrajectoryText');
      return {
        isTrajActive: window.TrajectoryTracker ? window.TrajectoryTracker.isTrajectoryActive() : false,
        pillVisible: trajPill ? !trajPill.classList.contains('hidden') : false,
        statusText: window.TrajectoryTracker ? window.TrajectoryTracker.getStatusText() : null
      };
    });
    console.log('Estado de la trayectoria:', trajAfterUpdate);
    assert(trajAfterUpdate.isTrajActive, 'La trayectoria debe estar activa para HOLA');
    console.log('✓ Sistema de puntos para palabras con movimiento activo y verificado');

    console.log('Errores en consola:', consoleErrors);
    assert.strictEqual(consoleErrors.length, 0, 'No debe haber errores de consola');
    console.log('🎉 VERIFICACIÓN EXITOSA: Selector de cámara y puntos de movimiento funcionando al 100%.');

  } finally {
    await browser.close();
  }
})();
