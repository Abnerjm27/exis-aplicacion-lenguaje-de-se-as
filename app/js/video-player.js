/**
 * LSC Learn · Proyecto EXIS
 * video-player.js - Reproductor de Video Interactivo para Lengua de Señas Colombiana (LSC)
 * Manejo semántico de Video HTML5 con fallback sincronizado en WebP animado.
 */

const VideoPlayer = (() => {
  let currentSignId = 'HOLA';
  let currentMode = 'real';    // 'real' | 'anime'
  let currentView = 'body';    // 'body' | 'hand'
  let currentSpeed = 1.0;      // 0.5 | 1.0
  let isPlaying = true;
  let isUsingWebpFallback = false;
  let fallbackTimer = null;
  let fallbackProgress = 0;
  let toastTimeout = null;
  let els = {};

  function init() {
    cacheElements();
    bindEvents();
    updateModeButtons();
    updateViewButtons();
    updateSpeedButtons();
    updatePlayPauseUI();
    updateBadge();

    if (currentSignId) {
      loadMedia(currentSignId, currentMode, currentView);
    }
  }

  function cacheElements() {
    els = {
      video: document.getElementById('signVideo'),
      webp: document.getElementById('signAnimatedWebp'),
      btnModeReal: document.getElementById('btnModeReal'),
      btnModeAnime: document.getElementById('btnModeAnime'),
      btnViewBody: document.getElementById('btnViewBody'),
      btnViewHand: document.getElementById('btnViewHand'),
      btnSpeed05: document.getElementById('btnSpeed05'),
      btnSpeed10: document.getElementById('btnSpeed10'),
      btnPlayPause: document.getElementById('btnPlayPause'),
      iconPlay: document.getElementById('iconPlay'),
      iconPause: document.getElementById('iconPause'),
      timeline: document.getElementById('videoTimeline'),
      currentTime: document.getElementById('videoCurrentTime'),
      duration: document.getElementById('videoDuration'),
      badge: document.getElementById('videoFloatingBadge'),
      badgeText: document.getElementById('badgeText'),
      animeToast: document.getElementById('animeNoticeToast'),
      btnDismissAnimeNotice: document.getElementById('btnDismissAnimeNotice'),
      spinner: document.getElementById('videoLoadingSpinner'),
      currentModeLabel: document.getElementById('currentModeLabel')
    };
  }

  function bindEvents() {
    if (els.video) {
      els.video.addEventListener('timeupdate', onVideoTimeUpdate);
      els.video.addEventListener('loadedmetadata', onVideoLoadedMetadata);
      els.video.addEventListener('playing', onVideoPlaying);
      els.video.addEventListener('waiting', () => showSpinner(true));
      els.video.addEventListener('canplay', () => showSpinner(false));
      els.video.addEventListener('error', onVideoError);
      els.video.addEventListener('ended', onVideoEnded);
    }

    if (els.btnModeReal) els.btnModeReal.addEventListener('click', () => setMode('real'));
    if (els.btnModeAnime) els.btnModeAnime.addEventListener('click', () => setMode('anime'));
    if (els.btnViewBody) els.btnViewBody.addEventListener('click', () => setView('body'));
    if (els.btnViewHand) els.btnViewHand.addEventListener('click', () => setView('hand'));
    if (els.btnSpeed05) els.btnSpeed05.addEventListener('click', () => setSpeed(0.5));
    if (els.btnSpeed10) els.btnSpeed10.addEventListener('click', () => setSpeed(1.0));
    if (els.btnPlayPause) els.btnPlayPause.addEventListener('click', togglePlayPause);

    if (els.timeline) {
      els.timeline.addEventListener('input', onTimelineScrub);
      els.timeline.addEventListener('change', onTimelineScrub);
    }

    if (els.btnDismissAnimeNotice) {
      els.btnDismissAnimeNotice.addEventListener('click', hideAnimeNotice);
    }
  }

  function getMediaPaths(signId, mode, view) {
    const filename = `${signId}_${view}`;
    return {
      mp4: `videos/${mode}/${filename}.mp4`,
      webp: `videos/${mode}/${filename}.webp`
    };
  }

  async function loadMedia(signId, mode, view) {
    showSpinner(true);
    const paths = getMediaPaths(signId, mode, view);

    if (mode === 'anime') {
      const exists = await checkResourceExists(paths.mp4);
      if (!exists) {
        showAnimeNotice(signId);
        currentMode = 'real';
        updateModeButtons();
        updateBadge();
        const fallbackPaths = getMediaPaths(signId, 'real', view);
        executeLoad(fallbackPaths.mp4, fallbackPaths.webp);
        return;
      }
    }

    executeLoad(paths.mp4, paths.webp);
  }

  function executeLoad(mp4Url, webpUrl) {
    isUsingWebpFallback = false;
    stopFallbackTimer();

    if (els.video) {
      els.video.classList.remove('hidden');
      if (els.webp) els.webp.classList.add('hidden');

      els.video.playbackRate = currentSpeed;
      els.video.src = mp4Url;
      els.video.load();

      const playPromise = els.video.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          isPlaying = true;
          updatePlayPauseUI();
          showSpinner(false);
        }).catch((err) => {
          console.warn('[VideoPlayer] Autoplay o códec, activando fallback WebP:', err);
          activateWebpFallback(webpUrl);
        });
      }
    } else if (els.webp) {
      activateWebpFallback(webpUrl);
    }
  }

  function activateWebpFallback(webpUrl) {
    isUsingWebpFallback = true;
    showSpinner(false);

    if (els.video) els.video.classList.add('hidden');
    if (els.webp) {
      els.webp.classList.remove('hidden');
      els.webp.src = webpUrl;
      els.webp.alt = `Demostración animada en LSC: ${currentSignId}`;
    }

    startFallbackTimer();
    isPlaying = true;
    updatePlayPauseUI();
  }

  function startFallbackTimer() {
    stopFallbackTimer();
    const duration = 2.4;
    const intervalMs = 80;
    const step = (intervalMs / 1000) / (duration / currentSpeed) * 100;

    fallbackTimer = setInterval(() => {
      if (!isPlaying) return;
      fallbackProgress = (fallbackProgress + step) % 100;
      if (els.timeline) els.timeline.value = fallbackProgress;
      if (els.currentTime) {
        els.currentTime.textContent = `${((fallbackProgress / 100) * duration).toFixed(1)}s`;
      }
      if (els.duration) {
        els.duration.textContent = `${duration.toFixed(1)}s`;
      }
    }, intervalMs);
  }

  function stopFallbackTimer() {
    if (fallbackTimer) {
      clearInterval(fallbackTimer);
      fallbackTimer = null;
    }
  }

  async function checkResourceExists(url) {
    try {
      const resp = await fetch(url, { method: 'HEAD' });
      return resp.ok;
    } catch {
      return false;
    }
  }

  function setSign(signId) {
    if (!signId) return;
    currentSignId = signId.toUpperCase();
    loadMedia(currentSignId, currentMode, currentView);
  }

  function setSpeed(speed) {
    currentSpeed = Number(speed) || 1.0;
    if (els.video) els.video.playbackRate = currentSpeed;
    if (isUsingWebpFallback) startFallbackTimer();
    updateSpeedButtons();
  }

  function setView(viewType) {
    if (viewType !== 'body' && viewType !== 'hand') return;
    currentView = viewType;
    updateViewButtons();
    loadMedia(currentSignId, currentMode, currentView);
  }

  function setMode(modeType) {
    if (modeType !== 'real' && modeType !== 'anime') return;
    currentMode = modeType;
    updateModeButtons();
    updateBadge();
    loadMedia(currentSignId, currentMode, currentView);
  }

  function togglePlayPause() {
    if (isUsingWebpFallback) {
      isPlaying = !isPlaying;
      updatePlayPauseUI();
      return;
    }
    if (!els.video) return;

    if (els.video.paused) {
      els.video.play().then(() => {
        isPlaying = true;
        updatePlayPauseUI();
      }).catch(console.warn);
    } else {
      els.video.pause();
      isPlaying = false;
      updatePlayPauseUI();
    }
  }

  function onVideoTimeUpdate() {
    if (!els.video || isUsingWebpFallback) return;
    const curr = els.video.currentTime || 0;
    const dur = els.video.duration || 0;
    if (els.currentTime) els.currentTime.textContent = `${curr.toFixed(1)}s`;
    if (dur > 0 && els.timeline) els.timeline.value = (curr / dur) * 100;
  }

  function onVideoLoadedMetadata() {
    showSpinner(false);
    if (!els.video) return;
    const dur = els.video.duration || 0;
    if (els.duration) els.duration.textContent = `${dur.toFixed(1)}s`;
    els.video.playbackRate = currentSpeed;
  }

  function onVideoPlaying() {
    showSpinner(false);
    isPlaying = true;
    updatePlayPauseUI();
  }

  function onVideoEnded() {
    if (els.video && isPlaying) {
      els.video.currentTime = 0;
      els.video.play().catch(console.warn);
    }
  }

  function onVideoError() {
    console.warn('[VideoPlayer] Error al cargar MP4, recurriendo a WebP');
    const paths = getMediaPaths(currentSignId, currentMode, currentView);
    activateWebpFallback(paths.webp);
  }

  function onTimelineScrub(e) {
    const val = parseFloat(e.target.value);
    if (isUsingWebpFallback) {
      fallbackProgress = val;
      return;
    }
    if (els.video && els.video.duration) {
      els.video.currentTime = (val / 100) * els.video.duration;
    }
  }

  function showSpinner(show) {
    if (els.spinner) els.spinner.classList.toggle('hidden', !show);
  }

  function showAnimeNotice(signId) {
    if (!els.animeToast) return;
    if (toastTimeout) clearTimeout(toastTimeout);
    els.animeToast.classList.remove('hidden');
    els.animeToast.classList.add('toast-enter');

    toastTimeout = setTimeout(() => {
      hideAnimeNotice();
    }, 4500);
  }

  function hideAnimeNotice() {
    if (!els.animeToast) return;
    els.animeToast.classList.add('hidden');
    els.animeToast.classList.remove('toast-enter');
  }

  function updateModeButtons() {
    const act = "btn-spring px-2.5 sm:px-3 py-1 rounded-md font-semibold bg-amber-500 text-slate-950 flex items-center gap-1.5 transition";
    const inact = "btn-spring px-2.5 sm:px-3 py-1 rounded-md font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition";

    if (els.btnModeReal) {
      els.btnModeReal.className = (currentMode === 'real') ? act : inact;
      els.btnModeReal.setAttribute('aria-pressed', currentMode === 'real');
    }
    if (els.btnModeAnime) {
      els.btnModeAnime.className = (currentMode === 'anime') ? act : inact;
      els.btnModeAnime.setAttribute('aria-pressed', currentMode === 'anime');
    }
    if (els.currentModeLabel) {
      els.currentModeLabel.textContent = (currentMode === 'real') ? 'Real LSC' : 'Anime IA';
    }
  }

  function updateViewButtons() {
    const act = "btn-spring flex items-center gap-1 px-2.5 py-1 rounded font-bold text-amber-300 bg-slate-800 border border-amber-500/40 shadow-sm transition";
    const inact = "btn-spring flex items-center gap-1 px-2.5 py-1 rounded font-medium text-slate-400 hover:text-white hover:bg-slate-800/80 transition";

    if (els.btnViewBody) {
      els.btnViewBody.className = (currentView === 'body') ? act : inact;
      els.btnViewBody.setAttribute('aria-pressed', currentView === 'body');
    }
    if (els.btnViewHand) {
      els.btnViewHand.className = (currentView === 'hand') ? act : inact;
      els.btnViewHand.setAttribute('aria-pressed', currentView === 'hand');
    }
  }

  function updateSpeedButtons() {
    const act = "btn-spring px-2.5 py-1 rounded-md text-xs font-bold text-amber-300 bg-slate-800 border border-amber-500/40 shadow-sm transition";
    const inact = "btn-spring px-2.5 py-1 rounded-md text-xs font-medium text-slate-400 hover:text-white transition";

    if (els.btnSpeed05) els.btnSpeed05.className = (currentSpeed === 0.5) ? act : inact;
    if (els.btnSpeed10) els.btnSpeed10.className = (currentSpeed === 1.0) ? act : inact;
  }

  function updatePlayPauseUI() {
    if (els.iconPlay && els.iconPause) {
      if (isPlaying) {
        els.iconPlay.classList.add('hidden');
        els.iconPause.classList.remove('hidden');
        if (els.btnPlayPause) els.btnPlayPause.setAttribute('aria-label', 'Pausar video');
      } else {
        els.iconPlay.classList.remove('hidden');
        els.iconPause.classList.add('hidden');
        if (els.btnPlayPause) els.btnPlayPause.setAttribute('aria-label', 'Reproducir video');
      }
    }
  }

  function updateBadge() {
    if (!els.badgeText) return;
    els.badgeText.textContent = (currentMode === 'real')
      ? "Bucle continuo · LSC Oficial"
      : "Bucle continuo · Anime IA";
  }

  return {
    init,
    setSign,
    setSpeed,
    setView,
    setMode,
    togglePlayPause,
    getSign: () => currentSignId,
    getMode: () => currentMode,
    getView: () => currentView,
    getSpeed: () => currentSpeed
  };
})();

window.VideoPlayer = VideoPlayer;
