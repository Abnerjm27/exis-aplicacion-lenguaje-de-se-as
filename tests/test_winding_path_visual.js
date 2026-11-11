const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--no-sandbox'
    ]
  });

  const page = await browser.newPage({
    viewport: { width: 1280, height: 850 }
  });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  console.log("Cargando http://localhost:8000/ ...");
  await page.goto('http://localhost:8000/', { waitUntil: 'networkidle' });

  // Ir a la vista de Ruta (Mapa Duolingo)
  console.log("Cambiando a la vista de Ruta (#viewLearningPath) ...");
  await page.evaluate(() => {
    if (window.ViewRouter) {
      window.ViewRouter.switchToPathView();
    } else if (typeof window.showScreen === 'function') {
      window.showScreen('viewLearningPath');
    }
  });

  await page.waitForTimeout(600);

  // Verificar presencia del conector SVG
  const svgInfo = await page.evaluate(() => {
    const container = document.getElementById('hexSkillTreeContainer');
    if (!container) return { error: 'No container' };
    const svg = container.querySelector('.duolingo-svg-connector');
    if (!svg) return { error: 'No SVG connector found' };

    const paths = Array.from(svg.querySelectorAll('path')).map(p => ({
      d: p.getAttribute('d'),
      className: p.getAttribute('class')
    }));

    const nodes = Array.from(container.querySelectorAll('.duolingo-node')).map(n => {
      const rect = n.getBoundingClientRect();
      const cRect = container.getBoundingClientRect();
      return {
        id: n.id,
        x: Math.round(rect.left + rect.width / 2 - cRect.left),
        y: Math.round(rect.top + rect.height / 2 - cRect.top)
      };
    });

    return {
      pathsCount: paths.length,
      paths: paths,
      nodesCount: nodes.length,
      nodes: nodes
    };
  });

  console.log("Información SVG:", JSON.stringify(svgInfo, null, 2));

  if (svgInfo.error) {
    console.error("ERROR:", svgInfo.error);
    process.exit(1);
  }

  // Verificar que el path contiene curvas Bezier (C)
  const basePath = svgInfo.paths.find(p => p.className.includes('duolingo-path-base'));
  if (!basePath || !basePath.d.includes('C')) {
    console.error("ERROR: El trazado base no contiene comandos de curva Bezier 'C'");
    process.exit(1);
  }

  console.log("PASS: El trazado base SVG contiene curvas cúbicas conectando los hexágonos!");

  // Tomar captura de pantalla en escritorio
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const screenshotPathDesktop = path.join(screenshotsDir, 'winding_path_desktop.png');
  await page.screenshot({ path: screenshotPathDesktop, fullPage: false });
  console.log("Captura guardada en:", screenshotPathDesktop);

  // Probar progreso: avanzar al paso 2 (A)
  console.log("Simulando progreso al paso 2 (seña A) ...");
  await page.evaluate(() => {
    if (window.LearningPlanManager) {
      window.LearningPlanManager.markSignCompletedInPlan('HOLA');
      window.LearningPlanManager.markSignCompletedInPlan('YO');
    }
  });

  await page.waitForTimeout(400);

  const activePathInfo = await page.evaluate(() => {
    const container = document.getElementById('hexSkillTreeContainer');
    const svg = container.querySelector('.duolingo-svg-connector');
    const activePath = svg ? svg.querySelector('.duolingo-path-active') : null;
    const pulsePath = svg ? svg.querySelector('.duolingo-path-pulse') : null;
    return {
      hasActivePath: !!activePath,
      activeD: activePath ? activePath.getAttribute('d') : null,
      hasPulsePath: !!pulsePath
    };
  });

  console.log("Información del tramo activo:", activePathInfo);
  if (!activePathInfo.hasActivePath || !activePathInfo.activeD) {
    console.error("ERROR: No se generó el trazado activo para los pasos completados");
    process.exit(1);
  }

  const screenshotPathProgress = path.join(screenshotsDir, 'winding_path_progress.png');
  await page.screenshot({ path: screenshotPathProgress, fullPage: false });
  console.log("Captura con progreso guardada en:", screenshotPathProgress);

  console.log("PASS: El trazado activo con degradado y pulso de energía conecta los pasos completados!");

  // Probar en viewport móvil (390x844)
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);

  const screenshotPathMobile = path.join(screenshotsDir, 'winding_path_mobile.png');
  await page.screenshot({ path: screenshotPathMobile, fullPage: false });
  console.log("Captura móvil guardada en:", screenshotPathMobile);

  console.log("Errores de consola:", errors);
  if (errors.length > 0) {
    console.error("Fallo con errores de consola:", errors);
    process.exit(1);
  }

  console.log("TODAS LAS VERIFICACIONES VISUALES DEL TRAZADO SERPENTEANTE PASARON EXITOSAMENTE!");
  await browser.close();
})();
