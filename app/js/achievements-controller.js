/**
 * Manitas · Proyecto EXIS
 * achievements-controller.js - Controlador POO de la Vitrina de Logros y Medallas LSC
 */

class AchievementsController {
  #initialized = false;
  #root = null;
  #activeCategory = 'all';
  #toastQueue = [];
  #toastActive = false;
  #toastTimer = null;
  #boundBadgeHandler = null;

  init() {
    if (this.#initialized) return this;
    this.#root = document.getElementById('viewAchievements');
    this.#boundBadgeHandler = (event) => {
      const badges = event && event.detail && Array.isArray(event.detail.badges)
        ? event.detail.badges
        : [];
      if (badges.length === 0) return;
      this.#toastQueue.push(...badges);
      if (this.#root && !this.#root.classList.contains('hidden')) {
        this.update();
      }
      this.#processToastQueue();
    };
    window.addEventListener('manitas:badge-unlocked', this.#boundBadgeHandler);
    this.#initialized = true;
    return this;
  }

  start() {
    if (!this.#initialized) this.init();
    this.update();
  }

  update() {
    if (!this.#root) return;
    this.#render();
  }

  reset() {
    this.update();
  }

  destroy() {
    if (this.#boundBadgeHandler) {
      window.removeEventListener('manitas:badge-unlocked', this.#boundBadgeHandler);
      this.#boundBadgeHandler = null;
    }
    if (this.#toastTimer) {
      clearTimeout(this.#toastTimer);
      this.#toastTimer = null;
    }
    this.#toastQueue = [];
    this.#toastActive = false;
    const existing = document.getElementById('achBadgeToastStack');
    if (existing) existing.remove();
    this.#initialized = false;
  }

  showUnlockToast(badge) {
    if (!badge || typeof document === 'undefined') return;
    let stack = document.getElementById('achBadgeToastStack');
    if (!stack) {
      stack = this.#el('div', 'ach-toast-stack');
      stack.id = 'achBadgeToastStack';
      stack.setAttribute('role', 'status');
      stack.setAttribute('aria-live', 'polite');
      document.body.appendChild(stack);
    }

    stack.replaceChildren();
    const card = this.#el('div', 'ach-toast-card');

    const imgWrap = this.#el('div', 'ach-toast-medal');
    const img = document.createElement('img');
    img.src = badge.image || 'img/badges/badge_first_word.png';
    img.alt = badge.title || 'Medalla desbloqueada';
    imgWrap.appendChild(img);
    card.appendChild(imgWrap);

    const copy = this.#el('div', 'ach-toast-copy');
    copy.appendChild(this.#el('span', 'ach-toast-eyebrow', '¡Nuevo logro desbloqueado!'));
    copy.appendChild(this.#el('h4', 'ach-toast-title', badge.title || 'Medalla LSC'));
    copy.appendChild(this.#el('p', 'ach-toast-desc', badge.desc || 'Seguiste avanzando en Manitas LSC.'));

    const actions = this.#el('div', 'ach-toast-actions');
    const btnView = this.#el('button', 'ach-toast-cta', 'Ver Logros');
    btnView.type = 'button';
    btnView.addEventListener('click', () => {
      this.#dismissActiveToast();
      if (window.ViewRouter && typeof window.ViewRouter.showScreen === 'function') {
        window.ViewRouter.showScreen('achievements');
      }
    });
    actions.appendChild(btnView);
    copy.appendChild(actions);
    card.appendChild(copy);

    const closeBtn = this.#el('button', 'ach-toast-close', '✕');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Cerrar notificación de logro');
    closeBtn.addEventListener('click', () => this.#dismissActiveToast());
    card.appendChild(closeBtn);

    stack.appendChild(card);

    if (window.GamificationManager && typeof window.GamificationManager.playComboChime === 'function') {
      window.GamificationManager.playComboChime(3);
    }
  }

  #processToastQueue() {
    if (this.#toastActive || this.#toastQueue.length === 0) return;
    const nextBadge = this.#toastQueue.shift();
    if (!nextBadge) return;
    this.#toastActive = true;
    this.showUnlockToast(nextBadge);
    this.#toastTimer = setTimeout(() => {
      this.#dismissActiveToast();
    }, 5500);
  }

  #dismissActiveToast() {
    if (this.#toastTimer) {
      clearTimeout(this.#toastTimer);
      this.#toastTimer = null;
    }
    const stack = document.getElementById('achBadgeToastStack');
    if (stack) stack.replaceChildren();
    this.#toastActive = false;
    if (this.#toastQueue.length > 0) {
      setTimeout(() => this.#processToastQueue(), 180);
    } else if (stack) {
      stack.remove();
    }
  }

  #el(tag, cls = '', text = null) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== null) node.textContent = text;
    return node;
  }

  #computeAlphabetTierSummary() {
    const letters = (window.SIGNS_DATA && Array.isArray(window.SIGNS_DATA.letters))
      ? window.SIGNS_DATA.letters
      : [];
    let bronze = 0;
    let silver = 0;
    let gold = 0;

    letters.forEach(l => {
      const stat = window.SRSClient ? window.SRSClient.getSignStat(l.id) : { box: 1 };
      const tier = window.GamificationManager
        ? window.GamificationManager.getMasteryTier(stat.box)
        : { tier: 'bronze' };
      if (tier.tier === 'gold') gold += 1;
      else if (tier.tier === 'silver') silver += 1;
      else bronze += 1;
    });

    return { total: letters.length, bronze, silver, gold };
  }

  #render() {
    if (!this.#root) return;
    this.#root.replaceChildren();

    const gamState = window.GamificationManager ? window.GamificationManager.getState() : null;
    const profile = (window.AuthProfileManager && typeof window.AuthProfileManager.getCurrentProfile === 'function')
      ? window.AuthProfileManager.getCurrentProfile()
      : { xp: 0, level: 'Principiante', streak: 1 };

    const shell = this.#el('div', 'ach-shell');
    shell.appendChild(this.#buildHero(gamState, profile));
    if (gamState) {
      shell.appendChild(this.#buildMedalsSection(gamState));
      shell.appendChild(this.#buildMissionsSection(gamState));
    }
    shell.appendChild(this.#buildAlphabetMasterySection());

    this.#root.appendChild(shell);
  }

  #buildHero(gamState, profile) {
    const hero = this.#el('header', 'ach-hero-card');
    const left = this.#el('div');
    left.appendChild(this.#el('span', 'ab-eyebrow', 'Colección Manitas · LSC70'));
    left.appendChild(this.#el('h2', 'ab-title', 'Vitrina de Logros y Medallas'));
    left.appendChild(
      this.#el(
        'p',
        'ab-subtitle',
        'Desbloquea cada medalla practicando en el Laboratorio ABC, completando palabras con tu cámara y subiendo tus señas a Oro.'
      )
    );

    const right = this.#el('div', 'flex flex-wrap items-center gap-2.5');
    const makePill = (label, val) => {
      const pill = this.#el('div', 'ab-stat-pill');
      pill.appendChild(this.#el('span', 'ab-stat-label', label));
      pill.appendChild(this.#el('span', 'ab-stat-value', val));
      return pill;
    };
    const unlocked = gamState ? gamState.unlockedCount : 0;
    const totalBadges = gamState ? gamState.totalBadges : 12;
    right.appendChild(makePill('Medallas', `${unlocked}/${totalBadges}`));
    right.appendChild(makePill('XP Total', `${Number(profile.xp) || 0} XP`));
    right.appendChild(makePill('Nivel', profile.level || 'Principiante'));

    const btnPractice = this.#el('button', 'ab-btn ab-btn-primary', 'Ir al Laboratorio ABC');
    btnPractice.type = 'button';
    btnPractice.addEventListener('click', () => {
      if (window.ViewRouter && typeof window.ViewRouter.switchToAlphabetLabView === 'function') {
        window.ViewRouter.switchToAlphabetLabView();
      }
    });
    right.appendChild(btnPractice);

    hero.appendChild(left);
    hero.appendChild(right);
    return hero;
  }

  #buildMedalsSection(gamState) {
    const section = this.#el('section', 'ach-section-card');
    section.setAttribute('aria-label', 'Medallas de maestría');

    const head = this.#el('div', 'flex flex-wrap items-center justify-between gap-2');
    head.appendChild(this.#el('h3', 'text-base font-extrabold text-slate-900', 'Medallas de Maestría'));
    head.appendChild(
      this.#el(
        'span',
        'font-mono text-xs font-bold text-slate-600 tabular-nums',
        `${gamState.unlockedCount} de ${gamState.totalBadges} desbloqueadas`
      )
    );
    section.appendChild(head);

    const filterBar = this.#el('div', 'ach-filter-bar');
    filterBar.setAttribute('role', 'tablist');
    filterBar.setAttribute('aria-label', 'Filtrar medallas por categoría');
    const categories = [
      { id: 'all', label: `Todas (${gamState.totalBadges})` },
      { id: 'alphabet', label: 'Abecedario' },
      { id: 'practice', label: 'Práctica' },
      { id: 'mastery', label: 'Maestría' }
    ];
    categories.forEach(cat => {
      const btn = this.#el('button', 'ach-filter-btn', cat.label);
      btn.type = 'button';
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', this.#activeCategory === cat.id ? 'true' : 'false');
      btn.addEventListener('click', () => {
        this.#activeCategory = cat.id;
        this.#render();
      });
      filterBar.appendChild(btn);
    });
    section.appendChild(filterBar);

    const filteredBadges = this.#activeCategory === 'all'
      ? gamState.badges
      : gamState.badges.filter(b => b.category === this.#activeCategory);

    const grid = this.#el('div', 'ach-medals-grid');
    filteredBadges.forEach(b => {
      const card = this.#el('article', `ach-medal-card ${b.unlocked ? '' : 'is-locked'}`);

      const frame = this.#el('div', 'ach-medal-frame');
      const img = this.#el('img', 'ach-medal-img');
      img.src = b.image || 'img/badges/badge_vowels_lsc.png';
      img.alt = `Medalla ${b.title}`;
      img.loading = 'lazy';
      frame.appendChild(img);
      card.appendChild(frame);

      const body = this.#el('div', 'ach-medal-body');
      body.appendChild(
        this.#el(
          'span',
          `ach-status-pill ${b.unlocked ? 'is-unlocked' : 'is-locked'}`,
          b.unlocked ? 'Desbloqueada' : 'Por desbloquear'
        )
      );
      body.appendChild(this.#el('h4', 'text-base font-extrabold text-slate-900', b.title));
      body.appendChild(this.#el('p', 'text-xs text-slate-600', b.desc));
      if (!b.unlocked && b.progressText) {
        body.appendChild(this.#el('span', 'ach-progress-hint', `Progreso: ${b.progressText}`));
      }
      card.appendChild(body);
      grid.appendChild(card);
    });
    section.appendChild(grid);
    return section;
  }

  #buildMissionsSection(gamState) {
    const section = this.#el('section', 'ach-section-card');
    section.setAttribute('aria-label', '3 retos diarios de Tito');

    const head = this.#el('div', 'flex flex-wrap items-center justify-between gap-2');
    const doneCount = gamState.missions.filter(m => m.done).length;
    head.appendChild(this.#el('h3', 'text-base font-extrabold text-slate-900', '3 Retos de Tito (Hoy)'));
    head.appendChild(
      this.#el(
        'span',
        'font-mono text-xs font-bold text-amber-800 tabular-nums',
        gamState.dailyBonusClaimed ? '3/3 completados · +40 XP' : `${doneCount}/3 · Bono +40 XP`
      )
    );
    section.appendChild(head);

    const grid = this.#el('div', 'ab-missions-grid');
    gamState.missions.forEach(m => {
      const card = this.#el('div', `ab-mission-card ${m.done ? 'is-done' : ''}`);
      const mh = this.#el('div', 'ab-mission-head');
      mh.appendChild(this.#el('span', '', m.title));
      mh.appendChild(this.#el('span', 'font-mono tabular-nums text-xs', `${m.current}/${m.target}`));
      card.appendChild(mh);
      const bar = this.#el('div', 'ab-mission-bar');
      const fill = this.#el('div', 'ab-mission-fill');
      fill.style.width = `${Math.round((m.current / m.target) * 100)}%`;
      bar.appendChild(fill);
      card.appendChild(bar);
      grid.appendChild(card);
    });
    section.appendChild(grid);
    return section;
  }

  #buildAlphabetMasterySection() {
    const section = this.#el('section', 'ach-section-card');
    section.setAttribute('aria-label', 'Maestría del Abecedario por niveles');

    const summary = this.#computeAlphabetTierSummary();
    section.appendChild(
      this.#el('h3', 'text-base font-extrabold text-slate-900', `Progreso del Abecedario (${summary.total} letras)`)
    );

    const grid = this.#el('div', 'ach-tiers-grid');
    const makeTier = (title, count, desc, isGold = false) => {
      const card = this.#el('div', `ach-tier-card ${isGold ? 'is-gold' : ''}`);
      card.appendChild(this.#el('span', 'ab-stat-label', title));
      card.appendChild(this.#el('span', 'ab-stat-value', `${count} / ${summary.total}`));
      card.appendChild(this.#el('span', 'text-xs text-slate-600', desc));
      return card;
    };

    grid.appendChild(makeTier('Nivel Bronce', summary.bronze, 'Cajas 1–2 · En aprendizaje'));
    grid.appendChild(makeTier('Nivel Plata', summary.silver, 'Cajas 3–4 · Buen dominio'));
    grid.appendChild(makeTier('Nivel Oro', summary.gold, 'Caja 5 · Dominio total', true));

    section.appendChild(grid);
    return section;
  }
}

window.AchievementsController = new AchievementsController();
