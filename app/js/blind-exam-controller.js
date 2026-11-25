/**
 * LSC Learn · Proyecto EXIS
 * blind-exam-controller.js - Controlador de la Arena de Examen Dedicada (POO)
 * 
 * Reglas de Arquitectura:
 * - Paradigma POO y Encapsulación Estricta (# private fields).
 * - Formato Híbrido Alternado Estilo Duolingo:
 *     * Formato A (Reto Motriz): Demuestra la seña de memoria frente a la cámara web (MediaPipe Hands).
 *     * Formato B (Pregunta Quiz): Comprensión visual con video mudo y 4 alternativas interactivas.
 * - Enfoque Pedagógico Limpio: En el reto de cámara no hay videos laterales distractores.
 * - En la pregunta de Quiz, la cámara se apaga al 100% para ahorrar hardware y batería.
 * - Dificultad escalonada por checkpoint (Nvl 1: 25s, Nvl 2: 20s, Nvl 3: 15s) y examen final.
 * - Apagado inmediato de cámara hardware (track.stop() vía VisionEvaluator) al acertar, saltar o terminar.
 * - Resumen y certificado de evaluación con desglose (#examSummaryModal).
 */

const ExamUIHelperClass = (typeof window !== 'undefined' && window.ExamUIHelper) ||
  (typeof require === 'function' ? require('./exam-ui-helper.js') : null);

class BlindExamController {
  #isActive;
  #currentQuestionIndex;
  #questions; // Array de objetos { signId, signName, type: 'gesture' | 'quiz' }
  #planTitle;
  #difficultyLevel;
  #secondsPerQuestion;
  #remainingSeconds;
  #timerInterval;
  #results;
  #videoMode; // 'real' | 'anime'
  #practiceHoldMs;
  #isQuestionFinished;
  #originalTipHtml;
  #originalDescText;
  #returnView;
  #previousFocus;
  #boundHandleKeyDown;
  #uiHelper;
  #examMode;
  #pendingExamConfig;

  constructor() {
    this.#isActive = false;
    this.#currentQuestionIndex = 0;
    this.#questions = [];
    this.#planTitle = 'Examen LSC';
    this.#difficultyLevel = 1;
    this.#secondsPerQuestion = 25;
    this.#remainingSeconds = 25;
    this.#timerInterval = null;
    this.#results = [];
    this.#videoMode = (typeof localStorage !== 'undefined' && localStorage.getItem('manitas_video_mode')) || 'real';
    this.#practiceHoldMs = 0;
    this.#isQuestionFinished = false;
    this.#originalTipHtml = '';
    this.#originalDescText = '';
    this.#returnView = 'path';
    this.#previousFocus = null;
    this.#boundHandleKeyDown = this.#handleKeyDown.bind(this);
    this.#uiHelper = ExamUIHelperClass ? new ExamUIHelperClass() : null;
    this.#examMode = null;
    this.#pendingExamConfig = null;
  }

  /**
   * Inicializa los listeners de UI del examen y sincroniza botones de video
   */
  init() {
    if (this.#uiHelper) this.#uiHelper.init();
    this.#bindUIEvents();
    this.#syncVideoModeButtons();
  }

  /**
   * Inicia la Arena de Examen con una lista de señas o plan de estudio activo
   * @param {Object|Array} planOrSigns - Plan de estudio o arreglo de IDs de señas
   * @param {number} secondsPerQuestion - Segundos por reto
   */
  start(planOrSigns = null, secondsPerQuestion = 25) {
    // 1. Obtener lista de señas para el examen
    let signsList = [];
    let title = 'Modo Examen LSC';
    let difficultyLevel = 1;

    if (planOrSigns && Array.isArray(planOrSigns.signs) && planOrSigns.signs.length > 0) {
      signsList = [...planOrSigns.signs];
      title = planOrSigns.title || title;
      if (planOrSigns.secondsPerQuestion) secondsPerQuestion = planOrSigns.secondsPerQuestion;
      if (planOrSigns.difficultyLevel) difficultyLevel = planOrSigns.difficultyLevel;
    } else if (Array.isArray(planOrSigns) && planOrSigns.length > 0) {
      signsList = [...planOrSigns];
    } else if (window.LearningPlanManager) {
      const active = window.LearningPlanManager.getActivePlan();
      if (active && Array.isArray(active.signs) && active.signs.length > 0) {
        signsList = [...active.signs];
        title = `Examen: ${active.title}`;
        difficultyLevel = Math.max(3, Math.ceil(active.signs.length / 3));
      }
    }

    if (signsList.length === 0) {
      signsList = ['HOLA', 'YO', 'BUENOS', 'DIAS', 'A'];
    }

    // 2. Guardar configuración pendiente; si se pasó modalidad explícita, arrancar directo
    this.#clearTimer();
    this.#planTitle = title;
    this.#difficultyLevel = difficultyLevel;
    this.#secondsPerQuestion = Math.max(8, secondsPerQuestion);
    this.#currentQuestionIndex = 0;
    this.#results = [];
    this.#questions = [];
    this.#isActive = false;
    this.#isQuestionFinished = false;
    this.#practiceHoldMs = 0;
    this.#examMode = null;
    this.#pendingExamConfig = {
      signsList,
      title: this.#planTitle,
      difficultyLevel: this.#difficultyLevel,
      secondsPerQuestion: this.#secondsPerQuestion
    };

    // Determinar la vista a la cual retornar (Ruta por defecto o la vista de origen)
    const currentView = (window.ViewRouter && typeof window.ViewRouter.getCurrentView === 'function')
      ? window.ViewRouter.getCurrentView()
      : 'path';
    this.#returnView = (planOrSigns && planOrSigns.returnView) ? planOrSigns.returnView : currentView;

    // Sincronizar preferencia activa de modo de video (Real / Anime IA)
    let activeMode = 'real';
    if (typeof localStorage !== 'undefined' && localStorage.getItem('manitas_video_mode')) {
      activeMode = localStorage.getItem('manitas_video_mode');
    } else if (window.VideoPlayer && typeof window.VideoPlayer.getMode === 'function') {
      activeMode = window.VideoPlayer.getMode();
    } else if (window.LessonSessionController && typeof window.LessonSessionController.getVideoMode === 'function') {
      activeMode = window.LessonSessionController.getVideoMode();
    }
    this.#videoMode = (activeMode === 'anime') ? 'anime' : 'real';

    // Cerrar inmediatamente cualquier popup de victoria previo
    const successPopup = document.getElementById('successPopup');
    if (successPopup) {
      successPopup.classList.add('hidden');
      successPopup.classList.remove('modal-enter');
    }

    // 3. Pausar video de estudio para evitar consumo innecesario de GPU/CPU
    if (window.VideoPlayer && typeof window.VideoPlayer.pause === 'function') {
      window.VideoPlayer.pause();
    }
    const videoEl = document.getElementById('signVideo');
    if (videoEl && typeof videoEl.pause === 'function') {
      try { videoEl.pause(); } catch (e) {}
    }

    // 4. Salvar y ocultar pistas de ayuda en el reproductor de estudio
    const tipEl = document.getElementById('targetSignTip');
    const descEl = document.getElementById('targetSignDesc');
    if (tipEl && !this.#originalTipHtml) {
      this.#originalTipHtml = tipEl.innerHTML;
      tipEl.innerHTML = `<span class="text-amber-800 font-semibold font-mono text-[11px]">🛡️ MODO EXAMEN ACTIVO:</span> Demuestra la seña de memoria frente a la cámara sin guía de video ni pistas visuales.`;
    }
    if (descEl && !this.#originalDescText) {
      this.#originalDescText = descEl.textContent;
      descEl.textContent = 'Evaluación Ciega sin Demostración';
    }

    // 5. Mostrar el escudo de examen sobre el reproductor de estudio
    const overlay = document.getElementById('blindExamOverlay');
    if (overlay) {
      overlay.classList.remove('hidden');
    }

    // 6. ABRIR LA ARENA DEDICADA DE EXAMEN (#examSessionModal)
    if (typeof document !== 'undefined' && document.activeElement) {
      this.#previousFocus = document.activeElement;
    }
    const examModal = document.getElementById('examSessionModal');
    if (examModal) {
      examModal.classList.remove('hidden');
      examModal.classList.add('flex');
      const closeBtn = document.getElementById('btnExamClose');
      if (closeBtn && typeof closeBtn.focus === 'function') closeBtn.focus();
    }

    this.#syncVideoModeButtons();

    if (typeof window.addEventListener === 'function') {
      window.addEventListener('keydown', this.#boundHandleKeyDown);
    }

    // 7. Iniciar modalidad explícita o mostrar selector previo (Solo Cámara vs. Adivinar Señas)
    const requestedMode = (planOrSigns && !Array.isArray(planOrSigns) && (planOrSigns.mode === 'camera' || planOrSigns.mode === 'quiz'))
      ? planOrSigns.mode
      : null;

    if (requestedMode) {
      this.startWithMode(requestedMode);
    } else {
      this.#showModeSelection();
    }
  }

  /**
   * Arranca el examen en una modalidad pura ('camera' o 'quiz')
   * @param {'camera'|'quiz'} mode
   */
  startWithMode(mode) {
    if (mode !== 'camera' && mode !== 'quiz') return;
    const cfg = this.#pendingExamConfig || {
      signsList: ['HOLA', 'YO', 'BUENOS', 'DIAS', 'A'],
      title: this.#planTitle,
      difficultyLevel: this.#difficultyLevel,
      secondsPerQuestion: this.#secondsPerQuestion
    };

    const questionType = mode === 'camera' ? 'gesture' : 'quiz';
    this.#examMode = mode;
    this.#questions = cfg.signsList.map((signId) => ({
      signId,
      signName: this.#lookupSignName(signId),
      type: questionType
    }));
    this.#currentQuestionIndex = 0;
    this.#results = [];
    this.#isActive = true;
    this.#isQuestionFinished = false;
    this.#practiceHoldMs = 0;

    const modePane = document.getElementById('examPaneModeSelect');
    if (modePane) {
      modePane.classList.add('hidden');
      modePane.classList.remove('flex');
    }
    const timerBadge = document.getElementById('examTimerBadge');
    if (timerBadge) {
      timerBadge.classList.remove('hidden');
    }

    // Vincular selector de cámara solo si la modalidad elegida usa cámara
    if (mode === 'camera') {
      const camMgr = (window.CameraManager && typeof window.CameraManager.attachSelect === 'function')
        ? window.CameraManager
        : ((window.CameraDeviceManager && typeof window.CameraDeviceManager.attachSelect === 'function') ? window.CameraDeviceManager : null);
      if (camMgr) {
        const examSelect = document.getElementById('examCameraSelect');
        if (examSelect) {
          camMgr.attachSelect(examSelect);
        }
      }
    }

    this.#loadQuestion(0);
  }

  getExamMode() {
    return this.#examMode;
  }

  #showModeSelection() {
    this.#clearTimer();
    this.#isActive = false;
    this.#examMode = null;

    const modePane = document.getElementById('examPaneModeSelect');
    const gesturePane = document.getElementById('examPaneGesture');
    const quizPane = document.getElementById('examPaneQuiz');
    const timerBadge = document.getElementById('examTimerBadge');
    const videoToggle = document.getElementById('examVideoModeToggle');
    const progressBar = document.getElementById('examProgressBar');
    const headerStep = document.getElementById('examHeaderStepText');
    const titleEl = document.getElementById('examModeSelectTitle');
    const metaEl = document.getElementById('examModeSelectMeta');

    if (gesturePane) {
      gesturePane.classList.add('hidden');
      gesturePane.classList.remove('flex');
    }
    if (quizPane) {
      quizPane.classList.add('hidden');
      quizPane.classList.remove('flex');
    }
    if (videoToggle) {
      videoToggle.classList.add('hidden');
      videoToggle.classList.remove('flex');
    }
    if (timerBadge) {
      timerBadge.classList.add('hidden');
    }
    if (modePane) {
      modePane.classList.remove('hidden');
      modePane.classList.add('flex');
    }
    if (progressBar) progressBar.style.width = '0%';
    if (headerStep) headerStep.textContent = 'Elige modalidad';
    if (titleEl) titleEl.textContent = this.#planTitle;
    if (metaEl && this.#pendingExamConfig) {
      metaEl.textContent = `${this.#pendingExamConfig.signsList.length} señas · ${this.#secondsPerQuestion}s por pregunta`;
    }
  }

  update() {
    if (!this.#isActive) return;
    this.#updateTimerDisplay();
  }

  reset() {
    this.stopExam();
  }

  destroy() {
    this.stopExam();
    this.closeSummaryModal();
    if (typeof window.removeEventListener === 'function') {
      window.removeEventListener('keydown', this.#boundHandleKeyDown);
    }
  }

  isExamActive() {
    return this.#isActive;
  }

  getVideoMode() {
    return this.#videoMode;
  }

  setVideoMode(mode) {
    if (mode !== 'real' && mode !== 'anime') return;
    this.#videoMode = mode;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('manitas_video_mode', mode);
    }
    this.#syncVideoModeButtons();

    // Si la pregunta actual es de tipo quiz, actualizar su video
    const currentQ = this.#questions[this.#currentQuestionIndex];
    if (this.#isActive && currentQ && currentQ.type === 'quiz') {
      this.#loadQuizMedia(currentQ.signId);
    }
  }

  /**
   * Recibe la similitud calculada por MediaPipe Hands en cada fotograma
   * @param {number} accuracy - Precisión de 0 a 100
   * @param {number} deltaTime - Milisegundos transcurridos
   */
  handlePracticeFrame(accuracy, deltaTime = 100) {
    if (!this.#isActive || this.#isQuestionFinished) return;
    const currentQ = this.#questions[this.#currentQuestionIndex];
    if (!currentQ || currentQ.type !== 'gesture') return;

    // Ocultar spinner de carga y fallback una vez que llegan fotogramas
    const camLoading = document.getElementById('examCameraLoading');
    if (camLoading && !camLoading.classList.contains('hidden')) {
      camLoading.classList.add('hidden');
    }
    const camFallback = document.getElementById('examCameraFallback');
    if (camFallback) camFallback.classList.add('hidden');
    const liveBadge = document.getElementById('examLiveBadge');
    if (liveBadge) liveBadge.textContent = 'EN VIVO';

    // Actualizar barra y texto del radar
    const radarBar = document.getElementById('examGestureRadarBar');
    const radarText = document.getElementById('examGestureRadarText');
    const clampedScore = Math.min(100, Math.max(0, Math.round(accuracy)));

    if (radarBar) radarBar.style.width = `${clampedScore}%`;
    if (radarText) radarText.textContent = `${clampedScore}%`;

    // Si supera el 85%, acumular tiempo de sostén (1.0 segundo = 1000 ms)
    if (accuracy >= 85) {
      this.#practiceHoldMs += deltaTime;
      if (radarBar) {
        radarBar.classList.add('bg-emerald-400');
        radarBar.classList.remove('bg-amber-400');
      }
      if (this.#practiceHoldMs >= 1000) {
        this.handleSignMasteredInExam(currentQ, accuracy);
      }
    } else {
      this.#practiceHoldMs = Math.max(0, this.#practiceHoldMs - (deltaTime * 0.5));
      if (radarBar) {
        radarBar.classList.add('bg-amber-400');
        radarBar.classList.remove('bg-emerald-400');
      }
    }
  }

  /**
   * Maneja el acierto confirmado de una seña en el examen
   * @param {Object} signObj - Objeto con signId o name
   * @param {number} accuracyScore - Puntuación obtenida
   */
  handleSignMasteredInExam(signObj, accuracyScore) {
    if (!this.#isActive || this.#isQuestionFinished) return;

    this.#isQuestionFinished = true;
    this.#clearTimer();

    const currentQ = this.#questions[this.#currentQuestionIndex];
    const signId = currentQ ? currentQ.signId : (signObj && (signObj.id || signObj.name));
    const signName = currentQ ? currentQ.signName : (signObj && (signObj.name || signObj.id));

    // Registrar acierto
    this.#results.push({
      signId,
      signName,
      type: currentQ ? currentQ.type : 'gesture',
      passed: true,
      score: Math.round(accuracyScore || 100)
    });

    // Otorgar XP de examen (+35 XP por reto de cámara a ciegas)
    if (window.AuthProfileManager) {
      window.AuthProfileManager.recordSignMastered(signId, 35);
    }
    if (window.ChatTutor && typeof window.ChatTutor.playVictorySound === 'function') {
      window.ChatTutor.playVictorySound();
    }

    // Feedback visual verde en el título y radar
    const gestureNameEl = document.getElementById('examGestureSignName');
    if (gestureNameEl) gestureNameEl.classList.add('text-emerald-700');

    const radarBar = document.getElementById('examGestureRadarBar');
    if (radarBar) {
      radarBar.classList.add('bg-emerald-500');
      radarBar.style.width = '100%';
    }

    // APAGAR CÁMARA INMEDIATAMENTE AL RESOLVER (Apaga LED físico de hardware)
    if (window.VisionEvaluator && typeof window.VisionEvaluator.stop === 'function') {
      window.VisionEvaluator.stop();
    }

    // Transición fluida a la siguiente pregunta tras 450ms
    setTimeout(() => {
      if (gestureNameEl) gestureNameEl.classList.remove('text-emerald-700');
      this.#advanceQuestion();
    }, 450);
  }

  /**
   * Salta la pregunta actual y avanza a la siguiente
   */
  skipCurrentQuestion() {
    if (!this.#isActive || this.#isQuestionFinished) return;

    this.#isQuestionFinished = true;
    this.#clearTimer();

    const currentQ = this.#questions[this.#currentQuestionIndex];
    const signId = currentQ ? currentQ.signId : 'UNKNOWN';
    const signName = currentQ ? currentQ.signName : this.#lookupSignName(signId);

    // Registrar fallo / salto
    this.#results.push({
      signId,
      signName,
      type: currentQ ? currentQ.type : 'gesture',
      passed: false,
      score: 0
    });

    // Apagar cámara y pausar video si estaban activos
    if (window.VisionEvaluator && typeof window.VisionEvaluator.stop === 'function') {
      window.VisionEvaluator.stop();
    }
    const quizVideo = document.getElementById('examQuizVideo');
    if (quizVideo && typeof quizVideo.pause === 'function') {
      try { quizVideo.pause(); } catch (e) {}
    }

    this.#advanceQuestion();
  }

  /**
   * Detiene el examen y restaura el estado normal
   */
  stopExam(triggerReturn = true) {
    this.#clearTimer();
    this.#isActive = false;
    this.#isQuestionFinished = true;
    this.#examMode = null;
    this.#pendingExamConfig = null;

    const modePane = document.getElementById('examPaneModeSelect');
    if (modePane) {
      modePane.classList.add('hidden');
      modePane.classList.remove('flex');
    }

    // APAGAR CÁMARA COMPLETAMENTE (Apaga LED físico de hardware)
    if (window.VisionEvaluator && typeof window.VisionEvaluator.stop === 'function') {
      window.VisionEvaluator.stop();
    }

    // Pausar video de quiz
    const quizVideo = document.getElementById('examQuizVideo');
    if (quizVideo && typeof quizVideo.pause === 'function') {
      try { quizVideo.pause(); } catch (e) {}
    }

    // Ocultar modal de la arena de examen
    const examModal = document.getElementById('examSessionModal');
    if (examModal) {
      examModal.classList.add('hidden');
      examModal.classList.remove('flex');
    }

    // Ocultar escudo del reproductor
    const overlay = document.getElementById('blindExamOverlay');
    if (overlay) {
      overlay.classList.add('hidden');
    }

    // Restaurar textos originales de ficha técnica
    const tipEl = document.getElementById('targetSignTip');
    const descEl = document.getElementById('targetSignDesc');
    if (tipEl && this.#originalTipHtml) {
      tipEl.innerHTML = this.#originalTipHtml;
      this.#originalTipHtml = '';
    }
    if (descEl && this.#originalDescText) {
      descEl.textContent = this.#originalDescText;
      this.#originalDescText = '';
    }

    // Reanudar reproductor si volvemos a la vista de estudio
    if (window.VideoPlayer && typeof window.VideoPlayer.play === 'function') {
      try { window.VideoPlayer.play(); } catch (e) {}
    }

    if (typeof window.removeEventListener === 'function') {
      window.removeEventListener('keydown', this.#boundHandleKeyDown);
    }

    // Si el usuario sale voluntariamente y la vista origen es la Ruta, retornar a la Ruta
    if (triggerReturn && this.#returnView === 'path' && window.ViewRouter && typeof window.ViewRouter.switchToPathView === 'function') {
      window.ViewRouter.switchToPathView();
    }
    if (triggerReturn && this.#previousFocus && typeof this.#previousFocus.focus === 'function') {
      try { this.#previousFocus.focus(); } catch (e) {}
      this.#previousFocus = null;
    }
  }

  /** Cierra el modal de resumen/certificado del examen y retorna a la Ruta de Aprendizaje. */
  closeSummaryModal() {
    const modal = document.getElementById('examSummaryModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden', 'true');
    }
    if (typeof window.removeEventListener === 'function') {
      window.removeEventListener('keydown', this.#boundHandleKeyDown);
    }

    // Retornar siempre a la Ruta de Aprendizaje (Skill Tree) para ver el progreso gamificado
    if (window.ViewRouter && typeof window.ViewRouter.switchToPathView === 'function') {
      window.ViewRouter.switchToPathView();
    }
    if (this.#previousFocus && typeof this.#previousFocus.focus === 'function') {
      try { this.#previousFocus.focus(); } catch (e) {}
      this.#previousFocus = null;
    }
  }

  // -------------------------------------------------------------
  // MÉTODOS PRIVADOS DE CARGA, QUIZ Y AVANCE
  // -------------------------------------------------------------

  #loadQuestion(index) {
    if (index >= this.#questions.length) {
      this.#finishExam();
      return;
    }

    this.#currentQuestionIndex = index;
    this.#isQuestionFinished = false;
    this.#practiceHoldMs = 0;
    const q = this.#questions[index];

    // Actualizar barra de progreso superior
    const progressBar = document.getElementById('examProgressBar');
    if (progressBar) {
      const pct = Math.round((index / this.#questions.length) * 100);
      progressBar.style.width = `${pct}%`;
    }

    // Actualizar badges de conteo y nivel
    const questionTypeLabel = q.type === 'gesture' ? 'Reto' : 'Pregunta';
    const stepBadgeText = `${questionTypeLabel} ${index + 1} de ${this.#questions.length} · Nivel ${this.#difficultyLevel || 1}`;
    const headerStep = document.getElementById('examHeaderStepText');
    if (headerStep) headerStep.textContent = stepBadgeText;

    const countEl = document.getElementById('examQuestionCounter');
    if (countEl) countEl.textContent = stepBadgeText;

    const promptEl = document.getElementById('examPromptSignName');
    if (promptEl) promptEl.textContent = q.signName;

    const gesturePane = document.getElementById('examPaneGesture');
    const quizPane = document.getElementById('examPaneQuiz');
    const videoToggle = document.getElementById('examVideoModeToggle');

    if (q.type === 'gesture') {
      // =========================================================
      // 1. FORMATO A: RETO MOTRIZ (Cámara en vivo, sin video)
      // =========================================================
      if (gesturePane) {
        gesturePane.classList.remove('hidden');
        gesturePane.classList.add('flex');
      }
      if (quizPane) {
        quizPane.classList.add('hidden');
        quizPane.classList.remove('flex');
      }
      if (videoToggle) {
        videoToggle.classList.add('hidden');
        videoToggle.classList.remove('flex');
      }

      // Detener cualquier video que estuviera reproduciéndose
      const quizVideo = document.getElementById('examQuizVideo');
      if (quizVideo && typeof quizVideo.pause === 'function') {
        try { quizVideo.pause(); } catch (e) {}
      }

      const gestureSignName = document.getElementById('examGestureSignName');
      if (gestureSignName) gestureSignName.textContent = q.signName;

      // Resetear barra y texto del radar
      const radarBar = document.getElementById('examGestureRadarBar');
      const radarText = document.getElementById('examGestureRadarText');
      if (radarBar) {
        radarBar.style.width = '0%';
        radarBar.classList.remove('bg-emerald-400');
        radarBar.classList.add('bg-amber-400');
      }
      if (radarText) radarText.textContent = '0%';

      // Mostrar spinner mientras enciende la cámara y limpiar fallback previo
      const camLoading = document.getElementById('examCameraLoading');
      const camFallback = document.getElementById('examCameraFallback');
      const liveBadge = document.getElementById('examLiveBadge');
      if (camFallback) camFallback.classList.add('hidden');
      if (camLoading) camLoading.classList.remove('hidden');
      if (liveBadge) liveBadge.textContent = 'CONECTANDO';

      // Seleccionar seña objetivo y activar cámara
      if (typeof window.selectSignById === 'function') {
        window.selectSignById(q.signId);
      }
      if (window.VisionEvaluator) {
        window.VisionEvaluator.setPaused(false);
        const signObj = this.#lookupSignObject(q.signId);
        if (signObj && typeof window.VisionEvaluator.setTargetSign === 'function') {
          window.VisionEvaluator.setTargetSign(signObj);
        }
        if (typeof window.VisionEvaluator.start === 'function') {
          const startRes = window.VisionEvaluator.start();
          Promise.resolve(startRes).then((ok) => {
            if (!this.#isActive || this.#isQuestionFinished || this.#questions[this.#currentQuestionIndex] !== q) return;
            if (ok === false) {
              this.#showExamCameraFallback();
            } else if (ok === true) {
              if (camLoading) camLoading.classList.add('hidden');
              if (liveBadge) liveBadge.textContent = 'EN VIVO';
            }
          }).catch(() => {
            if (this.#isActive && !this.#isQuestionFinished && this.#questions[this.#currentQuestionIndex] === q) {
              this.#showExamCameraFallback();
            }
          });
        }
      }

      // Pausar video de estudio por si selectSignById inició reproducción
      if (window.VideoPlayer && typeof window.VideoPlayer.pause === 'function') {
        window.VideoPlayer.pause();
      }
      const videoEl = document.getElementById('signVideo');
      if (videoEl && typeof videoEl.pause === 'function') {
        try { videoEl.pause(); } catch (e) {}
      }
    } else {
      // =========================================================
      // 2. FORMATO B: PREGUNTA TIPO QUIZ (Comprensión visual)
      // =========================================================
      if (quizPane) {
        quizPane.classList.remove('hidden');
        quizPane.classList.add('flex');
      }
      if (gesturePane) {
        gesturePane.classList.add('hidden');
        gesturePane.classList.remove('flex');
      }
      if (videoToggle) {
        videoToggle.classList.remove('hidden');
        videoToggle.classList.add('flex');
      }

      // APAGAR CÁMARA COMPLETAMENTE para ahorrar recursos y apagar LED físico
      if (window.VisionEvaluator && typeof window.VisionEvaluator.stop === 'function') {
        window.VisionEvaluator.stop();
      }

      // Cargar video de la seña en modo Real o Anime
      this.#loadQuizMedia(q.signId);

      // Generar 4 opciones interactivas con distractores
      this.#renderQuizOptions(q);
    }

    // Iniciar cronómetro por pregunta
    this.#remainingSeconds = this.#secondsPerQuestion;
    this.#updateTimerDisplay();

    this.#clearTimer();
    this.#timerInterval = setInterval(() => {
      this.#remainingSeconds -= 1;
      this.#updateTimerDisplay();

      if (this.#remainingSeconds <= 0) {
        this.skipCurrentQuestion();
      }
    }, 1000);
  }

  #loadQuizMedia(signId) {
    if (this.#uiHelper) {
      this.#uiHelper.loadQuizMedia(
        document.getElementById('examQuizVideo'),
        document.getElementById('examQuizWebp'),
        signId,
        this.#videoMode
      );
    }
  }

  #renderQuizOptions(currentQuestion) {
    if (this.#uiHelper) {
      this.#uiHelper.renderQuizOptions(
        document.getElementById('examQuizOptionsGrid'),
        currentQuestion,
        (opt, btn) => this.#submitQuizOption(opt, btn)
      );
    }
  }

  #submitQuizOption(opt, clickedBtn) {
    if (!this.#isActive || this.#isQuestionFinished) return;
    this.#isQuestionFinished = true;
    this.#clearTimer();

    const isCorrect = opt.isCorrect;
    const currentQ = this.#questions[this.#currentQuestionIndex];

    // Deshabilitar botones para prevenir clics dobles
    const allBtns = document.querySelectorAll('.exam-quiz-opt-btn');
    allBtns.forEach(b => {
      b.disabled = true;
      b.classList.remove('hover:bg-amber-50');
    });

    if (isCorrect) {
      clickedBtn.classList.remove('bg-white', 'border-slate-200', 'text-slate-900');
      clickedBtn.classList.add('bg-emerald-600', 'border-emerald-500', 'text-white', 'shadow-emerald-500/20');
      const ind = clickedBtn.querySelector('.exam-opt-indicator');
      if (ind) {
        ind.textContent = '✓';
        ind.classList.remove('opacity-0');
        ind.classList.add('text-emerald-100');
      }

      this.#results.push({
        signId: currentQ.signId,
        signName: currentQ.signName,
        type: 'quiz',
        passed: true,
        score: 100
      });

      if (window.AuthProfileManager) {
        window.AuthProfileManager.recordSignMastered(currentQ.signId, 30);
      }
      if (window.ChatTutor && typeof window.ChatTutor.playVictorySound === 'function') {
        window.ChatTutor.playVictorySound();
      }
    } else {
      clickedBtn.classList.remove('bg-white', 'border-slate-200', 'text-slate-900');
      clickedBtn.classList.add('bg-rose-600', 'border-rose-500', 'text-white', 'shadow-rose-500/20');
      const ind = clickedBtn.querySelector('.exam-opt-indicator');
      if (ind) {
        ind.textContent = '✗';
        ind.classList.remove('opacity-0');
        ind.classList.add('text-rose-100');
      }

      // Marcar la respuesta correcta en verde
      allBtns.forEach(b => {
        if (b.getAttribute('data-is-correct') === 'true') {
          b.classList.remove('bg-white', 'border-slate-200', 'text-slate-900');
          b.classList.add('bg-emerald-50', 'border-emerald-500', 'text-emerald-900');
          const correctInd = b.querySelector('.exam-opt-indicator');
          if (correctInd) {
            correctInd.textContent = '✓';
            correctInd.classList.remove('opacity-0');
          }
        }
      });

      this.#results.push({
        signId: currentQ.signId,
        signName: currentQ.signName,
        type: 'quiz',
        passed: false,
        score: 0
      });
    }

    // Avanzar tras pausa pedagógica
    setTimeout(() => {
      this.#advanceQuestion();
    }, isCorrect ? 600 : 900);
  }

  #showExamCameraFallback() {
    this.#clearTimer();
    if (this.#uiHelper) {
      this.#uiHelper.showCameraFallback();
    }
  }

  #advanceQuestion() {
    this.#loadQuestion(this.#currentQuestionIndex + 1);
  }

  #finishExam() {
    // 1. Detener examen y apagar cámara completamente (sin cambiar de vista aún, se mostrará el resumen)
    this.stopExam(false);

    const total = this.#results.length;
    const correct = this.#results.filter(r => r.passed).length;
    const scorePct = total > 0 ? Math.round((correct / total) * 100) : 0;

    // 2. Registrar en perfil de usuario si está disponible
    if (window.AuthProfileManager) {
      window.AuthProfileManager.recordExamResult({
        planTitle: this.#planTitle,
        scorePct,
        correct,
        total,
        dateIso: new Date().toISOString()
      });
    }

    // 3. Mostrar modal de resumen / certificado
    this.#showSummaryModal(scorePct, correct, total);
  }

  #showSummaryModal(scorePct, correct, total) {
    if (!this.#uiHelper) return;
    this.#uiHelper.showSummaryModal(
      { scorePct, correct, total, planTitle: this.#planTitle, results: this.#results, examMode: this.#examMode },
      () => {
        if (typeof window.addEventListener === 'function') {
          window.addEventListener('keydown', this.#boundHandleKeyDown);
        }
      }
    );
  }

  #updateTimerDisplay() {
    if (this.#uiHelper) {
      this.#uiHelper.updateTimerDisplay(this.#remainingSeconds);
    }
  }

  #clearTimer() {
    if (this.#timerInterval) {
      clearInterval(this.#timerInterval);
      this.#timerInterval = null;
    }
  }

  #lookupSignName(signId) {
    return this.#lookupSignObject(signId).name || signId;
  }

  #lookupSignObject(signId) {
    return this.#uiHelper ? this.#uiHelper.lookupSignObject(signId) : { id: signId, name: signId };
  }

  #syncVideoModeButtons() {
    const btnReal = document.getElementById('btnExamModeReal');
    const btnAnime = document.getElementById('btnExamModeAnime');
    if (!btnReal || !btnAnime) return;

    if (this.#videoMode === 'anime') {
      btnAnime.className = 'btn-spring px-2.5 py-1 rounded-lg transition bg-amber-500 text-slate-900 font-bold shadow-sm';
      btnReal.className = 'btn-spring px-2.5 py-1 rounded-lg transition text-slate-700 hover:text-slate-900';
    } else {
      btnReal.className = 'btn-spring px-2.5 py-1 rounded-lg transition bg-amber-500 text-slate-900 font-bold shadow-sm';
      btnAnime.className = 'btn-spring px-2.5 py-1 rounded-lg transition text-slate-700 hover:text-slate-900';
    }
  }

  #bindUIEvents() {
    // Botón iniciar examen en navbar o hub
    const btnStart = document.getElementById('btnStartBlindExam');
    if (btnStart) {
      btnStart.addEventListener('click', () => {
        let plan = null;
        if (window.LearningPlanManager) {
          plan = window.LearningPlanManager.getActivePlan();
        }
        this.start(plan);
      });
    }

    // Botones de selección de modalidad previa
    const btnChooseCamera = document.getElementById('btnChooseCameraExam');
    if (btnChooseCamera) {
      btnChooseCamera.addEventListener('click', () => this.startWithMode('camera'));
    }

    const btnChooseQuiz = document.getElementById('btnChooseQuizExam');
    if (btnChooseQuiz) {
      btnChooseQuiz.addEventListener('click', () => this.startWithMode('quiz'));
    }

    const btnExitModeSelect = document.getElementById('btnExamExitModeSelect');
    if (btnExitModeSelect) {
      btnExitModeSelect.addEventListener('click', () => this.stopExam());
    }

    // Botones de salida del examen (Header y paneles inferiores)
    const btnExamClose = document.getElementById('btnExamClose');
    if (btnExamClose) {
      btnExamClose.addEventListener('click', () => this.stopExam());
    }

    const btnExamExitGesture = document.getElementById('btnExamExitGesture');
    if (btnExamExitGesture) {
      btnExamExitGesture.addEventListener('click', () => this.stopExam());
    }

    const btnExamExitQuiz = document.getElementById('btnExamExitQuiz');
    if (btnExamExitQuiz) {
      btnExamExitQuiz.addEventListener('click', () => this.stopExam());
    }

    const btnExit = document.getElementById('btnExitExam');
    if (btnExit) {
      btnExit.addEventListener('click', () => this.stopExam());
    }

    // Botones de saltar reto / pregunta
    const btnSkipGesture = document.getElementById('btnExamSkipGesture');
    if (btnSkipGesture) {
      btnSkipGesture.addEventListener('click', () => this.skipCurrentQuestion());
    }

    const btnSkipQuiz = document.getElementById('btnExamSkipQuiz');
    if (btnSkipQuiz) {
      btnSkipQuiz.addEventListener('click', () => this.skipCurrentQuestion());
    }

    const btnSkip = document.getElementById('btnSkipExamSign');
    if (btnSkip) {
      btnSkip.addEventListener('click', () => this.skipCurrentQuestion());
    }

    const btnRetryCam = document.getElementById('btnExamRetryCamera');
    if (btnRetryCam) {
      btnRetryCam.addEventListener('click', () => {
        if (this.#isActive && !this.#isQuestionFinished) {
          this.#loadQuestion(this.#currentQuestionIndex);
        }
      });
    }

    const btnFallbackSkip = document.getElementById('btnExamFallbackSkip');
    if (btnFallbackSkip) {
      btnFallbackSkip.addEventListener('click', () => this.skipCurrentQuestion());
    }

    // Selector de modo video Real / Anime en header de examen
    const btnReal = document.getElementById('btnExamModeReal');
    if (btnReal) {
      btnReal.addEventListener('click', () => this.setVideoMode('real'));
    }

    const btnAnime = document.getElementById('btnExamModeAnime');
    if (btnAnime) {
      btnAnime.addEventListener('click', () => this.setVideoMode('anime'));
    }

    // Botones del modal de resumen
    const btnCloseSummary = document.getElementById('btnCloseExamSummary');
    if (btnCloseSummary) {
      btnCloseSummary.addEventListener('click', () => this.closeSummaryModal());
    }

    const btnRetryFailed = document.getElementById('btnRetryFailedSigns');
    if (btnRetryFailed) {
      btnRetryFailed.addEventListener('click', () => {
        const failedSigns = this.#results.filter(r => !r.passed).map(r => r.signId);
        this.closeSummaryModal();
        if (failedSigns.length > 0) {
          this.start({ title: 'Repaso de Falladas', signs: failedSigns });
        } else {
          this.start();
        }
      });
    }
  }

  #handleKeyDown(e) {
    if (e.key === 'Escape') {
      const summaryModal = document.getElementById('examSummaryModal');
      if (summaryModal && !summaryModal.classList.contains('hidden')) {
        this.closeSummaryModal();
        return;
      }
      if (this.#isActive || this.#pendingExamConfig) {
        this.stopExam();
      }
    }
  }
}

// Instancia global y exposición en window (Reglas 5 y 8)
window.BlindExamController = new BlindExamController();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.BlindExamController;
}
