import os
import urllib.request
import re

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
APP_DIR = os.path.join(BASE_DIR, "app")
LIB_DIR = os.path.join(APP_DIR, "lib")
FONTS_DIR = os.path.join(APP_DIR, "fonts")
CSS_DIR = os.path.join(APP_DIR, "css")

os.makedirs(LIB_DIR, exist_ok=True)
os.makedirs(FONTS_DIR, exist_ok=True)
os.makedirs(CSS_DIR, exist_ok=True)

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

def download_file(url, dest_path):
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    if os.path.exists(dest_path) and os.path.getsize(dest_path) > 0:
        print(f"[EXISTS] {os.path.basename(dest_path)} ({os.path.getsize(dest_path)} bytes)")
        return True
    
    print(f"[DOWNLOADING] {url} -> {dest_path}")
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            content = resp.read()
            with open(dest_path, "wb") as f:
                f.write(content)
        print(f"[OK] Guardado {os.path.basename(dest_path)} ({len(content)} bytes)")
        return True
    except Exception as e:
        print(f"[ERROR] Falló descarga de {url}: {e}")
        return False

def setup_tailwind():
    print("\n--- Descargando Tailwind CSS Standalone ---")
    dest = os.path.join(LIB_DIR, "tailwind", "tailwind.js")
    download_file("https://cdn.tailwindcss.com", dest)

def setup_mediapipe():
    print("\n--- Descargando MediaPipe Utils y Hands WASM ---")
    
    utils = [
        ("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js", os.path.join(LIB_DIR, "mediapipe", "camera_utils.js")),
        ("https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js", os.path.join(LIB_DIR, "mediapipe", "control_utils.js")),
        ("https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js", os.path.join(LIB_DIR, "mediapipe", "drawing_utils.js")),
    ]
    for url, dest in utils:
        download_file(url, dest)
        
    hands_files = [
        "hands.js",
        "hands.binarypb",
        "hands_solution_packed_assets_loader.js",
        "hands_solution_packed_assets.data",
        "hands_solution_simd_wasm_bin.js",
        "hands_solution_simd_wasm_bin.wasm",
        "hands_solution_wasm_bin.js",
        "hands_solution_wasm_bin.wasm",
    ]
    base_hands_url = "https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240"
    for filename in hands_files:
        url = f"{base_hands_url}/{filename}"
        dest = os.path.join(LIB_DIR, "mediapipe", "hands", filename)
        download_file(url, dest)

def setup_canvas_confetti():
    print("\n--- Descargando Canvas Confetti ---")
    url = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js"
    dest = os.path.join(LIB_DIR, "canvas-confetti", "confetti.browser.min.js")
    download_file(url, dest)

def setup_fonts():
    print("\n--- Descargando Fuentes Outfit & JetBrains Mono ---")
    css_url = "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Outfit:wght@400;500;600;700;800&display=swap"
    req = urllib.request.Request(css_url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            css_text = resp.read().decode('utf-8')
    except Exception as e:
        print(f"[WARN] No se pudo obtener CSS de Google Fonts: {e}")
        return

    # Extraer URLs woff2
    font_urls = re.findall(r'url\((https://[^)]+\.woff2)\)', css_text)
    local_css = css_text
    
    for i, f_url in enumerate(set(font_urls)):
        ext = ".woff2"
        font_filename = f"font_{i:02d}_{os.path.basename(f_url)}"
        font_dest = os.path.join(FONTS_DIR, font_filename)
        if download_file(f_url, font_dest):
            local_css = local_css.replace(f_url, f"../fonts/{font_filename}")

    fonts_css_path = os.path.join(CSS_DIR, "fonts.css")
    with open(fonts_css_path, "w", encoding="utf-8") as f:
        f.write(local_css)
    print(f"[OK] Archivo fonts.css local generado en {fonts_css_path}")

def main():
    print("=== Configurando Entorno 100% Offline para EXIS LSC ===")
    setup_tailwind()
    setup_mediapipe()
    setup_canvas_confetti()
    setup_fonts()
    print("\n=== Todos los recursos offline descargados con éxito ===")

if __name__ == "__main__":
    main()
