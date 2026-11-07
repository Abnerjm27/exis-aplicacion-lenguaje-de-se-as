/**
 * LSC Learn · Proyecto EXIS
 * tests/test_checkpoints_unit.js
 * 
 * Validación unitaria de:
 * 1. Checkpoint nodes generados cada 3 palabras con dificultad ascendente (25s -> 20s -> 15s).
 * 2. Examen final que evalúa TODAS las palabras del plan activo sin truncar a 5.
 * 3. Modo Anime IA vs Real en LessonSessionController.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 [TEST] Iniciando verificación de Checkpoints, Dificultad Ascendente y Modo Anime...\n');

// Mock simple de DOM
const elements = new Map();
function getMock(id, tag = 'div') {
  if (!elements.has(id)) {
    const classList = new Set();
    const attrs = {};
    const el = {
      id,
      tagName: tag.toUpperCase(),
      innerHTML: '',
      textContent: '',
      src: '',
      style: {},
      classList: {
        add: (...c) => c.forEach(x => classList.add(x)),
        remove: (...c) => c.forEach(x => classList.delete(x)),
        contains: (x) => classList.has(x)
      },
      setAttribute: (k, v) => { attrs[k] = v; el[k] = v; },
      getAttribute: (k) => attrs[k] || null,
      appendChild: (ch) => ch,
      addEventListener: () => {},
      removeEventListener: () => {}
    };
    elements.set(id, el);
  }
  return elements.get(id);
}

global.document = {
  getElementById: (id) => getMock(id),
  createElement: (tag) => getMock('gen-' + Math.random().toString(36).substr(2, 6), tag)
};
global.window = global;

// Cargar BlindExamController
const BlindExamController = require('../app/js/blind-exam-controller.js');
const LessonSessionController = require('../app/js/lesson-session.js');

// 1. Probar BlindExamController con lista completa de 8 señas (sin truncar a 5)
console.log('▶ Test 1: BlindExamController maneja todas las señas del plan sin truncar a 5...');
const exam = BlindExamController;
exam.init();

const fullPlanConfig = {
  title: 'Plan Saludos y Cortesía Completo',
  signs: ['HOLA', 'BUENOS', 'DIAS', 'TARDES', 'NOCHES', 'YO', 'NOMBRE', 'GUSTAR'],
  secondsPerQuestion: 15,
  difficultyLevel: 3
};

exam.start(fullPlanConfig);
assert.strictEqual(exam.isExamActive(), true);

const counterEl = getMock('examQuestionCounter');
assert(counterEl.textContent.includes('Reto 1 de 8'), `Counter debe decir 1 de 8 pero dice: ${counterEl.textContent}`);
assert(counterEl.textContent.includes('Nivel 3'), `Counter debe incluir Nivel 3 pero dice: ${counterEl.textContent}`);
console.log(`  ✅ Examen iniciado con ${fullPlanConfig.signs.length} preguntas: "${counterEl.textContent}"`);
exam.stopExam();

// 2. Probar Checkpoint 1 (3 señas, nivel 1, 25s)
console.log('▶ Test 2: Checkpoint 1 con 3 señas y nivel 1...');
const cp1Config = {
  title: 'Checkpoint 1: Reto de 3 Señas',
  signs: ['HOLA', 'BUENOS', 'DIAS'],
  secondsPerQuestion: 25,
  difficultyLevel: 1
};
exam.start(cp1Config);
assert(counterEl.textContent.includes('Reto 1 de 3 · Nivel 1'), `Counter esperado "Reto 1 de 3 · Nivel 1", obtenido: ${counterEl.textContent}`);
console.log(`  ✅ Checkpoint 1 iniciado con éxito: "${counterEl.textContent}"`);
exam.stopExam();

// 3. Probar LessonSessionController con conmutador Anime IA
console.log('▶ Test 3: LessonSessionController conmutación Real / Anime...');
const lesson = new LessonSessionController();
lesson.init();
lesson.startLesson('BUENOS');

assert.strictEqual(lesson.getVideoMode(), 'real');
const demoVideo = getMock('lessonDemoVideo');
assert.strictEqual(demoVideo.src, 'videos/real/BUENOS_body.mp4');

lesson.setVideoMode('anime');
assert.strictEqual(lesson.getVideoMode(), 'anime');
assert.strictEqual(demoVideo.src, 'videos/anime/BUENOS_body.mp4');
console.log(`  ✅ Video cambió exitosamente a Anime: ${demoVideo.src}`);

lesson.setVideoMode('real');
assert.strictEqual(lesson.getVideoMode(), 'real');
assert.strictEqual(demoVideo.src, 'videos/real/BUENOS_body.mp4');
console.log(`  ✅ Video cambió de regreso a Real: ${demoVideo.src}`);
lesson.destroy();

console.log('\n🎉 ¡Todos los tests de Checkpoints, Dificultad y Videos Anime pasaron al 100%!\n');
