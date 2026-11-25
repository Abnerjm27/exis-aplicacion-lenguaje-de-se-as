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
    const examParam = urlParams.get('exam');

    if (screenParam === 'path') {
      this.switchToPathView();
    } else if (screenParam === 'alphabet') {
      this.switchToAlphabetLabView();
    } else if (screenParam === 'profile') {
      this.switchToProfileView();
    } else {
      this.switchToStudioView(signParam || null, false);
    }

    if (examParam === '1' && window.BlindExamController) {
      setTimeout(() => {
        const plan = window.LearningPlanManager ? window.LearningPlanManager.getActivePlan() : null;
        window.BlindExamController.start(plan);
      }, 60);
    }

    window.addEventListener('popstate', this.#boundHandlePopState);
  }

  start() {
    this.#updateUI();
  }

  update(viewName = 'path') {
    if (viewName === 'path') {
      this.switchToPathView();
    } else if (viewName === 'profile') {
      this.switchToProfileView();
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
    this.#applyViewState('path', 'Mi Ruta de Aprendizaje');

    // Apagar cámara completamente mientras explora su ruta para no gastar hardware ni batería
    if (window.VisionEvaluator) {
      window.VisionEvaluator.stop();
    }

    // Actualizar ruta de aprendizaje
    if (window.LearningPlanManager) {
      window.LearningPlanManager.update();
    }

    this.#syncUrlQuery('path');
  }

  switchToProfileView() {
    window.location.href = 'perfil.html';
  }

  switchToAlphabetLabView() {
    this.#currentView = 'alphabet';
    this.#applyViewState('alphabet', 'Laboratorio del Abecedario LSC');
    if (window.VisionEvaluator) {
      window.VisionEvaluator.stop();
    }
    if (window.AlphabetLabController) {
      window.AlphabetLabController.update();
    }
    this.#syncUrlQuery('alphabet');
  }

  switchToStudioView(signId = null, startExam = false, examConfig = null) {
    this.#currentView = 'studio';
    this.#applyViewState('studio', 'Práctica Libre LSC');

    // Actualizar migas de pan y progreso de lección
    this.#updateStudioBreadcrumb();

    if (signId && typeof window.selectSignById === 'function') {
      window.selectSignById(signId);
    }

    if (startExam) {
      if (window.BlindExamController) {
        let plan = examConfig || null;
        if (!plan && window.LearningPlanManager) {
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

  #applyViewState(activeKey, topbarTitle) {
    const viewMap = {
      path: { el: document.getElementById('viewLearningPath'), btn: document.getElementById('btnNavViewPath') },
      alphabet: { el: document.getElementById('viewAlphabetLab'), btn: document.getElementById('btnNavAlphabetLab') },
      studio: { el: document.getElementById('viewPracticeStudio'), btn: document.getElementById('btnNavViewStudio') },
      profile: { el: document.getElementById('viewProfileHub'), btn: document.getElementById('btnNavViewProfile') }
    };

    const activeCls = 'sidebar-nav-btn btn-spring bg-coral-500 text-slate-900 font-bold shadow-sm';
    const inactiveCls = 'sidebar-nav-btn btn-spring';

    Object.entries(viewMap).forEach(([key, pair]) => {
      const isActive = key === activeKey;
      if (pair.el) pair.el.classList.toggle('hidden', !isActive);
      if (pair.btn) {
        pair.btn.className = isActive ? activeCls : inactiveCls;
        if (isActive) {
          pair.btn.setAttribute('aria-current', 'page');
        } else {
          pair.btn.removeAttribute('aria-current');
        }
      }
    });

    const titleEl = document.getElementById('topbarSectionTitle');
    if (titleEl) titleEl.textContent = topbarTitle;

    this.#closeMobileSidebar();
  }

  #openMobileSidebar() {
    const sidebar = document.getElementById('appSidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    const btnToggle = document.getElementById('btnMobileMenuToggle');
    if (sidebar) sidebar.classList.add('is-open');
    if (backdrop) backdrop.classList.remove('hidden');
    if (btnToggle) btnToggle.setAttribute('aria-expanded', 'true');
  }

  #closeMobileSidebar() {
    const sidebar = document.getElementById('appSidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    const btnToggle = document.getElementById('btnMobileMenuToggle');
    if (sidebar) sidebar.classList.remove('is-open');
    if (backdrop) backdrop.classList.add('hidden');
    if (btnToggle) btnToggle.setAttribute('aria-expanded', 'false');
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

    const btnNavAlphabet = document.getElementById('btnNavAlphabetLab');
    if (btnNavAlphabet) {
      btnNavAlphabet.addEventListener('click', () => this.switchToAlphabetLabView());
    }

    const btnMobileMenu = document.getElementById('btnMobileMenuToggle');
    if (btnMobileMenu) {
      btnMobileMenu.addEventListener('click', () => this.#openMobileSidebar());
    }

    const sidebarBackdrop = document.getElementById('sidebarBackdrop');
    if (sidebarBackdrop) {
      sidebarBackdrop.addEventListener('click', () => this.#closeMobileSidebar());
    }

    const btnExam = document.getElementById('btnStartBlindExam');
    if (btnExam) {
      btnExam.addEventListener('click', () => this.#closeMobileSidebar());
    }

    const btnChat = document.getElementById('btnToggleChat');
    if (btnChat) {
      btnChat.addEventListener('click', () => this.#closeMobileSidebar());
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
      } else if (e.state.screen === 'alphabet') {
        this.switchToAlphabetLabView();
      } else if (e.state.screen === 'profile') {
        this.switchToProfileView();
      } else {
        this.switchToStudioView(e.state.sign || null, false);
      }
    }
  }

  #updateUI() {
    if (this.#currentView === 'path') {
      this.switchToPathView();
    } else if (this.#currentView === 'alphabet') {
      this.switchToAlphabetLabView();
    } else if (this.#currentView === 'profile') {
      this.switchToProfileView();
    } else {
      this.switchToStudioView();
    }
  }
}

// Instancia global y exposición en window (Reglas 5 y 8)
window.ViewRouter = new ViewRouter();
