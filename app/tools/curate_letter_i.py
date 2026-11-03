import os
import cv2
import numpy as np
from PIL import Image

class AnimeCurator:
    """
    Curador y podador temporal de videos Anime IA para el proyecto EXIS (LSC).
    Cumple con las Reglas 4, 5 y 8 de AGENTS.md (OOP, MP4+WebP dual, poda fotograma a fotograma).
    """

    def __init__(self, base_dir=None):
        if base_dir is None:
            self.base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        else:
            self.base_dir = base_dir
            
        self.videos_src_dir = os.path.join(self.base_dir, "videos")
        self.anime_dest_dir = os.path.join(self.base_dir, "app", "videos", "anime")
        os.makedirs(self.anime_dest_dir, exist_ok=True)

    def extract_trimmed_frames(self, src_path, start_f, end_f):
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

    def save_mp4(self, frames, path, fps=24.0):
        h, w = frames[0].shape[:2]
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(path, fourcc, fps, (w, h))
        for f in frames:
            out.write(f)
        out.release()
        print(f"[OK MP4] Guardado: {os.path.basename(path)} ({w}x{h}, {len(frames)} frames @ {fps:.1f} fps)")

    def save_webp(self, frames, path, fps=24.0):
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
        print(f"[OK WebP] Guardado: {os.path.basename(path)} ({len(pil_frames)} frames @ {duration_ms}ms/frame)")

    def process_sign(self, sign_name, src_file, start_frame, end_frame, crop_box):
        src_path = os.path.join(self.videos_src_dir, src_file)
        if not os.path.exists(src_path):
            raise FileNotFoundError(f"Video fuente no encontrado: {src_path}")

        print(f"\n--- Curando Seña {sign_name} ---")
        raw_frames, fps = self.extract_trimmed_frames(src_path, start_frame, end_frame)
        total_f = len(raw_frames)
        dur = total_f / fps
        print(f"Bucle canónico podado: frames {start_frame}..{end_frame} ({total_f} frames, {dur:.2f}s)")

        # 1. Body View
        body_mp4 = os.path.join(self.anime_dest_dir, f"{sign_name}_body.mp4")
        body_webp = os.path.join(self.anime_dest_dir, f"{sign_name}_body.webp")
        self.save_mp4(raw_frames, body_mp4, fps)
        self.save_webp(raw_frames, body_webp, fps)

        # 2. Hand View (Crop 480x480)
        gx, gy, gw, gh = crop_box
        hand_frames = []
        for f in raw_frames:
            cropped = f[gy:gy+gh, gx:gx+gw]
            resized = cv2.resize(cropped, (480, 480), interpolation=cv2.INTER_CUBIC)
            hand_frames.append(resized)

        hand_mp4 = os.path.join(self.anime_dest_dir, f"{sign_name}_hand.mp4")
        hand_webp = os.path.join(self.anime_dest_dir, f"{sign_name}_hand.webp")
        self.save_mp4(hand_frames, hand_mp4, fps)
        self.save_webp(hand_frames, hand_webp, fps)

        return {
            "sign": sign_name,
            "frames": total_f,
            "fps": fps,
            "duration": dur,
            "body_mp4": body_mp4,
            "body_webp": body_webp,
            "hand_mp4": hand_mp4,
            "hand_webp": hand_webp
        }

def main():
    print("=== Curaduría y Poda Temporal de Video Anime IA: Letra I ===")
    curator = AnimeCurator()
    # Poda canónica verificada fotograma a fotograma:
    # Inicio en frame 38, fin en frame 97 (60 fotogramas = 2.50s a 24 fps)
    # Crop centrado en la mano derecha con meñique alzado: (x=190, y=100, w=460, h=460)
    result = curator.process_sign(
        sign_name="I",
        src_file="i.mp4",
        start_frame=38,
        end_frame=97,
        crop_box=(190, 100, 460, 460)
    )
    print(f"\n[ÉXITO] Proceso finalizado para {result['sign']}: {result['frames']} frames, {result['duration']:.2f}s")

if __name__ == "__main__":
    main()
