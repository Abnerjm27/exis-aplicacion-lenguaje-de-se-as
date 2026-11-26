const assert = require('assert');
const { BlindSpellSession } = require('../app/js/blind-spell-session.js');

console.log('🧪 [TEST] Iniciando pruebas unitarias de BlindSpellSession...');

let ticks = 0;
let timeouts = 0;
let completedSummary = null;

const session = new BlindSpellSession({
  secondsPerLetter: 5,
  onTick: () => { ticks += 1; },
  onTimeout: () => { timeouts += 1; },
  onComplete: (summary) => { completedSummary = summary; }
});

// 1. Ciclo de vida POO estándar
['init', 'start', 'update', 'reset', 'destroy'].forEach(m => {
  assert.strictEqual(typeof session[m], 'function', `Falta método POO ${m}`);
});
console.log('  ✅ [PASS] 1. Ciclo de vida POO completo.');

// 2. Inicio y secuencia mixta: 2 aciertos + 1 salto sin cámara + 1 fallo por timeout
const st0 = session.start('ANXA'); // X se salta como no soportada en prueba
assert.strictEqual(st0.word, 'ANXA');
assert.strictEqual(st0.chars.length, 4);
assert.strictEqual(session.isActive(), true);

const r1 = session.recordLetterResult(true, 94);
assert.strictEqual(r1.finished, false);
assert.strictEqual(r1.nextIndex, 1);

const r2 = session.recordLetterResult(true, 89);
assert.strictEqual(r2.finished, false);
assert.strictEqual(r2.nextIndex, 2);

const rSkip = session.skipUnsupported();
assert.strictEqual(rSkip.finished, false);
assert.strictEqual(rSkip.nextIndex, 3);

// Simular timeout de 5 segundos en la última letra ('A')
for (let i = 0; i < 5; i++) {
  session.update();
}

assert.strictEqual(timeouts, 1, 'Debe disparar onTimeout al agotarse segundos');
assert.strictEqual(ticks, 4, 'Debe emitir 4 ticks previos al timeout');
assert.strictEqual(session.isFinished(), true);
assert.strictEqual(session.isActive(), false);
assert.ok(completedSummary, 'Debe invocar onComplete al terminar la última letra');
assert.strictEqual(completedSummary.totalEvaluated, 3);
assert.strictEqual(completedSummary.passedCount, 2);
assert.strictEqual(completedSummary.failedCount, 1);
assert.strictEqual(completedSummary.skippedCount, 1);
assert.strictEqual(completedSummary.scorePct, 67);
assert.strictEqual(completedSummary.passedChallenge, true);
assert.deepStrictEqual(completedSummary.failedIndices, [3]);
console.log('  ✅ [PASS] 2. Aciertos, salto sin cámara, timeout y porcentaje verificados.');

// 3. Caso reprobado (< 60%)
session.reset();
session.start('SOL');
session.recordLetterResult(true, 90);
session.recordLetterResult(false, 35);
session.recordLetterResult(false, 40);
const failSummary = session.getSummary();
assert.strictEqual(failSummary.scorePct, 33);
assert.strictEqual(failSummary.passedChallenge, false);
assert.deepStrictEqual(failSummary.failedIndices, [1, 2]);
session.destroy();
console.log('  ✅ [PASS] 3. Caso reprobado (<60%) y destroy() limpio verificados.');

console.log('\n🎉 ¡TODAS LAS PRUEBAS DE BlindSpellSession PASARON! (3/3)');
