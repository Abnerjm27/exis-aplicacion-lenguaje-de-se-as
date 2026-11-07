const http = require('http');
const assert = require('assert');

function requestJSON(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? Buffer.from(JSON.stringify(body), 'utf-8') : null;
    const req = http.request({
      hostname: 'localhost',
      port: 8000,
      path,
      method,
      headers: data ? { 'Content-Type': 'application/json', 'Content-Length': data.length } : {}
    }, res => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, json: JSON.parse(raw) });
        } catch (e) {
          resolve({ status: res.statusCode, raw });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

(async () => {
  try {
    const planRes = await requestJSON('POST', '/api/plan', {
      goal: 'No sé nada, enséñame desde cero lo básico',
      level: 'beginner'
    });
    assert.strictEqual(planRes.status, 200, `Expected status 200 for /api/plan, got ${planRes.status}`);
    assert.ok(Array.isArray(planRes.json.signs) && planRes.json.signs.length >= 4, 'Expected at least 4 signs in plan');
    assert.ok(planRes.json.title && planRes.json.rationale, 'Expected title and rationale in plan response');

    const userRes = await requestJSON('POST', '/api/users', {
      username: 'estudiante_test',
      displayName: 'Estudiante Test',
      level: 'Principiante',
      xp: 120,
      streak: 3,
      masteredSigns: ['HOLA', 'A'],
      customPlans: [],
      examHistory: []
    });
    assert.strictEqual(userRes.status, 200, `Expected status 200 for POST /api/users, got ${userRes.status}`);
    assert.strictEqual(userRes.json.user.username, 'estudiante_test', 'Expected username estudiante_test');

    const getRes = await requestJSON('GET', '/api/users');
    assert.strictEqual(getRes.status, 200, `Expected status 200 for GET /api/users, got ${getRes.status}`);
    assert.ok(getRes.json.users.some(u => u.username === 'estudiante_test'), 'Expected estudiante_test in users list');
    console.log('PASS: backend_api_plan_users');
    process.exit(0);
  } catch (err) {
    console.error('FAIL backend_api_plan_users:', err);
    process.exit(1);
  }
})();
