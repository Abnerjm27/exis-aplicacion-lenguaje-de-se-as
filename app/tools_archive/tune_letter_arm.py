import subprocess, os
from PIL import Image

chrome = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
brain_dir = r'C:\Users\abner\.gemini\antigravity\brain\adc682e4-fa3e-4853-a6ce-7c2d4c68b532'

tests = [
    # Elbow bent at 90 deg, forearm upright in front of right chest
    ('let_1', '0.2,0.1,-1.1', '-1.5,0.7,-0.2', '-0.2,0,0'),
    ('let_2', '0.1,0.2,-1.0', '-1.7,0.8,-0.1', '-0.3,-0.1,0'),
    ('let_3', '0.0,0.1,-0.9', '-1.9,0.9,0.0', '-0.2,-0.2,0.1'),
    ('let_4', '-0.1,0.2,-0.8', '-2.0,1.0,0.1', '-0.1,-0.2,0.1'),
]

imgs = []
for name, ra, rf, rh in tests:
    for view in ['body', 'hand']:
        out_png = os.path.join(brain_dir, f'test_{name}_{view}.png')
        url = f'http://localhost:8000/test_letters_view.html?ra={ra}&rf={rf}&rh={rh}&view={view}'
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
            imgs.append((f"{name}_{view}", Image.open(out_png)))

grid = Image.new('RGB', (700, 700), (20, 20, 30))
for idx, (name, im) in enumerate(imgs[:8]):
    r = idx // 2
    c = idx % 2
    grid.paste(im, (c * 350, r * 175))

grid_path = os.path.join(brain_dir, 'letters_arm_grid.jpg')
grid.save(grid_path, quality=90)
print('Saved letters_arm_grid.jpg')
