/**
 * LSC Learn · Proyecto EXIS
 * auth-profile-manager.js - Gestión de Perfiles, Sesiones y Progreso de Usuario (POO)
 * Sincronización híbrida (localStorage + API local /api/users)
 */

class AuthProfileManager {
  static STORAGE_ACTIVE_KEY = 'exis_active_profile_v1';
  static STORAGE_PROFILES_KEY = 'exis_profiles_Map_v1';

  static DEFAULT_PROFILE = {
    username: 'invitado',
    displayName: 'Estudiante LSC',
    level: 'Principiante',
    xp: 0,
    streak: 1,
    masteredSigns: [],
    customPlans: [],
    examHistory: []
  };

  #profile;
  #onProfileChange;
  #isOpen;
  #boundHandleKeyDown;

  constructor() {
    this.#profile = { ...AuthProfileManager.DEFAULT_PROFILE };
    this.#onProfileChange = null;
    this.#isOpen = false;
    this.#boundHandleKeyDown = this.#handleKeyDown.bind(this);
  }

  init(onProfileChangeCallback = null) {
    if (typeof onProfileChangeCallback === 'function') {
      this.#onProfileChange = onProfileChangeCallback;
    }
    this.#loadActiveProfile();
    this.#bindModalEvents();
    this.updateUI();
  }

  start() {
    this.updateUI();
  }

  update(partialProfile = {}) {
    if (!partialProfile || typeof partialProfile !== 'object') return this.getCurrentProfile();
    this.#profile = {
      ...this.#profile,
      ...partialProfile,
      masteredSigns: Array.from(new Set([...(partialProfile.masteredSigns || this.#profile.masteredSigns || [])])),
      customPlans: partialProfile.customPlans || this.#profile.customPlans || [],
      examHistory: partialProfile.examHistory || this.#profile.examHistory || []
    };
    this.#saveProfile();
    this.updateUI();
    if (this.#onProfileChange) {
      try {
        this.#onProfileChange(this.getCurrentProfile());
      } catch (err) {
        console.error('[AuthProfileManager] Error en callback onProfileChange:', err);
      }
    }
    return this.getCurrentProfile();
  }

  reset() {
    this.#profile = { ...AuthProfileManager.DEFAULT_PROFILE };
    this.#saveProfile();
    this.updateUI();
    if (this.#onProfileChange) {
      this.#onProfileChange(this.getCurrentProfile());
    }
  }

  destroy() {
    this.closeAuthModal();
    window.removeEventListener('keydown', this.#boundHandleKeyDown);
  }

  getCurrentProfile() {
    return JSON.parse(JSON.stringify(this.#profile));
  }

  async loginOrRegister(username, displayName = '', level = 'Principiante') {
    const cleanUser = (username || '').trim().toLowerCase();
    if (!cleanUser || cleanUser.length < 2) {
      throw new Error('El nombre de usuario debe tener al menos 2 caracteres.');
    }

    const cleanDisplay = (displayName || '').trim() || (cleanUser.charAt(0).toUpperCase() + cleanUser.slice(1));
    const allProfiles = this.#getAllStoredProfiles();

    let targetProfile = allProfiles[cleanUser];
    if (!targetProfile) {
      targetProfile = {
        username: cleanUser,
        displayName: cleanDisplay,
        level: level || 'Principiante',
        xp: 0,
        streak: 1,
        masteredSigns: [],
        customPlans: [],
        examHistory: []
      };
    } else {
      if (cleanDisplay) targetProfile.displayName = cleanDisplay;
      if (level) targetProfile.level = level;
    }

    allProfiles[cleanUser] = targetProfile;
    try {
      localStorage.setItem(AuthProfileManager.STORAGE_PROFILES_KEY, JSON.stringify(allProfiles));
      localStorage.setItem(AuthProfileManager.STORAGE_ACTIVE_KEY, cleanUser);
    } catch (e) {
      console.warn('[AuthProfileManager] Error guardando en localStorage:', e);
    }

    this.#profile = { ...targetProfile };
    this.updateUI();
    this.#syncWithServer(targetProfile);

    if (this.#onProfileChange) {
      this.#onProfileChange(this.getCurrentProfile());
    }
    return this.getCurrentProfile();
  }

  recordSignMastered(signId, earnedXp = 25) {
    if (!signId) return this.getCurrentProfile();
    const id = signId.toUpperCase();
    const mastered = new Set(this.#profile.masteredSigns || []);
    const isNew = !mastered.has(id);
    mastered.add(id);

    const newXp = (this.#profile.xp || 0) + (isNew ? earnedXp : Math.max(5, Math.round(earnedXp / 3)));

    let newLevel = this.#profile.level;
    if (mastered.size >= 15) {
      newLevel = 'Avanzado LSC';
    } else if (mastered.size >= 6) {
      newLevel = 'Intermedio LSC';
    } else {
      newLevel = 'Principiante';
    }

    return this.update({
      masteredSigns: Array.from(mastered),
      xp: newXp,
      level: newLevel
    });
  }

  recordExamResult(examSummary) {
    if (!examSummary) return this.getCurrentProfile();
    const history = [...(this.#profile.examHistory || [])];
    history.push({
      planTitle: examSummary.planTitle || 'Examen LSC',
      scorePct: Number(examSummary.scorePct) || 0,
      correct: Number(examSummary.correct) || 0,
      total: Number(examSummary.total) || 0,
      dateIso: examSummary.dateIso || new Date().toISOString()
    });

    const bonusXp = Math.round((Number(examSummary.scorePct) || 0) * 0.5);
    return this.update({
      examHistory: history,
      xp: (this.#profile.xp || 0) + bonusXp
    });
  }

  saveCustomPlan(planObj) {
    if (!planObj || !planObj.id || !Array.isArray(planObj.signs) || planObj.signs.length === 0) {
      throw new Error('El plan debe tener un ID y al menos una seña válida.');
    }
    const currentPlans = [...(this.#profile.customPlans || [])];
    const existingIdx = currentPlans.findIndex(p => p.id === planObj.id);
    if (existingIdx >= 0) {
      currentPlans[existingIdx] = planObj;
    } else {
      currentPlans.push(planObj);
    }
    return this.update({ customPlans: currentPlans });
  }

  openAuthModal() {
    const modal = document.getElementById('authModal');
    if (!modal) return;
    this.#isOpen = true;
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');

    const inputUser = document.getElementById('authUsernameInput');
    const inputDisplay = document.getElementById('authDisplayNameInput');
    const selectLevel = document.getElementById('authLevelSelect');
    const errorEl = document.getElementById('authFormError');

    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.add('hidden');
    }

    if (inputUser) {
      inputUser.value = this.#profile.username !== 'invitado' ? this.#profile.username : '';
      inputUser.focus();
    }
    if (inputDisplay) {
      inputDisplay.value = this.#profile.displayName !== 'Estudiante LSC' ? this.#profile.displayName : '';
    }
    if (selectLevel) {
      selectLevel.value = this.#profile.level || 'Principiante';
    }

    window.addEventListener('keydown', this.#boundHandleKeyDown);
  }

  closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (!modal) return;
    this.#isOpen = false;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    window.removeEventListener('keydown', this.#boundHandleKeyDown);
  }

  updateUI() {
    const p = this.#profile;

    const elDisplay = document.getElementById('userDisplayName');
    if (elDisplay) elDisplay.textContent = p.displayName || p.username || 'Estudiante LSC';

    const elLevel = document.getElementById('userLevelBadge');
    if (elLevel) elLevel.textContent = p.level || 'Principiante';

    const elXp = document.getElementById('userXpValue');
    if (elXp) elXp.textContent = (p.xp || 0).toLocaleString();

    const elXpBar = document.getElementById('userXpBar');
    if (elXpBar) {
      const pct = Math.min(100, Math.round(((p.xp || 0) % 250) / 2.5));
      elXpBar.style.width = `${pct}%`;
    }

    const elStreak = document.getElementById('userStreakCount');
    if (elStreak) elStreak.textContent = `${p.streak || 1} d`;

    // Maestría de letras y palabras
    const mastered = p.masteredSigns || [];
    const wordsKeys = ['HOLA', 'YO', 'BUENOS', 'DIAS', 'TARDES', 'NOCHES', 'GUSTAR', 'NOMBRE', 'ANNOS', 'LICOR'];
    const lettersKeys = ['A', 'B', 'C', 'D', 'E', 'I', 'L', 'O', 'U', 'V'];

    const wordsCount = wordsKeys.filter(k => mastered.includes(k)).length;
    const lettersCount = lettersKeys.filter(k => mastered.includes(k)).length;

    const elWordsPct = document.getElementById('masteryWordsPct');
    if (elWordsPct) elWordsPct.textContent = `${Math.round((wordsCount / wordsKeys.length) * 100)}%`;

    const elLettersPct = document.getElementById('masteryLettersPct');
    if (elLettersPct) elLettersPct.textContent = `${Math.round((lettersCount / lettersKeys.length) * 100)}%`;

    const elTotal = document.getElementById('masteryTotalCount');
    if (elTotal) elTotal.textContent = `${mastered.length} / 20`;
  }

  #loadActiveProfile() {
    try {
      const activeUser = localStorage.getItem(AuthProfileManager.STORAGE_ACTIVE_KEY);
      const allProfiles = this.#getAllStoredProfiles();
      if (activeUser && allProfiles[activeUser]) {
        this.#profile = { ...AuthProfileManager.DEFAULT_PROFILE, ...allProfiles[activeUser] };
        return;
      }
    } catch (e) {
      console.warn('[AuthProfileManager] Error leyendo perfiles de localStorage:', e);
    }
    this.#profile = { ...AuthProfileManager.DEFAULT_PROFILE };
  }

  #getAllStoredProfiles() {
    try {
      const raw = localStorage.getItem(AuthProfileManager.STORAGE_PROFILES_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  #saveProfile() {
    try {
      const all = this.#getAllStoredProfiles();
      all[this.#profile.username] = this.#profile;
      localStorage.setItem(AuthProfileManager.STORAGE_PROFILES_KEY, JSON.stringify(all));
      localStorage.setItem(AuthProfileManager.STORAGE_ACTIVE_KEY, this.#profile.username);
    } catch (e) {
      console.warn('[AuthProfileManager] Error guardando perfil:', e);
    }
    this.#syncWithServer(this.#profile);
  }

  async #syncWithServer(profile) {
    if (!profile || profile.username === 'invitado') return;
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
    } catch (e) {
      // Modo offline silencioso
    }
  }

  #bindModalEvents() {
    const btnOpen = document.getElementById('btnOpenAuthModal');
    if (btnOpen) btnOpen.addEventListener('click', () => this.openAuthModal());

    const btnSwitch = document.getElementById('btnSwitchProfile');
    if (btnSwitch) btnSwitch.addEventListener('click', () => this.openAuthModal());

    const btnClose = document.getElementById('btnCloseAuthModal');
    if (btnClose) btnClose.addEventListener('click', () => this.closeAuthModal());

    const btnSubmit = document.getElementById('btnSubmitAuth');
    if (btnSubmit) {
      btnSubmit.addEventListener('click', async (e) => {
        e.preventDefault();
        const inputUser = document.getElementById('authUsernameInput');
        const inputDisplay = document.getElementById('authDisplayNameInput');
        const selectLevel = document.getElementById('authLevelSelect');
        const errorEl = document.getElementById('authFormError');

        const username = inputUser ? inputUser.value.trim() : '';
        const displayName = inputDisplay ? inputDisplay.value.trim() : '';
        const level = selectLevel ? selectLevel.value : 'Principiante';

        if (!username || username.length < 2) {
          if (errorEl) {
            errorEl.textContent = 'El usuario debe tener al menos 2 caracteres.';
            errorEl.classList.remove('hidden');
          }
          return;
        }

        try {
          await this.loginOrRegister(username, displayName, level);
          this.closeAuthModal();
        } catch (err) {
          if (errorEl) {
            errorEl.textContent = err.message || 'Error al iniciar sesión.';
            errorEl.classList.remove('hidden');
          }
        }
      });
    }
  }

  #handleKeyDown(e) {
    if (e.key === 'Escape' && this.#isOpen) {
      this.closeAuthModal();
    }
  }
}

// Instancia global y exposición en window (Reglas 5 y 8)
window.AuthProfileManager = new AuthProfileManager();
