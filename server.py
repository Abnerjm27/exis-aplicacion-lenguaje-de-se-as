import http.server
import json
import logging
import os
import re
import socketserver
import subprocess
import sys
import threading
import time
import unicodedata
import urllib.parse
from typing import Any, Dict, List, Optional, Tuple

from db import SRSService, create_user_repository, handle_srs_get, handle_srs_post

logger = logging.getLogger("server")

PORT = 8000
DIRECTORY = os.path.join(os.path.dirname(os.path.abspath(__file__)), "app")

VALID_SIGN_IDS = [
    "HOLA", "YO", "BUENOS", "DIAS", "TARDES", "NOCHES",
    "GUSTAR", "NOMBRE", "ANNOS", "LICOR",
    "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L",
    "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "Z"
]

USERS_DB_PATH = os.path.join(DIRECTORY, "data", "users_db.json")

class RateLimiter:
    """Limitador de tasa en memoria por IP (ventana deslizante, POO)."""

    def __init__(self, max_requests: int = 60, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._hits: Dict[str, List[float]] = {}
        self._lock = threading.Lock()

    def allow(self, client_ip: str) -> bool:
        now = time.monotonic()
        cutoff = now - self.window_seconds
        with self._lock:
            recent = [t for t in self._hits.get(client_ip, []) if t > cutoff]
            if len(recent) >= self.max_requests:
                self._hits[client_ip] = recent
                return False
            recent.append(now)
            self._hits[client_ip] = recent
            return True

api_rate_limiter = RateLimiter(max_requests=60, window_seconds=60)

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
        """Inserta o actualiza un usuario de forma atómica y thread-safe con validación de esquema."""
        if not isinstance(user_data, dict) or not user_data.get("username"):
            raise ValueError("Datos de usuario inválidos: requiere campo 'username'")

        username = str(user_data.get("username")).strip().lower()
        if not re.match(r"^[a-z0-9._@-]{2,64}$", username):
            raise ValueError("Nombre de usuario inválido (2-64 caracteres alfanuméricos o ._@-)")

        try:
            xp_val = max(0, min(int(user_data.get("xp", 0)), 1_000_000))
        except (TypeError, ValueError):
            xp_val = 0
        try:
            streak_val = max(0, min(int(user_data.get("streak", 1)), 10_000))
        except (TypeError, ValueError):
            streak_val = 1

        raw_plans = user_data.get("customPlans", [])
        clean_plans = []
        if isinstance(raw_plans, list):
            for plan in raw_plans[:20]:
                if isinstance(plan, dict):
                    raw_signs = plan.get("signs", [])
                    clean_signs = [str(s) for s in raw_signs if s in VALID_SIGN_IDS][:20] if isinstance(raw_signs, list) else []
                    clean_plans.append({
                        "id": str(plan.get("id", ""))[:64],
                        "title": str(plan.get("title", "Plan LSC"))[:100],
                        "rationale": str(plan.get("rationale", ""))[:300],
                        "signs": clean_signs
                    })

        raw_history = user_data.get("examHistory", [])
        clean_history = []
        if isinstance(raw_history, list):
            for entry in raw_history[:50]:
                if isinstance(entry, dict):
                    try:
                        score_pct = max(0, min(int(entry.get("scorePct", 0)), 100))
                        correct_cnt = max(0, int(entry.get("correct", 0)))
                        total_cnt = max(0, int(entry.get("total", 0)))
                    except (TypeError, ValueError):
                        continue
                    clean_history.append({
                        "planTitle": str(entry.get("planTitle", "Examen LSC"))[:100],
                        "scorePct": score_pct,
                        "correct": correct_cnt,
                        "total": total_cnt,
                        "dateIso": str(entry.get("dateIso", ""))[:40]
                    })

        raw_mastered = user_data.get("masteredSigns", [])
        clean_mastered = [str(s) for s in raw_mastered if s in VALID_SIGN_IDS][:len(VALID_SIGN_IDS)] if isinstance(raw_mastered, list) else []

        clean_user = {
            "username": username,
            "displayName": str(user_data.get("displayName") or username).strip()[:100],
            "level": str(user_data.get("level", "Principiante")).strip()[:50],
            "xp": xp_val,
            "streak": streak_val,
            "masteredSigns": clean_mastered,
            "customPlans": clean_plans,
            "examHistory": clean_history,
            "signStats": SRSService.sanitize_sign_stats(user_data.get("signStats", {}), VALID_SIGN_IDS),
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

user_repository = create_user_repository(UserRepository, USERS_DB_PATH, VALID_SIGN_IDS)

def load_users_db() -> dict:
    """Wrapper de compatibilidad para consultar usuarios."""
    return user_repository.get_all_users()

def save_user_to_db(user_data: dict) -> dict:
    """Wrapper de compatibilidad para persistir un usuario."""
    return user_repository.save_user(user_data)

class PedagogicalPlanner:
    """Planificador pedagógico POO que diseña rutas de aprendizaje LSC70 determinísticas."""

    def build_plan(self, goal: str, level: str = "beginner") -> dict:
        clean_goal = str(goal or "").strip()[:300]
        norm_goal = ''.join(c for c in unicodedata.normalize('NFD', clean_goal) if unicodedata.category(c) != 'Mn').lower()
        plan_id = f"lsc_plan_{int(time.time())}"

        if any(k in norm_goal for k in ["abecedario", "letra", "alfabeto", "dactil", "deletrear"]):
            return {
                "id": plan_id,
                "title": "Ruta LSC: Abecedario Dactilológico",
                "rationale": "Secuencia dactilológica esencial para deletrear nombres propios y palabras en LSC con soltura.",
                "signs": ["A", "B", "C", "D", "E", "I", "L", "O", "U", "V"],
                "source": "deterministic"
            }
        elif any(k in norm_goal for k in ["saludo", "presentar", "presentacion", "social", "conocer"]):
            return {
                "id": plan_id,
                "title": "Ruta LSC: Saludos y Presentación Personal",
                "rationale": "Señas fundamentales para iniciar una conversación cordial y presentarte en LSC.",
                "signs": ["HOLA", "YO", "NOMBRE", "BUENOS", "DIAS", "GUSTAR"],
                "source": "deterministic"
            }
        elif any(k in norm_goal for k in ["palabra", "vocabulario", "conversacion", "frases"]):
            return {
                "id": plan_id,
                "title": "Ruta LSC: Vocabulario Esencial",
                "rationale": "Inmersión directa en las expresiones y términos cotidianos del corpus LSC70.",
                "signs": ["HOLA", "BUENOS", "DIAS", "TARDES", "NOCHES", "YO", "NOMBRE", "GUSTAR", "ANNOS", "LICOR"],
                "source": "deterministic"
            }
        return {
            "id": plan_id,
            "title": "Ruta LSC: Fundamentos Desde Cero",
            "rationale": "Ruta balanceada para principiantes: saludo universal, vocales dactilológicas y cortesía básica.",
            "signs": ["HOLA", "YO", "A", "E", "O", "BUENOS", "DIAS", "NOMBRE"],
            "source": "deterministic"
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
        raw_req_path = self.path.split('?', 1)[0].split('#', 1)[0]
        clean_req_path = urllib.parse.unquote(raw_req_path).replace('\\', '/').lower()
        blocked_segments = ('users_db.json', '.env', '.git', '/data/', '/tools/', '/tools_archive/')
        if any(seg in clean_req_path for seg in blocked_segments):
            self.send_error(403, "Acceso restringido a datos protegidos del sistema")
            return None

        path = self.translate_path(self.path)
        real_dir = os.path.realpath(DIRECTORY)
        real_path = os.path.realpath(path)
        if real_path != real_dir and not real_path.startswith(real_dir + os.sep):
            self.send_error(403, "Ruta fuera del directorio permitido")
            return None
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
        parsed_origin = urllib.parse.urlparse(origin) if origin else None
        if parsed_origin and parsed_origin.scheme == "http" and parsed_origin.hostname in ("localhost", "127.0.0.1"):
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

    def _check_rate_limit(self) -> bool:
        client_ip = self.client_address[0] if getattr(self, "client_address", None) else "local"
        if not api_rate_limiter.allow(client_ip):
            self._send_json_error(429, "Demasiadas solicitudes. Intenta nuevamente en unos segundos.")
            return False
        return True

    def do_GET(self):
        if self.path.startswith('/api/srs/due'):
            if not self._check_rate_limit():
                return
            status, body = handle_srs_get(self.path, user_repository, VALID_SIGN_IDS)
            self._send_json_response(status, body)
            return
        if self.path == '/api/users':
            if not self._check_rate_limit():
                return
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
        if self.path == '/api/plan':
            if not self._check_rate_limit():
                return
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
            if not self._check_rate_limit():
                return
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

        elif self.path == '/api/srs/review':
            if not self._check_rate_limit():
                return
            payload, err = self._read_json_payload()
            if err:
                self._send_json_error(400 if "grande" not in err else 413, err)
                return
            status, body = handle_srs_post(payload, user_repository, VALID_SIGN_IDS)
            self._send_json_response(status, body)
            return

        self.send_error(404, "Endpoint no encontrado")

class ProcessLifecycleManager:
    """Administrador POO del ciclo de vida de procesos del backend (puertos)."""

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

def free_port(port: int):
    """Función de compatibilidad para liberar puertos."""
    ProcessLifecycleManager.free_port(port)

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
    RobustThreadingServer.allow_reuse_address = True
    print(f"Iniciando Servidor Manitas LSC en http://{HOST}:{PORT}")
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
