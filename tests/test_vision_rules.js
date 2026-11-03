const fs = require('fs');
const path = require('path');

const code = fs.readFileSync(path.join(__dirname, '..', 'app', 'js', 'vision-evaluator.js'), 'utf8');

// Check that the evaluator has branches for ANNOS, LICOR, D, E, U
const requiredBranches = [
  "signId === 'ANNOS'",
  "signId === 'LICOR'",
  "signId === 'D'",
  "signId === 'E'",
  "signId === 'U'"
];

let missing = [];
for (const b of requiredBranches) {
  if (!code.includes(b)) {
    missing.push(b);
  }
}

if (missing.length > 0) {
  console.error("FAIL: Missing branches in vision-evaluator.js:\n" + missing.join("\n"));
  process.exit(1);
} else {
  console.log("PASSED: All 5 evaluation branches present in vision-evaluator.js");
}
