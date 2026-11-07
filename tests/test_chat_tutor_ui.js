const { chromium } = require('playwright');

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

  console.log("Navegando a http://localhost:8000/ ...");
  await page.goto('http://localhost:8000/', { waitUntil: 'networkidle' });

  // Ir a Estudio de Práctica
  await page.evaluate(() => {
    if (typeof window.showScreen === 'function') {
      window.showScreen('viewPracticeStudio');
    }
  });
  await page.waitForTimeout(500);

  // Abrir chat
  await page.evaluate(() => {
    if (window.ChatTutor) window.ChatTutor.toggleDrawer();
  });
  await page.waitForTimeout(300);

  // Monitorear llamadas a selectSignById
  await page.evaluate(() => {
    window.__selectedSignsHistory = [];
    const origSelect = window.selectSignById;
    window.selectSignById = function(id) {
      window.__selectedSignsHistory.push(id);
      if (typeof origSelect === 'function') origSelect(id);
    };
  });

  console.log("Enviando mensaje: 'hola quiero aprender a' ...");
  await page.fill('#chatInput', 'hola quiero aprender a');
  await page.click('#chatSendBtn');

  // Esperar respuesta
  await page.waitForTimeout(1500);

  const messages = await page.evaluate(() => {
    const bubbles = Array.from(document.querySelectorAll('#chatMessages div'));
    return bubbles.map(b => b.textContent.trim()).filter(Boolean);
  });
  console.log("Mensajes en chat:", messages);

  const selectedSigns = await page.evaluate(() => window.__selectedSignsHistory);
  console.log("Señas seleccionadas:", selectedSigns);

  if (!selectedSigns.includes('A')) {
    console.error("ERROR: No se seleccionó la letra 'A' al pedir 'hola quiero aprender a'");
    process.exit(1);
  }

  const lastMsg = messages[messages.length - 1];
  console.log("Último mensaje recibido:", lastMsg);

  if (!lastMsg.includes("A") || !lastMsg.includes("puño")) {
    console.error("ERROR: El mensaje no contiene la explicación de la letra A");
    process.exit(1);
  }

  console.log("Enviando segundo mensaje: 'no quiero aprender a' ...");
  await page.fill('#chatInput', 'no quiero aprender a');
  await page.click('#chatSendBtn');
  await page.waitForTimeout(1500);

  const messages2 = await page.evaluate(() => {
    const bubbles = Array.from(document.querySelectorAll('#chatMessages div'));
    return bubbles.map(b => b.textContent.trim()).filter(Boolean);
  });
  const lastMsg2 = messages2[messages2.length - 1];
  console.log("Último mensaje recibido tras aclaración:", lastMsg2);

  if (!lastMsg2.includes("Entendido perfectamente") || !lastMsg2.includes("A")) {
    console.error("ERROR: No reconoció la aclaración sobre la letra A");
    process.exit(1);
  }

  console.log("PASS: Multi-turn conversacional validado con éxito!");
  await browser.close();
})();
