const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { GamificationManager } = require('../app/js/gamification-manager.js');

// Mock localStorage & window.AuthProfileManager
const store = {};
global.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; }
};

const profile = { username: 'test_user', xp: 100, masteredSigns: [], signStats: {} };
global.window = {
  AuthProfileManager: {
    getCurrentProfile: () => ({ ...profile }),
    update: (patch) => Object.assign(profile, patch)
  }
};

console.log('🧪 [TEST] Iniciando pruebas unitarias de GamificationManager...');

let today = '2026-11-24';
const gm = new GamificationManager({ dateProvider: () => today }).init();

// 1. Ciclo de vida POO estándar
['init', 'start', 'update', 'reset', 'destroy'].forEach(m => {
  assert.strictEqual(typeof gm[m], 'function', `Falta método ${m}`);
});
console.log('  ✅ [PASS] 1. Ciclo de vida POO completo.');

// 2. Misiones diarias y bono único +40 XP
const r1 = gm.recordFlashcardResult({ passed: true, combo: 1, signId: 'A' });
assert.strictEqual(r1.bonusAwarded, 0);
const r2 = gm.recordFlashcardResult({ passed: true, combo: 2, signId: 'E' });
assert.strictEqual(r2.bonusAwarded, 0);
const r3 = gm.recordFlashcardResult({ passed: true, combo: 3, signId: 'I' });
assert.strictEqual(r3.bonusAwarded, 0, 'Falta completar spell_word');
assert.ok(r3.state.badges.find(b => b.id === 'combo_master').unlocked, 'combo_master debe desbloquearse en x3');

const r4 = gm.recordWordSpelled('SOL');
assert.strictEqual(r4.bonusAwarded, 40, 'Al completar las 3 misiones debe otorgar +40 XP');
assert.strictEqual(profile.xp, 140, 'AuthProfileManager debe recibir +40 XP');
assert.ok(r4.state.badges.find(b => b.id === 'first_word').unlocked, 'first_word debe desbloquearse');

// No duplicar bono el mismo día
const r5 = gm.recordWordSpelled('ANA');
assert.strictEqual(r5.bonusAwarded, 0, 'No debe duplicar el bono diario en el mismo día');
assert.strictEqual(profile.xp, 140);
console.log('  ✅ [PASS] 2. 3 retos diarios, bono único +40 XP e insignias combo_master/first_word.');

// 3. Insignias Vocales LSC, Cámara Precisa y Oro Leitner
gm.recordFlashcardResult({ passed: true, combo: 1, signId: 'O' });
const rU = gm.recordFlashcardResult({ passed: true, combo: 2, signId: 'U' });
assert.ok(rU.state.badges.find(b => b.id === 'vowels_lsc').unlocked, 'vowels_lsc debe desbloquearse con A,E,I,O,U');

const rCam = gm.recordCameraSuccess({ signId: 'M', score: 96 });
assert.ok(rCam.state.badges.find(b => b.id === 'camera_pro').unlocked, 'camera_pro debe desbloquearse con 96%');

profile.signStats = { F: { box: 5, attempts: 6, successes: 6 } };
const rGold = gm.update();
assert.ok(rGold.badges.find(b => b.id === 'leitner_gold').unlocked, 'leitner_gold debe desbloquearse en Caja 5');
assert.strictEqual(rGold.unlockedCount, 5);
rGold.badges.forEach(b => {
  assert.ok(b.image && b.image.startsWith('img/badges/'), `Falta ruta de medalla para ${b.id}`);
  const imgFile = path.join(__dirname, '..', 'app', b.image);
  assert.ok(fs.existsSync(imgFile) && fs.statSync(imgFile).size > 10000, `Medalla faltante en disco: ${imgFile}`);
});
console.log('  ✅ [PASS] 3. Todas las 5 insignias desbloqueadas y con medallas PNG en disco.');

// 4. Tiers de Maestría Bronce / Plata / Oro
assert.strictEqual(gm.getMasteryTier(1).tier, 'bronze');
assert.strictEqual(gm.getMasteryTier(2).tier, 'bronze');
assert.strictEqual(gm.getMasteryTier(3).tier, 'silver');
assert.strictEqual(gm.getMasteryTier(4).tier, 'silver');
assert.strictEqual(gm.getMasteryTier(5).tier, 'gold');
console.log('  ✅ [PASS] 4. Niveles Bronce (1-2), Plata (3-4) y Oro (5) verificados.');

// 5. Reinicio de misiones diarias al cambiar de fecha
today = '2026-11-25';
const nextDayState = gm.getState();
assert.strictEqual(nextDayState.dateKey, '2026-11-25');
assert.strictEqual(nextDayState.dailyBonusClaimed, false);
assert.ok(nextDayState.missions.every(m => m.current === 0 && !m.done));
assert.strictEqual(nextDayState.unlockedCount, 5, 'Las insignias deben persistir entre días');
console.log('  ✅ [PASS] 5. Reinicio diario de misiones manteniendo insignias.');

console.log('\n🎉 ¡TODAS LAS PRUEBAS DE GamificationManager PASARON! (5/5)');
