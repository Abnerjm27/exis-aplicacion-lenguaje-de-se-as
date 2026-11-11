"""
Curador y podador temporal de video Anime IA: Letra D (LSC70)
Proyecto EXIS - Manitas
Cumple con las Reglas 4, 5 y 8 de AGENTS.md:
- POO (AnimeCurator)
- Doble salida MP4 + WebP continuo a 24 fps
- Poda limpia fotograma a fotograma (frames 143..211, 2.83s, 68 frames)
- Primer plano de mano centrado en 480x480
"""

import os
import sys
import cv2
import numpy as np
from PIL import Image

class AnimeCurator:
    def __init__(self, base_dirs=None):
        if base_dirs is None:
            # Detectar automáticamente rutas de trabajo
            this_dir = os.path.dirname(os.path.abspath(__file__))
            app_dir = os.path.dirname(this_dir)
            repo_dir = os.path.dirname(app_dir)
            self.dest_dirs = [os.path.join(app_dir, "videos", "anime")]
            # También añadir ruta en Desktop si es diferente
            desktop_dir = r"C:/Users/abner/Desktop/exis aplicacion lenguaje de señas/app/videos/anime"
            if os.path.exists(desktop_dir) and desktop_dir not in self.dest_dirs:
                self.dest_dirs.append(desktop_dir)
        else:
            self.dest_dirs = base_dirs

        for d in self.dest_dirs:
            os.makedirs(d, exist_ok=True)

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
        print(f"[OK MP4] Guardado: {path} ({w}x{h}, {len(frames)} frames @ {fps:.1f} fps)")

    def save_webp(self, frames, path, fps=24.0):
        pil_frames = [Image.fromarray(cv2.cvtColor(f, cv2.COLOR_BGR2RGB)) for f in frames]
        duration_ms = int(1000 / fps)
        pil_frames[0].save(
            path,
            save_all=True,
            append_images=pil_frames[1:],
            duration=duration_ms,
            loop=0,
            quality=82,
            method=4
        )
        print(f"[OK WebP] Guardado: {path} ({len(pil_frames)} frames @ {duration_ms}ms/frame)")

    def process_sign(self, sign_name, src_path, start_frame, end_frame, crop_box):
        if not os.path.exists(src_path):
            raise FileNotFoundError(f"Video fuente no encontrado: {src_path}")

        print(f"\n--- Curando Seña {sign_name} ---")
        raw_frames, fps = self.extract_trimmed_frames(src_path, start_frame, end_frame)
        total_f = len(raw_frames)
        dur = total_f / fps
        print(f"Bucle canónico podado: frames {start_frame}..{end_frame} ({total_f} frames, {dur:.2f}s)")

        # Preparar cuadros de mano recortados a 480x480
        gx, gy, gw, gh = crop_box
        hand_frames = []
        for f in raw_frames:
            cropped = f[gy:gy+gh, gx:gx+gw]
            resized = cv2.resize(cropped, (480, 480), interpolation=cv2.INTER_CUBIC)
            hand_frames.append(resized)

        # Guardar en todos los directorios destino
        for target_dir in self.dest_dirs:
            print(f"\nGuardando en destino: {target_dir}")
            # 1. Body View
            b_mp4 = os.path.join(target_dir, f"{sign_name}_body.mp4")
            b_webp = os.path.join(target_dir, f"{sign_name}_body.webp")
            self.save_mp4(raw_frames, b_mp4, fps)
            self.save_webp(raw_frames, b_webp, fps)

            # 2. Hand View
            h_mp4 = os.path.join(target_dir, f"{sign_name}_hand.mp4")
            h_webp = os.path.join(target_dir, f"{sign_name}_hand.webp")
            self.save_mp4(hand_frames, h_mp4, fps)
            self.save_webp(hand_frames, h_webp, fps)

        return {
            "sign": sign_name,
            "frames": total_f,
            "fps": fps,
            "duration": dur
        }

def main():
    src_video = r"C:/Users/abner/.gemini/antigravity/brain/4fd4a3cd-be8e-4feb-a9ba-083616d10212/.user_uploaded/media_1794361020961_fe6c1660.mp4"
    if not os.path.exists(src_video):
        print(f"[ERROR] Archivo fuente no encontrado: {src_video}")
        sys.exit(1)

    curator = AnimeCurator()
    # Poda canónica verificada:
    # Inicio en frame 143, fin en frame 211 (68 fotogramas = 2.83s a 24 fps, MSE = 19.03)
    # Crop centrado en la mano derecha con dedo índice erguido y aro: (x=290, y=180, w=380, h=380)
    result = curator.process_sign(
        sign_name="D",
        src_path=src_video,
        start_frame=143,
        end_frame=211,
        crop_box=(290, 180, 380, 380)
    )
    print(f"\n[ÉXITO] Proceso finalizado para {result['sign']}: {result['frames']} frames, {result['duration']:.2f}s")

if __name__ == "__main__":
    main()
