/**
 * LSC Learn · Proyecto EXIS
 * landing.js - Controlador POO de Scrollytelling Cinemático, Login/Registro Estándar y Cuestionario LSC
 * Gestiona animaciones de scroll, 3D tilt, autenticación con correo/contraseña y wizard diagnóstico
 */

// Registro global de errores de consola para auditoría visual automatizada (Regla 7 AGENTS.md)
window.__consoleErrors = window.__consoleErrors || [];
window.addEventListener('error', e => window.__consoleErrors.push(e.message || String(e)));
window.addEventListener('unhandledrejection', e => window.__consoleErrors.push(e.reason ? (e.reason.message || String(e.reason)) : 'Unhandled Rejection'));

class LandingPortalController {
  #isSubmitting;
  #authMode;
  #quizStep;
  #pendingProfile;
  #selectedLevel;
  #selectedFocusGoal;
  #selectedDailyMins;
  #boundHandleSubmit;
  #boundHandleScroll;

  constructor() {
    this.#isSubmitting = false;
    this.#authMode = 'register';
    this.#quizStep = 1;
    this.#pendingProfile = null;
    this.#selectedLevel = 'Principiante';
    this.#selectedFocusGoal = 'No sé nada, enséñame lo básico desde cero';
    this.#selectedDailyMins = 10;
    this.#boundHandleSubmit = this.#handleSubmit.bind(this);
    this.#boundHandleScroll = this.#handleWindowScroll.bind(this);
  }

  init() {
    this.#bindUIEvents();
    this.#initScrollytelling();
    this.#initInteractiveTiltAndSpotlight();
    this.#renderSavedProfiles();
    this.#checkExistingSession();
  }

  start() {
    this.#handleWindowScroll();
  }

  update() {
    this.#renderSavedProfiles();
  }

  reset() {
    const form = document.getElementById('landingAuthForm');
    if (form) form.reset();
    const errorEl = document.getElementById('landingAuthError');
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.add('hidden');
    }
  }

  destroy() {
    const form = document.getElementById('landingAuthForm');
    if (form) form.removeEventListener('submit', this.#boundHandleSubmit);
    window.removeEventListener('scroll', this.#boundHandleScroll);
  }

  setAuthMode(mode) {
    this.#authMode = mode === 'login' ? 'login' : 'register';
    const tabLogin = document.getElementById('tabAuthLogin');
    const tabRegister = document.getElementById('tabAuthRegister');
    const displayWrapper = document.getElementById('fieldDisplayNameWrapper');
    const submitText = document.getElementById('btnLandingSubmitText');

    if (this.#authMode === 'login') {
      if (tabLogin) {
        tabLogin.className = 'auth-tab-btn auth-tab-active py-2.5 rounded-lg text-xs font-bold transition-all';
        tabLogin.setAttribute('aria-selected', 'true');
      }
      if (tabRegister) {
        tabRegister.className = 'auth-tab-btn py-2.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-all';
        tabRegister.setAttribute('aria-selected', 'false');
      }
      if (displayWrapper) displayWrapper.classList.add('hidden');
      if (submitText) submitText.textContent = 'Iniciar Sesión y Entrar a Mi Ruta';
    } else {
      if (tabRegister) {
        tabRegister.className = 'auth-tab-btn auth-tab-active py-2.5 rounded-lg text-xs font-bold transition-all';
        tabRegister.setAttribute('aria-selected', 'true');
      }
      if (tabLogin) {
        tabLogin.className = 'auth-tab-btn py-2.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-all';
        tabLogin.setAttribute('aria-selected', 'false');
      }
      if (displayWrapper) displayWrapper.classList.remove('hidden');
      if (submitText) submitText.textContent = 'Continuar al Test de Nivel LSC';
    }
  }

  async enterAsGuest() {
    try {
      localStorage.setItem('exis_active_profile_v1', 'invitado');
    } catch (e) {}
    window.location.href = 'index.html?screen=path';
  }

  openPlacementQuiz(profileDraft) {
    this.#pendingProfile = profileDraft;
    this.#quizStep = 1;
    this.#renderQuizStep();
    const modal = document.getElementById('onboardingQuizModal');
    if (modal) {
      modal.classList.remove('hidden');
    }
  }

  async completePlacementQuiz(skip = false) {
    const customInput = document.getElementById('quizCustomGoalInput');
    const hiddenGoal = document.getElementById('landingGoalInput');
    const hiddenLevel = document.getElementById('landingLevelSelect');

    const finalLevel = skip
      ? (hiddenLevel && hiddenLevel.value ? hiddenLevel.value : 'Principiante')
      : this.#selectedLevel;

    let finalGoal = '';
    if (customInput && customInput.value.trim()) {
      finalGoal = customInput.value.trim();
    } else if (hiddenGoal && hiddenGoal.value.trim()) {
      finalGoal = hiddenGoal.value.trim();
    } else if (!skip) {
      finalGoal = this.#selectedFocusGoal;
    }

    if (this.#pendingProfile) {
      this.#pendingProfile.level = finalLevel;
      this.#pendingProfile.dailyGoalMins = this.#selectedDailyMins;
      await this.#persistAndRedirect(this.#pendingProfile, finalGoal);
    } else {
      window.location.href = 'index.html?screen=path';
    }
  }

  #bindUIEvents() {
    const form = document.getElementById('landingAuthForm');
    if (form) {
      form.addEventListener('submit', this.#boundHandleSubmit);
    }

    const tabLogin = document.getElementById('tabAuthLogin');
    const tabRegister = document.getElementById('tabAuthRegister');
    if (tabLogin) tabLogin.addEventListener('click', () => this.setAuthMode('login'));
    if (tabRegister) tabRegister.addEventListener('click', () => this.setAuthMode('register'));

    const btnHeaderLogin = document.getElementById('btnHeaderLogin');
    if (btnHeaderLogin) {
      btnHeaderLogin.addEventListener('click', () => {
        this.setAuthMode('login');
        this.#scrollToAuthForm();
      });
    }

    const btnNavEnter = document.getElementById('btnNavEnter');
    if (btnNavEnter) {
      btnNavEnter.addEventListener('click', () => {
        this.setAuthMode('register');
        this.#scrollToAuthForm();
      });
    }

    const btnHeroStartRegister = document.getElementById('btnHeroStartRegister');
    if (btnHeroStartRegister) {
      btnHeroStartRegister.addEventListener('click', () => {
        this.setAuthMode('register');
        this.#scrollToAuthForm();
      });
    }

    const btnScrollToAuth = document.getElementById('btnScrollToAuth');
    if (btnScrollToAuth) {
      btnScrollToAuth.addEventListener('click', (e) => {
        e.preventDefault();
        this.setAuthMode('login');
        this.#scrollToAuthForm();
      });
    }

    const btnGuestHero = document.getElementById('btnQuickGuestPath');
    if (btnGuestHero) {
      btnGuestHero.addEventListener('click', (e) => {
        e.preventDefault();
        this.enterAsGuest();
      });
    }

    const btnGuestForm = document.getElementById('btnLandingGuest');
    if (btnGuestForm) {
      btnGuestForm.addEventListener('click', (e) => {
        e.preventDefault();
        this.enterAsGuest();
      });
    }

    // Mostrar / ocultar contraseña
    const btnTogglePwd = document.getElementById('btnTogglePassword');
    const pwdInput = document.getElementById('landingPasswordInput');
    if (btnTogglePwd && pwdInput) {
      btnTogglePwd.addEventListener('click', () => {
        const isPwd = pwdInput.type === 'password';
        pwdInput.type = isPwd ? 'text' : 'password';
        btnTogglePwd.textContent = isPwd ? 'Ocultar' : 'Mostrar';
      });
    }

    // Eventos del Cuestionario Diagnóstico (Wizard 3 pasos)
    document.querySelectorAll('.quiz-option-card').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.quiz-option-card').forEach(b => b.classList.remove('is-selected'));
        btn.classList.add('is-selected');
        this.#selectedLevel = btn.getAttribute('data-quiz-level') || 'Principiante';
        const g = btn.getAttribute('data-quiz-goal');
        if (g) this.#selectedFocusGoal = g;
      });
    });

    document.querySelectorAll('.quiz-focus-card').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.quiz-focus-card').forEach(b => b.classList.remove('is-selected'));
        btn.classList.add('is-selected');
        this.#selectedFocusGoal = btn.getAttribute('data-quiz-focus') || this.#selectedFocusGoal;
      });
    });

    document.querySelectorAll('.quiz-time-card').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.quiz-time-card').forEach(b => b.classList.remove('is-selected'));
        btn.classList.add('is-selected');
        this.#selectedDailyMins = parseInt(btn.getAttribute('data-quiz-mins') || '10', 10);
      });
    });

    const btnQuizNext = document.getElementById('btnQuizNext');
    const btnQuizPrev = document.getElementById('btnQuizPrev');
    const btnSkipQuiz = document.getElementById('btnSkipQuiz');

    if (btnQuizNext) {
      btnQuizNext.addEventListener('click', () => {
        if (this.#quizStep < 3) {
          this.#quizStep += 1;
          this.#renderQuizStep();
        } else {
          this.completePlacementQuiz(false);
        }
      });
    }

    if (btnQuizPrev) {
      btnQuizPrev.addEventListener('click', () => {
        if (this.#quizStep > 1) {
          this.#quizStep -= 1;
          this.#renderQuizStep();
        }
      });
    }

    if (btnSkipQuiz) {
      btnSkipQuiz.addEventListener('click', () => {
        this.completePlacementQuiz(true);
      });
    }
  }

  #renderQuizStep() {
    const step1 = document.getElementById('quizStep1');
    const step2 = document.getElementById('quizStep2');
    const step3 = document.getElementById('quizStep3');
    const badge = document.getElementById('quizStepBadge');
    const bar = document.getElementById('quizProgressBar');
    const btnPrev = document.getElementById('btnQuizPrev');
    const nextText = document.getElementById('btnQuizNextText');

    if (step1) step1.className = this.#quizStep === 1 ? 'quiz-step-pane flex flex-col gap-4' : 'quiz-step-pane hidden flex-col gap-4';
    if (step2) step2.className = this.#quizStep === 2 ? 'quiz-step-pane flex flex-col gap-4' : 'quiz-step-pane hidden flex-col gap-4';
    if (step3) step3.className = this.#quizStep === 3 ? 'quiz-step-pane flex flex-col gap-4' : 'quiz-step-pane hidden flex-col gap-4';

    if (badge) badge.textContent = `PREGUNTA ${this.#quizStep} DE 3`;
    if (bar) bar.style.width = `${Math.round((this.#quizStep / 3) * 100)}%`;

    if (btnPrev) {
      if (this.#quizStep > 1) btnPrev.classList.remove('hidden');
      else btnPrev.classList.add('hidden');
    }

    if (nextText) {
      nextText.textContent = this.#quizStep === 3 ? 'Crear Mi Ruta Personalizada ➔' : 'Siguiente paso';
    }
  }

  #scrollToAuthForm() {
    const section = document.getElementById('authPortalSection');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        const input = document.getElementById('landingUsernameInput');
        if (input) input.focus();
      }, 280);
    }
  }

  #initScrollytelling() {
    window.addEventListener('scroll', this.#boundHandleScroll, { passive: true });

    // IntersectionObserver para revelar elementos (.scroll-reveal)
    if ('IntersectionObserver' in window) {
      const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      }, { threshold: 0.14 });

      document.querySelectorAll('.scroll-reveal').forEach(el => revealObserver.observe(el));

      // Observer para los capítulos de Scrollytelling que cambian el escenario derecho
      const stepCards = document.querySelectorAll('.scrolly-step-card');
      const stepObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const stepNum = entry.target.getAttribute('data-scrolly-step');
            if (stepNum) this.#activateScrollyStep(stepNum);
          }
        });
      }, { threshold: 0.55 });

      stepCards.forEach(card => {
        stepObserver.observe(card);
        card.addEventListener('click', () => {
          const stepNum = card.getAttribute('data-scrolly-step');
          if (stepNum) this.#activateScrollyStep(stepNum);
        });
      });
    } else {
      document.querySelectorAll('.scroll-reveal').forEach(el => el.classList.add('is-visible'));
    }
  }

  #activateScrollyStep(stepNum) {
    document.querySelectorAll('.scrolly-step-card').forEach(card => {
      if (card.getAttribute('data-scrolly-step') === String(stepNum)) {
        card.classList.add('is-active');
      } else {
        card.classList.remove('is-active');
      }
    });

    ['1', '2', '3'].forEach(n => {
      const pane = document.getElementById(`scrollyPreview${n}`);
      if (pane) {
        if (n === String(stepNum)) pane.classList.add('is-active');
        else pane.classList.remove('is-active');
      }
    });
  }

  #handleWindowScroll() {
    const bar = document.getElementById('scrollProgressBar');
    if (!bar) return;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const pct = Math.min(100, Math.max(0, (scrollTop / docHeight) * 100));
    bar.style.width = `${pct.toFixed(1)}%`;
  }

  #initInteractiveTiltAndSpotlight() {
    const spotlight = document.getElementById('cursorSpotlight');
    const tiltCard = document.getElementById('solHoloCapsule');

    window.addEventListener('pointermove', (e) => {
      if (spotlight) {
        spotlight.style.left = `${e.clientX}px`;
        spotlight.style.top = `${e.clientY}px`;
      }
    }, { passive: true });

    if (tiltCard) {
      tiltCard.addEventListener('pointermove', (e) => {
        const rect = tiltCard.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        tiltCard.style.transform = `perspective(900px) rotateY(${(x * 7).toFixed(2)}deg) rotateX(${(-y * 7).toFixed(2)}deg)`;
      });
      tiltCard.addEventListener('pointerleave', () => {
        tiltCard.style.transform = 'perspective(900px) rotateY(0deg) rotateX(0deg)';
      });
    }
  }

  #renderSavedProfiles() {
    const bar = document.getElementById('savedProfilesQuickBar');
    const pillsContainer = document.getElementById('savedProfilesPills');
    if (!bar || !pillsContainer) return;

    let profiles = {};
    try {
      const raw = localStorage.getItem('exis_profiles_Map_v1');
      if (raw) profiles = JSON.parse(raw);
    } catch (e) {}

    const keys = Object.keys(profiles).filter(k => k && k !== 'invitado');
    if (keys.length === 0) {
      bar.classList.add('hidden');
      bar.classList.remove('flex');
      return;
    }

    bar.classList.remove('hidden');
    bar.classList.add('flex');
    pillsContainer.innerHTML = '';

    keys.slice(0, 4).forEach(username => {
      const p = profiles[username];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn-spring px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 flex items-center gap-2';
      btn.innerHTML = `<span>${p.displayName || username}</span><span class="text-[10px] font-mono text-slate-400 tabular-nums">${p.xp || 0} XP</span>`;
      btn.addEventListener('click', () => {
        this.#persistAndRedirect(p, '');
      });
      pillsContainer.appendChild(btn);
    });
  }

  async #handleSubmit(e) {
    e.preventDefault();
    if (this.#isSubmitting) return;

    const userInput = document.getElementById('landingUsernameInput');
    const displayInput = document.getElementById('landingDisplayNameInput');
    const pwdInput = document.getElementById('landingPasswordInput');
    const levelSelect = document.getElementById('landingLevelSelect');
    const goalInput = document.getElementById('landingGoalInput');
    const errorEl = document.getElementById('landingAuthError');

    const rawIdentifier = userInput ? userInput.value.trim().toLowerCase() : '';
    const password = pwdInput ? pwdInput.value : '';

    if (!rawIdentifier || rawIdentifier.length < 2) {
      if (errorEl) {
        errorEl.textContent = 'Ingresa un correo electrónico o usuario válido (mínimo 2 caracteres).';
        errorEl.classList.remove('hidden');
      }
      return;
    }

    if (pwdInput && password.length > 0 && password.length < 4) {
      if (errorEl) {
        errorEl.textContent = 'La contraseña debe tener al menos 4 caracteres.';
        errorEl.classList.remove('hidden');
      }
      return;
    }

    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.add('hidden');
    }

    const cleanUsername = rawIdentifier.includes('@') ? rawIdentifier.split('@')[0] : rawIdentifier;
    const defaultDisplay = cleanUsername.charAt(0).toUpperCase() + cleanUsername.slice(1);
    const displayName = displayInput && displayInput.value.trim()
      ? displayInput.value.trim()
      : defaultDisplay;

    const explicitGoal = goalInput ? goalInput.value.trim() : '';
    const explicitLevel = levelSelect && levelSelect.value ? levelSelect.value : 'Principiante';

    const profileDraft = {
      username: cleanUsername,
      email: rawIdentifier.includes('@') ? rawIdentifier : `${cleanUsername}@exis.edu.co`,
      displayName,
      level: explicitLevel,
      xp: 0,
      streak: 1,
      masteredSigns: [],
      customPlans: [],
      examHistory: []
    };

    // Si el usuario ya rellenó un objetivo explícito (ej. pruebas automatizadas) o está en modo Login directo, entra de inmediato;
    // Si es un registro interactivo nuevo sin objetivo predefinido, abre el Cuestionario Diagnóstico de 3 pasos.
    if (this.#authMode === 'login' || explicitGoal.length > 0) {
      await this.#persistAndRedirect(profileDraft, explicitGoal);
    } else {
      this.openPlacementQuiz(profileDraft);
    }
  }

  async #persistAndRedirect(profileDraft, goalText) {
    this.#isSubmitting = true;
    const submitBtn = document.getElementById('btnLandingSubmit');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.classList.add('opacity-75', 'cursor-wait');
    }

    try {
      const storageKeyProfiles = 'exis_profiles_Map_v1';
      const storageKeyActive = 'exis_active_profile_v1';
      let allProfiles = {};
      try {
        const raw = localStorage.getItem(storageKeyProfiles);
        if (raw) allProfiles = JSON.parse(raw);
      } catch (err) {}

      const existing = allProfiles[profileDraft.username] || {};
      const mergedProfile = {
        ...existing,
        ...profileDraft,
        xp: existing.xp || profileDraft.xp || 0,
        streak: existing.streak || profileDraft.streak || 1,
        masteredSigns: existing.masteredSigns || [],
        customPlans: existing.customPlans || [],
        examHistory: existing.examHistory || []
      };

      allProfiles[mergedProfile.username] = mergedProfile;
      localStorage.setItem(storageKeyProfiles, JSON.stringify(allProfiles));
      localStorage.setItem(storageKeyActive, mergedProfile.username);

      if (goalText) {
        sessionStorage.setItem('exis_pending_ai_goal', goalText);
      }

      try {
        await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mergedProfile)
        });
      } catch (apiErr) {}

      window.location.href = 'index.html?screen=path';
    } catch (err) {
      console.error('[LandingPortalController] Error al guardar perfil:', err);
      this.#isSubmitting = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('opacity-75', 'cursor-wait');
      }
    }
  }

  #checkExistingSession() {
    try {
      const active = localStorage.getItem('exis_active_profile_v1');
      if (active && active !== 'invitado') {
        const userInput = document.getElementById('landingUsernameInput');
        if (userInput && !userInput.value) {
          userInput.value = active;
        }
      }
    } catch (e) {}
  }
}

window.LandingPortalController = new LandingPortalController();

document.addEventListener('DOMContentLoaded', () => {
  window.LandingPortalController.init();
  window.LandingPortalController.start();
});
