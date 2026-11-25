/**
 * Manitas · Proyecto EXIS
 * gamification-manager.js - Gestor POO de Gamificación Sobria LSC
 * Misiones diarias de Tito, Insignias de Hitos, Niveles Bronce/Plata/Oro y Micro-recompensas.
 */

class GamificationManager {
  static STORAGE_KEY = 'manitas_gamification_v1';

  static MISSION_DEFS = [
    { id: 'combo_3', title: 'Combo x3 en Flashcards', target: 3 },
    { id: 'spell_word', title: 'Deletrea 1 palabra completa', target: 1 },
    { id: 'practice_3', title: 'Practica o repasa 3 señas hoy', target: 3 }
  ];

  static BADGE_DEFS = [
    { id: 'vowels_lsc', title: 'Vocales LSC', desc: 'Acierta o domina A, E, I, O, U', image: 'img/badges/badge_vowels_lsc.png' },
    { id: 'first_word', title: 'Primer Nombre', desc: 'Completa 1 palabra en Deletrea tu Nombre', image: 'img/badges/badge_first_word.png' },
    { id: 'combo_master', title: 'Sin Dudar (x3)', desc: 'Logra un combo x3 en Flashcards', image: 'img/badges/badge_combo_master.png' },
    { id: 'camera_pro', title: 'Cámara Precisa', desc: '95%+ en cámara o 5 señas dominadas', image: 'img/badges/badge_camera_pro.png' },
    { id: 'leitner_gold', title: 'Oro Leitner', desc: 'Lleva 1 seña a Caja 5 o suma 10 aciertos', image: 'img/badges/badge_leitner_gold.png' }
  ];

  #initialized = false;
  #state = null;
  #dateProvider = null;
  #lastReaction = 'Elige una letra o completa tus 3 retos de hoy.';

  constructor(options = {}) {
    this.#dateProvider = typeof options.dateProvider === 'function' ? options.dateProvider : null;
  }

  init() {
    this.#state = this.#loadState();
    this.#ensureToday();
    this.#initialized = true;
    return this;
  }

  start() {
    if (!this.#initialized) this.init();
    this.update();
  }

  update() {
    this.#ensureToday();
    this.#evaluateBadges();
    this.#saveState();
    return this.getState();
  }

  reset() {
    this.#state = this.#createDefaultState(this.#getTodayKey());
    this.#lastReaction = 'Retos reiniciados. ¡Listo para practicar!';
    this.#saveState();
    return this.getState();
  }

  destroy() {
    this.#initialized = false;
  }

  #getTodayKey() {
    if (this.#dateProvider) return String(this.#dateProvider());
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  #createDefaultState(dateKey) {
    return {
      dateKey,
      dailyProgress: { combo_3: 0, spell_word: 0, practice_3: 0 },
      dailyBonusClaimed: false,
      unlockedBadges: [],
      totalSuccesses: 0,
      wordsSpelled: 0,
      maxCombo: 0,
      maxCameraScore: 0,
      practicedSigns: []
    };
  }

  #loadState() {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(GamificationManager.STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            return { ...this.#createDefaultState(this.#getTodayKey()), ...parsed };
          }
        }
      }
    } catch (_) { /* tolerante a storage restringido */ }
    return this.#createDefaultState(this.#getTodayKey());
  }

  #saveState() {
    try {
      if (typeof localStorage !== 'undefined' && this.#state) {
        localStorage.setItem(GamificationManager.STORAGE_KEY, JSON.stringify(this.#state));
      }
    } catch (_) { /* ignorar error de cuota */ }
  }

  #ensureToday() {
    const today = this.#getTodayKey();
    if (!this.#state) {
      this.#state = this.#createDefaultState(today);
      return;
    }
    if (this.#state.dateKey !== today) {
      this.#state = {
        ...this.#state,
        dateKey: today,
        dailyProgress: { combo_3: 0, spell_word: 0, practice_3: 0 },
        dailyBonusClaimed: false
      };
      this.#saveState();
    }
  }

  #awardBonusXp(xpAmount) {
    if (!xpAmount || typeof window === 'undefined' || !window.AuthProfileManager) return;
    const mgr = window.AuthProfileManager;
    if (typeof mgr.getCurrentProfile === 'function' && typeof mgr.update === 'function') {
      const profile = mgr.getCurrentProfile();
      mgr.update({ xp: (Number(profile && profile.xp) || 0) + xpAmount });
    }
  }

  #checkDailyBonus() {
    const allDone = GamificationManager.MISSION_DEFS.every(
      m => (this.#state.dailyProgress[m.id] || 0) >= m.target
    );
    if (allDone && !this.#state.dailyBonusClaimed) {
      this.#state.dailyBonusClaimed = true;
      this.#awardBonusXp(40);
      return 40;
    }
    return 0;
  }

  #evaluateBadges() {
    const unlocked = new Set(this.#state.unlockedBadges || []);
    const newlyUnlocked = [];

    const profile = (typeof window !== 'undefined' && window.AuthProfileManager)
      ? window.AuthProfileManager.getCurrentProfile()
      : null;
    const masteredSet = new Set([
      ...(this.#state.practicedSigns || []),
      ...((profile && Array.isArray(profile.masteredSigns)) ? profile.masteredSigns : [])
    ]);
    const signStats = (profile && profile.signStats && typeof profile.signStats === 'object')
      ? profile.signStats
      : {};

    const unlock = (id) => {
      if (!unlocked.has(id)) {
        unlocked.add(id);
        newlyUnlocked.push(id);
      }
    };

    if (['A', 'E', 'I', 'O', 'U'].every(v => masteredSet.has(v) || (signStats[v] && signStats[v].successes > 0))) {
      unlock('vowels_lsc');
    }
    if ((this.#state.wordsSpelled || 0) >= 1) unlock('first_word');
    if ((this.#state.maxCombo || 0) >= 3) unlock('combo_master');
    if ((this.#state.maxCameraScore || 0) >= 95 || masteredSet.size >= 5) unlock('camera_pro');

    const hasBox5 = Object.values(signStats).some(st => st && Number(st.box) >= 5);
    if (hasBox5 || (this.#state.totalSuccesses || 0) >= 10) unlock('leitner_gold');

    this.#state.unlockedBadges = Array.from(unlocked);
    return newlyUnlocked;
  }

  recordFlashcardResult({ passed, combo = 0, signId = '' } = {}) {
    if (!this.#initialized) this.init();
    this.#ensureToday();
    const sid = String(signId || '').trim().toUpperCase();

    if (passed) {
      this.#state.totalSuccesses = (this.#state.totalSuccesses || 0) + 1;
      this.#state.maxCombo = Math.max(this.#state.maxCombo || 0, combo);
      this.#state.dailyProgress.combo_3 = Math.max(this.#state.dailyProgress.combo_3 || 0, Math.min(3, combo));
      this.#state.dailyProgress.practice_3 = Math.min(3, (this.#state.dailyProgress.practice_3 || 0) + 1);
      if (sid && !this.#state.practicedSigns.includes(sid)) {
        this.#state.practicedSigns = [...this.#state.practicedSigns, sid];
      }
    }

    const bonusAwarded = this.#checkDailyBonus();
    const newBadges = this.#evaluateBadges();
    this.#saveState();

    const reaction = this.getTitoReaction(
      bonusAwarded > 0 ? 'daily_bonus' : (newBadges.length ? 'badge' : (passed ? 'flash_ok' : 'flash_retry')),
      { combo, badgeId: newBadges[0], signId: sid }
    );
    this.#lastReaction = reaction;
    return { bonusAwarded, newBadges, reaction, state: this.getState() };
  }

  recordWordSpelled(word = '') {
    if (!this.#initialized) this.init();
    this.#ensureToday();
    this.#state.wordsSpelled = (this.#state.wordsSpelled || 0) + 1;
    this.#state.dailyProgress.spell_word = 1;
    this.#state.dailyProgress.practice_3 = Math.min(3, (this.#state.dailyProgress.practice_3 || 0) + 1);

    const bonusAwarded = this.#checkDailyBonus();
    const newBadges = this.#evaluateBadges();
    this.#saveState();

    const reaction = this.getTitoReaction(
      bonusAwarded > 0 ? 'daily_bonus' : (newBadges.length ? 'badge' : 'word_done'),
      { word, badgeId: newBadges[0] }
    );
    this.#lastReaction = reaction;
    return { bonusAwarded, newBadges, reaction, state: this.getState() };
  }

  recordCameraSuccess({ signId = '', score = 0 } = {}) {
    if (!this.#initialized) this.init();
    this.#ensureToday();
    const sid = String(signId || '').trim().toUpperCase();
    this.#state.totalSuccesses = (this.#state.totalSuccesses || 0) + 1;
    this.#state.maxCameraScore = Math.max(this.#state.maxCameraScore || 0, Number(score) || 0);
    this.#state.dailyProgress.practice_3 = Math.min(3, (this.#state.dailyProgress.practice_3 || 0) + 1);
    if (sid && !this.#state.practicedSigns.includes(sid)) {
      this.#state.practicedSigns = [...this.#state.practicedSigns, sid];
    }

    const bonusAwarded = this.#checkDailyBonus();
    const newBadges = this.#evaluateBadges();
    this.#saveState();

    const reaction = this.getTitoReaction(
      bonusAwarded > 0 ? 'daily_bonus' : (newBadges.length ? 'badge' : 'camera_ok'),
      { signId: sid, score, badgeId: newBadges[0] }
    );
    this.#lastReaction = reaction;
    return { bonusAwarded, newBadges, reaction, state: this.getState() };
  }

  getMasteryTier(box = 1) {
    const level = Math.max(1, Math.min(5, Number(box) || 1));
    if (level >= 5) return { level, tier: 'gold', label: 'Oro' };
    if (level >= 3) return { level, tier: 'silver', label: 'Plata' };
    return { level, tier: 'bronze', label: 'Bronce' };
  }

  getTitoReaction(eventType, detail = {}) {
    if (eventType === 'daily_bonus') return '¡3 retos diarios listos (+40 XP)!';
    if (eventType === 'badge') {
      const def = GamificationManager.BADGE_DEFS.find(b => b.id === detail.badgeId);
      return def ? `¡Nueva insignia: ${def.title}!` : '¡Nueva insignia desbloqueada!';
    }
    if (eventType === 'word_done') {
      return detail.word ? `¡Deletreaste "${detail.word}" completo!` : '¡Completaste tu palabra!';
    }
    if (eventType === 'camera_ok') {
      return `¡${detail.signId || 'Seña'} dominada con ${Math.round(detail.score || 90)}% en cámara!`;
    }
    if (eventType === 'flash_ok') {
      const c = Number(detail.combo) || 0;
      if (c >= 3) return `¡${c} seguidas sin dudar!`;
      if (c === 2) return '¡Buen ritmo, llevas 2 seguidas!';
      return `¡Exacto! Letra ${detail.signId || ''} registrada.`;
    }
    if (eventType === 'flash_retry') return '¡Casi! Revisa la posición de los dedos e intenta la siguiente.';
    return this.#lastReaction;
  }

  playComboChime(combo = 1) {
    try {
      if (typeof window === 'undefined') return false;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return false;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const baseFreq = 440 + Math.min(6, Math.max(0, Number(combo) - 1)) * 55;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.25, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.17);
      return true;
    } catch (_) {
      return false;
    }
  }

  getState() {
    if (!this.#initialized) this.init();
    this.#ensureToday();
    const unlockedSet = new Set(this.#state.unlockedBadges || []);
    const missions = GamificationManager.MISSION_DEFS.map(def => {
      const current = Math.min(def.target, this.#state.dailyProgress[def.id] || 0);
      return { ...def, current, done: current >= def.target };
    });
    const badges = GamificationManager.BADGE_DEFS.map(def => ({
      ...def,
      unlocked: unlockedSet.has(def.id)
    }));
    return {
      dateKey: this.#state.dateKey,
      missions,
      allMissionsDone: missions.every(m => m.done),
      dailyBonusClaimed: Boolean(this.#state.dailyBonusClaimed),
      badges,
      unlockedCount: badges.filter(b => b.unlocked).length,
      totalBadges: badges.length,
      lastReaction: this.#lastReaction
    };
  }
}

const gamificationManager = new GamificationManager().init();

if (typeof window !== 'undefined') {
  window.GamificationManager = gamificationManager;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GamificationManager, gamificationManager };
}
