/**
 * LSC Learn · Proyecto EXIS
 * chat-tutor.js - Tutor Inteligente con IA Local (Ollama) y Síntesis por Voz
 */

const ChatTutor = (() => {
  const chatHistory = [];
  let isSending = false;

  function toggleDrawer() {
    const drawer = document.getElementById('chatDrawer');
    if (!drawer) return;
    const isHidden = drawer.classList.contains('hidden');
    if (isHidden) {
      drawer.classList.remove('hidden');
      drawer.classList.add('drawer-enter');
      const input = document.getElementById('chatInput');
      if (input) setTimeout(() => input.focus(), 100);
    } else {
      drawer.classList.add('hidden');
      drawer.classList.remove('drawer-enter');
    }
  }

  function sendQuickMessage(text) {
    const input = document.getElementById('chatInput');
    if (input) {
      input.value = text;
      sendMessage();
    }
  }

  async function sendMessage() {
    if (isSending) return;
    const input = document.getElementById('chatInput');
    const sendBtn = document.getElementById('chatSendBtn');
    if (!input) return;

    const message = input.value.trim();
    if (!message) return;

    input.value = '';
    appendMessage('user', message);

    isSending = true;
    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.innerHTML = '...';
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
          history: chatHistory
        })
      });

      const data = await response.json();
      let reply = data.reply || "No pude procesar la respuesta en este momento.";

      // Handle sign switching directive [SELECCIONAR: ID]
      const match = reply.match(/\[SELECCIONAR:\s*([A-Za-z0-9_]+)\]/i);
      if (match) {
        const signId = match[1].toUpperCase();
        reply = reply.replace(match[0], '').trim();
        if (typeof window.selectSignById === 'function') {
          window.selectSignById(signId);
        }
      }

      appendMessage('assistant', reply);
      chatHistory.push({ role: 'user', content: message });
      chatHistory.push({ role: 'assistant', content: reply });

    } catch (err) {
      console.warn("Fallo al conectar con Ollama, usando fallback local:", err);
      const fallbackReply = generateFallbackReply(message);
      appendMessage('assistant', fallbackReply);
    } finally {
      isSending = false;
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.innerHTML = '➔';
      }
    }
  }

  function generateFallbackReply(msg) {
    const lower = msg.toLowerCase();
    if (lower.includes('hola')) {
      if (typeof window.selectSignById === 'function') window.selectSignById('HOLA');
      return "¡Excelente! He cargado la seña 'HOLA' en el reproductor de video LSC. Mano extendida a la altura de tu sien.";
    }
    if (lower.includes('yo')) {
      if (typeof window.selectSignById === 'function') window.selectSignById('YO');
      return "Muy bien, he colocado la seña 'YO'. Cierra el puño y apunta únicamente con tu dedo índice a tu pecho.";
    }
    if (lower.includes('buenos dias') || lower.includes('dias') || lower.includes('día')) {
      if (typeof window.selectSignById === 'function') window.selectSignById('DIAS');
      return "He seleccionado la seña de 'DÍAS'. Abre ambos brazos lateralmente a la altura del pecho con las palmas al frente simulando el amanecer.";
    }
    if (lower.includes('noches') || lower.includes('noche')) {
      if (typeof window.selectSignById === 'function') window.selectSignById('NOCHES');
      return "He seleccionado 'NOCHES'. Cruza ambos brazos sobre tu pecho con las manos reposando sobre los antebrazos opuestos.";
    }
    if (lower.includes('nombre')) {
      if (typeof window.selectSignById === 'function') window.selectSignById('NOMBRE');
      return "He seleccionado 'NOMBRE'. Extiende los dedos índice y medio de ambas manos y apoya los de la mano derecha sobre los de la izquierda frente al torso.";
    }
    if (lower.includes('buenos')) {
      if (typeof window.selectSignById === 'function') window.selectSignById('BUENOS');
      return "He seleccionado 'BUENOS / AS'. Mano abierta con dedos juntos apoyada en el mentón proyectándose suavemente hacia el frente.";
    }
    if (lower.includes('letra b') || lower.includes(' b ') || lower === 'b') {
      if (typeof window.selectSignById === 'function') window.selectSignById('B');
      return "Cargando la Letra B: extiende los 4 dedos juntos rectos hacia arriba y dobla el pulgar sobre la palma.";
    }
    if (lower.includes('letra c') || lower.includes(' c ') || lower === 'c') {
      if (typeof window.selectSignById === 'function') window.selectSignById('C');
      return "Cargando la Letra C: arquea los 4 dedos y el pulgar enfrentados formando la curvatura semicircular de la letra C.";
    }
    if (lower.includes('letra l') || lower.includes(' l ') || lower === 'l') {
      if (typeof window.selectSignById === 'function') window.selectSignById('L');
      return "Cargando la Letra L: extiende el índice recto hacia arriba y el pulgar horizontal a 90 grados.";
    }
    if (lower.includes('letra v') || lower.includes(' v ') || lower === 'v') {
      if (typeof window.selectSignById === 'function') window.selectSignById('V');
      return "Cargando la Letra V: levanta los dedos índice y medio separados en forma de victoria.";
    }
    if (lower.includes('letra a') || lower.includes(' a ') || lower === 'a') {
      if (typeof window.selectSignById === 'function') window.selectSignById('A');
      return "Cargando la Letra A del alfabeto LSC: puño cerrado con el pulgar erguido a su lado.";
    }
    if (lower.includes('señas') || lower.includes('tienes') || lower.includes('opciones') || lower.includes('hay')) {
      return "Tenemos disponibles señas en LSC:\n• Palabras: HOLA, YO, BUENOS, DÍAS, NOCHES, NOMBRE.\n• Alfabeto: A, B, C, L, V. ¿Cuál quieres practicar?";
    }
    return "Te sugiero comenzar con 'HOLA', 'DÍAS' o la 'Letra C'. ¿Deseas practicar alguna de ellas ahora mismo?";
  }

  function appendMessage(role, text) {
    const container = document.getElementById('chatMessages');
    if (!container) return;

    const msgWrapper = document.createElement('div');
    msgWrapper.className = `flex flex-col gap-1 max-w-[85%] ${role === 'user' ? 'self-end' : 'self-start'}`;

    const bubble = document.createElement('div');
    bubble.className = role === 'user'
      ? "bg-amber-500 p-3 rounded-2xl rounded-tr-sm text-slate-950 font-medium leading-relaxed shadow-sm text-xs"
      : "bg-slate-800/95 border border-slate-700/60 p-3 rounded-2xl rounded-tl-sm text-slate-200 leading-relaxed shadow-sm text-xs";

    bubble.textContent = text;
    msgWrapper.appendChild(bubble);
    container.appendChild(msgWrapper);
    container.scrollTop = container.scrollHeight;
  }

  function speakText(text) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'es-CO';
      utter.rate = 1.0;
      utter.pitch = 1.0;
      window.speechSynthesis.speak(utter);
    }
  }

  function playVictorySound() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.1);
        gain.gain.setValueAtTime(0.25, audioCtx.currentTime + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i * 0.1 + 0.38);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + i * 0.1);
        osc.stop(audioCtx.currentTime + i * 0.1 + 0.42);
      });
    } catch (e) {}
  }

  return {
    toggleDrawer,
    sendQuickMessage,
    sendMessage,
    speakText,
    playVictorySound
  };
})();

window.ChatTutor = ChatTutor;
