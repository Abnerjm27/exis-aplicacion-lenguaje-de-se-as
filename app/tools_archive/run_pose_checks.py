import subprocess, os
from PIL import Image, ImageDraw, ImageFont

chrome = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
brain_dir = r'C:\Users\abner\.gemini\antigravity\brain\adc682e4-fa3e-4853-a6ce-7c2d4c68b532'
os.makedirs(brain_dir, exist_ok=True)

signs = ['HOLA', 'YO', 'BUENOS', 'DIAS', 'NOCHES', 'NOMBRE', 'A', 'B', 'C', 'L', 'V']

for sign in signs:
    for view in ['torso', 'hand']:
        out_png = os.path.join(brain_dir, f'avatar_{sign}_{view}.png')
        url = f'http://localhost:8000/test_all_poses.html?sign={sign}&view={view}'
        cmd = [
            chrome,
            '--headless=new',
            '--disable-gpu',
            '--no-sandbox',
            '--window-size=500,500',
            f'--screenshot={out_png}',
            '--virtual-time-budget=2000',
            url
        ]
        subprocess.run(cmd, timeout=12)
        print(f'{sign} ({view}): saved {os.path.exists(out_png)}')

print('All pose snapshots finished!')
