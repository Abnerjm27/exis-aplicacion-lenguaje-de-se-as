/**
 * LSC Learn · Proyecto EXIS
 * landing.js - Controlador del Portal de Entrada y Registro (POO)
 * Gestiona pestañas Login/Registro, perfiles rápidos, sugerencias de Sol IA y sincronización con API
 */

// Registro global de errores de consola para auditoría visual automatizada (Regla 7 AGENTS.md)
window.__consoleErrors = window.__consoleErrors || [];
window.addEventListener('error', e => window.__consoleErrors.push(e.message || String(e)));
window.addEventListener('unhandledrejection', e => window.__consoleErrors.push(e.reason ? (e.reason.message || String(e.reason)) : 'Unhandled Rejection'));

class LandingPortalController {
  #isSubmitting;
  #authMode;
  #boundHandleSubmit;

  constructor() {
    this.#isSubmitting = false;
    this.#authMode = 'login';
    this.#boundHandleSubmit = this.#handleSubmit.bind(this);
  }

  init() {
    this.#bindUIEvents();
    this.#renderSavedProfiles();
    this.#checkExistingSession();
  }

  start() {
    // Ciclo de vida POO estándar
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
  }

  setAuthMode(mode) {
    this.#authMode = mode === 'register' ? 'register' : 'login';
    const tabLogin = document.getElementById('tabAuthLogin');
    const tabRegister = document.getElementById('tabAuthRegister');
    const submitText = document.getElementById('btnLandingSubmitText');

    if (this.#authMode === 'login') {
      if (tabLogin) {
        tabLogin.className = 'auth-tab-btn auth-tab-active py-2 rounded-lg text-xs font-bold transition-all';
        tabLogin.setAttribute('aria-selected', 'true');
      }
      if (tabRegister) {
        tabRegister.className = 'auth-tab-btn py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-all';
        tabRegister.setAttribute('aria-selected', 'false');
      }
      if (submitText) submitText.textContent = 'Entrar a Mi Ruta de Aprendizaje';
    } else {
      if (tabRegister) {
        tabRegister.className = 'auth-tab-btn auth-tab-active py-2 rounded-lg text-xs font-bold transition-all';
        tabRegister.setAttribute('aria-selected', 'true');
      }
      if (tabLogin) {
        tabLogin.className = 'auth-tab-btn py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-all';
        tabLogin.setAttribute('aria-selected', 'false');
      }
      if (submitText) submitText.textContent = 'Crear Cuenta y Empezar Ruta';
    }
  }

  async enterAsGuest() {
    try {
      localStorage.setItem('exis_active_profile_v1', 'invitado');
    } catch (e) {
      console.warn('[LandingPortalController] Error al guardar modo invitado:', e);
    }
    window.location.href = 'index.html?screen=path';
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

    const btnScroll = document.getElementById('btnScrollToAuth');
    if (btnScroll) {
      btnScroll.addEventListener('click', (e) => {
        e.preventDefault();
        const userInput = document.getElementById('landingUsernameInput');
        if (userInput) {
          userInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          userInput.focus();
        }
      });
    }

    // Chips de objetivos rápidos para Sol IA
    document.querySelectorAll('.landing-goal-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const preset = btn.getAttribute('data-goal-preset');
        const goalInput = document.getElementById('landingGoalInput');
        if (goalInput && preset) {
          goalInput.value = preset;
          goalInput.focus();
        }
      });
    });
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
      btn.className = 'btn-spring px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 flex items-center gap-1.5';
      btn.innerHTML = `<span>${p.displayName || username}</span><span class="text-[10px] font-mono text-slate-400 tabular-nums">${p.xp || 0} XP</span>`;
      btn.addEventListener('click', () => {
        const uIn = document.getElementById('landingUsernameInput');
        const dIn = document.getElementById('landingDisplayNameInput');
        const lSel = document.getElementById('landingLevelSelect');
        if (uIn) uIn.value = p.username;
        if (dIn) dIn.value = p.displayName || p.username;
        if (lSel && p.level) lSel.value = p.level;
      });
      pillsContainer.appendChild(btn);
    });
  }

  async #handleSubmit(e) {
    e.preventDefault();
    if (this.#isSubmitting) return;

    const userInput = document.getElementById('landingUsernameInput');
    const displayInput = document.getElementById('landingDisplayNameInput');
    const levelSelect = document.getElementById('landingLevelSelect');
    const goalInput = document.getElementById('landingGoalInput');
    const errorEl = document.getElementById('landingAuthError');
    const submitBtn = document.getElementById('btnLandingSubmit');

    const username = userInput ? userInput.value.trim().toLowerCase() : '';
    const displayName = displayInput && displayInput.value.trim()
      ? displayInput.value.trim()
      : (username.charAt(0).toUpperCase() + username.slice(1));
    const level = levelSelect ? levelSelect.value : 'Principiante';
    const goal = goalInput ? goalInput.value.trim() : '';

    if (!username || username.length < 2) {
      if (errorEl) {
        errorEl.textContent = 'El usuario debe tener al menos 2 caracteres.';
        errorEl.classList.remove('hidden');
      }
      return;
    }

    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.add('hidden');
    }

    this.#isSubmitting = true;
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

      let profile = allProfiles[username] || {
        username,
        displayName,
        level,
        xp: 0,
        streak: 1,
        masteredSigns: [],
        customPlans: [],
        examHistory: []
      };

      profile.displayName = displayName;
      profile.level = level;
      allProfiles[username] = profile;

      localStorage.setItem(storageKeyProfiles, JSON.stringify(allProfiles));
      localStorage.setItem(storageKeyActive, username);

      if (goal) {
        sessionStorage.setItem('exis_pending_ai_goal', goal);
      }

      try {
        await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profile)
        });
      } catch (apiErr) {}

      window.location.href = 'index.html?screen=path';
    } catch (err) {
      console.error('[LandingPortalController] Error al guardar perfil:', err);
      if (errorEl) {
        errorEl.textContent = 'Error al registrar perfil. Intenta nuevamente.';
        errorEl.classList.remove('hidden');
      }
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
});
