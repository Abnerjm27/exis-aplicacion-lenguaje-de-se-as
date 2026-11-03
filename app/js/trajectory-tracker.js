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
    } else {
      trajectoryConfig = null;
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
    return {
      active: true,
      text: `Conecta punto ${currentPointIndex + 1}/${total}: ${label}`,
      step: currentPointIndex + 1,
      total
    };
  }

  /**
   * Actualiza el estado de la trayectoria con los landmarks de MediaPipe
   * @param {Array} multiLandmarks - Lista de manos detectadas
   * @param {number} canvasWidth - Ancho del lienzo
   * @param {number} canvasHeight - Alto del lienzo
   * @returns {Object} { pointHit: boolean, isFinished: boolean, progress: number }
   */
  function update(multiLandmarks, canvasWidth, canvasHeight) {
    // Actualizar partículas activas, ondas de choque y flotadores
    updateParticles();
    updateShockwaves();
    updateFloaters();

    if (!isTrajectoryActive()) {
      return { pointHit: false, isFinished: true, progress: 1.0 };
    }

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

    const targetPoint = trajectoryConfig.points[currentPointIndex];
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

      // 2. Ondas expansivas de choque
      spawnShockwave(ptX, ptY, '#10b981', 65);

      // 3. Partículas chispeantes
      spawnParticles(ptX, ptY, '#10b981');

      // 4. Texto flotante de impacto (+25 / Conectado)
      const label = targetPoint.label ? `✓ ${targetPoint.label}` : `✓ Paso ${currentPointIndex + 1}`;
      spawnFloater(ptX, ptY - 18, `${label} +25%`, '#34d399', 14);

      currentPointIndex++;
      if (currentPointIndex >= trajectoryConfig.points.length) {
        isTrajectoryFinished = true;
        celebrationTime = Date.now();
        playCelebrationChord();
        spawnShockwave(canvasWidth * 0.5, canvasHeight * 0.5, '#f59e0b', 150);
        spawnCelebration(canvasWidth, canvasHeight);
        spawnFloater(canvasWidth * 0.5, canvasHeight * 0.42, '¡TRAYECTORIA COMPLETA! ⭐', '#fbbf24', 20);
      }
    }

    return {
      pointHit,
      isFinished: isTrajectoryFinished,
      progress: getProgress()
    };
  }

  /**
   * Renderiza los puntos, líneas conectoras y partículas sobre el canvas
   */
  function render(ctx, canvasWidth, canvasHeight) {
    if (!isTrajectoryActive() && particles.length === 0 && shockwaves.length === 0 && floaters.length === 0) return;

    ctx.save();

    const points = trajectoryConfig ? trajectoryConfig.points : [];
    const total = points.length;
    const now = Date.now();

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
        ctx.strokeStyle = `rgba(6, 182, 212, ${trailRatio * 0.7})`;
        ctx.lineWidth = Math.max(1.5, 8 * trailRatio);
        ctx.lineCap = 'round';
        ctx.shadowColor = '#06b6d4';
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
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.lineDashOffset = -(now / 30) % 16;
        ctx.stroke();
        ctx.restore();
      }
    }

    // 3. Dibujar líneas conectoras entre waypoints
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
          // Tramo ya completado: Verde esmeralda resplandeciente
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 4;
          ctx.setLineDash([]);
          ctx.shadowColor = 'rgba(16, 185, 129, 0.7)';
          ctx.shadowBlur = 8;
        } else if (i === currentPointIndex - 1) {
          // Tramo activo hacia el siguiente punto: Ámbar animado
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 3.5;
          ctx.setLineDash([8, 6]);
          ctx.lineDashOffset = -(now / 40) % 28;
          ctx.shadowColor = 'rgba(245, 158, 11, 0.6)';
          ctx.shadowBlur = 6;
        } else {
          // Tramo pendiente: Línea tenue
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
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
        // Ondas de radar concéntricas
        const r1 = (now / 1000) % 1;
        const r2 = ((now + 500) / 1000) % 1;
        [r1, r2].forEach(r => {
          ctx.beginPath();
          ctx.arc(px, py, 20 + r * 30, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(245, 158, 11, ${(1 - r) * 0.55})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        });

        // Halo pulsante exterior
        const pulse = (Math.sin(now / 180) + 1) / 2;
        const haloRadius = 26 + pulse * 12;

        ctx.beginPath();
        ctx.arc(px, py, haloRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245, 158, 11, ${0.28 - pulse * 0.18})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(px, py, 26, 0, Math.PI * 2);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Círculo central ámbar brillante
        ctx.beginPath();
        ctx.arc(px, py, 20, 0, Math.PI * 2);
        ctx.fillStyle = '#f59e0b';
        ctx.fill();

        // Número interior (des-espejado para leerse al derecho en CSS scaleX(-1))
        drawUnmirroredText(ctx, `${i + 1}`, px, py + 5, '#0a0e17', 'bold 15px monospace');
      } else if (isCompletedPoint) {
        // Punto completado (Esmeralda con check)
        ctx.beginPath();
        ctx.arc(px, py, 18, 0, Math.PI * 2);
        ctx.fillStyle = '#10b981';
        ctx.shadowColor = 'rgba(16, 185, 129, 0.6)';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Símbolo check "✓"
        drawUnmirroredText(ctx, '✓', px, py + 5, '#ffffff', 'bold 16px sans-serif');
      } else {
        // Punto futuro pendiente (Gris / Azul sutil)
        ctx.beginPath();
        ctx.arc(px, py, 16, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(18, 24, 36, 0.85)';
        ctx.fill();

        ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.stroke();

        drawUnmirroredText(ctx, `${i + 1}`, px, py + 4, '#94a3b8', 'bold 13px monospace');
      }

      // Etiqueta de texto debajo del punto (des-espejada)
      if (pt.label) {
        const labelY = py + 34;
        drawUnmirroredText(ctx, pt.label, px, labelY, isCurrentTarget ? '#fbbf24' : '#cbd5e1', '600 11px sans-serif');
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
        color: color || '#10b981',
        decay: 0.035 + Math.random() * 0.02
      });
    }
  }

  function spawnCelebration(width, height) {
    const colors = ['#f59e0b', '#10b981', '#06b6d4', '#ec4899', '#ffffff'];
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
      color: color || '#10b981',
      growRate: (maxRadius - 12) / 16
    });
  }

  function spawnFloater(x, y, text, color, fontSize = 14) {
    floaters.push({
      x,
      y,
      text,
      alpha: 1.0,
      color: color || '#34d399',
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
    update,
    render
  };
})();

// Exportar al ámbito global para compatibilidad con scripts nativos
window.TrajectoryTracker = TrajectoryTracker;
