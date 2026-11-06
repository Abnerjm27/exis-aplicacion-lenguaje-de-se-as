const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function runTests() {
  console.log("==================================================");
  console.log("  INICIANDO SUITE DE TESTS PLAYWRIGHT · EXIS LSC  ");
  console.log("==================================================\n");

  const screenshotDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  // Lanzar Chrome local existente
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--no-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 850 }
  });

  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.message);
  });

  let testsPassed = 0;
  let testsTotal = 0;

  function assert(condition, message) {
    testsTotal++;
    if (condition) {
      console.log(`  ✓ [PASS] ${message}`);
      testsPassed++;
    } else {
      console.error(`  ✗ [FAIL] ${message}`);
    }
  }

  try {
    // -------------------------------------------------------------
    // TEST 1: Carga de la aplicación y respuesta HTTP
    // -------------------------------------------------------------
    console.log("▶ TEST 1: Navegación y carga inicial de la aplicación");
    const response = await page.goto('http://localhost:8000/', { waitUntil: 'domcontentloaded' });
    assert(response && response.status() === 200, "El servidor responde con código HTTP 200");

    const title = await page.title();
    assert(title.includes("Manitas") && title.includes("Lengua de Señas Colombiana"), `Título correcto: '${title}'`);

    // Esperar a que los scripts difieran y carguen
    await page.waitForTimeout(1000);
    assert(consoleErrors.length === 0, `0 errores en la consola inicial (Errores: ${consoleErrors.length})`);

    await page.screenshot({ path: path.join(screenshotDir, '01_pagina_inicio.png') });

    // -------------------------------------------------------------
    // TEST 2: Catálogo de señas y cambio dinámico
    // -------------------------------------------------------------
    console.log("\n▶ TEST 2: Catálogo de señas y Ficha Técnica");
    const initialSign = await page.textContent('#targetSignBadge');
    assert(initialSign.trim() === 'HOLA', `Seña inicial cargada por defecto es HOLA (obtenido: '${initialSign.trim()}')`);

    // Probar selección de 'YO'
    const btnYo = await page.$('#btn-sign-YO');
    assert(btnYo !== null, "Botón de seña 'YO' existe en el selector");
    if (btnYo) {
      await btnYo.click();
      await page.waitForTimeout(400);
      const signAfterClick = await page.textContent('#targetSignBadge');
      assert(signAfterClick.trim() === 'YO', "Hacer clic en 'YO' actualiza el badge a 'YO'");
    }

    // Cambiar a categoría Alfabeto Dactilológico
    const btnCatLetters = await page.$('#catLettersBtn');
    assert(btnCatLetters !== null, "Botón de categoría 'Alfabeto Dactilológico' existe");
    if (btnCatLetters) {
      await btnCatLetters.click();
      await page.waitForTimeout(400);
      const letterSign = await page.textContent('#targetSignBadge');
      assert(letterSign.trim().includes('A') || letterSign.trim() === 'Letra A', `Categoría dactilológica carga la letra A (obtenido: '${letterSign.trim()}')`);
    }

    // Regresar a Palabras
    const btnCatWords = await page.$('#catWordsBtn');
    if (btnCatWords) {
      await btnCatWords.click();
      await page.waitForTimeout(400);
    }

    // -------------------------------------------------------------
    // TEST 2.5: Verificación de Videos Nuevos Anime IA (BUENOS, NOMBRE, A)
    // -------------------------------------------------------------
    console.log("\n▶ TEST 2.5: Reproducción de Videos Nuevos Anime IA");
    const btnModeAnime = await page.$('#btnModeAnime');
    assert(btnModeAnime !== null, "Botón 'Anime IA' existe en el reproductor");
    if (btnModeAnime) {
      await btnModeAnime.click();
      await page.waitForTimeout(500);

      // Verificar BUENOS en Anime IA
      await page.evaluate(() => window.selectSignById('BUENOS'));
      await page.waitForTimeout(600);
      const buenosVideoSrc = (await page.getAttribute('#signVideo', 'src')) || (await page.getAttribute('#signWebp', 'src')) || '';
      assert(buenosVideoSrc.includes('BUENOS'), `BUENOS carga video Anime IA correctamente: '${buenosVideoSrc}'`);

      // Probar vista Hand (zoom mano)
      const btnViewHand = await page.$('#btnViewHand');
      if (btnViewHand) {
        await btnViewHand.click();
        await page.waitForTimeout(500);
        const buenosHandSrc = (await page.getAttribute('#signVideo', 'src')) || (await page.getAttribute('#signWebp', 'src')) || '';
        assert(buenosHandSrc.includes('BUENOS_hand'), `BUENOS carga vista Hand en Anime IA: '${buenosHandSrc}'`);

        // Regresar a Body
        const btnViewBody = await page.$('#btnViewBody');
        if (btnViewBody) await btnViewBody.click();
      }

      // Verificar NOMBRE en Anime IA
      await page.evaluate(() => window.selectSignById('NOMBRE'));
      await page.waitForTimeout(600);
      const nombreVideoSrc = (await page.getAttribute('#signVideo', 'src')) || (await page.getAttribute('#signWebp', 'src')) || '';
      assert(nombreVideoSrc.includes('NOMBRE'), `NOMBRE carga video nuevo Anime IA: '${nombreVideoSrc}'`);

      // Verificar Letra A en Anime IA
      await page.evaluate(() => window.selectSignById('A'));
      await page.waitForTimeout(600);
      const aVideoSrc = (await page.getAttribute('#signVideo', 'src')) || (await page.getAttribute('#signWebp', 'src')) || '';
      assert(aVideoSrc.includes('A_body') || aVideoSrc.includes('A_hand'), `Letra A carga video nuevo Anime IA: '${aVideoSrc}'`);

      // Verificar Letra B en Anime IA
      await page.evaluate(() => window.selectSignById('B'));
      await page.waitForTimeout(600);
      const bVideoSrc = (await page.getAttribute('#signVideo', 'src')) || (await page.getAttribute('#signWebp', 'src')) || '';
      assert(bVideoSrc.includes('B_body') || bVideoSrc.includes('B_hand'), `Letra B carga video nuevo Anime IA: '${bVideoSrc}'`);

      // Verificar Letra C en Anime IA
      await page.evaluate(() => window.selectSignById('C'));
      await page.waitForTimeout(600);
      const cVideoSrc = (await page.getAttribute('#signVideo', 'src')) || (await page.getAttribute('#signWebp', 'src')) || '';
      assert(cVideoSrc.includes('C_body') || cVideoSrc.includes('C_hand'), `Letra C carga video nuevo Anime IA: '${cVideoSrc}'`);

      // Verificar Letra L en Anime IA
      await page.evaluate(() => window.selectSignById('L'));
      await page.waitForTimeout(600);
      const lVideoSrc = (await page.getAttribute('#signVideo', 'src')) || (await page.getAttribute('#signWebp', 'src')) || '';
      assert(lVideoSrc.includes('L_body') || lVideoSrc.includes('L_hand'), `Letra L carga video nuevo Anime IA: '${lVideoSrc}'`);

      // Verificar Letra V en Anime IA
      await page.evaluate(() => window.selectSignById('V'));
      await page.waitForTimeout(600);
      const vVideoSrc = (await page.getAttribute('#signVideo', 'src')) || (await page.getAttribute('#signWebp', 'src')) || '';
      assert(vVideoSrc.includes('V_body') || vVideoSrc.includes('V_hand'), `Letra V carga video nuevo Anime IA: '${vVideoSrc}'`);

      // Verificar DÍAS en Anime IA
      await page.evaluate(() => window.selectSignById('DIAS'));
      await page.waitForTimeout(600);
      const diasVideoSrc = (await page.getAttribute('#signVideo', 'src')) || (await page.getAttribute('#signWebp', 'src')) || '';
      assert(diasVideoSrc.includes('DIAS_body') || diasVideoSrc.includes('DIAS_hand'), `DÍAS carga video nuevo Anime IA: '${diasVideoSrc}'`);

      await page.screenshot({ path: path.join(screenshotDir, '04_anime_ia_buenos.png') });

      // Regresar a Real LSC
      const btnModeReal = await page.$('#btnModeReal');
      if (btnModeReal) {
        await btnModeReal.click();
        await page.waitForTimeout(400);
      }
    }

    // -------------------------------------------------------------
    // TEST 3: Verificación del Motor de Trayectorias (Connect-the-Dots)
    // -------------------------------------------------------------
    console.log("\n▶ TEST 3: Verificación del Motor de Puntos y Trayectorias (TrajectoryTracker)");
    
    // Verificar que TrajectoryTracker esté montado en window
    const hasTracker = await page.evaluate(() => typeof window.TrajectoryTracker !== 'undefined');
    assert(hasTracker, "window.TrajectoryTracker está definido y accesible globalmente");

    // Verificar botón de alternar puntos en la UI
    const btnToggle = await page.$('#btnToggleTrajectory');
    assert(btnToggle !== null, "El botón #btnToggleTrajectory está presente en la cabecera de cámara");

    const initialEnabled = await page.evaluate(() => window.TrajectoryTracker.getIsEnabled());
    assert(initialEnabled === true, "La guía de trayectoria inicia activada por defecto (ON)");

    // Probar click en botón toggle
    if (btnToggle) {
      await btnToggle.click();
      const stateAfterClick = await page.evaluate(() => window.TrajectoryTracker.getIsEnabled());
      assert(stateAfterClick === false, "Al hacer clic en el botón, la guía se desactiva (OFF)");
      
      const btnText = await page.textContent('#trajectoryBtnText');
      assert(btnText.includes('OFF'), `El texto del botón cambia a 'Puntos: OFF' (obtenido: '${btnText}')`);

      // Reactivar
      await btnToggle.click();
      const stateReactivated = await page.evaluate(() => window.TrajectoryTracker.getIsEnabled());
      assert(stateReactivated === true, "Al hacer clic de nuevo, la guía se reactiva (ON)");
    }

    // -------------------------------------------------------------
    // TEST 4: Cinemática de Señas Dinámicas vs Estáticas
    // -------------------------------------------------------------
    console.log("\n▶ TEST 4: Detección Dinámica (HOLA/YO) vs Estática (Letras)");

    // Seleccionar HOLA
    await page.evaluate(() => window.selectSignById('HOLA'));
    const holaTrajectory = await page.evaluate(() => {
      const active = window.TrajectoryTracker.isTrajectoryActive();
      const status = window.TrajectoryTracker.getStatusText();
      const completed = window.TrajectoryTracker.isCompleted();
      return { active, status, completed };
    });

    assert(holaTrajectory.active === true, "La seña 'HOLA' tiene trayectoria dinámica activa");
    assert(holaTrajectory.status.total === 3, `HOLA contiene 3 waypoints de movimiento lateral (total: ${holaTrajectory.status.total})`);
    assert(holaTrajectory.completed === false, "HOLA inicia con la trayectoria incompleta (0/3)");

    // Seleccionar Letra 'B' (Dactilológica estática)
    await page.evaluate(() => window.selectSignById('B'));
    const letterBTrajectory = await page.evaluate(() => {
      const active = window.TrajectoryTracker.isTrajectoryActive();
      const completed = window.TrajectoryTracker.isCompleted();
      return { active, completed };
    });

    assert(letterBTrajectory.active === false, "La letra dactilológica 'B' tiene trayectoria desactivada (Modo Estático)");
    assert(letterBTrajectory.completed === true, "La letra 'B' se considera con recorrido completado inmediatamente");

    // -------------------------------------------------------------
    // TEST 5: Simulación de Conexión de Puntos en Vivo
    // -------------------------------------------------------------
    console.log("\n▶ TEST 5: Simulación cinemática conectando waypoints de 'YO'");
    await page.evaluate(() => window.selectSignById('YO'));

    // Punto 1 de YO: x: 0.38, y: 0.45 (Landmark 8: índice)
    const hitPoint1 = await page.evaluate(() => {
      // Landmark 8 en la posición del punto 1
      const fakeLandmarks = [Array.from({ length: 21 }, (_, i) => ({
        x: i === 8 ? 0.38 : 0.5,
        y: i === 8 ? 0.45 : 0.5,
        z: 0
      }))];
      
      const res = window.TrajectoryTracker.update(fakeLandmarks, 640, 480);
      const status = window.TrajectoryTracker.getStatusText();
      return { res, status };
    });

    assert(hitPoint1.res.pointHit === true, "Al posicionar el dedo índice en Punto 1, este es detectado como conectado");
    assert(hitPoint1.status.step === 2, `Avanza automáticamente al Punto 2 (estado: paso ${hitPoint1.status.step}/${hitPoint1.status.total})`);

    // Punto 2 de YO: x: 0.50, y: 0.65
    const hitPoint2 = await page.evaluate(() => {
      const fakeLandmarks = [Array.from({ length: 21 }, (_, i) => ({
        x: i === 8 ? 0.50 : 0.5,
        y: i === 8 ? 0.65 : 0.5,
        z: 0
      }))];
      
      const res = window.TrajectoryTracker.update(fakeLandmarks, 640, 480);
      const isFinished = window.TrajectoryTracker.isCompleted();
      return { res, isFinished };
    });

    assert(hitPoint2.isFinished === true, "Al conectar el Punto 2 (Pecho), la trayectoria queda 100% completada");

    // -------------------------------------------------------------
    // TEST 5.5: Verificación de Pantalla de Victoria y Transición Inmediata
    // -------------------------------------------------------------
    console.log("\n▶ TEST 5.5: Verificación de Pantalla de Victoria y Transición Inmediata");

    // Simular que el usuario completa una seña (pantalla de victoria)
    await page.evaluate(() => {
      window.onSignMastered({ id: 'HOLA', name: 'HOLA' }, 96);
    });
    await page.waitForTimeout(300);

    const isPopupVisible = await page.evaluate(() => {
      const p = document.getElementById('successPopup');
      return p && !p.classList.contains('hidden');
    });
    assert(isPopupVisible, "El modal de victoria (#successPopup) se despliega correctamente al lograr la seña");

    const isEvaluatorPausedDuringVictory = await page.evaluate(() => window.VisionEvaluator.isPaused());
    assert(isEvaluatorPausedDuringVictory === true, "La evaluación se pausa mientras el modal de victoria está activo");

    // CASO 1: El usuario hace clic en otra letra/seña estando en la pantalla de victoria
    await page.evaluate(() => window.selectSignById('B'));
    await page.waitForTimeout(300);

    const isPopupClosedAfterSignSelect = await page.evaluate(() => {
      const p = document.getElementById('successPopup');
      return p && p.classList.contains('hidden');
    });
    assert(isPopupClosedAfterSignSelect, "Al seleccionar otra seña ('B'), el modal de victoria se cierra inmediatamente");

    const isEvaluatorActiveAfterSignSelect = await page.evaluate(() => !window.VisionEvaluator.isPaused());
    assert(isEvaluatorActiveAfterSignSelect, "El evaluador de visión se reactiva e inicializa inmediatamente para la nueva seña");

    const isScoreReset = await page.evaluate(() => document.getElementById('scoreText').textContent.trim());
    assert(isScoreReset === '0%', `La barra de progreso se reinicia a 0% para la nueva seña (obtenido: '${isScoreReset}')`);

    // CASO 2: Disparar victoria de nuevo y pulsar 'Siguiente seña' (#btnNextSign)
    await page.evaluate(() => {
      window.onSignMastered({ id: 'B', name: 'Letra B' }, 95);
    });
    await page.waitForTimeout(300);

    const btnNext = await page.$('#btnNextSign');
    assert(btnNext !== null, "El botón 'Siguiente seña' está presente en el modal de victoria");
    if (btnNext) await btnNext.click();
    await page.waitForTimeout(300);

    const isPopupClosedAfterNext = await page.evaluate(() => {
      const p = document.getElementById('successPopup');
      return p && p.classList.contains('hidden');
    });
    assert(isPopupClosedAfterNext, "Al pulsar 'Siguiente seña', el modal se cierra de inmediato");

    const isEvaluatorActiveAfterNext = await page.evaluate(() => !window.VisionEvaluator.isPaused());
    assert(isEvaluatorActiveAfterNext, "Al saltar a la siguiente seña, el evaluador queda inicializado y activo (isPaused === false)");

    await page.screenshot({ path: path.join(screenshotDir, '02_trayectoria_completada.png') });

    // -------------------------------------------------------------
    // TEST 6: Responsividad y Verificación de Desbordamiento (Overflow)
    // -------------------------------------------------------------
    console.log("\n▶ TEST 6: Auditoría de desbordamiento horizontal en Viewports");

    // Vista Escritorio (1280x850)
    const desktopOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    assert(!desktopOverflow, "Escritorio (1280x850): Cero desbordamiento horizontal (scrollWidth == clientWidth)");

    // Vista Móvil (390x844 - iPhone)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);
    const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    assert(!mobileOverflow, "Móvil (390x844): Cero desbordamiento horizontal (scrollWidth == clientWidth)");

    await page.screenshot({ path: path.join(screenshotDir, '03_vista_movil_390px.png') });

    // -------------------------------------------------------------
    // TEST 7: Verificación final de Errores de Consola
    // -------------------------------------------------------------
    console.log("\n▶ TEST 7: Verificación final de Consola de JavaScript");
    assert(consoleErrors.length === 0, `Total de errores de consola durante la ejecución: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.error("  Detalle de errores:", consoleErrors);
    }

  } catch (error) {
    console.error("Error inesperado en los tests:", error);
  } finally {
    await browser.close();
  }

  console.log("\n==================================================");
  console.log(`  RESUMEN: ${testsPassed} / ${testsTotal} PRUEBAS EXITOSAS (${Math.round((testsPassed/testsTotal)*100)}%)  `);
  console.log("==================================================");

  if (testsPassed === testsTotal) {
    console.log("🎉 ¡TODOS LOS TESTS DE PLAYWRIGHT PASARON SATISFACTORIAMENTE!\n");
    process.exit(0);
  } else {
    console.error("❌ ALGUNOS TESTS FALLARON.\n");
    process.exit(1);
  }
}

runTests();
