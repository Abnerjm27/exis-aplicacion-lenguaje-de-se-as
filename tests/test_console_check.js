const { chromium } = require('playwright');
const assert = require('assert');

(async () => {
  console.log("=== INICIANDO VERIFICACIÓN DE CONSOLA Y LAYOUT (Reglas 6 y 7 AGENTS.md) ===");
  const browser = await chromium.launch({ headless: true });

  for (const viewport of [{ width: 1280, height: 850, name: 'Escritorio' }, { width: 390, height: 844, name: 'Móvil' }]) {
    console.log(`\nProbando viewport: ${viewport.name} (${viewport.width}x${viewport.height})`);
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
    const page = await context.newPage();

    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('http://localhost:8000/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    const check = await page.evaluate(() => {
      const errors = window.__consoleErrors || [];
      const sw = document.documentElement.scrollWidth;
      const cw = document.documentElement.clientWidth;
      return {
        consoleErrors: errors,
        scrollWidth: sw,
        clientWidth: cw,
        noOverflow: sw <= cw
      };
    });

    console.log(`✓ scrollWidth=${check.scrollWidth}, clientWidth=${check.clientWidth}, noOverflow=${check.noOverflow}`);
    assert.ok(check.noOverflow, `Desbordamiento detectado en ${viewport.name}: scrollWidth=${check.scrollWidth} > clientWidth=${check.clientWidth}`);

    assert.strictEqual(check.consoleErrors.length, 0, `Errores detectados en window.__consoleErrors (${viewport.name}): ${JSON.stringify(check.consoleErrors)}`);
    assert.strictEqual(consoleErrors.length, 0, `Errores detectados en consola (${viewport.name}): ${JSON.stringify(consoleErrors)}`);
    console.log(`✓ Cero errores de consola en ${viewport.name}`);
    await context.close();
  }

  await browser.close();
  console.log("\nPASS: test_console_check (0 errores, 0 desbordamiento)");
  process.exit(0);
})().catch(err => {
  console.error("FAIL: test_console_check:", err);
  process.exit(1);
});
