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
  #currentSign = 'HOLA';
  #currentMode = 'anime'; // 'anime' | 'real'
  #currentView = 'body';  // 'body' | 'hand'

  #tips = {
    HOLA: '¡La mano derecha parte de la sien y se proyecta hacia adelante en diagonal!',
    BUENOS: '¡La mano derecha baja desde arriba y contacta la palma izquierda en el centro!',
    DIAS: '¡Ambos brazos se abren hacia los lados simulando la salida del sol!',
    U: '¡En la U los dedos índice y meñique apuntan erguidos como dos postes (LSC70)!',
    D: '¡El índice apunta recto hacia arriba y el pulgar toca el dedo medio en aro!',
    E: '¡La mano se eleva junto a la mandíbula con los cuatro dedos curvados al frente!',
    A: '¡Puño cerrado con el pulgar erguido al lateral del índice!',
    B: '¡Cuatro dedos extendidos hacia arriba y pulgar doblado sobre la palma!',
    C: '¡Mano arqueada formando el semicírculo de la letra C!',
    V: '¡Dedos índice y medio abiertos en V (símbolo de victoria)!'
  };

  #labels = {
    HOLA: 'HOLA · Saludo Oficial LSC',
    BUENOS: 'BUENOS · Cortesía LSC',
    DIAS: 'DÍAS · Tiempo LSC',
    U: 'Letra U · Dactilología Canónica',
    D: 'Letra D · Dactilología Canónica',
    E: 'Letra E · Dactilología Canónica',
    A: 'Letra A · Dactilología Canónica',
    B: 'Letra B · Dactilología Canónica',
    C: 'Letra C · Dactilología Canónica',
    V: 'Letra V · Dactilología Canónica'
  };

  init() {
    this.#bindToggles();
    this.#bindPills();
    this.#updateMedia();
  }

  start() {
    this.#playVideo();
  }

  update() {
    this.#updateMedia();
  }

  reset() {
    this.#currentSign = 'HOLA';
    this.#currentMode = 'anime';
    this.#currentView = 'body';
    this.#updateMedia();
  }

  destroy() {
    const video = document.getElementById('heroDemoVideo');
    if (video) {
      video.pause();
      video.src = '';
    }
  }

  #bindToggles() {
    const btnAnime = document.getElementById('btnHeroModeAnime');
    const btnReal = document.getElementById('btnHeroModeReal');
    if (btnAnime && btnReal) {
      btnAnime.addEventListener('click', () => {
        this.#currentMode = 'anime';
        btnAnime.classList.add('is-active');
        btnReal.classList.remove('is-active');
        this.#updateMedia();
      });
      btnReal.addEventListener('click', () => {
        this.#currentMode = 'real';
        btnReal.classList.add('is-active');
        btnAnime.classList.remove('is-active');
        this.#updateMedia();
      });
    }

    const btnBody = document.getElementById('btnHeroViewBody');
    const btnHand = document.getElementById('btnHeroViewHand');
    if (btnBody && btnHand) {
      btnBody.addEventListener('click', () => {
        this.#currentView = 'body';
        btnBody.classList.add('is-active');
        btnHand.classList.remove('is-active');
        const viewport = document.getElementById('heroVideoViewport');
        if (viewport) viewport.classList.remove('is-hand-mode');
        this.#updateMedia();
      });
      btnHand.addEventListener('click', () => {
        this.#currentView = 'hand';
        btnHand.classList.add('is-active');
        btnBody.classList.remove('is-active');
        const viewport = document.getElementById('heroVideoViewport');
        if (viewport) viewport.classList.add('is-hand-mode');
        this.#updateMedia();
      });
    }
  }

  #bindPills() {
    const pills = document.querySelectorAll('.hero-sign-pill');
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        const sign = pill.getAttribute('data-sign');
        if (!sign) return;
        this.#currentSign = sign;
        pills.forEach(p => p.classList.toggle('is-active', p === pill));
        this.#updateMedia();

        // Reacción visual y rebote estilo Duolingo en Zorrito
        const zorritoImg = document.querySelector('.zorrito-dialog-bubble img') || document.querySelector('.anim-wave');
        if (zorritoImg) {
          zorritoImg.classList.remove('anim-bounce-squish');
          void zorritoImg.offsetWidth; // Force reflow
          zorritoImg.classList.add('anim-bounce-squish');
        }
      });
    });
  }

  #updateMedia() {
    const video = document.getElementById('heroDemoVideo');
    const fallback = document.getElementById('heroWebpFallback');
    const badgeText = document.getElementById('heroLiveBadgeText');
    const labelText = document.getElementById('heroActiveSignLabel');
    const tipText = document.getElementById('zorritoTipText');

    const basePath = `videos/${this.#currentMode}/${this.#currentSign}_${this.#currentView}`;
    const mp4Url = `${basePath}.mp4`;
    const webpUrl = `${basePath}.webp`;

    if (badgeText) {
      const modeLabel = this.#currentMode === 'anime' ? 'ANIME IA (SOL)' : 'PERSONA REAL (LSC70)';
      badgeText.textContent = `EN VIVO · ${modeLabel} 24 FPS`;
    }

    if (labelText) {
      labelText.textContent = this.#labels[this.#currentSign] || `${this.#currentSign} · LSC70`;
    }

    if (tipText) {
      tipText.textContent = this.#tips[this.#currentSign] || '¡Observa la postura canónica de la mano y los ángulos de los dedos!';
    }

    if (video) {
      video.classList.remove('hidden');
      if (fallback) fallback.classList.add('hidden');
      video.poster = webpUrl;
      video.src = mp4Url;
      video.load();
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Si el navegador bloquea autoplay, usamos el WebP animado como fallback cruzado (Regla 4 AGENTS.md)
          if (fallback) {
            fallback.src = webpUrl;
            fallback.classList.remove('hidden');
            video.classList.add('hidden');
          }
        });
      }
    }
  }

  #playVideo() {
    const video = document.getElementById('heroDemoVideo');
    if (video && typeof video.play === 'function') {
      video.play().catch(() => {});
    }
  }
}

class LandingPortalController {
  #boundHandleScroll;
  #boundPointerMove;
  #heroPlayer;

  constructor() {
    this.#boundHandleScroll = this.#handleWindowScroll.bind(this);
    this.#boundPointerMove = this.#handleSpotlightMove.bind(this);
    this.#heroPlayer = new LandingHeroPlayer();
  }

  init() {
    this.#initScrollytelling();
    this.#initInteractiveTiltAndSpotlight();
    this.#bindGuestLinks();
    this.#heroPlayer.init();
  }

  start() {
    this.#handleWindowScroll();
    this.#heroPlayer.start();
  }

  update() {
    this.#handleWindowScroll();
    this.#heroPlayer.update();
  }

  reset() {
    window.scrollTo({ top: 0 });
    this.#heroPlayer.reset();
  }

  destroy() {
    window.removeEventListener('scroll', this.#boundHandleScroll);
    window.removeEventListener('pointermove', this.#boundPointerMove);
    this.#heroPlayer.destroy();
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
    const bar = document.getElementById('scrollProgressBar');
    if (!bar) return;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const pct = Math.min(100, Math.max(0, (scrollTop / docHeight) * 100));
    bar.style.width = `${pct.toFixed(1)}%`;

    // Efecto Apple / TikTok 3D Scroll Perspective en el visor Hero
    const heroCard = document.getElementById('solHoloCapsule');
    if (heroCard && scrollTop < 850) {
      const scrollRatio = scrollTop / 850;
      const tiltX = Math.min(6.5, scrollRatio * 6.5);
      const translateY = (scrollTop * 0.05).toFixed(1);
      heroCard.style.transform = `perspective(1000px) rotateX(${tiltX.toFixed(2)}deg) translateY(${translateY}px)`;
    }
  }

  #handleSpotlightMove(e) {
    const spotlight = document.getElementById('cursorSpotlight');
    if (!spotlight) return;
    spotlight.style.left = `${e.clientX}px`;
    spotlight.style.top = `${e.clientY}px`;
  }

  #initInteractiveTiltAndSpotlight() {
    window.addEventListener('pointermove', this.#boundPointerMove, { passive: true });

    // Tilt Magnético 3D en el visor hero
    const tiltCard = document.getElementById('solHoloCapsule');
    if (tiltCard) {
      tiltCard.addEventListener('pointermove', (e) => {
        const rect = tiltCard.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        tiltCard.style.transform = `perspective(900px) rotateY(${(x * 5).toFixed(2)}deg) rotateX(${(-y * 5).toFixed(2)}deg) scale3d(1.008, 1.008, 1)`;
      });
      tiltCard.addEventListener('pointerleave', () => {
        this.#handleWindowScroll(); // Vuelve al ángulo de scroll suave
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
