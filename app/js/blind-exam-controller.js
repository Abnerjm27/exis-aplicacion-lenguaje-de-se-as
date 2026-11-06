/**
 * LSC Learn · Proyecto EXIS
 * blind-exam-controller.js - Controlador del Modo Examen Sin Video (Evaluación Ciega) (POO)
 * Oculta el reproductor de video con un escudo opaco, evalúa la retención de memoria en tiempo real,
 * gestiona cronómetros tabulares por pregunta y emite el resumen de calificación.
 */

class BlindExamController {
  #isActive;
  #currentQuestionIndex;
  #questions;
  #planTitle;
  #secondsPerQuestion;
  #remainingSeconds;
  #timerInterval;
  #results;
  #originalTipHtml;
  #originalDescText;
  #boundHandleKeyDown;

  constructor() {
    this.#isActive = false;
    this.#currentQuestionIndex = 0;
    this.#questions = [];
    this.#planTitle = 'Examen LSC';
    this.#secondsPerQuestion = 25;
    this.#remainingSeconds = 25;
    this.#timerInterval = null;
    this.#results = [];
    this.#originalTipHtml = '';
    this.#originalDescText = '';
    this.#boundHandleKeyDown = this.#handleKeyDown.bind(this);
  }

  init() {
    this.#bindUIEvents();
  }

  start(planOrSigns = null, secondsPerQuestion = 25) {
    // 1. Obtener lista de señas para el examen (máximo 5)
    let signsList = [];
    let title = 'Modo Examen LSC';

    if (planOrSigns && Array.isArray(planOrSigns.signs) && planOrSigns.signs.length > 0) {
      signsList = [...planOrSigns.signs];
      title = planOrSigns.title || title;
    } else if (window.LearningPlanManager) {
      const active = window.LearningPlanManager.getActivePlan();
      if (active && Array.isArray(active.signs) && active.signs.length > 0) {
        signsList = [...active.signs];
        title = `Examen: ${active.title}`;
      }
    }

    if (signsList.length === 0) {
      signsList = ['HOLA', 'YO', 'BUENOS', 'DIAS', 'A'];
    }

    // Limitar a 5 señas para una sesión ágil de examen
    this.#questions = signsList.slice(0, 5);
    this.#planTitle = title;
    this.#secondsPerQuestion = Math.max(10, secondsPerQuestion);
    this.#currentQuestionIndex = 0;
    this.#results = [];
    this.#isActive = true;

    // 2. Cerrar inmediatamente el modal normal de victoria si estaba abierto
    const successPopup = document.getElementById('successPopup');
    if (successPopup) {
      successPopup.classList.add('hidden');
      successPopup.classList.remove('modal-enter');
    }

    // 3. Pausar video y ocultar demostración
    const videoEl = document.getElementById('signVideo');
    if (videoEl && typeof videoEl.pause === 'function') {
      try { videoEl.pause(); } catch (e) {}
    }

    // 4. Salvar y ocultar pistas de ayuda para evitar trampas visuales
    const tipEl = document.getElementById('targetSignTip');
    const descEl = document.getElementById('targetSignDesc');
    if (tipEl && !this.#originalTipHtml) {
      this.#originalTipHtml = tipEl.innerHTML;
    }
    if (descEl && !this.#originalDescText) {
      this.#originalDescText = descEl.textContent;
    }

    if (tipEl) {
      tipEl.innerHTML = `<span class="text-amber-400 font-semibold font-mono text-[11px]">🛡️ MODO EXAMEN ACTIVO:</span> Demuestra la seña de memoria frente a la cámara sin guía de video ni pistas visuales.`;
    }
    if (descEl) {
      descEl.textContent = 'Evaluación Ciega sin Demostración';
    }

    // 5. Mostrar el escudo de examen sobre el reproductor
    const overlay = document.getElementById('blindExamOverlay');
    if (overlay) {
      overlay.classList.remove('hidden');
    }

    // 6. Configurar la primera pregunta
    this.#loadQuestion(0);
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
    window.removeEventListener('keydown', this.#boundHandleKeyDown);
  }

  isExamActive() {
    return this.#isActive;
  }

  handleSignMasteredInExam(signObj, accuracyScore) {
    if (!this.#isActive) return;

    this.#clearTimer();

    const signId = this.#questions[this.#currentQuestionIndex];
    const signName = signObj ? (signObj.name || signObj.id || signId) : signId;

    // Registrar acierto
    this.#results.push({
      signId,
      signName,
      passed: true,
      score: accuracyScore || 100
    });

    // Otorgar XP de examen (+35 XP por seña aprobada a ciegas)
    if (window.AuthProfileManager) {
      window.AuthProfileManager.recordSignMastered(signId, 35);
    }

    // Feedback visual en el escudo
    const promptEl = document.getElementById('examPromptSignName');
    if (promptEl) {
      promptEl.classList.add('text-emerald-400');
    }

    // Transición fluida a la siguiente pregunta tras 450ms
    setTimeout(() => {
      if (promptEl) {
        promptEl.classList.remove('text-emerald-400');
      }
      this.#advanceQuestion();
    }, 450);
  }

  skipCurrentQuestion() {
    if (!this.#isActive) return;

    this.#clearTimer();

    const signId = this.#questions[this.#currentQuestionIndex];
    const signName = this.#lookupSignName(signId);

    // Registrar fallo / salto
    this.#results.push({
      signId,
      signName,
      passed: false,
      score: 0
    });

    this.#advanceQuestion();
  }

  stopExam() {
    this.#clearTimer();
    this.#isActive = false;

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

    // Reanudar reproductor si es posible
    if (window.VideoPlayer && typeof window.VideoPlayer.play === 'function') {
      try { window.VideoPlayer.play(); } catch (e) {}
    }
  }

  closeSummaryModal() {
    const modal = document.getElementById('examSummaryModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden', 'true');
    }
    window.removeEventListener('keydown', this.#boundHandleKeyDown);
  }

  #loadQuestion(index) {
    if (index >= this.#questions.length) {
      this.#finishExam();
      return;
    }

    this.#currentQuestionIndex = index;
    const signId = this.#questions[index];
    const signName = this.#lookupSignName(signId);

    // Actualizar textos del HUD del escudo
    const countEl = document.getElementById('examQuestionCounter');
    if (countEl) {
      countEl.textContent = `Reto ${index + 1} de ${this.#questions.length}`;
    }

    const nameEl = document.getElementById('examPromptSignName');
    if (nameEl) {
      nameEl.textContent = signName;
    }

    // Establecer seña objetivo en el evaluador de visión (sin mostrar video)
    if (typeof window.selectSignById === 'function') {
      window.selectSignById(signId);
    }

    // Despausar evaluador para la nueva pregunta
    if (window.VisionEvaluator) {
      window.VisionEvaluator.setPaused(false);
    }

    // Pausar video nuevamente en caso de que selectSignById haya iniciado reproducción
    const videoEl = document.getElementById('signVideo');
    if (videoEl && typeof videoEl.pause === 'function') {
      try { videoEl.pause(); } catch (e) {}
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

  #advanceQuestion() {
    this.#loadQuestion(this.#currentQuestionIndex + 1);
  }

  #finishExam() {
    this.stopExam();

    const total = this.#results.length;
    const correct = this.#results.filter(r => r.passed).length;
    const scorePct = total > 0 ? Math.round((correct / total) * 100) : 0;

    // Registrar en perfil de usuario
    if (window.AuthProfileManager) {
      window.AuthProfileManager.recordExamResult({
        planTitle: this.#planTitle,
        scorePct,
        correct,
        total,
        dateIso: new Date().toISOString()
      });
    }

    // Mostrar modal de resumen / certificado
    this.#showSummaryModal(scorePct, correct, total);
  }

  #showSummaryModal(scorePct, correct, total) {
    const modal = document.getElementById('examSummaryModal');
    if (!modal) return;

    const scoreEl = document.getElementById('examFinalScorePct');
    if (scoreEl) scoreEl.textContent = `${scorePct}%`;

    const fracEl = document.getElementById('examFinalFraction');
    if (fracEl) fracEl.textContent = `${correct} / ${total} señas aprobadas`;

    const titleEl = document.getElementById('examSummaryPlanTitle');
    if (titleEl) titleEl.textContent = this.#planTitle;

    const listEl = document.getElementById('examBreakdownList');
    if (listEl) {
      listEl.innerHTML = '';
      this.#results.forEach(res => {
        const item = document.createElement('div');
        item.className = `flex items-center justify-between p-2.5 rounded-xl border text-xs ${
          res.passed
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
            : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
        }`;
        item.innerHTML = `
          <div class="flex items-center gap-2">
            <span class="w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs ${
              res.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
            }">${res.passed ? '✓' : '✗'}</span>
            <span class="font-bold uppercase tracking-wider text-slate-100">${res.signName}</span>
          </div>
          <span class="font-mono tabular-nums text-[11px] font-semibold ${res.passed ? 'text-emerald-400' : 'text-amber-400'}">
            ${res.passed ? `${res.score}% precisión` : 'Por repasar'}
          </span>
        `;
        listEl.appendChild(item);
      });
    }

    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');

    window.addEventListener('keydown', this.#boundHandleKeyDown);
  }

  #updateTimerDisplay() {
    const timerEl = document.getElementById('examTimerText');
    if (timerEl) {
      timerEl.textContent = `${this.#remainingSeconds}s`;
      if (this.#remainingSeconds <= 5) {
        timerEl.classList.add('text-red-400');
      } else {
        timerEl.classList.remove('text-red-400');
      }
    }
  }

  #clearTimer() {
    if (this.#timerInterval) {
      clearInterval(this.#timerInterval);
      this.#timerInterval = null;
    }
  }

  #lookupSignName(signId) {
    if (!window.SIGNS_DATA) return signId;
    const all = [...(window.SIGNS_DATA.words || []), ...(window.SIGNS_DATA.letters || [])];
    const found = all.find(s => s.id === signId);
    return found ? found.name : signId;
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

    // Botones dentro del escudo
    const btnSkip = document.getElementById('btnSkipExamSign');
    if (btnSkip) {
      btnSkip.addEventListener('click', () => this.skipCurrentQuestion());
    }

    const btnExit = document.getElementById('btnExitExam');
    if (btnExit) {
      btnExit.addEventListener('click', () => this.stopExam());
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
      const modal = document.getElementById('examSummaryModal');
      if (modal && !modal.classList.contains('hidden')) {
        this.closeSummaryModal();
      }
    }
  }
}

// Instancia global y exposición en window (Reglas 5 y 8)
window.BlindExamController = new BlindExamController();
