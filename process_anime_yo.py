import cv2
import os
import shutil
from PIL import Image

src_video = r'C:\Users\abner\Desktop\exis aplicacion lenguaje de señas\videos\yo.mp4'
anime_dir = r'C:\Users\abner\Desktop\exis aplicacion lenguaje de señas\app\videos\anime'
os.makedirs(anime_dir, exist_ok=True)

dst_body_mp4 = os.path.join(anime_dir, 'YO_body.mp4')
dst_body_webp = os.path.join(anime_dir, 'YO_body.webp')
dst_hand_mp4 = os.path.join(anime_dir, 'YO_hand.mp4')
dst_hand_webp = os.path.join(anime_dir, 'YO_hand.webp')

# 1. Copy body MP4
shutil.copyfile(src_video, dst_body_mp4)
print(f"Copied body MP4 to {dst_body_mp4} ({os.path.getsize(dst_body_mp4)} bytes)")

# 2. Read video
cap = cv2.VideoCapture(src_video)
fps = cap.get(cv2.CAP_PROP_FPS) or 24.0
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
print(f"YO source video: {w}x{h}, {fps} fps, {total_frames} frames")

# Set up hand crop writer
# Crop coordinates: y: 260 to 710, x: 310 to 760 (450x450)
crop_w, crop_h = 450, 450
fourcc = cv2.VideoWriter_fourcc(*'mp4v')
hand_writer = cv2.VideoWriter(dst_hand_mp4, fourcc, fps, (crop_w, crop_h))

body_pil_frames = []
hand_pil_frames = []

step = 2 if total_frames > 60 else 1

frame_idx = 0
while True:
    ret, frame = cap.read()
    if not ret:
        break
    
    # Hand crop
    hand_crop = frame[260:710, 310:760]
    hand_writer.write(hand_crop)

    # WebP frames
    if frame_idx % step == 0:
        rgb_body = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        im_body = Image.fromarray(rgb_body).resize((640, 360), Image.Resampling.LANCZOS)
        body_pil_frames.append(im_body)

        rgb_hand = cv2.cvtColor(hand_crop, cv2.COLOR_BGR2RGB)
        im_hand = Image.fromarray(rgb_hand).resize((360, 360), Image.Resampling.LANCZOS)
        hand_pil_frames.append(im_hand)

    frame_idx += 1

cap.release()
hand_writer.release()
print(f"Hand MP4 created: {dst_hand_mp4} ({os.path.getsize(dst_hand_mp4)} bytes)")

# Save WebP fallbacks
duration_ms = int(1000 / (fps / step))
if body_pil_frames:
    body_pil_frames[0].save(
        dst_body_webp,
        save_all=True,
        append_images=body_pil_frames[1:],
        duration=duration_ms,
        loop=0,
        quality=75,
        method=4
    )
    print(f"Body WebP created: {dst_body_webp} ({os.path.getsize(dst_body_webp)} bytes)")

if hand_pil_frames:
    hand_pil_frames[0].save(
        dst_hand_webp,
        save_all=True,
        append_images=hand_pil_frames[1:],
        duration=duration_ms,
        loop=0,
        quality=75,
        method=4
    )
    print(f"Hand WebP created: {dst_hand_webp} ({os.path.getsize(dst_hand_webp)} bytes)")

print("All YO anime assets generated successfully!")
