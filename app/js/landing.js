/**
 * LSC Learn · Proyecto EXIS
 * landing.js - Controlador del Portal de Entrada y Registro (POO)
 * Gestiona autenticación inicial, sincronización con API y redirección a la ruta de aprendizaje
 */

// Registro global de errores de consola para auditoría visual automatizada (Regla 7 AGENTS.md)
window.__consoleErrors = window.__consoleErrors || [];
window.addEventListener('error', e => window.__consoleErrors.push(e.message || String(e)));
window.addEventListener('unhandledrejection', e => window.__consoleErrors.push(e.reason ? (e.reason.message || String(e.reason)) : 'Unhandled Rejection'));

class LandingPortalController {
  #isSubmitting;
  #boundHandleSubmit;

  constructor() {
    this.#isSubmitting = false;
    this.#boundHandleSubmit = this.#handleSubmit.bind(this);
  }

  init() {
    this.#bindUIEvents();
    this.#checkExistingSession();
  }

  start() {
    // Listo para interacciones
  }

  update() {
    // Actualización de estado si aplica
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
        const section = document.getElementById('authPortalSection');
        if (section) {
          section.scrollIntoView({ behavior: 'smooth' });
          const userInput = document.getElementById('landingUsernameInput');
          if (userInput) userInput.focus();
        }
      });
    }
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
      // 1. Guardar en localStorage
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

      // Si el estudiante redactó un objetivo inicial, guardarlo para que Sol lo procese en la ruta
      if (goal) {
        sessionStorage.setItem('exis_pending_ai_goal', goal);
      }

      // 2. Sincronizar con API backend
      try {
        await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profile)
        });
      } catch (apiErr) {
        // En modo offline continúa sin bloquear
      }

      // 3. Redirigir a la pantalla del Mapa Duolingo
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

// Inicialización de la clase e instancia global (Reglas 5 y 8)
window.LandingPortalController = new LandingPortalController();

document.addEventListener('DOMContentLoaded', () => {
  window.LandingPortalController.init();
});
