/**
 * Manitas · Proyecto EXIS
 * finger-feedback-engine.js - Evaluación geométrica LSC70 de letras nuevas y
 * diagnóstico granular dedo a dedo ("Tu mano vs. Sol") para las 18 letras.
 */

class FingerFeedbackEngine {
  static FINGER_LABELS = {
    thumb: 'Pulgar',
    index: 'Índice',
    middle: 'Medio',
    ring: 'Anular',
    pinky: 'Meñique'
  };

  static LETTER_PROFILES = {
    A: { thumb: 'extended', index: 'curled', middle: 'curled', ring: 'curled', pinky: 'curled' },
    B: { thumb: 'curled', index: 'extended', middle: 'extended', ring: 'extended', pinky: 'extended' },
    C: { thumb: 'curved', index: 'curved', middle: 'curved', ring: 'curved', pinky: 'curved' },
    D: { thumb: 'pinch', index: 'extended', middle: 'pinch', ring: 'curled', pinky: 'curled' },
    E: { thumb: 'curled', index: 'curved', middle: 'curved', ring: 'curved', pinky: 'curved' },
    F: { thumb: 'upright_close', index: 'extended', middle: 'curled', ring: 'curled', pinky: 'curled' },
    G: { thumb: 'curled', index: 'curled', middle: 'curled', ring: 'curled', pinky: 'curled' },
    H: { thumb: 'extended', index: 'extended', middle: 'curled', ring: 'curled', pinky: 'curled' },
    I: { thumb: 'curled', index: 'curled', middle: 'curled', ring: 'curled', pinky: 'extended' },
    J: { thumb: 'curled', index: 'curled', middle: 'curled', ring: 'curled', pinky: 'extended' },
    K: { thumb: 'cleft', index: 'extended', middle: 'extended', ring: 'curled', pinky: 'curled' },
    L: { thumb: 'extended', index: 'extended', middle: 'curled', ring: 'curled', pinky: 'curled' },
    M: { thumb: 'curled', index: 'down', middle: 'down', ring: 'down', pinky: 'curled' },
    N: { thumb: 'curled', index: 'down', middle: 'down', ring: 'curled', pinky: 'curled' },
    O: { thumb: 'pinch', index: 'pinch', middle: 'curved', ring: 'curved', pinky: 'curved' },
    P: { thumb: 'curled', index: 'curled', middle: 'down', ring: 'curled', pinky: 'curled' },
    Q: { thumb: 'pinch', index: 'pinch', middle: 'curled', ring: 'curled', pinky: 'curled' },
    R: { thumb: 'curled', index: 'extended', middle: 'extended', ring: 'curled', pinky: 'curled' },
    S: { thumb: 'curled', index: 'curled', middle: 'curled', ring: 'curled', pinky: 'curled' },
    T: { thumb: 'cleft', index: 'curled', middle: 'curled', ring: 'curled', pinky: 'curled' },
    U: { thumb: 'curled', index: 'extended', middle: 'curled', ring: 'curled', pinky: 'extended' },
    V: { thumb: 'curled', index: 'extended', middle: 'extended', ring: 'curled', pinky: 'curled' },
    W: { thumb: 'curled', index: 'extended', middle: 'extended', ring: 'extended', pinky: 'curled' },
    Z: { thumb: 'curled', index: 'extended', middle: 'curled', ring: 'curled', pinky: 'curled' }
  };

  #initialized = false;
  #lastDiagnostics = null;

  init() {
    this.#initialized = true;
    return this;
  }

  start() {
    if (!this.#initialized) this.init();
  }

  update(signId, lm) {
    if (!signId || !Array.isArray(lm) || lm.length < 21) return this.#lastDiagnostics;
    this.#lastDiagnostics = this.getFingerDiagnostics(signId, lm);
    return this.#lastDiagnostics;
  }

  reset() {
    this.#lastDiagnostics = null;
  }

  destroy() {
    this.reset();
    this.#initialized = false;
  }

  static #dist(p1, p2) {
    if (!p1 || !p2) return 0;
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
  }

  static extractFingerState(lm) {
    if (!Array.isArray(lm) || lm.length < 21) return null;
    const wrist = lm[0];
    const palmScale = Math.max(0.05, FingerFeedbackEngine.#dist(wrist, lm[9]));

    const fingerMetric = (mcpIdx, pipIdx, tipIdx) => {
      const dTipWrist = FingerFeedbackEngine.#dist(lm[tipIdx], wrist);
      const dPipWrist = FingerFeedbackEngine.#dist(lm[pipIdx], wrist);
      const dTipMcp = FingerFeedbackEngine.#dist(lm[tipIdx], lm[mcpIdx]);
      const dy = lm[tipIdx].y - lm[mcpIdx].y;
      const dx = lm[tipIdx].x - lm[mcpIdx].x;
      const extended = dTipWrist > dPipWrist * 1.08 && (dTipMcp / palmScale) > 0.48;
      const curled = !extended && (dTipWrist < dPipWrist * 1.06 || (dTipMcp / palmScale) < 0.56);
      const curved = !extended && (dTipMcp / palmScale) >= 0.34;
      const pointingDown = extended && dy > palmScale * 0.25;
      const pointingUp = extended && dy < -palmScale * 0.20;
      return { extended, curled, curved, pointingDown, pointingUp, dx, dy, ratio: dTipMcp / palmScale };
    };

    const thumbTipToIndexMcp = FingerFeedbackEngine.#dist(lm[4], lm[5]) / palmScale;
    const thumbTipToMidMcp = FingerFeedbackEngine.#dist(lm[4], lm[9]) / palmScale;
    const thumbExtended = thumbTipToIndexMcp > 0.55 && FingerFeedbackEngine.#dist(lm[4], wrist) > FingerFeedbackEngine.#dist(lm[2], wrist) * 1.05;
    const thumbUprightClose = lm[4].y < lm[2].y && thumbTipToIndexMcp <= 0.78 && FingerFeedbackEngine.#dist(lm[4], wrist) > FingerFeedbackEngine.#dist(lm[2], wrist) * 1.02;
    const thumbInCleft = thumbTipToMidMcp < 0.85 || FingerFeedbackEngine.#dist(lm[4], lm[6]) / palmScale < 0.72;
    const pinchIndexThumb = FingerFeedbackEngine.#dist(lm[4], lm[8]) / palmScale < 0.42;
    const pinchMiddleThumb = FingerFeedbackEngine.#dist(lm[4], lm[12]) / palmScale < 0.45;

    return {
      palmScale,
      thumb: {
        extended: thumbExtended,
        curled: !thumbExtended,
        curved: thumbTipToIndexMcp >= 0.35 && thumbTipToIndexMcp <= 0.85,
        uprightClose: thumbUprightClose,
        inCleft: thumbInCleft,
        pinch: pinchIndexThumb || pinchMiddleThumb,
        pointingDown: false
      },
      index: { ...fingerMetric(5, 6, 8), pinch: pinchIndexThumb },
      middle: { ...fingerMetric(9, 10, 12), pinch: pinchMiddleThumb },
      ring: fingerMetric(13, 14, 16),
      pinky: fingerMetric(17, 18, 20),
      indexMiddleSpread: FingerFeedbackEngine.#dist(lm[8], lm[12]) / palmScale,
      middleRingSpread: FingerFeedbackEngine.#dist(lm[12], lm[16]) / palmScale
    };
  }

  #checkExpectedState(fingerKey, expected, state) {
    const f = state[fingerKey];
    if (!f) return { ok: false, actual: 'curled', action: 'extend' };

    if (expected === 'extended') {
      return { ok: f.extended, actual: f.extended ? 'extended' : 'curled', action: f.extended ? 'ok' : 'extend' };
    }
    if (expected === 'curled') {
      return { ok: !f.extended, actual: f.extended ? 'extended' : 'curled', action: f.extended ? 'bend' : 'ok' };
    }
    if (expected === 'curved') {
      const ok = f.curved || !f.extended;
      return { ok, actual: f.extended ? 'extended' : 'curved', action: ok ? 'ok' : 'bend' };
    }
    if (expected === 'down') {
      return { ok: f.pointingDown, actual: f.pointingDown ? 'down' : (f.extended ? 'extended' : 'curled'), action: f.pointingDown ? 'ok' : 'extend' };
    }
    if (expected === 'upright_close') {
      const ok = f.uprightClose || f.extended;
      return { ok, actual: ok ? 'upright_close' : 'curled', action: ok ? 'ok' : 'extend' };
    }
    if (expected === 'cleft') {
      return { ok: f.inCleft, actual: f.inCleft ? 'cleft' : 'extended', action: f.inCleft ? 'ok' : 'bend' };
    }
    if (expected === 'pinch') {
      return { ok: f.pinch, actual: f.pinch ? 'pinch' : 'curved', action: f.pinch ? 'ok' : 'pinch' };
    }
    return { ok: true, actual: 'ok', action: 'ok' };
  }

  getFingerDiagnostics(signId, lm) {
    const sid = String(signId || '').toUpperCase();
    const profile = FingerFeedbackEngine.LETTER_PROFILES[sid];
    const state = FingerFeedbackEngine.extractFingerState(lm);
    if (!profile || !state) return null;

    const fingers = {};
    const toExtend = [];
    const toBend = [];
    const toPinch = [];
    let matchedCount = 0;

    for (const key of ['thumb', 'index', 'middle', 'ring', 'pinky']) {
      const expected = profile[key];
      const check = this.#checkExpectedState(key, expected, state);
      fingers[key] = { expected, actual: check.actual, ok: check.ok, action: check.action };
      if (check.ok) {
        matchedCount++;
      } else if (check.action === 'extend') {
        toExtend.push(FingerFeedbackEngine.FINGER_LABELS[key]);
      } else if (check.action === 'bend') {
        toBend.push(FingerFeedbackEngine.FINGER_LABELS[key]);
      } else if (check.action === 'pinch') {
        toPinch.push(FingerFeedbackEngine.FINGER_LABELS[key]);
      }
    }

    let primaryHint = `¡Todos los dedos en posición para ${sid}!`;
    if (toPinch.length > 0) {
      primaryHint = `Junta ${toPinch.join(' y ')} formando aro`;
    } else if (toExtend.length > 0 && toBend.length > 0) {
      primaryHint = `Extiende ${toExtend.join(', ')} y dobla ${toBend.join(', ')}`;
    } else if (toExtend.length > 0) {
      primaryHint = ['M', 'N', 'P'].includes(sid)
        ? `Apunta hacia abajo: ${toExtend.join(', ')}`
        : `Extiende: ${toExtend.join(', ')}`;
    } else if (toBend.length > 0) {
      primaryHint = `Dobla: ${toBend.join(', ')}`;
    }

    const score = Math.round((matchedCount / 5) * 100);
    return { signId: sid, fingers, matchedCount, score, primaryHint };
  }

  evaluateLetter(signId, lm) {
    const sid = String(signId || '').toUpperCase();
    const state = FingerFeedbackEngine.extractFingerState(lm);
    const diagInfo = this.getFingerDiagnostics(sid, lm);
    if (!state || !diagInfo) {
      return { score: 0, hint: 'Coloca tu mano frente a la cámara', diag: 'Sin datos de mano' };
    }

    let bonus = 0;
    let penalty = 0;
    let extraHint = '';

    if (sid === 'F') {
      if (state.index.pointingUp && state.thumb.uprightClose) bonus += 10;
      if (state.thumb.extended && !state.thumb.uprightClose) {
        penalty += 15;
        extraHint = 'Acerca el pulgar al índice (no lo abras en L)';
      }
    } else if (sid === 'K') {
      if (state.indexMiddleSpread > 0.32) bonus += 10;
      else {
        penalty += 15;
        extraHint = 'Separa índice y medio en tijera lateral';
      }
    } else if (sid === 'M') {
      if (state.indexMiddleSpread > 0.22 && state.middleRingSpread > 0.22) bonus += 10;
      else extraHint = 'Separa los 3 dedos hacia abajo en tridente';
    } else if (sid === 'N') {
      if (state.indexMiddleSpread > 0.24) bonus += 10;
      else extraHint = 'Abre índice y medio hacia abajo en V invertida';
    } else if (sid === 'J') {
      if (state.pinky.extended && Math.abs(state.pinky.dx) >= Math.abs(state.pinky.dy) * 0.35) bonus += 10;
    } else if (sid === 'R') {
      if (state.indexMiddleSpread < 0.32) bonus += 10;
      else {
        penalty += 12;
        extraHint = 'Cruza el dedo índice y el medio juntos hacia arriba';
      }
    } else if (sid === 'W') {
      if (state.indexMiddleSpread > 0.20 && state.middleRingSpread > 0.20) bonus += 10;
      else extraHint = 'Separa índice, medio y anular formando una W';
    }

    const rawScore = diagInfo.matchedCount === 5 ? 92 + bonus - penalty : Math.min(82, diagInfo.score + Math.round(bonus / 2) - penalty);
    const finalScore = Math.max(10, Math.min(99, rawScore));
    const hint = finalScore >= 85
      ? `¡Excelente letra ${sid} LSC!`
      : (extraHint || diagInfo.primaryHint);
    const diag = `${diagInfo.matchedCount}/5 dedos · ${diagInfo.primaryHint}`;

    return { score: finalScore, hint, diag, diagnostics: diagInfo };
  }
}

const fingerFeedbackEngine = new FingerFeedbackEngine().init();

if (typeof window !== 'undefined') {
  window.FingerFeedbackEngine = fingerFeedbackEngine;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FingerFeedbackEngine, fingerFeedbackEngine };
}
