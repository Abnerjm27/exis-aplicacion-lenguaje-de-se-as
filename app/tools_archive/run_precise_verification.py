import subprocess, os
from PIL import Image, ImageDraw, ImageFont

chrome = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
brain_dir = r'C:\Users\abner\.gemini\antigravity\brain\adc682e4-fa3e-4853-a6ce-7c2d4c68b532'
dataset_dir = r'C:\Users\abner\Desktop\exis aplicacion lenguaje de señas\app\dataset_samples'

signs = ['HOLA', 'YO', 'BUENOS', 'DIAS', 'NOCHES', 'NOMBRE', 'A', 'B', 'C', 'L', 'V']

print("=== CAPTURING PRECISE POSES AND METRICS ===")
metrics_summary = {}

for sign in signs:
    for view in ['body', 'hand']:
        out_png = os.path.join(brain_dir, f'avatar_{sign}_{view}.png')
        url = f'http://localhost:8000/test_all_poses.html?sign={sign}&view={view}'
        cmd = [
            chrome,
            '--headless=new',
            '--disable-gpu',
            '--no-sandbox',
            '--window-size=500,500',
            '--virtual-time-budget=2000',
            f'--screenshot={out_png}',
            url
        ]
        res = subprocess.run(cmd, timeout=12)

    # Get metrics via dump-dom
    cmd_dom = [
        chrome,
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        '--virtual-time-budget=2000',
        '--dump-dom',
        f'http://localhost:8000/test_all_poses.html?sign={sign}&view=body'
    ]
    res_d = subprocess.run(cmd_dom, capture_output=True, text=True, encoding='utf-8', errors='ignore', timeout=10)
    s = res_d.stdout.find('<div id="metrics"')
    e = res_d.stdout.find('</div>', s)
    metric = res_d.stdout[s:e+6] if s != -1 else 'N/A'
    clean = metric.split('>')[-2].replace('</div', '').strip() if '>' in metric else 'N/A'
    metrics_summary[sign] = clean
    print(f"  {sign:8s}: {clean}")

# Build Composites
font_title = ImageFont.truetype('arialbd.ttf', 16)
font_label = ImageFont.truetype('arial.ttf', 13)
font_metric = ImageFont.truetype('arial.ttf', 11)

col_w, col_h = 320, 320
card_w = col_w * 3 + 40
card_h = col_h + 80

def build_composite(subset, filename, title_text):
    total_w = card_w
    total_h = len(subset) * card_h + 70
    sheet = Image.new('RGB', (total_w, total_h), (15, 23, 42))
    draw = ImageDraw.Draw(sheet)

    # Header
    draw.rectangle([(0, 0), (total_w, 60)], fill=(10, 15, 30))
    draw.text((20, 18), title_text, font=font_title, fill=(248, 250, 252))

    for idx, s in enumerate(subset):
        y_offset = 70 + idx * card_h
        
        # Row card bg
        draw.rounded_rectangle([(10, y_offset), (total_w - 10, y_offset + card_h - 15)], radius=10, fill=(30, 41, 59), outline=(51, 65, 85))

        # Sign Title and Metric
        draw.text((25, y_offset + 12), f'Seña / Letra: {s}', font=font_title, fill=(56, 189, 248))
        draw.text((220, y_offset + 14), f'[{metrics_summary.get(s, "")}]', font=font_metric, fill=(52, 211, 153))

        # Column labels
        draw.text((25, y_offset + 38), '1. Foto Real (Dataset LSC70)', font=font_label, fill=(148, 163, 184))
        draw.text((25 + col_w + 10, y_offset + 38), '2. Avatar 3D (Cuerpo Entero)', font=font_label, fill=(148, 163, 184))
        draw.text((25 + (col_w + 10) * 2, y_offset + 38), '3. Avatar 3D (Primer Plano Mano)', font=font_label, fill=(148, 163, 184))

        # Images
        p_real = os.path.join(dataset_dir, f'{s}.jpg')
        p_body = os.path.join(brain_dir, f'avatar_{s}_body.png')
        p_hand = os.path.join(brain_dir, f'avatar_{s}_hand.png')

        im_y = y_offset + 60
        if os.path.exists(p_real):
            im_r = Image.open(p_real).resize((col_w - 10, col_h - 80), Image.Resampling.LANCZOS)
            sheet.paste(im_r, (25, im_y))

        if os.path.exists(p_body):
            im_b = Image.open(p_body).resize((col_w - 10, col_h - 80), Image.Resampling.LANCZOS)
            sheet.paste(im_b, (25 + col_w + 10, im_y))

        if os.path.exists(p_hand):
            im_h = Image.open(p_hand).resize((col_w - 10, col_h - 80), Image.Resampling.LANCZOS)
            sheet.paste(im_h, (25 + (col_w + 10) * 2, im_y))

    out_file = os.path.join(brain_dir, filename)
    sheet.save(out_file, quality=92)
    print('Saved composite:', out_file)

build_composite(['HOLA', 'YO', 'BUENOS', 'DIAS', 'NOCHES', 'NOMBRE'], 'comparison_words.jpg', 'EXIS · Calibración Avatar 3D vs. LSC70 Real (Palabras)')
build_composite(['A', 'B', 'C', 'L', 'V'], 'comparison_letters.jpg', 'EXIS · Calibración Avatar 3D vs. LSC70 Real (Alfabeto Dactilológico)')
print("=== VERIFICATION SCRIPT FINISHED ===")
