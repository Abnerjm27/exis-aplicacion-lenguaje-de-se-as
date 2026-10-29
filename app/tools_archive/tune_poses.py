import subprocess, os
from PIL import Image

chrome = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
brain_dir = r'C:\Users\abner\.gemini\antigravity\brain\adc682e4-fa3e-4853-a6ce-7c2d4c68b532'

tests = [
    # HOLA candidates:
    ('hola_A', '-0.5,0.2,-0.2', '-2.1,0.5,0.3'),
    ('hola_B', '-0.6,0.3,-0.3', '-2.3,0.7,0.2'),
    ('hola_C', '-0.4,0.1,-0.1', '-2.2,0.4,0.1'),
    # YO candidates (pointing at chest):
    ('yo_A', '-0.1,-0.2,-0.3', '-1.7,-0.4,-0.4'),
    ('yo_B', '-0.2,-0.1,-0.4', '-1.9,-0.6,-0.3'),
    ('yo_C', '0.0,-0.3,-0.2', '-1.6,-0.3,-0.5'),
]

imgs = []
for name, ra, rf in tests:
    out_png = os.path.join(brain_dir, f'test_{name}.png')
    url = f'http://localhost:8000/tune_single_sign.html?ra={ra}&rf={rf}'
    cmd = [
        chrome,
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        '--window-size=350,350',
        '--run-all-compositor-stages-before-draw',
        f'--screenshot={out_png}',
        url
    ]
    res = subprocess.run(cmd, timeout=10)
    if os.path.exists(out_png):
        imgs.append((name, Image.open(out_png)))
        print(f'Captured {name}')

if imgs:
    grid = Image.new('RGB', (1050, 700), (20, 20, 30))
    for idx, (name, im) in enumerate(imgs):
        r = idx // 3
        c = idx % 3
        grid.paste(im, (c * 350, r * 350))

    grid_path = os.path.join(brain_dir, 'tuned_hola_yo_grid.jpg')
    grid.save(grid_path, quality=90)
    print('Saved tuned_hola_yo_grid.jpg')
