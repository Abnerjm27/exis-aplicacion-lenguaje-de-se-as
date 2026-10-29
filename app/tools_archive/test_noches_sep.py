import subprocess

html = """<!DOCTYPE html><html><head><meta charset="UTF-8">
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
</head><body style="margin:0; background:#0b1120; overflow:hidden;">
<canvas id="c" style="width:500px; height:500px; display:block;"></canvas>
<pre id="p" style="color:white; position:absolute; top:4px; left:4px; font-family:monospace; font-size:11px;"></pre>
<script>
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1120);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true });
renderer.setSize(500, 500);
renderer.outputEncoding = THREE.sRGBEncoding;
scene.add(new THREE.AmbientLight(0xffffff, 1.3));
const dir = new THREE.DirectionalLight(0xffffff, 1.4);
dir.position.set(0.5, 2.0, 2.5);
scene.add(dir);

new THREE.GLTFLoader().load('models/human_player.glb', (gltf) => {
  scene.add(gltf.scene);
  const bones = {};
  gltf.scene.traverse(n => { if (n.isBone) bones[n.name] = n; });

  // Left arm inside (close to chest, resting on right forearm)
  const lA = [0.45, 0.12, 0.82];
  const lF = [1.75, 0.20, 0.25];
  const lH = [-0.10, 0.20, -0.15];

  // Right arm outside (crossing OVER left forearm, hand visible on left arm)
  const rA = [0.40, -0.10, -0.92];
  const rF = [1.90, -0.20, -0.25];
  const rH = [-0.10, -0.20, 0.15];

  bones['LeftArm'].rotation.set(lA[0], lA[1], lA[2]);
  bones['LeftForeArm'].rotation.set(lF[0], lF[1], lF[2]);
  bones['LeftHand'].rotation.set(lH[0], lH[1], lH[2]);

  bones['RightArm'].rotation.set(rA[0], rA[1], rA[2]);
  bones['RightForeArm'].rotation.set(rF[0], rF[1], rF[2]);
  bones['RightHand'].rotation.set(rH[0], rH[1], rH[2]);

  // Relaxed fingers resting on forearm
  ['Right', 'Left'].forEach(side => {
    ['Index', 'Middle', 'Ring', 'Pinky'].forEach(f => {
      for (let i = 1; i <= 3; i++) {
        const b = bones[side + 'Hand' + f + i];
        if (b) b.rotation.set(0.40, 0, 0);
      }
    });
    for (let i = 1; i <= 3; i++) {
      const b = bones[side + 'HandThumb' + i];
      if (b) b.rotation.set(0.15, (side === 'Right' ? 0.3 : -0.3), (side === 'Right' ? 0.5 : -0.5));
    }
  });

  gltf.scene.updateMatrixWorld(true);

  const rHand = new THREE.Vector3();
  const lHand = new THREE.Vector3();
  const chest = new THREE.Vector3();
  bones['RightHand'].getWorldPosition(rHand);
  bones['LeftHand'].getWorldPosition(lHand);
  bones['Spine2'].getWorldPosition(chest);

  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 50);
  camera.position.set(0, 1.45, 1.65);
  camera.lookAt(0, 1.42, 0);
  renderer.render(scene, camera);

  document.getElementById('p').textContent = JSON.stringify({
    rHand: [rHand.x.toFixed(3), rHand.y.toFixed(3), rHand.z.toFixed(3)],
    lHand: [lHand.x.toFixed(3), lHand.y.toFixed(3), lHand.z.toFixed(3)],
    chestZ: chest.z.toFixed(3),
    distBetweenHands: rHand.distanceTo(lHand).toFixed(3)
  }, null, 2);
  document.title = 'READY';
});
</script></body></html>"""

with open('test_noches_separated.html', 'w', encoding='utf-8') as f:
    f.write(html)

chrome = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
out_png = r'C:\Users\abner\.gemini\antigravity\brain\350c463a-68d6-42c1-adf9-9eb3a98a348b\noches_separated3.png'
cmd = [chrome, '--headless=new', '--disable-gpu', '--no-sandbox', '--window-size=500,500', '--virtual-time-budget=2000', f'--screenshot={out_png}', 'http://localhost:8000/test_noches_separated.html']
subprocess.run(cmd, timeout=10)

cmd_dom = [chrome, '--headless=new', '--disable-gpu', '--no-sandbox', '--virtual-time-budget=2000', '--dump-dom', 'http://localhost:8000/test_noches_separated.html']
res = subprocess.run(cmd_dom, capture_output=True, text=True, timeout=10)
s = res.stdout.find('<pre id="p">')
e = res.stdout.find('</pre>')
print(res.stdout[s+12:e])
