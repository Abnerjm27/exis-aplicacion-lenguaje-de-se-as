"""
process_c_video.py - EXIS Project (LSC)
Procesador especializado para la seña 'C' (Anime IA).
Analiza y extrae la dactilología LSC de la Letra C a partir de C:\\Users\\abner\\Downloads\\c.mp4.

Genera los 4 activos multimedia requeridos en app/videos/anime/:
  - C_body.mp4 (Cuerpo completo en alta fidelidad original)
  - C_body.webp (Versión animada continua para fallback)
  - C_hand.mp4 (Primer plano de la mano 480x480)
  - C_hand.webp (Primer plano animado para fallback)
"""

import os
import shutil
import cv2
from PIL import Image

PROJECT_ROOT = r"C:\Users\abner\Desktop\exis aplicacion lenguaje de señas"
ANIME_DIR = os.path.join(PROJECT_ROOT, "app", "videos", "anime")
DOWNLOADS_DIR = r"C:\Users\abner\Downloads"
SRC_VIDEO = os.path.join(DOWNLOADS_DIR, "c.mp4")

os.makedirs(ANIME_DIR, exist_ok=True)

# Parámetros validados para el recorte pedagógico de la Letra C
CROP_X = 180
CROP_Y = 200
CROP_W = 480
CROP_H = 480

def process_c():
    print("==========================================")
    print(" Procesando Video Letra C Anime IA")
    print(f" Origen: {SRC_VIDEO}")
    print("==========================================")

    if not os.path.exists(SRC_VIDEO):
        print(f"❌ ERROR: No se encontró {SRC_VIDEO}")
        return False

    dst_body_mp4 = os.path.join(ANIME_DIR, "C_body.mp4")
    dst_body_webp = os.path.join(ANIME_DIR, "C_body.webp")
    dst_hand_mp4 = os.path.join(ANIME_DIR, "C_hand.mp4")
    dst_hand_webp = os.path.join(ANIME_DIR, "C_hand.webp")

    # 1. Copiar body MP4 original (preserva la tasa de bits y códec original)
    shutil.copyfile(SRC_VIDEO, dst_body_mp4)
    print(f"[OK] C_body.mp4 copiado: {os.path.getsize(dst_body_mp4):,} bytes")

    # 2. Procesar hand MP4 y WebP fallbacks
    cap = cv2.VideoCapture(SRC_VIDEO)
    fps = cap.get(cv2.CAP_PROP_FPS) or 24.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    print(f"Resolución: {w}x{h} @ {fps:.1f} fps ({total_frames} fotogramas)")

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    hand_writer = cv2.VideoWriter(dst_hand_mp4, fourcc, fps, (CROP_W, CROP_H))

    body_pil_frames = []
    hand_pil_frames = []
    step = 2  # Muestreo a 12 fps para WebP ligero (< 900 KB)

    frame_idx = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # Recorte de mano
        hand_crop = frame[CROP_Y:CROP_Y + CROP_H, CROP_X:CROP_X + CROP_W]
        if hand_crop.shape[0] != CROP_H or hand_crop.shape[1] != CROP_W:
            hand_crop = cv2.resize(hand_crop, (CROP_W, CROP_H))
        hand_writer.write(hand_crop)

        # Muestreo para WebP
        if frame_idx % step == 0:
            rgb_body = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            im_body = Image.fromarray(rgb_body).resize((640, 360), Image.Resampling.LANCZOS)
            body_pil_frames.append(im_body)

            rgb_hand = cv2.cvtColor(hand_crop, cv2.COLOR_BGR2RGB)
            im_hand = Image.fromarray(rgb_hand).resize((360, 360), Image.Resampling.LANCZOS)
            hand_pil_frames.append(im_hand)

        frame_idx += 1

    cap.release()
    hand_writer.release()
    print(f"[OK] C_hand.mp4 generado: {os.path.getsize(dst_hand_mp4):,} bytes")

    # 3. Guardar WebP animados
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
        print(f"[OK] C_body.webp generado: {os.path.getsize(dst_body_webp):,} bytes")

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
        print(f"[OK] C_hand.webp generado: {os.path.getsize(dst_hand_webp):,} bytes")

    print("\n Proceso completado exitosamente para la Letra C en Anime IA.")
    return True

if __name__ == "__main__":
    process_c()
