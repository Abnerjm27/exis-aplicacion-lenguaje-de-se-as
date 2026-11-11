/**
 * pwa-manager.js — Gestor de Instalación y Ciclo de Vida PWA (POO)
 * 
 * Responsabilidades:
 * - Registro del Service Worker (/sw.js)
 * - Captura del evento 'beforeinstallprompt' para instalación controlada
 * - Detección de ejecución en modo standalone (App instalada)
 * - Notificación visual al usuario/jurado para instalar Manitas en 1 clic
 */

class PWAManager {
  static #deferredPrompt = null;
  static #isInstalled = false;

  static init() {
    this.#checkStandaloneMode();
    this.#registerServiceWorker();
    this.#setupInstallPromptListener();
    this.#setupUIListeners();
  }

  static #checkStandaloneMode() {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         window.navigator.standalone === true;
    if (isStandalone) {
      this.#isInstalled = true;
      document.body.classList.add('pwa-standalone');
      console.log("[PWA] Ejecutando en modo Standalone (App instalada).");
    }
  }

  static #registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log("[PWA] Service Worker registrado exitosamente:", registration.scope);
          })
          .catch((error) => {
            console.warn("[PWA] Error al registrar Service Worker:", error);
          });
      });
    }
  }

  static #setupInstallPromptListener() {
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevenir el infobar automático del navegador
      e.preventDefault();
      this.#deferredPrompt = e;

      // Mostrar botones de instalación si no estamos ya en standalone
      if (!this.#isInstalled) {
        this.#showInstallButton();
      }
    });

    window.addEventListener('appinstalled', () => {
      this.#isInstalled = true;
      this.#deferredPrompt = null;
      this.#hideInstallButton();
      console.log("[PWA] Manitas ha sido instalada exitosamente en el dispositivo.");
    });
  }

  static #setupUIListeners() {
    const btn = document.getElementById('btnInstallPwa');
    if (btn) {
      btn.addEventListener('click', () => this.promptInstall());
    }
    const btnNav = document.getElementById('btnInstallPwaNav');
    if (btnNav) {
      btnNav.addEventListener('click', () => this.promptInstall());
    }
  }

  static #showInstallButton() {
    const btn = document.getElementById('btnInstallPwa');
    if (btn) btn.classList.remove('hidden');
    const btnNav = document.getElementById('btnInstallPwaNav');
    if (btnNav) btnNav.classList.remove('hidden');
  }

  static #hideInstallButton() {
    const btn = document.getElementById('btnInstallPwa');
    if (btn) btn.classList.add('hidden');
    const btnNav = document.getElementById('btnInstallPwaNav');
    if (btnNav) btnNav.classList.add('hidden');
  }

  static async promptInstall() {
    if (!this.#deferredPrompt) {
      console.log("[PWA] La instalación directa no está disponible en este navegador o ya está instalada.");
      return;
    }

    try {
      this.#deferredPrompt.prompt();
      const choiceResult = await this.#deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log("[PWA] El usuario aceptó la instalación de Manitas.");
      } else {
        console.log("[PWA] El usuario canceló la instalación.");
      }
      this.#deferredPrompt = null;
      this.#hideInstallButton();
    } catch (err) {
      console.warn("[PWA] Error al solicitar instalación:", err);
    }
  }

  static get isInstalled() {
    return this.#isInstalled;
  }
}

// Inicialización automática
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => PWAManager.init());
  } else {
    PWAManager.init();
  }
}

// Exportación global
window.PWAManager = PWAManager;
