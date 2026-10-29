import subprocess, os, json
from PIL import Image, ImageDraw, ImageFont

chrome = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
brain_dir = r'C:\Users\abner\.gemini\antigravity\brain\adc682e4-fa3e-4853-a6ce-7c2d4c68b532'
dataset_dir = r'C:\Users\abner\Desktop\exis aplicacion lenguaje de señas\app\dataset_samples'

# Resting Left Arm in natural A-pose
# LeftArm: x=0.15, y=0.0, z=1.28
# LeftForeArm: x=-0.15, y=0.0, z=0.0
# LeftHand: x=0, y=0, z=0
REST_LA = "0.15,0.0,1.28"
REST_LF = "-0.15,0.0,0.0"
REST_LH = "0,0,0"

# Resting Right Arm in natural A-pose
REST_RA = "0.15,0.0,-1.28"
REST_RF = "-0.15,0.0,0.0"
REST_RH = "0,0,0"

def test_pose(name, ra, rf, rh, la, lf, lh, target_type, curl=0.0):
    url_body = f"http://localhost:8000/calibrate_interactive.html?ra={ra}&rf={rf}&rh={rh}&la={la}&lf={lf}&lh={lh}&target={target_type}&view=body&curl={curl}"
    url_hand = f"http://localhost:8000/calibrate_interactive.html?ra={ra}&rf={rf}&rh={rh}&la={la}&lf={lf}&lh={lh}&target={target_type}&view=hand&curl={curl}"
    
    out_body = os.path.join(brain_dir, f"solve_{name}_body.png")
    out_hand = os.path.join(brain_dir, f"solve_{name}_hand.png")

    # Capture body
    cmd_body = [chrome, '--headless=new', '--disable-gpu', '--no-sandbox', '--window-size=500,500', '--virtual-time-budget=2000', f'--screenshot={out_body}', url_body]
    res_b = subprocess.run(cmd_body, capture_output=True, text=True, timeout=12)

    # Capture hand
    cmd_hand = [chrome, '--headless=new', '--disable-gpu', '--no-sandbox', '--window-size=500,500', '--virtual-time-budget=2000', f'--screenshot={out_hand}', url_hand]
    res_h = subprocess.run(cmd_hand, capture_output=True, text=True, timeout=12)

    print(f"[{name}] body={os.path.exists(out_body)} ({os.path.getsize(out_body) if os.path.exists(out_body) else 0}b), hand={os.path.exists(out_hand)} ({os.path.getsize(out_hand) if os.path.exists(out_hand) else 0}b)")

print("Calibrator ready")
