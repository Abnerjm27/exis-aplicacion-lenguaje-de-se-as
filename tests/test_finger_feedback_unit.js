const assert = require('assert');
const fs = require('fs');
const path = require('path');

const { FingerFeedbackEngine } = require('../app/js/finger-feedback-engine.js');
const { SRSClient } = require('../app/js/srs-client.js');

// Cargar SIGNS_DATA en global.window para SRSClient.getAllValidSignIds
global.window = global.window || {};
global.localStorage = (() => {
  const store = {};
  return {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; }
  };
})();
eval(fs.readFileSync(path.join(__dirname, '..', 'app', 'js', 'signs-data.js'), 'utf8'));

function makeBaseHand() {
  // 21 landmarks con muñeca en (0.5, 0.7) y MCP medio en (0.5, 0.5) => palmScale = 0.2
  const lm = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.6 }));
  lm[0] = { x: 0.50, y: 0.70 }; // wrist
  lm[1] = { x: 0.44, y: 0.66 };
  lm[2] = { x: 0.41, y: 0.60 };
  lm[3] = { x: 0.42, y: 0.56 };
  lm[4] = { x: 0.46, y: 0.55 }; // thumb tucked default
  // index (5-8) curled default
  lm[5] = { x: 0.44, y: 0.50 }; lm[6] = { x: 0.44, y: 0.44 }; lm[7] = { x: 0.44, y: 0.49 }; lm[8] = { x: 0.44, y: 0.54 };
  // middle (9-12) curled default
  lm[9] = { x: 0.50, y: 0.50 }; lm[10] = { x: 0.50, y: 0.43 }; lm[11] = { x: 0.50, y: 0.49 }; lm[12] = { x: 0.50, y: 0.55 };
  // ring (13-16) curled default
  lm[13] = { x: 0.55, y: 0.51 }; lm[14] = { x: 0.55, y: 0.45 }; lm[15] = { x: 0.55, y: 0.50 }; lm[16] = { x: 0.55, y: 0.56 };
  // pinky (17-20) curled default
  lm[17] = { x: 0.60, y: 0.53 }; lm[18] = { x: 0.60, y: 0.47 }; lm[19] = { x: 0.60, y: 0.52 }; lm[20] = { x: 0.60, y: 0.57 };
  return lm;
}

function extendUp(lm, mcp, pip, tip, xOffset = 0) {
  const base = lm[mcp];
  lm[pip] = { x: base.x + xOffset * 0.4, y: base.y - 0.12 };
  lm[tip] = { x: base.x + xOffset, y: base.y - 0.24 };
}

function extendDown(lm, mcp, pip, tip, xOffset = 0) {
  const base = lm[mcp];
  // Para dedos hacia abajo, wrist arriba (y=0.30) y MCP en y=0.50
  lm[pip] = { x: base.x + xOffset * 0.4, y: base.y + 0.12 };
  lm[tip] = { x: base.x + xOffset, y: base.y + 0.24 };
}

function makeHandFacingDown() {
  const lm = makeBaseHand();
  lm[0] = { x: 0.50, y: 0.30 }; // wrist arriba
  lm[2] = { x: 0.44, y: 0.40 };
  lm[4] = { x: 0.48, y: 0.45 }; // thumb tucked
  lm[5] = { x: 0.42, y: 0.50 }; lm[6] = { x: 0.42, y: 0.55 }; lm[8] = { x: 0.44, y: 0.46 };
  lm[9] = { x: 0.50, y: 0.50 }; lm[10] = { x: 0.50, y: 0.55 }; lm[12] = { x: 0.50, y: 0.46 };
  lm[13] = { x: 0.56, y: 0.50 }; lm[14] = { x: 0.56, y: 0.55 }; lm[16] = { x: 0.56, y: 0.46 };
  lm[17] = { x: 0.62, y: 0.50 }; lm[18] = { x: 0.62, y: 0.55 }; lm[20] = { x: 0.62, y: 0.46 };
  return lm;
}

console.log('🧪 [TEST] Iniciando pruebas unitarias de FingerFeedbackEngine y SRSClient...');
const engine = new FingerFeedbackEngine().init();

// 1. Ciclo de vida POO estándar
['init', 'start', 'update', 'reset', 'destroy'].forEach(m => {
  assert.strictEqual(typeof engine[m], 'function', `Falta método ${m}`);
});

// 2. Letra F: índice arriba + pulgar vertical cercano al índice, resto doblado
const lmF = makeBaseHand();
extendUp(lmF, 5, 6, 8);
lmF[4] = { x: 0.40, y: 0.43 }; // pulgar casi vertical al lado del índice
const resF = engine.evaluateLetter('F', lmF);
assert.ok(resF.score >= 85, `F positiva esperada >= 85, obtuvo ${resF.score} (${resF.hint})`);
const resFBad = engine.evaluateLetter('F', makeBaseHand());
assert.ok(resFBad.score < 85, `F cerrada negativa esperada < 85, obtuvo ${resFBad.score}`);
console.log('  ✅ [PASS] 1. Letra F aprobada y rechaza puño cerrado.');

// 3. Letra G: puño compacto
const lmG = makeBaseHand();
const resG = engine.evaluateLetter('G', lmG);
assert.ok(resG.score >= 85, `G positiva esperada >= 85, obtuvo ${resG.score}`);
const lmGBad = makeBaseHand();
extendUp(lmGBad, 5, 6, 8);
const resGBad = engine.evaluateLetter('G', lmGBad);
assert.ok(resGBad.score < 85, `G con índice extendido esperada < 85, obtuvo ${resGBad.score}`);
console.log('  ✅ [PASS] 2. Letra G aprobada y rechaza índice apuntando.');

// 4. Letra H: índice arriba + pulgar extendido al frente/lado
const lmH = makeBaseHand();
extendUp(lmH, 5, 6, 8);
lmH[4] = { x: 0.30, y: 0.55 }; // pulgar extendido
const resH = engine.evaluateLetter('H', lmH);
assert.ok(resH.score >= 85, `H positiva esperada >= 85, obtuvo ${resH.score}`);
console.log('  ✅ [PASS] 3. Letra H aprobada.');

// 5. Letra J: meñique extendido lateralmente
const lmJ = makeBaseHand();
lmJ[18] = { x: 0.68, y: 0.51 };
lmJ[20] = { x: 0.78, y: 0.48 };
const resJ = engine.evaluateLetter('J', lmJ);
assert.ok(resJ.score >= 85, `J positiva esperada >= 85, obtuvo ${resJ.score}`);
console.log('  ✅ [PASS] 4. Letra J aprobada.');

// 6. Letra K: índice y medio en tijera con pulgar en horquilla
const lmK = makeBaseHand();
extendUp(lmK, 5, 6, 8, -0.06);
extendUp(lmK, 9, 10, 12, 0.08);
lmK[4] = { x: 0.47, y: 0.45 };
const resK = engine.evaluateLetter('K', lmK);
assert.ok(resK.score >= 85, `K positiva esperada >= 85, obtuvo ${resK.score} (${resK.hint})`);
console.log('  ✅ [PASS] 5. Letra K aprobada.');

// 7. Letra M: 3 dedos hacia abajo en tridente
const lmM = makeHandFacingDown();
extendDown(lmM, 5, 6, 8, -0.07);
extendDown(lmM, 9, 10, 12, 0.0);
extendDown(lmM, 13, 14, 16, 0.07);
const resM = engine.evaluateLetter('M', lmM);
assert.ok(resM.score >= 85, `M positiva esperada >= 85, obtuvo ${resM.score} (${resM.hint})`);
console.log('  ✅ [PASS] 6. Letra M aprobada.');

// 8. Letra N: 2 dedos hacia abajo en V invertida
const lmN = makeHandFacingDown();
extendDown(lmN, 5, 6, 8, -0.05);
extendDown(lmN, 9, 10, 12, 0.06);
const resN = engine.evaluateLetter('N', lmN);
assert.ok(resN.score >= 85, `N positiva esperada >= 85, obtuvo ${resN.score} (${resN.hint})`);
console.log('  ✅ [PASS] 7. Letra N aprobada.');

// 9. Letra P: solo dedo medio colgando hacia abajo
const lmP = makeHandFacingDown();
extendDown(lmP, 9, 10, 12, 0.0);
const resP = engine.evaluateLetter('P', lmP);
assert.ok(resP.score >= 85, `P positiva esperada >= 85, obtuvo ${resP.score} (${resP.hint})`);
console.log('  ✅ [PASS] 8. Letra P aprobada.');

// 10. Lote 2 (Q, R, S, T, W, Z)
const lmQ = makeBaseHand();
lmQ[4] = { x: 0.44, y: 0.56 }; lmQ[8] = { x: 0.45, y: 0.55 };
assert.ok(engine.evaluateLetter('Q', lmQ).score >= 85, 'Q positiva esperada >= 85');

const lmR = makeBaseHand();
extendUp(lmR, 5, 6, 8, 0.02);
extendUp(lmR, 9, 10, 12, -0.02);
assert.ok(engine.evaluateLetter('R', lmR).score >= 85, 'R positiva esperada >= 85');

const lmS = makeBaseHand();
assert.ok(engine.evaluateLetter('S', lmS).score >= 85, 'S positiva esperada >= 85');

const lmT = makeBaseHand();
assert.ok(engine.evaluateLetter('T', lmT).score >= 85, 'T positiva esperada >= 85');
const lmTBad = makeBaseHand();
lmTBad[4] = { x: 0.25, y: 0.56 }; // pulgar abierto hacia afuera, no entre índice y medio
const resTBad = engine.evaluateLetter('T', lmTBad);
assert.ok(resTBad.score < 85, `T con pulgar afuera esperada < 85, obtuvo ${resTBad.score}`);
assert.ok(resTBad.hint.toLowerCase().includes('pulgar'), `Hint de T esperada mención de pulgar: ${resTBad.hint}`);

const lmW = makeBaseHand();
extendUp(lmW, 5, 6, 8, -0.06);
extendUp(lmW, 9, 10, 12, 0.0);
extendUp(lmW, 13, 14, 16, 0.06);
assert.ok(engine.evaluateLetter('W', lmW).score >= 85, 'W positiva esperada >= 85');

const lmZ = makeBaseHand();
extendUp(lmZ, 5, 6, 8);
assert.ok(engine.evaluateLetter('Z', lmZ).score >= 85, 'Z positiva esperada >= 85');
console.log('  ✅ [PASS] 9. Lote 2 (Q, R, S, T, W, Z) aprobado.');

// 11. Diagnósticos granulares en las 24 letras
const letters24 = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L',
  'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'Z'
];
letters24.forEach(l => {
  const d = engine.getFingerDiagnostics(l, makeBaseHand());
  assert.ok(d && d.fingers && Object.keys(d.fingers).length === 5, `Diagnóstico incompleto para ${l}`);
  assert.ok(typeof d.primaryHint === 'string' && d.primaryHint.length > 0);
});
console.log('  ✅ [PASS] 10. getFingerDiagnostics cubre las 24 letras (5 dedos por letra).');

// 11. SRSClient Leitner y getDueSigns
const srs = new SRSClient().init();
const t0 = Date.UTC(2026, 10, 24, 12, 0, 0);
const statFail = srs.recordAttempt('M', false, t0);
assert.strictEqual(statFail.box, 1);
assert.strictEqual(statFail.attempts, 1);
assert.strictEqual(statFail.successes, 0);

const statPass = srs.recordAttempt('M', true, t0 + 1000);
assert.strictEqual(statPass.box, 2);
assert.strictEqual(statPass.attempts, 2);
assert.strictEqual(statPass.successes, 1);

const dueFuture = srs.getDueSigns(3, t0 + 30 * 3600 * 1000);
assert.strictEqual(dueFuture.length, 3);
assert.strictEqual(dueFuture[0].signId, 'M', 'M vencida debe aparecer primero');
console.log('  ✅ [PASS] 10. SRSClient Leitner y priorización verificados.');

console.log('\n🎉 ¡TODAS LAS PRUEBAS DE FingerFeedbackEngine Y SRSClient PASARON! (10/10)');
