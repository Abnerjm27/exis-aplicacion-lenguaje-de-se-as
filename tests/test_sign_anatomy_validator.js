/**
 * LSC Learn · Proyecto EXIS
 * tests/test_sign_anatomy_validator.js
 *
 * Pruebas unitarias de validación anatómica y biomecánica (SignAnatomyValidator):
 * Verifica que las señas dinámicas NO se completen con cualquier dedo o postura,
 * especialmente TARDES, NOCHES, BUENOS, NOMBRE, GUSTAR, YO y LICOR.
 */

const assert = require('assert');
const SignAnatomyValidator = require('../app/js/sign-anatomy-validator.js');

console.log('🧪 [TEST] Iniciando pruebas unitarias de SignAnatomyValidator...\n');

const validator = new SignAnatomyValidator();
validator.init();

const defaultAnchors = {
  temple: { x: 0.40, y: 0.26 },
  chin: { x: 0.50, y: 0.37 },
  throat: { x: 0.50, y: 0.44 },
  chest: { x: 0.50, y: 0.62 }
};

/**
 * Crea una mano realista de 21 landmarks en coordenadas normalizadas
 * @param {number} wx - Muñeca X
 * @param {number} wy - Muñeca Y
 * @param {{ dirX?: number, dirY?: number, open?: boolean, indexOnly?: boolean, twoFingers?: boolean, cupY?: boolean }} opts
 */
function makeHand(wx, wy, opts = {}) {
  const dirX = opts.dirX ?? 0;
  const dirY = opts.dirY ?? -0.12;
  const len = Math.hypot(dirX, dirY) || 0.12;
  const ux = dirX / len;
  const uy = dirY / len;
  const px = -uy;
  const py = ux;

  const lm = Array.from({ length: 21 }, () => ({ x: wx, y: wy, z: 0 }));

  const ext = {
    thumb: opts.open || opts.cupY || false,
    index: opts.open || opts.indexOnly || opts.twoFingers || false,
    middle: opts.open || opts.twoFingers || false,
    ring: opts.open || false,
    pinky: opts.open || opts.cupY || false
  };

  // Pulgar: 1..4
  lm[1] = { x: wx + px * 0.03, y: wy + py * 0.03, z: 0 };
  lm[2] = { x: wx + px * 0.05 + ux * 0.03, y: wy + py * 0.05 + uy * 0.03, z: 0 };
  lm[3] = { x: wx + px * 0.07 + ux * 0.05, y: wy + py * 0.07 + uy * 0.05, z: 0 };
  lm[4] = ext.thumb
    ? { x: wx + px * 0.13 + ux * 0.07, y: wy + py * 0.13 + uy * 0.07, z: 0 }
    : { x: wx + px * 0.02 + ux * 0.04, y: wy + py * 0.02 + uy * 0.04, z: 0 };

  const fingers = [
    { base: 5, pip: 6, tip: 8, offset: 0.03, isExt: ext.index },
    { base: 9, pip: 10, tip: 12, offset: 0.01, isExt: ext.middle },
    { base: 13, pip: 14, tip: 16, offset: -0.01, isExt: ext.ring },
    { base: 17, pip: 18, tip: 20, offset: -0.03, isExt: ext.pinky }
  ];

  for (const f of fingers) {
    lm[f.base] = { x: wx + ux * 0.08 + px * f.offset, y: wy + uy * 0.08 + py * f.offset, z: 0 };
    lm[f.pip] = { x: wx + ux * 0.12 + px * f.offset, y: wy + uy * 0.12 + py * f.offset, z: 0 };
    if (f.isExt) {
      lm[f.tip] = { x: wx + ux * 0.18 + px * f.offset, y: wy + uy * 0.18 + py * f.offset, z: 0 };
    } else {
      // Curled back toward wrist
      lm[f.tip] = { x: wx + ux * 0.06 + px * f.offset, y: wy + uy * 0.06 + py * f.offset, z: 0 };
    }
  }
  return lm;
}

// 1. TARDES: rechazar 1 sola mano en el pecho
const singleChestHand = makeHand(0.50, 0.58, { dirX: -0.10, dirY: 0.0, open: true });
const tardes1Hand = validator.validateSign('TARDES', [singleChestHand], defaultAnchors);
assert.strictEqual(tardes1Hand.valid, false, 'TARDES NO debe aprobarse con una sola mano');
console.log('  ✅ [PASS] 1. TARDES rechaza 1 sola mano.');

// 2. TARDES: rechazar 2 manos verticales (apuntando arriba, sin cruzar antebrazos)
const vertHand1 = makeHand(0.42, 0.58, { dirX: 0.0, dirY: -0.12, open: true });
const vertHand2 = makeHand(0.58, 0.58, { dirX: 0.0, dirY: -0.12, open: true });
const tardesVertical = validator.validateSign('TARDES', [vertHand1, vertHand2], defaultAnchors);
assert.strictEqual(tardesVertical.valid, false, 'TARDES NO debe aprobarse con manos verticales sin cruzar');
console.log('  ✅ [PASS] 2. TARDES rechaza 2 manos verticales sin cruce horizontal.');

// 3. TARDES: aprobar 2 manos horizontales cruzadas en el pecho
const crossRight = makeHand(0.60, 0.58, { dirX: -0.12, dirY: 0.01, open: true });
const crossLeft = makeHand(0.40, 0.60, { dirX: 0.12, dirY: -0.01, open: true });
const tardesValid = validator.validateSign('TARDES', [crossRight, crossLeft], defaultAnchors);
assert.strictEqual(tardesValid.valid, true, `TARDES debe aprobarse con antebrazos horizontales cruzados: ${tardesValid.diag}`);
assert(tardesValid.score >= 90, 'TARDES válido debe tener score >= 90');
console.log('  ✅ [PASS] 3. TARDES aprueba antebrazos horizontales cruzados en pecho.');

// 4. YO: rechazar mano abierta en el pecho; aprobar solo índice extendido
const openChest = makeHand(0.50, 0.62, { dirX: 0, dirY: -0.10, open: true });
const yoOpen = validator.validateSign('YO', [openChest], defaultAnchors, 1);
assert.strictEqual(yoOpen.valid, false, 'YO NO debe aprobarse con la mano completamente abierta');

const indexChest = makeHand(0.50, 0.62, { dirX: 0, dirY: -0.06, indexOnly: true });
const yoValid = validator.validateSign('YO', [indexChest], defaultAnchors, 1);
assert.strictEqual(yoValid.valid, true, `YO debe aprobarse con solo índice apuntando al pecho: ${yoValid.diag}`);
console.log('  ✅ [PASS] 4. YO rechaza mano abierta y aprueba índice en pecho.');

// 5. GUSTAR: rechazar mano abierta en garganta; aprobar índice en garganta
const openThroat = makeHand(0.50, 0.56, { dirX: 0, dirY: -0.10, open: true });
const gustarOpen = validator.validateSign('GUSTAR', [openThroat], defaultAnchors);
assert.strictEqual(gustarOpen.valid, false, 'GUSTAR NO debe aprobarse con mano abierta');

const indexThroat = makeHand(0.50, 0.56, { dirX: 0, dirY: -0.12, indexOnly: true });
const gustarValid = validator.validateSign('GUSTAR', [indexThroat], defaultAnchors);
assert.strictEqual(gustarValid.valid, true, `GUSTAR debe aprobarse con índice en garganta: ${gustarValid.diag}`);
console.log('  ✅ [PASS] 5. GUSTAR rechaza mano abierta y aprueba índice en garganta.');

// 6. NOMBRE: rechazar mano abierta o 1 sola mano; aprobar 2 manos con 2 dedos
const nombre1 = validator.validateSign('NOMBRE', [makeHand(0.50, 0.60, { twoFingers: true })], defaultAnchors, 1);
assert.strictEqual(nombre1.valid, false, 'NOMBRE NO debe aprobarse con 1 sola mano');

const nombre2 = validator.validateSign(
  'NOMBRE',
  [
    makeHand(0.48, 0.60, { dirX: 0.08, dirY: -0.04, twoFingers: true }),
    makeHand(0.52, 0.62, { dirX: -0.08, dirY: -0.04, twoFingers: true })
  ],
  defaultAnchors,
  1
);
assert.strictEqual(nombre2.valid, true, `NOMBRE debe aprobarse con 2 manos de 2 dedos en pecho: ${nombre2.diag}`);
console.log('  ✅ [PASS] 6. NOMBRE rechaza 1 mano y aprueba 2 manos con índice+medio.');

// 7. LICOR: rechazar palma plana de 5 dedos; aprobar copa/Y cerca de barbilla
const flatChin = makeHand(0.50, 0.45, { dirX: 0, dirY: -0.10, open: true });
const licorFlat = validator.validateSign('LICOR', [flatChin], defaultAnchors, 1);
assert.strictEqual(licorFlat.valid, false, 'LICOR NO debe aprobarse con palma plana de 5 dedos');

const cupChin = makeHand(0.50, 0.45, { dirX: 0, dirY: -0.10, cupY: true });
const licorValid = validator.validateSign('LICOR', [cupChin], defaultAnchors, 1);
assert.strictEqual(licorValid.valid, true, `LICOR debe aprobarse con forma de copa/Y en barbilla: ${licorValid.diag}`);
console.log('  ✅ [PASS] 7. LICOR rechaza palma abierta y aprueba copa/Y en barbilla.');

// 8. BUENOS: rechazar punto 2 (Contacto) sin mano base; aprobar con ambas manos abiertas en pecho
const buenosNoBase = validator.validateSign('BUENOS', [makeHand(0.50, 0.60, { open: true })], defaultAnchors, 1);
assert.strictEqual(buenosNoBase.valid, false, 'BUENOS contacto NO debe aprobarse sin mano base');

const buenosWithBase = validator.validateSign(
  'BUENOS',
  [
    makeHand(0.50, 0.58, { open: true }),
    makeHand(0.50, 0.64, { open: true })
  ],
  defaultAnchors,
  1
);
assert.strictEqual(buenosWithBase.valid, true, `BUENOS debe aprobarse con mano activa sobre mano base: ${buenosWithBase.diag}`);
console.log('  ✅ [PASS] 8. BUENOS requiere mano base para el punto de contacto.');

// 9. TARDES con MediaPipe Pose: rechazar antebrazos sin cruzar; aprobar cruce real de codos/muñecas
const poseUncrossed = {
  ...defaultAnchors,
  pose: {
    leftElbow: { x: 0.72, y: 0.65 },
    leftWrist: { x: 0.72, y: 0.45 },
    rightElbow: { x: 0.28, y: 0.65 },
    rightWrist: { x: 0.28, y: 0.45 }
  }
};
const tardesPoseFail = validator.validateSign('TARDES', [crossRight, crossLeft], poseUncrossed);
assert.strictEqual(tardesPoseFail.valid, false, 'TARDES con Pose NO debe aprobarse si antebrazos están verticales');

const poseCrossed = {
  ...defaultAnchors,
  pose: {
    leftElbow: { x: 0.72, y: 0.60 },
    leftWrist: { x: 0.44, y: 0.58 },
    rightElbow: { x: 0.28, y: 0.60 },
    rightWrist: { x: 0.56, y: 0.58 }
  }
};
const tardesPosePass = validator.validateSign('TARDES', [crossRight, crossLeft], poseCrossed);
assert.strictEqual(tardesPosePass.valid, true, `TARDES con Pose debe aprobarse al cruzar antebrazos: ${tardesPosePass.diag}`);
console.log('  ✅ [PASS] 9. TARDES valida cruce real de antebrazos con MediaPipe Pose.');

// 10. NOCHES y TARDES con 0 manos en Hands (ocluídas) pero antebrazos cruzados en MediaPipe Pose
const noches0Hands = validator.validateSign('NOCHES', [], poseCrossed);
assert.strictEqual(noches0Hands.valid, true, `NOCHES con Pose (0 manos en Hands) debe aprobarse: ${noches0Hands.diag}`);
const tardes1HandPose = validator.validateSign('TARDES', [crossRight], poseCrossed);
assert.strictEqual(tardes1HandPose.valid, true, `TARDES con Pose y 1 mano en Hands debe aprobarse: ${tardes1HandPose.diag}`);
console.log('  ✅ [PASS] 10. NOCHES (0 manos) y TARDES (1 mano) aprueban mediante MediaPipe Pose.');

// 11. BUENOS (oclusión), ANNOS (1 mano/puños apilados) y DIAS (brazos abiertos) respaldados por MediaPipe Pose
const poseWristsNear = {
  ...defaultAnchors,
  pose: {
    leftWrist: { x: 0.49, y: 0.62 },
    rightWrist: { x: 0.52, y: 0.60 }
  }
};
const buenosPose1Hand = validator.validateSign('BUENOS', [makeHand(0.50, 0.58, { open: true })], poseWristsNear, 1);
assert.strictEqual(buenosPose1Hand.valid, true, `BUENOS contacto debe aprobarse si Pose detecta ambas muñecas en pecho: ${buenosPose1Hand.diag}`);

const annosPose0Hands = validator.validateSign('ANNOS', [], poseWristsNear);
assert.strictEqual(annosPose0Hands.valid, true, `ANNOS debe aprobarse si Pose detecta ambas muñecas juntas en torso: ${annosPose0Hands.diag}`);

const poseWideArms = {
  ...defaultAnchors,
  pose: {
    leftWrist: { x: 0.78, y: 0.52 },
    rightWrist: { x: 0.22, y: 0.52 }
  }
};
const diasPose = validator.validateSign('DIAS', [], poseWideArms, 1);
assert.strictEqual(diasPose.valid, true, `DIAS debe aprobarse si Pose detecta ambos brazos abiertos: ${diasPose.diag}`);
console.log('  ✅ [PASS] 11. BUENOS, ANNOS y DIAS validan correctamente con MediaPipe Pose.');

// 12. LICOR también acepta el dedo índice en gancho frente a rostro/barbilla (LSC70 LICOR.jpg)
const hookChin = makeHand(0.50, 0.44, { dirX: 0, dirY: -0.10, indexOnly: true });
const licorHook = validator.validateSign('LICOR', [hookChin], defaultAnchors, 1);
assert.strictEqual(licorHook.valid, true, `LICOR debe aceptar índice en gancho frente al rostro: ${licorHook.diag}`);
console.log('  ✅ [PASS] 12. LICOR aprueba índice en gancho y forma copa/Y.');

/**
 * Constructores precisos de manos LSC70 para letras O, C y D
 */
function makeLetterOHan(wx = 0.48, wy = 0.50) {
  const lm = Array.from({ length: 21 }, () => ({ x: wx, y: wy, z: 0 }));
  lm[0] = { x: wx, y: wy, z: 0 };
  lm[1] = { x: wx - 0.025, y: wy - 0.02, z: 0 };
  lm[2] = { x: wx - 0.04, y: wy - 0.04, z: 0 };
  lm[3] = { x: wx - 0.032, y: wy - 0.075, z: 0 };
  lm[4] = { x: wx - 0.025, y: wy - 0.10, z: 0 };
  lm[5] = { x: wx + 0.015, y: wy - 0.07, z: 0 };
  lm[6] = { x: wx + 0.025, y: wy - 0.11, z: 0 };
  lm[7] = { x: wx + 0.005, y: wy - 0.112, z: 0 };
  lm[8] = { x: wx - 0.018, y: wy - 0.102, z: 0 }; // Pinza cerrada tocando pulgar
  lm[9] = { x: wx, y: wy - 0.08, z: 0 }; // palmScale = 0.08
  lm[10] = { x: wx + 0.02, y: wy - 0.12, z: 0 };
  lm[11] = { x: wx, y: wy - 0.11, z: 0 };
  lm[12] = { x: wx - 0.015, y: wy - 0.098, z: 0 }; // Medio tocando pulgar
  lm[13] = { x: wx - 0.01, y: wy - 0.075, z: 0 };
  lm[14] = { x: wx + 0.01, y: wy - 0.105, z: 0 };
  lm[15] = { x: wx - 0.005, y: wy - 0.095, z: 0 };
  lm[16] = { x: wx - 0.01, y: wy - 0.085, z: 0 };
  lm[17] = { x: wx - 0.02, y: wy - 0.07, z: 0 };
  lm[18] = { x: wx, y: wy - 0.095, z: 0 };
  lm[19] = { x: wx - 0.005, y: wy - 0.085, z: 0 };
  lm[20] = { x: wx - 0.005, y: wy - 0.075, z: 0 };
  return lm;
}

function makeLetterCHand(wx = 0.50, wy = 0.56) {
  const lm = Array.from({ length: 21 }, () => ({ x: wx, y: wy, z: 0 }));
  lm[0] = { x: wx, y: wy, z: 0 };
  lm[1] = { x: wx - 0.03, y: wy - 0.02, z: 0 };
  lm[2] = { x: wx - 0.05, y: wy - 0.04, z: 0 };
  lm[3] = { x: wx - 0.068, y: wy - 0.07, z: 0 };
  lm[4] = { x: wx - 0.08, y: wy - 0.10, z: 0 }; // Pulgar bien abierto lejos de los dedos
  lm[5] = { x: wx + 0.01, y: wy - 0.07, z: 0 };
  lm[6] = { x: wx + 0.01, y: wy - 0.13, z: 0 };
  lm[7] = { x: wx - 0.005, y: wy - 0.14, z: 0 };
  lm[8] = { x: wx - 0.02, y: wy - 0.14, z: 0 }; // Índice arqueado en C (pinza abierta ~0.90*palm)
  lm[9] = { x: wx, y: wy - 0.08, z: 0 }; // palmScale = 0.08
  lm[10] = { x: wx, y: wy - 0.14, z: 0 };
  lm[11] = { x: wx - 0.01, y: wy - 0.145, z: 0 };
  lm[12] = { x: wx - 0.015, y: wy - 0.145, z: 0 };
  lm[13] = { x: wx - 0.01, y: wy - 0.075, z: 0 };
  lm[14] = { x: wx - 0.01, y: wy - 0.12, z: 0 };
  lm[15] = { x: wx - 0.018, y: wy - 0.125, z: 0 };
  lm[16] = { x: wx - 0.02, y: wy - 0.125, z: 0 };
  lm[17] = { x: wx - 0.02, y: wy - 0.07, z: 0 };
  lm[18] = { x: wx - 0.02, y: wy - 0.10, z: 0 };
  lm[19] = { x: wx - 0.022, y: wy - 0.105, z: 0 };
  lm[20] = { x: wx - 0.025, y: wy - 0.105, z: 0 };
  return lm;
}

// 13. Fidelidad LSC70: Letra O vs Letra C (C NO debe aprobarse como O, y O NO debe aprobarse como C)
const handO = makeLetterOHan(0.48, 0.50);
const handC = makeLetterCHand(0.50, 0.56);

const cAsO = validator.validateLetter('O', handC, defaultAnchors);
assert.strictEqual(cAsO.valid, false, `La letra C abierta JAMÁS debe aprobarse como O (${cAsO.diag})`);
assert(cAsO.score < 70, `Score de C evaluada como O debe ser < 70 (actual: ${cAsO.score})`);

const oValid = validator.validateLetter('O', handO, defaultAnchors);
assert.strictEqual(oValid.valid, true, `La letra O cerrada LSC70 debe aprobarse (${oValid.diag})`);
assert(oValid.score >= 95, `O válida debe tener score >= 95 (actual: ${oValid.score})`);
console.log('  ✅ [PASS] 13. O rechaza la C abierta y aprueba el círculo cerrado LSC70.');

// 14. O rechazada cuando se evalúa como C; C real aprobada
const oAsC = validator.validateLetter('C', handO, defaultAnchors);
assert.strictEqual(oAsC.valid, false, `La letra O cerrada NO debe aprobarse como C (${oAsC.diag})`);

const cValid = validator.validateLetter('C', handC, defaultAnchors);
assert.strictEqual(cValid.valid, true, `La letra C abierta LSC70 debe aprobarse (${cValid.diag})`);
assert(cValid.score >= 95, `C válida debe tener score >= 95 (actual: ${cValid.score})`);
console.log('  ✅ [PASS] 14. C rechaza la O cerrada y aprueba el semicírculo abierto LSC70.');

// 15. Letra D (índice erguido) rechazada cuando el objetivo es O, y O caída por debajo del pecho rechazada
const handIndexOnlyD = makeHand(0.50, 0.50, { dirX: 0, dirY: -0.10, indexOnly: true });
const dAsO = validator.validateLetter('O', handIndexOnlyD, defaultAnchors);
assert.strictEqual(dAsO.valid, false, 'Un índice erguido (D/1) NO debe aprobarse como O');

const oLowHand = makeLetterOHan(0.48, 0.85);
const oTooLow = validator.validateLetter('O', oLowHand, defaultAnchors);
assert.strictEqual(oTooLow.valid, false, 'La O por debajo del pecho debe pedir subir cerca de la mandíbula (LSC70)');
console.log('  ✅ [PASS] 15. O rechaza dedo índice erguido y exige altura cercana a mandíbula/rostro.');

console.log('\n🎉 ¡TODAS LAS PRUEBAS DE SignAnatomyValidator PASARON AL 100%! (15/15)\n');
