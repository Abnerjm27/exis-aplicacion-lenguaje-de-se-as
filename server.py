import http.server
import json
import logging
import os
import re
import shutil
import socketserver
import subprocess
import sys
import threading
import time
import unicodedata
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger("server")

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

VALID_SIGN_IDS = [
    "HOLA", "YO", "BUENOS", "DIAS", "TARDES", "NOCHES",
    "GUSTAR", "NOMBRE", "ANNOS", "LICOR",
    "A", "B", "C", "D", "E", "I", "L", "O", "U", "V"
]

USERS_DB_PATH = os.path.join(DIRECTORY, "data", "users_db.json")

@dataclass(slots=True)
class LSCParsedIntent:
    """Contenedor de intención pedagógica extraída por el motor NLU (inmutable)."""
    intent: str
    target_sign: Optional[str] = None
    is_clarification: bool = False
    greeting_preamble: Optional[str] = None
    raw_message: str = ""

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
        if not text:
            return ""
        norm = ''.join(c for c in unicodedata.normalize('NFD', str(text).strip()) if unicodedata.category(c) != 'Mn').lower()
        norm = re.sub(r'[^\w\s]', ' ', norm)
        return re.sub(r'\s+', ' ', norm).strip()

    @classmethod
    def parse(cls, message: str) -> LSCParsedIntent:
        raw = (message or "").strip()
        norm = cls.normalize(raw)
        if not norm:
            return LSCParsedIntent('UNKNOWN', raw_message=raw)

        # 1. Gratitud
        for kw in cls.GRATITUDE_KEYWORDS:
            if kw in norm and len(norm.split()) <= 4:
                return LSCParsedIntent('GRATITUDE', raw_message=raw)

        # 2. Identidad del Tutor
        for kw in cls.IDENTITY_KEYWORDS:
            if kw in norm:
                return LSCParsedIntent('IDENTITY', raw_message=raw)

        # 3. Catálogo oficial
        for kw in cls.CATALOG_KEYWORDS:
            if kw in norm:
                return LSCParsedIntent('CATALOG', raw_message=raw)

        # 4. Extracción de preámbulo de saludo
        detected_preamble = None
        cleaned_text = norm
        for g in cls.GREETING_STARTERS:
            if norm == g:
                return LSCParsedIntent('GREETING', greeting_preamble=g, raw_message=raw)
            if norm.startswith(g + " "):
                detected_preamble = g
                cleaned_text = norm[len(g):].strip()
                break

        if detected_preamble and not cleaned_text:
            return LSCParsedIntent('GREETING', greeting_preamble=detected_preamble, raw_message=raw)

        # 5. Principiante / Desde cero
        if re.search(r'\b(?:no se nada|soy nuevo|desde cero|principiante|por donde empiezo|que hago|como inicio|que me recomiendas|recomendacion)\b', cleaned_text):
            return LSCParsedIntent('BEGINNER_RECOMMENDATION', target_sign='HOLA', greeting_preamble=detected_preamble, raw_message=raw)

        # 6. Negaciones, Aclaraciones y Contrastes
        is_negation = bool(re.search(r'\b(?:no quiero|no deseo|no me gusta|no esa|no aprender|no practicar|no voy a|tampoco esa)\b', cleaned_text) or cleaned_text.startswith('no ') or cleaned_text == 'no')
        contrast_match = re.search(r'\b(?:prefiero|sino|mejor|cambia a|dame|ponme)\s+(?:la\s+|el\s+)?(\w+)', cleaned_text)
        if is_negation:
            if contrast_match:
                cand = contrast_match.group(1)
                if cand in cls.LETTERS:
                    return LSCParsedIntent('LEARN_SIGN', target_sign=cls.LETTERS[cand], is_clarification=True, greeting_preamble=detected_preamble, raw_message=raw)
                if cand in cls.VOCABULARY_WORDS:
                    return LSCParsedIntent('LEARN_SIGN', target_sign=cls.VOCABULARY_WORDS[cand], is_clarification=True, greeting_preamble=detected_preamble, raw_message=raw)
            return LSCParsedIntent('REJECT_SIGN', is_clarification=True, greeting_preamble=detected_preamble, raw_message=raw)

        # 7. Intención de aprendizaje abierta o incompleta
        if cleaned_text in ('quiero aprender a', 'quiero aprender', 'deseo aprender', 'ensename a', 'aprender', 'aprender a', 'quiero practicar', 'ensenar'):
            return LSCParsedIntent('OPEN_LEARNING_INTRO', greeting_preamble=detected_preamble, raw_message=raw)

        # 8. Categorías Temáticas
        if re.search(r'\b(?:saludos|saludo|saludar|como saludar|decir hola)\b', cleaned_text):
            return LSCParsedIntent('THEME_GREETINGS', target_sign='HOLA', greeting_preamble=detected_preamble, raw_message=raw)
        if re.search(r'\b(?:presentarme|presentacion|mi nombre|decir mi nombre|como me llamo)\b', cleaned_text):
            return LSCParsedIntent('THEME_PRESENTATION', target_sign='YO', greeting_preamble=detected_preamble, raw_message=raw)
        if re.search(r'\b(?:abecedario|alfabeto|vocales|vocal|dactilologico)\b', cleaned_text):
            return LSCParsedIntent('THEME_ALPHABET', target_sign='A', greeting_preamble=detected_preamble, raw_message=raw)
        if re.search(r'\b(?:camara|webcam|mediapipe|radar|como funciona|vision artificial|puntos de la mano)\b', cleaned_text):
            return LSCParsedIntent('TECH_EXPLANATION', greeting_preamble=detected_preamble, raw_message=raw)

        # 9. Solicitud de Letra específica
        let_match = re.search(r'\b(?:letra|vocal|la)\s+([a-z])\b', cleaned_text)
        if let_match and let_match.group(1) in cls.LETTERS:
            return LSCParsedIntent('LEARN_SIGN', target_sign=cls.LETTERS[let_match.group(1)], greeting_preamble=detected_preamble, raw_message=raw)

        for cons in ['b', 'c', 'd', 'l', 'v']:
            if re.search(rf'\b{cons}\b', cleaned_text):
                return LSCParsedIntent('LEARN_SIGN', target_sign=cls.LETTERS[cons], greeting_preamble=detected_preamble, raw_message=raw)

        # 10. Vocabulario de Palabras Oficiales
        for word, sign_id in cls.VOCABULARY_WORDS.items():
            if re.search(rf'\b{word}\b', cleaned_text):
                if word == 'hola' and not any(k in cleaned_text for k in ["sena", "palabra", "aprender", "como se", "hacer", "decir"]):
                    continue
                if word in ('yo', 'mi') and any(k in cleaned_text for k in ["quiero", "puedo", "gustaria", "voy", "tengo"]):
                    continue
                return LSCParsedIntent('LEARN_SIGN', target_sign=sign_id, greeting_preamble=detected_preamble, raw_message=raw)

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
                return f"¡Entendido perfectamente! Cambiemos el foco a la seña de '{sign}': {clean_desc} {tag}".strip()
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

        if parsed.intent == 'REJECT_SIGN':
            return (
                "¡Entendido perfectamente! Disculpa la confusión, no practicaremos esa seña. 😊 "
                "¿Qué otra palabra o letra te gustaría explorar? Puedes elegir entre: HOLA, BUENOS DÍAS, "
                "TARDES, NOCHES, GUSTAR, NOMBRE, AÑOS, LICOR o las letras del abecedario (A, B, C, D, E, I, L, O, U, V)."
            )

        if parsed.intent == 'OPEN_LEARNING_INTRO':
            return (
                "¡Qué gran iniciativa! 🦊 En Manitas te enseño Lengua de Señas Colombiana paso a paso con videos oficiales "
                "y visión artificial por tu cámara. ¿Por dónde te gustaría arrancar? Te recomiendo empezar con saludos cotidianos "
                "como 'HOLA' o con las vocales del abecedario como la 'A'."
            )

        if parsed.intent == 'BEGINNER_RECOMMENDATION':
            return (
                f"¡Bienvenido a Manitas! 🦊 No te preocupes por empezar desde cero, ¡es la mejor forma de aprender con buena técnica! "
                f"Te recomiendo iniciar con el saludo universal 'HOLA'. ¿Listo para ver la demostración y practicar frente a la cámara? {tag}".strip()
            )

        if parsed.intent == 'THEME_GREETINGS':
            return (
                f"¡Excelente elección! Para saludar en LSC tenemos señas fundamentales: HOLA, BUENOS DÍAS, TARDES y NOCHES. "
                f"Comencemos practicando 'HOLA'. {clean_desc} {tag}".strip()
            )

        if parsed.intent == 'THEME_PRESENTATION':
            return (
                f"¡Muy bien! Para presentarte en LSC necesitas dominar tres señas clave: 'YO', 'NOMBRE' y 'AÑOS' (junto al abecedario para tu nombre). "
                f"Comencemos con 'YO'. {clean_desc} {tag}".strip()
            )

        if parsed.intent == 'THEME_ALPHABET':
            return (
                f"¡Genial! En Manitas puedes practicar las vocales (A, E, I, O, U) y consonantes (B, C, D, L, V). "
                f"Comencemos con la primera vocal: 'A'. {clean_desc} {tag}".strip()
            )

        if parsed.intent == 'TECH_EXPLANATION':
            return (
                "¡Buena pregunta! 🖐️ Manitas utiliza visión artificial local con Google MediaPipe Hands. "
                "Tu cámara analiza 21 puntos anatómicos de tu mano 30 veces por segundo y compara su postura y ángulos "
                "contra el dataset oficial LSC70. ¡Al mantener más del 85% de similitud durante 1 segundo, apruebas la seña!"
            )

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

    def process_message(self, user_msg: str, history: Optional[list] = None) -> dict:
        clean_msg = str(user_msg or "").strip()[:300]
        parsed = LSCNaturalLanguageParser.parse(clean_msg)
        target_sign = parsed.target_sign

        reply_text = None
        if parsed.intent in ('UNKNOWN', 'OPEN_CONVERSATION'):
            reply_text = self._query_ollama_open(clean_msg)

        if not reply_text:
            reply_text = LSCNaturalLanguageParser.build_natural_reply(parsed, LSC_SIGN_DESCRIPTIONS)

        if target_sign and f"[SELECCIONAR: {target_sign}]" not in reply_text:
            reply_text = f"{reply_text.strip()} [SELECCIONAR: {target_sign}]"

        return {
            "reply": reply_text,
            "detected_sign": target_sign,
            "intent": parsed.intent,
            "is_clarification": parsed.is_clarification
        }

    def _query_ollama_open(self, user_msg: str) -> Optional[str]:
        try:
            safe_msg = user_msg[:250]
            prompt = (
                f"Eres Zorrito, el tutor interactivo y empático de Lengua de Señas Colombiana (LSC) en Manitas.\n"
                f"Usuario pregunta: \"{safe_msg}\"\n"
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
        except Exception as e:
            logger.debug(f"Ollama fallback activo para chat: {e}")
        return None

tutor_service = LSCTutorService()

def detect_sign(msg: str) -> Optional[str]:
    """Función de compatibilidad delegada al motor NLU."""
    parsed = LSCNaturalLanguageParser.parse(msg)
    return parsed.target_sign

class UserRepository:
    """Repositorio POO para la persistencia segura de usuarios en JSON con exclusión mutua."""

    def __init__(self, db_path: str = USERS_DB_PATH):
        self.db_path = db_path
        self._lock = threading.Lock()

    def get_all_users(self) -> dict:
        """Retorna todos los usuarios de forma thread-safe."""
        with self._lock:
            return self._read_db_unlocked()

    def save_user(self, user_data: dict) -> dict:
        """Inserta o actualiza un usuario de forma atómica y thread-safe."""
        if not isinstance(user_data, dict) or not user_data.get("username"):
            raise ValueError("Datos de usuario inválidos: requiere campo 'username'")

        username = str(user_data.get("username")).strip().lower()
        clean_user = {
            "username": username,
            "displayName": str(user_data.get("displayName") or username).strip()[:100],
            "level": str(user_data.get("level", "Principiante")).strip()[:50],
            "xp": int(user_data.get("xp", 0)),
            "streak": int(user_data.get("streak", 1)),
            "masteredSigns": [str(s) for s in user_data.get("masteredSigns", []) if s in VALID_SIGN_IDS],
            "customPlans": list(user_data.get("customPlans", [])),
            "examHistory": list(user_data.get("examHistory", [])),
            "lastUpdated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }

        with self._lock:
            db = self._read_db_unlocked()
            users = db.get("users", [])
            found_idx = -1
            for idx, u in enumerate(users):
                if str(u.get("username", "")).strip().lower() == username:
                    found_idx = idx
                    break

            if found_idx >= 0:
                users[found_idx] = clean_user
            else:
                users.append(clean_user)

            db["users"] = users
            self._write_db_unlocked(db)

        return clean_user

    def _read_db_unlocked(self) -> dict:
        if not os.path.exists(self.db_path):
            os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
            default_db = {"users": []}
            try:
                with open(self.db_path, "w", encoding="utf-8") as f:
                    json.dump(default_db, f, indent=2, ensure_ascii=False)
            except OSError as e:
                logger.warning(f"Error creando {self.db_path}: {e}")
            return default_db
        try:
            with open(self.db_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError) as e:
            logger.warning(f"Error leyendo {self.db_path}: {e}")
            return {"users": []}

    def _write_db_unlocked(self, db: dict) -> None:
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        tmp_path = f"{self.db_path}.tmp"
        with open(tmp_path, "w", encoding="utf-8") as f:
            json.dump(db, f, indent=2, ensure_ascii=False)
        os.replace(tmp_path, self.db_path)

user_repository = UserRepository()

def load_users_db() -> dict:
    """Wrapper de compatibilidad para consultar usuarios."""
    return user_repository.get_all_users()

def save_user_to_db(user_data: dict) -> dict:
    """Wrapper de compatibilidad para persistir un usuario."""
    return user_repository.save_user(user_data)

class PedagogicalPlanner:
    """Planificador pedagógico POO que diseña rutas de aprendizaje con IA o fallback."""

    def __init__(self, ollama_url: str = OLLAMA_URL, model: str = "qwen2.5:3b", timeout: float = 2.2):
        self.ollama_url = ollama_url
        self.model = model
        self.timeout = timeout

    def build_plan(self, goal: str, level: str = "beginner") -> dict:
        clean_goal = str(goal or "").strip()[:300]
        norm_goal = ''.join(c for c in unicodedata.normalize('NFD', clean_goal) if unicodedata.category(c) != 'Mn').lower()
        plan_id = f"ai_plan_{int(time.time())}"

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
                self.ollama_url,
                data=json.dumps({
                    "model": self.model,
                    "prompt": ollama_prompt,
                    "stream": False,
                    "format": "json",
                    "options": {"num_predict": 120, "temperature": 0.2}
                }).encode('utf-8'),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                raw_text = data.get("response", "{}")
                raw_json = json.loads(raw_text)
                title = str(raw_json.get("title", "")).strip() or "Ruta Personalizada LSC"
                rationale = str(raw_json.get("rationale", "")).strip() or "Ruta estructurada según tu objetivo de aprendizaje."
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
        except Exception as e:
            logger.debug(f"Ollama plan fallback activo: {e}")

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
        else:
            return {
                "id": plan_id,
                "title": "Ruta IA: Fundamentos LSC Desde Cero",
                "rationale": "Sol diseñó una ruta balanceada para principiantes: inicia con el saludo universal, continúa con vocales dactilológicas y culmina con cortesía y presentación.",
                "signs": ["HOLA", "YO", "A", "E", "O", "BUENOS", "DIAS", "NOMBRE"],
                "source": "curated_fallback"
            }

pedagogical_planner = PedagogicalPlanner()

def build_pedagogical_plan(goal: str, level: str = "beginner") -> dict:
    """Wrapper de compatibilidad para generar rutas pedagógicas."""
    return pedagogical_planner.build_plan(goal, level)

class RangeFileWrapper:
    """Wrapper para transmitir un rango de bytes específico de un archivo abierto (HTTP 206)."""
    def __init__(self, file_obj, length: int):
        self.file_obj = file_obj
        self.remaining = length

    def read(self, size: int = -1) -> bytes:
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
    MAX_PAYLOAD_SIZE = 1024 * 1024  # 1 MB

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
        clean_req_path = self.path.split('?', 1)[0].split('#', 1)[0]
        if clean_req_path.endswith(('users_db.json', '.env', '.git')) or '/data/users_db.json' in clean_req_path:
            self.send_error(403, "Acceso restringido a datos protegidos del sistema")
            return None

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
                except Exception as ex:
                    logger.debug(f"Range fallback: {ex}")

            self.send_response(200)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(total_length))
            self.send_header("Last-Modified", self.date_time_string(fs.st_mtime))
            self.end_headers()
            return f
        except Exception:
            f.close()
            raise

    def list_directory(self, path: str):
        """Deshabilita el listado público de directorios."""
        self.send_error(403, "Listado de directorio deshabilitado")
        return None

    def end_headers(self):
        origin = self.headers.get("Origin", "")
        if origin and any(origin.startswith(p) for p in ("http://localhost", "http://127.0.0.1")):
            self.send_header('Access-Control-Allow-Origin', origin)
        else:
            self.send_header('Access-Control-Allow-Origin', 'http://localhost:8000')

        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Range')
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Cache-Control', 'no-cache, must-revalidate')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'SAMEORIGIN')
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

    def _send_json_response(self, status_code: int, data: dict):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

    def _send_json_error(self, status_code: int, message: str):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(json.dumps({"error": message}, ensure_ascii=False).encode('utf-8'))

    def _read_json_payload(self) -> Tuple[Optional[dict], Optional[str]]:
        try:
            content_length = int(self.headers.get('Content-Length', 0))
        except (ValueError, TypeError):
            return None, "Encabezado Content-Length inválido"

        if content_length > self.MAX_PAYLOAD_SIZE:
            return None, "Payload demasiado grande (máximo permitido 1MB)"

        if content_length <= 0:
            return {}, None

        raw_data = self.rfile.read(content_length)
        try:
            post_data = raw_data.decode('utf-8')
        except UnicodeDecodeError:
            post_data = raw_data.decode('latin-1', errors='replace')

        try:
            payload = json.loads(post_data) if post_data.strip() else {}
            if not isinstance(payload, dict):
                return None, "El cuerpo de la petición debe ser un objeto JSON"
            return payload, None
        except json.JSONDecodeError:
            return None, "JSON malformado"

    def do_GET(self):
        if self.path == '/api/users':
            try:
                users_data = user_repository.get_all_users()
                self._send_json_response(200, users_data)
                return
            except Exception as e:
                logger.error(f"Error procesando GET /api/users: {e}")
                self._send_json_error(500, "Error interno al consultar usuarios")
                return
        super().do_GET()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        if self.path == '/api/chat':
            payload, err = self._read_json_payload()
            if err:
                self._send_json_error(400 if "grande" not in err else 413, err)
                return
            try:
                user_msg = str(payload.get("message", "")).strip()[:300]
                history = payload.get("history", [])
                if not isinstance(history, list):
                    history = []

                result = tutor_service.process_message(user_msg, history)
                self._send_json_response(200, result)
            except Exception as e:
                logger.error(f"Error procesando /api/chat: {e}")
                self._send_json_error(500, "Error procesando mensaje en el tutor")
            return

        elif self.path == '/api/plan':
            payload, err = self._read_json_payload()
            if err:
                self._send_json_error(400 if "grande" not in err else 413, err)
                return
            try:
                goal = str(payload.get("goal", "")).strip()[:300]
                level = str(payload.get("level", "beginner")).strip()[:50]
                plan = pedagogical_planner.build_plan(goal, level)
                self._send_json_response(200, plan)
            except Exception as e:
                logger.error(f"Error procesando /api/plan: {e}")
                self._send_json_error(500, "Error generando ruta pedagógica")
            return

        elif self.path == '/api/users':
            payload, err = self._read_json_payload()
            if err:
                self._send_json_error(400 if "grande" not in err else 413, err)
                return
            try:
                saved_user = user_repository.save_user(payload)
                self._send_json_response(200, {"status": "ok", "user": saved_user})
            except ValueError as ve:
                self._send_json_error(400, str(ve))
            except Exception as e:
                logger.error(f"Error procesando POST /api/users: {e}")
                self._send_json_error(500, "Error al persistir usuario")
            return

        self.send_error(404, "Endpoint no encontrado")

class ProcessLifecycleManager:
    """Administrador POO del ciclo de vida de procesos del backend (puertos y Ollama)."""

    @classmethod
    def free_port(cls, port: int) -> None:
        """Libera el puerto si quedó retenido por un proceso huérfano (sin shell=True)."""
        if sys.platform != "win32":
            return
        try:
            import socket
            # Comprobar primero rápidamente si el puerto está realmente ocupado
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(0.3)
                if s.connect_ex(("127.0.0.1", port)) != 0:
                    return  # Puerto libre, no requiere llamadas lentas a procesos externos

            cmd = [
                "powershell", "-NoProfile", "-Command",
                f"Get-NetTCPConnection -LocalPort {port} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess"
            ]
            out = subprocess.check_output(cmd, text=True, stderr=subprocess.DEVNULL).strip()
            if out:
                current_pid = os.getpid()
                for line in out.splitlines():
                    val = line.strip()
                    if val.isdigit():
                        pid = int(val)
                        if pid > 0 and pid != current_pid:
                            logger.info(f"[AUTO-REPAIR] Terminando proceso huérfano PID {pid} en puerto {port}...")
                            subprocess.call(["taskkill", "/F", "/PID", str(pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                time.sleep(0.5)
        except Exception as e:
            logger.debug(f"Aviso en liberación de puerto {port}: {e}")

    @classmethod
    def ensure_ollama_service(cls) -> bool:
        """Verifica si Ollama está respondiendo en 127.0.0.1:11434 sin lanzar terminales duplicadas."""
        try:
            req = urllib.request.Request("http://127.0.0.1:11434/api/tags")
            with urllib.request.urlopen(req, timeout=1.5) as resp:
                if resp.status == 200:
                    logger.info("[OK] Ollama activo en http://127.0.0.1:11434 (GPU listo)")
                    return True
        except Exception:
            pass

        # Si no respondió inmediatamente, verificar si el proceso ya está corriendo en segundo plano para evitar terminales duplicadas
        try:
            out = subprocess.check_output(['tasklist'], text=True, stderr=subprocess.DEVNULL)
            if 'ollama.exe' in out.lower():
                logger.info("[INFO] Proceso de Ollama detectado en memoria. Inicializando modelos...")
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
                logger.info("[INFO] Ollama no detectado. Levantando 'ollama serve' en segundo plano...")
                flags = 0
                if sys.platform == "win32":
                    flags = subprocess.CREATE_NEW_PROCESS_GROUP | subprocess.DETACHED_PROCESS
                subprocess.Popen([ollama_path, "serve"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, creationflags=flags)
                time.sleep(2.0)
                logger.info("[OK] Proceso 'ollama serve' lanzado exitosamente.")
                return True
            except Exception as e:
                logger.warning(f"[AVISO] No se pudo lanzar Ollama automáticamente: {e}")
        else:
            logger.info("[INFO] Ollama no detectado en puerto 11434. El tutor funcionará con el motor NLU local integrado (100% offline).")
        return False

def free_port(port: int):
    """Función de compatibilidad para liberar puertos."""
    ProcessLifecycleManager.free_port(port)

def ensure_ollama_service() -> bool:
    """Función de compatibilidad para asegurar Ollama."""
    return ProcessLifecycleManager.ensure_ollama_service()

class RobustThreadingServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True

    def handle_error(self, request, client_address):
        exc_type, _, _ = sys.exc_info()
        if exc_type in (ConnectionResetError, ConnectionAbortedError, BrokenPipeError):
            return
        super().handle_error(request, client_address)

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    HOST = "127.0.0.1"
    ProcessLifecycleManager.free_port(PORT)
    ProcessLifecycleManager.ensure_ollama_service()
    RobustThreadingServer.allow_reuse_address = True
    print(f"Iniciando Servidor LSC Learn con Proxy Ollama en http://{HOST}:{PORT}")
    try:
        with RobustThreadingServer((HOST, PORT), LSCHandler) as httpd:
            httpd.serve_forever()
    except OSError as e:
        if hasattr(e, 'winerror') and e.winerror == 10048:
            print(f"[AVISO] Puerto {PORT} en espera de reciclado, forzando liberación...")
            ProcessLifecycleManager.free_port(PORT)
            with RobustThreadingServer((HOST, PORT), LSCHandler) as httpd:
                httpd.serve_forever()
        else:
            raise e
