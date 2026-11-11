const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 850 } });

  const errors = [];
  page.on('console', msg => {
    console.log(`[BROWSER ${msg.type()}]:`, msg.text());
  });

  await page.goto('http://localhost:8000/', { waitUntil: 'networkidle' });

  // Iniciar examen con una pregunta de tipo quiz
  const result = await page.evaluate(async () => {
    if (!window.BlindExamController) return { error: 'No BlindExamController' };

    // Capturar evento onerror detallado
    const video = document.getElementById('examQuizVideo');
    if (video) {
      video.addEventListener('error', (e) => {
        console.error('[EXAM VIDEO ERROR EVENT]:', video.error ? {
          code: video.error.code,
          message: video.error.message
        } : 'No video.error');
      });
    }

    // Iniciar examen
    window.BlindExamController.start({
      title: 'Examen de Prueba',
      signs: ['HOLA', 'YO', 'A'],
      secondsPerQuestion: 20,
      difficultyLevel: 1
    });

    // Cambiar a modo anime
    window.BlindExamController.setVideoMode('anime');

    // Saltar la primera seña (gesture) para pasar a la seña 2 (tipo quiz)
    window.BlindExamController.skipCurrentQuestion();

    const webp = document.getElementById('examQuizWebp');
    const paneQuiz = document.getElementById('examPaneQuiz');
    const paneGesture = document.getElementById('examPaneGesture');

    return {
      mode: window.BlindExamController.getVideoMode(),
      paneQuizHidden: paneQuiz ? paneQuiz.classList.contains('hidden') : null,
      paneGestureHidden: paneGesture ? paneGesture.classList.contains('hidden') : null,
      videoSrc: video ? video.src : null,
      videoCurrentSrc: video ? video.currentSrc : null,
      videoHidden: video ? video.classList.contains('hidden') : null,
      videoReadyState: video ? video.readyState : null,
      videoError: video && video.error ? video.error.code : null,
      webpSrc: webp ? webp.src : null,
      webpHidden: webp ? webp.classList.contains('hidden') : null
    };
  });

  console.log("Estado del examen:", JSON.stringify(result, null, 2));

  await page.waitForTimeout(1000);

  const afterWait = await page.evaluate(() => {
    const video = document.getElementById('examQuizVideo');
    const webp = document.getElementById('examQuizWebp');
    return {
      videoSrc: video ? video.src : null,
      videoCurrentSrc: video ? video.currentSrc : null,
      videoReadyState: video ? video.readyState : null,
      videoError: video && video.error ? video.error.code : null,
      videoPaused: video ? video.paused : null,
      videoHidden: video ? video.classList.contains('hidden') : null,
      webpHidden: webp ? webp.classList.contains('hidden') : null,
      webpSrc: webp ? webp.src : null
    };
  });

  console.log("Estado tras 1s:", JSON.stringify(afterWait, null, 2));

  await browser.close();
})();
