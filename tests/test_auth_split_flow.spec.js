/**
 * E2E: flujo landing -> register -> onboarding -> ruta, y login separado.
 * Verifica errores de consola, desbordamiento horizontal y objetivos táctiles >= 44px.
 */
const { chromium } = require('playwright');
const assert = require('assert');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:8000';
const shots = path.join(__dirname, 'screenshots');

async function noOverflow(page, label) {
  const m = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth }));
  assert.ok(m.s <= m.c, `${label}: desbordamiento horizontal (${m.s} > ${m.c})`);
}

async function smallTargets(page, label) {
  const bad = await page.evaluate(() => Array.from(document.querySelectorAll('button, a.btn-spring, input:not([type=hidden])'))
    .filter(el => el.offsetParent !== null)
    .map(el => ({ id: el.id || el.className.toString().slice(0, 30), h: el.getBoundingClientRect().height }))
    .filter(x => x.h < 44));
  assert.strictEqual(bad.length, 0, `${label}: objetivos táctiles < 44px: ${JSON.stringify(bad)}`);
}

(async () => {
  fs.mkdirSync(shots, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    for (const vp of [{ w: 1280, h: 850, n: 'desktop' }, { w: 390, h: 844, n: 'mobile' }]) {
      const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
      const page = await ctx.newPage();
      const errors = [];
      page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
      page.on('pageerror', e => errors.push(String(e)));

      // Landing enlaza a páginas separadas
      await page.goto(`${BASE}/landing.html`, { waitUntil: 'networkidle' });
      assert.strictEqual(await page.getAttribute('#btnHeaderLogin', 'href'), 'login.html');
      assert.strictEqual(await page.getAttribute('#btnNavEnter', 'href'), 'register.html');
      assert.strictEqual(await page.$('#landingAuthForm'), null, 'La landing ya no debe tener el formulario embebido');
      await noOverflow(page, `landing ${vp.n}`);
      await page.screenshot({ path: path.join(shots, `landing_${vp.n}.png`) });

      // Registro
      const user = `camila${Date.now()}@correo.com`;
      await page.click('#btnNavEnter');
      await page.waitForURL('**/register.html');
      await page.screenshot({ path: path.join(shots, `register_${vp.n}.png`) });
      await smallTargets(page, `register ${vp.n}`);
      await noOverflow(page, `register ${vp.n}`);

      await page.click('#btnAuthSubmit');
      assert.ok((await page.textContent('#authError')).length > 0, 'Debe validar campos vacíos');
      await page.fill('#authDisplayNameInput', 'Camila Torres');
      await page.fill('#authIdentifierInput', user);
      await page.fill('#authPasswordInput', 'clave1234');
      await page.fill('#authConfirmInput', 'otra');
      await page.click('#btnAuthSubmit');
      assert.ok((await page.textContent('#authError')).includes('no coinciden'));
      await page.fill('#authConfirmInput', 'clave1234');
      await page.click('#btnAuthSubmit');
      await page.waitForURL('**/onboarding.html');

      // Onboarding
      await page.screenshot({ path: path.join(shots, `onboarding_${vp.n}.png`) });
      await noOverflow(page, `onboarding ${vp.n}`);
      await page.click('#btnQuizNext');
      await page.click('#btnQuizNext');
      await page.click('#btnQuizNext');
      await page.waitForURL('**/index.html?screen=path');

      // Login separado: contraseña mala, luego buena
      await page.evaluate(() => localStorage.removeItem('exis_active_profile_v1'));
      await page.goto(`${BASE}/login.html`, { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(shots, `login_${vp.n}.png`) });
      await smallTargets(page, `login ${vp.n}`);
      await noOverflow(page, `login ${vp.n}`);
      assert.strictEqual(await page.getAttribute('#linkToRegister', 'href'), 'register.html');
      await page.fill('#authIdentifierInput', user);
      await page.fill('#authPasswordInput', 'mala');
      await page.click('#btnAuthSubmit');
      assert.ok((await page.textContent('#authError')).includes('incorrecta'));
      await page.fill('#authPasswordInput', 'clave1234');
      await page.click('#btnAuthSubmit');
      await page.waitForURL('**/index.html?screen=path');

      // Cuenta inexistente
      await page.goto(`${BASE}/login.html`, { waitUntil: 'networkidle' });
      await page.fill('#authIdentifierInput', 'nadie@correo.com');
      await page.fill('#authPasswordInput', 'clave1234');
      await page.click('#btnAuthSubmit');
      assert.ok((await page.textContent('#authError')).includes('No encontramos'));

      const consoleErrors = await page.evaluate(() => window.__consoleErrors || []);
      assert.deepStrictEqual(errors.concat(consoleErrors), [], `Errores de consola en ${vp.n}`);
      console.log(`✓ ${vp.n}: landing -> register -> onboarding -> login OK`);
      await ctx.close();
    }
    console.log('PASS: test_auth_split_flow');
  } catch (e) {
    console.error('FAIL:', e.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
