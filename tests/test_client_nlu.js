/**
 * Pruebas unitarias para LSCClientNLU en JavaScript (cargado desde app/js/chat-tutor.js).
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadRealClientNLU() {
  const filePath = path.join(__dirname, '..', 'app', 'js', 'chat-tutor.js');
  const code = fs.readFileSync(filePath, 'utf8');
  const sandbox = {
    window: {},
    document: { getElementById: () => null },
    console,
    setTimeout,
    clearTimeout
  };
  vm.runInNewContext(code, sandbox, { filename: filePath });
  const nlu = sandbox.window.ChatTutor && sandbox.window.ChatTutor.LSCClientNLU;
  assert.ok(nlu, 'ChatTutor.LSCClientNLU debe estar expuesto desde app/js/chat-tutor.js');
  return nlu;
}

const LSCClientNLU = loadRealClientNLU();

const cases = [
  { q: 'hola quiero aprender a', expectedTarget: null, expectedIntent: 'OPEN_LEARNING_INTRO' },
  { q: 'hola quiero aprender la letra a', expectedTarget: 'A', expectedIntent: 'LEARN_SIGN' },
  { q: 'no quiero aprender a', expectedTarget: null, expectedIntent: 'REJECT_SIGN', expectedClarification: true },
  { q: 'no quiero la a, prefiero la c', expectedTarget: 'C', expectedIntent: 'LEARN_SIGN', expectedClarification: true },
  { q: 'buenas tardes me enseñas licor', expectedTarget: 'LICOR', expectedIntent: 'LEARN_SIGN' },
  { q: 'hola', expectedTarget: null, expectedIntent: 'GREETING' },
  { q: 'hola tito', expectedTarget: null, expectedIntent: 'GREETING' },
  { q: 'qué señas tienes', expectedTarget: null, expectedIntent: 'CATALOG' },
  { q: 'quién eres', expectedTarget: null, expectedIntent: 'IDENTITY' }
];

let failed = 0;
for (const tc of cases) {
  const res = LSCClientNLU.parse(tc.q);
  const clarifOk = tc.expectedClarification === undefined || res.isClarification === tc.expectedClarification;
  const ok = res.targetSign === tc.expectedTarget && res.intent === tc.expectedIntent && clarifOk;
  if (!ok) {
    console.error(`FAIL: "${tc.q}" -> got target=${res.targetSign}, intent=${res.intent}, isClarification=${res.isClarification}`);
    failed++;
  } else {
    console.log(`PASS: "${tc.q}" -> target=${res.targetSign}, intent=${res.intent}`);
  }
}

if (failed === 0) {
  console.log(`\nALL ${cases.length} JAVASCRIPT NLU TESTS PASSED!`);
} else {
  process.exit(1);
}
