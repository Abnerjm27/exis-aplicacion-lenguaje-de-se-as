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
OLLAMA_URL = "http://localhost:11434/api/generate"

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

FALLBACK_REPLIES = {
    "HOLA": "¡Excelente elección! Para la seña de 'HOLA', coloca tu mano derecha en la sien con los dedos juntos y proyéctala suavemente hacia adelante y afuera en diagonal saludando al frente. [SELECCIONAR: HOLA]",
    "YO": "¡Muy bien! Para la seña de 'YO', forma un puño con tu mano derecha y deja únicamente el dedo índice extendido apuntando hacia tu pecho. [SELECCIONAR: YO]",
    "BUENOS": "¡Perfecto! Para 'BUENOS / AS', coloca tu mano izquierda abierta como base en el pecho (palma arriba) y baja tu mano derecha para chocar apoyando la palma sobre la izquierda en el torso. [SELECCIONAR: BUENOS]",
    "DIAS": "Para la seña de 'DÍAS', abre ambos brazos lateralmente a la altura del pecho con las palmas al frente simulando el amanecer. [SELECCIONAR: DIAS]",
    "TARDES": "Para la seña de 'TARDES', cruza tus antebrazos horizontalmente frente a tu pecho con las palmas orientadas hacia tu cuerpo. [SELECCIONAR: TARDES]",
    "NOCHES": "Para 'NOCHES', cruza ambos brazos sobre tu pecho con las manos reposando sobre los antebrazos opuestos. [SELECCIONAR: NOCHES]",
    "GUSTAR": "Para la seña de 'GUSTAR', inclina levemente la cabeza hacia arriba, apoya tu dedo índice en la base de la garganta y deslízalo suavemente hacia arriba. [SELECCIONAR: GUSTAR]",
    "NOMBRE": "Para 'NOMBRE', extiende los dedos índice y medio de ambas manos y apoya los de la mano derecha sobre los de la izquierda frente a tu torso. [SELECCIONAR: NOMBRE]",
    "ANNOS": "Para la seña de 'AÑOS', ubica ambas manos frente a tu torso y realiza un suave frotamiento o movimiento circular con tu mano derecha sobre la izquierda indicando el transcurso del tiempo. [SELECCIONAR: ANNOS]",
    "LICOR": "Para la seña de 'LICOR', configura tu mano derecha en copa (o letra Y con pulgar y meñique) y elévala hacia la barbilla o boca inclinándola con delicadeza. [SELECCIONAR: LICOR]",
    "A": "Vamos a practicar la letra 'A': cierra los 4 dedos en un puño firme y mantén el pulgar erguido a un lado del índice. [SELECCIONAR: A]",
    "B": "Para la letra 'B', extiende los cuatro dedos juntos rectos hacia arriba y dobla el pulgar sobre la palma. [SELECCIONAR: B]",
    "C": "Para la letra 'C', arquea los 4 dedos y el pulgar enfrentados formando la curvatura semicircular de la letra C. [SELECCIONAR: C]",
    "D": "Para la letra 'D', apunta tu dedo índice recto hacia arriba y junta la punta de tu pulgar con tu dedo medio formando un aro en la base. [SELECCIONAR: D]",
    "E": "Para la letra 'E', curva los cuatro dedos juntos hacia abajo y apoya sus yemas sobre el pulgar doblado en la palma. [SELECCIONAR: E]",
    "I": "Para la letra 'I', cierra tu mano en puño y extiende únicamente el dedo meñique hacia arriba en vertical. [SELECCIONAR: I]",
    "L": "Para la letra 'L', extiende el dedo índice hacia arriba y el pulgar hacia un lado formando un ángulo recto de 90 grados. [SELECCIONAR: L]",
    "O": "Para la letra 'O', curva los dedos de tu mano tocando suavemente la punta del pulgar para formar un círculo visible O. [SELECCIONAR: O]",
    "U": "Para la letra 'U', levanta el dedo índice y el dedo medio juntos y pegados apuntando hacia arriba (sin separación en V). [SELECCIONAR: U]",
    "V": "Para la letra 'V', levanta el dedo índice y el dedo medio separados en forma de victoria. [SELECCIONAR: V]",
}

def detect_sign(msg):
    import unicodedata, re
    norm = ''.join(c for c in unicodedata.normalize('NFD', msg) if unicodedata.category(c) != 'Mn').lower()
    tokens = re.findall(r'\b\w+\b', norm)

    words_map = {
        'hola': 'HOLA', 'saludo': 'HOLA', 'salud': 'HOLA',
        'yo': 'YO', 'mi': 'YO',
        'buenos': 'BUENOS', 'buenas': 'BUENOS',
        'dias': 'DIAS', 'dia': 'DIAS',
        'tardes': 'TARDES', 'tarde': 'TARDES',
        'noches': 'NOCHES', 'noche': 'NOCHES',
        'gustar': 'GUSTAR', 'gusta': 'GUSTAR', 'gusto': 'GUSTAR',
        'nombre': 'NOMBRE',
        'anos': 'ANNOS', 'ano': 'ANNOS', 'annos': 'ANNOS', 'edad': 'ANNOS',
        'licor': 'LICOR', 'trago': 'LICOR', 'beber': 'LICOR', 'bebida': 'LICOR'
    }

    # 1. Check words first
    for token in tokens:
        if token in words_map:
            return words_map[token]

    # 2. Check letters with 'letra X'
    letters_map = {'a': 'A', 'b': 'B', 'c': 'C', 'd': 'D', 'e': 'E', 'i': 'I', 'l': 'L', 'o': 'O', 'u': 'U', 'v': 'V'}
    for l in letters_map:
        if f'letra {l}' in norm or f'letra_{l}' in norm:
            return letters_map[l]

    # 3. Check isolated single letter tokens
    for token in tokens:
        if token in ['b', 'c', 'd', 'l', 'v']:
            return letters_map[token]
        if token in ['a', 'e', 'i', 'o', 'u'] and (len(tokens) == 1 or 'letra' in tokens):
            return letters_map[token]

    return None

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
        ollama_prompt = f"""Eres Sol, la arquitecta pedagógica experta en Lengua de Señas Colombiana (LSC) del Proyecto EXIS.
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
                user_lower = user_msg.lower()

                # Detect which sign is mentioned
                detected_sign = detect_sign(user_msg)

                reply_text = ""

                # Instant response for detected signs or menu queries
                if detected_sign and detected_sign in FALLBACK_REPLIES:
                    reply_text = FALLBACK_REPLIES[detected_sign]
                elif any(w in user_lower for w in ["palabra", "seña", "opcion", "catalogo", "que hay", "que tienes", "cuales", "señas", "menu"]):
                    reply_text = "En el Proyecto EXIS puedes aprender: Palabras LSC (HOLA, YO, BUENOS, DÍAS, TARDES, NOCHES, GUSTAR, NOMBRE) y Alfabeto Dactilológico (A, B, C, I, L, O, V). ¿Cuál te gustaría practicar ahora?"
                else:
                    # Try Ollama with low latency timeout (2.0s)
                    try:
                        prompt = f"""Eres el tutor de Lengua de Señas Colombiana del Proyecto EXIS.
Señas disponibles: HOLA, YO, BUENOS, DÍAS, TARDES, NOCHES, GUSTAR, NOMBRE, y letras dactilológicas A, B, C, I, L, O, V.
Usuario dice: "{user_msg}"
Instrucciones: Responde amablemente en español en máximo 2 oraciones pedagógicas. Si el usuario pide aprender una seña, agrega al final exactamente [SELECCIONAR: <ID>] (ej: [SELECCIONAR: DIAS] o [SELECCIONAR: C]).
Respuesta:"""

                        req = urllib.request.Request(
                            OLLAMA_URL,
                            data=json.dumps({
                                "model": "qwen2.5:3b",
                                "prompt": prompt,
                                "stream": False,
                                "options": {"num_predict": 45, "temperature": 0.3}
                            }).encode('utf-8'),
                            headers={"Content-Type": "application/json"}
                        )
                        with urllib.request.urlopen(req, timeout=2.0) as resp:
                            res_data = json.loads(resp.read().decode('utf-8'))
                            reply_text = res_data.get("response", "").strip()
                    except Exception:
                        reply_text = "¡Hola! Soy tu tutor interactivo de LSC. Puedes decirme: 'Quiero aprender Días', 'Enséñame Noches' o 'Practicar la letra C'."

                if detected_sign and f"[SELECCIONAR: {detected_sign}]" not in reply_text:
                    reply_text += f" [SELECCIONAR: {detected_sign}]"

                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "reply": reply_text,
                    "detected_sign": detected_sign
                }, ensure_ascii=False).encode('utf-8'))
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

if __name__ == '__main__':
    free_port(PORT)
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
