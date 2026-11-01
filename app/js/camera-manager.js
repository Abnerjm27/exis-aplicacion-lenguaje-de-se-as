/**
 * LSC Learn · Proyecto EXIS
 * camera-manager.js - Gestor Orientado a Objetos para Selección y Streaming de Cámaras
 * Soporte robusto para cámaras de laptop y cámaras de celular vía USB (DroidCam, Iriun, Camo, etc.)
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
      // Al cambiar de cámara en el desplegable, cambiar y mostrar inmediatamente
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

      // Si hace clic en el selector y los nombres aún no tienen permiso, desbloquearlos
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

    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', this.#boundOnDeviceChange);
    }

    // Enumerar dispositivos iniciales
    this.refreshDeviceList().catch((err) => {
      console.warn('[CameraDeviceManager] Error al enumerar dispositivos iniciales:', err);
    });
  }

  /**
   * Determina si la lista de dispositivos aún no tiene etiquetas legibles
   * @returns {boolean}
   */
  #needsPermissionForLabels() {
    if (this.#deviceList.length === 0) return true;
    return this.#deviceList.every(d => !d.label || d.label.trim() === '');
  }

  /**
   * Solicita permiso breve de cámara para que el navegador desbloquee los nombres de los dispositivos
   */
  async requestPermissionAndRefresh() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;

    try {
      if (!this.#isStreaming) {
        // Pedir stream temporal de 1 frame para desbloquear nombres reales
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        tempStream.getTracks().forEach(t => {
          try { t.stop(); } catch (e) {}
        });
      }
      await this.refreshDeviceList();
    } catch (err) {
      console.warn('[CameraDeviceManager] No se pudo obtener permiso previo para etiquetas:', err);
      await this.refreshDeviceList();
    }
  }

  /**
   * Obtiene la lista de cámaras conectadas y actualiza el elemento <select>
   */
  async refreshDeviceList() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      console.warn('[CameraDeviceManager] navigator.mediaDevices.enumerateDevices no soportado.');
      return [];
    }

    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      this.#deviceList = allDevices.filter(d => d.kind === 'videoinput');
      this.#renderSelectOptions();
      return this.#deviceList;
    } catch (err) {
      console.error('[CameraDeviceManager] Error al listar cámaras:', err);
      return [];
    }
  }

  /**
   * Renderiza las opciones en el <select> destacando DroidCam, Iriun y cámaras externas
   */
  #renderSelectOptions() {
    if (!this.#selectElement) return;

    const previousSelected = this.#selectedDeviceId || this.#selectElement.value;
    this.#selectElement.innerHTML = '';

    if (this.#deviceList.length === 0) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = '🔍 Clic para buscar cámaras...';
      this.#selectElement.appendChild(opt);
      return;
    }

    // Si detectamos DroidCam, la priorizamos o la colocamos al inicio
    const sorted = [...this.#deviceList].sort((a, b) => {
      const aDroid = (a.label || '').toLowerCase().includes('droidcam') ? 1 : 0;
      const bDroid = (b.label || '').toLowerCase().includes('droidcam') ? 1 : 0;
      return bDroid - aDroid;
    });

    sorted.forEach((device, index) => {
      const opt = document.createElement('option');
      opt.value = device.deviceId;
      opt.textContent = this.#formatDeviceLabel(device.label, index);
      this.#selectElement.appendChild(opt);
    });

    // Restaurar selección previa si existe
    if (previousSelected && sorted.some(d => d.deviceId === previousSelected)) {
      this.#selectElement.value = previousSelected;
      this.#selectedDeviceId = previousSelected;
    } else {
      this.#selectElement.value = sorted[0].deviceId;
      this.#selectedDeviceId = sorted[0].deviceId;
    }
  }

  /**
   * Formatea el nombre de la cámara con iconos identificadores
   * @param {string} label
   * @param {number} index
   * @returns {string}
   */
  #formatDeviceLabel(label, index) {
    if (!label || label.trim() === '') {
      return `📷 Cámara ${index + 1} (Clic para activar)`;
    }

    const lower = label.toLowerCase();
    if (lower.includes('droidcam')) {
      return `📱 DroidCam (Celular USB)`;
    }
    if (lower.includes('iriun')) {
      return `📱 Iriun (Celular USB)`;
    }
    if (lower.includes('camo')) {
      return `📱 Camo (Celular USB)`;
    }
    if (lower.includes('epoccam')) {
      return `📱 EpocCam (Celular USB)`;
    }
    if (lower.includes('obs')) {
      return `🎥 OBS Virtual Camera`;
    }
    if (lower.includes('hp true vision') || lower.includes('integrated') || lower.includes('integrada')) {
      return `💻 Cámara Laptop`;
    }
    if (lower.includes('back') || lower.includes('rear') || lower.includes('trasera')) {
      return `📷 Cámara Trasera`;
    }
    if (lower.includes('front') || lower.includes('frontal') || lower.includes('delantera')) {
      return `📷 Cámara Frontal`;
    }
    if (lower.includes('usb')) {
      return `📷 USB: ${label.substring(0, 18)}`;
    }
    return `📷 ${label.substring(0, 22)}`;
  }

  /**
   * Inicia el flujo de video con la cámara solicitada
   * @param {string|null} deviceId
   * @returns {Promise<boolean>}
   */
  async start(deviceId = null) {
    if (!this.#videoElement) {
      console.error('[CameraDeviceManager] videoElement no definido.');
      return false;
    }

    if (deviceId) {
      this.#selectedDeviceId = deviceId;
      if (this.#selectElement && this.#selectElement.value !== deviceId) {
        this.#selectElement.value = deviceId;
      }
    } else if (!this.#selectedDeviceId && this.#selectElement && this.#selectElement.value) {
      this.#selectedDeviceId = this.#selectElement.value;
    }

    // Detener stream previo limpiamente
    this.stop();

    // Configurar restricciones flexibles para máxima compatibilidad con DroidCam y Webcams
    const videoConstraints = {
      width: { ideal: 640 },
      height: { ideal: 480 }
    };

    if (this.#selectedDeviceId) {
      videoConstraints.deviceId = { ideal: this.#selectedDeviceId };
    }

    try {
      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: videoConstraints
        });
      } catch (errConstraint) {
        console.warn('[CameraDeviceManager] Reintentando con configuración básica de video:', errConstraint);
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: true
        });
      }

      this.#currentStream = stream;
      this.#videoElement.srcObject = stream;
      this.#videoElement.muted = true;
      this.#videoElement.setAttribute('playsinline', 'true');

      // Reproducir video sin bloqueos de promesa
      try {
        await this.#videoElement.play();
      } catch (playErr) {
        console.warn('[CameraDeviceManager] Esperando evento loadeddata para reproducir:', playErr);
        await new Promise((resolve) => {
          const timeout = setTimeout(resolve, 1500);
          this.#videoElement.onloadeddata = () => {
            clearTimeout(timeout);
            this.#videoElement.play().catch(() => {}).finally(resolve);
          };
        });
      }

      this.#isStreaming = true;

      // Actualizar lista de dispositivos con los nombres ya autorizados
      await this.refreshDeviceList();

      // Iniciar bucle de entrega de fotogramas a MediaPipe
      this.#startFramePump();
      return true;
    } catch (err) {
      console.error('[CameraDeviceManager] Error al abrir cámara:', err);
      this.stop();
      throw err;
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
