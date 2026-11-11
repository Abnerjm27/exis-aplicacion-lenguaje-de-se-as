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

  let noticeTimeoutId = null;

  function showCameraNotice(msg, durationMs = 8000) {
    const toast = document.getElementById('cameraNoticeToast');
    const txt = document.getElementById('cameraNoticeText');
    const diagElem = document.getElementById('poseDiagnostic');
    if (diagElem) diagElem.textContent = msg;

    if (!toast || !txt) return;
    txt.textContent = msg;
    toast.classList.remove('hidden');

    if (noticeTimeoutId) clearTimeout(noticeTimeoutId);
    if (durationMs > 0) {
      noticeTimeoutId = setTimeout(() => {
        toast.classList.add('hidden');
      }, durationMs);
    }
  }

  function hideCameraNotice() {
    const toast = document.getElementById('cameraNoticeToast');
    if (toast) toast.classList.add('hidden');
    if (noticeTimeoutId) clearTimeout(noticeTimeoutId);
  }

  function init(videoEl, canvasEl) {
    videoElement = videoEl;
    canvasElement = canvasEl;
    canvasCtx = canvasElement.getContext('2d');

    const selectEl = document.getElementById('cameraSourceSelect');
    const refreshBtn = document.getElementById('btnRefreshCameras');
    const dismissBtn = document.getElementById('btnDismissCameraNotice');

    if (dismissBtn) {
      dismissBtn.addEventListener('click', hideCameraNotice);
    }

    if (window.CameraManager && videoElement) {
      window.CameraManager.init(videoElement, selectEl, async (vid) => {
        if (isWebcamRunning && handsInstance) {
          await handsInstance.send({ image: vid });
        }
      }, refreshBtn);
    }
  }

  function setTargetSign(sign) {
    currentTargetSign = sign;
    consecutiveSuccessFrames = 0;
    isEvaluationPaused = false;
    if (window.TrajectoryTracker) {
      window.TrajectoryTracker.setSign(sign);
    }
    updateScoreUI(0, `Ubica tu mano frente a la cámara para iniciar ${sign ? sign.name : ''}...`);
    const diagElem = document.getElementById('poseDiagnostic');
    if (diagElem) diagElem.textContent = "Ubica tu mano frente a la cámara...";
  }

  function setPaused(paused) {
    isEvaluationPaused = paused;
    if (paused) {
      consecutiveSuccessFrames = 0;
      if (window.TrajectoryTracker) {
        window.TrajectoryTracker.reset();
      }
    }
  }

  function isRunning() {
    return isWebcamRunning;
  }

  async function startWithDevice(deviceId = null) {
    if (!videoElement || !canvasElement) return false;

    try {
      updateCameraUIState('connecting');

      if (!handsInstance) {
        handsInstance = new Hands({
          locateFile: (file) => `lib/mediapipe/hands/${file}`
        });

        handsInstance.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        handsInstance.onResults(handleHandResults);
      }

      let cameraStarted = false;
      try {
        if (window.CameraManager) {
          await window.CameraManager.start(deviceId);
          cameraStarted = true;
        } else {
          cameraInstance = new Camera(videoElement, {
            onFrame: async () => {
              if (isWebcamRunning && handsInstance) {
                await handsInstance.send({ image: videoElement });
              }
            },
            width: 640,
            height: 480
          });
          await cameraInstance.start();
          cameraStarted = true;
        }
      } catch (streamErr) {
        console.warn("[VisionEvaluator] Error al iniciar cámara seleccionada:", streamErr);
        throw streamErr;
      }

      isWebcamRunning = true;
      updateCameraUIState('running');
      return true;
    } catch (err) {
      window.__lastVisionError = (err.name || 'Error') + ': ' + (err.message || String(err));
      console.error("Error definitivo al iniciar cámara:", err);
      updateCameraUIState('stopped');
      showCameraNotice("No se pudo iniciar la cámara. Verifica los permisos del navegador o verifica que otra app no la esté usando.");
      return false;
    }
  }

  async function start() {
    const selectEl = document.getElementById('cameraSourceSelect');
    const chosenId = (selectEl && selectEl.value) ? selectEl.value : null;
    return startWithDevice(chosenId);
  }

  function stop() {
    if (window.CameraManager) {
      window.CameraManager.stop();
    } else if (cameraInstance) {
      cameraInstance.stop();
    }
    isWebcamRunning = false;
    updateCameraUIState('stopped');
    if (canvasCtx && canvasElement) {
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    }
    if (window.TrajectoryTracker) {
      window.TrajectoryTracker.reset();
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

    // Actualizar y renderizar la guía de trayectoria interactiva (Connect-the-Dots) con detección corporal en vivo
    if (window.TrajectoryTracker && !isEvaluationPaused) {
      window.TrajectoryTracker.update(results.multiHandLandmarks, canvasElement.width, canvasElement.height, videoElement);
      window.TrajectoryTracker.render(canvasCtx, canvasElement.width, canvasElement.height);
    }

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      // Draw MediaPipe Skeleton for all detected hands
      for (let i = 0; i < results.multiHandLandmarks.length; i++) {
        const lm = results.multiHandLandmarks[i];
        drawConnectors(canvasCtx, lm, HAND_CONNECTIONS, { color: '#1FC8BA', lineWidth: 3 });
        drawLandmarks(canvasCtx, lm, { color: '#1FC8BA', fillColor: '#FFC857', lineWidth: 2, radius: 4 });
      }

      // Renderizar también en el canvas de la lección interactiva si está activo
      const lessonCanvas = document.getElementById('lessonPracticeCanvas');
      const isLessonVisible = lessonCanvas && (lessonCanvas.offsetParent !== null || !lessonCanvas.classList.contains('hidden'));
      if (isLessonVisible) {
        lessonCanvas.width = videoElement.videoWidth || 640;
        lessonCanvas.height = videoElement.videoHeight || 480;
        const lessonCtx = lessonCanvas.getContext('2d');
        lessonCtx.save();
        lessonCtx.clearRect(0, 0, lessonCanvas.width, lessonCanvas.height);

        // Guía interactiva de puntos y trayectorias (Connect-the-Dots) en la lección
        if (window.TrajectoryTracker && !isEvaluationPaused) {
          window.TrajectoryTracker.render(lessonCtx, lessonCanvas.width, lessonCanvas.height);
        }

        for (let i = 0; i < results.multiHandLandmarks.length; i++) {
          const lm = results.multiHandLandmarks[i];
          drawConnectors(lessonCtx, lm, HAND_CONNECTIONS, { color: '#1FC8BA', lineWidth: 3 });
          drawLandmarks(lessonCtx, lm, { color: '#1FC8BA', fillColor: '#FFC857', lineWidth: 2, radius: 4 });
        }
        lessonCtx.restore();
      }

      // Renderizar también en el canvas de la arena de examen si está activo
      const examCanvas = document.getElementById('examPracticeCanvas');
      const isExamVisible = examCanvas && (examCanvas.offsetParent !== null || !examCanvas.classList.contains('hidden'));
      if (isExamVisible) {
        examCanvas.width = videoElement.videoWidth || 640;
        examCanvas.height = videoElement.videoHeight || 480;
        const examCtx = examCanvas.getContext('2d');
        examCtx.save();
        examCtx.clearRect(0, 0, examCanvas.width, examCanvas.height);
        for (let i = 0; i < results.multiHandLandmarks.length; i++) {
          const lm = results.multiHandLandmarks[i];
          drawConnectors(examCtx, lm, HAND_CONNECTIONS, { color: '#1FC8BA', lineWidth: 3 });
          drawLandmarks(examCtx, lm, { color: '#1FC8BA', fillColor: '#FFC857', lineWidth: 2, radius: 4 });
        }
        examCtx.restore();
      }

      // Only evaluate if evaluation is NOT paused by victory modal
      if (!isEvaluationPaused) {
        evaluatePose(results.multiHandLandmarks);
      }
    } else {
      const lessonCanvas = document.getElementById('lessonPracticeCanvas');
      const isLessonVisible = lessonCanvas && (lessonCanvas.offsetParent !== null || !lessonCanvas.classList.contains('hidden'));
      if (isLessonVisible) {
        lessonCanvas.width = videoElement.videoWidth || 640;
        lessonCanvas.height = videoElement.videoHeight || 480;
        const lessonCtx = lessonCanvas.getContext('2d');
        lessonCtx.save();
        lessonCtx.clearRect(0, 0, lessonCanvas.width, lessonCanvas.height);
        // Aun sin manos detectadas, renderizar los waypoints de movimiento para guiar la postura inicial
        if (window.TrajectoryTracker && !isEvaluationPaused) {
          window.TrajectoryTracker.render(lessonCtx, lessonCanvas.width, lessonCanvas.height);
        }
        lessonCtx.restore();
      }

      const examCanvas = document.getElementById('examPracticeCanvas');
      if (examCanvas) {
        const examCtx = examCanvas.getContext('2d');
        if (examCtx) examCtx.clearRect(0, 0, examCanvas.width, examCanvas.height);
      }

      if (!isEvaluationPaused) {
        consecutiveSuccessFrames = Math.max(0, consecutiveSuccessFrames - 2);
        updateScoreUI(0, "Coloca tu mano frente a la cámara web");
        updateTrajectoryPillUI(window.TrajectoryTracker ? window.TrajectoryTracker.getStatusText() : null);
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
    // 12. EVALUACIÓN PARA "TARDES" (Brazos cruzados horizontalmente a la altura del pecho)
    else if (signId === 'TARDES') {
      const isChestLevel = wrist.y >= 0.25 && wrist.y <= 0.90;

      if (lm2) {
        const wrist2 = lm2[0];
        const yDiff = Math.abs(wrist.y - wrist2.y);
        const bothAtChest = isChestLevel && wrist2.y >= 0.25 && wrist2.y <= 0.90;

        if (bothAtChest && yDiff < 0.32) {
          score = 96;
          hint = "¡Excelente seña de TARDES! Brazos cruzados a la altura del pecho...";
          diag = "✓ TARDES detectado (antebrazos en reposo horizontal)";
        } else if (!bothAtChest) {
          score = 65;
          hint = "Ubica ambos antebrazos a la altura de tu pecho";
          diag = "Ubica brazos en el pecho";
        } else {
          score = 75;
          hint = "Cruza horizontalmente tus brazos en el pecho";
          diag = "Cruza los antebrazos";
        }
      } else {
        if (isChestLevel) {
          score = 88;
          hint = "¡Buen movimiento! Cruza ambos brazos para la seña completa de TARDES";
          diag = "✓ Brazo cruzado en pecho (TARDES)";
        } else {
          score = 60;
          hint = "Lleva los brazos al centro del pecho";
          diag = "Lleva los brazos al pecho";
        }
      }
    }
    // 13. EVALUACIÓN PARA "GUSTAR" (Dedo índice extendido en garganta / cuello)
    else if (signId === 'GUSTAR') {
      const idxY = lm[8].y;
      const isThroatLevel = idxY <= 0.52 && wrist.y >= 0.25;
      const isPointingUp = isIndexExt && (isRingCurled || isPinkyCurled);

      if (isThroatLevel && isPointingUp) {
        score = 96;
        hint = "¡Excelente seña de GUSTAR! Dedo índice tocando la garganta...";
        diag = "✓ GUSTAR detectado (índice en garganta)";
      } else if (isPointingUp) {
        score = 75;
        hint = "Sube el dedo índice hacia tu garganta / cuello";
        diag = "Lleva el índice a la garganta";
      } else if (isThroatLevel) {
        score = 65;
        hint = "Extiende únicamente tu dedo índice apuntando hacia arriba";
        diag = "Extiende el índice hacia arriba";
      } else {
        score = 45;
        hint = "Extiende el dedo índice y llévalo a tu garganta";
        diag = "Índice en garganta (GUSTAR)";
      }
    }
    // 14. EVALUACIÓN PARA LETRA I (Puño con meñique extendido vertical)
    else if (signId === 'I') {
      if (isPinkyExt && isIndexCurled && isMiddleCurled && isRingCurled) {
        score = 96;
        hint = "¡Letra I perfecta! Meñique erguido y puño cerrado";
        diag = "✓ Letra I detectada";
      } else if (isPinkyExt) {
        score = 78;
        hint = "Cierra completamente los dedos índice, medio y anular";
        diag = "Cierra los otros dedos en puño";
      } else {
        score = 45;
        hint = "Extiende únicamente tu dedo meñique hacia arriba";
        diag = "Levanta el meñique (Letra I)";
      }
    }
    // 15. EVALUACIÓN PARA LETRA O (Dedos curvados tocando el pulgar)
    else if (signId === 'O') {
      const thumbToIdx = dist(lm[4], lm[8]);
      const thumbToMid = dist(lm[4], lm[12]);
      const isClosedCircle = thumbToIdx < 0.16 && thumbToMid < 0.18;
      const isCurved = !isIndexExt && !isMiddleExt;

      if (isClosedCircle && isCurved) {
        score = 96;
        hint = "¡Letra O perfecta! Dedos y pulgar formando un círculo cerrado";
        diag = "✓ Letra O detectada";
      } else if (thumbToIdx < 0.25) {
        score = 78;
        hint = "Junta las puntas de tus dedos con el pulgar para cerrar el círculo";
        diag = "Cierra el círculo con el pulgar";
      } else {
        score = 50;
        hint = "Curva los dedos enfrentados al pulgar formando una O";
        diag = "Forma una O con los dedos";
      }
    }
    // 16. EVALUACIÓN PARA "ANNOS" (Movimiento circular de manos en torso / pecho)
    else if (signId === 'ANNOS') {
      const isChestLevel = wrist.y >= 0.38 && wrist.y <= 0.92;

      if (lm2) {
        const wrist2 = lm2[0];
        const bothAtChest = isChestLevel && wrist2.y >= 0.38 && wrist2.y <= 0.92;
        const handsProximity = dist(wrist, wrist2) < 0.45;

        if (bothAtChest && handsProximity) {
          score = 95;
          hint = "¡Excelente seña de AÑOS! Movimiento circular de manos en el torso...";
          diag = "✓ AÑOS detectado (manos en torso)";
        } else if (bothAtChest) {
          score = 75;
          hint = "Acerca tus dos manos frente al pecho para el frotamiento circular";
          diag = "Acerca las manos en el pecho";
        } else {
          score = 60;
          hint = "Ubica ambas manos a la altura de tu torso";
          diag = "Ubica manos en el torso";
        }
      } else {
        if (isChestLevel) {
          score = 88;
          hint = "¡Buen movimiento! Acerca ambas manos al pecho para la seña completa";
          diag = "✓ Mano en torso (AÑOS)";
        } else {
          score = 55;
          hint = "Lleva tu mano a la altura del pecho y gira suavemente";
          diag = "Mano al pecho (AÑOS)";
        }
      }
    }
    // 17. EVALUACIÓN PARA "LICOR" (Mano en copa/Y hacia la barbilla y boca)
    else if (signId === 'LICOR') {
      const isMouthHeight = wrist.y >= 0.30 && wrist.y <= 0.72;
      const isShakaOrCup = isThumbExt || isPinkyExt || (dist(lm[4], lm[20]) > 0.18);

      if (isMouthHeight && isShakaOrCup) {
        score = 95;
        hint = "¡Excelente seña de LICOR! Mano en copa ascendiendo hacia los labios...";
        diag = "✓ LICOR detectado (copa en barbilla/boca)";
      } else if (isShakaOrCup) {
        score = 75;
        hint = "Eleva tu mano hacia el mentón o boca simulando beber";
        diag = "Eleva la mano a la barbilla";
      } else if (isMouthHeight) {
        score = 65;
        hint = "Forma una copa con la mano extendiendo pulgar y meñique";
        diag = "Extiende pulgar/meñique (copa)";
      } else {
        score = 45;
        hint = "Forma una copa con la mano y acércala a tu barbilla";
        diag = "Mano en copa hacia la boca";
      }
    }
    // 18. EVALUACIÓN PARA LETRA D (Índice vertical erguido y aro con pulgar y medio)
    else if (signId === 'D') {
      const thumbToMid = dist(lm[4], lm[12]);
      const isLoop = thumbToMid < 0.22;
      const othersCurled = isMiddleCurled && isRingCurled && isPinkyCurled;

      if (isIndexExt && isLoop && othersCurled) {
        score = 96;
        hint = "¡Letra D perfecta! Índice erguido con aro entre pulgar y dedos";
        diag = "✓ Letra D detectada";
      } else if (isIndexExt && othersCurled) {
        score = 82;
        hint = "Junta la yema de tu pulgar con tu dedo medio formando un círculo";
        diag = "Cierra el aro del pulgar con medio";
      } else if (isIndexExt) {
        score = 60;
        hint = "Curva los dedos medio, anular y meñique hacia el pulgar";
        diag = "Curva los dedos hacia el pulgar";
      } else {
        score = 40;
        hint = "Extiende únicamente tu dedo índice recto hacia arriba";
        diag = "Extiende el índice hacia arriba (D)";
      }
    }
    // 19. EVALUACIÓN PARA LETRA E (4 dedos curvados juntos apoyados sobre el pulgar)
    else if (signId === 'E') {
      const extCount = (isIndexExt ? 1 : 0) + (isMiddleExt ? 1 : 0) + (isRingExt ? 1 : 0) + (isPinkyExt ? 1 : 0);
      const allCurled = isIndexCurled && isMiddleCurled && isRingCurled && isPinkyCurled;
      const thumbTucked = dist(lm[4], wrist) < dist(lm[2], wrist) * 1.35;

      if (allCurled && extCount === 0 && thumbTucked) {
        score = 96;
        hint = "¡Letra E perfecta! Dedos curvados descansando sobre el pulgar";
        diag = "✓ Letra E detectada";
      } else if (allCurled && extCount <= 1) {
        score = 80;
        hint = "Apoya las yemas de los 4 dedos sobre el pulgar doblado";
        diag = "Pliega los 4 dedos sobre el pulgar";
      } else {
        score = 50;
        hint = "Curva los 4 dedos hacia la palma apoyándolos en el pulgar";
        diag = "Curva los dedos hacia abajo (E)";
      }
    }
    // 20. EVALUACIÓN PARA LETRA U (Índice y medio extendidos juntos, sin apertura en V)
    else if (signId === 'U') {
      const idxMidDist = dist(lm[8], lm[12]);
      const bothExtended = isIndexExt && isMiddleExt;
      const closedRest = isRingCurled && isPinkyCurled;
      const isTightTogether = idxMidDist < 0.095;

      if (bothExtended && closedRest && isTightTogether) {
        score = 96;
        hint = "¡Letra U perfecta! Dedos índice y medio rectos y juntos";
        diag = "✓ Letra U detectada";
      } else if (bothExtended && closedRest && !isTightTogether) {
        score = 75;
        hint = "Junta firmemente los dedos índice y medio (¡no los abras en V!)";
        diag = "Junta índice y medio (sin V)";
      } else if (bothExtended) {
        score = 65;
        hint = "Cierra completamente los dedos anular y meñique con el pulgar";
        diag = "Cierra anular y meñique";
      } else {
        score = 45;
        hint = "Extiende los dedos índice y medio rectos y pegados hacia arriba";
        diag = "Extiende índice y medio juntos (U)";
      }
    }

    // Integración de trayectoria dinámica (Connect-the-Dots)
    const hasTrajectory = window.TrajectoryTracker && window.TrajectoryTracker.isTrajectoryActive();
    const isTrajComplete = window.TrajectoryTracker ? window.TrajectoryTracker.isCompleted() : true;
    const trajProgress = window.TrajectoryTracker ? window.TrajectoryTracker.getProgress() : 1.0;
    const trajStatus = window.TrajectoryTracker ? window.TrajectoryTracker.getStatusText() : null;

    let finalScore = score;
    if (hasTrajectory) {
      if (score >= 60) {
        if (isTrajComplete) {
          finalScore = Math.max(score, 95);
          hint = `¡Movimiento y pose de ${currentTargetSign.name} completados!`;
          diag = `✓ Recorrido completado con éxito`;
        } else {
          // Postura anatómica adecuada, guiando por la secuencia de puntos
          const stepBonus = Math.round(trajProgress * 30);
          finalScore = Math.min(84, Math.round(score * 0.55 + stepBonus));
          if (trajStatus) {
            hint = `${trajStatus.text} (Postura: Correcta)`;
            diag = `Sigue los puntos: ${trajStatus.step}/${trajStatus.total}`;
          }
        }
      } else {
        // La postura aún necesita afinarse
        finalScore = Math.round(score * 0.65);
        if (trajStatus) {
          diag = `Coloca bien los dedos antes de moverte`;
        }
      }
    }

    const diagElem = document.getElementById('poseDiagnostic');
    if (diagElem) diagElem.textContent = diag;

    updateScoreUI(finalScore, hint);
    updateTrajectoryPillUI(trajStatus);

    const isMastered = hasTrajectory 
      ? (finalScore >= 85 && isTrajComplete) 
      : (finalScore >= 85);

    if (isMastered) {
      consecutiveSuccessFrames++;
      if (consecutiveSuccessFrames >= SUCCESS_THRESHOLD_FRAMES) {
        consecutiveSuccessFrames = 0;
        if (typeof window.onSignMastered === 'function') {
          window.onSignMastered(currentTargetSign, finalScore);
        }
      }
    } else {
      consecutiveSuccessFrames = Math.max(0, consecutiveSuccessFrames - 1);
    }
  }

  function updateTrajectoryPillUI(trajStatus) {
    const pill = document.getElementById('trajectoryStatusPill');
    const text = document.getElementById('trajectoryStatusText');
    if (pill && text) {
      if (!trajStatus || !trajStatus.active) {
        pill.classList.add('hidden');
      } else {
        pill.classList.remove('hidden');
        text.textContent = trajStatus.text;
      }
    }

    const lessonPill = document.getElementById('lessonTrajectoryPill');
    const lessonText = document.getElementById('lessonTrajectoryText');
    if (lessonPill && lessonText) {
      if (!trajStatus || !trajStatus.active) {
        lessonPill.classList.add('hidden');
      } else {
        lessonPill.classList.remove('hidden');
        lessonText.textContent = trajStatus.text;
      }
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

    // Sincronizar en tiempo real con la sesión de lección interactiva si está en fase practice
    if (window.LessonSessionController && typeof window.LessonSessionController.handlePracticeFrame === 'function') {
      window.LessonSessionController.handlePracticeFrame(score, 100);
    }

    // Sincronizar en tiempo real con la arena de examen si está en reto de gesto
    const examBar = document.getElementById('examGestureRadarBar');
    const examTxt = document.getElementById('examGestureRadarText');
    if (examBar) examBar.style.width = `${score}%`;
    if (examTxt) examTxt.textContent = `${score}%`;

    if (window.BlindExamController && typeof window.BlindExamController.handlePracticeFrame === 'function') {
      window.BlindExamController.handlePracticeFrame(score, 100);
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
    const statusDot = document.getElementById('cameraStatusDot');
    const activePill = document.getElementById('activeCameraPill');

    // Indicador en vivo sincronizado con Turquesa (#1FC8BA)
    if (statusDot) {
      statusDot.className = "w-2 h-2 rounded-full animate-pulse";
      statusDot.style.backgroundColor = "#1FC8BA";
    }

    if (state === 'running') {
      if (btn) btn.className = "btn-spring px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-700 hover:bg-rose-600 text-white shadow transition flex items-center gap-1.5";
      if (btnText) btnText.textContent = "Detener Cámara";
      if (placeholder) placeholder.classList.add('hidden');
      if (overlay) overlay.classList.remove('hidden');
      if (activePill) {
        activePill.style.borderColor = 'rgba(31, 200, 186, 0.5)';
        activePill.style.color = '#1FC8BA';
        const pillDot = activePill.querySelector('span');
        if (pillDot) pillDot.style.backgroundColor = '#1FC8BA';
      }
      document.querySelectorAll('#lessonPracticeModal span.text-emerald-400, #blindExamModal span.text-emerald-400').forEach(el => {
        el.style.color = '#1FC8BA';
        const dot = el.querySelector('span');
        if (dot) dot.style.backgroundColor = '#1FC8BA';
      });
    } else if (state === 'connecting') {
      if (btnText) btnText.textContent = "Conectando...";
    } else {
      // Estado detenido: Acción principal Coral (Manitas UI)
      if (btn) btn.className = "btn-spring px-3 py-1.5 rounded-lg text-xs font-bold bg-coral-500 hover:bg-coral-400 text-slate-950 shadow transition flex items-center gap-1.5";
      if (btnText) btnText.textContent = "Iniciar Cámara";
      if (placeholder) placeholder.classList.remove('hidden');
      if (overlay) overlay.classList.add('hidden');
      if (activePill) {
        activePill.classList.add('hidden');
      }
    }
  }

  return {
    init,
    start,
    startWithDevice,
    stop,
    toggle,
    setTargetSign,
    setPaused,
    isPaused: () => isEvaluationPaused,
    isRunning,
    __debugHandsInstance: () => handsInstance
  };
})();

window.VisionEvaluator = VisionEvaluator;
