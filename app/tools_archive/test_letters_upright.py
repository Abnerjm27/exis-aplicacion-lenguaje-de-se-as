import subprocess, os
from PIL import Image

chrome = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
brain_dir = r'C:\Users\abner\.gemini\antigravity\brain\adc682e4-fa3e-4853-a6ce-7c2d4c68b532'

html = """<!DOCTYPE html><html><head><meta charset="UTF-8">
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
</head><body style="margin:0; background:#0b1120; overflow:hidden;">
<canvas id="c" style="width:100vw; height:100vh; display:block;"></canvas>
<script>
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1120);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;

scene.add(new THREE.AmbientLight(0xffffff, 1.3));
const dir = new THREE.DirectionalLight(0xffffff, 1.4);
dir.position.set(0.5, 2.0, 2.5);
scene.add(dir);

const p = new URLSearchParams(window.location.search);
const raX = parseFloat(p.get('rax') || '0.2');
const raZ = parseFloat(p.get('raz') || '-1.25');
const rfX = parseFloat(p.get('rfx') || '-1.65');
const rfY = parseFloat(p.get('rfy') || '0.7');

new THREE.GLTFLoader().load('models/human_player.glb', (gltf) => {
  scene.add(gltf.scene);
  const bones = {};
  gltf.scene.traverse(n => { if (n.isBone) bones[n.name] = n; });

  // Natural resting left arm
  bones['LeftArm'].rotation.set(1.15, 0.0, -0.25);
  bones['LeftForeArm'].rotation.set(-0.15, 0.0, 0.0);

  // Right arm upright presentation
  bones['RightArm'].rotation.set(raX, 0.0, raZ);
  bones['RightForeArm'].rotation.set(rfX, rfY, 0.1);
  bones['RightHand'].rotation.set(0.0, 0.0, 0.0);

  // Extend 4 fingers (letter B)
  ['Index', 'Middle', 'Ring', 'Pinky'].forEach(f => {
    for (let i = 1; i <= 3; i++) {
      const b = bones['RightHand' + f + i];
      if (b) b.rotation.x = 0;
    }
  });
  for (let i = 1; i <= 3; i++) {
    const b = bones['RightHandThumb' + i];
    if (b) b.rotation.set(0.1, 0.25, 0.95);
  }

  gltf.scene.updateMatrixWorld(true);

  const rHandPos = new THREE.Vector3();
  bones['RightHand'].getWorldPosition(rHandPos);

  const view = p.get('view') || 'body';
  const camera = new THREE.PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.1, 50);

  if (view === 'hand') {
    camera.position.set(rHandPos.x, rHandPos.y + 0.05, rHandPos.z + 0.35);
    camera.lookAt(rHandPos.x, rHandPos.y + 0.05, rHandPos.z);
  } else {
    camera.position.set(0, 1.35, 1.9);
    camera.lookAt(0, 1.30, 0);
  }

  renderer.render(scene, camera);
  document.title = 'READY';
});
</script></body></html>"""

with open(r'C:\Users\abner\Desktop\exis aplicacion lenguaje de señas\app\test_letters_upright.html', 'w', encoding='utf-8') as f:
    f.write(html)

tests = [
    ('up_1', '0.2', '-1.25', '-1.5', '0.6'),
    ('up_2', '0.3', '-1.20', '-1.65', '0.7'),
    ('up_3', '0.35', '-1.15', '-1.75', '0.75'),
    ('up_4', '0.25', '-1.10', '-1.60', '0.8'),
]

imgs = []
for name, rax, raz, rfx, rfy in tests:
    for view in ['body', 'hand']:
        out_png = os.path.join(brain_dir, f'test_{name}_{view}.png')
        url = f'http://localhost:8000/test_letters_upright.html?rax={rax}&raz={raz}&rfx={rfx}&rfy={rfy}&view={view}'
        cmd = [chrome, '--headless=new', '--disable-gpu', '--no-sandbox', '--window-size=350,350', '--virtual-time-budget=1500', f'--screenshot={out_png}', url]
        subprocess.run(cmd, timeout=8)
        if os.path.exists(out_png):
            imgs.append((f"{name}_{view}", Image.open(out_png)))

grid = Image.new('RGB', (700, 700), (20, 20, 30))
for idx, (name, im) in enumerate(imgs[:8]):
    r = idx // 2
    c = idx % 2
    grid.paste(im, (c * 350, r * 175))

grid_path = os.path.join(brain_dir, 'upright_arm_grid.jpg')
grid.save(grid_path, quality=90)
print('Saved upright_arm_grid.jpg')
