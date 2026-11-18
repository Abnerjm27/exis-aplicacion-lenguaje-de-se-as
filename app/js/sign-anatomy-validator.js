/**
 * LSC Learn · Proyecto EXIS
 * sign-anatomy-validator.js - Validador Anatómico y Biomecánico POO (Regla 8)
 * Verifica que la configuración de dedos, orientación de antebrazos, bimanualidad
 * y ubicación respecto a las partes del cuerpo coincidan con el dataset LSC70
 * antes de permitir el avance de puntos o la aprobación de una seña.
 */

class SignAnatomyValidator {
  constructor() {
    this._initialized = false;
    this._lastResult = null;
  }

  init() {
    this._initialized = true;
    this._lastResult = null;
  }

  start() {
    if (!this._initialized) this.init();
  }

  update() {
    return this._lastResult;
  }

  reset() {
    this._lastResult = null;
  }

  destroy() {
    this._initialized = false;
    this._lastResult = null;
  }

  _dist(p1, p2) {
    if (!p1 || !p2) return Infinity;
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
  }

  /**
   * Extrae descriptores anatómicos inmutables de una mano (21 landmarks MediaPipe)
   */
  analyzeHand(lm) {
    if (!lm || lm.length < 21) return null;
    const wrist = lm[0];
    const dist = (a, b) => this._dist(a, b);

    const isIndexCurled = dist(lm[8], wrist) < dist(lm[6], wrist) * 1.05;
    const isMiddleCurled = dist(lm[12], wrist) < dist(lm[10], wrist) * 1.05;
    const isRingCurled = dist(lm[16], wrist) < dist(lm[14], wrist) * 1.05;
    const isPinkyCurled = dist(lm[20], wrist) < dist(lm[18], wrist) * 1.05;

    const isIndexExt = !isIndexCurled;
    const isMiddleExt = !isMiddleCurled;
    const isRingExt = !isRingCurled;
    const isPinkyExt = !isPinkyCurled;

    const thumbDistToMcp = dist(lm[4], lm[5]);
    const palmScale = Math.max(0.05, dist(lm[0], lm[9]));
    const isThumbExt = (thumbDistToMcp / palmScale) > 0.62 || (dist(lm[4], wrist) > dist(lm[2], wrist) * 1.12);

    const extCount4 = (isIndexExt ? 1 : 0) + (isMiddleExt ? 1 : 0) + (isRingExt ? 1 : 0) + (isPinkyExt ? 1 : 0);
    const extCount5 = extCount4 + (isThumbExt ? 1 : 0);

    const palmCenter = {
      x: (lm[0].x + lm[5].x + lm[9].x + lm[17].x) / 4,
      y: (lm[0].y + lm[5].y + lm[9].y + lm[17].y) / 4
    };

    const dx = lm[9].x - wrist.x;
    const dy = lm[9].y - wrist.y;
    const handSpan = Math.hypot(dx, dy);
    // Orientación horizontal de mano/antebrazo (crucial para TARDES y NOCHES)
    const isHorizontal = handSpan > 0.01 ? (Math.abs(dx) >= Math.abs(dy) * 0.80) : false;
    const isVerticalUp = handSpan > 0.01 ? (dy < -0.015 && Math.abs(dy) > Math.abs(dx) * 0.65) : false;

    const idxPinchRatio = dist(lm[4], lm[8]) / palmScale;
    const midPinchRatio = dist(lm[4], lm[12]) / palmScale;
    const ringPinchRatio = dist(lm[4], lm[16]) / palmScale;
    const pinkyPinchRatio = dist(lm[4], lm[20]) / palmScale;
    const apertureHoleRatio = dist(lm[6], lm[2]) / palmScale;
    const thumbToIdxPipRatio = dist(lm[4], lm[6]) / palmScale;
    const thumbToIdxMcpRatio = thumbDistToMcp / palmScale;
    const idxSpanRatio = dist(lm[8], wrist) / palmScale;
    const midSpanRatio = dist(lm[12], wrist) / palmScale;
    const ringSpanRatio = dist(lm[16], wrist) / palmScale;
    const pinkySpanRatio = dist(lm[20], wrist) / palmScale;
    const idxTipToMcpRatio = dist(lm[8], lm[5]) / palmScale;
    const idxMidSpreadRatio = dist(lm[8], lm[12]) / palmScale;
    const thumbDistToWristRatio = dist(lm[4], wrist) / Math.max(0.03, dist(lm[2], wrist));

    return {
      wrist,
      palmCenter,
      middleMcp: lm[9],
      middlePip: lm[10],
      ringPip: lm[14],
      thumbTip: lm[4],
      thumbCmc: lm[2],
      indexMcp: lm[5],
      indexPip: lm[6],
      indexTip: lm[8],
      middleTip: lm[12],
      ringTip: lm[16],
      pinkyTip: lm[20],
      palmScale,
      idxPinchRatio,
      midPinchRatio,
      ringPinchRatio,
      pinkyPinchRatio,
      apertureHoleRatio,
      thumbToIdxPipRatio,
      thumbToIdxMcpRatio,
      idxSpanRatio,
      midSpanRatio,
      ringSpanRatio,
      pinkySpanRatio,
      idxTipToMcpRatio,
      idxMidSpreadRatio,
      thumbDistToWristRatio,
      isThumbExt,
      isIndexExt,
      isMiddleExt,
      isRingExt,
      isPinkyExt,
      isIndexCurled,
      isMiddleCurled,
      isRingCurled,
      isPinkyCurled,
      extCount4,
      extCount5,
      forearmVec: { dx, dy },
      handSpan,
      isHorizontal,
      isVerticalUp
    };
  }

  /**
   * Construye descriptores sintéticos de manos a partir de MediaPipe Pose cuando las manos quedan ocluidas
   */
  _buildPoseHands(pose) {
    if (!pose) return [];
    const buildOne = (wrist, elbow, palm, index, thumb, pinky) => {
      if (!wrist) return null;
      const dx = elbow ? (wrist.x - elbow.x) : 0.10;
      const dy = elbow ? (wrist.y - elbow.y) : -0.02;
      const handSpan = Math.hypot(dx, dy);
      const isHorizontal = handSpan > 0.01 ? (Math.abs(dx) >= Math.abs(dy) * 0.65) : false;
      const isVerticalUp = handSpan > 0.01 ? (dy < -0.015 && Math.abs(dy) > Math.abs(dx) * 0.65) : false;
      const palmCenter = palm || { x: wrist.x, y: wrist.y };
      return {
        fromPose: true,
        wrist,
        palmCenter,
        middleMcp: palmCenter,
        thumbTip: thumb || palmCenter,
        indexTip: index || palmCenter,
        middleTip: index || palmCenter,
        pinkyTip: pinky || palmCenter,
        isThumbExt: true,
        isIndexExt: true,
        isMiddleExt: true,
        isRingExt: true,
        isPinkyExt: true,
        isIndexCurled: false,
        isMiddleCurled: false,
        isRingCurled: false,
        isPinkyCurled: false,
        extCount4: 4,
        extCount5: 5,
        forearmVec: { dx, dy },
        handSpan,
        isHorizontal,
        isVerticalUp
      };
    };
    return [
      buildOne(pose.rightWrist, pose.rightElbow, pose.rightPalm, pose.rightIndex, pose.rightThumb, pose.rightPinky),
      buildOne(pose.leftWrist, pose.leftElbow, pose.leftPalm, pose.leftIndex, pose.leftThumb, pose.leftPinky)
    ].filter(Boolean);
  }

  /**
   * Valida la seña completa respecto a postura anatómica y partes del cuerpo
   * @param {string} signId
   * @param {Array} multiLandmarks
   * @param {Object} bodyAnchors - Anclajes corporales reales { head, temple, chin, throat, chest, pose }
   * @param {number|null} pointIndex - Índice del waypoint actual (null = evaluación global)
   */
  validateSign(signId, multiLandmarks, bodyAnchors = null, pointIndex = null) {
    let h1 = null;
    let h2 = null;

    if (multiLandmarks && multiLandmarks.length > 0) {
      h1 = this.analyzeHand(multiLandmarks[0]);
      h2 = multiLandmarks.length > 1 ? this.analyzeHand(multiLandmarks[1]) : null;
    }

    // Fallback corporal directo con MediaPipe Pose cuando Hands pierde 1 o ambas manos por cruce/movimiento rápido
    const poseHands = bodyAnchors?.pose ? this._buildPoseHands(bodyAnchors.pose) : [];
    if (!h1 && poseHands.length > 0) {
      h1 = poseHands[0];
      h2 = poseHands.length > 1 ? poseHands[1] : null;
    }

    if (!h1) {
      return { valid: false, score: 0, hint: 'Coloca tus manos frente a la cámara', diag: 'Sin manos detectadas' };
    }

    const chinY = bodyAnchors?.chin?.y ?? 0.37;
    const throatY = bodyAnchors?.throat?.y ?? 0.44;
    const chestY = bodyAnchors?.chest?.y ?? 0.62;
    const temple = bodyAnchors?.temple ?? { x: 0.40, y: 0.26 };
    const chin = bodyAnchors?.chin ?? { x: 0.50, y: 0.37 };
    const throat = bodyAnchors?.throat ?? { x: 0.50, y: 0.44 };
    const chest = bodyAnchors?.chest ?? { x: 0.50, y: 0.62 };
    const pose = bodyAnchors?.pose || null;

    let result;
    switch (signId) {
      case 'TARDES':
      case 'NOCHES':
        result = this._validateCrossedChest(signId, h1, h2, chinY, chestY, pose, pointIndex);
        break;
      case 'BUENOS':
        result = this._validateBuenos(h1, h2, chestY, pointIndex, bodyAnchors);
        break;
      case 'DIAS':
        result = this._validateDias(h1, h2, chinY, chestY, pointIndex, pose);
        break;
      case 'NOMBRE':
        result = this._validateNombre(h1, h2, chestY, pointIndex, pose);
        break;
      case 'ANNOS':
        result = this._validateAnnos(h1, h2, chinY, chestY, pose);
        break;
      case 'HOLA':
        result = this._validateHola(h1, temple, chinY, pointIndex);
        break;
      case 'YO':
        result = this._validateYo(h1, chinY, chest, pointIndex);
        break;
      case 'GUSTAR':
        result = this._validateGustar(h1, throat, chestY);
        break;
      case 'LICOR':
        result = this._validateLicor(h1, chin, chestY, pointIndex);
        break;
      case 'A':
      case 'B':
      case 'C':
      case 'D':
      case 'E':
      case 'I':
      case 'L':
      case 'O':
      case 'U':
      case 'V':
        result = this.validateLetter(signId, h1, bodyAnchors);
        break;
      default:
        result = { valid: true, score: 85, hint: 'Postura válida', diag: '✓ Postura correcta' };
        break;
    }

    this._lastResult = result;
    return result;
  }

  validateWaypoint(signId, pointIndex, multiLandmarks, bodyAnchors = null) {
    return this.validateSign(signId, multiLandmarks, bodyAnchors, pointIndex);
  }

  _validateCrossedChest(signId, h1, h2, chinY, chestY, pose = null, pointIndex = null) {
    const label = signId === 'TARDES' ? 'TARDES' : 'NOCHES';
    const minChestY = Math.max(0.22, chinY + 0.02);
    const maxChestY = Math.min(0.94, chestY + 0.30);

    // En el punto 0 ("Inicio") permitir iniciar con 1 o 2 brazos a la altura del pecho antes de cruzar
    if (pointIndex === 0) {
      const atChest = h1.wrist.y >= minChestY && h1.wrist.y <= maxChestY;
      if (!atChest) {
        return {
          valid: false,
          score: 54,
          hint: 'Coloca tus antebrazos a la altura del pecho para iniciar el cruce',
          diag: '⚠️ Sube los brazos al pecho'
        };
      }
      return {
        valid: true,
        score: 85,
        hint: `Ahora cruza ambos antebrazos frente al pecho (${label})`,
        diag: '✓ Inicio en pecho listo, cruza brazos'
      };
    }

    // Evaluar MediaPipe Pose primero (funciona incluso si Hands solo ve 1 o 0 manos al cruzar los brazos)
    let hasPoseArms = false;
    let poseCrossed = false;
    let poseForearmsHorizontal = false;
    let poseAtChest = false;
    if (pose && pose.leftElbow && pose.rightElbow && pose.leftWrist && pose.rightWrist) {
      hasPoseArms = true;
      const lDx = pose.leftWrist.x - pose.leftElbow.x;
      const lDy = pose.leftWrist.y - pose.leftElbow.y;
      const rDx = pose.rightWrist.x - pose.rightElbow.x;
      const rDy = pose.rightWrist.y - pose.rightElbow.y;
      poseForearmsHorizontal = Math.abs(lDx) >= Math.abs(lDy) * 0.65 && Math.abs(rDx) >= Math.abs(rDy) * 0.65;
      poseCrossed = (lDx * rDx < 0) || (this._dist(pose.leftWrist, pose.rightWrist) < 0.34);
      poseAtChest = pose.leftWrist.y >= minChestY && pose.leftWrist.y <= maxChestY &&
        pose.rightWrist.y >= minChestY && pose.rightWrist.y <= maxChestY &&
        Math.abs(pose.leftWrist.y - pose.rightWrist.y) <= 0.25;
    }

    if (!h2) {
      if (hasPoseArms) {
        if (!poseAtChest) {
          return {
            valid: false,
            score: 52,
            hint: 'Ubica ambos antebrazos a la altura de tu pecho',
            diag: '⚠️ Lleva ambos brazos al pecho (Pose)'
          };
        }
        if (!poseForearmsHorizontal) {
          return {
            valid: false,
            score: 55,
            hint: 'Coloca ambos antebrazos en posición horizontal frente al pecho',
            diag: '⚠️ Antebrazos horizontales (Pose)'
          };
        }
        if (!poseCrossed) {
          return {
            valid: false,
            score: 58,
            hint: 'Cruza un antebrazo frente al otro sobre el pecho',
            diag: '⚠️ Cruza ambos antebrazos (Pose)'
          };
        }
        if (label === 'TARDES' && !h1.fromPose && h1.extCount4 < 2) {
          return {
            valid: false,
            score: 58,
            hint: 'Mantén las manos extendidas al cruzar los brazos (TARDES)',
            diag: '⚠️ Extiende los dedos al cruzar'
          };
        }
        return {
          valid: true,
          score: 96,
          hint: `¡Excelente seña de ${label}! Antebrazos cruzados detectados por Pose`,
          diag: `✓ ${label}: Antebrazos cruzados en pecho (Pose)`
        };
      }
      return {
        valid: false,
        score: 42,
        hint: `Muestra AMBAS manos cruzando los antebrazos frente al pecho (${label})`,
        diag: `⚠️ Se requieren 2 manos cruzadas en el pecho`
      };
    }

    const h1AtChest = h1.wrist.y >= minChestY && h1.wrist.y <= maxChestY;
    const h2AtChest = h2.wrist.y >= minChestY && h2.wrist.y <= maxChestY;
    const atChestOk = (h1AtChest && h2AtChest) || (hasPoseArms && poseAtChest);

    if (!atChestOk) {
      return {
        valid: false,
        score: 52,
        hint: 'Ubica ambos antebrazos a la altura de tu pecho (no en la cara ni abajo)',
        diag: '⚠️ Lleva ambas manos a la zona del pecho'
      };
    }

    const yDiff = Math.abs(h1.wrist.y - h2.wrist.y);
    if (yDiff > 0.24 && !(hasPoseArms && poseAtChest)) {
      return {
        valid: false,
        score: 56,
        hint: 'Alinea ambos antebrazos horizontalmente a la misma altura en el pecho',
        diag: '⚠️ Alinea ambos brazos horizontalmente'
      };
    }

    // Verificar orientación horizontal de antebrazos/manos (evitar manos verticales apuntando arriba)
    const armsHorizontal = hasPoseArms ? poseForearmsHorizontal : (h1.isHorizontal && h2.isHorizontal);
    if (!armsHorizontal) {
      return {
        valid: false,
        score: 55,
        hint: 'Coloca tus antebrazos y manos en posición horizontal frente al pecho',
        diag: '⚠️ Antebrazos deben estar horizontales'
      };
    }

    // Verificar cruce real: vectores horizontales opuestos (Pose o Hands) o palmas/muñecas cruzadas cerca del centro
    const oppositeDirs = (h1.forearmVec.dx * h2.forearmVec.dx) < 0;
    const wristsClose = Math.abs(h1.wrist.x - h2.wrist.x) < 0.42;
    const palmsClose = this._dist(h1.palmCenter, h2.palmCenter) < 0.28;
    const isCrossed = hasPoseArms ? poseCrossed : ((oppositeDirs && wristsClose) || palmsClose);

    if (!isCrossed) {
      return {
        valid: false,
        score: 58,
        hint: 'Cruza un antebrazo frente al otro sobre el pecho',
        diag: '⚠️ Cruza ambos antebrazos en el centro'
      };
    }

    // Para TARDES exigir dedos extendidos/relajados en manos reales; NOCHES permite puños (dataset NOCHES.jpg)
    if (label === 'TARDES' && ((!h1.fromPose && h1.extCount4 < 2) || (!h2.fromPose && h2.extCount4 < 2))) {
      return {
        valid: false,
        score: 58,
        hint: 'Mantén las manos extendidas/relajadas (no empuñadas) al cruzar los brazos',
        diag: '⚠️ Extiende los dedos al cruzar'
      };
    }

    return {
      valid: true,
      score: 96,
      hint: `¡Excelente seña de ${label}! Antebrazos cruzados horizontalmente en el pecho`,
      diag: `✓ ${label}: Antebrazos cruzados en pecho`
    };
  }

  _validateBuenos(h1, h2, chestY, pointIndex, bodyAnchors = null) {
    if (!h1.fromPose && h1.extCount4 < 3 && (!h2 || h2.extCount4 < 3)) {
      return {
        valid: false,
        score: 48,
        hint: 'Abre la mano derecha extendiendo los dedos para saludar',
        diag: '⚠️ Abre la mano (dedos extendidos)'
      };
    }

    // En el punto inicial (Arriba) basta la mano activa abierta sobre el pecho
    if (pointIndex === 0) {
      return {
        valid: true,
        score: 84,
        hint: 'Ahora desciende la mano derecha sobre tu mano base en el pecho',
        diag: '✓ Mano abierta arriba, desciende al pecho'
      };
    }

    const pose = bodyAnchors?.pose || null;
    if (!h2) {
      // Soportar oclusión al tocarse las palmas usando retención de mano base o MediaPipe Pose
      const poseWristsNear = pose && pose.leftWrist && pose.rightWrist &&
        pose.leftWrist.y >= 0.30 && pose.rightWrist.y >= 0.30 &&
        this._dist(pose.leftWrist, pose.rightWrist) < 0.36;
      if (bodyAnchors?.baseHandDetected || poseWristsNear) {
        return {
          valid: true,
          score: 94,
          hint: '¡Excelente seña de BUENOS! Palma apoyada sobre la mano base en el pecho',
          diag: '✓ BUENOS: Contacto de palmas en pecho (Pose)'
        };
      }
      return {
        valid: false,
        score: 54,
        hint: 'Coloca tu mano izquierda abierta como base en el pecho y baja la derecha encima',
        diag: '⚠️ Falta la mano base en el pecho'
      };
    }

    const palmsNear = this._dist(h1.palmCenter, h2.palmCenter) < 0.32;
    const atChest = h1.wrist.y >= 0.28 && h2.wrist.y >= 0.28 && Math.min(Math.abs(h1.wrist.y - chestY), Math.abs(h2.wrist.y - chestY)) <= 0.30;
    if ((!h1.fromPose && h1.extCount4 < 2) || (!h2.fromPose && h2.extCount4 < 2) || !atChest) {
      return {
        valid: false,
        score: 58,
        hint: 'Sostén tu mano base abierta a la altura del pecho',
        diag: '⚠️ Mano base abierta en el pecho'
      };
    }

    if (!palmsNear) {
      return {
        valid: false,
        score: 68,
        hint: 'Acerca y apoya la palma derecha sobre tu mano izquierda base',
        diag: '⚠️ Junta ambas palmas en el pecho'
      };
    }

    return {
      valid: true,
      score: 96,
      hint: '¡Excelente seña de BUENOS! Palma apoyada sobre la mano base en el pecho',
      diag: '✓ BUENOS: Contacto de palmas en pecho'
    };
  }

  _validateDias(h1, h2, chinY, chestY, pointIndex, pose = null) {
    if (!h1.fromPose && h1.extCount5 < 4) {
      return {
        valid: false,
        score: 50,
        hint: 'Abre bien los 5 dedos de tus manos con las palmas hacia el frente',
        diag: '⚠️ Abre todos los dedos'
      };
    }

    const minY = Math.max(0.18, chinY - 0.05);
    const maxY = Math.min(0.92, chestY + 0.28);
    const inTorsoBand = h1.wrist.y >= minY && h1.wrist.y <= maxY;
    if (!inTorsoBand) {
      return {
        valid: false,
        score: 58,
        hint: 'Ubica ambas manos a la altura del pecho y hombros',
        diag: '⚠️ Sube las manos al pecho/hombros'
      };
    }

    if (pointIndex === 0) {
      return {
        valid: true,
        score: 84,
        hint: 'Ahora abre ambos brazos hacia los lados simulando el amanecer',
        diag: '✓ Inicio en pecho, abre brazos lateralmente'
      };
    }

    if (!h2) {
      const poseOpenArms = pose && pose.leftWrist && pose.rightWrist &&
        pose.leftWrist.y >= minY && pose.leftWrist.y <= maxY &&
        pose.rightWrist.y >= minY && pose.rightWrist.y <= maxY &&
        Math.abs(pose.leftWrist.x - pose.rightWrist.x) >= 0.22;
      if (poseOpenArms) {
        return {
          valid: true,
          score: 95,
          hint: '¡Excelente seña de DÍAS! Ambos brazos abiertos detectados por Pose',
          diag: '✓ DÍAS: Brazos abiertos al frente (Pose)'
        };
      }
      return {
        valid: false,
        score: 55,
        hint: 'Muestra ambas manos abiertas abriéndose hacia los lados (amanecer)',
        diag: '⚠️ Se requieren ambas manos abiertas'
      };
    }

    if (!h2.fromPose && h2.extCount4 < 3) {
      return {
        valid: false,
        score: 58,
        hint: 'Abre bien los dedos de ambas manos hacia el frente',
        diag: '⚠️ Abre ambas manos'
      };
    }

    const xSpread = Math.abs(h1.wrist.x - h2.wrist.x);
    const poseSpread = (pose && pose.leftWrist && pose.rightWrist) ? Math.abs(pose.leftWrist.x - pose.rightWrist.x) : 0;
    if (pointIndex === 1 && Math.max(xSpread, poseSpread) < 0.18) {
      return {
        valid: false,
        score: 68,
        hint: 'Separa ambos brazos hacia afuera simulando el amanecer',
        diag: '⚠️ Abre los brazos hacia los lados'
      };
    }

    return {
      valid: true,
      score: 96,
      hint: '¡Excelente seña de DÍAS! Palmas abiertas al frente como el amanecer',
      diag: '✓ DÍAS: Ambas manos abiertas al frente'
    };
  }

  _validateNombre(h1, h2, chestY, pointIndex, pose = null) {
    const twoFingers1 = !h1.fromPose && h1.isIndexExt && h1.isMiddleExt && h1.isRingCurled && h1.isPinkyCurled;
    if (!twoFingers1) {
      return {
        valid: false,
        score: 48,
        hint: 'Extiende únicamente índice y medio (cierra anular y meñique)',
        diag: '⚠️ Extiende solo índice y medio'
      };
    }

    const atChest = Math.abs(h1.wrist.y - chestY) <= 0.30 && h1.wrist.y >= 0.25;
    if (!atChest) {
      return {
        valid: false,
        score: 58,
        hint: 'Ubica ambas manos frente a tu pecho',
        diag: '⚠️ Lleva las manos al pecho'
      };
    }

    if (pointIndex === 0) {
      return {
        valid: true,
        score: 84,
        hint: 'Ahora junta los dedos índice y medio de ambas manos en el pecho',
        diag: '✓ Dedos listos, apoya sobre tu otra mano'
      };
    }

    if (!h2) {
      const poseHandsNear = pose && pose.leftWrist && pose.rightWrist &&
        this._dist(pose.leftWrist, pose.rightWrist) <= 0.34;
      if (poseHandsNear) {
        return {
          valid: true,
          score: 92,
          hint: '¡Excelente seña de NOMBRE! Dedos apoyados frente al pecho',
          diag: '✓ NOMBRE: 2 dedos superpuestos (Pose)'
        };
      }
      return {
        valid: false,
        score: 55,
        hint: 'Usa ambas manos con índice y medio extendidos frente al pecho',
        diag: '⚠️ Falta la segunda mano (2 dedos)'
      };
    }

    const twoFingers2 = h2.isIndexExt && h2.isMiddleExt && h2.isRingCurled;
    if (!twoFingers2) {
      return {
        valid: false,
        score: 58,
        hint: 'Extiende índice y medio también en tu mano base',
        diag: '⚠️ Mano base: solo índice y medio'
      };
    }

    if (pointIndex === 1 && this._dist(h1.indexTip, h2.indexTip) > 0.28 && this._dist(h1.wrist, h2.wrist) > 0.38) {
      return {
        valid: false,
        score: 68,
        hint: 'Apoya los dedos índice y medio de una mano sobre los de la otra',
        diag: '⚠️ Junta los dedos en el pecho'
      };
    }

    return {
      valid: true,
      score: 96,
      hint: '¡Excelente seña de NOMBRE! Índice y medio cruzados frente al pecho',
      diag: '✓ NOMBRE: 2 dedos superpuestos en pecho'
    };
  }

  _validateAnnos(h1, h2, chinY, chestY, pose = null) {
    const minTorsoY = Math.max(0.30, chinY + 0.03);
    if (!h2) {
      const poseBothTorso = pose && pose.leftWrist && pose.rightWrist &&
        pose.leftWrist.y >= minTorsoY && pose.rightWrist.y >= minTorsoY &&
        pose.leftWrist.y <= 0.95 && pose.rightWrist.y <= 0.95 &&
        this._dist(pose.leftWrist, pose.rightWrist) <= 0.42;
      if (poseBothTorso) {
        return {
          valid: true,
          score: 94,
          hint: '¡Excelente seña de AÑOS! Ambos puños/muñecas en el torso',
          diag: '✓ AÑOS: Ambas manos en torso (Pose)'
        };
      }
      return {
        valid: false,
        score: 52,
        hint: 'Coloca ambas manos frente a tu torso para el movimiento circular de AÑOS',
        diag: '⚠️ Se requieren ambas manos en torso'
      };
    }

    const bothAtTorso = h1.wrist.y >= minTorsoY && h2.wrist.y >= minTorsoY && h1.wrist.y <= 0.95 && h2.wrist.y <= 0.95;
    if (!bothAtTorso) {
      return {
        valid: false,
        score: 56,
        hint: 'Baja ambas manos a la altura del pecho/torso',
        diag: '⚠️ Ubica manos en el torso'
      };
    }

    if (this._dist(h1.wrist, h2.wrist) > 0.42) {
      return {
        valid: false,
        score: 58,
        hint: 'Acerca ambas manos frente al pecho para girar una sobre la otra',
        diag: '⚠️ Acerca ambas manos en el pecho'
      };
    }

    return {
      valid: true,
      score: 95,
      hint: '¡Excelente seña de AÑOS! Movimiento circular frente al torso',
      diag: '✓ AÑOS: Ambas manos en torso'
    };
  }

  _validateHola(h1, temple, chinY, pointIndex) {
    if (h1.extCount5 < 4) {
      return {
        valid: false,
        score: 50,
        hint: 'Abre bien la mano con los dedos extendidos para saludar',
        diag: '⚠️ Abre la mano completamente'
      };
    }

    if (h1.wrist.y > chinY + 0.22) {
      return {
        valid: false,
        score: 56,
        hint: 'Eleva tu mano a la altura de la sien/cabeza',
        diag: '⚠️ Sube la mano hacia tu sien'
      };
    }

    if (pointIndex === 0 && this._dist(h1.wrist, temple) > 0.26) {
      return {
        valid: false,
        score: 65,
        hint: 'Inicia colocando tu mano abierta junto a la sien',
        diag: '⚠️ Acerca la mano a tu sien'
      };
    }

    return {
      valid: true,
      score: 95,
      hint: '¡Excelente saludo de HOLA desde la sien!',
      diag: '✓ HOLA: Mano abierta en sien'
    };
  }

  _validateYo(h1, chinY, chest, pointIndex) {
    const closedOthers = (h1.isMiddleCurled ? 1 : 0) + (h1.isRingCurled ? 1 : 0) + (h1.isPinkyCurled ? 1 : 0);
    if (closedOthers < 2 || (!h1.isIndexExt && this._dist(h1.indexTip, h1.wrist) <= this._dist(h1.middleTip, h1.wrist))) {
      return {
        valid: false,
        score: 48,
        hint: 'Cierra medio, anular y meñique; apunta solo con el índice hacia tu pecho',
        diag: '⚠️ Solo el índice extendido'
      };
    }

    if (h1.wrist.y < Math.max(0.20, chinY - 0.05) || h1.wrist.y > 0.90) {
      return {
        valid: false,
        score: 58,
        hint: 'Ubica tu mano a la altura del pecho',
        diag: '⚠️ Lleva el índice al pecho'
      };
    }

    if (pointIndex === 1 && this._dist(h1.indexTip, chest) > 0.26) {
      return {
        valid: false,
        score: 70,
        hint: 'Apunta la yema del índice hacia el centro de tu pecho',
        diag: '⚠️ Apunta al centro del pecho'
      };
    }

    return {
      valid: true,
      score: 95,
      hint: '¡Excelente seña de YO! Índice apuntando a tu pecho',
      diag: '✓ YO: Índice en pecho'
    };
  }

  _validateGustar(h1, throat, chestY) {
    const isPointing = h1.isIndexExt && (h1.isRingCurled || h1.isPinkyCurled);
    if (!isPointing) {
      return {
        valid: false,
        score: 48,
        hint: 'Extiende únicamente tu dedo índice hacia arriba y cierra los demás dedos',
        diag: '⚠️ Extiende solo el dedo índice'
      };
    }

    if (h1.indexTip.y > chestY - 0.04) {
      return {
        valid: false,
        score: 58,
        hint: 'Sube tu dedo índice hacia la garganta / cuello',
        diag: '⚠️ Sube el índice a tu garganta'
      };
    }

    if (this._dist(h1.indexTip, throat) > 0.28) {
      return {
        valid: false,
        score: 65,
        hint: 'Acerca el dedo índice al centro de tu garganta',
        diag: '⚠️ Alinea el índice con tu garganta'
      };
    }

    return {
      valid: true,
      score: 96,
      hint: '¡Excelente seña de GUSTAR! Índice deslizándose en la garganta',
      diag: '✓ GUSTAR: Índice en garganta'
    };
  }

  _validateLicor(h1, chin, chestY, pointIndex) {
    const isAllFlatOpen = h1.isIndexExt && h1.isMiddleExt && h1.isRingExt && h1.isPinkyExt;
    const isCupOrY = h1.isThumbExt && !isAllFlatOpen && (h1.isPinkyExt || !h1.isMiddleExt || this._dist(h1.thumbTip, h1.pinkyTip) > 0.14);
    const isHookedIndex = !h1.fromPose && !isAllFlatOpen &&
      (h1.isIndexExt || this._dist(h1.indexTip, h1.wrist) > this._dist(h1.middleTip, h1.wrist) * 1.05) &&
      h1.isRingCurled && h1.isPinkyCurled;

    if (!isCupOrY && !isHookedIndex) {
      return {
        valid: false,
        score: 50,
        hint: 'Forma un gancho con el índice cerca de la nariz/boca o copa/Y con pulgar y meñique',
        diag: '⚠️ Índice en gancho o copa/Y'
      };
    }

    const activeTipY = isHookedIndex ? h1.indexTip.y : Math.min(h1.thumbTip.y, h1.indexTip.y);
    const chinDist = isHookedIndex
      ? this._dist(h1.indexTip, chin)
      : Math.min(this._dist(h1.thumbTip, chin), this._dist(h1.indexTip, chin));

    if (pointIndex === 1 && (activeTipY > chestY + 0.04 || chinDist > 0.30)) {
      return {
        valid: false,
        score: 62,
        hint: 'Eleva tu mano frente a la nariz / barbilla y boca',
        diag: '⚠️ Acerca la mano a la barbilla/nariz'
      };
    }

    return {
      valid: true,
      score: 95,
      hint: '¡Excelente seña de LICOR! Mano frente al rostro/barbilla',
      diag: '✓ LICOR: Índice/copa frente al rostro'
    };
  }

  _pass(score, hint, diag) {
    return { valid: true, score, hint, diag };
  }

  _fail(score, hint, diag) {
    return { valid: false, score, hint, diag };
  }

  /**
   * Valida letras estáticas del alfabeto LSC70 con métricas invariantes a la escala de palma
   */
  validateLetter(signId, handInput, bodyAnchors = null) {
    const h = Array.isArray(handInput) ? this.analyzeHand(handInput) : handInput;
    if (!h || h.fromPose) {
      return this._fail(0, 'Acerca tu mano a la cámara para leer la forma exacta de los dedos', 'Acerca tu mano a la cámara');
    }

    const chestY = bodyAnchors?.chest?.y ?? null;
    if (signId === 'O') return this._validateLetterO(h, chestY);
    if (signId === 'C') return this._validateLetterC(h);
    if (signId === 'D') return this._validateLetterD(h);
    if (signId === 'E') return this._validateLetterE(h, chestY);
    if (signId === 'A') return this._validateLetterA(h);

    const staticRules = {
      B: {
        ok: h.isIndexExt && h.isMiddleExt && h.isRingExt && h.isPinkyExt && (!h.isThumbExt || h.thumbToIdxMcpRatio < 0.72),
        score: (!h.isThumbExt || h.thumbToIdxMcpRatio < 0.72) ? (h.extCount4 * 20) : 65,
        okHint: '¡Letra B perfecta! 4 dedos rectos y pulgar plegado',
        okDiag: '✓ Letra B detectada',
        failHint: (!h.isThumbExt || h.thumbToIdxMcpRatio < 0.72) ? 'Extiende los 4 dedos rectos y juntos hacia arriba' : 'Pliega el pulgar hacia el centro de la palma',
        failDiag: '⚠️ 4 dedos arriba y pulgar en palma'
      },
      L: {
        ok: h.isThumbExt && h.isIndexExt && h.isMiddleCurled && h.isRingCurled && h.isPinkyCurled && h.idxPinchRatio >= 0.85,
        score: (h.isThumbExt ? 40 : 0) + (h.isIndexExt ? 40 : 0),
        okHint: '¡Letra L perfecta! Pulgar e índice en ángulo recto',
        okDiag: '✓ Letra L detectada',
        failHint: 'Extiende únicamente índice y pulgar formando 90°',
        failDiag: '⚠️ Forma una L recta (90°)'
      },
      V: {
        ok: h.isIndexExt && h.isMiddleExt && h.isRingCurled && h.isPinkyCurled && h.idxMidSpreadRatio >= 0.25,
        score: (h.isIndexExt ? 38 : 0) + (h.isMiddleExt ? 38 : 0),
        okHint: '¡Letra V perfecta! Índice y medio abiertos en V',
        okDiag: '✓ Letra V detectada',
        failHint: 'Levanta y separa índice y medio en V (anular y meñique cerrados)',
        failDiag: '⚠️ Dedos en V separados'
      },
      I: {
        ok: h.isPinkyExt && h.isIndexCurled && h.isMiddleCurled && h.isRingCurled,
        score: h.isPinkyExt ? 75 : 45,
        okHint: '¡Letra I perfecta! Meñique erguido y puño cerrado',
        okDiag: '✓ Letra I detectada',
        failHint: h.isPinkyExt ? 'Cierra completamente índice, medio y anular en puño' : 'Extiende únicamente tu dedo meñique hacia arriba',
        failDiag: '⚠️ Solo meñique erguido (I)'
      },
      U: {
        ok: h.isIndexExt && h.isPinkyExt && (h.isMiddleCurled || h.midSpanRatio < 1.35) && (h.isRingCurled || h.ringSpanRatio < 1.35),
        score: (h.isIndexExt && h.isPinkyExt) ? 72 : 55,
        okHint: '¡Letra U (LSC70) perfecta! Índice y meñique extendidos hacia arriba',
        okDiag: '✓ Letra U (LSC70) detectada',
        failHint: 'En LSC, la U levanta índice y meñique con medio y anular cerrados',
        failDiag: '⚠️ Índice y meñique arriba (U LSC)'
      }
    };

    const rule = staticRules[signId];
    if (!rule) return this._pass(85, 'Postura válida', '✓ Postura correcta');
    return rule.ok
      ? this._pass(96, rule.okHint, rule.okDiag)
      : this._fail(rule.score, rule.failHint, rule.failDiag);
  }

  _validateLetterO(h, chestY) {
    if (h.isIndexExt || h.isMiddleExt) {
      return this._fail(48, 'Curva los 4 dedos hasta tocar la punta del pulgar formando una O redonda', '⚠️ Curva los dedos hacia el pulgar (O)');
    }
    if (h.idxPinchRatio > 0.42 && h.idxPinchRatio < 1.35) {
      return this._fail(62, 'Estás haciendo una C abierta: junta y toca la punta del índice y medio con el pulgar para cerrar la O', '⚠️ Cierra el círculo (parece C)');
    }
    if (h.idxPinchRatio > 0.42 || h.midPinchRatio > 0.48) {
      return this._fail(52, 'Toca la yema del pulgar con las puntas del índice y medio cerrando la O', '⚠️ Junta índice y medio con pulgar');
    }
    const isCurvedRing = !h.isRingExt && !h.isPinkyExt && h.idxSpanRatio >= 0.85 && h.idxSpanRatio <= 1.55;
    if (!isCurvedRing || h.apertureHoleRatio < 0.40 || h.thumbToIdxPipRatio < 0.32) {
      return this._fail(56, 'Arquea los dedos dejando un hueco redondo al centro (no puño aplastado)', '⚠️ Abre un hueco redondo en la O');
    }
    if (chestY !== null && h.wrist.y > chestY + 0.16) {
      return this._fail(68, 'Eleva tu mano junto a tu mandíbula o boca como en el dataset LSC70', '⚠️ Sube la O cerca de mandíbula/boca');
    }
    return this._pass(96, '¡Letra O (LSC70) perfecta! Círculo cerrado junto al rostro', '✓ Letra O detectada');
  }

  _validateLetterC(h) {
    if (h.idxPinchRatio < 0.55) {
      return this._fail(60, 'Cerraste demasiado el espacio con el pulgar (parece una O): abre la mano en semicírculo formando una C', '⚠️ Abre el espacio (parece O)');
    }
    const isOpenSemicircle = h.idxPinchRatio >= 0.55 && h.idxPinchRatio <= 1.45 &&
      h.midPinchRatio >= 0.55 && h.midPinchRatio <= 1.55;
    const isArchedFingers = h.idxSpanRatio >= 1.02 && h.idxSpanRatio <= 1.85 &&
      h.midSpanRatio >= 1.02 && h.midSpanRatio <= 1.88;
    if (isOpenSemicircle && isArchedFingers && h.isThumbExt) {
      return this._pass(95, '¡Letra C (LSC70) perfecta! Semicírculo abierto entre pulgar y dedos', '✓ Letra C detectada');
    }
    if (isArchedFingers && h.isThumbExt) {
      return this._fail(74, 'Ajusta la apertura entre el pulgar y el índice formando la letra C', '⚠️ Ajusta la abertura de la C');
    }
    return this._fail(55, 'Arquea los dedos unidos enfrentados al pulgar formando un semicírculo C', '⚠️ Arquea dedos formando una C');
  }

  _validateLetterD(h) {
    const isStraightIndex = h.isIndexExt && h.idxSpanRatio >= 1.55 && h.idxPinchRatio >= 0.62;
    const isLoopMid = h.midPinchRatio <= 0.55;
    const othersCurled = h.isMiddleCurled && h.isRingCurled && h.isPinkyCurled;
    if (isStraightIndex && isLoopMid && othersCurled) {
      return this._pass(96, '¡Letra D perfecta! Índice erguido con aro entre pulgar y dedo medio', '✓ Letra D detectada');
    }
    if (isStraightIndex && othersCurled) {
      return this._fail(78, 'Junta la yema del pulgar con tu dedo medio formando un aro cerrado', '⚠️ Cierra el aro pulgar-medio (D)');
    }
    return this._fail(h.isIndexExt ? 58 : 42, 'Extiende únicamente tu dedo índice recto arriba y cierra los demás con el pulgar', '⚠️ Índice recto arriba y aro (D)');
  }

  _validateLetterE(h, chestY) {
    const allCurled = h.isIndexCurled && h.isMiddleCurled && h.isRingCurled && h.isPinkyCurled;
    if (!allCurled) {
      return this._fail(50, 'Curva completamente los 4 dedos apoyándolos sobre el pulgar doblado', '⚠️ Curva los 4 dedos (E)');
    }
    const thumbTucked = h.thumbDistToWristRatio < 1.42;
    const notClosedO = h.idxPinchRatio > 0.36 || h.apertureHoleRatio < 0.45;
    if (thumbTucked && h.idxTipToMcpRatio < 0.90 && notClosedO) {
      if (chestY !== null && h.wrist.y > chestY + 0.16) {
        return this._fail(68, 'Eleva tu mano junto a tu mandíbula como en el dataset LSC70', '⚠️ Sube la E cerca de mandíbula');
      }
      return this._pass(96, '¡Letra E perfecta! Dedos curvados descansando sobre el pulgar', '✓ Letra E detectada');
    }
    return this._fail(74, 'Dobla el pulgar por debajo de los 4 dedos curvados (sin dejar hueco de O)', '⚠️ Apoya los dedos sobre el pulgar');
  }

  _validateLetterA(h) {
    const allCurled = h.isIndexCurled && h.isMiddleCurled && h.isRingCurled && h.isPinkyCurled &&
      h.idxSpanRatio < 1.32 && h.midSpanRatio < 1.32;
    if (!allCurled) {
      return this._fail(50, 'Cierra completamente los 4 dedos formando un puño compacto', '⚠️ Cierra los dedos en puño');
    }
    if (h.isThumbExt && h.thumbToIdxPipRatio < 0.85 && h.idxPinchRatio > 0.36) {
      return this._pass(95, '¡Letra A correcta! Puño cerrado con pulgar erguido al lateral', '✓ Letra A detectada');
    }
    return this._fail(70, 'Coloca el pulgar vertical al lateral del índice sin cruzar la palma', '⚠️ Pulgar vertical al lateral (A)');
  }
}

if (typeof window !== 'undefined') {
  window.SignAnatomyValidator = new SignAnatomyValidator();
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SignAnatomyValidator;
}
