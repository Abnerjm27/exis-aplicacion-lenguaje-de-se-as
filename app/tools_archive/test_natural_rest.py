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

  // Natural resting pose for both arms:
  bones['LeftArm'].rotation.set(1.15, 0.0, -0.25);
  bones['LeftForeArm'].rotation.set(-0.15, 0.0, 0.0);
  bones['LeftHand'].rotation.set(0.0, 0.0, 0.0);

  bones['RightArm'].rotation.set(1.15, 0.0, 0.25);
  bones['RightForeArm'].rotation.set(-0.15, 0.0, 0.0);
  bones['RightHand'].rotation.set(0.0, 0.0, 0.0);

  const camera = new THREE.PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.1, 50);
  camera.position.set(0, 1.35, 1.9);
  camera.lookAt(0, 1.30, 0);

  renderer.render(scene, camera);
  document.title = 'READY';
});
</script></body></html>"""

with open(r'C:\Users\abner\Desktop\exis aplicacion lenguaje de señas\app\test_natural_rest.html', 'w', encoding='utf-8') as f:
    f.write(html)

out_png = os.path.join(brain_dir, 'natural_rest_arms.png')
cmd = [chrome, '--headless=new', '--disable-gpu', '--no-sandbox', '--window-size=500,500', '--virtual-time-budget=1500', f'--screenshot={out_png}', 'http://localhost:8000/test_natural_rest.html']
subprocess.run(cmd, timeout=10)
print('Saved natural_rest_arms.png:', os.path.exists(out_png))
