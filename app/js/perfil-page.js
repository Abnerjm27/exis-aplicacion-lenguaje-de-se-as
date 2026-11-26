/**
 * Manitas · Lengua de Señas Colombiana (LSC)
 * perfil-page.js - Controlador POO de la página dedicada Mi Perfil (perfil.html)
 */

class PerfilPageController {
  #boundOpenSidebar;
  #boundCloseSidebar;
  #boundDownloadCert;

  constructor() {
    this.#boundOpenSidebar = () => this.#setSidebarOpen(true);
    this.#boundCloseSidebar = () => this.#setSidebarOpen(false);
    this.#boundDownloadCert = () => this.#handleDownloadCert();
  }

  init() {
    if (window.AuthProfileManager && typeof window.AuthProfileManager.init === 'function') {
      window.AuthProfileManager.init();
    }

    const btnToggle = document.getElementById('btnMobileMenuToggle');
    const backdrop = document.getElementById('sidebarBackdrop');
    const btnCert = document.getElementById('btnDownloadProfileCert');

    if (btnToggle) btnToggle.addEventListener('click', this.#boundOpenSidebar);
    if (backdrop) backdrop.addEventListener('click', this.#boundCloseSidebar);
    if (btnCert) btnCert.addEventListener('click', this.#boundDownloadCert);
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
    const btnCert = document.getElementById('btnDownloadProfileCert');
    if (btnToggle) btnToggle.removeEventListener('click', this.#boundOpenSidebar);
    if (backdrop) backdrop.removeEventListener('click', this.#boundCloseSidebar);
    if (btnCert) btnCert.removeEventListener('click', this.#boundDownloadCert);
  }

  #handleDownloadCert() {
    if (!window.CertificateGenerator || typeof window.CertificateGenerator.downloadCertificate !== 'function') {
      return;
    }
    const profile = (window.AuthProfileManager && typeof window.AuthProfileManager.getCurrentProfile === 'function')
      ? window.AuthProfileManager.getCurrentProfile()
      : { name: 'Estudiante LSC', xp: 0, level: 'Principiante' };
    const masteryText = document.getElementById('masteryTotalCount')?.textContent || 'Progreso LSC70';

    window.CertificateGenerator.downloadCertificate({
      studentName: profile.name || 'Estudiante LSC',
      title: 'Certificado de Progreso · Manitas LSC',
      subtitle: 'Constancia de práctica y maestría en Lengua de Señas Colombiana',
      metricPrimary: `${masteryText} Señas`,
      metricSecondary: `${Number(profile.xp) || 0} XP`,
      level: profile.level || 'Principiante'
    });
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
