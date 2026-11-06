/**
 * LSC Learn · Proyecto EXIS
 * learning-plan-manager.js - Gestor de Rutas de Aprendizaje, Arquitecta IA y Mapa Hexagonal (POO)
 * Implementa planes predefinidos, IA local (/api/plan), creador de plan propio y Skill Tree hexagonal
 */

class LearningPlanManager {
  static PRESET_PLANS = {
    plan_zero_ai: {
      id: 'plan_zero_ai',
      title: 'Desde Cero: Ruta Básica IA',
      rationale: 'Secuencia diseñada para principiantes absolutos: empieza con el saludo fundamental, vocales de una sola mano y presentación personal.',
      signs: ['HOLA', 'YO', 'A', 'E', 'O', 'BUENOS', 'DIAS', 'NOMBRE']
    },
    plan_alphabet: {
      id: 'plan_alphabet',
      title: 'Dominio del Abecedario LSC',
      rationale: 'Entrenamiento progresivo de las 10 configuraciones dactilológicas esenciales del corpus LSC70.',
      signs: ['A', 'B', 'C', 'D', 'E', 'I', 'L', 'O', 'U', 'V']
    },
    plan_words: {
      id: 'plan_words',
      title: 'Palabras y Conversación LSC',
      rationale: 'Vocabulario cotidiano, saludos por franja horaria y verbos de interacción social en LSC.',
      signs: ['HOLA', 'BUENOS', 'DIAS', 'TARDES', 'NOCHES', 'YO', 'NOMBRE', 'GUSTAR', 'ANNOS', 'LICOR']
    }
  };

  #activePlan;
  #currentIndex;
  #onSelectSign;
  #onStartExamRequest;
  #customModalOpen;
  #selectedCustomSignIds;
  #boundHandleKeyDown;

  constructor() {
    this.#activePlan = { ...LearningPlanManager.PRESET_PLANS.plan_zero_ai, currentIndex: 0 };
    this.#currentIndex = 0;
    this.#onSelectSign = null;
    this.#onStartExamRequest = null;
    this.#customModalOpen = false;
    this.#selectedCustomSignIds = new Set();
    this.#boundHandleKeyDown = this.#handleKeyDown.bind(this);
  }

  init(options = {}) {
    if (typeof options.onSelectSign === 'function') {
      this.#onSelectSign = options.onSelectSign;
    }
    if (typeof options.onStartExamRequest === 'function') {
      this.#onStartExamRequest = options.onStartExamRequest;
    }

    this.#bindUIEvents();
    this.selectPresetPlan('plan_zero_ai');

    // Comprobar objetivo pedagógico pendiente desde el Portal Landing
    try {
      const pendingGoal = sessionStorage.getItem('exis_pending_ai_goal');
      if (pendingGoal) {
        sessionStorage.removeItem('exis_pending_ai_goal');
        setTimeout(() => {
          this.generateAIPlanFromPrompt(pendingGoal);
        }, 60);
      }
    } catch (_) {}
  }

  start() {
    this.renderHexSkillTree();
  }

  update() {
    this.renderHexSkillTree();
  }

  reset() {
    this.#currentIndex = 0;
    this.renderHexSkillTree();
  }

  destroy() {
    this.closeCustomPlanModal();
    window.removeEventListener('keydown', this.#boundHandleKeyDown);
  }

  getActivePlan() {
    return {
      ...this.#activePlan,
      currentIndex: this.#currentIndex
    };
  }

  selectPresetPlan(planId) {
    let target = LearningPlanManager.PRESET_PLANS[planId];
    if (!target && window.AuthProfileManager) {
      const profile = window.AuthProfileManager.getCurrentProfile();
      const customPlans = profile.customPlans || [];
      target = customPlans.find(p => p.id === planId);
    }

    if (!target) {
      target = LearningPlanManager.PRESET_PLANS.plan_zero_ai;
    }

    this.#activePlan = { ...target };
    this.#currentIndex = 0;
    this.#updateActivePlanHeader();
    this.renderHexSkillTree();

    // Actualizar botones de chips de planes
    this.#updatePresetPlanChipStyles(target.id);

    // Seleccionar automáticamente la primera seña del plan
    if (target.signs && target.signs.length > 0) {
      this.#triggerSignSelection(target.signs[0]);
    }
  }

  async generateAIPlanFromPrompt(goalText) {
    const prompt = (goalText || '').trim();
    if (!prompt) return this.#activePlan;

    const btn = document.getElementById('btnGenerateAiPlan');
    const input = document.getElementById('aiPlanPromptInput');
    const rationaleEl = document.getElementById('aiPlanRationaleText');

    if (btn) {
      btn.disabled = true;
      btn.classList.add('opacity-60', 'cursor-not-allowed');
    }
    if (rationaleEl) {
      rationaleEl.textContent = 'Sol está analizando tu objetivo para estructurar tu ruta pedagógica...';
      rationaleEl.classList.remove('hidden');
    }

    let planData = null;
    try {
      let userLevel = 'beginner';
      if (window.AuthProfileManager) {
        userLevel = window.AuthProfileManager.getCurrentProfile().level || 'beginner';
      }

      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: prompt, level: userLevel })
      });

      if (res.ok) {
        planData = await res.json();
      }
    } catch (err) {
      console.warn('[LearningPlanManager] Fallo en /api/plan, usando fallback local:', err);
    }

    if (!planData || !Array.isArray(planData.signs) || planData.signs.length === 0) {
      planData = {
        id: `plan_ai_${Date.now()}`,
        title: 'Ruta IA: Fundamentos LSC',
        rationale: 'Sol adaptó la ruta básica con saludos, presentación y dactilología esencial.',
        signs: ['HOLA', 'YO', 'A', 'E', 'O', 'BUENOS', 'DIAS', 'NOMBRE']
      };
    }

    this.#activePlan = {
      id: planData.id || `plan_ai_${Date.now()}`,
      title: planData.title || 'Ruta Personalizada IA',
      rationale: planData.rationale || 'Ruta pedagógica estructurada por Sol.',
      signs: planData.signs
    };
    this.#currentIndex = 0;

    if (rationaleEl) {
      rationaleEl.textContent = this.#activePlan.rationale;
      rationaleEl.classList.remove('hidden');
    }

    if (input) input.value = '';
    if (btn) {
      btn.disabled = false;
      btn.classList.remove('opacity-60', 'cursor-not-allowed');
    }

    this.#updateActivePlanHeader();
    this.renderHexSkillTree();
    this.#updatePresetPlanChipStyles('custom_ai');

    if (this.#activePlan.signs.length > 0) {
      this.#triggerSignSelection(this.#activePlan.signs[0]);
    }

    return this.#activePlan;
  }

  createCustomPlan(title, selectedSignIds) {
    const errorEl = document.getElementById('customPlanError');
    if (!selectedSignIds || selectedSignIds.length === 0) {
      const msg = 'Selecciona al menos 1 seña para armar tu plan.';
      if (errorEl) {
        errorEl.textContent = msg;
        errorEl.classList.remove('hidden');
      }
      return { ok: false, error: msg };
    }

    const cleanTitle = (title || '').trim() || `Mi Ruta (${selectedSignIds.length} señas)`;
    const newPlan = {
      id: `plan_custom_${Date.now()}`,
      title: cleanTitle,
      rationale: `Ruta personalizada con ${selectedSignIds.length} señas seleccionadas por el estudiante.`,
      signs: [...selectedSignIds]
    };

    if (window.AuthProfileManager) {
      window.AuthProfileManager.saveCustomPlan(newPlan);
    }

    this.#activePlan = { ...newPlan };
    this.#currentIndex = 0;
    this.#updateActivePlanHeader();
    this.renderHexSkillTree();
    this.closeCustomPlanModal();
    this.#updatePresetPlanChipStyles('custom_user');

    if (this.#activePlan.signs.length > 0) {
      this.#triggerSignSelection(this.#activePlan.signs[0]);
    }

    return { ok: true, plan: newPlan };
  }

  markSignCompletedInPlan(signId) {
    if (!signId || !this.#activePlan || !this.#activePlan.signs) {
      return { nextSignId: null, planCompleted: false };
    }

    const currentId = signId.toUpperCase();
    const idx = this.#activePlan.signs.indexOf(currentId);
    let planCompleted = false;
    let nextSignId = null;

    if (idx >= 0) {
      if (idx + 1 < this.#activePlan.signs.length) {
        this.#currentIndex = idx + 1;
        nextSignId = this.#activePlan.signs[this.#currentIndex];
      } else {
        planCompleted = true;
      }
    }

    this.renderHexSkillTree();
    this.#updateActivePlanHeader();

    return { nextSignId, planCompleted };
  }

  renderHexSkillTree() {
    const container = document.getElementById('hexSkillTreeContainer');
    if (!container) return;

    container.innerHTML = '';
    container.className = 'duolingo-winding-path flex flex-col items-center gap-7 py-6 relative w-full max-w-xl mx-auto';

    const signs = this.#activePlan.signs || [];
    let masteredSet = new Set();
    if (window.AuthProfileManager) {
      const profile = window.AuthProfileManager.getCurrentProfile();
      masteredSet = new Set(profile.masteredSigns || []);
    }

    signs.forEach((signId, idx) => {
      const isCompleted = masteredSet.has(signId);
      const isCurrent = idx === this.#currentIndex;
      const posClass = (idx % 3 === 0) ? 'duolingo-pos-center' : (idx % 3 === 1) ? 'duolingo-pos-left' : 'duolingo-pos-right';

      const nodeBtn = document.createElement('button');
      nodeBtn.id = `hex-node-${signId}`;
      nodeBtn.className = `hex-node duolingo-node ${posClass} flex flex-col items-center justify-center p-2 rounded-2xl transition cursor-pointer relative shrink-0 ${
        isCompleted
          ? 'hex-node-completed'
          : isCurrent
          ? 'hex-node-active'
          : 'hex-node-locked'
      }`;
      nodeBtn.setAttribute('data-sign-id', signId);
      nodeBtn.setAttribute('data-step-index', String(idx));
      nodeBtn.setAttribute('aria-label', `Paso ${idx + 1}: seña ${signId}. Estado: ${isCompleted ? 'Completado' : isCurrent ? 'Actual' : 'Pendiente'}`);

      // Badge flotante "¡EMPEZAR!" sobre el nodo actual
      let startPillHtml = '';
      if (isCurrent) {
        startPillHtml = `<span class="duolingo-start-pill absolute -top-4 font-bold text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/30 animate-bounce z-20">¡EMPEZAR!</span>`;
      }

      // Icono SVG y estado
      let statusSvg = '';
      if (isCompleted) {
        statusSvg = `<svg class="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
      } else if (isCurrent) {
        statusSvg = `<span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>`;
      } else {
        statusSvg = `<span class="w-1.5 h-1.5 rounded-full bg-slate-600"></span>`;
      }

      nodeBtn.innerHTML = `
        ${startPillHtml}
        <div class="hex-shape-wrapper flex items-center justify-center relative w-12 h-12">
          <svg class="hex-svg w-full h-full" viewBox="0 0 100 115" fill="none" stroke="currentColor" stroke-width="6">
            <polygon points="50,4 96,29 96,86 50,111 4,86 4,29" class="hex-polygon" />
          </svg>
          <span class="absolute font-mono text-xs font-bold text-slate-100 tabular-nums">${idx + 1}</span>
        </div>
        <span class="text-[11px] font-bold tracking-tight text-slate-200 mt-1 uppercase max-w-[70px] truncate text-center">${signId}</span>
        <div class="flex items-center gap-1 mt-0.5">
          ${statusSvg}
        </div>
      `;

      nodeBtn.addEventListener('click', () => {
        this.#currentIndex = idx;
        this.renderHexSkillTree();
        this.#updateActivePlanHeader();
        if (window.ViewRouter) {
          window.ViewRouter.switchToStudioView(signId, false);
        } else {
          this.#triggerSignSelection(signId);
        }
      });

      container.appendChild(nodeBtn);
    });

    // Nodo Trofeo Final de Unidad: Examen Sin Video
    const trophyBtn = document.createElement('button');
    trophyBtn.id = 'btnPathFinalExamNode';
    trophyBtn.className = 'duolingo-trophy-node duolingo-pos-center flex flex-col items-center justify-center p-4 rounded-2xl transition cursor-pointer relative mt-3 group border border-amber-500/30 bg-slate-900/90 hover:bg-slate-800 shadow-xl';
    trophyBtn.setAttribute('aria-label', 'Examen de Unidad: Evaluación a Ciegas sin video');
    trophyBtn.innerHTML = `
      <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition">
        <svg class="w-7 h-7 text-slate-950" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
          <path d="M4 22h16"></path>
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
        </svg>
      </div>
      <span class="text-xs font-bold uppercase tracking-wider text-amber-300 mt-2">Examen de Unidad</span>
      <span class="text-[10px] text-slate-400">Evaluación a Ciegas (Sin Video)</span>
    `;
    trophyBtn.addEventListener('click', () => {
      if (window.ViewRouter) {
        window.ViewRouter.switchToStudioView(null, true);
      } else if (window.BlindExamController) {
        window.BlindExamController.start(this.#activePlan);
      }
    });
    container.appendChild(trophyBtn);

    this.#updateActivePlanHeader();
  }

  openCustomPlanModal() {
    const modal = document.getElementById('customPlanModal');
    if (!modal) return;
    this.#customModalOpen = true;
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');

    const errorEl = document.getElementById('customPlanError');
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.add('hidden');
    }

    const titleInput = document.getElementById('customPlanTitleInput');
    if (titleInput) {
      titleInput.value = '';
      titleInput.focus();
    }

    this.#selectedCustomSignIds = new Set(this.#activePlan.signs || []);
    this.#renderCustomSignsGrid();

    window.addEventListener('keydown', this.#boundHandleKeyDown);
  }

  closeCustomPlanModal() {
    const modal = document.getElementById('customPlanModal');
    if (!modal) return;
    this.#customModalOpen = false;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    window.removeEventListener('keydown', this.#boundHandleKeyDown);
  }

  #renderCustomSignsGrid() {
    const grid = document.getElementById('customPlanSignsGrid');
    if (!grid || !window.SIGNS_DATA) return;
    grid.innerHTML = '';

    const allSigns = [
      ...(window.SIGNS_DATA.words || []),
      ...(window.SIGNS_DATA.letters || [])
    ];

    allSigns.forEach(sign => {
      const isSelected = this.#selectedCustomSignIds.has(sign.id);
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.setAttribute('data-custom-sign', sign.id);
      chip.className = `btn-spring px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between gap-2 border transition ${
        isSelected
          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
          : 'bg-slate-900 border-slate-700/80 text-slate-400 hover:text-slate-200'
      }`;
      chip.innerHTML = `
        <span>${sign.name}</span>
        <span class="w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${
          isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-500'
        }">${isSelected ? '✓' : '+'}</span>
      `;

      chip.addEventListener('click', () => {
        if (this.#selectedCustomSignIds.has(sign.id)) {
          this.#selectedCustomSignIds.delete(sign.id);
        } else {
          this.#selectedCustomSignIds.add(sign.id);
        }
        this.#renderCustomSignsGrid();
      });

      grid.appendChild(chip);
    });

    const countEl = document.getElementById('customPlanSelectedCount');
    if (countEl) {
      countEl.textContent = `${this.#selectedCustomSignIds.size} seleccionadas`;
    }
  }

  #triggerSignSelection(signId) {
    if (typeof this.#onSelectSign === 'function') {
      this.#onSelectSign(signId);
    } else if (typeof window.selectSignById === 'function') {
      window.selectSignById(signId);
    }
  }

  #updateActivePlanHeader() {
    const titleEl = document.getElementById('activePlanTitle');
    if (titleEl) titleEl.textContent = this.#activePlan.title || 'Ruta LSC';

    const progEl = document.getElementById('activePlanProgressText');
    if (progEl) {
      const total = (this.#activePlan.signs || []).length;
      let completedCount = 0;
      if (window.AuthProfileManager) {
        const mastered = new Set(window.AuthProfileManager.getCurrentProfile().masteredSigns || []);
        completedCount = (this.#activePlan.signs || []).filter(s => mastered.has(s)).length;
      }
      const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;
      progEl.textContent = `Paso ${Math.min(this.#currentIndex + 1, total)} de ${total} · ${pct}% completado`;
    }
  }

  #updatePresetPlanChipStyles(activePlanId) {
    const chips = {
      plan_zero_ai: document.getElementById('btnPlanZeroAi'),
      plan_alphabet: document.getElementById('btnPlanAlphabet'),
      plan_words: document.getElementById('btnPlanWords')
    };

    Object.keys(chips).forEach(k => {
      const btn = chips[k];
      if (!btn) return;
      if (k === activePlanId) {
        btn.className = 'btn-spring px-3 py-1 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 shadow-sm transition';
      } else {
        btn.className = 'btn-spring px-3 py-1 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 transition';
      }
    });
  }

  #bindUIEvents() {
    // Chips de planes predefinidos
    const btnZero = document.getElementById('btnPlanZeroAi');
    if (btnZero) btnZero.addEventListener('click', () => this.selectPresetPlan('plan_zero_ai'));

    const btnAlpha = document.getElementById('btnPlanAlphabet');
    if (btnAlpha) btnAlpha.addEventListener('click', () => this.selectPresetPlan('plan_alphabet'));

    const btnWords = document.getElementById('btnPlanWords');
    if (btnWords) btnWords.addEventListener('click', () => this.selectPresetPlan('plan_words'));

    // Botón generar ruta IA
    const btnAi = document.getElementById('btnGenerateAiPlan');
    const inputAi = document.getElementById('aiPlanPromptInput');
    if (btnAi && inputAi) {
      btnAi.addEventListener('click', () => this.generateAIPlanFromPrompt(inputAi.value));
      inputAi.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.generateAIPlanFromPrompt(inputAi.value);
        }
      });
    }

    // Modal constructor de plan
    const btnOpenCustom = document.getElementById('btnOpenCustomPlanModal');
    if (btnOpenCustom) btnOpenCustom.addEventListener('click', () => this.openCustomPlanModal());

    const btnCloseCustom = document.getElementById('btnCloseCustomPlanModal');
    if (btnCloseCustom) btnCloseCustom.addEventListener('click', () => this.closeCustomPlanModal());

    const btnSaveCustom = document.getElementById('btnSaveCustomPlan');
    if (btnSaveCustom) {
      btnSaveCustom.addEventListener('click', () => {
        const titleInput = document.getElementById('customPlanTitleInput');
        const title = titleInput ? titleInput.value : '';
        this.createCustomPlan(title, Array.from(this.#selectedCustomSignIds));
      });
    }
  }

  #handleKeyDown(e) {
    if (e.key === 'Escape' && this.#customModalOpen) {
      this.closeCustomPlanModal();
    }
  }
}

// Instancia global y exposición en window (Reglas 5 y 8)
window.LearningPlanManager = new LearningPlanManager();
