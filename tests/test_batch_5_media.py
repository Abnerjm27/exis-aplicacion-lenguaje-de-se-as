import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VIDEOS_DIR = os.path.join(BASE_DIR, "app", "videos", "real")
SAMPLES_DIR = os.path.join(BASE_DIR, "app", "dataset_samples")
FOTOS_DIR = os.path.join(BASE_DIR, "referencias_para_gemini", "fotos")

TARGET_SIGNS = ["ANNOS", "LICOR", "D", "E", "U"]

def test_media_assets():
    missing = []
    for sign in TARGET_SIGNS:
        # 1. Samples
        sample_path = os.path.join(SAMPLES_DIR, f"{sign}.jpg")
        foto_path = os.path.join(FOTOS_DIR, f"{sign}_ref.jpg")
        if not os.path.exists(sample_path) or os.path.getsize(sample_path) == 0:
            missing.append(f"Sample: {sample_path}")
        if not os.path.exists(foto_path) or os.path.getsize(foto_path) == 0:
            missing.append(f"Foto ref: {foto_path}")

        # 2. Videos: body.mp4, body.webp, hand.mp4, hand.webp
        for part in ["body", "hand"]:
            for ext in ["mp4", "webp"]:
                vpath = os.path.join(VIDEOS_DIR, f"{sign}_{part}.{ext}")
                if not os.path.exists(vpath) or os.path.getsize(vpath) < 1000:
                    missing.append(f"Video: {vpath}")

    if missing:
        print(f"FAILED: Faltan {len(missing)} archivos multimedia:\n" + "\n".join(missing[:10]))
        sys.exit(1)
    else:
        print(f"PASSED: Todos los 20 videos y 10 muestras de referencia existen y son válidos.")

if __name__ == "__main__":
    test_media_assets()
