/**
 * Manitas · Lengua de Señas Colombiana (LSC)
 * perfil-page.js - Controlador POO de la página dedicada Mi Perfil (perfil.html)
 */

class PerfilPageController {
  #boundOpenSidebar;
  #boundCloseSidebar;

  constructor() {
    this.#boundOpenSidebar = () => this.#setSidebarOpen(true);
    this.#boundCloseSidebar = () => this.#setSidebarOpen(false);
  }

  init() {
    if (window.AuthProfileManager && typeof window.AuthProfileManager.init === 'function') {
      window.AuthProfileManager.init();
    }

    const btnToggle = document.getElementById('btnMobileMenuToggle');
    const backdrop = document.getElementById('sidebarBackdrop');

    if (btnToggle) btnToggle.addEventListener('click', this.#boundOpenSidebar);
    if (backdrop) backdrop.addEventListener('click', this.#boundCloseSidebar);
  }

  start() {
    if (window.AuthProfileManager && typeof window.AuthProfileManager.updateUI === 'function') {
      window.AuthProfileManager.updateUI();
    }
  }

  update() {
    this.start();
  }

  reset() {
    this.#setSidebarOpen(false);
  }

  destroy() {
    const btnToggle = document.getElementById('btnMobileMenuToggle');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (btnToggle) btnToggle.removeEventListener('click', this.#boundOpenSidebar);
    if (backdrop) backdrop.removeEventListener('click', this.#boundCloseSidebar);
  }

  #setSidebarOpen(isOpen) {
    const sidebar = document.getElementById('appSidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (sidebar) sidebar.classList.toggle('is-open', isOpen);
    if (backdrop) backdrop.classList.toggle('hidden', !isOpen);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.PerfilPageController = new PerfilPageController();
  window.PerfilPageController.init();
  window.PerfilPageController.start();
});
