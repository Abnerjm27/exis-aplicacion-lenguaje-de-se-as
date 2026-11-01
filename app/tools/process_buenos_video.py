"""
process_buenos_video.py - EXIS Project (LSC)
Procesador especializado para la seña 'BUENOS / AS' (Anime IA).
Aplica la Regla 5 de AGENTS.md (poda temporal) y la Regla 4 (doble salida MP4 + WebP).

Uso:
  python app/tools/process_buenos_video.py
Toma el video regenerado desde C:\\Users\\abner\\Downloads\\buenos v2.mp4 (o buenos.mp4)
y genera:
  - app/videos/anime/BUENOS_body.mp4
  - app/videos/anime/BUENOS_body.webp
  - app/videos/anime/BUENOS_hand.mp4
  - app/videos/anime/BUENOS_hand.webp
"""

import os
import shutil
import cv2
from PIL import Image

PROJECT_ROOT = r"C:\Users\abner\Desktop\exis aplicacion lenguaje de señas"
ANIME_DIR = os.path.join(PROJECT_ROOT, "app", "videos", "anime")
DOWNLOADS_DIR = r"C:\Users\abner\Downloads"

SRC_VIDEO_V2 = os.path.join(DOWNLOADS_DIR, "buenos v2.mp4")
SRC_VIDEO_DEFAULT = os.path.join(DOWNLOADS_DIR, "buenos.mp4")
SRC_VIDEO = SRC_VIDEO_V2 if os.path.exists(SRC_VIDEO_V2) else SRC_VIDEO_DEFAULT

# Configuración de recorte para BUENOS (foco en torso y choque bimanual)
CROP_X = 360
CROP_Y = 140
CROP_W = 560
CROP_H = 560
RESIZE_CROP = (480, 480)
MAX_FRAMES = 72  # 3.0s a 24 fps para un bucle pedagógico óptimo

def process_buenos():
    print("==========================================")
    print(" Procesando Video Regenerado de BUENOS (Anime IA)")
    print(f" Origen: {SRC_VIDEO}")
    print("==========================================")

    if not os.path.exists(SRC_VIDEO):
        print(f"[AVISO] No se encontro {SRC_VIDEO} en Descargas.")
        return False

    dst_body_mp4 = os.path.join(ANIME_DIR, "BUENOS_body.mp4")
    dst_body_webp = os.path.join(ANIME_DIR, "BUENOS_body.webp")
    dst_hand_mp4 = os.path.join(ANIME_DIR, "BUENOS_hand.mp4")
    dst_hand_webp = os.path.join(ANIME_DIR, "BUENOS_hand.webp")

    cap = cv2.VideoCapture(SRC_VIDEO)
    fps = cap.get(cv2.CAP_PROP_FPS) or 24.0
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    print(f"Resolucion: {w}x{h} @ {fps:.1f} fps ({total_frames} frames totales)")
    frames_to_process = min(total_frames, MAX_FRAMES)

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    body_writer = cv2.VideoWriter(dst_body_mp4, fourcc, fps, (w, h))
    hand_writer = cv2.VideoWriter(dst_hand_mp4, fourcc, fps, RESIZE_CROP)

    body_pil_frames = []
    hand_pil_frames = []
    step = 2

    frame_idx = 0
    while frame_idx < frames_to_process:
        ret, frame = cap.read()
        if not ret:
            break

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

        frame_idx += 1

    cap.release()
    body_writer.release()
    hand_writer.release()

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

    print(f"[OK] BUENOS_body.mp4 ({frame_idx} frames): {os.path.getsize(dst_body_mp4):,} bytes")
    print(f"[OK] BUENOS_hand.mp4 ({frame_idx} frames): {os.path.getsize(dst_hand_mp4):,} bytes")
    print(f"[OK] BUENOS_body.webp: {os.path.getsize(dst_body_webp):,} bytes")
    print(f"[OK] BUENOS_hand.webp: {os.path.getsize(dst_hand_webp):,} bytes")
    return True

if __name__ == "__main__":
    process_buenos()
