"""
process_vl_dias_videos.py - EXIS Project (LSC)
Procesador especializado para V, L y DÍAS (Anime IA).
Genera los activos duales MP4 + WebP en app/videos/anime/:
  - L_body.mp4 / L_body.webp / L_hand.mp4 / L_hand.webp (recorte temporal 0..72f sin deformación de dedo)
  - V_body.mp4 / V_body.webp / V_hand.mp4 / V_hand.webp (inpaint de texto en fondo oscuro + zoom mano)
  - DIAS_body.mp4 / DIAS_body.webp / DIAS_hand.mp4 / DIAS_hand.webp (dias v2 en HD 1280x720 sin marcas de agua)
"""

import os
import shutil
import cv2
import numpy as np
from PIL import Image

PROJECT_ROOT = r"C:\Users\abner\Desktop\exis aplicacion lenguaje de señas"
ANIME_DIR = os.path.join(PROJECT_ROOT, "app", "videos", "anime")
DOWNLOADS_DIR = r"C:\Users\abner\Downloads"

os.makedirs(ANIME_DIR, exist_ok=True)

TARGETS = [
    {
        "sign": "L",
        "src": os.path.join(DOWNLOADS_DIR, "l.mp4"),
        "max_frames": 72,       # Primeros 3.0s antes de que la IA deforme el índice
        "crop_box": (240, 200, 480, 480), # (x, y, w, h) Mano formando L
        "clean_bg": False
    },
    {
        "sign": "V",
        "src": os.path.join(DOWNLOADS_DIR, "v.mp4"),
        "max_frames": 96,       # 4.0s de pose V sostenida impecable
        "crop_box": (200, 240, 480, 480), # (x, y, w, h) Mano en V
        "clean_bg": True,       # Inpaint de texto en fondo oscuro
        "bg_patch": (175, 230, 160, 335)  # y1, y2, x1, x2
    },
    {
        "sign": "DIAS",
        "src": os.path.join(DOWNLOADS_DIR, "dias v2.mp4"),
        "max_frames": 120,      # 5.0s (2 ciclos completos de apertura de brazos)
        "crop_box": (380, 150, 520, 520), # (x, y, w, h) Torso y apertura
        "resize_crop": (480, 480),
        "clean_bg": False
    }
]

def clean_v_background(frame, patch):
    y1, y2, x1, x2 = patch
    mask = np.zeros(frame.shape[:2], dtype=np.uint8)
    mask[y1:y2, x1:x2] = 255
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    text_mask = ((gray > 30) & (mask == 255)).astype(np.uint8) * 255
    kernel = np.ones((3, 3), np.uint8)
    text_mask = cv2.dilate(text_mask, kernel, iterations=2)
    return cv2.inpaint(frame, text_mask, 5, cv2.INPAINT_TELEA)

def process_sign(item):
    sign = item["sign"]
    src_path = item["src"]
    max_frames = item.get("max_frames", 96)
    crop_x, crop_y, crop_w, crop_h = item["crop_box"]
    resize_crop = item.get("resize_crop", (crop_w, crop_h))
    clean_bg = item.get("clean_bg", False)
    bg_patch = item.get("bg_patch", None)

    print(f"\n==========================================")
    print(f" Procesando Seña Anime: {sign}")
    print(f" Origen: {src_path}")
    print(f" Límite de fotogramas: {max_frames} (calidad pedagógica LSC)")
    print(f"==========================================")

    if not os.path.exists(src_path):
        print(f"❌ ERROR: No se encontró el archivo: {src_path}")
        return False

    dst_body_mp4 = os.path.join(ANIME_DIR, f"{sign}_body.mp4")
    dst_body_webp = os.path.join(ANIME_DIR, f"{sign}_body.webp")
    dst_hand_mp4 = os.path.join(ANIME_DIR, f"{sign}_hand.mp4")
    dst_hand_webp = os.path.join(ANIME_DIR, f"{sign}_hand.webp")

    cap = cv2.VideoCapture(src_path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 24.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    print(f"Resolución origen: {w}x{h} @ {fps:.1f} fps ({total_frames} fotogramas totales)")

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    body_writer = cv2.VideoWriter(dst_body_mp4, fourcc, fps, (w, h))
    hand_writer = cv2.VideoWriter(dst_hand_mp4, fourcc, fps, resize_crop)

    body_pil_frames = []
    hand_pil_frames = []
    step = 2

    frame_idx = 0
    while frame_idx < max_frames:
        ret, frame = cap.read()
        if not ret:
            break

        # Limpieza de artefacto de fondo si aplica
        if clean_bg and bg_patch:
            frame = clean_v_background(frame, bg_patch)

        # Escribir frame de cuerpo
        body_writer.write(frame)

        # Recorte de mano o torso enfocado
        hand_crop = frame[crop_y:crop_y + crop_h, crop_x:crop_x + crop_w]
        if hand_crop.shape[0] != resize_crop[1] or hand_crop.shape[1] != resize_crop[0]:
            hand_crop = cv2.resize(hand_crop, resize_crop)
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
    body_writer.release()
    hand_writer.release()

    print(f" [OK] {sign}_body.mp4 generado: {os.path.getsize(dst_body_mp4):,} bytes ({frame_idx} frames)")
    print(f" [OK] {sign}_hand.mp4 generado: {os.path.getsize(dst_hand_mp4):,} bytes ({frame_idx} frames)")

    # Guardar WebP animados
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
        print(f" [OK] {sign}_body.webp generado: {os.path.getsize(dst_body_webp):,} bytes")

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
        print(f" [OK] {sign}_hand.webp generado: {os.path.getsize(dst_hand_webp):,} bytes")

    return True

def main():
    print("Iniciando procesamiento de V, L y DÍAS para Anime IA...")
    success = True
    for t in TARGETS:
        res = process_sign(t)
        if not res:
            success = False
    if success:
        print("\n[EXITO] Todos los videos y WebPs de V, L y DIAS fueron procesados exitosamente.")
    else:
        print("\n[AVISO] Ocurrieron errores en el procesamiento.")

if __name__ == "__main__":
    main()
