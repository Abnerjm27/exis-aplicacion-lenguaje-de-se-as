import os
from PIL import Image, ImageDraw, ImageFont

brain_dir = r'C:\Users\abner\.gemini\antigravity\brain\adc682e4-fa3e-4853-a6ce-7c2d4c68b532'
dataset_dir = r'C:\Users\abner\Desktop\exis aplicacion lenguaje de señas\app\dataset_samples'

signs = ['HOLA', 'YO', 'BUENOS', 'DIAS', 'NOCHES', 'NOMBRE', 'A', 'B', 'C', 'L', 'V']

font_title = ImageFont.truetype('arialbd.ttf', 16)
font_label = ImageFont.truetype('arial.ttf', 13)

# Create a comparison card for each sign: 3 columns:
# Col 1: Dataset Real Photo
# Col 2: Avatar 3D Torso
# Col 3: Avatar 3D Hand
col_w, col_h = 320, 320
card_w = col_w * 3 + 40
card_h = col_h + 80

# We can group them into 2 composite sheets:
# Sheet 1: Words (HOLA, YO, BUENOS, DIAS, NOCHES, NOMBRE) -> 6 rows
# Sheet 2: Letters (A, B, C, L, V) -> 5 rows

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

        # Sign Title
        draw.text((25, y_offset + 12), f'Seña / Letra: {s}', font=font_title, fill=(56, 189, 248))

        # Column labels
        draw.text((25, y_offset + 38), '1. Foto Real (LSC70)', font=font_label, fill=(148, 163, 184))
        draw.text((25 + col_w + 10, y_offset + 38), '2. Avatar 3D (Torso)', font=font_label, fill=(148, 163, 184))
        draw.text((25 + (col_w + 10) * 2, y_offset + 38), '3. Avatar 3D (Mano)', font=font_label, fill=(148, 163, 184))

        # Images
        p_real = os.path.join(dataset_dir, f'{s}.jpg')
        p_torso = os.path.join(brain_dir, f'avatar_{s}_torso.png')
        p_hand = os.path.join(brain_dir, f'avatar_{s}_hand.png')

        im_y = y_offset + 60
        if os.path.exists(p_real):
            im_r = Image.open(p_real).resize((col_w - 10, col_h - 80), Image.Resampling.LANCZOS)
            sheet.paste(im_r, (25, im_y))

        if os.path.exists(p_torso):
            im_t = Image.open(p_torso).resize((col_w - 10, col_h - 80), Image.Resampling.LANCZOS)
            sheet.paste(im_t, (25 + col_w + 10, im_y))

        if os.path.exists(p_hand):
            im_h = Image.open(p_hand).resize((col_w - 10, col_h - 80), Image.Resampling.LANCZOS)
            sheet.paste(im_h, (25 + (col_w + 10) * 2, im_y))

    out_file = os.path.join(brain_dir, filename)
    sheet.save(out_file, quality=92)
    print('Saved composite:', out_file)

build_composite(['HOLA', 'YO', 'BUENOS', 'DIAS', 'NOCHES', 'NOMBRE'], 'comparison_words.jpg', 'EXIS · Calibración Avatar 3D vs. LSC70 Real (Palabras)')
build_composite(['A', 'B', 'C', 'L', 'V'], 'comparison_letters.jpg', 'EXIS · Calibración Avatar 3D vs. LSC70 Real (Alfabeto Dactilológico)')
