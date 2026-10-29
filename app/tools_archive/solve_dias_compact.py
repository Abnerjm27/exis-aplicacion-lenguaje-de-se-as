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

  const results = [];

  // We want:
  // rHand.x in [-0.42, -0.28]
  // rHand.y in [1.36, 1.48]
  // rTip.y in [1.50, 1.62] (below head top 1.75, head 1.64)
  // rTip.x in [-0.48, -0.32]
  // rHand.z in [0.15, 0.35] (hands forward)
  // rTip.z close to rHand.z (palm facing front)

  for (let ax = 0.0; ax <= 0.50; ax += 0.05) {
    for (let ay = -0.60; ay <= 0.10; ay += 0.08) {
      for (let az = -0.50; az <= 0.10; az += 0.08) {
        for (let fx = -1.80; fx <= -0.80; fx += 0.10) {
          for (let fy = -0.60; fy <= 0.40; fy += 0.12) {
            for (let fz = -0.40; fz <= 0.60; fz += 0.12) {
              rA.rotation.set(ax, ay, az);
              rF.rotation.set(fx, fy, fz);
              rH.rotation.set(0.15, -0.15, 0.0);
              gltf.scene.updateMatrixWorld(true);

              const hand = new THREE.Vector3();
              const tip = new THREE.Vector3();
              rH.getWorldPosition(hand);
              bones['RightHandMiddle3'].getWorldPosition(tip);

              if (hand.x >= -0.42 && hand.x <= -0.28 &&
                  hand.y >= 1.36 && hand.y <= 1.48 &&
                  tip.y >= 1.50 && tip.y <= 1.62 &&
                  tip.x >= -0.50 && tip.x <= -0.32 &&
                  hand.z >= 0.15 && hand.z <= 0.35 &&
                  Math.abs(tip.z - hand.z) < 0.12) {
                
                results.push({
                  score: -Math.abs(hand.x + 0.35) - Math.abs(hand.y - 1.42) - Math.abs(tip.y - 1.55),
                  a: [ax.toFixed(2), ay.toFixed(2), az.toFixed(2)],
                  f: [fx.toFixed(2), fy.toFixed(2), fz.toFixed(2)],
                  h: [hand.x.toFixed(3), hand.y.toFixed(3), hand.z.toFixed(3)],
                  t: [tip.x.toFixed(3), tip.y.toFixed(3), tip.z.toFixed(3)]
                });
              }
            }
          }
        }
      }
    }
  }

  results.sort((a, b) => b.score - a.score);
  document.getElementById('p').textContent = JSON.stringify(results.slice(0, 10), null, 2);
  document.title = 'READY';
});
</script></body></html>"""

with open('find_dias_compact.html', 'w', encoding='utf-8') as f:
    f.write(html)

chrome = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
cmd = [chrome, '--headless=new', '--disable-gpu', '--no-sandbox', '--virtual-time-budget=6000', '--dump-dom', 'http://localhost:8000/find_dias_compact.html']
res = subprocess.run(cmd, capture_output=True, text=True, timeout=20)
s = res.stdout.find('<pre id="p">')
e = res.stdout.find('</pre>')
print(res.stdout[s+12:e])
