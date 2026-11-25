/**
 * Manitas · Proyecto EXIS
 * voice-feedback.js - Servicio POO ligero de síntesis de voz y sonido de victoria
 * Reemplaza a chat-tutor.js tras eliminar el chat y Ollama.
 */

class VoiceFeedbackService {
  #initialized = false;
  #selectedVoice = null;
  #celebrationIndex = 0;

  init() {
    if (this.#initialized) return this;
    this.#refreshVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.addEventListener) {
      window.speechSynthesis.addEventListener('voiceschanged', () => this.#refreshVoices());
    }
    this.#initialized = true;
    return this;
  }

  start() {
    if (!this.#initialized) this.init();
  }

  update() {}

  reset() {
    this.#celebrationIndex = 0;
  }

  destroy() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (_) {}
    }
    this.#initialized = false;
  }

  #scoreVoice(v) {
    const lang = (v.lang || '').toLowerCase();
    if (!lang.startsWith('es')) return -1;
    let score = lang.includes('co') ? 40 : (lang.includes('419') || lang.includes('mx') ? 28 : 15);
    if (v.localService) score += 8;
    return score;
  }

  #refreshVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices() || [];
    let best = null;
    let bestScore = -1;
    for (const v of voices) {
      const s = this.#scoreVoice(v);
      if (s > bestScore) {
        bestScore = s;
        best = v;
      }
    }
    if (best) this.#selectedVoice = best;
  }

  #sanitizeText(text) {
    return String(text || '')
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  speakText(text, options = {}) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const clean = this.#sanitizeText(text);
    if (!clean) return;
    if (!this.#selectedVoice) this.#refreshVoices();
    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(clean);
    utter.voice = this.#selectedVoice || null;
    utter.lang = (this.#selectedVoice && this.#selectedVoice.lang) ? this.#selectedVoice.lang : 'es-CO';
    utter.rate = options.rate ?? 0.96;
    utter.pitch = options.pitch ?? 1.04;
    utter.volume = options.volume ?? 0.95;
    window.speechSynthesis.speak(utter);
  }

  speakCelebration(signName, score = null) {
    const name = (signName || 'la seña').toLowerCase();
    const phrases = score !== null
      ? [
          `¡Muy bien! Hiciste ${name} con ${score} por ciento de precisión.`,
          `¡Genial! Lograste la seña ${name} perfectamente.`,
          `¡Excelente! Tu seña de ${name} quedó súper clara.`
        ]
      : [
          `¡Muy bien! Dominaste la seña ${name}.`,
          `¡Genial! Ya te sale perfecta la seña ${name}.`,
          `¡Excelente progreso! Completaste ${name} con éxito.`
        ];
    const msg = phrases[this.#celebrationIndex % phrases.length];
    this.#celebrationIndex += 1;
    this.speakText(msg, { rate: 0.98, pitch: 1.06 });
  }

  playVictorySound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.1);
        gain.gain.setValueAtTime(0.25, audioCtx.currentTime + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i * 0.1 + 0.38);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + i * 0.1);
        osc.stop(audioCtx.currentTime + i * 0.1 + 0.42);
      });
    } catch (_) {}
  }
}

const voiceFeedback = new VoiceFeedbackService().init();
window.VoiceFeedback = voiceFeedback;
window.ChatTutor = voiceFeedback;
