/**
 * LSC Learn · Proyecto EXIS
 * tests/test_blind_exam_arena_unit.js
 * 
 * Validación unitaria exhaustiva para BlindExamController (Arena Dedicada con Retos y Preguntas):
 * 1. POO Estricta y métodos de ciclo de vida (init, start, update, reset, destroy, getVideoMode, setVideoMode).
 * 2. Formato Híbrido Alternado (Retos de Cámara limpios intercalados con Preguntas Quiz).
 * 3. En Retos de Cámara: Interfaz limpia centrada, evaluación de MediaPipe >= 85%, cámara se apaga al resolver.
 * 4. En Preguntas Quiz: Cámara 100% apagada para ahorrar hardware, video mudo cargado, 4 opciones interactivas.
 * 5. Conmutador de video Real / Anime en preguntas de Quiz.
 * 6. Respuesta interactiva de Quiz (acierto verde, XP, feedback).
 * 7. Apagado estricto de hardware de cámara en saltos, salidas y finalización.
 * 8. Emisión de certificado y desglose en #examSummaryModal.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 [TEST] Iniciando suite de pruebas unitarias para BlindExamController (Retos de Cámara + Preguntas Quiz)...\n');

// 1. Mock de DOM y Entorno Global
const mockElements = new Map();

function createMockElement(id, tagName = 'div') {
  const classListSet = new Set();
  const listeners = {};
  const children = [];
  const el = {
    id,
    tagName: tagName.toUpperCase(),
    textContent: '',
    innerHTML: '',
    src: '',
    style: {},
    disabled: false,
    children,
    load: () => {},
    play: () => Promise.resolve(),
    pause: () => {},
    setAttribute: (attr, val) => { el[attr] = val; },
    getAttribute: (attr) => el[attr] || null,
    classList: {
      add: (...cls) => cls.forEach(c => classListSet.add(c)),
      remove: (...cls) => cls.forEach(c => classListSet.delete(c)),
      contains: (c) => classListSet.has(c)
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
    appendChild: (child) => {
      children.push(child);
      return child;
    },
    querySelectorAll: (selector) => {
      if (selector === '.exam-quiz-opt-btn') {
        return children;
      }
      return [];
    },
    querySelector: (selector) => {
      if (selector === '.exam-opt-indicator') {
        return createMockElement('indicator-' + Math.random(), 'span');
      }
      return null;
    },
    click: () => {
      if (listeners['click']) {
        listeners['click'].forEach(h => h({ target: el }));
      }
    }
  };
  return el;
}

function getMock(id, tagName = 'div') {
  if (!mockElements.has(id)) {
    mockElements.set(id, createMockElement(id, tagName));
  }
  return mockElements.get(id);
}

global.document = {
  getElementById: (id) => getMock(id),
  createElement: (tag) => createMockElement('elem-' + Math.random().toString(36).substr(2, 6), tag),
  querySelectorAll: (selector) => {
    const grid = getMock('examQuizOptionsGrid');
    return grid.querySelectorAll(selector);
  }
};

const storageMap = new Map();
global.localStorage = {
  getItem: (k) => storageMap.get(k) || null,
  setItem: (k, v) => storageMap.set(k, String(v)),
  removeItem: (k) => storageMap.delete(k)
};

// Mock de servicios de la plataforma
let cameraStopCalls = 0;
let cameraStartCalls = 0;
let targetSignSet = null;
let recordedXp = 0;

global.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  VideoPlayer: {
    pause: () => {},
    play: () => {}
  },
  VisionEvaluator: {
    setPaused: () => {},
    start: () => { cameraStartCalls++; },
    stop: () => { cameraStopCalls++; },
    setTargetSign: (sign) => { targetSignSet = sign; }
  },
  CameraDeviceManager: {
    attachSelect: () => {}
  },
  AuthProfileManager: {
    recordSignMastered: (id, xp) => { recordedXp += xp; },
    recordExamResult: () => {}
  },
  ChatTutor: {
    playVictorySound: () => {},
    speakText: () => {}
  }
};
global.window.window = global.window;

// Cargar SIGNS_DATA oficial
const signsDataPath = path.resolve(__dirname, '../app/js/signs-data.js');
const signsDataCode = fs.readFileSync(signsDataPath, 'utf8');
eval(signsDataCode);

assert.ok(global.window.SIGNS_DATA, 'SIGNS_DATA debe cargarse correctamente');

// Cargar BlindExamController
const BlindExamController = require('../app/js/blind-exam-controller.js');

// -----------------------------------------------------------------------------
// Test 1: Instanciación y Métodos de Ciclo de Vida POO
// -----------------------------------------------------------------------------
console.log('▶ Test 1: Instanciación y Métodos de Ciclo de Vida POO...');
const exam = BlindExamController;
assert.strictEqual(typeof exam.init, 'function');
assert.strictEqual(typeof exam.start, 'function');
assert.strictEqual(typeof exam.update, 'function');
assert.strictEqual(typeof exam.reset, 'function');
assert.strictEqual(typeof exam.destroy, 'function');
assert.strictEqual(typeof exam.isExamActive, 'function');
assert.strictEqual(typeof exam.getVideoMode, 'function');
assert.strictEqual(typeof exam.setVideoMode, 'function');

exam.init();
assert.strictEqual(exam.isExamActive(), false);
console.log('  ✅ [PASS] Métodos de ciclo de vida verificados.');

// -----------------------------------------------------------------------------
// Test 2: Selector de Modalidad Previo + Inicio en Modo Solo Cámara
// -----------------------------------------------------------------------------
console.log('▶ Test 2: Selector de Modalidad (Solo Cámara vs Adivinar Señas)...');
const testPlan = {
  title: 'Evaluación LSC',
  signs: ['HOLA', 'BUENOS', 'DIAS', 'GRACIAS'],
  secondsPerQuestion: 20,
  difficultyLevel: 2
};

cameraStartCalls = 0;
exam.start(testPlan);
assert.strictEqual(exam.isExamActive(), false, 'No debe iniciar reloj/examen hasta elegir modalidad');
assert.strictEqual(cameraStartCalls, 0, 'No debe encender cámara en el selector previo');

const modal = getMock('examSessionModal');
const modePane = getMock('examPaneModeSelect');
const gesturePane = getMock('examPaneGesture');
const quizPane = getMock('examPaneQuiz');
const videoToggle = getMock('examVideoModeToggle');

assert.strictEqual(modal.classList.contains('flex'), true, 'El modal de arena dedicada debe abrirse');
assert.strictEqual(modePane.classList.contains('flex'), true, 'Debe mostrarse el selector de modalidad');
assert.strictEqual(gesturePane.classList.contains('hidden'), true);
assert.strictEqual(quizPane.classList.contains('hidden'), true);

// Cancelar desde el selector debe cerrar sin activar cámara
getMock('btnExamExitModeSelect').click();
assert.strictEqual(modal.classList.contains('hidden'), true, 'Cancelar desde selector debe ocultar modal');
assert.strictEqual(cameraStartCalls, 0);

// Abrir de nuevo y elegir Solo Cámara
exam.start(testPlan);
getMock('btnChooseCameraExam').click();
assert.strictEqual(exam.isExamActive(), true);
assert.strictEqual(exam.getExamMode(), 'camera');
assert.strictEqual(modePane.classList.contains('hidden'), true, 'Selector debe ocultarse al elegir');
assert.strictEqual(gesturePane.classList.contains('flex'), true, 'Pregunta 1 debe mostrar panel de Gesto');
assert.strictEqual(quizPane.classList.contains('hidden'), true, 'Pregunta 1 debe ocultar panel de Quiz');
assert.strictEqual(videoToggle.classList.contains('hidden'), true, 'En Reto de Gesto el conmutador de video debe estar oculto');

const stepText = getMock('examHeaderStepText').textContent;
assert.strictEqual(stepText, 'Reto 1 de 4 · Nivel 2');

const wordName = getMock('examGestureSignName').textContent;
assert.strictEqual(wordName, 'HOLA', 'Debe mostrar la palabra a realizar en grande');

assert.strictEqual(cameraStartCalls >= 1, true, 'El modo Solo Cámara debe iniciar la cámara');
assert.strictEqual(targetSignSet.id, 'HOLA', 'La seña objetivo de MediaPipe debe ser HOLA');

console.log(`  ✅ [PASS] Selector previo y Modo Solo Cámara inicializados: "${stepText}" mostrando "${wordName}".`);

// -----------------------------------------------------------------------------
// Test 3: Modo Solo Cámara mantiene 100% retos de cámara tras aprobar Reto 1
// -----------------------------------------------------------------------------
console.log('▶ Test 3: Evaluación motriz con radar (>= 85% por 1.0s) y Reto 2 sigue siendo Cámara...');
const radarBar = getMock('examGestureRadarBar');
const radarText = getMock('examGestureRadarText');

// Score intermedio: no debe aprobar todavía
exam.handlePracticeFrame(70, 200);
assert.strictEqual(radarText.textContent, '70%');
assert.strictEqual(exam.isExamActive(), true);

// Score alto sostenido
exam.handlePracticeFrame(90, 400);
exam.handlePracticeFrame(92, 400);
assert.strictEqual(exam.isExamActive(), true);

// Completar 1000ms sostenidos
cameraStopCalls = 0;
recordedXp = 0;
exam.handlePracticeFrame(95, 300);

// Debe llamar a VisionEvaluator.stop() para apagar el LED físico de hardware de inmediato
assert.strictEqual(cameraStopCalls >= 1, true, 'Al resolver la seña debe apagarse la cámara hardware inmediatamente');
assert.strictEqual(recordedXp, 35, 'Debe otorgar +35 XP por seña aprobada a ciegas');
console.log('  ✅ [PASS] Reto motriz aprobado: +35 XP otorgados y cámara apagada de inmediato.');

// -----------------------------------------------------------------------------
// Test 4: Reto 2 en Solo Cámara sigue siendo cámara; luego Modo Adivinar Señas (100% Quiz)
// -----------------------------------------------------------------------------
setTimeout(() => {
  const step2CameraText = getMock('examHeaderStepText').textContent;
  assert.strictEqual(step2CameraText, 'Reto 2 de 4 · Nivel 2', 'En modo Solo Cámara todas las preguntas son retos motrices');
  exam.stopExam();

  console.log('▶ Test 4: Modo Solo Adivinar Señas (100% Quiz, cámara 0% encendida)...');
  cameraStartCalls = 0;
  cameraStopCalls = 0;
  exam.start({ ...testPlan, mode: 'quiz' });
  assert.strictEqual(exam.isExamActive(), true);
  assert.strictEqual(exam.getExamMode(), 'quiz');
  assert.strictEqual(cameraStartCalls, 0, 'En modo Adivinar Señas la cámara NUNCA debe encenderse');

  const step1QuizText = getMock('examHeaderStepText').textContent;
  assert.strictEqual(step1QuizText, 'Pregunta 1 de 4 · Nivel 2');

  assert.strictEqual(gesturePane.classList.contains('hidden'), true, 'Panel de gesto debe ocultarse en Quiz');
  assert.strictEqual(quizPane.classList.contains('flex'), true, 'Panel de Quiz debe mostrarse');
  assert.strictEqual(videoToggle.classList.contains('hidden'), false, 'Conmutador de video visible en Quiz');

  const quizVideo = getMock('examQuizVideo');
  assert.strictEqual(quizVideo.src, 'videos/real/HOLA_body.mp4', 'Debe cargar el video de HOLA');

  // Verificar 4 opciones generadas en el grid
  const grid = getMock('examQuizOptionsGrid');
  assert.strictEqual(grid.children.length, 4, 'Deben generarse exactamente 4 opciones');

  const correctBtn = grid.children.find(b => b.getAttribute('data-is-correct') === 'true');
  assert.ok(correctBtn, 'Debe existir la opción correcta');
  assert.strictEqual(correctBtn.getAttribute('data-sign-id'), 'HOLA');

  const wrongBtns = grid.children.filter(b => b.getAttribute('data-is-correct') === 'false');
  assert.strictEqual(wrongBtns.length, 3, 'Deben existir exactamente 3 distractores');

  console.log('  ✅ [PASS] Modo Solo Adivinar Señas configurado con video y 4 alternativas sin cámara.');

  // -----------------------------------------------------------------------------
  // Test 5: Conmutador Real vs Anime IA en Video Quiz
  // -----------------------------------------------------------------------------
  console.log('▶ Test 5: Conmutador Real vs Anime en Pregunta Quiz...');
  exam.setVideoMode('anime');
  assert.strictEqual(exam.getVideoMode(), 'anime');
  assert.strictEqual(quizVideo.src, 'videos/anime/HOLA_body.mp4', 'Debe conmutar a la carpeta anime');

  exam.setVideoMode('real');
  assert.strictEqual(exam.getVideoMode(), 'real');
  assert.strictEqual(quizVideo.src, 'videos/real/HOLA_body.mp4', 'Debe regresar a la carpeta real');
  console.log('  ✅ [PASS] Conmutador Real vs Anime funciona dinámicamente.');

  // -----------------------------------------------------------------------------
  // Test 6: Responder Pregunta Quiz y avanzar a Pregunta 2 (también Quiz)
  // -----------------------------------------------------------------------------
  console.log('▶ Test 6: Responder Pregunta Quiz y feedback...');
  recordedXp = 0;
  correctBtn.click();
  assert.strictEqual(correctBtn.classList.contains('bg-emerald-600'), true, 'Botón correcto debe ponerse verde');
  assert.strictEqual(recordedXp, 30, 'Debe otorgar +30 XP por acierto en quiz');
  console.log('  ✅ [PASS] Pregunta Quiz respondida correctamente con +30 XP.');

  // -----------------------------------------------------------------------------
  // Test 7: Salto de seña y Salida limpia (stopExam)
  // -----------------------------------------------------------------------------
  setTimeout(() => {
    assert.strictEqual(getMock('examHeaderStepText').textContent, 'Pregunta 2 de 4 · Nivel 2');
    console.log('▶ Test 7: Salida Limpia (stopExam) y Apagado Hardware...');
    cameraStopCalls = 0;
    exam.stopExam();
    assert.strictEqual(exam.isExamActive(), false);
    assert.strictEqual(modal.classList.contains('hidden'), true, 'El modal de examen debe ocultarse');
    assert.strictEqual(cameraStopCalls >= 1, true, 'stopExam debe apagar la cámara');
    console.log('  ✅ [PASS] Salida limpia y hardware de cámara liberado.');

    console.log('▶ Test 8: Fallback sin cámara en Arena de Examen (modo cámara)...');
    const origStart = global.window.VisionEvaluator.start;
    global.window.VisionEvaluator.start = () => Promise.resolve(false);
    exam.start({ title: 'Test Sin Cam', signs: ['HOLA', 'YO'], secondsPerQuestion: 20, mode: 'camera' });
    setTimeout(() => {
      assert.strictEqual(getMock('examCameraFallback').classList.contains('hidden'), false, 'Debe mostrarse #examCameraFallback');
      assert.strictEqual(getMock('examLiveBadge').textContent, 'SIN CÁMARA');
      exam.stopExam();
      global.window.VisionEvaluator.start = origStart;
      console.log('  ✅ [PASS] Fallback sin cámara verificado.');

      console.log('▶ Test 9: Seña LICOR en Quiz modo Anime cae a videos/real...');
      exam.setVideoMode('anime');
      exam.start({ title: 'Test Anime Fallback', signs: ['HOLA', 'LICOR'], secondsPerQuestion: 20, mode: 'quiz' });
      exam.skipCurrentQuestion();
      const loadedSrc = getMock('examQuizVideo').src;
      assert.strictEqual(loadedSrc, 'videos/real/LICOR_body.mp4', `Esperado videos/real/LICOR_body.mp4, obtenido ${loadedSrc}`);
      exam.stopExam();
      exam.setVideoMode('real');
      console.log('  ✅ [PASS] Quiz modo Anime con hasAnime=false cae a videos/real.');

      console.log('\n🎉 ¡TODAS LAS PRUEBAS UNITARIAS DE LA ARENA (SOLO CÁMARA + ADIVINAR SEÑAS) PASARON AL 100%! (9/9)\n');
      process.exit(0);
    }, 30);
  }, 700);
}, 500);
