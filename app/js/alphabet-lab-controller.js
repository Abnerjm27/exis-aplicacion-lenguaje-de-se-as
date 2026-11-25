/**
 * Manitas · Proyecto EXIS
 * alphabet-lab-controller.js - Controlador POO del Laboratorio ABC LSC
 * Incluye: Flashcards de Sol, Deletrea tu Nombre, "Tu mano vs. Sol" y Repaso SRS.
 */

class AlphabetLabController {
  #initialized = false;
  #activeTab = 'flashcards';
  #root = null;
  #combo = 0;
  #sessionXp = 0;
  #currentQuiz = null;
  #quizAnswered = false;
  #spellWord = 'SOL';
  #spellIndex = 0;
  #completedSpellIndices = new Set();
  #lastDiagnostics = null;
  #boundFingerListener = null;
  #xpToastText = '';
  #titoMessage = 'Elige una letra o completa tus 3 retos de hoy.';

  init() {
    if (this.#initialized) return this;
    this.#root = document.getElementById('viewAlphabetLab');
    this.#boundFingerListener = (ev) => {
      if (ev && ev.detail && ev.detail.diagnostics) {
        this.#lastDiagnostics = ev.detail.diagnostics;
        if (this.#activeTab === 'spell') {
          this.#updateFingerPanelDOM(ev.detail.diagnostics);
        }
      }
    };
    window.addEventListener('manitas:finger-feedback', this.#boundFingerListener);
    this.#initialized = true;
    return this;
  }

  start() {
    if (!this.#initialized) this.init();
    this.#prepareNextFlashcard();
    this.update();
  }

  update() {
    if (!this.#root) return;
    this.#render();
  }

  reset() {
    this.#combo = 0;
    this.#sessionXp = 0;
    this.#quizAnswered = false;
    this.#completedSpellIndices.clear();
    this.#lastDiagnostics = null;
    this.#prepareNextFlashcard();
    this.update();
  }

  destroy() {
    if (this.#boundFingerListener) {
      window.removeEventListener('manitas:finger-feedback', this.#boundFingerListener);
    }
    this.#initialized = false;
  }

  handlePracticeFrame(score, diagnostics) {
    if (diagnostics) {
      this.#lastDiagnostics = diagnostics;
      if (this.#activeTab === 'spell') {
        this.#updateFingerPanelDOM(diagnostics);
      }
    }
  }

  #getLetters() {
    if (!window.SIGNS_DATA || !Array.isArray(window.SIGNS_DATA.letters)) return [];
    return window.SIGNS_DATA.letters;
  }

  #getLetterById(id) {
    const up = String(id || '').toUpperCase();
    return this.#getLetters().find(l => l.id === up) || null;
  }

  #getSignById(id) {
    if (!window.SIGNS_DATA) return null;
    const all = [...(window.SIGNS_DATA.words || []), ...(window.SIGNS_DATA.letters || [])];
    return all.find(s => s.id === String(id || '').toUpperCase()) || null;
  }

  #getPhotoSrc(sign) {
    if (!sign) return '';
    return sign.solImage || sign.image || '';
  }

  #prepareNextFlashcard() {
    const letters = this.#getLetters();
    if (letters.length < 4) {
      this.#currentQuiz = null;
      return;
    }
    const solPriority = letters.filter(l => Boolean(l.solImage));
    const pool = solPriority.length >= 4 ? solPriority : letters;
    const prevId = this.#currentQuiz ? this.#currentQuiz.target.id : null;
    const candidates = pool.filter(l => l.id !== prevId);
    const target = candidates[Math.floor(Math.random() * candidates.length)] || pool[0];

    const distractors = letters
      .filter(l => l.id !== target.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const options = [target, ...distractors].sort(() => Math.random() - 0.5);
    this.#currentQuiz = { target, options, selectedId: null, isCorrect: false };
    this.#quizAnswered = false;
  }

  #submitFlashcardAnswer(chosenId) {
    if (!this.#currentQuiz || this.#quizAnswered) return;
    this.#quizAnswered = true;
    const target = this.#currentQuiz.target;
    const isCorrect = chosenId === target.id;
    this.#currentQuiz.selectedId = chosenId;
    this.#currentQuiz.isCorrect = isCorrect;

    if (isCorrect) {
      this.#combo += 1;
      const bonus = this.#combo % 3 === 0 ? 10 : 0;
      const gained = 15 + bonus;
      this.#sessionXp += gained;
      if (window.AuthProfileManager && typeof window.AuthProfileManager.recordSignMastered === 'function') {
        window.AuthProfileManager.recordSignMastered(target.id, gained);
      }
      if (window.SRSClient) {
        window.SRSClient.recordAttempt(target.id, true);
      }
      if (window.GamificationManager) {
        window.GamificationManager.playComboChime(this.#combo);
        const gamRes = window.GamificationManager.recordFlashcardResult({
          passed: true,
          combo: this.#combo,
          signId: target.id
        });
        const totalGained = gained + (gamRes.bonusAwarded || 0);
        this.#sessionXp += gamRes.bonusAwarded || 0;
        this.#xpToastText = gamRes.bonusAwarded > 0
          ? `+${totalGained} XP · Retos diarios`
          : (bonus > 0 ? `+${gained} XP · Combo x${this.#combo}` : `+${gained} XP`);
        this.#titoMessage = gamRes.reaction;
      } else {
        this.#xpToastText = `+${gained} XP`;
      }
    } else {
      this.#combo = 0;
      this.#xpToastText = '';
      if (window.SRSClient) {
        window.SRSClient.recordAttempt(target.id, false);
      }
      if (window.GamificationManager) {
        const gamRes = window.GamificationManager.recordFlashcardResult({
          passed: false,
          combo: 0,
          signId: target.id
        });
        this.#titoMessage = gamRes.reaction;
      }
    }
    this.#render();
  }

  #setSpellWord(rawWord) {
    const clean = String(rawWord || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
      .slice(0, 14);
    this.#spellWord = clean || 'SOL';
    this.#spellIndex = 0;
    this.#completedSpellIndices.clear();
    this.#render();
  }

  #practiceLetterInStudio(letterId) {
    if (window.ViewRouter && typeof window.ViewRouter.switchToStudioView === 'function') {
      window.ViewRouter.switchToStudioView(letterId, false);
    } else if (typeof window.selectSignById === 'function') {
      window.selectSignById(letterId);
    }
  }

  #el(tag, cls = '', text = null) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== null) node.textContent = text;
    return node;
  }

  #render() {
    if (!this.#root) return;
    this.#root.replaceChildren();

    const shell = this.#el('div', 'ab-lab-shell');
    shell.appendChild(this.#buildHero());
    shell.appendChild(this.#buildTitoAndMissions());
    shell.appendChild(this.#buildTabBar());

    const panel = this.#el('section', 'ab-panel-card');
    if (this.#activeTab === 'flashcards') {
      panel.appendChild(this.#buildFlashcardsTab());
    } else if (this.#activeTab === 'spell') {
      panel.appendChild(this.#buildSpellTab());
    } else {
      panel.appendChild(this.#buildSrsGalleryTab());
    }
    shell.appendChild(panel);
    this.#root.appendChild(shell);
  }

  #buildHero() {
    const hero = this.#el('header', 'ab-hero-card');
    const left = this.#el('div');
    left.appendChild(this.#el('span', 'ab-eyebrow', 'Abecedario LSC70 · Con Sol'));
    left.appendChild(this.#el('h2', 'ab-title', 'Laboratorio del Abecedario'));
    const lettersCount = this.#getLetters().length;
    left.appendChild(
      this.#el(
        'p',
        'ab-subtitle',
        `Reconoce las ${lettersCount} letras disponibles, deletrea tu nombre y refuerza tus señas pendientes con repaso espaciado.`
      )
    );

    const stats = this.#el('div', 'ab-stats-row');
    const dueCount = window.SRSClient ? window.SRSClient.getDueSigns(3).length : 0;
    const makeStat = (label, val) => {
      const pill = this.#el('div', 'ab-stat-pill');
      pill.appendChild(this.#el('span', 'ab-stat-label', label));
      pill.appendChild(this.#el('span', 'ab-stat-value', val));
      return pill;
    };
    stats.appendChild(makeStat('Combo', `x${this.#combo}`));
    stats.appendChild(makeStat('XP sesión', `+${this.#sessionXp}`));
    stats.appendChild(makeStat('Repaso hoy', `${dueCount} señas`));

    hero.appendChild(left);
    hero.appendChild(stats);
    return hero;
  }

  #buildTabBar() {
    const bar = this.#el('div', 'ab-tablist');
    bar.setAttribute('role', 'tablist');
    bar.setAttribute('aria-label', 'Modos del Laboratorio ABC');

    const tabs = [
      { id: 'flashcards', label: 'Flashcards de Sol' },
      { id: 'spell', label: 'Deletrea tu Nombre' },
      { id: 'srs', label: 'Repaso SRS y ABC' }
    ];

    tabs.forEach(t => {
      const btn = this.#el('button', 'ab-tab-btn', t.label);
      btn.type = 'button';
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', this.#activeTab === t.id ? 'true' : 'false');
      btn.addEventListener('click', () => {
        this.#activeTab = t.id;
        this.#render();
      });
      bar.appendChild(btn);
    });
    return bar;
  }

  #buildFlashcardsTab() {
    const grid = this.#el('div', 'ab-panel-inner ab-panel-inner--split');
    if (!this.#currentQuiz) {
      grid.appendChild(this.#el('p', 'ab-subtitle', 'Cargando catálogo de letras LSC...'));
      return grid;
    }

    const { target, options, selectedId, isCorrect } = this.#currentQuiz;
    const mediaBox = this.#el('div', 'ab-media-frame');
    const img = this.#el('img', 'ab-sol-img');
    img.src = this.#getPhotoSrc(target);
    img.alt = 'Seña del abecedario LSC realizada por el tutor';
    mediaBox.appendChild(img);

    const caption = this.#el('div', 'ab-media-caption');
    caption.appendChild(this.#el('span', '', target.solImage ? 'Referencia ilustrada Sol · LSC70' : 'Referencia LSC70'));
    caption.appendChild(this.#el('span', 'tabular-nums', `Combo actual: x${this.#combo}`));
    mediaBox.appendChild(caption);

    const right = this.#el('div', 'flex flex-col gap-3');
    right.appendChild(this.#el('h3', 'text-base font-extrabold text-slate-900', '¿Qué letra está haciendo Sol?'));
    right.appendChild(this.#el('p', 'text-sm text-slate-600', 'Observa la posición del pulgar, los dedos extendidos y elige la letra correcta.'));

    const optGrid = this.#el('div', 'ab-options-grid');
    options.forEach(opt => {
      let cls = 'ab-option-btn';
      if (this.#quizAnswered) {
        if (opt.id === target.id) cls += ' is-correct';
        else if (opt.id === selectedId) cls += ' is-wrong';
      }
      const btn = this.#el('button', cls, opt.id);
      btn.type = 'button';
      btn.disabled = this.#quizAnswered;
      btn.setAttribute('aria-label', `Letra ${opt.id}`);
      btn.addEventListener('click', () => this.#submitFlashcardAnswer(opt.id));
      optGrid.appendChild(btn);
    });
    right.appendChild(optGrid);

    if (this.#quizAnswered) {
      const fb = this.#el('div', `ab-feedback-banner ${isCorrect ? 'is-ok' : 'is-err'}`);
      const msg = isCorrect
        ? `¡Correcto! Es la letra ${target.id}. ${target.tip}`
        : `Era la letra ${target.id}. Consejo: ${target.tip}`;
      fb.appendChild(this.#el('p', 'font-semibold', msg));
      right.appendChild(fb);

      const actions = this.#el('div', 'flex flex-wrap gap-2');
      const nextBtn = this.#el('button', 'ab-btn ab-btn-primary', 'Siguiente flashcard');
      nextBtn.type = 'button';
      nextBtn.addEventListener('click', () => {
        this.#prepareNextFlashcard();
        this.#render();
      });
      const camBtn = this.#el('button', 'ab-btn ab-btn-secondary', 'Practicar con cámara');
      camBtn.type = 'button';
      camBtn.addEventListener('click', () => this.#practiceLetterInStudio(target.id));
      actions.appendChild(nextBtn);
      actions.appendChild(camBtn);
      right.appendChild(actions);
    }

    grid.appendChild(mediaBox);
    grid.appendChild(right);
    return grid;
  }

  #buildSpellTab() {
    const wrap = this.#el('div', 'ab-panel-inner');

    const form = this.#el('form', 'ab-spell-form');
    const input = this.#el('input', 'ab-input');
    input.type = 'text';
    input.maxLength = 14;
    input.value = this.#spellWord;
    input.placeholder = 'Escribe tu nombre o una palabra (ej. SOL, ANA)';
    input.setAttribute('aria-label', 'Palabra o nombre para deletrear en LSC');

    const goBtn = this.#el('button', 'ab-btn ab-btn-primary', 'Armar secuencia');
    goBtn.type = 'submit';
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.#setSpellWord(input.value);
    });
    form.appendChild(input);
    form.appendChild(goBtn);
    wrap.appendChild(form);

    const presets = this.#el('div', 'flex flex-wrap items-center gap-2');
    presets.appendChild(this.#el('span', 'text-xs font-semibold text-slate-600', 'Sugeridas:'));
    ['SOL', 'ANA', 'CAFE', 'PAPA', 'MANO'].forEach(word => {
      const chip = this.#el('button', 'ab-chip-btn', word);
      chip.type = 'button';
      chip.addEventListener('click', () => this.#setSpellWord(word));
      presets.appendChild(chip);
    });
    wrap.appendChild(presets);

    const chars = Array.from(this.#spellWord);
    const strip = this.#el('div', 'ab-letter-strip');
    chars.forEach((ch, idx) => {
      const letterObj = this.#getLetterById(ch);
      let cls = 'ab-letter-tile';
      if (idx === this.#spellIndex) cls += ' is-active';
      else if (this.#completedSpellIndices.has(idx)) cls += ' is-done';
      if (!letterObj) cls += ' is-unsupported';
      const tile = this.#el('button', cls, ch);
      tile.type = 'button';
      tile.setAttribute('aria-label', `Letra ${ch}, paso ${idx + 1} de ${chars.length}`);
      tile.addEventListener('click', () => {
        this.#spellIndex = idx;
        this.#render();
      });
      strip.appendChild(tile);
    });
    wrap.appendChild(strip);

    const activeChar = chars[this.#spellIndex] || 'S';
    const activeLetter = this.#getLetterById(activeChar);
    const split = this.#el('div', 'ab-panel-inner ab-panel-inner--split');

    const mediaBox = this.#el('div', 'ab-media-frame');
    if (activeLetter) {
      const img = this.#el('img', 'ab-sol-img');
      img.src = this.#getPhotoSrc(activeLetter);
      img.alt = `Referencia Sol para la ${activeLetter.name}`;
      mediaBox.appendChild(img);
      const cap = this.#el('div', 'ab-media-caption');
      cap.appendChild(this.#el('span', '', `${activeLetter.name} · Paso ${this.#spellIndex + 1}/${chars.length}`));
      cap.appendChild(this.#el('span', '', activeLetter.solImage ? 'Foto de Sol' : 'Muestra LSC70'));
      mediaBox.appendChild(cap);
    } else {
      mediaBox.appendChild(
        this.#el(
          'div',
          'p-6 text-center text-sm text-slate-600',
          `La letra "${activeChar}" aún no está en el lote activo de 18 letras (próximamente). Puedes saltarla al siguiente paso.`
        )
      );
    }

    const detail = this.#el('div', 'flex flex-col gap-3');
    detail.appendChild(
      this.#el(
        'h3',
        'text-base font-extrabold text-slate-900',
        activeLetter ? `Deletreando: ${activeLetter.name}` : `Letra "${activeChar}" · Próximamente`
      )
    );
    detail.appendChild(
      this.#el(
        'p',
        'text-sm text-slate-600',
        activeLetter ? activeLetter.tip : 'Tu compañero está preparando esta ilustración de Sol. Salta a la siguiente letra.'
      )
    );

    // Panel "Tu mano vs. Sol"
    const fingerCard = this.#el('div', 'ab-feedback-banner flex flex-col gap-2');
    fingerCard.id = 'alphabetFingerDiagnosticsBox';
    fingerCard.appendChild(this.#el('strong', 'text-xs uppercase tracking-wider text-slate-700', 'Tu mano vs. Sol (5 dedos)'));
    const fingerGrid = this.#el('div', 'ab-finger-grid');
    fingerGrid.id = 'alphabetFingerGrid';
    fingerCard.appendChild(fingerGrid);
    const fingerHint = this.#el('p', 'text-xs font-semibold text-slate-700');
    fingerHint.id = 'alphabetFingerHint';
    fingerCard.appendChild(fingerHint);
    detail.appendChild(fingerCard);

    const actions = this.#el('div', 'flex flex-wrap gap-2');
    if (activeLetter) {
      const camBtn = this.#el('button', 'ab-btn ab-btn-primary', 'Practicar esta letra con cámara');
      camBtn.type = 'button';
      camBtn.addEventListener('click', () => this.#practiceLetterInStudio(activeLetter.id));
      actions.appendChild(camBtn);
    }
    const nextStepBtn = this.#el('button', 'ab-btn ab-btn-secondary', 'Siguiente letra (sin cámara)');
    nextStepBtn.type = 'button';
    nextStepBtn.addEventListener('click', () => {
      this.#completedSpellIndices.add(this.#spellIndex);
      if (activeLetter && window.SRSClient) {
        window.SRSClient.recordAttempt(activeLetter.id, true);
      }
      if (this.#spellIndex + 1 < chars.length) {
        this.#spellIndex += 1;
      } else {
        this.#sessionXp += 20;
        if (window.AuthProfileManager && activeLetter) {
          window.AuthProfileManager.recordSignMastered(activeLetter.id, 20);
        }
        if (window.GamificationManager) {
          window.GamificationManager.playComboChime(3);
          const gamRes = window.GamificationManager.recordWordSpelled(this.#spellWord);
          this.#sessionXp += gamRes.bonusAwarded || 0;
          this.#xpToastText = gamRes.bonusAwarded > 0
            ? `+${20 + gamRes.bonusAwarded} XP · Retos diarios`
            : '+20 XP · Palabra completa';
          this.#titoMessage = gamRes.reaction;
        }
        this.#spellIndex = 0;
      }
      this.#render();
    });
    actions.appendChild(nextStepBtn);
    detail.appendChild(actions);

    split.appendChild(mediaBox);
    split.appendChild(detail);
    wrap.appendChild(split);

    setTimeout(() => {
      const diag = this.#lastDiagnostics && activeLetter && this.#lastDiagnostics.signId === activeLetter.id
        ? this.#lastDiagnostics
        : null;
      this.#updateFingerPanelDOM(diag, activeLetter ? activeLetter.id : null);
    }, 0);

    return wrap;
  }

  #updateFingerPanelDOM(diagnostics, fallbackSignId = null) {
    const grid = document.getElementById('alphabetFingerGrid');
    const hintEl = document.getElementById('alphabetFingerHint');
    if (!grid || !hintEl) return;
    grid.replaceChildren();

    const labels = { thumb: 'Pulgar', index: 'Índice', middle: 'Medio', ring: 'Anular', pinky: 'Meñique' };
    const expectedProfile = fallbackSignId && window.FingerFeedbackEngine
      ? window.FingerFeedbackEngine.constructor.LETTER_PROFILES[fallbackSignId]
      : null;

    Object.keys(labels).forEach(key => {
      const f = diagnostics && diagnostics.fingers ? diagnostics.fingers[key] : null;
      const pill = this.#el('div', `ab-finger-pill ${f ? (f.ok ? 'is-ok' : 'is-adjust') : ''}`);
      pill.appendChild(this.#el('span', 'font-bold', labels[key]));
      let statusText = 'Listo';
      if (f) {
        statusText = f.ok ? 'Correcto' : (f.action === 'extend' ? 'Extender' : (f.action === 'pinch' ? 'Pinza' : 'Doblar'));
      } else if (expectedProfile) {
        const exp = expectedProfile[key];
        statusText = exp === 'extended' ? 'Extendido' : (exp === 'down' ? 'Hacia abajo' : (exp === 'pinch' ? 'En aro' : 'Recogido'));
      }
      pill.appendChild(this.#el('span', '', statusText));
      grid.appendChild(pill);
    });

    hintEl.textContent = diagnostics
      ? `${diagnostics.matchedCount}/5 dedos · ${diagnostics.primaryHint}`
      : 'Activa la cámara en Práctica Libre para comparar tus 5 dedos en vivo contra Sol.';
  }

  #buildMasteryBar(boxLevel) {
    const tierInfo = window.GamificationManager
      ? window.GamificationManager.getMasteryTier(boxLevel)
      : { level: Math.max(1, Math.min(5, Number(boxLevel) || 1)), tier: 'bronze', label: 'Bronce' };

    const row = this.#el('div', 'ab-mastery-row');
    const segs = this.#el('div', 'ab-mastery-segments');
    segs.setAttribute('aria-label', `Maestría ${tierInfo.label}, nivel ${tierInfo.level} de 5`);
    for (let i = 1; i <= 5; i++) {
      const filled = i <= tierInfo.level;
      const seg = this.#el('span', filled ? `ab-seg is-${tierInfo.tier}` : 'ab-seg');
      segs.appendChild(seg);
    }
    const tag = this.#el('span', `ab-tier-tag ${tierInfo.tier === 'gold' ? 'is-gold' : ''}`, tierInfo.label);
    row.appendChild(segs);
    row.appendChild(tag);
    return row;
  }

  #buildTitoAndMissions() {
    const wrap = this.#el('div', 'flex flex-col gap-3');
    const gamState = window.GamificationManager ? window.GamificationManager.getState() : null;

    const titoBar = this.#el('div', 'ab-tito-bar');
    const bubble = this.#el('div', 'ab-tito-bubble');
    const avatar = this.#el('img', 'w-7 h-7 object-contain shrink-0');
    avatar.src = 'img/zorrito/svg/zorrito_saludo.svg';
    avatar.alt = 'Tito Tutor LSC';
    bubble.appendChild(avatar);
    const msg = this.#titoMessage || (gamState ? gamState.lastReaction : '');
    bubble.appendChild(this.#el('span', '', `Tito: ${msg}`));

    const rightPills = this.#el('div', 'flex items-center gap-2 shrink-0');
    if (gamState) {
      rightPills.appendChild(
        this.#el('span', 'font-mono text-xs font-bold text-slate-700 tabular-nums', `${gamState.unlockedCount}/${gamState.totalBadges} insignias`)
      );
    }
    const toast = this.#el('span', `ab-xp-toast ${this.#xpToastText ? '' : 'is-idle'}`, this.#xpToastText || '+0 XP');
    rightPills.appendChild(toast);
    titoBar.appendChild(bubble);
    titoBar.appendChild(rightPills);
    wrap.appendChild(titoBar);

    if (gamState) {
      const strip = this.#el('section', 'ab-missions-strip');
      strip.setAttribute('aria-label', '3 retos diarios de Tito');
      const head = this.#el('div', 'flex flex-wrap items-center justify-between gap-2');
      const doneCount = gamState.missions.filter(m => m.done).length;
      head.appendChild(this.#el('h3', 'text-xs font-extrabold uppercase tracking-wider text-slate-700', '3 retos de Tito (Hoy)'));
      head.appendChild(
        this.#el(
          'span',
          'font-mono text-xs font-bold text-amber-800 tabular-nums',
          gamState.dailyBonusClaimed ? '3/3 completados · +40 XP' : `${doneCount}/3 · Bono +40 XP`
        )
      );
      strip.appendChild(head);

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
      strip.appendChild(grid);
      wrap.appendChild(strip);
    }

    return wrap;
  }

  #buildSrsGalleryTab() {
    const wrap = this.#el('div', 'ab-panel-inner');

    wrap.appendChild(this.#el('h3', 'text-base font-extrabold text-slate-900', 'Repaso inteligente para hoy (SRS Leitner)'));
    const dueList = window.SRSClient ? window.SRSClient.getDueSigns(3) : [];
    const srsGrid = this.#el('div', 'ab-srs-grid');

    dueList.forEach(item => {
      const sign = this.#getSignById(item.signId);
      const card = this.#el('article', 'ab-srs-card');
      card.appendChild(this.#el('span', 'text-xs font-mono font-bold text-amber-800', `Caja ${item.box}/5 · ${item.reason}`));
      card.appendChild(this.#el('h4', 'text-base font-extrabold text-slate-900', sign ? sign.name : item.signId));
      card.appendChild(this.#buildMasteryBar(item.box));
      card.appendChild(this.#el('p', 'text-xs text-slate-600', sign ? sign.tip : 'Practica esta seña para subir de nivel.'));

      const btn = this.#el('button', 'ab-btn ab-btn-primary', 'Repasar ahora');
      btn.type = 'button';
      btn.addEventListener('click', () => this.#practiceLetterInStudio(item.signId));
      card.appendChild(btn);
      srsGrid.appendChild(card);
    });
    wrap.appendChild(srsGrid);

    const gamState = window.GamificationManager ? window.GamificationManager.getState() : null;
    if (gamState) {
      wrap.appendChild(
        this.#el('h3', 'text-base font-extrabold text-slate-900 mt-2', `Insignias de maestría (${gamState.unlockedCount}/${gamState.totalBadges})`)
      );
      const badgesRow = this.#el('div', 'ab-badges-row');
      gamState.badges.forEach(b => {
        const pill = this.#el('div', `ab-badge-pill ${b.unlocked ? 'is-unlocked' : ''}`);
        pill.appendChild(this.#el('span', 'text-xs font-extrabold', `${b.unlocked ? '✓ ' : ''}${b.title}`));
        pill.appendChild(this.#el('span', 'text-[11px] opacity-85', b.desc));
        badgesRow.appendChild(pill);
      });
      wrap.appendChild(badgesRow);
    }

    const letters = this.#getLetters();
    wrap.appendChild(this.#el('h3', 'text-base font-extrabold text-slate-900 mt-2', `Catálogo del Abecedario (${letters.length} letras)`));
    const gal = this.#el('div', 'ab-gallery-grid');

    letters.forEach(letter => {
      const stat = window.SRSClient ? window.SRSClient.getSignStat(letter.id) : { box: 1, masteryPct: 0 };
      const card = this.#el('button', 'ab-gallery-card');
      card.type = 'button';
      card.setAttribute('aria-label', `Practicar ${letter.name}`);

      const img = this.#el('img', 'ab-gallery-thumb');
      img.src = this.#getPhotoSrc(letter);
      img.alt = letter.name;
      img.loading = 'lazy';
      card.appendChild(img);

      const meta = this.#el('div', 'flex items-center justify-between w-full');
      meta.appendChild(this.#el('span', 'font-extrabold text-sm text-slate-900', letter.id));
      meta.appendChild(this.#el('span', 'font-mono text-[11px] font-bold text-slate-600 tabular-nums', `N${stat.box}`));
      card.appendChild(meta);
      card.appendChild(this.#buildMasteryBar(stat.box));

      card.addEventListener('click', () => this.#practiceLetterInStudio(letter.id));
      gal.appendChild(card);
    });
    wrap.appendChild(gal);

    return wrap;
  }
}

window.AlphabetLabController = new AlphabetLabController();
