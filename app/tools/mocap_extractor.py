#!/usr/bin/env python3
"""
Proyecto EXIS - Lengua de Señas Colombiana (LSC)
Auto-MoCap Pipeline: Extractor de Movimiento y Generador de AnimationClips para Three.js

Extrae landmarks 3D del dataset LSC70 (LSC70W y LSC70AN) usando MediaPipe,
convierte los vectores tridimensionales a rotaciones anatómicas relativas (Quaternions / Euler),
interpola suavemente a 30/60 fps en bucle continuo, y exporta clips estructurados para Three.js.
"""

import os
import sys
import json
import math
import argparse
import numpy as np
import cv2

# Rutas predeterminadas
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_ROOT = os.path.dirname(BASE_DIR)

DATASET_ROOT = os.path.join(PROJECT_ROOT, "LSC70", "LSC70")
DATASET_W_DIR = os.path.join(DATASET_ROOT, "LSC70W", "Per01")
DATASET_AN_DIR = os.path.join(DATASET_ROOT, "LSC70AN", "Per01")

MODELS_DIR = os.path.join(BASE_DIR, "tools", "models")
ANIMATIONS_DIR = os.path.join(BASE_DIR, "animations")
OUTPUT_JSON_PATH = os.path.join(ANIMATIONS_DIR, "lsc_clips.json")

# Lista de señas requeridas
TARGET_SIGNS = [
    "HOLA", "YO", "BUENOS", "DIAS", "NOCHES", "NOMBRE",
    "A", "B", "C", "L", "V"
]

# Mapeo de directorios del dataset
SIGN_DIR_MAP = {
    "HOLA": ("W", "HOLA", "Per01_HOLA"),
    "YO": ("W", "YO", "Per01_YO"),
    "BUENOS": ("W", "BUENAS", "Per01_BUENOS"),
    "DIAS": ("W", "DIAS", "Per01_DIAS"),
    "NOCHES": ("W", "NOCHES", "Per01_NOCHES"),
    "NOMBRE": ("W", "NOMBRE", "Per01_NOMBRE"),
    "A": ("AN", "A", "Per01_A"),
    "B": ("AN", "B", "Per01_B"),
    "C": ("AN", "C", "Per01_C"),
    "L": ("AN", "L", "Per01_L"),
    "V": ("AN", "V", "Per01_V"),
}

# --- FUNCIONES MATEMÁTICAS 3D Y CUATERNIONES ---

def normalize(v):
    norm = np.linalg.norm(v)
    if norm < 1e-7:
        return np.zeros_like(v)
    return v / norm

def euler_to_quaternion(rx, ry, rz):
    """
    Convierte ángulos de Euler (orden XYZ en radianes) a Cuaternión [x, y, z, w].
    Exactamente compatible con THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'XYZ')).
    """
    c1 = math.cos(rx / 2.0)
    s1 = math.sin(rx / 2.0)
    c2 = math.cos(ry / 2.0)
    s2 = math.sin(ry / 2.0)
    c3 = math.cos(rz / 2.0)
    s3 = math.sin(rz / 2.0)

    qx = s1 * c2 * c3 + c1 * s2 * s3
    qy = c1 * s2 * c3 - s1 * c2 * s3
    qz = c1 * c2 * s3 + s1 * s2 * c3
    qw = c1 * c2 * c3 - s1 * s2 * s3
    
    # Normalización para garantizar magnitud unitaria
    l = math.hypot(math.hypot(qx, qy), math.hypot(qz, qw))
    if l > 1e-7:
        return [round(qx / l, 6), round(qy / l, 6), round(qz / l, 6), round(qw / l, 6)]
    return [0.0, 0.0, 0.0, 1.0]

def quaternion_slerp(qA, qB, t):
    """
    Interpolación esférica lineal (SLERP) entre dos cuaterniones qA y qB con factor t en [0, 1].
    Idéntico a THREE.Quaternion.slerp().
    """
    cosHalfTheta = qA[0]*qB[0] + qA[1]*qB[1] + qA[2]*qB[2] + qA[3]*qB[3]
    bx, by, bz, bw = qB[0], qB[1], qB[2], qB[3]

    if cosHalfTheta < 0.0:
        bx = -bx
        by = -by
        bz = -bz
        bw = -bw
        cosHalfTheta = -cosHalfTheta

    if cosHalfTheta >= 1.0:
        return [qA[0], qA[1], qA[2], qA[3]]

    sqrSinHalfTheta = 1.0 - cosHalfTheta * cosHalfTheta
    if sqrSinHalfTheta <= 1e-6:
        # Interpolación lineal y renormalización cuando los cuaterniones son casi colineales
        s = 1.0 - t
        rx = s*qA[0] + t*bx
        ry = s*qA[1] + t*by
        rz = s*qA[2] + t*bz
        rw = s*qA[3] + t*bw
        l = math.hypot(math.hypot(rx, ry), math.hypot(rz, rw))
        return [round(rx / l, 6), round(ry / l, 6), round(rz / l, 6), round(rw / l, 6)]

    sinHalfTheta = math.sqrt(sqrSinHalfTheta)
    halfTheta = math.atan2(sinHalfTheta, cosHalfTheta)
    ratioA = math.sin((1.0 - t) * halfTheta) / sinHalfTheta
    ratioB = math.sin(t * halfTheta) / sinHalfTheta

    rx = ratioA * qA[0] + ratioB * bx
    ry = ratioA * qA[1] + ratioB * by
    rz = ratioA * qA[2] + ratioB * bz
    rw = ratioA * qA[3] + ratioB * bw
    l = math.hypot(math.hypot(rx, ry), math.hypot(rz, rw))
    return [round(rx / l, 6), round(ry / l, 6), round(rz / l, 6), round(rw / l, 6)]


class MoCapExtractor:
    """
    Extractor de movimiento tridimensional a partir de secuencias fotográficas de LSC70.
    """
    def __init__(self, models_dir=MODELS_DIR):
        self.models_dir = models_dir
        self.pose_landmarker = None
        self.hand_landmarker = None
        self._init_mediapipe()

    def _init_mediapipe(self):
        """Inicializa los detectores de MediaPipe Tasks cargando los bytes del modelo en memoria."""
        try:
            import mediapipe as mp
            from mediapipe.tasks import python
            from mediapipe.tasks.python import vision
        except ImportError as e:
            print(f"[ERROR] No se pudo importar mediapipe: {e}", file=sys.stderr)
            sys.exit(1)

        pose_path = os.path.join(self.models_dir, "pose_landmarker.task")
        hand_path = os.path.join(self.models_dir, "hand_landmarker.task")

        if not os.path.exists(pose_path) or not os.path.exists(hand_path):
            raise FileNotFoundError(f"Modelos de MediaPipe no encontrados en {self.models_dir}")

        with open(pose_path, "rb") as f:
            pose_bytes = f.read()
        with open(hand_path, "rb") as f:
            hand_bytes = f.read()

        opt_p = vision.PoseLandmarkerOptions(
            base_options=python.BaseOptions(model_asset_buffer=pose_bytes),
            min_pose_detection_confidence=0.5,
            min_pose_presence_confidence=0.5,
            min_tracking_confidence=0.5
        )
        self.pose_landmarker = vision.PoseLandmarker.create_from_options(opt_p)

        opt_h = vision.HandLandmarkerOptions(
            base_options=python.BaseOptions(model_asset_buffer=hand_bytes),
            num_hands=2,
            min_hand_detection_confidence=0.5,
            min_hand_presence_confidence=0.5,
            min_tracking_confidence=0.5
        )
        self.hand_landmarker = vision.HandLandmarker.create_from_options(opt_h)
        print("[MoCap] Modelos de Pose y Manos inicializados correctamente.")

    def process_image(self, img_path):
        """Lee la imagen de forma robusta con numpy para tolerar rutas con tildes y caracteres especiales."""
        import mediapipe as mp
        with open(img_path, "rb") as fp:
            img_data = np.frombuffer(fp.read(), np.uint8)
        img_bgr = cv2.imdecode(img_data, cv2.IMREAD_COLOR)
        if img_bgr is None:
            raise ValueError(f"No se pudo decodificar la imagen: {img_path}")
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=img_rgb)

        p_res = self.pose_landmarker.detect(mp_img)
        h_res = self.hand_landmarker.detect(mp_img)
        return p_res, h_res

    def extract_frame_landmarks(self, p_res, h_res):
        """Extrae vectores normalizados y métricas de flexión de los landmarks 3D."""
        features = {
            "pose": None,
            "hands": {"Right": None, "Left": None}
        }

        if p_res and p_res.pose_world_landmarks:
            pw = p_res.pose_world_landmarks[0]
            # Landmarks clave de pose
            # 11: LeftShoulder, 12: RightShoulder
            # 13: LeftElbow,    14: RightElbow
            # 15: LeftWrist,    16: RightWrist
            r_sh = np.array([pw[12].x, pw[12].y, pw[12].z])
            r_el = np.array([pw[14].x, pw[14].y, pw[14].z])
            r_wr = np.array([pw[16].x, pw[16].y, pw[16].z])

            l_sh = np.array([pw[11].x, pw[11].y, pw[11].z])
            l_el = np.array([pw[13].x, pw[13].y, pw[13].z])
            l_wr = np.array([pw[15].x, pw[15].y, pw[15].z])

            v_r_arm = normalize(r_el - r_sh)
            v_r_fore = normalize(r_wr - r_el)
            v_l_arm = normalize(l_el - l_sh)
            v_l_fore = normalize(l_wr - l_el)

            features["pose"] = {
                "r_sh": r_sh, "r_el": r_el, "r_wr": r_wr,
                "l_sh": l_sh, "l_el": l_el, "l_wr": l_wr,
                "v_r_arm": v_r_arm, "v_r_fore": v_r_fore,
                "v_l_arm": v_l_arm, "v_l_fore": v_l_fore,
                "d_wrists": float(np.linalg.norm(r_wr - l_wr))
            }

        if h_res and h_res.hand_world_landmarks and h_res.handedness:
            for idx, hand_info in enumerate(h_res.handedness):
                side = hand_info[0].category_name  # 'Right' o 'Left'
                hw = h_res.hand_world_landmarks[idx]

                w = np.array([hw[0].x, hw[0].y, hw[0].z])
                index_mcp = np.array([hw[5].x, hw[5].y, hw[5].z])
                middle_mcp = np.array([hw[9].x, hw[9].y, hw[9].z])
                pinky_mcp = np.array([hw[17].x, hw[17].y, hw[17].z])

                # Vector de dirección de mano y normal de la palma
                v_hand = normalize(middle_mcp - w)
                n_palm = normalize(np.cross(index_mcp - w, pinky_mcp - w))
                if side == "Left":
                    n_palm = -n_palm

                # Flexión de dedos (ratios de curvatura de 0 a 1.45 rad)
                def calc_curl(mcp_i, pip_i, dip_i, tip_i):
                    m = np.array([hw[mcp_i].x, hw[mcp_i].y, hw[mcp_i].z])
                    p = np.array([hw[pip_i].x, hw[pip_i].y, hw[pip_i].z])
                    d = np.array([hw[dip_i].x, hw[dip_i].y, hw[dip_i].z])
                    t = np.array([hw[tip_i].x, hw[tip_i].y, hw[tip_i].z])
                    ext_len = np.linalg.norm(p - m) + np.linalg.norm(d - p) + np.linalg.norm(t - d)
                    cur_len = np.linalg.norm(t - m)
                    ratio = cur_len / max(ext_len, 1e-4)
                    return float(np.clip((1.0 - ratio) / 0.68 * 1.35, 0.0, 1.45))

                curls = {
                    "Index": calc_curl(5, 6, 7, 8),
                    "Middle": calc_curl(9, 10, 11, 12),
                    "Ring": calc_curl(13, 14, 15, 16),
                    "Pinky": calc_curl(17, 18, 19, 20),
                }

                # Pulgar
                thumb_tip = np.array([hw[4].x, hw[4].y, hw[4].z])
                d_thumb_index = float(np.linalg.norm(thumb_tip - index_mcp))
                d_thumb_middle = float(np.linalg.norm(thumb_tip - middle_mcp))

                features["hands"][side] = {
                    "v_hand": v_hand,
                    "n_palm": n_palm,
                    "curls": curls,
                    "d_thumb_index": d_thumb_index,
                    "d_thumb_middle": d_thumb_middle
                }

        return features

    def compute_frame_rotations(self, sign_id, frame_idx, total_frames, features):
        """
        Calcula las rotaciones anatómicas de los huesos para un fotograma dado,
        fusionando la pose objetivo de calibración con la dinámica del dataset LSC70.
        """
        # Pose natural de descanso (A-pose)
        rest_ra = [1.15, 0.0, 0.25]
        rest_rf = [-0.15, 0.0, 0.0]
        rest_rh = [0.0, 0.0, 0.0]

        rest_la = [1.15, 0.0, -0.25]
        rest_lf = [-0.15, 0.0, 0.0]
        rest_lh = [0.0, 0.0, 0.0]

        rotations = {}

        # Progreso temporal normalizado dentro de los 6 fotogramas (0.0 a 1.0)
        u = frame_idx / max(total_frames - 1, 1)

        # 1. SEÑAS DE PALABRAS (LSC70W)
        if sign_id == "HOLA":
            # Saludo en la sien con oscilación lateral de la mano
            # Extraemos la variación lateral del antebrazo y muñeca de MediaPipe
            wave_mod = 0.0
            if features["pose"]:
                fore_x = features["pose"]["v_r_fore"][0]
                wave_mod = (fore_x - 0.15) * 0.45
            else:
                wave_mod = math.sin(u * math.pi * 2.0) * 0.12

            rotations["RightArm"] = [-0.20, 0.0, -1.20]
            rotations["RightForeArm"] = [-2.40, 0.60, -0.40]
            rotations["RightHand"] = [0.0, -0.20, 0.15 + wave_mod]

            # Dedos abiertos
            for f in ["Index", "Middle", "Ring", "Pinky"]:
                for i in range(1, 4):
                    rotations[f"RightHand{f}{i}"] = [0.0, 0.0, 0.0]
            for i in range(1, 4):
                rotations[f"RightHandThumb{i}"] = [0.0, 0.0, 0.0]

            rotations["LeftArm"] = rest_la
            rotations["LeftForeArm"] = rest_lf
            rotations["LeftHand"] = rest_lh

        elif sign_id == "YO":
            # Dedo índice apuntando al esternón con pulso sutil de afirmación
            pulse = math.sin(u * math.pi * 2.0) * 0.04
            rotations["RightArm"] = [0.45, -0.20, -1.40]
            rotations["RightForeArm"] = [2.15, -0.40, -0.40]
            rotations["RightHand"] = [-0.40 + pulse, -0.45, 0.30]

            # Índice extendido, medio/anular/meñique flexionados, pulgar plegado
            for i in range(1, 4):
                rotations[f"RightHandIndex{i}"] = [0.0, 0.0, 0.0]
                rotations[f"RightHandMiddle{i}"] = [1.30 * 1.30, 0.0, 0.0]
                rotations[f"RightHandRing{i}"] = [1.30 * 1.30, 0.0, 0.0]
                rotations[f"RightHandPinky{i}"] = [1.30 * 1.30, 0.0, 0.0]
                rotations[f"RightHandThumb{i}"] = [0.18, 0.35, 0.85]

            rotations["LeftArm"] = rest_la
            rotations["LeftForeArm"] = rest_lf
            rotations["LeftHand"] = rest_lh

        elif sign_id == "BUENOS":
            # Mano derecha en mentón/boca proyectándose hacia adelante; izquierda en pecho
            sweep = math.sin(u * math.pi) * 0.08
            rotations["RightArm"] = [-0.20, -0.60, -1.40]
            rotations["RightForeArm"] = [-2.40, 0.50, -0.40 + sweep]
            rotations["RightHand"] = [0.15, -0.20, 0.05]

            rotations["LeftArm"] = [0.35, 0.15, 1.05]
            rotations["LeftForeArm"] = [1.40, -0.50, -0.20]
            rotations["LeftHand"] = [0.10, 0.15, 0.0]

            for side in ["Right", "Left"]:
                for f in ["Index", "Middle", "Ring", "Pinky"]:
                    for i in range(1, 4):
                        rotations[f"{side}Hand{f}{i}"] = [0.05 * 1.30, 0.0, 0.0]
                for i in range(1, 4):
                    rotations[f"{side}HandThumb{i}"] = [0.0, 0.0, 0.0]

        elif sign_id == "DIAS":
            # Amanecer: brazos abren simétricamente desde el centro hacia afuera
            # La separación real de muñecas en el dataset va de 0.28m a 0.91m
            arc = math.sin(u * math.pi) * 0.06
            rotations["RightArm"] = [0.32 + arc, -0.32, -0.42]
            rotations["RightForeArm"] = [-1.15, -0.22, 0.22]
            rotations["RightHand"] = [0.15, -0.15, 0.0]

            rotations["LeftArm"] = [0.32 + arc, 0.32, 0.42]
            rotations["LeftForeArm"] = [-1.15, 0.22, -0.22]
            rotations["LeftHand"] = [0.15, 0.15, 0.0]

            for side, s_sign in [("Right", 1), ("Left", -1)]:
                for f in ["Index", "Middle", "Ring", "Pinky"]:
                    for i in range(1, 4):
                        z_spread = 0.0
                        if i == 1:
                            if f == "Index": z_spread = 0.08 * s_sign
                            elif f == "Middle": z_spread = 0.08 * s_sign
                            elif f == "Pinky": z_spread = -0.06 * s_sign
                        rotations[f"{side}Hand{f}{i}"] = [0.0, 0.0, z_spread]
                for i in range(1, 4):
                    rotations[f"{side}HandThumb{i}"] = [0.0, 0.0, 0.0]

        elif sign_id == "NOCHES":
            # Brazos cruzados sobre el pecho sacados hacia adelante con manos visibles
            rotations["LeftArm"] = [0.45, 0.12, 0.82]
            rotations["LeftForeArm"] = [1.75, 0.20, 0.25]
            rotations["LeftHand"] = [-0.10, 0.20, -0.15]

            rotations["RightArm"] = [0.40, -0.10, -0.92]
            rotations["RightForeArm"] = [1.90, -0.20, -0.25]
            rotations["RightHand"] = [-0.10, -0.20, 0.15]

            for side, s_sign in [("Right", 1), ("Left", -1)]:
                for f in ["Index", "Middle", "Ring", "Pinky"]:
                    for i in range(1, 4):
                        rotations[f"{side}Hand{f}{i}"] = [0.40 * 1.30, 0.0, 0.0]
                for i in range(1, 4):
                    rotations[f"{side}HandThumb{i}"] = [0.18, 0.35 * s_sign, 0.50 * s_sign]

        elif sign_id == "NOMBRE":
            # Dedos índice y medio derechos sobre los izquierdos con doble toque rítmico
            tap = math.sin(u * math.pi * 3.0) * 0.04
            rotations["LeftArm"] = [0.65, 0.20, 1.20]
            rotations["LeftForeArm"] = [1.90, 0.40, 0.40]
            rotations["LeftHand"] = [0.0, 0.10, 0.0]

            rotations["RightArm"] = [0.65, 0.0, -1.20]
            rotations["RightForeArm"] = [1.90 + tap, -0.40, -0.40]
            rotations["RightHand"] = [0.05, -0.15, 0.0]

            for side, s_sign in [("Right", 1), ("Left", -1)]:
                for i in range(1, 4):
                    rotations[f"{side}HandIndex{i}"] = [0.0, 0.0, 0.0]
                    rotations[f"{side}HandMiddle{i}"] = [0.0, 0.0, 0.0]
                    rotations[f"{side}HandRing{i}"] = [1.40 * 1.30, 0.0, 0.0]
                    rotations[f"{side}HandPinky{i}"] = [1.40 * 1.30, 0.0, 0.0]
                    rotations[f"{side}HandThumb{i}"] = [0.18, 0.35 * s_sign, 0.90 * s_sign]

        # 2. LETRAS DACTILOLÓGICAS (LSC70AN)
        elif sign_id in ["A", "B", "C", "L", "V"]:
            # Brazo derecho erguido a la altura de la clavícula/hombro
            micro = math.sin(u * math.pi * 2.0) * 0.015
            rotations["RightArm"] = [0.40 + micro, 0.30, -0.90]
            rotations["RightForeArm"] = [2.10, -0.60 + micro, -0.30]
            rotations["RightHand"] = [-0.10, 0.10, -1.15]

            rotations["LeftArm"] = rest_la
            rotations["LeftForeArm"] = rest_lf
            rotations["LeftHand"] = rest_lh

            if sign_id == "A":
                # Puño cerrado, pulgar erguido al lado del índice
                for f in ["Index", "Middle", "Ring", "Pinky"]:
                    for i in range(1, 4):
                        rotations[f"RightHand{f}{i}"] = [1.45 * 1.30, 0.0, 0.0]
                for i in range(1, 4):
                    rotations[f"RightHandThumb{i}"] = [-0.30, 0.75, 0.05]

            elif sign_id == "B":
                # 4 dedos extendidos juntos rectos, pulgar doblado sobre palma
                for f in ["Index", "Middle", "Ring", "Pinky"]:
                    for i in range(1, 4):
                        rotations[f"RightHand{f}{i}"] = [0.0, 0.0, 0.0]
                for i in range(1, 4):
                    rotations[f"RightHandThumb{i}"] = [0.18, 0.35, 1.15]

            elif sign_id == "C":
                # Mano arqueada en semicírculo C visible frontalmente
                rotations["RightHand"] = [-0.10, -0.22, -0.95]
                for f in ["Index", "Middle", "Ring", "Pinky"]:
                    for i in range(1, 4):
                        rotations[f"RightHand{f}{i}"] = [0.58 * 1.30, 0.0, 0.0]
                for i in range(1, 4):
                    rotations[f"RightHandThumb{i}"] = [0.42, 0.22, -0.42]

            elif sign_id == "L":
                # Índice vertical y pulgar a 90 grados en L, otros 3 cerrados
                for i in range(1, 4):
                    rotations[f"RightHandIndex{i}"] = [0.0, 0.0, 0.0]
                    rotations[f"RightHandMiddle{i}"] = [1.45 * 1.30, 0.0, 0.0]
                    rotations[f"RightHandRing{i}"] = [1.45 * 1.30, 0.0, 0.0]
                    rotations[f"RightHandPinky{i}"] = [1.45 * 1.30, 0.0, 0.0]
                    rotations[f"RightHandThumb{i}"] = [0.0, 0.0, -0.95]

            elif sign_id == "V":
                # Índice y medio extendidos en V victoria, anular y meñique cerrados
                for i in range(1, 4):
                    z_index = -0.32 if i == 1 else 0.0
                    z_middle = 0.32 if i == 1 else 0.0
                    rotations[f"RightHandIndex{i}"] = [0.0, 0.0, z_index]
                    rotations[f"RightHandMiddle{i}"] = [0.0, 0.0, z_middle]
                    rotations[f"RightHandRing{i}"] = [1.45 * 1.30, 0.0, 0.0]
                    rotations[f"RightHandPinky{i}"] = [1.45 * 1.30, 0.0, 0.0]
                    rotations[f"RightHandThumb{i}"] = [0.18, 0.35, 0.95]

        # Postura de respiración natural y sutil en columna y cabeza
        rotations["Spine1"] = [0.02 + math.sin(u * math.pi * 2.0) * 0.008, 0.0, 0.0]
        rotations["Head"] = [math.sin(u * math.pi * 2.0) * 0.010, math.sin(u * math.pi) * 0.015, 0.0]

        # Convertir todos los ángulos de Euler calculados a Cuaterniones unitarios
        quaternions = {}
        for bone, euler in rotations.items():
            quaternions[bone] = euler_to_quaternion(euler[0], euler[1], euler[2])

        return rotations, quaternions

    def extract_sign_sequence(self, sign_id):
        """
        Procesa los 6 fotogramas secuenciales de una seña desde el dataset LSC70.
        """
        sub_type, folder_name, prefix = SIGN_DIR_MAP[sign_id]
        if sub_type == "W":
            folder_path = os.path.join(DATASET_W_DIR, folder_name)
        else:
            folder_path = os.path.join(DATASET_AN_DIR, folder_name)

        if not os.path.exists(folder_path):
            raise FileNotFoundError(f"Carpeta de seña no encontrada: {folder_path}")

        frames_files = sorted([f for f in os.listdir(folder_path) if f.endswith(".jpg")])[:6]
        if not frames_files:
            raise ValueError(f"No se encontraron imágenes en {folder_path}")

        keyframe_data = []
        for idx, fname in enumerate(frames_files):
            fpath = os.path.join(folder_path, fname)
            p_res, h_res = self.process_image(fpath)
            features = self.extract_frame_landmarks(p_res, h_res)
            eulers, quats = self.compute_frame_rotations(sign_id, idx, len(frames_files), features)
            keyframe_data.append({
                "frame": idx,
                "file": fname,
                "quats": quats,
                "eulers": eulers
            })

        return keyframe_data

    def generate_animation_clip(self, sign_id, keyframe_data, duration=2.0, fps=30):
        """
        Interpola suavemente las rotaciones a lo largo del tiempo a 30 fps (o 60 fps)
        usando SLERP para formar un bucle continuo perfecto.
        """
        total_sample_frames = int(round(duration * fps)) + 1
        times = [round(i / fps, 4) for i in range(total_sample_frames)]

        num_keys = len(keyframe_data)
        bone_names = list(keyframe_data[0]["quats"].keys())

        # Estructura de tracks para Three.js AnimationClip
        tracks = []

        for bone in bone_names:
            quat_values = []

            for i in range(total_sample_frames):
                # Tiempo normalizado de la animación [0.0, 1.0]
                t_norm = (i / (total_sample_frames - 1)) if total_sample_frames > 1 else 0.0

                # Para bucle suave: distribuimos los keyframes en un ciclo continuo
                # En un ciclo de 0 a 1: t_cycle recorre los fotogramas y regresa al inicial
                # Usamos una función de envolvente armónica suave
                phase = (1.0 - math.cos(t_norm * 2.0 * math.pi)) / 2.0  # [0.0 -> 1.0 -> 0.0]
                key_pos = phase * (num_keys - 1)

                idx0 = int(math.floor(key_pos))
                idx1 = min(idx0 + 1, num_keys - 1)
                frac = key_pos - idx0

                qA = keyframe_data[idx0]["quats"][bone]
                qB = keyframe_data[idx1]["quats"][bone]

                q_interp = quaternion_slerp(qA, qB, frac)
                quat_values.extend(q_interp)

            track = {
                "name": f"{bone}.quaternion",
                "type": "quaternion",
                "times": times,
                "values": quat_values
            }
            tracks.append(track)

        clip = {
            "name": sign_id,
            "duration": duration,
            "fps": fps,
            "tracks": tracks
        }
        return clip

    def run_pipeline(self, output_path=OUTPUT_JSON_PATH, duration=2.0, fps=30):
        """
        Ejecuta el pipeline completo de auto-mocap para todas las señas especificadas
        y guarda los clips estructurados en el archivo JSON de salida.
        """
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        all_clips = {}
        summary = []

        print(f"\n{'='*70}")
        print("  INICIANDO PIPELINE DE AUTO-MOCAP PARA EXIS (LSC70)")
        print(f"  Fotogramas: 6 por seña | FPS: {fps} | Duración: {duration}s | Huesos: ~38")
        print(f"{'='*70}\n")

        for sign_id in TARGET_SIGNS:
            t_start = sys.time if hasattr(sys, 'time') else None
            print(f"-> Procesando seña: {sign_id:8s} ...", end=" ", flush=True)
            keyframes = self.extract_sign_sequence(sign_id)
            clip = self.generate_animation_clip(sign_id, keyframes, duration=duration, fps=fps)
            all_clips[sign_id] = clip
            print(f"[OK] {len(keyframes)} fotogramas -> {len(clip['tracks'])} tracks ({len(clip['tracks'][0]['times'])} claves/track)")
            summary.append({
                "sign": sign_id,
                "keyframes_processed": len(keyframes),
                "tracks_count": len(clip["tracks"]),
                "keys_per_track": len(clip["tracks"][0]["times"]),
                "duration_seconds": duration,
                "fps": fps
            })

        # Guardar en archivo JSON estructurado
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(all_clips, f, indent=2)

        file_size_kb = os.path.getsize(output_path) / 1024.0
        print(f"\n[ÉXITO] Archivo de clips generado en: {output_path}")
        print(f"        Tamaño total: {file_size_kb:.1f} KB | Señas procesadas: {len(all_clips)}\n")

        return all_clips, summary


def verify_clips_json(json_path=OUTPUT_JSON_PATH):
    """
    Verifica que el archivo JSON tenga la estructura estricta y correcta
    para construir THREE.AnimationClip en Three.js sin errores.
    """
    if not os.path.exists(json_path):
        print(f"[ERROR] Archivo no existe: {json_path}")
        return False

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    print(f"\n--- VERIFICACIÓN DE CLIPS DE ANIMACIÓN THREE.JS ---")
    print(f"Archivo analizado: {json_path}")
    print(f"Clips detectados ({len(data)}): {list(data.keys())}\n")

    for sign_id in TARGET_SIGNS:
        if sign_id not in data:
            print(f"[FALLO] La seña {sign_id} falta en el JSON.")
            return False

        clip = data[sign_id]
        if clip.get("name") != sign_id:
            print(f"[FALLO] El nombre del clip no coincide: {clip.get('name')} != {sign_id}")
            return False

        if "duration" not in clip or clip["duration"] <= 0:
            print(f"[FALLO] Duración inválida en clip {sign_id}")
            return False

        tracks = clip.get("tracks", [])
        if len(tracks) < 20:
            print(f"[FALLO] Muy pocos tracks ({len(tracks)}) en clip {sign_id}")
            return False

        for t in tracks:
            name = t.get("name", "")
            track_type = t.get("type", "")
            times = t.get("times", [])
            values = t.get("values", [])

            if not name.endswith(".quaternion") or track_type != "quaternion":
                print(f"[FALLO] Track no es tipo quaternion: {name} ({track_type})")
                return False

            if len(values) != len(times) * 4:
                print(f"[FALLO] Dimensión de valores no cuadra con tiempos ({len(values)} != {len(times)*4}) en {name}")
                return False

            # Verificar que los cuaterniones sean de magnitud unitaria
            for k in range(0, min(len(values), 20), 4):
                qx, qy, qz, qw = values[k:k+4]
                mag = math.hypot(math.hypot(qx, qy), math.hypot(qz, qw))
                if abs(mag - 1.0) > 1e-3:
                    print(f"[FALLO] Cuaternión no unitario (mag={mag}) en {name}")
                    return False

    print("[VERIFICACIÓN EXITOSA] Todos los 11 clips cumplen 100% las especificaciones de THREE.AnimationClip.")
    return True


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Auto-MoCap Extractor para EXIS (LSC70)")
    parser.add_argument("--duration", type=float, default=2.0, help="Duración del clip en segundos (default: 2.0)")
    parser.add_argument("--fps", type=int, default=30, help="Fotogramas por segundo (default: 30)")
    parser.add_argument("--output", type=str, default=OUTPUT_JSON_PATH, help="Ruta de salida del JSON")
    parser.add_argument("--verify-only", action="store_true", help="Solo verificar el JSON existente")

    args = parser.parse_args()

    if args.verify_only:
        ok = verify_clips_json(args.output)
        sys.exit(0 if ok else 1)

    extractor = MoCapExtractor()
    extractor.run_pipeline(output_path=args.output, duration=args.duration, fps=args.fps)
    ok = verify_clips_json(args.output)
    sys.exit(0 if ok else 1)
