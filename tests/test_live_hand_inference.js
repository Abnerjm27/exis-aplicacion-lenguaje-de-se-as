const { chromium } = require('playwright');
const path = require('path');

async function testLiveHandInference() {
  console.log("=== VERIFICACIÓN FINAL: DETECCIÓN DE MANO Y RENDERIZADO DE SKELETON ===");
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream']
  });

  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('[BROWSER ERROR]:', msg.text());
    }
  });

  await page.goto('http://localhost:8000/', { waitUntil: 'networkidle' });

  // Iniciar cámara
  const btnCamera = page.locator('#toggleCameraBtn');
  await btnCamera.click();
  await page.waitForTimeout(2000);

  // Seleccionar seña 'A'
  await page.click('#catLettersBtn');
  await page.waitForTimeout(300);
  await page.click('#btn-sign-A');
  await page.waitForTimeout(500);

  // Inyectar imagen de muestra A.jpg y verificar que MediaPipe procese y dibuje en el canvas
  const detectionResult = await page.evaluate(async () => {
    return new Promise((resolve) => {
      const hands = window.VisionEvaluator.__debugHandsInstance();
      if (!hands) {
        return resolve({ error: "handsInstance no disponible" });
      }

      // Pausar el video simulado para que no sobreescriba el canvas
      const video = document.getElementById('webcamVideo');
      if (video) video.pause();

      const img = new Image();
      img.onload = async () => {
        try {
          await hands.send({ image: img });

          setTimeout(() => {
            const scoreText = document.getElementById('similarityScoreText')?.textContent || '';
            const diagText = document.getElementById('poseDiagnostic')?.textContent || '';
            const canvas = document.getElementById('outputCanvas');
            const ctx = canvas.getContext('2d');
            const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            
            let nonZeroPixels = 0;
            for (let i = 0; i < pixelData.length; i += 4) {
              if (pixelData[i + 3] > 0) nonZeroPixels++;
            }

            resolve({
              scoreText,
              diagText,
              skeletonPixelsRendered: nonZeroPixels
            });
          }, 600);
        } catch (err) {
          resolve({ error: err.message });
        }
      };
      img.onerror = () => resolve({ error: "Error al cargar /dataset_samples/A.jpg" });
      img.src = '/dataset_samples/A.jpg';
    });
  });

  console.log("Resultado de detección:", detectionResult);

  // Tomar captura con el esqueleto dibujado
  await page.screenshot({ path: path.join(__dirname, 'screenshots', 'deteccion_mano_con_skeleton.png') });
  console.log("Captura guardada en tests/screenshots/deteccion_mano_con_skeleton.png");

  await browser.close();

  if (detectionResult.skeletonPixelsRendered === 0 || !detectionResult.diagText.includes('Letra A')) {
    throw new Error(`Fallo la verificación: pixels=${detectionResult.skeletonPixelsRendered}, diag=${detectionResult.diagText}`);
  }
  console.log("✓ TEST EXITOSO: Mano detectada, esqueleto renderizado en canvas y diagnóstico actualizado.");
}

testLiveHandInference().catch(err => {
  console.error("Fallo la prueba:", err);
  process.exit(1);
});
