/**
 * LSC Learn · Proyecto EXIS
 * body-anchor-detector.js - Detector Anatómico Corporal POO (Regla 8)
 * Combina MediaPipe Pose (33 landmarks reales de rostro, cuello, hombros, codos y muñecas)
 * con fallback de escaneo facial en video y seguimiento de mano base bimanual.
 */

class BodyAnchorDetector {
  constructor() {
    this.head = { x: 0.50, y: 0.28, scale: 1.0, detected: false, confidence: 0 };
    this.baseHand = { x: 0.50, y: 0.62, detected: false };
    this.baseHandUpdatedAt = 0;
    this.poseParts = null;
    this.poseUpdatedAt = 0;
    this.overrideState = null;
    this.lastScanTime = 0;
    this.scanWidth = 64;
    this.scanHeight = 48;
    this.offscreenCanvas = null;
    this.offscreenCtx = null;
  }

  init() {
    this.reset();
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
    this.baseHandUpdatedAt = 0;
    this.poseParts = null;
    this.poseUpdatedAt = 0;
  }

  destroy() {
    this.reset();
    this.offscreenCanvas = null;
    this.offscreenCtx = null;
  }

  /**
   * Actualiza las partes reales del cuerpo desde MediaPipe Pose (33 landmarks)
   */
  setPoseLandmarks(poseLandmarks) {
    if (!poseLandmarks || poseLandmarks.length < 17) {
      return;
    }
    const vis = (lm) => lm && (lm.visibility === undefined || lm.visibility >= 0.35);
    const nose = vis(poseLandmarks[0]) ? poseLandmarks[0] : null;
    const leftEar = vis(poseLandmarks[7]) ? poseLandmarks[7] : null;
    const rightEar = vis(poseLandmarks[8]) ? poseLandmarks[8] : null;
    const mouthL = vis(poseLandmarks[9]) ? poseLandmarks[9] : null;
    const mouthR = vis(poseLandmarks[10]) ? poseLandmarks[10] : null;
    const lSh = vis(poseLandmarks[11]) ? poseLandmarks[11] : null;
    const rSh = vis(poseLandmarks[12]) ? poseLandmarks[12] : null;
    const lEl = vis(poseLandmarks[13]) ? poseLandmarks[13] : null;
    const rEl = vis(poseLandmarks[14]) ? poseLandmarks[14] : null;
    const lWr = vis(poseLandmarks[15]) ? poseLandmarks[15] : null;
    const rWr = vis(poseLandmarks[16]) ? poseLandmarks[16] : null;
    const lPinky = vis(poseLandmarks[17]) ? poseLandmarks[17] : null;
    const rPinky = vis(poseLandmarks[18]) ? poseLandmarks[18] : null;
    const lIdx = vis(poseLandmarks[19]) ? poseLandmarks[19] : null;
    const rIdx = vis(poseLandmarks[20]) ? poseLandmarks[20] : null;
    const lThumb = vis(poseLandmarks[21]) ? poseLandmarks[21] : null;
    const rThumb = vis(poseLandmarks[22]) ? poseLandmarks[22] : null;

    if (!nose && !lSh && !rSh) return;

    const computePalm = (wr, idx, pinky) => {
      if (!wr) return null;
      const pts = [wr, idx, pinky].filter(Boolean);
      const sum = pts.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
      return { x: sum.x / pts.length, y: sum.y / pts.length };
    };

    const mouthMid = (mouthL && mouthR)
      ? { x: (mouthL.x + mouthR.x) / 2, y: (mouthL.y + mouthR.y) / 2 + 0.02 }
      : (nose ? { x: nose.x, y: nose.y + 0.07 } : null);

    const shoulderMid = (lSh && rSh)
      ? { x: (lSh.x + rSh.x) / 2, y: (lSh.y + rSh.y) / 2 }
      : null;
    const shoulderWidth = (lSh && rSh) ? Math.hypot(lSh.x - rSh.x, lSh.y - rSh.y) : 0.30;

    if (nose) {
      this.head.x += (nose.x - this.head.x) * 0.45;
      this.head.y += (nose.y - this.head.y) * 0.45;
      this.head.scale += (Math.max(0.75, Math.min(1.35, shoulderWidth / 0.32)) - this.head.scale) * 0.3;
      this.head.detected = true;
      this.head.confidence = 0.98;
    }

    this.poseParts = {
      nose: nose ? { x: nose.x, y: nose.y } : null,
      leftEar: leftEar ? { x: leftEar.x, y: leftEar.y } : null,
      rightEar: rightEar ? { x: rightEar.x, y: rightEar.y } : null,
      mouthMid,
      leftShoulder: lSh ? { x: lSh.x, y: lSh.y } : null,
      rightShoulder: rSh ? { x: rSh.x, y: rSh.y } : null,
      leftElbow: lEl ? { x: lEl.x, y: lEl.y, visibility: lEl.visibility ?? 1 } : null,
      rightElbow: rEl ? { x: rEl.x, y: rEl.y, visibility: rEl.visibility ?? 1 } : null,
      leftWrist: lWr ? { x: lWr.x, y: lWr.y, visibility: lWr.visibility ?? 1 } : null,
      rightWrist: rWr ? { x: rWr.x, y: rWr.y, visibility: rWr.visibility ?? 1 } : null,
      leftPinky: lPinky ? { x: lPinky.x, y: lPinky.y } : null,
      rightPinky: rPinky ? { x: rPinky.x, y: rPinky.y } : null,
      leftIndex: lIdx ? { x: lIdx.x, y: lIdx.y } : null,
      rightIndex: rIdx ? { x: rIdx.x, y: rIdx.y } : null,
      leftThumb: lThumb ? { x: lThumb.x, y: lThumb.y } : null,
      rightThumb: rThumb ? { x: rThumb.x, y: rThumb.y } : null,
      leftPalm: computePalm(lWr, lIdx, lPinky),
      rightPalm: computePalm(rWr, rIdx, rPinky),
      rawLandmarks: poseLandmarks.slice(0, 25),
      shoulderMid,
      shoulderWidth
    };
    this.poseUpdatedAt = Date.now();
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
    const now = Date.now();
    return {
      head: { ...this.head },
      baseHand: { ...this.baseHand },
      anchors: {
        temple: this.getAnchorPoint('temple', now),
        chin: this.getAnchorPoint('chin', now),
        throat: this.getAnchorPoint('throat', now),
        chest: this.getAnchorPoint('chest', now),
        left_shoulder: this.getAnchorPoint('left_shoulder', now),
        right_shoulder: this.getAnchorPoint('right_shoulder', now),
        base_hand_or_chest: this.getAnchorPoint('base_hand_or_chest', now),
        baseHandDetected: this.baseHand.detected,
        pose: (this.poseParts && (now - this.poseUpdatedAt < 1200)) ? this.poseParts : null
      }
    };
  }

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

    const now = Date.now();
    // 1. Detectar Mano Base cuando hay 2 manos en pantalla o mediante ventana de retención / Pose
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
        this.baseHandUpdatedAt = now;
      }
    } else {
      const hasLivePose = this.poseParts && (now - this.poseUpdatedAt < 1200);
      const poseWristsInTorso = hasLivePose && this.poseParts.leftWrist && this.poseParts.rightWrist &&
        this.poseParts.leftWrist.y >= 0.25 && this.poseParts.leftWrist.y <= 0.92 &&
        this.poseParts.rightWrist.y >= 0.25 && this.poseParts.rightWrist.y <= 0.92;
      if (poseWristsInTorso) {
        const pAnchor = this.poseParts.leftPalm || this.poseParts.leftWrist;
        if (!this.baseHand.detected) {
          this.baseHand.x = pAnchor.x;
          this.baseHand.y = pAnchor.y;
        } else {
          this.baseHand.x += (pAnchor.x - this.baseHand.x) * 0.25;
          this.baseHand.y += (pAnchor.y - this.baseHand.y) * 0.25;
        }
        this.baseHand.detected = true;
        this.baseHandUpdatedAt = now;
      } else if (this.baseHandUpdatedAt > 0 && (now - this.baseHandUpdatedAt) < 650) {
        this.baseHand.detected = true;
      } else {
        this.baseHand.detected = false;
      }
    }

    // Si MediaPipe Pose está fresco (< 400ms), ya tenemos rostro y torso con precisión exacta
    if (this.poseParts && (now - this.poseUpdatedAt < 400)) {
      return;
    }

    // 2. Fallback ligero de rostro/cabeza en el video cada 80ms (~12.5 FPS)
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
              handBoxes.push({ minX: minX - 0.05, maxX: maxX + 0.05, minY: minY - 0.05, maxY: maxY + 0.05 });
            }
          }

          let sumX = 0, sumY = 0, count = 0, minSkinX = 1, maxSkinX = 0;
          const maxRow = Math.floor(h * 0.62);
          const minRow = Math.floor(h * 0.04);

          for (let py = minRow; py < maxRow; py++) {
            const normY = py / h;
            for (let px = 4; px < w - 4; px++) {
              const normX = px / w;
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
              const r = imgData[idx], g = imgData[idx + 1], b = imgData[idx + 2];
              if (r > 60 && g > 40 && b > 20 && r > g && r > b && (r - g) > 12) {
                const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
                const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
                if (cb >= 75 && cb <= 135 && cr >= 130 && cr <= 178) {
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
        } catch (e) {}
      }
    }

    if (!faceFoundInVideo) {
      this.head.confidence = Math.max(0, this.head.confidence - 0.015);
      if (this.head.confidence < 0.15) {
        this.head.detected = false;
      }
    }
  }

  getAnchorPoint(anchorName, now = Date.now()) {
    const hasLivePose = !this.overrideState && this.poseParts && (now - this.poseUpdatedAt < 1200);
    if (hasLivePose) {
      const p = this.poseParts;
      switch (anchorName) {
        case 'temple':
          if (p.rightEar) return { x: p.rightEar.x, y: p.rightEar.y, zoneLabel: 'Sien Derecha (Pose)' };
          if (p.nose) return { x: p.nose.x - 0.08, y: p.nose.y - 0.02, zoneLabel: 'Sien Derecha (Pose)' };
          break;
        case 'chin':
          if (p.mouthMid) return { x: p.mouthMid.x, y: p.mouthMid.y, zoneLabel: 'Barbilla / Boca (Pose)' };
          break;
        case 'throat':
          if (p.shoulderMid && p.mouthMid) {
            return {
              x: p.shoulderMid.x * 0.7 + p.mouthMid.x * 0.3,
              y: p.shoulderMid.y * 0.7 + p.mouthMid.y * 0.3,
              zoneLabel: 'Garganta (Pose)'
            };
          }
          break;
        case 'left_shoulder':
          if (p.leftShoulder) return { x: p.leftShoulder.x, y: p.leftShoulder.y, zoneLabel: 'Hombro Izquierdo (Pose)' };
          break;
        case 'right_shoulder':
          if (p.rightShoulder) return { x: p.rightShoulder.x, y: p.rightShoulder.y, zoneLabel: 'Hombro Derecho (Pose)' };
          break;
        case 'base_hand_or_chest':
          if (this.baseHand.detected) {
            return { x: this.baseHand.x, y: this.baseHand.y, zoneLabel: 'Mano Base en Vivo' };
          }
          if (p.shoulderMid) {
            return {
              x: p.shoulderMid.x,
              y: Math.min(0.82, p.shoulderMid.y + p.shoulderWidth * 0.42),
              zoneLabel: 'Centro del Pecho (Pose)'
            };
          }
          break;
        case 'chest':
        default:
          if (p.shoulderMid) {
            return {
              x: p.shoulderMid.x,
              y: Math.min(0.82, p.shoulderMid.y + p.shoulderWidth * 0.42),
              zoneLabel: 'Centro del Pecho (Pose)'
            };
          }
          break;
      }
    }

    const isUserDetected = this.head.detected || this.baseHand.detected;
    const searchWaveX = isUserDetected ? Math.sin(now / 1100) * 0.005 : Math.sin(now / 650) * 0.038;
    const searchWaveY = isUserDetected ? Math.cos(now / 1300) * 0.004 : Math.cos(now / 850) * 0.022;

    const hx = this.head.x + searchWaveX;
    const hy = this.head.y + searchWaveY;
    const s = this.head.scale || 1.0;

    switch (anchorName) {
      case 'temple':
        return { x: hx - 0.10 * s, y: hy - 0.02 * s, zoneLabel: 'Sien Derecha' };
      case 'chin':
        return { x: hx, y: hy + 0.09 * s, zoneLabel: 'Barbilla / Boca' };
      case 'throat':
        return { x: hx, y: hy + 0.16 * s, zoneLabel: 'Garganta' };
      case 'left_shoulder':
        return { x: Math.min(0.90, hx + 0.17 * s), y: Math.min(0.75, hy + 0.25 * s), zoneLabel: 'Hombro Izquierdo' };
      case 'right_shoulder':
        return { x: Math.max(0.10, hx - 0.17 * s), y: Math.min(0.75, hy + 0.25 * s), zoneLabel: 'Hombro Derecho' };
      case 'base_hand_or_chest':
        if (this.baseHand.detected) {
          return { x: this.baseHand.x, y: this.baseHand.y, zoneLabel: 'Mano Base en Vivo' };
        }
        return { x: hx, y: Math.min(0.78, hy + 0.34 * s), zoneLabel: 'Centro del Pecho' };
      case 'chest':
      default:
        return { x: hx, y: Math.min(0.78, hy + 0.34 * s), zoneLabel: 'Centro del Pecho' };
    }
  }
}

if (typeof window !== 'undefined') {
  window.BodyAnchorDetector = BodyAnchorDetector;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BodyAnchorDetector;
}
