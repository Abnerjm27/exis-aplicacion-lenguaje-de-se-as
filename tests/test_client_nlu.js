/**
 * Pruebas unitarias para LSCClientNLU en JavaScript.
 */
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

    // 2. Identidad
    for (const kw of this.IDENTITY_KEYWORDS) {
      if (norm.includes(kw)) {
        return { intent: 'IDENTITY', targetSign: null, isClarification: false, greetingPreamble: null, rawMessage: raw };
      }
    }

    // 3. Catálogo
    for (const kw of this.CATALOG_KEYWORDS) {
      if (norm.includes(kw)) {
        return { intent: 'CATALOG', targetSign: null, isClarification: false, greetingPreamble: null, rawMessage: raw };
      }
    }

    // 4. Preámbulo de saludo
    let detectedPreamble = null;
    let cleanedText = norm;
    for (const g of this.GREETING_STARTERS) {
      if (norm === g || norm.startsWith(g + " ")) {
        detectedPreamble = g;
        cleanedText = norm === g ? "" : norm.slice(g.length).trim();
        break;
      }
    }

    if (detectedPreamble && !cleanedText) {
      return { intent: 'GREETING', targetSign: null, isClarification: false, greetingPreamble: detectedPreamble, rawMessage: raw };
    }

    // 5. Aclaración / Corrección
    let isClarif = false;
    if (cleanedText.startsWith("no quiero aprender a") ||
        cleanedText.startsWith("no ") ||
        cleanedText.includes(" no quiero ") ||
        cleanedText.includes(" no esa ") ||
        cleanedText.startsWith("no,") ||
        cleanedText.startsWith("no.")) {
      isClarif = true;
    }

    // Contraste: "no quiero la a, prefiero la c"
    const contrastMatch = cleanedText.match(/\b(?:prefiero|sino|mejor|cambia a|dame|ponme)\s+(?:la\s+|el\s+)?(\w+)/);
    if (contrastMatch) {
      const candidate = contrastMatch[1];
      if (this.LETTERS[candidate]) {
        return { intent: 'LEARN_SIGN', targetSign: this.LETTERS[candidate], isClarification: true, greetingPreamble: detectedPreamble, rawMessage: raw };
      }
      if (this.VOCABULARY_WORDS[candidate]) {
        return { intent: 'LEARN_SIGN', targetSign: this.VOCABULARY_WORDS[candidate], isClarification: true, greetingPreamble: detectedPreamble, rawMessage: raw };
      }
    }

    // 6. Letra específica con indicadores
    for (const [letter, signId] of Object.entries(this.LETTERS)) {
      const pattern = new RegExp(`\\b(?:letra|vocal|la|alfabeto)\\s+${letter}\\b`);
      if (pattern.test(cleanedText)) {
        return { intent: 'LEARN_SIGN', targetSign: signId, isClarification: isClarif, greetingPreamble: detectedPreamble, rawMessage: raw };
      }
    }

    // Caso especial letra 'A' vs preposición 'a'
    const aMatch = cleanedText.match(/\b(?:aprender|ensename|practicar|quiero|hacer|pon)\s+a\s*$/);
    if (aMatch || cleanedText === 'a' || cleanedText === 'la a' || cleanedText.endsWith(' letra a')) {
      return { intent: 'LEARN_SIGN', targetSign: 'A', isClarification: isClarif, greetingPreamble: detectedPreamble, rawMessage: raw };
    }

    // Consonantes aisladas
    for (const cons of ['b', 'c', 'd', 'l', 'v']) {
      const pattern = new RegExp(`\\b${cons}\\b`);
      if (pattern.test(cleanedText)) {
        return { intent: 'LEARN_SIGN', targetSign: this.LETTERS[cons], isClarification: isClarif, greetingPreamble: detectedPreamble, rawMessage: raw };
      }
    }

    // Vocales (e, i, o, u)
    for (const vowel of ['e', 'i', 'o', 'u']) {
      const pattern = new RegExp(`\\b(?:aprender|ensename|practicar|quiero|hacer|pon|la|vocal)\\s+${vowel}\\b`);
      if (pattern.test(cleanedText) || cleanedText === vowel) {
        return { intent: 'LEARN_SIGN', targetSign: this.LETTERS[vowel], isClarification: isClarif, greetingPreamble: detectedPreamble, rawMessage: raw };
      }
    }

    // 7. Palabras oficiales
    for (const [word, signId] of Object.entries(this.VOCABULARY_WORDS)) {
      const pattern = new RegExp(`\\b${word}\\b`);
      if (pattern.test(cleanedText)) {
        if (word === 'hola' && !["sena", "palabra", "aprender", "como se", "decir"].some(k => cleanedText.includes(k))) {
          continue;
        }
        if ((word === 'yo' || word === 'mi') && ["quiero", "puedo", "gustaria", "voy"].some(k => cleanedText.includes(k))) {
          continue;
        }
        return { intent: 'LEARN_SIGN', targetSign: signId, isClarification: isClarif, greetingPreamble: detectedPreamble, rawMessage: raw };
      }
    }

    if (detectedPreamble) {
      return { intent: 'GREETING', targetSign: null, isClarification: false, greetingPreamble: detectedPreamble, rawMessage: raw };
    }

    return { intent: 'UNKNOWN', targetSign: null, isClarification: false, greetingPreamble: null, rawMessage: raw };
  }
}

// Tests
const cases = [
  { q: 'hola quiero aprender a', expectedTarget: 'A', expectedIntent: 'LEARN_SIGN' },
  { q: 'no quiero aprender a', expectedTarget: 'A', expectedIntent: 'LEARN_SIGN' },
  { q: 'no quiero la a, prefiero la c', expectedTarget: 'C', expectedIntent: 'LEARN_SIGN' },
  { q: 'buenas tardes me enseñas licor', expectedTarget: 'LICOR', expectedIntent: 'LEARN_SIGN' },
  { q: 'hola', expectedTarget: null, expectedIntent: 'GREETING' },
  { q: 'qué señas tienes', expectedTarget: null, expectedIntent: 'CATALOG' },
  { q: 'quién eres', expectedTarget: null, expectedIntent: 'IDENTITY' }
];

let failed = 0;
for (const tc of cases) {
  const res = LSCClientNLU.parse(tc.q);
  const ok = res.targetSign === tc.expectedTarget && res.intent === tc.expectedIntent;
  if (!ok) {
    console.error(`FAIL: "${tc.q}" -> got target=${res.targetSign}, intent=${res.intent}`);
    failed++;
  } else {
    console.log(`PASS: "${tc.q}" -> target=${res.targetSign}, intent=${res.intent}`);
  }
}

if (failed === 0) {
  console.log("\nALL 7 JAVASCRIPT NLU TESTS PASSED!");
} else {
  process.exit(1);
}
