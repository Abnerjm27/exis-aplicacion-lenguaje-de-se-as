/**
 * LSC Learn · Proyecto EXIS
 * tests/test_lesson_session_unit.js
 * 
 * Pruebas unitarias para LessonSessionController (app/js/lesson-session.js)
 * Valida POO estricta, ciclo de vida, generación de 4 opciones sin duplicados,
 * avance de fases ('demo' -> 'quiz' -> 'practice' -> 'summary'), validación de respuestas,
 * práctica con umbral 85% durante 1.2s y cálculo de XP (+50 XP).
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 [TEST] Iniciando suite de pruebas unitarias para LessonSessionController...\n');

// 1. Simular entorno global de navegador (Window, Document, Mock DOM)
const mockElements = new Map();

function createMockElement(id, tagName = 'div') {
  const classListSet = new Set();
  const listeners = {};
  const el = {
    id,
    tagName: tagName.toUpperCase(),
    textContent: '',
    innerHTML: '',
    src: '',
    style: {},
    dataset: {},
    disabled: false,
    load: () => {},
    play: () => Promise.resolve(),
    pause: () => {},
    setAttribute: (attr, val) => { el[attr] = val; },
    getAttribute: (attr) => el[attr] || null,
    classList: {
      add: (...cls) => cls.forEach(c => classListSet.add(c)),
      remove: (...cls) => cls.forEach(c => classListSet.delete(c)),
      contains: (c) => classListSet.has(c),
      toggle: (c, force) => {
        if (force === undefined) {
          classListSet.has(c) ? classListSet.delete(c) : classListSet.add(c);
        } else if (force) {
          classListSet.add(c);
        } else {
          classListSet.delete(c);
        }
      }
    },
    addEventListener: (event, handler) => {
      listeners[event] = listeners[event] || [];
      listeners[event].push(handler);
    },
    removeEventListener: (event, handler) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter(h => h !== handler);
      }
    },
    click: () => {
      if (listeners['click']) {
        listeners['click'].forEach(fn => fn({ target: el, preventDefault: () => {} }));
      }
    },
    querySelectorAll: (selector) => [],
    querySelector: (selector) => null,
    appendChild: (child) => child
  };
  mockElements.set(id, el);
  return el;
}

const documentMock = {
  getElementById: (id) => {
    if (!mockElements.has(id)) {
      return createMockElement(id);
    }
    return mockElements.get(id);
  },
  createElement: (tagName) => createMockElement('elem-' + Math.random().toString(36).substr(2, 6), tagName),
  addEventListener: () => {},
  removeEventListener: () => {}
};

// Cargar SIGNS_DATA
const signsDataPath = path.join(__dirname, '..', 'app', 'js', 'signs-data.js');
const signsDataCode = fs.readFileSync(signsDataPath, 'utf8');

// Configurar global window
global.window = global;
global.document = documentMock;

eval(signsDataCode);

assert(global.window.SIGNS_DATA, 'FAIL: SIGNS_DATA no se cargó correctamente');
console.log(`✅ SIGNS_DATA cargado: ${global.window.SIGNS_DATA.words.length} palabras y ${global.window.SIGNS_DATA.letters.length} letras.`);

// 2. Cargar LessonSessionController
const lessonSessionPath = path.join(__dirname, '..', 'app', 'js', 'lesson-session.js');

if (!fs.existsSync(lessonSessionPath)) {
  console.log('⚠️ [TDD] app/js/lesson-session.js no existe todavía (esperado en paso rojo de TDD).');
  process.exit(1);
}

const lessonCode = fs.readFileSync(lessonSessionPath, 'utf8');
eval(lessonCode);

const LessonSessionController = global.window.LessonSessionController;
assert(LessonSessionController, 'FAIL: LessonSessionController no está expuesto en window');

let testsPassed = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(err);
    process.exit(1);
  }
}

// -------------------------------------------------------------
// TEST SUITE
// -------------------------------------------------------------

runTest('1. Instanciación y métodos de ciclo de vida estándar', () => {
  const controller = typeof LessonSessionController === 'function' && LessonSessionController.prototype
    ? new LessonSessionController()
    : LessonSessionController;

  assert(typeof controller.init === 'function', 'init debe ser una función');
  assert(typeof controller.start === 'function' || typeof controller.startLesson === 'function', 'start/startLesson debe existir');
  assert(typeof controller.update === 'function', 'update debe ser una función');
  assert(typeof controller.reset === 'function', 'reset debe ser una función');
  assert(typeof controller.destroy === 'function', 'destroy debe ser una función');
  assert(typeof controller.nextPhase === 'function', 'nextPhase debe ser una función');
  assert(typeof controller.submitQuizAnswer === 'function', 'submitQuizAnswer debe existir');
});

runTest('2. Generación de distractores sin duplicados (4 opciones únicas, misma categoría)', () => {
  const controller = new LessonSessionController();
  controller.init();
  controller.startLesson('HOLA', { planId: 'saludos-basicos', stepIndex: 0 });

  const options = controller.getQuizOptions();
  assert.strictEqual(options.length, 4, 'Deben generarse exactamente 4 opciones');

  const uniqueIds = new Set(options.map(o => o.id));
  assert.strictEqual(uniqueIds.size, 4, 'Las 4 opciones deben ser IDs únicas sin duplicados');

  const correctOption = options.find(o => o.id === 'HOLA');
  assert(correctOption, 'La opción correcta "HOLA" debe estar presente');
  assert.strictEqual(correctOption.isCorrect, true, 'La opción "HOLA" debe tener isCorrect === true');

  const distractors = options.filter(o => o.id !== 'HOLA');
  assert.strictEqual(distractors.length, 3, 'Deben existir exactamente 3 distractores');
  distractors.forEach(d => {
    assert.strictEqual(d.isCorrect, false, 'Los distractores deben tener isCorrect === false');
    assert.strictEqual(d.category, 'words', 'Los distractores para HOLA deben ser de la categoría words');
  });

  // Probar con letras
  controller.startLesson('A', { planId: 'abecedario-1', stepIndex: 0 });
  const letterOptions = controller.getQuizOptions();
  assert.strictEqual(letterOptions.length, 4, 'Deben generarse 4 opciones para letras');
  const uniqueLetterIds = new Set(letterOptions.map(o => o.id));
  assert.strictEqual(letterOptions.length, uniqueLetterIds.size, 'Opciones de letra sin duplicados');
  const correctLetter = letterOptions.find(o => o.id === 'A');
  assert(correctLetter && correctLetter.isCorrect, 'Letra A marcada correcta');
  const letterDistractors = letterOptions.filter(o => o.id !== 'A');
  letterDistractors.forEach(d => {
    assert.strictEqual(d.category, 'letters', 'Distractores para A deben ser de la categoría letters');
  });
});

runTest('3. Flujo de fases: demo -> quiz -> practice -> summary', () => {
  const controller = new LessonSessionController();
  const phasesEncountered = [];

  controller.init({
    onPhaseChange: (phase) => phasesEncountered.push(phase)
  });

  controller.startLesson('YO');
  assert.strictEqual(controller.getCurrentPhase(), 'demo', 'Fase inicial debe ser demo');
  assert.strictEqual(controller.isActive(), true, 'Sesión debe estar activa');

  controller.nextPhase();
  assert.strictEqual(controller.getCurrentPhase(), 'quiz', 'Segunda fase debe ser quiz');

  controller.nextPhase();
  assert.strictEqual(controller.getCurrentPhase(), 'practice', 'Tercera fase debe ser practice');

  controller.nextPhase();
  assert.strictEqual(controller.getCurrentPhase(), 'summary', 'Cuarta fase debe ser summary');

  assert.deepStrictEqual(phasesEncountered, ['demo', 'quiz', 'practice', 'summary'], 'Historial de fases correcto');
});

runTest('4. Validación de respuestas en fase Quiz (acierto y error con feedback)', () => {
  const controller = new LessonSessionController();
  controller.init();
  controller.startLesson('BUENOS');
  controller.nextPhase(); // pasa a 'quiz'

  // 1. Respuesta incorrecta
  const wrongResult = controller.submitQuizAnswer('NOCHES');
  assert.strictEqual(wrongResult.correct, false, 'Respuesta incorrecta debe evaluarse como false');
  const stateAfterWrong = controller.getState();
  assert.strictEqual(stateAfterWrong.quizPassed, false, 'quizPassed debe ser false tras fallo');
  assert.strictEqual(stateAfterWrong.quizAttempts, 1, 'quizAttempts debe registrar 1 intento');

  // 2. Respuesta correcta
  const rightResult = controller.submitQuizAnswer('BUENOS');
  assert.strictEqual(rightResult.correct, true, 'Respuesta correcta debe evaluarse como true');
  const stateAfterRight = controller.getState();
  assert.strictEqual(stateAfterRight.quizPassed, true, 'quizPassed debe ser true tras acierto');
  assert.strictEqual(stateAfterRight.quizAttempts, 2, 'quizAttempts debe registrar 2 intentos');
});

runTest('5. Validación de fase Practice con MediaPipe: umbral 85% durante 1.2 segundos', () => {
  const controller = new LessonSessionController();
  controller.init();
  controller.startLesson('DIAS');
  controller.nextPhase(); // quiz
  controller.submitQuizAnswer('DIAS');
  controller.nextPhase(); // practice

  assert.strictEqual(controller.getCurrentPhase(), 'practice');

  // Simular frames con precisión baja (<85%) -> no debe completar
  for (let i = 0; i < 10; i++) {
    const passed = controller.handlePracticeFrame(70, 100);
    assert.strictEqual(passed, false, 'No debe pasar con precisión 70%');
  }

  // Simular frames con precisión alta (>=85%) acumulando tiempo
  // 1200ms acumulados a 100ms por paso = 12 pasos
  let passed = false;
  for (let i = 0; i < 11; i++) {
    passed = controller.handlePracticeFrame(88, 100);
    assert.strictEqual(passed, false, `No debe pasar antes de 1200ms (paso ${i})`);
  }

  // Paso 12 alcanza 1200ms
  passed = controller.handlePracticeFrame(92, 100);
  assert.strictEqual(passed, true, 'Debe marcar práctica completada al superar 1200ms a >=85%');

  const state = controller.getState();
  assert.strictEqual(state.practicePassed, true, 'practicePassed debe ser true');
  assert(state.practiceScore >= 85, 'practiceScore debe ser >= 85%');
});

runTest('6. Resumen de lección, otorgamiento de +50 XP y sincronización con managers', () => {
  let profileSignRecorded = null;
  let profileXpRecorded = null;
  let planSignCompleted = null;
  let completedSummary = null;

  global.window.AuthProfileManager = {
    recordSignMastered: (signId, xp) => {
      profileSignRecorded = signId;
      profileXpRecorded = xp;
    }
  };

  global.window.LearningPlanManager = {
    markSignCompletedInPlan: (signId) => {
      planSignCompleted = signId;
    }
  };

  const controller = new LessonSessionController();
  controller.init({
    onLessonComplete: (summary) => {
      completedSummary = summary;
    }
  });

  controller.startLesson('NOMBRE', { planId: 'plan-1', stepIndex: 2 });
  controller.nextPhase(); // quiz
  controller.submitQuizAnswer('NOMBRE');
  controller.nextPhase(); // practice
  controller.handlePracticeFrame(90, 1300); // completa práctica
  controller.nextPhase(); // summary

  assert.strictEqual(controller.getCurrentPhase(), 'summary');
  assert.strictEqual(profileSignRecorded, 'NOMBRE', 'Debe registrar NOMBRE en AuthProfileManager');
  assert.strictEqual(profileXpRecorded, 50, 'Debe otorgar +50 XP');
  assert.strictEqual(planSignCompleted, 'NOMBRE', 'Debe notificar a LearningPlanManager');

  assert(completedSummary, 'Callback onLessonComplete debe haber sido invocado');
  assert.strictEqual(completedSummary.signId, 'NOMBRE');
  assert.strictEqual(completedSummary.earnedXp, 50);
  assert.strictEqual(completedSummary.quizPassed, true);
  assert.strictEqual(completedSummary.practicePassed, true);
});

runTest('7. Ciclo de vida y destrucción limpia (destroy/reset) sin dejar estado residual', () => {
  let exitCalled = false;
  const controller = new LessonSessionController();
  controller.init({
    onExit: () => { exitCalled = true; }
  });

  controller.startLesson('LICOR');
  assert.strictEqual(controller.isActive(), true);

  controller.destroy();
  assert.strictEqual(controller.isActive(), false, 'isActive debe ser false tras destroy');
  assert.strictEqual(controller.getCurrentPhase(), null, 'Fase debe ser null tras destroy');
  assert.strictEqual(exitCalled, true, 'onExit debe ser llamado en destroy');

  // Iniciar de nuevo y reset
  controller.startLesson('A');
  assert.strictEqual(controller.isActive(), true);
  controller.reset();
  assert.strictEqual(controller.isActive(), false, 'isActive debe ser false tras reset');
});

console.log(`\n🎉 Todas las pruebas pasaron exitosamente (${testsPassed}/${totalTests}).`);
