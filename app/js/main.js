/**
 * LSC Learn · Proyecto EXIS
 * main.js - Orquestación Principal de la Aplicación
 * Conecta Reproductor de Video Interactivo LSC, Visión MediaPipe, Chat Tutor IA y Catálogo LSC70
 */

// Registro global de errores de consola para auditoría visual automatizada (Regla 7 AGENTS.md)
window.__consoleErrors = window.__consoleErrors || [];
window.addEventListener('error', e => window.__consoleErrors.push(e.message || String(e)));
window.addEventListener('unhandledrejection', e => window.__consoleErrors.push(e.reason ? (e.reason.message || String(e.reason)) : 'Unhandled Rejection'));

let currentCategory = 'words';
let currentSign = null;

// Inicialización de la aplicación al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar componentes
  const videoEl = document.getElementById('webcamVideo');
  const canvasEl = document.getElementById('outputCanvas');
  
  if (window.VisionEvaluator && videoEl && canvasEl) {
    window.VisionEvaluator.init(videoEl, canvasEl);
  }

  if (window.VideoPlayer) {
    window.VideoPlayer.init();
  }

  // Inicializar Gestores de Plataforma de Aprendizaje, Perfil y Examen
  if (window.AuthProfileManager) {
    window.AuthProfileManager.init((profile) => {
      if (window.LearningPlanManager) {
        window.LearningPlanManager.update();
      }
    });
    window.AuthProfileManager.start();
  }

  if (window.LearningPlanManager) {
    window.LearningPlanManager.init({
      onSelectSign: (signId) => selectSign(signId),
      onStartExamRequest: (plan) => {
        if (window.BlindExamController) {
          window.BlindExamController.start(plan);
        }
      }
    });
    window.LearningPlanManager.start();
  }

  if (window.BlindExamController) {
    window.BlindExamController.init();
  }

  // Inicializar Controlador de Sesión de Lección Interactiva
  if (window.LessonSessionController) {
    window.LessonSessionController.init({
      onLessonComplete: (summary) => {
        if (window.LearningPlanManager) {
          window.LearningPlanManager.renderHexSkillTree();
        }
      }
    });
  }

  // Inicializar enrutador de vistas (Mapa Duolingo vs Estudio de Práctica)
  if (window.ViewRouter) {
    window.ViewRouter.init();
    window.ViewRouter.start();
  }

  // Establecer seña inicial (con soporte para parámetro ?sign=ID)
  const urlParams = new URLSearchParams(window.location.search);
  const signParam = urlParams.get('sign');
  if (signParam) {
    selectSign(signParam.toUpperCase());
  } else if (window.SIGNS_DATA && window.SIGNS_DATA.words) {
    currentSign = window.SIGNS_DATA.words[0];
    renderSignButtons();
    selectSign(currentSign.id);
  }

  const viewParam = urlParams.get('view');
  if (viewParam && window.VideoPlayer) {
    setTimeout(() => {
      window.VideoPlayer.setView(viewParam.toLowerCase());
    }, 200);
  }

  bindUIEvents();
});

function bindUIEvents() {
  // Botones de categoría
  const btnWords = document.getElementById('catWordsBtn');
  const btnLetters = document.getElementById('catLettersBtn');
  if (btnWords) btnWords.addEventListener('click', () => switchCategory('words'));
  if (btnLetters) btnLetters.addEventListener('click', () => switchCategory('letters'));

  // Botón de cámara web
  const btnCamera = document.getElementById('toggleCameraBtn');
  if (btnCamera) btnCamera.addEventListener('click', () => {
    if (window.VisionEvaluator) window.VisionEvaluator.toggle();
  });

  // Botón para alternar guía de puntos/trayectorias
  const btnToggleTrajectory = document.getElementById('btnToggleTrajectory');
  const trajectoryBtnText = document.getElementById('trajectoryBtnText');
  if (btnToggleTrajectory) {
    btnToggleTrajectory.addEventListener('click', () => {
      if (window.TrajectoryTracker) {
        const nextState = !window.TrajectoryTracker.getIsEnabled();
        window.TrajectoryTracker.setEnabled(nextState);
        btnToggleTrajectory.setAttribute('aria-pressed', String(nextState));
        if (nextState) {
          btnToggleTrajectory.className = "btn-spring px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 flex items-center gap-1.5 shadow-sm";
          if (trajectoryBtnText) trajectoryBtnText.textContent = "Puntos: ON";
        } else {
          btnToggleTrajectory.className = "btn-spring px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-slate-500 border border-slate-800 flex items-center gap-1.5 shadow-sm";
          if (trajectoryBtnText) trajectoryBtnText.textContent = "Puntos: OFF";
        }
      }
    });
  }

  // Explicar seña por voz
  const btnExplain = document.getElementById('btnExplainVoice');
  if (btnExplain) btnExplain.addEventListener('click', explainSignVoice);

  // Botones del modal de felicitación
  const btnKeepPracticing = document.getElementById('btnKeepPracticing');
  const btnNextSign = document.getElementById('btnNextSign');
  if (btnKeepPracticing) btnKeepPracticing.addEventListener('click', () => dismissSuccessModal(false));
  if (btnNextSign) btnNextSign.addEventListener('click', () => dismissSuccessModal(true));

  // Chat Tutor Drawer
  const btnToggleChat = document.getElementById('btnToggleChat');
  const btnCloseChat = document.getElementById('btnCloseChat');
  const btnSendChat = document.getElementById('chatSendBtn');
  const inputChat = document.getElementById('chatInput');

  if (btnToggleChat) btnToggleChat.addEventListener('click', () => window.ChatTutor && window.ChatTutor.toggleDrawer());
  if (btnCloseChat) btnCloseChat.addEventListener('click', () => window.ChatTutor && window.ChatTutor.toggleDrawer());
  if (btnSendChat) btnSendChat.addEventListener('click', () => window.ChatTutor && window.ChatTutor.sendMessage());
  if (inputChat) {
    inputChat.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        window.ChatTutor && window.ChatTutor.sendMessage();
      }
    });
  }

  // Chips de preguntas rápidas
  document.querySelectorAll('.quick-chip').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const prompt = e.currentTarget.getAttribute('data-prompt');
      if (prompt && window.ChatTutor) window.ChatTutor.sendQuickMessage(prompt);
    });
  });
}

function switchCategory(cat) {
  currentCategory = cat;
  const wordsBtn = document.getElementById('catWordsBtn');
  const lettersBtn = document.getElementById('catLettersBtn');

  if (cat === 'words') {
    if (wordsBtn) wordsBtn.className = "btn-spring px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 text-slate-950 shadow-sm transition";
    if (lettersBtn) lettersBtn.className = "btn-spring px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition";
  } else {
    if (lettersBtn) lettersBtn.className = "btn-spring px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 text-slate-950 shadow-sm transition";
    if (wordsBtn) wordsBtn.className = "btn-spring px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition";
  }

  renderSignButtons();
  if (window.SIGNS_DATA[cat] && window.SIGNS_DATA[cat].length > 0) {
    selectSign(window.SIGNS_DATA[cat][0].id);
  }
}

function renderSignButtons() {
  const container = document.getElementById('signList');
  if (!container || !window.SIGNS_DATA) return;

  container.innerHTML = '';
  const signs = window.SIGNS_DATA[currentCategory] || [];

  signs.forEach(sign => {
    const btn = document.createElement('button');
    btn.id = `btn-sign-${sign.id}`;
    const isActive = currentSign && sign.id === currentSign.id;
    btn.className = `btn-spring px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
      isActive 
        ? 'sign-chip-active' 
        : 'sign-chip-inactive'
    }`;
    btn.textContent = sign.name;
    btn.addEventListener('click', () => selectSign(sign.id));
    container.appendChild(btn);
  });
}

function selectSign(id) {
  // 1. Cerrar inmediatamente el modal de victoria si estaba visible
  const popup = document.getElementById('successPopup');
  if (popup) {
    popup.classList.add('hidden');
    popup.classList.remove('modal-enter');
  }

  let found = window.SIGNS_DATA.words.find(s => s.id === id);
  if (found) {
    currentCategory = 'words';
  } else {
    found = window.SIGNS_DATA.letters.find(s => s.id === id);
    if (found) currentCategory = 'letters';
  }
  if (!found) return;

  currentSign = found;

  // Actualizar estilos de los botones de categoría si cambió de categoría
  const wordsBtn = document.getElementById('catWordsBtn');
  const lettersBtn = document.getElementById('catLettersBtn');
  if (currentCategory === 'words') {
    if (wordsBtn) wordsBtn.className = "btn-spring px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 text-slate-950 shadow-sm transition";
    if (lettersBtn) lettersBtn.className = "btn-spring px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition";
  } else {
    if (lettersBtn) lettersBtn.className = "btn-spring px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 text-slate-950 shadow-sm transition";
    if (wordsBtn) wordsBtn.className = "btn-spring px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition";
  }

  // Actualizar Reproductor de Video Interactivo LSC
  if (window.VideoPlayer) {
    window.VideoPlayer.setSign(currentSign.id);
  }

  // Actualizar Evaluador de Visión MediaPipe (reinicia trayectoria, pausa y progreso)
  if (window.VisionEvaluator) {
    window.VisionEvaluator.setTargetSign(currentSign);
  }

  // Actualizar Ficha Técnica de la Seña en la UI
  const badgeEl = document.getElementById('targetSignBadge');
  const descEl = document.getElementById('targetSignDesc');
  const tipEl = document.getElementById('targetSignTip');

  if (badgeEl) badgeEl.textContent = currentSign.name;
  if (window.BlindExamController && window.BlindExamController.isExamActive()) {
    if (descEl) descEl.textContent = 'Evaluación Ciega sin Demostración';
    if (tipEl) tipEl.innerHTML = `<span class="text-amber-400 font-semibold font-mono text-[11px]">🛡️ MODO EXAMEN ACTIVO:</span> Demuestra la seña de memoria frente a la cámara sin guía de video ni pistas visuales.`;
  } else {
    if (descEl) descEl.textContent = currentSign.desc;
    if (tipEl) tipEl.innerHTML = `💡 <strong>Instrucción para replicarla:</strong> ${currentSign.tip}`;
  }

  renderSignButtons();
}

window.selectSignById = selectSign;

function explainSignVoice() {
  if (!currentSign || !window.ChatTutor) return;
  const text = `Seña ${currentSign.name}. ${currentSign.tip}`;
  window.ChatTutor.speakText(text);
}

// Hook disparado por vision-evaluator al alcanzar el umbral de acierto
window.onSignMastered = function(sign, score) {
  // Si el Modo Examen Sin Video está activo, delegar exclusivamente a BlindExamController
  if (window.BlindExamController && window.BlindExamController.isExamActive()) {
    window.BlindExamController.handleSignMasteredInExam(sign, score);
    return;
  }

  if (window.VisionEvaluator) {
    window.VisionEvaluator.setPaused(true);
  }

  // Registrar seña dominada y otorgar +25 XP en modo práctica
  if (window.AuthProfileManager) {
    window.AuthProfileManager.recordSignMastered(sign.id, 25);
  }

  // Avanzar y marcar progreso en el mapa hexagonal del plan activo
  if (window.LearningPlanManager) {
    window.LearningPlanManager.markSignCompletedInPlan(sign.id);
  }

  if (typeof confetti === 'function') {
    confetti({ particleCount: 95, spread: 80, origin: { y: 0.6 } });
  }
  if (window.ChatTutor) {
    window.ChatTutor.playVictorySound();
    window.ChatTutor.speakText(`¡Excelente trabajo! Has logrado la seña ${sign.name} con un ${score}% de precisión.`);
  }

  const popup = document.getElementById('successPopup');
  const msgEl = document.getElementById('successMessage');
  if (msgEl) msgEl.textContent = `¡Has replicado la seña '${sign.name}' con un ${score}% de precisión en LSC!`;
  if (popup) {
    popup.classList.remove('hidden');
    popup.classList.add('modal-enter');
  }
};

function dismissSuccessModal(goToNext) {
  const popup = document.getElementById('successPopup');
  if (popup) {
    popup.classList.add('hidden');
    popup.classList.remove('modal-enter');
  }

  if (goToNext) {
    // Si hay un plan activo en LearningPlanManager, seguir el orden de la ruta hexagonal
    if (window.LearningPlanManager) {
      const plan = window.LearningPlanManager.getActivePlan();
      const signs = plan.signs || [];
      const curIdx = signs.indexOf(currentSign.id);
      if (curIdx >= 0 && curIdx + 1 < signs.length) {
        selectSign(signs[curIdx + 1]);
        return;
      }
    }

    if (window.SIGNS_DATA) {
      const list = window.SIGNS_DATA[currentCategory];
      const idx = list.findIndex(s => s.id === currentSign.id);
      const nextIdx = (idx + 1) % list.length;
      selectSign(list[nextIdx].id);
    }
  } else {
    // Seguir practicando la misma seña: reiniciar evaluación de inmediato
    if (window.VisionEvaluator) {
      window.VisionEvaluator.setTargetSign(currentSign);
    }
  }
}
