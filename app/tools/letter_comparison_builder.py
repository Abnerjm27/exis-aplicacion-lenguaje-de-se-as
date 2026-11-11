"""
letter_comparison_builder.py - Generador POO de comparativas visuales lado a lado (LSC70 vs Anime IA).
Cumple con la Regla 8 de AGENTS.md (POO estricto, encapsulacion y ciclo de vida).
"""

import os
import sys
from PIL import Image, ImageDraw, ImageFont


class LetterComparisonBuilder:
    """Construye imagenes comparativas lado a lado entre foto real LSC70 y referencia anime."""

    IMAGE_EXTENSIONS = (".png", ".jpg", ".jpeg", ".webp")
    DEFAULT_HEIGHT = 720
    FOOTER_HEIGHT = 60
    FOOTER_BG = (29, 20, 14)
    REAL_TEXT_COLOR = (232, 228, 220)
    ANIME_TEXT_COLOR = (0, 168, 255)

    def __init__(self, repo_root: str = None):
        if repo_root is None:
            tools_dir = os.path.dirname(os.path.abspath(__file__))
            app_dir = os.path.dirname(tools_dir)
            repo_root = os.path.dirname(app_dir)
        self._repo_root = repo_root
        self._samples_dir = os.path.join(repo_root, "app", "dataset_samples")
        self._refs_dir = os.path.join(repo_root, "referencias_para_gemini")
        self._font = None
        self._initialized = False
        self._generated_paths = []

    def init(self) -> None:
        """Inicializa tipografia y valida directorios requeridos."""
        font_candidates = [
            r"C:\Windows\Fonts\consola.ttf",
            r"C:\Windows\Fonts\lucon.ttf",
            r"C:\Windows\Fonts\segoeui.ttf",
        ]
        for candidate in font_candidates:
            if os.path.exists(candidate):
                self._font = ImageFont.truetype(candidate, 30)
                break
        if self._font is None:
            self._font = ImageFont.load_default()

        os.makedirs(self._samples_dir, exist_ok=True)
        self._initialized = True

    def start(self, letters: list[str]) -> list[str]:
        """Genera las comparativas para la lista de letras indicada."""
        if not self._initialized:
            self.init()
        for letter in letters:
            self.update(letter)
        return list(self._generated_paths)

    def update(self, letter: str) -> str:
        """Genera o actualiza la comparativa PNG para una letra especifica."""
        if not self._initialized:
            self.init()

        letter_upper = letter.strip().upper()
        real_path = self._resolve_image_path(self._samples_dir, letter_upper, (".jpg", ".png", ".jpeg", ".webp"))
        anime_path = self._resolve_image_path(self._refs_dir, f"{letter_upper}_anime_generada", self.IMAGE_EXTENSIONS)
        out_path = os.path.join(self._samples_dir, f"comparacion_{letter_upper}.png")

        if real_path is None:
            raise FileNotFoundError(f"No existe foto real para '{letter_upper}' en {self._samples_dir}")
        if anime_path is None:
            raise FileNotFoundError(f"No existe imagen anime '{letter_upper}_anime_generada.*' en {self._refs_dir}")

        with Image.open(real_path) as real_img_raw, Image.open(anime_path) as anime_img_raw:
            real_img = self._resize_to_height(real_img_raw.convert("RGB"), self.DEFAULT_HEIGHT)
            anime_img = self._resize_to_height(anime_img_raw.convert("RGB"), self.DEFAULT_HEIGHT)

            total_w = real_img.width + anime_img.width
            total_h = self.DEFAULT_HEIGHT + self.FOOTER_HEIGHT
            canvas = Image.new("RGB", (total_w, total_h), self.FOOTER_BG)

            canvas.paste(real_img, (0, 0))
            canvas.paste(anime_img, (real_img.width, 0))

            draw = ImageDraw.Draw(canvas)
            text_y = self.DEFAULT_HEIGHT + 14
            draw.text(
                (28, text_y),
                f"Dataset LSC70 Real – Letra {letter_upper}",
                fill=self.REAL_TEXT_COLOR,
                font=self._font,
            )
            draw.text(
                (real_img.width + 28, text_y),
                f"Anime IA (Sol) – Letra {letter_upper}",
                fill=self.ANIME_TEXT_COLOR,
                font=self._font,
            )

            canvas.save(out_path, format="PNG")

        self._generated_paths.append(out_path)
        print(f"[OK] Comparativa generada: {out_path} ({total_w}x{total_h})")
        return out_path

    def reset(self) -> None:
        """Limpia el registro de salidas generadas en la sesion."""
        self._generated_paths.clear()

    def destroy(self) -> None:
        """Libera recursos internos del generador."""
        self.reset()
        self._font = None
        self._initialized = False

    @staticmethod
    def _resolve_image_path(directory: str, stem: str, extensions: tuple[str, ...]) -> str | None:
        """Resuelve la primera ruta de imagen existente para el nombre base dado."""
        for ext in extensions:
            candidate = os.path.join(directory, f"{stem}{ext}")
            if os.path.exists(candidate):
                return candidate
        return None

    @staticmethod
    def _resize_to_height(image: Image.Image, target_height: int) -> Image.Image:
        ratio = target_height / float(image.height)
        target_width = int(round(image.width * ratio))
        return image.resize((target_width, target_height), Image.Resampling.LANCZOS)


if __name__ == "__main__":
    target_letters = sys.argv[1:] if len(sys.argv) > 1 else ["F", "G", "H", "J", "K"]
    builder = LetterComparisonBuilder()
    builder.init()
    try:
        builder.start(target_letters)
    finally:
        builder.destroy()
