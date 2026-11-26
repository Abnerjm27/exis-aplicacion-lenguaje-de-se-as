/**
 * Manitas · Proyecto EXIS
 * blind-spell-session.js - Gestor POO de sesión de Reto a Ciegas en Deletrea tu Nombre
 * Evalúa cada letra sin guía visual, con cronómetro por letra, aciertos/fallos y resumen final.
 */

class BlindSpellSession {
  static DEFAULT_SECONDS_PER_LETTER = 12;

  #active = false;
  #finished = false;
  #word = '';
  #chars = [];
  #index = 0;
  #results = [];
  #secondsPerLetter = BlindSpellSession.DEFAULT_SECONDS_PER_LETTER;
  #secondsLeft = BlindSpellSession.DEFAULT_SECONDS_PER_LETTER;
  #timerId = null;
  #onTick = null;
  #onTimeout = null;
  #onComplete = null;

  constructor(options = {}) {
    this.init(options);
  }

  init(options = {}) {
    if (typeof options.secondsPerLetter === 'number' && options.secondsPerLetter > 0) {
      this.#secondsPerLetter = Math.round(options.secondsPerLetter);
    }
    if (typeof options.onTick === 'function') this.#onTick = options.onTick;
    if (typeof options.onTimeout === 'function') this.#onTimeout = options.onTimeout;
    if (typeof options.onComplete === 'function') this.#onComplete = options.onComplete;
    return this;
  }

  start(word, _supportedSet = null) {
    this.#stopTimer();
    const clean = String(word || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z]/g, '');
    this.#word = clean || 'SOL';
    this.#chars = Array.from(this.#word);
    this.#index = 0;
    this.#results = this.#chars.map((char, index) => ({
      char,
      index,
      status: 'pending',
      score: 0
    }));
    this.#secondsLeft = this.#secondsPerLetter;
    this.#active = true;
    this.#finished = false;

    this.#startTimer();
    return this.getState();
  }

  update() {
    if (!this.#active || this.#finished) return this.getState();
    if (this.#secondsLeft <= 1) {
      this.#secondsLeft = 0;
      const failedChar = this.#chars[this.#index] || '';
      const stepRes = this.recordLetterResult(false, 0);
      if (this.#onTimeout) {
        try { this.#onTimeout({ char: failedChar, ...stepRes }); } catch (_) {}
      }
      return this.getState();
    }
    this.#secondsLeft -= 1;
    if (this.#onTick) {
      try { this.#onTick(this.#secondsLeft, this.#index); } catch (_) {}
    }
    return this.getState();
  }

  reset() {
    this.#stopTimer();
    this.#active = false;
    this.#finished = false;
    this.#word = '';
    this.#chars = [];
    this.#index = 0;
    this.#results = [];
    this.#secondsLeft = this.#secondsPerLetter;
    return this.getState();
  }

  destroy() {
    this.reset();
    this.#onTick = null;
    this.#onTimeout = null;
    this.#onComplete = null;
  }

  isActive() {
    return this.#active && !this.#finished;
  }

  isFinished() {
    return this.#finished;
  }

  recordLetterResult(passed, score = 0) {
    if (!this.#active || this.#finished || this.#index >= this.#results.length) {
      return { finished: this.#finished, nextIndex: this.#index, summary: this.getSummary() };
    }
    const cleanScore = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));
    this.#results[this.#index] = {
      ...this.#results[this.#index],
      status: passed ? 'passed' : 'failed',
      score: passed ? Math.max(85, cleanScore) : cleanScore
    };
    return this.#advanceOrFinish();
  }

  skipUnsupported() {
    if (!this.#active || this.#finished || this.#index >= this.#results.length) {
      return { finished: this.#finished, nextIndex: this.#index, summary: this.getSummary() };
    }
    this.#results[this.#index] = {
      ...this.#results[this.#index],
      status: 'skipped',
      score: 0
    };
    return this.#advanceOrFinish();
  }

  #advanceOrFinish() {
    const nextIdx = this.#index + 1;
    if (nextIdx >= this.#chars.length) {
      this.#stopTimer();
      this.#active = false;
      this.#finished = true;
      const summary = this.getSummary();
      if (this.#onComplete) {
        try { this.#onComplete(summary); } catch (_) {}
      }
      return { finished: true, nextIndex: this.#index, summary };
    }
    this.#index = nextIdx;
    this.#secondsLeft = this.#secondsPerLetter;
    return { finished: false, nextIndex: this.#index, summary: this.getSummary() };
  }

  #startTimer() {
    if (typeof setInterval !== 'function') return;
    this.#timerId = setInterval(() => {
      this.update();
    }, 1000);
  }

  #stopTimer() {
    if (this.#timerId) {
      clearInterval(this.#timerId);
      this.#timerId = null;
    }
  }

  getSummary() {
    const resultsCopy = this.#results.map(r => ({ ...r }));
    const evaluated = resultsCopy.filter(r => r.status === 'passed' || r.status === 'failed');
    const passedCount = evaluated.filter(r => r.status === 'passed').length;
    const failedCount = evaluated.filter(r => r.status === 'failed').length;
    const skippedCount = resultsCopy.filter(r => r.status === 'skipped').length;
    const totalEvaluated = evaluated.length;
    const scorePct = totalEvaluated > 0 ? Math.round((passedCount / totalEvaluated) * 100) : 0;
    const failedIndices = resultsCopy.filter(r => r.status === 'failed').map(r => r.index);
    return {
      word: this.#word,
      totalEvaluated,
      passedCount,
      failedCount,
      skippedCount,
      scorePct,
      passedChallenge: totalEvaluated > 0 && scorePct >= 60,
      failedIndices,
      results: resultsCopy
    };
  }

  getState() {
    return {
      active: this.#active,
      finished: this.#finished,
      word: this.#word,
      chars: [...this.#chars],
      index: this.#index,
      secondsLeft: this.#secondsLeft,
      results: this.#results.map(r => ({ ...r })),
      summary: this.getSummary()
    };
  }

  static renderPromptBox(elFn, activeChar, stepIndex, totalSteps, secondsLeft) {
    const box = elFn('div', 'ab-blind-card');
    box.appendChild(elFn('span', 'text-xs font-mono font-bold uppercase tracking-wider text-amber-800', `Reto a ciegas · ${stepIndex + 1}/${totalSteps}`));
    box.appendChild(elFn('div', 'ab-blind-letter', activeChar));
    const timer = elFn('div', 'ab-blind-timer', `${secondsLeft}s`);
    timer.id = 'alphabetBlindTimer';
    box.appendChild(timer);
    box.appendChild(elFn('p', 'text-xs text-slate-600 text-center', 'Sin foto ni pistas visuales. Demuéstrala frente a cámara.'));
    return box;
  }

  static renderSummaryCard(elFn, summary, { onRetry, onPracticeFailed } = {}) {
    const card = elFn('div', 'ab-blind-summary');
    const badgeCls = summary.passedChallenge ? 'is-ok' : 'is-err';
    card.appendChild(elFn('span', `ab-blind-verdict ${badgeCls}`, summary.passedChallenge ? '¡Reto Superado!' : 'Sigue Practicando'));
    card.appendChild(elFn('h3', 'text-xl font-extrabold text-slate-900', `${summary.word}: ${summary.passedCount}/${summary.totalEvaluated} correctas (${summary.scorePct}%)`));

    const row = elFn('div', 'flex flex-wrap justify-center gap-2');
    summary.results.forEach(r => {
      const icon = r.status === 'passed' ? '✓' : (r.status === 'failed' ? '✗' : '–');
      const cls = r.status === 'passed' ? 'is-done' : (r.status === 'failed' ? 'is-failed' : 'is-unsupported');
      row.appendChild(elFn('span', `ab-letter-tile ${cls}`, `${r.char} ${icon}`));
    });
    card.appendChild(row);

    const btns = elFn('div', 'flex flex-wrap justify-center gap-2 mt-1');
    const retryBtn = elFn('button', 'ab-btn ab-btn-primary', 'Repetir Reto a Ciegas');
    retryBtn.type = 'button';
    if (typeof onRetry === 'function') retryBtn.addEventListener('click', onRetry);
    btns.appendChild(retryBtn);

    if (summary.failedIndices.length > 0 && typeof onPracticeFailed === 'function') {
      const practiceBtn = elFn('button', 'ab-btn ab-btn-secondary', 'Practicar letras falladas (Guiado)');
      practiceBtn.type = 'button';
      practiceBtn.addEventListener('click', () => onPracticeFailed(summary.failedIndices[0]));
      btns.appendChild(practiceBtn);
    }
    card.appendChild(btns);
    return card;
  }

  static #createEyeIconSvg(isBlind) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '15');
    svg.setAttribute('height', '15');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2.2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    const paths = isBlind
      ? [
          'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94',
          'M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19',
          'M14.12 14.12a3 3 0 1 1-4.24-4.24',
          'M1 1l22 22'
        ]
      : [
          'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z'
        ];
    paths.forEach(d => {
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', d);
      svg.appendChild(p);
    });
    if (!isBlind) {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', '12');
      c.setAttribute('cy', '12');
      c.setAttribute('r', '3');
      svg.appendChild(c);
    }
    return svg;
  }

  static renderModeToggle(elFn, isBlind, onToggle) {
    const row = elFn('div', 'ab-mode-toggle');
    row.setAttribute('role', 'group');
    row.setAttribute('aria-label', 'Modalidad de Deletrea tu Nombre');
    [
      { blind: false, label: 'Modo Guiado' },
      { blind: true, label: 'Reto a Ciegas' }
    ].forEach(opt => {
      const active = opt.blind === Boolean(isBlind);
      const btn = elFn('button', `ab-mode-btn ${active ? 'is-active' : ''}`);
      btn.type = 'button';
      btn.setAttribute('aria-pressed', String(active));
      btn.appendChild(BlindSpellSession.#createEyeIconSvg(opt.blind));
      btn.appendChild(elFn('span', '', opt.label));
      btn.addEventListener('click', () => onToggle(opt.blind));
      row.appendChild(btn);
    });
    return row;
  }

  static renderLetterStrip(elFn, { chars, activeIndex, isBlind, blindState, hasSummary, completedSet, getLetterById, onSelect }) {
    const strip = elFn('div', 'ab-letter-strip');
    chars.forEach((ch, idx) => {
      const letterObj = getLetterById(ch);
      const bRes = blindState ? blindState.results[idx] : null;
      let cls = 'ab-letter-tile';
      if (isBlind && bRes) {
        if (idx === activeIndex && !hasSummary) cls += ' is-active';
        else if (bRes.status === 'passed') cls += ' is-done';
        else if (bRes.status === 'failed') cls += ' is-failed';
      } else {
        if (idx === activeIndex) cls += ' is-active';
        else if (completedSet.has(idx)) cls += ' is-done';
      }
      if (!letterObj) cls += ' is-unsupported';
      const label = (bRes && bRes.status === 'passed') ? `${ch} ✓` : ((bRes && bRes.status === 'failed') ? `${ch} ✗` : ch);
      const tile = elFn('button', cls, label);
      tile.type = 'button';
      tile.disabled = Boolean(isBlind && blindState && blindState.active);
      tile.setAttribute('aria-label', `Letra ${ch}, paso ${idx + 1} de ${chars.length}`);
      tile.addEventListener('click', () => onSelect(idx, ch));
      strip.appendChild(tile);
    });
    return strip;
  }

  static renderCameraBox(elFn, { cameraActive, lastScore, onDeviceChange }) {
    const fragment = document.createDocumentFragment();

    const camStage = elFn('div', 'ab-cam-stage');
    const camVideo = elFn('video', 'ab-cam-video');
    camVideo.id = 'alphabetSpellWebcamVideo';
    camVideo.autoplay = true;
    camVideo.playsInline = true;
    camVideo.muted = true;
    camStage.appendChild(camVideo);

    const camCanvas = elFn('canvas', 'ab-cam-overlay');
    camCanvas.id = 'alphabetSpellCanvas';
    camCanvas.setAttribute('aria-hidden', 'true');
    camStage.appendChild(camCanvas);

    const camPlaceholder = elFn('div', `ab-cam-placeholder ${cameraActive ? 'hidden' : ''}`);
    camPlaceholder.id = 'alphabetSpellCamPlaceholder';
    camPlaceholder.appendChild(elFn('strong', '', 'Tu cámara en vivo'));
    camPlaceholder.appendChild(elFn('span', 'text-xs opacity-80', 'Actívala aquí para deletrear tu nombre letra por letra frente a la cámara.'));
    camStage.appendChild(camPlaceholder);
    fragment.appendChild(camStage);

    const camControls = elFn('div', 'ab-cam-controls');
    const camSelect = elFn('select', 'ab-cam-select');
    camSelect.id = 'alphabetSpellCameraSelect';
    camSelect.setAttribute('aria-label', 'Seleccionar cámara para Deletrea tu Nombre');
    if (typeof onDeviceChange === 'function') camSelect.addEventListener('change', onDeviceChange);
    camControls.appendChild(camSelect);

    const framingPill = elFn('span', 'ab-framing-pill is-missing', 'Encuadre: cámara inactiva');
    framingPill.id = 'alphabetSpellFramingPill';
    camControls.appendChild(framingPill);
    fragment.appendChild(camControls);

    const shownScore = cameraActive ? lastScore : 0;
    const scoreRow = elFn('div', 'ab-score-row');
    scoreRow.appendChild(elFn('span', 'text-xs font-bold text-slate-700 shrink-0', 'Precisión'));
    const scoreBar = elFn('div', 'ab-score-bar');
    const scoreFill = elFn('div', `ab-score-fill ${shownScore >= 85 ? 'is-pass' : ''}`);
    scoreFill.id = 'alphabetSpellScoreBar';
    scoreFill.style.width = `${shownScore}%`;
    scoreBar.appendChild(scoreFill);
    const scoreTxt = elFn('span', 'font-mono text-xs font-extrabold text-slate-900 tabular-nums shrink-0', `${shownScore}%`);
    scoreTxt.id = 'alphabetSpellScoreText';
    scoreRow.appendChild(scoreBar);
    scoreRow.appendChild(scoreTxt);
    fragment.appendChild(scoreRow);

    return fragment;
  }
}

if (typeof window !== 'undefined') {
  window.BlindSpellSession = BlindSpellSession;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BlindSpellSession };
}
