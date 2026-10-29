import subprocess, os
from PIL import Image, ImageDraw, ImageFont

chrome = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
brain_dir = r'C:\Users\abner\.gemini\antigravity\brain\adc682e4-fa3e-4853-a6ce-7c2d4c68b532'

tests = [
    ('bind_pose', 0.998, -0.144, 0.998, 0.144),
    ('z_only', 0.998, 1.28, 0.998, -1.28),
    ('x_1.3_z_1.3', 1.30, 1.30, 1.30, -1.30),
    ('x_1.5_z_1.3', 1.50, 1.30, 1.50, -1.30),
    ('x_0.5_z_1.3', 0.50, 1.30, 0.50, -1.30),
    ('x_0.0_z_1.3', 0.00, 1.30, 0.00, -1.30),
]

imgs = []
for name, lx, lz, rx, rz in tests:
    out_png = os.path.join(brain_dir, f'arm_{name}.png')
    url = f'http://localhost:8000/test_arm_grid.html?lx={lx}&lz={lz}&rx={rx}&rz={rz}'
    cmd = [
        chrome,
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        '--window-size=400,400',
        f'--screenshot={out_png}',
        '--virtual-time-budget=2000',
        url
    ]
    subprocess.run(cmd, timeout=10)
    if os.path.exists(out_png):
        imgs.append((name, Image.open(out_png)))

# Combine into 2x3 grid
grid = Image.new('RGB', (1200, 800), (20, 20, 30))
draw = ImageDraw.Draw(grid)
font = ImageFont.truetype('arialbd.ttf', 14)

for idx, (name, im) in enumerate(imgs):
    r = idx // 3
    c = idx % 3
    x = c * 400
    y = r * 400
    grid.paste(im, (x, y))
    draw.text((x + 10, y + 10), name, font=font, fill=(56, 189, 248))

grid_path = os.path.join(brain_dir, 'arm_angles_grid.jpg')
grid.save(grid_path, quality=90)
print('Saved arm_angles_grid.jpg')
