/**
 * Manitas · LSC - Helper Modular de UI y Multimedia para la Arena de Examen (POO)
 * Responsabilidad única: renderizado seguro de opciones quiz, multimedia Real/Anime y resumen final.
 */
class ExamUIHelper {
  #lastSummary = null;
  #certBound = false;

  init() {}
  start() {}
  update() {}
  reset() {}
  destroy() {}

  lookupSignObject(signId) {
    if (typeof window === 'undefined' || !window.SIGNS_DATA) {
      return { id: signId, name: signId };
    }
    const all = [...(window.SIGNS_DATA.words || []), ...(window.SIGNS_DATA.letters || [])];
    return all.find(s => s.id === signId) || { id: signId, name: signId };
  }

  generateDistractors(correctSignId) {
    if (typeof window === 'undefined' || !window.SIGNS_DATA) {
      return [
        { id: 'HOLA', name: 'Hola' },
        { id: 'BUENOS', name: 'Buenos' },
        { id: 'DIAS', name: 'Días' }
      ].filter(s => s.id !== correctSignId).slice(0, 3);
    }

    const all = [...(window.SIGNS_DATA.words || []), ...(window.SIGNS_DATA.letters || [])];
    const shuffled = [...all.filter(s => s.id !== correctSignId)];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, 3).map(s => ({ id: s.id, name: s.name }));
  }

  loadQuizMedia(videoEl, webpEl, signId, videoMode) {
    if (!videoEl && !webpEl) return;

    const signObj = this.lookupSignObject(signId);
    if (signObj && signObj.preferStaticImage && signObj.image) {
      if (videoEl) {
        videoEl.classList.add('hidden');
        try { videoEl.pause(); } catch (e) {}
      }
      if (webpEl) {
        webpEl.onerror = null;
        webpEl.src = signObj.image;
        webpEl.classList.remove('hidden');
      }
      return;
    }

    const allowAnime = videoMode === 'anime' && (!signObj || signObj.hasAnime !== false);
    const folder = allowAnime ? 'videos/anime' : 'videos/real';
    const mp4Url = `${folder}/${signId}_body.mp4`;
    const webpUrl = `${folder}/${signId}_body.webp`;

    const activateWebp = () => {
      if (videoEl) {
        videoEl.classList.add('hidden');
        try { videoEl.pause(); } catch (e) {}
      }
      if (webpEl) {
        if (allowAnime) {
          webpEl.onerror = () => {
            webpEl.onerror = null;
            webpEl.src = `videos/real/${signId}_body.webp`;
          };
        } else {
          webpEl.onerror = null;
        }
        webpEl.src = webpUrl;
        webpEl.classList.remove('hidden');
      }
    };

    if (videoEl) {
      if (webpEl) webpEl.classList.add('hidden');
      videoEl.classList.remove('hidden');
      videoEl.muted = true;
      videoEl.loop = true;
      videoEl.setAttribute('playsinline', 'true');
      videoEl.onerror = () => {
        console.warn(`[BlindExam] Fallo decodificación MP4 (${mp4Url}), activando fallback WebP (${webpUrl})`);
        activateWebp();
      };
      videoEl.src = mp4Url;
      if (typeof videoEl.load === 'function') {
        try { videoEl.load(); } catch (e) {}
      }
      if (typeof videoEl.play === 'function') {
        const playPromise = videoEl.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            if (err && err.name === 'AbortError') return;
            activateWebp();
          });
        }
      }
    } else if (webpEl) {
      activateWebp();
    }
  }

  renderQuizOptions(gridEl, currentQuestion, onSelect) {
    if (!gridEl) return;

    gridEl.innerHTML = '';
    const distractors = this.generateDistractors(currentQuestion.signId);
    const options = [
      { id: currentQuestion.signId, name: currentQuestion.signName, isCorrect: true },
      ...distractors.map(d => ({ id: d.id, name: d.name, isCorrect: false }))
    ];

    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }

    options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'exam-quiz-opt-btn btn-spring w-full p-3.5 rounded-2xl text-sm font-bold bg-white hover:bg-amber-50 border-2 border-slate-200 hover:border-amber-500 text-slate-900 transition shadow-sm flex items-center justify-between text-left';
      btn.setAttribute('data-sign-id', opt.id);
      btn.setAttribute('data-is-correct', opt.isCorrect ? 'true' : 'false');

      const leftWrap = document.createElement('div');
      leftWrap.className = 'flex items-center gap-3';

      const numBadge = document.createElement('span');
      numBadge.className = 'w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 text-amber-800 font-mono text-xs flex items-center justify-center font-bold';
      numBadge.textContent = String(idx + 1);

      const labelSpan = document.createElement('span');
      labelSpan.className = 'tracking-wide';
      labelSpan.textContent = opt.name;

      const indicator = document.createElement('span');
      indicator.className = 'exam-opt-indicator opacity-0 transition-opacity font-bold';

      leftWrap.appendChild(numBadge);
      leftWrap.appendChild(labelSpan);
      btn.appendChild(leftWrap);
      btn.appendChild(indicator);

      btn.addEventListener('click', () => {
        if (typeof onSelect === 'function') onSelect(opt, btn);
      });

      gridEl.appendChild(btn);
    });
  }

  showSummaryModal({ scorePct, correct, total, planTitle, results, examMode }, onModalOpen) {
    const modal = document.getElementById('examSummaryModal');
    if (!modal) return;

    const scoreEl = document.getElementById('examFinalScorePct');
    if (scoreEl) scoreEl.textContent = `${scorePct}%`;

    const fracEl = document.getElementById('examFinalFraction');
    if (fracEl) fracEl.textContent = `${correct} / ${total} señas aprobadas`;

    const titleEl = document.getElementById('examSummaryPlanTitle');
    if (titleEl) {
      const modeSuffix = examMode === 'camera'
        ? ' · Solo Cámara'
        : (examMode === 'quiz' ? ' · Adivinar Señas' : '');
      titleEl.textContent = `${planTitle}${modeSuffix}`;
    }

    const listEl = document.getElementById('examBreakdownList');
    if (listEl) {
      listEl.innerHTML = '';
      results.forEach(res => {
        const item = document.createElement('div');
        item.className = `flex items-center justify-between p-2.5 rounded-xl border text-xs ${
          res.passed
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`;

        const left = document.createElement('div');
        left.className = 'flex items-center gap-2';

        const iconSpan = document.createElement('span');
        iconSpan.className = `w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs ${
          res.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
        }`;
        iconSpan.textContent = res.passed ? '✓' : '✗';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'font-bold uppercase tracking-wider text-slate-900';
        nameSpan.textContent = String(res.signName || res.signId || '');

        const typeSpan = document.createElement('span');
        typeSpan.className = 'text-xs text-slate-600 font-mono';
        typeSpan.textContent = `(${res.type === 'quiz' ? 'Quiz' : 'Cámara'})`;

        left.appendChild(iconSpan);
        left.appendChild(nameSpan);
        left.appendChild(typeSpan);

        const right = document.createElement('span');
        right.className = `font-mono tabular-nums text-xs font-semibold ${res.passed ? 'text-emerald-700' : 'text-amber-800'}`;
        right.textContent = res.passed ? `${res.score}% precisión` : 'Por repasar';

        item.appendChild(left);
        item.appendChild(right);
        listEl.appendChild(item);
      });
    }

    this.#lastSummary = { scorePct, correct, total, planTitle, examMode };
    const btnCert = document.getElementById('btnDownloadExamCert');
    if (btnCert && !this.#certBound) {
      this.#certBound = true;
      btnCert.addEventListener('click', () => {
        const s = this.#lastSummary || {};
        if (typeof window !== 'undefined' && window.CertificateGenerator && typeof window.CertificateGenerator.downloadCertificate === 'function') {
          const modeLabel = s.examMode === 'camera' ? 'Solo Cámara' : (s.examMode === 'quiz' ? 'Adivinar Señas' : 'Evaluación Ciega');
          window.CertificateGenerator.downloadCertificate({
            title: 'Certificado · Evaluación Ciega LSC',
            subtitle: `${s.planTitle || 'Plan LSC'} · ${modeLabel}`,
            metricPrimary: `${s.scorePct || 0}% Calificación`,
            metricSecondary: `${s.correct || 0}/${s.total || 0} Señas`,
            level: (s.scorePct || 0) >= 80 ? 'Aprobado con Honores' : 'Evaluado'
          });
        }
      });
    }

    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    if (typeof onModalOpen === 'function') onModalOpen();
  }

  updateTimerDisplay(remainingSeconds) {
    const timerText = `${remainingSeconds}s`;
    ['examTimerText', 'overlayExamTimerText'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.textContent = timerText;
      if (remainingSeconds <= 5) el.classList.add('text-red-400');
      else el.classList.remove('text-red-400');
    });
  }

  showCameraFallback() {
    const camLoading = document.getElementById('examCameraLoading');
    const camFallback = document.getElementById('examCameraFallback');
    const liveBadge = document.getElementById('examLiveBadge');
    if (camLoading) camLoading.classList.add('hidden');
    if (camFallback) camFallback.classList.remove('hidden');
    if (liveBadge) liveBadge.textContent = 'SIN CÁMARA';
  }
}

if (typeof window !== 'undefined') {
  window.ExamUIHelper = ExamUIHelper;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExamUIHelper;
}
