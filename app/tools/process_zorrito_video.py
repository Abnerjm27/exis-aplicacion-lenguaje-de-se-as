"""
=============================================================================
EXIS · Manitas LSC · Procesador y Curador Multimedia de Mascota Zorrito
Herramienta POO para extracción de croma verde, despill, centrado dinámico
y exportación dual ultraliviana (WebP animado + WebM VP9 con canal alfa).
=============================================================================
"""

import os
import shutil
import subprocess
import cv2
import numpy as np
from PIL import Image


class ZorritoVideoProcessor:
    """Procesador de video con extracción de canal alfa y exportación optimizada para web."""

    def __init__(self, target_size: int = 320, fps: int = 24):
        self.target_size = target_size
        self.fps = fps
        # Rango de croma verde en espacio de color HSV (OpenCV: H 0-180)
        self.lower_green = np.array([42, 80, 70], dtype=np.uint8)
        self.upper_green = np.array([78, 255, 255], dtype=np.uint8)

    def extract_frames(self, video_path: str, start_frame: int, end_frame: int) -> list[np.ndarray]:
        """Extrae fotogramas crudos BGR de un intervalo específico."""
        cap = cv2.VideoCapture(video_path)
        cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)
        frames = []
        for _ in range(start_frame, end_frame):
            ret, frame = cap.read()
            if not ret:
                break
            frames.append(frame)
        cap.release()
        return frames

    def compute_bounding_box(self, frames: list[np.ndarray], pad: int = 24) -> tuple[int, int, int, int]:
        """Calcula el bounding box cuadrado envolvente para todos los frames del clip."""
        ymin_all, ymax_all = 9999, 0
        xmin_all, xmax_all = 9999, 0

        for frame in frames:
            hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
            mask = cv2.inRange(hsv, self.lower_green, self.upper_green)
            non_green = mask == 0
            y_idx, x_idx = np.where(non_green)
            if len(y_idx) > 0:
                ymin_all = min(ymin_all, int(y_idx.min()))
                ymax_all = max(ymax_all, int(y_idx.max()))
                xmin_all = min(xmin_all, int(x_idx.min()))
                xmax_all = max(xmax_all, int(x_idx.max()))

        h_img, w_img = frames[0].shape[:2]
        bw = (xmax_all - xmin_all) + 2 * pad
        bh = (ymax_all - ymin_all) + 2 * pad
        side = max(bw, bh)
        cx = (xmin_all + xmax_all) // 2
        cy = (ymin_all + ymax_all) // 2

        x1 = max(0, cx - side // 2)
        y1 = max(0, cy - side // 2)
        x2 = min(w_img, x1 + side)
        y2 = min(h_img, y1 + side)
        return x1, y1, x2, y2

    def process_frame(self, frame: np.ndarray, bbox: tuple[int, int, int, int]) -> np.ndarray:
        """Aplica recorte, chroma keying, despill antialias y genera BGRA."""
        x1, y1, x2, y2 = bbox
        crop = frame[y1:y2, x1:x2]

        hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
        green_mask = cv2.inRange(hsv, self.lower_green, self.upper_green)

        # Canal alfa suave con suavizado gaussiano en bordes
        alpha = 255 - green_mask
        alpha = cv2.GaussianBlur(alpha, (3, 3), 0)

        # Despill de verde residual en pelaje y bordes (reemplazar por max(R, B))
        b = crop[:, :, 0]
        g = crop[:, :, 1]
        r = crop[:, :, 2]
        max_rb = np.maximum(r, b)
        despilled_g = np.where(g > max_rb, max_rb, g)

        bgra = cv2.merge([b, despilled_g, r, alpha])
        return cv2.resize(bgra, (self.target_size, self.target_size), interpolation=cv2.INTER_AREA)

    def export_clip(self, clip_name: str, bgra_frames: list[np.ndarray], out_dir: str) -> dict[str, str]:
        """Exporta el clip tanto a WebP animado como a WebM VP9 con canal alfa nativo."""
        os.makedirs(out_dir, exist_ok=True)
        # Usar un directorio temporal seguro sin caracteres especiales si fuera necesario
        temp_dir = os.path.join(out_dir, f"_temp_{clip_name}")
        os.makedirs(temp_dir, exist_ok=True)

        # Guardar frames temporales como PNG con soporte Unicode seguro
        for idx, frame in enumerate(bgra_frames):
            frame_path = os.path.join(temp_dir, f"frame_{idx:04d}.png")
            success, enc = cv2.imencode(".png", frame)
            if success:
                with open(frame_path, "wb") as f_out:
                    f_out.write(enc)

        webp_path = os.path.join(out_dir, f"{clip_name}.webp")
        webm_path = os.path.join(out_dir, f"{clip_name}.webm")

        # 1. Exportar WebP animado con FFmpeg (ejecutando en temp_dir para evitar problemas de ruta Unicode)
        cmd_webp = [
            "ffmpeg", "-y",
            "-framerate", str(self.fps),
            "-i", "frame_%04d.png",
            "-vcodec", "libwebp",
            "-lossless", "0",
            "-q:v", "72",
            "-loop", "0",
            "-an",
            os.path.abspath(webp_path)
        ]
        subprocess.run(cmd_webp, cwd=temp_dir, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        # 2. Exportar WebM con codec VP9 y canal alfa yuva420p
        cmd_webm = [
            "ffmpeg", "-y",
            "-framerate", str(self.fps),
            "-i", "frame_%04d.png",
            "-c:v", "libvpx-vp9",
            "-pix_fmt", "yuva420p",
            "-b:v", "350k",
            "-auto-alt-ref", "0",
            "-an",
            os.path.abspath(webm_path)
        ]
        subprocess.run(cmd_webm, cwd=temp_dir, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        # Limpiar directorio temporal
        shutil.rmtree(temp_dir, ignore_errors=True)

        webp_kb = os.path.getsize(webp_path) / 1024
        webm_kb = os.path.getsize(webm_path) / 1024
        print(f"  [OK] {clip_name}: WebP={webp_kb:.1f} KB, WebM={webm_kb:.1f} KB")

        return {"webp": webp_path, "webm": webm_path}

    def process_and_export(
        self, video_path: str, start_frame: int, end_frame: int, clip_name: str, out_dir: str
    ) -> dict[str, str]:
        """Flujo completo para procesar y exportar un clip."""
        print(f"Procesando clip '{clip_name}' (frames {start_frame} a {end_frame})...")
        raw_frames = self.extract_frames(video_path, start_frame, end_frame)
        if not raw_frames:
            raise ValueError(f"No se pudieron extraer frames para {clip_name}")

        bbox = self.compute_bounding_box(raw_frames)
        bgra_frames = [self.process_frame(f, bbox) for f in raw_frames]
        return self.export_clip(clip_name, bgra_frames, out_dir)


def main():
    """Punto de entrada de consola para curaduría de animaciones de Zorrito."""
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    raw_dir = os.path.join(base_dir, "videos", "zorrito_raw")
    out_dir = os.path.join(base_dir, "img", "zorrito")

    v1 = os.path.join(raw_dir, "gemini_zorrito_seq_1.mp4")
    v2 = os.path.join(raw_dir, "gemini_zorrito_seq_2.mp4")

    processor = ZorritoVideoProcessor(target_size=320, fps=24)

    # Definición de clips curados pedagógicos
    clips = [
        # De Video 1:
        {"video": v1, "start": 0, "end": 64, "name": "zorrito_idle"},
        {"video": v1, "start": 72, "end": 144, "name": "zorrito_curioso"},
        {"video": v1, "start": 196, "end": 240, "name": "zorrito_celebracion"},
        # De Video 2:
        {"video": v2, "start": 72, "end": 144, "name": "zorrito_feliz"},
        {"video": v2, "start": 144, "end": 216, "name": "zorrito_atento"},
    ]

    print("=== INICIANDO PROCESAMIENTO MULTIMEDIA DE MASCOTA ZORRITO ===")
    for clip in clips:
        if os.path.exists(clip["video"]):
            processor.process_and_export(
                clip["video"], clip["start"], clip["end"], clip["name"], out_dir
            )
        else:
            print(f"Error: No existe el video fuente {clip['video']}")

    print("=== PROCESAMIENTO COMPLETADO EXITOSAMENTE ===")


if __name__ == "__main__":
    main()
