"""
curate_anime_videos.py - EXIS Project (LSC)
Aplica la Regla 5 de AGENTS.md (Curaduría y Poda Temporal de Videos Anime IA).
Poda fotogramas innecesarios, pausas y variaciones tardías de IA en:
  - A (puño con pulgar erguido, primeros 72f / 3.0s)
  - C (curvatura semicircular limpia, primeros 72f / 3.0s)
  - HOLA (saludo en sien, primeros 72f / 3.0s)
  - YO (apuntar al pecho, primeros 72f / 3.0s)
  - NOMBRE (contacto de dos dedos, primeros 72f / 3.0s)
"""

import os
import cv2
from PIL import Image

PROJECT_ROOT = r"C:\Users\abner\Desktop\exis aplicacion lenguaje de señas"
ANIME_DIR = os.path.join(PROJECT_ROOT, "app", "videos", "anime")

TARGETS = [
    {
        "sign": "A",
        "max_frames": 72,
        "crop_box": (240, 180, 480, 480)
    },
    {
        "sign": "C",
        "max_frames": 72,
        "crop_box": (180, 200, 480, 480)
    },
    {
        "sign": "HOLA",
        "max_frames": 72,
        "crop_box": (280, 140, 480, 480)
    },
    {
        "sign": "YO",
        "max_frames": 72,
        "crop_box": (360, 220, 480, 480)
    },
    {
        "sign": "NOMBRE",
        "max_frames": 72,
        "crop_box": (400, 220, 480, 480)
    }
]

def curate_sign(item):
    sign = item["sign"]
    max_frames = item["max_frames"]
    crop_x, crop_y, crop_w, crop_h = item["crop_box"]

    src_video = os.path.join(ANIME_DIR, f"{sign}_body.mp4")
    if not os.path.exists(src_video):
        print(f"[SKIP] No se encontró {src_video}")
        return False

    temp_body_mp4 = os.path.join(ANIME_DIR, f"{sign}_body_temp.mp4")
    temp_hand_mp4 = os.path.join(ANIME_DIR, f"{sign}_hand_temp.mp4")
    dst_body_webp = os.path.join(ANIME_DIR, f"{sign}_body.webp")
    dst_hand_webp = os.path.join(ANIME_DIR, f"{sign}_hand.webp")

    cap = cv2.VideoCapture(src_video)
    fps = cap.get(cv2.CAP_PROP_FPS) or 24.0
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total_orig = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    print(f"\nCurando {sign}: {total_orig} frames -> podando a {max_frames} frames ({max_frames/fps:.1f}s)")

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    body_writer = cv2.VideoWriter(temp_body_mp4, fourcc, fps, (w, h))
    hand_writer = cv2.VideoWriter(temp_hand_hand if False else temp_hand_mp4, fourcc, fps, (crop_w, crop_h))

    body_pil_frames = []
    hand_pil_frames = []
    step = 2

    frame_idx = 0
    while frame_idx < max_frames:
        ret, frame = cap.read()
        if not ret:
            break

        body_writer.write(frame)

        hand_crop = frame[crop_y:crop_y + crop_h, crop_x:crop_x + crop_w]
        if hand_crop.shape[0] != crop_h or hand_crop.shape[1] != crop_w:
            hand_crop = cv2.resize(hand_crop, (crop_w, crop_h))
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

    # Reemplazar archivos finales
    dst_body_mp4 = os.path.join(ANIME_DIR, f"{sign}_body.mp4")
    dst_hand_mp4 = os.path.join(ANIME_DIR, f"{sign}_hand.mp4")

    if os.path.exists(temp_body_mp4) and os.path.getsize(temp_body_mp4) > 1000:
        if os.path.exists(dst_body_mp4):
            os.remove(dst_body_mp4)
        os.rename(temp_body_mp4, dst_body_mp4)

    if os.path.exists(temp_hand_mp4) and os.path.getsize(temp_hand_mp4) > 1000:
        if os.path.exists(dst_hand_mp4):
            os.remove(dst_hand_mp4)
        os.rename(temp_hand_mp4, dst_hand_mp4)

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

    print(f" [OK] {sign} curado: {frame_idx} frames, body MP4: {os.path.getsize(dst_body_mp4):,} bytes, hand MP4: {os.path.getsize(dst_hand_mp4):,} bytes")
    return True

def main():
    print("Iniciando poda y curaduría de videos anime...")
    for t in TARGETS:
        curate_sign(t)
    print("\n[EXITO] Curaduria completada bajo la Regla 5 de AGENTS.md.")

if __name__ == "__main__":
    main()
