/**
 * LSC Learn · Proyecto EXIS
 * landing.js - Controlador POO de Scrollytelling Cinemático y Visor Multimedia (landing.html)
 * Cumple con las Reglas Duras de AGENTS.md:
 * - POO estricto (Clases ES6 con estado protegido y ciclo de vida estándar)
 * - Doble salida multimedia MP4 + WebP con fallback automático
 * - < 1,100 líneas
 */

// Registro global de errores de consola para auditoría visual automatizada (Regla 7 AGENTS.md)
window.__consoleErrors = window.__consoleErrors || [];
window.addEventListener('error', e => window.__consoleErrors.push(e.message || String(e)));
window.addEventListener('unhandledrejection', e => window.__consoleErrors.push(e.reason ? (e.reason.message || String(e.reason)) : 'Unhandled Rejection'));

class LandingHeroPlayer {
  #totalFrames = 72;
  #frames = [];
  #loadedCount = 0;
  #currentFrame = 4;
  #targetFrame = 4;
  #activeTipIdx = 0;
  #rafId = null;
  #canvas = null;
  #ctx = null;
  #compCanvas = null;
  #compCtx = null;
  #lastRenderedIdx = -1;

  #stages = [
    {
      mood: 'Saludo 👋',
      range: [0, 12],
      speech: '¡Hola! Soy Tito. Baja conmigo para descubrir tu ruta en LSC.',
      status: 'Desliza hacia abajo · Tito te acompaña'
    },
    {
      mood: 'Señalando 👉',
      range: [13, 25],
      speech: 'Consejo 1: Responde 3 preguntas y Tito IA crea tu ruta personalizada.',
      status: 'Fase 01 · Diagnóstico inteligente'
    },
    {
      mood: 'Observando 🤔',
      range: [26, 40],
      speech: 'Consejo 2: Cuida tu luz frontal y la curva exacta de cada letra (O vs C).',
      status: 'Fase 02 · Visión MediaPipe 30 FPS'
    },
    {
      mood: '¡Tú puedes! 💪',
      range: [41, 53],
      speech: 'Consejo 3: En el Modo Examen demuestras cada seña sin videos de ayuda.',
      status: 'Fase 03 · Certificación sin video'
    },
    {
      mood: '¡A celebrar! ⭐',
      range: [54, 71],
      speech: '¡Tu primera seña está a un clic! Crea tu cuenta gratis y empieza hoy.',
      status: '¡Listo para empezar tu primera lección!'
    }
  ];

  setOnPoseChange() {}

  init() {
    this.#canvas = document.getElementById('zorritoScrollCanvas');
    this.#ctx = this.#canvas ? this.#canvas.getContext('2d') : null;
    this.#compCanvas = document.getElementById('scrollCompanionCanvas');
    this.#compCtx = this.#compCanvas ? this.#compCanvas.getContext('2d') : null;
    this.#preloadFrames();
    this.#bindCanvasClick();
    this.#applyStageUI(0);
  }

  start() {
    this.applyScroll3D(window.scrollY || document.documentElement.scrollTop || 0);
    if (!this.#rafId) {
      const tick = (now) => {
        this.#renderLoop(now);
        this.#rafId = requestAnimationFrame(tick);
      };
      this.#rafId = requestAnimationFrame(tick);
    }
  }

  update() {
    this.#drawFrame(Math.round(this.#currentFrame), true);
  }

  reset() {
    this.#activeTipIdx = 0;
    this.#targetFrame = 4;
    this.#currentFrame = 4;
    this.#applyStageUI(0);
    this.applyScroll3D(0);
  }

  destroy() {
    if (this.#rafId) {
      cancelAnimationFrame(this.#rafId);
      this.#rafId = null;
    }
  }

  setPointerTilt(rx, ry, hovering) {
    if (this.#canvas) {
      this.#canvas.style.transform = hovering
        ? `perspective(750px) rotateY(${(ry * 0.45).toFixed(1)}deg) rotateX(${(-rx * 0.45).toFixed(1)}deg) scale(1.03)`
        : '';
    }
  }

  applyScroll3D(scrollTop) {
    const capsule = document.getElementById('solHoloCapsule');
    const docMax = Math.max(400, document.documentElement.scrollHeight - window.innerHeight);
    const fullRatio = Math.min(1, Math.max(0, scrollTop / docMax));
    const heroRatio = Math.min(1, Math.max(0, scrollTop / 520));

    if (capsule) {
      capsule.style.setProperty('--scroll-progress', heroRatio.toFixed(3));
    }

    // Mapeo continuo y fluido de los 72 cuadros a lo largo de TODA la página
    this.#targetFrame = fullRatio * (this.#totalFrames - 1);

    let nextStage = 0;
    if (fullRatio >= 0.78) nextStage = 4;
    else if (fullRatio >= 0.56) nextStage = 3;
    else if (fullRatio >= 0.36) nextStage = 2;
    else if (fullRatio >= 0.14) nextStage = 1;

    if (nextStage !== this.#activeTipIdx) {
      this.#applyStageUI(nextStage);
    }

    const scrollyStage = document.getElementById('scrollyStickyStage');
    if (scrollyStage) {
      const scrollyProgress = Math.min(1, Math.max(-1, (scrollTop - 700) / 700));
      scrollyStage.style.setProperty('--scrolly-ry', `${(scrollyProgress * -4.5).toFixed(2)}deg`);
      scrollyStage.style.setProperty('--scrolly-rx', `${(2 - Math.abs(scrollyProgress) * 2).toFixed(2)}deg`);
    }
  }

  #preloadFrames() {
    for (let i = 0; i < this.#totalFrames; i++) {
      const img = new Image();
      const idxStr = String(i).padStart(2, '0');
      img.onload = () => {
        this.#loadedCount++;
        if (i === 0 || (this.#lastRenderedIdx < 0 && img.complete)) {
          this.#canvas?.parentElement?.classList.add('has-canvas');
          this.#compCanvas?.parentElement?.classList.add('has-canvas');
          this.#drawFrame(Math.round(this.#currentFrame), true);
        }
      };
      img.src = `img/zorrito/scroll_seq/frame_${idxStr}.webp`;
      this.#frames[i] = img;
    }
  }

  #bindCanvasClick() {
    const celebrate = (el) => {
      if (!el) return;
      el.addEventListener('click', () => {
        this.#targetFrame = 64;
        this.#applyStageUI(4);
        el.classList.remove('anim-bounce-squish');
        void el.offsetWidth;
        el.classList.add('anim-bounce-squish');
      });
    };
    celebrate(this.#canvas);
    celebrate(this.#compCanvas);
  }

  #applyStageUI(stageIdx) {
    this.#activeTipIdx = stageIdx;
    const cfg = this.#stages[stageIdx] || this.#stages[0];
    const moodEl = document.getElementById('zorritoStatusMood');
    const tipEl = document.getElementById('zorritoTipText');
    const floatText = document.getElementById('floatingZorritoText');
    const badgeText = document.getElementById('heroLiveBadgeText');
    const labelText = document.getElementById('heroActiveSignLabel');

    if (moodEl) moodEl.textContent = cfg.mood;
    if (tipEl) tipEl.textContent = cfg.speech;
    if (floatText) floatText.textContent = cfg.speech;
    if (badgeText) badgeText.textContent = `EJEMPLO 3D EN VIVO · TITO LSC`;
    if (labelText) labelText.textContent = cfg.status;
  }

  #renderLoop(now) {
    if (this.#loadedCount === 0) return;
    const idleWave = Math.sin(now * 0.0028) * 1.8;
    const desired = Math.max(0, Math.min(this.#totalFrames - 1, this.#targetFrame + idleWave));
    this.#currentFrame += (desired - this.#currentFrame) * 0.14;
    this.#drawFrame(Math.round(this.#currentFrame), false);
  }

  #drawFrame(frameIdx, force) {
    const clamped = Math.max(0, Math.min(this.#totalFrames - 1, frameIdx));
    if (!force && clamped === this.#lastRenderedIdx) return;

    const img = this.#frames[clamped];
    if (img && img.complete && img.naturalWidth > 0) {
      if (this.#ctx && this.#canvas) {
        this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
        this.#ctx.drawImage(img, 0, 0, this.#canvas.width, this.#canvas.height);
      }
      if (this.#compCtx && this.#compCanvas) {
        this.#compCtx.clearRect(0, 0, this.#compCanvas.width, this.#compCanvas.height);
        this.#compCtx.drawImage(img, 0, 0, this.#compCanvas.width, this.#compCanvas.height);
      }
      this.#lastRenderedIdx = clamped;
    }
  }
}

class ZorritoCompanionController {
  #heroFoxImg = null;
  #statusMood = null;
  #floatingDock = null;
  #floatingFoxImg = null;
  #floatingBubble = null;
  #floatingText = null;

  #boundPointerMove = null;
  #boundScroll = null;
  #curiosityTimeout = null;
  #isCurious = false;
  #lastMoveTime = 0;
  #lastMouseX = 0;
  #lastMouseY = 0;
  #tipDismissTimeout = null;
  #restHeroMedia = 'img/zorrito/zorrito_feliz.webp';

  setRestMedia(src) {
    if (src) this.#restHeroMedia = src;
  }

  #tips = [
    '¡Hola! Mueve tus manos frente a la cámara y MediaPipe medirá tus articulaciones.',
    '¿Sabías que el alfabeto en LSC se hace con una sola mano?',
    'En el Modo Examen no hay videos guía: ¡demuestras lo aprendido de memoria!',
    'Tito IA evalúa tu nivel inicial para armar tu ruta paso a paso.',
    '¡Prueba cualquier seña en Práctica Libre o sigue tu ruta guiada!'
  ];

  init() {
    this.#heroFoxImg = document.getElementById('heroZorritoImg');
    this.#statusMood = document.getElementById('zorritoStatusMood');
    this.#floatingDock = document.getElementById('floatingZorritoDock');
    this.#floatingFoxImg = document.getElementById('floatingZorritoImg');
    this.#floatingBubble = document.getElementById('floatingZorritoBubble');
    this.#floatingText = document.getElementById('floatingZorritoText');

    this.#boundPointerMove = this.#handlePointerMove.bind(this);
    this.#boundScroll = this.#handleScroll.bind(this);

    window.addEventListener('pointermove', this.#boundPointerMove, { passive: true });
    window.addEventListener('scroll', this.#boundScroll, { passive: true });

    this.#bindClickInteractions();
  }

  start() {
    this.#handleScroll();
  }

  update() {
    this.#handleScroll();
  }

  reset() {
    this.#resetCuriosity();
  }

  destroy() {
    window.removeEventListener('pointermove', this.#boundPointerMove);
    window.removeEventListener('scroll', this.#boundScroll);
    clearTimeout(this.#curiosityTimeout);
    clearTimeout(this.#tipDismissTimeout);
  }

  #handleScroll() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (this.#floatingDock) {
      if (scrollTop > 280) {
        this.#floatingDock.classList.add('is-visible');
      } else {
        this.#floatingDock.classList.remove('is-visible');
      }
    }
  }

  #handlePointerMove(e) {
    const now = performance.now();
    const dt = Math.max(1, now - this.#lastMoveTime);
    const dist = Math.hypot(e.clientX - this.#lastMouseX, e.clientY - this.#lastMouseY);
    const speed = dist / dt;

    this.#lastMouseX = e.clientX;
    this.#lastMouseY = e.clientY;
    this.#lastMoveTime = now;

    // 1. Seguimiento 3D y Curiosidad en el Hero Zorrito (solo cuando usa fallback IMG estático)
    const canvasActive = document.querySelector('.zorrito-canvas-wrap.has-canvas');
    if (this.#heroFoxImg && !canvasActive) {
      const rect = this.#heroFoxImg.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const distance = Math.hypot(dx, dy);

      if (speed > 0.4 || distance > 320) {
        this.#resetCuriosity();
      }

      if (!this.#isCurious) {
        const rotY = Math.max(-24, Math.min(24, dx * 0.08));
        const rotX = Math.max(-18, Math.min(18, -dy * 0.08));
        this.#heroFoxImg.style.transform = `perspective(600px) rotateY(${rotY.toFixed(1)}deg) rotateX(${rotX.toFixed(1)}deg)`;

        // Activa curiosidad si el cursor merodea cerca suavemente
        if (distance >= 45 && distance <= 260 && speed < 0.25) {
          clearTimeout(this.#curiosityTimeout);
          this.#curiosityTimeout = setTimeout(() => {
            this.#triggerCuriosity(dx, dy, distance);
          }, 650);
        }
      }
    }

    // 2. Seguimiento de mirada en el Zorrito Flotante
    if (this.#floatingFoxImg && this.#floatingDock?.classList.contains('is-visible')) {
      const rect = this.#floatingFoxImg.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      const rotY = Math.max(-20, Math.min(20, dx * 0.06));
      const rotX = Math.max(-15, Math.min(15, -dy * 0.06));
      this.#floatingFoxImg.style.transform = `perspective(500px) rotateY(${rotY.toFixed(1)}deg) rotateX(${rotX.toFixed(1)}deg)`;
    }
  }

  #triggerCuriosity(dx, dy, distance) {
    if (!this.#heroFoxImg || this.#isCurious) return;
    this.#isCurious = true;

    // Cambia a animación de curiosidad e intriga (WebP animado)
    this.#heroFoxImg.src = 'img/zorrito/zorrito_curioso.webp';
    this.#heroFoxImg.classList.add('is-curious');
    if (this.#statusMood) {
      this.#statusMood.textContent = '¡Curioso! 🐾';
      this.#statusMood.classList.remove('hidden');
    }

    // Se acerca físicamente hacia donde está el cursor
    const ratio = Math.min(1, 24 / Math.max(1, distance));
    const moveX = dx * ratio;
    const moveY = dy * ratio;
    const tilt = dx > 0 ? 8 : -8;

    this.#heroFoxImg.style.transform = `translate3d(${moveX.toFixed(1)}px, ${moveY.toFixed(1)}px, 0) rotate(${tilt}deg) scale(1.14)`;
  }

  #resetCuriosity() {
    clearTimeout(this.#curiosityTimeout);
    if (!this.#isCurious || !this.#heroFoxImg) return;
    this.#isCurious = false;

    // Regresa a la animación base activa del escenario con rebote elástico
    this.#heroFoxImg.classList.remove('is-curious');
    this.#heroFoxImg.classList.add('anim-bounce-squish');
    this.#heroFoxImg.src = this.#restHeroMedia || 'img/zorrito/zorrito_idle.webp';
    this.#heroFoxImg.style.transform = 'translate3d(0, 0, 0) rotate(0deg) scale(1)';
    if (this.#statusMood) {
      this.#statusMood.textContent = 'Atento 👀';
    }

    setTimeout(() => {
      this.#heroFoxImg?.classList.remove('anim-bounce-squish');
    }, 600);
  }

  #bindClickInteractions() {
    // Clic en Hero Zorrito: Celebración animada con estrellas
    if (this.#heroFoxImg) {
      this.#heroFoxImg.addEventListener('click', () => {
        this.#heroFoxImg.src = 'img/zorrito/zorrito_celebracion.webp';
        this.#heroFoxImg.classList.add('anim-bounce-squish');
        setTimeout(() => {
          this.#heroFoxImg.src = this.#restHeroMedia || 'img/zorrito/zorrito_idle.webp';
          this.#heroFoxImg.classList.remove('anim-bounce-squish');
        }, 1800);
      });
    }

    // Clic e interacción en Zorrito Flotante
    const wrapper = document.getElementById('floatingZorritoWrapper');
    if (wrapper && this.#floatingFoxImg) {
      wrapper.addEventListener('click', () => {
        this.#floatingFoxImg.src = 'img/zorrito/zorrito_celebracion.webp';
        this.#floatingFoxImg.classList.add('anim-bounce-squish');
        this.#showRandomTip();

        setTimeout(() => {
          this.#floatingFoxImg.src = 'img/zorrito/zorrito_idle.webp';
          this.#floatingFoxImg.classList.remove('anim-bounce-squish');
        }, 1800);
      });

      wrapper.addEventListener('pointerenter', () => {
        if (!this.#floatingFoxImg.classList.contains('anim-bounce-squish')) {
          this.#floatingFoxImg.src = 'img/zorrito/zorrito_atento.webp';
        }
      });

      wrapper.addEventListener('pointerleave', () => {
        if (!this.#floatingFoxImg.classList.contains('anim-bounce-squish')) {
          this.#floatingFoxImg.src = 'img/zorrito/zorrito_idle.webp';
        }
      });
    }
  }

  #showRandomTip() {
    if (!this.#floatingBubble || !this.#floatingText) return;
    const randomTip = this.#tips[Math.floor(Math.random() * this.#tips.length)];
    this.#floatingText.textContent = randomTip;
    this.#floatingBubble.classList.remove('opacity-0', 'translate-y-2');
    this.#floatingBubble.classList.add('opacity-100', 'translate-y-0');

    clearTimeout(this.#tipDismissTimeout);
    this.#tipDismissTimeout = setTimeout(() => {
      this.#floatingBubble.classList.remove('opacity-100', 'translate-y-0');
      this.#floatingBubble.classList.add('opacity-0', 'translate-y-2');
    }, 4500);
  }
}

class LandingPortalController {
  #boundHandleScroll;
  #boundPointerMove;
  #heroPlayer;
  #companionController;
  #scrollRafPending = false;

  constructor() {
    this.#boundHandleScroll = this.#handleWindowScroll.bind(this);
    this.#boundPointerMove = this.#handleSpotlightMove.bind(this);
    this.#heroPlayer = new LandingHeroPlayer();
    this.#companionController = new ZorritoCompanionController();
  }

  init() {
    this.#heroPlayer.setOnPoseChange((src) => this.#companionController.setRestMedia(src));
    this.#initScrollytelling();
    this.#initInteractiveTiltAndSpotlight();
    this.#bindGuestLinks();
    this.#heroPlayer.init();
    this.#companionController.init();
  }

  start() {
    this.#handleWindowScroll();
    this.#heroPlayer.start();
    this.#companionController.start();
  }

  update() {
    this.#handleWindowScroll();
    this.#heroPlayer.update();
    this.#companionController.update();
  }

  reset() {
    window.scrollTo({ top: 0 });
    this.#heroPlayer.reset();
    this.#companionController.reset();
  }

  destroy() {
    window.removeEventListener('scroll', this.#boundHandleScroll);
    window.removeEventListener('pointermove', this.#boundPointerMove);
    this.#heroPlayer.destroy();
    this.#companionController.destroy();
  }

  #bindGuestLinks() {
    const guestLinks = ['btnQuickGuestPath', 'btnHeroDemoDirect', 'btnNavDemoDirect', 'ctaGuestDirect'];
    guestLinks.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('click', (e) => {
        try { localStorage.setItem('exis_active_profile_v1', 'invitado'); } catch (err) {}
      });
    });
  }

  #initScrollytelling() {
    window.addEventListener('scroll', this.#boundHandleScroll, { passive: true });

    if ('IntersectionObserver' in window) {
      const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) entry.target.classList.add('is-visible');
        });
      }, { threshold: 0.14 });
      document.querySelectorAll('.scroll-reveal').forEach(el => revealObserver.observe(el));

      const stepObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const stepNum = entry.target.getAttribute('data-scrolly-step');
            if (stepNum) this.#activateScrollyStep(stepNum);
          }
        });
      }, { threshold: 0.55 });

      document.querySelectorAll('.scrolly-step-card').forEach(card => {
        stepObserver.observe(card);
        card.addEventListener('click', () => {
          const stepNum = card.getAttribute('data-scrolly-step');
          if (stepNum) this.#activateScrollyStep(stepNum);
        });
      });

      const dock = document.getElementById('floatingZorritoDock');
      const authCta = document.getElementById('authPortalSection');
      const footerEl = document.querySelector('.landing-footer');
      if (dock && (authCta || footerEl)) {
        const overlapSet = new Set();
        const dockAvoidObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) overlapSet.add(entry.target);
            else overlapSet.delete(entry.target);
          });
          dock.classList.toggle('is-over-cta', overlapSet.size > 0);
        }, { threshold: 0.1 });
        if (authCta) dockAvoidObserver.observe(authCta);
        if (footerEl) dockAvoidObserver.observe(footerEl);
      }
    } else {
      document.querySelectorAll('.scroll-reveal').forEach(el => el.classList.add('is-visible'));
    }
  }

  #activateScrollyStep(stepNum) {
    document.querySelectorAll('.scrolly-step-card').forEach(card => {
      card.classList.toggle('is-active', card.getAttribute('data-scrolly-step') === String(stepNum));
    });
    ['1', '2', '3'].forEach(n => {
      const pane = document.getElementById(`scrollyPreview${n}`);
      if (pane) pane.classList.toggle('is-active', n === String(stepNum));
    });
  }

  #handleWindowScroll() {
    if (this.#scrollRafPending) return;
    this.#scrollRafPending = true;
    requestAnimationFrame(() => {
      this.#scrollRafPending = false;
      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      const bar = document.getElementById('scrollProgressBar');
      if (bar) {
        const docHeight = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const pct = Math.min(100, Math.max(0, (scrollTop / docHeight) * 100));
        bar.style.width = `${pct.toFixed(1)}%`;
      }
      this.#heroPlayer.applyScroll3D(scrollTop);
    });
  }

  #handleSpotlightMove(e) {
    const spotlight = document.getElementById('cursorSpotlight');
    if (!spotlight) return;
    spotlight.style.left = `${e.clientX}px`;
    spotlight.style.top = `${e.clientY}px`;
  }

  #initInteractiveTiltAndSpotlight() {
    window.addEventListener('pointermove', this.#boundPointerMove, { passive: true });

    // Inclinación magnética 3D multicapa en el escenario Hero
    const tiltCard = document.getElementById('solHoloCapsule');
    if (tiltCard) {
      tiltCard.addEventListener('pointermove', (e) => {
        const rect = tiltCard.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        this.#heroPlayer.setPointerTilt(-y * 14, x * 16, true);
      });
      tiltCard.addEventListener('pointerleave', () => {
        this.#heroPlayer.setPointerTilt(5, -6, false);
      });
    }

    // Micro-inclinación magnética 3D en tarjetas interactivas
    const glareCards = document.querySelectorAll('.card-3d-glare');
    glareCards.forEach(card => {
      card.addEventListener('pointermove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(800px) rotateY(${(x * 4).toFixed(2)}deg) rotateX(${(-y * 4).toFixed(2)}deg) translateY(-2px)`;
      });
      card.addEventListener('pointerleave', () => {
        card.style.transform = '';
      });
    });

    // Reacción táctil con rebote gomoso estilo Duolingo en Zorrito
    const zorritos = document.querySelectorAll('.zorrito-pop, .auth-fox, .anim-wave');
    zorritos.forEach(fox => {
      fox.addEventListener('click', () => {
        fox.classList.remove('anim-bounce-squish');
        void fox.offsetWidth;
        fox.classList.add('anim-bounce-squish');
      });
    });

    // Interactividad en los nodos del mapa Duolingo (Preview 1)
    const duoNodes = document.querySelectorAll('.preview-duo-node');
    duoNodes.forEach(node => {
      node.addEventListener('click', () => {
        duoNodes.forEach(n => {
          n.classList.remove('active', 'duo-radar-pulse');
        });
        node.classList.add('active', 'duo-radar-pulse');
      });
    });
  }
}

window.LandingPortalController = new LandingPortalController();

document.addEventListener('DOMContentLoaded', () => {
  window.LandingPortalController.init();
  window.LandingPortalController.start();
});
