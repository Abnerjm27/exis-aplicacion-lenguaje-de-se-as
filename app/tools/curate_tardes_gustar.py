import os
import cv2
import numpy as np
from PIL import Image

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
VIDEOS_SRC_DIR = os.path.join(BASE_DIR, "videos")
ANIME_DEST_DIR = os.path.join(BASE_DIR, "app", "videos", "anime")

os.makedirs(ANIME_DEST_DIR, exist_ok=True)

CURATION_CONFIG = {
    "TARDES": {
        "src": os.path.join(VIDEOS_SRC_DIR, "tardes.mp4"),
        "start_frame": 0,
        "end_frame": 58,  # ~2.41s a 24 fps
        # Crop para vista de mano (pecho / antebrazos cruzados en 1280x720)
        "crop_box": (380, 160, 520, 520)  # (x, y, w, h)
    },
    "GUSTAR": {
        "src": os.path.join(VIDEOS_SRC_DIR, "gustar.mp4"),
        "start_frame": 0,
        "end_frame": 56,  # ~2.33s a 24 fps
        # Crop para vista de mano (cuello / garganta / índice en 1280x720)
        "crop_box": (420, 80, 440, 440)  # (x, y, w, h)
    }
}

def extract_trimmed_frames(src_path, start_f, end_f):
    cap = cv2.VideoCapture(src_path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 24.0
    frames = []
    idx = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        if start_f <= idx <= end_f:
            frames.append(frame)
        if idx > end_f:
            break
        idx += 1
    cap.release()
    return frames, fps

def save_mp4(frames, path, fps=24.0):
    h, w = frames[0].shape[:2]
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(path, fourcc, fps, (w, h))
    for f in frames:
        out.write(f)
    out.release()
    print(f"[OK MP4] Guardado {path} ({w}x{h}, {len(frames)} frames)")

def save_webp(frames, path, fps=24.0):
    pil_frames = [Image.fromarray(cv2.cvtColor(f, cv2.COLOR_BGR2RGB)) for f in frames]
    duration_ms = int(1000 / fps)
    pil_frames[0].save(
        path,
        save_all=True,
        append_images=pil_frames[1:],
        duration=duration_ms,
        loop=0,
        quality=80,
        method=4
    )
    print(f"[OK WebP] Guardado {path} ({len(pil_frames)} frames)")

def main():
    print("=== Curaduría y Poda Temporal de Videos Anime IA (TARDES y GUSTAR) ===")

    for sign_name, cfg in CURATION_CONFIG.items():
        print(f"\n--- Procesando {sign_name} ---")
        if not os.path.exists(cfg["src"]):
            print(f"[ERROR] Archivo origen no encontrado: {cfg['src']}")
            continue

        raw_frames, fps = extract_trimmed_frames(cfg["src"], cfg["start_frame"], cfg["end_frame"])
        print(f"Fotogramas podados: {len(raw_frames)} (frames {cfg['start_frame']}..{cfg['end_frame']} a {fps:.1f} fps)")

        # 1. Body View
        body_mp4 = os.path.join(ANIME_DEST_DIR, f"{sign_name}_body.mp4")
        body_webp = os.path.join(ANIME_DEST_DIR, f"{sign_name}_body.webp")
        save_mp4(raw_frames, body_mp4, fps)
        save_webp(raw_frames, body_webp, fps)

        # 2. Hand View (Crop centrado en la articulación)
        gx, gy, gw, gh = cfg["crop_box"]
        hand_frames = []
        for f in raw_frames:
            cropped = f[gy:gy+gh, gx:gx+gw]
            hand_frames.append(cv2.resize(cropped, (480, 480), interpolation=cv2.INTER_CUBIC))

        hand_mp4 = os.path.join(ANIME_DEST_DIR, f"{sign_name}_hand.mp4")
        hand_webp = os.path.join(ANIME_DEST_DIR, f"{sign_name}_hand.webp")
        save_mp4(hand_frames, hand_mp4, fps)
        save_webp(hand_frames, hand_webp, fps)

    print("\n=== Curaduría y poda completada exitosamente ===")

if __name__ == "__main__":
    main()
