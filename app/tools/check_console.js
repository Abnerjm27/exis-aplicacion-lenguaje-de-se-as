const { spawn } = require('child_process');
const http = require('http');

async function main() {
  console.log("Iniciando Chrome headless para verificar errores de consola...");
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    'http://localhost:8000/'
  ]);

  // Esperar a que el puerto de debug responda
  let target = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 300));
    try {
      const res = await fetch('http://localhost:9222/json');
      const targets = await res.json();
      target = targets.find(t => t.url.includes('localhost:8000'));
      if (target && target.webSocketDebuggerUrl) break;
    } catch (e) {}
  }

  if (!target || !target.webSocketDebuggerUrl) {
    console.error("No se pudo conectar a Chrome DevTools");
    chrome.kill();
    process.exit(1);
  }

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  const consoleErrors = [];

  ws.onopen = () => {
    ws.send(JSON.stringify({ id: 1, method: 'Console.enable' }));
    ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));
    ws.send(JSON.stringify({ id: 3, method: 'Page.enable' }));
  };

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Console.messageAdded' && msg.params.message.level === 'error') {
      consoleErrors.push(msg.params.message.text);
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      consoleErrors.push(msg.params.exceptionDetails.text + ': ' + (msg.params.exceptionDetails.exception?.description || ''));
    }
  };

  // Dejar que cargue y ejecute scripts por 3 segundos
  await new Promise(r => setTimeout(r, 3000));

  console.log("=== REPORTE DE ERRORES DE CONSOLA ===");
  console.log("Total errores detectados:", consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.error("Errores:", consoleErrors);
  } else {
    console.log("✓ EXCELENTE: 0 errores de consola en http://localhost:8000/");
  }

  ws.close();
  chrome.kill();
  process.exit(consoleErrors.length === 0 ? 0 : 1);
}

main().catch(err => {
  console.error("Error en test:", err);
  process.exit(1);
});
