import subprocess, os

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

new THREE.GLTFLoader().load('models/human_player.glb', (gltf) => {
  scene.add(gltf.scene);
  const bones = {};
  gltf.scene.traverse(n => { if (n.isBone) bones[n.name] = n; });

  // Natural resting left arm
  bones['LeftArm'].rotation.set(1.15, 0.0, -0.25);
  bones['LeftForeArm'].rotation.set(-0.15, 0.0, 0.0);

  // Solved Letter Pose with wrist rotated upwards
  bones['RightArm'].rotation.set(0.40, 0.30, -0.90);
  bones['RightForeArm'].rotation.set(2.10, -0.60, -0.30);
  bones['RightHand'].rotation.set(-0.10, 0.10, -1.15);

  // Extend 4 fingers for B, fingers close together
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
  const middlePos = new THREE.Vector3();
  bones['RightHand'].getWorldPosition(rHandPos);
  bones['RightHandMiddle2'].getWorldPosition(middlePos);

  const centerHand = rHandPos.clone().lerp(middlePos, 0.5);

  const p = new URLSearchParams(window.location.search);
  const view = p.get('view') || 'body';
  const camera = new THREE.PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.1, 50);

  if (view === 'hand') {
    camera.position.set(centerHand.x, centerHand.y, centerHand.z + 0.35);
    camera.lookAt(centerHand.x, centerHand.y, centerHand.z);
  } else {
    camera.position.set(0, 1.35, 1.9);
    camera.lookAt(0, 1.30, 0);
  }

  renderer.render(scene, camera);
  document.title = 'READY';
});
</script></body></html>"""

with open(r'C:\Users\abner\Desktop\exis aplicacion lenguaje de señas\app\test_chest_b.html', 'w', encoding='utf-8') as f:
    f.write(html)

for view in ['body', 'hand']:
    out_png = os.path.join(brain_dir, f'test_b_upright_{view}.png')
    url = f'http://localhost:8000/test_chest_b.html?view={view}'
    cmd = [chrome, '--headless=new', '--disable-gpu', '--no-sandbox', '--window-size=500,500', '--virtual-time-budget=1500', f'--screenshot={out_png}', url]
    subprocess.run(cmd, timeout=10)
    print(f'Saved test_b_upright_{view}.png: {os.path.exists(out_png)}')
