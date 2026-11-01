/**
 * LSC Learn · Proyecto EXIS
 * camera-manager.js - Gestor Orientado a Objetos para Selección y Streaming de Cámaras
 * Soporte nativo para cámara web de laptop y cámaras de celular vía USB (DroidCam, Iriun, Camo, etc.)
 * Cumple estrictamente con la Regla 8 (POO, Encapsulación y Ciclo de Vida) y Regla 1 (< 1,100 líneas).
 */

class CameraDeviceManager {
  #videoElement = null;
  #selectElement = null;
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
   */
  init(videoElement, selectElement, onFrameCallback = null) {
    this.#videoElement = videoElement;
    this.#selectElement = selectElement;
    this.#onFrameCallback = onFrameCallback;

    if (this.#selectElement) {
      this.#selectElement.addEventListener('change', async (e) => {
        const newDeviceId = e.target.value;
        if (newDeviceId !== this.#selectedDeviceId) {
          await this.switchDevice(newDeviceId);
        }
      });
    }

    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', this.#boundOnDeviceChange);
    }

    // Inicializar lista de dispositivos disponibles
    this.refreshDeviceList().catch((err) => {
      console.warn('[CameraDeviceManager] Error al enumerar dispositivos iniciales:', err);
    });
  }

  /**
   * Obtiene la lista de cámaras conectadas y actualiza el elemento <select>
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
      console.error('[CameraDeviceManager] Error al listar cámaras:', err);
      return [];
    }
  }

  /**
   * Genera las opciones dentro del <select> con etiquetas claras e iconografía
   */
  #renderSelectOptions() {
    if (!this.#selectElement) return;

    const currentVal = this.#selectElement.value;
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

    // Mantener selección previa o seleccionar la activa
    if (this.#selectedDeviceId && this.#deviceList.some(d => d.deviceId === this.#selectedDeviceId)) {
      this.#selectElement.value = this.#selectedDeviceId;
    } else if (currentVal && this.#deviceList.some(d => d.deviceId === currentVal)) {
      this.#selectElement.value = currentVal;
      this.#selectedDeviceId = currentVal;
    } else {
      this.#selectElement.value = this.#deviceList[0].deviceId;
      this.#selectedDeviceId = this.#deviceList[0].deviceId;
    }
  }

  /**
   * Formatea la etiqueta del dispositivo destacando celulares USB o cámaras externas
   * @param {string} label
   * @param {number} index
   * @returns {string}
   */
  #formatDeviceLabel(label, index) {
    if (!label) return `📷 Cámara ${index + 1}`;

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
    if (lower.includes('back') || lower.includes('rear') || lower.includes('trasera')) {
      return `📷 Cámara Trasera`;
    }
    if (lower.includes('front') || lower.includes('frontal') || lower.includes('delantera')) {
      return `📷 Cámara Frontal`;
    }
    if (lower.includes('usb')) {
      return `📷 Cámara USB: ${label.substring(0, 20)}`;
    }
    return `📷 ${label.substring(0, 24)}`;
  }

  /**
   * Inicia el flujo de video con la cámara seleccionada
   * @param {string|null} preferredDeviceId
   * @returns {Promise<boolean>}
   */
  async start(preferredDeviceId = null) {
    if (!this.#videoElement) {
      console.error('[CameraDeviceManager] Elemento de video no configurado.');
      return false;
    }

    if (preferredDeviceId) {
      this.#selectedDeviceId = preferredDeviceId;
    } else if (!this.#selectedDeviceId && this.#selectElement && this.#selectElement.value) {
      this.#selectedDeviceId = this.#selectElement.value;
    }

    this.stop();

    const constraints = {
      audio: false,
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 30, max: 30 }
      }
    };

    if (this.#selectedDeviceId) {
      constraints.video.deviceId = { exact: this.#selectedDeviceId };
    }

    try {
      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (errConstraint) {
        // Fallback sin exact deviceId si el navegador restringe constraints exactos
        console.warn('[CameraDeviceManager] Fallback a restricciones genéricas:', errConstraint);
        delete constraints.video.deviceId;
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      }

      this.#currentStream = stream;
      this.#videoElement.srcObject = stream;

      await new Promise((resolve) => {
        this.#videoElement.onloadedmetadata = () => {
          this.#videoElement.play().then(resolve).catch(resolve);
        };
      });

      this.#isStreaming = true;

      // Una vez concedido el permiso, los nombres reales de los dispositivos se desbloquean
      await this.refreshDeviceList();

      this.#startFramePump();
      return true;
    } catch (err) {
      console.error('[CameraDeviceManager] Error al abrir cámara:', err);
      this.stop();
      throw err;
    }
  }

  /**
   * Bucle de captura de fotogramas sincronizado de baja latencia
   */
  #startFramePump() {
    this.#stopFramePump();

    const processFrame = async () => {
      if (!this.#isStreaming || !this.#videoElement) return;

      if (this.#onFrameCallback && this.#videoElement.readyState >= 2) {
        try {
          await this.#onFrameCallback(this.#videoElement);
        } catch (frameErr) {
          console.warn('[CameraDeviceManager] Error en callback de frame:', frameErr);
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
   * Detiene el bucle de procesamiento de fotogramas
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
   * Alterna a un nuevo dispositivo de cámara de forma fluida
   * @param {string} deviceId
   */
  async switchDevice(deviceId) {
    if (this.#isSwitching) return;
    this.#isSwitching = true;
    this.#selectedDeviceId = deviceId;

    if (this.#selectElement && this.#selectElement.value !== deviceId) {
      this.#selectElement.value = deviceId;
    }

    try {
      if (this.#isStreaming) {
        await this.start(deviceId);
      }
    } finally {
      this.#isSwitching = false;
    }
  }

  /**
   * Detiene el flujo de la cámara y libera todos los recursos del hardware
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
   * Destruye el gestor y remueve los event listeners
   */
  destroy() {
    this.stop();
    if (navigator.mediaDevices && navigator.mediaDevices.removeEventListener) {
      navigator.mediaDevices.removeEventListener('devicechange', this.#boundOnDeviceChange);
    }
  }

  // Getters de estado público
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

// Instancia única y exportación global
window.CameraDeviceManager = CameraDeviceManager;
window.CameraManager = new CameraDeviceManager();
