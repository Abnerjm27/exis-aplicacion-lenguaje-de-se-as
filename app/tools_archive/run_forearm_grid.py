import subprocess, os
from PIL import Image, ImageDraw, ImageFont

chrome = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
brain_dir = r'C:\Users\abner\.gemini\antigravity\brain\adc682e4-fa3e-4853-a6ce-7c2d4c68b532'

tests = [
    ('fore_x_pos', 'x', '1.2'),
    ('fore_x_neg', 'x', '-1.2'),
    ('fore_y_pos', 'y', '1.2'),
    ('fore_y_neg', 'y', '-1.2'),
    ('fore_z_pos', 'z', '1.2'),
    ('fore_z_neg', 'z', '-1.2'),
]

imgs = []
for name, axis, val in tests:
    out_png = os.path.join(brain_dir, f'{name}.png')
    url = f'http://localhost:8000/test_forearm.html?axis={axis}&val={val}'
    cmd = [
        chrome,
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        '--window-size=350,350',
        f'--screenshot={out_png}',
        '--virtual-time-budget=2000',
        url
    ]
    subprocess.run(cmd, timeout=12)
    if os.path.exists(out_png):
        imgs.append((name, Image.open(out_png)))

grid = Image.new('RGB', (1050, 700), (20, 20, 30))
draw = ImageDraw.Draw(grid)
font = ImageFont.truetype('arialbd.ttf', 14)

for idx, (name, im) in enumerate(imgs):
    r = idx // 3
    c = idx % 3
    x = c * 350
    y = r * 350
    grid.paste(im, (x, y))
    draw.text((x + 10, y + 10), name, font=font, fill=(56, 189, 248))

grid_path = os.path.join(brain_dir, 'forearm_grid.jpg')
grid.save(grid_path, quality=90)
print('Saved forearm_grid.jpg')
