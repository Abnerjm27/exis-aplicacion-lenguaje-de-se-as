import subprocess

html = """<!DOCTYPE html><html><head><meta charset="UTF-8">
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
</head><body><pre id="p"></pre><script>
new THREE.GLTFLoader().load('models/human_player.glb', (gltf) => {
  const bones = {};
  gltf.scene.traverse(n => { if (n.isBone) bones[n.name] = n; });
  const report = {};
  ['LeftArm', 'RightArm', 'LeftForeArm', 'RightForeArm', 'LeftHand', 'RightHand'].forEach(name => {
    const b = bones[name];
    if (b) {
      report[name] = {
        rot: [b.rotation.x.toFixed(4), b.rotation.y.toFixed(4), b.rotation.z.toFixed(4)],
        order: b.rotation.order,
        quat: [b.quaternion.x.toFixed(4), b.quaternion.y.toFixed(4), b.quaternion.z.toFixed(4), b.quaternion.w.toFixed(4)]
      };
    }
  });
  document.getElementById('p').textContent = JSON.stringify(report, null, 2);
  document.title = 'READY';
});
</script></body></html>"""

with open(r'C:\Users\abner\Desktop\exis aplicacion lenguaje de señas\app\check_eulers.html', 'w', encoding='utf-8') as f:
    f.write(html)

chrome = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
cmd = [
    chrome,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--virtual-time-budget=2000',
    '--dump-dom',
    'http://localhost:8000/check_eulers.html'
]
res = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
s = res.stdout.find('<pre id="p">')
e = res.stdout.find('</pre>')
if s != -1 and e != -1:
    print(res.stdout[s+12:e])
