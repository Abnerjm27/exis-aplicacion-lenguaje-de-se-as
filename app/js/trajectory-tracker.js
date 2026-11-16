/**
 * LSC Learn · Proyecto EXIS
 * trajectory-tracker.js - Motor Gráfico de Puntos y Trayectorias de Movimiento
 * Guía interactiva "Connect-the-Dots" para señas dinámicas en LSC
 */

const TrajectoryTracker = (() => {
  let isEnabled = true;
  let currentSign = null;
  let trajectoryConfig = null;
  let currentPointIndex = 0;
  let isTrajectoryFinished = false;
  let lastProgressTimestamp = 0;
  let particles = [];
  let shockwaves = [];
  let floaters = [];
  let pointerTrail = [];
  let celebrationTime = 0;

  // Seguimiento suave del puntero (landmark)
  let smoothedPointer = null;

  // Puntos dinámicos suavizados en tiempo real (siguen al usuario)
  let dynamicPoints = [];

  // Razón anatómica cuando un punto no se completa por postura incorrecta
  let lastBlockedReason = null;

  // Contador de frames sosteniendo postura global válida (permite avanzar aunque no se pase por punto lateral)
  let validPoseHoldFrames = 0;

  const bodyDetector = new window.BodyAnchorDetector();

  // Síntesis de audio con Web Audio API (Sin archivos externos)
  let audioCtx = null;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function playChimeNote(freq, duration = 0.25, type = 'sine') {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  }

  function playPointSuccessSound(stepIndex) {
    const scale = [523.25, 659.25, 783.99, 1046.5]; // Do5, Mi5, Sol5, Do6
    const freq = scale[Math.min(stepIndex, scale.length - 1)];
    playChimeNote(freq, 0.35, 'triangle');
  }

  function playCelebrationChord() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        playChimeNote(freq, 0.45, 'triangle');
      }, i * 90);
    });
  }

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  /**
   * Calcula y suaviza la posición dinámica de cada punto según el cuerpo del usuario
   */
  function resolveDynamicPoints(now = Date.now()) {
    if (!trajectoryConfig || !trajectoryConfig.points) {
      dynamicPoints = [];
      return dynamicPoints;
    }

    const pts = trajectoryConfig.points;
    const s = bodyDetector.head.scale || 1.0;

    for (let i = 0; i < pts.length; i++) {
      const pt = pts[i];
      let targetX = pt.x;
      let targetY = pt.y;

      if (pt.anchor) {
        const anchorPos = bodyDetector.getAnchorPoint(pt.anchor, now);
        targetX = clamp(anchorPos.x + (pt.dx || 0) * s, 0.08, 0.92);
        targetY = clamp(anchorPos.y + (pt.dy || 0) * s, 0.10, 0.90);
      } else {
        const waveX = bodyDetector.head.detected ? 0 : Math.sin(now / 650 + i) * 0.03;
        const waveY = bodyDetector.head.detected ? 0 : Math.cos(now / 850 + i) * 0.02;
        targetX = clamp(pt.x + waveX, 0.08, 0.92);
        targetY = clamp(pt.y + waveY, 0.10, 0.90);
      }

      if (!dynamicPoints[i]) {
        dynamicPoints[i] = {
          id: pt.id,
          x: targetX,
          y: targetY,
          label: pt.label,
          anchor: pt.anchor
        };
      } else {
        dynamicPoints[i].x += (targetX - dynamicPoints[i].x) * 0.22;
        dynamicPoints[i].y += (targetY - dynamicPoints[i].y) * 0.22;
        dynamicPoints[i].label = pt.label;
        dynamicPoints[i].anchor = pt.anchor;
      }
    }

    if (dynamicPoints.length > pts.length) {
      dynamicPoints.length = pts.length;
    }

    return dynamicPoints;
  }

  function init() {
    reset();
  }

  function setEnabled(val) {
    isEnabled = !!val;
    if (!isEnabled) {
      reset();
    }
  }

  function getIsEnabled() {
    return isEnabled;
  }

  function setSign(sign) {
    currentSign = sign;
    reset();
    if (sign && sign.trajectory && sign.trajectory.enabled) {
      trajectoryConfig = sign.trajectory;
      resolveDynamicPoints(Date.now());
    } else {
      trajectoryConfig = null;
      dynamicPoints = [];
    }
  }

  function reset() {
    currentPointIndex = 0;
    isTrajectoryFinished = false;
    particles = [];
    shockwaves = [];
    floaters = [];
    pointerTrail = [];
    celebrationTime = 0;
    smoothedPointer = null;
    dynamicPoints = [];
    lastBlockedReason = null;
    validPoseHoldFrames = 0;
    bodyDetector.reset();
  }

  function isTrajectoryActive() {
    return !!(isEnabled && trajectoryConfig && trajectoryConfig.enabled && trajectoryConfig.points && trajectoryConfig.points.length > 0);
  }

  function isCompleted() {
    if (!isTrajectoryActive()) return true;
    return isTrajectoryFinished;
  }

  function getProgress() {
    if (!isTrajectoryActive()) return 1.0;
    const total = trajectoryConfig.points.length;
    if (total === 0) return 1.0;
    if (isTrajectoryFinished) return 1.0;
    return currentPointIndex / total;
  }

  function getStatusText() {
    if (!isTrajectoryActive()) {
      return { active: false, text: "Modo Estático", step: 0, total: 0 };
    }
    const total = trajectoryConfig.points.length;
    if (isTrajectoryFinished) {
      return { active: true, text: "¡Recorrido completado! Mantén la pose...", step: total, total };
    }
    const currentPoint = trajectoryConfig.points[currentPointIndex];
    const label = currentPoint && currentPoint.label ? currentPoint.label : `Punto ${currentPointIndex + 1}`;
    const bodyStatus = lastBlockedReason
      ? lastBlockedReason
      : (bodyDetector.head.detected || bodyDetector.baseHand.detected
        ? `🎯 ${trajectoryConfig.bodyZone || 'Cuerpo detectado'}`
        : '🔍 Buscando tu posición');
    return {
      active: true,
      text: `Conecta punto ${currentPointIndex + 1}/${total}: ${label} (${bodyStatus})`,
      step: currentPointIndex + 1,
      total
    };
  }

  function collectCandidatePointers(multiLandmarks, bodyAnchors, targetIdx) {
    const candidates = [];
    if (multiLandmarks && multiLandmarks.length > 0) {
      for (let i = 0; i < multiLandmarks.length; i++) {
        const lm = multiLandmarks[i];
        if (!lm) continue;
        if (lm[targetIdx]) candidates.push(lm[targetIdx]);
        if (lm[0] && targetIdx !== 0) candidates.push(lm[0]);
        if (lm[8] && targetIdx !== 8) candidates.push(lm[8]);
        if (lm[9]) candidates.push(lm[9]);
      }
    }
    const pose = bodyAnchors?.pose;
    if (pose) {
      if (pose.rightPalm) candidates.push(pose.rightPalm);
      if (pose.leftPalm) candidates.push(pose.leftPalm);
      if (pose.rightWrist) candidates.push(pose.rightWrist);
      if (pose.leftWrist) candidates.push(pose.leftWrist);
    }
    return candidates;
  }

  function completeCurrentWaypoint(targetPoint, points, canvasWidth, canvasHeight) {
    validPoseHoldFrames = 0;
    lastBlockedReason = null;
    lastProgressTimestamp = Date.now();

    const ptX = targetPoint.x * canvasWidth;
    const ptY = targetPoint.y * canvasHeight;

    playPointSuccessSound(currentPointIndex);
    spawnShockwave(ptX, ptY, '#FF7A45', 65);
    spawnParticles(ptX, ptY, '#FF7A45');

    const label = targetPoint.label ? `✓ ${targetPoint.label}` : `✓ Paso ${currentPointIndex + 1}`;
    spawnFloater(ptX, ptY - 18, `${label} +25%`, '#10B981', 14);

    currentPointIndex++;
    if (currentPointIndex >= points.length) {
      isTrajectoryFinished = true;
      celebrationTime = Date.now();
      playCelebrationChord();
      spawnShockwave(canvasWidth * 0.5, canvasHeight * 0.5, '#FF7A45', 150);
      spawnCelebration(canvasWidth, canvasHeight);
      spawnFloater(canvasWidth * 0.5, canvasHeight * 0.42, '¡TRAYECTORIA COMPLETA! ⭐', '#FF7A45', 20);
    }
  }

  /**
   * Actualiza el estado de la trayectoria con los landmarks de MediaPipe (Hands + Pose) y el video en vivo
   * @param {Array} multiLandmarks - Lista de manos detectadas
   * @param {number} canvasWidth - Ancho del lienzo
   * @param {number} canvasHeight - Alto del lienzo
   * @param {HTMLVideoElement} [videoEl] - Elemento de video para detectar cabeza/torso
   * @returns {Object} { pointHit: boolean, isFinished: boolean, progress: number }
   */
  function update(multiLandmarks, canvasWidth, canvasHeight, videoEl = null) {
    updateParticles();
    updateShockwaves();
    updateFloaters();

    if (!isTrajectoryActive()) {
      return { pointHit: false, isFinished: true, progress: 1.0 };
    }

    // Actualizar detección anatómica del cuerpo del usuario (Pose, rostro, torso y mano base)
    bodyDetector.detectFromVideo(videoEl, multiLandmarks);
    const points = resolveDynamicPoints(Date.now());

    if (isTrajectoryFinished) {
      return { pointHit: false, isFinished: true, progress: 1.0 };
    }

    const targetPoint = points[currentPointIndex];
    if (!targetPoint) {
      isTrajectoryFinished = true;
      return { pointHit: false, isFinished: true, progress: 1.0 };
    }

    const bodyAnchors = bodyDetector.getState().anchors;
    const targetLandmarkIdx = trajectoryConfig.trackingLandmark ?? 0;
    const candidates = collectCandidatePointers(multiLandmarks, bodyAnchors, targetLandmarkIdx);

    if (candidates.length === 0) {
      validPoseHoldFrames = 0;
      if (pointerTrail.length > 0) pointerTrail.shift();
      if (currentPointIndex > 0 && Date.now() - lastProgressTimestamp > 4000) {
        reset();
      }
      return { pointHit: false, isFinished: false, progress: getProgress() };
    }

    // Elegir el candidato (cualquiera de las 2 manos o muñecas de Pose) más cercano al objetivo actual
    let trackingPoint = candidates[0];
    let minCandidateDist = Infinity;
    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      const d = Math.hypot(c.x - targetPoint.x, c.y - targetPoint.y);
      if (d < minCandidateDist) {
        minCandidateDist = d;
        trackingPoint = c;
      }
    }

    if (!smoothedPointer) {
      smoothedPointer = { x: trackingPoint.x, y: trackingPoint.y };
    } else {
      smoothedPointer.x += (trackingPoint.x - smoothedPointer.x) * 0.48;
      smoothedPointer.y += (trackingPoint.y - smoothedPointer.y) * 0.48;
    }

    pointerTrail.unshift({ x: smoothedPointer.x, y: smoothedPointer.y, alpha: 1.0 });
    if (pointerTrail.length > 12) pointerTrail.pop();

    const distance = Math.min(
      minCandidateDist,
      Math.hypot(smoothedPointer.x - targetPoint.x, smoothedPointer.y - targetPoint.y)
    );
    const hitRadius = trajectoryConfig.hitRadius || 0.16;

    // Validar postura anatómica exacta y relación con el cuerpo en el punto actual
    const validator = (typeof window !== 'undefined' && window.SignAnatomyValidator && currentSign)
      ? window.SignAnatomyValidator
      : null;
    const anatomyCheck = validator
      ? validator.validateWaypoint(currentSign.id, currentPointIndex, multiLandmarks, bodyAnchors)
      : { valid: true, diag: '' };
    const globalPoseCheck = validator
      ? validator.validateSign(currentSign.id, multiLandmarks, bodyAnchors, null)
      : { valid: false, score: 0 };

    // Respaldo de MediaPipe Pose solo para señas bimanuales de torso cuando Hands sufre oclusión (< 2 manos),
    // manteniendo siempre la validación anatómica del waypoint actual.
    const BIMANUAL_TORSO_SIGNS = ['TARDES', 'NOCHES', 'BUENOS', 'DIAS', 'ANNOS'];
    const isPoseOcclusionFallback = currentSign &&
      BIMANUAL_TORSO_SIGNS.includes(currentSign.id) &&
      (!multiLandmarks || multiLandmarks.length < 2);

    if (isPoseOcclusionFallback && anatomyCheck.valid && globalPoseCheck.valid && globalPoseCheck.score >= 90) {
      validPoseHoldFrames++;
    } else {
      validPoseHoldFrames = 0;
    }

    lastBlockedReason = anatomyCheck.valid ? null : (anatomyCheck.diag || anatomyCheck.hint || 'Ajusta la postura');

    let pointHit = false;
    if ((distance <= hitRadius && anatomyCheck.valid) || (isPoseOcclusionFallback && validPoseHoldFrames >= 8)) {
      pointHit = true;
      completeCurrentWaypoint(targetPoint, points, canvasWidth, canvasHeight);
    }

    return {
      pointHit,
      isFinished: isTrajectoryFinished,
      progress: getProgress()
    };
  }

  /**
   * Renderiza los puntos dinámicos, el radar anatómico, líneas conectoras y partículas sobre el canvas
   */
  function render(ctx, canvasWidth, canvasHeight) {
    if (!isTrajectoryActive() && particles.length === 0 && shockwaves.length === 0 && floaters.length === 0) return;

    ctx.save();

    const now = Date.now();
    const points = isTrajectoryActive() ? resolveDynamicPoints(now) : [];

    // 0. Indicador de Anclaje Anatómico y Halo Corporal
    if (isTrajectoryActive()) {
      const currentPt = points[currentPointIndex] || points[0];
      const activeAnchorName = (currentPt && currentPt.anchor) || 'chest';
      const anchorPos = bodyDetector.getAnchorPoint(activeAnchorName, now);
      const ax = anchorPos.x * canvasWidth;
      const ay = anchorPos.y * canvasHeight;
      const isLocked = bodyDetector.head.detected || bodyDetector.baseHand.detected;

      // Anillo biomecánico sutil en la zona detectada del cuerpo (Paleta 60-30-10 Cálida)
      ctx.save();
      ctx.beginPath();
      ctx.arc(ax, ay, isLocked ? 34 : 42, 0, Math.PI * 2);
      ctx.strokeStyle = isLocked ? 'rgba(255, 122, 69, 0.45)' : 'rgba(255, 146, 102, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.lineDashOffset = -(now / 45) % 20;
      ctx.stroke();
      ctx.restore();

      // Esqueleto anatómico de referencia MediaPipe Pose (hombros, codos, muñecas, cuello y pecho)
      if (isLocked) {
        const chinPt = bodyDetector.getAnchorPoint('chin', now);
        const throatPt = bodyDetector.getAnchorPoint('throat', now);
        const chestPt = bodyDetector.getAnchorPoint('chest', now);
        const lShPt = bodyDetector.getAnchorPoint('left_shoulder', now);
        const rShPt = bodyDetector.getAnchorPoint('right_shoulder', now);
        const pose = bodyDetector.getState().anchors.pose;
        ctx.save();
        ctx.strokeStyle = pose ? 'rgba(255, 146, 102, 0.72)' : 'rgba(255, 146, 102, 0.35)';
        ctx.lineWidth = pose ? 2.5 : 1.5;
        ctx.setLineDash(pose ? [] : [3, 4]);
        ctx.beginPath();
        ctx.moveTo(chinPt.x * canvasWidth, chinPt.y * canvasHeight);
        ctx.lineTo(throatPt.x * canvasWidth, throatPt.y * canvasHeight);
        ctx.lineTo(chestPt.x * canvasWidth, chestPt.y * canvasHeight);
        ctx.moveTo(lShPt.x * canvasWidth, lShPt.y * canvasHeight);
        ctx.lineTo(rShPt.x * canvasWidth, rShPt.y * canvasHeight);
        ctx.stroke();

        if (pose) {
          ctx.strokeStyle = 'rgba(255, 122, 69, 0.85)';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([]);
          ctx.beginPath();
          if (pose.leftShoulder && pose.leftElbow) {
            ctx.moveTo(pose.leftShoulder.x * canvasWidth, pose.leftShoulder.y * canvasHeight);
            ctx.lineTo(pose.leftElbow.x * canvasWidth, pose.leftElbow.y * canvasHeight);
            if (pose.leftWrist) ctx.lineTo(pose.leftWrist.x * canvasWidth, pose.leftWrist.y * canvasHeight);
          }
          if (pose.rightShoulder && pose.rightElbow) {
            ctx.moveTo(pose.rightShoulder.x * canvasWidth, pose.rightShoulder.y * canvasHeight);
            ctx.lineTo(pose.rightElbow.x * canvasWidth, pose.rightElbow.y * canvasHeight);
            if (pose.rightWrist) ctx.lineTo(pose.rightWrist.x * canvasWidth, pose.rightWrist.y * canvasHeight);
          }
          ctx.stroke();

          ctx.fillStyle = '#FF7A45';
          [pose.leftShoulder, pose.rightShoulder, pose.leftElbow, pose.rightElbow, pose.leftWrist, pose.rightWrist]
            .filter(Boolean)
            .forEach((joint) => {
              ctx.beginPath();
              ctx.arc(joint.x * canvasWidth, joint.y * canvasHeight, 4.5, 0, Math.PI * 2);
              ctx.fill();
            });
        }

        ctx.fillStyle = 'rgba(255, 122, 69, 0.85)';
        [chinPt, throatPt, chestPt, lShPt, rShPt].forEach((bp) => {
          ctx.beginPath();
          ctx.arc(bp.x * canvasWidth, bp.y * canvasHeight, 4, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
      }

      // Etiqueta superior de estado de rastreo corporal (des-espejada, tarjeta clara cálida)
      const zoneName = bodyDetector.baseHand.detected && activeAnchorName === 'base_hand_or_chest'
        ? 'Mano Base en Vivo'
        : (trajectoryConfig.bodyZone || anchorPos.zoneLabel || 'Cuerpo');
      const statusBanner = lastBlockedReason
        ? lastBlockedReason
        : (isLocked
          ? `🎯 Anclado a tu ${zoneName}`
          : `🔍 Buscando tu ${zoneName} frente a la cámara...`);
      const bannerColor = lastBlockedReason ? '#C84B1C' : (isLocked ? '#1C1917' : '#574F47');

      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
      const pillW = Math.min(canvasWidth * 0.82, 340);
      const pillH = 26;
      const pillX = (canvasWidth - pillW) / 2;
      const pillY = 12;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(pillX, pillY, pillW, pillH, 13);
      } else {
        ctx.rect(pillX, pillY, pillW, pillH);
      }
      ctx.fill();
      ctx.strokeStyle = lastBlockedReason
        ? 'rgba(232, 93, 42, 0.85)'
        : (isLocked ? 'rgba(255, 122, 69, 0.75)' : 'rgba(212, 201, 188, 0.9)');
      ctx.lineWidth = 1.2;
      ctx.stroke();
      drawUnmirroredText(ctx, statusBanner, canvasWidth * 0.5, pillY + 17, bannerColor, 'bold 11px sans-serif');
      ctx.restore();
    }

    // 1. Dibujar estela luminosa de la mano (Pointer Trail)
    if (pointerTrail.length > 1) {
      ctx.save();
      for (let i = 0; i < pointerTrail.length - 1; i++) {
        const p1 = pointerTrail[i];
        const p2 = pointerTrail[i + 1];
        const trailRatio = 1 - (i / pointerTrail.length);
        ctx.beginPath();
        ctx.moveTo(p1.x * canvasWidth, p1.y * canvasHeight);
        ctx.lineTo(p2.x * canvasWidth, p2.y * canvasHeight);
        ctx.strokeStyle = `rgba(255, 122, 69, ${trailRatio * 0.78})`;
        ctx.lineWidth = Math.max(1.5, 8 * trailRatio);
        ctx.lineCap = 'round';
        ctx.shadowColor = '#FF7A45';
        ctx.shadowBlur = 8;
        ctx.stroke();
      }
      ctx.restore();
    }

    // 2. Línea magnética cuando la mano se aproxima al objetivo
    if (smoothedPointer && points[currentPointIndex] && !isTrajectoryFinished) {
      const curPt = points[currentPointIndex];
      const distToTarget = Math.hypot(smoothedPointer.x - curPt.x, smoothedPointer.y - curPt.y);
      if (distToTarget < 0.32) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(smoothedPointer.x * canvasWidth, smoothedPointer.y * canvasHeight);
        ctx.lineTo(curPt.x * canvasWidth, curPt.y * canvasHeight);
        ctx.strokeStyle = 'rgba(255, 122, 69, 0.55)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.lineDashOffset = -(now / 30) % 16;
        ctx.stroke();
        ctx.restore();
      }
    }

    // 3. Dibujar líneas conectoras entre waypoints dinámicos
    if (points.length > 1) {
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];

        const x1 = p1.x * canvasWidth;
        const y1 = p1.y * canvasHeight;
        const x2 = p2.x * canvasWidth;
        const y2 = p2.y * canvasHeight;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);

        if (i < currentPointIndex - 1 || isTrajectoryFinished) {
          // Tramo ya completado: Esmeralda (#10B981)
          ctx.strokeStyle = '#10B981';
          ctx.lineWidth = 4;
          ctx.setLineDash([]);
          ctx.shadowColor = 'rgba(16, 185, 129, 0.6)';
          ctx.shadowBlur = 8;
        } else if (i === currentPointIndex - 1) {
          // Tramo activo hacia el siguiente punto: Coral (#FF7A45) animado
          ctx.strokeStyle = '#FF7A45';
          ctx.lineWidth = 3.5;
          ctx.setLineDash([8, 6]);
          ctx.lineDashOffset = -(now / 40) % 28;
          ctx.shadowColor = 'rgba(255, 122, 69, 0.65)';
          ctx.shadowBlur = 6;
        } else {
          // Tramo pendiente: Línea piedra suave
          ctx.strokeStyle = 'rgba(212, 201, 188, 0.65)';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 6]);
          ctx.shadowBlur = 0;
        }

        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }

    // 4. Dibujar círculos de waypoints con ondas de radar
    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      const px = pt.x * canvasWidth;
      const py = pt.y * canvasHeight;

      const isCompletedPoint = i < currentPointIndex || isTrajectoryFinished;
      const isCurrentTarget = i === currentPointIndex && !isTrajectoryFinished;

      if (isCurrentTarget) {
        // Ondas de radar concéntricas (Acento 10% Melocotón/Coral #FF7A45)
        const r1 = (now / 1000) % 1;
        const r2 = ((now + 500) / 1000) % 1;
        [r1, r2].forEach(r => {
          ctx.beginPath();
          ctx.arc(px, py, 20 + r * 30, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 122, 69, ${(1 - r) * 0.6})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        });

        // Halo pulsante exterior
        const pulse = (Math.sin(now / 180) + 1) / 2;
        const haloRadius = 26 + pulse * 12;

        ctx.beginPath();
        ctx.arc(px, py, haloRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 122, 69, ${0.30 - pulse * 0.18})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(px, py, 26, 0, Math.PI * 2);
        ctx.strokeStyle = '#FF7A45';
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
        ctx.shadowColor = '#FF7A45';
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Círculo central Melocotón brillante
        ctx.beginPath();
        ctx.arc(px, py, 20, 0, Math.PI * 2);
        ctx.fillStyle = '#FF7A45';
        ctx.fill();

        // Número interior (Carbón Espresso #1C1917 para contraste AAA sobre #FF7A45)
        drawUnmirroredText(ctx, `${i + 1}`, px, py + 5, '#1C1917', 'bold 15px monospace');
      } else if (isCompletedPoint) {
        // Punto completado (Esmeralda #10B981 con check)
        ctx.beginPath();
        ctx.arc(px, py, 18, 0, Math.PI * 2);
        ctx.fillStyle = '#10B981';
        ctx.shadowColor = 'rgba(16, 185, 129, 0.55)';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.strokeStyle = '#1C1917';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Símbolo check "✓"
        drawUnmirroredText(ctx, '✓', px, py + 5, '#1C1917', 'bold 16px sans-serif');
      } else {
        // Punto futuro pendiente (Crema Cálida #F3EFEA / Borde #D4C9BC)
        ctx.beginPath();
        ctx.arc(px, py, 16, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(243, 239, 234, 0.92)';
        ctx.fill();

        ctx.strokeStyle = 'rgba(212, 201, 188, 0.95)';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.stroke();

        drawUnmirroredText(ctx, `${i + 1}`, px, py + 4, '#574F47', 'bold 13px monospace');
      }

      // Etiqueta de texto debajo del punto (des-espejada)
      if (pt.label) {
        const labelY = py + 34;
        drawUnmirroredText(ctx, pt.label, px, labelY, isCurrentTarget ? '#FF7A45' : (isCompletedPoint ? '#10B981' : '#574F47'), '600 11px sans-serif');
      }
    }

    // 5. Renderizar efectos dinámicos: Ondas de choque, partículas y textos flotantes
    renderShockwaves(ctx);
    renderParticles(ctx);
    renderFloaters(ctx);

    ctx.restore();
  }

  /**
   * Dibuja texto des-espejado porque el canvas tiene CSS transform: scaleX(-1)
   */
  function drawUnmirroredText(ctx, text, x, y, color, font) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(-1, 1); // Invierte horizontalmente para compensar el mirror de CSS
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }

  function spawnParticles(x, y, color) {
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20 + Math.random() * 0.4;
      const speed = 2 + Math.random() * 5;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 3.5,
        alpha: 1.0,
        color: color || '#FF7A45',
        decay: 0.035 + Math.random() * 0.02
      });
    }
  }

  function spawnCelebration(width, height) {
    const colors = ['#FF7A45', '#FF9266', '#10B981', '#FAF8F5', '#1C1917'];
    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 7;
      particles.push({
        x: width * 0.5 + (Math.random() - 0.5) * 120,
        y: height * 0.5 + (Math.random() - 0.5) * 120,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2.5 + Math.random() * 4.5,
        alpha: 1.0,
        color: colors[Math.floor(Math.random() * colors.length)],
        decay: 0.022 + Math.random() * 0.018
      });
    }
  }

  function spawnShockwave(x, y, color, maxRadius = 60) {
    shockwaves.push({
      x,
      y,
      radius: 12,
      maxRadius,
      alpha: 0.9,
      color: color || '#FF7A45',
      growRate: (maxRadius - 12) / 16
    });
  }

  function spawnFloater(x, y, text, color, fontSize = 14) {
    floaters.push({
      x,
      y,
      text,
      alpha: 1.0,
      color: color || '#FF7A45',
      fontSize,
      vy: -1.4
    });
  }

  function updateShockwaves() {
    for (let i = shockwaves.length - 1; i >= 0; i--) {
      const sw = shockwaves[i];
      sw.radius += sw.growRate;
      sw.alpha -= 0.055;
      if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
        shockwaves.splice(i, 1);
      }
    }
  }

  function renderShockwaves(ctx) {
    for (let i = 0; i < shockwaves.length; i++) {
      const sw = shockwaves[i];
      ctx.save();
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.strokeStyle = sw.color;
      ctx.globalAlpha = Math.max(0, sw.alpha);
      ctx.lineWidth = 3;
      ctx.shadowColor = sw.color;
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.restore();
    }
  }

  function updateFloaters() {
    for (let i = floaters.length - 1; i >= 0; i--) {
      const f = floaters[i];
      f.y += f.vy;
      f.alpha -= 0.035;
      if (f.alpha <= 0) {
        floaters.splice(i, 1);
      }
    }
  }

  function renderFloaters(ctx) {
    for (let i = 0; i < floaters.length; i++) {
      const f = floaters[i];
      ctx.save();
      ctx.globalAlpha = Math.max(0, f.alpha);
      drawUnmirroredText(ctx, f.text, f.x, f.y, f.color, `bold ${f.fontSize}px sans-serif`);
      ctx.restore();
    }
  }

  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.95;
      p.vy *= 0.95;
      p.alpha -= p.decay;
      if (p.alpha <= 0) {
        particles.splice(i, 1);
      }
    }
  }

  function renderParticles(ctx) {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function getBodyAnchorState() {
    return bodyDetector.getState();
  }

  function setBodyAnchorOverride(state) {
    bodyDetector.setOverride(state);
    resolveDynamicPoints(Date.now());
  }

  function getDynamicPoints() {
    return resolveDynamicPoints(Date.now()).map(p => ({ ...p }));
  }

  function setPoseLandmarks(poseLandmarks) {
    bodyDetector.setPoseLandmarks(poseLandmarks);
  }

  return {
    init,
    setEnabled,
    getIsEnabled,
    setSign,
    reset,
    isTrajectoryActive,
    isCompleted,
    getProgress,
    getStatusText,
    getBodyAnchorState,
    setBodyAnchorOverride,
    setPoseLandmarks,
    getDynamicPoints,
    update,
    render
  };
})();

// Exportar al ámbito global para compatibilidad con scripts nativos
window.TrajectoryTracker = TrajectoryTracker;

