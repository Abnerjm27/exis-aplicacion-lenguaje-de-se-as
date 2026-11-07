const { chromium } = require('playwright');
const assert = require('assert');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log("=== VERIFICANDO GALERÍA DE MASCOTA ZORRITO (SVG & PNG) ===");
  fs.mkdirSync('tests/screenshots', { recursive: true });

  const browser = await chromium.launch({ headless: true });

  // 1. Desktop Test
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  const response = await page.goto('http://localhost:8000/mascot_gallery.html', { waitUntil: 'networkidle' });
  assert.strictEqual(response.status(), 200, "La página mascot_gallery.html debe responder 200 OK");

  await page.waitForTimeout(500);

  // Check 5 images loaded
  const imagesStatus = await page.evaluate(() => {
    const ids = ['img-saludo', 'img-explicando', 'img-pensando', 'img-pulgar', 'img-celebracion'];
    return ids.map(id => {
      const el = document.getElementById(id);
      return {
        id,
        src: el ? el.src : null,
        complete: el ? el.complete : false,
        naturalWidth: el ? el.naturalWidth : 0
      };
    });
  });

  console.log("Estado de las 5 imágenes SVG del zorrito:");
  imagesStatus.forEach(img => {
    console.log(` - ${img.id}: src=${img.src.split('/').pop()}, complete=${img.complete}, width=${img.naturalWidth}px`);
    assert.ok(img.complete && img.naturalWidth > 0, `La imagen ${img.id} no cargó correctamente`);
  });

  // Verify 0 overflow
  const layout = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth
  }));
  assert.ok(layout.sw <= layout.cw, `Desbordamiento horizontal en desktop: ${layout.sw} > ${layout.cw}`);

  // Take desktop SVG screenshot
  await page.screenshot({ path: 'tests/screenshots/mascot_gallery_desktop.png', fullPage: true });
  console.log("✓ Captura guardada: tests/screenshots/mascot_gallery_desktop.png");

  // Test toggle to PNG
  await page.click('#btnFormatPng');
  await page.waitForTimeout(300);

  const pngStatus = await page.evaluate(() => {
    const ids = ['img-saludo', 'img-explicando', 'img-pensando', 'img-pulgar', 'img-celebracion'];
    return ids.map(id => document.getElementById(id).src.endsWith('.png'));
  });
  assert.ok(pngStatus.every(Boolean), "Todas las imágenes deben tener extensión .png al cambiar formato");
  console.log("✓ Toggle a PNG verificado exitosamente");

  // Test background switcher
  await page.click('button[data-bg-target="light"]');
  await page.waitForTimeout(300);
  const isLight = await page.evaluate(() => {
    return document.querySelector('.stage-wrapper').classList.contains('stage-light');
  });
  assert.ok(isLight, "El fondo de los stages debe cambiar a stage-light");
  console.log("✓ Cambio a fondo claro verificado exitosamente");

  // Screenshot in light background + PNG
  await page.screenshot({ path: 'tests/screenshots/mascot_gallery_light_png.png', fullPage: true });

  await context.close();

  // 2. Mobile Viewport Test (390x844)
  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:8000/mascot_gallery.html', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(400);

  const mobileLayout = await mobilePage.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth
  }));
  assert.ok(mobileLayout.sw <= mobileLayout.cw, `Desbordamiento horizontal en móvil: ${mobileLayout.sw} > ${mobileLayout.cw}`);
  await mobilePage.screenshot({ path: 'tests/screenshots/mascot_gallery_mobile.png', fullPage: true });
  console.log("✓ Captura móvil guardada: tests/screenshots/mascot_gallery_mobile.png");

  await mobileContext.close();
  await browser.close();

  assert.strictEqual(consoleErrors.length, 0, `Errores de consola detectados: ${JSON.stringify(consoleErrors)}`);
  console.log("\nPASS: Galería de mascota zorrito verificada al 100% (0 errores, responsive y assets válidos)!");
  process.exit(0);
})().catch(err => {
  console.error("FAIL:", err);
  process.exit(1);
});
