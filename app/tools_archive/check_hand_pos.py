import subprocess

html = """<!DOCTYPE html><html><head><meta charset="UTF-8">
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
</head><body><pre id="p"></pre><script>
new THREE.GLTFLoader().load('models/human_player.glb', (gltf) => {
  const bones = {};
  gltf.scene.traverse(n => { if (n.isBone) bones[n.name] = n; });

  bones['RightArm'].rotation.set(0.40, 0.30, -0.90);
  bones['RightForeArm'].rotation.set(2.10, -0.60, -0.30);
  bones['RightHand'].rotation.set(-0.2, 0.1, 0.15);

  gltf.scene.updateMatrixWorld(true);

  const report = {};
  ['RightHand', 'RightHandIndex1', 'RightHandIndex3', 'RightHandMiddle3'].forEach(name => {
    const v = new THREE.Vector3();
    if (bones[name]) {
      bones[name].getWorldPosition(v);
      report[name] = [v.x.toFixed(3), v.y.toFixed(3), v.z.toFixed(3)];
    }
  });

  document.getElementById('p').textContent = JSON.stringify(report, null, 2);
  document.title = 'READY';
});
</script></body></html>"""

with open(r'C:\Users\abner\Desktop\exis aplicacion lenguaje de señas\app\check_hand_pos.html', 'w', encoding='utf-8') as f:
    f.write(html)

chrome = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
cmd = [chrome, '--headless=new', '--disable-gpu', '--no-sandbox', '--virtual-time-budget=2000', '--dump-dom', 'http://localhost:8000/check_hand_pos.html']
res = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
s = res.stdout.find('<pre id="p">')
e = res.stdout.find('</pre>')
if s != -1 and e != -1:
    print(res.stdout[s+12:e])
