/**
 * LSC Learn · Proyecto EXIS
 * camera-manager.js - Gestor Orientado a Objetos para Detección y Conmutación de Cámaras
 * Detecta dinámicamente cualquier cámara conectada (cámara interna, USB, segunda cámara o fuentes externas)
 * Cumple con Regla 8 (POO, Encapsulación y Ciclo de Vida) y Regla 1 (< 1,100 líneas).
 */

class CameraDeviceManager {
  #videoElement = null;
  #selectElement = null;
  #refreshButton = null;
  #currentStream = null;
  #selectedDeviceId = null;
  #isStreaming = false;
  #onFrameCallback = null;
  #frameCallbackId = null;
  #deviceList = [];
  #isSwitching = false;
  #boundOnDeviceChange = null;

  constructor() {
    this.#boundOnDeviceChange = () => this.refreshDeviceList();
  }

  /**
   * Inicializa el gestor con los elementos del DOM y callbacks requeridos
   * @param {HTMLVideoElement} videoElement
   * @param {HTMLSelectElement} selectElement
   * @param {Function} onFrameCallback
   * @param {HTMLButtonElement} refreshButton
   */
  init(videoElement, selectElement, onFrameCallback = null, refreshButton = null) {
    this.#videoElement = videoElement;
    this.#selectElement = selectElement;
    this.#onFrameCallback = onFrameCallback;
    this.#refreshButton = refreshButton;

    if (this.#selectElement) {
      // Al cambiar la opción en el selector, activar la cámara elegida de inmediato
      this.#selectElement.addEventListener('change', async (e) => {
        const newDeviceId = e.target.value;
        if (!newDeviceId) return;
        this.#selectedDeviceId = newDeviceId;

        if (window.VisionEvaluator) {
          await window.VisionEvaluator.startWithDevice(newDeviceId);
        } else {
          await this.start(newDeviceId);
        }
      });

      // Si el usuario enfoca el desplegable y aún no hay nombres legibles, solicitar permiso
      this.#selectElement.addEventListener('focus', () => {
        if (this.#needsPermissionForLabels()) {
          this.requestPermissionAndRefresh();
        }
      });
    }

    if (this.#refreshButton) {
      this.#refreshButton.addEventListener('click', async () => {
        await this.requestPermissionAndRefresh();
      });
    }

    // Escuchar conexión o desconexión física de cámaras en caliente
    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', this.#boundOnDeviceChange);
    }

    // Enumerar dispositivos iniciales
    this.refreshDeviceList().catch((err) => {
      console.warn('[CameraDeviceManager] Error al enumerar dispositivos iniciales:', err);
    });
  }

  /**
   * Comprueba si las etiquetas de los dispositivos aún no han sido concedidas por el navegador
   * @returns {boolean}
   */
  #needsPermissionForLabels() {
    if (this.#deviceList.length === 0) return true;
    return this.#deviceList.every(d => !d.label || d.label.trim() === '');
  }

  /**
   * Solicita acceso inicial a la cámara para desbloquear los nombres de todos los dispositivos conectados
   */
  async requestPermissionAndRefresh() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;

    try {
      if (!this.#isStreaming && !this.#currentStream) {
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        tempStream.getTracks().forEach(t => {
          try { t.stop(); } catch (e) {}
        });
        // Pausa breve para que el sistema operativo libere el hardware
        await new Promise(r => setTimeout(r, 200));
      }
      await this.refreshDeviceList();
    } catch (err) {
      console.warn('[CameraDeviceManager] Permiso de cámara no concedido aún:', err);
      await this.refreshDeviceList();
    }
  }

  /**
   * Detecta y enumera todas las cámaras de video disponibles en el equipo
   */
  async refreshDeviceList() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      console.warn('[CameraDeviceManager] navigator.mediaDevices no disponible.');
      return [];
    }

    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      this.#deviceList = allDevices.filter(d => d.kind === 'videoinput');
      this.#renderSelectOptions();
      return this.#deviceList;
    } catch (err) {
      console.error('[CameraDeviceManager] Error al enumerar cámaras:', err);
      return [];
    }
  }

  /**
   * Renderiza las cámaras detectadas en el elemento <select>
   */
  #renderSelectOptions() {
    if (!this.#selectElement) return;

    const previousSelected = this.#selectedDeviceId || this.#selectElement.value;
    this.#selectElement.innerHTML = '';

    if (this.#deviceList.length === 0) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = '📷 Cámara predeterminada';
      this.#selectElement.appendChild(opt);
      return;
    }

    this.#deviceList.forEach((device, index) => {
      const opt = document.createElement('option');
      opt.value = device.deviceId;
      opt.textContent = this.#formatDeviceLabel(device.label, index);
      this.#selectElement.appendChild(opt);
    });

    // Mantener la cámara que estaba seleccionada previamente
    if (previousSelected && this.#deviceList.some(d => d.deviceId === previousSelected)) {
      this.#selectElement.value = previousSelected;
      this.#selectedDeviceId = previousSelected;
    } else {
      this.#selectElement.value = this.#deviceList[0].deviceId;
      this.#selectedDeviceId = this.#deviceList[0].deviceId;
    }
  }

  /**
   * Formatea el nombre genérico o real de la cámara detectada
   * @param {string} label
   * @param {number} index
   * @returns {string}
   */
  #formatDeviceLabel(label, index) {
    if (!label || label.trim() === '') {
      return index === 0 ? '📷 Cámara 1 (Principal)' : `📷 Cámara ${index + 1} (Secundaria)`;
    }

    // Limpiar IDs técnicos o códigos hexadecimales entre paréntesis si existen
    const cleanLabel = label.replace(/\s*\([0-9a-fA-F]{4}:[0-9a-fA-F]{4}\)\s*/g, '').trim();

    return `📷 ${cleanLabel.substring(0, 24)}`;
  }

  /**
   * Inicia el flujo de video con la cámara indicada
   * @param {string|null} deviceId
   * @returns {Promise<boolean>}
   */
  async start(deviceId = null) {
    if (!this.#videoElement) {
      console.error('[CameraDeviceManager] Elemento de video no configurado.');
      return false;
    }

    const targetId = deviceId || (this.#selectElement ? this.#selectElement.value : null) || this.#selectedDeviceId;
    if (targetId) {
      this.#selectedDeviceId = targetId;
      if (this.#selectElement && this.#selectElement.value !== targetId) {
        this.#selectElement.value = targetId;
      }
    }

    const hadStream = !!this.#currentStream;
    this.stop();
    if (hadStream) {
      await new Promise(r => setTimeout(r, 250));
    }

    // Configurar restricciones de video
    const videoConstraints = {
      width: { ideal: 640 },
      height: { ideal: 480 }
    };

    if (this.#selectedDeviceId) {
      videoConstraints.deviceId = { exact: this.#selectedDeviceId };
    }

    try {
      let stream = null;
      let lastErr = null;

      // Intentar abrir el dispositivo con reintento ante bloqueo temporal
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: videoConstraints
          });
          break;
        } catch (errAttempt) {
          lastErr = errAttempt;
          if (attempt === 0 && (errAttempt.name === 'NotReadableError' || errAttempt.message?.includes('in use'))) {
            console.warn('[CameraDeviceManager] Cámara ocupada temporalmente, esperando liberación de driver...');
            await new Promise(r => setTimeout(r, 350));
            continue;
          }
          break;
        }
      }

      // Si falló con exact, reintentar con ideal
      if (!stream && this.#selectedDeviceId) {
        try {
          videoConstraints.deviceId = { ideal: this.#selectedDeviceId };
          stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: videoConstraints
          });
        } catch (eIdeal) {
          console.warn('[CameraDeviceManager] Fallo en intento con ideal:', eIdeal);
        }
      }

      if (!stream) {
        throw lastErr || new Error('No se pudo inicializar la cámara solicitada.');
      }

      this.#currentStream = stream;
      this.#videoElement.srcObject = stream;
      this.#videoElement.muted = true;
      this.#videoElement.setAttribute('playsinline', 'true');

      try {
        await this.#videoElement.play();
      } catch (playErr) {
        console.warn('[CameraDeviceManager] Esperando loadeddata para reproducir:', playErr);
        await new Promise((resolve) => {
          const timeout = setTimeout(resolve, 1500);
          this.#videoElement.onloadeddata = () => {
            clearTimeout(timeout);
            this.#videoElement.play().catch(() => {}).finally(resolve);
          };
        });
      }

      this.#isStreaming = true;

      // Actualizar el indicador visual de la cámara activa en pantalla
      const activeTrack = stream.getVideoTracks()[0];
      const activeLabel = activeTrack ? activeTrack.label : '';
      this.#updateActivePillUI(activeLabel);

      // Refrescar lista de dispositivos para obtener nombres autorizados
      await this.refreshDeviceList();

      // Iniciar el bucle de entrega de fotogramas
      this.#startFramePump();
      return true;
    } catch (err) {
      console.error('[CameraDeviceManager] Error al abrir cámara:', err);
      this.stop();
      throw err;
    }
  }

  /**
   * Actualiza el badge visual en pantalla indicando qué cámara está transmitiendo
   * @param {string} activeLabel
   */
  #updateActivePillUI(activeLabel) {
    const badge = document.getElementById('activeCameraPill');
    const badgeLabel = document.getElementById('activeCameraLabel');
    if (!badge || !badgeLabel) return;

    if (activeLabel) {
      badge.classList.remove('hidden');
      badgeLabel.textContent = this.#formatDeviceLabel(activeLabel, 0);
    } else {
      badge.classList.add('hidden');
    }
  }

  /**
   * Bucle de captura de fotogramas sincronizado de ultra-baja latencia
   */
  #startFramePump() {
    this.#stopFramePump();

    const processFrame = async () => {
      if (!this.#isStreaming || !this.#videoElement) return;

      if (this.#onFrameCallback && this.#videoElement.readyState >= 2) {
        try {
          await this.#onFrameCallback(this.#videoElement);
        } catch (frameErr) {
          console.warn('[CameraDeviceManager] Error en onFrameCallback:', frameErr);
        }
      }

      if (this.#isStreaming) {
        if ('requestVideoFrameCallback' in this.#videoElement) {
          this.#frameCallbackId = this.#videoElement.requestVideoFrameCallback(processFrame);
        } else {
          this.#frameCallbackId = requestAnimationFrame(processFrame);
        }
      }
    };

    if ('requestVideoFrameCallback' in this.#videoElement) {
      this.#frameCallbackId = this.#videoElement.requestVideoFrameCallback(processFrame);
    } else {
      this.#frameCallbackId = requestAnimationFrame(processFrame);
    }
  }

  /**
   * Detiene el bucle de fotogramas
   */
  #stopFramePump() {
    if (this.#frameCallbackId !== null) {
      if (this.#videoElement && 'cancelVideoFrameCallback' in this.#videoElement) {
        this.#videoElement.cancelVideoFrameCallback(this.#frameCallbackId);
      } else {
        cancelAnimationFrame(this.#frameCallbackId);
      }
      this.#frameCallbackId = null;
    }
  }

  /**
   * Detiene la cámara y libera todos los recursos del hardware
   */
  stop() {
    this.#isStreaming = false;
    this.#stopFramePump();

    const badge = document.getElementById('activeCameraPill');
    if (badge) badge.classList.add('hidden');

    if (this.#currentStream) {
      this.#currentStream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {}
      });
      this.#currentStream = null;
    }

    if (this.#videoElement) {
      this.#videoElement.srcObject = null;
    }
  }

  /**
   * Destruye la instancia y libera listeners
   */
  destroy() {
    this.stop();
    if (navigator.mediaDevices && navigator.mediaDevices.removeEventListener) {
      navigator.mediaDevices.removeEventListener('devicechange', this.#boundOnDeviceChange);
    }
  }

  // Getters de estado
  get isStreaming() {
    return this.#isStreaming;
  }

  get selectedDeviceId() {
    return this.#selectedDeviceId;
  }

  get devices() {
    return [...this.#deviceList];
  }
}

// Exportación global y singleton
window.CameraDeviceManager = CameraDeviceManager;
window.CameraManager = new CameraDeviceManager();
