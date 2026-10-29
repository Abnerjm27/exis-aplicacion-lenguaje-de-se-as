"""
generate_videos.py - EXIS Project (Colombian Sign Language / LSC)
Agente 1: Video Engine & Asset Producer

Genera videos en bucle de alta calidad a 25 fps con interpolacion suave
de fotogramas (DIS Optical Flow + Ease-In-Out) y gemelos animados WebP
para las 11 señas oficiales del dataset LSC70.

Salidas:
  app/videos/real/<SIGN>_body.mp4
  app/videos/real/<SIGN>_body.webp
  app/videos/real/<SIGN>_hand.mp4
  app/videos/real/<SIGN>_hand.webp
"""

import os
import cv2
import numpy as np
from PIL import Image

# Rutas absolutas del proyecto
PROJECT_ROOT = r"C:\Users\abner\Desktop\exis aplicacion lenguaje de señas"
BASE_W = os.path.join(PROJECT_ROOT, "LSC70", "LSC70", "LSC70W", "Per01")
BASE_AN = os.path.join(PROJECT_ROOT, "LSC70", "LSC70", "LSC70AN", "Per01")
BASE_ANH = os.path.join(PROJECT_ROOT, "LSC70", "LSC70", "LSC70ANH", "Per01")
OUT_REAL = os.path.join(PROJECT_ROOT, "app", "videos", "real")
OUT_ANIME = os.path.join(PROJECT_ROOT, "app", "videos", "anime")

os.makedirs(OUT_REAL, exist_ok=True)
os.makedirs(OUT_ANIME, exist_ok=True)

# 11 señas oficiales
WORDS = ["HOLA", "YO", "BUENOS", "DIAS", "NOCHES", "NOMBRE"]
LETTERS = ["A", "B", "C", "L", "V"]

# Recortes cuadrados para manos en palabras (x, y, w, h)
WORD_HAND_CROPS = {
    "HOLA": (140, 20, 220, 220),       # Saludo a la altura de la sien
    "YO": (230, 220, 200, 200),        # Dedo indice al pecho
    "BUENOS": (230, 190, 200, 200),    # Yemas de dedos al menton/frente
    "DIAS": (120, 40, 400, 400),       # Apertura de ambos brazos
    "NOCHES": (180, 140, 280, 280),    # Brazos cruzados sobre el pecho
    "NOMBRE": (210, 220, 220, 220),    # Dedos indice y medio entrelazados
}

# Dimensiones estandarizadas
BODY_SIZE = (640, 480)
HAND_SIZE = (480, 480)
FPS = 25.0
FRAME_DURATION_MS = 40  # 1000 ms / 25 fps = 40 ms

# Instancia de DIS Optical Flow
dis = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_FAST)


def read_image_safe(path: str) -> np.ndarray:
    """Lee imagen respetando nombres con acentos en Windows."""
    with open(path, "rb") as f:
        data = np.frombuffer(f.read(), np.uint8)
        img = cv2.imdecode(data, cv2.IMREAD_COLOR)
        if img is None:
            raise FileNotFoundError(f"No se pudo decodificar la imagen: {path}")
        return img


def interpolate_pair(fA: np.ndarray, fB: np.ndarray, n_steps: int,
                     grid_x: np.ndarray, grid_y: np.ndarray) -> list:
    """Genera sub-fotogramas interpolados usando DIS Optical Flow y curvatura Ease-In-Out."""
    gA = cv2.cvtColor(fA, cv2.COLOR_BGR2GRAY)
    gB = cv2.cvtColor(fB, cv2.COLOR_BGR2GRAY)

    flow_fw = dis.calc(gA, gB, None)
    flow_bw = dis.calc(gB, gA, None)

    # Limitar magnitudes anomalas de flujo
    flow_fw = np.clip(flow_fw, -60.0, 60.0)
    flow_bw = np.clip(flow_bw, -60.0, 60.0)

    subframes = []
    for step in range(n_steps):
        t = (step + 1) / float(n_steps + 1)
        # Cosine Ease-In-Out: suave al inicio y suave al final
        ease = 0.5 * (1.0 - np.cos(t * np.pi))

        map_x0 = (grid_x + flow_fw[:, :, 0] * ease).astype(np.float32)
        map_y0 = (grid_y + flow_fw[:, :, 1] * ease).astype(np.float32)
        w0 = cv2.remap(fA, map_x0, map_y0, cv2.INTER_LINEAR)

        map_x1 = (grid_x + flow_bw[:, :, 0] * (1.0 - ease)).astype(np.float32)
        map_y1 = (grid_y + flow_bw[:, :, 1] * (1.0 - ease)).astype(np.float32)
        w1 = cv2.remap(fB, map_x1, map_y1, cv2.INTER_LINEAR)

        # Fusión ponderada
        blended = cv2.addWeighted(w0, 1.0 - ease, w1, ease, 0.0)
        subframes.append(blended)

    return subframes


def build_smooth_loop(keyframes: list, steps_per_trans: int = 3,
                      hold_peak: int = 5, hold_rest: int = 5) -> list:
    """
    Construye un bucle continuo de 50 fotogramas (2.0 segundos a 25 fps):
      - 5 fotogramas en reposo inicial (frame 0)
      - Transicion suave hacia el pico (0 -> 1 -> 2 -> 3 -> 4 -> 5)
      - 5 fotogramas sosteniendo el pico gestual (frame 5)
      - Retorno suave hacia el reposo (5 -> 4 -> 3 -> 2 -> 1 -> 0)
    Total = 5 + 4*5 + 5 + 4*5 = 50 fotogramas.
    """
    h, w = keyframes[0].shape[:2]
    grid_x, grid_y = np.meshgrid(np.arange(w), np.arange(h))

    sequence = []
    # 1. Reposo inicial
    sequence.extend([keyframes[0]] * hold_rest)

    # 2. Ida al pico (0 -> 5)
    for i in range(5):
        subs = interpolate_pair(keyframes[i], keyframes[i + 1], steps_per_trans, grid_x, grid_y)
        sequence.extend(subs)
        sequence.append(keyframes[i + 1])

    # 3. Mantener pico de la seña
    sequence.extend([keyframes[5]] * hold_peak)

    # 4. Retorno suave al reposo (5 -> 0)
    for i in range(5, 0, -1):
        subs = interpolate_pair(keyframes[i], keyframes[i - 1], steps_per_trans, grid_x, grid_y)
        sequence.extend(subs)
        sequence.append(keyframes[i - 1])

    return sequence


def save_mp4(frames: list, out_path: str, fps: float = 25.0):
    """Guarda fotogramas en formato MP4 usando VideoWriter."""
    h, w = frames[0].shape[:2]
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(out_path, fourcc, fps, (w, h))
    for f in frames:
        writer.write(f)
    writer.release()


def save_animated_webp(frames: list, out_path: str, duration_ms: int = 40):
    """Guarda fotogramas como WebP animado en bucle infinito."""
    pil_images = [
        Image.fromarray(cv2.cvtColor(f, cv2.COLOR_BGR2RGB))
        for f in frames
    ]
    pil_images[0].save(
        out_path,
        format="WEBP",
        save_all=True,
        append_images=pil_images[1:],
        duration=duration_ms,
        loop=0,
        quality=88,
        method=4
    )


def process_sign(sign_id: str, is_word: bool):
    """Procesa los videos de cuerpo completo y mano para una seña."""
    print(f"\n==========================================")
    print(f" Procesando seña: {sign_id} ({'Palabra' if is_word else 'Letra'})")
    print(f"==========================================")

    # Cargar 6 fotogramas de cuerpo
    if is_word:
        folder = "BUENAS" if sign_id == "BUENOS" else sign_id
        src_dir = os.path.join(BASE_W, folder)
    else:
        src_dir = os.path.join(BASE_AN, sign_id)

    body_raw = [
        read_image_safe(os.path.join(src_dir, f"Per01_{sign_id}_{i}.jpg"))
        for i in range(6)
    ]

    # Redimensionar cuerpo a tamano estandar si fuera necesario
    body_kfs = [
        cv2.resize(img, BODY_SIZE, interpolation=cv2.INTER_AREA)
        if (img.shape[1], img.shape[0]) != BODY_SIZE else img
        for img in body_raw
    ]

    # Cargar / Recortar 6 fotogramas de mano
    if is_word:
        rx, ry, rw, rh = WORD_HAND_CROPS[sign_id]
        hand_raw = [img[ry:ry + rh, rx:rx + rw] for img in body_kfs]
    else:
        src_anh_dir = os.path.join(BASE_ANH, sign_id)
        hand_raw = [
            read_image_safe(os.path.join(src_anh_dir, f"Per01_{sign_id}_{i}.jpg"))
            for i in range(6)
        ]

    # Escalar manos a 480x480 con Lanczos de alta fidelidad
    hand_kfs = [
        cv2.resize(img, HAND_SIZE, interpolation=cv2.INTER_LANCZOS4)
        for img in hand_raw
    ]

    # Generar bucles interpolados
    print(f"  [1/4] Interpolando bucle de cuerpo ({BODY_SIZE[0]}x{BODY_SIZE[1]})...")
    body_loop = build_smooth_loop(body_kfs, steps_per_trans=3, hold_peak=5, hold_rest=5)

    print(f"  [2/4] Interpolando bucle de mano ({HAND_SIZE[0]}x{HAND_SIZE[1]})...")
    hand_loop = build_smooth_loop(hand_kfs, steps_per_trans=3, hold_peak=5, hold_rest=5)

    # Rutas de destino
    mp4_body_path = os.path.join(OUT_REAL, f"{sign_id}_body.mp4")
    webp_body_path = os.path.join(OUT_REAL, f"{sign_id}_body.webp")
    mp4_hand_path = os.path.join(OUT_REAL, f"{sign_id}_hand.mp4")
    webp_hand_path = os.path.join(OUT_REAL, f"{sign_id}_hand.webp")

    # Guardar Cuerpo
    print(f"  [3/4] Exportando {sign_id}_body (MP4 + WebP)...")
    save_mp4(body_loop, mp4_body_path, fps=FPS)
    save_animated_webp(body_loop, webp_body_path, duration_ms=FRAME_DURATION_MS)

    # Guardar Mano
    print(f"  [4/4] Exportando {sign_id}_hand (MP4 + WebP)...")
    save_mp4(hand_loop, mp4_hand_path, fps=FPS)
    save_animated_webp(hand_loop, webp_hand_path, duration_ms=FRAME_DURATION_MS)

    print(f"  -> {sign_id} completado:")
    print(f"     Body MP4:  {os.path.getsize(mp4_body_path):,} bytes | WebP: {os.path.getsize(webp_body_path):,} bytes")
    print(f"     Hand MP4:  {os.path.getsize(mp4_hand_path):,} bytes | WebP: {os.path.getsize(webp_hand_path):,} bytes")


def main():
    print("Iniciando Video Engine & Asset Producer (Proyecto EXIS)...")
    print(f"Directorio de destino Real: {OUT_REAL}")
    print(f"Directorio de destino Anime: {OUT_ANIME}")

    # Palabras
    for word in WORDS:
        process_sign(word, is_word=True)

    # Letras
    for letter in LETTERS:
        process_sign(letter, is_word=False)

    print("\nGeneración completa para todas las 11 señas exitosamente.")


if __name__ == "__main__":
    main()
