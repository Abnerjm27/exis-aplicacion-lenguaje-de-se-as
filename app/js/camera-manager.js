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
  #trackedStreams = new Set();
  #startSeq = 0;
  #dropdownMap = new WeakMap();
  #activeDropdown = null;
  #boundDocClick = null;
  #boundDocKeyDown = null;
  #boundViewportChange = null;

  constructor() {
    this.#boundOnDeviceChange = () => this.refreshDeviceList();
    this.#boundDocClick = (e) => {
      if (!this.#activeDropdown) return;
      const { wrapper, menu } = this.#activeDropdown.entry;
      if ((wrapper && wrapper.contains(e.target)) || (menu && menu.contains(e.target))) return;
      this.#closeActiveDropdown();
    };
    this.#boundDocKeyDown = (e) => {
      if (e.key === 'Escape' && this.#activeDropdown) {
        this.#closeActiveDropdown();
      }
    };
    this.#boundViewportChange = () => {
      if (this.#activeDropdown) {
        this.#positionDropdownMenu(this.#activeDropdown.entry);
      }
    };
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
      this.#bindSelectElement(this.#selectElement);
    }

    const lessonSelect = document.getElementById('lessonCameraSelect');
    if (lessonSelect) {
      this.#bindSelectElement(lessonSelect);
    }

    const examSelect = document.getElementById('examCameraSelect');
    if (examSelect) {
      this.#bindSelectElement(examSelect);
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
    if (typeof document !== 'undefined') {
      document.addEventListener('click', this.#boundDocClick);
      document.addEventListener('keydown', this.#boundDocKeyDown);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.#boundViewportChange);
    }

    // Renderizar triggers personalizados de inmediato y enumerar dispositivos iniciales
    this.#renderSelectOptions();
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
        this.#trackedStreams.add(tempStream);
        tempStream.getTracks().forEach(t => {
          try { t.stop(); } catch (e) {}
        });
        this.#trackedStreams.delete(tempStream);
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

  #bindSelectElement(selectEl) {
    if (!selectEl || selectEl.dataset.cameraBound === 'true') return;
    selectEl.dataset.cameraBound = 'true';

    selectEl.addEventListener('change', async (e) => {
      const newDeviceId = e.target.value;
      if (!newDeviceId) return;
      this.#selectedDeviceId = newDeviceId;

      if (selectEl.id === 'alphabetSpellCameraSelect' && window.AlphabetLabController && !window.AlphabetLabController.isSpellCameraActive()) {
        return;
      }

      if (window.VisionEvaluator) {
        await window.VisionEvaluator.startWithDevice(newDeviceId);
      } else {
        await this.start(newDeviceId);
      }

      const stream = this.getStream();
      const lessonVideo = document.getElementById('lessonPracticeWebcamVideo');
      if (lessonVideo && stream) {
        lessonVideo.srcObject = stream;
        lessonVideo.muted = true;
        try { await lessonVideo.play(); } catch (err) {}
      }
      const labVideo = document.getElementById('alphabetSpellWebcamVideo');
      if (labVideo && stream) {
        labVideo.srcObject = stream;
        labVideo.muted = true;
        try { await labVideo.play(); } catch (err) {}
      }
    });

    selectEl.addEventListener('focus', () => {
      if (this.#needsPermissionForLabels()) {
        this.requestPermissionAndRefresh();
      }
    });
  }

  attachSelect(selectEl) {
    if (!selectEl) return;
    this.#bindSelectElement(selectEl);
    this.#renderSelectOptions();
  }

  /**
   * Renderiza las cámaras detectadas en todos los selectores activos
   */
  #renderSelectOptions() {
    const selects = [
      this.#selectElement,
      document.getElementById('lessonCameraSelect'),
      document.getElementById('examCameraSelect'),
      document.getElementById('alphabetSpellCameraSelect')
    ].filter(Boolean);
    if (selects.length === 0) return;

    const previousSelected = this.#selectedDeviceId || (this.#selectElement ? this.#selectElement.value : null);

    selects.forEach(selectEl => {
      this.#bindSelectElement(selectEl);
      const prevVal = selectEl.value || previousSelected;
      selectEl.innerHTML = '';

      if (this.#deviceList.length === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = '📷 Cámara predeterminada';
        selectEl.appendChild(opt);
      } else {
        this.#deviceList.forEach((device, index) => {
          const opt = document.createElement('option');
          opt.value = device.deviceId;
          opt.textContent = this.#formatDeviceLabel(device.label, index);
          selectEl.appendChild(opt);
        });

        if (prevVal && this.#deviceList.some(d => d.deviceId === prevVal)) {
          selectEl.value = prevVal;
        } else if (previousSelected && this.#deviceList.some(d => d.deviceId === previousSelected)) {
          selectEl.value = previousSelected;
        } else if (this.#deviceList[0]) {
          selectEl.value = this.#deviceList[0].deviceId;
        }
      }

      this.#syncCustomDropdown(selectEl);
    });

    if (previousSelected && this.#deviceList.some(d => d.deviceId === previousSelected)) {
      this.#selectedDeviceId = previousSelected;
    } else if (this.#deviceList[0]) {
      this.#selectedDeviceId = this.#deviceList[0].deviceId;
    }
  }

  #ensureCustomDropdown(selectEl) {
    if (!selectEl || typeof document === 'undefined') return null;
    const existing = this.#dropdownMap.get(selectEl);
    if (existing && existing.wrapper && existing.wrapper.isConnected) {
      return existing;
    }

    selectEl.classList.add('cam-select-native-hidden');
    const isCompact = selectEl.id === 'lessonCameraSelect' || selectEl.id === 'examCameraSelect';
    const isFluid = selectEl.id === 'cameraSourceSelect' || selectEl.id === 'alphabetSpellCameraSelect';

    const wrapper = document.createElement('div');
    wrapper.className = `cam-dropdown${isCompact ? ' cam-dropdown--compact' : ''}${isFluid ? ' is-fluid' : ''}`;

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'cam-dropdown-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-label', selectEl.getAttribute('aria-label') || 'Seleccionar cámara');
    trigger.title = selectEl.title || 'Seleccionar cámara disponible';

    const labelEl = document.createElement('span');
    labelEl.className = 'cam-dropdown-label';
    labelEl.textContent = '📷 Detectando cámaras...';

    const chevron = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    chevron.setAttribute('viewBox', '0 0 24 24');
    chevron.setAttribute('fill', 'none');
    chevron.setAttribute('stroke', 'currentColor');
    chevron.setAttribute('stroke-width', '2.5');
    chevron.setAttribute('stroke-linecap', 'round');
    chevron.setAttribute('stroke-linejoin', 'round');
    chevron.setAttribute('aria-hidden', 'true');
    chevron.classList.add('cam-dropdown-chevron');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    path.setAttribute('points', '6 9 12 15 18 9');
    chevron.appendChild(path);

    trigger.appendChild(labelEl);
    trigger.appendChild(chevron);
    wrapper.appendChild(trigger);

    if (selectEl.parentNode) {
      selectEl.parentNode.insertBefore(wrapper, selectEl.nextSibling);
    }

    const menu = document.createElement('div');
    menu.className = 'cam-dropdown-menu';
    menu.setAttribute('role', 'listbox');
    menu.setAttribute('aria-label', 'Cámaras disponibles');

    const entry = { wrapper, trigger, labelEl, menu };
    trigger.addEventListener('click', () => {
      if (this.#activeDropdown && this.#activeDropdown.selectEl === selectEl) {
        this.#closeActiveDropdown();
      } else {
        this.#openDropdown(selectEl, entry);
      }
    });

    this.#dropdownMap.set(selectEl, entry);
    return entry;
  }

  #syncCustomDropdown(selectEl) {
    const entry = this.#ensureCustomDropdown(selectEl);
    if (!entry) return;

    const options = Array.from(selectEl.options || []);
    const activeOpt = options.find(o => o.value === selectEl.value) || options[0];
    entry.labelEl.textContent = activeOpt ? activeOpt.textContent : '📷 Cámara predeterminada';

    entry.menu.replaceChildren();
    options.forEach(opt => {
      const isSelected = opt.value === selectEl.value;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `cam-dropdown-option${isSelected ? ' is-selected' : ''}`;
      btn.setAttribute('role', 'option');
      btn.setAttribute('aria-selected', String(isSelected));

      const txt = document.createElement('span');
      txt.className = 'cam-dropdown-option-text';
      txt.textContent = opt.textContent;
      btn.appendChild(txt);

      if (isSelected) {
        const chk = document.createElement('span');
        chk.className = 'cam-dropdown-check';
        chk.setAttribute('aria-hidden', 'true');
        chk.textContent = '✓';
        btn.appendChild(chk);
      }

      btn.addEventListener('click', () => {
        const nextVal = opt.value;
        this.#closeActiveDropdown();
        if (selectEl.value !== nextVal) {
          selectEl.value = nextVal;
          selectEl.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
          this.#syncCustomDropdown(selectEl);
        }
      });

      entry.menu.appendChild(btn);
    });
  }

  #openDropdown(selectEl, entry) {
    this.#closeActiveDropdown();
    if (this.#needsPermissionForLabels()) {
      this.requestPermissionAndRefresh();
    }
    this.#syncCustomDropdown(selectEl);
    document.body.appendChild(entry.menu);
    this.#positionDropdownMenu(entry);
    entry.trigger.classList.add('is-open');
    entry.trigger.setAttribute('aria-expanded', 'true');
    this.#activeDropdown = { selectEl, entry };
  }

  #positionDropdownMenu(entry) {
    if (!entry || !entry.trigger || !entry.menu || !entry.trigger.isConnected) {
      this.#closeActiveDropdown();
      return;
    }
    const rect = entry.trigger.getBoundingClientRect();
    const minW = Math.max(rect.width, 220);
    const maxW = Math.min(320, window.innerWidth - 16);
    const width = Math.min(minW, maxW);
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
    const menuHeight = Math.min(entry.menu.scrollHeight || 160, 260);
    const spaceBelow = window.innerHeight - rect.bottom - 10;
    const top = (spaceBelow >= menuHeight || rect.top < menuHeight)
      ? Math.min(rect.bottom + 6, Math.max(8, window.innerHeight - menuHeight - 8))
      : Math.max(8, rect.top - menuHeight - 6);

    entry.menu.style.width = `${Math.round(width)}px`;
    entry.menu.style.left = `${Math.round(left)}px`;
    entry.menu.style.top = `${Math.round(top)}px`;
  }

  #closeActiveDropdown() {
    if (!this.#activeDropdown) return;
    const { entry } = this.#activeDropdown;
    if (entry.trigger) {
      entry.trigger.classList.remove('is-open');
      entry.trigger.setAttribute('aria-expanded', 'false');
    }
    if (entry.menu && entry.menu.parentNode) {
      entry.menu.parentNode.removeChild(entry.menu);
    }
    this.#activeDropdown = null;
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
    const mySeq = ++this.#startSeq;
    if (hadStream) {
      await new Promise(r => setTimeout(r, 250));
      if (mySeq !== this.#startSeq) return false;
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

      this.#trackedStreams.add(stream);
      if (mySeq !== this.#startSeq) {
        stream.getTracks().forEach(t => { try { t.stop(); } catch (e) {} });
        this.#trackedStreams.delete(stream);
        this.stop();
        return false;
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

      if (mySeq !== this.#startSeq) {
        this.stop();
        return false;
      }

      this.#isStreaming = true;

      // Alimentar también los visores de cámara de la lección, examen y laboratorio si están abiertos
      const lessonVideo = document.getElementById('lessonPracticeWebcamVideo');
      if (lessonVideo && lessonVideo.srcObject !== stream) {
        lessonVideo.srcObject = stream;
        lessonVideo.muted = true;
        lessonVideo.setAttribute('playsinline', 'true');
        lessonVideo.play().catch(() => {});
      }
      const examVideo = document.getElementById('examPracticeWebcamVideo');
      if (examVideo && examVideo.srcObject !== stream) {
        examVideo.srcObject = stream;
        examVideo.muted = true;
        examVideo.setAttribute('playsinline', 'true');
        examVideo.play().catch(() => {});
      }
      const labVideo = document.getElementById('alphabetSpellWebcamVideo');
      if (labVideo && window.AlphabetLabController && window.AlphabetLabController.isSpellCameraActive() && labVideo.srcObject !== stream) {
        labVideo.srcObject = stream;
        labVideo.muted = true;
        labVideo.setAttribute('playsinline', 'true');
        labVideo.play().catch(() => {});
      }

      // Actualizar el indicador visual de la cámara activa en pantalla
      const activeTrack = stream.getVideoTracks()[0];
      const activeLabel = activeTrack ? activeTrack.label : '';
      this.#updateActivePillUI(activeLabel);

      // Refrescar lista de dispositivos para obtener nombres autorizados
      await this.refreshDeviceList();
      if (mySeq !== this.#startSeq) {
        this.stop();
        return false;
      }

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

  #releaseVideoElement(videoEl) {
    if (!videoEl) return;
    try {
      if (videoEl.srcObject && typeof videoEl.srcObject.getTracks === 'function') {
        videoEl.srcObject.getTracks().forEach(track => {
          try { track.stop(); } catch (e) {}
        });
      }
      videoEl.pause();
    } catch (e) {}
    videoEl.srcObject = null;
  }

  /**
   * Detiene la cámara y libera todos los recursos del hardware
   */
  stop() {
    this.#startSeq += 1;
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

    this.#trackedStreams.forEach(stream => {
      if (stream && typeof stream.getTracks === 'function') {
        stream.getTracks().forEach(track => {
          try { track.stop(); } catch (e) {}
        });
      }
    });
    this.#trackedStreams.clear();

    this.#releaseVideoElement(this.#videoElement);
    this.#releaseVideoElement(document.getElementById('lessonPracticeWebcamVideo'));
    this.#releaseVideoElement(document.getElementById('examPracticeWebcamVideo'));
    this.#releaseVideoElement(document.getElementById('alphabetSpellWebcamVideo'));
  }

  /**
   * Actualiza la lista de dispositivos de cámara disponibles
   */
  async update() {
    return this.refreshDeviceList();
  }

  /**
   * Restablece la selección de cámara y detiene la transmisión activa
   */
  reset() {
    this.stop();
    this.#selectedDeviceId = null;
  }

  /**
   * Destruye la instancia y libera listeners
   */
  destroy() {
    this.#closeActiveDropdown();
    this.stop();
    if (navigator.mediaDevices && navigator.mediaDevices.removeEventListener) {
      navigator.mediaDevices.removeEventListener('devicechange', this.#boundOnDeviceChange);
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('click', this.#boundDocClick);
      document.removeEventListener('keydown', this.#boundDocKeyDown);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.#boundViewportChange);
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

  get currentStream() {
    return this.#currentStream;
  }

  getStream() {
    return this.#currentStream;
  }
}

// Exportación global y singleton
window.CameraDeviceManager = CameraDeviceManager;
window.CameraManager = new CameraDeviceManager();
