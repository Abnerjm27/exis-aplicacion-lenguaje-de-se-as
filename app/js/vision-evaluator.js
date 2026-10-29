/**
 * LSC Learn · Proyecto EXIS
 * vision-evaluator.js - Sistema de Visión Artificial por MediaPipe Hands
 * Evaluación en tiempo real y control estricto de pausa de feedback
 */

const VisionEvaluator = (() => {
  let isWebcamRunning = false;
  let cameraInstance = null;
  let handsInstance = null;

  let currentTargetSign = null;
  let consecutiveSuccessFrames = 0;
  const SUCCESS_THRESHOLD_FRAMES = 18;

  // Strict pause flag: blocks all background scoring when modal is open
  let isEvaluationPaused = false;

  let videoElement = null;
  let canvasElement = null;
  let canvasCtx = null;

  function init(videoEl, canvasEl) {
    videoElement = videoEl;
    canvasElement = canvasEl;
    canvasCtx = canvasElement.getContext('2d');
  }

  function setTargetSign(sign) {
    currentTargetSign = sign;
    consecutiveSuccessFrames = 0;
  }

  function setPaused(paused) {
    isEvaluationPaused = paused;
    if (paused) {
      consecutiveSuccessFrames = 0;
    }
  }

  function isRunning() {
    return isWebcamRunning;
  }

  async function start() {
    if (!videoElement || !canvasElement) return false;

    try {
      updateCameraUIState('connecting');

      handsInstance = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });

      handsInstance.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.55
      });

      handsInstance.onResults(handleHandResults);

      cameraInstance = new Camera(videoElement, {
        onFrame: async () => {
          if (isWebcamRunning) {
            await handsInstance.send({ image: videoElement });
          }
        },
        width: 640,
        height: 480
      });

      await cameraInstance.start();
      isWebcamRunning = true;
      updateCameraUIState('running');
      return true;
    } catch (err) {
      console.error("Error al iniciar cámara MediaPipe:", err);
      updateCameraUIState('stopped');
      alert("No se pudo acceder a la cámara web. Asegúrate de conceder los permisos en tu navegador.");
      return false;
    }
  }

  function stop() {
    if (cameraInstance) {
      cameraInstance.stop();
    }
    isWebcamRunning = false;
    updateCameraUIState('stopped');
    if (canvasCtx && canvasElement) {
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    }
    resetDiagnostics();
  }

  function toggle() {
    if (isWebcamRunning) {
      stop();
    } else {
      start();
    }
  }

  function handleHandResults(results) {
    if (!canvasElement || !videoElement) return;

    canvasElement.width = videoElement.videoWidth || 640;
    canvasElement.height = videoElement.videoHeight || 480;

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      // Draw MediaPipe Skeleton for all detected hands
      for (let i = 0; i < results.multiHandLandmarks.length; i++) {
        const lm = results.multiHandLandmarks[i];
        drawConnectors(canvasCtx, lm, HAND_CONNECTIONS, { color: i === 0 ? '#06b6d4' : '#14b8a6', lineWidth: 3 });
        drawLandmarks(canvasCtx, lm, { color: i === 0 ? '#6366f1' : '#a855f7', lineWidth: 2, radius: 4 });
      }

      // Only evaluate if evaluation is NOT paused by victory modal
      if (!isEvaluationPaused) {
        evaluatePose(results.multiHandLandmarks);
      }
    } else {
      if (!isEvaluationPaused) {
        consecutiveSuccessFrames = Math.max(0, consecutiveSuccessFrames - 2);
        updateScoreUI(0, "Coloca tu mano frente a la cámara web");
        resetFingerBadges();
      }
    }
    canvasCtx.restore();
  }

  function evaluatePose(multiLm) {
    if (isEvaluationPaused || !currentTargetSign || !multiLm || multiLm.length === 0) return;

    const lm = multiLm[0];
    const lm2 = multiLm.length > 1 ? multiLm[1] : null;

    const wrist = lm[0];
    const dist = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y);

    // Anatomical finger curl calculations for primary hand
    const isIndexCurled = dist(lm[8], wrist) < dist(lm[6], wrist) * 1.05;
    const isMiddleCurled = dist(lm[12], wrist) < dist(lm[10], wrist) * 1.05;
    const isRingCurled = dist(lm[16], wrist) < dist(lm[14], wrist) * 1.05;
    const isPinkyCurled = dist(lm[20], wrist) < dist(lm[18], wrist) * 1.05;

    const isIndexExt = !isIndexCurled;
    const isMiddleExt = !isMiddleCurled;
    const isRingExt = !isRingCurled;
    const isPinkyExt = !isPinkyCurled;

    const thumbDistToMcp = dist(lm[4], lm[5]);
    const isThumbExt = thumbDistToMcp > 0.11 || (dist(lm[4], wrist) > dist(lm[2], wrist) * 1.08);

    updateFingerBadges(isThumbExt, isIndexExt, isMiddleExt, isRingExt, isPinkyExt);

    const signId = currentTargetSign.id;
    let score = 0;
    let hint = "";
    let diag = "";

    // 1. EVALUACIÓN PARA LA SEÑA "YO" (Índice al pecho)
    if (signId === 'YO') {
      const closedOthers = (isMiddleCurled ? 1 : 0) + (isRingCurled ? 1 : 0) + (isPinkyCurled ? 1 : 0);
      const isChestHeight = wrist.y >= 0.25 && wrist.y <= 0.88;

      if (closedOthers >= 2 && (isIndexExt || dist(lm[8], lm[0]) > dist(lm[12], lm[0]))) {
        if (isChestHeight) {
          score = 95;
          hint = "¡Excelente seña de YO! Mantén la pose apuntando a tu pecho...";
          diag = "✓ YO detectado perfectamente";
        } else {
          score = 70;
          hint = "Ubica tu mano a la altura del pecho";
          diag = "Ajusta la altura hacia tu pecho";
        }
      } else if (closedOthers < 2) {
        score = 45;
        hint = "Cierra los dedos medio, anular y meñique formando un puño";
        diag = "Cierra los 3 dedos restantes";
      } else {
        score = 55;
        hint = "Extiende tu dedo índice apuntando hacia ti";
        diag = "Apunta el índice a tu cuerpo";
      }
    }
    // 2. EVALUACIÓN PARA "HOLA" (Mano abierta a la sien)
    else if (signId === 'HOLA') {
      const extCount = (isThumbExt ? 1 : 0) + (isIndexExt ? 1 : 0) + (isMiddleExt ? 1 : 0) + (isRingExt ? 1 : 0) + (isPinkyExt ? 1 : 0);
      const isHigh = wrist.y < 0.60;

      if (extCount >= 4 && isHigh) {
        score = 95;
        hint = "¡Excelente saludo de HOLA! Mantén la mano abierta a la sien...";
        diag = "✓ HOLA detectado";
      } else if (!isHigh) {
        score = 65;
        hint = "Eleva la mano a la altura de tu sien/frente";
        diag = "Eleva la mano hacia la sien";
      } else {
        score = Math.round((extCount / 5) * 80);
        hint = "Abre bien la mano extendiendo los dedos";
        diag = "Extiende todos los dedos";
      }
    }
    // 3. EVALUACIÓN PARA "BUENOS"
    else if (signId === 'BUENOS') {
      const extCount = (isIndexExt ? 1 : 0) + (isMiddleExt ? 1 : 0) + (isRingExt ? 1 : 0) + (isPinkyExt ? 1 : 0);
      const isChest = wrist.y >= 0.35 && wrist.y <= 0.85;

      if (extCount >= 3 && isChest) {
        score = 95;
        hint = "¡Excelente seña de BUENOS! Mantén la mano en tu pecho...";
        diag = "✓ BUENOS detectado";
      } else {
        score = Math.round((extCount / 4) * 80);
        hint = "Mano abierta frente al pecho en saludo";
        diag = "Coloca la mano en el pecho";
      }
    }
    // 4. EVALUACIÓN PARA "DIAS" (Palmas al frente simulando el amanecer)
    else if (signId === 'DIAS') {
      const extCount1 = (isThumbExt ? 1 : 0) + (isIndexExt ? 1 : 0) + (isMiddleExt ? 1 : 0) + (isRingExt ? 1 : 0) + (isPinkyExt ? 1 : 0);
      const isHeightOk = wrist.y >= 0.20 && wrist.y <= 0.88;

      if (lm2) {
        const wrist2 = lm2[0];
        const isIdx2 = dist(lm2[8], wrist2) > dist(lm2[6], wrist2) * 1.05;
        const isMid2 = dist(lm2[12], wrist2) > dist(lm2[10], wrist2) * 1.05;
        const isRing2 = dist(lm2[16], wrist2) > dist(lm2[14], wrist2) * 1.05;
        const isPnk2 = dist(lm2[20], wrist2) > dist(lm2[18], wrist2) * 1.05;
        const extCount2 = (isIdx2 ? 1 : 0) + (isMid2 ? 1 : 0) + (isRing2 ? 1 : 0) + (isPnk2 ? 1 : 0);

        if (extCount1 >= 4 && extCount2 >= 3 && isHeightOk && wrist2.y <= 0.88) {
          score = 96;
          hint = "¡Excelente seña de DÍAS! Palmas al frente simulando el amanecer...";
          diag = "✓ DÍAS detectado (ambas manos abiertas)";
        } else if (extCount1 >= 3 && extCount2 >= 2) {
          score = 75;
          hint = "Abre bien todos los dedos mirando al frente";
          diag = "Extiende más los dedos";
        } else {
          score = 60;
          hint = "Abre ambas manos hacia afuera a la altura del pecho";
          diag = "Abre ambas manos al frente";
        }
      } else {
        // Fallback si la cámara solo encuadra una mano
        if (extCount1 >= 4 && isHeightOk) {
          score = 88;
          hint = "¡Bien! Muestra ambas manos abiertas para la seña completa";
          diag = "✓ Mano abierta detectada (DÍAS)";
        } else {
          score = Math.round((extCount1 / 5) * 70);
          hint = "Abre los 5 dedos de tu mano hacia el frente";
          diag = "Mano abierta simulando amanecer";
        }
      }
    }
    // 5. EVALUACIÓN PARA "NOCHES" (Brazos cruzados sobre el pecho)
    else if (signId === 'NOCHES') {
      const isChestLevel = wrist.y >= 0.28 && wrist.y <= 0.90;

      if (lm2) {
        const wrist2 = lm2[0];
        const yDiff = Math.abs(wrist.y - wrist2.y);
        const bothAtChest = isChestLevel && wrist2.y >= 0.28 && wrist2.y <= 0.90;

        if (bothAtChest && yDiff < 0.30) {
          score = 96;
          hint = "¡Excelente seña de NOCHES! Brazos cruzados sobre el pecho...";
          diag = "✓ NOCHES detectado (brazos cruzados)";
        } else if (!bothAtChest) {
          score = 65;
          hint = "Ubica tus brazos a la altura de tu pecho";
          diag = "Ubica brazos en el pecho";
        } else {
          score = 75;
          hint = "Cruza ambos brazos sobre tu torso";
          diag = "Cruza los antebrazos";
        }
      } else {
        // Fallback de 1 mano
        if (isChestLevel) {
          score = 86;
          hint = "¡Buen cruce! Cruza ambos brazos para completarla";
          diag = "✓ Brazo cruzado en pecho (NOCHES)";
        } else {
          score = 60;
          hint = "Cruza tus brazos sobre el pecho";
          diag = "Lleva los brazos al pecho";
        }
      }
    }
    // 6. EVALUACIÓN PARA "NOMBRE" (Dedos índice y medio superpuestos)
    else if (signId === 'NOMBRE') {
      const hasTwoFingers1 = isIndexExt && isMiddleExt && isRingCurled && isPinkyCurled;
      const isChest = wrist.y >= 0.28 && wrist.y <= 0.88;

      if (lm2) {
        const wrist2 = lm2[0];
        const isIdx2 = dist(lm2[8], wrist2) > dist(lm2[6], wrist2) * 1.05;
        const isMid2 = dist(lm2[12], wrist2) > dist(lm2[10], wrist2) * 1.05;
        const isRing2 = dist(lm2[16], wrist2) < dist(lm2[14], wrist2) * 1.05;
        const isPnk2 = dist(lm2[20], wrist2) < dist(lm2[18], wrist2) * 1.05;
        const hasTwoFingers2 = isIdx2 && isMid2 && isRing2;
        const handsClose = dist(wrist, wrist2) < 0.45 || dist(lm[8], lm2[8]) < 0.30;

        if (hasTwoFingers1 && hasTwoFingers2 && handsClose && isChest) {
          score = 96;
          hint = "¡Excelente seña de NOMBRE! Dedos índice y medio cruzados...";
          diag = "✓ NOMBRE detectado (dedos índice y medio)";
        } else if (hasTwoFingers1 && hasTwoFingers2) {
          score = 78;
          hint = "Junta los dedos índice y medio de ambas manos frente al pecho";
          diag = "Acerca ambas manos en el pecho";
        } else {
          score = 60;
          hint = "Extiende únicamente los dedos índice y medio de ambas manos";
          diag = "Extiende índice y medio (2 dedos)";
        }
      } else {
        // Fallback de 1 mano
        if (hasTwoFingers1 && isChest) {
          score = 88;
          hint = "¡Dedos correctos! Apoya los dos dedos sobre los de la otra mano";
          diag = "✓ 2 dedos extendidos frente al pecho";
        } else {
          score = (isIndexExt ? 35 : 0) + (isMiddleExt ? 35 : 0);
          hint = "Extiende los dedos índice y medio cerrando anular y meñique";
          diag = "Extiende únicamente índice y medio";
        }
      }
    }
    // 7. EVALUACIÓN PARA LETRA A
    else if (signId === 'A') {
      const curledCount = (isIndexCurled ? 1 : 0) + (isMiddleCurled ? 1 : 0) + (isRingCurled ? 1 : 0) + (isPinkyCurled ? 1 : 0);
      if (curledCount >= 3 && isThumbExt) {
        score = 95;
        hint = "¡Letra A correcta! Puño cerrado con pulgar al lateral";
        diag = "✓ Letra A detectada";
      } else if (curledCount < 3) {
        score = 50;
        hint = "Cierra los 4 dedos formando un puño";
        diag = "Cierra los dedos";
      } else {
        score = 70;
        hint = "Extiende el pulgar verticalmente al lado";
        diag = "Levanta el pulgar";
      }
    }
    // 8. EVALUACIÓN PARA LETRA B
    else if (signId === 'B') {
      const ext4 = (isIndexExt ? 1 : 0) + (isMiddleExt ? 1 : 0) + (isRingExt ? 1 : 0) + (isPinkyExt ? 1 : 0);
      const thumbTucked = !isThumbExt || thumbDistToMcp < 0.12;
      if (ext4 >= 4 && thumbTucked) {
        score = 96;
        hint = "¡Letra B perfecta! 4 dedos rectos y pulgar plegado";
        diag = "✓ Letra B detectada";
      } else if (ext4 >= 3 && thumbTucked) {
        score = 88;
        hint = "¡Muy bien! Junta bien los 4 dedos rectos hacia arriba";
        diag = "Junta los 4 dedos rectos";
      } else if (!thumbTucked) {
        score = 65;
        hint = "Pliega el pulgar hacia el centro de la palma";
        diag = "Dobla el pulgar sobre la palma";
      } else {
        score = Math.round((ext4 / 4) * 60);
        hint = "Extiende los 4 dedos rectos hacia arriba";
        diag = "4 dedos extendidos arriba";
      }
    }
    // 9. EVALUACIÓN PARA LETRA C
    else if (signId === 'C') {
      const idxDist = dist(lm[8], wrist);
      const idxMcp = dist(lm[5], wrist);
      const isIdxCurved = idxDist > idxMcp * 0.80 && idxDist < idxMcp * 1.60;
      const midDist = dist(lm[12], wrist);
      const midMcp = dist(lm[9], wrist);
      const isMidCurved = midDist > midMcp * 0.80 && midDist < midMcp * 1.60;
      const thumbTipToIdxTip = dist(lm[4], lm[8]);
      const isMouthOpen = thumbTipToIdxTip > 0.08 && thumbTipToIdxTip < 0.35;

      if (isIdxCurved && isMidCurved && isMouthOpen && isThumbExt) {
        score = 95;
        hint = "¡Letra C perfecta! Curva semicircular de la mano";
        diag = "✓ Letra C detectada";
      } else if (isIdxCurved && isThumbExt) {
        score = 75;
        hint = "Arquea los dedos y pulgar enfrentados formando la letra C";
        diag = "Ajusta la curvatura de la C";
      } else {
        score = 55;
        hint = "Forma un semicírculo abriendo el espacio entre pulgar e índice";
        diag = "Arquea dedos simulando una C";
      }
    }
    // 10. EVALUACIÓN PARA LETRA L
    else if (signId === 'L') {
      if (isThumbExt && isIndexExt && isMiddleCurled && isRingCurled && isPinkyCurled) {
        score = 95;
        hint = "¡Letra L perfecta! Pulgar e índice en ángulo recto";
        diag = "✓ Letra L detectada";
      } else {
        score = (isThumbExt ? 40 : 0) + (isIndexExt ? 40 : 0);
        hint = "Extiende únicamente índice y pulgar en 90°";
        diag = "Forma una L recta";
      }
    }
    // 11. EVALUACIÓN PARA LETRA V
    else if (signId === 'V') {
      if (isIndexExt && isMiddleExt && isRingCurled && isPinkyCurled) {
        score = 95;
        hint = "¡Letra V perfecta! Índice y medio en V";
        diag = "✓ Letra V detectada";
      } else {
        score = (isIndexExt ? 40 : 0) + (isMiddleExt ? 40 : 0);
        hint = "Levanta índice y medio en forma de V";
        diag = "Dedos en V (paz/victoria)";
      }
    }

    const diagElem = document.getElementById('poseDiagnostic');
    if (diagElem) diagElem.textContent = diag;

    updateScoreUI(score, hint);

    if (score >= 85) {
      consecutiveSuccessFrames++;
      if (consecutiveSuccessFrames >= SUCCESS_THRESHOLD_FRAMES) {
        consecutiveSuccessFrames = 0;
        if (typeof window.onSignMastered === 'function') {
          window.onSignMastered(currentTargetSign, score);
        }
      }
    } else {
      consecutiveSuccessFrames = Math.max(0, consecutiveSuccessFrames - 1);
    }
  }

  function updateScoreUI(score, hint) {
    const pBar = document.getElementById('progressBar');
    const scoreTxt = document.getElementById('scoreText');
    const hintTxt = document.getElementById('liveHint');
    if (!pBar || !scoreTxt || !hintTxt) return;

    pBar.style.width = `${score}%`;
    scoreTxt.textContent = `${score}%`;
    hintTxt.textContent = hint;

    if (score >= 85) {
      scoreTxt.className = "font-mono font-bold text-emerald-400";
      pBar.className = "progress-bar-fill bg-emerald-500 progress-bar-glow";
    } else if (score >= 60) {
      scoreTxt.className = "font-mono font-bold text-amber-400";
      pBar.className = "progress-bar-fill bg-amber-500";
    } else {
      scoreTxt.className = "font-mono font-bold text-slate-400";
      pBar.className = "progress-bar-fill bg-slate-700";
    }
  }

  function updateFingerBadges(thumb, index, middle, ring, pinky) {
    setIndividualBadge('fingerThumb', thumb);
    setIndividualBadge('fingerIndex', index);
    setIndividualBadge('fingerMiddle', middle);
    setIndividualBadge('fingerRing', ring);
    setIndividualBadge('fingerPinky', pinky);
  }

  function setIndividualBadge(id, isExtended) {
    const el = document.getElementById(id);
    if (!el) return;
    if (isExtended) {
      el.className = "p-1 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40";
    } else {
      el.className = "p-1 rounded bg-slate-800 text-slate-400";
    }
  }

  function resetFingerBadges() {
    ['fingerThumb', 'fingerIndex', 'fingerMiddle', 'fingerRing', 'fingerPinky'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.className = "p-1 rounded bg-slate-800 text-slate-400";
    });
  }

  function resetDiagnostics() {
    updateScoreUI(0, "Cámara web apagada.");
    const diagElem = document.getElementById('poseDiagnostic');
    if (diagElem) diagElem.textContent = "Diagnóstico: Cámara inactiva";
    resetFingerBadges();
  }

  function updateCameraUIState(state) {
    const btn = document.getElementById('toggleCameraBtn');
    const btnText = document.getElementById('cameraBtnText');
    const placeholder = document.getElementById('cameraPlaceholder');
    const overlay = document.getElementById('detectionOverlay');

    if (state === 'running') {
      if (btn) btn.className = "btn-spring px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-700 hover:bg-rose-600 text-white shadow transition flex items-center gap-1.5";
      if (btnText) btnText.textContent = "Detener Cámara";
      if (placeholder) placeholder.classList.add('hidden');
      if (overlay) overlay.classList.remove('hidden');
    } else if (state === 'connecting') {
      if (btnText) btnText.textContent = "Conectando...";
    } else {
      // WCAG AA compliant emerald button
      if (btn) btn.className = "btn-spring px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white shadow transition flex items-center gap-1.5";
      if (btnText) btnText.textContent = "Iniciar Cámara";
      if (placeholder) placeholder.classList.remove('hidden');
      if (overlay) overlay.classList.add('hidden');
    }
  }

  return {
    init,
    start,
    stop,
    toggle,
    setTargetSign,
    setPaused,
    isRunning
  };
})();

window.VisionEvaluator = VisionEvaluator;
