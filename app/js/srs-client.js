/**
 * Manitas · Proyecto EXIS
 * srs-client.js - Cliente POO de Repaso Espaciado (Cajas de Leitner)
 * Sincroniza estadísticas por seña con AuthProfileManager y /api/srs/*.
 */

class SRSClient {
  static BOX_INTERVAL_HOURS = { 1: 4, 2: 24, 3: 72, 4: 168, 5: 336 };

  #initialized = false;
  #dueCache = [];
  #listeners = [];

  init() {
    this.#initialized = true;
    return this;
  }

  start() {
    if (!this.#initialized) this.init();
    this.update();
  }

  update() {
    this.#dueCache = this.getDueSigns(3);
    return this.#dueCache;
  }

  reset() {
    this.#dueCache = [];
  }

  destroy() {
    this.reset();
    this.#listeners = [];
    this.#initialized = false;
  }

  onChange(fn) {
    if (typeof fn === 'function') this.#listeners.push(fn);
  }

  #notify() {
    const due = this.getDueSigns(3);
    this.#dueCache = due;
    this.#listeners.forEach(fn => {
      try { fn(due); } catch (_) { /* ignore listener errors */ }
    });
  }

  static getAllValidSignIds() {
    if (typeof window === 'undefined' || !window.SIGNS_DATA) return [];
    const words = Array.isArray(window.SIGNS_DATA.words) ? window.SIGNS_DATA.words : [];
    const letters = Array.isArray(window.SIGNS_DATA.letters) ? window.SIGNS_DATA.letters : [];
    return [...words, ...letters].map(s => s.id);
  }

  #getProfile() {
    if (typeof window !== 'undefined' && window.AuthProfileManager) {
      return window.AuthProfileManager.getCurrentProfile();
    }
    return null;
  }

  #getLocalStats() {
    const profile = this.#getProfile();
    if (profile && profile.signStats && typeof profile.signStats === 'object') {
      return profile.signStats;
    }
    try {
      const raw = localStorage.getItem('manitas_srs_stats_v1');
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  }

  #persistLocalStats(nextStats) {
    const profile = this.#getProfile();
    if (profile && typeof window !== 'undefined' && window.AuthProfileManager) {
      try {
        if (typeof window.AuthProfileManager.update === 'function') {
          return window.AuthProfileManager.update({ signStats: nextStats });
        }
      } catch (_) {
        /* fallback a localStorage */
      }
    }
    try {
      localStorage.setItem('manitas_srs_stats_v1', JSON.stringify(nextStats));
    } catch (_) { /* ignore storage quota errors */ }
    return null;
  }

  recordAttempt(signId, passed, nowMs = Date.now()) {
    const sid = String(signId || '').trim().toUpperCase();
    if (!sid) return null;

    const currentStats = this.#getLocalStats();
    const prev = currentStats[sid] || { box: 1, attempts: 0, successes: 0 };
    const newBox = passed ? Math.min(5, (Number(prev.box) || 1) + 1) : 1;
    const attempts = (Number(prev.attempts) || 0) + 1;
    const successes = (Number(prev.successes) || 0) + (passed ? 1 : 0);
    const hours = SRSClient.BOX_INTERVAL_HOURS[newBox] || 4;
    const nextReviewIso = new Date(nowMs + hours * 3600 * 1000).toISOString();

    const updatedStat = {
      box: newBox,
      attempts,
      successes,
      lastPracticedIso: new Date(nowMs).toISOString(),
      nextReviewIso,
      masteryPct: Math.round((successes / attempts) * 100)
    };

    const nextStats = { ...currentStats, [sid]: updatedStat };
    this.#persistLocalStats(nextStats);
    this.#syncReviewRemote(sid, Boolean(passed));
    this.#notify();
    return updatedStat;
  }

  async #syncReviewRemote(signId, passed) {
    if (typeof fetch !== 'function') return;
    const profile = this.#getProfile();
    const username = profile && profile.username ? profile.username : 'invitado';
    try {
      await fetch('/api/srs/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, signId, passed })
      });
    } catch (_) {
      /* Tolerante a modo offline */
    }
  }

  getSignStat(signId) {
    const sid = String(signId || '').trim().toUpperCase();
    const stats = this.#getLocalStats();
    return stats[sid] || { box: 1, attempts: 0, successes: 0, masteryPct: 0, lastPracticedIso: '', nextReviewIso: '' };
  }

  getDueSigns(limit = 3, nowMs = Date.now()) {
    const ids = SRSClient.getAllValidSignIds();
    const stats = this.#getLocalStats();
    const due = [];
    const unseen = [];
    const upcoming = [];

    ids.forEach((sid, idx) => {
      const st = stats[sid];
      if (!st || !st.attempts) {
        unseen.push({
          signId: sid,
          box: 1,
          attempts: 0,
          successes: 0,
          masteryPct: 0,
          isDue: true,
          reason: 'Por descubrir',
          sortTuple: [1, 1, 0, idx]
        });
        return;
      }
      const nextMs = st.nextReviewIso ? Date.parse(st.nextReviewIso) : 0;
      const isDue = !nextMs || nextMs <= nowMs;
      const masteryPct = st.attempts > 0 ? Math.round((st.successes / st.attempts) * 100) : 0;
      const item = {
        signId: sid,
        box: st.box || 1,
        attempts: st.attempts,
        successes: st.successes,
        masteryPct,
        isDue,
        reason: isDue
          ? `Vencida · Nivel ${st.box || 1} (${masteryPct}%)`
          : `Nivel ${st.box || 1} · ${masteryPct}%`,
        sortTuple: [isDue ? 0 : 2, st.box || 1, masteryPct, idx]
      };
      if (isDue) due.push(item);
      else upcoming.push(item);
    });

    const compare = (a, b) => {
      for (let i = 0; i < a.sortTuple.length; i++) {
        if (a.sortTuple[i] !== b.sortTuple[i]) return a.sortTuple[i] - b.sortTuple[i];
      }
      return 0;
    };
    due.sort(compare);
    upcoming.sort(compare);

    return [...due, ...unseen, ...upcoming].slice(0, limit).map(({ sortTuple, ...rest }) => rest);
  }
}

const srsClient = new SRSClient().init();

if (typeof window !== 'undefined') {
  window.SRSClient = srsClient;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SRSClient, srsClient };
}
