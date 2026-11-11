"""
curate_letter_e.py - Curaduría y exportación canónica de videos Anime para la letra E (LSC70)
Cumple con las Reglas Duras de AGENTS.md:
- POO estricto (Clase LetterECurator con métodos de ciclo de vida)
- Doble salida MP4 + WebP a 24 fps
- Sincronización en worktree y repositorio del escritorio
"""

import os
import shutil
import cv2
import numpy as np
from PIL import Image


class LetterECurator:
    """
    Curador orientado a objetos para procesar, podar y exportar
    el bucle canónico del video Anime de la letra E.
    """

    def __init__(self, input_video_path: str, start_frame: int = 82, end_frame: int = 139):
        self.input_video_path = input_video_path
        self.start_frame = start_frame
        self.end_frame = end_frame
        self.fps = 24.0
        self.target_dirs = [
            os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "videos", "anime"),
            r"C:\Users\abner\Desktop\exis aplicacion lenguaje de señas\app\videos\anime"
        ]

    def extract_canonical_frames(self):
        """Extrae el bucle continuo podado de fotogramas."""
        if not os.path.exists(self.input_video_path):
            raise FileNotFoundError(f"Video origen no encontrado: {self.input_video_path}")

        cap = cv2.VideoCapture(self.input_video_path)
        frames = []
        frame_idx = 0

        while True:
            ret, frame = cap.read()
            if not ret:
                break
            if self.start_frame <= frame_idx <= self.end_frame:
                frames.append(frame)
            frame_idx += 1

        cap.release()
        print(f"[OK] Extraídos {len(frames)} fotogramas canónicos ({self.start_frame}..{self.end_frame}) a {self.fps} fps.")
        return frames

    def export_mp4(self, frames, output_path: str, size: tuple):
        """Exporta secuencia de fotogramas a MP4 h264/mp4v."""
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_path, fourcc, self.fps, size)
        for f in frames:
            if (f.shape[1], f.shape[0]) != size:
                f = cv2.resize(f, size)
            out.write(f)
        out.release()
        print(f"[OK MP4] Guardado: {output_path} ({size[0]}x{size[1]}, {len(frames)} frames @ {self.fps} fps)")

    def export_webp(self, frames, output_path: str, size: tuple):
        """Exporta secuencia de fotogramas a WebP animado sin pérdida perceptible."""
        pil_images = []
        for f in frames:
            rgb = cv2.cvtColor(f, cv2.COLOR_BGR2RGB)
            if (f.shape[1], f.shape[0]) != size:
                rgb = cv2.resize(rgb, size)
            pil_images.append(Image.fromarray(rgb))

        duration_ms = int(1000 / self.fps)
        pil_images[0].save(
            output_path,
            format="WEBP",
            save_all=True,
            append_images=pil_images[1:],
            duration=duration_ms,
            loop=0,
            quality=85,
            method=4
        )
        print(f"[OK WebP] Guardado: {output_path} ({len(frames)} frames @ {duration_ms}ms/frame)")

    def run(self):
        """Ejecuta el pipeline completo de curaduría para cuerpo y mano."""
        frames = self.extract_canonical_frames()
        if not frames:
            raise ValueError("No se pudieron extraer fotogramas del bucle canónico.")

        # Recorte de mano centrado (480x480)
        # Bounding box validada: y: 100..580, x: 230..710
        hand_frames = [f[100:580, 230:710] for f in frames]

        primary_dir = self.target_dirs[0]
        os.makedirs(primary_dir, exist_ok=True)

        body_mp4 = os.path.join(primary_dir, "E_body.mp4")
        body_webp = os.path.join(primary_dir, "E_body.webp")
        hand_mp4 = os.path.join(primary_dir, "E_hand.mp4")
        hand_webp = os.path.join(primary_dir, "E_hand.webp")

        print("\n--- Generando archivos primarios para E ---")
        self.export_mp4(frames, body_mp4, (1280, 720))
        self.export_webp(frames, body_webp, (1280, 720))
        self.export_mp4(hand_frames, hand_mp4, (480, 480))
        self.export_webp(hand_frames, hand_webp, (480, 480))

        # Sincronizar con repositorios de destino adicionales
        for target_dir in self.target_dirs[1:]:
            if os.path.exists(os.path.dirname(target_dir)):
                os.makedirs(target_dir, exist_ok=True)
                print(f"\n--- Sincronizando con {target_dir} ---")
                for fname in ["E_body.mp4", "E_body.webp", "E_hand.mp4", "E_hand.webp"]:
                    src = os.path.join(primary_dir, fname)
                    dst = os.path.join(target_dir, fname)
                    shutil.copyfile(src, dst)
                    print(f"[OK SYNC] {fname} -> {target_dir}")

        print("\n[ÉXITO TOTAL] Curaduría y exportación de la letra E finalizada correctamente.")


if __name__ == "__main__":
    uploaded_video = r"C:/Users/abner/.gemini/antigravity/brain/4fd4a3cd-be8e-4feb-a9ba-083616d10212/.user_uploaded/media_1794362762286_2f331114.mp4"
    curator = LetterECurator(uploaded_video, start_frame=82, end_frame=139)
    curator.run()
