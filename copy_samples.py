import os
import shutil

base_w = r"C:\Users\abner\Desktop\exis aplicacion lenguaje de señas\LSC70\LSC70\LSC70W\Per01"
base_an = r"C:\Users\abner\Desktop\exis aplicacion lenguaje de señas\LSC70\LSC70\LSC70AN\Per01"
target = r"C:\Users\abner\Desktop\exis aplicacion lenguaje de señas\app\dataset_samples"

os.makedirs(target, exist_ok=True)

# Words
words = {
    "HOLA": os.path.join(base_w, "HOLA", "Per01_HOLA_4.jpg"),
    "BUENOS": os.path.join(base_w, "BUENAS", "Per01_BUENOS_4.jpg"),
    "YO": os.path.join(base_w, "YO", "Per01_YO_4.jpg"),
    "DIAS": os.path.join(base_w, "DIAS", "Per01_DIAS_4.jpg"),
    "NOCHES": os.path.join(base_w, "NOCHES", "Per01_NOCHES_4.jpg"),
    "NOMBRE": os.path.join(base_w, "NOMBRE", "Per01_NOMBRE_4.jpg"),
}

for name, src in words.items():
    if os.path.exists(src):
        dst = os.path.join(target, f"{name}.jpg")
        shutil.copy2(src, dst)
        print(f"Copied {name}: {src} -> {dst}")
    else:
        print(f"Not found: {src}")

# Letters
for letter in "ABCDEFGHIJKLMNOPQRSTUVWXYZ":
    letter_dir = os.path.join(base_an, letter)
    if os.path.exists(letter_dir):
        # find files
        files = [f for f in os.listdir(letter_dir) if f.endswith(".jpg")]
        if files:
            # pick middle or frame 4
            chosen = next((f for f in files if "_4" in f), files[len(files)//2])
            src = os.path.join(letter_dir, chosen)
            dst = os.path.join(target, f"{letter}.jpg")
            shutil.copy2(src, dst)
            print(f"Copied Letter {letter}: {chosen}")

print("Total images in target:", len(os.listdir(target)))
