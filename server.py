import http.server
import socketserver
import json
import urllib.request
import urllib.parse
import os
import sys
import time

PORT = 8000
DIRECTORY = os.path.join(os.path.dirname(os.path.abspath(__file__)), "app")
OLLAMA_URL = "http://127.0.0.1:11434/api/generate"

AVAILABLE_SIGNS = {
    "hola": "HOLA",
    "saludo": "HOLA",
    "salud": "HOLA",
    "yo": "YO",
    "mi": "YO",
    "buenos": "BUENOS",
    "dias": "DIAS",
    "dia": "DIAS",
    "tardes": "TARDES",
    "tarde": "TARDES",
    "noches": "NOCHES",
    "noche": "NOCHES",
    "gustar": "GUSTAR",
    "gusta": "GUSTAR",
    "gusto": "GUSTAR",
    "nombre": "NOMBRE",
    "anos": "ANNOS",
    "ano": "ANNOS",
    "annos": "ANNOS",
    "edad": "ANNOS",
    "licor": "LICOR",
    "trago": "LICOR",
    "beber": "LICOR",
    "bebida": "LICOR",
    "a": "A",
    "b": "B",
    "c": "C",
    "d": "D",
    "e": "E",
    "i": "I",
    "l": "L",
    "o": "O",
    "u": "U",
    "v": "V"
}

LSC_SIGN_DESCRIPTIONS = {
    "HOLA": "coloca tu mano derecha en la sien con los dedos juntos y proyéctala suavemente hacia adelante y afuera en diagonal saludando al frente.",
    "YO": "forma un puño con tu mano derecha y deja únicamente el dedo índice extendido apuntando hacia tu pecho.",
    "BUENOS": "coloca tu mano izquierda abierta como base en el pecho (palma arriba) y baja tu mano derecha para chocar apoyando la palma sobre la izquierda en el torso.",
    "DIAS": "abre ambos brazos lateralmente a la altura del pecho con las palmas al frente simulando el amanecer.",
    "TARDES": "cruza tus antebrazos horizontalmente frente a tu pecho con las palmas orientadas hacia tu cuerpo.",
    "NOCHES": "cruza ambos brazos sobre tu pecho con las manos reposando sobre los antebrazos opuestos.",
    "GUSTAR": "inclina levemente la cabeza hacia arriba, apoya tu dedo índice en la base de la garganta y deslízalo suavemente hacia arriba.",
    "NOMBRE": "extiende los dedos índice y medio de ambas manos y apoya los de la mano derecha sobre los de la izquierda frente a tu torso.",
    "ANNOS": "ubica ambas manos frente a tu torso y realiza un suave frotamiento o movimiento circular con tu mano derecha sobre la izquierda indicando el transcurso del tiempo.",
    "LICOR": "configura tu mano derecha en copa (o letra Y con pulgar y meñique) y elévala hacia la barbilla o boca inclinándola con delicadeza.",
    "A": "cierra los 4 dedos en un puño firme y mantén el pulgar erguido a un lado del índice.",
    "B": "extiende los cuatro dedos juntos rectos hacia arriba y dobla el pulgar sobre la palma.",
    "C": "arquea los 4 dedos y el pulgar enfrentados formando la curvatura semicircular de la letra C.",
    "D": "apunta tu dedo índice recto hacia arriba y junta la punta de tu pulgar con tu dedo medio formando un aro en la base.",
    "E": "curva los cuatro dedos juntos hacia abajo y apoya sus yemas sobre el pulgar doblado en la palma.",
    "I": "cierra tu mano en puño y extiende únicamente el dedo meñique hacia arriba en vertical.",
    "L": "extiende el dedo índice hacia arriba y el pulgar hacia un lado formando un ángulo recto de 90 grados.",
    "O": "curva los dedos de tu mano tocando suavemente la punta del pulgar para formar un círculo visible O.",
    "U": "levanta el dedo índice y el dedo medio juntos y pegados apuntando hacia arriba (sin separación en V).",
    "V": "levanta el dedo índice y el dedo medio separados en forma de victoria.",
}

FALLBACK_REPLIES = {
    k: f"Para la seña de '{k}', {v} [SELECCIONAR: {k}]" for k, v in LSC_SIGN_DESCRIPTIONS.items()
}

class LSCParsedIntent:
    """Contenedor de intención pedagógica extraída por el motor NLU."""
    def __init__(self, intent: str, target_sign: str = None, is_clarification: bool = False, greeting_preamble: str = None, raw_message: str = ""):
        self.intent = intent  # 'LEARN_SIGN', 'GREETING', 'CATALOG', 'IDENTITY', 'GRATITUDE', 'UNKNOWN'
        self.target_sign = target_sign
        self.is_clarification = is_clarification
        self.greeting_preamble = greeting_preamble
        self.raw_message = raw_message

    def __repr__(self):
        return f"<LSCParsedIntent intent={self.intent} target={self.target_sign} is_clarif={self.is_clarification} preamble={self.greeting_preamble}>"

class LSCNaturalLanguageParser:
    """
    Motor de Comprensión de Lenguaje Natural (NLU) para el Tutor Manitas LSC.
    Distingue preámbulos de cortesía ('hola quiero aprender a' -> foco en 'A'),
    resuelve negaciones y aclaraciones ('no quiero aprender a' -> foco en 'A'),
    y desambigua preposiciones gramaticales vs letras dactilológicas.
    """
    VOCABULARY_WORDS = {
        'licor': 'LICOR', 'trago': 'LICOR', 'beber': 'LICOR', 'bebida': 'LICOR',
        'gustar': 'GUSTAR', 'gusta': 'GUSTAR', 'gusto': 'GUSTAR',
        'nombre': 'NOMBRE', 'llamo': 'NOMBRE', 'llamas': 'NOMBRE',
        'anos': 'ANNOS', 'ano': 'ANNOS', 'annos': 'ANNOS', 'edad': 'ANNOS',
        'noches': 'NOCHES', 'noche': 'NOCHES',
        'tardes': 'TARDES', 'tarde': 'TARDES',
        'dias': 'DIAS', 'dia': 'DIAS',
        'buenos': 'BUENOS', 'buenas': 'BUENOS',
        'hola': 'HOLA', 'saludo': 'HOLA', 'saludar': 'HOLA',
        'yo': 'YO', 'mi': 'YO', 'mismo': 'YO'
    }

    LETTERS = {
        'a': 'A', 'b': 'B', 'c': 'C', 'd': 'D', 'e': 'E',
        'i': 'I', 'l': 'L', 'o': 'O', 'u': 'U', 'v': 'V'
    }

    GREETING_STARTERS = [
        "buenos dias", "buenas tardes", "buenas noches", "buen dia", "buenas",
        "hola zorrito", "hola amigo", "hola profe", "hola tutor", "hola manitas",
        "hola", "saludos", "hey", "alo", "ola"
    ]

    CATALOG_KEYWORDS = [
        "catalogo", "menu", "opciones", "que senas", "que tienes", "que hay",
        "cuales senas", "cuales son", "lista", "que puedo aprender", "que palabras"
    ]

    IDENTITY_KEYWORDS = [
        "quien eres", "como te llamas", "que eres", "presentate", "tu nombre", "tu creador"
    ]

    GRATITUDE_KEYWORDS = [
        "gracias", "muchas gracias", "te agradezco", "mil gracias", "genial gracias"
    ]

    @classmethod
    def normalize(cls, text: str) -> str:
        import unicodedata, re
        if not text:
            return ""
        norm = ''.join(c for c in unicodedata.normalize('NFD', text.strip()) if unicodedata.category(c) != 'Mn').lower()
        norm = re.sub(r'[^\w\s]', ' ', norm)
        return re.sub(r'\s+', ' ', norm).strip()

    @classmethod
    def parse(cls, message: str) -> LSCParsedIntent:
        import re
        raw = (message or "").strip()
        norm = cls.normalize(raw)
        if not norm:
            return LSCParsedIntent('UNKNOWN', raw_message=raw)

        # 1. Chequear gratitud
        for kw in cls.GRATITUDE_KEYWORDS:
            if kw in norm and len(norm.split()) <= 4:
                return LSCParsedIntent('GRATITUDE', raw_message=raw)

        # 2. Chequear identidad
        for kw in cls.IDENTITY_KEYWORDS:
            if kw in norm:
                return LSCParsedIntent('IDENTITY', raw_message=raw)

        # 3. Chequear catálogo
        for kw in cls.CATALOG_KEYWORDS:
            if kw in norm:
                return LSCParsedIntent('CATALOG', raw_message=raw)

        # 4. Detectar preámbulo de saludo
        detected_preamble = None
        cleaned_text = norm
        for g in cls.GREETING_STARTERS:
            if norm == g or norm.startswith(g + " "):
                detected_preamble = g
                if norm == g:
                    cleaned_text = ""
                else:
                    cleaned_text = norm[len(g):].strip()
                break

        # Si solo era saludo sin contenido adicional ("hola", "buenos días")
        if detected_preamble and not cleaned_text:
            return LSCParsedIntent('GREETING', greeting_preamble=detected_preamble, raw_message=raw)

        # 5. Detectar si es una aclaración / corrección
        is_clarif = False
        if (cleaned_text.startswith("no quiero aprender a") or 
            cleaned_text.startswith("no ") or 
            " no quiero " in cleaned_text or 
            " no esa " in cleaned_text or
            cleaned_text.startswith("no,") or
            cleaned_text.startswith("no.")):
            is_clarif = True

        # Manejo de contraste: "no quiero la a, prefiero la c", "no quiero a, dame v"
        contrast_match = re.search(r'\b(?:prefiero|sino|mejor|cambia a|dame|ponme)\s+(?:la\s+|el\s+)?(\w+)', cleaned_text)
        if contrast_match:
            candidate = contrast_match.group(1)
            if candidate in cls.LETTERS:
                return LSCParsedIntent('LEARN_SIGN', target_sign=cls.LETTERS[candidate], is_clarification=True, greeting_preamble=detected_preamble, raw_message=raw)
            if candidate in cls.VOCABULARY_WORDS:
                return LSCParsedIntent('LEARN_SIGN', target_sign=cls.VOCABULARY_WORDS[candidate], is_clarification=True, greeting_preamble=detected_preamble, raw_message=raw)

        # 6. Extracción de letra específica con indicadores explícitos
        for letter, sign_id in cls.LETTERS.items():
            pattern = rf'\b(?:letra|vocal|la|alfabeto)\s+{letter}\b'
            if re.search(pattern, cleaned_text):
                return LSCParsedIntent('LEARN_SIGN', target_sign=sign_id, is_clarification=is_clarif, greeting_preamble=detected_preamble, raw_message=raw)

        # Caso especial para la letra 'A' vs preposición 'a':
        # "quiero aprender a", "ensename a", "no quiero aprender a", "practicar a", o "a" al final
        a_match = re.search(r'\b(?:aprender|ensename|practicar|quiero|hacer|pon)\s+a\s*$', cleaned_text)
        if a_match or cleaned_text == 'a' or cleaned_text == 'la a' or cleaned_text.endswith(' letra a'):
            return LSCParsedIntent('LEARN_SIGN', target_sign='A', is_clarification=is_clarif, greeting_preamble=detected_preamble, raw_message=raw)

        # Consonantes aisladas (b, c, d, l, v) nunca son preposiciones en español
        for cons in ['b', 'c', 'd', 'l', 'v']:
            if re.search(rf'\b{cons}\b', cleaned_text):
                return LSCParsedIntent('LEARN_SIGN', target_sign=cls.LETTERS[cons], is_clarification=is_clarif, greeting_preamble=detected_preamble, raw_message=raw)

        # Vocales (e, i, o, u) si van precedidas de acción o aisladas
        for vowel in ['e', 'i', 'o', 'u']:
            v_match = re.search(rf'\b(?:aprender|ensename|practicar|quiero|hacer|pon|la|vocal)\s+{vowel}\b', cleaned_text)
            if v_match or cleaned_text == vowel:
                return LSCParsedIntent('LEARN_SIGN', target_sign=cls.LETTERS[vowel], is_clarification=is_clarif, greeting_preamble=detected_preamble, raw_message=raw)

        # 7. Palabras del vocabulario oficial
        for word, sign_id in cls.VOCABULARY_WORDS.items():
            if re.search(rf'\b{word}\b', cleaned_text):
                # Evitar falso positivo si la palabra era 'hola' pero ya se procesó como saludo sin foco explícito
                if word == 'hola' and not any(k in cleaned_text for k in ["sena", "palabra", "aprender", "como se", "decir"]):
                    continue
                # Evitar falso positivo con 'yo' si solo dice "yo quiero aprender..."
                if word in ('yo', 'mi') and any(k in cleaned_text for k in ["quiero", "puedo", "gustaria", "voy"]):
                    continue
                return LSCParsedIntent('LEARN_SIGN', target_sign=sign_id, is_clarification=is_clarif, greeting_preamble=detected_preamble, raw_message=raw)

        # Si el texto original tenía preámbulo de saludo pero nada más reconocido
        if detected_preamble:
            return LSCParsedIntent('GREETING', greeting_preamble=detected_preamble, raw_message=raw)

        return LSCParsedIntent('UNKNOWN', raw_message=raw)

    @classmethod
    def build_natural_reply(cls, parsed: LSCParsedIntent, descriptions: dict) -> str:
        sign = parsed.target_sign
        desc = descriptions.get(sign, "")
        tag = f"[SELECCIONAR: {sign}]" if sign else ""
        clean_desc = desc.replace(tag, "").strip() if desc else ""

        if parsed.intent == 'LEARN_SIGN' and sign:
            if parsed.is_clarification:
                return f"¡Entendido perfectamente! Enfoquémonos en la seña de '{sign}'. {clean_desc} {tag}".strip()
            elif parsed.greeting_preamble:
                greeting_map = {
                    "buenos dias": "¡Buenos días! Con mucho gusto",
                    "buenas tardes": "¡Buenas tardes! Con mucho gusto",
                    "buenas noches": "¡Buenas noches! Con mucho gusto",
                    "hola": "¡Hola! Con mucho gusto",
                    "saludos": "¡Saludos! Con mucho gusto",
                    "hey": "¡Hola! Con mucho gusto"
                }
                greet = greeting_map.get(parsed.greeting_preamble, "¡Hola! Con mucho gusto")
                return f"{greet}, vamos a aprender la seña de '{sign}'. {clean_desc} {tag}".strip()
            else:
                return f"¡Excelente elección! Para la seña de '{sign}', {clean_desc} {tag}".strip()

        if parsed.intent == 'GREETING':
            return (
                "¡Hola! Qué alegría saludarte. Soy Zorrito, tu tutor interactivo de Lengua de Señas Colombiana (LSC). "
                "¿Qué seña te gustaría practicar hoy? Puedes decirme por ejemplo: 'Quiero aprender la letra A', "
                "'Enséñame HOLA' o 'Cómo se hace DÍAS'."
            )

        if parsed.intent == 'CATALOG':
            return (
                "En Manitas tenemos señas oficiales del dataset LSC70 listas para practicar:\n"
                "• Palabras de uso cotidiano: HOLA, YO, BUENOS, DÍAS, TARDES, NOCHES, GUSTAR, NOMBRE, AÑOS y LICOR.\n"
                "• Alfabeto dactilológico: A, B, C, D, E, I, L, O, U y V.\n"
                "¿Cuál de ellas te gustaría practicar ahora mismo?"
            )

        if parsed.intent == 'IDENTITY':
            return (
                "¡Hola! Soy Zorrito, tu tutor inteligente de Lengua de Señas Colombiana (LSC) en Manitas. "
                "Mi misión es guiarte con visión artificial por webcam y modelos pedagógicos para que aprendas con precisión."
            )

        if parsed.intent == 'GRATITUDE':
            return (
                "¡Con todo el gusto! La práctica constante frente a la cámara es el mejor camino para dominar la lengua de señas. "
                "¿Deseas continuar con otra seña o prefieres repasar?"
            )

        return (
            "¡Hola! Comprendo tu mensaje. Para guiarte con la cámara y los videos de LSC, puedes pedirme cualquiera de nuestras "
            "señas oficiales, por ejemplo: 'Quiero aprender la letra A', 'Enséñame HOLA' o 'Practicar DÍAS'. ¿Cuál eliges?"
        )

class LSCTutorService:
    """
    Servicio de Tutoría Inteligente para LSC (POO).
    Orquesta la comprensión de lenguaje natural y la comunicación con Ollama.
    """
    def __init__(self, ollama_url: str = OLLAMA_URL, model: str = "qwen2.5:3b", timeout: float = 3.5):
        self.ollama_url = ollama_url
        self.model = model
        self.timeout = timeout

    def process_message(self, user_msg: str, history: list = None) -> dict:
        parsed = LSCNaturalLanguageParser.parse(user_msg)
        target_sign = parsed.target_sign

        reply_text = None
        # Para preguntas abiertas o conversacionales, intentamos Ollama en GPU
        if parsed.intent in ('UNKNOWN', 'OPEN_CONVERSATION'):
            reply_text = self._query_ollama_open(user_msg)

        # Si no hubo respuesta de Ollama o si es una seña/saludo/catálogo/identidad, usar NLU canónico
        if not reply_text:
            reply_text = LSCNaturalLanguageParser.build_natural_reply(parsed, LSC_SIGN_DESCRIPTIONS)

        # Garantizar [SELECCIONAR: ID] si hay target_sign
        if target_sign and f"[SELECCIONAR: {target_sign}]" not in reply_text:
            reply_text = f"{reply_text.strip()} [SELECCIONAR: {target_sign}]"

        return {
            "reply": reply_text,
            "detected_sign": target_sign,
            "intent": parsed.intent,
            "is_clarification": parsed.is_clarification
        }

    def _query_ollama_open(self, user_msg: str) -> str:
        try:
            prompt = (
                f"Eres Zorrito, el tutor interactivo y empático de Lengua de Señas Colombiana (LSC) en Manitas.\n"
                f"Usuario pregunta: \"{user_msg}\"\n"
                f"Instrucciones: Responde amablemente en español con tono cálido y pedagógico en máximo 2 oraciones breves.\n"
                f"Respuesta:"
            )
            req = urllib.request.Request(
                self.ollama_url,
                data=json.dumps({
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {"num_predict": 75, "temperature": 0.4}
                }).encode('utf-8'),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                res_data = json.loads(resp.read().decode('utf-8'))
                ans = res_data.get("response", "").strip()
                if ans:
                    return ans
        except Exception:
            pass
        return None

# Instancia global del servicio de tutoría
tutor_service = LSCTutorService()

def detect_sign(msg: str):
    """Función de compatibilidad delegada al motor NLU."""
    parsed = LSCNaturalLanguageParser.parse(msg)
    return parsed.target_sign

VALID_SIGN_IDS = [
    "HOLA", "YO", "BUENOS", "DIAS", "TARDES", "NOCHES",
    "GUSTAR", "NOMBRE", "ANNOS", "LICOR",
    "A", "B", "C", "D", "E", "I", "L", "O", "U", "V"
]

USERS_DB_PATH = os.path.join(DIRECTORY, "data", "users_db.json")

def load_users_db():
    """Carga la base de datos de usuarios desde app/data/users_db.json."""
    if not os.path.exists(USERS_DB_PATH):
        os.makedirs(os.path.dirname(USERS_DB_PATH), exist_ok=True)
        default_db = {"users": []}
        try:
            with open(USERS_DB_PATH, "w", encoding="utf-8") as f:
                json.dump(default_db, f, indent=2, ensure_ascii=False)
        except Exception:
            pass
        return default_db
    try:
        with open(USERS_DB_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"users": []}

def save_user_to_db(user_data):
    """Inserta o actualiza un usuario en la base de datos local app/data/users_db.json."""
    if not isinstance(user_data, dict) or not user_data.get("username"):
        raise ValueError("Datos de usuario inválidos: requiere campo 'username'")
    username = str(user_data.get("username")).strip().lower()
    db = load_users_db()
    users = db.get("users", [])
    found_idx = -1
    for idx, u in enumerate(users):
        if str(u.get("username", "")).strip().lower() == username:
            found_idx = idx
            break

    clean_user = {
        "username": username,
        "displayName": user_data.get("displayName") or username,
        "level": user_data.get("level", "Principiante"),
        "xp": int(user_data.get("xp", 0)),
        "streak": int(user_data.get("streak", 1)),
        "masteredSigns": list(user_data.get("masteredSigns", [])),
        "customPlans": list(user_data.get("customPlans", [])),
        "examHistory": list(user_data.get("examHistory", [])),
        "lastUpdated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }

    if found_idx >= 0:
        users[found_idx] = clean_user
    else:
        users.append(clean_user)

    db["users"] = users
    os.makedirs(os.path.dirname(USERS_DB_PATH), exist_ok=True)
    with open(USERS_DB_PATH, "w", encoding="utf-8") as f:
        json.dump(db, f, indent=2, ensure_ascii=False)
    return clean_user

def build_pedagogical_plan(goal: str, level: str = "beginner") -> dict:
    """Genera una ruta pedagógica de señas oficiales consultando a Ollama o mediante fallback pedagógico."""
    import unicodedata
    clean_goal = (goal or "").strip()
    norm_goal = ''.join(c for c in unicodedata.normalize('NFD', clean_goal) if unicodedata.category(c) != 'Mn').lower()
    plan_id = f"ai_plan_{int(time.time())}"

    # 1. Intentar consultar Ollama (qwen2.5:3b) con timeout estricto de 2.2s
    try:
        ollama_prompt = f"""Eres Sol, la arquitecta pedagógica experta en Lengua de Señas Colombiana (LSC) de Manitas.
Tu tarea es diseñar una ruta progresiva de aprendizaje para un estudiante.
Objetivo del estudiante: "{clean_goal}"
Nivel: {level}
Catálogo estricto de señas disponibles (usa SOLAMENTE estos IDs en mayúscula exacta):
HOLA, YO, BUENOS, DIAS, TARDES, NOCHES, GUSTAR, NOMBRE, ANNOS, LICOR, A, B, C, D, E, I, L, O, U, V.

Responde ÚNICAMENTE un objeto JSON válido con este formato:
{{"title": "Título corto y motivador", "rationale": "Breve explicación pedagógica de 1 o 2 oraciones", "signs": ["ID1", "ID2", "ID3", "ID4"]}}
"""
        req = urllib.request.Request(
            OLLAMA_URL,
            data=json.dumps({
                "model": "qwen2.5:3b",
                "prompt": ollama_prompt,
                "stream": False,
                "format": "json",
                "options": {"num_predict": 120, "temperature": 0.2}
            }).encode('utf-8'),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=2.2) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            raw_text = data.get("response", "{}")
            raw_json = json.loads(raw_text)
            title = raw_json.get("title", "").strip() or "Ruta Personalizada LSC"
            rationale = raw_json.get("rationale", "").strip() or "Ruta estructurada según tu objetivo de aprendizaje."
            signs_candidate = raw_json.get("signs", [])
            valid_signs = [s for s in signs_candidate if s in VALID_SIGN_IDS]
            seen = set()
            valid_unique = []
            for s in valid_signs:
                if s not in seen:
                    seen.add(s)
                    valid_unique.append(s)

            if len(valid_unique) >= 3:
                return {
                    "id": plan_id,
                    "title": title,
                    "rationale": rationale,
                    "signs": valid_unique,
                    "source": "ollama"
                }
    except Exception:
        pass

    # 2. Clasificador pedagógico determinista inmediato (Garantiza < 5ms de latencia)
    if any(k in norm_goal for k in ["abecedario", "letra", "alfabeto", "dactil", "deletrear"]):
        return {
            "id": plan_id,
            "title": "Ruta IA: Abecedario Dactilológico LSC",
            "rationale": "Sol ha seleccionado la secuencia dactilológica esencial para deletrear nombres propios y términos técnicos en LSC con soltura.",
            "signs": ["A", "B", "C", "D", "E", "I", "L", "O", "U", "V"],
            "source": "curated_fallback"
        }
    elif any(k in norm_goal for k in ["saludo", "presentar", "presentacion", "social", "conocer"]):
        return {
            "id": plan_id,
            "title": "Ruta IA: Saludos y Presentación Personal",
            "rationale": "Sol estructuró las señas fundamentales para iniciar una conversación cordial y presentarte con naturalidad ante personas sordas.",
            "signs": ["HOLA", "YO", "NOMBRE", "BUENOS", "DIAS", "GUSTAR"],
            "source": "curated_fallback"
        }
    elif any(k in norm_goal for k in ["palabra", "vocabulario", "conversacion", "frases"]):
        return {
            "id": plan_id,
            "title": "Ruta IA: Vocabulario Esencial LSC",
            "rationale": "Sol diseñó una inmersión directa en las expresiones y términos cotidianos más frecuentes del corpus LSC70.",
            "signs": ["HOLA", "BUENOS", "DIAS", "TARDES", "NOCHES", "YO", "NOMBRE", "GUSTAR", "ANNOS", "LICOR"],
            "source": "curated_fallback"
        }
    else:  # cero, basico, nada, default
        return {
            "id": plan_id,
            "title": "Ruta IA: Fundamentos LSC Desde Cero",
            "rationale": "Sol diseñó una ruta balanceada para principiantes: inicia con el saludo universal, continúa con vocales dactilológicas y culmina con cortesía y presentación.",
            "signs": ["HOLA", "YO", "A", "E", "O", "BUENOS", "DIAS", "NOMBRE"],
            "source": "curated_fallback"
        }

class RangeFileWrapper:
    """Wrapper para transmitir un rango de bytes específico de un archivo abierto (HTTP 206)."""
    def __init__(self, file_obj, length):
        self.file_obj = file_obj
        self.remaining = length

    def read(self, size=-1):
        if self.remaining <= 0:
            return b""
        if size < 0 or size > self.remaining:
            size = self.remaining
        data = self.file_obj.read(size)
        self.remaining -= len(data)
        return data

    def close(self):
        self.file_obj.close()

class LSCHandler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.webp': 'image/webp',
        '.m4v': 'video/mp4',
        '.json': 'application/json',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.html': 'text/html; charset=utf-8',
        '.wasm': 'application/wasm',
        '.data': 'application/octet-stream',
        '.binarypb': 'application/octet-stream',
        '.tflite': 'application/octet-stream',
        '.woff2': 'font/woff2',
        '.woff': 'font/woff',
        '.ttf': 'font/ttf',
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def send_head(self):
        """Maneja solicitudes GET/HEAD con soporte completo para rangos de bytes (HTTP 206 Partial Content)."""
        path = self.translate_path(self.path)
        f = None
        if os.path.isdir(path):
            parts = urllib.parse.urlsplit(self.path)
            if not parts.path.endswith(('/', '%2f', '%2F')):
                self.send_response(301)
                new_parts = (parts[0], parts[1], parts[2] + '/', parts[3], parts[4])
                new_url = urllib.parse.urlunsplit(new_parts)
                self.send_header("Location", new_url)
                self.send_header("Content-Length", "0")
                self.end_headers()
                return None
            for index in self.index_pages:
                index = os.path.join(path, index)
                if os.path.isfile(index):
                    path = index
                    break
            else:
                return self.list_directory(path)

        ctype = self.guess_type(path)
        if path.endswith("/"):
            self.send_error(404, "File not found")
            return None

        try:
            f = open(path, 'rb')
        except OSError:
            self.send_error(404, "File not found")
            return None

        try:
            fs = os.fstat(f.fileno())
            total_length = fs.st_size

            range_header = self.headers.get('Range')
            if range_header and range_header.startswith('bytes='):
                try:
                    range_spec = range_header.split('=', 1)[1].strip()
                    parts = range_spec.split('-', 1)
                    start_str, end_str = parts[0].strip(), parts[1].strip()

                    if start_str and end_str:
                        start = int(start_str)
                        end = int(end_str)
                    elif start_str:
                        start = int(start_str)
                        end = total_length - 1
                    elif end_str:
                        suffix = int(end_str)
                        start = max(0, total_length - suffix)
                        end = total_length - 1
                    else:
                        start = 0
                        end = total_length - 1

                    if start >= total_length or end >= total_length or start > end:
                        self.send_response(416, "Requested Range Not Satisfiable")
                        self.send_header("Content-Range", f"bytes */{total_length}")
                        self.send_header("Content-Length", "0")
                        self.end_headers()
                        f.close()
                        return None

                    content_length = end - start + 1
                    f.seek(start)
                    self.send_response(206, "Partial Content")
                    self.send_header("Content-Type", ctype)
                    self.send_header("Content-Range", f"bytes {start}-{end}/{total_length}")
                    self.send_header("Content-Length", str(content_length))
                    self.send_header("Last-Modified", self.date_time_string(fs.st_mtime))
                    self.end_headers()
                    return RangeFileWrapper(f, content_length)
                except Exception:
                    pass  # Fallback a respuesta 200 completa

            self.send_response(200)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(total_length))
            self.send_header("Last-Modified", self.date_time_string(fs.st_mtime))
            self.end_headers()
            return f
        except Exception:
            f.close()
            raise

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Range')
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Cache-Control', 'no-cache, must-revalidate')
        super().end_headers()

    def copyfile(self, source, outputfile):
        try:
            super().copyfile(source, outputfile)
        except (ConnectionResetError, ConnectionAbortedError, BrokenPipeError):
            pass

    def handle_one_request(self):
        try:
            super().handle_one_request()
        except (ConnectionResetError, ConnectionAbortedError, BrokenPipeError):
            pass

    def do_GET(self):
        if self.path == '/api/users':
            try:
                db = load_users_db()
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"users": db.get("users", [])}, ensure_ascii=False).encode('utf-8'))
                return
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
                return
        super().do_GET()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        if self.path == '/api/chat':
            content_length = int(self.headers.get('Content-Length', 0))
            raw_data = self.rfile.read(content_length)
            try:
                post_data = raw_data.decode('utf-8')
            except UnicodeDecodeError:
                post_data = raw_data.decode('latin-1', errors='replace')
            try:
                payload = json.loads(post_data)
                user_msg = payload.get("message", "").strip()
                history = payload.get("history", [])

                result = tutor_service.process_message(user_msg, history)

                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps(result, ensure_ascii=False).encode('utf-8'))
                return

            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
                return

        elif self.path.startswith('/api/save_screenshot'):
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8')
            try:
                payload = json.loads(post_data)
                data_url = payload.get("image", "")
                filename = payload.get("filename", "screenshot.png")
                if "," in data_url:
                    data_url = data_url.split(",", 1)[1]
                import base64
                img_bytes = base64.b64decode(data_url)
                save_dir = r"C:\Users\abner\.gemini\antigravity\brain\adc682e4-fa3e-4853-a6ce-7c2d4c68b532"
                save_path = os.path.join(save_dir, filename)
                with open(save_path, "wb") as f:
                    f.write(img_bytes)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "saved", "path": save_path}).encode('utf-8'))
                return
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
                return

        elif self.path == '/api/plan':
            content_length = int(self.headers.get('Content-Length', 0))
            raw_data = self.rfile.read(content_length)
            try:
                post_data = raw_data.decode('utf-8', errors='replace')
                payload = json.loads(post_data) if post_data.strip() else {}
                goal = str(payload.get("goal", "")).strip()
                level = str(payload.get("level", "beginner")).strip()
                plan = build_pedagogical_plan(goal, level)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps(plan, ensure_ascii=False).encode('utf-8'))
                return
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
                return

        elif self.path == '/api/users':
            content_length = int(self.headers.get('Content-Length', 0))
            raw_data = self.rfile.read(content_length)
            try:
                post_data = raw_data.decode('utf-8', errors='replace')
                payload = json.loads(post_data) if post_data.strip() else {}
                saved_user = save_user_to_db(payload)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "ok", "user": saved_user}, ensure_ascii=False).encode('utf-8'))
                return
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
                return

        self.send_error(404, "Endpoint no encontrado")

def free_port(port):
    """Libera el puerto si quedó retenido por un proceso previo huérfano."""
    try:
        import subprocess
        # Buscar PIDs escuchando en el puerto
        cmd = f'powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort {port} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess"'
        out = subprocess.check_output(cmd, shell=True, text=True).strip()
        if out:
            for line in out.splitlines():
                pid = int(line.strip())
                if pid > 0 and pid != os.getpid():
                    print(f"[AUTO-REPAIR] Terminando proceso huérfano PID {pid} en puerto {port}...")
                    subprocess.call(f'taskkill /F /PID {pid}', shell=True)
            import time
            time.sleep(1)
    except Exception as e:
        pass

class RobustThreadingServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True

    def handle_error(self, request, client_address):
        import sys
        exc_type, _, _ = sys.exc_info()
        if exc_type in (ConnectionResetError, ConnectionAbortedError, BrokenPipeError):
            return
        super().handle_error(request, client_address)

def ensure_ollama_service():
    """Verifica si Ollama está respondiendo en 127.0.0.1:11434; si no, intenta arrancarlo en segundo plano."""
    import shutil, subprocess
    try:
        req = urllib.request.Request("http://127.0.0.1:11434/api/tags")
        with urllib.request.urlopen(req, timeout=1.2) as resp:
            if resp.status == 200:
                print("[OK] Ollama activo en http://127.0.0.1:11434 (GPU listo)")
                return True
    except Exception:
        pass

    ollama_path = shutil.which("ollama")
    if not ollama_path:
        local_app = os.path.expanduser(r"~\AppData\Local\Programs\Ollama\ollama.exe")
        if os.path.exists(local_app):
            ollama_path = local_app

    if ollama_path:
        try:
            print("[INFO] Ollama no detectado. Levantando 'ollama serve' en segundo plano...")
            flags = 0
            if sys.platform == "win32":
                flags = subprocess.CREATE_NEW_PROCESS_GROUP | subprocess.DETACHED_PROCESS
            subprocess.Popen([ollama_path, "serve"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, creationflags=flags)
            time.sleep(2.0)
            print("[OK] Proceso 'ollama serve' lanzado exitosamente.")
            return True
        except Exception as e:
            print(f"[AVISO] No se pudo lanzar Ollama automáticamente: {e}")
    else:
        print("[AVISO] Comando 'ollama' no encontrado en el sistema.")
    return False

if __name__ == '__main__':
    free_port(PORT)
    ensure_ollama_service()
    RobustThreadingServer.allow_reuse_address = True
    print(f"Iniciando Servidor LSC Learn con Proxy Ollama en http://localhost:{PORT}")
    try:
        with RobustThreadingServer(("", PORT), LSCHandler) as httpd:
            httpd.serve_forever()
    except OSError as e:
        if e.winerror == 10048 if hasattr(e, 'winerror') else False:
            print(f"[AVISO] Puerto {PORT} en espera de reciclado, forzando liberación...")
            free_port(PORT)
            with RobustThreadingServer(("", PORT), LSCHandler) as httpd:
                httpd.serve_forever()
        else:
            raise e
