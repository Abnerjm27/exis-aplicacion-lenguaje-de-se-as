/**
 * LSC Learn · Proyecto EXIS
 * landing.js - Controlador POO de Scrollytelling Cinemático (landing.html)
 * El login, el registro y el cuestionario de nivel viven en login.html, register.html y onboarding.html.
 */

// Registro global de errores de consola para auditoría visual automatizada (Regla 7 AGENTS.md)
window.__consoleErrors = window.__consoleErrors || [];
window.addEventListener('error', e => window.__consoleErrors.push(e.message || String(e)));
window.addEventListener('unhandledrejection', e => window.__consoleErrors.push(e.reason ? (e.reason.message || String(e.reason)) : 'Unhandled Rejection'));

class LandingPortalController {
  #boundHandleScroll;
  #boundPointerMove;

  constructor() {
    this.#boundHandleScroll = this.#handleWindowScroll.bind(this);
    this.#boundPointerMove = this.#handleSpotlightMove.bind(this);
  }

  init() {
    this.#initScrollytelling();
    this.#initInteractiveTiltAndSpotlight();
    this.#bindGuestLink();
  }

  start() {
    this.#handleWindowScroll();
  }

  update() {
    this.#handleWindowScroll();
  }

  reset() {
    window.scrollTo({ top: 0 });
  }

  destroy() {
    window.removeEventListener('scroll', this.#boundHandleScroll);
    window.removeEventListener('pointermove', this.#boundPointerMove);
  }

  #bindGuestLink() {
    const guest = document.getElementById('btnQuickGuestPath');
    if (!guest) return;
    guest.addEventListener('click', (e) => {
      e.preventDefault();
      try { localStorage.setItem('exis_active_profile_v1', 'invitado'); } catch (err) {}
      window.location.href = 'index.html?screen=path';
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
  }

  #handleSpotlightMove(e) {
    const spotlight = document.getElementById('cursorSpotlight');
    if (!spotlight) return;
    spotlight.style.left = `${e.clientX}px`;
    spotlight.style.top = `${e.clientY}px`;
  }

  #initInteractiveTiltAndSpotlight() {
    window.addEventListener('pointermove', this.#boundPointerMove, { passive: true });

    const tiltCard = document.getElementById('solHoloCapsule');
    if (!tiltCard) return;
    tiltCard.addEventListener('pointermove', (e) => {
      const rect = tiltCard.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      tiltCard.style.transform = `perspective(900px) rotateY(${(x * 7).toFixed(2)}deg) rotateX(${(-y * 7).toFixed(2)}deg)`;
    });
    tiltCard.addEventListener('pointerleave', () => {
      tiltCard.style.transform = 'perspective(900px) rotateY(0deg) rotateX(0deg)';
    });
  }
}

window.LandingPortalController = new LandingPortalController();

document.addEventListener('DOMContentLoaded', () => {
  window.LandingPortalController.init();
  window.LandingPortalController.start();
});
