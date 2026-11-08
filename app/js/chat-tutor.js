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
    const parsed = LSCClientNLU.parse(msg);
    if (parsed.targetSign && typeof window.selectSignById === 'function') {
      window.selectSignById(parsed.targetSign);
    }
    return LSCClientNLU.buildReply(parsed);
  }

class LSCClientNLU {
  static VOCABULARY_WORDS = {
    licor: 'LICOR', trago: 'LICOR', beber: 'LICOR', bebida: 'LICOR',
    gustar: 'GUSTAR', gusta: 'GUSTAR', gusto: 'GUSTAR',
    nombre: 'NOMBRE', llamo: 'NOMBRE', llamas: 'NOMBRE',
    anos: 'ANNOS', ano: 'ANNOS', annos: 'ANNOS', edad: 'ANNOS',
    noches: 'NOCHES', noche: 'NOCHES',
    tardes: 'TARDES', tarde: 'TARDES',
    dias: 'DIAS', dia: 'DIAS',
    buenos: 'BUENOS', buenas: 'BUENOS',
    hola: 'HOLA', saludo: 'HOLA', saludar: 'HOLA',
    yo: 'YO', mi: 'YO', mismo: 'YO'
  };

  static LETTERS = {
    a: 'A', b: 'B', c: 'C', d: 'D', e: 'E',
    i: 'I', l: 'L', o: 'O', u: 'U', v: 'V'
  };

  static SIGN_DESCRIPTIONS = {
    HOLA: "coloca tu mano derecha en la sien con los dedos juntos y proyéctala suavemente hacia adelante y afuera en diagonal saludando al frente.",
    YO: "forma un puño con tu mano derecha y deja únicamente el dedo índice extendido apuntando hacia tu pecho.",
    BUENOS: "coloca tu mano izquierda abierta como base en el pecho (palma arriba) y baja tu mano derecha para chocar apoyando la palma sobre la izquierda en el torso.",
    DIAS: "abre ambos brazos lateralmente a la altura del pecho con las palmas al frente simulando el amanecer.",
    TARDES: "cruza tus antebrazos horizontalmente frente a tu pecho con las palmas orientadas hacia tu cuerpo.",
    NOCHES: "cruza ambos brazos sobre tu pecho con las manos reposando sobre los antebrazos opuestos.",
    GUSTAR: "inclina levemente la cabeza hacia arriba, apoya tu dedo índice en la base de la garganta y deslízalo suavemente hacia arriba.",
    NOMBRE: "extiende los dedos índice y medio de ambas manos y apoya los de la mano derecha sobre los de la izquierda frente a tu torso.",
    ANNOS: "ubica ambas manos frente a tu torso y realiza un suave frotamiento o movimiento circular con tu mano derecha sobre la izquierda indicando el transcurso del tiempo.",
    LICOR: "configura tu mano derecha en copa (o letra Y con pulgar y meñique) y elévala hacia la barbilla o boca inclinándola con delicadeza.",
    A: "cierra los 4 dedos en un puño firme y mantén el pulgar erguido a un lado del índice.",
    B: "extiende los cuatro dedos juntos rectos hacia arriba y dobla el pulgar sobre la palma.",
    C: "arquea los 4 dedos y el pulgar enfrentados formando la curvatura semicircular de la letra C.",
    D: "apunta tu dedo índice recto hacia arriba y junta la punta de tu pulgar con tu dedo medio formando un aro en la base.",
    E: "curva los cuatro dedos juntos hacia abajo y apoya sus yemas sobre el pulgar doblado en la palma.",
    I: "cierra tu mano en puño y extiende únicamente el dedo meñique hacia arriba en vertical.",
    L: "extiende el dedo índice hacia arriba y el pulgar hacia un lado formando un ángulo recto de 90 grados.",
    O: "curva los dedos de tu mano tocando suavemente la punta del pulgar para formar un círculo visible O.",
    U: "levanta el dedo índice y el dedo medio juntos y pegados apuntando hacia arriba (sin separación en V).",
    V: "levanta el dedo índice y el dedo medio separados en forma de victoria."
  };

  static GREETING_STARTERS = [
    "buenos dias", "buenas tardes", "buenas noches", "buen dia", "buenas",
    "hola zorrito", "hola amigo", "hola profe", "hola tutor", "hola manitas",
    "hola", "saludos", "hey", "alo", "ola"
  ];

  static CATALOG_KEYWORDS = [
    "catalogo", "menu", "opciones", "que senas", "que tienes", "que hay",
    "cuales senas", "cuales son", "lista", "que puedo aprender", "que palabras"
  ];

  static IDENTITY_KEYWORDS = [
    "quien eres", "como te llamas", "que eres", "presentate", "tu nombre", "tu creador"
  ];

  static GRATITUDE_KEYWORDS = [
    "gracias", "muchas gracias", "te agradezco", "mil gracias", "genial gracias"
  ];

  static normalize(text) {
    if (!text) return "";
    return text
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  static parse(message) {
    const raw = (message || "").trim();
    const norm = this.normalize(raw);
    if (!norm) {
      return { intent: 'UNKNOWN', targetSign: null, isClarification: false, greetingPreamble: null, rawMessage: raw };
    }

    // 1. Gratitud
    for (const kw of this.GRATITUDE_KEYWORDS) {
      if (norm.includes(kw) && norm.split(' ').length <= 4) {
        return { intent: 'GRATITUDE', targetSign: null, isClarification: false, greetingPreamble: null, rawMessage: raw };
      }
    }

    // 2. Identidad del Tutor
    for (const kw of this.IDENTITY_KEYWORDS) {
      if (norm.includes(kw)) {
        return { intent: 'IDENTITY', targetSign: null, isClarification: false, greetingPreamble: null, rawMessage: raw };
      }
    }

    // 3. Catálogo oficial
    for (const kw of this.CATALOG_KEYWORDS) {
      if (norm.includes(kw)) {
        return { intent: 'CATALOG', targetSign: null, isClarification: false, greetingPreamble: null, rawMessage: raw };
      }
    }

    // 4. Extracción de preámbulo de saludo
    let detectedPreamble = null;
    let cleanedText = norm;
    for (const g of this.GREETING_STARTERS) {
      if (norm === g) {
        return { intent: 'GREETING', targetSign: null, isClarification: false, greetingPreamble: g, rawMessage: raw };
      }
      if (norm.startsWith(g + " ")) {
        detectedPreamble = g;
        cleanedText = norm.slice(g.length).trim();
        break;
      }
    }

    if (detectedPreamble && !cleanedText) {
      return { intent: 'GREETING', targetSign: null, isClarification: false, greetingPreamble: detectedPreamble, rawMessage: raw };
    }

    // 5. Principiante / Desde cero (Detectar antes de negaciones para evitar falsos positivos con 'no sé nada')
    if (/\b(?:no se nada|soy nuevo|desde cero|principiante|por donde empiezo|que hago|como inicio|que me recomiendas|recomendacion)\b/i.test(cleanedText)) {
      return { intent: 'BEGINNER_RECOMMENDATION', targetSign: 'HOLA', isClarification: false, greetingPreamble: detectedPreamble, rawMessage: raw };
    }

    // 6. Negaciones, Aclaraciones y Contrastes
    const isNegation = /\b(?:no quiero|no deseo|no me gusta|no esa|no aprender|no practicar|no voy a|tampoco esa)\b/i.test(cleanedText) ||
                       cleanedText.startsWith('no ') || cleanedText === 'no';
    const contrastMatch = cleanedText.match(/\b(?:prefiero|sino|mejor|cambia a|dame|ponme)\s+(?:la\s+|el\s+)?(\w+)/i);
    if (isNegation) {
      if (contrastMatch) {
        const candidate = contrastMatch[1].toLowerCase();
        if (this.LETTERS[candidate]) {
          return { intent: 'LEARN_SIGN', targetSign: this.LETTERS[candidate], isClarification: true, greetingPreamble: detectedPreamble, rawMessage: raw };
        }
        if (this.VOCABULARY_WORDS[candidate]) {
          return { intent: 'LEARN_SIGN', targetSign: this.VOCABULARY_WORDS[candidate], isClarification: true, greetingPreamble: detectedPreamble, rawMessage: raw };
        }
      }
      // Rechazo sin alternativa: no forzar 'A'
      return { intent: 'REJECT_SIGN', targetSign: null, isClarification: true, greetingPreamble: detectedPreamble, rawMessage: raw };
    }

    // 7. Intención de aprendizaje abierta o incompleta ("quiero aprender a", "deseo aprender")
    if (['quiero aprender a', 'quiero aprender', 'deseo aprender', 'ensename a', 'aprender', 'aprender a', 'quiero practicar', 'ensenar'].includes(cleanedText)) {
      return { intent: 'OPEN_LEARNING_INTRO', targetSign: null, isClarification: false, greetingPreamble: detectedPreamble, rawMessage: raw };
    }

    // 8. Categorías Temáticas (Saludos, Presentación, Abecedario, Visión/Cámara)
    if (/\b(?:saludos|saludo|saludar|como saludar|decir hola)\b/i.test(cleanedText)) {
      return { intent: 'THEME_GREETINGS', targetSign: 'HOLA', isClarification: false, greetingPreamble: detectedPreamble, rawMessage: raw };
    }
    if (/\b(?:presentarme|presentacion|mi nombre|decir mi nombre|como me llamo)\b/i.test(cleanedText)) {
      return { intent: 'THEME_PRESENTATION', targetSign: 'YO', isClarification: false, greetingPreamble: detectedPreamble, rawMessage: raw };
    }
    if (/\b(?:abecedario|alfabeto|vocales|vocal|dactilologico)\b/i.test(cleanedText)) {
      return { intent: 'THEME_ALPHABET', targetSign: 'A', isClarification: false, greetingPreamble: detectedPreamble, rawMessage: raw };
    }
    if (/\b(?:camara|webcam|mediapipe|radar|como funciona|vision artificial|puntos de la mano)\b/i.test(cleanedText)) {
      return { intent: 'TECH_EXPLANATION', targetSign: null, isClarification: false, greetingPreamble: detectedPreamble, rawMessage: raw };
    }

    // 9. Solicitud de Letra específica con indicadores
    const letMatch = cleanedText.match(/\b(?:letra|vocal|la)\s+([a-z])\b/i);
    if (letMatch && this.LETTERS[letMatch[1].toLowerCase()]) {
      return { intent: 'LEARN_SIGN', targetSign: this.LETTERS[letMatch[1].toLowerCase()], isClarification: false, greetingPreamble: detectedPreamble, rawMessage: raw };
    }

    // Consonantes aisladas dactilológicas (b, c, d, l, v)
    for (const cons of ['b', 'c', 'd', 'l', 'v']) {
      if (new RegExp(`\\b${cons}\\b`, 'i').test(cleanedText)) {
        return { intent: 'LEARN_SIGN', targetSign: this.LETTERS[cons], isClarification: false, greetingPreamble: detectedPreamble, rawMessage: raw };
      }
    }

    // 10. Vocabulario de Palabras Oficiales LSC70
    for (const [word, signId] of Object.entries(this.VOCABULARY_WORDS)) {
      if (new RegExp(`\\b${word}\\b`, 'i').test(cleanedText)) {
        if (word === 'hola' && !["sena", "palabra", "aprender", "como se", "hacer", "decir"].some(k => cleanedText.includes(k))) {
          continue;
        }
        if ((word === 'yo' || word === 'mi') && ["quiero", "puedo", "gustaria", "voy", "tengo"].some(k => cleanedText.includes(k))) {
          continue;
        }
        return { intent: 'LEARN_SIGN', targetSign: signId, isClarification: false, greetingPreamble: detectedPreamble, rawMessage: raw };
      }
    }

    if (detectedPreamble) {
      return { intent: 'GREETING', targetSign: null, isClarification: false, greetingPreamble: detectedPreamble, rawMessage: raw };
    }

    return { intent: 'UNKNOWN', targetSign: null, isClarification: false, greetingPreamble: null, rawMessage: raw };
  }

  static buildReply(parsed) {
    const sign = parsed.targetSign;
    const desc = this.SIGN_DESCRIPTIONS[sign] || "";

    if (parsed.intent === 'LEARN_SIGN' && sign) {
      if (parsed.isClarification) {
        return `¡Entendido perfectamente! Cambiemos el foco a la seña de '${sign}': ${desc}`;
      } else if (parsed.greetingPreamble) {
        const greetMap = {
          "buenos dias": "¡Buenos días! Con mucho gusto",
          "buenas tardes": "¡Buenas tardes! Con mucho gusto",
          "buenas noches": "¡Buenas noches! Con mucho gusto",
          "hola": "¡Hola! Con mucho gusto",
          "saludos": "¡Saludos! Con mucho gusto",
          "hey": "¡Hola! Con mucho gusto"
        };
        const greet = greetMap[parsed.greetingPreamble] || "¡Hola! Con mucho gusto";
        return `${greet}, vamos a aprender la seña de '${sign}': ${desc}`;
      } else {
        return `¡Excelente elección! Para la seña de '${sign}': ${desc}`;
      }
    }

    if (parsed.intent === 'REJECT_SIGN') {
      return "¡Entendido perfectamente! Disculpa la confusión, no practicaremos esa seña. 😊 ¿Qué otra palabra o letra te gustaría explorar? Puedes elegir entre: HOLA, BUENOS DÍAS, TARDES, NOCHES, GUSTAR, NOMBRE, AÑOS, LICOR o las letras del abecedario (A, B, C, D, E, I, L, O, U, V).";
    }

    if (parsed.intent === 'OPEN_LEARNING_INTRO') {
      return "¡Qué gran iniciativa! 🦊 En Manitas te enseño Lengua de Señas Colombiana paso a paso con videos oficiales y visión artificial por tu cámara. ¿Por dónde te gustaría arrancar? Te recomiendo empezar con saludos cotidianos como 'HOLA' o con las vocales del abecedario como la 'A'.";
    }

    if (parsed.intent === 'BEGINNER_RECOMMENDATION') {
      return "¡Bienvenido a Manitas! 🦊 No te preocupes por empezar desde cero, ¡es la mejor forma de aprender con buena técnica! Te recomiendo iniciar con el saludo universal 'HOLA'. ¿Listo para ver la demostración y practicar frente a la cámara?";
    }

    if (parsed.intent === 'THEME_GREETINGS') {
      return `¡Excelente elección! Para saludar en LSC tenemos señas fundamentales: HOLA, BUENOS DÍAS, TARDES y NOCHES. Comencemos practicando 'HOLA': ${desc}`;
    }

    if (parsed.intent === 'THEME_PRESENTATION') {
      return `¡Muy bien! Para presentarte en LSC necesitas dominar tres señas clave: 'YO', 'NOMBRE' y 'AÑOS' (junto al abecedario para tu nombre). Comencemos con 'YO': ${desc}`;
    }

    if (parsed.intent === 'THEME_ALPHABET') {
      return `¡Genial! En Manitas puedes practicar las vocales (A, E, I, O, U) y consonantes (B, C, D, L, V). Comencemos con la primera vocal: 'A': ${desc}`;
    }

    if (parsed.intent === 'TECH_EXPLANATION') {
      return "¡Buena pregunta! 🖐️ Manitas utiliza visión artificial local con Google MediaPipe Hands. Tu cámara analiza 21 puntos anatómicos de tu mano 30 veces por segundo y compara su postura y ángulos contra el dataset oficial LSC70. ¡Al mantener más del 85% de similitud durante 1 segundo, apruebas la seña!";
    }

    if (parsed.intent === 'GREETING') {
      return "¡Hola! Qué alegría saludarte. Soy Zorrito, tu tutor interactivo de Lengua de Señas Colombiana (LSC). ¿Qué seña te gustaría practicar hoy? Puedes decirme por ejemplo: 'Quiero aprender la letra A', 'Enséñame HOLA' o 'Cómo se hace DÍAS'.";
    }

    if (parsed.intent === 'CATALOG') {
      return "En Manitas tenemos señas oficiales del dataset LSC70 listas para practicar:\n• Palabras de uso cotidiano: HOLA, YO, BUENOS, DÍAS, TARDES, NOCHES, GUSTAR, NOMBRE, AÑOS y LICOR.\n• Alfabeto dactilológico: A, B, C, D, E, I, L, O, U y V.\n¿Cuál de ellas te gustaría practicar ahora mismo?";
    }

    if (parsed.intent === 'IDENTITY') {
      return "¡Hola! Soy Zorrito, tu tutor inteligente de Lengua de Señas Colombiana (LSC) en Manitas. Mi misión es guiarte con visión artificial por webcam y modelos pedagógicos para que aprendas con precisión.";
    }

    if (parsed.intent === 'GRATITUDE') {
      return "¡Con todo el gusto! La práctica constante frente a la cámara es el mejor camino para dominar la lengua de señas. ¿Deseas continuar con otra seña o prefieres repasar?";
    }

    return "¡Hola! Comprendo tu mensaje. Para guiarte con la cámara y los videos de LSC, puedes pedirme cualquiera de nuestras señas oficiales, por ejemplo: 'Quiero aprender la letra A', 'Enséñame HOLA' o 'Practicar DÍAS'. ¿Cuál eliges?";
  }
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
