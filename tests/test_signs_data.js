const fs = require('fs');
const path = require('path');

const signsDataPath = path.join(__dirname, '..', 'app', 'js', 'signs-data.js');
const code = fs.readFileSync(signsDataPath, 'utf8');

// Mock window
const window = {};
eval(code);

const signs = window.SIGNS_DATA;

if (!signs) {
  console.error("FAIL: window.SIGNS_DATA is undefined");
  process.exit(1);
}

const words = signs.words || [];
const letters = signs.letters || [];

console.log(`Current words: ${words.length}, Current letters: ${letters.length}`);

const requiredWords = ['HOLA', 'YO', 'BUENOS', 'DIAS', 'NOCHES', 'NOMBRE', 'TARDES', 'GUSTAR', 'ANNOS', 'LICOR'];
const requiredLetters = ['A', 'B', 'C', 'L', 'V', 'I', 'O', 'D', 'E', 'U'];

let failed = false;

for (const w of requiredWords) {
  const found = words.find(s => s.id === w);
  if (!found) {
    console.error(`FAIL: Missing word ${w}`);
    failed = true;
  } else if (!found.desc || !found.tip || !found.rules || !found.trajectory) {
    console.error(`FAIL: Word ${w} is missing required fields (desc, tip, rules, trajectory)`);
    failed = true;
  }
}

for (const l of requiredLetters) {
  const found = letters.find(s => s.id === l);
  if (!found) {
    console.error(`FAIL: Missing letter ${l}`);
    failed = true;
  } else if (!found.desc || !found.tip || !found.rules) {
    console.error(`FAIL: Letter ${l} is missing required fields (desc, tip, rules)`);
    failed = true;
  }
}

if (failed || words.length !== 10 || letters.length !== 10) {
  console.error(`FAILED: Expected 10 words and 10 letters, got ${words.length} words and ${letters.length} letters`);
  process.exit(1);
}

console.log("PASSED: SIGNS_DATA has exactly 10 words and 10 letters with all required fields.");
