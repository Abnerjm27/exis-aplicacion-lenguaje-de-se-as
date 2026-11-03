"""
process_new_anime_videos.py - EXIS Project (LSC)
Procesador de videos Anime IA para BUENOS, NOMBRE y Letra A.
Genera los formatos requeridos en app/videos/anime/:
  - <SIGN>_body.mp4
  - <SIGN>_body.webp
  - <SIGN>_hand.mp4
  - <SIGN>_hand.webp
"""

import os
import shutil
import cv2
from PIL import Image

PROJECT_ROOT = r"C:\Users\abner\Desktop\exis aplicacion lenguaje de señas"
ANIME_DIR = os.path.join(PROJECT_ROOT, "app", "videos", "anime")
DOWNLOADS_DIR = r"C:\Users\abner\Downloads"

os.makedirs(ANIME_DIR, exist_ok=True)

TARGETS = [
    {
        "sign": "NOMBRE",
        "src": os.path.join(DOWNLOADS_DIR, "nombre (2).mp4"),
        "crop_box": (400, 220, 480, 480) # Ambas manos en contacto
    },
    {
        "sign": "A",
        "src": os.path.join(DOWNLOADS_DIR, "a.mp4"),
        "crop_box": (240, 180, 480, 480) # Puño dactilológico letra A
    }
]

def process_video(item):
    sign = item["sign"]
    src_path = item["src"]
    crop_x, crop_y, crop_w, crop_h = item["crop_box"]

    print(f"\n==========================================")
    print(f" Procesando seña Anime: {sign}")
    print(f" Origen: {src_path}")
    print(f"==========================================")

    if not os.path.exists(src_path):
        print(f"❌ ERROR: No se encontró el archivo de origen: {src_path}")
        return False

    dst_body_mp4 = os.path.join(ANIME_DIR, f"{sign}_body.mp4")
    dst_body_webp = os.path.join(ANIME_DIR, f"{sign}_body.webp")
    dst_hand_mp4 = os.path.join(ANIME_DIR, f"{sign}_hand.mp4")
    dst_hand_webp = os.path.join(ANIME_DIR, f"{sign}_hand.webp")

    # 1. Copiar body MP4 directamente (preserva codificación original de alta fidelidad)
    shutil.copyfile(src_path, dst_body_mp4)
    print(f" [OK] Copiado body MP4: {dst_body_mp4} ({os.path.getsize(dst_body_mp4):,} bytes)")

    # 2. Abrir video para procesar hand zoom y WebP fallbacks
    cap = cv2.VideoCapture(src_path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 24.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    print(f"Resolución: {w}x{h} | FPS: {fps} | Total fotogramas: {total_frames}")

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    hand_writer = cv2.VideoWriter(dst_hand_mp4, fourcc, fps, (crop_w, crop_h))

    body_pil_frames = []
    hand_pil_frames = []

    # Ajustar step para WebP para mantener tamaño óptimo (< 800 KB)
    step = 2 if total_frames > 60 else 1

    frame_idx = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # Recorte de primer plano de mano
        hand_crop = frame[crop_y:crop_y + crop_h, crop_x:crop_x + crop_w]
        if hand_crop.shape[0] != crop_h or hand_crop.shape[1] != crop_w:
            hand_crop = cv2.resize(hand_crop, (crop_w, crop_h))

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
    print(f" [OK] Generado hand MP4: {dst_hand_mp4} ({os.path.getsize(dst_hand_mp4):,} bytes)")

    # 3. Guardar WebP animados para máxima compatibilidad
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
        print(f" [OK] Generado body WebP: {dst_body_webp} ({os.path.getsize(dst_body_webp):,} bytes)")

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
        print(f" [OK] Generado hand WebP: {dst_hand_webp} ({os.path.getsize(dst_hand_webp):,} bytes)")

    return True

def cleanup_temp_files():
    for f in os.listdir(PROJECT_ROOT):
        if f.startswith("temp_") or f.startswith("crop_") or f.startswith("frame_"):
            try:
                os.remove(os.path.join(PROJECT_ROOT, f))
            except Exception:
                pass

if __name__ == "__main__":
    success_count = 0
    for item in TARGETS:
        if process_video(item):
            success_count += 1

    cleanup_temp_files()

    print(f"\n==========================================")
    print(f" PROCESAMIENTO FINALIZADO: {success_count}/{len(TARGETS)} SEÑAS")
    print(f"==========================================")
