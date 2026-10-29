import subprocess

html = """<!DOCTYPE html><html><head><meta charset="UTF-8">
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
</head><body><pre id="p"></pre><script>
new THREE.GLTFLoader().load('models/human_player.glb', (gltf) => {
  const bones = {};
  gltf.scene.traverse(n => { if (n.isBone) bones[n.name] = n; });

  bones['RightArm'].rotation.set(-0.20, -0.40, -0.80);
  bones['RightForeArm'].rotation.set(-0.85, -0.30, 0.30);
  bones['RightHand'].rotation.set(0.15, -0.15, 0.0);

  bones['LeftArm'].rotation.set(-0.20, 0.40, 0.80);
  bones['LeftForeArm'].rotation.set(-0.85, 0.30, -0.30);
  bones['LeftHand'].rotation.set(0.15, 0.15, 0.0);

  gltf.scene.updateMatrixWorld(true);

  const rHand = new THREE.Vector3();
  const rTip = new THREE.Vector3();
  bones['RightHand'].getWorldPosition(rHand);
  bones['RightHandMiddle3'].getWorldPosition(rTip);

  document.getElementById('p').textContent = JSON.stringify({
    rHand: [rHand.x.toFixed(3), rHand.y.toFixed(3), rHand.z.toFixed(3)],
    rTip: [rTip.x.toFixed(3), rTip.y.toFixed(3), rTip.z.toFixed(3)]
  }, null, 2);
  document.title = 'READY';
});
</script></body></html>"""

with open('check_dias_orig.html', 'w', encoding='utf-8') as f:
    f.write(html)

chrome = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
cmd = [chrome, '--headless=new', '--disable-gpu', '--no-sandbox', '--virtual-time-budget=2000', '--dump-dom', 'http://localhost:8000/check_dias_orig.html']
res = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
s = res.stdout.find('<pre id="p">')
e = res.stdout.find('</pre>')
print(res.stdout[s+12:e])
