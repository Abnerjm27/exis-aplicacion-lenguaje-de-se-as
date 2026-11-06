/**
 * Manitas · Mascot Gallery Controller (POO / ES6)
 * Cumple estrictamente con la Regla 8 de AGENTS.md (SRP, encapsulación, ciclo de vida).
 */

export class MascotGalleryController {
  #currentFormat = 'svg'; // 'svg' | 'png'
  #currentBg = 'dark'; // 'dark' | 'light' | 'checker'
  #currentAnim = 'active'; // 'active' | 'paused'
  #cards = [];

  constructor() {
    this.#cards = [
      {
        id: 'saludo',
        name: 'Zorrito Saludo',
        role: 'Bienvenida / Landing & Login',
        defaultAnim: 'anim-wave',
        svgPath: 'img/zorrito/svg/zorrito_saludo.svg',
        pngPath: 'img/zorrito/png/zorrito_saludo.png',
        tag: 'Bienvenida',
        tagType: 'badge-tag-turquoise'
      },
      {
        id: 'explicando',
        name: 'Zorrito Tutor',
        role: 'Explicación de Señas / Clases',
        defaultAnim: 'anim-float',
        svgPath: 'img/zorrito/svg/zorrito_explicando.svg',
        pngPath: 'img/zorrito/png/zorrito_explicando.png',
        tag: 'Pedagógico',
        tagType: 'badge-tag-sun'
      },
      {
        id: 'pensando',
        name: 'Zorrito Pensando',
        role: 'Cuestionario / Onboarding & Exámenes',
        defaultAnim: 'anim-pulse',
        svgPath: 'img/zorrito/svg/zorrito_pensando.svg',
        pngPath: 'img/zorrito/png/zorrito_pensando.png',
        tag: 'Evaluación',
        tagType: 'badge-tag-sun'
      },
      {
        id: 'pulgar',
        name: 'Zorrito Ánimo',
        role: 'Rachas de Estudio & Motivación',
        defaultAnim: 'anim-wiggle',
        svgPath: 'img/zorrito/svg/zorrito_pulgar.svg',
        pngPath: 'img/zorrito/png/zorrito_pulgar.png',
        tag: 'Motivación',
        tagType: 'badge-tag-coral'
      },
      {
        id: 'celebracion',
        name: 'Zorrito Celebración',
        role: 'Acierto de Seña & Victorias',
        defaultAnim: 'anim-bounce',
        svgPath: 'img/zorrito/svg/zorrito_celebracion.svg',
        pngPath: 'img/zorrito/png/zorrito_celebracion.png',
        tag: '¡Acierto!',
        tagType: 'badge-tag-coral'
      }
    ];
  }

  /**
   * Inicializa listeners de control y renderizado inicial
   */
  init() {
    this.#setupGlobalControls();
    this.update();
  }

  #setupGlobalControls() {
    // Botones de formato (SVG vs PNG)
    const btnSvg = document.getElementById('btnFormatSvg');
    const btnPng = document.getElementById('btnFormatPng');

    btnSvg?.addEventListener('click', () => {
      this.#currentFormat = 'svg';
      this.#updateFormatButtons(btnSvg, btnPng);
      this.update();
    });

    btnPng?.addEventListener('click', () => {
      this.#currentFormat = 'png';
      this.#updateFormatButtons(btnPng, btnSvg);
      this.update();
    });

    // Botones de fondo
    const bgButtons = document.querySelectorAll('[data-bg-target]');
    bgButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const bg = btn.getAttribute('data-bg-target');
        this.#currentBg = bg;
        bgButtons.forEach(b => b.classList.remove('bg-turquoise', 'text-navy', 'font-bold'));
        btn.classList.add('bg-turquoise', 'text-navy', 'font-bold');
        this.#updateBackgrounds();
      });
    });

    // Botón de toggle animación
    const btnAnimToggle = document.getElementById('btnAnimToggle');
    btnAnimToggle?.addEventListener('click', () => {
      this.#currentAnim = this.#currentAnim === 'active' ? 'paused' : 'active';
      btnAnimToggle.textContent = this.#currentAnim === 'active' ? '⏸️ Pausar Animaciones' : '▶️ Reanudar Animaciones';
      this.#updateAnimationState();
    });
  }

  #updateFormatButtons(activeBtn, inactiveBtn) {
    activeBtn.classList.remove('bg-navy-surface', 'text-bone-dim');
    activeBtn.classList.add('bg-turquoise', 'text-navy', 'font-bold');
    inactiveBtn.classList.remove('bg-turquoise', 'text-navy', 'font-bold');
    inactiveBtn.classList.add('bg-navy-surface', 'text-bone-dim');

    const badgeFormat = document.getElementById('currentFormatBadge');
    if (badgeFormat) {
      badgeFormat.textContent = this.#currentFormat.toUpperCase();
    }
  }

  #updateBackgrounds() {
    const stages = document.querySelectorAll('.stage-wrapper');
    stages.forEach(stage => {
      stage.classList.remove('stage-dark', 'stage-light', 'stage-checker');
      stage.classList.add(`stage-${this.#currentBg}`);
    });
  }

  #updateAnimationState() {
    const images = document.querySelectorAll('.mascot-image');
    images.forEach(img => {
      if (this.#currentAnim === 'paused') {
        img.classList.add('anim-none');
      } else {
        img.classList.remove('anim-none');
      }
    });
  }

  /**
   * Actualiza el src de las imágenes y enlaces de descarga
   */
  update() {
    this.#cards.forEach(card => {
      const imgEl = document.getElementById(`img-${card.id}`);
      const linkEl = document.getElementById(`link-${card.id}`);
      const sizeEl = document.getElementById(`size-${card.id}`);

      if (imgEl) {
        const newSrc = this.#currentFormat === 'svg' ? card.svgPath : card.pngPath;
        imgEl.src = newSrc;
      }

      if (linkEl) {
        const downloadHref = this.#currentFormat === 'svg' ? card.svgPath : card.pngPath;
        linkEl.href = downloadHref;
        linkEl.setAttribute('download', `${card.id}.${this.#currentFormat}`);
        linkEl.textContent = `Descargar .${this.#currentFormat.toUpperCase()}`;
      }

      if (sizeEl) {
        sizeEl.textContent = this.#currentFormat === 'svg' ? 'Vectorial Escala Libre' : 'Raster 32-bit Transparente';
      }
    });

    this.#updateBackgrounds();
    this.#updateAnimationState();
  }

  destroy() {
    // Liberación de recursos
    this.#cards = [];
  }
}

// Auto-iniciar al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  const gallery = new MascotGalleryController();
  gallery.init();
  window.__mascotGallery = gallery;
});
