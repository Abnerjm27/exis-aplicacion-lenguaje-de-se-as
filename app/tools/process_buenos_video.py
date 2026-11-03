"""
process_buenos_video.py - EXIS Project (LSC)
Procesador especializado para la seña 'BUENOS / AS' (Anime IA).
Aplica la Regla 5 de AGENTS.md (poda temporal de fotogramas residuales e innecesarios)
y la Regla 4 (doble salida MP4 + WebP).

Recorta el video descartando:
  - Fotogramas 0 a 39: vacilación inicial y dedo índice en boca (no pertenecen a la seña).
  - Fotogramas 73 a 239: mutación hacia el pecho y postura de reposo en caderas.
Retiene el ciclo canónico limpio (F40 a F72):
  - F40: postura de inicio con mano abierta en mentón/pecho alto y base abierta en torso.
  - F41-F51: descenso fluido de la palma derecha.
  - F52-F68: contacto plano y firme de palma sobre palma en torso (choque bimanual).
  - F69-F72: retorno exacto a la postura inicial.
Duplica a 2 ciclos (65 frames @ 24 fps = 2.71s) para cumplir con el estándar pedagógico
de 2.5s a 4.0s de AGENTS.md.
"""

import os
import shutil
import cv2
from PIL import Image

PROJECT_ROOT = r"C:\Users\abner\Desktop\exis aplicacion lenguaje de señas"
ANIME_DIR = os.path.join(PROJECT_ROOT, "app", "videos", "anime")
DOWNLOADS_DIR = r"C:\Users\abner\Downloads"
LOCAL_VIDEOS_DIR = os.path.join(PROJECT_ROOT, "videos")

# Buscar la fuente de mejor calidad de buenos v2.mp4
SRC_CANDIDATES = [
    os.path.join(LOCAL_VIDEOS_DIR, "buenos v2.mp4"),
    os.path.join(DOWNLOADS_DIR, "buenos v2.mp4"),
    os.path.join(LOCAL_VIDEOS_DIR, "buenos.mp4"),
    os.path.join(DOWNLOADS_DIR, "buenos.mp4"),
]

SRC_VIDEO = None
for candidate in SRC_CANDIDATES:
    if os.path.exists(candidate):
        SRC_VIDEO = candidate
        break

# Configuración de recorte para BUENOS (foco en torso y choque bimanual)
CROP_X = 360
CROP_Y = 140
CROP_W = 560
CROP_H = 560
RESIZE_CROP = (480, 480)

# Poda canónica
START_FRAME = 40
END_FRAME = 72  # Inclusive (33 frames por ciclo)
NUM_CYCLES = 2  # 65 frames totales (2.71s @ 24fps)

def process_buenos():
    print("==========================================")
    print(" Procesando Video Regenerado de BUENOS (Anime IA)")
    print(f" Origen: {SRC_VIDEO}")
    print(f" Poda temporal: F{START_FRAME} a F{END_FRAME} ({NUM_CYCLES} ciclos)")
    print("==========================================")

    if not SRC_VIDEO or not os.path.exists(SRC_VIDEO):
        print(f"[ERROR] No se encontro video de BUENOS.")
        return False

    os.makedirs(ANIME_DIR, exist_ok=True)
    dst_body_mp4 = os.path.join(ANIME_DIR, "BUENOS_body.mp4")
    dst_body_webp = os.path.join(ANIME_DIR, "BUENOS_body.webp")
    dst_hand_mp4 = os.path.join(ANIME_DIR, "BUENOS_hand.mp4")
    dst_hand_webp = os.path.join(ANIME_DIR, "BUENOS_hand.webp")

    cap = cv2.VideoCapture(SRC_VIDEO)
    fps = cap.get(cv2.CAP_PROP_FPS) or 24.0
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    print(f"Resolución original: {w}x{h} @ {fps:.1f} fps ({total_frames} frames)")

    # 1. Extraer los fotogramas del ciclo limpio (F40 a F72)
    raw_cycle_frames = []
    for idx in range(START_FRAME, END_FRAME + 1):
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        ret, frame = cap.read()
        if ret:
            raw_cycle_frames.append(frame)
    cap.release()

    if not raw_cycle_frames:
        print("[ERROR] No se pudieron extraer fotogramas.")
        return False

    print(f"Ciclo canónico extraído: {len(raw_cycle_frames)} fotogramas ({len(raw_cycle_frames)/fps:.2f}s)")

    # Construir secuencia de bucle limpio sin fotograma duplicado en la unión
    final_frames = list(raw_cycle_frames)
    for _ in range(NUM_CYCLES - 1):
        final_frames.extend(raw_cycle_frames[1:])  # omite el primero para que no haya pausa

    total_output_frames = len(final_frames)
    duration_sec = total_output_frames / fps
    print(f"Secuencia final generada: {total_output_frames} fotogramas ({duration_sec:.2f}s)")

    # 2. Escribir videos MP4
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    body_writer = cv2.VideoWriter(dst_body_mp4, fourcc, fps, (w, h))
    hand_writer = cv2.VideoWriter(dst_hand_mp4, fourcc, fps, RESIZE_CROP)

    body_pil_frames = []
    hand_pil_frames = []
    step = 2

    for frame_idx, frame in enumerate(final_frames):
        body_writer.write(frame)

        hand_crop = frame[CROP_Y:CROP_Y + CROP_H, CROP_X:CROP_X + CROP_W]
        if hand_crop.shape[0] != RESIZE_CROP[1] or hand_crop.shape[1] != RESIZE_CROP[0]:
            hand_crop = cv2.resize(hand_crop, RESIZE_CROP)
        hand_writer.write(hand_crop)

        if frame_idx % step == 0:
            rgb_body = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            im_body = Image.fromarray(rgb_body).resize((640, 360), Image.Resampling.LANCZOS)
            body_pil_frames.append(im_body)

            rgb_hand = cv2.cvtColor(hand_crop, cv2.COLOR_BGR2RGB)
            im_hand = Image.fromarray(rgb_hand).resize((360, 360), Image.Resampling.LANCZOS)
            hand_pil_frames.append(im_hand)

    body_writer.release()
    hand_writer.release()

    # 3. Generar WebP animados (doble salida obligatoria Regla 4)
    effective_fps = fps / step
    duration_ms = int(1000 / effective_fps)

    if body_pil_frames:
        body_pil_frames[0].save(
            dst_body_webp,
            save_all=True,
            append_images=body_pil_frames[1:],
            duration=duration_ms,
            loop=0,
            quality=75,
            method=4
        )

    if hand_pil_frames:
        hand_pil_frames[0].save(
            dst_hand_webp,
            save_all=True,
            append_images=hand_pil_frames[1:],
            duration=duration_ms,
            loop=0,
            quality=75,
            method=4
        )

    print(f"[OK] BUENOS_body.mp4 ({total_output_frames} frames): {os.path.getsize(dst_body_mp4):,} bytes")
    print(f"[OK] BUENOS_hand.mp4 ({total_output_frames} frames): {os.path.getsize(dst_hand_mp4):,} bytes")
    print(f"[OK] BUENOS_body.webp: {os.path.getsize(dst_body_webp):,} bytes")
    print(f"[OK] BUENOS_hand.webp: {os.path.getsize(dst_hand_webp):,} bytes")
    return True

if __name__ == "__main__":
    process_buenos()
