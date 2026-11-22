/**
 * LSC Learn · Proyecto EXIS
 * vision-evaluator.js - Sistema de Visión Artificial por MediaPipe Hands
 * Evaluación en tiempo real y control estricto de pausa de feedback
 */

const VisionEvaluator = (() => {
  let isWebcamRunning = false;
  let cameraInstance = null;
  let handsInstance = null;
  let poseInstance = null;
  let modelsInitPromise = null;
  let isInitializingModels = false;
  let isPoseBusy = false;
  let lastPoseSendTime = 0;
  let latestPoseLandmarks = null;
  let lastPoseResultTime = 0;

  const TRAJECTORY_SIGN_IDS = ['YO', 'HOLA', 'BUENOS', 'DIAS', 'NOCHES', 'NOMBRE', 'TARDES', 'GUSTAR', 'ANNOS', 'LICOR'];
  const POSE_UPPER_CONNECTIONS = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24]];

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

  function sendPoseFrame(vid) {
    const now = Date.now();
    if (poseInstance && !isInitializingModels && !isPoseBusy && (now - lastPoseSendTime >= 50)) {
      isPoseBusy = true;
      lastPoseSendTime = now;
      poseInstance.send({ image: vid })
        .catch((err) => {
          console.warn('[VisionEvaluator] Error en MediaPipe Pose:', err);
        })
        .finally(() => {
          isPoseBusy = false;
        });
    }
  }

  async function ensureModelsInitialized() {
    if (modelsInitPromise) return modelsInitPromise;
    modelsInitPromise = (async () => {
      isInitializingModels = true;
      try {
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
          if (typeof handsInstance.initialize === 'function') {
            await handsInstance.initialize();
          }
        }

        if (!poseInstance && typeof Pose !== 'undefined') {
          poseInstance = new Pose({
            locateFile: (file) => `lib/mediapipe/pose/${file}`
          });
          poseInstance.setOptions({
            modelComplexity: 0,
            smoothLandmarks: true,
            enableSegmentation: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
          });
          poseInstance.onResults(handlePoseResults);
          if (typeof poseInstance.initialize === 'function') {
            await poseInstance.initialize();
          }
        }
      } catch (err) {
        console.warn('[VisionEvaluator] Error inicializando MediaPipe Hands/Pose:', err);
        throw err;
      } finally {
        isInitializingModels = false;
      }
    })();
    return modelsInitPromise;
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
        if (isWebcamRunning && handsInstance && !isInitializingModels) {
          await handsInstance.send({ image: vid });
          sendPoseFrame(vid);
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
      await ensureModelsInitialized();

      try {
        if (window.CameraManager) {
          await window.CameraManager.start(deviceId);
        } else {
          cameraInstance = new Camera(videoElement, {
            onFrame: async () => {
              if (isWebcamRunning && handsInstance && !isInitializingModels) {
                await handsInstance.send({ image: videoElement });
                sendPoseFrame(videoElement);
              }
            },
            width: 640,
            height: 480
          });
          await cameraInstance.start();
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
    latestPoseLandmarks = null;
    lastPoseResultTime = 0;
    updateCameraUIState('stopped');
    [canvasElement, document.getElementById('lessonPracticeCanvas'), document.getElementById('examPracticeCanvas')]
      .filter(Boolean)
      .forEach((cv) => {
        const ctx = cv.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, cv.width, cv.height);
      });
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

  function handlePoseResults(results) {
    latestPoseLandmarks = (results && results.poseLandmarks) ? results.poseLandmarks : null;
    if (latestPoseLandmarks) {
      lastPoseResultTime = Date.now();
    }
    if (window.TrajectoryTracker && typeof window.TrajectoryTracker.setPoseLandmarks === 'function') {
      window.TrajectoryTracker.setPoseLandmarks(latestPoseLandmarks);
    }
  }

  function drawPoseSkeleton(ctx, poseLandmarks, w, h) {
    if (!poseLandmarks || poseLandmarks.length < 17) return;
    const isVisible = (lm) => lm && (lm.visibility === undefined || lm.visibility >= 0.35);

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 122, 69, 0.85)';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    for (let i = 0; i < POSE_UPPER_CONNECTIONS.length; i++) {
      const [aIdx, bIdx] = POSE_UPPER_CONNECTIONS[i];
      const a = poseLandmarks[aIdx];
      const b = poseLandmarks[bIdx];
      if (isVisible(a) && isVisible(b)) {
        ctx.beginPath();
        ctx.moveTo(a.x * w, a.y * h);
        ctx.lineTo(b.x * w, b.y * h);
        ctx.stroke();
      }
    }

    const keyJoints = [0, 7, 8, 11, 12, 13, 14, 15, 16];
    for (let i = 0; i < keyJoints.length; i++) {
      const joint = poseLandmarks[keyJoints[i]];
      if (isVisible(joint)) {
        ctx.beginPath();
        ctx.arc(joint.x * w, joint.y * h, keyJoints[i] === 0 ? 4 : 5, 0, Math.PI * 2);
        ctx.fillStyle = keyJoints[i] >= 13 ? '#FF7A45' : '#FF9266';
        ctx.fill();
        ctx.strokeStyle = '#1C1917';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function renderOverlayOnCanvas(targetCanvas, multiHandLandmarks, poseLandmarks, width, height) {
    if (!targetCanvas) return;
    const isVisible = targetCanvas.offsetParent !== null || !targetCanvas.classList.contains('hidden');
    if (!isVisible) return;

    targetCanvas.width = width;
    targetCanvas.height = height;
    const ctx = targetCanvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    if (poseLandmarks) {
      drawPoseSkeleton(ctx, poseLandmarks, width, height);
    }

    if (window.TrajectoryTracker && !isEvaluationPaused) {
      window.TrajectoryTracker.render(ctx, width, height);
    }

    if (multiHandLandmarks && multiHandLandmarks.length > 0) {
      for (let i = 0; i < multiHandLandmarks.length; i++) {
        const lm = multiHandLandmarks[i];
        drawConnectors(ctx, lm, HAND_CONNECTIONS, { color: '#FF9266', lineWidth: 3 });
        drawLandmarks(ctx, lm, { color: '#1C1917', fillColor: '#FF7A45', lineWidth: 2, radius: 4 });
      }
    }
    ctx.restore();
  }

  function handleHandResults(results) {
    if (!canvasElement || !videoElement) return;

    const width = videoElement.videoWidth || 640;
    const height = videoElement.videoHeight || 480;
    canvasElement.width = width;
    canvasElement.height = height;

    const multiLm = results.multiHandLandmarks || [];
    const hasHands = multiLm.length > 0;
    const hasFreshPose = !!(latestPoseLandmarks && (Date.now() - lastPoseResultTime < 650));
    const activePoseLm = hasFreshPose ? latestPoseLandmarks : null;

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, width, height);

    if (activePoseLm) {
      drawPoseSkeleton(canvasCtx, activePoseLm, width, height);
    }

    // Actualizar y renderizar la guía de trayectoria interactiva (Connect-the-Dots) con Hands + Pose
    if (window.TrajectoryTracker && !isEvaluationPaused) {
      window.TrajectoryTracker.update(multiLm, width, height, videoElement);
      window.TrajectoryTracker.render(canvasCtx, width, height);
    }

    if (hasHands) {
      for (let i = 0; i < multiLm.length; i++) {
        const lm = multiLm[i];
        drawConnectors(canvasCtx, lm, HAND_CONNECTIONS, { color: '#FF9266', lineWidth: 3 });
        drawLandmarks(canvasCtx, lm, { color: '#1C1917', fillColor: '#FF7A45', lineWidth: 2, radius: 4 });
      }
    }
    canvasCtx.restore();

    renderOverlayOnCanvas(document.getElementById('lessonPracticeCanvas'), multiLm, activePoseLm, width, height);
    renderOverlayOnCanvas(document.getElementById('examPracticeCanvas'), multiLm, activePoseLm, width, height);

    const signId = currentTargetSign ? currentTargetSign.id : null;
    const isTrajectoryWord = !!(signId && TRAJECTORY_SIGN_IDS.includes(signId));

    if (!isEvaluationPaused) {
      if (hasHands || (hasFreshPose && isTrajectoryWord)) {
        evaluatePose(multiLm);
        if (!hasHands) resetFingerBadges();
      } else {
        consecutiveSuccessFrames = Math.max(0, consecutiveSuccessFrames - 2);
        updateScoreUI(0, "Coloca tu mano frente a la cámara web");
        updateTrajectoryPillUI(window.TrajectoryTracker ? window.TrajectoryTracker.getStatusText() : null);
        resetFingerBadges();
      }
    }
  }

  function evaluatePose(multiLm) {
    const signId = currentTargetSign ? currentTargetSign.id : null;
    const isTrajectoryWord = !!(signId && TRAJECTORY_SIGN_IDS.includes(signId));
    const hasHands = !!(multiLm && multiLm.length > 0);
    const hasFreshPose = !!(latestPoseLandmarks && (Date.now() - lastPoseResultTime < 650));

    if (isEvaluationPaused || !currentTargetSign || (!hasHands && !(hasFreshPose && isTrajectoryWord))) return;

    const lm = hasHands ? multiLm[0] : null;
    const lm2 = (hasHands && multiLm.length > 1) ? multiLm[1] : null;
    const wrist = lm ? lm[0] : null;
    const dist = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y);

    let isIndexCurled = false, isMiddleCurled = false, isRingCurled = false, isPinkyCurled = false;
    let isIndexExt = false, isMiddleExt = false, isRingExt = false, isPinkyExt = false, isThumbExt = false;
    let thumbDistToMcp = 0;

    if (lm && wrist) {
      isIndexCurled = dist(lm[8], wrist) < dist(lm[6], wrist) * 1.05;
      isMiddleCurled = dist(lm[12], wrist) < dist(lm[10], wrist) * 1.05;
      isRingCurled = dist(lm[16], wrist) < dist(lm[14], wrist) * 1.05;
      isPinkyCurled = dist(lm[20], wrist) < dist(lm[18], wrist) * 1.05;

      isIndexExt = !isIndexCurled;
      isMiddleExt = !isMiddleCurled;
      isRingExt = !isRingCurled;
      isPinkyExt = !isPinkyCurled;

      thumbDistToMcp = dist(lm[4], lm[5]);
      const palmScale = Math.max(0.05, dist(lm[0], lm[9]));
      isThumbExt = (thumbDistToMcp / palmScale) > 0.62 || (dist(lm[4], wrist) > dist(lm[2], wrist) * 1.12);

      updateFingerBadges(isThumbExt, isIndexExt, isMiddleExt, isRingExt, isPinkyExt);
    }

    let score = 0;
    let hint = "";
    let diag = "";

    const bodyAnchors = (window.TrajectoryTracker && typeof window.TrajectoryTracker.getBodyAnchorState === 'function')
      ? window.TrajectoryTracker.getBodyAnchorState().anchors
      : null;

    // Señas dinámicas con trayectoria corporal: evaluación unificada con SignAnatomyValidator (Hands + Pose)
    if (isTrajectoryWord && window.SignAnatomyValidator) {
      const res = window.SignAnatomyValidator.validateSign(signId, multiLm || [], bodyAnchors);
      score = res.score;
      hint = res.hint;
      diag = res.diag;
    } else if (!lm) {
      return;
    }
    // Alfabeto LSC70: validación estricta e invariante a escala de palma con SignAnatomyValidator
    else if (
      signId === 'A' || signId === 'B' || signId === 'C' || signId === 'D' || signId === 'E' ||
      signId === 'I' || signId === 'L' || signId === 'O' || signId === 'U' || signId === 'V'
    ) {
      if (window.SignAnatomyValidator && typeof window.SignAnatomyValidator.validateLetter === 'function') {
        const letterRes = window.SignAnatomyValidator.validateLetter(signId, lm, bodyAnchors);
        score = letterRes.score;
        hint = letterRes.hint;
        diag = letterRes.diag;
      } else {
        const extCount = (isIndexExt ? 1 : 0) + (isMiddleExt ? 1 : 0) + (isRingExt ? 1 : 0) + (isPinkyExt ? 1 : 0);
        score = wrist.y <= 0.90 ? (extCount >= 1 ? 82 : 70) : 55;
        hint = `Realiza la letra ${signId} frente a tu cámara`;
        diag = `✓ Letra ${signId} detectada`;
      }
    }
    // Fallback compacto si SignAnatomyValidator no estuviera cargado
    else if (signId === 'ANNOS' || signId === 'LICOR' || isTrajectoryWord) {
      const extCount = (isIndexExt ? 1 : 0) + (isMiddleExt ? 1 : 0) + (isRingExt ? 1 : 0) + (isPinkyExt ? 1 : 0);
      score = wrist.y <= 0.90 ? (extCount >= 1 ? 82 : 70) : 55;
      hint = `Realiza la seña de ${currentTargetSign.name} frente a tu cuerpo`;
      diag = `✓ Seña ${signId} detectada`;
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
      scoreTxt.className = "font-mono font-bold text-emerald-700";
      pBar.className = "progress-bar-fill bg-emerald-500 progress-bar-glow";
    } else if (score >= 60) {
      scoreTxt.className = "font-mono font-bold text-amber-700";
      pBar.className = "progress-bar-fill bg-amber-500";
    } else {
      scoreTxt.className = "font-mono font-bold text-slate-700";
      pBar.className = "progress-bar-fill bg-slate-400";
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
      el.className = "p-1 rounded bg-amber-100 text-amber-800 font-bold border border-amber-400";
    } else {
      el.className = "p-1 rounded bg-slate-100 text-slate-600 border border-slate-200 font-semibold";
    }
  }

  function resetFingerBadges() {
    ['fingerThumb', 'fingerIndex', 'fingerMiddle', 'fingerRing', 'fingerPinky'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.className = "p-1 rounded bg-slate-100 text-slate-600 border border-slate-200 font-semibold";
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

    // Indicador en vivo sincronizado con Paleta 60-30-10 (#FF7A45 / #1C1917)
    if (statusDot) {
      statusDot.className = "w-2 h-2 rounded-full animate-pulse";
      statusDot.style.backgroundColor = state === 'running' ? "#FF7A45" : "#1C1917";
    }

    if (state === 'running') {
      if (btn) btn.className = "btn-spring px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-700 hover:bg-rose-600 text-white shadow transition flex items-center gap-1.5";
      if (btnText) btnText.textContent = "Detener Cámara";
      if (placeholder) placeholder.classList.add('hidden');
      if (overlay) overlay.classList.remove('hidden');
      if (activePill) {
        activePill.style.borderColor = 'rgba(255, 122, 69, 0.75)';
        activePill.style.color = '#C84B1C';
        const pillDot = activePill.querySelector('span');
        if (pillDot) pillDot.style.backgroundColor = '#FF7A45';
      }
      document.querySelectorAll('#lessonPracticeModal span.text-emerald-400, #blindExamModal span.text-emerald-400').forEach(el => {
        el.style.color = '#C84B1C';
        const dot = el.querySelector('span');
        if (dot) dot.style.backgroundColor = '#FF7A45';
      });
    } else if (state === 'connecting') {
      if (btnText) btnText.textContent = "Conectando...";
    } else {
      // Estado detenido: Acción principal Coral (Manitas UI)
      if (btn) btn.className = "btn-spring px-3 py-1.5 rounded-lg text-xs font-bold bg-coral-500 hover:bg-coral-400 text-slate-900 shadow-sm transition flex items-center gap-2 shrink-0";
      if (btnText) btnText.textContent = "Iniciar Cámara";
      if (placeholder) placeholder.classList.remove('hidden');
      if (overlay) overlay.classList.add('hidden');
      if (activePill) {
        activePill.classList.add('hidden');
      }
      const trajPill = document.getElementById('trajectoryStatusPill');
      if (trajPill) trajPill.classList.add('hidden');
      const lessonTrajPill = document.getElementById('lessonTrajectoryPill');
      if (lessonTrajPill) lessonTrajPill.classList.add('hidden');
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
    __debugHandsInstance: () => handsInstance,
    __debugPoseInstance: () => poseInstance
  };
})();

window.VisionEvaluator = VisionEvaluator;
