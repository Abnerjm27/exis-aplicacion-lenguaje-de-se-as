import os
import cv2
import numpy as np
from PIL import Image

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
LSC_DIR = os.path.join(BASE_DIR, "LSC70", "LSC70")
VIDEOS_DIR = os.path.join(BASE_DIR, "app", "videos", "real")
SAMPLES_DIR = os.path.join(BASE_DIR, "app", "dataset_samples")
GEMINI_FOTOS_DIR = os.path.join(BASE_DIR, "referencias_para_gemini", "fotos")

os.makedirs(VIDEOS_DIR, exist_ok=True)
os.makedirs(SAMPLES_DIR, exist_ok=True)
os.makedirs(GEMINI_FOTOS_DIR, exist_ok=True)

FPS = 25
TOTAL_FRAMES = 50

NEW_SIGNS = {
    "TARDES": {
        "type": "word",
        "body_dir": os.path.join(LSC_DIR, "LSC70W", "Per01", "TARDES"),
        "hand_crop": (180, 180, 280, 280) # (x, y, w, h) in 640x480
    },
    "GUSTAR": {
        "type": "word",
        "body_dir": os.path.join(LSC_DIR, "LSC70W", "Per01", "GUSTAR"),
        "hand_crop": (220, 160, 220, 220)
    },
    "I": {
        "type": "letter",
        "body_dir": os.path.join(LSC_DIR, "LSC70AN", "Per01", "I"),
        "hand_dir": os.path.join(LSC_DIR, "LSC70ANH", "Per01", "I")
    },
    "O": {
        "type": "letter",
        "body_dir": os.path.join(LSC_DIR, "LSC70AN", "Per01", "O"),
        "hand_dir": os.path.join(LSC_DIR, "LSC70ANH", "Per01", "O")
    }
}

def cv2_imread(path):
    try:
        data = np.fromfile(path, dtype=np.uint8)
        return cv2.imdecode(data, cv2.IMREAD_COLOR)
    except Exception:
        return None

def cv2_imwrite(path, img):
    ext = os.path.splitext(path)[1]
    res, buf = cv2.imencode(ext, img)
    if res:
        with open(path, 'wb') as f:
            buf.tofile(f)
        return True
    return False

def load_keyframes(folder):
    frames = []
    for i in range(6):
        path = os.path.join(folder, f"{os.path.basename(os.path.dirname(folder))}_{os.path.basename(folder)}_{i}.jpg")
        if not os.path.exists(path):
            candidates = [f for f in os.listdir(folder) if f.endswith(f"_{i}.jpg")]
            if candidates:
                path = os.path.join(folder, candidates[0])
        img = cv2_imread(path)
        if img is None:
            raise FileNotFoundError(f"No se encontró keyframe {i} en {folder} ({path})")
        frames.append(img)
    return frames

def interpolate_sequence(keyframes, total_frames=TOTAL_FRAMES):
    n_kf = len(keyframes)
    sequence = keyframes + [keyframes[0]]
    n_segments = len(sequence) - 1
    frames_per_seg = total_frames / n_segments
    
    dis = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
    dis.setUseSpatialPropagation(True)
    
    interpolated = []
    
    for seg_idx in range(n_segments):
        I0 = sequence[seg_idx]
        I1 = sequence[seg_idx + 1]
        
        gray0 = cv2.cvtColor(I0, cv2.COLOR_BGR2GRAY)
        gray1 = cv2.cvtColor(I1, cv2.COLOR_BGR2GRAY)
        
        flow_fw = dis.calc(gray0, gray1, None)
        flow_bw = dis.calc(gray1, gray0, None)
        
        h, w = I0.shape[:2]
        grid_x, grid_y = np.meshgrid(np.arange(w), np.arange(h))
        
        start_frame = int(round(seg_idx * frames_per_seg))
        end_frame = int(round((seg_idx + 1) * frames_per_seg))
        count = end_frame - start_frame
        
        for k in range(count):
            t_linear = k / float(count)
            t_eased = (1.0 - np.cos(t_linear * np.pi)) / 2.0
            
            map_x0 = (grid_x - t_eased * flow_fw[..., 0]).astype(np.float32)
            map_y0 = (grid_y - t_eased * flow_fw[..., 1]).astype(np.float32)
            warp0 = cv2.remap(I0, map_x0, map_y0, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
            
            map_x1 = (grid_x + (1.0 - t_eased) * flow_bw[..., 0]).astype(np.float32)
            map_y1 = (grid_y + (1.0 - t_eased) * flow_bw[..., 1]).astype(np.float32)
            warp1 = cv2.remap(I1, map_x1, map_y1, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
            
            blended = cv2.addWeighted(warp0, 1.0 - t_eased, warp1, t_eased, 0)
            interpolated.append(blended)
            
    while len(interpolated) < total_frames:
        interpolated.append(interpolated[-1])
    return interpolated[:total_frames]

def save_mp4(frames, path, fps=FPS):
    h, w = frames[0].shape[:2]
    fourcc = cv2.VideoWriter_fourcc(*'avc1')
    out = cv2.VideoWriter(path, fourcc, fps, (w, h))
    if not out.isOpened():
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(path, fourcc, fps, (w, h))
    for f in frames:
        out.write(f)
    out.release()
    print(f"[OK] MP4 guardado: {path} ({w}x{h}, {len(frames)} frames)")

def save_webp(frames, path, fps=FPS):
    pil_frames = []
    for f in frames:
        rgb = cv2.cvtColor(f, cv2.COLOR_BGR2RGB)
        pil_frames.append(Image.fromarray(rgb))
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
    print(f"[OK] WebP guardado: {path} ({len(pil_frames)} frames)")

def main():
    print("=== Generando 4 nuevas señas LSC (TARDES, GUSTAR, I, O) ===")
    
    for sign_name, info in NEW_SIGNS.items():
        print(f"\n--- Procesando {sign_name} ({info['type']}) ---")
        body_kfs = load_keyframes(info["body_dir"])
        
        # Guardar muestra canónica (frame 5)
        sample_path = os.path.join(SAMPLES_DIR, f"{sign_name}.jpg")
        cv2_imwrite(sample_path, body_kfs[5])
        gemini_sample = os.path.join(GEMINI_FOTOS_DIR, f"{sign_name}_ref.jpg")
        cv2_imwrite(gemini_sample, body_kfs[5])
        print(f"[OK] Sample keyframe guardado en {sample_path}")
        
        # 1. Body
        body_interp = interpolate_sequence(body_kfs, TOTAL_FRAMES)
        save_mp4(body_interp, os.path.join(VIDEOS_DIR, f"{sign_name}_body.mp4"))
        save_webp(body_interp, os.path.join(VIDEOS_DIR, f"{sign_name}_body.webp"))
        
        # 2. Hand
        if info["type"] == "word":
            gx, gy, gw, gh = info["hand_crop"]
            hand_kfs = [kf[gy:gy+gh, gx:gx+gw] for kf in body_kfs]
            hand_kfs = [cv2.resize(hkf, (480, 480), interpolation=cv2.INTER_CUBIC) for hkf in hand_kfs]
        else:
            raw_hand_kfs = load_keyframes(info["hand_dir"])
            hand_kfs = [cv2.resize(hkf, (480, 480), interpolation=cv2.INTER_CUBIC) for hkf in raw_hand_kfs]
            
        hand_interp = interpolate_sequence(hand_kfs, TOTAL_FRAMES)
        save_mp4(hand_interp, os.path.join(VIDEOS_DIR, f"{sign_name}_hand.mp4"))
        save_webp(hand_interp, os.path.join(VIDEOS_DIR, f"{sign_name}_hand.webp"))

    print("\n=== Todas las 4 nuevas señas generadas con éxito ===")

if __name__ == "__main__":
    main()
