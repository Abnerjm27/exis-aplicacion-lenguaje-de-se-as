import subprocess, os
from PIL import Image

chrome = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
brain_dir = r'C:\Users\abner\.gemini\antigravity\brain\adc682e4-fa3e-4853-a6ce-7c2d4c68b532'

tests = [
    ('thumb_y_pos', 'y', '0.8'),
    ('thumb_y_neg', 'y', '-0.8'),
    ('thumb_z_pos', 'z', '0.8'),
    ('thumb_z_neg', 'z', '-0.8'),
    ('thumb_x_pos', 'x', '0.8'),
    ('thumb_x_neg', 'x', '-0.8'),
]

imgs = []
for name, axis, val in tests:
    out_png = os.path.join(brain_dir, f'{name}.png')
    url = f'http://localhost:8000/test_thumb.html?axis={axis}&val={val}'
    cmd = [
        chrome,
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        '--window-size=300,300',
        f'--screenshot={out_png}',
        '--virtual-time-budget=2000',
        url
    ]
    subprocess.run(cmd, timeout=10)
    if os.path.exists(out_png):
        imgs.append((name, Image.open(out_png)))

# Combine into a single grid
grid = Image.new('RGB', (600, 450), (30, 30, 30))
for idx, (name, im) in enumerate(imgs):
    r = idx // 3
    c = idx % 3
    grid.paste(im.resize((200, 200)), (c * 200, r * 210))

grid_path = os.path.join(brain_dir, 'thumb_grid.jpg')
grid.save(grid_path)
print('Saved thumb_grid.jpg')
