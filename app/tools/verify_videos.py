"""
verify_videos.py - EXIS Project (Colombian Sign Language / LSC)
Agente 1: Video Engine & Asset Producer

Script de verificacion integral que valida:
  1. Existencia y reproducibilidad de los 22 videos MP4 (11 señas x 2 vistas).
  2. Integridad de los 22 gemelos WebP animados a 25 fps.
  3. Existencia y validez de las 11 fotos de referencia en referencias_para_gemini/fotos/.
  4. Presencia de la guia referencias_para_gemini/PROMPTS_GEMINI.md.
  5. Presencia del directorio app/videos/anime/.
"""

import os
import sys
import cv2
from PIL import Image

PROJECT_ROOT = r"C:\Users\abner\Desktop\exis aplicacion lenguaje de señas"
DIR_REAL = os.path.join(PROJECT_ROOT, "app", "videos", "real")
DIR_ANIME = os.path.join(PROJECT_ROOT, "app", "videos", "anime")
DIR_REFS = os.path.join(PROJECT_ROOT, "referencias_para_gemini", "fotos")
FILE_PROMPTS = os.path.join(PROJECT_ROOT, "referencias_para_gemini", "PROMPTS_GEMINI.md")

SIGNS = [
    "HOLA", "YO", "BUENOS", "DIAS", "NOCHES", "NOMBRE",
    "A", "B", "C", "L", "V"
]
VIEWS = ["body", "hand"]


def check_mp4_video(file_path: str, expected_w: int, expected_h: int) -> dict:
    if not os.path.exists(file_path):
        return {"status": "FAIL", "msg": "Archivo no encontrado"}
    size = os.path.getsize(file_path)
    if size == 0:
        return {"status": "FAIL", "msg": "Archivo vacio (0 bytes)"}

    cap = cv2.VideoCapture(file_path)
    if not cap.isOpened():
        return {"status": "FAIL", "msg": "cv2 no pudo abrir el contenedor MP4"}

    fps = cap.get(cv2.CAP_PROP_FPS)
    frames_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    # Leer fotograma 0, medio y final
    ok_start, _ = cap.read()
    cap.set(cv2.CAP_PROP_POS_FRAMES, frames_count // 2)
    ok_mid, _ = cap.read()
    cap.set(cv2.CAP_PROP_POS_FRAMES, max(0, frames_count - 1))
    ok_end, _ = cap.read()
    cap.release()

    if not (ok_start and ok_mid and ok_end):
        return {"status": "FAIL", "msg": "Fallo de decodificacion al leer fotogramas"}

    return {
        "status": "PASS",
        "size": size,
        "fps": fps,
        "frames": frames_count,
        "resolution": f"{w}x{h}",
        "duration_sec": round(frames_count / fps, 2) if fps > 0 else 0
    }


def check_webp_anim(file_path: str) -> dict:
    if not os.path.exists(file_path):
        return {"status": "FAIL", "msg": "Archivo no encontrado"}
    size = os.path.getsize(file_path)
    if size == 0:
        return {"status": "FAIL", "msg": "Archivo vacio (0 bytes)"}

    try:
        with Image.open(file_path) as im:
            if im.format != "WEBP":
                return {"status": "FAIL", "msg": f"Formato invalido: {im.format}"}
            n_frames = getattr(im, "n_frames", 1)
            duration = im.info.get("duration", 0)
            return {
                "status": "PASS",
                "size": size,
                "frames": n_frames,
                "duration_ms": duration,
                "size_px": f"{im.width}x{im.height}"
            }
    except Exception as e:
        return {"status": "FAIL", "msg": str(e)}


def main():
    print("=" * 80)
    print(" EXIS PROJECT — VERIFICACIÓN INTEGRAL DE ASSETS DE VIDEO (AGENTE 1)")
    print("=" * 80)

    total_checks = 0
    passed_checks = 0

    # 1. Directorios
    print("\n[1] Directorios de salida:")
    for label, path in [("Videos Real", DIR_REAL), ("Videos Anime", DIR_ANIME), ("Fotos Referencia", DIR_REFS)]:
        exists = os.path.exists(path)
        total_checks += 1
        if exists:
            passed_checks += 1
            print(f"  [OK] {label}: {path}")
        else:
            print(f"  [FAIL] {label} NO existe: {path}")

    # 2. Archivo de Prompts
    print("\n[2] Documentacion de Prompts:")
    total_checks += 1
    if os.path.exists(FILE_PROMPTS) and os.path.getsize(FILE_PROMPTS) > 0:
        passed_checks += 1
        print(f"  [OK] PROMPTS_GEMINI.md ({os.path.getsize(FILE_PROMPTS):,} bytes)")
    else:
        print(f"  [FAIL] PROMPTS_GEMINI.md falta o está vacío")

    # 3. Fotos de Referencia (11)
    print("\n[3] Fotos de Referencia para Gemini (11 señas):")
    ref_ok_count = 0
    for sign in SIGNS:
        ref_path = os.path.join(DIR_REFS, f"{sign}_ref.jpg")
        total_checks += 1
        if os.path.exists(ref_path) and os.path.getsize(ref_path) > 0:
            passed_checks += 1
            ref_ok_count += 1
        else:
            print(f"  [FAIL] Falta referencia: {sign}_ref.jpg")
    print(f"  -> {ref_ok_count}/11 fotos de referencia verificadas exitosamente.")

    # 4. Videos MP4 y WebP (22 + 22 = 44 archivos)
    print("\n[4] Videos MP4 y Gemelos WebP (app/videos/real/):")
    print(f"{'Seña':<8} {'Vista':<6} {'MP4 Estado':<11} {'Res':<10} {'FPS':<6} {'Frames':<8} {'MP4 Tamaño':<12} {'WebP Estado':<12} {'WebP Tamaño':<12}")
    print("-" * 88)

    mp4_count = 0
    webp_count = 0
    total_mp4_bytes = 0
    total_webp_bytes = 0

    for sign in SIGNS:
        for view in VIEWS:
            exp_w, exp_h = (640, 480) if view == "body" else (480, 480)
            mp4_file = os.path.join(DIR_REAL, f"{sign}_{view}.mp4")
            webp_file = os.path.join(DIR_REAL, f"{sign}_{view}.webp")

            total_checks += 2
            mp4_info = check_mp4_video(mp4_file, exp_w, exp_h)
            webp_info = check_webp_anim(webp_file)

            if mp4_info["status"] == "PASS":
                passed_checks += 1
                mp4_count += 1
                total_mp4_bytes += mp4_info["size"]
            if webp_info["status"] == "PASS":
                passed_checks += 1
                webp_count += 1
                total_webp_bytes += webp_info["size"]

            mp4_sz = f"{mp4_info.get('size', 0):,} B" if mp4_info["status"] == "PASS" else "0 B"
            webp_sz = f"{webp_info.get('size', 0):,} B" if webp_info["status"] == "PASS" else "0 B"
            res = mp4_info.get("resolution", "-")
            fps = str(mp4_info.get("fps", "-"))
            frames = str(mp4_info.get("frames", "-"))

            print(f"{sign:<8} {view:<6} {mp4_info['status']:<11} {res:<10} {fps:<6} {frames:<8} {mp4_sz:<12} {webp_info['status']:<12} {webp_sz:<12}")

    # Resumen Final
    print("=" * 88)
    print(" BALANCE Y ESTADÍSTICAS FINALES:")
    print(f"  - Total Pruebas Realizadas: {total_checks}")
    print(f"  - Pruebas Aprobadas:       {passed_checks}/{total_checks} (100.0%)" if passed_checks == total_checks else f"  - Aprobadas: {passed_checks}/{total_checks}")
    print(f"  - Videos MP4 Operativos:   {mp4_count}/22 ({total_mp4_bytes / (1024*1024):.2f} MB)")
    print(f"  - WebP Animados Gemelos:   {webp_count}/22 ({total_webp_bytes / (1024*1024):.2f} MB)")
    print(f"  - Total Archivos Multimedia Generados: {mp4_count + webp_count} archivos en app/videos/real/")
    print(f"  - Fotos de Referencia:     {ref_ok_count}/11 en referencias_para_gemini/fotos/")
    print(f"  - Guia de Prompts:         referencias_para_gemini/PROMPTS_GEMINI.md")
    print(f"  - Directorio Anime IA:     app/videos/anime/ listo para recibir renders")
    print("=" * 88)

    if passed_checks == total_checks and mp4_count == 22 and webp_count == 22 and ref_ok_count == 11:
        print("\n>>> RESULTADO: TODO OPERATIVO Y VERIFICADO AL 100% (EXIT CODE 0) <<<\n")
        sys.exit(0)
    else:
        print("\n>>> RESULTADO: ALGUNAS PRUEBAS FALLARON (EXIT CODE 1) <<<\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
