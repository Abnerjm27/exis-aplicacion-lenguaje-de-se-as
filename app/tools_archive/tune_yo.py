import subprocess, os
from PIL import Image

chrome = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
brain_dir = r'C:\Users\abner\.gemini\antigravity\brain\adc682e4-fa3e-4853-a6ce-7c2d4c68b532'

tests = [
    ('yo_perfect_1', '-0.3,0,-0.2', '1.65,0.2,-0.1'),
    ('yo_perfect_2', '-0.4,0,-0.25', '1.75,0.25,-0.1'),
    ('yo_perfect_3', '-0.45,0.1,-0.3', '1.85,0.3,0'),
    ('buenos_test_1', '-0.5,0.1,-0.2', '2.05,0.3,0.1'),
    ('dias_test_1', '-0.8,0,-0.2', '0.5,0,0'),
    ('noches_test_1', '-0.3,0,-0.4', '1.7,0,0'),
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
    subprocess.run(cmd, timeout=8)
    if os.path.exists(out_png):
        imgs.append((name, Image.open(out_png)))

grid = Image.new('RGB', (1050, 700), (20, 20, 30))
for idx, (name, im) in enumerate(imgs):
    r = idx // 3
    c = idx % 3
    grid.paste(im, (c * 350, r * 350))

grid_path = os.path.join(brain_dir, 'tuned_signs_batch.jpg')
grid.save(grid_path, quality=90)
print('Saved tuned_signs_batch.jpg')
