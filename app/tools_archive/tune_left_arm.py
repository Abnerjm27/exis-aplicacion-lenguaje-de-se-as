import subprocess, os
from PIL import Image

chrome = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
brain_dir = r'C:\Users\abner\.gemini\antigravity\brain\adc682e4-fa3e-4853-a6ce-7c2d4c68b532'

tests = [
    # la, lf
    ('left_1', '0.15,0.0,1.28', '-0.15,0,0'),
    ('left_2', '0.15,0.0,-1.28', '-0.15,0,0'),
    ('left_3', '0.998,0.019,-0.144', '-0.107,0.024,0.447'),
    ('left_4', '1.20,0.0,0.0', '-0.15,0,0'),
    ('left_5', '1.0,0.0,-0.8', '-0.15,0,0'),
    ('left_6', '0.35,0.15,1.05', '-0.15,0,0'),
]

imgs = []
for name, la, lf in tests:
    out_png = os.path.join(brain_dir, f'test_{name}.png')
    url = f'http://localhost:8000/test_left_arm.html?la={la}&lf={lf}'
    cmd = [
        chrome,
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        '--window-size=350,350',
        '--virtual-time-budget=1500',
        f'--screenshot={out_png}',
        url
    ]
    subprocess.run(cmd, timeout=8)
    if os.path.exists(out_png):
        imgs.append((name, Image.open(out_png)))

grid = Image.new('RGB', (1050, 700), (20, 20, 30))
for idx, (name, im) in enumerate(imgs):
    r = idx // 3
    c = idx % 3
    grid.paste(im, (c * 350, r * 350))

grid_path = os.path.join(brain_dir, 'left_arm_grid.jpg')
grid.save(grid_path, quality=90)
print('Saved left_arm_grid.jpg')
