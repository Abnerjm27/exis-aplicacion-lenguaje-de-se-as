/**
 * LSC Learn · Proyecto EXIS
 * view-router.js - Enrutador de Vistas de Pantalla Completa (POO)
 * Alterna entre el Mapa Duolingo (#viewLearningPath) y el Estudio de Práctica (#viewPracticeStudio)
 */

class ViewRouter {
  #currentView;
  #boundHandlePopState;

  constructor() {
    this.#currentView = 'studio';
    this.#boundHandlePopState = this.#handlePopState.bind(this);
  }

  init() {
    this.#bindNavigationEvents();

    const urlParams = new URLSearchParams(window.location.search);
    const screenParam = urlParams.get('screen') || urlParams.get('view');
    const signParam = urlParams.get('sign');

    if (screenParam === 'path') {
      this.switchToPathView();
    } else {
      this.switchToStudioView(signParam || null, false);
    }

    window.addEventListener('popstate', this.#boundHandlePopState);
  }

  start() {
    this.#updateUI();
  }

  update(viewName = 'path') {
    if (viewName === 'path') {
      this.switchToPathView();
    } else {
      this.switchToStudioView();
    }
  }

  reset() {
    this.switchToPathView();
  }

  destroy() {
    window.removeEventListener('popstate', this.#boundHandlePopState);
  }

  getCurrentView() {
    return this.#currentView;
  }

  switchToPathView() {
    this.#currentView = 'path';

    const pathView = document.getElementById('viewLearningPath');
    const studioView = document.getElementById('viewPracticeStudio');
    const navBtnPath = document.getElementById('btnNavViewPath');
    const navBtnStudio = document.getElementById('btnNavViewStudio');

    if (pathView) pathView.classList.remove('hidden');
    if (studioView) studioView.classList.add('hidden');

    if (navBtnPath) {
      navBtnPath.className = 'btn-spring px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 shadow-sm transition';
      navBtnPath.setAttribute('aria-current', 'page');
    }
    if (navBtnStudio) {
      navBtnStudio.className = 'btn-spring px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 transition';
      navBtnStudio.removeAttribute('aria-current');
    }

    // Pausar visión artificial mientras explora su ruta
    if (window.VisionEvaluator) {
      window.VisionEvaluator.setPaused(true);
    }

    // Actualizar mapa Duolingo
    if (window.LearningPlanManager) {
      window.LearningPlanManager.update();
    }

    this.#syncUrlQuery('path');
  }

  switchToStudioView(signId = null, startExam = false) {
    this.#currentView = 'studio';

    const pathView = document.getElementById('viewLearningPath');
    const studioView = document.getElementById('viewPracticeStudio');
    const navBtnPath = document.getElementById('btnNavViewPath');
    const navBtnStudio = document.getElementById('btnNavViewStudio');

    if (pathView) pathView.classList.add('hidden');
    if (studioView) studioView.classList.remove('hidden');

    if (navBtnStudio) {
      navBtnStudio.className = 'btn-spring px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 shadow-sm transition';
      navBtnStudio.setAttribute('aria-current', 'page');
    }
    if (navBtnPath) {
      navBtnPath.className = 'btn-spring px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 transition';
      navBtnPath.removeAttribute('aria-current');
    }

    // Actualizar migas de pan y progreso de lección
    this.#updateStudioBreadcrumb();

    if (signId && typeof window.selectSignById === 'function') {
      window.selectSignById(signId);
    }

    if (startExam) {
      if (window.BlindExamController) {
        let plan = null;
        if (window.LearningPlanManager) {
          plan = window.LearningPlanManager.getActivePlan();
        }
        window.BlindExamController.start(plan);
      }
    } else {
      if (window.VisionEvaluator) {
        window.VisionEvaluator.setPaused(false);
      }
    }

    this.#syncUrlQuery('studio', signId);
  }

  #bindNavigationEvents() {
    const btnNavPath = document.getElementById('btnNavViewPath');
    if (btnNavPath) {
      btnNavPath.addEventListener('click', () => this.switchToPathView());
    }

    const btnNavStudio = document.getElementById('btnNavViewStudio');
    if (btnNavStudio) {
      btnNavStudio.addEventListener('click', () => this.switchToStudioView());
    }

    const btnBack = document.getElementById('btnBackToPath');
    if (btnBack) {
      btnBack.addEventListener('click', () => this.switchToPathView());
    }

    const btnGoStudio = document.getElementById('btnGoToStudioFromPath');
    if (btnGoStudio) {
      btnGoStudio.addEventListener('click', () => this.switchToStudioView());
    }
  }

  #updateStudioBreadcrumb() {
    const planTitleEl = document.getElementById('studioBreadcrumbPlanTitle');
    const stepProgressEl = document.getElementById('studioStepProgressText');

    if (window.LearningPlanManager) {
      const active = window.LearningPlanManager.getActivePlan();
      if (planTitleEl) {
        planTitleEl.textContent = active.title || 'Ruta LSC';
      }
      if (stepProgressEl && active.signs) {
        const total = active.signs.length;
        const cur = (active.currentIndex || 0) + 1;
        stepProgressEl.textContent = `Paso ${Math.min(cur, total)} de ${total}`;
      }
    }
  }

  #syncUrlQuery(screen, sign = null) {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('screen', screen);
      if (sign) {
        url.searchParams.set('sign', sign);
      } else {
        url.searchParams.delete('sign');
      }
      window.history.replaceState({ screen, sign }, '', url.toString());
    } catch (e) {}
  }

  #handlePopState(e) {
    if (e.state && e.state.screen) {
      if (e.state.screen === 'path') {
        this.switchToPathView();
      } else {
        this.switchToStudioView(e.state.sign || null, false);
      }
    }
  }

  #updateUI() {
    if (this.#currentView === 'path') {
      this.switchToPathView();
    } else {
      this.switchToStudioView();
    }
  }
}

// Instancia global y exposición en window (Reglas 5 y 8)
window.ViewRouter = new ViewRouter();
