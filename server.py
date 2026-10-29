import http.server
import socketserver
import json
import urllib.request
import os
import sys

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
    "noches": "NOCHES",
    "noche": "NOCHES",
    "nombre": "NOMBRE",
    "a": "A",
    "b": "B",
    "c": "C",
    "l": "L",
    "v": "V"
}

FALLBACK_REPLIES = {
    "HOLA": "¡Excelente elección! Para hacer 'HOLA', levanta tu mano derecha abierta a la altura de la sien y haz un ligero saludo hacia afuera. ¡Observa al avatar 3D! [SELECCIONAR: HOLA]",
    "YO": "¡Muy bien! Para la seña de 'YO', forma un puño con tu mano derecha y deja únicamente el dedo índice extendido apuntando hacia tu pecho. [SELECCIONAR: YO]",
    "BUENOS": "¡Perfecto! Para 'BUENOS / AS', coloca las yemas de tus dedos en el mentón y proyéctala suavemente hacia adelante. [SELECCIONAR: BUENOS]",
    "DIAS": "Para la seña de 'DÍAS', abre ambos brazos lateralmente a la altura del pecho con las palmas al frente simulando el amanecer. [SELECCIONAR: DIAS]",
    "NOCHES": "Para 'NOCHES', cruza ambos brazos sobre tu pecho con las manos reposando sobre los antebrazos opuestos. [SELECCIONAR: NOCHES]",
    "NOMBRE": "Para 'NOMBRE', extiende los dedos índice y medio de ambas manos y apoya los de la mano derecha sobre los de la izquierda frente a tu torso. [SELECCIONAR: NOMBRE]",
    "A": "Vamos a practicar la letra 'A': cierra los 4 dedos en un puño firme y mantén el pulgar erguido a un lado del índice. [SELECCIONAR: A]",
    "B": "Para la letra 'B', extiende los cuatro dedos juntos rectos hacia arriba y dobla el pulgar sobre la palma. [SELECCIONAR: B]",
    "C": "Para la letra 'C', arquea los 4 dedos y el pulgar enfrentados formando la curvatura semicircular de la letra C. [SELECCIONAR: C]",
    "L": "Para la letra 'L', extiende el dedo índice hacia arriba y el pulgar hacia un lado formando un ángulo recto de 90 grados. [SELECCIONAR: L]",
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
        'noches': 'NOCHES', 'noche': 'NOCHES',
        'nombre': 'NOMBRE'
    }

    # 1. Check words first
    for token in tokens:
        if token in words_map:
            return words_map[token]

    # 2. Check letters with 'letra X'
    letters_map = {'a': 'A', 'b': 'B', 'c': 'C', 'l': 'L', 'v': 'V'}
    for l in letters_map:
        if f'letra {l}' in norm or f'letra_{l}' in norm:
            return letters_map[l]

    # 3. Check isolated single letter tokens
    for token in tokens:
        if token in ['b', 'c', 'l', 'v']:
            return letters_map[token]
        if token == 'a' and (len(tokens) == 1 or 'letra' in tokens):
            return 'A'

    return None

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
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Range')
        self.send_header('Accept-Ranges', 'bytes')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        if self.path == '/api/chat':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8')
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
                    reply_text = "En el Proyecto EXIS puedes aprender: Palabras LSC (HOLA, YO, BUENOS, DÍAS, NOCHES, NOMBRE) y Alfabeto Dactilológico (A, B, C, L, V). ¿Cuál te gustaría practicar ahora?"
                else:
                    # Try Ollama with low latency timeout (2.0s)
                    try:
                        prompt = f"""Eres el tutor de Lengua de Señas Colombiana del Proyecto EXIS.
Señas disponibles: HOLA, YO, BUENOS, DÍAS, NOCHES, NOMBRE, y letras dactilológicas A, B, C, L, V.
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

        super().do_POST()

if __name__ == '__main__':
    print(f"Iniciando Servidor LSC Learn con Proxy Ollama en http://localhost:{PORT}")
    with socketserver.ThreadingTCPServer(("", PORT), LSCHandler) as httpd:
        httpd.serve_forever()
