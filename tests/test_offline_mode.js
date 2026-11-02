const { chromium } = require('playwright');

async function testOffline() {
  console.log("=== INICIANDO AUDITORÍA OFFLINE (CERO INTERNET) ===");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 850 } });
  const page = await context.newPage();

  const externalRequests = [];
  const errors = [];

  page.on('request', req => {
    const url = req.url();
    // Registrar si alguna petición intenta salir a internet
    if (!url.startsWith('http://localhost:8000') && !url.startsWith('data:') && !url.startsWith('blob:')) {
      externalRequests.push(url);
    }
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  // Bloquear todas las peticiones a dominios externos para simular desconexión total a internet
  await page.route('**/*', route => {
    const url = route.request().url();
    if (!url.startsWith('http://localhost:8000') && !url.startsWith('data:') && !url.startsWith('blob:')) {
      console.log(`[BLOQUEADO - SIN INTERNET]: ${url}`);
      return route.abort('failed');
    }
    return route.continue();
  });

  console.log("--- 1. Navegando a http://localhost:8000/ con internet bloqueado ---");
  await page.goto('http://localhost:8000/', { waitUntil: 'networkidle' });

  // 2. Verificar que no se realizaron peticiones externas
  console.log(`Peticiones externas salientes detectadas: ${externalRequests.length}`);
  if (externalRequests.length > 0) {
    console.error("Peticiones no locales:", externalRequests);
    throw new Error("La aplicación sigue intentando conectarse a internet");
  }

  // 3. Verificar que Tailwind se cargó y aplicó estilos en el DOM
  const isTailwindActive = await page.evaluate(() => {
    const body = document.body;
    const computed = window.getComputedStyle(body);
    const hasFlex = computed.display === 'flex';
    const header = document.querySelector('header');
    const headerBorder = header ? window.getComputedStyle(header).borderBottomWidth : '';
    return {
      hasFlex,
      headerBorder,
      tailwindGlobal: typeof window.tailwind !== 'undefined'
    };
  });

  console.log("Estado de Tailwind Local:", isTailwindActive);
  if (!isTailwindActive.hasFlex || !isTailwindActive.tailwindGlobal) {
    throw new Error("Tailwind CSS local no está aplicando estilos al DOM");
  }

  // 4. Verificar que MediaPipe Hands local está disponible
  const isMediaPipeLoaded = await page.evaluate(() => {
    return {
      hasHands: typeof window.Hands !== 'undefined',
      hasCamera: typeof window.Camera !== 'undefined'
    };
  });

  console.log("Estado de MediaPipe Local:", isMediaPipeLoaded);
  if (!isMediaPipeLoaded.hasHands) {
    throw new Error("MediaPipe Hands local no se cargó correctamente");
  }

  // 5. Verificar que el selector de señas y el video funcionan
  const activeSign = await page.evaluate(() => {
    return window.VideoPlayer ? window.VideoPlayer.getSign() : null;
  });
  console.log(`Seña activa en modo offline: ${activeSign}`);
  if (!activeSign) {
    throw new Error("El reproductor no inicializó la seña activa");
  }

  console.log(`Errores de consola: ${errors.length}`);
  if (errors.length > 0) {
    console.error("Errores:", errors);
    throw new Error("Se produjeron errores en la consola en modo offline");
  }

  await browser.close();
  console.log("\n=== TEST PASADO: LA APLICACIÓN ES 100% FUNCIONAL Y AUTÓNOMA OFFLINE ===");
}

testOffline().catch(err => {
  console.error("FALLÓ EL TEST OFFLINE:", err);
  process.exit(1);
});
