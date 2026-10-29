import subprocess, os
from PIL import Image

chrome = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
brain_dir = r'C:\Users\abner\.gemini\antigravity\brain\adc682e4-fa3e-4853-a6ce-7c2d4c68b532'

tests = [
    ('wrist_z_neg1.2', '-1.2'),
    ('wrist_z_neg0.6', '-0.6'),
    ('wrist_z_0.0', '0.0'),
    ('wrist_z_pos0.6', '0.6'),
    ('wrist_z_pos1.2', '1.2'),
    ('wrist_z_pos1.6', '1.6'),
]

imgs = []
for name, rhz in tests:
    out_png = os.path.join(brain_dir, f'test_{name}.png')
    url = f'http://localhost:8000/test_fingers_up.html?rhz={rhz}'
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

grid_path = os.path.join(brain_dir, 'wrist_grid.jpg')
grid.save(grid_path, quality=90)
print('Saved wrist_grid.jpg')
