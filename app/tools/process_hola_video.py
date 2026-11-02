"""
process_hola_video.py - EXIS Project (LSC)
Procesador especializado para la seña 'HOLA' (Anime IA) alineada con LSC70.
Aplica la Regla 5 de AGENTS.md (poda temporal del bucle canónico exacto)
y la Regla 4 (doble salida obligatoria MP4 + WebP).

Entrada: videos/hola v2.mp4 (10s, 240 frames @ 24 fps)
Poda temporal:
  - F0 a F57 (58 fotogramas @ 24 fps = 2.42 segundos)
  - F0-F10: Posición de reposo neutral inicial.
  - F11-F23: Elevación fluida de mano con 4 dedos unidos y pulgar reposando.
  - F24-F32: Pose canónica de saludo a la sien (idéntica a dataset LSC70).
  - F33-F44: Proyección diagonal hacia adelante y afuera en saludo hacia el interlocutor.
  - F45-F57: Descenso suave y retorno a la posición de reposo neutral (bucle continuo con diff < 1.6).

Salidas en app/videos/anime/:
  - HOLA_body.mp4 (1280x720)
  - HOLA_body.webp (640x360)
  - HOLA_hand.mp4 (480x480)
  - HOLA_hand.webp (360x360)
"""

import os
import cv2
from PIL import Image

PROJECT_ROOT = r"C:\Users\abner\Desktop\exis aplicacion lenguaje de señas"
ANIME_DIR = os.path.join(PROJECT_ROOT, "app", "videos", "anime")
LOCAL_VIDEOS_DIR = os.path.join(PROJECT_ROOT, "videos")
SRC_VIDEO = os.path.join(LOCAL_VIDEOS_DIR, "hola v2.mp4")

# Configuración de recorte para plano de mano (foco en sien y saludo)
CROP_X = 360
CROP_Y = 100
CROP_W = 480
CROP_H = 480
RESIZE_CROP = (480, 480)

# Poda canónica
START_FRAME = 0
END_FRAME = 57  # Inclusive (58 frames = 2.42s @ 24 fps)

def process_hola():
    print("==========================================")
    print(" Procesando Video Regenerado de HOLA (Anime IA - LSC70)")
    print(f" Origen: {SRC_VIDEO}")
    print(f" Poda temporal: F{START_FRAME} a F{END_FRAME} (58 fotogramas, 2.42s @ 24 fps)")
    print("==========================================")

    if not os.path.exists(SRC_VIDEO):
        print(f"[ERROR] No se encontró el video fuente: {SRC_VIDEO}")
        return False

    os.makedirs(ANIME_DIR, exist_ok=True)
    dst_body_mp4 = os.path.join(ANIME_DIR, "HOLA_body.mp4")
    dst_body_webp = os.path.join(ANIME_DIR, "HOLA_body.webp")
    dst_hand_mp4 = os.path.join(ANIME_DIR, "HOLA_hand.mp4")
    dst_hand_webp = os.path.join(ANIME_DIR, "HOLA_hand.webp")

    cap = cv2.VideoCapture(SRC_VIDEO)
    fps = cap.get(cv2.CAP_PROP_FPS) or 24.0
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total_input_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    print(f"Video fuente: {w}x{h} @ {fps:.1f} fps ({total_input_frames} frames)")

    # 1. Extraer los fotogramas del ciclo limpio (F0 a F57)
    frames = []
    for idx in range(START_FRAME, END_FRAME + 1):
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        ret, frame = cap.read()
        if ret:
            frames.append(frame)
    cap.release()

    if not frames:
        print("[ERROR] No se pudieron extraer fotogramas.")
        return False

    total_output_frames = len(frames)
    duration_sec = total_output_frames / fps
    print(f"Ciclo canónico extraído: {total_output_frames} fotogramas ({duration_sec:.2f}s)")

    # 2. Escribir videos MP4
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    body_writer = cv2.VideoWriter(dst_body_mp4, fourcc, fps, (w, h))
    hand_writer = cv2.VideoWriter(dst_hand_mp4, fourcc, fps, RESIZE_CROP)

    body_pil_frames = []
    hand_pil_frames = []
    step = 1  # 58 frames a 24 fps = 58 fotogramas WebP para máxima fluidez a 24 fps

    for frame_idx, frame in enumerate(frames):
        body_writer.write(frame)

        hand_crop = frame[CROP_Y:CROP_Y + CROP_H, CROP_X:CROP_X + CROP_W]
        if hand_crop.shape[0] != RESIZE_CROP[1] or hand_crop.shape[1] != RESIZE_CROP[0]:
            hand_crop = cv2.resize(hand_crop, RESIZE_CROP)
        hand_writer.write(hand_crop)

        # Muestreo para WebP
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
    duration_ms = int(1000 / fps)

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

    print(f"[OK] HOLA_body.mp4 ({total_output_frames} frames): {os.path.getsize(dst_body_mp4):,} bytes")
    print(f"[OK] HOLA_hand.mp4 ({total_output_frames} frames): {os.path.getsize(dst_hand_mp4):,} bytes")
    print(f"[OK] HOLA_body.webp: {os.path.getsize(dst_body_webp):,} bytes")
    print(f"[OK] HOLA_hand.webp: {os.path.getsize(dst_hand_webp):,} bytes")
    return True

if __name__ == "__main__":
    process_hola()
