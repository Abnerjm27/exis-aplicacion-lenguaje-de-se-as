/**
 * LSC Learn · Proyecto EXIS
 * onboarding.js - Controlador POO del cuestionario de nivel (3 pasos) tras el registro
 */
class OnboardingQuizController {
  #step;
  #level;
  #goal;
  #mins;

  constructor() {
    this.#step = 1;
    this.#level = 'Principiante';
    this.#goal = 'No sé nada, enséñame lo básico desde cero';
    this.#mins = 10;
  }

  init() {
    const active = window.AuthService.getActiveUsername();
    if (!active || active === 'invitado' || !window.AuthService.getProfile(active)) {
      window.location.replace('register.html');
      return;
    }
    this.#bindSelectable('.quiz-option-card', btn => {
      this.#level = btn.getAttribute('data-quiz-level') || 'Principiante';
      this.#goal = btn.getAttribute('data-quiz-goal') || this.#goal;
    });
    this.#bindSelectable('.quiz-focus-card', btn => {
      this.#goal = btn.getAttribute('data-quiz-focus') || this.#goal;
    });
    this.#bindSelectable('.quiz-time-card', btn => {
      this.#mins = parseInt(btn.getAttribute('data-quiz-mins') || '10', 10);
    });

    document.getElementById('btnQuizNext').addEventListener('click', () => {
      if (this.#step < 3) { this.#step += 1; this.#render(); } else { this.#finish(false); }
    });
    document.getElementById('btnQuizPrev').addEventListener('click', () => {
      if (this.#step > 1) { this.#step -= 1; this.#render(); }
    });
    document.getElementById('btnSkipQuiz').addEventListener('click', () => this.#finish(true));
    this.#render();
  }

  start() {}
  update() { this.#render(); }
  reset() { this.#step = 1; this.#render(); }
  destroy() {}

  #bindSelectable(selector, onPick) {
    const cards = document.querySelectorAll(selector);
    cards.forEach(btn => btn.addEventListener('click', () => {
      cards.forEach(b => b.classList.remove('is-selected'));
      btn.classList.add('is-selected');
      onPick(btn);
    }));
  }

  #render() {
    [1, 2, 3].forEach(n => {
      const pane = document.getElementById(`quizStep${n}`);
      if (pane) pane.className = `quiz-step-pane ${n === this.#step ? 'flex' : 'hidden'} flex-col gap-4`;
    });
    document.getElementById('quizStepBadge').textContent = `PREGUNTA ${this.#step} DE 3`;
    document.getElementById('quizProgressBar').style.width = `${Math.round((this.#step / 3) * 100)}%`;
    document.getElementById('btnQuizPrev').classList.toggle('hidden', this.#step === 1);
    document.getElementById('btnQuizNextText').textContent =
      this.#step === 3 ? 'Crear mi ruta personalizada' : 'Siguiente paso';
  }

  async #finish(skip) {
    const custom = document.getElementById('quizCustomGoalInput');
    const active = window.AuthService.getActiveUsername();
    const goal = custom && custom.value.trim() ? custom.value.trim() : (skip ? '' : this.#goal);
    await window.AuthService.updateProfile(active, {
      level: skip ? 'Principiante' : this.#level,
      dailyGoalMins: this.#mins
    });
    if (goal) sessionStorage.setItem('exis_pending_ai_goal', goal);
    window.AuthService.goToPath();
  }
}

window.OnboardingQuizController = new OnboardingQuizController();
document.addEventListener('DOMContentLoaded', () => {
  window.OnboardingQuizController.init();
  window.OnboardingQuizController.start();
});
