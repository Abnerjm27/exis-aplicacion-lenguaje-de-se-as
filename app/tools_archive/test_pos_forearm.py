import subprocess

html = """<!DOCTYPE html><html><head><meta charset="UTF-8">
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
</head><body><pre id="p"></pre><script>
new THREE.GLTFLoader().load('models/human_player.glb', (gltf) => {
  const bones = {};
  gltf.scene.traverse(n => { if (n.isBone) bones[n.name] = n; });

  const rA = bones['RightArm'];
  const rF = bones['RightForeArm'];
  const rH = bones['RightHand'];

  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 50);
  camera.position.set(0, 1.45, 1.65);
  camera.lookAt(0, 1.42, 0);
  camera.updateMatrixWorld();

  const toScreen = (v) => {
    const p = v.clone().project(camera);
    return {
      x: ((p.x + 1)/2 * 500).toFixed(1),
      y: ((-p.y + 1)/2 * 500).toFixed(1),
      raw: [v.x.toFixed(3), v.y.toFixed(3), v.z.toFixed(3)]
    };
  };

  const list = [
    { a: [0.60, 0.20, -0.60], f: [1.60, -0.40, -0.10], h: [-0.15, 0.10, -0.30], desc: "pos forearm 1" },
    { a: [0.50, 0.10, -0.70], f: [1.50, -0.30, -0.20], h: [-0.15, 0.10, -0.30], desc: "pos forearm 2" },
    { a: [0.40, 0.0, -0.80], f: [1.40, -0.20, -0.30], h: [-0.15, 0.10, -0.30], desc: "pos forearm 3" },
    { a: [0.55, 0.15, -0.50], f: [1.70, -0.35, -0.15], h: [-0.15, 0.10, -0.30], desc: "pos forearm 4" },
  ];

  const res = [];
  list.forEach(item => {
    rA.rotation.set(item.a[0], item.a[1], item.a[2]);
    rF.rotation.set(item.f[0], item.f[1], item.f[2]);
    rH.rotation.set(item.h[0], item.h[1], item.h[2]);
    gltf.scene.updateMatrixWorld(true);

    const hand = new THREE.Vector3();
    const tip = new THREE.Vector3();
    rH.getWorldPosition(hand);
    bones['RightHandMiddle3'].getWorldPosition(tip);

    res.push({
      desc: item.desc,
      hand: toScreen(hand),
      tip: toScreen(tip)
    });
  });

  document.getElementById('p').textContent = JSON.stringify(res, null, 2);
  document.title = 'READY';
});
</script></body></html>"""

with open('test_pos_forearm.html', 'w', encoding='utf-8') as f:
    f.write(html)

chrome = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
cmd = [chrome, '--headless=new', '--disable-gpu', '--no-sandbox', '--virtual-time-budget=2000', '--dump-dom', 'http://localhost:8000/test_pos_forearm.html']
res = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
s = res.stdout.find('<pre id="p">')
e = res.stdout.find('</pre>')
print(res.stdout[s+12:e])
