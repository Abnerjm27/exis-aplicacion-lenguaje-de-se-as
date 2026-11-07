/**
 * LSC Learn · Proyecto EXIS
 * lesson-session.js - Controlador POO de la Sesión de Lección Interactiva (POO)
 * 
 * Gestiona el ciclo de vida pedagógico tipo test y réplica motriz:
 * 1. 'demo': Demostración en video con tarjeta pedagógica y tip del zorrito.
 * 2. 'quiz': Pregunta de comprensión visual con 4 opciones sin título ni pistas.
 * 3. 'practice': Réplica motriz con webcam y MediaPipe Hands (85% durante 1.2s).
 * 4. 'summary': Resumen de lección, cálculo de XP (+50 XP) y sincronización con Auth y Plan.
 */

class LessonSessionController {
  // Instancia singleton para acceso estático transparente
  static #instance = null;

  static getInstance() {
    if (!LessonSessionController.#instance) {
      LessonSessionController.#instance = new LessonSessionController();
    }
    return LessonSessionController.#instance;
  }

  // Métodos de delegación estática para compatibilidad global
  static init(options) { return LessonSessionController.getInstance().init(options); }
  static start(signId, planContext) { return LessonSessionController.getInstance().start(signId, planContext); }
  static startLesson(signId, planContext) { return LessonSessionController.getInstance().startLesson(signId, planContext); }
  static nextPhase() { return LessonSessionController.getInstance().nextPhase(); }
  static update(deltaTime) { return LessonSessionController.getInstance().update(deltaTime); }
  static reset() { return LessonSessionController.getInstance().reset(); }
  static destroy() { return LessonSessionController.getInstance().destroy(); }
  static submitQuizAnswer(selectedSignId) { return LessonSessionController.getInstance().submitQuizAnswer(selectedSignId); }
  static handlePracticeFrame(accuracy, deltaTime) { return LessonSessionController.getInstance().handlePracticeFrame(accuracy, deltaTime); }
  static handleSignMasteredInLesson(signObj, score) { return LessonSessionController.getInstance().handleSignMasteredInLesson(signObj, score); }
  static isActive() { return LessonSessionController.getInstance().isActive(); }
  static getCurrentPhase() { return LessonSessionController.getInstance().getCurrentPhase(); }
  static getCurrentSign() { return LessonSessionController.getInstance().getCurrentSign(); }
  static getQuizOptions() { return LessonSessionController.getInstance().getQuizOptions(); }
  static getState() { return LessonSessionController.getInstance().getState(); }
  static getSummary() { return LessonSessionController.getInstance().getSummary(); }
  static closeLesson() { return LessonSessionController.getInstance().closeLesson(); }
  static setVideoMode(mode) { return LessonSessionController.getInstance().setVideoMode(mode); }
  static getVideoMode() { return LessonSessionController.getInstance().getVideoMode(); }

  // -------------------------------------------------------------
  // ESTADO PRIVADO (#) (Regla 8 AGENTS.md)
  // -------------------------------------------------------------
  #isActive; #currentSignId; #currentSign; #currentPhase; #planContext; #options;
  #selectedOptionId; #quizAnswered; #quizPassed; #quizAttempts; #practiceScore;
  #practicePassed; #practiceHoldMs; #cameraActive; #videoMode; #earnedXp;
  #callbacks; #originalOnSignMastered; #boundKeyDownHandler;

  constructor() {
    this.#isActive = false;
    this.#videoMode = (typeof window !== 'undefined' && window.localStorage && localStorage.getItem('manitas_video_mode')) || 'real';
    this.#currentSignId = null; this.#currentSign = null; this.#currentPhase = null; this.#planContext = null;
    this.#options = []; this.#selectedOptionId = null; this.#quizAnswered = false; this.#quizPassed = false;
    this.#quizAttempts = 0; this.#practiceScore = 0; this.#practicePassed = false; this.#practiceHoldMs = 0;
    this.#cameraActive = false; this.#earnedXp = 50;
    this.#callbacks = { onPhaseChange: null, onLessonComplete: null, onExit: null };
    this.#originalOnSignMastered = null;
    this.#boundKeyDownHandler = this.#handleKeyDown.bind(this);
  }

  // -------------------------------------------------------------
  // CICLO DE VIDA ESTANDARIZADO (init, start, update, reset, destroy)
  // -------------------------------------------------------------

  /**
   * Inicializa listeners del DOM y registra callbacks
   * @param {Object} options - { onPhaseChange, onLessonComplete, onExit }
   */
  init(options = {}) {
    if (typeof options.onPhaseChange === 'function') this.#callbacks.onPhaseChange = options.onPhaseChange;
    if (typeof options.onLessonComplete === 'function') this.#callbacks.onLessonComplete = options.onLessonComplete;
    if (typeof options.onExit === 'function') this.#callbacks.onExit = options.onExit;

    this.#bindUIEvents();
    return this;
  }

  /**
   * Inicia la lección interactiva para la seña indicada
   * @param {string} signId - ID de la seña (ej: 'HOLA', 'YO', 'A')
   * @param {Object} planContext - Información contextual del plan ({ planId, stepIndex })
   */
  startLesson(signId, planContext = null) {
    return this.start(signId, planContext);
  }

  start(signId, planContext = null) {
    if (!signId) {
      console.warn('LessonSessionController: signId no proporcionado.');
      return false;
    }

    // 1. Resolver información de la seña desde SIGNS_DATA
    this.#currentSignId = String(signId).trim();
    this.#currentSign = this.#resolveSignData(this.#currentSignId);
    this.#planContext = planContext;

    // 2. Resetear contadores y estados de la sesión
    this.#isActive = true;
    this.#selectedOptionId = null;
    this.#quizAnswered = false;
    this.#quizPassed = false;
    this.#quizAttempts = 0;
    this.#practiceScore = 0;
    this.#practicePassed = false;
    this.#practiceHoldMs = 0;
    this.#cameraActive = false;
    this.#earnedXp = 50;

    // 3. Generar opciones con distractores de la misma categoría
    this.#options = this.#generateQuizOptions(this.#currentSignId);

    // 4. Interceptar hook global onSignMastered de VisionEvaluator
    if (typeof window !== 'undefined') {
      if (!this.#originalOnSignMastered && typeof window.onSignMastered === 'function') {
        this.#originalOnSignMastered = window.onSignMastered;
      }
      window.onSignMastered = (signObj, score) => {
        if (this.#isActive && this.#currentPhase === 'practice') {
          this.handleSignMasteredInLesson(signObj, score);
        } else if (typeof this.#originalOnSignMastered === 'function') {
          this.#originalOnSignMastered(signObj, score);
        }
      };
    }

    // 5. Configurar listener de teclado si hay document
    if (typeof document !== 'undefined' && document.addEventListener) {
      document.removeEventListener('keydown', this.#boundKeyDownHandler);
      document.addEventListener('keydown', this.#boundKeyDownHandler);
    }

    // 6. Configurar fase inicial 'demo'
    this.#setPhase('demo');

    // 7. Renderizar modal en el DOM si existe
    this.#showModal();
    this.#updateVideoModeUI();

    return true;
  }

  /**
   * Método de ciclo de vida para actualizaciones de tiempo/animación
   * @param {number} deltaTime - Tiempo transcurrido en ms
   */
  update(deltaTime = 0) {
    if (!this.#isActive) return;

    if (this.#currentPhase === 'practice' && !this.#practicePassed) {
      // Podría usarse para temporizadores visuales continuos
    }
  }

  /**
   * Avanza a la siguiente fase de la lección
   */
  nextPhase() {
    if (!this.#isActive) return;

    switch (this.#currentPhase) {
      case 'demo':
        this.#setPhase('quiz');
        break;
      case 'quiz':
        this.#setPhase('practice');
        break;
      case 'practice':
        this.#setPhase('summary');
        break;
      case 'summary':
        this.closeLesson();
        break;
      default:
        this.#setPhase('demo');
        break;
    }
  }

  /**
   * Resetea el estado interno a inactivo
   */
  reset() {
    this.#isActive = false;
    this.#currentSignId = null;
    this.#currentSign = null;
    this.#currentPhase = null;
    this.#planContext = null;
    this.#options = [];
    this.#selectedOptionId = null;
    this.#quizAnswered = false;
    this.#quizPassed = false;
    this.#quizAttempts = 0;
    this.#practiceScore = 0;
    this.#practicePassed = false;
    this.#practiceHoldMs = 0;

    this.#stopCameraIfActive();
    if (typeof document !== 'undefined') {
      ['lessonDemoVideo', 'lessonQuizVideo', 'lessonPracticeGuideVideo'].forEach(id => {
        const v = document.getElementById(id);
        if (v && typeof v.pause === 'function') {
          try { v.pause(); } catch (e) {}
        }
      });
    }
    this.#hideModal();
  }

  /**
   * Destruye la sesión actual, desvincula listeners y notifica salida
   */
  destroy() {
    this.#stopCameraIfActive();

    if (typeof document !== 'undefined' && document.removeEventListener) {
      document.removeEventListener('keydown', this.#boundKeyDownHandler);
    }

    if (typeof window !== 'undefined' && this.#originalOnSignMastered) {
      window.onSignMastered = this.#originalOnSignMastered;
      this.#originalOnSignMastered = null;
    }

    this.reset();

    if (typeof this.#callbacks.onExit === 'function') {
      try {
        this.#callbacks.onExit();
      } catch (err) {
        console.error('Error en callback onExit:', err);
      }
    }
  }

  // -------------------------------------------------------------
  // LÓGICA DE FASES Y GESTIÓN DE TEST (QUIZ)
  // -------------------------------------------------------------

  /**
   * Valida la respuesta del usuario en la fase Quiz
   * @param {string} selectedSignId
   * @returns {Object} { correct: boolean, selectedSignId, targetSignId }
   */
  submitQuizAnswer(selectedSignId) {
    if (!this.#isActive || this.#currentPhase !== 'quiz') {
      return { correct: false, selectedSignId, targetSignId: this.#currentSignId };
    }

    this.#selectedOptionId = selectedSignId;
    this.#quizAnswered = true;
    this.#quizAttempts++;

    const isCorrect = (selectedSignId === this.#currentSignId);
    this.#quizPassed = isCorrect;

    // Actualizar presentación en DOM si existe
    this.#renderQuizFeedback(isCorrect);

    return {
      correct: isCorrect,
      selectedSignId,
      targetSignId: this.#currentSignId
    };
  }

  /**
   * Procesa cada frame de visión en la fase de práctica
   * Requiere >= 85% durante 1200ms acumulados consecutivos
   * @param {number} accuracy - Puntuación de similitud (0-100)
   * @param {number} deltaTime - Tiempo del frame en ms
   * @returns {boolean} true si alcanzó el objetivo
   */
  handlePracticeFrame(accuracy, deltaTime = 100) {
    if (!this.#isActive || this.#currentPhase !== 'practice' || this.#practicePassed) {
      return this.#practicePassed;
    }

    const ACCURACY_THRESHOLD = 85;
    const REQUIRED_HOLD_MS = 1200;

    if (accuracy >= ACCURACY_THRESHOLD) {
      this.#practiceHoldMs += Math.max(0, deltaTime);
      this.#practiceScore = Math.max(this.#practiceScore, Math.round(accuracy));

      this.#updatePracticeProgressUI(Math.min(100, Math.round((this.#practiceHoldMs / REQUIRED_HOLD_MS) * 100)));

      if (this.#practiceHoldMs >= REQUIRED_HOLD_MS) {
        this.#practicePassed = true;
        this.#onPracticeCompleted(accuracy);
        return true;
      }
    } else {
      // Suavizar caída de tiempo
      this.#practiceHoldMs = Math.max(0, this.#practiceHoldMs - Math.max(0, deltaTime * 0.75));
      this.#updatePracticeProgressUI(Math.min(100, Math.round((this.#practiceHoldMs / REQUIRED_HOLD_MS) * 100)));
    }

    return false;
  }

  /**
   * Hook invocado cuando VisionEvaluator confirma dominio de la seña
   * @param {Object} signObj
   * @param {number} score
   */
  handleSignMasteredInLesson(signObj, score = 95) {
    if (!this.#isActive || this.#currentPhase !== 'practice' || this.#practicePassed) {
      return;
    }

    this.#practicePassed = true;
    this.#practiceScore = Math.max(this.#practiceScore, Math.round(score));
    this.#practiceHoldMs = 1200;
    this.#updatePracticeProgressUI(100);

    this.#onPracticeCompleted(score);
  }

  #onPracticeCompleted(score) {
    // Feedback sonoro y confetti
    if (typeof confetti === 'function') {
      try {
        confetti({ particleCount: 70, spread: 65, origin: { y: 0.6 } });
      } catch (e) {}
    }

    if (typeof window !== 'undefined' && window.ChatTutor) {
      try {
        if (typeof window.ChatTutor.playVictorySound === 'function') {
          window.ChatTutor.playVictorySound();
        }
      } catch (e) {}
    }

    this.#renderPracticeSuccessFeedback(score);
  }

  // -------------------------------------------------------------
  // GENERADOR DE OPCIONES (DISTRACTORES SIN DUPLICADOS)
  // -------------------------------------------------------------

  /**
   * Genera 4 opciones únicas (1 correcta + 3 distractores de misma categoría si es posible)
   * @param {string} targetSignId
   * @returns {Array<Object>} Lista de 4 opciones barajadas
   */
  #generateQuizOptions(targetSignId) {
    const signsCatalog = this.#getAllCatalogSigns();
    const targetSign = signsCatalog.find(s => s.id === targetSignId) || {
      id: targetSignId,
      name: targetSignId,
      category: 'words'
    };

    const targetCategory = targetSign.category || 'words';

    // 1. Filtrar distractores candidatos de la misma categoría excluyendo la seña correcta
    let categoryCandidates = signsCatalog.filter(s => s.id !== targetSignId && s.category === targetCategory);

    // Si la categoría tiene menos de 3 candidatos, complementar con el resto del catálogo
    if (categoryCandidates.length < 3) {
      const otherCandidates = signsCatalog.filter(s => s.id !== targetSignId && s.category !== targetCategory);
      categoryCandidates = [...categoryCandidates, ...otherCandidates];
    }

    // 2. Barajar candidatos para seleccionar 3 aleatorios únicos
    const shuffledCandidates = [...categoryCandidates].sort(() => Math.random() - 0.5);
    const selectedDistractors = shuffledCandidates.slice(0, 3).map(s => ({
      id: s.id,
      name: s.name || s.id,
      category: s.category || targetCategory,
      isCorrect: false
    }));

    // 3. Crear opción correcta
    const correctOption = {
      id: targetSign.id,
      name: targetSign.name || targetSign.id,
      category: targetCategory,
      isCorrect: true
    };

    // 4. Unir y barajar las 4 opciones finales
    const allOptions = [correctOption, ...selectedDistractors].sort(() => Math.random() - 0.5);

    return allOptions;
  }

  #getAllCatalogSigns() {
    let signsList = [];
    if (typeof window !== 'undefined' && window.SIGNS_DATA) {
      const words = Array.isArray(window.SIGNS_DATA.words) ? window.SIGNS_DATA.words : [];
      const letters = Array.isArray(window.SIGNS_DATA.letters) ? window.SIGNS_DATA.letters : [];
      signsList = [...words, ...letters];
    }
    if (signsList.length === 0) {
      signsList = ['HOLA', 'YO', 'BUENOS', 'DIAS', 'A', 'B', 'C', 'L'].map(id => ({ id, name: id, category: 'words' }));
    }
    return signsList;
  }

  #resolveSignData(signId) {
    const catalog = this.#getAllCatalogSigns();
    const found = catalog.find(s => s.id === signId);
    if (found) return found;

    return {
      id: signId,
      name: signId,
      category: 'words',
      desc: 'Demostración de Lengua de Señas Colombiana.',
      tip: 'Realiza la postura con precisión frente a la cámara.'
    };
  }

  // -------------------------------------------------------------
  // TRANSICIONES DE FASE Y GESTIÓN DE UI
  // -------------------------------------------------------------

  #setPhase(phase) {
    this.#currentPhase = phase;

    // Ejecutar lógica específica de la fase
    switch (phase) {
      case 'demo':
        this.#enterDemoPhase();
        break;
      case 'quiz':
        this.#enterQuizPhase();
        break;
      case 'practice':
        this.#enterPracticePhase();
        break;
      case 'summary':
        this.#enterSummaryPhase();
        break;
    }

    // Notificar callback externo
    if (typeof this.#callbacks.onPhaseChange === 'function') {
      try {
        this.#callbacks.onPhaseChange(phase, this.getState());
      } catch (err) {
        console.error('Error en onPhaseChange:', err);
      }
    }
  }

  #enterDemoPhase() {
    this.#updateProgressUI(33, 'Paso 1 de 3: Mira la seña');
    this.#toggleContainers('demo');

    if (typeof document === 'undefined') return;

    // Mostrar franja inferior en estado neutro durante demostración
    const sheet = document.getElementById('lessonFeedbackSheet');
    if (sheet) {
      sheet.classList.remove('hidden', 'is-correct', 'is-incorrect');
    }

    const feedbackTitle = document.getElementById('lessonFeedbackTitle');
    if (feedbackTitle) feedbackTitle.textContent = 'Paso 1: Demostración Guiada';

    const feedbackDesc = document.getElementById('lessonFeedbackText');
    if (feedbackDesc) feedbackDesc.textContent = 'Observa los movimientos y la postura de la mano antes del test.';

    // Configurar video de demostración con fallback WebP
    const videoEl = document.getElementById('lessonDemoVideo');
    const webpEl = document.getElementById('lessonDemoWebp');
    this.#loadMediaWithWebpFallback(videoEl, webpEl, this.#currentSignId);

    // Tarjeta del zorrito con explicación pedagógica
    const titleEl = document.getElementById('lessonDemoSignName');
    if (titleEl) titleEl.textContent = this.#currentSign.name || this.#currentSignId;

    const descEl = document.getElementById('lessonDemoDesc');
    if (descEl) descEl.textContent = this.#currentSign.desc || '';

    const tipEl = document.getElementById('lessonDemoTip');
    if (tipEl) tipEl.textContent = this.#currentSign.tip || '';

    // Botón Continuar activo en demo
    const btnContinue = document.getElementById('btnLessonContinue');
    if (btnContinue) {
      btnContinue.disabled = false;
      btnContinue.textContent = '¡Entendido! Probar comprensión →';
    }
  }

  #enterQuizPhase() {
    this.#updateProgressUI(66, 'Paso 2 de 3: ¿Qué seña es?');
    this.#toggleContainers('quiz');
    this.#hideFeedbackSheet();

    if (typeof document === 'undefined') return;

    // Video del quiz sin título visible con fallback WebP
    const videoEl = document.getElementById('lessonQuizVideo');
    const webpEl = document.getElementById('lessonQuizWebp');
    this.#loadMediaWithWebpFallback(videoEl, webpEl, this.#currentSignId);

    // Renderizar grilla de 4 opciones
    const gridEl = document.getElementById('quizOptionsGrid');
    if (gridEl) {
      gridEl.innerHTML = '';
      this.#options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'quiz-choice-btn w-full p-4 rounded-xl border-2 border-slate-700 bg-slate-800/80 hover:bg-slate-700/80 hover:border-amber-400/60 text-white font-medium text-left transition flex items-center justify-between min-h-[52px] select-none';
        btn.dataset.signId = opt.id;
        if (typeof btn.setAttribute === 'function') {
          btn.setAttribute('aria-label', `Opción ${idx + 1}: ${opt.name}`);
        }

        btn.innerHTML = `
          <span class="flex items-center gap-3">
            <span class="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center text-xs font-mono font-bold text-amber-400">${idx + 1}</span>
            <span class="text-base text-slate-100 font-semibold">${opt.name}</span>
          </span>
          <span class="choice-indicator w-5 h-5 rounded-full border border-slate-600 flex items-center justify-center text-[10px]"></span>
        `;

        btn.addEventListener('click', () => {
          this.submitQuizAnswer(opt.id);
        });

        gridEl.appendChild(btn);
      });
    }

    // Deshabilitar botón continuar hasta responder
    const btnContinue = document.getElementById('btnLessonContinue');
    if (btnContinue) {
      btnContinue.disabled = true;
      btnContinue.textContent = 'Selecciona una respuesta';
    }
  }

  #enterPracticePhase() {
    this.#updateProgressUI(90, 'Paso 3 de 3: Réplica motriz con cámara');
    this.#toggleContainers('practice');
    this.#hideFeedbackSheet();

    if (typeof document === 'undefined') return;

    // Pausar video y webp de quiz
    const quizVideo = document.getElementById('lessonQuizVideo');
    if (quizVideo && typeof quizVideo.pause === 'function') {
      try { quizVideo.pause(); } catch (e) {}
    }
    const quizWebp = document.getElementById('lessonQuizWebp');
    if (quizWebp) quizWebp.classList.add('hidden');

    // Video guía espejo con fallback WebP
    const guideVideo = document.getElementById('lessonPracticeGuideVideo');
    const guideWebp = document.getElementById('lessonPracticeGuideWebp');
    this.#loadMediaWithWebpFallback(guideVideo, guideWebp, this.#currentSignId);

    // Activar webcam y MediaPipe vía VisionEvaluator
    this.#startCameraForPractice();

    // Actualizar texto instructivo según si la seña incluye puntos de movimiento
    const practiceHintEl = document.getElementById('lessonPracticeHint');
    if (practiceHintEl) {
      if (this.#currentSign && this.#currentSign.trajectory && this.#currentSign.trajectory.enabled) {
        practiceHintEl.textContent = 'Sigue la secuencia de puntos numerados en tu cámara y mantén la postura final';
      } else {
        practiceHintEl.textContent = 'Mantén la postura con precisión ≥ 85% durante 1.2 segundos';
      }
    }

    // Actualizar indicador radar de práctica
    this.#updatePracticeProgressUI(0);

    const btnContinue = document.getElementById('btnLessonContinue');
    if (btnContinue) {
      btnContinue.disabled = true;
      btnContinue.textContent = (this.#currentSign && this.#currentSign.trajectory && this.#currentSign.trajectory.enabled)
        ? 'Sigue los puntos con tu mano...'
        : 'Mantén la seña frente a la cámara...';
    }
  }

  #enterSummaryPhase() {
    this.#updateProgressUI(100, '¡Lección Completada!');
    this.#toggleContainers('summary');
    this.#hideFeedbackSheet();

    // Detener cámara al llegar al resumen
    this.#stopCameraIfActive();

    // 1. Otorgar XP en AuthProfileManager
    if (typeof window !== 'undefined' && window.AuthProfileManager && typeof window.AuthProfileManager.recordSignMastered === 'function') {
      window.AuthProfileManager.recordSignMastered(this.#currentSignId, this.#earnedXp);
    }

    // 2. Marcar seña en LearningPlanManager
    if (typeof window !== 'undefined' && window.LearningPlanManager) {
      if (typeof window.LearningPlanManager.markSignCompletedInPlan === 'function') {
        window.LearningPlanManager.markSignCompletedInPlan(this.#currentSignId);
      } else if (typeof window.LearningPlanManager.markSignCompleted === 'function') {
        window.LearningPlanManager.markSignCompleted(this.#currentSignId);
      }
    }

    // 3. Celebración audio/visual
    if (typeof confetti === 'function') {
      try {
        confetti({ particleCount: 110, spread: 80, origin: { y: 0.5 } });
      } catch (e) {}
    }

    if (typeof window !== 'undefined' && window.ChatTutor) {
      try {
        if (typeof window.ChatTutor.playVictorySound === 'function') {
          window.ChatTutor.playVictorySound();
        }
        if (typeof window.ChatTutor.speakText === 'function') {
          window.ChatTutor.speakText(`¡Excelente trabajo! Has dominado la seña ${this.#currentSign.name || this.#currentSignId}.`);
        }
      } catch (e) {}
    }

    // 4. Renderizar datos en DOM de resumen
    if (typeof document !== 'undefined') {
      const signNameEl = document.getElementById('lessonSummarySignName');
      if (signNameEl) signNameEl.textContent = this.#currentSign.name || this.#currentSignId;

      const xpEl = document.getElementById('lessonSummaryXp');
      if (xpEl) xpEl.textContent = `+${this.#earnedXp} XP`;

      const scoreEl = document.getElementById('lessonSummaryScore');
      if (scoreEl) scoreEl.textContent = `${this.#practiceScore || 95}%`;

      const btnFinish = document.getElementById('btnLessonFinish');
      if (btnFinish) {
        btnFinish.onclick = () => this.closeLesson();
      }
    }

    // 5. Notificar callback
    if (typeof this.#callbacks.onLessonComplete === 'function') {
      try {
        this.#callbacks.onLessonComplete(this.getSummary());
      } catch (err) {
        console.error('Error en onLessonComplete:', err);
      }
    }
  }

  // -------------------------------------------------------------
  // GESTIÓN DE CÁMARA (VisionEvaluator)
  // -------------------------------------------------------------

  #loadMediaWithWebpFallback(videoEl, webpEl, signId) {
    if (!videoEl && !webpEl) return;
    const folder = this.#videoMode === 'anime' ? 'videos/anime' : 'videos/real';
    const mp4Url = `${folder}/${signId}_body.mp4`;
    const webpUrl = `${folder}/${signId}_body.webp`;

    const activateWebp = () => {
      if (videoEl) videoEl.classList.add('hidden');
      if (webpEl) {
        webpEl.src = webpUrl;
        webpEl.classList.remove('hidden');
      }
    };

    if (videoEl) {
      if (webpEl) webpEl.classList.add('hidden');
      videoEl.classList.remove('hidden');
      videoEl.muted = true;
      videoEl.loop = true;
      videoEl.setAttribute('playsinline', 'true');

      videoEl.onerror = () => {
        console.warn(`[LessonSession] Fallo decodificación MP4 (${mp4Url}), activando fallback WebP`);
        activateWebp();
      };

      videoEl.src = mp4Url;
      if (typeof videoEl.load === 'function') {
        try { videoEl.load(); } catch (e) {}
      }

      if (typeof videoEl.play === 'function') {
        const playPromise = videoEl.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            if (err.name === 'AbortError') return;
            console.warn(`[LessonSession] Autoplay MP4 prevenido (${err.message}), activando WebP`);
            activateWebp();
          });
        }
      }
    } else {
      activateWebp();
    }
  }

  #startCameraForPractice() {
    if (typeof window === 'undefined') return;

    const lessonVideo = document.getElementById('lessonPracticeWebcamVideo');
    const loader = document.getElementById('lessonCameraLoading');
    if (loader) loader.classList.remove('hidden');

    const lessonSelect = document.getElementById('lessonCameraSelect');
    if (window.CameraManager && lessonSelect) {
      window.CameraManager.attachSelect(lessonSelect);
    }

    if (window.VisionEvaluator) {
      try {
        window.VisionEvaluator.setTargetSign(this.#currentSign);
        window.VisionEvaluator.setPaused(false);

        if (typeof window.VisionEvaluator.isRunning === 'function' && !window.VisionEvaluator.isRunning()) {
          window.VisionEvaluator.start();
        }
        this.#cameraActive = true;
      } catch (err) {
        console.warn('VisionEvaluator no pudo iniciar cámara:', err);
      }
    }

    const attachStream = () => {
      const stream = (window.CameraManager && typeof window.CameraManager.getStream === 'function')
        ? window.CameraManager.getStream()
        : (document.getElementById('webcamVideo')?.srcObject || null);

      if (lessonVideo && stream) {
        if (lessonVideo.srcObject !== stream) {
          lessonVideo.srcObject = stream;
          lessonVideo.muted = true;
          lessonVideo.setAttribute('playsinline', 'true');
          lessonVideo.play().then(() => {
            if (loader) loader.classList.add('hidden');
          }).catch(() => {
            if (loader) loader.classList.add('hidden');
          });
        } else {
          if (loader) loader.classList.add('hidden');
        }
        return true;
      }
      return false;
    };

    if (!attachStream()) {
      let attempts = 0;
      const poll = setInterval(() => {
        attempts++;
        if (attachStream() || attempts > 15) {
          clearInterval(poll);
          if (loader) loader.classList.add('hidden');
        }
      }, 200);
    }
  }

  #stopCameraIfActive() {
    if (typeof window === 'undefined') return;
    const lessonVideo = document.getElementById('lessonPracticeWebcamVideo');
    if (lessonVideo) lessonVideo.srcObject = null;
    if (window.VisionEvaluator && this.#cameraActive) {
      try { window.VisionEvaluator.stop(); } catch (e) {}
      this.#cameraActive = false;
    }
  }

  // -------------------------------------------------------------
  // DOM HELPERS Y RENDERIZADO DE FEEDBACK
  // -------------------------------------------------------------

  #showModal() {
    const modal = typeof document !== 'undefined' && document.getElementById('lessonSessionModal');
    if (modal) { modal.classList.remove('hidden'); modal.classList.add('flex'); }
  }

  #hideModal() {
    const modal = typeof document !== 'undefined' && document.getElementById('lessonSessionModal');
    if (modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
  }

  #toggleContainers(activePhase) {
    if (typeof document === 'undefined') return;
    const containers = {
      demo: document.getElementById('phaseDemoContainer'),
      quiz: document.getElementById('phaseQuizContainer'),
      practice: document.getElementById('phasePracticeContainer'),
      summary: document.getElementById('phaseSummaryContainer')
    };
    Object.entries(containers).forEach(([phaseKey, el]) => {
      if (el) phaseKey === activePhase ? el.classList.remove('hidden') : el.classList.add('hidden');
    });
  }

  #updateProgressUI(percentage, stepText = '') {
    if (typeof document === 'undefined') return;
    const barEl = document.getElementById('lessonProgressBar');
    if (barEl) barEl.style.width = `${percentage}%`;
    const titleEl = document.getElementById('lessonHeaderStepText');
    if (titleEl && stepText) titleEl.textContent = stepText;
  }

  #renderQuizFeedback(isCorrect) {
    if (typeof document === 'undefined') return;

    // Resaltar botones en la grilla
    const gridEl = document.getElementById('quizOptionsGrid');
    if (gridEl) {
      const buttons = gridEl.querySelectorAll('.quiz-choice-btn');
      buttons.forEach(btn => {
        const signId = btn.dataset.signId;
        if (signId === this.#selectedOptionId) {
          btn.classList.add('is-selected');
          if (isCorrect) {
            btn.classList.add('border-emerald-500', 'bg-emerald-950/60');
          } else {
            btn.classList.add('border-rose-500', 'bg-rose-950/60');
          }
        }
      });
    }

    // Configurar la franja de feedback tipo Duolingo (#lessonFeedbackSheet)
    const sheet = document.getElementById('lessonFeedbackSheet');
    const titleEl = document.getElementById('lessonFeedbackTitle');
    const descEl = document.getElementById('lessonFeedbackText');
    const btnContinue = document.getElementById('btnLessonContinue');

    if (sheet) {
      sheet.classList.remove('hidden');
      if (isCorrect) {
        sheet.classList.remove('is-incorrect');
        sheet.classList.add('is-correct');

        if (titleEl) titleEl.textContent = '¡Correcto! Excelente ojo visual 🦊';
        if (descEl) descEl.textContent = `Has identificado con precisión la seña "${this.#currentSign.name || this.#currentSignId}". Ahora practiquémosla con tu cámara.`;

        if (typeof confetti === 'function') {
          try { confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } }); } catch (e) {}
        }
      } else {
        sheet.classList.remove('is-correct');
        sheet.classList.add('is-incorrect');

        if (titleEl) titleEl.textContent = '¡Casi lo logras! Revisa este detalle:';
        if (descEl) descEl.textContent = `La seña correcta es "${this.#currentSign.name || this.#currentSignId}". ${this.#currentSign.tip || ''}`;
      }
    }

    if (btnContinue) {
      btnContinue.disabled = false;
      btnContinue.textContent = 'Continuar a la Práctica →';
    }
  }

  #renderPracticeSuccessFeedback(score) {
    if (typeof document === 'undefined') return;

    const sheet = document.getElementById('lessonFeedbackSheet');
    const titleEl = document.getElementById('lessonFeedbackTitle');
    const descEl = document.getElementById('lessonFeedbackText');
    const btnContinue = document.getElementById('btnLessonContinue');

    if (sheet) {
      sheet.classList.remove('hidden', 'is-incorrect');
      sheet.classList.add('is-correct');

      if (titleEl) titleEl.textContent = '¡Excelente réplica motriz! 🌟';
      if (descEl) descEl.textContent = `Lograste la seña con ${Math.round(score)}% de precisión mantenida.`;
    }

    if (btnContinue) {
      btnContinue.disabled = false;
      btnContinue.textContent = 'Ver Resumen de la Lección →';
    }
  }

  #hideFeedbackSheet() {
    if (typeof document === 'undefined') return;
    const sheet = document.getElementById('lessonFeedbackSheet');
    if (sheet) {
      sheet.classList.add('hidden');
      sheet.classList.remove('is-correct', 'is-incorrect');
    }
  }

  #updatePracticeProgressUI(percent) {
    if (typeof document === 'undefined') return;

    const radarBar = document.getElementById('lessonPracticeRadarBar');
    if (radarBar) {
      radarBar.style.width = `${percent}%`;
    }

    const radarText = document.getElementById('lessonPracticeRadarText');
    if (radarText) {
      radarText.textContent = `${percent}%`;
    }
  }

  #bindUIEvents() {
    if (typeof document === 'undefined') return;

    // Selector de Modo de Video (Real / Anime IA)
    const btnReal = document.getElementById('btnLessonModeReal');
    if (btnReal) btnReal.addEventListener('click', () => this.setVideoMode('real'));
    const btnAnime = document.getElementById('btnLessonModeAnime');
    if (btnAnime) btnAnime.addEventListener('click', () => this.setVideoMode('anime'));

    // Botón cerrar (X)
    const btnClose = document.getElementById('btnLessonClose');
    if (btnClose) {
      btnClose.addEventListener('click', () => this.closeLesson());
    }

    // Botón continuar de la franja de feedback
    const btnContinue = document.getElementById('btnLessonContinue');
    if (btnContinue) {
      btnContinue.addEventListener('click', () => {
        if (!btnContinue.disabled) {
          this.nextPhase();
        }
      });
    }

    // Botón terminar resumen
    const btnFinish = document.getElementById('btnLessonFinish');
    if (btnFinish) {
      btnFinish.addEventListener('click', () => this.closeLesson());
    }
  }

  #handleKeyDown(e) {
    if (!this.#isActive) return;

    if (e.key === 'Escape') {
      this.closeLesson();
    } else if (e.key === 'Enter') {
      const btnContinue = document.getElementById('btnLessonContinue');
      if (btnContinue && !btnContinue.disabled && this.#currentPhase !== 'summary') {
        this.nextPhase();
      }
    } else if (this.#currentPhase === 'quiz' && !this.#quizAnswered && ['1', '2', '3', '4'].includes(e.key)) {
      const idx = parseInt(e.key, 10) - 1;
      if (this.#options[idx]) {
        this.submitQuizAnswer(this.#options[idx].id);
      }
    }
  }

  closeLesson() {
    this.destroy();
  }

  // -------------------------------------------------------------
  // CONTROL DE MODO DE VIDEO (REAL / ANIME IA)
  // -------------------------------------------------------------

  getVideoMode() {
    return this.#videoMode;
  }

  setVideoMode(mode) {
    this.#videoMode = (mode === 'anime') ? 'anime' : 'real';
    if (typeof window !== 'undefined' && window.localStorage) {
      try { localStorage.setItem('manitas_video_mode', this.#videoMode); } catch (e) {}
    }
    this.#updateVideoModeUI();
    this.#reloadCurrentPhaseMedia();
    return this.#videoMode;
  }

  #reloadCurrentPhaseMedia() {
    if (!this.#isActive || !this.#currentSignId || typeof document === 'undefined') return;
    if (this.#currentPhase === 'demo') {
      this.#loadMediaWithWebpFallback(document.getElementById('lessonDemoVideo'), document.getElementById('lessonDemoWebp'), this.#currentSignId);
    } else if (this.#currentPhase === 'quiz') {
      this.#loadMediaWithWebpFallback(document.getElementById('lessonQuizVideo'), document.getElementById('lessonQuizWebp'), this.#currentSignId);
    } else if (this.#currentPhase === 'practice') {
      this.#loadMediaWithWebpFallback(document.getElementById('lessonPracticeGuideVideo'), document.getElementById('lessonPracticeGuideWebp'), this.#currentSignId);
    }
  }

  #updateVideoModeUI() {
    if (typeof document === 'undefined') return;
    const btnReal = document.getElementById('btnLessonModeReal');
    const btnAnime = document.getElementById('btnLessonModeAnime');
    const isAnime = this.#videoMode === 'anime';
    if (btnReal) {
      btnReal.className = !isAnime
        ? 'btn-spring px-2.5 py-1 rounded-lg transition bg-amber-400 text-slate-950 font-bold shadow-sm'
        : 'btn-spring px-2.5 py-1 rounded-lg transition text-slate-300 hover:text-white';
    }
    if (btnAnime) {
      btnAnime.className = isAnime
        ? 'btn-spring px-2.5 py-1 rounded-lg transition bg-amber-400 text-slate-950 font-bold shadow-sm'
        : 'btn-spring px-2.5 py-1 rounded-lg transition text-slate-300 hover:text-white';
    }
  }

  // -------------------------------------------------------------
  // ACCESORES PÚBLICOS DE CONSULTA
  // -------------------------------------------------------------

  isActive() {
    return this.#isActive;
  }

  getCurrentPhase() {
    return this.#currentPhase;
  }

  getCurrentSign() {
    return this.#currentSign ? { ...this.#currentSign } : null;
  }

  getQuizOptions() {
    return this.#options.map(o => ({ ...o }));
  }

  getState() {
    return {
      isActive: this.#isActive,
      signId: this.#currentSignId,
      phase: this.#currentPhase,
      videoMode: this.#videoMode,
      planContext: this.#planContext,
      quizAnswered: this.#quizAnswered,
      quizPassed: this.#quizPassed,
      quizAttempts: this.#quizAttempts,
      practiceScore: this.#practiceScore,
      practicePassed: this.#practicePassed,
      practiceHoldMs: this.#practiceHoldMs,
      cameraActive: this.#cameraActive
    };
  }

  getSummary() {
    return {
      signId: this.#currentSignId,
      signName: this.#currentSign ? (this.#currentSign.name || this.#currentSign.id) : this.#currentSignId,
      quizPassed: this.#quizPassed,
      quizAttempts: this.#quizAttempts,
      practiceScore: this.#practiceScore || (this.#practicePassed ? 90 : 0),
      practicePassed: this.#practicePassed,
      earnedXp: this.#earnedXp,
      planContext: this.#planContext,
      completedAt: new Date().toISOString()
    };
  }
}

// Exposición global en window (Reglas 5 y 8 AGENTS.md)
if (typeof window !== 'undefined') {
  window.LessonSessionController = LessonSessionController;
}

// Soporte CommonJS para pruebas en Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LessonSessionController;
}
