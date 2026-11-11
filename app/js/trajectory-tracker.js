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

  /**
   * Clase POO: BodyAnchorDetector
   * Detecta y rastrea en tiempo real la ubicación de la cabeza/rostro, cuello, pecho
   * y mano base del usuario sobre el feed de cámara para anclar los puntos de trayectoria.
   */
  class BodyAnchorDetector {
    constructor() {
      this.head = { x: 0.50, y: 0.28, scale: 1.0, detected: false, confidence: 0 };
      this.baseHand = { x: 0.50, y: 0.62, detected: false };
      this.overrideState = null;
      this.lastScanTime = 0;
      this.scanWidth = 64;
      this.scanHeight = 48;
      this.offscreenCanvas = null;
      this.offscreenCtx = null;
    }

    initOffscreen() {
      if (!this.offscreenCanvas && typeof document !== 'undefined') {
        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCanvas.width = this.scanWidth;
        this.offscreenCanvas.height = this.scanHeight;
        this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });
      }
    }

    reset() {
      this.baseHand.detected = false;
    }

    setOverride(state) {
      if (!state) {
        this.overrideState = null;
        return;
      }
      this.overrideState = state;
      if (state.head) {
        this.head = {
          x: state.head.x ?? this.head.x,
          y: state.head.y ?? this.head.y,
          scale: state.head.scale ?? 1.0,
          detected: state.head.detected ?? true,
          confidence: state.head.confidence ?? 0.95
        };
      }
      if (state.baseHand) {
        this.baseHand = {
          x: state.baseHand.x ?? this.baseHand.x,
          y: state.baseHand.y ?? this.baseHand.y,
          detected: state.baseHand.detected ?? true
        };
      }
    }

    getState() {
      return {
        head: { ...this.head },
        baseHand: { ...this.baseHand },
        anchors: {
          temple: this.getAnchorPoint('temple', Date.now()),
          chin: this.getAnchorPoint('chin', Date.now()),
          throat: this.getAnchorPoint('throat', Date.now()),
          chest: this.getAnchorPoint('chest', Date.now()),
          base_hand_or_chest: this.getAnchorPoint('base_hand_or_chest', Date.now())
        }
      };
    }

    /**
     * Escanea el frame de video y los landmarks de las manos para localizar al usuario
     */
    detectFromVideo(videoEl, multiLandmarks) {
      if (this.overrideState) {
        if (this.overrideState.head) {
          this.head.x += (this.overrideState.head.x - this.head.x) * 0.35;
          this.head.y += (this.overrideState.head.y - this.head.y) * 0.35;
          this.head.scale = this.overrideState.head.scale ?? 1.0;
          this.head.detected = this.overrideState.head.detected ?? true;
        }
        if (this.overrideState.baseHand) {
          this.baseHand.x += (this.overrideState.baseHand.x - this.baseHand.x) * 0.4;
          this.baseHand.y += (this.overrideState.baseHand.y - this.baseHand.y) * 0.4;
          this.baseHand.detected = this.overrideState.baseHand.detected ?? true;
        }
        return;
      }

      // 1. Detectar Mano Base cuando hay 2 manos en pantalla (señas bimanuales)
      if (multiLandmarks && multiLandmarks.length >= 2) {
        const baseLm = multiLandmarks[1];
        if (baseLm && baseLm[0] && baseLm[5] && baseLm[17]) {
          const palmX = (baseLm[0].x + baseLm[5].x + baseLm[17].x) / 3;
          const palmY = (baseLm[0].y + baseLm[5].y + baseLm[17].y) / 3;
          if (!this.baseHand.detected) {
            this.baseHand.x = palmX;
            this.baseHand.y = palmY;
          } else {
            this.baseHand.x += (palmX - this.baseHand.x) * 0.35;
            this.baseHand.y += (palmY - this.baseHand.y) * 0.35;
          }
          this.baseHand.detected = true;
        }
      } else {
        this.baseHand.detected = false;
      }

      // 2. Escaneo ligero de rostro/cabeza en el video cada 80ms (~12.5 FPS)
      const now = Date.now();
      let faceFoundInVideo = false;

      if (videoEl && videoEl.readyState >= 2 && (now - this.lastScanTime >= 80)) {
        this.lastScanTime = now;
        this.initOffscreen();

        if (this.offscreenCtx) {
          try {
            const w = this.scanWidth;
            const h = this.scanHeight;
            this.offscreenCtx.drawImage(videoEl, 0, 0, w, h);
            const imgData = this.offscreenCtx.getImageData(0, 0, w, h).data;

            // Construir cajas de exclusión alrededor de las manos detectadas para no confundir mano con cara
            const handBoxes = [];
            if (multiLandmarks && multiLandmarks.length > 0) {
              for (let m = 0; m < multiLandmarks.length; m++) {
                const hLm = multiLandmarks[m];
                let minX = 1, maxX = 0, minY = 1, maxY = 0;
                for (let k = 0; k < hLm.length; k++) {
                  if (hLm[k].x < minX) minX = hLm[k].x;
                  if (hLm[k].x > maxX) maxX = hLm[k].x;
                  if (hLm[k].y < minY) minY = hLm[k].y;
                  if (hLm[k].y > maxY) maxY = hLm[k].y;
                }
                handBoxes.push({
                  minX: minX - 0.05,
                  maxX: maxX + 0.05,
                  minY: minY - 0.05,
                  maxY: maxY + 0.05
                });
              }
            }

            let sumX = 0;
            let sumY = 0;
            let count = 0;
            let minSkinX = 1, maxSkinX = 0;

            const maxRow = Math.floor(h * 0.62);
            const minRow = Math.floor(h * 0.04);

            for (let py = minRow; py < maxRow; py++) {
              const normY = py / h;
              for (let px = 4; px < w - 4; px++) {
                const normX = px / w;

                // Saltar píxeles dentro de una mano
                let insideHand = false;
                for (let b = 0; b < handBoxes.length; b++) {
                  const box = handBoxes[b];
                  if (normX >= box.minX && normX <= box.maxX && normY >= box.minY && normY <= box.maxY) {
                    insideHand = true;
                    break;
                  }
                }
                if (insideHand) continue;

                const idx = (py * w + px) * 4;
                const r = imgData[idx];
                const g = imgData[idx + 1];
                const b = imgData[idx + 2];

                // Clasificador rápido de piel humana en RGB + YCbCr
                if (r > 60 && g > 40 && b > 20 && r > g && r > b && (r - g) > 12) {
                  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
                  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
                  if (cb >= 75 && cb <= 135 && cr >= 130 && cr <= 178) {
                    // Peso mayor hacia el centro-superior donde suele estar el rostro
                    const centerWeight = 1.0 - Math.abs(normX - 0.5) * 0.4;
                    sumX += normX * centerWeight;
                    sumY += normY * centerWeight;
                    count += centerWeight;
                    if (normX < minSkinX) minSkinX = normX;
                    if (normX > maxSkinX) maxSkinX = normX;
                  }
                }
              }
            }

            if (count >= 14) {
              const cx = Math.max(0.22, Math.min(0.78, sumX / count));
              const cy = Math.max(0.14, Math.min(0.46, sumY / count));
              const apparentWidth = Math.max(0.10, Math.min(0.36, maxSkinX - minSkinX));
              const estScale = Math.max(0.80, Math.min(1.25, apparentWidth / 0.18));

              this.head.x += (cx - this.head.x) * 0.25;
              this.head.y += (cy - this.head.y) * 0.25;
              this.head.scale += (estScale - this.head.scale) * 0.2;
              this.head.detected = true;
              this.head.confidence = Math.min(1.0, count / 45);
              faceFoundInVideo = true;
            }
          } catch (e) {
            // Ignorar errores de lectura de canvas si el stream aún no está listo
          }
        }
      }

      // 3. Inferencia Biomecánica de Respaldo desde la Mano:
      // Si el usuario levanta la mano pero el entorno es oscuro o sintético, inferimos el eje corporal desde su brazo/muñeca
      if (!faceFoundInVideo && multiLandmarks && multiLandmarks.length > 0) {
        const lm = multiLandmarks[0];
        if (lm && lm[0] && lm[9]) {
          const wrist = lm[0];
          // En imagen espejo/cámara, la mano derecha suele operar ligeramente a la izquierda del centro o hacia el eje del cuerpo
          const inferredHeadX = Math.max(0.26, Math.min(0.74, wrist.x * 0.65 + 0.50 * 0.35));
          const inferredHeadY = Math.max(0.18, Math.min(0.42, Math.min(wrist.y - 0.12, 0.30)));
          this.head.x += (inferredHeadX - this.head.x) * 0.18;
          this.head.y += (inferredHeadY - this.head.y) * 0.18;
          this.head.detected = true;
          this.head.confidence = 0.75;
        }
      } else if (!faceFoundInVideo && (!multiLandmarks || multiLandmarks.length === 0)) {
        // Decaimiento gradual cuando no se detecta rostro ni manos
        this.head.confidence = Math.max(0, this.head.confidence - 0.03);
        if (this.head.confidence < 0.2) {
          this.head.detected = false;
        }
      }
    }

    /**
     * Obtiene la coordenada normalizada (x, y) de una zona anatómica del cuerpo del usuario
     */
    getAnchorPoint(anchorName, now = Date.now()) {
      const isUserDetected = this.head.detected || this.baseHand.detected;
      // Si aún está buscando al usuario, los puntos realizan un movimiento orgánico de exploración ("Radar Buscador")
      const searchWaveX = isUserDetected ? Math.sin(now / 1100) * 0.005 : Math.sin(now / 650) * 0.038;
      const searchWaveY = isUserDetected ? Math.cos(now / 1300) * 0.004 : Math.cos(now / 850) * 0.022;

      const hx = this.head.x + searchWaveX;
      const hy = this.head.y + searchWaveY;
      const s = this.head.scale || 1.0;

      switch (anchorName) {
        case 'temple':
          // Sien derecha del usuario (en coordenadas de cámara antes del espejo CSS scaleX(-1), x menor es lado derecho del usuario)
          return { x: hx - 0.10 * s, y: hy - 0.02 * s, zoneLabel: 'Sien Derecha' };
        case 'chin':
          return { x: hx, y: hy + 0.09 * s, zoneLabel: 'Barbilla / Boca' };
        case 'throat':
          return { x: hx, y: hy + 0.16 * s, zoneLabel: 'Garganta' };
        case 'base_hand_or_chest':
          if (this.baseHand.detected) {
            return {
              x: this.baseHand.x,
              y: this.baseHand.y,
              zoneLabel: 'Mano Base en Vivo'
            };
          }
          return { x: hx, y: Math.min(0.78, hy + 0.34 * s), zoneLabel: 'Centro del Pecho' };
        case 'chest':
        default:
          return { x: hx, y: Math.min(0.78, hy + 0.34 * s), zoneLabel: 'Centro del Pecho' };
      }
    }
  }

  const bodyDetector = new BodyAnchorDetector();

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

      // Atracción magnética adaptativa hacia el puntero de la mano en el punto objetivo actual
      if (i === currentPointIndex && !isTrajectoryFinished && smoothedPointer) {
        const distToHand = Math.hypot(smoothedPointer.x - targetX, smoothedPointer.y - targetY);
        if (distToHand < 0.28) {
          targetX += (smoothedPointer.x - targetX) * 0.15;
          targetY += (smoothedPointer.y - targetY) * 0.15;
        }
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
    const bodyStatus = bodyDetector.head.detected || bodyDetector.baseHand.detected
      ? `🎯 ${trajectoryConfig.bodyZone || 'Cuerpo detectado'}`
      : '🔍 Buscando tu posición';
    return {
      active: true,
      text: `Conecta punto ${currentPointIndex + 1}/${total}: ${label} (${bodyStatus})`,
      step: currentPointIndex + 1,
      total
    };
  }

  /**
   * Actualiza el estado de la trayectoria con los landmarks de MediaPipe y el video en vivo
   * @param {Array} multiLandmarks - Lista de manos detectadas
   * @param {number} canvasWidth - Ancho del lienzo
   * @param {number} canvasHeight - Alto del lienzo
   * @param {HTMLVideoElement} [videoEl] - Elemento de video para detectar cabeza/torso
   * @returns {Object} { pointHit: boolean, isFinished: boolean, progress: number }
   */
  function update(multiLandmarks, canvasWidth, canvasHeight, videoEl = null) {
    // Actualizar partículas activas, ondas de choque y flotadores
    updateParticles();
    updateShockwaves();
    updateFloaters();

    if (!isTrajectoryActive()) {
      return { pointHit: false, isFinished: true, progress: 1.0 };
    }

    // Actualizar detección anatómica del cuerpo del usuario (rostro, torso y mano base)
    bodyDetector.detectFromVideo(videoEl, multiLandmarks);
    const points = resolveDynamicPoints(Date.now());

    if (isTrajectoryFinished) {
      return { pointHit: false, isFinished: true, progress: 1.0 };
    }

    if (!multiLandmarks || multiLandmarks.length === 0) {
      if (pointerTrail.length > 0) pointerTrail.shift();
      if (currentPointIndex > 0 && Date.now() - lastProgressTimestamp > 4000) {
        reset();
      }
      return { pointHit: false, isFinished: false, progress: getProgress() };
    }

    const lm = multiLandmarks[0];
    const targetLandmarkIdx = trajectoryConfig.trackingLandmark ?? 0;
    const trackingPoint = lm[targetLandmarkIdx] || lm[0];

    // Suavizado exponencial del puntero
    if (!smoothedPointer) {
      smoothedPointer = { x: trackingPoint.x, y: trackingPoint.y };
    } else {
      smoothedPointer.x += (trackingPoint.x - smoothedPointer.x) * 0.45;
      smoothedPointer.y += (trackingPoint.y - smoothedPointer.y) * 0.45;
    }

    // Registrar estela dinámica luminosa (comet trail)
    pointerTrail.unshift({ x: smoothedPointer.x, y: smoothedPointer.y, alpha: 1.0 });
    if (pointerTrail.length > 12) pointerTrail.pop();

    const targetPoint = points[currentPointIndex];
    if (!targetPoint) {
      isTrajectoryFinished = true;
      return { pointHit: false, isFinished: true, progress: 1.0 };
    }

    const dx = smoothedPointer.x - targetPoint.x;
    const dy = smoothedPointer.y - targetPoint.y;
    const distance = Math.hypot(dx, dy);
    const hitRadius = trajectoryConfig.hitRadius || 0.15;

    let pointHit = false;
    if (distance <= hitRadius) {
      pointHit = true;
      lastProgressTimestamp = Date.now();

      const ptX = targetPoint.x * canvasWidth;
      const ptY = targetPoint.y * canvasHeight;

      // 1. Sonido melódico de éxito
      playPointSuccessSound(currentPointIndex);

      // 2. Ondas expansivas de choque (Amarillo logro #FFC857)
      spawnShockwave(ptX, ptY, '#FFC857', 65);

      // 3. Partículas chispeantes
      spawnParticles(ptX, ptY, '#FFC857');

      // 4. Texto flotante de impacto (+25 / Conectado)
      const label = targetPoint.label ? `✓ ${targetPoint.label}` : `✓ Paso ${currentPointIndex + 1}`;
      spawnFloater(ptX, ptY - 18, `${label} +25%`, '#FFC857', 14);

      currentPointIndex++;
      if (currentPointIndex >= points.length) {
        isTrajectoryFinished = true;
        celebrationTime = Date.now();
        playCelebrationChord();
        spawnShockwave(canvasWidth * 0.5, canvasHeight * 0.5, '#FFC857', 150);
        spawnCelebration(canvasWidth, canvasHeight);
        spawnFloater(canvasWidth * 0.5, canvasHeight * 0.42, '¡TRAYECTORIA COMPLETA! ⭐', '#FFC857', 20);
      }
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

      // Anillo biomecánico sutil en la zona detectada del cuerpo
      ctx.save();
      ctx.beginPath();
      ctx.arc(ax, ay, isLocked ? 34 : 42, 0, Math.PI * 2);
      ctx.strokeStyle = isLocked ? 'rgba(31, 200, 186, 0.28)' : 'rgba(255, 200, 87, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.lineDashOffset = -(now / 45) % 20;
      ctx.stroke();
      ctx.restore();

      // Etiqueta superior de estado de rastreo corporal (des-espejada)
      const zoneName = bodyDetector.baseHand.detected && activeAnchorName === 'base_hand_or_chest'
        ? 'Mano Base en Vivo'
        : (trajectoryConfig.bodyZone || anchorPos.zoneLabel || 'Cuerpo');
      const statusBanner = isLocked
        ? `🎯 Anclado a tu ${zoneName}`
        : `🔍 Buscando tu ${zoneName} frente a la cámara...`;
      const bannerColor = isLocked ? '#1FC8BA' : '#FFC857';

      ctx.save();
      ctx.fillStyle = 'rgba(15, 26, 48, 0.78)';
      const pillW = Math.min(canvasWidth * 0.76, 310);
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
      ctx.strokeStyle = isLocked ? 'rgba(31, 200, 186, 0.45)' : 'rgba(255, 200, 87, 0.45)';
      ctx.lineWidth = 1;
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
        ctx.strokeStyle = `rgba(31, 200, 186, ${trailRatio * 0.7})`;
        ctx.lineWidth = Math.max(1.5, 8 * trailRatio);
        ctx.lineCap = 'round';
        ctx.shadowColor = '#1FC8BA';
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
        ctx.strokeStyle = 'rgba(31, 200, 186, 0.45)';
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
          // Tramo ya completado: Amarillo del logo (#FFC857) resplandeciente
          ctx.strokeStyle = '#FFC857';
          ctx.lineWidth = 4;
          ctx.setLineDash([]);
          ctx.shadowColor = 'rgba(255, 200, 87, 0.7)';
          ctx.shadowBlur = 8;
        } else if (i === currentPointIndex - 1) {
          // Tramo activo hacia el siguiente punto: Turquesa de visión (#1FC8BA) animado
          ctx.strokeStyle = '#1FC8BA';
          ctx.lineWidth = 3.5;
          ctx.setLineDash([8, 6]);
          ctx.lineDashOffset = -(now / 40) % 28;
          ctx.shadowColor = 'rgba(31, 200, 186, 0.6)';
          ctx.shadowBlur = 6;
        } else {
          // Tramo pendiente: Línea tenue
          ctx.strokeStyle = 'rgba(185, 196, 214, 0.35)';
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
        // Ondas de radar concéntricas (Turquesa visión #1FC8BA)
        const r1 = (now / 1000) % 1;
        const r2 = ((now + 500) / 1000) % 1;
        [r1, r2].forEach(r => {
          ctx.beginPath();
          ctx.arc(px, py, 20 + r * 30, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(31, 200, 186, ${(1 - r) * 0.55})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        });

        // Halo pulsante exterior
        const pulse = (Math.sin(now / 180) + 1) / 2;
        const haloRadius = 26 + pulse * 12;

        ctx.beginPath();
        ctx.arc(px, py, haloRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(31, 200, 186, ${0.28 - pulse * 0.18})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(px, py, 26, 0, Math.PI * 2);
        ctx.strokeStyle = '#1FC8BA';
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
        ctx.shadowColor = '#1FC8BA';
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Círculo central turquesa brillante
        ctx.beginPath();
        ctx.arc(px, py, 20, 0, Math.PI * 2);
        ctx.fillStyle = '#1FC8BA';
        ctx.fill();

        // Número interior (des-espejado para leerse al derecho en CSS scaleX(-1))
        drawUnmirroredText(ctx, `${i + 1}`, px, py + 5, '#0F1A30', 'bold 15px monospace');
      } else if (isCompletedPoint) {
        // Punto completado (Amarillo del logo #FFC857 con check)
        ctx.beginPath();
        ctx.arc(px, py, 18, 0, Math.PI * 2);
        ctx.fillStyle = '#FFC857';
        ctx.shadowColor = 'rgba(255, 200, 87, 0.6)';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.strokeStyle = '#172544';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Símbolo check "✓"
        drawUnmirroredText(ctx, '✓', px, py + 5, '#172544', 'bold 16px sans-serif');
      } else {
        // Punto futuro pendiente (Superficie #172544 / Borde #2A3A5E)
        ctx.beginPath();
        ctx.arc(px, py, 16, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(23, 37, 68, 0.85)';
        ctx.fill();

        ctx.strokeStyle = 'rgba(42, 58, 94, 0.8)';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.stroke();

        drawUnmirroredText(ctx, `${i + 1}`, px, py + 4, '#94A3B8', 'bold 13px monospace');
      }

      // Etiqueta de texto debajo del punto (des-espejada)
      if (pt.label) {
        const labelY = py + 34;
        drawUnmirroredText(ctx, pt.label, px, labelY, isCurrentTarget ? '#1FC8BA' : (isCompletedPoint ? '#FFC857' : '#B9C4D6'), '600 11px sans-serif');
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
        color: color || '#FFC857',
        decay: 0.035 + Math.random() * 0.02
      });
    }
  }

  function spawnCelebration(width, height) {
    const colors = ['#FFC857', '#1FC8BA', '#FF6B5B', '#FFFFFF', '#3DE8D2'];
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
      color: color || '#FFC857',
      growRate: (maxRadius - 12) / 16
    });
  }

  function spawnFloater(x, y, text, color, fontSize = 14) {
    floaters.push({
      x,
      y,
      text,
      alpha: 1.0,
      color: color || '#FFC857',
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
    getDynamicPoints,
    update,
    render
  };
})();

// Exportar al ámbito global para compatibilidad con scripts nativos
window.TrajectoryTracker = TrajectoryTracker;

