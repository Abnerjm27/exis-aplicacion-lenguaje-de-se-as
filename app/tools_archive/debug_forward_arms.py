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

  const tests = [
    { a: [0.50, 0.0, 0.0], f: [-1.40, 0.0, 0.0], h: [0, 0, 0], desc: "arm pitch forward 0.5, elbow -1.4" },
    { a: [0.50, 0.0, -0.30], f: [-1.40, 0.0, 0.0], h: [0, 0, 0], desc: "add arm z -0.3" },
    { a: [0.50, -0.30, -0.30], f: [-1.40, 0.0, 0.0], h: [0, 0, 0], desc: "add arm y -0.3" },
    { a: [0.50, -0.30, -0.30], f: [-1.40, 0.0, 0.30], h: [0, 0, 0], desc: "add fore z 0.3" },
    { a: [0.50, -0.30, -0.30], f: [-1.40, -0.30, 0.30], h: [0, 0, 0], desc: "add fore y -0.3" },
    { a: [0.60, -0.20, -0.25], f: [-1.30, -0.15, 0.20], h: [0.10, -0.10, 0.0], desc: "balanced 1" },
    { a: [0.45, -0.25, -0.35], f: [-1.20, -0.20, 0.25], h: [0.10, -0.10, 0.0], desc: "balanced 2" },
  ];

  const log = [];
  tests.forEach(t => {
    rA.rotation.set(t.a[0], t.a[1], t.a[2]);
    rF.rotation.set(t.f[0], t.f[1], t.f[2]);
    rH.rotation.set(t.h[0], t.h[1], t.h[2]);
    gltf.scene.updateMatrixWorld(true);

    const hand = new THREE.Vector3();
    const tip = new THREE.Vector3();
    rH.getWorldPosition(hand);
    bones['RightHandMiddle3'].getWorldPosition(tip);

    log.push({
      desc: t.desc,
      a: t.a, f: t.f, h: t.h,
      hand: [hand.x.toFixed(3), hand.y.toFixed(3), hand.z.toFixed(3)],
      tip: [tip.x.toFixed(3), tip.y.toFixed(3), tip.z.toFixed(3)]
    });
  });

  document.getElementById('p').textContent = JSON.stringify(log, null, 2);
  document.title = 'READY';
});
</script></body></html>"""

with open('debug_forward_arms.html', 'w', encoding='utf-8') as f:
    f.write(html)

chrome = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
cmd = [chrome, '--headless=new', '--disable-gpu', '--no-sandbox', '--virtual-time-budget=2000', '--dump-dom', 'http://localhost:8000/debug_forward_arms.html']
res = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
s = res.stdout.find('<pre id="p">')
e = res.stdout.find('</pre>')
print(res.stdout[s+12:e])
