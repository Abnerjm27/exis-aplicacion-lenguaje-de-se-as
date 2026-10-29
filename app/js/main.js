/**
 * LSC Learn · Proyecto EXIS
 * main.js - Orquestación Principal de la Aplicación
 * Conecta Reproductor de Video Interactivo LSC, Visión MediaPipe, Chat Tutor IA y Catálogo LSC70
 */

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
  let found = window.SIGNS_DATA.words.find(s => s.id === id);
  if (found) {
    currentCategory = 'words';
  } else {
    found = window.SIGNS_DATA.letters.find(s => s.id === id);
    if (found) currentCategory = 'letters';
  }
  if (!found) return;

  currentSign = found;

  // Actualizar Reproductor de Video Interactivo LSC
  if (window.VideoPlayer) {
    window.VideoPlayer.setSign(currentSign.id);
  }

  // Actualizar Evaluador de Visión MediaPipe
  if (window.VisionEvaluator) {
    window.VisionEvaluator.setTargetSign(currentSign);
  }

  // Actualizar Ficha Técnica de la Seña en la UI
  const badgeEl = document.getElementById('targetSignBadge');
  const descEl = document.getElementById('targetSignDesc');
  const tipEl = document.getElementById('targetSignTip');

  if (badgeEl) badgeEl.textContent = currentSign.name;
  if (descEl) descEl.textContent = currentSign.desc;
  if (tipEl) tipEl.innerHTML = `💡 <strong>Instrucción para replicarla:</strong> ${currentSign.tip}`;

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
  if (window.VisionEvaluator) {
    window.VisionEvaluator.setPaused(true);
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

  if (goToNext && window.SIGNS_DATA) {
    const list = window.SIGNS_DATA[currentCategory];
    const idx = list.findIndex(s => s.id === currentSign.id);
    const nextIdx = (idx + 1) % list.length;
    selectSign(list[nextIdx].id);
  }

  setTimeout(() => {
    if (window.VisionEvaluator) {
      window.VisionEvaluator.setPaused(false);
    }
  }, 1200);
}
