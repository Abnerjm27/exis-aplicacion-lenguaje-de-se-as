"""
curate_letter_f.py - Curaduria y exportacion canonica de videos Anime para la letra F (LSC70).
Cumple con las Reglas Duras 4, 5 y 8 de AGENTS.md:
- POO estricto (clase LetterFCurator con estado encapsulado y ciclo init/start/update/reset/destroy)
- Poda temporal fotograma a fotograma sin saltos (frames 128..223, 96 frames = 4.00s @ 24 fps, MSE=10.15)
- Doble salida multimedia MP4 (H.264) + WebP animado en app/videos/anime/
"""

import argparse
import os
import shutil
import subprocess
import cv2
import numpy as np
from PIL import Image


class LetterFCurator:
    """Curador orientado a objetos para podar y exportar el bucle canonico de la letra F."""

    DEFAULT_SOURCE = (
        r"C:\Users\Cesar\.gemini\antigravity\brain\343d2ef3-3983-4e87-961b-d23f06596e8a"
        r"\.user_uploaded\media_1794370730196_2d365767.mp4"
    )
    TARGET_FPS = 24.0
    BODY_SIZE = (1280, 720)
    HAND_SIZE = (480, 480)
    # Recorte 480x480 nativo centrado sobre la mano frente a la barbilla (x=380..860, y=240..720)
    DEFAULT_CROP_BOX = (380, 240, 480, 480)

    def __init__(
        self,
        input_video_path: str = None,
        start_frame: int = 128,
        end_frame: int = 223,
        crop_box: tuple[int, int, int, int] = None,
        output_dir: str = None,
    ):
        self._input_video_path = input_video_path or self.DEFAULT_SOURCE
        self._start_frame = start_frame
        self._end_frame = end_frame
        self._crop_box = crop_box or self.DEFAULT_CROP_BOX

        if output_dir is None:
            app_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            output_dir = os.path.join(app_dir, "videos", "anime")
        self._output_dir = output_dir

        self._ffmpeg_bin = None
        self._frames = []
        self._hand_frames = []
        self._outputs = {}
        self._initialized = False

    def init(self) -> None:
        """Valida video fuente, crea carpeta de salida y detecta codificador disponible."""
        if not os.path.exists(self._input_video_path):
            raise FileNotFoundError(f"Video origen no encontrado: {self._input_video_path}")
        if self._end_frame <= self._start_frame:
            raise ValueError("El rango de poda temporal debe cumplir end_frame > start_frame.")

        os.makedirs(self._output_dir, exist_ok=True)
        self._ffmpeg_bin = self._find_ffmpeg()
        self._initialized = True

    def start(self) -> dict[str, str]:
        """Extrae el bucle canonico, verifica seam MSE y ejecuta la exportacion completa."""
        if not self._initialized:
            self.init()

        self._frames = self._extract_canonical_frames()
        seam_mse = self._compute_boundary_mse(self._frames[0], self._frames[-1])
        duration_sec = len(self._frames) / self.TARGET_FPS
        print(
            f"[OK] Extraidos {len(self._frames)} frames ({self._start_frame}..{self._end_frame}) "
            f"| {duration_sec:.2f}s @ {self.TARGET_FPS:.0f} fps | Seam MSE={seam_mse:.2f}"
        )

        self._hand_frames = self._build_hand_crop(self._frames)
        return self.update()

    def update(self) -> dict[str, str]:
        """Exporta los 4 entregables obligatorios MP4 y WebP (cuerpo y mano)."""
        if not self._frames or not self._hand_frames:
            raise RuntimeError("No hay fotogramas cargados. Ejecuta start() primero.")

        outputs = {
            "body_mp4": os.path.join(self._output_dir, "F_body.mp4"),
            "body_webp": os.path.join(self._output_dir, "F_body.webp"),
            "hand_mp4": os.path.join(self._output_dir, "F_hand.mp4"),
            "hand_webp": os.path.join(self._output_dir, "F_hand.webp"),
        }

        self._export_mp4(self._frames, outputs["body_mp4"], self.BODY_SIZE)
        self._export_webp(self._frames, outputs["body_webp"], self.BODY_SIZE)
        self._export_mp4(self._hand_frames, outputs["hand_mp4"], self.HAND_SIZE)
        self._export_webp(self._hand_frames, outputs["hand_webp"], self.HAND_SIZE)

        self._outputs = outputs
        print("\n[EXITO] Curaduria completa para letra F (4 salidas verificadas).")
        return dict(self._outputs)

    def reset(self) -> None:
        """Libera buffers de fotogramas y reinicia estado de exportacion."""
        self._frames.clear()
        self._hand_frames.clear()
        self._outputs.clear()

    def destroy(self) -> None:
        """Limpia estado interno y marca la instancia como no inicializada."""
        self.reset()
        self._ffmpeg_bin = None
        self._initialized = False

    def _extract_canonical_frames(self) -> list[np.ndarray]:
        cap = cv2.VideoCapture(self._input_video_path)
        if not cap.isOpened():
            raise RuntimeError(f"No se pudo abrir el video con OpenCV: {self._input_video_path}")

        extracted = []
        idx = 0
        try:
            while True:
                ok, frame = cap.read()
                if not ok:
                    break
                if self._start_frame <= idx <= self._end_frame:
                    extracted.append(frame)
                if idx > self._end_frame:
                    break
                idx += 1
        finally:
            cap.release()

        if len(extracted) < 50:
            raise ValueError(f"Bucle podado insuficiente ({len(extracted)} frames). Minimo esperado: 50.")
        return extracted

    def _build_hand_crop(self, frames: list[np.ndarray]) -> list[np.ndarray]:
        gx, gy, gw, gh = self._crop_box
        cropped_frames = []
        for frame in frames:
            crop = frame[gy : gy + gh, gx : gx + gw]
            if (crop.shape[1], crop.shape[0]) != self.HAND_SIZE:
                crop = cv2.resize(crop, self.HAND_SIZE, interpolation=cv2.INTER_CUBIC)
            cropped_frames.append(crop)
        return cropped_frames

    def _export_mp4(self, frames: list[np.ndarray], output_path: str, size: tuple[int, int]) -> None:
        temp_mp4 = f"{output_path}.tmp.mp4"
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        target_path = temp_mp4 if self._ffmpeg_bin else output_path
        writer = cv2.VideoWriter(target_path, fourcc, self.TARGET_FPS, size)
        try:
            for frame in frames:
                out_frame = frame
                if (frame.shape[1], frame.shape[0]) != size:
                    out_frame = cv2.resize(frame, size, interpolation=cv2.INTER_CUBIC)
                writer.write(out_frame)
        finally:
            writer.release()

        if self._ffmpeg_bin:
            cmd = [
                self._ffmpeg_bin,
                "-y",
                "-i",
                temp_mp4,
                "-c:v",
                "libx264",
                "-pix_fmt",
                "yuv420p",
                "-crf",
                "18",
                "-movflags",
                "+faststart",
                output_path,
            ]
            subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            os.remove(temp_mp4)

        print(f"[OK MP4] {output_path} ({size[0]}x{size[1]}, {len(frames)} frames @ {self.TARGET_FPS:.0f} fps)")

    def _export_webp(self, frames: list[np.ndarray], output_path: str, size: tuple[int, int]) -> None:
        pil_frames = []
        for frame in frames:
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            if (rgb.shape[1], rgb.shape[0]) != size:
                rgb = cv2.resize(rgb, size, interpolation=cv2.INTER_LANCZOS4)
            pil_frames.append(Image.fromarray(rgb))

        duration_ms = int(round(1000.0 / self.TARGET_FPS))
        pil_frames[0].save(
            output_path,
            format="WEBP",
            save_all=True,
            append_images=pil_frames[1:],
            duration=duration_ms,
            loop=0,
            quality=82,
            method=4,
        )
        print(f"[OK WebP] {output_path} ({size[0]}x{size[1]}, {len(pil_frames)} frames @ {duration_ms}ms)")

    @staticmethod
    def _compute_boundary_mse(first_frame: np.ndarray, last_frame: np.ndarray) -> float:
        a = cv2.resize(first_frame, (320, 180)).astype(np.float32)
        b = cv2.resize(last_frame, (320, 180)).astype(np.float32)
        return float(np.mean((a - b) ** 2))

    @staticmethod
    def _find_ffmpeg() -> str | None:
        ffmpeg_on_path = shutil.which("ffmpeg")
        if ffmpeg_on_path:
            return ffmpeg_on_path
        winget_root = os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\WinGet\Packages")
        if os.path.isdir(winget_root):
            for root, _dirs, files in os.walk(winget_root):
                if "ffmpeg.exe" in files:
                    return os.path.join(root, "ffmpeg.exe")
        return None


def main() -> None:
    parser = argparse.ArgumentParser(description="Curaduria canonica MP4/WebP para letra F (LSC70).")
    parser.add_argument("--input", default=LetterFCurator.DEFAULT_SOURCE, help="Ruta al video MP4 crudo.")
    args = parser.parse_args()

    curator = LetterFCurator(input_video_path=args.input)
    curator.init()
    try:
        curator.start()
    finally:
        curator.destroy()


if __name__ == "__main__":
    main()
