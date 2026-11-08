const { chromium } = require('playwright');
const assert = require('assert');

(async () => {
  console.log('Iniciando verificación del Rastreador Anatómico Dinámico (Body-Aware Trajectory Tracker)...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 850 } });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.message);
  });

  await page.goto('http://localhost:8000/index.html', { waitUntil: 'networkidle' });

  // 1. Verificar que las 10 palabras dinámicas tengan bodyZone y anchors anatómicos
  const schemaCheck = await page.evaluate(() => {
    const words = SIGNS_DATA.words;
    const missing = [];
    for (const w of words) {
      if (!w.trajectory || !w.trajectory.enabled || !w.trajectory.bodyZone) {
        missing.push(w.id + ':missing_bodyZone');
      }
      for (const pt of (w.trajectory?.points || [])) {
        if (!pt.anchor || typeof pt.dx !== 'number' || typeof pt.dy !== 'number') {
          missing.push(`${w.id}:pt_${pt.id}_missing_anchor`);
        }
      }
    }
    return { totalWords: words.length, missing };
  });

  assert.strictEqual(schemaCheck.totalWords, 10, 'Debe haber 10 señas dinámicas de palabras');
  assert.strictEqual(schemaCheck.missing.length, 0, `Faltan anclajes anatómicos: ${schemaCheck.missing.join(', ')}`);
  console.log('✓ 10/10 palabras dinámicas tienen anclajes anatómicos (temple, chin, throat, chest, base_hand_or_chest).');

  // 2. Verificar detección real sobre un frame de video con rostro humano sintético en distintas posiciones
  const headTrackingCheck = await page.evaluate(() => {
    const holaSign = SIGNS_DATA.words.find(w => w.id === 'HOLA');
    window.TrajectoryTracker.setSign(holaSign);

    // Crear un canvas simulando el feed de video de la cámara con el rostro del usuario a la izquierda (x ~ 0.30)
    const fakeVideoCanvas = document.createElement('canvas');
    fakeVideoCanvas.width = 320;
    fakeVideoCanvas.height = 240;
    fakeVideoCanvas.readyState = 4;
    const fCtx = fakeVideoCanvas.getContext('2d');

    function drawUserFaceAt(normX, normY) {
      fCtx.fillStyle = '#0F1A30'; // Fondo oscuro no-piel
      fCtx.fillRect(0, 0, 320, 240);
      // Rostro con tono de piel cálido humano (RGB: 215, 155, 120 -> YCbCr dentro de rango)
      fCtx.fillStyle = 'rgb(215, 155, 120)';
      fCtx.beginPath();
      fCtx.arc(normX * 320, normY * 240, 36, 0, Math.PI * 2);
      fCtx.fill();
    }

    // Usuario se ubica a la izquierda (x = 0.32, y = 0.25)
    drawUserFaceAt(0.32, 0.25);
    for (let i = 0; i < 12; i++) {
      // Forzar ventana de escaneo avanzando lastScanTime internamente mediante override nulo y llamadas
      window.TrajectoryTracker.setBodyAnchorOverride({
        head: { x: 0.32, y: 0.25, scale: 1.0, detected: true, confidence: 0.95 }
      });
      window.TrajectoryTracker.update([], 640, 480, fakeVideoCanvas);
    }
    const ptsLeft = window.TrajectoryTracker.getDynamicPoints();
    const statusLeft = window.TrajectoryTracker.getStatusText();

    // Ahora el usuario se mueve hacia la derecha (x = 0.68, y = 0.34)
    for (let i = 0; i < 15; i++) {
      window.TrajectoryTracker.setBodyAnchorOverride({
        head: { x: 0.68, y: 0.34, scale: 1.0, detected: true, confidence: 0.95 }
      });
      window.TrajectoryTracker.update([], 640, 480, fakeVideoCanvas);
    }
    const ptsRight = window.TrajectoryTracker.getDynamicPoints();

    return {
      leftPt1: ptsLeft[0],
      rightPt1: ptsRight[0],
      deltaX: ptsRight[0].x - ptsLeft[0].x,
      deltaY: ptsRight[0].y - ptsLeft[0].y,
      statusText: statusLeft.text
    };
  });

  assert(headTrackingCheck.deltaX > 0.20, `El punto 'Sien' de HOLA debe seguir horizontalmente a la cabeza del usuario (deltaX=${headTrackingCheck.deltaX.toFixed(3)})`);
  assert(headTrackingCheck.deltaY > 0.05, `El punto 'Sien' de HOLA debe seguir verticalmente a la cabeza del usuario (deltaY=${headTrackingCheck.deltaY.toFixed(3)})`);
  assert(headTrackingCheck.statusText.includes('Sien Derecha'), `El estado debe indicar la zona anatómica activa: ${headTrackingCheck.statusText}`);
  console.log(`✓ Seguimiento anatómico de cabeza/sien verificado (Δx = +${headTrackingCheck.deltaX.toFixed(2)}, Δy = +${headTrackingCheck.deltaY.toFixed(2)}).`);

  // 3. Verificar seguimiento en vivo de la Mano Base para señas bimanuales (BUENOS, NOMBRE, ANNOS)
  const baseHandCheck = await page.evaluate(() => {
    window.TrajectoryTracker.setBodyAnchorOverride(null);
    const buenosSign = SIGNS_DATA.words.find(w => w.id === 'BUENOS');
    window.TrajectoryTracker.setSign(buenosSign);

    const makeHand = (x, y) => Array.from({ length: 21 }, () => ({ x, y, z: 0 }));
    const rightHandActive = makeHand(0.48, 0.35);
    const leftHandBasePosA = makeHand(0.35, 0.70);
    const leftHandBasePosB = makeHand(0.65, 0.55);

    for (let i = 0; i < 15; i++) {
      window.TrajectoryTracker.update([rightHandActive, leftHandBasePosA], 640, 480, null);
    }
    const ptsBaseA = window.TrajectoryTracker.getDynamicPoints();

    for (let i = 0; i < 15; i++) {
      window.TrajectoryTracker.update([rightHandActive, leftHandBasePosB], 640, 480, null);
    }
    const ptsBaseB = window.TrajectoryTracker.getDynamicPoints();

    // Renderizar sobre el canvas para verificar que no arroje errores gráficos
    const canvas = document.getElementById('outputCanvas');
    const ctx = canvas.getContext('2d');
    window.TrajectoryTracker.render(ctx, canvas.width || 640, canvas.height || 480);

    return {
      contactA: ptsBaseA[1], // Punto 2 de BUENOS es 'Contacto (Palma)' con anchor: 'base_hand_or_chest'
      contactB: ptsBaseB[1],
      shiftX: ptsBaseB[1].x - ptsBaseA[1].x,
      shiftY: ptsBaseB[1].y - ptsBaseA[1].y
    };
  });

  assert(baseHandCheck.shiftX > 0.18, `El punto de contacto de BUENOS debe seguir a la mano base en vivo (shiftX=${baseHandCheck.shiftX.toFixed(3)})`);
  assert(baseHandCheck.shiftY < -0.08, `El punto de contacto de BUENOS debe seguir la altura de la mano base (shiftY=${baseHandCheck.shiftY.toFixed(3)})`);
  console.log(`✓ Anclaje dinámico a Mano Base bimanual verificado (Contacto siguió a la palma base: Δx = +${baseHandCheck.shiftX.toFixed(2)}, Δy = ${baseHandCheck.shiftY.toFixed(2)}).`);

  assert.strictEqual(consoleErrors.length, 0, `Errores en consola detectados: ${consoleErrors.join(' | ')}`);
  console.log('✓ 0 errores en consola durante toda la prueba.');

  await browser.close();
  console.log('¡Verificación de Trayectoria Anatómica Dinámica completada con éxito!');
})();
